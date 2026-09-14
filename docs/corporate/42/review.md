# Review — #42 (cycle 2)

**Verdict:** pass with findings
**Defect origin:** none

The cycle-1 blocking finding is genuinely closed — F18 is grounded in a verbatim normative quote I checked against the specification PDF myself and in six empirical claims I reproduced end to end on this machine — and the redo is scoped exactly as narrowly as the review asked; one four-word clause the redo plan quietly amended was not transcribed, which is non-blocking.

## Acceptance

### T1 — Author the pdf-playbook skill — PASS (9 of 9)

| Command | Result |
|---|---|
| `bun run validate` | `OK — 0 warning(s).` `EXIT=0`, no error naming `pdf-playbook` |
| `grep -n '^## ' …/SKILL.md` | `8:## Stack`, `66:## Toolchain`, `95:## Obligations by activity`, `106:## Traps`, `153:## Resources` — exactly five, in order |
| `grep -oE '\b[a-z0-9-]+\.(org\|com\|io\|dev\|net)\b' …/SKILL.md \| sort -u` | exactly `pdfa.org`, `unicode.org` — the new content introduced no URL |
| `grep -c 'bun add' …/SKILL.md` | `0` |
| `grep -cE '\bnpm\b\|\bnpx\b\|\byarn\b\|\bpnpm\b' …/SKILL.md` | `1` — line 85, `` Never reach any registry command through `npm`, `npx`, `yarn` or `pnpm` — ``. Verified by eye: the single hit is the ban sentence |
| `awk '/^## Stack$/,/^## Toolchain$/' …/SKILL.md \| grep -ci 'paginat'` | `2` (lines 49, 58) — non-zero |
| `awk '/^## Traps$/,/^## Resources$/' …/SKILL.md \| grep -ci 'outside the page box'` | `1` — non-zero |
| `grep -c '14.11.2' …/references/docs-map.md` | `1` |
| `awk 'END{print NR}' …/SKILL.md` | `164` — inside the redo plan's 110–165 band |

### T2 — Register the nineteenth playbook — PASS (5 of 5), unchanged this cycle

| Command | Result |
|---|---|
| `bun run validate` | `EXIT=0` |
| `grep -ric eighteen README.md CLAUDE.md` | `CLAUDE.md:0`, `README.md:0` |
| `grep -c pdf-playbook README.md` / `CLAUDE.md` | `2` / `1` |
| `grep -q '"version": "5.5.0"' …/plugin.json` | `EXIT=0` |
| `git diff --name-only` lists exactly three paths | Not re-runnable — tree clean at the merge commit. Equivalent: `git show --name-only --format= dfbe3bf` lists exactly `CLAUDE.md`, `README.md`, `plugins/corporate/.claude-plugin/plugin.json` |

Beyond the stated acceptance: `bun test` → 13 pass, 0 fail; `find plugins/corporate/skills/pdf-playbook -type f` returns exactly the two declared files (no third file); zero code fences in `SKILL.md`.

### F18 verified independently, not taken on the architect's word

**Normative half.** I downloaded `opensource.adobe.com/dc-acrobat-sdk-docs/standards/pdfstandards/pdf/PDF32000_2008.pdf` and extracted clause 14.11.2.1. All three quotes in `design.md:52` are verbatim — the media box's *"Content falling outside this boundary may safely be discarded without affecting the meaning of the PDF file"*, the crop box's *"merely imposes clipping on the page contents… The default value is the page's media box"*, and *"The crop, bleed, trim, and art boxes shall not ordinarily extend beyond the boundaries of the media box. If they do, they are effectively reduced to their intersection with the media box."* The design leans on the crop box (`shall be clipped`) rather than the media box (`may safely be discarded`) for the normative claim, which is the correct choice — the permissive verb is on the wrong box for the assertion being made.

The clause-numbering claim also holds: `pdf-issues.pdfa.org/32000-2-2020/clause14.html` carries exactly two 14.11 entries, **14.11.5 "Output intents"** and **14.11.7 "Open prepress interface"**, and none against 14.11.2 — matching ISO 32000-1's own numbering for those two subclauses, which corroborates that `docs-map.md`'s `ISO 32000-2 clause 14.11.2` points a reader at the right place.

**Empirical half.** I rebuilt the fixtures by F2's method and reran every step:

| F18 item | Reproduced |
|---|---|
| 1. byte-identical render | in-box and overflowing files both `dcfd0239cb0826e734f65806cd15ed89`; the three out-of-box strings put no mark on the page |
| 2. `pdfinfo` silent | `EXIT=0`, `Pages: 1`, `Page size: 595.276 x 841.89 pts (A4)`, no warning |
| 3. `pdftotext` silent | `EXIT=0`, **0 bytes to stderr**, extracts only `VISIBLE ROW ONE`; same with `-layout` |
| 4. box, not stream | changing only `/MediaBox` to `[-500 -500 2500 2500]` makes all four strings extract |
| 5. straddling case | `72 -5 Td` renders **differently** (`f3f8d827…` vs `dcfd0239…` — glyph tops drawn and clipped) and still extracts **nothing** |
| 6. qpdf | `which qpdf` → not installed here either; the inference stands unexecuted, as the design states |

