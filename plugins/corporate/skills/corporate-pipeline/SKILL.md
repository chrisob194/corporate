---
name: corporate-pipeline
description: Use when routing a piece of work through the corporate pipeline, or
  when someone asks what this plugin offers — which stage an ask is at, which
  /corporate command comes next, which role owns a decision, or where an issue
  and its artifacts live. Orientation and routing only; the commands do the work.
---

# The corporate pipeline

One issue is one unit of work. It lives in the issue store, in one of four
states, and every artifact the pipeline produces is recorded on it — but the
`spec`, the `design`, the `plan` and the `review` are files in the repository
under `docs/corporate/<issue>/`, and the issue keeps a note pointing at each.
Two versions of a relocated document are compared as a git diff on the file,
which is why they are in the repository at all. The code lives on the issue's
own branch, in its own worktree — created the first time `spec.md` is written,
not at design time.

| Stage | Command | Role | Artifact |
|---|---|---|---|
| 0 | `/corporate:brief` (filing) | — | `brief`, numbered, body-mirrored |
| 0 | `/corporate:brief --spec <issue>` | `product-owner` | `spec` file, numbered note — creates the worktree |
| 0 (optional) | `/corporate:design <issue> --lite` | `technical-architect` | `design` file, feasibility only, no plan |
| 1 | `/corporate:design <issue>` | `technical-architect` | `design` and `plan` files, notes on the issue |
| 2 | `/corporate:build <issue>` | `builder` ×N | code + commits |
| 3 | `/corporate:test <issue>` | `tester` | `test`, numbered |
| 4 | `/corporate:review <issue>` | `reviewer` | `review` file, numbered note |

Stage 0 is where an idea becomes a written spec, and optionally gets a
feasibility read, before anything commits to being built. It runs on `Draft`
— promoting to `Open` (which stages 1–4 require) is gated on a `spec` already
being filed. The lite design pass is genuinely optional; most issues skip it.
Both `brief` and `design` resolve plain English in front of their flags — "capture
this", "write the spec for #12", "check the stack for #12" all work without
memorizing a flag.

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
goal is holding it open. `run` always prints a working default `/goal` line;
the `goal-suggest` skill answers "give me a goal for issue #n" on request, for
a sharper one, but nothing files or dispatches to produce it — it is a
suggestion made inline, in this session, not a stage.

Both work in the issue's worktree on `corporate/<n>/work`, and each builder's
`corporate/<n>/<task-id>` merges into it. Only `run` pushes and opens a PR;
nothing in the plugin merges one.

## Issue state

Four states: `Draft`, `Open`, `Blocked`, `Closed`. How one is recorded — an
open/closed status plus a label — is the store's business.

**Work is assigned on `Open` and only on `Open`.** `brief` files to `Draft`;
only the user promotes (`/corporate:brief --promote <issue>`), and promoting is
itself gated on a `spec` already being filed. Only the user moves an issue out
of `Blocked` (`--unblock`) or `Closed` (`--reopen`). The orchestrator moves
`Open` → `Blocked` and `Open` → `Closed`, and nothing else. Every user-only
transition is a mode of `brief`, and each one records why it was made.

## The ends of the chain

`run` chains neither, and both need a human present throughout.

| Command | Role | When | Leaves behind |
|---|---|---|---|
| `/corporate:brief "<ask>"` | — | any time — one sentence is enough | a `Draft` issue, no `product-owner` dispatch |
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

Filing takes no issue: it files one and stops, touching no branch and no
working tree. The issue number comes back from it and is what every later
command takes as its first argument, as `123`, `#123` or the issue URL. Spec
mode is the exception — it needs an issue and it creates the worktree. `qa`
also runs issue-less as `/corporate:qa --explore "<area>"`, which writes
nothing at all.

## Outside the pipeline

| Command | Role | When |
|---|---|---|
| `/corporate:split <issue>` | `product-owner` | when a filed plan's tasks should become independently trackable issues |
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
| You have an ask, however rough | `brief` ("capture this") |
| Filed, no `spec` yet | `brief --spec <issue>` ("write the spec for #n") |
| `Draft` or `Open`, and you just want a feasibility read | `design <issue> --lite` ("check the stack for #n") |
| The issue is a `Draft` with a `spec` filed | `brief --promote <issue>` |
| `Open`, and you want it done without supervision | `run` |
| Starting a `/loop` or `/schedule` and want a sharper `/goal` than the default | the `goal-suggest` skill |
| `Open`, no full `design` artifact yet, and you want to argue | `design` |
| a `plan` filed | `build` |
| a `plan` filed whose tasks should run as separate issues | `split` |
| an issue holding a `split` artifact | `split --status`, never `build` |
| Work is built | `test` |
| a `test` filed and passing | `review`, then `qa` |
| A suite failed | `build --task T<n>` if it is one task's, otherwise `review` to classify it |
| `Blocked` | read `blocked_reason` — the fix is a playbook, an answer, or a decision. Then `brief --unblock <issue>` |
| `Closed`, and the work came back | `brief --reopen <issue>` |
| The record's description was wrong or incomplete | `brief --update <issue>` |
| The pull request is merged and it has to run somewhere | `deploy` |
| It was deployed and stopped working | `diagnose`, then `rollback` if that routes `release` |

`/corporate:brief --list` enumerates the issues with their states.

## What this skill does not do

- **It names a command and stops.** Never dispatch `product-owner`,
  `technical-architect`, `builder`, `tester`,
  `reviewer`, `qa-engineer`, `devops-engineer` or `deployer` yourself. The agents are contracts; the commands are the choreography. The one
  session that dispatches roles directly is `/corporate:run`, because it *is*
  the orchestrator — and it is a command, invoked by name, not a thing to
  imitate by hand.
- **It never restates a command's steps or gates**, nor the plan format, nor
  the verification grammar, nor the spec format, nor the store's layout — each
  of those has exactly one owner, and a second copy rots.
- **It does not stand in for a missing command.** If the `/corporate:*`
  commands are not installed here, say so instead of running the pipeline by
  hand.
