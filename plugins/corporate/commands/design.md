---
description: Dispatch the technical-architect to choose an approach for an Open issue, and file the design in the issue store.
argument-hint: <slug>
---

# Design

Slug: `$1`

Stage 1 of 4 (design → plan → build → review). This stage decides *what to build
it out of*. It also opens the issue's worktree and branch — every later stage
works in it. It ends at a gate: nothing gets planned or built here.

`/corporate:ship $1` runs this stage and the three after it without stopping.
Use this command when you want to argue with the result before anything else
happens.

## Steps

1. If `$1` is empty, stop and ask for the slug of an `Open` issue. Do not invent
   one — `/corporate:brief --list open` names the slugs that exist.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` — if the path does not
   resolve, find the file under the plugin directory. Resolve `$1` per its
   *Finding an issue*. **Not in `Open/` is a hard stop**: say which state it is
   in, and for a `Draft` name `/corporate:brief --promote $1`. Work is assigned
   on `Open` and only on `Open`.
3. Read `${CLAUDE_PLUGIN_ROOT}/reference/worktree-lifecycle.md` and follow its
   *Entering an issue* section: the issue's own worktree on
   `corporate/$1/work`, created here. Your own checkout is left as it is, dirty
   or not. Record the branch and worktree path in `issue.md`. **Entering the
   worktree is a hard stop if it fails, not a warning.**
4. If the issue folder already holds `design.md`, read it and ask whether to
   replace it before dispatching. Never silently overwrite a design — and note
   that replacing it does not remove the plan or the reviews that were built on
   it.
5. Dispatch the `technical-architect` subagent with a brief containing:
   - the issue's brief — criteria and non-goals — inlined verbatim, marked as
     settled: the architect decides what to build the feature out of, never
     whether the feature should exist,
   - the repository root and anything relevant from `CLAUDE.md`,
   - the list of MCP servers, skills and plugin commands available in this
     session, so it can search the "already installed" layer it cannot see from
     inside a subagent,
   - that it must return the design as its final message and write no file.
     The store is yours to write, and the agent must not learn where it is.
6. When it returns, read the design yourself. Check it cites real `path:line`
   locations and that the rejected alternatives are real alternatives, not straw
   men. If it does not, say so rather than filing it.
   Check the `## Stack readiness` section against
   `${CLAUDE_PLUGIN_ROOT}/reference/stack-readiness.md`: the section exists,
   every stack the approach relies on has a row, every verdict is one of
   `covered` / `not-required` / `required-missing`, and every `required-missing`
   row names a doc root URL. A missing or unruled section is a design defect —
   re-dispatch rather than filing it, because it stops stages 2 and 3 dead.
7. File it: write the document to `design.md` in the issue folder, add its row to
   the `## Artifacts` table, and append the activity line with the architect's
   report. The store reference owns the exact shapes.
8. Report to the user: the branch and worktree, the recommended approach, which
   search layer the answer came from, the top rejected alternative, the stack
   readiness verdicts, and any open questions.
9. If the technical-architect filed an HR record — a stack with no playbook, a
   tool it lacked, work wanting a specialist — surface that it did and name
   `/corporate:hr`. Do not run it.

## Gate

Stop. Do not run `/corporate:plan`. Open questions in the design are the user's
to answer — a plan built on an unanswered design question is wasted work. Filing
the design is a handoff, not an approval.

If the design ruled any stack `required-missing`, say so here plainly: stages 2
and 3 will refuse this issue until a playbook exists for that stack or the user
waives it with `--without-playbook <stack>`, and `/corporate:ship` will not
waive at all — it moves the issue to `Blocked`. Name the stacks and their doc
roots. Do not offer to waive on the user's behalf.
