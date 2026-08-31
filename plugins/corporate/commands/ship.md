---
description: Run the full corporate pipeline for one task — design, plan, build, review — stopping for approval at each gate.
argument-hint: <slug> <task description> [--without-playbook <stack>]
---

# Ship

Slug: `$1` · Problem: `$2`

Chains the four stages for work small enough not to need hand-driving. It does
not remove the gates — it only saves you typing between them. Everything happens
on `corporate/$1/work`, the branch stage 1 creates.

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
- Each stage's commit confirmation is its own, and separate from the approval
  gate above it. Four stages, and no confirmation covers the next one. Never ask
  once for permission to commit everything this run produces.
- A `--without-playbook` waiver is passed through to stages 2 and 3 only if the
  user gave it to this command. Never invent one to get past a stack the design
  ruled `required-missing` — that gate is the user's to open, and the run stops
  there until they do.
- Never auto-fix review findings. Report them and stop; the user chooses what
  happens next.
- Never claim a stage succeeded without the evidence that stage produces —
  a written artifact, or command output pasted verbatim.
- If a stage's artifact already exists, ask before replacing it rather than
  starting the pipeline over.
- `/corporate:brief` and `/corporate:qa` are deliberately not chained here. The
  brief is an interview with the user and qa ends in a decision about failing
  tests — both need a human in the loop for their whole duration, which is the
  one thing chaining removes. File the brief before this, run qa after it.
- Nothing here merges `corporate/$1/work` out or pushes it. Ship names the
  pipeline, not a release.

## When not to use this

If the design is likely to need argument, or the plan has more than a handful of
tasks, run the stages by hand. Chaining is for work whose shape you already
trust — it concentrates four decisions into one sitting, which is exactly wrong
when any of them is contested.
