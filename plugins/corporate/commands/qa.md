---
description: Dispatch the QA engineer to attack built behaviour, write the missing tests and run them.
argument-hint: <slug> [commit-range]
---

# QA

Slug: `$1` · Range: `${2:-HEAD}`

Runs after `/corporate:build`, alongside `/corporate:review` rather than instead
of it: the reviewer reads the diff, QA runs the thing. Either can be skipped;
neither substitutes for the other.

## Steps

1. Require `docs/corporate/$1/plan.md`. Without it QA cannot tell what acceptance
   already covered, and spends itself re-testing ground the builders already
   proved. Missing, stop and say so.
2. Determine the range under attack. Default to the merge commits produced by
   `/corporate:build $1` — find them with
   `git log --oneline --grep="corporate/$1/"`. If `$2` was given, use it. State
   the range you settled on before dispatching.
3. Dispatch the `qa-engineer` subagent with a brief containing:
   - the paths to `docs/corporate/$1/brief.md` (if it exists), `design.md` and
     `plan.md`,
   - the commit range and the diff command that produces it,
   - the output path `docs/corporate/$1/qa.md`.
4. When it returns, check `git status --short` and `git diff --stat` yourself:
   every file it touched must be a test file. A non-test source file in there is
   a failed QA pass, and you report it as one.
5. Report to the user: the verdict, each failing behaviour with its output, and
   what QA said it could not cover.

## Gate

Stop. Never fix a failing test's cause here — a failure goes back through
`/corporate:build`, and whether it is worth fixing now is the user's call.
