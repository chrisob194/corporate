# The slug branch, and the commit gate

How the in-repo stages share a branch and hand off through commits.
`/corporate:design`, `/corporate:plan`, `/corporate:review` and `/corporate:qa`
read this; `/corporate:build` reads it for the branch rule only. This file is the
only definition of the protocol.

Why it exists: `/corporate:build` requires a clean working tree, because the
merges it runs would otherwise swallow uncommitted work. Every stage before it
writes a file. So each stage commits what it wrote, and the next stage starts
clean.

## Branch layout

One integration branch per slug, and one branch per build task under it:

```
corporate/<slug>/work        <- design, plan, review, qa artifacts + merged tasks
corporate/<slug>/<task-id>   <- one builder, one worktree, merged into work
```

The integration branch is `corporate/<slug>/work` and not `corporate/<slug>`
because git stores refs as paths: `corporate/<slug>` and
`corporate/<slug>/T1` cannot both exist. `work` is reserved — a plan task with
the id `work` is a plan defect.

## Entering a stage

1. **Clean tree.** `git status --short` must be empty. If it is not, stop and
   show it; the user commits or stashes. Never stash, reset, or commit on their
   behalf — untracked work is theirs.
2. **Branch.** `git branch --list corporate/<slug>/work`:
   - it exists ⇒ `git switch corporate/<slug>/work`,
   - it does not ⇒ `git switch -c corporate/<slug>/work`, and say which branch
     it was created from. `/corporate:design` is normally the stage that creates
     it; a later stage creating it means an earlier artifact was committed
     somewhere else, so report that rather than glossing over it.
3. **Refuse a task branch.** If HEAD is `corporate/<slug>/<task-id>`, stop.
   That is a builder's branch, its worktree may still be live, and committing an
   artifact onto it would arrive in the next merge as a surprise. Name the
   `git switch corporate/<slug>/work` that fixes it.

## The commit gate

After the stage's own checks pass, and before reporting itself done:

1. Show `git status --short` and the diff of the artifact
   (`git diff -- docs/corporate/<slug>/`, plus the test paths for `qa`).
2. **Ask once**, naming the exact commit message. One confirmation per stage,
   never batched with the stage's other decisions and never assumed from an
   earlier yes.
3. Stage only the stage's own files by path, then commit:

   | Stage | Commit |
   |---|---|
   | design | `docs(corporate): design for <slug>` |
   | plan | `docs(corporate): plan for <slug>` |
   | review | `docs(corporate): review for <slug>` |
   | qa | `test(corporate): qa for <slug>` |

4. Report the short sha and `git status --short`, which must now be empty.

Declined confirmation is a valid end: the artifact stays uncommitted, and the
stage says plainly that the next stage will stop on the clean-tree check.

## Never

- `git add -A`, `git add .`, or `git commit -a`. Stage the paths you wrote. A
  stage that sweeps up the user's unrelated edits has forged their authorship.
- Amend, rebase, reset, or force anything. Every stage appends.
- Push, open a pull request, or merge `corporate/<slug>/work` anywhere. Getting
  the branch out is the user's decision and no command in this plugin makes it.
- Commit an HR record. `.corporate/` is gitignored precisely so a write-less
  role can file one without dirtying the tree its own stage checks.
- Treat the commit as approval of the content. The gate the stage already has —
  do not run the next command — still stands after it.
