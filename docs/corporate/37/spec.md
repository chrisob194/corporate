# Spec — Tailwind CSS styling-stack wiring knowledge

## Problem
When a design act rules how Tailwind CSS is wired into a frontend build pipeline — which packages are involved, which configuration file governs it, and which stylesheet entry point it hangs off — nobody holds that answer going in. The person doing the design act pays for this live: they must fetch Tailwind CSS's own installation guide and the build tooling vendor's integration guide during the act itself, and, because Tailwind CSS's current major release wires this up differently from the release before it, the version-sensitive part of the answer gets rediscovered on the spot rather than being already known. The design still landed, but at the cost of an in-the-moment research detour that a held answer would have skipped.

## User scenarios
- A design act needs to rule how Tailwind CSS hangs off a frontend build pipeline. Before: the person doing the ruling stops mid-act to fetch and cross-reference two external guides, and separately has to notice that the current major release's wiring differs from the previous one. After: the packages, the governing configuration file, and the stylesheet entry point for the current major release are already known going into the act, and citing them takes a confirmation glance at an upstream source rather than a live investigation.
- A future design act touches Tailwind CSS again after its next major release changes the wiring again. Before: the same rediscovery happens a second time, unrecorded. After: whatever holds this knowledge is checked against the release in play, and a wiring change since the last time it was held is something that gets noticed and reflected, not silently missed.

## Functional requirements
1. Before a design act rules on wiring Tailwind CSS into a build pipeline, the packages involved, the governing configuration file, and the stylesheet entry point must already be answerable without a live fetch of an external guide during that act.
2. The held answer must match Tailwind CSS's *current* major release specifically, and must be distinguishable from the prior release's wiring — since the two differ, a design act must be able to tell which release the held answer describes.
3. The held answer must be traceable to Tailwind CSS's own installation guide and the build tooling vendor's integration guide (or whatever has superseded them), so a design act can cite an authority rather than assert from memory.
4. When Tailwind CSS's wiring changes again at a future major release, that change must be something a design act can detect was missed, rather than something that passes silently because the held answer was never checked against the release in play.

## Non-goals
- Does not change who is allowed to do this work, what they are allowed to touch, or introduce a new role — the reporter's own proposal already agrees this is a knowledge gap, not a staffing or boundary gap.
- Does not address the frontend-framework gap reported alongside this one — same reporter, same design act, but a different stack, tracked separately so as not to manufacture a pattern out of two unrelated single incidents.
- Does not extend to any other styling stack, build pipeline, or framework beyond Tailwind CSS.
- Does not commit to holding wiring knowledge for every past major release of Tailwind CSS — only that the current release's wiring is held, and that a future change away from it is detectable rather than missed.

## Key entities
- **The styling stack** — Tailwind CSS, the utility-first CSS framework whose build-pipeline wiring was the subject of the design act.
- **The build pipeline** — the frontend build tooling Tailwind CSS is wired into.
- **The wiring facts** — the three things a design act needs answered: which packages are involved, which configuration file governs the setup, and which stylesheet entry point it hangs off.
- **The release distinction** — the fact that Tailwind CSS's current major release wires up differently from the one before it, and that this difference is itself part of what must be held, not just the current answer alone.
- **The two upstream authorities** — Tailwind CSS's own installation guide and the build tooling vendor's integration guide, the sources the held answer must trace back to.

## Assumptions
- The styling stack in question is Tailwind CSS, per the change request; the build pipeline it wires into is not named, since neither the original incident nor the change request specifies a particular frontend build tool, and doing so is not this stage's decision to make.
- One incident, one reporter, one act — this is treated as sufficient grounds to close the specific gap it describes, not as evidence of a broader pattern across other stacks.
- "Current major release" means whichever release is current at the time the held answer is established or refreshed; keeping it current going forward is in scope per requirement 4, but this spec does not prescribe how often or by what trigger that check happens.

## Second ticket
none

## Loop hints
- Ends when: a design act ruling on Tailwind CSS's build-pipeline wiring can name the packages, the governing configuration file, and the stylesheet entry point for the current major release without fetching either upstream guide live.
- Repeats over: nothing — this is a single held answer for one styling stack, not a set of many.
- Partial value: yes — holding even one of the three wiring facts (say, the governing configuration file) already removes part of what would otherwise be rediscovered live, so partial coverage is worth having.
- Human looks after: a single pass is expected to close this; a human should look only if the first attempt to hold this knowledge cannot confirm the current release's wiring against both upstream authorities.
