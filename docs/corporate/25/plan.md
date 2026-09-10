# Plan — #25

Retires the interrogation in one wave of four disjoint prose edits plus a
manifest bump. `product-owner` becomes a non-blocking intake that fills the brief
by inference and marks at most three ambiguities inline with the literal token
`[NEEDS CLARIFICATION: <question>]`; `/corporate:brief` and `/corporate:split`
lose the `blocked on answers` loop and the falsifiability gate while keeping the
`Open` confirmations and every store write exactly as `issue-store.md` defines
them; the README and the pipeline skill are brought onto the new description of
stage 0. No store rule, no state, no artifact kind and no command flag changes.

## T1 — Rewrite `product-owner` as a non-blocking intake
depends_on: none
files: plugins/corporate/agents/product-owner.md
acceptance: `bun run validate` exits 0, and `grep -c 'NEEDS CLARIFICATION' plugins/corporate/agents/product-owner.md` is at least 1 while `grep -c 'blocked on answers\|## Unanswered' plugins/corporate/agents/product-owner.md` is 0
steps:
  - Keep the frontmatter keys `name`, `tools`, `model` and `effort` exactly as
    they are — `sonnet`/`high` is deliberate and not part of this change.
  - Rewrite the frontmatter `description` as a "Use when …" trigger for
    lightweight intake: turning a short free-form ask into a filed brief by
    inference. Remove the clause "refusing handoff while anything material is
    unanswered".
  - Leave the `## Role` section's two boundaries intact — never name a file,
    library, framework or pattern; the architect never questions whether the
    feature should exist.
  - In `## Inputs`, replace the sentence about answers from an earlier dispatch
    with the two modes this agent now has: a bare ask (create), or a current
    brief plus a change quoted verbatim (amend). On amend, return the whole new
    brief with every section the change does not touch preserved byte-for-byte.
  - Rewrite `## Method` so that nothing is ever asked back: read the ask as
    written; fill every section from the ask, the repository and `CLAUDE.md`
    using informed defaults; state the cost if it can be inferred and say
    plainly that it could not if it cannot, rather than blocking; write criteria
    in the requester's vocabulary; state non-goals; note a second ticket only
    when the ask plainly contains one; answer the four loop hints by inference,
    with `no single observation` and `nothing` as legal answers.
  - Add the marker rule: where a genuine fork exists — two reasonable readings
    implying different work — write `[NEEDS CLARIFICATION: <question>]` inline in
    the section it affects. Maximum three per brief; when more candidates exist,
    keep the three highest by scope, security or user-visible impact and take an
    informed default on the rest.
  - In `## Output`, delete the `**Status:** ready | blocked on answers` line and
    the `## Unanswered` section. Keep the headings `# Brief — <title>`,
    `## Problem`, `## Acceptance criteria`, `## Non-goals`, `## Second ticket`
    and `## Loop hints` unchanged — they are read downstream.
  - In `## Never`, delete "Hand off as `ready` with a blocking question
    outstanding"; add "Ask the requester anything — you run headless and the
    record is created from what you were given", "Emit more than three markers",
    and "Reflow, reorder or reword a section an amendment did not touch".

## T2 — Strip the interrogation out of `/corporate:brief`
depends_on: none
files: plugins/corporate/commands/brief.md
acceptance: `grep -c 'blocked on answers' plugins/corporate/commands/brief.md` is 0, `grep -c 'NEEDS CLARIFICATION' plugins/corporate/commands/brief.md` is at least 1, and `bun run validate` exits 0
steps:
  - In the `## Filing flow`, keep step 1 (empty ask → ask for it in the user's
    own words, and nothing else) and step 2 (labels missing → `--init`) as they
    are.
  - Add one sentence above the numbered list: the ask *is* the brief, and
    nothing is asked back except a missing ask.
  - In the dispatch step, add to the brief's contents that the agent returns a
    brief in every case and never a blocking status.
  - Delete the whole `blocked on answers` step (currently step 4) and renumber
    the rest of the list.
  - In the check step (currently 5), keep only "no criterion names a file,
    library or pattern"; delete "and that each one could actually fail" and the
    sentence beginning "If a criterion could not". Add: scan the returned brief
    for `[NEEDS CLARIFICATION:` and never re-dispatch on account of one.
  - Leave the filing step's three writes and their order untouched — fields,
    brief verbatim in the body, the same brief as `brief` artifact 1, then the
    first activity line.
  - Extend the report step: after the criteria, the non-goals and any second
    ticket, print every `[NEEDS CLARIFICATION:` marker verbatim, name
    `/corporate:brief --update <n>` as the way to answer one, and say that
    promoting with a marker outstanding is the user's call.
  - In `### What state allows it`, change the `Draft` and `Blocked` rows to
    "amend and report — no confirmation; the superseded brief survives as the
    previous numbered artifact". Leave the `Open` row (second confirmation,
    naming a possible in-flight run) and the `Closed` row (refuse) exactly as
    written.
  - In the `### Flow` of `--update`: keep the resolve step but stop requiring the
    current brief to be printed in full before acting on `Draft` or `Blocked` —
    it is still read and still passed to the agent. Keep the "ask for the change
    in the user's own words" step. In the dispatch step add the byte-for-byte
    preservation obligation and delete the sentence "Its `blocked on answers`
    loop is the filing flow's, unchanged." Apply the same check narrowing as in
    filing. Make the side-by-side confirmation step conditional: `Open` only,
    per the table.
  - Leave the write step's ordering — artifact first, then the body, then the
    activity line, with the byte-identical assertion below
    `<!-- corporate:end -->`, completely unchanged, and leave the stale-artifact
    report step unchanged apart from adding the markers to it.

