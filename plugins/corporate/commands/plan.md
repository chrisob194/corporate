---
description: Dispatch the planner to turn an approved design into ordered, independently buildable tasks.
argument-hint: <slug> [--without-playbook <stack>]
---

# Plan

Slug: `$1` · Arguments: `$ARGUMENTS`

Stage 2 of 4. Turns the design into tasks with dependencies, file scope and
runnable acceptance. Commits onto the slug's branch, and ends at a gate.

## Steps

1. Require `docs/corporate/$1/design.md`. If it is missing, stop and say to run
   `/corporate:design $1 "<problem>"` first. Do not plan from the chat history —
   the reviewer will later check the build against a document that must exist.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/artifact-branch.md` and follow its
   *Entering a stage* section: clean tree, then `corporate/$1/work`. If the
   branch does not exist, the design was committed somewhere else — say so
   rather than glossing over it. **Hard stop, not a warning.**
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
5. If `docs/corporate/$1/plan.md` exists, ask before replacing it.
6. Dispatch the `planner` subagent with a brief containing:
   - the design path `docs/corporate/$1/design.md`,
   - the format spec path `${CLAUDE_PLUGIN_ROOT}/reference/plan-format.md` — if
     that path does not resolve, read the file yourself and inline its contents
     into the brief instead,
   - the stack readiness table verbatim, and — if any stack was waived — the
     waived stacks, as a standing instruction to file one `knowledge` HR record
     per stack and to mark in the plan every decision taken from memory,
   - the output path `docs/corporate/$1/plan.md`.
7. When it returns, validate the plan yourself before showing it as usable:
   - every `depends_on` id exists,
   - no dependency cycle,
   - no duplicate task ids,
   - every task has an `acceptance` line,
   - within each wave, no two tasks share a path in `files:`,
   - no task id is `work` — that name is the slug's own branch.
   Report any violation as a plan defect and offer to re-dispatch.
8. Commit the plan per the reference's *commit gate*: one confirmation, only
   `docs/corporate/$1/plan.md` staged, message `docs(corporate): plan for $1`.
9. Print the wave table and the task titles, with the branch and the commit
   sha, and repeat any waiver this run used.
10. If the planner filed an HR record, surface that it did and name
    `/corporate:hr`. Do not run it. This is separate from a gap in the design,
    which is the gate below.

## Gate

Stop. The user approves the plan before anything is built — the commit is a
handoff, not an approval. If the planner reported a gap in the design, the plan
is incomplete — say that plainly and do not present it as ready.
