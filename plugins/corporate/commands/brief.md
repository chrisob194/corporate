---
description: File an issue — dispatch the product owner to turn a vague ask into falsifiable acceptance criteria, and store it in the local or GitHub issue backend.
argument-hint: <what you want> | --list | --status | --use local|github[:owner/repo]
---

# Brief

Arguments: `$ARGUMENTS`

Stage 0, and asynchronous: this files an issue and stops. It touches no branch
and no working tree, so it can run at any time, on any checkout, without
disturbing whatever is in progress. The pipeline picks the issue up later by its
slug.

This stage decides *what would count as done*, and nothing else. No file,
library or pattern is named here.

## Modes

Read `$ARGUMENTS` first and pick exactly one:

| Argument | What runs |
|---|---|
| `--status` | the configuration report, then stop |
| `--use <backend>` | the configuration write, then stop |
| `--list` | the open issues in the resolved backend, then stop |
| anything else | that text is the ask: the filing flow |

The first two never dispatch `product-owner` and never read an issue's contents.
Do not combine modes.

## The backend

Read `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` before any mode runs — if
that path does not resolve, find the file under the plugin directory. It owns
the configuration chain, the `local` path, the slug rules, the file format and
the `gh` commands. Resolve the backend from it and **name the source you
resolved from** in every mode's report.

## Status — `--status`

Report, and nothing else:

- the resolved backend and which source it came from, or `local (default)`,
- the `<repo-key>` and the local store path,
- how many issues the resolved backend holds,
- `gh auth status` on the `github` backend — read-only, and a failure here is
  information, not an error.

## Use — `--use local|github[:owner/repo]`

1. Reject any value the reference does not list, rather than writing it and
   failing at the next brief.
2. Read `.claude/settings.json`. **If it exists and does not parse, stop and
   change nothing.** Never rewrite a settings file you could not read. Absent is
   fine — create it holding only the `env` block.
3. Merge in `env.CORPORATE_ISSUES`, preserving every other key and the file's
   existing indentation. If the key already holds a different value, show
   old → new and confirm before overwriting it.
4. Show the resulting JSON, write it, then read it back and confirm it parses.
   Verifying the write is part of the write.
5. Report the resolved state. Create no directory — the first issue creates it.
6. If the value resolves from a source earlier in the chain than the file you
   just wrote, say so plainly. A user who thinks they have switched backend
   while another key wins is worse off than before they ran this.

## List — `--list`

Slug and title per open issue, newest first, and nothing else. This is a
backlog readout: do not summarise the issues, rank them, or suggest which to
work on.

## Filing flow

1. If the ask is empty, stop and ask for it in the user's own words. Do not
   invent it, and do not tidy it up — the phrasing is data the product owner
   needs.
2. Dispatch the `product-owner` subagent with a brief containing:
   - the ask, verbatim,
   - the repository root and anything relevant from `CLAUDE.md`,
   - that it must return the brief as its final message and write no file — this
     command owns the store, and the agent must not learn the backend.
3. **If it returns `blocked on answers`:** put its questions to the user as
   written. Do not answer them yourself, do not guess, and do not proceed. When
   the user answers, re-dispatch the `product-owner` with the original ask, its
   previous brief, and the answers quoted. Repeat until `ready` — or until the
   user decides the ask is not worth pursuing, which is a valid end.
4. Read the returned brief yourself. Check that no criterion names a file,
   library or pattern, and that each one could actually fail. If a criterion
   could not, say so rather than filing it.
5. Derive the slug and write through the backend, per the reference. If an issue
   with that slug already exists, do not overwrite it: report it and ask whether
   to replace it or file alongside it under the next free slug.
6. Report: the slug, the criteria, the non-goals, anything split off as a second
   ticket, and where the issue landed — the local path, or the issue URL. On a
   degraded `github` run, say the brief went to the local store and why.
7. If the ask itself wants a specialist this team does not employ, say so and
   name `/corporate:hr` — that is a `staffing` gap in the team, and the product
   owner cannot file it (no `Skill` tool, on purpose).

## Gate

Stop. The issue is filed and nothing is checked out. Do not run
`/corporate:design` — name it with the slug and let the user decide when this
piece of work starts. A design built on criteria the user has not read is a
design nobody agreed to.
