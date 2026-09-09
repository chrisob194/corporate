---
name: corporate-pipeline
description: Use when routing a piece of work through the corporate pipeline, or
  when someone asks what this plugin offers — which stage an ask is at, which
  /corporate command comes next, which role owns a decision, or where an issue
  and its artifacts live. Orientation and routing only; the commands do the work.
---

# The corporate pipeline

One issue is one unit of work. It lives in the issue store, never in the
repository, in one of four states, and every artifact the pipeline produces is
recorded on it. The code lives on the issue's own branch, in its own worktree.

| Stage | Command | Role | Artifact |
|---|---|---|---|
| 0 | `/corporate:design-loop <issue>` | `loop-engineer` | `loop`, numbered |
| 1 | `/corporate:design <issue>` | `technical-architect` | `design` and `plan` |
| 2 | `/corporate:build <issue>` | `builder` ×N | code + commits |
| 3 | `/corporate:test <issue>` | `tester` | `test`, numbered |
| 4 | `/corporate:review <issue>` | `reviewer` | `review`, numbered |

Stage 0 is optional and stands apart from the four under it: it decides *how this
issue runs unattended* rather than doing any of the work, and it produces two
lines to paste — a kickoff and a `/goal` condition. Whether the exit is a state a
role asserted or a number a tool printed is ruled there and nowhere else;
`reference/loop-design.md` defines the families, the signal ladder and the
artifact. Skip it and stages 1–4 still run exactly as they always did.

The store is GitHub Issues on the repository `origin` points at, and
`reference/issue-store.md` owns all of it. There is nothing to configure;
`/corporate:brief --init` bootstraps the labels once and `--status` reports the
target.

`/corporate:run <issue>` runs all four **unattended**, routes the retries, and
ends at a pull request.

Stage 3 runs the suites the plan declares — unit, integration, end-to-end — and
verdicts them. Whether a layer is needed at all is ruled in the design and
nowhere else, so a skipped layer is always a skip somebody signed. Which suites
exist, and what a skipped or unrunnable layer means, is defined in
`reference/test-plan.md`.

## The two ways to run it

| | hand-driven | `/corporate:run` |
|---|---|---|
| who decides between stages | the user, at a gate after each | nobody — it does not stop |
| a review finding | reported, the user chooses | routed back by defect origin, up to 3 cycles |
| a failing suite | reported at the gate, the user routes it | the failing output goes into that cycle's review brief, and the reviewer classifies it |
| a suite that cannot run at all | reported, the user fixes the environment | the issue goes to `Blocked` |
| a `required-missing` stack | the user may waive it with `--without-playbook` | the issue goes to `Blocked` |
| a design gap | the user answers it | the issue goes to `Blocked` |
| how it ends | wherever the user stops | a pull request, `Blocked`, or `store-unreachable` |
| what keeps it going | the user, turn by turn | a `/goal` condition the user pasted — `run` prints the line, it cannot set one |

`run` is unattended, not autonomous: a session stops after each turn unless a
goal is holding it open. That goal is what `design-loop` designs, and `run`
prints a working default for issues that never had one designed.

Both work in the issue's worktree on `corporate/<n>/work`, and each builder's
`corporate/<n>/<task-id>` merges into it. Only `run` pushes and opens a PR;
nothing in the plugin merges one.

## Issue state

Four states: `Draft`, `Open`, `Blocked`, `Closed`. How one is recorded — an
open/closed status plus a label — is the store's business.

**Work is assigned on `Open` and only on `Open`.** `brief` files to `Draft`;
only the user promotes (`/corporate:brief --promote <issue>`), and only the user
moves an issue out of `Blocked` (`--unblock`) or `Closed` (`--reopen`). The
orchestrator moves `Open` → `Blocked` and `Open` → `Closed`, and nothing else.
Every user-only transition is a mode of `brief`, and each one records why it was
made.

## The ends of the chain

`run` chains neither, and both need a human present throughout.

| Command | Role | When | Leaves behind |
|---|---|---|---|
| `/corporate:brief "<ask>"` | `product-owner` | any time, before design — the ask is not yet falsifiable | a `Draft` issue |
| `/corporate:qa <issue>` | `qa-engineer` | stage 5: after review, last gate before the branch leaves | a `qa` artifact + tests |

