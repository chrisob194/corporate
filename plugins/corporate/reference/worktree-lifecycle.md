# The worktree lifecycle

How a run isolates itself, where code lands, and the two outward actions that
end a passing run. `/corporate:run` reads this; `/corporate:qa` reads it for
the branch rule. `/corporate:brief`'s spec mode is the first to create the
worktree for an issue filed directly — `/corporate:split`'s convert flow does
the same for each child it creates — every later stage, including
`/corporate:design`, enters the one already there rather than creating its
own. This file is the only definition of the protocol.

Why it exists: an issue is worked end to end in its own git worktree, on its own
branch, so that two Claude Code instances can work two issues at the same time
without sharing a checkout, an index, or a HEAD. The only thing they share is
the issue store, and one issue is one record there.

Spec, design, plan and review are files on the branch at
`docs/corporate/<n>/<kind>.md`, written and committed by the orchestrator; the
issue store keeps a note pointing at each. Every other artifact kind, and the
issue record itself, stays in the store. `reference/issue-store.md` defines the
path, the note and the commit, and this file does not restate them.

## Branch and worktree layout

```
corporate/<n>/work        <- the issue's branch: builder merges land here
corporate/<n>/<task-id>   <- one builder, one worktree, merged into work
```

The integration branch is `corporate/<n>/work` and not `corporate/<n>`
because git stores refs as paths: `corporate/<n>` and
`corporate/<n>/T1` cannot both exist. `work` is reserved — a plan task with
the id `work` is a plan defect.

## Entering an issue

1. **The launch checkout may be dirty, and you leave it alone.** The worktree is
   a separate directory branched from the remote's default branch, so whatever
   the user has in progress is untouched and irrelevant to this run. Never
   stash, reset, switch or commit in their checkout — that work is theirs, and
   not having to interrupt it is the point of working in a worktree.
2. **Enter the worktree**: `EnterWorktree` with
   `name: corporate/<n>/work`. It creates the worktree under
   `.claude/worktrees/`, creates the branch, and moves the session into it. The
   `/work` segment is not decoration — see the layout rule above.
3. Record the worktree path and the branch on the issue record (`worktree`,
   `branch`), per `reference/issue-store.md`, and say both out loud.
4. **Re-entering** an issue whose worktree already exists: `EnterWorktree` with
   `path:` set to the recorded path. Do not create a second worktree for one
   issue — two worktrees on one branch is a state git refuses and a state the
   activity log cannot describe.

**If `EnterWorktree` is unavailable**, fall back to
`git worktree add <path> -b corporate/<n>/work` and say plainly that the
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
- The orchestrator's write-and-commit of a spec, design, plan or review is one
  uninterrupted sequence, and it always runs after the stage's own clean-tree
  assertion — so the tree is clean again before anything inspects it.
- **Only builders commit code.** Each works in its own worktree
  (`Agent(isolation: "worktree")`), on `corporate/<n>/<task-id>`, and commits
  there. Worktrees share the repository's refs, so the branch is reachable by
  name without knowing the worktree path.
- The orchestrator's git operations are the artifact commits at
  `docs/corporate/<n>/<kind>.md`, the wave merges
  (`git merge --no-ff corporate/<n>/<task-id>`), the push, and the pull
  request. It still writes and edits no source file, and fixes nothing.
- On a merge conflict in a **wave** merge: `git merge --abort`, then treat it
  as a plan defect — two tasks in one wave shared a file. The fix is a
  `depends_on` in the plan, never a hand-merge. A conflict in the close-out
  merge is a different thing entirely — see *Leaving*.

## Leaving

**A passing run** — the review passed and the issue is going to `Closed`:

1. **Bring the default branch in before anything goes out.** In the issue's
   worktree, `git status --short` must be empty — the same rule the wave
   merges already carry, above. If there is no `origin`, there is nothing to
   bring in: skip this step, say so, and let the no-`origin` clause at the end
   of this file govern the rest of close-out. Otherwise `git fetch origin`,
   then resolve the default branch `<D>`: `git symbolic-ref --short
   refs/remotes/origin/HEAD`, stripping the `origin/` prefix. If that ref is
   not set, fall back to `git ls-remote --symref origin HEAD` and read `<D>`
   from its `ref: refs/heads/<D>` line. The default branch name is never
   guessed — a wrong guess either fails noisily or merges the wrong line of
   development. The fallback is the ordinary path here, not a rare one: a
   worktree this pipeline created usually has no
   `refs/remotes/origin/HEAD` set at all, so expect to take it. Then
   `git merge --no-edit origin/<D>`. Plain `merge`, not `--no-ff`: with the
   branch's own commits already present a fast-forward is impossible anyway,
   and in the one case where it is possible there is nothing on the branch
   worth a manufactured merge commit. Never `rebase` — this file's own Never
   list forbids rewriting history, and the issue's `path @ sha` artifact notes
   would dangle if it did.

   Three outcomes:
   - **`Already up to date.`** — nothing came in. Close-out proceeds
     unchanged.
   - **A merge commit.** It is the orchestrator's, in the same class as its
     artifact commits, and the push below carries it.
   - **Non-zero exit.** Discriminate once with
     `git diff --name-only --diff-filter=U`. Non-empty means a genuine
     conflict: `git merge --abort`, no push, no pull request — the caller
     decides what that means. Empty means the merge never started, which is a
     delivery failure, not a conflict.

   A failed `git fetch` or an unresolvable default branch is a delivery
   failure too: no push, no pull request — the branch was not brought up to
   date. The existing no-`origin`/no-`gh` clause below governs what happens
   next in either case.
2. `git push -u origin corporate/<n>/work`.
3. `gh pr create` with the issue's title, and a body carrying the spec's
   functional requirements, the artifact set and the activity log — and **no
   closing keyword**.
   `Closes #<n>` and its variants are forbidden: the issue is moved to `Closed`
   by this pipeline when the pull request *opens*, and the record is itself a
   GitHub issue, so GitHub would try to close it a second time on merge.
4. Write the PR URL to the record's `pr` field before anything else — a PR that
   exists and is recorded nowhere is a PR nobody will find.
5. `ExitWorktree` with `keep`.

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
component of this plugin makes it. The close-out `git fetch` in *Leaving* is a
read of the same remote and sends nothing, so that sentence still holds.

The issue store's own traffic is not covered by that sentence and is not this
file's business: the store is a remote tracker, and `reference/issue-store.md`
owns what that costs.

If there is no `origin`, or `gh` is missing or unauthenticated: say so, leave
the branch local, record that in the activity log, and still move the issue to
`Closed` — the work is done and reviewed; only its delivery is stuck. Name what
the user has to run.

That clause is about **delivery**, and it is not permission to skip a store
write. A `Closed` that could not be recorded is not a `Closed`; the store says
what a failed write does, and for an unattended run
`/corporate:run` ends it as `store-unreachable` rather than claiming a state
it never set.

## Never

- `git add -A`, `git add .`, or `git commit -a` anywhere. Stage the paths you
  wrote.
- Amend, rebase, reset, or force anything. Every stage appends.
- Merge `corporate/<n>/work` into anything, locally or via the PR. Bringing
  the default branch *into* `corporate/<n>/work` at close-out is the opposite
  direction and is required — see *Leaving*.
- Stage or commit anything outside `docs/corporate/<n>/` as part of an artifact
  commit. A subagent writes or commits a spec, design, plan or review file:
  never — those files are the orchestrator's alone.
- Commit an HR record. `.corporate/` is gitignored precisely so a write-less
  role can file one without dirtying the tree.