## Design drift

None. `## Stack` still names no package, the two-URL cap still holds (the new prose introduced none, by acceptance), and ruling 5's amended form — pagination is the generator's job by the same argument F5 makes for margins — is what the file now says at `SKILL.md:47-53`.

## Plan drift

One, non-blocking, and its cause is a contradiction inside the redo plan rather than builder carelessness:

- **`plugins/corporate/skills/pdf-playbook/SKILL.md:62`** — the selection-criteria list still reads `who breaks lines`, where the redo amended it to `who breaks lines and who breaks pages` (`docs/corporate/42/plan.md:15`, matching `design.md:64`'s `who breaks lines and who breaks pages (F10, F11, F18)`). The shipped line is:

  > `Choose against: script and font coverage, extractability, who breaks lines,`
  > `runtime fit, weight and cold start, determinism, licence, maintenance state,`
  > `removal cost.`

  The plan contradicts itself here: `plan.md:13` tells the builder "The only substantive additions this pass are the page-flow sentence in `## Stack`, the overflow row in `## Traps`, and one row in `references/docs-map.md`. Change nothing else the shipped file already states" — an enumeration of three that excludes both the criteria list and the family-table cells. `plan.md:16` then explicitly orders the family-table change (the builder made it), while `plan.md:15`'s criteria amendment is unbolded and unmentioned by `:13`, so it was read as "nothing else". Structural, not attention.

  Non-blocking because the information is not lost: the family table two lines above (`:57-58`) states who breaks pages per family — `every line break and every page break` for direct construction, `pagination included` for the engine family — so a reader working the `choosing an approach` obligation still reaches it. I can construct no reader who ends up ignorant of the criterion, only one who reads it from a table instead of a list.

No scope violations. `78c7e16` touches exactly T1's two declared files; `git log --name-only 349f80a..HEAD` shows nothing else in the range except `docs/corporate/42/{design,plan}.md`, which are orchestrator artifacts and exempt. T2's three files are untouched since `dfbe3bf`, as the redo plan directed.

## Correctness

No blocking findings. What I checked and could not break:

**Requirement 2 still holds.** A case-insensitive sweep of the whole skill directory for 30 candidate and engine names (`pdf-lib`, `pdfkit`, `puppeteer`, `playwright`, `chrom*`, `headless`, `weasyprint`, `wkhtmltopdf`, `prince`, `latex`, `typst`, `pandoc`, `itext`, `reportlab`, `gotenberg`, `adobe`, `foxit`, `apryse`, `mupdf`, `pdfcpu`, `cairo`, `skia`, and others) returns nothing. The new prose names no product: the page-flow paragraph names no engine, and the amended family cells say `the engine, via @page/size, pagination included` and `the calling code` — properties, not products.

**The trap's claims are all true and correctly hedged.** `SKILL.md:115-125` states (a) the rule as a rule, (b) and (c) under `Observed:`, and never names `qpdf` — it says "the structural check still passes", which is the weakest form available and is what `plan.md:21` required. Every one of (b) and (c)'s assertions reproduced above. The detection advice is stated positively, as `design.md:129`'s risk demanded, and the straddle sentence is what stops a reader concluding extraction is a general safety net.

**No fact in the new content is absent from F18.** The `## Stack` paragraph's cursor/block/new-page/reset enumeration and the clipping sentence both trace to `design.md:62` and `:52`; the docs-map row carries a question and a source and no observation, per `plan.md:24`.

## Taste

Not blocking.

- `docs/corporate/42/plan.md:25` — "Keep `SKILL.md` in the 110–165 line band the comparable playbooks occupy". At 164 lines `pdf-playbook` is now the longest playbook in the repo by 30 lines (`github-playbook` is 134, `cloudflare-playbook` 130, median 105), so no comparable playbook occupies 155–165 and the rationale sentence is no longer literally true. The band was widened from 110–155 in the redo to fit a file that grew by 19 lines. The constraint is still a real one and the growth is earned content, but the justification drifted from the measurement.
- `SKILL.md:117` — `Observed:` syntactically governs the whole sentence, including "the structural check still passes", which was inferred rather than run. The plan's own item (b) is worded exactly this way, so the builder transcribed it faithfully, and I can construct no failure from it: the inference is almost certainly correct (`--check` examines structure, encryption, linearization and stream encoding — not where in user space a mark sits), and the direction of any error is conservative. Worth a comma if the file is opened again.
- `SKILL.md:16` and `README.md:419` — the two taste items from cycle 1 are unchanged and remain outside this issue's scope.

The verification fixtures and the specification PDF used to check F18 live outside the repository; nothing extraneous was written to it.
