---
description: Rule whether a design can actually be run, then execute its runbook against a target and verdict the result. Stops when no runbook covers the target; --check rules and executes nothing.
argument-hint: <slug> [--target <env>] [--check] [--runbook <path>] [--without-runbook <target>]
---

# Deploy

Slug: `$1` · Arguments: `$ARGUMENTS`

Not a stage. `/corporate:ship` ends at a pull request, and a deploy happens
after a human merges one — nothing in the pipeline chains this, and this chains
nothing.

Two halves, and `--check` stops after the first: `devops-engineer` rules whether
the design can be operated, then `deployer` executes the runbook. The ruling is
never skipped, because it is what proves there is a documented procedure to run.

## Modes

| Argument | What runs |
|---|---|
| `<slug> [--target <env>]` | slug mode: rule, deploy, file the artifact |
| `<slug> --check` | rule only. Files `ops.md`, executes nothing |
| `--target <env> --runbook <path>` | slug-less: deploy something that was never an issue. Files nothing |

`--target` defaults to the single target the design deploys to. When the design
has more than one, it is required — never pick one.

## Steps

1. **Resolve the slug** per `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md`.
   Not in `Open/` is a hard stop, naming the state it is in. The folder must hold
   `design.md`: the targets are derived from the approach, and there is nothing
   to derive them from otherwise. Missing, stop and name `/corporate:design $1`.

   In slug-less mode skip this entirely — no slug, no store, no artifact — and
   say in the report that nothing was filed.

2. **Do not enter the issue worktree.** This is the one command that
   deliberately diverges from
   `${CLAUDE_PLUGIN_ROOT}/reference/worktree-lifecycle.md`, and the reason is
   that a deploy ships a merged ref, not a feature branch. Instead:
   - record the ref currently checked out (`git rev-parse --short HEAD` and the
     branch name) and state it as what is being deployed;
   - check whether `corporate/$1/work` is merged into it
     (`git branch --merged`). If it is not, say so plainly and let the user
     decide — deploying an unmerged branch is their call, not a hard stop, but it
     is never silent.

3. **Read `${CLAUDE_PLUGIN_ROOT}/reference/runbook.md` yourself.** This command
   is enterable cold and never trusts an earlier one to have checked anything.

4. **Dispatch `devops-engineer`** for the operability ruling, with a brief
   containing:
   - the design **inlined in full** — it cannot read the store,
   - the repository root and the ref from step 2,
   - the runbook reference's contents if `${CLAUDE_PLUGIN_ROOT}` does not resolve
     inside an agent prompt,
   - `--runbook <path>` if one was passed, and any waived targets,
   - that it writes nothing and returns the ruling as its final message.

5. **`--check` stops here.** File the ruling as `ops.md` in the issue folder, add
   its artifact row, append the activity line, report the table and the four
   operability answers. Execute nothing. This is how a design is validated for
   operability without deploying it, and it is worth running right after
   `/corporate:design`.

6. **Gate on the ruling.** Any `required-missing` row for the target being
   deployed is a **hard stop**: name the target, the paths that were tried, the
   missing section if that is the cause, and `--without-runbook <target>`. Never
   soften it to a warning — past this point there is no documented procedure and
   the only alternative is improvising one against a running system.

   A run waived with `--without-runbook` must say what was waived **before**
   dispatching anything, name the waived targets in the brief, and repeat the
   waiver in its final report. A waiver reaches only an absent runbook: a missing
   `## Verify` or `## Rollback` stops the command regardless, per the reference.

7. **Confirm before executing.** One confirmation, naming the target, the ref,
   the runbook path, and the steps that will run. A deploy is outward-facing and
   hard to reverse; the ruling is not the same thing as permission.

8. **Dispatch `deployer`** with a brief containing:
   - the runbook's `## Steps`, `## Verify` and `## Rollback` **inlined
     verbatim**, in order — it cannot read the store and does not resolve paths,
   - the target identifier and the git ref,
   - the output budget from the runbook reference,
   - that it runs the commands exactly as given, never retries, rolls back per
     `## Rollback` on any failure, writes nothing, and returns the report as its
     final message.

9. **Check `git status --short` yourself** when it returns. The deployer holds no
   write tool and must have left the repository untouched; a dirty tree is a
   failed deploy pass, and you report it as one rather than filing the verdict.

10. **File** the report as `deploy-<n>.md` in the issue folder, numbered from 1
    like the reviews and never overwritten — the sequence of deploys is the
    record of what was shipped when. Add its artifact row, append the activity
    line with the verdict, the target and the ref.

11. **Report to the user**: the verdict, the target, the ref, every failing
    command with its verbatim output, the rollback outcome, and the waiver if
    there was one. If the devops engineer filed an HR record, surface that it did
    and name `/corporate:hr`. Do not run it.

## Gate

Stop. Never fix a failing step here, never edit the runbook to make it pass, and
never re-run a deploy hoping for a different exit code — the deployer does not
retry, on purpose.

Route it:

- `failed`, rollback clean ⇒ `/corporate:diagnose $1 "<symptom>"` to find out
  why before trying again.
- `failed`, rollback failed ⇒ say the system is half-rolled-back, quote the
  rollback output, and stop. This one goes to a human immediately.
- `blocked` ⇒ the environment the runbook assumes is not there. Name what was
  missing; the fix is the user's.
