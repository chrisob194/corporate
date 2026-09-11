# Plan — #26

Adds `/corporate:consult`: a new `reference/consult.md` grammar, a new write-less
`consultant` role that fills it, a new command that dispatches and validates it,
and the registration of all three. Four disjoint file sets, so no two tasks share
a path and nothing had to be merged or serialised for conflict reasons. The one
dependency is real rather than felt: `scripts/validate.ts:183-198` fails a
component whose `${CLAUDE_PLUGIN_ROOT}` pointer does not resolve, so the agent
and the command cannot pass their own acceptance inside their own worktrees until
the reference file exists on the branch.

## T1 — Write the consult reference
depends_on: none
files: plugins/corporate/reference/consult.md
acceptance: `bun run validate` exits 0, and `grep -q buildable plugins/corporate/reference/consult.md && grep -q reservations plugins/corporate/reference/consult.md && grep -q unknown plugins/corporate/reference/consult.md && grep -q 'What to do next' plugins/corporate/reference/consult.md` exits 0
steps:
  - Create `plugins/corporate/reference/consult.md` as plain markdown with no frontmatter, following the house style of `plugins/corporate/reference/scale.md` — read that file first; it is the closest model in length and shape.
  - Open with what a consult is: the advisory feasibility read a drafted issue gets before anyone pays for a design. State that `consultant` writes it and `/corporate:consult` validates and prints it, and that this file is the only definition — the grammar is not restated anywhere else.
  - Add a "Why it settles nothing" section, and make it unambiguous: the consult gates nothing, it is never a precondition for `/corporate:design` or `/corporate:build`, and the design's own `## Stack readiness` ruling stays independent and is defined only in `reference/stack-readiness.md`. Say explicitly that whether that independent duty becomes redundant is an open question this file does not answer.
  - Add a "Shape" section holding the document skeleton inside one fenced markdown block — `# Consult — #<n>`, then `## Verdict` (a one-row table `| Verdict | Reason |`), `## Dependencies` (`| Dependency | Coverage | Basis |`), `## Reservations` (one line each, or `none`), `## What to do next` (one course plus a one-line reason).
  - Add a "Verdicts" table defining exactly three words — `buildable` (every dependency `known` and nothing in the ask needs a human decision first), `reservations` (buildable, but an `unknown` dependency is peripheral, or the brief leaves something a human must settle), `blocked` (the ask rests on an `unknown` dependency, or on a premise this repository does not support as drafted). State that the tie goes to the more cautious word.
  - Add a "Coverage" table defining exactly two words — `known` (a playbook skill covers it; `Basis` holds the skill name) and `unknown` (no playbook here covers it; `Basis` holds one line saying so). State that `Dependency` is a bare identifier — a stack or capability name, never a path, a repository name or a phrase — and that this vocabulary is deliberately not `stack-readiness.md`'s, so the two documents can never be mistaken for each other.
  - Add a "Courses" table defining exactly three — `accept`, `amend`, `set aside` — as what the requester does next, with the command left to `/corporate:consult` to name.
  - Add a "What a consult never contains" section: no task breakdown, no ordered list of buildable work, no `depends_on`, no `files:`, no `acceptance:` line, no `## Stack readiness`, `## Verification` or `## Scale` section, and no chosen approach or named library. State that any of these is over-delivery and that the command re-dispatches rather than printing it.
  - Add a short "Freshness" note: nothing is filed, so a consult is never stale — a re-read is a re-run against the issue as currently drafted.
  - Do not mention a `consult` artifact kind, a label, a state or a comment marker; this command writes nothing to the store.

