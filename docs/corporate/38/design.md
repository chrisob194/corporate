# Design — #38

## Problem

`plugins/corporate/agents/scout.md:4` names five MCP tools in its `tools:` allowlist — `mcp__plugin_corporate_graft__graft_find_code` and four siblings. That grant was decided once, when the role file was written, and it applies to every dispatch the role ever receives: the architect's Phase-A prior-art sweep, the reviewer's call-site check, QA's runner hunt. Nobody who knows what a particular piece of work needs can change it, in either direction — the standing grant is carried by searches that do not need it, and no design or split can hand a search a capability the role file did not anticipate.

The repository's convention for this (`CLAUDE.md:78-84`) is written around that standing shape: it obliges the *role* to carry pointer-and-fallback guidance because the *role* holds the tool. Issue #38 moves the decision to where the scope is decided and leaves the guidance attached to the decision instead of to the role.

In scope: the mechanism (how a grant is expressed, where it is decided, what each stage does with it), the mechanical rule that stops a standing server-bound grant reappearing, and the migration of scout's existing graft grant onto it.

Out of scope, per the spec's non-goals and its third assumption ("Roles that currently carry no standing grant are unaffected"): giving any other role external-tool access — `builder`, `reviewer`, `qa-engineer`, `devops-engineer` and `technical-architect` keep the allowlists they have (`plugins/corporate/agents/builder.md:4`, `reviewer.md:4`, `qa-engineer.md:4`, `devops-engineer.md:4`, `technical-architect.md:4`); which servers `plugins/corporate/.mcp.json` declares; a role's non-MCP access; and how a grant is worded in any particular dispatch beyond the fields the grammar fixes.

## Approach

Three pieces, one mechanism.

### 1. The pool becomes generic, and the platform allows exactly one way to do that

Claude Code's subagent frontmatter offers no wildcard that *grants* every MCP tool: `mcp__<server>` / `mcp__<server>__*` in `tools:` grant one named server, and `mcp__*` is accepted only in `disallowedTools` (F3). `mcpServers:` — the field that would scope servers per agent — is documented as **ignored for plugin subagents** (F4), which is what every agent in this plugin is. So the only server-agnostic pool a plugin subagent can hold is the inherited one: **omit `tools:` entirely** (F1) and carve back what the role must not have with `disallowedTools` (F2).

`plugins/corporate/agents/scout.md:4` therefore becomes:

```yaml
disallowedTools: Agent, Bash, PowerShell, Write, Edit, NotebookEdit, Artifact, EnterWorktree, ExitWorktree, SendMessage, TaskStop, Monitor, Skill, WebFetch, WebSearch, TodoWrite
```

with no `tools:` line. Against the documented background-subagent built-in set (F6) that leaves scout holding `Read`, `Grep`, `Glob`, `ToolSearch` — and every MCP tool the session has, from any server, named nowhere. `ToolSearch` is kept deliberately: it is the platform's own answer to the context cost of a wide tool pool, and denying it would remove the only lever on the regression this change introduces. `Agent` is denied explicitly rather than left to F5's depth-limit filter, because `CLAUDE.md:67-72` forbids bare nested dispatch outright and a filter that only fires at a depth limit is not that rule.

The inverted list is the risk this design has to pay for, so it is paid mechanically rather than by review, exactly as graft's telemetry already is (`scripts/validate.ts:48-57`, `scripts/validate.ts:115-117`). Three rules go into `scripts/validate.ts`:

- **R1 — no agent's `tools:` line may name an `mcp__…` entry at all.** This is functional requirement 3 in mechanical form, and it subsumes `findUnknownMcpToolServers` (`scripts/validate.ts:59-72`, wired at `:138-143`), whose whole job was checking that a server-bound name pointed at a declared server. That function and its three test cases (`test/validate-graft.test.ts:40-63`) are deleted, not kept alongside a rule that forbids the thing they validate.
- **R2 — an agent that omits `tools:` takes the generic pool, so it must carry `disallowedTools`, and that line must name `Agent`.**
- **R3 — a `disallowedTools` line that names any side-effect tool must name all of them.** `SIDE_EFFECT_TOOLS` = `Agent, Bash, PowerShell, Write, Edit, NotebookEdit, Artifact, EnterWorktree, ExitWorktree, SendMessage, TaskStop`, derived from F5+F6 and carrying the doc URL in a comment beside it. This is the same shape as the repo's existing "`Skill` implies `WebFetch`" pairing (`CLAUDE.md:73-77`): a half-complete denylist is the failure mode, and internal consistency is checkable without knowing intent.

### 2. The grant is a scope-time decision that carries its own guidance

