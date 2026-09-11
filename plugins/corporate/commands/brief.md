---
description: The tracker in one command — file an issue as a Draft, write or amend its spec through the product owner, amend the brief, promote it, unblock it, reopen it, or read the backlog. Takes plain English as readily as a flag.
argument-hint: <what you want> | --spec <issue> [change] | --promote|--unblock|--reopen|--update <issue> | --list [state] | --status | --init
---

# Brief

Arguments: `$ARGUMENTS`

Stage 0. Most of this command reads or writes the tracker and stops — it
touches no branch and no working tree, so it can run at any time, on any
checkout, without disturbing whatever is in progress. Spec mode is the one
exception: it creates the issue's branch and worktree (the first point either
exists) and commits `spec.md` there, the same write-and-commit sequence
`/corporate:design` uses for `design.md`/`plan.md`. `/corporate:run` picks an
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
| `--spec <issue> [change]` | generate or amend `spec.md` through `product-owner`, then stop |
| `--promote <issue>` | `Draft` → `Open`, then stop |
| `--unblock <issue>` | `Blocked` → `Open`, then stop |
| `--reopen <issue>` | `Closed` → `Open`, then stop |
| `--update <issue> [what changed]` | amend the title or the brief, then stop |
| filing | that text is the ask |

Exactly one mode runs. Only spec mode dispatches `product-owner`; nothing here
chains into another stage.

### Picking the mode

The flags are the definition — they are what a script and an unattended caller
use, and they are never removed. Plain English is a resolver in front of them,
and it resolves to one of those same modes or to nothing:

1. **An explicit flag wins.** Do not classify text that carries one.
2. Otherwise read `$ARGUMENTS` as an intent and match it to one mode. "what's in
   the backlog" is `--list`; "12 is unblocked, I wrote the playbook" is
   `--unblock 12`; "promote 12" is `--promote 12`; "write the spec for #12",
   "spec this out" or "generate the spec now" is `--spec 12`.
3. **A mode that changes a record needs the key in the text** — `12`, `#12` or
   the issue URL. A verb with no key is a stop that asks which issue. Never list
   the backlog and pick one, and never infer the issue from what this session
   was doing before.
4. **Filing is the fallback, and only when no mode matched.** Text that reads as
   a question about the tracker rather than an ask for work — "what is blocked",
   "show me the open ones", "did 12 pass" — is a stop that asks which mode was
   meant. Filing it would put a question in the backlog as work.
