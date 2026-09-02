---
description: Diagnose a broken or failed deployment — collect the evidence the runbook names, return one cause with the proof for it, and route the fix. Changes nothing.
argument-hint: <slug> "<symptom>" | --target <env> "<symptom>"
---

# Diagnose

Arguments: `$ARGUMENTS`

Read-only, in both modes. This command finds out why something stopped working.
It never fixes it, never restarts it, and never rolls it back — those are the
user's call, and `/corporate:rollback` is the command for one of them.

| Argument | What runs |
|---|---|
| `<slug> "<symptom>"` | slug mode: diagnoses a deployment of that issue, files `diagnose-<n>.md` |
| `--target <env> "<symptom>"` | target mode: no slug, no artifact, writes nothing |

The symptom is required in both. "It's broken" is not a symptom — ask for what
was observed, when it started, and what changed, before dispatching anything.
A diagnosis of an unstated problem is an audit, and it costs the same as one.

## Steps

1. **Resolve the runbook** per `${CLAUDE_PLUGIN_ROOT}/reference/runbook.md`, read
   by you, not by the agent. Its `## Diagnostics` section is the map: log
   locations, health endpoints and status commands for *this* system.

   No runbook, or no `## Diagnostics` section, is **not** a stop here — unlike
   `/corporate:deploy`, diagnosing collects evidence and changes nothing, so the
   worst case is a slower diagnosis. Say plainly that you are working without the
   map, and require the agent to say the same in its report.

2. **Slug mode only**: resolve `$1` per
   `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md`. `Open` or `Blocked` both
   diagnose fine — a broken deployment is exactly how an issue reaches `Blocked`.
   If the folder holds a `deploy-<n>.md`, read the most recent one: what the last
   deploy did, and whether it rolled back, is the single most useful piece of
   evidence there is.

3. **Do not switch branch or worktree.** Record what is checked out so the user
   knows what state the diagnosis was made against, and leave it alone.

4. **Dispatch `devops-engineer`** with a brief containing:
   - the symptom **verbatim**, not paraphrased,
   - the target, and the runbook's `## Diagnostics` section inlined if one
     resolved — plus a statement that it did not, if it did not,
   - the most recent `deploy-<n>.md` inlined, in slug mode, when one exists,
   - the repository root and the ref that is checked out,
   - that its `Bash` is read-only, that it changes nothing on the target, and
     that it returns the diagnosis as its final message.

   Do **not** inline the plan. A diagnosis is about a running system, and the
   task breakdown that produced it tells you nothing about why it stopped.

5. **Check `git status --short`** when it returns, the way `/corporate:test` and
   `/corporate:qa` do. Anything changed is a failed diagnosis pass — report it as
   one and do not file the artifact.

6. **File**, slug mode only: `diagnose-<n>.md` in the issue folder, numbered from
   1, never overwritten. Add its artifact row, append the activity line with the
   cause and the routing. Target mode files nothing at all.

7. **Report to the user**: the cause, the evidence that proves it, what was ruled
   out, and the routing. If more than one cause survived, give the one
   observation that separates them and stop there rather than picking.

## Routing

The diagnosis ends in exactly one of four, and each names what the user does
next:

| Routing | Next |
|---|---|
| `code` | `/corporate:brief "<what broke>"` — a defect worth an issue |
| `release` | `/corporate:rollback` — this release is bad, the previous one was not |
| `environment` | the user's fix: configuration, credentials, capacity, a dependency outside this system |
| `unknown` | say what evidence could not be reached and why. Do not guess to close it |

## Gate

Stop. Never apply the fix here, in either mode — not a restart, not a config
change, not a redeploy. The command that changes a running system is
`/corporate:deploy` or `/corporate:rollback`, both of which ask first.
