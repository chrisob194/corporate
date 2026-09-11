# Design — #26

## Problem

Today the only way to learn whether an issue is workable is `/corporate:design`,
which dispatches `technical-architect` at `model: opus`, `effort: high`
(`plugins/corporate/agents/technical-architect.md:5-6`) through a fused two-phase
pass — approach *and* full task decomposition
(`technical-architect.md:28-33`) — and files two documents into the repository
and two notes onto the record (`plugins/corporate/commands/design.md:129-137`).
The playbook-coverage answer the drafter actually wants — "does this depend on
something nobody here has guidance for?" — is one table inside that output
(`plugins/corporate/reference/stack-readiness.md:19-32`), and it is only
reachable after the whole pass. Worse, `/corporate:design` refuses any issue that
is not `Open` (`design.md:21-28`), so a `Draft` cannot be read at all without the
user first promoting it — which is the very commitment they were trying to price.

What is being solved: a cheap, advisory read on a drafted issue that names what
the ask depends on, says which of those this team already has guidance for, and
verdicts overall doability — without producing a design, without touching the
record, and without leaving anything behind that a later stage could mistake for
a ruling.

Explicitly out of scope: the store's grammar
(`plugins/corporate/reference/issue-store.md` is untouched — no thirteenth
artifact kind, no new state, no new transition); the design stage's own duty to
rule `## Stack readiness` independently (`stack-readiness.md:7-17`), which this
design deliberately leaves exactly as it is; `/corporate:run`, which never calls
this command; and `/corporate:brief`, which gains no pointer to it (see
*Rejected*).

## Approach

Ship the same three-part shape every stage in this plugin already uses — a
reference that owns the grammar, an agent that fills it, a command that
dispatches and validates — and give it the one property no existing stage has:
**it writes nothing at all.**

**1. `plugins/corporate/reference/consult.md`** — the only definition of the
feasibility read. It fixes the document shape (`# Consult — #<n>`, then
`## Verdict`, `## Dependencies`, `## Reservations`, `## What to do next`), three
fixed verdict words (`buildable` / `reservations` / `blocked`), two fixed
coverage words (`known` / `unknown`), three fixed courses (`accept` / `amend` /
`set aside`), and — load-bearing — the paragraph stating that this document
**gates nothing and settles nothing downstream**: `/corporate:design` and
`/corporate:build` still gate on the design's own `## Stack readiness`, ruled
independently by the architect. That paragraph is what keeps the brief's deferred
question deferred rather than quietly answered. Its vocabulary is deliberately
*different* from `stack-readiness.md`'s (`known`/`unknown`, not
`covered`/`not-required`/`required-missing`) so the two can never be confused for
each other or copy-pasted between artifacts, and it forbids the document from
carrying a task breakdown, a file scope, an `acceptance` line, or any of the
three design verdict sections — criterion 5, mechanically.

A reference file is the right home by this repo's own rule: "Use one whenever a
format would otherwise be restated in two places" (`docs/authoring.md:209-217`).
Two components need to agree here — the agent writes the document, the command
validates it before printing it — exactly as `stack-readiness.md`,
`test-plan.md` and `scale.md` are shared between `technical-architect.md` and
`design.md`.

**2. `plugins/corporate/agents/consultant.md`** — a new write-less role. Tools:
`Read, Grep, Glob, Skill, WebFetch`. `Skill` is what lets it rule coverage at
all: coverage is ruled against the skills the session itself lists
(`stack-readiness.md:51-53`), and a subagent holding `Skill` sees that listing.
`WebFetch` rides with it because this repo grants the pair mechanically
(`CLAUDE.md:72-76`, `docs/authoring.md:50-53`). It gets **no `WebSearch`** — that
"stays on `technical-architect` alone" (`CLAUDE.md:75-76`), and the absence is a
feature here: the consultant cannot go and close a gap it found, so naming the
gap is its whole deliverable and climbing into the architect's job is not
available to it. No `Bash`, no `Agent`, no `Write` — it is a leaf, and the repo
read it takes is bounded (does the ask's premise hold, does the thing already
exist) rather than a sweep. `model: opus`, `effort: medium`: a judgement role
gets opus by convention (`docs/authoring.md:55-61`), and `medium` rather than the
architect's `high` is where the "fast read" saving actually comes from, since the
work is a page of judgement instead of a decomposition.

It carries a `## Stay out of the roles' lanes` section modelled on the
whiteboard skill's (`plugins/corporate/skills/whiteboard/SKILL.md:35-43`): no
approach chosen, no library named, no breakdown, no acceptance criteria.

