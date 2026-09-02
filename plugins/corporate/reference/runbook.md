# The runbook

The document a deployment follows. `devops-engineer` rules on whether one
exists and is usable; `deployer` executes it and nothing else. This file is the
only definition of what a runbook is, where it is found, what it must contain
and how it is waived — do not restate any of that anywhere else.

## Why a runbook and not a role

Every other role in this team is trusted to work out *how* from a description of
*what*. Deployment is the exception, and deliberately so: the cost of an
improvised step is paid by a running system that other people are using, and it
is paid immediately. A role that can invent a deploy procedure will invent one
on the day the real procedure was merely hard to find.

So the obligation runs the other way here. **The runbook is the authority. A
target with no runbook is a hard stop, not an invitation.** The user can force a
run past it, per invocation, and that costs a record — the same shape as
`stack-readiness.md` and its `--without-playbook` waiver, on purpose, so this
plugin has one waiver idiom rather than two.

## Where it lives

In the **consumer's repository**, versioned with the code it deploys. Not in the
issue store: an issue's artifacts are records of a decision, while a runbook is
part of the software's operating surface and has to change when a deploy step
changes.

Resolution order, **first hit wins**:

1. `--runbook <path>` passed on the invocation.
2. A path named in the issue's `design.md`, where the approach says how it ships.
3. `docs/runbooks/<target>.md`.

There is no `.claude/settings.json` key for this, and there must never be one:
`/corporate:brief` and `/corporate:hr` are the only commands in this plugin that
go near that file.

**Always name the path you resolved, and the rule that resolved it.** A deploy
that ran a runbook the user did not know about is a deploy nobody can explain.

## Required sections

A runbook is one target. Five sections, spelled exactly as below. What a missing
one means is not a matter of judgment:

| Section | Holds | Missing means |
|---|---|---|
| `## Target` | the bare environment identifier this runbook is for | this is not the runbook for the requested target — keep resolving |
| `## Steps` | the ordered commands that perform the deploy | **hard stop.** There is nothing to execute |
| `## Verify` | the commands that prove the deploy worked, and what their success looks like | **hard stop.** A deploy with no success criterion cannot be verdicted |
| `## Rollback` | the ordered commands that undo it | **hard stop** for `/corporate:deploy`, and `/corporate:rollback` is unavailable |
| `## Diagnostics` | what to collect when it breaks — log locations, health endpoints, status commands | `/corporate:diagnose` degrades to generic evidence-gathering and must say that it did |

A command in `## Steps`, `## Verify` or `## Rollback` is executed **verbatim**.
Prose that describes an action rather than naming the command is not a step, and
a runbook whose `## Steps` are all prose is a runbook with no steps.

## Deployment readiness

The ruling `devops-engineer` produces, one row per target the design's approach
deploys to:

```markdown
## Deployment readiness

| Target | Runbook | Verdict | Basis |
|---|---|---|---|
| production | docs/runbooks/production.md | covered | all five sections present |
| staging | — | required-missing | no runbook names this target |
| local | — | not-required | the design ships nothing to it |
```

`Target` is a bare environment identifier — `production`, `staging`, `local`.
Never a hostname, a URL, a repository name or a phrase. It is the same value
`hr-report` accepts as `subject`, and for the same reason: the row can end up on
a public tracker.

| Verdict | Means | `Basis` holds |
|---|---|---|
| `covered` | a runbook resolves for this target and carries the sections the job needs | the runbook path, and which sections were found |
| `not-required` | the design deploys nothing to this target | one line saying why not |
| `required-missing` | the design deploys here and no runbook resolves, or the one that resolves is missing a section the job needs | the resolution attempts that failed, or the missing section |

`not-required` is a real answer, not an escape hatch. A design that adds a
library to a service already running in production still deploys to production.

## What the commands do with it

`covered` and `not-required` pass. Any `required-missing` row is a **hard stop**
for `/corporate:deploy` and `/corporate:rollback`. The command names the target,
the paths it tried, and the waiver flag, and stops.

Each command resolves the runbook itself. Any command can be invoked cold, so a
command that trusts an earlier one to have checked is a command that does not
check. A design with no `## Deployment readiness` ruling is not a ruled-clear
design — it is an unruled one, and the ruling is produced on the spot.

## The waiver

```
/corporate:deploy   <slug> --without-runbook <target>[,<target>]
/corporate:rollback <slug> --without-runbook <target>[,<target>]
```

Only a human passes it, never a command on its own behalf, and it waives only
the targets it names.

A waived run must:

1. Say what was waived, before dispatching anything.
2. Name the waived targets in the dispatch brief, as a standing instruction to
   file one `knowledge` HR record per target and to mark in the artifact every
   step taken from memory rather than from a runbook.
3. Repeat the waiver in its final report, so it shows up at the gate.

A waiver is per invocation. It is never remembered, never written to a file, and
never inferred from the fact that an earlier command was waived.

### What no waiver covers

**A missing `## Verify` and a missing `## Rollback` cannot be waived.** The
waiver exists for a target nobody has documented yet — it is not permission to
run a procedure that cannot tell you whether it worked, or that cannot be
undone. Those two stop the command regardless of what was passed.

There is also no unattended path. `/corporate:ship` ends at a pull request and
chains nothing here; a deploy happens after a human merges one.
