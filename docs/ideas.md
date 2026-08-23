# Drafted ideas

Not shipped. Not validated by use. Promote to a real component only after the
idea survives a second look. Nothing here bumps `plugin.json`.

---

## agent: `team-analyst`

**Status:** drafted — what is left of the original `hr` entry after promotion

Read-only introspection over the team itself, and nothing to do with grievances.
The grievance half of the old `hr` draft shipped in v0.12.0 as `hr-report` +
`hr-manager` + `/corporate:hr`; this is the half that did not, kept narrow so it
cannot collide with the department that now exists.

**Tools:** `Read`, `Grep`, `Glob` (no `Write`, no `Edit`, no `Bash`)

**Description direction:** "Use when the user asks which agent would be picked
for a task, which two agents compete for the same trigger, or whether an agent's
body has drifted from the job its frontmatter claims."

**What it answers**

| Question | How |
|---|---|
| who gets picked if I say X? | routing sim over every `description:`; names the winner and the near-misses |
| which agents overlap? | two descriptions competing for one trigger — neither fires reliably |
| who has too much power? | tool audit; e.g. a reviewer holding `Write` |
| is this agent drifting? | frontmatter job vs. what the body actually instructs |

**Deliberately out of scope**

- Anything HR now owns. It never reads `.corporate/hr/`, never clusters records
  and never drafts an issue. "What is the team complaining about?" is
  `hr-manager`'s question, and a second reader of that log splits the answer.
- "Which agent is unused?" — needs invocation data nothing currently logs.
- Editing agent files. Advisory only, same posture as `reviewer` and `hr-manager`.

**Open questions**

- Does the routing sim need the full body of each agent, or is frontmatter enough?
- Is `team-analyst` a job title? The naming rule says agents are job titles, and
  this one is closer to a function than a role. `staff-engineer` is a title but
  means something else everywhere; `org-analyst` is a title nobody holds.
- Does it earn a file at all, or is this a `/corporate:doctor` command alongside
  the rejected `sre` entry below — both are fixed diagnostic passes over the
  plugin's own state.

---

## skill: `angular-playbook`

**Status:** drafted — but the family format it needed now exists

Per-stack policy for how this team uses the Angular MCP server. Keeps stack
knowledge out of the role files: `builder.md` still says "implement per plan",
the playbook says what that means in an Angular workspace.

`docs/authoring.md` fixes the format: five
body sections — `Stack`, `Toolchain`, `Obligations by activity`, `Traps`,
`Resources` — in that order, and no version section. The one URL a playbook
carries is its pinned doc source, as a single `Obligations` row. A playbook
is an orientation card, not a tutorial. This entry inherits that rather than
inventing a shape, and both of its open questions below are settled:

- **One playbook per stack**, not one skill with per-stack sections. A narrow
  description routes better.
- **Bring-your-own server.** `.mcp.json` stays empty; the playbook degrades
  gracefully when the server is absent and never claims the plugin provides it.
- **Agent-agnostic.** Obligations are keyed to the activity, not to `builder` or
  `reviewer` — the table below was rewritten accordingly.

Also settled by that ship: `architect`, `planner`, `builder`, `reviewer` and
`qa-engineer` now carry the `Skill` tool, so the prerequisite below is met. The
remaining work here is content, not design.

**Naming:** follows `release-checklist` — noun-phrase artifact, not a topic
label. Pattern scales to `spring-playbook`, `n8n-playbook`, one skill per stack,
the description acting as the router.

**Why a skill and not a command:** a command is a one-shot injection into the
user's turn. A dispatched subagent never sees it. A skill is discoverable by any
agent holding the `Skill` tool, which is where the policy actually needs to land.

**What it must NOT contain:** a restatement of the MCP server's own
instructions. The `angular-cli` server already broadcasts "call `list_projects`
first, `get_best_practices` before writing code, `search_documentation` for
concepts, prefer these over the shell". Every agent in the session already sees
that. Nor does it review that broadcast: per the format's core rule the playbook
states what this stack does and never audits, dates or corrects another
component's content. So `angular-cli` appears as one bare name under
`## Resources` → `### MCP servers`, and the body carries only what the server
cannot know — which of our roles does what, at which step of our process.

**Content: obligations by activity** — keyed to the activity, never to an agent
name, per the format's agent-agnostic rule.

| Activity | Obligation |
|---|---|
| choosing an approach / breaking work down | `search_documentation` rather than guessing API shape; `list_projects` to learn the real workspace layout before proposing structure |
| implementing | `get_best_practices` before the first edit, as a hard gate; `run_target` / `devserver_*` instead of `ng` through Bash |
| reviewing | flag `onpush_zoneless_migration` candidates; check that best practices were actually loaded before the edits |
| any | never shell out to `ng` when a tool covers it |

**Prerequisites to verify before this ships**

- ~~Agents must list `Skill` in their frontmatter `tools:`~~ — done in v0.8.0.
- `plugins/corporate/.mcp.json` is empty — the `angular-cli` server is a
  user-level server, not plugin-shipped. The playbook has to degrade gracefully
  when the tools are absent, and must not claim the plugin provides them.

