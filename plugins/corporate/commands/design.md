---
description: Dispatch the technical-architect to choose an approach for a task, and write the design document.
argument-hint: <slug> <task description>
---

# Design

Slug: `$1` · Problem: `$2`

Stage 1 of 4 (design → plan → build → review), after an optional
`/corporate:brief`. This stage decides *what to build it out of*. It also opens
the slug's branch — every later stage commits onto it. It ends at a gate:
nothing gets planned or built here.

## Steps

1. If `$1` is empty, stop and ask for the slug of a filed issue and a problem
   statement. Do not invent either — `/corporate:brief --list` names the slugs
   that exist.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/artifact-branch.md` and follow its
   *Entering a stage* section: clean tree, then `corporate/$1/work`, created here
   if it does not exist. If the path does not resolve, find the file under the
   plugin directory. **This is a hard stop, not a warning.**
3. If `docs/corporate/$1/design.md` already exists, read it and ask whether to
   replace it before dispatching. Never silently overwrite a design.
4. Resolve the brief for `$1` through
   `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` and pass the resolved path
   along in step 5. The criteria and non-goals in it are given — the
   technical-architect decides what to build the feature out of, never whether
   the feature should exist. No issue for this slug is not an error: say so and
   design from `$2` alone.
5. Dispatch the `technical-architect` subagent with a brief containing:
   - the problem statement `$2`, verbatim,
   - the resolved brief path if there is one, marked as settled,
   - the repository root and anything relevant from `CLAUDE.md`,
   - the output path `docs/corporate/$1/design.md`,
   - the list of MCP servers, skills and plugin commands available in this
     session, so it can search the "already installed" layer it cannot see from
     inside a subagent.
6. When it returns, read the written design yourself. Check it cites real
   `path:line` locations and that the rejected alternatives are real
   alternatives, not straw men. If it does not, say so rather than passing it on.
   Check the `## Stack readiness` section against
   `${CLAUDE_PLUGIN_ROOT}/reference/stack-readiness.md`: the section exists,
   every stack the approach relies on has a row, every verdict is one of
   `covered` / `not-required` / `required-missing`, and every `required-missing`
   row names a doc root URL. A missing or unruled section is a design defect —
   re-dispatch rather than pass it on, because it stops stages 2 and 3 dead.
7. Commit the design per the reference's *commit gate*: one confirmation, only
   `docs/corporate/$1/design.md` staged, message
   `docs(corporate): design for $1`.
8. Report to the user: the branch, the commit sha, the recommended approach,
   which search layer the answer came from, the top rejected alternative, the
   stack readiness verdicts, and any open questions.
9. If the technical-architect filed an HR record — a stack with no playbook, a
   tool it lacked, work wanting a specialist — surface that it did and name
   `/corporate:hr`. Do not run it.

## Gate

Stop. Do not run `/corporate:plan`. Open questions in the design are the user's
to answer — a plan built on an unanswered design question is wasted work. The
commit is a handoff, not an approval.

If the design ruled any stack `required-missing`, say so here plainly: stages 2
and 3 will refuse this slug until a playbook exists for that stack or the user
waives it with `--without-playbook <stack>`. Name the stacks and their doc
roots. Do not offer to waive it on the user's behalf.
