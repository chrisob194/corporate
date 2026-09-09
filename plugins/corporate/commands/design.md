---
description: Dispatch the technical-architect to choose an approach for an Open issue and return the task breakdown built on it, and file both the design and the plan in the issue store.
argument-hint: <issue> [--small] [--without-playbook <stack>]
---

# Design

Issue: `$1` · Arguments: `$ARGUMENTS`

Stage 1 of 4 (design → build → test → review). This stage decides *what to build
it out of* and how that gets broken into buildable tasks. It also opens the
issue's worktree and branch — every later stage works in it. It ends at a gate:
nothing gets built here.

`/corporate:run <n>` runs this stage and the three after it without stopping.
Use this command when you want to argue with the result before anything else
happens.

## Steps

1. If `$1` is empty, stop and ask for the number of an `Open` issue. Do not
   invent one — `/corporate:brief --list open` names the issues that exist.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` — if the path does not
   resolve, find the file under the plugin directory. Run its preflight,
   normalise `$1` per its *The key* — `<n>` below is that number — then
   resolve it per its *Finding an issue*. **Not `Open` is a hard stop**: say
   which state it is in, and for a `Draft` name `/corporate:brief --promote <n>`.
   Work is assigned on `Open` and only on `Open`.
3. Read `${CLAUDE_PLUGIN_ROOT}/reference/worktree-lifecycle.md` and follow its
   *Entering an issue* section: the issue's own worktree on
   `corporate/<n>/work`, created here. Your own checkout is left as it is, dirty
   or not. Record the `branch` and `worktree` fields on the record. **Entering the
   worktree is a hard stop if it fails, not a warning.**
4. If the record already holds a `design` artifact, read it and ask whether to
   replace it before dispatching. Never silently overwrite a design — and note
   that replacing it does not remove the plan or the reviews that were built on
   it. If the record already holds a `plan` artifact, ask before replacing that
   too.
5. If `--without-playbook <stack>` was passed, that waiver applies to this
   dispatch, not to a later one: the whole pass — approach and breakdown — is
   redone under it. Say which stacks were waived before dispatching. Dispatch
   the `technical-architect` subagent with a brief containing:
   - the issue's brief — criteria and non-goals — inlined verbatim, marked as
     settled: the architect decides what to build the feature out of, never
     whether the feature should exist,
   - if `--small` was passed, that the user believes this is a small change, as
     a **hint and nothing more**: the architect rules `## Scale` on the approach
     it chooses and may return `standard`. Never pass the flag as a verdict, and
     never file a design whose scale you supplied,
   - the repository root and anything relevant from `CLAUDE.md`,
   - the list of MCP servers and plugin commands available in this session —
     the part of the "already installed" layer a subagent cannot see. Skills
     are not in that list: the architect sees its own,
   - the plan format spec path `${CLAUDE_PLUGIN_ROOT}/reference/plan-format.md`
     — if that path does not resolve, read the file yourself and inline its
     contents into the brief instead,
   - the test-plan reference path `${CLAUDE_PLUGIN_ROOT}/reference/test-plan.md`
     — inline that file's contents instead if the path does not resolve. The
     breakdown owes a `## Test suites` row for every layer it rules `required`,
   - any stacks named in a `--without-playbook` waiver on this invocation, as a
     standing instruction to file one `knowledge` HR record per stack and to
     mark in the returned documents every decision taken from memory. There is
     no pre-dispatch stop on a `required-missing` stack here — the role itself
     stops before writing the breakdown on an unwaived one,
   - that it must return both documents as its final message and write no
     file. The store is yours to write, and the agent must not learn where it
     is.
