# Spec — Merge main into the branch before opening the pull request

## Problem
The requester — the person who runs the pipeline and reviews the pull requests it opens — currently finds that the pull request opened at the end of a run can show a conflict against main. That conflict develops while the run is in progress, from other work landing on main, and today nothing brings the branch up to date before the request is opened. The requester discovers and resolves the conflict after the fact, as a manual step tacked onto a process that was supposed to be finished, instead of before the request ever goes out.

## User scenarios
1. A run finishes its work and is about to open a pull request. Someone else's separate change landed on main after the run started. Before: the pull request opens and immediately shows a conflict against main. After: main's changes are brought into the branch first, so the pull request opens clean, with no conflict against main.
2. A run finishes its work, but main changed something that the run's own work also changed, in a way that cannot be reconciled automatically. Before: the pull request opens anyway, silently carrying the conflict, and the requester only learns of it when they later look at the request. After: no pull request is opened; the run reports that it stopped because main could not be brought in cleanly, so the requester learns immediately, at the point it happened, rather than by discovering it later.
3. A run finishes and main has not changed at all since the branch was created. Before and after: no visible difference — the pull request opens exactly as it does today.

## Functional requirements
1. Before a pull request is opened, the branch it will be opened from must be brought up to date with the current state of main.
2. This update must happen as the last thing before the pull request is opened, so it reflects main as close to that moment as practical — not as of whenever the branch was first created.
3. If bringing the branch up to date with main cannot be completed cleanly — a genuine conflict between what changed on main and what changed on the branch — the pull request must not be opened, and the run must report that it stopped for this reason.
4. When there is nothing new on main to bring in, this step must have no effect on the outcome of the run: the pull request opens exactly as it would have otherwise.

## Non-goals
- Does not change how conflicts encountered among the run's own work, before this step, are handled.
- Does not resolve a genuine conflict between main and the branch automatically — it stops and reports, it does not decide the conflict.
- Does not open, merge or close the pull request beyond what already happens today, apart from the update described here.
- Does not keep the branch continuously synced with main throughout the run — only once, immediately before the pull request is opened.
- Does not do anything about main changing again after the pull request has already been opened.

## Key entities
- **The pull request** — the request opened at the end of a run for the requester to review.
- **The branch** — the line of work holding everything the run produced, from which the pull request is opened.
- **Main** — the line of development the branch will eventually be merged into.
- **A conflict** — a change on main and a change on the branch touching the same thing in incompatible ways, such that only a person can decide which one to keep.

## Assumptions
- "Merge main into the branch" means bringing main's changes into the branch, not the other way around, and not rewriting the branch's own history — stated so it can be challenged.
- This update happens once per run, right before the pull request step, not on any other cadence during the run.
- "No conflicts" is judged against the state of main at the moment of this update; if main changes again after the pull request is already open, that is ordinary pull-request life and outside this problem's scope.
- When the update cannot complete cleanly, stopping and reporting is the correct response, in preference to opening the pull request anyway with a note attached.

## Second ticket
None — this is a single atomic step in an existing process.

## Loop hints
- Ends when: no pull request opened by a run shows a conflict against main that existed at the time the run tried to bring it in.
- Repeats over: nothing — a single step performed once per pull request opened.
- Partial value: none — the branch is either brought up to date before the pull request opens, or it is not; there is no smaller unit.
- Human looks after: the first time a run stops because main could not be brought in cleanly.