A new shipped reference, `plugins/corporate/reference/tool-grants.md`, is the only definition — the idiom `stack-readiness.md`, `test-plan.md`, `scale.md` and `runbook.md` already follow, and the condition `docs/authoring.md:215` sets for adding one (a format two components would otherwise restate) holds: the plan grammar and the architect's own dispatch briefs both need it.

It fixes one optional field in a plan task block:

```
external_tools: none
external_tools: <what the work may reach for>; use: <what a result may be trusted for>; fallback: <what to do when it is unavailable or answers nothing>
```

Absence means `none`. That direction is deliberate and is the opposite of `test-plan.md`'s rule for a missing suite row, for the reason `test-plan.md:144` gives: absence must land on the *restrictive* answer. An omitted layer is not a skipped layer because skipping is the unsafe direction; an omitted grant is no grant because granting is the unsafe direction. It also keeps every plan already filed under `docs/corporate/*/plan.md` valid.

A grant that is not `none` and does not carry both `use:` and `fallback:` is a **plan defect** — a hard stop in `/corporate:build`, and a review cycle with origin `plan` in `/corporate:run`. That is functional requirement 4 enforced at the stage that reads it rather than trusted to the writer.

Two decision points, and no third, matching the spec's first assumption: the architect while designing (it writes the field in Phase B, and states the same triple in the brief of any search it dispatches during Phase A), and `/corporate:split`, where the task block already travels verbatim into the child issue (`plugins/corporate/commands/split.md:97-98`) so the grant travels with it at no cost — the only edit there is adding `external_tools:` to the list of task fields that are context and must never surface as a spec requirement (`split.md:85-88`). The role carrying out the work never decides: `builder` receives the line inlined in its brief and holds no pool to exercise it with.

**Settled here rather than carried into the plan** (the Phase B back-edge): the first decomposition put an `external_tools:` grant on builder tasks, which made the field decoration — `builder` holds an allowlist with no MCP pool and cannot delegate, so nothing in a build task's chain could exercise a grant. Extending the generic pool to `builder` would fix that and is explicitly forbidden by the spec's third assumption. So the field's scope is defined as *the work*, exercised by whatever role in the chain holds a pool — today exactly `scout`, reached through the `Agent(scout)` grants that `technical-architect.md:4`, `reviewer.md:4` and `qa-engineer.md:4` already carry. On a task whose chain cannot exercise one, the architect writes `none` or omits the line; `tool-grants.md` says so, so this is a rule rather than a convention someone has to infer.

### 3. What replaces `CLAUDE.md:78-84`

The bullet's substance survives intact; only its subject changes from the role to the grant:

> **An MCP grant is made at scope time and travels with its guidance.** No role's `tools:` names an MCP server — a standing grant decides, before any work exists, what every future task may reach for, and it is wrong in both directions at once. The grant is made where a piece of work's scope is decided, and it carries three things or it is not a grant: what may be reached for, what its results may be trusted for, and what to fall back to when it is not there (`reference/tool-grants.md`). A role reaches external tools only by holding the generic pool — no `tools:` allowlist and a `disallowedTools` complement, both validated mechanically — and only as far as its brief granted. Telemetry-off is still enforced mechanically at every place a `graft` server is declared.

### Pinned Claude Code facts (F1–F9)

Every platform claim this design rests on, fetched 2026-09-12 from `code.claude.com/docs/en/sub-agents` unless stated. This list is what the build transcribes; a fact a task needs that is absent here is a **design defect to route back**, never a licence to write it from memory.

