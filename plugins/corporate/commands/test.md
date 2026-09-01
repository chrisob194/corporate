---
description: Run the verification suites the plan declares — unit, integration, end-to-end — and file the verdict. Skips a layer only when the design ruled it not required.
argument-hint: <slug> [--layer unit|integration|e2e]
---

# Test

Slug: `$1` · Arguments: `$ARGUMENTS`

Stage 4 of 5. Runs the suites the plan declares, against the merged branch, and
files the result. It executes; it does not decide. Nothing here writes code,
fixes a failure, or says whose fault one is.

This is not `/corporate:qa`. QA invents the tests nobody wrote and ends in a
decision about them. This stage runs suites that already exist and ends in a
verdict — which is why it is cheap, why it is the gate before review, and why
`/corporate:ship` can run it unattended.

## Steps

1. Resolve `$1` per `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md`. Not in
   `Open/` is a hard stop, naming the state it is in. The issue folder must hold
   **both** `design.md` and `plan.md` — the design carries the ruling, the plan
   carries the commands, and one without the other cannot be gated. Missing
   either, stop and name the command that produces it.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/test-plan.md`, then read the design's
   `## Verification` table and the plan's `## Test suites` table **yourself**.
   This stage is enterable cold and never trusts an earlier one to have checked.
3. Apply the gates that reference defines. In short, and it is the reference that
   is authoritative:
   - no `## Verification` section ⇒ **hard stop**. Name the section and
     `/corporate:design $1`. An unverified design is not a verified-clear one,
     and silence is not a `not-required`.
   - a layer ruled `required` with no suite row ⇒ **hard stop**, reported as a
     plan defect. Name the layer and `/corporate:plan $1`.
   - a layer ruled `not-required` ⇒ skip it, in one line, quoting the design's
     `Why`.
   - all three layers `not-required` ⇒ there is nothing to run. Say so, quote the
     reasons, append the activity line for the skipped stage, and stop. Do not
     dispatch, and do not go looking for suites the plan did not declare.
4. If `--layer` was passed, narrow to those layers and say which layers you are
   not attempting. It never turns a `required` layer into a `not-required` one —
   the run is partial, and the report must say so.
5. Read `${CLAUDE_PLUGIN_ROOT}/reference/worktree-lifecycle.md` and follow its
   *Entering an issue* section: the issue's worktree on `corporate/$1/work`,
   re-entered by the path recorded in `issue.md`. **Hard stop, not a warning.**
   The suites must run against the merged branch, not against whatever is
   checked out.
6. If the design ruled a `required` layer whose `Environment` is not there — no
   server, no browser, no seeded database — say so **before** dispatching rather
   than paying for a run that cannot start. The tester will report `blocked`
   either way; naming it first is cheaper and clearer.
7. Dispatch the `tester` subagent with a brief containing:
   - the `## Test suites` rows **inlined verbatim**, in order — it cannot read
     the store,
   - the repository root and the branch it is on,
   - the output budget from the test-plan reference,
   - that it runs the commands exactly as given, writes nothing, and returns the
     report as its final message.

   Do **not** inline the design or the plan. Nothing the tester does turns on
   them, and giving it either invites an opinion that belongs to the reviewer.
8. When it returns, check `git status --short` yourself. The tester holds no
   write tool and must have touched nothing; a dirty tree is a failed test pass,
   and you report it as one rather than filing the verdict. A suite that writes
   its own artefacts — coverage output, a report file — is the exception only if
   the plan's `Command` is what produced it: say which files and why.
9. File the report as `test-<n>.md` in the issue folder, numbered from 1 like the
   reviews and never overwritten — the sequence of test runs is the record of how
   many times the branch was measured. Add its artifact row, append the activity
   line with the roll-up verdict and the failing suites.
10. Report to the user: the roll-up, each suite with its result, every failing
    suite with its command and verbatim output, every layer skipped and the
    design's reason for it, and every layer `--layer` left unattempted.

## Gate

Stop. Never fix a failing suite here, and never re-run it hoping for green — the
tester already re-ran it once, and a suite that only passes sometimes is
reported as `flaky`, not as a pass.

Routing a failure is the user's call. Name the two routes and let them choose:

- `/corporate:build $1 --task T<n>` when the failure clearly belongs to one task,
- `/corporate:review $1` when it does not — the reviewer is the role that
  classifies a defect as `implementation`, `plan` or `design`, and a test failure
  is evidence for that classification, not a substitute for it.

A `blocked` roll-up is neither of those: the environment the design promised is
not there. Say what was missing and stop.
