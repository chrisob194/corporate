---
description: Dispatch the planner to turn a filed design into ordered, independently buildable tasks.
argument-hint: <slug> [--without-playbook <stack>]
---

# Plan

Slug: `$1` · Arguments: `$ARGUMENTS`

Stage 2 of 4. Turns the design into tasks with dependencies, file scope and
runnable acceptance. Files the plan beside the design, and ends at a gate.

## Steps

1. Resolve `$1` per `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md`. Not in
   `Open/` is a hard stop, naming the state it is in. The issue folder must hold
   `design.md`; if it does not, stop and say to run `/corporate:design $1`
   first. Do not plan from the chat history — the reviewer will later check the
   build against a document that must exist.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/worktree-lifecycle.md` and follow its
   *Entering an issue* section: the issue's worktree on `corporate/$1/work`,
   re-entered by the path recorded in `issue.md`. **Hard stop, not a warning.**
3. Read the design. If it has unanswered open questions, surface them and stop.
   Ask the user to resolve them before planning.
4. Read the design's `## Stack readiness` section against
   `${CLAUDE_PLUGIN_ROOT}/reference/stack-readiness.md`. Any `required-missing`
   stack not named in a `--without-playbook` waiver on this invocation is a
   **hard stop**: name the stacks, their doc roots, and
   `/corporate:plan $1 --without-playbook <stack>` as the way past, then stop. A
   design with no such section is the same stop — an unruled design is not a
   ruled-clear one. Never soften this to a warning: the planner has no web tool,
   so past here it can only answer from memory. If the user did waive stacks,
   say which, before dispatching.
5. If the issue folder already holds `plan.md`, ask before replacing it.
6. Dispatch the `planner` subagent with a brief containing:
   - the design **inlined in full** — the planner cannot read the store,
   - the format spec path `${CLAUDE_PLUGIN_ROOT}/reference/plan-format.md` — if
     that path does not resolve, read the file yourself and inline its contents
     into the brief instead,
   - the stack readiness table verbatim, and — if any stack was waived — the
     waived stacks, as a standing instruction to file one `knowledge` HR record
     per stack and to mark in the plan every decision taken from memory,
   - that it must return the plan as its final message and write no file.
7. When it returns, validate the plan yourself before filing it as usable:
   - every `depends_on` id exists,
   - no dependency cycle,
   - no duplicate task ids,
   - every task has an `acceptance` line,
   - within each wave, no two tasks share a path in `files:`,
   - no task id is `work` — that name is the issue's own branch.
   Report any violation as a plan defect and re-dispatch rather than filing it.
8. File it: write `plan.md` in the issue folder, add its artifact row, append the
   activity line with the planner's report.
9. Print the wave table and the task titles, and repeat any waiver this run used.
10. If the planner filed an HR record, surface that it did and name
    `/corporate:hr`. Do not run it. This is separate from a gap in the design,
    which is the gate below.

## Gate

Stop. The user approves the plan before anything is built — filing it is a
handoff, not an approval. If the planner reported a gap in the design, the plan
is incomplete — say that plainly and do not present it as ready.
