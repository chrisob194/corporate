# Review — #25

**Verdict:** pass with findings
**Defect origin:** none

Every task's acceptance command passes on this tree, the four intake surfaces plus the manifest match the design's retirement of the blocking path, and cycle 1's finding is genuinely fixed — `Open` now carries two confirmations, `Draft`/`Blocked` zero, `Closed` still refuses.

## Acceptance

All commands run from the issue's worktree, branch `corporate/25/work`.

| Task | Command | Result |
|---|---|---|
| T1 | `bun run validate` | exit `0` — `OK — 0 warning(s).` **pass** |
| T1 | `grep -c 'NEEDS CLARIFICATION' plugins/corporate/agents/product-owner.md` | `1` (≥1 required) **pass** |
| T1 | `grep -c 'blocked on answers\|## Unanswered' plugins/corporate/agents/product-owner.md` | `0` **pass** |
| T2 | `grep -c 'blocked on answers' plugins/corporate/commands/brief.md` | `0` **pass** |
| T2 | `grep -c 'NEEDS CLARIFICATION' plugins/corporate/commands/brief.md` | `4` (≥1 required) **pass** |
| T2 | `bun run validate` | exit `0` **pass** |
| T2 (cycle-2 addendum: `Open` shows two confirmations, `Draft`/`Blocked` zero, `Closed` refuses) | read `plugins/corporate/commands/brief.md:229-258` | table rows 233-236 and flow steps 1 / 5 agree; **pass** — see below |
| T3 | `grep -c 'blocked on answers' plugins/corporate/commands/split.md` | `0` **pass** |
| T3 | `bun run validate` | exit `0` **pass** |
| T4 | `grep -c 'interviews you\|blocking question unanswered' README.md` | `0` **pass** |
| T4 | `grep -c 'The ask cannot fail' plugins/corporate/skills/corporate-pipeline/SKILL.md` | `0` **pass** |
| T4 | `bun run validate` | exit `0` **pass** |
| T5 | `grep -c '"version": "4.2.0"' plugins/corporate/.claude-plugin/plugin.json` | `0`; file now reads `"version": "4.3.0"` **pass** |
| T5 | `bun run validate` | exit `0` **pass** |

Declared suite (`## Test suites`): `structure` / integration / `bun run validate` — exit `0`. Also ran `bun test` (not required by the plan; the design ruled unit `not-required`): `7 pass, 0 fail`. `git status --short` in this worktree is empty.

**Verification of the cycle-1 fix, done independently of `6526691`'s commit message.** On `--update`:
- `Draft` / `Blocked`: step 1 reads the brief but prints and confirms nothing (`brief.md:244-247`, gated `On Open only`); step 5 is gated `On Open only` (`:257`). Zero confirmations, one dispatch, one write. Matches the design's "the pre-write confirmation is dropped on `Draft` and `Blocked`".
- `Open`: step 1 prints title + brief in full and confirms (first), step 5 shows old/new criteria side by side and confirms (second), both strictly before the write at step 6. The second still names the in-flight run and the artifacts filed against the old criteria, via the table row it points at (`:235`). Criterion 6 holds.
- `Closed`: still `refuse. Name filing a new issue` (`:236`), with the rationale paragraph intact.

## Design drift

None. The design's five carried elements are all present and exact: the literal token `[NEEDS CLARIFICATION: <question>]` (`product-owner.md:70`, `brief.md:202,211,255,271`, `split.md:85`); the cap of three (`product-owner.md:71-73`, `Never` at `:92`); the deletion of `**Status:** ready | blocked on answers` and `## Unanswered`; the five downstream-read headings (`## Problem`, `## Acceptance criteria`, `## Non-goals`, `## Second ticket`, `## Loop hints`) preserved byte-for-byte in the Output block; the store untouched (`reference/issue-store.md` is not in the diff, so criteria 5 and 6 hold by construction). `design-loop.md`, `loop-engineer.md`, `loop-design.md` and `docs/authoring.md` are untouched, per the Phase A loop-hints ruling and the design's explicit out-of-scope note. A repo-wide sweep for the retired vocabulary (`blocked on answers`, `## Unanswered`, `Status:** ready`, `interviews you`, `blocking question`, `could actually fail`) finds hits only under `docs/corporate/25/` — the pipeline's own artifacts quoting themselves — plus `product-owner.md:13`, discussed under Taste.

