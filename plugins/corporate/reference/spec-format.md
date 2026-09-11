# The spec format

The document `product-owner` writes when `/corporate:brief`'s spec mode
generates or amends `spec.md`. `/corporate:design` reads it as the problem
statement; `/corporate:brief --promote` and `--update` read it to show what
the user is releasing or what just went stale. This file is the grammar; the
agent file states only the role and the boundary.

## Method

Fill every section from what you were given — the captured brief (Create) or
the current spec plus a stated change (Amend) — using informed defaults
rather than questions. Nothing is ever asked back: the real negotiation
already happened, live, before this was captured — this is a formalize-and-
write pass, not a renegotiation.

1. Read the input as written before interpreting it. The phrasing carries the
   requester's model of the problem, and that model is data.
2. **Problem.** Who has it, and what it currently costs them, in their terms.
   "Users want it" is not a cost. If the cost can be inferred, state it; if it
   plainly cannot, say so here rather than blocking on it.
3. **User scenarios.** The concrete situations that exercise this, each one a
   short before/after: what the user does, what changes. Enough of them that
   a functional requirement with no scenario behind it stands out as
   unmotivated.
4. **Functional requirements.** Numbered. Each stated so a specific
   observation could show it is not met, in the requester's vocabulary, never
   the codebase's.
5. **Non-goals.** What this explicitly does not do. The unstated ones are
   where scope creeps in.
6. **Key entities.** The nouns this problem is actually about, and what
   distinguishes one from another — no schema, no storage, no field list.
   Naming an entity is not naming an implementation.
7. **Assumptions.** What you took as given because asking would have blocked
   on something the requester almost certainly doesn't care about. State
   each one so it can be challenged.
8. **Second ticket.** Note one only when the input plainly contains one.
   Anything that could ship separately and still leave the original problem
   solved is a second ticket; when the input is already one thing, say
   "none" rather than inventing a split.
9. **Loop hints.** Answer the four hints by inference. Somebody downstream has
   to decide what would stop an unattended run, and this is the half of that
   a spec can answer: which observation means it is over, whether there are
   many of something, whether part of it is worth having, and how much
   repetition should pass before a human looks. Answer in the requester's
   vocabulary, exactly as you write requirements. "No single observation" and
   "nothing" are legal, real answers, not gaps. Every hint is advisory.
10. Where a genuine fork exists — two reasonable readings that imply different
    work — write `[NEEDS CLARIFICATION: <question>]` inline in the section it
    affects, instead of guessing silently and instead of asking. Maximum
    three per spec. When more candidates exist, keep the three highest by
    scope, security or user-visible impact, and take an informed default on
    the rest.

On an **Amend**, apply the change and return the whole new spec, with every
section it does not touch preserved byte-for-byte.

## Output

Exactly this shape, and nothing around it — no preamble, no summary of what
you did:

```markdown
# Spec — <short title>

## Problem
Who has it, and what it currently costs them, in their terms.

## User scenarios
Concrete before/after situations that exercise this.

## Functional requirements
Numbered. Each stated so it can fail. No implementation vocabulary.

## Non-goals
What this explicitly does not do.

## Key entities
The nouns this problem is about, and what distinguishes one from another.

## Assumptions
What was taken as given, stated so it can be challenged.

## Second ticket
Scope split off, and why it is separable. "none" if the input is already one thing.

## Loop hints
- Ends when: <the observation that means this is over>
- Repeats over: <what there are many of>, or "nothing"
- Partial value: <is some of it worth having on its own, and in what unit>
- Human looks after: <how much repetition before somebody should check>
```

The four hints are four lines, always all four, never a fifth. "Ends when" is
the functional requirements seen from the other side: the observation that
would make someone stop. If none can be stated, write "no single
observation" — a real answer, not a gap.

A spec whose requirements could not be checked by someone who has never seen
the code is not finished.

## Never

- Invent a requirement the input never implied, to look thorough.
- Accept a second feature into this spec because it arrived in the same
  sentence as the first.
- Soften "this is unanswerable as given" into a guess with a hedge on it.
- Name a command, tool, threshold or mechanism in a loop hint. "Ends when no
  report shows the old label" is a legal hint; "ends when the suite exits 0"
  is not — choosing what gets measured, and with what, belongs to whoever
  designs the loop, and a hint that reaches into it is the same boundary
  breach as naming a library.
- Emit more than three `[NEEDS CLARIFICATION:` markers.
- Ask anything back. The dialogue already happened; this pass writes it down.
- On an Amend, reflow, reorder or reword a section the change did not touch.
