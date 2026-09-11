# Design — #30

## Problem

A freshly-filed corporate record shows its brief twice, back to back. `/corporate:brief`'s filing flow writes three things (`plugins/corporate/commands/brief.md:209-214`): the marker block plus the ask verbatim as the issue body, *the same text again* as `brief` artifact 1, and the first activity line. GitHub renders the body, then the artifact comment directly beneath it — the same block of text twice, before anything has happened to the record. `/corporate:split` files every child the same way (`plugins/corporate/commands/split.md:92-96`, "the same three writes `/corporate:brief`'s filing flow already makes"), so the duplication is on children too.

The comment is not bookkeeping noise; it was put there deliberately. `brief.md:212-214` and `plugins/corporate/reference/issue-store.md:289-294` state the reason: the body's copy may be replaced by `--update`, and the numbered artifact is what makes that replacement safe — "no text is ever lost to an edit no diff would catch" (`brief.md:278-281`). Filing posts `brief 1` so that the originally filed wording survives the first amendment.

The spec settles the trade: readability on first open beats recoverability of the opening post's original wording (requirement 2, and the fourth non-goal). What it does **not** license is losing text on an amendment silently, and requirement 3 forbids trading a duplication at filing for one on amendment.

Out of scope: what is stored or which events are recorded (the artifact *kinds*, the states, the activity log are untouched); retrofitting records already filed; the amendment flow beyond the one write whose ordering causes this.

## Approach

Layer 1 answers it, and the answer is one convention change in the store, applied at the three places that implement it.

**Filing posts no `brief` artifact.** The body *is* the brief. `/corporate:brief`'s filing flow drops from three writes to two — fields-plus-brief body, then the first activity line (`brief.md:209-214`). `/corporate:split` drops the identical bullet from its child creation (`split.md:92-96`). A fresh record now reads: opening post, then the filing log line. Requirement 1 holds by construction, for briefs filed directly and for split children alike.

**`--update` records the text it is replacing, not the text replacing it.** Today step 4 posts the *new* brief as the next numbered artifact and then copies it into the body (`brief.md:304-307`), which is exactly why the pair is redundant — the artifact and the body always hold the same text. Inverted, the write becomes: post the current brief text (the one about to be overwritten) as the next numbered `brief` artifact; *then* replace the body's copy with the new text, asserting per the store that everything above `<!-- corporate:end -->` came back byte-identical; then append the activity line. The ordering rationale survives word for word — the outgoing text is recorded *before* it is overwritten, so nothing is lost to an edit no diff would catch — and the body now never duplicates any comment, at any point in a record's life. Requirements 3 and 5 hold for the same structural reason requirement 1 does: there is exactly one copy of any given wording in the record.

The store's model shifts by one sentence, and lands closer to what `issue-store.md:292-293` already says it is: **the body is the current brief; the numbered `brief` comments are the amendment history, oldest superseded version first.** Today that sentence is slightly untrue, because the history redundantly includes the current version. `brief` becomes the one kind for which "the current artifact is the newest one" (`issue-store.md:285-287`) does not hold — for `brief`, current means the body — and that exception gets written down where the general rule is stated.

**One conditional, for records filed under the old convention** (requirement 4, which forbids retrofitting): on amendment, if the newest `brief` artifact already holds the outgoing text byte-identically, post nothing — it is already recorded. This is not decoration. It keeps the fix from creating a second copy of a legacy record's brief, and it makes the amend write idempotent, which the store's own failure table needs: "a write times out, or fails ambiguously after the request may have landed … re-read the record … retry **only if absent**" (`issue-store.md:585`). With the skip rule, the re-read the store already mandates has an unambiguous answer.

Sweep result, so the file scope is not a guess: nothing in the pipeline reads a `brief` artifact. `--spec` mode takes the issue body as its whole input (`brief.md:232`), and `run`, `design`, `build`, `test`, `review`, `qa` and `split` mention "brief" only as a dispatch brief. The five files below are the complete surface: the store reference that defines the convention, the two commands that file records, and the two documents that describe the convention to a reader (`README.md:194-196`, `plugins/corporate/skills/corporate-pipeline/SKILL.md:22`).

Two incidental corrections ride along, both inside sentences a task rewrites anyway and both wrong-in-place if left: `brief.md:278-281` cites "the ordering in step 5" when the write is step 4 of that flow (`brief.md:304`), and `brief.md:312-314`'s "a stale artifact is superseded by a newer one of its kind, which is the only supersession this store has" stops being true of `brief`, whose current version is the body — it gets narrowed to `spec`, `design` and `plan`.

## Tools chosen

