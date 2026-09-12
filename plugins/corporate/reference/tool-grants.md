# Tool grants

The ruling a piece of work carries about external-tool access. The
`technical-architect` writes a grant; `/corporate:build` and `/corporate:run`
read it. This file is the only definition — do not restate the grammar
anywhere else.

## Why the decision moved

A standing grant in a role's `tools:` line is decided before any work exists,
so it is wrong in both directions at once: carried by tasks that never needed
it, unavailable to the task that does. The person who knows what a particular
piece of work needs is whoever decides that work's scope — not whoever wrote
the role file long before the work existed.

## The two decision points

There is no third.

1. **The architect while designing the approach.** It writes the field in the
   plan, and it states the same triple in the brief of any search it dispatches
   during its own design pass.
2. **`/corporate:split`**, where the task block travels verbatim into the child
   issue, and the grant travels with it unchanged.

The role carrying out the work never decides, and it never renegotiates a
grant tool by tool once it has one.

## The grant

A grant is three things or it is not a grant:

- what may be reached for,
- what a result may be trusted for,
- what to fall back to when it is unavailable or answers nothing.

Guidance that does not travel with the grant is guidance that gets dropped —
the pointer-and-fallback discipline has to sit inside the same three fields as
the access itself, or a hurried dispatch drops the discipline and keeps the
access.

## The plan field

One optional line in a task block:

```
external_tools: none
external_tools: <what the work may reach for>; use: <what a result may be trusted for>; fallback: <what to do when it is unavailable or answers nothing>
```

An absent line means `none`. That default runs the opposite way to
`test-plan.md`'s missing-suite rule, deliberately: there, an absent row is a
plan defect, because skipping a layer is the unsafe direction. Here, an absent
line is the safe answer, because granting access is the unsafe direction —
absence must land on the restrictive answer, and the restrictive answer is no
access.

Worked example, a code-graph server:

```
external_tools: graft — code-graph search for call sites and definitions; use: a hit as a location to open, never as a finding to pass through; fallback: with no graph built, search with Grep and do not mention graft
```

With no graph, or no grant at all, the work searches with `Grep` and does not
mention the server that would otherwise have been reached for.

### The defect rule

A line that is not `none` and does not carry both a `use:` clause and a
`fallback:` clause is a **plan defect**, never a partial grant to be
interpreted. The stage that reads it hard-stops rather than guessing what the
missing clause would have said.

## Who can exercise a grant

Only a role whose definition holds the generic pool — no `tools:` allowlist,
and a `disallowedTools` line denying what it must not have. Today exactly one
role does. A role that delegates search to it passes the grant into that
dispatch rather than exercising the grant itself.

A grant written on work whose chain holds no pool is inert: nothing in that
chain can reach for anything the grant names. That is not a defect the reading
stage can catch — it looks like a legitimate grant. Whoever writes the grant is
the one who must not write it there, and this is why the decision stays with
whoever already knows the chain: the architect, or `/corporate:split` carrying
the same chain forward unchanged.

## What the stages do with it

| Stage | Does |
|---|---|
| `technical-architect` | writes the `external_tools:` line per task, and states the same triple in the brief of any search it dispatches during its own design pass |
| `/corporate:split` | carries the task block verbatim into the child issue, `external_tools:` included, and never lets the field become a requirement in the child's spec |
| `/corporate:build` | inlines the line in the builder's brief, verbatim or "grants none," and hard-stops on a malformed grant rather than guessing the missing clause |
| `/corporate:run` | does the same, and routes a malformed grant as a review cycle with origin `plan` |

There is no waiver for a malformed grant. It is not a ruling a human accepts
the cost of, like a missing playbook — it is a task field that is either well
formed or a defect in the plan that wrote it.