**Open questions**

- None of design. Both prior questions are answered by the format in
  `docs/authoring.md`; see the status note above.

---

## The role chain

Settled while drafting the entries below. Every new role slots into one place:

```
product-owner -> architect -> planner -> builder -> reviewer / qa-engineer
```

`tech-lead` sits across it as advisor. `hr-manager` reads what the chain filed
about itself, from outside it. `archaeologist` and `scribe` are called from
anywhere.

The chain is now fully shipped: `product-owner` and `qa-engineer` were promoted
out of this file in v0.3.0, with `/corporate:brief` and `/corporate:qa` driving
them. Their open questions were settled at promotion — QA writes test files only
and never fixes what it breaks; the product owner blocks on unanswered questions
rather than assuming, since a dispatched subagent cannot interview anyone.

`hr` was promoted out in v0.12.0, as `hr-manager` plus the `hr-report` skill and
`/corporate:hr`. What was settled at promotion:

- **Records are files, not a JSONL log.** The draft assumed an append, which no
  single tool provides across the team — `planner` has `Write` and no `Bash`,
  `reviewer` has `Bash` and no `Write`. One file per record, named
  `<kind>-<subject>-<slug>.md`, is a create rather than a read-modify-write, and
  makes recurrence a `Glob` count.
- **Four kinds, not free text** — `remit`, `tooling`, `knowledge`, `staffing`.
  Each maps to exactly one shape of fix in this repository, which is what makes
  filing to *this* tracker correct rather than presumptuous.
- **The agent drafts, the command files.** `hr-manager` is offline and
  write-less, and is handed the existing open issues in its brief. The network,
  the per-issue confirmation and the setting all live in `/corporate:hr`.
- **Log location:** repo-local `.corporate/hr/`, gitignored by the consumer —
  which is also what keeps a write-less `reviewer` from dirtying the tree its own
  review checks.
- **`product-owner` does not report.** It has no `Skill` tool on purpose, and
  granting it one to reach `hr-report` would also grant `WebFetch` and void the
  reason it lacks both. `/corporate:brief` names `/corporate:hr` instead — its
  gate has a human present anyway.
- **`scout` does not report.** Read-only search drone; nothing to grieve.

---

## agent: `archaeologist`

**Status:** drafted

Answers "why is this code like this". Read-only history spelunking.

**Why an agent and not a skill:** `git log -S` over a real repo dumps enormous
output. Inside an agent that burns in a sandboxed context and comes back as one
paragraph. The context isolation is the entire case for the role.

**The md is a procedure, not knowledge** — which is what makes it writable:

1. `git log --follow <file>` — when did this appear
2. `git log -S '<exact string>'` — which commit introduced *this line*, not the file
3. `git blame -L` on the line, then read that commit's full diff and message
4. Look at the sibling changes in the same commit — the reason usually lives in
   what changed alongside
5. Verdict: does the original constraint still hold, or is this a fossil?

**Fixed output shape:** claim + commit hash as evidence + fossil-or-still-valid
verdict. The fixed shape is what keeps the file short.

**Tools:** `Read`, `Grep`, `Glob`, `Bash` (git only, read-only invocations)

---

## agent: `scribe`

**Status:** drafted

Owns the prose. `README.md`, `docs/authoring.md`, changelog entries.

**Why it earns a role:** docs rot silently and no current agent owns them. Every
other role treats documentation as an afterthought to its real job.

**Open questions**

- Does it own commit messages too, or does that stay with whoever commits?
  `caveman-commit` already exists at user level — likely a trigger collision.
- Scope limited to `docs/` and `README.md`, or any prose anywhere including
  code comments?

---

## skill: `pre-mortem`

**Status:** drafted

Assume this plan shipped and failed. What was the cause?

**Replaces a rejected agent.** A `devils-advocate` agent was considered and
dropped: a competent `architect` already argues against its own plan, and a
second role competing for "challenge the plan" triggers only makes routing
worse. The distinction that did exist was thin — `product-owner` attacks the
request, the advocate attacks the plan — different artifact, not different
enough for a role.

As a skill it keeps the value with no new role and no trigger collision.
Invocable by `architect` or `reviewer` against a written plan.

---

## agent: `locator`

**Status:** drafted

A cheaper second scout for bounded lookups — "where is this exact symbol",
"which files import this" — as opposed to `scout`'s open sweep ("how is this
done here, what already exists").

**Why it might earn a file:** `model:` is per-agent-file, so two files is the
only mechanism that gives a caller a cost choice at dispatch time. `planner`
(file scope per task) and `reviewer` (call sites behind a diff) both want the
bounded form, and both currently pay `scout`'s sonnet rate for it.

**Pricing at time of writing (2026-08-21):** `haiku` is $1/$5 per MTok against
sonnet's $3/$15 — 3x on input, which is where a search agent spends. But Haiku
4.5 **rejects `effort`** and carries a 200K context against sonnet's 1M, and a
wide sweep is exactly the workload that overruns 200K. That is what makes it a
*bounded* lookup agent and not a cheap `scout`.