- **F1 — `tools:`.** "Tools the subagent can use. **Inherits every tool available to subagents if omitted.** If no entry in the list resolves to a tool, the subagent usually fails to launch with an error naming the entries."
- **F2 — `disallowedTools:`.** "Tools to deny, removed from inherited or specified list. An entry with a specifier, such as `Bash(git push *)`, still removes the whole tool."
- **F3 — MCP patterns.** "Both fields accept MCP server-level patterns in addition to exact tool names: `mcp__<server>` or `mcp__<server>__*` grants or removes every tool from the named server. In `disallowedTools`, `mcp__*` also removes every MCP tool from any server." There is no wildcard that grants every MCP tool in `tools:`; omission is the only generic grant.
- **F4 — fields ignored for plugin subagents.** `mcpServers`, `permissionMode` and `hooks` are each documented "Ignored for plugin subagents". `disallowedTools` is not among them.
- **F5 — the first filter**, applied to every subagent even when the tool is listed in `tools:`: `Agent` at the depth limit, `AskUserQuestion`, `EndConversation`, `EnterPlanMode`, `ExitPlanMode` (unless `permissionMode` is `plan`), `ScheduleWakeup`, `TaskOutput`, `WaitForMcpServers`, `Workflow`.
- **F6 — the second filter**, applied to background subagents, which are the default: "a background subagent keeps **every MCP tool** but only these built-in tools: `Read`, `Grep`, `Glob`, `Bash`, `PowerShell`, `Edit`, `Write`, `NotebookEdit`, `WebFetch`, `WebSearch`, `TodoWrite`, `Skill`, `ToolSearch`, `EnterWorktree`, `ExitWorktree`, `Monitor`, `TaskStop`, `SendMessage`, and `Artifact`." A foreground subagent inherits the main conversation's fuller set minus F5.
- **F7 — the spawning tool is `Agent`** (called `Task` in v2.1.63 and earlier; `Task(...)` still works as an alias).
- **F8 — plugin server tool names** are `mcp__plugin_<plugin>_<server>__<tool>` (`docs/authoring.md:241-242`), and graft's tools exist only where a human has run `graft build` in that project — with no graph the server advertises no tools at all (`README.md:431-433`).
- **F9 — `ToolSearch`** "Searches for and loads deferred tools when tool search is enabled" (`code.claude.com/docs/en/tools-reference`). The docs do not state that it reaches tools outside an agent's own pool, so it is not usable as a grant mechanism — only as a way to defer the schema cost of a pool the agent already holds.

### Registration surfaces

- `CLAUDE.md:35-36` — "eight reference docs (…)" becomes nine, with `tool-grants.md` in the list.
- `CLAUDE.md:78-84` — the convention bullet, rewritten as above.
- `README.md:417-418` — the `Reference` row of the component table.
- `README.md:421` — the `MCP servers` row still reads "granted to `scout` only", which becomes false the moment T2 lands.
- `README.md:437-441` — the `### graft` bullet "Only `scout` is granted the tools", whose second half (pointer-and-fallback guidance travelling with the grant) is now the grant's job, not the role's.
- `docs/authoring.md:33` and `:45-53` — the subagent frontmatter block and the `tools`-is-an-allowlist paragraph, which must now document `disallowedTools`, the generic pool and R1–R3.
- `docs/authoring.md:241-244` — "An agent's `tools:` list is an allowlist, so an omitted MCP tool name is uncallable; name each one explicitly rather than granting the server" is the exact instruction this issue reverses.
- `plugins/corporate/.claude-plugin/plugin.json:4` — `5.3.0` → `5.4.0`.

## Tools chosen

| Layer | Found | Chosen | Why |
|---|---|---|---|
| This repository | `scripts/validate.ts:48-57` + `:115-117` — the precedent for enforcing a tool-grant rule mechanically instead of by review, with `test/validate-graft.test.ts` as its unit-test home; `scripts/validate.ts:59-72` + `:138-143` — the existing agent-`tools:`-line check this replaces; `plugins/corporate/reference/stack-readiness.md`, `test-plan.md`, `scale.md` — three worked examples of "one reference doc owns one ruling, and the stages read it themselves"; `plan-format.md:45-59` — the field-rule grammar a new task field slots into, and `:61-70`, which already delegates one section's grammar to another reference file; `commands/split.md:97-98` — the task block already travels verbatim into a child issue, so a split-time grant needs no transport; `docs/authoring.md:209-221` — when a reference file is the right answer | **The answer.** One new reference doc, one new task field, three validator rules, one agent frontmatter change | Every enclosing structure this needs already exists and is in use. Nothing about the decision-recording half of this problem had to be invented — only which field holds the grant and where it is read |
| Installed capability | Claude Code's own subagent frontmatter (F1–F7) is the only thing that can make an agent's MCP pool server-agnostic, and it settles the mechanism rather than the design: `mcpServers:` would have been the natural fit and is ignored for plugin subagents (F4). This session's 18 connected MCP servers were checked for a tool that manages agent grants — `angular-cli`, `claude-in-chrome`, `suite`, `tree-of-knowledge`, the `claude_ai_*` connectors — and none touches this surface; the plugin's own `graft` server (`plugins/corporate/.mcp.json`) is the *subject* of the change, not a tool for making it | The platform's `tools:`-omitted + `disallowedTools` pair | Forced, not preferred: F3 and F4 leave exactly one way for a plugin subagent to hold a pool that names no server. This is the one place the answer did not come from the repository, and it is why the inverted list gets a mechanical guard rather than a comment |
| Libraries | Nothing to add. The deliverable is markdown plus ~40 lines of string-matching in an existing bun script. "Add nothing" is priced explicitly: a dependency here would buy no parsing this does not already do by regex over a frontmatter line (`scripts/validate.ts:30-41`), and would cost install surface in a plugin that currently has none | Add nothing | There is no package that could express a subagent tool grant, and a YAML parser for four `key: value` lines would be a dependency bought to replace nine lines of code |
| Runtime and platform | **Skipped.** Existing repository — Claude Code plugin, bun tooling, markdown components — all four already decided (`CLAUDE.md` Layout and Conventions, `package.json:6-9`) | — | Greenfield-only layer |