5. Resolving is not permission. Every confirmation below still happens, and
   whatever text a mode carries forward — the filed ask, a stated change — is
   passed on **verbatim**: the resolver chooses a mode, it never rewrites,
   tidies or summarises the user's words.

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
   repository, say plainly that every brief, spec, design, plan, review and
   test output filed from here will be world-readable, permanently. This is said once
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
2. **No `spec` artifact filed ⇒ hard stop**, naming `--spec <n>` (or "write the
   spec for #n"). Promoting on criteria nobody wrote down is exactly what
   `Draft` exists to prevent, and the spec is where those criteria now live.
3. Read the current `spec.md` — working tree first, else `git show
   corporate/<n>/work:docs/corporate/<n>/spec.md` — and show its `## Problem`,
   `## User scenarios`, `## Functional requirements` and `## Non-goals`
   sections, then confirm once. Promoting is what makes the issue eligible for
   an autonomous run — the user must see what they are releasing.
4. Make the transition per the store's four steps.
5. Report the new state and name `/corporate:design <n>`, which reads the spec
   and either runs the full pass or, if a feasibility-check `design.md` is
   already filed, asks before replacing it — and `/corporate:run <n>`. Do not
   run either.

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
   looks resolved. You cannot see the world outside the record. For a `design`,
   `plan` or `review`, the note names a path and a sha; read the document with
   `git show <sha>:docs/corporate/<n>/<kind>.md` — this command runs in the
   user's own checkout, not the worktree — and if that sha does not resolve
   locally, say so out loud rather than guessing at the contents.
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
   plan defect `/corporate:design <n>` reported. Re-check the design's
   `## Stack readiness` by the same read as step 2:
   `git show <sha>:docs/corporate/<n>/design.md`.
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

The ask *is* the brief: nothing is asked back except a missing ask, and
nothing is dispatched. This is meant to be cheap — the real authoring pass is
spec mode below; this step only captures the idea as it was stated, usually
right after a `whiteboard` conversation settled on one.

1. If the ask is empty, stop and ask for it in the user's own words. Do not
   invent it, and do not tidy it up — the phrasing is data `product-owner`
   reads later, at spec time.
2. If the store's labels do not exist, stop and name `--init`. Filing into a
   repository that cannot record a state is filing into nothing.
3. File the record as a `Draft`: the fields, the ask verbatim as the brief, the
   same text again as the `brief` artifact numbered 1, and the activity log's
   first line — the filing itself. The number comes back from the store;
   nothing here derives a key. The artifact is not redundant bookkeeping: it is
   what makes the body's copy replaceable later without losing the text it
   replaced.
4. Report: the issue number and its URL, and name `--spec <n>` (or "write the
   spec for #n") as the next step. There are no criteria or non-goals yet —
   that is spec mode's job, not this one's.

## Spec — `--spec <issue> [change]`

Turns the captured brief into `spec.md` through `product-owner`, or amends an
existing one. This is the real authoring pass — the dialogue that used to
happen through inline `[NEEDS CLARIFICATION:` markers on a headless dispatch
now already happened live, in the `whiteboard` conversation before filing, so
this step is closer to a single formalize-and-write pass than a negotiation.

1. Normalise and resolve the issue. `Closed` ⇒ refuse, name filing a new
   issue — the pull request already answered the old spec, and amending it now
   rewrites the question after the answer was given.
2. **No `spec` artifact filed yet (Create):** the issue body — the captured
   brief, verbatim — is the whole input. On `Open` only, show the brief and
   confirm once before dispatching; on `Draft` or `Blocked`, no confirmation.
   **A `spec` artifact already exists (Amend):** if no change text was given,
   ask for it in the user's own words, verbatim — do not propose the change
   yourself. On `Open` only, show the current spec's key sections and confirm
   once before dispatching.
3. If the record holds no `worktree`, create one now per
   `${CLAUDE_PLUGIN_ROOT}/reference/worktree-lifecycle.md`'s *Entering an
   issue* — this is the first point one exists for this issue. Record `branch`
   and `worktree` on the record. If one is already recorded, enter it instead
   — this is a redo, not a first pass.
4. Dispatch the `product-owner` subagent with a brief containing:
   - **Create:** the captured brief, verbatim. **Amend:** the current
     `spec.md` content and the change, quoted verbatim.
   - the repository root and anything relevant from `CLAUDE.md`,
   - the spec format spec path
     `${CLAUDE_PLUGIN_ROOT}/reference/spec-format.md` — if that path does not
     resolve, read the file yourself and inline its contents into the brief
     instead,
   - that it must return the spec as its final message and write no file —
     this command owns the store and the branch, and the agent must not learn
     where either is.
5. Read the returned spec yourself. Check that no section names a file,
   library or pattern. Scan for `[NEEDS CLARIFICATION:` — its presence is
   never a reason to re-dispatch.
6. File it: write `docs/corporate/<n>/spec.md` and commit it alone, per the
   store reference's `### Relocated kinds — spec, design, plan and review`.
   The commit runs before the note is posted. Post the numbered three-line
   note, then append the activity line.
7. Report: the committed path and short sha, the spec's `## Problem`,
   `## User scenarios`, `## Functional requirements` and `## Non-goals`, and
   anything split off as a second ticket. Print every `[NEEDS CLARIFICATION:`
   marker verbatim, name re-running this mode with the answer as the way to
   resolve one, and say that promoting with a marker outstanding is the user's
   call.
8. If the ask wants a specialist this team does not employ, say so and name
   `/corporate:hr` — a `staffing` gap, and `product-owner` cannot file it (no
   `Skill` tool, on purpose).

## Update — `--update <issue> [what changed]`

Amends **the title and the brief, and nothing else.** No `product-owner`
dispatch — the brief is just the captured idea's text, and there is nothing to
structure, only to replace. A field is never edited here: `branch`, `worktree`
and `pr` belong to the run, `blocked_reason` and `closed_reason` belong to the
transition that set them.

The store forbids editing a filed brief everywhere except this command, and the
reason it can make an exception is the ordering in step 5 — the replacement is
recorded as an artifact *before* the body's copy is overwritten, so no text is
ever lost to an edit no diff would catch.

### What state allows it

| State | What happens |
|---|---|
| `Draft` | amend and report — no confirmation; the superseded brief survives as the previous numbered artifact |
| `Blocked` | amend and report — no confirmation; the superseded brief survives as the previous numbered artifact |
| `Open` | one confirmation: the current and new brief text shown side by side — naming that a run may be in flight right now and that a `spec` already filed was produced against the old text |
| `Closed` | refuse. Name filing a new issue |

`Closed` is a refusal rather than a warning: the pull request already answered
the old criteria, and amending them rewrites the question after the answer was
given.

### Flow

1. Normalise and resolve per the store. Read the current title and the current
   brief — an amendment argued from memory is an amendment to something else.
2. If no change text was given, ask for it in the user's own words, verbatim, by
   the same rule as filing. Do not propose the change yourself.
3. On `Open` only: show the current and new brief text side by side and confirm
   once.
4. Write, **in this order**: post the new text as the next `brief` artifact;
   then replace the body's copy from it, asserting per the store that everything
   above `<!-- corporate:end -->` came back byte-identical; then append the
   activity line, `<who>` = `orchestrator`, the clause naming what changed. A
   title change is one `gh issue edit --title` and is logged in the same line.
5. Report which filed artifacts are now stale — a `spec` filed before this
   change answers the old text, and any `design`/`plan` built on that spec
   inherits the staleness. Name `--spec <n>` (to regenerate the spec) if one is
   filed, and stop. **Delete nothing and renumber nothing**: a stale artifact
   is superseded by a newer one of its kind, which is the only supersession
   this store has.

## Gate

Stop, whichever mode ran. No stage is chained: name the issue number and the
command that would come next, and let the user decide when this piece of work
starts or resumes. Spec mode is the one mode that checks a worktree out — it
still never proceeds past filing `spec.md` into a design or a build.

After filing that means: do not generate the spec, do not promote, and do not
run `/corporate:run`. After spec mode: do not promote. `Draft` exists
precisely so that an autonomous run can never begin on criteria the user has
not read — and the three transitions above exist so that the same gate is
crossed deliberately, once, with a reason on the record.
