---
description: File an issue — dispatch the product owner to turn a vague ask into falsifiable acceptance criteria, and file it as a Draft in the issue store.
argument-hint: <what you want> | --list [state] | --promote <issue> | --status | --init
---

# Brief

Arguments: `$ARGUMENTS`

Stage 0, and asynchronous: this files an issue and stops. It touches no branch
and no working tree, so it can run at any time, on any checkout, without
disturbing whatever is in progress. `/corporate:ship` picks the issue up later
by its number — once the user has promoted it.

This stage decides *what would count as done*, and nothing else. No file,
library or pattern is named here.

## Modes

Read `$ARGUMENTS` first and pick exactly one:

| Argument | What runs |
|---|---|
| `--status` | the store report, then stop |
| `--init` | the label bootstrap, then stop |
| `--list [state]` | the backlog readout, then stop |
| `--promote <issue>` | `Draft` → `Open`, then stop |
| anything else | that text is the ask: the filing flow |

Only the filing flow dispatches `product-owner`. Do not combine modes.

## The store

Read `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` before any mode runs — if
that path does not resolve, find the file under the plugin directory. It owns
the target, the preflight, the record, the four states, the transitions, the
artifact kinds and the key. Run its preflight before the first store operation
of every mode.

There is no backend to resolve and nothing to configure: the store is GitHub
Issues on `origin`, always. A preflight failure is a hard stop naming the check
and the fix, never a fallback.

## Status — `--status`

Report, and nothing else:

- the target `<owner>/<repo>` and its visibility,
- whether the store's four labels exist — if any is missing, name `--init`,
- how many issues sit in each of the four states.

## Init — `--init`

Run once per repository, before the first brief. It is the only thing in this
command that writes to the user's repository.

Run the store's preflight first. A target that cannot work is not worth
bootstrapping. Then, in this order:

1. Report the target `<owner>/<repo>` and its visibility. On a public
   repository, say plainly that every brief, design, plan, review and test
   output filed from here will be world-readable, permanently. This is said once
   and never asked again — filing must stay seamless — so say it clearly.
2. Confirm once, then create the store's labels idempotently.
3. Print the `gh` entries the user needs in their permission allowlist, ready to
   copy. An unattended `/corporate:ship` stalls on every prompt it cannot
   answer, and the store is behind `gh`.

If the bootstrap fails, say which label and stop. A store whose labels do not
exist cannot record a state.

This command writes no settings file. `/corporate:hr` is the only command that
touches `.claude/settings.json`.

## List — `--list [state]`

Number and title per issue, newest first. With a state argument (`draft`,
`open`, `blocked`, `closed`, case-insensitive), only that state; without one,
all four, grouped by state, in the order `Open`, `Draft`, `Blocked`, `Closed`.

This is a backlog readout: do not summarise the issues, rank them, or suggest
which to work on.

## Promote — `--promote <issue>`

`Draft` → `Open` is the user's decision and this is where they express it.

1. Normalise the argument to an issue number and resolve it per the store's
   *The key* and *Finding an issue*. Not in `Draft` ⇒ stop and say which state
   it is in. Already `Open` is not an error, just a no-op worth saying out loud.
2. Show the title and the acceptance criteria, and confirm once. Promoting is
   what makes the issue eligible for an autonomous run — the user must see what
   they are releasing.
3. Make the transition per the store's four steps.
4. Report the new state and name `/corporate:ship <n>`. Do not run it.

Moving an issue out of `Blocked` or `Closed` is also the user's call, but it is
deliberately not a flag here: those need the blocker read first, which is a
conversation, not a command.

## Filing flow

1. If the ask is empty, stop and ask for it in the user's own words. Do not
   invent it, and do not tidy it up — the phrasing is data the product owner
   needs.
2. If the store's labels do not exist, stop and name `--init`. Filing into a
   repository that cannot record a state is filing into nothing.
3. Dispatch the `product-owner` subagent with a brief containing:
   - the ask, verbatim,
   - the repository root and anything relevant from `CLAUDE.md`,
   - that it must return the brief as its final message and write no file — this
     command owns the store, and the agent must not learn where the store is.
4. **If it returns `blocked on answers`:** put its questions to the user as
   written. Do not answer them yourself, do not guess, and do not proceed. When
   the user answers, re-dispatch the `product-owner` with the original ask, its
   previous brief, and the answers quoted. Repeat until `ready` — or until the
   user decides the ask is not worth pursuing, which is a valid end.
5. Read the returned brief yourself. Check that no criterion names a file,
   library or pattern, and that each one could actually fail. If a criterion
   could not, say so rather than filing it.
6. File the record as a `Draft`: the fields, the brief verbatim, and the
   activity log's first line — the filing itself. The number comes back from the
   store; nothing here derives a key.
7. Report: the issue number and its URL, the criteria, the non-goals, and
   anything split off as a second ticket.
8. If the ask itself wants a specialist this team does not employ, say so and
   name `/corporate:hr` — that is a `staffing` gap in the team, and the product
   owner cannot file it (no `Skill` tool, on purpose).

## Gate

Stop. The issue is a `Draft` and nothing is checked out. Do not promote it and
do not run `/corporate:ship` — name the number and let the user decide when this
piece of work starts. `Draft` exists precisely so that an autonomous run can
never begin on criteria the user has not read.
