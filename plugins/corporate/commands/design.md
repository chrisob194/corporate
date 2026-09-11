---
description: Dispatch the technical-architect to choose an approach for an Open issue and return the task breakdown built on it, and file both the design and the plan in the issue store. A feasibility-only lite pass may also run on a Draft issue.
argument-hint: <issue> [--lite] [--small] [--without-playbook <stack>]
---

# Design

Issue: `$1` · Arguments: `$ARGUMENTS`

Stage 1 of 4 (design → build → test → review), plus an optional lite pass that
runs earlier, on a `Draft` issue, before any commitment to build. Full mode
decides *what to build it out of* and how that gets broken into buildable
tasks. Lite mode answers only whether the stack is ready — no plan, no commit
to build. Neither creates the issue's worktree or branch: `/corporate:brief`'s
spec mode already did, the first time this issue's `spec.md` was written. Both
end at a gate: nothing gets built here.

`/corporate:run <n>` runs full mode and the three stages after it without
stopping. Use this command by hand when you want to argue with the result
before anything else happens, or when you just want a feasibility read.

## Picking the mode

1. **`--lite` wins if present.** Otherwise read `$ARGUMENTS` as an intent:
   "check the stack for #12", "quick feasibility check on #12" and similar
   resolve to lite mode; anything else, including a bare issue number, is
   full mode.
2. Lite mode is allowed on `Draft` or `Open`. Full mode requires `Open`, as it
   always has.
3. Say which mode you resolved to before you act on it.

## Steps

1. If `$1` is empty, stop and ask for the number of an issue. Do not invent
   one — `/corporate:brief --list` names the issues that exist.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` — if the path does not
   resolve, find the file under the plugin directory. Run its preflight,
   normalise `$1` per its *The key* — `<n>` below is that number — then
   resolve it per its *Finding an issue*.
   **Full mode: not `Open` is a hard stop** — say which state it is in, and
   for a `Draft` name `/corporate:brief --promote <n>`. Work is assigned on
   `Open` and only on `Open`.
   **Lite mode: `Blocked` or `Closed` is a hard stop** — say which state it
   is in; `Draft` and `Open` both proceed.
   **Either mode: no `spec` artifact filed is a hard stop**, naming
   `/corporate:brief --spec <n>`. There is nothing to read a problem statement
   from without one.
3. Read `${CLAUDE_PLUGIN_ROOT}/reference/worktree-lifecycle.md` and follow its
   *Entering an issue* section to **enter** the issue's worktree on
   `corporate/<n>/work` — it already exists; `/corporate:brief`'s spec mode
   created it when `spec.md` was first written. Your own checkout is left as
   it is, dirty or not. **A record with no `worktree` recorded is a hard
   stop**, naming `/corporate:brief --spec <n>` — this command never creates
   one. **Entering the worktree is a hard stop if it fails, not a warning.**
4. If the record holds a `split` artifact, this issue is a parent, not a work
   issue — its work lives in its children and its `plan` artifact is
   superseded. Hard stop; name `/corporate:split <n> --status`.
   `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` is the definition, not
   repeated here. The stop exists because filing a new plan on a split parent
   would make it executable again.
   Otherwise, if the record already holds a `design` artifact, read the file at
   `docs/corporate/<n>/design.md` — from the working tree if it is there, else
   `git show corporate/<n>/work:docs/corporate/<n>/design.md` — and ask whether
   to replace it before dispatching. Never silently overwrite a design — and
   note that replacing it does not remove the plan or the reviews that were
   built on it. If the record already holds a `plan` artifact, ask before
   replacing that too.
5. Read `docs/corporate/<n>/spec.md` — working tree first, else `git show
   corporate/<n>/work:docs/corporate/<n>/spec.md`, per the store reference's
   *Relocated kinds*. If both fail, hard stop naming the path and the branch;
   never fall back to the three-line note.
   If `--without-playbook <stack>` was passed, say which stacks were waived
   before dispatching anything: the waiver applies to this dispatch, not to a
   later one, and (in full mode) it redoes the whole pass — approach and
   breakdown together.
   Dispatch the `technical-architect` subagent with a brief containing:
   - the spec's content, inlined verbatim, marked as settled: the architect
     decides what to build the feature out of, never whether the feature
     should exist,
   - **in lite mode only**, that this dispatch is Phase A only — a requested
     feasibility check, not a Stop, and Phase B must not run,
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
     no pre-dispatch hard stop on a `required-missing` stack here — the role
     itself stops before writing the breakdown on an unwaived one,
   - that it must return both documents as its final message and write no
     file. The store is yours to write, and the agent must not learn where it
     is.

   The returned message carries `# Design — #<n>` followed by either
   `# Plan — #<n>` or a `## Plan withheld` section — those two are the only
   top-level `#` headings in it. **Split the message on top-level `#`
   headings only, ignoring every heading that sits inside a fenced code
   block** — a `#` line between fences is content, never a boundary. A design
   about this plugin routinely quotes both literal headings inside a fence, so
   cutting at the fenced occurrence would file a design truncated mid-section
   and a plan that opens with the tail of a fence.
6. When it returns, read the design yourself. Check it cites real `path:line`
   locations and that the rejected alternatives are real alternatives, not straw
   men. If it does not, say so rather than filing it.
   Check the `## Stack readiness` section against
   `${CLAUDE_PLUGIN_ROOT}/reference/stack-readiness.md`: the section exists,
   every stack the approach relies on has a row, every verdict is one of
   `covered` / `not-required` / `required-missing`, and every `required-missing`
   row names a doc root URL. A missing or unruled section is a design defect —
   re-dispatch rather than filing it, because it stops the stages after this
   one dead.
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
   defect to fix — whether the trigger was a Stop or, in lite mode, simply
   that no plan was requested — read on to the Gate.
   If a plan did come back, validate it yourself before treating it as usable,
   against eight checks:
   - the plan document **begins at an unfenced, top-level `# Plan — #<n>`
     heading**, and the design document ends immediately before it — not
     merely that the string appears somewhere in the message. A design that
     ends mid-section, or a plan whose first line is the tail of a fenced code
     block, is a mis-split of the returned message: re-split it before
     treating either document as defective,
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
7. File it: write `docs/corporate/<n>/design.md`, and `docs/corporate/<n>/plan.md`
   when a plan came back and passed validation, each the returned document
   verbatim, then commit both in one commit — per the store reference's
   `### Relocated kinds — spec, design, plan and review`. A withheld plan
   means the commit stages `design.md` alone — always true in lite mode.
   The commit runs before any note is posted. Then post one note per kind,
   each carrying the short sha that commit produced. Then append one activity
   line per artifact filed, with the architect's report. The store reference
   and its mapping own the exact shapes.
8. Report to the user: which mode ran, the committed paths
   (`docs/corporate/<n>/design.md`, and `docs/corporate/<n>/plan.md` if filed)
   and the short sha they were committed at, the recommended approach, which
   search layer the answer came from, the top rejected alternative, the stack
   readiness verdicts, which verification layers were ruled `required` and what
   environment they need, the scale verdict and its reason, and any open
   questions. If `--small` was passed and the architect ruled `standard`, say so
   plainly — the ruling stands. In lite mode, say plainly that no plan was
   requested and name `/corporate:design <n>` (full mode) as the way to get
   one. If a plan was filed, also print its wave table,
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
plainly which of the three reasons applied: the design is filed and usable on
its own, but the breakdown is withheld.
- **Lite mode, run to completion as requested.** Nothing to fix, nothing to
  decide — say that a full pass, when the user wants one, is
  `/corporate:design <n>`.
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