## Stack readiness

| Stack | Verdict | Basis |
|---|---|---|
| claude-code-plugin | not-required | The stack is touched at its frontmatter surface, but F1–F9 above fix every platform fact the build needs, each with the URL it was fetched from on 2026-09-12: the exact `disallowedTools` value for `scout`, the built-in universe the validator's `SIDE_EFFECT_TOOLS` list is derived from, and why `mcpServers:` is not an option. Every task transcribes a pinned fact or edits this repo's own prose; no build decision is left to resolve against upstream docs. A fact a task needs that is absent from F1–F9 is a design defect to route back, not a licence to write it from memory — the same ruling `docs/corporate/37/design.md` filed for `claude-code-plugin` and shipped |
| typescript | covered | typescript-playbook — the only executable change is three exported functions and a constant in `scripts/validate.ts`, in the style of the two already exported there |
| bun | covered | bun-test-playbook, bun-runtime-playbook — `bun test` and `bun run validate` are both acceptance and suite commands (`package.json:6-9`), and the new unit tests use `bun:test` as `test/validate-graft.test.ts:1` already does. Ruled against the playbook set this repository ships (`plugins/corporate/skills/bun-test-playbook/`, `bun-runtime-playbook/`, `typescript-playbook/`) rather than against this dispatch's own skill listing, which shows other plugins' skills and none of this team's; one `tooling` HR record is filed about that gap, and it changes no verdict here |
| graft | not-required | The server stays declared in `plugins/corporate/.mcp.json` exactly as it is, telemetry check included. Nothing in this change turns on what its tools do or what they return — only on the fact that its tool names currently sit in a role's allowlist. No task calls it |

## Verification

| Layer | Verdict | Why | Environment |
|---|---|---|---|
| unit | required | Three new exported functions in `scripts/validate.ts` are pure string logic with the boundaries that matter living in the input: a `tools:` line naming an MCP tool, a `tools:` line naming none, an omitted `tools:` line with and without `disallowedTools`, a partial side-effect denylist. `test/validate-graft.test.ts` is the working precedent for testing this file's exports directly | bun on `PATH`, run from the repository root; no server, no network, no fixture |
| integration | required | Every other file changed is a shipped plugin surface the marketplace loader parses — an agent's frontmatter, a new reference file, four command bodies, the manifest — and `bun run validate` is the mechanical proof that the frontmatter still parses, that the new `${CLAUDE_PLUGIN_ROOT}/reference/tool-grants.md` path the commands name actually resolves (`scripts/validate.ts:181-198`), and that `scout.md` satisfies R1–R3 against the real tree rather than against a test string | bun on `PATH`, run from the repository root; no server, no network, no fixture. Verified green on this branch before the change |
| e2e | not-required | The end-to-end path is a live Claude Code session dispatching `scout` and observing which tools it holds, which this repository ships no harness to drive — the same ruling `docs/corporate/37/design.md` made for the same reason. The residual it leaves (does `disallowedTools` bind a plugin subagent in practice) is named in Risks and belongs to a `/corporate:qa` pass, not to an unattended suite | — |

## Scale

| Verdict | Reason |
|---|---|
| standard | Six tasks over four disjoint file sets, two dependency waves, and it changes two published interfaces — the plan task grammar and an agent's frontmatter contract — so it is not one builder's coherent pass |

## Rejected

