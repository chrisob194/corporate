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
2. Determine the range under review. Default to the merge commits produced by
   `/corporate:build $1` — find them with
   `git log --oneline --grep="corporate/$1/"`. If `$2` was given, use it. State
   the range you settled on before dispatching.
3. Dispatch the `reviewer` subagent with a brief containing:
   - the design and plan paths,
   - the commit range and the diff command that produces it,
   - the output path `docs/corporate/$1/review.md`.
4. Report the verdict and the blocking findings only. Point at the file for the
   rest.
5. Confirm the reviewer changed nothing: `git status --short` must be unchanged
   except for `review.md`. If anything else moved, say so — a reviewer that
   edited code invalidates its own review.

## Gate

Stop. Findings are reported, never auto-fixed by this command. The user decides:
fix directly, re-plan the affected tasks, or accept them. Do not offer to fix
them in the same breath as reporting them.
