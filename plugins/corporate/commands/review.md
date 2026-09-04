---
description: Dispatch the reviewer to check the built work against its design and plan, and for correctness — with the defect classified by origin.
argument-hint: <slug> [commit-range]
---

# Review

Slug: `$1` · Range: `${2:-HEAD}`

Stage 5 of 5. A fresh, write-less reviewer checks three things: did we build the
design, did we follow the plan, is the code correct — and classifies every
blocking finding by the stage that made it unavoidable.

## Steps

1. Resolve `$1` per `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` and the
   mapping doc it names for the resolved backend, whose preflight runs first.
   The record must hold both a `design` and a `plan` artifact. Missing either,
   stop — drift cannot be measured against a document that does not exist.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/worktree-lifecycle.md` and follow its
   *Entering an issue* section: the issue's worktree on `corporate/$1/work`. The
   build merged into that branch; reviewing from anywhere else reviews a
   different tree. **Hard stop, not a warning.**
3. Determine the range under review. Default to the merge commits produced by
   `/corporate:build $1` — find them with
   `git log --oneline --grep="corporate/$1/"`. If `$2` was given, use it. State
   the range you settled on before dispatching.
4. Dispatch the `reviewer` subagent with a brief containing:
   - the design and the plan **inlined in full**,
   - the issue's acceptance criteria, inlined — a `design` origin has to be
     argued against those, so the reviewer must have them,
   - the commit range and the diff command that produces it,
   - that it must return the review as its final message and write no file.
5. Confirm the reviewer changed nothing: `git status --short` must be empty. If
   anything moved, say so and do not file the review — a reviewer that edited
   code invalidates its own review. The records directory is gitignored, so a
   filed HR record does not affect this check.
6. File it: record it as the `review` artifact numbered `<n>`, one more
   than the highest existing review number. **Never overwrite a review** — the
   sequence is the record of how many cycles the work took. Add the artifact row
   and append the activity line carrying the verdict and the defect origin.
7. Report the verdict, the defect origin, and the blocking findings only. Point
   at the file for the rest.
8. If the reviewer filed an HR record, surface that it did and name
   `/corporate:hr`. Do not run it.

## Gate

Stop. Findings are reported, never auto-fixed by this command. The user decides:
fix directly, re-plan the affected tasks, or accept them.

The defect origin says which stage the work would go back to —
`implementation` to the builders, `plan` to the planner, `design` to the
architect — but this command does not act on it. Routing automatically is
`/corporate:ship`'s job, and it is the difference between the two commands.
`/corporate:qa $1` is the stage after this one, and it is the user's call
whether to run it.