Before `brief` there is the `whiteboard` skill: the divergent conversation that
turns an idea into one ask. It is not a stage, has no command and no role, and
writes nothing — it ends by naming `brief`.

`qa` and the `test` stage are not variations of each other, and confusing them
is how a pipeline gets an expensive gate twice and a cheap one never. The
`tester` runs suites somebody already declared and returns a verdict — cheap,
deterministic, and therefore safe inside `run`. `qa-engineer` decides what
nobody tested, writes those tests, and ends in a decision about the failures it
found — which is why `run` never runs it.

`brief` is asynchronous and takes no issue: it files one and stops, touching
no branch and no working tree. The issue number comes back from it and is what
every later command takes as its first argument, as `123`, `#123` or the issue
URL. `qa` also runs issue-less as
`/corporate:qa --explore "<area>"`, which writes nothing at all.

## Outside the pipeline

| Command | Role | When |
|---|---|---|
| `/corporate:hr` | `hr-manager` | when the team has filed records about itself under `.corporate/hr/`; `--status` answers whether HR is on here |
| `/corporate:deploy <issue>` | `devops-engineer`, then `deployer` | after a pull request is merged; `--check` rules operability without deploying |
| `/corporate:diagnose <issue> "<symptom>"` | `devops-engineer` | when something that was deployed stopped working |
| `/corporate:rollback <issue>` | `deployer` | when a diagnosis routes `release` |

Not stages and not chained by anything. `hr` turns the records roles leave about
themselves into issues on the plugin's own tracker — name it when records exist,
never run it unprompted.

The three devops commands are post-merge: `run` ends at a pull request, nothing
in this plugin merges one, and a deploy happens after a human does. They follow a
runbook in the consuming repository and refuse a target no runbook covers;
`reference/runbook.md` defines the runbook, the readiness verdicts and the
waiver. `/corporate:deploy <issue> --check` is also the way to ask whether a
design can be operated at all, which is worth doing right after
`/corporate:design`.

## Choosing an entry point

Route on what exists, not on what happened in this session. The issue record
answers it: the newest artifact names the stage that is done.

| State of the work | Command |
|---|---|
| The idea is not yet one ask — shapes still open | the `whiteboard` skill |
| The ask cannot fail — no criteria, unclear scope | `brief` |
| The issue is a `Draft` | `brief --promote <issue>` |
| `Open`, and you want it done without supervision | `run` |
| `Open`, and what would end the run is not obvious — or its exit is a number, not a review | `design-loop` |
| a `loop` artifact filed, family `measured` | paste that artifact's own kickoff and goal line; **not** `run` |
| a `loop` artifact filed, family `pipeline` | `run`, then paste that artifact's goal line |
| `Open`, no `design` artifact, and you want to argue | `design` |
| a `plan` filed | `build` |
| Work is built | `test` |
| a `test` filed and passing | `review`, then `qa` |
| A suite failed | `build --task T<n>` if it is one task's, otherwise `review` to classify it |
| `Blocked` | read `blocked_reason` — the fix is a playbook, an answer, or a decision. Then `brief --unblock <issue>` |
| `Closed`, and the work came back | `brief --reopen <issue>` |
| The criteria were wrong or incomplete | `brief --update <issue>` |
| The pull request is merged and it has to run somewhere | `deploy` |
| It was deployed and stopped working | `diagnose`, then `rollback` if that routes `release` |

`/corporate:brief --list` enumerates the issues with their states.

## What this skill does not do

- **It names a command and stops.** Never dispatch `product-owner`,
  `loop-engineer`, `technical-architect`, `builder`, `tester`,
  `reviewer`, `qa-engineer`, `devops-engineer` or `deployer` yourself. The agents are contracts; the commands are the choreography. The one
  session that dispatches roles directly is `/corporate:run`, because it *is*
  the orchestrator — and it is a command, invoked by name, not a thing to
  imitate by hand.
- **It never restates a command's steps or gates**, nor the plan format, nor
  the verification grammar, nor the loop grammar, nor the store's layout — each of
  those has exactly one owner, and a second copy rots.
- **It does not stand in for a missing command.** If the `/corporate:*`
  commands are not installed here, say so instead of running the pipeline by
  hand.
