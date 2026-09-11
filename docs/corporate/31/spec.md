# Spec — Fix split's per-child document mismatch with product-owner's spec-only output

## Problem
Whoever runs the plan-to-children conversion on a filed plan expects each child issue to start life with a real, usable requirements document. Right now the step that asks for that document still describes it as an old kind of write-up (a "brief") and expects it shaped and filed as one, but the role actually asked to write it only knows how to produce a spec (a different document, with its own heading and shape). Every child issue created by a conversion inherits this mismatch: the document dispatched for doesn't match the document produced, so the title extracted for the child, the shape checked for banned implementation wording, and the record filed against the child are all built on a stale description of what comes back. Anyone converting a plan today either gets children seeded with content that doesn't fit what the flow assumes, or the conversion breaks partway through.

## User scenarios
1. Before: a user with an `Open` issue holding a valid multi-task plan runs the conversion. The flow dispatches the requirements-writing step per task expecting an old-format write-up back, gets a spec back instead, and the title, shape-check or filed record no longer line up with what the flow describes. After: the same run dispatches for, checks and files the document the role actually produces, and each child issue is seeded with a coherent, correctly-labeled requirements document.
2. Before: a user reads the confirmation screen or the final report of a conversion and sees a document kind named that no longer corresponds to anything a role in this system writes. After: every reference to the per-child document, from the dispatch instruction through the confirmation and the final report, names the document kind that is actually produced.
3. Before: a returned document's title line uses a heading shape the conversion's title-extraction step doesn't expect, so the child issue title is wrong or extraction fails. After: the child issue's title is correctly read from whatever heading shape the actually-produced document uses.

## Functional requirements
1. The per-task step that produces each child's starting requirements document must ask for, and describe to the person dispatched, the document kind that role actually writes — not a kind it no longer produces.
2. The instructions given alongside that request (what context accompanies it, that no criterion may name a file, library or pattern, that up to three open questions may be flagged, that a written response is always returned) must describe the document kind actually produced, not the retired one.
3. The check applied to what comes back — that no criterion names a file, library or pattern — must apply to the actual shape of the document produced, not to a shape it no longer has.
4. The child issue's title must be correctly extracted from the heading of the document actually returned.
5. The record filed against each child issue (the document itself, filed a second time as a named artifact) must be filed under the artifact kind that matches what was actually produced, not the retired kind.
6. Every place in the conversion flow that names the per-child document kind to the user — the confirmation before writing, the per-child report at the end — must consistently name the kind actually produced.
7. A plan converted after this fix must produce child issues indistinguishable in quality and completeness from what the flow originally promised: each seeded with a real requirements document, correctly titled, correctly shape-checked, correctly filed.

## Non-goals
- Does not change what the requirements-writing role itself produces, checks or refuses — that role's own behavior is already correct and settled; only the step that talks to it is being brought back in line.
- Does not change anything else about plan conversion: the hard stops before dispatch, the one-task-plan refusal, the ordering of child creation, the parent's own registry record, or the status-reporting mode.
- Does not change how a plan is produced or amended upstream of conversion.
- Does not add any new confirmation, flag or mode to the conversion command.

## Key entities
- **Plan** — the filed, task-broken-down document a conversion reads from; unchanged by this fix.
- **Task** — one unit of the plan, converted into exactly one child issue.
- **Child issue's requirements document** — the per-task write-up a role produces so a child issue starts life with settled requirements; this is the thing whose actual shape and kind this fix realigns the conversion flow with.
- **Requirements-writing role** — the role dispatched once per task to produce that document; unchanged by this fix, only correctly addressed by it.
- **Child issue** — the new record created per task, seeded with its requirements document.

## Assumptions
- The requirements-writing role's own current output is the source of truth for what "correct" looks like here; this fix brings the conversion flow's description and handling into line with that output, not the other way around.
- Every place in the conversion flow that currently describes the per-child document using the retired kind's name or shape is in scope, including the confirmation shown before anything is written and the report shown after.
- Nothing about which document kind a *different* upstream step (the one that files an issue directly, outside of conversion) asks for is affected — that step is out of scope unless it shares the exact same mismatch, which this brief does not report.

## Second ticket
None — this is one mismatch (a step describing and handling a document kind that no longer exists) running end to end through one flow.

## Loop hints
- Ends when: every mention of the per-child document, from the dispatch instructions through the confirmation and the final report, names and handles the document kind actually produced, and a converted plan's child issues are seeded with a correctly titled, correctly checked, correctly filed requirements document.
- Repeats over: each place in the conversion flow that names or handles the per-child document kind.
- Partial value: none — a conversion that dispatches correctly but files under the wrong kind, or titles from the wrong heading, still leaves a child issue in a broken state, so this is only done once every reference is consistent.
- Human looks after: one pass — this is a small, mechanical realignment with a single correct target state, not an open-ended search.
