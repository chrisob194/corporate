# Review — #30

**Verdict:** pass
**Defect origin:** none

All four tasks were built exactly to their plan blocks with no file touched outside its declared scope, every acceptance clause passes when I run it, and the five documents now describe one convention consistently with no reader of a `brief` artifact left anywhere in the pipeline.

## Acceptance

**Suite (`## Test suites`, integration):** `bun run validate` → `OK — 0 warning(s).`, exit 0. Also ran `bun test` unprompted as a regression sanity check: `7 pass, 0 fail`.

| Task | Acceptance clause | Result |
|---|---|---|
| T1 | `bun run validate` exits 0 | pass (exit 0) |
| T1 | `grep -c 'filing and \`--update\`' plugins/corporate/reference/issue-store.md` is 0 | pass (0) |
| T1 | `grep -c 'Filing posts' plugins/corporate/reference/issue-store.md` is 0 | pass (0) |
| T2 | `bun run validate` exits 0 | pass (exit 0) |
| T2 | `grep -c 'artifact numbered 1' plugins/corporate/commands/brief.md` is 0 | pass (0) |
| T3 | `grep -c 'the same brief filed again' plugins/corporate/commands/split.md` is 0 | pass (0) |
| T3 | `grep -c 'three writes' plugins/corporate/commands/split.md` is 0 | pass (0) |
| T4 | `grep -c 'records the replacement' README.md` is 0 | pass (0) |
| T4 | `grep -c 'body-mirrored' plugins/corporate/skills/corporate-pipeline/SKILL.md` is 0 | pass (0) |

## Design drift

None. The design's central claim — that nothing in the pipeline reads a `brief` artifact, so five files are the complete surface — I re-verified rather than accepted: `grep -rn '`brief`' --include='*.md' plugins/ README.md` returns hits only in `issue-store.md`, `brief.md`, `split.md`, `README.md` and `corporate-pipeline/SKILL.md`, and every hit in `run.md`, `design.md`, `build.md`, `test.md`, `review.md`, `qa.md` is either the command name or the word "dispatch brief". `issue-store.md:440`'s `| — | Draft | brief | an issue is filed |` is the *Who* column naming the command, not an artifact write, so it is correctly left alone. `CLAUDE.md` and `docs/authoring.md` carry no description of the filing writes, so the five-file scope was not an undercount.

## Plan drift

None. Each of the four build commits touches exactly its task's `files:` list and nothing else (`f2a8233` → `issue-store.md`; `314fb33` → `brief.md`; `8364179` → `split.md`; `dbe10fb` → `README.md` + `SKILL.md`). The only other commits on the branch are `docs/corporate/30/` artifacts, which are the orchestrator's own. Working tree is clean.

Both incidental corrections the design authorised are present and correct: `brief.md:280` now cites "step 4", which is the step number the write actually holds in `### Flow` (confirmed against the pre-change file — the write was already step 4 and "step 5" was wrong); and `brief.md:317-318` narrows the supersession rule to `spec`, `design` and `plan`.

## Correctness

No blocking findings. Each functional requirement, checked against the built prose rather than the build report:

- **Req 1** holds by construction. `brief.md:209-215` files in two writes — body, then the activity line — and the activity log is itself a comment (`issue-store.md:417-426`), so the entry immediately below a fresh record's opening post is the filing log line, not a copy of the brief. `split.md:89-94` drops the identical bullet, so split children are covered too, and its "the same two writes" is now a true cross-reference: child creation is one `gh issue create` plus one log comment.
- **Req 3 and 5** hold. `brief.md:305-310` posts the *outgoing* text as the next numbered artifact and only then overwrites the body, so at no point does a comment hold the same text as the body above it. Walking two successive amendments (A→B→C) gives body=C, `brief 1`=A, `brief 2`=B — three distinct texts, no adjacent pair repeating. The legacy path is the one that could have created a second copy, and the byte-identical skip rule (`issue-store.md:297-301`) closes it: amending a pre-fix record whose `brief 1` already equals its body posts nothing, so the amendment adds no new duplicate.
- **Req 2** holds. Nothing in the new text asserts the opening post's original wording must remain recoverable. `brief.md:280-282`'s surviving guarantee — "no text is ever lost to an edit no diff would catch" — is now a statement about the outgoing text being recorded first, and it is true under the new ordering rather than a claim the design dropped.
- **Req 4** holds. `issue-store.md:297-298` states pre-fix records keep their duplicating `brief 1` and that nothing retrofits them; no task changes any read path.

Consistency across the five files is genuine, not just textual: the store reference defines the convention (`issue-store.md:283-302`), `brief.md` and `split.md` implement it, and `README.md:194-196` and `SKILL.md:22` describe it without restating the amendment rule — which is what T4's third step asked for. The `brief` exception is now declared where the general rule lives (`issue-store.md:283-284`), so a reader of "the current artifact of a kind is the newest one" is pointed at the exception in the same breath.

## Taste

Not blocking, none of these change the verdict.

- `plugins/corporate/commands/brief.md:311-312` — the skip condition sits at the *end* of step 4, after the title-change sentence, while the write it modifies is the step's first clause. The step opens "Write, **in this order**", so an executor reading clause-by-clause could post the artifact before reaching the condition that says not to. Could not construct a deterministic failure (the step is read whole before acting, and `issue-store.md:585`'s re-read-then-retry rule plus the skip rule make a double-post converge anyway), so this is readability, not a defect. Hoisting the condition ahead of the write clause would make step 4 executable strictly top-to-bottom.
- `plugins/corporate/commands/brief.md:299-300` — step 1 instructs reading the current title and brief, but evaluating the skip rule at step 4 also needs the newest `brief` artifact, which means reading the comment stream. "Per the store" carries it (`issue-store.md:267-271` defines that read), but it is implied rather than stated.
- `plugins/corporate/reference/issue-store.md:300-301` — "the *Failure modes* row below" is singular about a section holding ten rows; the plan's own wording named the specific row.
- The skip rule compares the outgoing text to the newest `brief` artifact, never to the *incoming* text. A degenerate no-op amendment (user re-submits byte-identical text) on a post-fix record would post `brief 1` equal to the new body. The filing log line sits between them so it is not the back-to-back shape req 3 forbids, and it takes deliberate user action to reach — worth knowing, not worth a change.
- `plugins/corporate/.claude-plugin/plugin.json` is unbumped at `5.0.0`. No task asked for a bump, and the history shows bumps land as standalone commits outside the pipeline (`efa3dc3`, `ca2e07c`), so this is not drift — just the thing to do before the PR is merged, per `CLAUDE.md`'s version convention.
