# Spec — Frontend SPA framework playbook coverage

## Problem
`technical-architect` has to rule on a frontend single-page-app framework as part of ordinary design work — which major release to target, which scaffolding options to use, what the build output contract is, and what the static-serving contract is — and then rule whether a downstream builder can act on that design without inventing facts. For this framework, the team holds no such ruling in advance. The cost fell on the one design act this record describes: the architect had to fetch the framework's own upstream documentation and registry metadata live, during the act, to land the design at all. That cost recurs on every future design act that needs to rule on the same framework, since nothing from this act was retained for reuse.

## User scenarios
1. **Before**: `technical-architect` is asked to rule on this frontend framework. No team-held guidance exists, so it must fetch the framework's own documentation and registry metadata from scratch, mid-design, to answer which release, which scaffolding, what build output, and what static-serving contract to specify. **After**: the same ruling draws on guidance the team already holds, sourced from the framework's own authoritative documentation, without a live fetch being the only path to an answer.
2. **Before**: a downstream builder receives a design built on facts the architect sourced ad hoc and has no way to check those facts independently without redoing the same live research. **After**: the same facts are backed by guidance available to any role that needs to check them, not locked inside one design act's citations.

## Functional requirements
1. Team-held guidance must exist for this frontend framework, covering at minimum: which major release to target, which scaffolding options to use, what the build output contract is, and what the static-serving contract is.
2. That guidance must be traceable to the framework's own authoritative documentation and registry metadata — never to unstated recollection — matching how every other playbook in this team's set already treats its subject stack.
3. A design act ruling on this framework must be able to reach a verdict on all four points in requirement 1 without a live fetch being the only way to answer them.
4. A downstream act consuming such a design must be able to act on it without inventing facts about the framework, the same standard the reporting design act already held itself to.
5. [NEEDS CLARIFICATION: the record never names the specific frontend framework — only "the frontend framework" and "this frontend stack" generically. Which framework is this guidance for? The four requirements above cannot be scoped to a specific release, scaffolding surface, build contract, or serving contract until the framework's identity is known.]

## Non-goals
- Does not cover any frontend framework other than the one this record concerns — this is not a general survey of frontend or single-page-app frameworks.
- Does not cover backend, non-SPA, or full-stack framework categories.
- Does not change any role's boundary, tool allowlist, or add a new role — the reporter's own proposal explicitly asks for none of these.
- Does not treat this single occurrence as proof that a broader category of frontend-framework gaps exists; that judgment waits on a second, independent report of the same gap.

## Key entities
- **The frontend stack** — the single specific single-page-app framework whose ruling the reporting design act had to source live. Its identity is the open fork in this spec (see requirement 5); everything else in this spec is scoped to whichever one it turns out to be.
- **The design act** — the past event that surfaced the gap: a ruling on this framework's release, scaffolding, build output, and static-serving contract, made without team-held guidance to draw on.
- **The knowledge record** — this filed record itself: one occurrence, explicitly not yet a pattern, filed so a second occurrence of the same gap has something to accumulate against.

## Assumptions
- The reporter's proposed shape of the fix — new team-held guidance for this one frontend stack — is taken as agreed, since the record states this explicitly and asks for no boundary or role change.
- One filed occurrence is taken as sufficient to proceed with this spec, since this pass formalizes a decision already settled before it was captured, rather than re-weighing the "anecdote vs. pattern" question the record itself raises.
- The guidance is scoped to exactly one framework — the one behind this record — not to frontend frameworks as a category, absent any statement to the contrary.

## Second ticket
None — the input describes one gap (no team-held guidance for one frontend framework) and one proposed fix (guidance for that one framework). Nothing in the brief could ship separately while still leaving the reported gap open.

## Loop hints
- Ends when: a design act ruling on this frontend framework can reach a verdict on release, scaffolding, build output, and static-serving contract by drawing on guidance the team already holds, rather than a live fetch being the only path to an answer.
- Repeats over: nothing — this concerns one framework, not a set of frameworks.
- Partial value: guidance covering only some of the four rulings (say, the build output contract alone) is still usable by a design act that only needs that one ruling, so partial coverage has value in units of which of the four rulings it can already answer.
- Human looks after: this is a single, one-time addition rather than a repeating job, so no repetition count applies — a human should look once, at the point this guidance is first relied on by a design act, before it is trusted further.
