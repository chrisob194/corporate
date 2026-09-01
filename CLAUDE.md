# corporate

Personal Claude Code plugin marketplace. Ships one plugin, `corporate`: a
virtual dev team — agents named after the roles they play (product owner,
technical architect, planner, builder, reviewer, QA) plus the commands, skills
and hooks they use.

Not related to any employer. Personal tooling.

## Language

**Everything written in this repo is in English.** Files, frontmatter,
descriptions, comments, docs, commit messages, PR text, output of commands and
skills — all English, no exceptions.

## Layout

```
.claude-plugin/marketplace.json   # marketplace manifest, lists plugins by source path
plugins/corporate/
  .claude-plugin/plugin.json      # plugin manifest (name, version, author)
  commands/*.md                   # slash commands -> /corporate:<name>
  agents/*.md                     # subagents, one file per role
  reference/*.md                  # shared reference docs commands point agents at
  skills/<name>/SKILL.md          # skills, one dir per skill
  hooks/hooks.json + hooks/*.sh   # hook config and bash scripts (none shipped yet)
  .mcp.json                       # MCP servers bundled with the plugin
scripts/validate.ts               # bun: validates manifests + frontmatter
docs/authoring.md                 # frontmatter reference per component type
```

Shipped: the six role agents and the pipeline commands (`brief`, `design`,
`plan`, `build`, `review`, `qa`, `ship`), four reference docs
(`plan-format.md`, `issue-store.md`, `worktree-lifecycle.md`,
`stack-readiness.md`), ten stack playbook skills
(`typescript-playbook`, `typescript-mcp-playbook`, `oauth-playbook`,
`mcp-oauth-playbook`, `sqlite-playbook`, `crypto-playbook` and one per Bun doc
area:
`bun-runtime-playbook`, `bun-pm-playbook`, `bun-bundler-playbook`,
`bun-test-playbook`), the
`corporate-pipeline` router skill that makes the
main session aware of the stage order, and the `whiteboard` skill — the
divergent conversation before `brief`, main-session only, writes nothing.

Also shipped: the HR department — `hr-report` (any role files a record when the
job does not fit the role it was hired for), `hr-manager` (clusters the records
and drafts issues) and `/corporate:hr` (files them, one confirmation each). One
hook, `hr-backlog.sh`, mentions unfiled records at session start.

## Conventions

- **Names**: agents are job titles, kebab-case (`product-owner`, `qa-engineer`).
  The agent filename must equal its frontmatter `name`.
- **Descriptions** decide whether Claude picks the component. Write them as
  "Use when …" triggers, not as summaries of the body.
- **Nested dispatch is allowlisted.** An agent that delegates declares
  `Agent(<type>)`, never bare `Agent` — bare would let a deliberately
  write-less agent (`reviewer`) spawn one that writes, silently voiding the
  invariant its `tools` list exists to enforce. Search-heavy work goes to a
  pinned cheap agent (`scout`), never to the session model; the caller opens
  what `scout` cites before asserting anything about it.
- **`Skill` implies `WebFetch`.** Every playbook skill makes an upstream doc
  tree the authority and forbids answering from memory. An agent granted `Skill`
  and no `WebFetch` inherits an obligation it cannot meet and silently falls
  back to memory — so the two are granted together. `WebSearch` is open-ended
  discovery and stays on `technical-architect` alone.
- **Hooks are bash.** Never `bun`/`node` in a hook command — a missing
  interpreter breaks the session. Always `exit 0` unless blocking on purpose.
- **The issue is the tracker; the branch carries only code.** Design, plan and
  review are filed in the issue store (`reference/issue-store.md`), outside the
  repo, in the issue's own folder — never in the repository. The state of an
  issue *is* its folder (`Draft`, `Open`, `Blocked`, `Closed`), work is assigned
  on `Open` and only on `Open`, and only the user promotes out of `Draft` or
  `Blocked`. Code lives on `corporate/<slug>/work` in the issue's own worktree
  (`reference/worktree-lifecycle.md`), which is what lets two sessions work two
  issues at once. The branch is never `corporate/<slug>` — git cannot hold that
  alongside `corporate/<slug>/<task-id>`.
- **The orchestrator owns the store; no subagent touches it.** A role returns
  its artifact as its final message plus a short report; the main session files
  it, adds the artifact row and appends the activity line. That is why briefs
  inline what a role needs instead of naming a path — the store sits outside
  every worktree, and one writer is what keeps the activity log a single ordered
  account.
- **`ship` is the autonomous path, the others are hand-driven.** `/corporate:ship`
  asks nothing: it routes review findings back by defect origin (the reviewer
  classifies each blocking finding `implementation` / `plan` / `design`), caps
  the retries, and ends at a pull request or at `Blocked`. Its safety is the
  worktree and the PR the user still has to accept — not a gate. It never writes
  code, never waives a stack, never answers a design gap. It prints a `STATE`
  line every turn so a `/goal` evaluator, which sees only the transcript, can
  terminate the loop.
- **The architect rules on playbook coverage; the stages after it are gated.**
  Every design carries a `## Stack readiness` table
  (`reference/stack-readiness.md`) verdicting each stack it relies on as
  `covered`, `not-required` or `required-missing`. `technical-architect` is
  never blocked by a missing playbook — it holds `WebSearch`/`WebFetch` and must
  cite fetched docs instead. `plan` and `build` are: they each read the design
  themselves (any stage is enterable cold) and refuse a `required-missing` stack
  unless the user waives it on that invocation with `--without-playbook
  <stack>`. A waiver is per-run, never persisted, and costs one `knowledge` HR
  record per stack. `ship` has no waiver at all — unattended, a
  `required-missing` stack moves the issue to `Blocked`.
- **`brief` and `hr` are the only commands near `.claude/settings.json`.** Both
  write exactly one `env` key, parse-first, and name the source they resolved
  from. Neither ships settings of its own. On the network: `hr` files to the
  plugin's tracker behind one confirmation per issue, and `ship` pushes the
  issue branch and opens one pull request at the end of a passing run. Those are
  the only outward actions in the plugin, and nothing merges a pull request.
- **HR records never carry consumer data.** A record describes a defect in this
  plugin — no file paths, no snippets, no repo or directory names, no quoted
  task text. They are filed to a public tracker, and `/corporate:hr` is the only
  component allowed to send anything to *the plugin's own* tracker — `ship`'s
  push and pull request go to the consumer's remote and never carry a record.
  `hr` also owns the consumer-side
  setting — `--enable` / `--disable` / `--status` write and read
  `.claude/settings.json` in the consuming project. The plugin still ships no
  settings of its own; a command editing the consumer's file is not the same
  thing, and it must refuse to rewrite one that does not parse.
- **Tooling is bun.** TypeScript, no build step, run with `bun scripts/x.ts`.
- **Paths inside the plugin** use `${CLAUDE_PLUGIN_ROOT}`, never relative or
  absolute paths.
- **Version** in `plugin.json` bumps on every published change.
- Plugins cannot ship `settings.json` or permissions. Those stay in user or
  project settings; README documents the snippet to copy.

## Adding a component

1. Create the file in the right directory, with frontmatter per `docs/authoring.md`.
2. `bun run validate`.
3. Reinstall or restart to pick it up (`/plugin` → reinstall from local path).
4. Bump `plugin.json` version.

## Commits

Conventional Commits. Scope = component type (`feat(agents): …`).
**Never add a Co-Authored-By trailer to commits in this repo.**
Always show the file list and message for confirmation before committing.
