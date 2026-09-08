---
description: The tracker in one command — file an issue as a Draft through the product owner, amend one, promote it, unblock it, reopen it, or read the backlog. Takes plain English as readily as a flag.
argument-hint: <what you want> | --promote|--unblock|--reopen|--update <issue> | --list [state] | --status | --init
---

# Brief

Arguments: `$ARGUMENTS`

Stage 0, and asynchronous: this reads or writes the tracker and stops. It
touches no branch and no working tree, so it can run at any time, on any
checkout, without disturbing whatever is in progress. `/corporate:run` picks an
issue up later by its number — once the user has promoted it.

It is also **every transition the store reserves to the user**: `Draft` → `Open`,
`Blocked` → `Open`, `Closed` → `Open`. Those are one command because they are one
decision — *this piece of work is eligible to run now* — and a user who has to
find three commands for it edits the label by hand instead, which skips clearing
`blocked_reason` and skips the activity line, and leaves the record lying about
itself.

This stage decides *what would count as done*, and nothing else. No file,
library or pattern is named here.

## Modes

| Mode | What runs |
|---|---|
| `--status` | the store report, then stop |
| `--init` | the label bootstrap, then stop |
| `--list [state]` | the backlog readout, then stop |
| `--promote <issue>` | `Draft` → `Open`, then stop |
| `--unblock <issue>` | `Blocked` → `Open`, then stop |
| `--reopen <issue>` | `Closed` → `Open`, then stop |
| `--update <issue> [what changed]` | amend the title or the brief, then stop |
| filing | that text is the ask |

Exactly one mode runs. Only the filing flow and `--update` dispatch
`product-owner`; nothing here chains into another stage.

### Picking the mode

The flags are the definition — they are what a script and an unattended caller
use, and they are never removed. Plain English is a resolver in front of them,
and it resolves to one of those same modes or to nothing:

1. **An explicit flag wins.** Do not classify text that carries one.
2. Otherwise read `$ARGUMENTS` as an intent and match it to one mode. "what's in
   the backlog" is `--list`; "12 is unblocked, I wrote the playbook" is
   `--unblock 12`; "promote 12" is `--promote 12`.
3. **A mode that changes a record needs the key in the text** — `12`, `#12` or
   the issue URL. A verb with no key is a stop that asks which issue. Never list
   the backlog and pick one, and never infer the issue from what this session
   was doing before.
4. **Filing is the fallback, and only when no mode matched.** Text that reads as
   a question about the tracker rather than an ask for work — "what is blocked",
   "show me the open ones", "did 12 pass" — is a stop that asks which mode was
   meant. Filing it would put a question in the backlog as work.
5. Resolving is not permission. Every confirmation below still happens, and the
   ask is still passed to `product-owner` **verbatim** — the resolver chooses a
   mode, it never rewrites, tidies or summarises the user's words.

Say which mode you resolved to, and on anything but a flag say it before you act
on it.

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
   copy. An unattended `/corporate:run` stalls on every prompt it cannot
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
4. Report the new state and name `/corporate:design-loop <n>` — which designs how
   this issue should run unattended and hands over the two lines to paste — and
   `/corporate:run <n>`, which is the driver a designed pipeline loop names and
   is also correct on its own. Do not run either.

## Unblock — `--unblock <issue>`

`Blocked` → `Open`. The blocker must be read before it is cleared, so this
command *is* that conversation — the steps below are not skippable and there is
no fast path through them.

1. Normalise and resolve per the store. Not in `Blocked` ⇒ stop and say which
   state it is in.
2. **Read the blocker out loud**, before anything is asked: `blocked_reason`, the
   activity line that recorded the transition into `Blocked`, and — where the
   reason points at one — the artifact that caused it, newest of its kind. Quote
   them; do not summarise, and do not offer an opinion on whether the blocker
   looks resolved. You cannot see the world outside the record.
3. Ask what changed. **One sentence, required**: an empty answer is a stop, not a
   default. That sentence becomes the clause in the activity line, and it is the
   only record of why this issue was released.
4. Say where `/corporate:run` will resume and whether that stage will hit the
   same wall again. It resumes on what the record holds — the newest artifact of
   a kind names the stage that is done — so a blocker that lives *inside* a filed
   artifact is not cleared by reopening the issue. The case that matters: a run
   blocked on a `required-missing` stack re-reads the same `design` and blocks
   again, so if the design's `## Stack readiness` still verdicts that stack
   `required-missing`, name `/corporate:design <n>` rather than `run`. Same for a
   plan defect the planner reported.
