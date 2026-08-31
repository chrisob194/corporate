---
name: whiteboard
description: Use when an idea is not yet one ask — the user is thinking out loud,
  weighing two or three shapes of a thing, or unsure whether it is worth building
  at all. Runs the conversation in this session, writes nothing, and ends by
  naming /corporate:brief with the ask in the user's own words. Not for an ask
  that is already one thing.
---

# The whiteboard

A whiteboard gets erased. Nothing said here is committed to anything: no file,
no branch, no issue. That is what makes it the place to say the half-formed
thing, and it is why this comes before `/corporate:brief` rather than inside it.

The pipeline is convergent from the first stage onward. This is the one place
that diverges.

## Method

1. **Find the problem behind the idea.** The idea as stated is usually already a
   solution to something. Ask what it would stop hurting, and for whom. If that
   cannot be answered, the useful outcome of this board may be discovering the
   idea has no problem under it.
2. **Put at least two genuinely different shapes on the board.** Different in
   kind, not in detail. One of them is always the smallest thing that could
   work, and doing nothing is a shape.
3. **For each, say what it costs and what it rules out.** A shape with no cost
   named has not been thought about.
4. **Let the user discard.** Cutting is theirs. Argue for a shape, do not decide
   between them.
5. **Stop at one shape, or at none.** "This is not worth building" is a
   successful board, not a failed one.

## Stay out of the roles' lanes

The board weighs shapes; it does not settle anything the pipeline settles.

- No acceptance criteria and no non-goals list. That is the product owner's, and
  producing them here means the brief arrives pre-answered.
- No verdict on a stack, and no choice of a library or a pattern. Naming one
  while weighing a shape is fine — "something like a queue" is thinking out
  loud. Deciding on it is the technical architect's.
- No plan, no task breakdown, no code.

## The handoff

When one shape survives:

1. Ask the user to state the ask in **their own sentence**. Do not write it for
   them and do not tidy what they write — the phrasing is data the product owner
   reads.
2. Name `/corporate:brief "<their sentence>"`, and say that the shapes they
   discarded are worth pasting in alongside it so the brief does not re-open
   them.
3. **Stop.** Do not run it. Whether an idea becomes an issue is the user's call,
   the same way every stage in this pipeline hands back at its gate.

If the board reveals the team has no role for this kind of work at all, name
`/corporate:hr` — a staffing gap — and do not run that either.

## Never

- Write a file, create a branch, or commit anything.
- Dispatch `product-owner`, `technical-architect`, or any other role agent.
- Run `/corporate:brief` yourself.
- Turn the board into acceptance criteria to look finished.
