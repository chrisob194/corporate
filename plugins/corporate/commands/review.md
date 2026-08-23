---
description: Dispatch the reviewer to check the built work against its design and plan, and for correctness.
argument-hint: <slug> [commit-range]
---

# Review

Slug: `$1` · Range: `${2:-HEAD}`

Stage 4 of 4. A fresh, write-less reviewer checks three things: did we build the
design, did we follow the plan, is the code correct.

## Steps

1. Require both `docs/corporate/$1/design.md` and `docs/corporate/$1/plan.md`.
   Missing either, stop — drift cannot be measured against a document that does
   not exist.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/artifact-branch.md` and follow its
   *Entering a stage* section: clean tree, then `corporate/$1/work`. The build
   merged into that branch; reviewing from anywhere else reviews a different
   tree. **Hard stop, not a warning.**
3. Determine the range under review. Default to the merge commits produced by
   `/corporate:build $1` — find them with
   `git log --oneline --grep="corporate/$1/"`. If `$2` was given, use it. State
   the range you settled on before dispatching.
4. Dispatch the `reviewer` subagent with a brief containing:
   - the design and plan paths,
   - the commit range and the diff command that produces it,
   - the output path `docs/corporate/$1/review.md`.
5. Confirm the reviewer changed nothing: `git status --short` must show
   `review.md` and nothing else. If anything else moved, say so and do not
   commit — a reviewer that edited code invalidates its own review. The records
   directory is gitignored, so a filed HR record does not affect this check.
6. Report the verdict and the blocking findings only. Point at the file for the
   rest.
7. Commit the review per the reference's *commit gate*: one confirmation, only
   `docs/corporate/$1/review.md` staged, message
   `docs(corporate): review for $1`. The commit records the verdict; it does not
   accept it.
8. If the reviewer filed an HR record, surface that it did and name
   `/corporate:hr`. Do not run it.

## Gate

Stop. Findings are reported, never auto-fixed by this command. The user decides:
fix directly, re-plan the affected tasks, or accept them. Do not offer to fix
them in the same breath as reporting them. `/corporate:qa $1` is the stage after
this one, and it is the user's call whether to run it.
