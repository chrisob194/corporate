# Review — #25

**Verdict:** blocked
**Defect origin:** implementation

Every task's acceptance passes and the intake retirement is built as designed, but T2 collapsed the `Open` amendment's two confirmations into one — the exact safeguard the design said stays untouched — leaving the command's state table naming a "second" confirmation that its flow never has a first for.

## Acceptance

`bun run validate` → exit 0 (`OK — 0 warning(s).`) — shared by all five tasks, run once from the repository root.

| Task | Command | Result |
|---|---|---|
| T1 | `grep -c 'NEEDS CLARIFICATION' plugins/corporate/agents/product-owner.md` | `1` (≥1 required) — **pass** |
| T1 | `grep -c 'blocked on answers\|## Unanswered' plugins/corporate/agents/product-owner.md` | `0` — **pass** |
| T1 | `bun run validate` | exit 0 — **pass** |
| T2 | `grep -c 'blocked on answers' plugins/corporate/commands/brief.md` | `0` — **pass** |
| T2 | `grep -c 'NEEDS CLARIFICATION' plugins/corporate/commands/brief.md` | `4` (≥1 required) — **pass** |
| T3 | `grep -c 'blocked on answers' plugins/corporate/commands/split.md` | `0` — **pass** |
| T4 | `grep -c 'interviews you\|blocking question unanswered' README.md` | `0` — **pass** |
| T4 | `grep -c 'The ask cannot fail' plugins/corporate/skills/corporate-pipeline/SKILL.md` | `0` — **pass** |
| T5 | `grep -c '"version": "4.2.0"' plugins/corporate/.claude-plugin/plugin.json` | `0` (now `4.3.0`) — **pass** |

Declared suite (`## Test suites`, integration): `bun run validate` — pass. `bun test` also run for regression evidence though the design ruled unit `not-required`: `7 pass, 0 fail`.

Note on the acceptance design: every T1–T4 line is a `grep -c … is 0` for retired vocabulary plus `validate`. That set cannot detect the finding below — the retired token is gone, and what changed underneath it is not greppable. Not a plan defect (the design's own YAGNI pass argued for exactly this), but it is why the acceptance passing is not by itself evidence the stage is done.

## Design drift

**`Open` lost a confirmation.** Design, *Approach*: "On `Open` **both** confirmations stay, naming that a run may be in flight and that filed artifacts answered the old criteria (`brief.md:230-239`) — that is criterion 6, and it is preserved by not touching it." Before this change, `--update` step 5 read "Show the old and the new acceptance criteria side by side and confirm once — **twice on `Open`**, per the table". It now reads (`brief.md:256-257`):

```
5. On `Open` only: show the old and the new acceptance criteria side by side and
   confirm once — the second confirmation the table names.
```

`Draft`/`Blocked` correctly drop to zero confirmations, as designed. `Open` drops from two to one. Detailed as a correctness finding below.

Nothing else diverges: the literal token `[NEEDS CLARIFICATION: <question>]`, the cap of three, the deletion of `**Status:**` and `## Unanswered`, the five retained brief headings, and the store's three writes and their ordering are all exactly as the design fixes them. `design-loop.md`, `loop-engineer.md` and `loop-design.md` are untouched, per the Phase A loop-hints ruling. A repo-wide sweep for the retired vocabulary (`blocked on answers`, `## Unanswered`, `Status:** ready`, `interviews you`) finds hits only inside `docs/corporate/25/`, i.e. the design and plan quoting themselves.

## Plan drift

None. Changed files are exactly the union of the tasks' `files:` lines plus the orchestrator's `docs/corporate/25/*` artifact commit. `split.md`'s renumbering is complete and contiguous (steps 1–15 in the split flow, 1–5 in `--status`) with no surviving cross-reference to a moved step number — the risk the design flagged did not land.

## Correctness

- `plugins/corporate/commands/brief.md:235` and `:256-257`
- `origin:` **implementation**. The plan line contradicted is T2's "Leave the `Open` row (second confirmation, naming a possible in-flight run) and the `Closed` row (refuse) exactly as written", read against the design's "On `Open` **both** confirmations stay … preserved by not touching it". I considered `plan` origin, since T2 also says "Make the side-by-side confirmation step conditional: `Open` only, per the table" — but that instruction is satisfiable correctly: gating the pre-existing step body ("confirm once — twice on `Open`, per the table") on `Open` yields two confirmations on `Open` and none elsewhere, which is exactly the designed end state. The plan did not make the defect unavoidable, so it is not a plan defect.
- What is wrong: the flow now presents one confirmation on `Open` and labels it "the second confirmation the table names", while the table (`:235`) still promises "a **second** confirmation" — there is no first anywhere in the file (`grep -in confirm plugins/corporate/commands/brief.md` returns confirmations only in `--init`, `--promote`, the transition flow, the table row and this step).
- Concrete failure: a user runs `/corporate:brief --update 42 "also handle the empty case"` on issue #42 in state `Open` with `/corporate:run` in flight. The executing session reaches step 5, shows the criteria side by side, asks once, and on "yes" proceeds straight to step 6 — posting the new brief artifact and overwriting the body. The user gets one prompt where the design specifies two, and the session must resolve "the second confirmation" against a flow that has no first: it either under-asks (one prompt, the designed friction halved on the one state where a run may be mid-flight) or invents a first prompt the file never defines. Both are wrong results from the same two lines. Fix is one sentence in step 5 restoring the first confirmation before the `Open`-only second, which is why this routes back to T2 rather than upstream.

## Taste

Not blocking.

- `plugins/corporate/agents/product-owner.md:13` — "Your value comes from blocking work, not producing it — the one role whose success sometimes looks like nothing happening." Stale framing for a role that, after T1, cannot block anything. The operative instructions (`## Method` preamble, `## Never`'s "Ask the requester anything", the `## Output` shape with no status) unambiguously forbid blocking, so I could not construct a failure from it — but it is the one sentence in the file still describing the retired role.
- `plugins/corporate/commands/brief.md:246` — "printing it in full first is only required on `Open`, per the table" points at a table that says nothing about printing; it only names confirmations.
- `README.md:22-23` — the code span `` `/corporate:qa\n<issue>` `` is wrapped across the line break. It renders correctly (the newline collapses to a space); it just reads badly in source.
