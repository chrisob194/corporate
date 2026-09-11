---
name: goal-suggest
description: Use when the user asks for a /goal line to start a /loop or /schedule with — "give me a goal for issue #99", "what should the goal be for this", "help me write a goal argument". Suggests a line; dispatches nothing, files nothing, writes nothing.
---

# Goal suggest

A cheap, on-demand answer to "what should I paste after `/goal`?" — nothing
more. This replaced a dedicated agent, a filed artifact and seven validation
checks that used to run before any loop could start. That machinery bought
rigor for a decision that, in practice, most issues never revisit: most runs
are fine on `/corporate:run`'s own hardcoded default
(`/goal issue #<n> is no longer Open — ...`). This skill exists for the
minority where a sharper line — a threshold, a count, something more specific
than a state read — would actually help, and it answers that on the spot,
inline, in this session. No dispatch, no artifact, no store write.

## Method

1. If the ask names an issue, read that issue's `docs/corporate/<n>/spec.md`
   (working tree first, else `git show corporate/<n>/work:docs/corporate/<n>/spec.md`)
   for its `## Loop hints` — "Ends when", "Repeats over", "Partial value",
   "Human looks after". Treat them as a starting point, not an answer: they
   were written before anything existed to measure.
2. Look at the repository for what's actually runnable right now — an
   existing test/lint/build/validate script, a coverage or perf number
   already tracked somewhere, a count of something (failing files, remaining
   TODOs, open findings) that a `grep -c` or equivalent could read back. This
   is a quick look, not a search: a couple of `Read`/`Grep`/`Bash` calls, not
   a sweep.
3. Climb this ladder and stop at the highest rung something in the repo
   actually supports — never pick a rung nothing measures, and never invent a
   number you have not seen:

   | Rung | Signal | Example |
   |---|---|---|
   | 1 | the exit code of one named command | `bun run validate` exits 0 |
   | 2 | a number against a threshold | Lighthouse ≥ 90 · p95 ≤ 200 ms · coverage ≥ 80 |
   | 3 | a count reaching zero | remaining `grep -c` hits = 0 · failing files = 0 |
   | 4 | a state read back from the store | the issue is `Closed`, `Blocked` or unreachable |
   | 5 | an independent agent's verdict | `reviewer` reports `pass` |
   | 6 | the running agent's own judgement | "the feature looks done" |

   **Rung 6 is never a terminator.** If nothing above it is available, say so
   plainly and suggest the default state-based line instead of inventing one.
4. If you named a command or a threshold, run or read it once before
   suggesting it — a signal you have not observed is a guess, not a
   suggestion. If you can't observe it (no server, no fixture, nothing to
   run), say that and fall back a rung.
5. Print the suggested `/goal …` line in a fenced block, ready to paste, plus
   one clause saying which rung it is and why nothing higher was available.
   If the honest answer is that the default state-based line is already the
   best available, say so instead of manufacturing a fancier one.

## Never

- Dispatch an agent, file an artifact, or write to the issue store. This is a
  suggestion, made in this session, for the user to paste or ignore.
- Suggest a rung-6 line, ever.
- Name a threshold or a count you have not actually run or read.
- Treat a `## Loop hints` line as the final answer — it is advisory input,
  same as it always was.
