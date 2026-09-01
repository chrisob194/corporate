# Stack readiness

The ruling a design carries about playbook coverage. The `technical-architect`
writes it; `/corporate:plan` and `/corporate:build` gate on it. This file is the
only definition — do not restate the grammar anywhere else.

## Why the architect rules and nobody else

The architect holds `WebSearch` and `WebFetch`. Facing a stack this team ships
no playbook for, it can go and read the upstream docs and cite them. `planner`
and `builder` hold neither the search tool nor the mandate: for them "no
playbook" means "answer from memory", which is the one thing every playbook
skill exists to forbid. So the architect is never blocked by a missing playbook
— it is made to say, in writing, whether the stack's knowledge is load bearing.
The stages after it are blocked, unless a human waives it.

## Shape

One section in the issue's `design.md`, one row per stack the
recommended approach relies on:

```markdown
## Stack readiness

| Stack | Verdict | Basis |
|---|---|---|
| bun | covered | bun-test-playbook, bun-runtime-playbook |
| terraform | required-missing | developer.hashicorp.com/terraform/docs |
| json | not-required | shape only, no format decision turns on it |
```

`Stack` is a bare stack identifier — `python`, `terraform`, `postgres`. Never a
path, a repository name, or a phrase. It is the same value `hr-report` accepts
as `subject`, and for the same reason: the row can end up on a public tracker.

## Verdicts

Exactly one of three words.

| Verdict | Means | `Basis` holds |
|---|---|---|
| `covered` | a playbook skill covers this stack | the skill name(s) |
| `not-required` | the stack is touched, but no plan or build decision turns on stack-specific fact | one line saying why not |
| `required-missing` | decisions downstream do turn on this stack, and no playbook covers it | the authoritative doc root URL |

`not-required` is a real answer, not an escape hatch. Writing a JSON file does
not need a JSON playbook. Choosing how a JSON schema is validated does.

The architect rules coverage against the skills its own session lists — it holds
the `Skill` tool, so the listing is in its context. A stack no playbook skill in
that listing covers is not covered.

## Obligations on the architect

- Every stack the approach relies on gets a row. A design whose approach names a
  technology absent from the table is incomplete.
- A `required-missing` row means the architect's own recommendation must be
  grounded in fetched upstream docs, cited by URL, never in memory. It holds the
  tools; memory is not available to it as an excuse.
- One `knowledge` HR record per `required-missing` stack, filed through the
  `hr-report` skill, `subject` = the stack identifier.

## What the stages do with it

`covered` and `not-required` pass. Any `required-missing` row is a **hard stop**
for `/corporate:plan` and `/corporate:build`. The stage names the stack, its doc
root, and the waiver flag, and stops. Never soften it to a warning: past this
point the roles have no way to answer except from memory.

Each stage reads the design itself. Any stage can be entered cold, so a stage
that trusts an earlier one to have checked is a stage that does not check.
A design that does not exist, or one with no `## Stack readiness` section, is
also a stop — an unruled design is not a ruled-clear design.

## The waiver

```
/corporate:plan <slug> --without-playbook <stack>[,<stack>]
/corporate:build <slug> --without-playbook <stack>[,<stack>]
```

Only a human passes it, never a command on its own behalf, and it waives only
the stacks it names.

**`/corporate:ship` has no waiver and never gets one.** It runs unattended, and
a waiver is the user accepting that a role will work from memory in a stack
nobody documented — a decision that needs the person who will live with the
result. A `required-missing` stack in an autonomous run moves the issue to
`Blocked` and ends the run. The user then waives on a hand-driven
`/corporate:plan`, or writes the playbook.

A waived stage must:

1. Say what was waived, before dispatching anything.
2. Name the waived stacks in every dispatch brief, as a standing instruction to
   file one `knowledge` HR record per stack and to mark in the artifact every
   decision taken from memory.
3. Repeat the waiver in its final report, so it shows up at the gate.

A waiver is per invocation. It is never remembered, never written to a file, and
never inferred from the fact that an earlier stage was waived.