## Plan drift

One deviation, non-blocking and design-conformant:

- `plugins/corporate/commands/brief.md:235` — T2's plan step said "Leave the `Open` row (second confirmation, naming a possible in-flight run) … exactly as written"; the row was rewritten to "**two** confirmations: first, the current title and brief shown in full; second, …". Following the plan literally is what produced cycle 1's defect: the pre-change flow's only unconditional print-in-full became `Open`-gated, so a row promising "a **second** confirmation" pointed at a first that no longer existed anywhere. The rewrite restores exactly the guarantee the design demands ("on `Open` **both** confirmations stay") and names where each one lands. Recorded as drift because it is a deviation from the written step, not because it is wrong — this is the plan step that was structurally faulty, and the build is now more correct than the plan.

Scope: every commit in `bd4252e..HEAD` touched only its task's `files:` list — `f246d42` product-owner.md only; `0c3b793` and `6526691` brief.md only; `4347db8` split.md only; `f0793d6` README.md + SKILL.md only; `efa3dc3` plugin.json only. The remaining commits are merges and the orchestrator's `docs/corporate/25/` artifacts. No change in the diff that no task asked for.

Renumbering, checked by hand rather than by claim: `brief.md`'s filing flow is now 1-7 with no internal cross-reference to a moved number; `brief.md:225` ("the ordering in step 6") still resolves to the `--update` flow's write step, which kept its number; `split.md` is now 1-15 with the `--status` section and the `Gate` referencing no step number at all. Repo-wide grep for `step [0-9]` finds no dangling reference into either file.

## Correctness

No blocking findings. Two candidates tried and refuted:

- `plugins/corporate/agents/product-owner.md:69-73` vs `:85` — Method 7 orders the agent to "take an informed default on the rest" once three markers are spent, while `## Never` still forbids softening "this is unanswerable as asked" into a guess. Worst-case input tried (an ask with five genuine forks, e.g. "add rate limiting"): the agent must default on two of them, which reads as forbidden. Not an unavoidable contradiction — `Never` targets a *hedged* guess, and Method 2 already licenses stating plainly that something could not be inferred, so a clean informed default satisfies both. Tension, not a defect. Listed under Taste.
- `plugins/corporate/commands/brief.md:201-203` — the file/library/pattern check now has no stated consequence in the filing flow (`split.md:86-88` says "re-dispatched, not filed"; `brief.md` says only "Check that"). Checked the pre-change text: the only consequence sentence there ("say so rather than filing it") attached to the falsifiability clause the design deleted, so this gap predates the diff rather than being introduced by it, and T2's step told the builder to delete exactly that sentence. Not a finding against this work.

## Taste

Not blocking, and none of it should hold this issue.

- `plugins/corporate/agents/product-owner.md:13-15` — `## Role` still opens "Turn a request into criteria that can fail. Your value comes from blocking work, not producing it — the one role whose success sometimes looks like nothing happening." Under the new contract the agent always returns a brief, so "success looks like nothing happening" is no longer reachable. The design said "keep the role, replace its method" and T1 was told to leave `## Role`'s boundaries alone, so the builder was right not to touch it; criterion 7 is met mechanically regardless (there is no status field, no `## Unanswered`, and `Never: Ask the requester anything`). Worth a one-line rewrite the next time this file is opened.
- `plugins/corporate/commands/brief.md:246-247` — the first `Open` confirmation does not say what the user is confirming (it lands before the change text is even collected at step 2). Reading it as "yes, this is the record I mean to amend" is the only sensible one, but naming it would cost a clause.
- `plugins/corporate/commands/brief.md:201-203` — the asymmetry with `split.md:86-88` noted above: same check, one file says what happens on failure and the other does not.