- **Keep an allowlist and name the server instead of its tools: `tools: Read, Grep, Glob, mcp__plugin_corporate_graft`.** The smallest possible change, and it loses outright: F3 makes it a *standing* grant to *one named server*, which is the exact shape functional requirement 3 forbids. It narrows the line, not the problem.
- **Use the `mcpServers:` frontmatter field to scope servers per agent.** The field that was designed for this, and unusable: F4 documents it as ignored for plugin subagents, and every agent here is one.
- **Put `mcp__*` in `tools:`.** Does not exist as a grant. F3 allows the wildcard in `disallowedTools` only.
- **Grant `ToolSearch` and let the role search for whatever its grant names, keeping the allowlist otherwise intact.** The most attractive alternative, and rejected on evidence rather than on taste: F9 does not state that `ToolSearch` reaches outside the agent's pool, and a mechanism whose central claim cannot be verified in the upstream docs is not a foundation. It survives as a *mitigation* — scout keeps the tool so the pool's schema cost can be deferred.
- **Extend the generic pool to `builder` as well, so a plan task's grant has an exerciser.** Lost to the spec's third assumption — "Roles that currently carry no standing grant are unaffected" — which names the boundary of this ticket exactly. It is also the change with the largest blast radius in the set: an unattended `/corporate:run` builder holding every connected server's tools, including the user's mail, tracker and calendar connectors. Deferred deliberately, with R1–R3 written down as the rule for doing it later.
- **Leave the decision implicit — strip scout's MCP names and let each caller phrase a grant however it likes.** Lost to functional requirement 4: guidance that is not part of the grant's grammar is guidance that gets dropped on the first hurried dispatch, which is precisely the failure `CLAUDE.md:78-84` was written to prevent.
- **Make `external_tools:` mandatory on every task, like `acceptance`.** Consistent with this repo's taste for explicit rulings, and rejected on two counts: absence here lands on the safe answer (no grant), unlike a missing suite row, and it would retroactively invalidate every plan already filed under `docs/corporate/*/plan.md`.
- **Fold the grant grammar into `plan-format.md` and skip the new reference doc.** Lost because the architect's Phase-A scout dispatches are a grant point with no plan in existence yet (the spec names it as one of the two), so the definition would have to be restated outside the plan grammar — the exact condition `docs/authoring.md:215` gives for creating a reference file.
- **Add a fourth design table, `## Tool grants`, beside stack readiness, verification and scale.** Lost because the grant is per piece of work, not per approach, and the plan is where pieces of work are defined; `CLAUDE.md`'s deployment-targets bullet already rules against the architect gaining a fourth table for a decision that belongs to the stage that consumes it.
- **Enforce the denylist by review rather than in `scripts/validate.ts`.** Lost to the convention this change is rewriting, which already says the mechanical half is not left for a reviewer to notice — and an inverted allowlist is the one place in this plugin where a silent omission voids an invariant.
- **Drop `graft` from `.mcp.json` altogether, since no role names its tools any more.** Out of scope by the spec's first non-goal, and wrong on the facts: under the generic pool the server is exactly what a granted search reaches for, and F8 already makes it self-disabling where no graph exists.

## Risks

- **Denylist drift.** The guard is a list of tool names (`SIDE_EFFECT_TOOLS`) derived from F5/F6 on 2026-09-12. A new mutating built-in in a future Claude Code release joins scout's inherited pool silently, and R3 only enforces the list's internal completeness. Mitigated by keeping the list in one place with the doc URL beside it, and by the fact that the first filter already removes the most dangerous session-level tools from every subagent — but this is a maintenance obligation the allowlist did not have, and it is the price of the only mechanism the platform offers.
- **Foreground dispatch widens the pool.** F6's narrow built-in set applies to background subagents, which are the default; a foreground `scout` inherits the main conversation's fuller set minus F5, and the denylist covers only what F6 enumerates plus `Agent`. Denying a name that resolves to nothing is harmless (F2 constrains only `tools:` on that point), so the fix when it matters is adding names, not restructuring.
- **`disallowedTools` on a plugin subagent is honoured by omission.** F4 lists `mcpServers`, `permissionMode` and `hooks` as ignored for plugin subagents and does not list `disallowedTools`. That is strong evidence, not a positive statement, and scout's write-less invariant now rests on it where it previously rested on an allowlist. No suite in this repository can prove it; a `/corporate:qa` pass that dispatches `scout` and asks it to write a file is the check that would, and it is worth running once after this merges.
- **Context cost per scout dispatch.** Today scout loads three built-in schemas plus five graft tools. After, it loads every MCP tool schema in the session — 18 connected servers in the session that dispatched this design. On a `sonnet`/`low` agent dispatched several times per pipeline stage that is a real, recurring regression, and the only lever is the user's own tool-search setting (F9), which this plugin does not control. Keeping `ToolSearch` in scout's pool is what makes that lever reachable at all.
- **An ungranted call is now prevented by prose, not by the tool list.** Scout can see tools it has no grant for, and only its own `## Never` list stops it calling one. That is how every other boundary in this plugin works, but it is weaker than what scout had, and it is the direct cost of satisfying functional requirement 1.
- **A grant nobody can exercise reads as capability.** A `external_tools:` line on a task whose chain holds no pool is inert. The architect's prompt and `tool-grants.md` both state the rule; a future reader who skips both could write one and believe the work has access it does not have.
