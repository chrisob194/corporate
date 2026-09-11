# Consult

The advisory feasibility read a drafted issue gets before anyone pays for a
design. The `consultant` writes it; `/corporate:consult` validates and prints
it. This file is the only definition — do not restate the grammar anywhere
else.

## Why it settles nothing

A consult gates nothing. It is never a precondition for `/corporate:design` or
`/corporate:build` — both are enterable on any issue regardless of what a
consult said, or whether one was ever run. The design's own `## Stack
readiness` ruling stays independent of this document and is defined only in
`reference/stack-readiness.md`; nothing here relaxes, replaces or stands in for
it. Whether that independent duty becomes redundant once a consult exists is an
open question — this file does not answer it, and does not attempt to.

## Shape

One document, printed and filed nowhere:

```markdown
# Consult — #<n>

## Verdict

| Verdict | Reason |
|---|---|
| buildable | one line naming what makes the verdict true |

## Dependencies

| Dependency | Coverage | Basis |
|---|---|---|
| <stack or capability> | known | <skill name> |

## Reservations

- one line each, or `none`

## What to do next

accept — one-line reason
```

## Verdicts

Exactly one of three words.

| Verdict | Means |
|---|---|
| `buildable` | every dependency is `known` and nothing in the ask needs a human decision first |
| `reservations` | buildable, but an `unknown` dependency is peripheral, or the brief leaves something a human must settle |
| `blocked` | the ask rests on an `unknown` dependency, or on a premise this repository does not support as drafted |

**The tie goes to the more cautious word.** Weighing `buildable` against
`reservations`, or `reservations` against `blocked`, resolves to the more
cautious of the two.

## Coverage

Exactly one of two words, per dependency row.

| Coverage | Means |
|---|---|
| `known` | a playbook skill covers it; `Basis` holds the skill name |
| `unknown` | no playbook here covers it; `Basis` holds one line saying so |

`Dependency` is a bare identifier — a stack or capability name, never a path, a
repository name or a phrase. This vocabulary is deliberately not
`stack-readiness.md`'s (`covered` / `not-required` / `required-missing`), so
the two documents can never be mistaken for each other or copy-pasted between
artifacts.

## Courses

Exactly three, naming what the requester does next. The command that performs
each one is `/corporate:consult`'s to name, not this file's.

| Course | Means |
|---|---|
| `accept` | the ask is ready to move forward as drafted |
| `amend` | the brief needs a change before it is worth designing |
| `set aside` | not worth pursuing as drafted, and not worth amending right now |

## What a consult never contains

No task breakdown, no ordered list of buildable work, no `depends_on`, no
`files:`, no `acceptance:` line, no `## Stack readiness`, `## Verification` or
`## Scale` section, and no chosen approach or named library. Any of these is
over-delivery — it is the design stage's job, not this one's — and the command
re-dispatches rather than printing a document that carries one.

## Freshness

Nothing is filed. A consult is never stale, because there is no copy of it
sitting anywhere to go stale — a re-read is simply a re-run against the issue
as currently drafted.
