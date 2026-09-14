# Review — #42 (cycle 3, post-library-redo)

**Verdict:** pass with findings
**Defect origin:** none

Every acceptance check passes on my own run, the candidate-selection machinery requirement 2 forbids is gone rather than softened, and I independently re-executed thirteen of the design's nineteen library facts against `@cantoo/pdf-lib@2.11.0` — all of them reproduced — leaving three non-blocking findings, the largest of which is a dropped format fact the plan named.

## Acceptance

T1 is the only task. All fourteen acceptance clauses run from `/home/christian/Projects/corporate/.claude/worktrees/corporate+42+work`.

| # | Check | Result |
|---|---|---|
| 1 | `bun run validate` | `OK — 0 warning(s).` `exit=0`, no error naming `pdf-playbook` — **pass** |
| 2 | `grep -n '^## ' …/SKILL.md` | `8:## Stack`, `68:## Toolchain`, `100:## Obligations by activity`, `110:## Traps`, `172:## Resources` — exactly five, in order — **pass** |
| 3 | domain sweep `grep -oE '\b[a-z0-9][a-z0-9.-]*\.(org\|com\|io\|dev\|net)\b' … \| sort -u` | exactly `pdf-lib.js.org`, `pdfa.org` — **pass** |
| 4 | `grep -c '@cantoo/pdf-lib'` ≥ 3 | `5` — **pass** |
| 5 | `grep -c '@cantoo/fontkit'` ≥ 1 | `3` — **pass** |
| 6 | `grep -ci puppeteer` ≥ 1 | `1` — **pass** |
| 7 | `grep -c 'bun add @cantoo/pdf-lib'` ≥ 1 | `1` — **pass** |
| 8 | `grep -cE '\bnpm\b\|\bnpx\b\|\byarn\b\|\bpnpm\b'` non-zero, every hit inside the ban sentence | `1`, at `SKILL.md:92` — verified by eye, it is the ban sentence — **pass** |
| 9 | `## Stack` slice contains `paginat`, `registerFontkit`, `await` | `1`, `2`, `4` — **pass** |
| 10 | `## Traps` slice contains `outside the page box`, `encodeText`, `notdef`, `595.28`, `wordBreaks`, `latestRelease` | `1`, `2`, `1`, `1`, `1`, `1` — **pass** |
| 11 | `grep -c '14.11.2' …/references/docs-map.md` == 1 | `1` — **pass** |
| 12 | `grep -c 'pdf-lib.js.org' …/docs-map.md` ≥ 1 | `2` — **pass** |
| 13 | `grep -ci 'cantoo-scribe' …/docs-map.md` ≥ 1 | `1` — **pass** |
| 14 | `awk 'END{print NR}' …/SKILL.md` in 140–190 | `184` — **pass** |

Beyond the stated acceptance: zero code fences in `SKILL.md` (the ~15-line block rule cannot be violated); `git status` clean; `package.json`/`bun.lock` carry no `pdf-lib` or `fontkit` entry, so plan step 13's "do not install anything" held.

### The library facts, re-executed rather than taken on report

Installed `@cantoo/pdf-lib@2.11.0` and `@cantoo/fontkit@2.0.12` in a scratch directory outside the repository and ran the claims the file makes:

| Claim in the file | What was measured |
|---|---|
| MIT, currently 2.11.0 (L1) | `bun info @cantoo/pdf-lib` → `@cantoo/pdf-lib@2.11.0 \| MIT \| deps: 4 \| versions: 121` |
| unscoped `pdf-lib` `time.modified` 2022-05-12, repo pushed July 2024 (L2) | `2022-05-12T18:02:10.238Z`; `Hopding/pdf-lib` `pushedAt: 2024-07-17T12:18:51Z` |
| `latestRelease` is `null` on the fork (L3) | `gh repo view cantoo-scribe/pdf-lib --json …` → `"latestRelease":null`, `"isFork":true`, `pushedAt 2026-09-11` |
| roughly 50 MB of `node_modules` (L4/L19) | `du -sh node_modules` → `50M` for the two packages |
| `PageSizes.A4 = [595.28, 841.89]`, `Letter = [612, 792]`, `Legal = [612, 1008]`; `addPage()` defaults to A4 (L6, L7) | exact match; `getSize()` → `{595.28, 841.89}` |
| standard font silently substitutes `?` and lies about the width (L9) | `encodeText('日本語')` → `<3F3F3F>`; `widthOfTextAtSize('日本語',24)` → `40.032…`; no throw |
| `defaultWordBreaks` is `[' ']` (L14) | `[" "]` |
| default `save()` has no `trailer`, no `xref`, no `/ID`; `%PDF-` at byte 0, `%%EOF` at the tail; `useObjectStreams:false` restores both (L15) | header `%PDF-1.7\n`, `trailerKW false`, `xrefKW false`, `/XRef true`, `/ID false`, `%%EOF` at tail; classic save → `trailerKW true`, `xrefKW true` |
| pinned `setCreationDate`/`setModificationDate` give byte-identical output; `Producer` carries the upstream repository URL (L16) | two runs 1.2 s apart byte-identical; `Producer` decodes to `pdf-lib (https://github.com/Hopding/…` — a URL the file correctly describes and never quotes |
| `load()` on a broken/truncated file succeeds; only a missing header throws (L17) | truncated load succeeded; `load('not a pdf at all')` → `MissingPDFHeaderError` |
| custom font without fontkit throws (L10) | `FontkitNotRegisteredError` |
| `extractContents()` text assets expose `getText()`, `x`, `y`, `fontSize`, `fontFamily` (L18) | `{kind:"text", x:72, y:700, fontSize:24, fontFamily:"Helvetica", text:"hello world\n"}` |