5. Confirm once, then make the transition per the store's four steps —
   `blocked_reason` is **cleared**, not left behind, and the activity line
   carries the user's sentence.
6. Report both states and name the command from step 4. Do not run it.

## Reopen — `--reopen <issue>`

`Closed` → `Open`, for work that came back. Same shape as `--unblock`, with three
differences:

- read `closed_reason` and the `pr` field out loud instead of `blocked_reason`;
- the transition is two calls and the order is load-bearing — the store's table
  says which;
- say that the pull request in `pr`, if there is one, stays open and is now a
  pull request against a reopened issue. Nothing here closes, merges or updates
  it, and the next run will push onto the same branch.

If the work that came back is a *different* piece of work, say so and name
filing a new issue instead. A closed issue with a merged pull request is a
finished record, and reopening it to hold something else destroys the account of
what shipped.

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
6. File the record as a `Draft`: the fields, the brief verbatim, the brief again
   as the `brief` artifact numbered 1, and the activity log's first line — the
   filing itself. The number comes back from the store; nothing here derives a
   key. The artifact is not redundant bookkeeping: it is what makes the body's
   copy replaceable later without losing the text it replaced.
7. Report: the issue number and its URL, the criteria, the non-goals, and
   anything split off as a second ticket.
8. If the ask itself wants a specialist this team does not employ, say so and
   name `/corporate:hr` — that is a `staffing` gap in the team, and the product
   owner cannot file it (no `Skill` tool, on purpose).

## Update — `--update <issue> [what changed]`

Amends **the title and the brief, and nothing else.** A field is never edited
here: `branch`, `worktree` and `pr` belong to the run, `blocked_reason` and
`closed_reason` belong to the transition that set them.

The store forbids editing a filed brief everywhere except this command, and the
reason it can make an exception is the ordering in step 6 — the replacement is
recorded as an artifact *before* the body's copy is overwritten, so no text is
ever lost to an edit no diff would catch.

### What state allows it

| State | What happens |
|---|---|
| `Draft` | amend freely — nothing has run against these criteria |
| `Blocked` | amend freely — nothing is running |
| `Open` | a **second** confirmation, naming that a run may be in flight right now and that every artifact already filed was produced against the old criteria |
| `Closed` | refuse. Name filing a new issue |

`Closed` is a refusal rather than a warning: the pull request already answered
the old criteria, and amending them rewrites the question after the answer was
given.

### Flow

1. Normalise and resolve per the store. Show the current title and the current
   brief in full — an amendment argued from memory is an amendment to something
   else.
2. If no change text was given, ask for it in the user's own words, verbatim, by
   the same rule as filing. Do not propose the change yourself.
3. Dispatch `product-owner` with: the original ask, the current brief, the change
   quoted verbatim, and that it must return **the whole new brief**, not a diff,
   as its final message, writing no file. Its `blocked on answers` loop is the
   filing flow's, unchanged.
4. Check the returned brief as at filing: no criterion names a file, library or
   pattern, and each one could fail.
5. Show the old and the new acceptance criteria side by side and confirm once —
   twice on `Open`, per the table.
6. Write, **in this order**: post the new brief as the next `brief` artifact;
   then replace the body's copy from it, asserting per the store that everything
   above `<!-- corporate:end -->` came back byte-identical; then append the
   activity line, `<who>` = `product-owner`, the clause naming what changed. A
   title change is one `gh issue edit --title` and is logged in the same line.
7. Report which filed artifacts are now stale — a `design` filed before an
   amended criterion answers the old question, and a `plan` under it inherits
   that. Name `/corporate:design <n>` and stop. **Delete nothing and renumber
   nothing**: a stale artifact is superseded by a newer one of its kind, which is
   the only supersession this store has.

## Gate

Stop, whichever mode ran. Nothing is checked out and no stage is chained: name
the issue number and the command that would come next, and let the user decide
when this piece of work starts or resumes.

After filing that means: do not promote it and do not run `/corporate:run`.
`Draft` exists precisely so that an autonomous run can never begin on criteria
the user has not read — and the three transitions above exist so that the same
gate is crossed deliberately, once, with a reason on the record.
