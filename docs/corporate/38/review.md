# Review — #38

**Verdict:** pass with findings
**Defect origin:** none

Everything the design specified got built, each task stayed exactly inside its declared file scope, all six acceptance sets and both declared suites pass — the two findings are documentation inconsistencies that fail loudly or resolve to the same end state, neither severe enough to block.

## Acceptance

**T1 — Define the grant and add its plan field** — pass (5 of 5)
- `bun run validate` → exit 0
- `test -f plugins/corporate/reference/tool-grants.md` → exit 0
- `grep -q 'external_tools' plugins/corporate/reference/plan-format.md` → exit 0
- `grep -c 'external_tools' .../tool-grants.md` → `5` (≥ 4 required)
- `grep -q 'use:' … && grep -q 'fallback:' …` → exit 0

**T2 — Move scout off its standing graft grant** — pass (6 of 6)
- `bun run validate` → exit 0
- `grep -q '^disallowedTools:' scout.md` → exit 0
- `grep -q '^tools:' scout.md` → exit 1 (non-zero required)
- `grep -q 'mcp__' scout.md` → exit 1; `grep -q 'graft'` → exit 1; `grep -q 'ToolSearch'` → exit 1

**T3 — Enforce the grant rules in the validator** — pass (5 of 5)
- `bun test` → exit 0, `13 pass / 0 fail`, 2 files
- `bun run validate` → exit 0
- `grep -c findUnknownMcpToolServers scripts/validate.ts` → `0`; same in `test/validate-graft.test.ts` → `0`
- `bun test test/validate-agent-tools.test.ts` → exit 0

**T4 — Carry the grant through the commands** — pass (5 of 5)
- `bun run validate` → exit 0 (resolves the new `${CLAUDE_PLUGIN_ROOT}/reference/tool-grants.md` paths the commands name)
- `grep` for `external_tools` in `build.md`, `tool-grants.md` in `design.md`, `nine checks` in `run.md`, `external_tools` in `split.md` → all exit 0

**T5 — Make the architect the role that decides a grant** — pass (3 of 3)
- `bun run validate` → exit 0; `grep -q 'tool-grants.md'` and `grep -q 'external_tools'` in `technical-architect.md` → exit 0

**T6 — Rewrite the convention, register the ninth reference doc** — pass (7 of 7)
- `bun run validate` → exit 0
- `"version": "5.4.0"` present; `tool-grants` in both `CLAUDE.md` and `README.md`; `disallowedTools` in `docs/authoring.md`; `nine reference docs` in `CLAUDE.md`
- The two negative checks (`granted to \`scout\` only` in README, `name each one explicitly rather than granting the server` in authoring) → both exit 1, as required

Declared suites re-run independently: `bun test` exit 0 (13 pass, 0 fail), `bun run validate` exit 0.

## Design drift

None.

Spot-checked the design's specific claims against the tree:
- `scout.md:4` carries exactly the pinned `disallowedTools` value from design §1, with no `tools:` line — `Read`/`Grep`/`Glob`/`ToolSearch` implicitly kept, `Agent` denied explicitly. FR1, FR3, FR5 hold: the pool names no server, and with no grant in the brief the method (`scout.md:38`) falls back to `Grep`/`Glob` with nothing left over.
- R1/R2/R3 are implemented as designed. I probed the exports directly: `findServerBoundMcpGrants` flags a full tool name, a bare `mcp__graft`, and normalises `mcp__graft__*` to `mcp__graft`; `findToolDeclarationGaps` flags a null `tools:` with no denylist, a denylist omitting `Agent`, and a partial `SIDE_EFFECT_TOOLS` set; the exact scout line returns `[]`. `findToolDeclarationGaps` is called for every agent, including ones declaring `tools:`, as the plan required (`scripts/validate.ts:196-198`). All seven plan-named test cases are present, plus a wildcard case.
- `tool-grants.md:69-72` makes `use:` and `fallback:` mandatory companions to a non-`none` grant and names the defect rule; `tool-grants.md:51-56` states "absent means `none`" and `plan-format.md:55-57` says the same without restating the grammar. FR4 holds at the grammar level and is enforced at three reading stages.
- `technical-architect.md:137-144` carries the per-task obligation (FR6) and `:206-209` the two `## Never` lines; no fourth ruling table was added — the three tables in `## Output` are unchanged.
- `design.md`'s validation list really does hold nine items now, with the grant check as the ninth.
- `findUnknownMcpToolServers` and its now-dead locals (`pluginName`, `knownServers`) are fully removed; no dangling references remain, and `findGraftServersMissingTelemetryOff` plus its four tests are untouched.
- No other role was touched: `builder`, `reviewer`, `qa-engineer`, `devops-engineer`, `deployer`, `tester`, `product-owner`, `hr-manager` all keep their `tools:` allowlists and carry no `disallowedTools`. `scout` is the only holder of the generic pool, matching what `docs/authoring.md` and `tool-grants.md:77` claim.
- No stale text survives anywhere: no file outside `docs/corporate/` still says "eight reference docs", "eight checks", "granted to `scout` only", or refers to `graft_*` as a role-held tool.

## Plan drift

