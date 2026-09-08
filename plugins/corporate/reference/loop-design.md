# Loop design

What a designed loop is, what makes one terminate, and the exact document
`loop-engineer` returns. `/corporate:design-loop` validates against this file and
`/corporate:run` reads the artifact it produces.

A **loop** is an agent repeating cycles of work until a stop condition is met.
This plugin designs exactly one kind: the **goal-based** loop, driven by `/goal`.
The other kinds are named at the bottom of this file and designed for never.

## The trio

`/goal` sets a completion condition. An evaluator checks it after each turn and,
when it is not met, the session keeps working — until the goal is met or the turn
limit is hit.

**The evaluator sees the transcript and nothing else.** It cannot read a file,
run a command, open the issue, or infer a state from prose. Everything the
condition tests must therefore have been *printed*, and printed by something that
was obliged to print it.

That is why a loop is three things or it is nothing:

| Part | What it is |
|---|---|
| the **kickoff** | the prompt that starts the run, pasted first |
| the **print obligation** | the literal line the run must emit every turn |
| the **goal line** | the `/goal …` condition, matching tokens the obligation guarantees |

Design one without the others and you get a loop that cannot terminate: a goal
matching a token nothing prints never fires, and a run printing a token no goal
reads is a run nobody can stop.

## The two families

| | `pipeline` | `measured` |
|---|---|---|
| kickoff | an existing `/corporate:*` command | a bespoke prompt, filled into the skeleton below |
| print obligation | the command's own, already in its body | written by `loop-engineer` |
| the cap | the driver's, named not restated | a literal number in the goal line |
| terminates on | a state read back from the store | a value a tool printed |

**`pipeline` never re-states the driver's rules.** `/corporate:run` holds the
invariants that make the pipeline safe — never assert a state you did not read
back, no subagent touches the store, the caps are hard, no stack is waived
unattended. A designed loop that copied them would fork them. So a `pipeline`
loop names the command and its existing `STATE` line, and adds nothing.

**`measured` exists because most work has no command.** A Lighthouse target, a
migration sweep, a benchmark, a lint count going to zero — none of these has a
`/corporate:*` driver, and inventing one per issue is how the invariants get
dropped. The skeleton is what carries them instead.

## The signal ladder

The stop condition is only as deterministic as the thing it reads. Climb to the
highest rung the work actually supports, and say in the artifact why nothing
above it was available.

| Rung | Signal | Example |
|---|---|---|
| 1 | the exit code of one named command | `bun run validate` exits 0 |
| 2 | a number against a threshold | Lighthouse ≥ 90 · p95 ≤ 200 ms · coverage ≥ 80 |
| 3 | a count reaching zero | remaining `grep -c` hits = 0 · failing files = 0 |
| 4 | a state read back from the store | the issue is `Closed`, `Blocked` or unreachable |
| 5 | an independent agent's verdict | `reviewer` reports `pass` |
| 6 | the running agent's own judgement | "the feature looks done" |

**Rung 6 is never a terminator.** Not as the condition, not as a clause in one.
An agent asked whether its own work is finished answers yes, which is the
failure `/goal` exists to prevent.

Rung 5 is judgement too, but somebody else's, reached in a separate context
against a written standard — that is what makes `pipeline` legitimate at rung 4
and 5 while a self-assessment is not.

Rungs 1–3 are what "smart" means here. A loop whose exit is a number a tool
printed does not argue, does not drift, and does not need the user watching.
Prefer them, and prefer a signal that *already exists in this repository* over
one the loop would have to invent — an invented signal is a second thing to get
right while the first one is still failing.

**Observe it once.** A signal command that was never run is a guess. Run the
candidate exactly once, record what it printed, and key the goal to the shape you
actually saw. This is the single most common way a designed loop fails to
terminate: the command does not exist, needs an argument, needs a server, or
prints the number in a form nothing matches.

## The print obligation

One line. Unwrapped. Never reworded, never replaced by a prettier summary, never
folded into a sentence.

| Family | Position |
|---|---|
| `pipeline` | the **first** line of every turn — the state as the turn opens |
| `measured` | the **last** line of every turn — the value is known only once the signal ran |

The grammar names its literal parts and its variable parts, so the goal can be
checked against it:

```
LIGHTHOUSE home = <n> · try <k>/5
STATE issue #<n> = Open | Blocked | Closed | store-unreachable · stage: <stage> · cycle: <n>/<cap>
```

A turn without the line is a turn the loop cannot terminate on.

## Both terminals, and a cap

A goal that names only success never ends a run that cannot succeed. Every loop
names, at minimum:

- **one success terminal** — the signal reached its target,
- **at least one failure terminal** — it did not, and the run is giving up,
- **a cap** — a literal number of tries in `measured`, or the driver's own cap
  named (not restated) in `pipeline`.

The cap is part of the goal line, not a hope about the run's behaviour: `stop
after 5 tries` in the condition is what makes the evaluator release the session
when the fifth try reports the same failure as the first.

`## Termination` in the artifact enumerates every path and states the worst case.
If a path exists that prints none of the terminals, the loop is not finished
being designed.

## The `measured` skeleton

A bespoke kickoff is this shape with the angle brackets filled. It is not a
suggestion — the last paragraph is what keeps a measured loop honest.

```
<what to change, one sentence, in the requester's vocabulary>

Each turn, in this order:
1. Make one change.
2. Run `<signal command>` verbatim. Do not modify it, do not skip it.
3. As the last line of the turn, unwrapped, print exactly:
   <print obligation>
4. If it reports <success condition>, stop. On try <cap>, print
   `<token> = giving-up` and stop.

Never change the signal command, its threshold, or the acceptance criteria in
order to reach the target. Never print a value you did not read out of the
command's own output.
```

**The last paragraph is the Goodhart guard.** A measured loop's characteristic
failure is not giving up — it is editing the test until it passes, lowering the
threshold, or reporting a number nobody measured. A loop that can move its own
goalposts terminates every time and means nothing.

## The artifact

`loop-engineer` returns this and nothing around it. Numbered, so a loop
redesigned after a `Blocked` run is a visible second attempt rather than a silent
overwrite.

```markdown
# Loop — <short title>

**Family:** pipeline | measured
**Rung:** <1-5> — <why nothing above it was available>

## Signal
What is measured, and the exact command that produces it. Then the observation:
the command was run once, and this is what it printed.

## Kickoff
The exact text to paste, in a fenced block, ready to copy.

## Print obligation
The literal line, with its grammar, and which position it takes.

## Goal
The exact `/goal …` line, one line, in a fenced block, ready to copy.

## Termination
| Outcome | How the transcript says it | Terminal |
|---|---|---|
Every path. Then the worst case, as a number of turns or tries.

## Hints
| Hint | Verdict | Why |
|---|---|---|
One row per `## Loop hints` line in the brief. Verdict is `accepted` or
`rejected`, and a rejected hint says what it was traded for.

## Not a loop
Present only when the honest answer is that this should be run once. Says so,
says why, and the rest of the document is omitted.
```

## The seven checks

`/corporate:design-loop` runs these itself, on every returned artifact, before
anything is filed. They are the loop equivalent of the plan-format checks.

1. `## Signal` names a command **and** records what it printed when it was run.
   An unobserved signal fails this check; "it should print" is not an observation.
2. Every token the `## Goal` line matches appears in the `## Print obligation`
   grammar. A goal reading a token nothing emits never fires.
3. `## Goal` names a success terminal **and** at least one failure terminal.
4. A cap is stated — a literal number, or the driver's own cap named.
5. The goal line is one line and is pasteable exactly as written.
6. Every `## Loop hints` row in the brief has a verdict row in `## Hints`.
7. The family matches the rung: a `pipeline` loop never terminates on a number,
   and a `measured` loop never terminates on an issue state alone.

A `## Not a loop` artifact is checked against 6 only.

## Bad goals

Named so they can be recognised on sight:

| Shape | Why it fails |
|---|---|
| "until the feature looks right" | rung 6 — the agent grades itself |
| "until the tests pass" with no command named | nothing was obliged to run or print anything |
| "until the score is 90" with no cap | a run that cannot reach 90 never ends |
| "until it is done or blocked" where nothing prints `blocked` | matches a token that is never emitted |
| a condition satisfiable by narration | the run says the words without the signal running |
| two conditions joined by "and ideally" | the evaluator cannot weigh a preference |

## The kinds not designed here

The taxonomy is wider than this file. Naming the rest is part of the job —
designing them is not.

| Kind | Primitive | What to do |
|---|---|---|
| goal-based | `/goal` | designed here |
| time-based, local | `/loop <interval> <command>` | name it, and say what the interval should be. Design nothing |
| time-based, cloud | `/schedule` | name it. Out of remit: no worktree, no issue in front of it |
| turn-based | an ordinary prompt | say the work has no verifiable exit and should be run once |

A piece of work whose trigger is a clock, not a criterion, is not a goal-based
loop and must not be dressed as one — a `/goal` condition that will not be true
until something external changes burns turns waiting.
