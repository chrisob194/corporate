# The test plan

What a design rules about verification, what a plan turns that ruling into, and
what the `test` stage does with both. The `technical-architect` writes the
verdicts; the `planner` writes the commands; `/corporate:test` and
`/corporate:ship` gate on them. This file is the only definition of the grammar —
do not restate it anywhere else.

## Why the architect rules and the planner does not

"Does this change need an end-to-end run?" is a question about the shape of the
change: does it cross a process boundary, a network, a browser, a real database.
That is the architect's question — it chose those boundaries. The planner does
not get to discover the answer while decomposing tasks, because by then the
approach is already fixed and the honest answer would be a guess.

"Which command runs it" is the opposite: it needs the task breakdown, the files,
the runner the repository actually has. That is the planner's.

So the ruling and the command are two sections in two artifacts, and the stage
reads both.

## The design section

One section in the issue's `design.md`, **exactly three rows**, always all three
present:

```markdown
## Verification

| Layer | Verdict | Why | Environment |
|---|---|---|---|
| unit | required | pure parser logic, boundaries matter | — |
| integration | required | crosses the settings-file reader | — |
| e2e | not-required | no UI, and no process boundary is crossed | — |
```

`Layer` is exactly one of `unit`, `integration`, `e2e`, in that order. A design
missing a row is incomplete — an omitted layer is not a `not-required` layer.

### Verdicts

Exactly one of two words.

| Verdict | Means |
|---|---|
| `required` | this layer has to run before the branch leaves |
| `not-required` | nothing in this approach turns on this layer |

`not-required` is a real answer, not an escape hatch. A change to a pure
function does not need an end-to-end run. A change to how two processes agree on
a session does.

### `Environment`

Mandatory prose on a `required` row, `—` on a `not-required` one. It names what
the layer needs in order to run at all: a server on a port, a browser, a seeded
database, fixture files, a credential.

It exists for the unattended path. `/corporate:ship` has nobody to ask, so it
must be able to know **before** it starts whether the layer it is about to run
can run at all. An `Environment` cell reading `—` on a `required` e2e row is a
defect in the design, not a convenience.

## The plan section

One section in the issue's `plan.md`, one row per suite, and rows only for layers
the design verdicted `required`:

```markdown
## Test suites

| Suite | Layer | Command | Setup |
|---|---|---|---|
| unit | unit | `bun test` | — |
| store integration | integration | `bun test test/integration` | — |
```

- **`Suite`** — a short name, unique within the plan. It is what the report and
  the activity line refer to.
- **`Layer`** — one of the three, and it must be a layer the design verdicted
  `required`.
- **`Command`** — one command, runnable from the repository root, exactly as it
  will be run. Not a description of a command.
- **`Setup`** — a command that must run first, or `—`. Starting a server,
  seeding a database, building a bundle. One command; if a layer needs three
  steps, that is a task in the plan, not a `Setup` cell.

A `required` layer the planner cannot name a command for is a **design gap**, and
the planner reports it as one through the mechanism it already has. It never
invents a runner the repository does not have, and it never quietly downgrades
the layer — the verdict is not its to change.

Per-task `acceptance` lines are a different thing and stay untouched: acceptance
proves one task, a suite proves the branch. Neither replaces the other.

## What the tester reports

The `tester` runs the table and nothing else. Its vocabulary is fixed here.

Per suite, one of four:

| Result | Means |
|---|---|
| `pass` | ran, exit 0 |
| `fail` | ran, non-zero, and non-zero again on one re-run |
| `flaky` | non-zero, then zero on the re-run |
| `blocked` | could not start — missing runner, missing server, missing fixture |

The roll-up is one of three: `pass`, `fail`, `blocked`.

The `tester` carries this mapping in its own instructions rather than reading it
here — it is dispatched with the suite rows and nothing else, deliberately, so
that nothing it does can turn on a document it was not given. The two must stay
in step: change the vocabulary here and `agents/tester.md` changes with it.

- any suite `blocked` ⇒ roll-up `blocked`. An unrun suite is not a green suite.
- otherwise any suite `fail` or `flaky` ⇒ roll-up `fail`. A nondeterministic
  end-to-end run is not a passing branch; the report names it `flaky` so whoever
  classifies the defect can see which kind it is.
- otherwise `pass`.

## What the stage does with it

The stage reads the design and the plan **itself**, every run. Any stage can be
entered cold, so a stage that trusts an earlier one to have checked is a stage
that does not check.

| The design says | The plan says | The stage does |
|---|---|---|
| `not-required` for a layer | no row for it | skips that layer, in one line, quoting the design's `Why` |
| `not-required` for all three | no rows at all | skips the whole stage — no dispatch — and still appends an activity line |
| `required` for a layer | no row for it | **hard stop.** This is a plan defect |
| `required` for a layer | a row | runs it |
| no `## Verification` section | — | **hard stop.** An unverified design is not a verified-clear design |

The asymmetry is the point. A skipped layer is legal only when a named role wrote
down that it is not needed and why. Absence of a suite is never itself permission
to skip one, and neither is absence of the section.

There is no waiver flag. A layer that should not run is a layer the architect
verdicts `not-required`, in the design, where a human reads it at the gate.

### The hand-driven stage

`/corporate:test <slug>` stops on every hard stop above, names the section or the
row that is missing, and stops. On a `fail` it reports the output and stops at
its gate — routing a failure is the user's call, not the stage's.

### The unattended stage

`/corporate:ship` cannot stop and ask, so each stop becomes a route:

| Situation | What ship does |
|---|---|
| roll-up `pass` | continue to review |
| roll-up `fail` | that cycle's review brief carries the failing output verbatim; route on the origin the reviewer returns |
| roll-up `blocked` | issue → `Blocked`, `blocked_reason` naming the suite and what was missing |
| `required` layer with no row | a review cycle with origin `plan` |
| no `## Verification` section | a review cycle with origin `design` |

A test failure never gets its own retry counter. It rides the review cycle it
occurred in, so the caps that already terminate the loop keep terminating it.

## Who classifies a failure

Not the tester. It reports the exit code and the output, and stops.

The `reviewer` owns `origin: implementation | plan | design` and is the only role
that owns it — it reads the diff, the design and the plan, which is what
classifying actually requires. A failing suite reaches it as evidence in its
brief, verbatim, and comes back classified like any other blocking finding.
