---
name: corporate-pipeline
description: Use when routing a piece of work through the corporate pipeline, or
  when someone asks what this plugin offers — which stage an ask is at, which
  /corporate command comes next, which role owns a decision, or where an issue
  and its artifacts live. Orientation and routing only; the commands do the work.
---

# The corporate pipeline

One issue is one unit of work. It lives in the issue store outside the
repository, in one of four state folders, and every artifact the pipeline
produces is filed beside it. The code lives on the issue's own branch, in its
own worktree.

| Stage | Command | Role | Files, in the issue folder |
|---|---|---|---|
| 1 | `/corporate:design <slug>` | `technical-architect` | `design.md` |
| 2 | `/corporate:plan <slug>` | `planner` | `plan.md` |
| 3 | `/corporate:build <slug>` | `builder` ×N | code + commits |
| 4 | `/corporate:test <slug>` | `tester` | `test-<n>.md` |
| 5 | `/corporate:review <slug>` | `reviewer` | `review-<n>.md` |

`/corporate:ship <slug>` runs all five **unattended**, routes the retries, and
ends at a pull request.

Stage 4 runs the suites the plan declares — unit, integration, end-to-end — and
verdicts them. Whether a layer is needed at all is ruled in the design and
nowhere else, so a skipped layer is always a skip somebody signed. Which suites
exist, and what a skipped or unrunnable layer means, is defined in
`reference/test-plan.md`.

## The two ways to run it

| | hand-driven | `/corporate:ship` |
|---|---|---|
| who decides between stages | the user, at a gate after each | nobody — it does not stop |
| a review finding | reported, the user chooses | routed back by defect origin, up to 3 cycles |
| a failing suite | reported at the gate, the user routes it | the failing output goes into that cycle's review brief, and the reviewer classifies it |
| a suite that cannot run at all | reported, the user fixes the environment | the issue goes to `Blocked` |
| a `required-missing` stack | the user may waive it with `--without-playbook` | the issue goes to `Blocked` |
| a design gap | the user answers it | the issue goes to `Blocked` |
| how it ends | wherever the user stops | a pull request, or `Blocked` |

Both work in the issue's worktree on `corporate/<slug>/work`, and each builder's
`corporate/<slug>/<task-id>` merges into it. Only `ship` pushes and opens a PR;
nothing in the plugin merges one.

## Issue state

Four folders, and the state is the folder: `Draft`, `Open`, `Blocked`, `Closed`.

**Work is assigned on `Open` and only on `Open`.** `brief` files to `Draft`;
only the user promotes (`/corporate:brief --promote <slug>`), and only the user
moves an issue out of `Blocked`. The orchestrator moves `Open` → `Blocked` and
`Open` → `Closed`, and nothing else.

## The ends of the chain

`ship` chains neither, and both need a human present throughout.

| Command | Role | When | Leaves behind |
|---|---|---|---|
| `/corporate:brief "<ask>"` | `product-owner` | any time, before design — the ask is not yet falsifiable | a `Draft` issue |
| `/corporate:qa <slug>` | `qa-engineer` | stage 6: after review, last gate before the branch leaves | `qa.md` + tests |

Before `brief` there is the `whiteboard` skill: the divergent conversation that
turns an idea into one ask. It is not a stage, has no command and no role, and
writes nothing — it ends by naming `brief`.

`qa` and the `test` stage are not variations of each other, and confusing them
is how a pipeline gets an expensive gate twice and a cheap one never. The
`tester` runs suites somebody already declared and returns a verdict — cheap,
deterministic, and therefore safe inside `ship`. `qa-engineer` decides what
nobody tested, writes those tests, and ends in a decision about the failures it
found — which is why `ship` never runs it.

`brief` is asynchronous and takes no slug: it files an issue and stops, touching
no branch and no working tree. The slug comes back from it and is what every
later command takes as its first argument. `qa` also runs slug-less as
`/corporate:qa --explore "<area>"`, which writes nothing at all.

## Outside the pipeline

| Command | Role | When |
|---|---|---|
| `/corporate:hr` | `hr-manager` | when the team has filed records about itself under `.corporate/hr/`; `--status` answers whether HR is on here |
| `/corporate:deploy <slug>` | `devops-engineer`, then `deployer` | after a pull request is merged; `--check` rules operability without deploying |
| `/corporate:diagnose <slug> "<symptom>"` | `devops-engineer` | when something that was deployed stopped working |
| `/corporate:rollback <slug>` | `deployer` | when a diagnosis routes `release` |

Not stages and not chained by anything. `hr` turns the records roles leave about
themselves into issues on the plugin's own tracker — name it when records exist,
never run it unprompted.

The three devops commands are post-merge: `ship` ends at a pull request, nothing
in this plugin merges one, and a deploy happens after a human does. They follow a
runbook in the consuming repository and refuse a target no runbook covers;
`reference/runbook.md` defines the runbook, the readiness verdicts and the
waiver. `/corporate:deploy <slug> --check` is also the way to ask whether a
design can be operated at all, which is worth doing right after
`/corporate:design`.

## Choosing an entry point

Route on what exists, not on what happened in this session. The issue folder
answers it: the newest artifact names the stage that is done.

| State of the work | Command |
|---|---|
| The idea is not yet one ask — shapes still open | the `whiteboard` skill |
| The ask cannot fail — no criteria, unclear scope | `brief` |
| The issue is a `Draft` | `brief --promote <slug>` |
| `Open`, and you want it done without supervision | `ship` |
| `Open`, no `design.md`, and you want to argue | `design` |
| `design.md` filed, no `plan.md` | `plan` |
| `plan.md` filed | `build` |
| Work is built | `test` |
| `test-<n>.md` filed and passing | `review`, then `qa` |
| A suite failed | `build --task T<n>` if it is one task's, otherwise `review` to classify it |
| `Blocked` | read `blocked_reason` — the fix is a playbook, an answer, or a decision |
| The pull request is merged and it has to run somewhere | `deploy` |
| It was deployed and stopped working | `diagnose`, then `rollback` if that routes `release` |

`/corporate:brief --list` enumerates the issues with their states.

## What this skill does not do

- **It names a command and stops.** Never dispatch `product-owner`,
  `technical-architect`, `planner`, `builder`, `tester`, `reviewer`,
  `qa-engineer`, `devops-engineer` or `deployer` yourself. The agents are contracts; the commands are the choreography. The one
  session that dispatches roles directly is `/corporate:ship`, because it *is*
  the orchestrator — and it is a command, invoked by name, not a thing to
  imitate by hand.
- **It never restates a command's steps or gates**, nor the `plan.md` format,
  nor the verification grammar, nor the store layout — each of those has exactly one owner, and a second copy
  rots.
- **It does not stand in for a missing command.** If the `/corporate:*`
  commands are not installed here, say so instead of running the pipeline by
  hand.