6. When it returns, read the design yourself. Check it cites real `path:line`
   locations and that the rejected alternatives are real alternatives, not straw
   men. If it does not, say so rather than filing it.
   Check the `## Stack readiness` section against
   `${CLAUDE_PLUGIN_ROOT}/reference/stack-readiness.md`: the section exists,
   every stack the approach relies on has a row, every verdict is one of
   `covered` / `not-required` / `required-missing`, and every `required-missing`
   row names a doc root URL. A missing or unruled section is a design defect —
   re-dispatch rather than filing it, because it stops stages 2 and 3 dead.
   Check the `## Verification` section against
   `${CLAUDE_PLUGIN_ROOT}/reference/test-plan.md` the same way: the section
   exists, all three layers have a row, every verdict is `required` or
   `not-required`, and every `required` row names the `Environment` it needs.
   A missing section or a missing row is the same defect — the test stage stops
   on it, and an unruled layer is not a `not-required` layer.
   Check the `## Scale` section against
   `${CLAUDE_PLUGIN_ROOT}/reference/scale.md` the same way: the section exists,
   it holds exactly one row, the verdict is `small` or `standard`, and the
   reason is there. A missing or unruled section is the same defect, and it is
   never read as `standard` — `/corporate:run` gates its retry caps on it.
   If a `## Plan withheld` section came back instead of a plan, that is not a
   defect to fix — read on to the Gate.
   If a plan did come back, validate it yourself before treating it as usable:
   - every `depends_on` id exists,
   - no dependency cycle,
   - no duplicate task ids,
   - every task has an `acceptance` line,
   - within each wave, no two tasks share a path in `files:` — vacuously true,
     and still worth stating, for a single-task plan,
   - no task id is `work` — that name is the issue's own branch,
   - a `## Test suites` section exists with one row per layer the design ruled
     `required`, and no row for a layer it ruled `not-required`. Every row
     names a runnable command. A design that ruled all three layers
     `not-required` is the one case where the section is legitimately empty —
     say so.
   Report any violation as a defect and re-dispatch rather than filing it.
7. File it: record the design document as the `design` artifact, always. If a
   plan came back and passed validation, record it as the `plan` artifact too.
   Append one activity line per artifact filed, with the architect's report.
   The store reference and its mapping own the exact shapes.
8. Report to the user: the branch and worktree, the recommended approach, which
   search layer the answer came from, the top rejected alternative, the stack
   readiness verdicts, which verification layers were ruled `required` and what
   environment they need, the scale verdict and its reason, and any open
   questions. If `--small` was passed and the architect ruled `standard`, say so
   plainly — the ruling stands. If a plan was filed, also print its wave table,
   the task titles and the test suites (a single-task plan may omit the wave
   table per `plan-format.md` — print the task and say there is one wave), and
   repeat any waiver this run used.
9. If the technical-architect filed an HR record — a stack with no playbook, a
   tool it lacked, work wanting a specialist — surface that it did and name
   `/corporate:hr`. Do not run it.

## Gate

Stop. Do not run `/corporate:build`. Open questions in the design are the
user's to answer — a build started on an unanswered design question, or an
unapproved breakdown, is wasted work. Filing either document is a handoff, not
an approval.

If the role returned a `## Plan withheld` section instead of a plan, say
plainly which trigger fired: the design is filed and usable on its own, but the
breakdown is withheld.
- If the trigger was a decision only a human can settle, name the decision and
  ask for it — a plan built on it would be a guess.
- If the trigger was an unwaived `required-missing` stack, name the stacks and
  their doc roots, and say that redoing this command with
  `--without-playbook <stack>` redoes the whole pass — approach and
  breakdown — not just the breakdown, and that `/corporate:run` does not waive
  at all, ever; it moves the issue to `Blocked` instead.
Do not offer to waive on the user's behalf.

If the design ruled any stack `required-missing` and it was not waived here,
say so plainly even when a plan did come back for the rest: `/corporate:build`
will refuse this issue until a playbook exists for that stack or the user
waives it with `--without-playbook <stack>`, and `/corporate:run` will not
waive at all — it moves the issue to `Blocked`. Name the stacks and their doc
roots. Do not offer to waive on the user's behalf.
</content>
