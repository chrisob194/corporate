---
name: corporate-pipeline
description: Use when routing a piece of work through the corporate pipeline, or
  when someone asks what this plugin offers — which stage an ask is at, which
  /corporate command comes next, which role owns a decision, or where a handoff
  file lives. Orientation and routing only; the commands do the work.
---

# The corporate pipeline

Four stages, each one command, each dispatching one role and leaving one file
behind under `docs/corporate/<slug>/`.

| Stage | Command | Role | Leaves behind |
|---|---|---|---|
| 1 | `/corporate:design <slug> "<task>"` | `architect` | `design.md` |
| 2 | `/corporate:plan <slug>` | `planner` | `plan.md` |
| 3 | `/corporate:build <slug>` | `builder` ×N | code + commits |
| 4 | `/corporate:review <slug>` | `reviewer` | `review.md` |

`/corporate:ship <slug> "<task>"` chains all four and keeps every gate.

## Bookends

Two stages sit outside the chain, and `ship` deliberately does not run either —
both need a human present throughout.

| Command | Role | When | Leaves behind |
|---|---|---|---|
| `/corporate:brief <slug> "<ask>"` | `product-owner` | before design, when the ask is not yet falsifiable | `brief.md` |
| `/corporate:qa <slug>` | `qa-engineer` | after build, alongside review | `qa.md` |

## Outside the pipeline

| Command | Role | When |
|---|---|---|
| `/corporate:hr` | `hr-manager` | when the team has filed records about itself under `.corporate/hr/`; `--status` answers whether HR is on here |

Not a stage and not chained by anything. Any role can leave a record mid-dispatch
when the job did not fit the role; this is the command that turns those into
issues on the plugin's own tracker. Name it when records exist — never run it
unprompted, and never as a follow-on to a stage.

## Choosing an entry point

Handoffs are files, so any stage can be entered cold — `/corporate:build <slug>`
needs nothing but the directory. Route on what exists, not on what happened in
this session:

| State of the work | Command |
|---|---|
| The ask cannot fail — no criteria, unclear scope | `brief` |
| Criteria exist, approach not chosen | `design` |
| `design.md` approved, no task breakdown | `plan` |
| `plan.md` exists | `build` |
| Work is built | `review`, and `qa` alongside it |
| All of it, in one go | `ship` |

Check `docs/corporate/<slug>/` before answering: the newest file there names the
stage that is done, and the next row is the command to run.

## What this skill does not do

- **It names a command and stops.** Never dispatch `product-owner`,
  `architect`, `planner`, `builder`, `reviewer` or `qa-engineer` from the main
  session. The agents are contracts; the commands are the choreography, and the
  gates live in them.
- **It never restates a command's steps or gates**, nor the `plan.md` format —
  each of those has exactly one owner, and a second copy rots.
- **It does not stand in for a missing command.** If the `/corporate:*`
  commands are not installed here, say so instead of running the pipeline by
  hand.
