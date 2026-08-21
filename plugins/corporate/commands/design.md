---
description: Dispatch the architect to choose an approach for a task, and write the design document.
argument-hint: <slug> <task description>
---

# Design

Slug: `$1` · Problem: `$2`

Stage 1 of 4 (design → plan → build → review), after an optional
`/corporate:brief`. This stage decides *what to build it out of*. It ends at a
gate: nothing gets planned or built here.

## Steps

1. If `$1` is empty, stop and ask for a kebab-case slug and a problem statement.
   Do not invent either.
2. If `docs/corporate/$1/design.md` already exists, read it and ask whether to
   replace it before dispatching. Never silently overwrite a design.
3. If `docs/corporate/$1/brief.md` exists, read it and pass its path along in
   step 4. The criteria and non-goals in it are given — the architect decides
   what to build the feature out of, never whether the feature should exist.
4. Dispatch the `architect` subagent with a brief containing:
   - the problem statement `$2`, verbatim,
   - the path to `docs/corporate/$1/brief.md` if it exists, marked as settled,
   - the repository root and anything relevant from `CLAUDE.md`,
   - the output path `docs/corporate/$1/design.md`,
   - the list of MCP servers, skills and plugin commands available in this
     session, so it can search the "already installed" layer it cannot see from
     inside a subagent.
5. When it returns, read the written design yourself. Check it cites real
   `path:line` locations and that the rejected alternatives are real
   alternatives, not straw men. If it does not, say so rather than passing it on.
6. Report to the user: the recommended approach, which search layer the answer
   came from, the top rejected alternative, and any open questions.

## Gate

Stop. Do not run `/corporate:plan`. Open questions in the design are the user's
to answer — a plan built on an unanswered design question is wasted work.
