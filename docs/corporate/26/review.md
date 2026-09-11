# Review — #26

**Verdict:** pass with findings
**Defect origin:** none

All four tasks were built to their stated scope and acceptance, the three new files agree on one grammar, all seven acceptance criteria hold for the case the brief is framed on, and the two findings below are real but tail-case and advisory-only, so neither blocks.

## Acceptance

All commands run from `/home/christian/Projects/corporate/.claude/worktrees/corporate-26-work`.

**Suite `structure` (integration, the plan's only declared suite)** — `bun run validate`:
```
$ bun scripts/validate.ts
OK — 0 warning(s).
EXIT=0
```

**T1** — `bun run validate` exits 0 (above), and the grep chain over `plugins/corporate/reference/consult.md` for `buildable`, `reservations`, `unknown`, `What to do next`: `EXIT=0`. **pass**

**T2** — `bun run validate` exits 0 and reports no error for `plugins/corporate/agents/consultant.md`. Output is `OK — 0 warning(s)`, i.e. no error line for any file. I checked what this actually proves by reading `scripts/validate.ts:128-143` and `:183-198`: `name: consultant` equals the filename, `description` is present, `model: opus` / `effort: medium` are in the legal sets (and `effort` is not warned as a no-op because the model is pinned), and the `${CLAUDE_PLUGIN_ROOT}/reference/consult.md` pointer on `consultant.md:37,62` resolves. **pass**

**T3** — `bun run validate` exits 0 with no error for `plugins/corporate/commands/consult.md`, and `grep -q 'reference/consult.md' plugins/corporate/commands/consult.md`: `EXIT=0`. **pass**

**T4** — the five-way grep chain (`:consult` in README, `consultant` in README, `consult.md` in CLAUDE.md, `consult` in the router SKILL, `"version": "4.4.0"` in `plugin.json`): `EXIT=0`, with `bun run validate` exiting 0. **pass**

**Regression, not required by the plan** — `bun test`: `7 pass, 0 fail`. The design ruled `unit` `not-required` on the basis that no task touches `scripts/validate.ts`; the diff confirms it does not.

One count claim the acceptance grep does not cover, so I checked it by hand: CLAUDE.md now says "nine reference docs", and `ls plugins/corporate/reference/` returns exactly 9. No other prose count in `README.md` / `CLAUDE.md` / the router skill is invalidated by this diff (the only remaining number words are "sixteen stack playbook skills", untouched).

## Design drift

None. Each of the design's four parts is present as specified: the reference owns the grammar and carries the load-bearing "Why it settles nothing" section (`plugins/corporate/reference/consult.md:8-16`), stating in writing that the consult is never a precondition for `/corporate:design` or `/corporate:build` and that the design's `## Stack readiness` ruling stays independent and defined only in `reference/stack-readiness.md` — the invariant is built, not merely claimed. The agent has exactly the tool grant the design fixed (`Read, Grep, Glob, Skill, WebFetch`, `opus`/`medium`, no `WebSearch`, no `Bash`/`Write`/`Agent`) and states the `WebSearch` absence as deliberate at `consultant.md:49-50`. The command skips only the write-permission preflight row and says why (`commands/consult.md:19-24`); I verified against `reference/issue-store.md:62-72` that this row is the *only* write in the preflight, and against `issue-store.md:527-545` that "Finding an issue" is one read-only `gh issue view` — so criterion 4 holds by construction, not by promise. No `consult` artifact kind, label, marker or state appears anywhere in the three new files.

## Plan drift

None. Every task commit touched exactly its `files:` list and nothing else: `74c691e` (T1) one file; `dcced69` (T4) the four registration files; `fdb5f22` (T2) one file; `85630db` (T3) one file. The only other content on the branch is `docs/corporate/26/{design,plan}.md` from `932ba64`, which is the pipeline's own artifact commit. The plan's ordering constraint was real and was honoured — T2 and T3 landed after T1, which they needed because `scripts/validate.ts:183-198` errors on an unresolvable `${CLAUDE_PLUGIN_ROOT}` pointer.

Grammar consistency across the three files, checked term by term: verdict words (`buildable` / `reservations` / `blocked`), coverage words (`known` / `unknown`) and courses (`accept` / `amend` / `set aside`) are identical in `reference/consult.md`, the agent's `## Report` block (`consultant.md:67-73`) and the command's validation and translation steps (`commands/consult.md:46-64`). The agent restates only the report block and defers the document grammar to the reference (`consultant.md:62-65`), as T2 step 12 required. Criterion 5's rejection rule is genuinely implemented, not merely described: `commands/consult.md:54-56` names task breakdown, `depends_on`, `files:`, `acceptance:`, `## Stack readiness`, `## Verification` and `## Scale` as defects and re-dispatches rather than printing, matching `reference/consult.md:86-92`.

## Correctness

Two findings, neither blocking.

**1. `plugins/corporate/commands/consult.md:60-64` — the course→command translation assumes the issue is a `Draft`, but the command deliberately runs on any state.** Not blocking: named, never run, and the actual state was printed one step earlier.

The concrete failure: consult an issue in `Blocked` (step 5 explicitly says to carry on whichever state it is in, and the design rejected restricting to `Draft` at `design.md:201-204`). The consultant returns `buildable` / `accept`. The command then prints `/corporate:brief --promote <n>` as the thing to run — and `plugins/corporate/commands/brief.md:118-123` stops on a non-`Draft` issue and says which state it is in. The correct command there is `--unblock <n>`. The `set aside` branch is worse in kind though harmless in effect: it prints "the issue stays in `Draft`" for an issue that is in `Open`, `Blocked` or `Closed` — a state assertion contradicted by the line the same run printed at step 5. The cost is one wasted invocation and one false sentence, which is why this is not blocking; the fix is one conditional clause. For the record, this is inherited rather than introduced: the plan fixes the mapping verbatim at T3 step 13, and the design at `design.md:94-97`, while separately fixing the any-state posture — so the two decisions were already in tension before anyone built.

**2. `plugins/corporate/reference/consult.md:60-67` with `:52-58` — the two-word coverage vocabulary has no slot for "this team plainly knows it, but no playbook covers it", which pushes in-house asks toward `blocked`.** Not blocking: it does not violate criterion 2, which is itself worded as exactly this binary ("something nobody here has established guidance for yet"), and the verdict words are all three present and distinct, which is what criterion 3 asks.

The concrete failure: consult issue #26 itself. Its central dependency is the Claude Code plugin markdown format. No playbook skill covers it, so `Coverage` is forced to `unknown` (`known` is defined solely as "a playbook skill covers it"). The ask rests on that dependency, so the `blocked` row applies verbatim — "the ask rests on an `unknown` dependency" — and `:56-58` breaks the tie toward the more cautious word. The verdict is `blocked` for work that was in fact built and passes. `stack-readiness.md:45-46` has a third word, `not-required`, precisely for "touched, but no decision turns on stack-specific fact", and the architect used it for this exact stack in `design.md:159`. The design rejected reusing that vocabulary for good reason (`design.md:197-200`), but it dropped the third *distinction* along with the words. The escape hatch that exists — the consultant may judge such a dependency peripheral and use `reservations` — is judgement the reference does not direct, and `:56-58` actively pushes the other way. If this is worth a fix, it is a clause in `reference/consult.md`, not a rebuild.

## Taste

Not blocking, take or leave.

- `README.md:244` reads `| consultant | decides whether a drafted issue looks buildable… | cannot choose an approach… |`. The columns are already headed *Decides* and *Notably cannot*, and no other row repeats the verb. The plan dictated this wording at T4 step 2, so it is faithful, not sloppy.
- `CLAUDE.md` now names `consult` twice — once inside the "pipeline commands" list at `:32-34` and once in its own "Also shipped" paragraph at `:61-63`. `split` already sits in both places, so there is precedent and no contradiction, but `hr`, `deploy`, `diagnose` and `rollback` each appear once, in their own paragraph only.
- `commands/consult.md:56` says "Re-dispatch rather than printing it" with no cap on re-dispatches. `commands/design.md:86-131` has the same unbounded shape, so this is house pattern rather than a new gap — worth naming only because the over-delivery trigger list includes strings a consult about *this plugin* could legitimately discuss in prose (an issue proposing to relax the `## Stack readiness` duty, say). The word "section" in the check is what keeps that from firing; it is load-bearing and easy to lose in a later edit.