## T3 — Bring `/corporate:split` onto the new intake contract
depends_on: none
files: plugins/corporate/commands/split.md
acceptance: `grep -c 'blocked on answers' plugins/corporate/commands/split.md` is 0 and `bun run validate` exits 0
steps:
  - In the per-task dispatch step (currently 10), keep every existing bullet.
    Add one: the agent returns a brief in every case, never a blocking status,
    and may carry up to three `[NEEDS CLARIFICATION: <question>]` markers.
  - Delete the entire `blocked on answers` step (currently 11).
  - In the read-back step (currently 12), keep "no criterion names a file,
    library or pattern" and the re-dispatch it justifies; delete "and each one
    could actually fail".
  - Renumber every subsequent step in that list, and check the file for any
    cross-reference to a step number that moved.
  - Where the child-creation step describes what is filed, add that a child's
    markers, if any, are reported with its number when the split reports.

## T4 — Update the README and the pipeline skill
depends_on: none
files: README.md, plugins/corporate/skills/corporate-pipeline/SKILL.md
acceptance: `grep -c 'interviews you\|blocking question unanswered' README.md` is 0, `grep -c 'The ask cannot fail' plugins/corporate/skills/corporate-pipeline/SKILL.md` is 0, and `bun run validate` exits 0
steps:
  - README, the opening pipeline paragraph: replace "the `product-owner` turns a
    vague ask into criteria that can fail" with the new shape — a sentence is
    enough, the product owner fills in the rest and marks what it could not
    settle.
  - README, the issue-store section: replace "It takes an ask, interviews you
    through the `product-owner`, files the result as an issue" with a phrasing
    that has no interview in it — the ask is handed to the `product-owner` and
    filed.
  - README, the flag list comment for `--update`: say it amends the description,
    and that on a `Draft` it just amends.
  - README, the roles table row for `product-owner`: keep "name a file, library
    or pattern" under *Notably cannot* and replace "or hand off with a blocking
    question unanswered" with "or ask you anything — it fills the gaps by
    inference and marks at most three it could not settle". Adjust the *Decides*
    cell to mention the markers.
  - Skill, the `## The ends of the chain` table row for `/corporate:brief`:
    replace "the ask is not yet falsifiable" with "any time — one sentence is
    enough".
  - Skill, the `## Choosing an entry point` table: replace the row reading "The
    ask cannot fail — no criteria, unclear scope" with "You have an ask, however
    rough", and reword the "The criteria were wrong or incomplete" row to name
    the record's description rather than its criteria.
  - Change nothing else in either file; in particular leave the rule forbidding
    the skill from dispatching `product-owner` exactly as it is.

## T5 — Bump the plugin version
depends_on: T1, T2, T3, T4
files: plugins/corporate/.claude-plugin/plugin.json
acceptance: `grep -c '"version": "4.2.0"' plugins/corporate/.claude-plugin/plugin.json` is 0 and `bun run validate` exits 0
steps:
  - Bump `version` from `4.2.0` to `4.3.0` — a behaviour change to shipped
    components, removing no component.
  - Leave `name`, `description`, `author`, `license` and `keywords` untouched;
    the description names the product owner and the role still exists.
  - Run `bun run validate` from the repository root and confirm it exits 0 over
    the whole tree, not just this file.

## Test suites

| Suite | Layer | Command | Setup |
|---|---|---|---|
| structure | integration | `bun run validate` | — |

## Waves

| Wave | Tasks | Runs in parallel |
|---|---|---|
| 1 | T1, T2, T3, T4 | yes — four disjoint file sets |
| 2 | T5 | — |

Sources: [spec-kit `specify` command template](https://github.com/github/spec-kit/blob/main/templates/commands/specify.md), [spec-kit `clarify` command template](https://github.com/github/spec-kit/blob/main/templates/commands/clarify.md), [spec-kit spec template](https://github.com/github/spec-kit/blob/main/templates/spec-template.md)
