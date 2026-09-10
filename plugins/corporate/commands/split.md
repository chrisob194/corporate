---
description: Use when a filed plan should become several independent, parallel-running issues instead of one — converts every task in a plan into its own child issue, or reports the state of a split already made. Never for a subset of a plan.
argument-hint: <issue> [--status]
---

# Split

Issue: `$1` · Arguments: `$ARGUMENTS`

Asynchronous, like `/corporate:brief`: this reads and writes the tracker and
stops. It touches no branch and no working tree — nothing here enters a
worktree, and nothing here builds anything. It converts the **whole** plan or
nothing: there is no flag to split a subset of tasks, because a subset would
leave the parent holding an executable plan for the remainder, and two
executable things claiming the same tasks is worse than one.

## Modes

| Mode | What runs |
|---|---|
| `--status` | read the split already made, report it, then stop |
| convert | the flow below |

An explicit `--status` wins. Anything else is the convert flow.

## The store

Read `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` before either mode runs
— if that path does not resolve, find the file under the plugin directory. Run
its preflight before the first store operation. It owns the target, the
record, the states, the `parent` field, the `split` artifact and the
parent-record rule this command is built on.

## Convert flow

1. If `$1` is empty, stop and name `/corporate:brief --list open`. Do not
   invent an issue.
2. Normalise `$1` per the store's *The key* and resolve it per *Finding an
   issue*. `<n>` below is that number.
3. **Not `Open` is a hard stop.** Name the state it is in. For `Blocked`, name
   `/corporate:brief --unblock <n>` as the way past — the blocker must be read
   and cleared through that command, not skipped here.
4. **A non-empty `parent` field is a hard stop.** This record is already a
   child of a split; recursive conversion is out of scope.
5. **An existing `split` artifact is a hard stop.** Name `/corporate:split <n>
   --status` — the record is already a parent, and a parent is never split
   twice.
6. **No `plan` artifact is a hard stop.** Name `/corporate:design <n>` as the
   way to get one — this command converts a plan, never a design or a chat
   history.
7. Read the newest `plan` artifact and parse it against
   `${CLAUDE_PLUGIN_ROOT}/reference/plan-format.md`. Refuse, naming the
   defect, rather than guessing, on any of its hard stops:
   - a `depends_on` id that does not exist,
   - a dependency cycle,
   - two task headings sharing an id,
   - a task with no `acceptance` line,
   - a task whose id is `work`.
   **A plan with exactly one task is also a stop here** — one child issue plus
   a tracking parent is strictly worse than just running the plan, so name
   that and do not proceed.
8. Advisory, never a stop: if `corporate/<n>/work` exists as a local branch and
   holds commits ahead of the default branch, say so and say plainly that this
   work is carried into none of the children — a child starts from the
   design and the plan, not from whatever is sitting on that branch. Skip this
   check silently if the branch does not exist locally.
9. Show the task ids, their titles, and the child issue title each will
   become, and confirm once. Say plainly: **this writes N issues to your
   repository** — one per task — and nothing about the parent record changes
   until every one of them exists.
10. Dispatch the `product-owner` subagent **once per task, all in one
    message, in parallel**. Each brief carries:
    - the task block, verbatim — heading, `depends_on`, `files`, `acceptance`,
      `steps`,
    - the parent design's `## Approach` section,
    - the parent issue's acceptance criteria,
    - the titles of the sibling tasks, as non-goal material — what the other
      children are for, so this brief does not reach into their scope,
    - the standing instruction that the task's `files:` and `steps:` are
      context only and must never surface as a criterion — a brief names no
      file, library or pattern, the same rule product-owner already follows,
    - that it must return the brief as its final message and write no file —
      this command owns the store, and the agent must not learn where it is,
    - the agent returns a brief in every case, never a blocking status, and
      may carry up to three `[NEEDS CLARIFICATION: <question>]` markers.
11. Read every returned brief yourself, the way filing does: no criterion
    names a file, library or pattern. A brief that fails this check is
    re-dispatched, not filed.
12. Create the children **in task order, one at a time**. Each child:
    - filed as `Draft`, with the `corporate` and `Draft` labels,
    - its marker block carrying `parent: #<n>` and every other field empty,
    - the brief verbatim as the body, below the marker block,
    - the same brief filed again as `brief` artifact 1,
    - its own first activity line — the filing itself.
    This is the same three writes `/corporate:brief`'s filing flow already
    makes; `Draft` is not a choice here either. The title is the brief's own
    `# Brief — <title>` heading. Record the issue number the store returns for
    each child before moving to the next. A child's markers, if any, are
    reported with its number when the split reports.
13. **On any creation failure**, stop immediately. Name every child already
    created, with its number and title. Say plainly that the parent is
    **not** split — no `split` artifact exists yet — and that re-running this
    command now would create duplicate children for the tasks already done.
    Never invent a fallback and never file a partial `split` artifact.
14. **Only once every child exists**, file the `split` artifact on the parent
    — the child registry: issue number, title, originating task id and
    `depends_on` per child, and the line stating that the parent's plan is
    superseded. Then append the parent's activity line, `<who>` =
    `orchestrator`.
15. Report: every child's number, title, task id and any markers it carries;
    that the parent now holds a `split` artifact and its plan no longer runs;
    and anything split off or re-dispatched along the way.

## Status — `--status`

1. Normalise `$1` and resolve it per the store. **No `split` artifact is a
   hard stop**: say this record is not a parent and name `/corporate:split <n>`
   to make it one, or `/corporate:split <n> --status` again once it is.
2. Read the child issue numbers out of the `split` artifact. Resolve each per
   the store's *Finding an issue*.
3. Print, per child: number, title, current state.
   - A child that 404s is flagged — it no longer exists.
   - A child whose `parent` field does not name this issue is flagged — the
     record has drifted from what the split artifact claims.
4. Report the counts: how many children are outstanding (not `Closed`) and
   how many are `Closed`.
5. Change nothing. This mode only reads.

## Gate

Stop, whichever mode ran. Promote nothing and run nothing here. Name
`/corporate:brief --promote <child>` for each child the user is ready to
release, and `/corporate:split <n> --status` as the way to check on the rest
later.
