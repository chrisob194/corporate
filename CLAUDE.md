# corporate

Personal Claude Code plugin marketplace. Ships one plugin, `corporate`: a
virtual dev team — agents named after the roles they play (product owner, loop
engineer, technical architect, planner, builder, reviewer, QA) plus the commands,
skills and hooks they use.

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

Shipped: the eight role agents and the pipeline commands (`brief`, `design-loop`,
`design`, `plan`, `build`, `test`, `review`, `qa`, `run` — with `ship` left as a
deprecated alias for `run`), eight reference docs
(`plan-format.md`, `issue-store.md`, `worktree-lifecycle.md`,
`stack-readiness.md`, `test-plan.md`, `scale.md`, `runbook.md`,
`loop-design.md`), fifteen stack playbook
skills (`typescript-playbook`, `typescript-mcp-playbook`, `oauth-playbook`,
`mcp-oauth-playbook`, `sqlite-playbook`, `crypto-playbook`, `zod-playbook`,
`docker-playbook`, `nginx-playbook`, `certbot-playbook`, `cloudflare-playbook`
and one per Bun doc
area: `bun-runtime-playbook`, `bun-pm-playbook`, `bun-bundler-playbook`,
`bun-test-playbook`), the
`corporate-pipeline` router skill that makes the
main session aware of the stage order, and the `whiteboard` skill — the
divergent conversation before `brief`, main-session only, writes nothing.

