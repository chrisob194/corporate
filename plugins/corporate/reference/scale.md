# Scale

The ruling a design carries about how big the change is. The
`technical-architect` writes it; `/corporate:ship` gates on it. This file is the
only definition — do not restate the grammar anywhere else.

## Why the architect rules and nobody else

The scale of a change is a fact about the approach, and the approach is what the
architect chose. Nobody upstream can know it: the brief describes a behaviour,
not the shape of the code that delivers it. Nobody downstream may decide it —
the orchestrator would be choosing how much scrutiny its own run gets, and a
role that grades its own homework is not a gate.

The verdict exists because the pipeline costs the same on a one-file fix as on a
twelve-task feature. It is a ruling about *the work*, never about how
interesting the problem was.

## Shape

One section in the issue's `design.md`, exactly one row:

```markdown
## Scale

| Verdict | Reason |
|---|---|
| small | One surface, one task, no new dependency, no interface change |
```

`Reason` is one line. It names what makes the verdict true, not what the change
does — the design already says that.

## Verdicts

Exactly one of two words.

| Verdict | Means |
|---|---|
| `small` | the change fits the small lane on every criterion below |
| `standard` | anything else |

A `small` verdict requires **all** of:

- it fits one builder in one pass — one task, not two that could be merged,
- it touches one coherent file set,
- it adds no dependency,
- it changes no public interface, schema or migration,
- no stack in `## Stack readiness` is `required-missing`.

**The tie goes to the expensive lane.** Anything not clearly `small` is
`standard`. A verdict is not a prediction about how the build will go; when the
architect is weighing the two, the answer is `standard`.

## What the lanes differ on

`small` licenses a **short-form design**: the recommended approach, the three
verdict tables (`## Stack readiness`, `## Verification`, `## Scale`), and the
rejected alternatives named in one line each instead of argued. Everything the
later stages read is still there — only the prose is smaller.

In `/corporate:ship`, `small` also means: the planner is dispatched cheaper and
owes exactly one task with no wave table, the build skips the wave loop and runs
that task, and the retry caps tighten to **2 review cycles and 0 design redos**.
The reviewer is unchanged, at full model and effort. The lane removes machinery,
never oversight.

`standard` is the pipeline as it has always been.

## What the stages do with it

`/corporate:design` validates the section like the other two: it exists, the
verdict is one of the two words, the reason is present. A missing or unruled
section is a design defect — re-dispatch rather than file it.

`/corporate:ship` reads the section itself, every run. It is enterable cold, so
trusting `/corporate:design` to have checked is not checking. A design with no
`## Scale` section is not a `standard` design: it is a `design`-origin review
cycle, the same treatment a missing `## Verification` section gets.

The hand-driven `/corporate:plan` and `/corporate:build` ignore the verdict
entirely. A human at a gate does not need a lane.

## The hint

```
/corporate:design <slug> --small
/corporate:ship <slug> --small
```

A hint, never an instruction. It is forwarded into the architect's brief and the
architect still rules — it may return `standard`, and when it does, the run is
`standard`. There is no flag that sets the verdict, because a lane nobody ruled
on is a lane nobody is accountable for.
