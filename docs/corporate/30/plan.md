# Plan — #30

Four independent prose edits, one per surface, that move the filed brief out of the comment stream and into the body alone: the store reference stops defining a `brief` artifact at filing and redefines the numbered ones as superseded versions, `/corporate:brief` files two writes instead of three and inverts which text `--update` records, `/corporate:split` drops the same bullet from child creation, and the two reader-facing documents stop describing the old shape. No file is touched by two tasks, so all four run in one wave.

## T1 — Redefine the brief's place in the record
depends_on: none
files: plugins/corporate/reference/issue-store.md
acceptance: `bun run validate` exits 0; `grep -c 'filing and `--update`' plugins/corporate/reference/issue-store.md` is 0; `grep -c 'Filing posts' plugins/corporate/reference/issue-store.md` is 0
steps:
  - In the artifact kinds table (line 224), change the `brief` row's "Written by" cell from `` `/corporate:brief`, filing and `--update` `` to name `/corporate:brief --update` alone. Leave "Numbered: yes" and every other row untouched.
  - In the paragraph beginning "**The current artifact of a kind is the newest one.**" (lines 285-287), add one clause naming `brief` as the single exception and pointing at the paragraph below it. Do not weaken the rule for any other kind.
  - Replace the paragraph at lines 289-294 ("**The brief in the body is a copy of the newest `brief` artifact.** …"). The replacement states, in the file's own voice: the brief lives in the body and only in the body; filing posts no `brief` comment, because a comment repeating the opening post immediately beneath it is the first thing every reader of a fresh record sees and it buys nothing at filing time; `/corporate:brief --update` posts the text it is about to replace as the next numbered `brief` artifact and *then* rewrites the body, so no text is lost to an edit no diff would catch; the body is therefore the current brief and the numbered comments are the superseded versions, oldest first.
  - In that same replacement, add the two-sentence rule for records filed before this convention: they carry a `brief` artifact holding the same text as their body, nothing retrofits them, and on amendment, if the newest `brief` artifact already holds the outgoing text byte-identically, post nothing — it is already recorded — which also makes an ambiguous-write retry (the *Failure modes* row at line 585) idempotent.
  - In the *Never* list (lines 623-624), change "posts the replacement as the next `brief` artifact before it touches the body" to say it posts the text it *replaces*. Leave the rest of that entry and every other entry exactly as written.
  - Change nothing about the states, the transitions, the activity log, the size cap or the relocated kinds.

## T2 — File two writes, and record the outgoing brief on amendment
depends_on: none
files: plugins/corporate/commands/brief.md
acceptance: `bun run validate` exits 0; `grep -c 'artifact numbered 1' plugins/corporate/commands/brief.md` is 0
steps:
  - Rewrite filing-flow step 3 (lines 209-214) as two writes: the fields plus the ask verbatim as the brief, and the activity log's first line. Drop the "same text again as the `brief` artifact numbered 1" clause and the sentence defending it. Say instead, in one clause, that no `brief` comment is posted — the body *is* the brief, and a comment repeating it directly beneath the opening post is the first thing a reader sees — and that nothing is at risk because `--update` records the text it replaces before overwriting it. Keep "The number comes back from the store; nothing here derives a key."
  - In the `--update` preamble (lines 278-281), keep the point that the store forbids editing a filed brief everywhere except this command, and change the reason to the inverted ordering: the *outgoing* text is recorded as an artifact before the body's copy is overwritten. Correct the cross-reference from "step 5" to the step number the write actually has in the flow below (step 4).
  - Rewrite `### Flow` step 4 (lines 304-307) so the order reads: post the brief text that is about to be replaced as the next numbered `brief` artifact; then replace the body's copy with the new text, asserting per the store that everything above `<!-- corporate:end -->` came back byte-identical; then append the activity line, `<who>` = `orchestrator`, with the clause naming what changed. Keep the title-change sentence unchanged. Add one sentence deferring to the store for the case where the newest `brief` artifact already holds the outgoing text byte-identically — post nothing, and say so in the report.
  - In `### Flow` step 5 (lines 312-314), narrow "a stale artifact is superseded by a newer one of its kind, which is the only supersession this store has" to name `spec`, `design` and `plan`, since a `brief` is superseded by the body.
  - In `### What state allows it` (lines 287-289), leave the `Draft` and `Blocked` rows' meaning intact but make their "the superseded brief survives as the previous numbered artifact" clause true under the new ordering — the superseded brief is now posted *by this amendment*, not inherited from the previous one.
  - Touch no other mode. `--status`, `--init`, `--list`, `--promote`, `--unblock`, `--reopen` and spec mode are out of scope.

## T3 — Stop split children duplicating their own brief
depends_on: none
files: plugins/corporate/commands/split.md
acceptance: `bun run validate` exits 0; `grep -c 'the same brief filed again' plugins/corporate/commands/split.md` is 0; `grep -c 'three writes' plugins/corporate/commands/split.md` is 0
steps:
  - In step 12's child-creation bullets (lines 89-97), delete the bullet "the same brief filed again as `brief` artifact 1,". Keep the other three bullets — `Draft` with both labels, the marker block carrying `parent: #<n>` and every other field empty, the brief verbatim as the body, and the child's own first activity line — exactly as written.
  - Change "This is the same three writes `/corporate:brief`'s filing flow already makes" to name two writes, so the sentence stays a true cross-reference to the filing flow.
  - Change nothing else in the command: the dispatch step, the per-child ordering, the creation-failure stop and the `split` artifact step are all out of scope.

## T4 — Correct the two documents that describe the old shape
depends_on: none
files: README.md, plugins/corporate/skills/corporate-pipeline/SKILL.md
acceptance: `bun run validate` exits 0; `grep -c 'records the replacement' README.md` is 0; `grep -c 'body-mirrored' plugins/corporate/skills/corporate-pipeline/SKILL.md` is 0
steps:
  - In `README.md` lines 194-196, change "replaced only by `--update`, which records the replacement as an artifact before it touches the body" to say it records the text it *replaces*. Leave the surrounding sentences about relocated documents and `--init` untouched.
  - In `plugins/corporate/skills/corporate-pipeline/SKILL.md` line 22, replace the stage-0 filing row's Artifact cell (`` `brief`, numbered, body-mirrored ``) with a cell saying the brief is the issue body itself, with no comment copy. Keep the row's other cells and every other row in the table as they are.
  - Do not restate the amendment rule in either file — the store reference owns it; these two only describe it.

## Test suites

| Suite | Layer | Command | Setup |
|---|---|---|---|
| plugin structure | integration | `bun run validate` | — |

## Waves

| Wave | Tasks | Runs in parallel |
|---|---|---|
| 1 | T1, T2, T3, T4 | yes — four disjoint file scopes |
