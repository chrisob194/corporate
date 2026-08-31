---
name: corporate-pipeline
description: Use when routing a piece of work through the corporate pipeline, or
  when someone asks what this plugin offers — which stage an ask is at, which
  /corporate command comes next, which role owns a decision, or where a handoff
  file lives. Orientation and routing only; the commands do the work.
---

# The corporate pipeline

Four stages, each one command, each dispatching one role and leaving one file
behind under `docs/corporate/<slug>/`, committed on the slug's own branch
`corporate/<slug>/work`.

| Stage | Command | Role | Leaves behind |
|---|---|---|---|
| 1 | `/corporate:design <slug> "<task>"` | `technical-architect` | `design.md` |
| 2 | `/corporate:plan <slug>` | `planner` | `plan.md` |
| 3 | `/corporate:build <slug>` | `builder` ×N | code + commits |
| 4 | `/corporate:review <slug>` | `reviewer` | `review.md` |

`/corporate:ship <slug> "<task>"` chains all four and keeps every gate.

One branch per slug: stage 1 creates `corporate/<slug>/work`, stages 2–4 commit
onto it, and each builder's `corporate/<slug>/<task-id>` merges into it. Nothing
in the plugin merges it out or pushes it.

## The ends of the chain

`ship` deliberately chains neither, and both need a human present throughout.

| Command | Role | When | Leaves behind |
|---|---|---|---|
| `/corporate:brief "<ask>"` | `product-owner` | any time, before design — the ask is not yet falsifiable | an issue in the store |
| `/corporate:qa <slug>` | `qa-engineer` | stage 5: after review, last gate before the branch leaves | `qa.md` + tests |

`brief` is asynchronous and takes no slug: it files an issue and stops, touching
no branch and no working tree, and the store it files to is configurable
(`--status`, `--use local|github`, `--list`). The slug comes back from it and is
what every later command takes as its first argument. `qa` also runs slug-less
as `/corporate:qa --explore "<area>"`, which writes nothing at all.

## Outside the pipeline

| Command | Role | When |
|---|---|---|
| `/corporate:hr` | `hr-manager` | when the team has filed records about itself under `.corporate/hr/`; `--status` answers whether HR is on here |

Not a stage and not chained by anything. Any role can leave a record mid-dispatch
when the job did not fit the role; this is the command that turns those into
issues on the plugin's own tracker. Name it when records exist — never run it
unprompted, and never as a follow-on to a stage.

## Choosing an entry point

Handoffs are committed files, so any stage can be entered cold —
`/corporate:build <slug>` needs nothing but the branch and the directory. Route
on what exists, not on what happened in this session:

| State of the work | Command |
|---|---|
| The ask cannot fail — no criteria, unclear scope | `brief` |
| An issue exists, approach not chosen | `design` |
| `design.md` approved, no task breakdown | `plan` |
| `plan.md` exists | `build` |
| Work is built | `review`, then `qa` |
| All of it, in one go | `ship` |

Check `docs/corporate/<slug>/` before answering: the newest file there names the
stage that is done, and the next row is the command to run. Briefs are not in
there — they live in the issue store, outside the repository, and
`/corporate:brief --list` is what enumerates them.

## What this skill does not do

- **It names a command and stops.** Never dispatch `product-owner`,
  `technical-architect`, `planner`, `builder`, `reviewer` or `qa-engineer` from
  the main session. The agents are contracts; the commands are the
  choreography, and the gates live in them.
- **It never restates a command's steps or gates**, nor the `plan.md` format —
  each of those has exactly one owner, and a second copy rots.
- **It does not stand in for a missing command.** If the `/corporate:*`
  commands are not installed here, say so instead of running the pipeline by
  hand.
