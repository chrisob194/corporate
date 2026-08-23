---
description: Dispatch the planner to turn an approved design into ordered, independently buildable tasks.
argument-hint: <slug>
---

# Plan

Slug: `$1`

Stage 2 of 4. Turns the design into tasks with dependencies, file scope and
runnable acceptance. Ends at a gate.

## Steps

1. Require `docs/corporate/$1/design.md`. If it is missing, stop and say to run
   `/corporate:design $1 "<problem>"` first. Do not plan from the chat history —
   the reviewer will later check the build against a document that must exist.
2. Read the design. If it has unanswered open questions, surface them and stop.
   Ask the user to resolve them before planning.
3. If `docs/corporate/$1/plan.md` exists, ask before replacing it.
4. Dispatch the `planner` subagent with a brief containing:
   - the design path `docs/corporate/$1/design.md`,
   - the format spec path `${CLAUDE_PLUGIN_ROOT}/reference/plan-format.md` — if
     that path does not resolve, read the file yourself and inline its contents
     into the brief instead,
   - the output path `docs/corporate/$1/plan.md`.
5. When it returns, validate the plan yourself before showing it as usable:
   - every `depends_on` id exists,
   - no dependency cycle,
   - no duplicate task ids,
   - every task has an `acceptance` line,
   - within each wave, no two tasks share a path in `files:`.
   Report any violation as a plan defect and offer to re-dispatch.
6. Print the wave table and the task titles.
7. If the planner filed an HR record, surface that it did and name
   `/corporate:hr`. Do not run it. This is separate from a gap in the design,
   which is the gate below.

## Gate

Stop. The user approves the plan before anything is built. If the planner
reported a gap in the design, the plan is incomplete — say that plainly and do
not present it as ready.
