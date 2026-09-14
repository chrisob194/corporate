# Review — #42

**Verdict:** blocked
**Defect origin:** design

Both tasks pass every acceptance command exactly as written and the file is a faithful transcription of the design's pinned fact set — but spec requirement 5's second half ("how text is wrapped across lines **and across pages**") is unaddressed in the shipped guidance, and it is unaddressed because no fact in F1–F17 covers pagination, which the design forbids the builder from supplying.

## Acceptance

### T1 — Author the pdf-playbook skill — PASS (6 of 6)

| Command | Result |
|---|---|
| `bun run validate` | `OK — 0 warning(s).` `EXIT=0`, no error naming `pdf-playbook` |
| `grep -n '^## ' …/SKILL.md` | `8:## Stack`, `58:## Toolchain`, `87:## Obligations by activity`, `98:## Traps`, `134:## Resources` — exactly five, in order, nothing else |
| `grep -oE '\b[a-z0-9-]+\.(org\|com\|io\|dev\|net)\b' …/SKILL.md \| sort -u` | exactly `pdfa.org` and `unicode.org` |
| `grep -c 'bun add' …/SKILL.md` | `0` |
| `grep -cE '\bnpm\b\|\bnpx\b\|\byarn\b\|\bpnpm\b' …/SKILL.md` | one hit, line 77 — `` Never reach any registry command through `npm`, `npx`, `yarn` or `pnpm` — ``. Verified by eye: the single hit is the ban sentence |
| `awk 'END{print NR}' …/SKILL.md` | `145` — inside the 110–155 band |

### T2 — Register the nineteenth playbook and bump the version — PASS (5 of 5)

| Command | Result |
|---|---|
| `bun run validate` | exit 0 |
| `grep -ric eighteen README.md CLAUDE.md` | `CLAUDE.md:0`, `README.md:0` |
| `grep -c pdf-playbook README.md` / `CLAUDE.md` | `2` / `1` |
| `grep -q '"version": "5.5.0"' …/plugin.json` | exit 0 |
| `git diff --name-only` lists exactly three paths | Not re-runnable in this state — the tree is clean at the merge commit. Verified equivalently: `git show --name-only --format= dfbe3bf` lists exactly `CLAUDE.md`, `README.md`, `plugins/corporate/.claude-plugin/plugin.json` |

Independent checks beyond the stated acceptance: `ls -d plugins/corporate/skills/*-playbook | wc -l` returns **19**, matching "Nineteen ship today"; the README prose block names 19 distinct playbooks; a repo-wide sweep for stale count words outside `docs/corporate/` returns only `reference/issue-store.md:156` ("twelve to eighteen" — unrelated prose); `marketplace.json` carries no `version` and was not touched; `docs/ideas.md` holds no PDF entry and gained none; no sibling playbook's `## Resources` gained a reverse link; `SKILL.md` contains zero code fences.

## Design drift

None. The seven rulings hold: `## Stack` names no package, the format-is-the-stack framing follows `crypto-playbook`'s shape, the two-URL cap holds with `references/docs-map.md` carrying the rest, line breaking is stated as not the format's job, the toolchain is `bun`-only with the in-process degradation stated, and no reverse cross-link was added.

## Plan drift

One, non-blocking:

- `README.md:274-275` — plan T2 step 2 says of the `tailwind-playbook` clause: "Drop its trailing ` and` and add one new clause on its own line immediately after". The trailing ` and` was not dropped, so the list now reads "…utility-class styling surface, and `pdf-playbook` for the document-generation and page-layout surface, and one per Bun doc area". Grammatically survivable as a serial list, but it is not what the step said and it is the only place in that paragraph with a doubled conjunction. Cosmetic; no functional effect.

No scope violations: T1's commit (`4c0e8b0`) touches exactly its two declared files, T2's (`dfbe3bf`) exactly its three. The remaining paths in the range are `docs/corporate/42/{spec,design,plan}.md` — orchestrator artifacts, exempt.

## Correctness

### 1. Spec requirement 5's "across pages" is nowhere in the deliverable — BLOCKING

- `plugins/corporate/skills/pdf-playbook/SKILL.md:42-45` (and the absence of any trap covering it)
- `origin:` **design**

