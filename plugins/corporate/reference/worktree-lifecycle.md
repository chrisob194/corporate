# The worktree lifecycle

How a run isolates itself, where code lands, and the two outward actions that
end a passing run. `/corporate:ship` reads this; `/corporate:qa` reads it for
the branch rule. This file is the only definition of the protocol.

Why it exists: an issue is worked end to end in its own git worktree, on its own
branch, so that two Claude Code instances can work two issues at the same time
without sharing a checkout, an index, or a HEAD. The only thing they share is
the issue store, and one issue is one record there.

Nothing in the pipeline writes an artifact into the repository any more. Design,
plan and review are filed in the issue store (`reference/issue-store.md`). The
branch carries code and nothing else, which is why there is no commit gate here.

## Branch and worktree layout

```
corporate/<slug>/work        <- the issue's branch: builder merges land here
corporate/<slug>/<task-id>   <- one builder, one worktree, merged into work
```

The integration branch is `corporate/<slug>/work` and not `corporate/<slug>`
because git stores refs as paths: `corporate/<slug>` and
`corporate/<slug>/T1` cannot both exist. `work` is reserved — a plan task with
the id `work` is a plan defect.

## Entering an issue

1. **The launch checkout may be dirty, and you leave it alone.** The worktree is
   a separate directory branched from the remote's default branch, so whatever
   the user has in progress is untouched and irrelevant to this run. Never
   stash, reset, switch or commit in their checkout — that work is theirs, and
   not having to interrupt it is the point of working in a worktree.
2. **Enter the worktree**: `EnterWorktree` with
   `name: corporate/<slug>/work`. It creates the worktree under
   `.claude/worktrees/`, creates the branch, and moves the session into it. The
   `/work` segment is not decoration — see the layout rule above.
3. Record the worktree path and the branch on the issue record (`worktree`,
   `branch`), per `reference/issue-store.md` and the mapping for the resolved
   backend, and say both out loud.
4. **Re-entering** an issue whose worktree already exists: `EnterWorktree` with
   `path:` set to the recorded path. Do not create a second worktree for one
   slug — two worktrees on one branch is a state git refuses and a state the
   activity log cannot describe.

**If `EnterWorktree` is unavailable**, fall back to
`git worktree add <path> -b corporate/<slug>/work` and say plainly that the
session's working directory did not move, so paths must be written relative to
that worktree. Never silently continue on the user's own checkout — that is the
one outcome the isolation exists to prevent.

Only on that fallback does the launch checkout's state matter, and only because
`git worktree add` runs from it: if it fails for any reason, report it and stop
rather than working where you are.

## During the run

- **A clean tree still matters inside the issue's worktree.** Before each wave
  merge, `git status --short` there must be empty. It starts clean and only a
  role that broke its contract could dirty it, so treat output here as a defect
  to report, not as something to clean up.
- **Only builders commit.** Each works in its own worktree
  (`Agent(isolation: "worktree")`), on `corporate/<slug>/<task-id>`, and commits
  there. Worktrees share the repository's refs, so the branch is reachable by
  name without knowing the worktree path.
- The orchestrator's only git operations are the wave merges
  (`git merge --no-ff corporate/<slug>/<task-id>`), the push, and the pull
  request. It writes no source file and commits nothing of its own.
- On a merge conflict: `git merge --abort`, then treat it as a plan defect —
  two tasks in one wave shared a file. The fix is a `depends_on` in the plan,
  never a hand-merge.

## Leaving

**A passing run** — the review passed and the issue is going to `Closed`:

1. `git push -u origin corporate/<slug>/work`.
2. `gh pr create` with the issue's title, and a body carrying the acceptance
   criteria, the artifact set and the activity log — and **no closing keyword**.
   `Closes #<n>` and its variants are forbidden: the issue is moved to `Closed`
   by this pipeline when the pull request *opens*, and a backend where the
   record is itself a GitHub issue would then have GitHub try to close it a
   second time on merge.
3. Write the PR URL to the record's `pr` field before anything else — a PR that
   exists and is recorded nowhere is a PR nobody will find.
4. `ExitWorktree` with `keep`.

**A blocked run** — `ExitWorktree` with `keep`, and nothing else. Whatever was
built stays on the branch for the user to inspect. Do not push a blocked run:
the branch is evidence, not a proposal.

**Never `ExitWorktree` with `remove`**, and never with `discard_changes`, on a
run this pipeline drove. Cleaning up worktrees is the user's call, after they
have seen the result.

## The outward actions

The push and the pull request are the **only** things this pipeline sends to
the **code** remote, they happen once, at the end of a passing run, and nothing
here merges the pull request. Accepting the work is the user's decision and no
component of this plugin makes it.

The issue store's own traffic is not covered by that sentence and is not this
file's business: a backend may be a directory in the user's home or a remote
tracker, and `reference/issue-store.md` and its mappings own what that costs.

If there is no `origin`, or `gh` is missing or unauthenticated: say so, leave
the branch local, record that in the activity log, and still move the issue to
`Closed` — the work is done and reviewed; only its delivery is stuck. Name what
the user has to run.

That clause is about **delivery**, and it is not permission to skip a store
write. A `Closed` that could not be recorded is not a `Closed`; the store's
mapping says what a failed write does, and for an unattended run
`/corporate:ship` ends it as `store-unreachable` rather than claiming a state
it never set.

## Never

- `git add -A`, `git add .`, or `git commit -a` anywhere. Stage the paths you
  wrote.
- Amend, rebase, reset, or force anything. Every stage appends.
- Merge `corporate/<slug>/work` into anything, locally or via the PR.
- Write a design, plan or review into the repository. They belong to the issue.
- Commit an HR record. `.corporate/` is gitignored precisely so a write-less
  role can file one without dirtying the tree.
