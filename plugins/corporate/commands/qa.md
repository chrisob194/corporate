---
description: Dispatch the QA engineer to attack built behaviour, write the missing tests and run them — on a slug after review, or free-form with --explore.
argument-hint: <slug> [commit-range] | --explore "<area>"
---

# QA

Arguments: `$ARGUMENTS`

The reviewer reads the diff; QA runs the thing. Two modes, and they are not
variations of each other:

| Argument | What runs |
|---|---|
| `<slug> [range]` | slug mode: the last gate on `corporate/<slug>/work` |
| `--explore "<area>"` | explore mode: no slug, no artifact, no commit |

Slug mode belongs **after** `/corporate:review`, not alongside it. The reviewer
is static and write-less; QA runs behaviour and writes tests, which is strictly
more expensive and strictly later. It is the last gate before the branch leaves,
so a run before review spends itself on code review is about to change.

## Slug mode

1. Require `docs/corporate/$1/plan.md`. Without it QA cannot tell what
   acceptance already covered, and spends itself re-testing ground the builders
   already proved. Missing, stop and say so.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/artifact-branch.md` and follow its
   *Entering a stage* section: clean tree, then `corporate/$1/work`. **Hard
   stop, not a warning.**
3. If `docs/corporate/$1/review.md` does not exist, say so — QA before review is
   allowed, and the user's call, but it is not the intended order and they should
   know they are making that choice.
4. Determine the range under attack. Default to the merge commits produced by
   `/corporate:build $1` — find them with
   `git log --oneline --grep="corporate/$1/"`. If `$2` was given, use it. State
   the range you settled on before dispatching.
5. Resolve the brief for `$1` through
   `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md`. It is the only statement of
   what the user asked for, in their words; a missing one is not an error.
6. Dispatch the `qa-engineer` subagent with a brief containing:
   - the resolved brief path if there is one, and
     `docs/corporate/$1/design.md` and `plan.md`,
   - the commit range and the diff command that produces it,
   - the output path `docs/corporate/$1/qa.md`.
7. When it returns, check `git status --short` and `git diff --stat` yourself:
   every file it touched must be a test file or `qa.md`. A non-test source file
   in there is a failed QA pass — report it as one and do not commit.
8. Report to the user: the verdict, each failing behaviour with its output, and
   what QA said it could not cover.
9. Commit per the reference's *commit gate*: one confirmation, only `qa.md` and
   the test files staged, message `test(corporate): qa for $1`. The tests are
   kept whether they pass or fail — a failing test that documents real
   behaviour is the output, not a mistake.

## Explore mode — `--explore "<area>"`

For attacking something that is not a slug: an area, a feature, an app someone
else built. No plan, no design, no branch, no artifact.

1. Do not create or switch a branch, and do not require a clean tree. Report
   what HEAD is so the user knows what was tested.
2. Dispatch the `qa-engineer` with the area verbatim, the repository root, and
   that it may run anything but must **write nothing** — this mode ends in a
   report, not a test file.
3. Report the failing behaviours with their output, and what it could not reach.
4. If something is worth keeping, the way to keep it is `/corporate:brief` with
   what broke. Name that; do not file it.

## Both modes

If the QA engineer filed an HR record, surface that it did and name
`/corporate:hr`. Do not run it.

## Gate

Stop. Never fix a failing test's cause here — a failure goes back through
`/corporate:build`, and whether it is worth fixing now is the user's call.