None. Every commit's file list matches its task's `files:` line exactly (T1: `plan-format.md` + `tool-grants.md`; T2: `scout.md`; T3: `validate.ts` + two test files; T4: the four command files; T5: `technical-architect.md`; T6: `CLAUDE.md`, `README.md`, `docs/authoring.md`, `plugin.json`). No file outside the six lists is touched; `docs/corporate/38/` is the orchestrator's own artifact commits.

## Correctness

**1. `docs/authoring.md:34` — the documented frontmatter example fails the rule documented 16 lines below it.** Non-blocking.

The example now reads:

```
tools: Read, Grep, Glob, Bash   # omit to inherit every tool available to
                                # subagents, including every MCP tool in the
                                # session
disallowedTools: Agent         # required when tools: is omitted
```

`disallowedTools: Agent` names one member of `SIDE_EFFECT_TOOLS` and none of the other ten, which is precisely R3's failure mode — and R3 is stated as prose at `docs/authoring.md:53-62` of the same file. Concrete failure: an author copies the reference example into a new agent file (with or without the `tools:` line) and runs `bun run validate`; the exported function run against that exact input returns

```
'disallowedTools' names Agent but not Bash, PowerShell, Write, Edit, NotebookEdit,
Artifact, EnterWorktree, ExitWorktree, SendMessage, TaskStop — a half-complete denylist
```

so the repo's only frontmatter reference ships an example that its own validator rejects. It fails loudly rather than silently, which is why this is not blocking; the fix is either the full eleven-name list in the example or an explicit "abbreviated — see the rule below" note. Had this been blocking, the origin would be `implementation`: plan T6 said only "show `disallowedTools` beside `tools`" and left the value to the builder, which chose one R3 forbids.

**2. `plugins/corporate/reference/tool-grants.md:95` vs `plugins/corporate/commands/run.md:218-225` — two different routings for the same defect in the unattended path.** Non-blocking.

`tool-grants.md`'s stage table says `/corporate:run` "routes a malformed grant as a review cycle with origin `plan`". What `run.md` actually specifies is that a malformed grant is caught by plan validation ("the nine checks `/corporate:design` lists", which now includes the grant check) and routed as *re-dispatched once, then Blocked* — a different mechanism with a different cap. Concrete failure: an unattended `/corporate:run` validating check nine follows `plan-format.md:110-112` to `tool-grants.md`, reads the table, and has two incompatible instructions for the same input — consume a review cycle (capped at 3, or 2 on the `small` lane) or consume the single plan re-dispatch. Both terminate at `Blocked` and both re-dispatch the architect, which is why this is not severe, but it is a genuine ambiguity in the path that asks nobody. Note the sentence originates in the design (`design.md:48`, "a hard stop in `/corporate:build`, and a review cycle with origin `plan` in `/corporate:run`") and plan T1 step 18 transcribed it verbatim — T1 did what it was told, so this is not an implementation slip.

**3. `scripts/validate.ts:38-41`, `:118` — R1/R3 are blind to YAML list-form and specifier-form entries.** Non-blocking, and pre-existing.

`field()` matches `^<key>:\s*(.+)$`, so a `tools:` written as a YAML block list returns `null`. An agent file with

```
tools:
  - Read
  - mcp__plugin_corporate_graft__graft_find_code
disallowedTools: Agent, Bash, PowerShell, Write, Edit, NotebookEdit, Artifact, EnterWorktree, ExitWorktree, SendMessage, TaskStop
```

passes `bun run validate` clean: R1 never sees the MCP name (the line parsed as absent), and R2 is satisfied by the denylist — reinstating exactly the standing server-bound grant R1 exists to forbid. Relatedly, `disallowed.split(",")` means a specifier entry such as `Bash(rm -rf *)` is not recognised as naming `Bash`; that input produces a false "names … but not Bash" error. Neither form appears in any file in this repo, and the deleted `findUnknownMcpToolServers` had the identical blind spot, so this change introduces no regression — but the design leans on R1 as the mechanical guarantee that the standing grant cannot return, and the guarantee is one frontmatter style away from not holding.

## Taste

Not blocking, no action expected:

- `plan-format.md` places `external_tools: none` after `acceptance:` in the example task block, while the `## Field rules` list places the bullet between `files` and `acceptance`. Harmless (order is not parsed), mildly inconsistent.
- `build.md:78-80` adds "the task's `external_tools:` line, verbatim" to the brief contents, eleven lines after `:67` already says "the task block verbatim" — redundant by construction, and the plan asked for it deliberately, so this is emphasis rather than duplication.
- `build.md:52-55` appends the new refusal to the existing inline sentence rather than as its own bullet (the plan called it "one bullet"); the surrounding text is a prose list, so the builder's reading is defensible.

One note on reviewer coverage: this repository's `typescript-playbook` and `bun-test-playbook` skills, which the design's stack-readiness table rules `covered`, were not present in this dispatch's skill listing (the same tooling gap the architect already filed an HR record for on this issue). It bit nothing here — the TypeScript under review is plain string logic and both suite commands were handed to the reviewer directly — so no duplicate record was filed and nothing was guessed.
