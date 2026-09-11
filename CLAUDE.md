# corporate

Personal Claude Code plugin marketplace. Ships one plugin, `corporate`: a
virtual dev team — agents named after the roles they play (product owner,
technical architect, builder, reviewer, QA) plus the commands, skills and
hooks they use.

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

Shipped: the six role agents and the pipeline commands (`brief`,
`design`, `build`, `test`, `review`, `qa`, `split`, `run` — with `plan` left as a
deprecated alias for `design`, and `ship` left as a deprecated alias for `run`),
eight reference docs
(`plan-format.md`, `spec-format.md`, `issue-store.md`, `worktree-lifecycle.md`,
`stack-readiness.md`, `test-plan.md`, `scale.md`, `runbook.md`), sixteen stack playbook
skills (`typescript-playbook`, `typescript-mcp-playbook`, `oauth-playbook`,
`mcp-oauth-playbook`, `sqlite-playbook`, `crypto-playbook`, `zod-playbook`,
`docker-playbook`, `nginx-playbook`, `certbot-playbook`, `cloudflare-playbook`,
`github-playbook` and one per Bun doc
area: `bun-runtime-playbook`, `bun-pm-playbook`, `bun-bundler-playbook`,
`bun-test-playbook`), the
`corporate-pipeline` router skill that makes the
main session aware of the stage order, the `whiteboard` skill — the
divergent conversation before `brief`, main-session only, writes nothing —
and the `goal-suggest` skill — an on-demand, inline `/goal` line suggestion
for `/loop` and `/schedule`, no dispatch, no artifact.

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
- **An MCP grant travels with its guidance.** A role given a code-graph tool
  without the rule that its results are locations to open, never findings to
  pass through, and without a defined fallback for when no graph exists,
  inherits an obligation it cannot meet and silently substitutes the tool's
  own summary for the source — the same failure shape as `Skill` without
  `WebFetch`. Telemetry-off is enforced mechanically at every place a `graft`
  server is declared, not left to a reviewer to notice.
- **Hooks are bash.** Never `bun`/`node` in a hook command — a missing
  interpreter breaks the session. Always `exit 0` unless blocking on purpose.
- **The issue is the tracker; the branch carries the code and the record of
  how it was decided.** Spec, design, plan and review live in the repository, at
  `docs/corporate/<n>/<kind>.md`, written and committed by the orchestrator
  onto `corporate/<n>/work` — a redo overwrites the file, so `git diff` shows
  what changed between two designs, which a comment thread cannot. The issue
  keeps a three-line pointer note (marker, `path @ sha`, one summary clause);
  every other artifact kind is still a comment on the issue record. See
  `reference/issue-store.md`'s `### Relocated kinds — spec, design, plan and
  review` for the definition. An issue is in exactly one of four states
  (`Draft`, `Open`, `Blocked`, `Closed`), work is assigned on `Open` and only
  on `Open`, and only the user promotes out of `Draft` or `Blocked` — promoting
  is itself gated on a `spec` already being filed. The code and those four
  documents live on `corporate/<n>/work` in the issue's own worktree
  (`reference/worktree-lifecycle.md`), which is what lets two sessions work
  two issues at once. The worktree is created once, the first time `spec.md`
  is written (`/corporate:brief`'s spec mode) — not at design time, so an
  optional feasibility-only design pass can run on a `Draft` issue in the same
  worktree before anyone promotes it. The branch is never `corporate/<n>` —
  git cannot hold that alongside `corporate/<n>/<task-id>`.
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
- **A filed plan can be converted into child issues, never automatically.** A
  record holding a `split` artifact is a **parent**, not a work issue — every
  stage that would work an issue refuses it, naming
  `/corporate:split <n> --status` instead. Conversion is whole-plan, never
  recursive: it takes every task at once or none, and a child's own `parent`
  field makes it un-splittable in turn. Children file as `Draft`, like every
  other issue — nothing here promotes one for you.
- **Filing is cheap; writing the spec is where the real authoring happens.**
  `/corporate:brief`'s plain-filing mode never dispatches `product-owner` — it
  just captures the idea as stated, usually right after a `whiteboard`
  conversation already resolved the ambiguity live. `product-owner` is
  dispatched only by `brief`'s spec mode, which turns the captured idea into
  an SDD-shaped `spec.md` (`reference/spec-format.md`): problem, user
  scenarios, functional requirements, non-goals, key entities, assumptions —
  the same `[NEEDS CLARIFICATION:` marker (max three) as a safety net for
  whatever the live conversation didn't resolve. An agent's prompt states its
  tone and its boundary; the method and the exact document shape live in the
  reference doc it reads, the same split `loop-engineer` used to have with
  `loop-design.md`. Both `brief` and `design` resolve plain English in front
  of their flags — flags are never removed, they are what a script uses, but
  nothing here should require memorizing one.
- **A feasibility read is optional, and it never commits to building.**
  `/corporate:design <issue> --lite` dispatches `technical-architect` for
  Phase A only — the approach, `## Stack readiness`, `## Verification`,
  `## Scale` — no plan, and it is allowed on a `Draft` issue because it isn't
  work starting, it's a read. The gate that matters still holds: promoting
  `Draft` → `Open` requires a `spec`, not a `design`, and most issues never run
  the lite pass at all.
- **A designed loop is gone; suggesting a `/goal` line is not a stage.** The
  six-rung signal ladder (a command's exit code, a number against a
  threshold, a count reaching zero, a state read from the store, an
  independent agent's verdict, never the running agent's own judgement) was
  worth keeping; the dedicated agent, the filed artifact and the seven
  validation checks around it were not, for the value they returned. The
  `goal-suggest` skill answers "give me a goal for issue #n" inline, in
  whatever session asks, climbing the same ladder against the issue's `spec.md`
  `## Loop hints` and whatever the repository can actually measure — no
  dispatch, no artifact, no store write. `/corporate:run` always prints a
  working default `/goal` line on its own; this is only for when a sharper one
  is worth the one extra step. `/loop` and `/schedule` remain how a clock-driven
  trigger is named — nothing here changes that.
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
  cite fetched docs instead. `/corporate:design` and `/corporate:build` are:
  they each read the design themselves (any stage is enterable cold) and refuse
  a `required-missing` stack unless the user waives it on that invocation with
  `--without-playbook <stack>`. A waiver is per-run, never persisted, and costs
  one `knowledge` HR record per stack. The gate protects the builder — the
  stage that turns a stack ruling into running code — never a search-less
  stage upstream of it. `run` has no waiver at all — unattended, a
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
  design owes one task and the build is one wave, and the caps tighten to 2
  cycles and 0 design redos. The reviewer never changes.
  `--small` is a hint forwarded into the architect's brief, never a verdict; a
  design with no `## Scale` is a defect, not a `standard` design. The
  hand-driven stages ignore the verdict — a human at a gate needs no lane.
- **The architect rules whether a layer runs, and names the command in the
  same pass.** Every design carries a `## Verification` table (`reference/test-plan.md`)
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
