# plan.md format

The grammar of a corporate implementation plan. The `planner` agent writes it;
`/corporate:build` reads it. This file is the only definition — do not restate
the format anywhere else.

## Shape

```markdown
# Plan — <slug>

One paragraph: what this plan delivers, and the shape of the approach it comes
from. No restating the design.

## T1 — Short imperative title
depends_on: none
files: scripts/validate.ts
acceptance: `bun scripts/validate.ts --json` prints valid JSON; `bun run validate` still exits 0
steps:
  - Add a failing test for the JSON shape.
  - Parse the flag from process.argv.
  - Emit the report object instead of the console lines when set.

## T2 — Second task
depends_on: T1
files: README.md, docs/authoring.md
acceptance: `grep -q -- --json README.md`
steps:
  - Document the flag in the validate section.

## Test suites

| Suite | Layer | Command | Setup |
|---|---|---|---|
| unit | unit | `bun test` | — |

## Waves

| Wave | Tasks | Runs in parallel |
|---|---|---|
| 1 | T1 | — |
| 2 | T2 | — |
```

## Field rules

- **Task id** — `T<n>`, unique within the plan, in the heading as `## T<n> — <title>`.
- **`depends_on`** — comma-separated task ids, or `none`. Only real ordering
  constraints. Do not serialize tasks that merely feel sequential.
- **`files`** — the complete set of paths the task may touch, comma-separated.
  This is a contract: a builder that needs a file outside its list stops and
  reports. A missing path is a plan bug, not a builder decision. New files are
  listed too.
- **`acceptance`** — a command someone can run, or an observable behaviour a
  command can demonstrate. "Code is clean", "types are correct", "it works" are
  not acceptance. If the task genuinely cannot be checked by running something,
  say so explicitly: `acceptance: none — <why>`.
- **`steps`** — a short list, one line each. Enough for a builder with no other
  context to act. Test-first where a test is possible.

## Test suites

The section is required, and its grammar is **not defined here** — it lives in
`reference/test-plan.md`, together with the design ruling it answers. All this
file says is that the section belongs in the plan, after the tasks, and that its
rows are per-layer suites rather than per-task acceptance.

The two are different instruments and neither substitutes for the other: an
`acceptance` line proves one task did what it was specified to do; a suite row
proves the branch as a whole still works.

## Sizing

One task = one builder, one pass. If a task needs a second pass to finish, it
was two tasks. If two tasks always have to be read together to make sense, they
were one.

## Waves

The wave table is derived, not authored freely: wave *n* holds every task whose
dependencies all sit in earlier waves. It exists so a human can see the
parallelism at a glance before approving.

Tasks in the same wave run concurrently, each in its own git worktree, so
overlapping `files:` between siblings does not corrupt anything — but it does
produce merge conflicts. Prefer splitting along file boundaries; where that is
impossible, add a `depends_on` and accept the serialization.

## Hard stops for the reader

`/corporate:build` must refuse to run, rather than guess, when:

- a `depends_on` names an id that does not exist,
- the dependency graph has a cycle,
- a task has no `acceptance` line at all (as opposed to an explicit `none — …`),
- two task headings share an id,
- the `## Test suites` section is missing, or a layer the design ruled
  `required` has no row in it. Both are defined in `reference/test-plan.md`;
  neither is a reason to guess a command.
