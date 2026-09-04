---
description: Execute a plan by dispatching one builder per task in dependency waves, each in its own git worktree.
argument-hint: <slug> [--task T3] [--without-playbook <stack>]
---

# Build

Slug: `$1` · Arguments: `$ARGUMENTS`

Stage 3 of 5. One builder per task, waves in dependency order, parallel inside a
wave. Each builder works in its own git worktree so concurrent writes cannot
collide.

## Preconditions — all hard stops

1. The issue resolves to `Open` per
   `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` and the mapping doc it names
   for the resolved backend, whose preflight runs first, and the record holds a
   `plan` artifact. If not: stop, say to run `/corporate:plan $1`. **Never build
   without a plan.**
2. You are in the issue's worktree and HEAD is `corporate/$1/work`. Read
   `${CLAUDE_PLUGIN_ROOT}/reference/worktree-lifecycle.md` and follow its
   *Entering an issue* section. The worktree itself must be clean
   (`git status --short` empty) — merges land here, and uncommitted work would
   be caught in them. It started clean, so anything there is a role that broke
   its contract: report it and stop rather than tidying it away.
3. The record holds a `design` artifact and its `## Stack readiness` section
   clears this slug, read against
   `${CLAUDE_PLUGIN_ROOT}/reference/stack-readiness.md`. Any `required-missing`
   stack not named in a `--without-playbook` waiver on this invocation stops the
   build: name the stacks, their doc roots, and the waiver flag. Do this read
   yourself every run — this stage is enterable cold, and trusting that
   `/corporate:plan` checked is not checking. A builder holds no web tool, so
   past here it can only implement from memory. If the user waived stacks, say
   which before dispatching anything.
4. The plan parses against `${CLAUDE_PLUGIN_ROOT}/reference/plan-format.md`.
   Read that file — if the path does not resolve, find it under the plugin
   directory. Refuse to run, rather than guess, on: an unknown `depends_on` id, a
   dependency cycle, a duplicate task id, a task with no `acceptance` line, or a
   task with the id `work` — that name belongs to the slug's own branch.

## Wave loop

Topo-sort the tasks by `depends_on`. Wave *n* holds every task whose
dependencies are all in earlier waves. A single-task plan is one wave of one
task — the loop below is unchanged, and there is no shortcut through it. Then,
for each wave in order:

1. Dispatch every task in the wave **in parallel** — one message, one
   `Agent(subagent_type: "builder", isolation: "worktree")` call per task.
   Each brief contains:
   - the task block verbatim,
   - the parts of the design the task needs, **inlined** — a builder cannot read
     the issue store, and there is no in-repo copy to point it at,
   - the branch to commit on: `corporate/$1/<task-id>`, which the builder
     creates in its worktree (`git switch -c corporate/$1/<task-id>`),
   - the waived stacks, if this run was waived, as a standing instruction to
     file one `knowledge` HR record per stack and to name in its report every
     decision taken from memory.
2. Collect the reports. A builder that reports blocked, or acceptance failing,
   or no commit sha, is a failed task.
3. **Halt the whole build if any task in the wave failed.** Report which, with
   its output. Do not start the next wave — later tasks depend on this one and a
   half-built wave is worse than a stopped one.
4. Merge the wave's branches into `corporate/$1/work`, in task-id order:
   `git merge --no-ff corporate/$1/<task-id>`. Worktrees share the repository's
   refs, so the branch is reachable by name without knowing the worktree path.
5. On a merge conflict: `git merge --abort`, then halt and report the conflicting
   paths and tasks. **Never resolve a conflict here.** A conflict means two tasks
   in one wave shared a file — that is a plan defect, and the fix is a
   `depends_on` in the plan, not a hand-merge.

## After the last wave

1. Run the full plan's acceptance commands yourself in the merged tree. Passing
   in isolation is not passing after a merge.

   Acceptance only, not the plan's `## Test suites` — those belong to
   `/corporate:test $1`, which runs them against the merged branch as the next
   stage. An acceptance line proves one task did what it was specified to do; a
   suite proves the branch. Do not run the suites here to get ahead, and do not
   treat a green acceptance set as a tested branch.
2. Report per task: id, sha, files changed, acceptance result with the output
   that shows it. Never assert a task passed without the output.
3. List any leftover worktrees (`git worktree list`) and branches, and offer to
   clean them up (`git worktree remove`, `git branch -d`). Do not delete
   anything the user has not agreed to.
4. If any builder filed an HR record, surface that it did and name
   `/corporate:hr`. Do not run it. Repeat any waiver this run used, in the same
   report.

## Single task

With `--task T<n>`: run that one task only, skipping the wave loop and the
dependency check for tasks other than its own. Use this to re-run a task after
fixing a plan defect. Everything else — the branch and clean-tree preconditions,
the merge, the evidence requirement — still applies.

A re-run cannot reuse the old task branch: the builder would start from the
previous attempt and its worktree may still be attached. Before dispatching,
if `corporate/$1/<task-id>` exists, show what it holds
(`git log --oneline corporate/$1/work..corporate/$1/<task-id>`), confirm, then
`git worktree remove` its worktree if one is listed and
`git branch -D corporate/$1/<task-id>`. Declined: stop. Never delete a branch
the user has not agreed to, and never build on top of a stale attempt silently.

## Gate

Stop after reporting. Do not review your own work, do not commit a summary, do
not merge `corporate/$1/work` anywhere, do not push. `/corporate:test $1` runs
the declared suites next, and `/corporate:review $1` is a separate stage with a
fresh context for a reason.