No claim in `SKILL.md` traces to a fact outside F1–F18 / L1–L19, and none of the sampled facts is wrong.

## Design drift

None.

- Ruling 1: `## Stack` names `@cantoo/pdf-lib@2.11.0`, `## Traps` names the unscoped `pdf-lib`, and the `description` carries the package identifiers — exactly `docs/authoring.md:143-144` and `:120-123`.
- Ruling 2: the four-family table and the nine-criterion list are deleted, not demoted; a sweep for candidate/engine names returns only `Puppeteer` once, inside the rationale sentence requirement 2 asks for, and `candidates` once inside its own negation (`SKILL.md:12`).
- Ruling 3: F7's `æ—¥æœ¬èª` row and the generic F17 registry rows are gone; a sweep for `æ`, `WinAnsi` and `æ—¥` across the skill directory returns nothing.
- Ruling 4: `SKILL.md` carries exactly `pdf-lib.js.org` and `pdfa.org/sponsored-standards`, both in the one pinned `any` row; `unicode.org/reports/tr14/` now lives only in `references/docs-map.md:53`.
- Ruling 5: the maintenance check is one obligation row (`re-checking the library`) plus three toolchain rows and the `latestRelease is null` note — no sixth section.
- Phase-B detail: the `Producer` string is described, never quoted. The real string was decoded and confirmed to carry `https://github.com/Hopding/…`; nothing of the sort reached the file.

## Plan drift

One omission, non-blocking. No scope violations: `56d01f9` touches exactly T1's two declared files and nothing else exists in `7b13504..HEAD`.

- **`plugins/corporate/skills/pdf-playbook/SKILL.md:20-27`** — plan step 16 orders "The four parts of a file and the trailer (**F2, F3**) — but state L15 in the same breath". F2 and L15 are both there; F3 is not. The trailer's key set (`/Size` and `/Root` required, `/ID` required from PDF 2.0 and whenever `/Encrypt` is present, `/Prev` chains an incremental update) was in the previously shipped file and is now absent from `SKILL.md` entirely — `grep -n '/Root\|/Size'` returns nothing. What a reader loses is concrete: the file tells them "`/ID` is absent" from default output but nowhere says when `/ID` is required, nor that this library's default output is PDF 1.7. Offline — the condition requirement 8 imposes — a reader cannot resolve whether that absence is a defect.

  Non-blocking: requirement 6's minimum is still answerable from the file (four parts, `%PDF-` at byte 0, `%%EOF` at the tail, and the `/XRef`-stream caveat), the key set survives as a docs-map row (`docs-map.md:25`), and no obligation row prompts anyone to act on `/ID`, so this is a constructible gap, not a wrong action.

## Correctness

- **`plugins/corporate/skills/pdf-playbook/SKILL.md:112-116`** — the L9 trap's worked example is internally inconsistent: the input shown is `drawText('日本語')`, the output shown is `Extraction yields ??? OK`. The trailing `OK` is a fragment of L9's actual string, `日本語 OK` (`design.md:62`); the input as printed produces `???` and nothing else — confirmed directly: `font.encodeText('日本語')` → `<3F3F3F>`, three question marks, no `OK`. Concrete failure: a builder transcribing this trap's pair into a regression test — `drawText('日本語')`, expect `??? OK` — gets `???` and the assertion fails, in a file whose entire purpose is to be trusted without a network round-trip. Not blocking: the trap's lesson (a standard font substitutes `?` silently, and `widthOfTextAtSize` is wrong with it) is correct and verified, and the fix is one word. If it were blocking the origin would be `plan`, not `implementation` — `plan.md:21` dictates this sentence verbatim, including the stray `OK`.

- **`plugins/corporate/skills/pdf-playbook/SKILL.md:10`, `:142-144`** — the fastest-rotting facts are stated without the date the design's own mitigation promised. `design.md` risk section says the mitigation is "the file states the check as commands **and states the reading as of 2026-09-14** rather than as a standing claim". The commands are there; the date is not — `grep -n '2026'` on `SKILL.md` returns nothing, and "currently 2.11.0", "`time.modified` is 2022-05-12" and "last pushed in July 2024" read as standing claims. Concrete failure: a reader in six months sees "currently 2.11.0" with nothing telling them how old "currently" is, and the `re-checking the library` row gives them no baseline to compare a fresh `bun info` against. Not blocking, and not implementation drift: plan step 15 prescribes the exact phrase "currently 2.11.0" and no plan step or acceptance clause asks for a date. The mitigation went missing between design and plan, not between plan and code.

## Taste

Not blocking.

- `SKILL.md:131-133` — "a truncated file loads and reports zero pages" is an observation of one cut point presented as determinate. Probing eight truncations of a valid document showed: 30% → `getPageCount() === 0`, and 40%–95% → `1`, all loading without error. The general statement is both true and stronger than the specific one: `load()` succeeds on a truncated file and its page count cannot be trusted in either direction — including reporting the *correct* count for a file that is missing most of its bytes.
- `references/docs-map.md:17` vs `:56-63` — the `bun info` registry-metadata row moved from `## Tools` into the new `## The library` group. Plan step 25 both asks for that row in the new group and says to keep the tools group unchanged; the builder resolved the contradiction by moving rather than duplicating, which is the right call. Noted so it is not read as an accidental deletion.
- `SKILL.md:17-18` — "that distinction belongs in `## Traps`" is a pointer sentence in a file whose contract prefers flat facts. Harmless; costs one line.
- The cycle-2 taste item about the selection-criteria list reading "who breaks lines" is moot: the list is deleted.

Nothing was written to the repository by this review; the verification install lives in a scratch directory and the worktree is clean.
