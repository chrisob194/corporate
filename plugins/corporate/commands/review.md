---
description: Dispatch the reviewer to check the built work against its design and plan, and for correctness — with the defect classified by origin.
argument-hint: <issue> [commit-range]
---

# Review

Issue: `$1` · Range: `${2:-HEAD}`

Stage 4 of 4. A fresh, write-less reviewer checks three things: did we build the
design, did we follow the plan, is the code correct — and classifies every
blocking finding by the stage that made it unavoidable.

## Steps

1. Normalise and resolve `$1` per
   `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md`, whose preflight runs
   first. `<n>` below is that number.
   The record must hold both a `design` and a `plan` artifact. Missing either,
   stop — drift cannot be measured against a document that does not exist.
   If the record holds a `split` artifact, this issue is a parent, not a work
   issue — its work lives in its children and its `plan` artifact is
   superseded. Hard stop; name `/corporate:split <n> --status`.
   `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` is the definition, not
   repeated here.
   Otherwise, read the documents themselves from `docs/corporate/<n>/design.md`,
   `docs/corporate/<n>/plan.md` and `docs/corporate/<n>/spec.md` — working tree
   first, else `git show corporate/<n>/work:<path>`, else hard stop naming the
   path and the branch, never the note.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/worktree-lifecycle.md` and follow its
   *Entering an issue* section: the issue's worktree on `corporate/<n>/work`. The
   build merged into that branch; reviewing from anywhere else reviews a
   different tree. **Hard stop, not a warning.**
3. Determine the range under review. Default to the merge commits produced by
   `/corporate:build <n>` — find them with
   `git log --oneline --grep="corporate/<n>/"`. If `$2` was given, use it. State
   the range you settled on before dispatching.
4. Dispatch the `reviewer` subagent with a brief containing:
   - the design and the plan **inlined in full**,
   - the spec's `## Functional requirements` and `## Non-goals`, inlined — a
     `design` origin has to be argued against those, so the reviewer must
     have them,
   - the commit range and the diff command that produces it,
   - that it must return the review as its final message and write no file.
5. Confirm the reviewer changed nothing: `git status --short` must be empty. If
   anything moved, say so and do not file the review — a reviewer that edited
   code invalidates its own review. The records directory is gitignored, so a
   filed HR record does not affect this check. The write-and-commit in step 6
   happens only after this check passes, so the check still measures the
   reviewer and not the orchestrator.
6. File it: write `docs/corporate/<n>/review.md` with the returned review
   verbatim, commit it per the store reference's
   `### Relocated kinds — spec, design, plan and review`, then post the note numbered
   one higher than the highest existing review, carrying the path and that
   commit's short sha, then append the activity line with the verdict and the
   defect origin. **Never overwrite a review** in the sense that applies now:
   never re-use or renumber a note; the file is overwritten on purpose and its
   history is the sequence.
7. Report the verdict, the defect origin, and the blocking findings only. Point
   at the file for the rest.
8. If the reviewer filed an HR record, surface that it did and name
   `/corporate:hr`. Do not run it.

## Gate

Stop. Findings are reported, never auto-fixed by this command. The user decides:
fix directly, re-plan the affected tasks, or accept them.

The defect origin says which stage the work would go back to —
`implementation` to the builders, and `plan` and `design` both to the
technical architect — but this command does not act on it. Routing automatically is
`/corporate:run`'s job, and it is the difference between the two commands.
`/corporate:qa <n>` is the stage after this one, and it is the user's call
whether to run it.
