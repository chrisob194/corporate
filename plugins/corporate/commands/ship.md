---
description: Run the full corporate pipeline for one task — design, plan, build, review — stopping for approval at each gate.
argument-hint: <slug> <task description>
---

# Ship

Slug: `$1` · Problem: `$2`

Chains the four stages for work small enough not to need hand-driving. It does
not remove the gates — it only saves you typing between them.

## Sequence

1. **Design** — follow `/corporate:design $1 "$2"` in full, including its
   checks. Report the recommendation. **Stop and wait for approval.** Open
   questions in the design must be answered before continuing.
2. **Plan** — follow `/corporate:plan $1` in full, including plan validation.
   Print the wave table. **Stop and wait for approval.**
3. **Build** — follow `/corporate:build $1` in full. Halt on the first failed
   wave or merge conflict and report; do not push past it looking for progress.
4. **Review** — follow `/corporate:review $1`. Report the verdict and blocking
   findings.

## Rules

- The two approval gates are not optional and not batchable. Do not present
  design and plan together for one combined yes.
- Never auto-fix review findings. Report them and stop; the user chooses what
  happens next.
- Never claim a stage succeeded without the evidence that stage produces —
  a written artifact, or command output pasted verbatim.
- If a stage's artifact already exists, ask before replacing it rather than
  starting the pipeline over.
- `/corporate:brief` and `/corporate:qa` are deliberately not chained here. The
  brief is an interview with the user and qa ends in a decision about failing
  tests — both need a human in the loop for their whole duration, which is the
  one thing chaining removes. Run them by hand around this.

## When not to use this

If the design is likely to need argument, or the plan has more than a handful of
tasks, run the stages by hand. Chaining is for work whose shape you already
trust — it concentrates four decisions into one sitting, which is exactly wrong
when any of them is contested.