## T2 — Add the consultant role
depends_on: T1
files: plugins/corporate/agents/consultant.md
acceptance: `bun run validate` exits 0 and reports no error for `plugins/corporate/agents/consultant.md` (which proves `name` equals the filename, `description` is present, `model`/`effort` are legal, and the `${CLAUDE_PLUGIN_ROOT}/reference/consult.md` pointer resolves)
steps:
  - Read `docs/authoring.md:27-61` and `plugins/corporate/agents/technical-architect.md` before writing; the latter is the structural model, at roughly a third of the length.
  - Create `plugins/corporate/agents/consultant.md` with frontmatter — `name: consultant`, `tools: Read, Grep, Glob, Skill, WebFetch`, `model: opus`, `effort: medium` — and a `description` written as a "Use when …" trigger scoped to the pre-design case: someone wants to know whether a drafted issue is worth designing, what the ask depends on, and which of those this team already has guidance for. The description must say it returns a read and never a design, an approach or a task breakdown, so it does not compete with `technical-architect` for the same trigger.
  - Body, `## Role`: it prices an ask before anyone pays for a design. It names dependencies, rules each against what this team already documents, and verdicts doability. It chooses nothing.
  - `## Inputs`: the issue number and the brief, inlined verbatim in the dispatch brief; the repository root; the installed capability the dispatcher listed. It is never given a path to write to, writes no file, and returns its document as its final message.
  - `## Method`, short and numbered: read the ask as drafted; list what it appears to depend on, as bare identifiers; rule each `known` or `unknown` against the skills this session lists — holding `Skill` is what makes that listing visible, and a stack no playbook there covers is `unknown`; take one bounded look at the repository for whether the premise holds or the thing already exists, using `Read`/`Grep`/`Glob` only; then verdict per the reference.
  - State the bound explicitly: this is a read, not a survey. No sweep for call sites, no file-scope inventory, no git archaeology. If answering would need more than a bounded look, that is itself a reservation to report.
  - Add `## Stay out of the roles' lanes`, modelled on `plugins/corporate/skills/whiteboard/SKILL.md:35-43`: no acceptance criteria or non-goals (the product owner's), no chosen approach, library or pattern and no `## Stack readiness` ruling (the architect's), no plan, no task breakdown, no code. Name that it holds no `WebSearch` on purpose — it names a gap, it never goes and closes one.
  - Add `## Report to HR`: file a record through the `hr-report` skill only when it hits the edge of its own role — a tool it was not granted, work outside its remit. State flatly that an `unknown` dependency is **not** such a case: naming it is the deliverable, and the record for a missing playbook is filed by the architect when a design actually turns on it.
  - Add `## Output`: a `## Report` block of at most six lines — `Verdict`, `Dependencies: <n> known, <m> unknown (<which>)`, `Next: accept | amend | set aside`, `Had to guess` — then a `---`, then `# Consult — #<n>` as the only top-level `#` heading in the message, in the grammar of `${CLAUDE_PLUGIN_ROOT}/reference/consult.md`. Tell it to read that file and fill it; do not restate the section list, the verdict words or the coverage words in this agent file beyond the report block.

## T3 — Add the consult command
depends_on: T1
files: plugins/corporate/commands/consult.md
acceptance: `bun run validate` exits 0 and reports no error for `plugins/corporate/commands/consult.md`, and `grep -q 'reference/consult.md' plugins/corporate/commands/consult.md` exits 0
steps:
  - Read `plugins/corporate/commands/design.md` first; it is the structural model. This command is shorter and has no worktree, no waiver and no filing.
  - Create `plugins/corporate/commands/consult.md` with frontmatter `description:` (one line: reads a drafted issue and verdicts whether it looks buildable before a design exists; advisory, files nothing, changes nothing) and `argument-hint: <issue>`.
  - Open the body by saying what it is not: not a stage, chained by nothing, produces no artifact, and `/corporate:run` never calls it.
  - Step: empty `$1` is a stop that names `/corporate:brief --list draft`.
  - Step: read `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` — if that path does not resolve, find it under the plugin directory — run its preflight **except the write-permission check**, and say why in one sentence: that check exists for a write-shaped call the run needs anyway, and this command performs no store write at all. Then normalise `$1` per the store's *The key* and resolve it per *Finding an issue*.
  - Step: state that no worktree and no branch are created, nothing is checked out, and the working tree is untouched — this runs in the user's own checkout, like `/corporate:brief`.
  - Step: a record holding a `split` artifact is a parent; stop and name `/corporate:split <n> --status`, per the store reference, which is not repeated here.
  - Step: report the state the issue is in and carry on regardless of which one it is. Never change it, never offer to promote, and say plainly that the read leaves the record exactly as it found it.
  - Step: dispatch the `consultant` subagent with a brief containing the issue number; the brief from the record, inlined verbatim; the repository root and anything relevant from `CLAUDE.md`; the list of MCP servers and plugin commands available in this session — the installed capability a subagent cannot see, skills excluded because it sees its own; the reference path `${CLAUDE_PLUGIN_ROOT}/reference/consult.md`, with its contents inlined instead if the path does not resolve; and that it must return the document as its final message and write no file, because the store is this command's and the agent must not learn where it is.
  - Step: validate what came back against the reference before showing it — `# Consult — #<n>` is the only top-level `#` heading, splitting on unfenced headings only; `## Verdict` holds one row with one of the three words; every `## Dependencies` row carries `known` or `unknown` with a basis; `## What to do next` names one of the three courses. Then check for over-delivery: any task breakdown, `depends_on`, `files:` or `acceptance:` line, or any `## Stack readiness`, `## Verification` or `## Scale` section is a defect — re-dispatch rather than printing it.
  - Step: print the document. Nothing is filed, so the printed document is the deliverable — say that out loud, along with the fact that no comment, label or field was written.
  - Step: translate the course into the command that performs it — `accept` → `/corporate:brief --promote <n>` then `/corporate:design <n>`; `amend` → `/corporate:brief --update <n>`; `set aside` → nothing to run, it stays in `Draft`. Do not run any of them.
  - Step: if the consultant filed an HR record, surface that it did and name `/corporate:hr`. Do not run it.
  - Add a `## Gate` section: stop. The verdict is advisory and gates nothing — `/corporate:design` may be run whatever it said, and it still rules `## Stack readiness` on its own. A `blocked` verdict is not a `Blocked` issue and nothing here moves one. Re-run this command after amending the brief for a fresh read.
  - Add one line stating that there is no `consult` artifact kind on purpose: a filed read goes stale against the next amendment, and re-running is the freshness guarantee.

