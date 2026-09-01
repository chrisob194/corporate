---
description: File an issue — dispatch the product owner to turn a vague ask into falsifiable acceptance criteria, and file it as a Draft in the issue store.
argument-hint: <what you want> | --list [state] | --promote <slug> | --status | --use local
---

# Brief

Arguments: `$ARGUMENTS`

Stage 0, and asynchronous: this files an issue and stops. It touches no branch
and no working tree, so it can run at any time, on any checkout, without
disturbing whatever is in progress. `/corporate:ship` picks the issue up later
by its slug — once the user has promoted it.

This stage decides *what would count as done*, and nothing else. No file,
library or pattern is named here.

## Modes

Read `$ARGUMENTS` first and pick exactly one:

| Argument | What runs |
|---|---|
| `--status` | the configuration report, then stop |
| `--use <backend>` | the configuration write, then stop |
| `--list [state]` | the backlog readout, then stop |
| `--promote <slug>` | `Draft` → `Open`, then stop |
| anything else | that text is the ask: the filing flow |

Only the filing flow dispatches `product-owner`. Do not combine modes.

## The store

Read `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` before any mode runs — if
that path does not resolve, find the file under the plugin directory. It owns
the configuration chain, the layout, the four states, the transitions, the
`issue.md` format and the slug rules. Resolve the backend from it and **name the
source you resolved from** in every mode's report.

## Status — `--status`

Report, and nothing else:

- the resolved backend and which source it came from, or `local (default)`,
- the `<repo-key>` and the local store path,
- how many issues sit in each of the four states.

## Use — `--use local`

1. Reject any value the reference does not list as available — today that is
   every value but `local`. Say why rather than writing it and failing at the
   next brief.
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
   just wrote, say so plainly.

## List — `--list [state]`

Slug and title per issue, newest first. With a state argument (`draft`, `open`,
`blocked`, `closed`, case-insensitive), only that state; without one, all four,
grouped by state, in the order `Open`, `Draft`, `Blocked`, `Closed`.

This is a backlog readout: do not summarise the issues, rank them, or suggest
which to work on.

## Promote — `--promote <slug>`

`Draft` → `Open` is the user's decision and this is where they express it.

1. Resolve the slug per the reference's *Finding an issue*. Not in `Draft` ⇒
   stop and say which state it is in. Already `Open` is not an error, just a
   no-op worth saying out loud.
2. Show the title and the acceptance criteria, and confirm once. Promoting is
   what makes the issue eligible for an autonomous run — the user must see what
   they are releasing.
3. Make the transition per the reference's four steps.
4. Report the new state and name `/corporate:ship <slug>`. Do not run it.

Moving an issue out of `Blocked` or `Closed` is also the user's call, but it is
deliberately not a flag here: those need the blocker read first, which is a
conversation, not a command.

## Filing flow

1. If the ask is empty, stop and ask for it in the user's own words. Do not
   invent it, and do not tidy it up — the phrasing is data the product owner
   needs.
2. Dispatch the `product-owner` subagent with a brief containing:
   - the ask, verbatim,
   - the repository root and anything relevant from `CLAUDE.md`,
   - that it must return the brief as its final message and write no file — this
     command owns the store, and the agent must not learn where the store is.
3. **If it returns `blocked on answers`:** put its questions to the user as
   written. Do not answer them yourself, do not guess, and do not proceed. When
   the user answers, re-dispatch the `product-owner` with the original ask, its
   previous brief, and the answers quoted. Repeat until `ready` — or until the
   user decides the ask is not worth pursuing, which is a valid end.
4. Read the returned brief yourself. Check that no criterion names a file,
   library or pattern, and that each one could actually fail. If a criterion
   could not, say so rather than filing it.
5. Derive the slug per the reference, then write
   `Draft/<slug>/issue.md`: the frontmatter with `state: Draft` and the brief
   verbatim below it, followed by an empty `## Artifacts` table and an
   `## Activity log` holding one line — the filing itself. If the slug already
   exists in any state, do not overwrite it: report where it is and ask whether
   to replace it or file alongside it under the next free slug.
6. Report: the slug, the criteria, the non-goals, anything split off as a second
   ticket, and the path the issue landed at.
7. If the ask itself wants a specialist this team does not employ, say so and
   name `/corporate:hr` — that is a `staffing` gap in the team, and the product
   owner cannot file it (no `Skill` tool, on purpose).

## Gate

Stop. The issue is a `Draft` and nothing is checked out. Do not promote it and
do not run `/corporate:ship` — name the slug and let the user decide when this
piece of work starts. `Draft` exists precisely so that an autonomous run can
never begin on criteria the user has not read.
