---
description: Dispatch the product owner to turn a vague ask into falsifiable acceptance criteria and non-goals.
argument-hint: <slug> <what you want>
---

# Brief

Slug: `$1` · Ask: `$2`

Stage 0 — before design. This stage decides *what would count as done*, and
nothing else. No file, library or pattern is named here.

## Steps

1. If `$1` or `$2` is empty, stop and ask for a kebab-case slug and the ask in
   the user's own words. Do not invent either, and do not tidy up the ask —
   the phrasing is data the product owner needs.
2. If `docs/corporate/$1/brief.md` already exists, read it and ask whether to
   replace it before dispatching. Never silently overwrite a brief.
3. Dispatch the `product-owner` subagent with a brief containing:
   - the ask `$2`, verbatim,
   - the repository root and anything relevant from `CLAUDE.md`,
   - the output path `docs/corporate/$1/brief.md`.
4. **If it returns `blocked on answers`:** put its questions to the user as
   written. Do not answer them yourself, do not guess, and do not proceed.
   When the user answers, re-dispatch the `product-owner` with the original ask,
   the existing brief path, and the answers quoted. Repeat until `ready` — or
   until the user decides the ask is not worth pursuing, which is a valid end.
5. Read the written brief yourself. Check that no criterion names a file,
   library or pattern, and that each one could actually fail. If a criterion
   could not, say so rather than passing it on.
6. Report to the user: the criteria, the non-goals, anything split off as a
   second ticket.

## Gate

Stop. Do not run `/corporate:design`. A design built on criteria the user has not
read is a design nobody agreed to.
