---
description: Work one Open issue end to end and unattended — design, plan, build, review, retry by defect origin — then push and open a pull request.
argument-hint: <slug>
---

# Ship

Slug: `$1`

You are the orchestrator. One `Open` issue goes in; a pull request or a
`Blocked` issue comes out, with no question asked in between.

This is the autonomous path. `/corporate:design`, `/corporate:plan`,
`/corporate:build` and `/corporate:review` are the same stages driven by hand,
with a gate after each; use those when you want to argue with a result. This
command does not stop to ask, because there is nobody to ask — its safety comes
from working in an isolated worktree and from ending at a pull request the user
still has to accept.

## What you are, and what you are not

**You dispatch, record and route. You never implement.**

- You write no source file, edit no source file, and fix no review finding
  yourself. Every line of code in this run is written by a `builder` in its own
  worktree. If a finding looks like a one-line fix, it is still a builder's
  one-line fix — the moment you make it, nothing reviewed it.
- Your only writes are inside the issue folder in the store.
- Your only git operations are the wave merges, the push and the pull request.
- You read the store, and no subagent does. Everything a role needs is inlined
  into its dispatch brief.

Read these three before you start, and follow them rather than restating them:
`${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` (the store, the states, the
transitions, the log), `${CLAUDE_PLUGIN_ROOT}/reference/worktree-lifecycle.md`
(the worktree, the branch, the push and the PR),
`${CLAUDE_PLUGIN_ROOT}/reference/stack-readiness.md` (the coverage verdicts). If
a path does not resolve, find the file under the plugin directory.

## The state line

Every turn of this run **begins** with exactly this line, and it is never
reworded, wrapped, or replaced by a prettier summary:

```
STATE issue <slug> = Open | Blocked | Closed · stage: <stage> · cycle: <n>/3
```

It exists for the goal evaluator, which sees the transcript and nothing else —
it cannot read the issue folder, run a command, or infer the state from prose.
A turn without this line is a turn the loop cannot terminate on.

## Preflight

1. Resolve `$1` per the store reference's *Finding an issue*. **Not in `Open/`
   is a hard stop** — say which state it is in; for a `Draft`, name
   `/corporate:brief --promote $1` and stop. Work is assigned on `Open` and only
   on `Open`, and that gate is the user's, not yours.
2. Enter the issue's worktree per the worktree reference. Record `branch:` and
   `worktree:` in `issue.md`.
3. Read what the issue folder already holds. This command is enterable cold and
   resumable: an issue with a `design.md` and no `plan.md` starts at plan, one
   with a blocking `review-2.md` starts at the route that review implies. Say
   which stage you are starting at and why. Never redo a stage whose artifact is
   already filed unless a route sends you back to it.
4. Print the state line, then set the session goal with `ProposeGoal`:

   > issue `$1` is no longer Open — a STATE line in the transcript reports
   > Closed or Blocked

   If the tool is unavailable, print the `/goal` command for the user to paste
   and carry on regardless. The goal is what keeps the session working across
   turns; it is not what decides anything, and this command is correct without
   it.

## The loop

```
design ──► plan ──► build ──► review ──► pass? ──► push, PR, Closed
             ▲                              │
             └────── route by defect origin ┘
```

**Design.** Dispatch `technical-architect` exactly as `/corporate:design`
specifies its brief. File `design.md`, add the artifact row, log.
Any `required-missing` stack in its `## Stack readiness` table ⇒ **Blocked**,
immediately: there is no `--without-playbook` here and you never invent one
(the stack reference says why). Set `blocked_reason` to the stacks and their doc
roots, make the transition, print the state line, stop.

**Plan.** Dispatch `planner` with the design inlined. Validate the returned plan
against `${CLAUDE_PLUGIN_ROOT}/reference/plan-format.md` — the six checks
`/corporate:plan` lists, done by you, every run. A plan that fails validation is
re-dispatched **once**, with the violations named. Failing twice ⇒ **Blocked**.
A design gap the planner reports is also **Blocked** — a gap is a question for a
human, and answering it yourself is the one thing this loop must not do. File
`plan.md`, add the row, log.

**Build.** Run the wave loop from `/corporate:build` unchanged: topological
waves, parallel inside a wave, halt the build on the first failed task, merge in
task-id order, run the full acceptance set in the merged tree at the end. Log
one line per wave.

A failed wave or a merge conflict does not go to review. Treat it as a review
cycle with **origin `plan`** and route it as such: a conflict means two tasks
shared a file, which is a plan defect, and a task that cannot pass its own
acceptance twice is a task that was specified wrong.

**Review.** Dispatch `reviewer` with the design, the plan and the acceptance
criteria inlined. File `review-<n>.md`, add the row, log the verdict and the
origin. Read the `Verdict` and `Defect origin` from the top of its report.

- `pass`, or `pass with findings` where no finding is blocking ⇒ close out.
- anything else ⇒ route.

## Routing

Increment the cycle counter, then act on the roll-up origin:

| Defect origin | What goes back |
|---|---|
| `implementation` | the affected tasks only, via the `--task` path of `/corporate:build`, then re-review |
| `plan` | `planner`, with the findings; rebuild the tasks it changed; re-review |
| `design` | `technical-architect`, with the findings; then re-plan, rebuild, re-review |

A re-dispatched role gets the blocking findings **verbatim** and its own
previous artifact in full — never your summary of either. It is being asked to
correct a document it wrote, and a paraphrase is how the same defect comes back
a second time.

A re-plan supersedes `plan.md` in place; the reviews are never touched.

**The caps are hard:**

- **3 review cycles.** The fourth is not attempted.
- **1 design-level redo.** A second `design` origin ends the run even if cycles
  remain — twice being wrong about the approach is not something more building
  fixes.

Hitting either cap ⇒ **Blocked**, with `blocked_reason` naming the cycle, the
origin and the findings that survived. Do not lower the bar to get to a pass:
accepting a blocking finding is a human decision, and `Blocked` is how you hand
it back.

## Close-out

In this order, per the worktree reference:

1. Push `corporate/$1/work`.
2. Open the pull request: title from the issue, body carrying the acceptance
   criteria, the artifact table and the activity log.
3. Write the PR URL to `pr:` in `issue.md`.
4. Transition `Open` → `Closed`, log it.
5. `ExitWorktree` with `keep`.
6. Print the state line, then the final report: the PR URL, the cycles it took,
   what each review found, and anything a role said it had to guess.

No remote, or no `gh`: the issue still goes to `Closed` — the work is done and
reviewed, only its delivery is stuck. Say so, log it, and name what the user has
to run. Nothing here merges the pull request.

## HR

Any role may file an HR record mid-run. Collect them and say so in the final
report. You may dispatch `hr-manager` on your own judgement to cluster them — it
is offline and write-less, so drafting costs nothing.

**Filing is not yours.** `/corporate:hr` files to a public tracker with one
confirmation per issue, and that confirmation is the point. Name the command;
never run it.

## Never

- Ask the user a question mid-run. There is nobody there. Every branch of this
  command ends in `Closed` or `Blocked`, and `Blocked` is the question.
- Write or edit code, or fix a finding yourself.
- Skip the state line, or reword it.
- Waive a stack, answer a design gap, or accept a blocking finding.
- Merge the pull request, or push anything but `corporate/$1/work`.
- Run `/corporate:qa`. It ends in a decision about failing tests and wants a
  human present for its whole duration — that is why it is not in this loop.