Also shipped: the DevOps department — `devops-engineer` (rules whether a design
can be operated, and diagnoses a broken deployment; runs and changes nothing) and
`deployer` (runs a runbook's steps verbatim and verdicts them), driven by
`/corporate:deploy`, `/corporate:diagnose` and `/corporate:rollback`, over the
`runbook.md` reference. Post-merge, outside the pipeline, chained by nothing.

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
  review are filed on the issue record in the issue store
  (`reference/issue-store.md`) — never in the repository. An issue is in exactly
  one of four states (`Draft`, `Open`, `Blocked`, `Closed`), work is assigned on
  `Open` and only on `Open`, and only the user promotes out of `Draft` or
  `Blocked`. Code lives on `corporate/<n>/work` in the issue's own worktree
  (`reference/worktree-lifecycle.md`), which is what lets two sessions work two
  issues at once. The branch is never `corporate/<n>` — git cannot hold that
  alongside `corporate/<n>/<task-id>`.
- **One store, one document, and the key is the issue number.**
  `issue-store.md` is the whole definition: the target (GitHub Issues on
  `origin`), the record, the artifact kinds, the states, the transitions and the
  key. There is nothing to configure and no backend to resolve. GitHub assigns
  the key, so nothing here derives, caps or de-duplicates one — a command takes
  `123`, `#123` or an issue URL and normalises it before anything else.
  **A command names the artifact *kind*, never a comment marker or a label**: a
  command that writes `<!-- corporate:artifact design -->` has reached past the
  store into its recipe, and the recipe is allowed to change.
- **The store fails the way it records.** The failure channel and the recording
  channel are the same call, so a run can be unable to reach `Blocked` *and*
  unable to log why. So: never assert a state you did not read back, and
  `/corporate:run` carries a fourth terminal outcome, `store-unreachable`, for a
  run that could not reach the tracker at all. A failed store write is never
  answered by inventing somewhere else to file — there is nowhere else, which is
  why every preflight failure is a hard stop rather than a fallback.
- **The orchestrator owns the store; no subagent touches it.** A role returns
  its artifact as its final message plus a short report; the main session
  records it and appends the activity line. That is why briefs inline what a
  role needs instead of naming a path — the store is a remote the role was never
  told about, and one writer is what keeps the activity log a single ordered
  account.
- **The loop is designed, and the signal is the design.** A `/goal` evaluator sees
  the transcript and nothing else, so a loop is a kickoff, a print obligation and
  a goal line — three things that ship together or not at all, since a goal
  matching a token nothing prints never fires. `loop-engineer` rules the
  termination signal by climbing the ladder in `reference/loop-design.md`, and
  the running agent's own judgement is never a rung: an agent asked whether its
  own work is done says yes, which is what `/goal` exists to prevent. A signal is
  observed once before a goal is keyed to it — an unrun command is a guess.
  Both terminals and a cap are structural, never stylistic: a goal naming only
  success cannot end a run that cannot succeed. Two families, and the split is
  about where the invariants live — a `pipeline` loop names `/corporate:run` and
  its existing `STATE` line and adds nothing, because a second copy of the
  pipeline's rules is a second copy to rot; a `measured` loop gets a bespoke
  prompt, but filled into the fixed skeleton whose closing paragraph forbids
  changing the signal, the threshold or the criteria to reach the target. A loop
  that can move its own goalposts terminates every time and proves nothing.
  Goal-based only: `/loop` and `/schedule` are named when the trigger is a clock,
  and designed for never.
- **`run` is the autonomous path, the others are hand-driven.** `/corporate:run`
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
  record per stack. `run` has no waiver at all — unattended, a
  `required-missing` stack moves the issue to `Blocked`.
- **The tester runs; it never chooses.** `tester` executes the suites the plan
  declares and returns `pass` / `fail` / `blocked` — no write tool, no `Skill`,
  no defect classification, no suite of its own. That is what lets a test stage
  live inside `run`, where `/corporate:qa` cannot: a verdict is routable
  unattended, a decision is not. `qa-engineer` is the opposite role and stays a
  hand-driven post-gate — it invents the tests nobody wrote. A failing suite is
  classified by the `reviewer`, the only holder of `implementation` / `plan` /
  `design`, and it rides that cycle's review rather than getting a counter of
  its own.
- **The architect rules the scale; the lane is derived, never chosen.** Every
  design carries a `## Scale` verdict (`reference/scale.md`) — `small` or
  `standard` — and `/corporate:run` reads it to pick a lane: on `small` the
  planner is dispatched cheaper and owes one task, the build is one wave, and
  the caps tighten to 2 cycles and 0 design redos. The reviewer never changes.
  `--small` is a hint forwarded into the architect's brief, never a verdict; a
  design with no `## Scale` is a defect, not a `standard` design. The
  hand-driven stages ignore the verdict — a human at a gate needs no lane.
- **The architect rules whether a layer runs; the planner names the command.**
  Every design carries a `## Verification` table (`reference/test-plan.md`)
  verdicting `unit`, `integration` and `e2e` as `required` or `not-required`, and
  a `required` row names the environment it needs. The plan answers with a
  `## Test suites` row per required layer. There is no waiver: a layer is
  skipped only because a named role wrote down that it is not needed and why —
  absence of a suite, or of the section, is a hard stop, not permission. A
  `required` layer with no suite row is a plan defect; a suite that cannot run
  unattended moves the issue to `Blocked`.
- **The runbook is the authority; DevOps executes it and never invents one.**
  Every other role works out *how* from a description of *what*. Deployment does
  not: an improvised step is paid for immediately by a running system, and a role
  that can invent a procedure will invent one on the day the real one was merely
  hard to find. A target no runbook covers is a hard stop for `/corporate:deploy`
  and `/corporate:rollback`, waivable per invocation with `--without-runbook` at
  one HR record per target — deliberately the same waiver idiom as
  `--without-playbook`, so there is one, not two. No waiver reaches a missing
  `## Verify` or `## Rollback`. The runbook lives in the *consumer's* repository
  (`docs/runbooks/<target>.md`), never in the issue store: it is part of the
  software's operating surface, not a record of a decision. `reference/runbook.md`
  is the only definition. `run` never deploys — it ends at a pull request, and a
  deploy waits for a human to merge one.
- **DevOps rules operability; the architect rules materials.** The architect
  chooses what a problem is solved *with*, and that is closed before
  `devops-engineer` sees it — devops answers only what has to be running, what
  has to be configured, what happens when it fails and whether it can be undone.
  It never re-opens a material choice, and the architect never gains a fourth
  table: the deployment targets are derived from the design at deploy time by the
  role that will operate them. The judge/executor split is the reviewer/tester
  split again — `devops-engineer` decides and touches nothing, `deployer` touches
  and decides nothing, and neither holds a write tool.
- **`hr` is the only command near `.claude/settings.json`.** It writes exactly
  one `env` key, parse-first, and names the source it resolved from. The plugin
  ships no settings of its own. On the network: `hr` files to the plugin's
  tracker behind one confirmation per issue, and `run` pushes the issue branch
  and opens one pull request at the end of a passing run. Those are the only
  outward actions the *pipeline* takes on its own behalf, and nothing merges a
  pull request. The store's traffic is separate: every read and write of the
  tracker is a call to the consumer's repository, which is why
  `/corporate:brief --init` names the target and its visibility once, before it
  creates a label.
- **HR records never carry consumer data.** A record describes a defect in this
  plugin — no file paths, no snippets, no repo or directory names, no quoted
  task text. They are filed to a public tracker, and `/corporate:hr` is the only
  component allowed to send anything to *the plugin's own* tracker — `run`'s
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