- **Repo (the answer came from here).** The duplication is produced by two prose instructions — `brief.md:209-214` and `split.md:92-96` — and defined by one reference doc, `issue-store.md:289-294`, which `CLAUDE.md` names as "the only definition of the store". The fix is an edit to that definition plus the three sites that restate it in their own terms. No new mechanism, no new component.
- **Installed capability.** Checked and not used. The session's MCP servers (angular-cli, claude-in-chrome, the document connectors, suite, tree-of-knowledge) and the playbook skills bear on no part of this; `gh` is already the store's entire toolchain (`issue-store.md:30-32`) and this change removes one `gh issue comment` call rather than needing a new capability. No `graft` server is available for this repo, so the sweep above was Grep over five files, which is the defined fallback.
- **Libraries.** Skipped, and priced anyway: the change is Markdown prose in files that already ship. "Add nothing" wins by default because there is nothing a dependency could do here — no parsing, no runtime, no new code path.
- **Runtime and platform.** Skipped. Existing repo; the runtime is bun, the store is GitHub Issues, and both are decided (`CLAUDE.md`, `issue-store.md:8-10`).

## Stack readiness

| Stack | Verdict | Basis |
|---|---|---|
| claude-code-plugin | not-required | only the prose bodies of components that already ship change — no new component, no frontmatter key, no manifest edit; `scripts/validate.ts:1-247` and `docs/authoring.md` fix in-repo every structural fact a builder needs |
| github | covered | github-playbook |
| bun | not-required | the plan only invokes the repository's existing `validate` script (`package.json:7-10`); no runtime, bundler, dependency or test-framework decision turns on bun-specific fact |

## Verification

| Layer | Verdict | Why | Environment |
|---|---|---|---|
| unit | not-required | no executable code path changes; this repo's unit tests exercise exported functions of `scripts/validate.ts` (`test/validate-graft.test.ts:1-63`), and no task touches that file | — |
| integration | required | every edited plugin file is a shipped component the marketplace loader parses; `bun run validate` is the mechanical proof the manifests and all component frontmatter still load after the edits | bun on `PATH`, run from the repository root; no server, no network, no seeded database, no fixture |
| e2e | not-required | nothing crosses a process boundary, a network or a browser — the changed behaviour is prompt text a human-in-the-loop session executes against a live tracker, which this repository ships no harness to drive | — |

## Scale

| Verdict | Reason |
|---|---|
| standard | Five surfaces — the store reference, two commands and two docs — implementing one convention change, which no single builder pass can hold without becoming two |

## Rejected

- **Drop the filing comment, leave `--update` posting the new text.** Cheapest edit, and it satisfies requirements 1 and 3 as literally written. It loses the originally filed wording permanently at the first amendment, and it makes `brief.md:278-281`'s stated guarantee — no text lost to an edit no diff would catch — false at exactly the moment it is supposed to hold. Inverting the write costs the same edit and keeps the guarantee, so there is nothing to buy here.
- **Keep both writes; collapse the filing comment to a three-line pointer note.** This is what `spec`, `design`, `plan` and `review` do (`issue-store.md:302-340`), so it is the tempting symmetry. It makes `brief` a relocated kind, which means a file in the repository at filing time, which means a worktree at filing time — and the worktree is deliberately created later, when `spec.md` is first written (`brief.md:13-16`). It also solves nothing: a note that says "the brief is above" is a comment that exists to point at the thing directly above it.
- **Relocate the brief to `docs/corporate/<n>/brief.md`.** Same worktree-at-filing objection, plus the body must keep the brief verbatim for the reader who never clones the repository — "a `Draft` can be promoted from a phone" (`issue-store.md:12-16`) is the store's stated reason for being a tracker at all.
- **Wrap the filing comment in a collapsed `<details>` block.** Hides the repetition rather than removing it — a reader still sees a second copy on one click, and requirement 1 is about what the record holds, not what is folded. It also puts presentation markup inside an artifact whose body is specified as the text exactly as the role returned it (`issue-store.md:250-252`).
- **Do nothing.** The repetition is the first thing a reader sees on every record this pipeline files and on every child a split creates. The single write it protects is preserved at zero cost by recording the outgoing text instead of the incoming one, so the readability is free.

## Risks

- Records filed before this ships keep their `brief 1` comment duplicating their body. Accepted by requirement 4; the skip rule stops an amendment from adding a *second* copy, but the original pair stays. Nobody is going to mistake it for a new defect only if the store reference says plainly that records predate the convention — which is why that sentence is in T1's scope rather than left implicit.
- The numbered `brief` sequence changes meaning: `brief 1` is now the *first superseded* text, not the filed one, and a post-fix record that has never been amended has no `brief` artifact at all. The sweep found no command that reads one, so the exposure is to a human reading a record and to any future stage that assumes the kind is always present.
- `--update` is two writes and they are not atomic. If the body edit fails after the artifact posts, the record momentarily holds a superseded copy identical to its body — a transient instance of the shape this issue is about. The store's ambiguous-write rule (`issue-store.md:585`) plus the byte-identical skip rule make the retry converge instead of double-posting.