**3. `plugins/corporate/commands/consult.md`** — `/corporate:consult <issue>`.
It runs the store's preflight *minus the write-permission check*: that row exists
for "one write-shaped call the run needs anyway"
(`issue-store.md:64-72`), and a command that never writes has none — skipping it
is what makes criterion 4 true by construction rather than by promise. It
normalises the key and resolves the issue per the store
(`issue-store.md:89-113`, `:527-545`), **opens no worktree and no branch**
(contrast `design.md:29-33`), reports whatever state it found without changing or
offering to change it, stops on a `split` parent naming
`/corporate:split <n> --status` (`issue-store.md:254-261`), dispatches
`consultant` with the brief inlined verbatim — the store stays invisible to the
role (`issue-store.md:50-61`) — validates the returned document against
`reference/consult.md`, prints it, and translates the returned course into the
command that performs it: `accept` → `/corporate:brief --promote <n>` then
`/corporate:design <n>`; `amend` → `/corporate:brief --update <n>`; `set aside` →
nothing to run. It states out loud that nothing was written.

**Nothing is filed.** No `consult` artifact kind is added to the store's twelve
(`issue-store.md:218-236`). A filed read would go stale the moment the brief is
amended — and criterion 6 demands the read reflect the issue *as currently
drafted* — so the honest storage for a feasibility read is a re-run, not a
comment. This also makes criterion 4 unarguable: there is no write to get wrong.

**4. Registration** — the three places this repo lists its components
(`README.md:236-245`, `:413-416`; `CLAUDE.md:32-58`; the router skill's tables at
`plugins/corporate/skills/corporate-pipeline/SKILL.md:108-120`, `:134-155`,
`:158-163`) plus the manifest version
(`plugins/corporate/.claude-plugin/plugin.json:4`, per `CLAUDE.md:240`).

**Settled during Phase B (the back-edge).** Drawing the file scopes surfaced a
dependency I had assumed away: `scripts/validate.ts:183-198` errors when a
component's markdown points at a `${CLAUDE_PLUGIN_ROOT}` path that does not
exist, and both the agent and the command point at
`${CLAUDE_PLUGIN_ROOT}/reference/consult.md`. Since each builder proves its own
acceptance inside its own worktree, T2 and T3 cannot pass acceptance until T1's
file exists on the branch. That is a real `depends_on`, not a feeling of
sequence, and it is why this plan is two waves rather than one.

## Tools chosen

**Layer 1 — this repository. The answer came from here.** Every mechanism this
needs already exists and is used by four other stages: the command/agent/
reference triad (`design.md` + `technical-architect.md` + `stack-readiness.md`
is the exact template), the dispatch-and-validate-before-presenting pattern
(`design.md:85-128`), the store-invisible brief (`issue-store.md:50-61`), the
"writes nothing" posture already proven by the whiteboard skill
(`whiteboard/SKILL.md:35-43`) and by the write-less `reviewer` and
`hr-manager` roles, and the coverage ruling itself, which is one existing rule
about an existing `Skill` listing (`stack-readiness.md:51-53`). Prior art
checked and rejected as a host: `technical-architect` (output contract is a
design, `technical-architect.md:216-226`), `product-owner` (holds no `Skill` on
purpose, so it cannot see the playbook listing — `README.md:282-283`), `scout`
(returns citations, never conclusions), `devops-engineer` (rules operability,
post-design). `docs/ideas.md` holds no drafted entry for this; `team-analyst`
(`docs/ideas.md:8-48`) is introspection over the team's own files, a different
question.

**Layer 2 — capability already installed.** Reached only to confirm nothing
answers it: no MCP server, skill or CLI here performs a feasibility read. The
`graft` server is search, granted to `scout` alone (`README.md:418`). The
`corporate-pipeline` router names commands and explicitly refuses to stand in for
a missing one (`corporate-pipeline/SKILL.md:168-171`), so routing cannot
substitute for the command. The playbook skills are consulted *by* this design —
their listing is the evidence base — but none of them answers the question.

**Layer 3 — libraries.** Not reached, and priced anyway: the change is markdown
prompt text run by the Claude Code loader. "Add nothing" wins by default because
there is no runtime here to add a dependency to; the repo's only scripts are
`bun scripts/validate.ts` and `bun test` (`package.json:7-10`).

**Layer 4 — runtime and platform.** Skipped. This is an existing repo: the
platform is Claude Code plugin markdown and bun, both fixed (`CLAUDE.md:237-239`).

## Stack readiness

| Stack | Verdict | Basis |
|---|---|---|
| claude-code-plugin | not-required | the new components use only frontmatter keys already shipped by the eleven agents and fifteen commands in this repo; `docs/authoring.md:27-61` and `scripts/validate.ts:121-144` fix in-repo every structural fact a builder needs, and no new key is introduced |
| github | covered | github-playbook |
| bun | not-required | the plan invokes only the repository's existing `validate` and `test` scripts (`package.json:7-10`); no runtime, bundler, dependency or test-framework decision turns on bun-specific fact |

