---
description: Undo a deployment by running its runbook's rollback procedure, then verify it. Refuses when the runbook has no rollback section — there is no waiver for that.
argument-hint: <slug|--target <env>> [--runbook <path>] [--to <ref>] [--without-runbook <target>]
---

# Rollback

Arguments: `$ARGUMENTS`

Its own command rather than a flag on `/corporate:deploy`, because this one gets
run during an incident and the obvious command beats a remembered flag.

It executes the runbook's `## Rollback` and nothing else. It does not decide
whether a rollback is the right answer — `/corporate:diagnose` answers that, and
`release` is the routing that names this command.

## Steps

1. **Resolve the runbook** per `${CLAUDE_PLUGIN_ROOT}/reference/runbook.md`, read
   by you. In slug mode resolve `$1` per
   `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` first and read the most
   recent `deploy-<n>.md` — it says what was deployed and whether a rollback
   already ran, and rolling back twice is its own incident.

2. **Hard stop when the runbook has no `## Rollback` section.** Name the runbook
   path and the missing section. There is **no waiver for this** and
   `--without-runbook` does not reach it: the flag covers a target nobody has
   documented, not a documented procedure that cannot be undone. Improvising a
   rollback against a running system is worse than not having one, because it
   looks like a rollback.

   A target with no runbook at all is the ordinary `required-missing` stop, and
   `--without-runbook <target>` does reach that — with the usual cost: say it
   before dispatching, name it in the brief, repeat it in the report, one
   `knowledge` HR record per target.

3. **State what will happen, then confirm.** One confirmation, showing:
   - the target and the runbook path,
   - the current ref, and `--to <ref>` if one was given,
   - **every rollback command that will run, verbatim**.

   This is the most outward, least reversible thing the plugin does. The user
   reads the actual commands before it runs, not a summary of them.

4. **Dispatch `deployer`** with a brief containing:
   - the `## Rollback` commands **inlined verbatim**, in order, as its steps,
   - the runbook's `## Verify` inlined — a rollback is verified the same way a
     deploy is, and an unverified rollback is a hope,
   - an empty rollback section: there is nothing to undo an undo with, and the
     agent must be told that explicitly so it does not go looking,
   - the target, the ref, and the output budget from the runbook reference,
   - that it runs the commands exactly as given, never retries, and stops at the
     first failure.

5. **A failed rollback stops everything.** Say which command failed, quote its
   output verbatim, state that the system is in a partial state, and hand it to
   the user. Do not attempt a second rollback, a repair, or a redeploy.

6. **Check `git status --short`**, then **file**, slug mode only:
   `rollback-<n>.md` in the issue folder, numbered from 1, never overwritten.
   Add its artifact row, append the activity line with the outcome, the target
   and the ref rolled back from. Target mode files nothing.

7. **Report**: the outcome, every command with its exit code, the verify result,
   and what is now running.

## Gate

Stop. A successful rollback means the previous version is back, not that the
defect is understood — `/corporate:diagnose` is what finds that out, and
`/corporate:brief` is what turns it into work.