## T4 — Register the command, the role and the reference
depends_on: none
files: README.md, CLAUDE.md, plugins/corporate/skills/corporate-pipeline/SKILL.md, plugins/corporate/.claude-plugin/plugin.json
acceptance: `bun run validate` exits 0, and `grep -q ':consult' README.md && grep -q 'consultant' README.md && grep -q 'consult.md' CLAUDE.md && grep -q 'consult' plugins/corporate/skills/corporate-pipeline/SKILL.md && grep -q '"version": "4.4.0"' plugins/corporate/.claude-plugin/plugin.json` exits 0
steps:
  - `README.md:413` — add `:consult` to the slash-command row. `README.md:414` — add `consultant` to the subagent row. `README.md:415` — add `consult.md` to the Reference row with a clause: the feasibility read's verdicts and why it settles nothing.
  - `README.md:236-245` — add one row to the roles table, placed directly after `product-owner`: `consultant` | decides whether a drafted issue looks buildable, and which of the things it depends on this team already documents | cannot choose an approach, name a library, write a breakdown, or change anything about the issue.
  - `README.md` — add one short paragraph in `## The pipeline`, after the paragraph about the two stages at its ends (around `:19-24`): `/corporate:consult <issue>` reads a drafted issue and comes back `buildable`, `reservations` or `blocked`, with one line per thing the ask depends on and whether a playbook covers it. It files nothing, changes no state, and gates nothing — the design still rules stack readiness on its own.
  - `CLAUDE.md:32-38` — add `consult` to the shipped commands list, and change "eight reference docs" to nine, adding `consult.md` to that list.
  - `CLAUDE.md` — add a short "Also shipped:" paragraph after the HR one (around `:55-58`) naming `/corporate:consult`, the `consultant` role and `reference/consult.md`: the advisory pre-design read, writes nothing, chained by nothing. Do not touch the pre-existing "seven role agents" count; it is out of scope here.
  - `CLAUDE.md` — add one `## Conventions` bullet in the house voice: the consult is advisory and that is structural, not stylistic. It writes nothing — no artifact kind, no state change — because a filed feasibility read goes stale against the next amendment; and it settles nothing downstream, because the design's own stack ruling is what `/corporate:design` and `/corporate:build` gate on. `reference/consult.md` is the only definition.
  - `plugins/corporate/skills/corporate-pipeline/SKILL.md` — add a row to the `## Outside the pipeline` table: `/corporate:consult <issue>` | `consultant` | before promoting a `Draft`, when it is not obvious the ask is doable. Add a row to `## Choosing an entry point` (`:134-155`), directly after the `Draft` row: the issue is a `Draft` and you do not know whether it is worth designing → `consult <issue>`. Add `consultant` to the do-not-dispatch-yourself list at `:161-163`. Do not restate the verdict words or the command's steps — point at the command and stop, per the router's own single-source rule.
  - `plugins/corporate/.claude-plugin/plugin.json` — bump `version` from `4.3.0` to `4.4.0`.

## Test suites

| Suite | Layer | Command | Setup |
|---|---|---|---|
| structure | integration | `bun run validate` | — |

## Waves

| Wave | Tasks | Runs in parallel |
|---|---|---|
| 1 | T1, T4 | yes — two disjoint file sets |
| 2 | T2, T3 | yes — two disjoint file sets, both needing T1's file on the branch |
