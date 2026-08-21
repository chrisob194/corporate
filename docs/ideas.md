# Drafted ideas

Not shipped. Not validated by use. Promote to a real component only after the
idea survives a second look. Nothing here bumps `plugin.json`.

---

## agent: `hr`

**Status:** drafted

Read-only introspection over the team itself. Answers questions about the
agents, commands, skills and hooks the plugin ships — never edits them. Reports;
the user decides.

**Tools:** `Read`, `Grep`, `Glob` (no `Write`, no `Edit`, no `Bash`)

**Description direction:** "Use when the user asks who would handle a task,
which agents overlap, what roles are missing, whether an agent has drifted from
its stated job, or what the team has been reporting to HR."

**What it answers**

| Question | How |
|---|---|
| who gets picked if I say X? | routing sim over every `description:`; names the winner and the near-misses |
| which agents overlap? | two descriptions competing for one trigger — neither fires reliably |
| who has too much power? | tool audit; e.g. a reviewer holding `Write` |
| what roles are missing? | compares shipped agents against the roles CLAUDE.md promises (QA, SRE, product owner) |
| is this agent drifting? | frontmatter job vs. what the body actually instructs |
| what is the team complaining about? | reads the HR log, clusters it, proposes boundary changes |

**Deliberately out of scope**

- Editing agent files. Advisory only, same posture as `reviewer` and `tech-lead`.
- "Which agent is unused?" — needs invocation data nothing currently logs.
  Revisit if a hook starts recording agent picks.

**Open questions**

- Does the routing sim need the full body of each agent, or is frontmatter enough?
- Ships as one agent, or as a `/corporate:hr` command that keeps it in the main
  context?

---

## skill: `hr-report`

**Status:** drafted

The intake side. Any agent that did something it judges outside its remit
appends a record; the user can file one too.

**Why a skill and not a call to the `hr` agent:** a subagent cannot reliably
invoke another agent. The report has to be a write, not a call.

**Mechanism:** append one JSON line to `.corporate/hr-log.jsonl` —
`{who, when, what, why_out_of_scope}`. Append-only. Never rewritten.

**Why it is worth logging:** a single report is noise. The same report five
times means the agent boundaries are wrong. The log is the evidence `hr` reads.

**Rejected alternative:** a `Stop` / `PostToolUse` hook capturing this
automatically. Hooks cannot judge "this felt out of scope". Self-report only.

**Open questions**

- Log location: repo-local `.corporate/` (gitignored? committed?) or under
  `~/.claude/`. Repo-local ties reports to the project they happened in.
- Does the user filing a report use this skill too, or a separate command?

---

## skill: `angular-playbook`

**Status:** drafted

Per-stack policy for how this team uses the Angular MCP server. Keeps stack
knowledge out of the role files: `builder.md` still says "implement per plan",
the playbook says what that means in an Angular workspace.

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
that. The playbook carries only what the server cannot know — which of our roles
does what, at which step of our process.

**Content: role obligations**

| Role | Obligation |
|---|---|
| architect / planner | `search_documentation` rather than guessing API shape; `list_projects` to learn the real workspace layout before proposing structure |
| builder | `get_best_practices` before the first edit, as a hard gate; `run_target` / `devserver_*` instead of `ng` through Bash |
| reviewer | flag `onpush_zoneless_migration` candidates; check the builder actually loaded best practices |
| all | never shell out to `ng` when a tool covers it |

**Prerequisites to verify before this ships**

- Agents must list `Skill` in their frontmatter `tools:`, or none of this is
  reachable.
- `plugins/corporate/.mcp.json` is empty — the `angular-cli` server is a
  user-level server, not plugin-shipped. The playbook has to degrade gracefully
  when the tools are absent, and must not claim the plugin provides them.

**Open questions**

- Does the plugin bundle the Angular MCP in `.mcp.json`, or stay
  bring-your-own-server and document it in the README?
- One playbook per stack, or a single `stack-playbook` with per-stack sections?
  Per-stack is the current bet — a narrow description routes better than a broad one.

---

## The role chain

Settled while drafting the entries below. Every new role slots into one place:

```
product-owner -> architect -> planner -> builder -> reviewer / qa-engineer
```

`tech-lead` sits across it as advisor. `hr` looks at the chain from outside.
`archaeologist` and `scribe` are called from anywhere.

The chain is now fully shipped: `product-owner` and `qa-engineer` were promoted
out of this file in v0.3.0, with `/corporate:brief` and `/corporate:qa` driving
them. Their open questions were settled at promotion — QA writes test files only
and never fixes what it breaks; the product owner blocks on unanswered questions
rather than assuming, since a dispatched subagent cannot interview anyone.

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

## Rejected

- **`sre` agent** — promised by CLAUDE.md, but there is no production here to
  keep up. The honest translation is "the session is production": a hook exiting
  non-zero and killing the turn, an MCP server that will not connect, a plugin
  that does not load after reinstall, `validate` failing in CI. That is a fixed
  diagnostic checklist, so it wants to be a `/corporate:doctor` command rather
  than a role. Revisit only if triage starts needing judgement.
- **`devils-advocate` agent** — see the `pre-mortem` skill above.
- **`release-manager` agent** — `release-checklist` and `/ship` already own this.
  A third owner splits responsibility.
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