## Verification

| Layer | Verdict | Why | Environment |
|---|---|---|---|
| unit | not-required | no executable code path changes; this repo's unit tests exercise exported functions of `scripts/validate.ts` (`test/validate-graft.test.ts:1-2`), and no task touches that file | — |
| integration | required | three of the four tasks add files the marketplace loader parses, and two of them point at a `${CLAUDE_PLUGIN_ROOT}` path; `bun run validate` is the mechanical proof that frontmatter, the agent name/filename rule and every plugin-root pointer still resolve (`scripts/validate.ts:121-144`, `:183-198`) | bun on `PATH`, run from the repository root; no server, no network, no database, no fixture |
| e2e | not-required | nothing crosses a process boundary, a network or a browser — the changed behaviour is prompt text executed by a human-in-the-loop session, which this repository ships no harness to drive | — |

## Scale

| Verdict | Reason |
|---|---|
| standard | Three new components plus three registration surfaces and the manifest — four file sets that cannot be merged into one builder pass, and a real dependency between two of the waves |

## Rejected

- **Dispatch `technical-architect` with a "Phase A only" brief.** Its output
  contract is fixed at `# Design — #<n>` plus a plan or a `## Plan withheld`
  section (`technical-architect.md:216-226`), and its method is two phases in one
  pass (`:28-33`). Asking it for half of that invites exactly the over-delivery
  criterion 5 forbids, and it is the expensive role the brief is complaining
  about (`opus`/`high`, `:5-6`).
- **Run the read inline in the main session, like the whiteboard skill.** It
  would avoid a new agent, and the main session does see a `Skill` listing — but
  the repo read and the coverage sweep land in the user's own context, which is
  what context isolation exists to prevent, and this repo's rule is that a
  judgement with a fixed output shape is an agent contract, not a command's
  improvisation (`README.md:89-92`).
- **File a `consult` artifact on the issue.** It would cost a thirteenth kind in
  `issue-store.md:218-236` — a shared file every command reads — to store a
  document that goes stale against the next `--update` and that nothing
  downstream consumes. `/corporate:deploy --check` files an `ops` artifact, but
  that one is read by the deploy that follows it; nothing reads a consult.
  Re-running is the freshness guarantee criterion 6 asks for.
- **Reuse `stack-readiness.md`'s vocabulary** (`covered` / `not-required` /
  `required-missing`) in the consult table. Same words in an advisory document
  and a gating one is how an advisory read gets pasted into a design, and it
  would half-answer the question the brief explicitly defers.
- **Restrict the command to `Draft` and refuse every other state.** It adds a
  failure mode and protects nothing: a command that writes nothing is safe to run
  on any state, and refusing `Open` would deny the read to exactly the person who
  promoted too early. It reports the state it found instead.
- **Add a pointer to `/corporate:consult` in `/corporate:brief --promote`.** No
  criterion asks for it, it edits a file #25 has just rewritten, and
  discoverability is already the router skill's and the README's job.
- **Give the consultant `WebSearch` so it can research an unknown dependency.**
  That is the architect's tool by standing convention (`CLAUDE.md:75-76`), and a
  consultant that can research is a consultant that will start designing.

## Risks

- **Trigger collision with `technical-architect`.** Two descriptions competing
  for "is this doable" routes badly. Mitigated by writing the consultant's
  description around the pre-design, drafted-issue, no-breakdown case, and by
  naming `consultant` in the router skill's do-not-dispatch list
  (`corporate-pipeline/SKILL.md:158-163`).
- **Verdict creep.** An advisory verdict that people start treating as a gate
  would make `/corporate:design`'s independent ruling look redundant by habit
  rather than by decision. Mitigated by the "settles nothing" paragraph living in
  the reference, and by the command repeating it at its gate.
- **Cheapness erosion.** If the consultant's method grows a repo sweep it stops
  being cheaper than a design and the feature loses its reason to exist. Mitigated
  by withholding `Bash`, `Agent` and `WebSearch`, and by `effort: medium`.

## Open questions

None blocking, and no plan is withheld. For the record: the brief defers whether
`/corporate:design`'s own duty to independently discover a missing dependency
becomes redundant once this exists. This design answers it in the only way that
keeps both options open — the architect's `## Stack readiness` duty is untouched,
and `reference/consult.md` states in writing that the consult settles nothing
downstream. Deciding to actually relax the design stage's duty is a change to
`stack-readiness.md` and `design.md`, and belongs to its own issue.
