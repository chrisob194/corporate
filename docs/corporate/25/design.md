# Design — #25

## Problem

`/corporate:brief` cannot record anything until the `product-owner` subagent is
satisfied. The agent's method (`plugins/corporate/agents/product-owner.md:39-63`)
demands a stated cost ("If you cannot state the cost, that is a blocking
question", `:43-44`), criteria each stated so it could fail (`:45-48`), an
explicit non-goals list (`:49`), a split check (`:50-51`), a list of what it
could not answer (`:52-54`) and four loop-hint answers (`:55-61`). When any of
those is unanswerable it returns `**Status:** blocked on answers`
(`product-owner.md:90`), and `plugins/corporate/commands/brief.md:198-202` turns
that into a round trip to the user — repeatable until `ready`. The orchestrator
then adds a gate of its own: "each one could actually fail. If a criterion could
not, say so rather than filing it" (`brief.md:204-205`). The same interrogation
runs again on amendment (`brief.md:248-251`). Nothing is recorded until all of
that passes.

What is being solved: make creating and amending a record cost one sentence,
with the intake shape taken from spec-kit's `specify` command, and retire the
interrogation rather than keeping it beside the new path.

Explicitly out of scope: the store itself. The four states, the transitions, the
key, the artifact kinds, the numbered `brief` artifact and the write ordering in
`plugins/corporate/reference/issue-store.md` are untouched by this design —
which is what satisfies criteria 5 and 6 by construction rather than by new
mechanism. Also out of scope: the whiteboard skill (its rule at
`plugins/corporate/skills/whiteboard/SKILL.md:39-40` — do not arrive
pre-answered — stays exactly as correct as it is today), `design-loop` and
`loop-engineer` (see *Approach*, the loop-hints ruling), and the pre-existing
disagreement between `docs/authoring.md:57` (says `product-owner` gets `opus`)
and `product-owner.md:5` (`sonnet`) — unrelated to intake, and T1 is told not to
touch it.

## Approach

Keep the role, replace its method. `/corporate:brief` still dispatches
`product-owner`, still receives a brief as the agent's final message, and still
performs every store write itself — that separation is the reason the store
works (`issue-store.md:50-61`) and is not what makes filing heavy. What makes
filing heavy is the user-facing question loop, and that is what goes.

The new intake, carried from spec-kit's `specify`:

1. **The text is the description.** Nothing else is requested. If the ask is
   empty, the single thing asked back is the ask itself — already the behaviour
   at `brief.md:188-190`, and it matches `specify`'s `"If empty: ERROR 'No
   feature description provided'"`.
2. **Informed defaults, never questions.** `specify`'s rule is `"Make informed
   guesses based on context and industry standards"`; the agent fills every
   section of the brief from the ask, the repository and `CLAUDE.md` instead of
   asking. `## Problem`, `## Acceptance criteria`, `## Non-goals`,
   `## Second ticket` and `## Loop hints` all survive as headings — they are
   read downstream (`commands/design.md:51`, `commands/design-loop.md:36-38`,
   `agents/reviewer.md:24`) — but they are now inferred, never interrogated.
3. **Ambiguity becomes a marker, not a stop.** Where a genuine fork exists, the
   agent writes `[NEEDS CLARIFICATION: <question>]` inline in the section it
   affects, capped at three, chosen by scope/security/UX impact — spec-kit's
   `"LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total"`. The literal token
   is adopted verbatim because `brief.md` needs a mechanical way to find and
   report the markers at the gate, and a substring is the cheapest one.
4. **No blocking status.** `**Status:** ready | blocked on answers`
   (`product-owner.md:90`) and `## Unanswered` (`:110-111`) are deleted. The
   agent always returns a brief. Deleting the status is what makes the retirement
   real rather than optional (criterion 7): the branch at `brief.md:198` and the
   one at `commands/split.md:84-88` become unreachable and are removed with it.
5. **The clarification loop moves to amendment.** spec-kit does not resolve its
   markers in `specify` — it has a separate command, `clarify`, described as
   `"Identify underspecified areas in the current feature spec by asking up to 5
   highly targeted clarification questions"`, run later and only if wanted. This
   pipeline already has that command: `/corporate:brief --update <n>`. So
   `specify`'s post-write checklist and its A/B/C options table are not carried
   over; the markers are reported at the filing gate and answered, if ever, by an
   amendment.

**The ruling the brief deferred to me** (its third non-goal): yes, a falsifiable
definition of done is still captured at creation — spec-kit's mandatory sections
are always filled — but it is captured *by inference*, and a criterion the ask
does not settle carries a marker instead of blocking the record. The
orchestrator's "each one could actually fail" gate (`brief.md:204-205`) is
therefore deleted; the adjacent check that no criterion names a file, library or
pattern is **kept**, because that is the product-owner/architect boundary
(`product-owner.md:17-22`), not part of the interrogation, and it costs the user
nothing.

**Amending** (criterion 2) is the same shape: resolve the issue, take the change
text verbatim, dispatch once, receive the whole new brief, write it in the order
`issue-store.md` mandates. Two things change versus today. The pre-write
confirmation is dropped on `Draft` and `Blocked` — the superseded brief survives
as the previous numbered `brief` artifact (`issue-store.md:290-294`), so nothing
is lost and there is nothing to protect. On `Open` **both** confirmations stay,
naming that a run may be in flight and that filed artifacts answered the old
criteria (`brief.md:230-239`) — that is criterion 6, and it is preserved by not
touching it. `Closed` stays a refusal. A confirmation is not a clarifying
question, so criterion 3 and criterion 6 do not collide.

The agent gains one explicit obligation on the amend path: return the whole new
brief with every section the change does not touch preserved byte-for-byte. A
light amendment that silently reflows the rest of the brief is the exact failure
`issue-store.md:156-160` was written to prevent.

**Loop hints — settled here, in Phase A, not carried into the plan.** Criterion 1
names the four loop-hint answers as overhead to remove. What it forbids is
*asking the requester* for them; the section itself is consumed by
`commands/design-loop.md:36` and `agents/loop-engineer.md:47,59-62`, and
`reference/loop-design.md:206` requires a verdict row per hint. So the section
stays and is filled by inference, with `no single observation` and `nothing`
already legal values (`product-owner.md:114-117`) and a marker permitted on a
hint line. Consequence: `design-loop.md`, `loop-engineer.md` and
`loop-design.md` need no edit, and check 6 at `loop-design.md:206` holds
unchanged. This is why they are absent from every `files:` line below.

## Tools chosen

**Layer 1 — this repository. The answer came from here.** Everything this change
needs already exists: the role
(`plugins/corporate/agents/product-owner.md`), the command
(`plugins/corporate/commands/brief.md`), the store rules that make a lightly
filed record indistinguishable from any other (`reference/issue-store.md:91-96`
— the key is the GitHub issue number, so criterion 5 needs no work at all), the
numbered-artifact supersession that makes a cheap amendment safe
(`issue-store.md:276-294`), and the confirmation table that criterion 6 asks be
preserved (`brief.md:230-239`). The structural validator
(`scripts/validate.ts:1-247`) already enforces frontmatter legality on every file
this change touches, generically — it hardcodes no component names, so no task
has to register anything.

**Layer 2 — installed capability.** Searched and used for grounding only. The
session's playbook skills cover `github`. The `graft` MCP server is bound to
`scout` and was used through it for the reference sweep. No installed tool can
perform this change, because the change *is* the prompt text of two commands and
one agent. Nothing here is buildable out of an existing tool.

**Layer 3 — libraries.** Not reached. The change adds no code, so "add nothing"
wins uncontested; there is no candidate to price it against. Note that criterion
4's obligation was discharged by fetching upstream docs
(`github.com/github/spec-kit`), which adds no dependency of any kind — the
interaction shape is transcribed into prompt prose by this plan, so no
downstream role needs spec-kit knowledge.

**Layer 4 — runtime and platform.** Skipped. This is an existing repository: bun,
markdown components, GitHub Issues as the store. All decided
(`CLAUDE.md`, `reference/issue-store.md:8-10`).

**YAGNI pass.** Three things were cut before the plan: a `validate.ts` lint that
would fail the build on the retired vocabulary (a lint nobody asked for, and one
grep in an acceptance line does the same job); a shared `reference/intake.md`
defining the marker grammar (one agent and two commands is not enough consumers
to earn a fourth reference doc, and `issue-store.md:23-27` already warns against
scattering definitions); and a `--clarify` mode mirroring spec-kit's separate
command (that is what `--update` is, and criterion 7 forbids a second path).

## Stack readiness

| Stack | Verdict | Basis |
|---|---|---|
| claude-code-plugin | not-required | only the prose bodies of components that already ship change; no new component, no new frontmatter key, and `scripts/validate.ts:1-247` plus `docs/authoring.md` fix in-repo every structural fact a builder needs |
| github | covered | github-playbook |
| bun | not-required | the plan only invokes the repository's existing `validate` and `test` scripts (`package.json:7-10`); no runtime, bundler, dependency or test-framework decision turns on bun-specific fact |

## Verification

| Layer | Verdict | Why | Environment |
|---|---|---|---|
| unit | not-required | no executable code path changes; this repo's unit tests exercise exported functions of `scripts/validate.ts` (`test/validate-graft.test.ts:1-63`), and no task touches that file | — |
| integration | required | every edited file is a shipped plugin component the marketplace loader parses; `bun run validate` is the mechanical proof the manifests and all component frontmatter still load after the edits | bun on `PATH`, run from the repository root; no server, no network, no seeded database, no fixture |
| e2e | not-required | nothing crosses a process boundary, a network or a browser — the changed behaviour is prompt text executed by a human-in-the-loop session, which this repository ships no harness to drive | — |

## Scale

| Verdict | Reason |
|---|---|
| standard | Five separate surfaces — one agent, two commands, two docs and the manifest — that cannot be merged into one builder pass |

## Rejected

- **Delete `product-owner`; let `/corporate:brief` write the brief itself.** The
  strongest alternative: with no interrogation left, the role does little, and a
  dispatch costs a round trip. Lost because the dispatch is not the overhead the
  brief complains about, and removing it breaks things the brief protects — the
  activity line's `<who>` (`brief.md:259`), the store's definition of the body as
  "the product owner's text" (`issue-store.md:150,176`), `split.md:71`'s per-task
  dispatch, and the role table across `README.md:237` and
  `skills/corporate-pipeline/SKILL.md:87`. It also removes the boundary that
  keeps a criterion from naming a library (`product-owner.md:17-22`) by folding
  the author and the checker into one session.
- **Keep `blocked on answers` but cap it at one round.** Directly contradicts
  criterion 7 (retired, not kept as a parallel option) and criterion 3 (no
  clarifying question required to finish), and a cap of one is still a question
  before the record exists.
- **Carry spec-kit's post-write checklist and its A/B/C options table.** Real,
  and it is in `specify` itself — it validates against ten criteria, then
  presents unresolved clarifications as an options table. Rejected because it
  reintroduces the interrogation one step later: criterion 3 says no clarifying
  question may be *required* to finish. spec-kit itself puts that resolution in a
  separate command (`clarify`, `"expected to run before invoking the planning
  phase"`), and here that command already exists as `--update`.
- **Adopt spec-kit's filesystem artifact model** — a numbered spec directory,
  `spec.md` from a template, `.specify/feature.json`. Rejected: the store is
  GitHub Issues and the key is the issue number
  (`issue-store.md:91-96`); a second identity scheme would violate criterion 5,
  and `issue-store.md:611-617` forbids writing non-relocated artifacts into the
  consuming repository at all.
- **Drop `## Loop hints` from the brief shape.** Rejected in Phase A: it would
  force edits to `design-loop.md:36`, `loop-engineer.md:47,59-62` and
  `loop-design.md:206` for no gain, since criterion 1 objects to the *asking*,
  and inference costs the requester nothing.
- **Add a `validate.ts` rule failing the build on the retired vocabulary.**
  Rejected on YAGNI: it is a new mechanism to enforce a one-time deletion, and
  each task's acceptance line already greps for exactly that.
- **Add no dependency** — the recommended option, and it is what was chosen.
  Nothing is added; priced against every candidate above by being the only one
  that leaves the store, the key and the confirmations untouched.

## Risks

- **Prose divergence across four parallel builders.** T1–T4 run in one wave and
  must agree on vocabulary. Mitigated by this design fixing the exact tokens: the
  literal `[NEEDS CLARIFICATION: <question>]`, the cap of three, the deletion of
  `**Status:**` and `## Unanswered`, and the retention of the five brief
  headings. Anything a builder invents beyond that is drift the reviewer will
  see across the diff.
- **A record filed from one sentence can be promoted with markers outstanding.**
  That is the trade the brief accepts ("giving up the guarantee that everything
  filed already carries criteria that could fail"). The residual risk lands on
  `/corporate:run`, which will design against a marked criterion. Mitigated only
  by `brief.md` reporting every marker verbatim at the filing gate and naming
  `--update`; the `Draft` gate (`issue-store.md:442-445`) still means no
  unattended run starts without the user reading it.
- **`split.md` renumbering.** Deleting step 11 shifts the numbering of steps 12
  through the end of that list; a partial renumber leaves a command referring to
  a step that moved. Contained to one file and one task.