**Why it is not shipped:** split by job, not by model — and the split needs two
descriptions that route themselves. `scout` has four callers as of now; the
right two descriptions will be obvious once those callers show which questions
they actually ask. Shipping both up front means guessing both.

**Preconditions to promote**

- A caller that measurably wants the bounded form and is capped by cost.
- Descriptions distinguishable without naming a model, or the main loop picks
  between them arbitrarily.
- Hard bounds in the prompt (fixed globs, capped output) so 200K holds.

---

## Rejected

- **`sre` agent** — promised by CLAUDE.md, but there is no production here to
  keep up. The honest translation is "the session is production": a hook exiting
  non-zero and killing the turn, an MCP server that will not connect, a plugin
  that does not load after reinstall, `validate` failing in CI. That is a fixed
  diagnostic checklist, so it wants to be a `/corporate:doctor` command rather
  than a role. Revisit only if triage starts needing judgement.
- **`devils-advocate` agent** — see the `pre-mortem` skill above.
- **`release-manager` agent** — `/corporate:ship` already owns this. A second
  owner splits responsibility.
- **`security-engineer` agent** — a `security-review` skill already exists at
  user level. Duplicate trigger, worse routing.
- **`onboarder` agent** — collides with the existing `tech-lead-support` skill.

---

## command: `/corporate:pitch-feature`

**Status:** drafted

Guides the user through pitching a feature for the application being worked on.
No new role — it drives the two that already own this: `product-owner` then
`architect`.

**Why a command:** the whole thing happens in the user's own turn, at the
keyboard, conversationally. Nothing here is ever needed by a dispatched
subagent, so it is a command rather than a skill.

**Shape: two gates, in order, and the second will not open early.**

Gate 1 — `product-owner`. Ends only when the ask is falsifiable:

- what problem, for whom, and what does it currently cost them
- acceptance criteria: how do we know it is done, stated so it can fail
- explicit non-goals
- scope split: what is a second ticket

Refuses to hand over on "make it better". No file, library or pattern is named
in this gate.

Gate 2 — `architect`. Receives the criteria as given and never re-litigates
whether the feature should exist:

- where it lives in the existing structure
- what it touches, and what breaks if it is wrong
- the stack playbook, if the workspace has one (`angular-playbook`)
- optionally `pre-mortem` on the result

**Output:** criteria plus non-goals from gate 1, structural shape from gate 2 —
handed to `planner`, not to `builder`.

**Mechanism: one command, two mechanisms, chosen by what each role does.**

A dispatched subagent cannot talk to the user — it runs headless and returns
final text, with no way to ask a question mid-run. Agent-to-agent contact via the
main session is a relay, not a conversation: the main loop dispatches one, takes
its output, feeds the next. The user can interject between the gates, never
during one.

- Gate 1, `product-owner`, runs **inline**. Its whole job is an interview with a
  human; dispatching it destroys the job. Cost: it is a persona in the main
  context rather than an isolated role, so the user's context carries it and the
  role fidelity is weaker.
- Gate 2, `architect`, is **dispatched**. It needs no dialogue — it reads the
  codebase and returns a shape, which is exactly the large output that context
  isolation pays for. Fires only after the user approves the handoff.

**Rejected alternative:** dispatching `product-owner` too, as a round-trip — it
returns questions instead of criteria, the user answers in the main session, it
is dispatched again with the answers. It works, but a three-round interview costs
three dispatches and reads as latency.

**Superseded in part:** v0.3.0 shipped exactly that round-trip as
`/corporate:brief`, because an agent that only exists inline is not an agent.
If this command ever ships, gate 1 should call `/corporate:brief` rather than
carry a second copy of the interview.

**Open questions**

- Where does the result land? A ticket, a scratch file, or straight into the
  planner's hands with nothing written down.

---

## command: `/corporate:pitch`

**Status:** drafted

The meta counterpart: pitching a new *component of this plugin* — an agent,
command, skill or hook. Distinct trigger from `pitch-feature`, which pitches
features of an application.

**Why this exists at all:** no role owns "shape of the team". `product-owner` is
disqualified by its own boundary rule — it must never name a file, library or
pattern, and choosing agent-vs-skill-vs-command is exactly that. `hr` is the
right inventory reader, since here the inventory *is* the agents and commands,
but `hr` is read-only and a pitch has to write.

**The rubric, inline in the command body** (this is the procedure the session on
2026-08-20 actually used to produce every entry in this file):

| Question | Rule |
|---|---|
| command, skill or agent? | one-shot in the user's turn → command · must reach a dispatched subagent → skill · large output needing context isolation → agent |
| does it earn existence? | is something already broadcasting this? An MCP server that ships its own instructions must not be restated |
| trigger collision? | two components competing for one trigger → merge or kill one |
| role or procedure? | fixed checklist → command · needs judgement → role |
| does the boundary hold? | name a test case both candidates could claim, check they ask different questions |

**Writes to:** `docs/ideas.md`, as a drafted entry. Never creates the real
component, never bumps `plugin.json`.

**Rejected alternative:** a `component-design` skill holding the rubric. By the
rubric's own first rule it fails — this only ever runs in the user's turn, so a
skill would be indirection for nothing.