**What is wrong:** the playbook describes where a *line* breaks (UAX #14, kinsoku shori) and never describes how content moves from one page to the next, nor that content placed outside the `/MediaBox` is simply not rendered and raises no error.

**The acceptance criterion it cannot reach,** quoted from the brief: *"5. Guidance must describe line breaking — how text is wrapped across lines **and across pages**."*

**The concrete failure:** a builder in the spec's own scenario 2 — no network, told to generate a three-page invoice by direct construction — reads `## Stack` and learns that PDF has no concept of a line or a paragraph, that break opportunities come from UAX #14, and that `direct construction | the calling code — every coordinate and line break`. Nothing tells it that the format also has no concept of a page *flow*: that it must track a vertical cursor against `/MediaBox` minus the margins it fixed, emit a new page object when the cursor passes the bottom, and that if it does not, the overflowing rows are drawn at negative y and are silently invisible — `qpdf --check` exits 0, `pdfinfo` reports one page, `pdftotext` extracts the text (it is in the content stream), and every assertion the `testing` obligation row prescribes passes on a document whose last ten rows nobody can see. That is the same class of silent failure as `## Traps`' first two entries, and it is the one the guidance does not warn about. Greps for `paginat|page break|new page|overflow|across pages|clip` across `plugins/corporate/skills/pdf-playbook/` return one unrelated hit (`SKILL.md:115`, font-measurement overflow).

**Why design and not implementation or plan:** the plan's T1 step for `## Stack` asks for exactly what was written — "the one-line statement that PDF has no concept of a line or a paragraph, so break opportunities come from UAX #14 and, for Japanese, from kinsoku shori (F10, F11)" (`docs/corporate/42/plan.md:14`) — and the `## Traps` step (`:18`) enumerates fourteen traps, none about page overflow. The builder could not have supplied it on its own initiative either: `docs/corporate/42/design.md:31` and the `pdf` row of `## Stack readiness` (`:77`) both state "A fact the file needs that is absent here is a design defect to route back, never a licence to write it from memory", and F1–F17 contain no fact about pagination or about the rendering of marks outside the `/MediaBox`. The omission entered at design: `design.md:7` restates the spec's topics as "page setup, line breaking" and drops requirement 5's "across pages" clause, so the fact set was assembled without it. Building the plan exactly and correctly cannot reach the criterion.

**Scope of the redo, for routing:** this is narrow, not a re-architecture. One added pinned fact — marks outside the `/MediaBox` are not rendered and produce no error, and pagination is the generator's job because the format expresses no flow, by the same argument F5 already makes for margins — plus one sentence in `## Stack` and one `## Traps` row. The rest of the design, and both tasks as built, stand.

### 2. Requirement 2 — no candidate presented as "the" choice — HOLDS

Recorded because this is the judgement the spec's loop hint puts a person at, and it was checked by reading rather than by grep. A case-insensitive sweep of the whole skill directory for 30 candidate names (`pdf-lib`, `pdfkit`, `puppeteer`, `playwright`, `jspdf`, `pdfmake`, `weasyprint`, `wkhtmltopdf`, `prince`, `chromium`, `latex`, `typst`, `pandoc`, `itext`, `reportlab`, `gotenberg`, `adobe`, `foxit`, `apryse`, and others) returns nothing. Reading confirms it: `## Stack`'s family table (`:47-52`) names four *families* by what does layout and what it costs, with no product in any cell; the criteria list (`:54-56`) is nine properties and no example; `## Toolchain`'s `<pkg>` is a placeholder in every row; the `choosing an approach` obligation (`:92`) requires the registry state be "read at that moment, never remembered". No candidate appears anywhere, so none can be presented as "the" choice — the file is stricter than the requirement, which permits illustration. `qpdf`, `pdftotext`, `pdffonts` and `verapdf` are named, but they are assertion tools, and the non-goal is scoped to products "for generating PDFs"; the in-process fallback at `:82-85` keeps even those from being load-bearing. `printToPDF` in the description is a routing identifier the plan explicitly mandated (`plan.md:13`), not a recommendation.

### 3. Facts spot-checked against F1–F17 — all consistent

`SKILL.md:20` four-part file and the ≥128 binary comment against F2; `:23` trailer keys and `/ID` from PDF 2.0 against F3; `:25-29` required page keys, `/Resources`+`/MediaBox` inheritance, `/Rotate` multiples of 90 against F4; `:30-32` 1/72 inch, origin bottom-left, A4 595.276 × 841.89, Letter 612 × 792, no margin in the format against F5; `:34-40` simple-font 256-character ceiling, Type 0 `/Encoding` CMap with `Identity-H` among the predefined names, `/ToUnicode` optional against F6 and F8; `:74-75` `qpdf --check` exit codes 0/2/3 and `--warning-exit-0` against F13; `:100-103` the `日本語` → `æ—¥æœ¬èª` failure with `emb no sub no uni no` against F7 verbatim; `:104-106` the broken-`startxref` case against F12; `:107-108` the standard 14's PDF 1.0–1.7 scope against F9; `:122-124` timestamp and file identifier defeating golden-byte comparison against F16; `:62-65`, `:127` the `bun info`/`gh repo view` invocations against F17. No fact in the file is absent from F1–F17, and none contradicts it.

## Taste

Not blocking.

- `SKILL.md:16` — "A minimal file is four parts, in order, closed by a trailer", followed by a four-row table whose fourth row *is* the trailer. Reads as five things in four slots on first pass. F2's own phrasing has the same seam.
- `SKILL.md:104-106` — the `startxref` trap is stated as a general fact about "readers", where the design's own risk note (`design.md:111`) says F7 and F12 "describe how poppler 24.02.0 behaves, not what ISO 32000-2 requires" and asks that they be stated as observable behaviour. The plan (`plan.md:18`) dictated the generalised wording, so the builder followed it, and I can construct no failure from it — the trap's conclusion ("it renders" is not a validity claim) is the conservative direction either way. Worth a hedge if the file is touched again.
- `README.md:419` — the `Skill` inventory row still omits `goal-suggest`, which ships. Pre-existing, outside this issue's scope, and not caused by this diff.
