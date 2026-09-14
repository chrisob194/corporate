---
name: pdf-playbook
description: Use when work touches PDF — `@cantoo/pdf-lib`, `pdf-lib`, `PDFDocument`, `embedFont`, `registerFontkit`, `drawText`, `PageSizes`, a `.pdf` file, a `%PDF-` header, `/MediaBox`, `/Type /Page`, a page size in points, a Type0 or CID font, `Identity-H`, `/ToUnicode`, an embedded or subset font, PDF/A, `qpdf --check`, `pdftotext`, `pdffonts`, `verapdf` — or when generating documents on a server, or asserting in a test that generated output is well-formed.
---

# PDF Playbook

## Stack

Documents are produced with `@cantoo/pdf-lib` (MIT, currently 2.11.0), installed alongside
`@cantoo/fontkit`. The choice is settled; this file is that library's guidance, not a
comparison of candidates. Two reasons carried it: it is a pure-JavaScript library that
spawns no process, roughly 50 MB of `node_modules` against Puppeteer's own documented ~282
MB Chrome-for-Testing download on Linux; and its async surface is document-level rather
than per-mark — `create`, `load`, `embedFont` and `save` return promises, while `addPage`,
every `draw*`, `registerFontkit` and the metadata setters are synchronous. It forks the
unscoped `pdf-lib`, taking its source but not its maintenance state — that distinction
belongs in `## Traps`.

A minimal file is four parts, in order, closed by a trailer: header (`%PDF-n.m` as the
very first bytes, plus a binary comment line of at least four bytes with codes ≥ 128),
body (numbered indirect objects, `N 0 obj … endobj`), a cross-reference section, and a
trailer. By default `save()` emits an `/XRef` cross-reference stream and object streams
rather than the classic table, so the literal `trailer` and `xref` keywords do not appear
in its output and `/ID` is absent; `save({ useObjectStreams: false })` produces the
classic table with a `trailer` dictionary. What always holds regardless of that choice:
`%PDF-` at byte 0 and `%%EOF` at the tail.

A page object requires `/Type`, `/Parent`, `/Resources` and `/MediaBox` — but `/Resources`
and `/MediaBox` are inheritable from the parent page-tree node, so a page dictionary can
omit both and still be valid. `/Rotate` defaults to `0` and only takes a multiple of 90;
it is not a layout tool. The default user-space unit is 1/72 inch, origin bottom-left:
exact A4 is 595.276 × 841.89 units, US Letter is 612 × 792. The format expresses no margin
at all — a margin is a number in whatever computes coordinates before writing them.

A simple font maps one byte to one glyph, addressing at most 256 characters. Anything else
needs a Type 0 (composite) font: `/Encoding` is a CMap, `Identity-H` is one predefined
name among others, and `/ToUnicode` is the optional stream that makes the result
searchable and extractable. The library builds all three of those for you the moment you
embed a custom font — you choose the font, not the font dictionary.

PDF places glyphs at coordinates and has no concept of a line or a paragraph: break
opportunities come from Unicode's own line-breaking algorithm, and for Japanese from
kinsoku shori's start-of-line and end-of-line prohibitions layered on top of it.

PDF has no concept of a page flow either: a page object owns a content stream and nothing
carries content from one page object to the next, so pagination — tracking a vertical
cursor, deciding where a block breaks, emitting a new page and resetting the cursor —
belongs to whatever computes coordinates, exactly as a margin does. A page's contents are
clipped to its crop box, which defaults to its media box, so a mark placed outside the
page box is simply discarded. Here, that "whatever computes coordinates" is the calling
code: `drawText` wraps lines within `maxWidth` and never adds a page.

The library's own surface, as facts. Page setup: `doc.addPage()` defaults to A4;
`doc.addPage(PageSizes.A4)` with `PageSizes.A4 = [595.28, 841.89]`, `Letter = [612, 792]`,
`Legal = [612, 1008]`. Landscape is the tuple reversed. There is no orientation option and
no margin option — `drawText` takes absolute `x`/`y`, and `y` is the baseline. Fonts:
`await doc.embedFont(StandardFonts.Helvetica)` for Latin text; for anything else,
`doc.registerFontkit(fk)` from `@cantoo/fontkit` — a separate install, not a dependency —
then `await doc.embedFont(ttfBytes, { subset: true })`, which yields a CID TrueType font
with `Identity-H` and a `/ToUnicode` map. Text: `page.drawText(s, { x, y, size, font,
maxWidth, lineHeight, wordBreaks })`. Save and read back: `await doc.save()` returns a
`Uint8Array`; `await PDFDocument.load(bytes)` plus `getPageCount()`,
`getPage(i).getSize()` and the fork's `page.extractContents()` — whose text assets expose
`getText()`, `x`, `y`, `fontSize`, `fontFamily` — give a complete in-process assertion
path.

## Toolchain

| Job | Command |
|---|---|
| install | `bun add @cantoo/pdf-lib` |
| custom-font support | `bun add @cantoo/fontkit` |
| identity, licence, deps, versions, maintainers, publish date | `bun info @cantoo/pdf-lib` |
| one registry field | `bun info @cantoo/pdf-lib time.modified` |
| repository side | `gh repo view cantoo-scribe/pdf-lib --json pushedAt,isArchived,licenseInfo` |
| structural check | `qpdf --check out.pdf` |
| page count, size, version | `pdfinfo out.pdf` |
| page boxes | `pdfinfo -box out.pdf` |
| extracted text | `pdftotext -enc UTF-8 out.pdf -` |
| layout-preserving extraction | `pdftotext -layout -enc UTF-8 out.pdf -` |
| font embedding and ToUnicode coverage | `pdffonts out.pdf` |
| PDF/A conformance | `verapdf -f 1b out.pdf` |

`latestRelease` is deliberately absent from that repository-side field list — this fork
cuts no GitHub Releases, so it comes back `null` and would misread a package published
days ago as abandoned; read `pushedAt` and the registry publish date instead.

`qpdf --check` exits `0` for no errors or warnings, `2` for errors, `3` for warnings only;
`--warning-exit-0` collapses `3` to `0`.

Never reach any registry command through `npm`, `npx`, `yarn` or `pnpm` — not in a shell,
not in a `package.json` script, not in CI, including when translating a copied upstream
snippet. And never treat a file opening in a viewer as evidence it is well-formed.

Where the inspection CLIs are absent from the image, make the assertion in-process with
`PDFDocument.load` plus `extractContents()`, not by hand-parsing bytes; a test whose tool
is missing still fails rather than skips it.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `pdf-lib.js.org` is the API reference for the library this playbook is built around; ISO 32000-2 is the format authority, available at no cost from the PDF Association at `pdfa.org/sponsored-standards`; `references/docs-map.md` beside this file maps the decisions this team makes to the exact page or clause. A fact either covers is read there, never asserted from memory, and no vendor guide, blog post or README substitutes for either |
| implementing | page size, orientation and margins fixed in writing before content is placed, because nothing in the format supplies a default margin; every font carrying non-ASCII text embedded and subset; register fontkit before embedding any custom font; a Type 0 font with a `/ToUnicode` map wherever text must remain searchable; line breaking done against Unicode's algorithm with the language's own prohibitions applied, and the same measurement used for breaking as for drawing; pin `setCreationDate`/`setModificationDate` if output must be reproducible |
| reviewing | reject a document whose fonts are not embedded, a non-Latin string drawn through a single-byte encoding, a font with no ToUnicode where the text must be searchable, a page size asserted in millimetres against a box measured in points, a golden-byte comparison of generated output, and a subsetting claim evidenced by `pdffonts`' `sub` column |
| testing | assert three things and never a screenshot: structure (the byte stream parses, or `qpdf --check` exits 0), content (extracted text contains the expected strings, compared as Unicode after normalisation), and encoding (a non-ASCII string survives extraction byte-identical, and every font reports embedded); assert the page count too, and that the *last* expected string extracts |
| re-checking the library | re-read the registry and repository state with the commands above rather than remembering it; if the fork stops publishing, what to re-evaluate is the whole choice, and the guidance in this file stops being authoritative with it |

## Traps

- A standard font raises nothing for non-Latin text: `embedFont(StandardFonts.Helvetica)`
  then `drawText('日本語')` succeeds, and `save()` succeeds too. `font.encodeText('日本語')`
  returns three `?`, and `widthOfTextAtSize` returns the width of those question marks —
  the measurement is wrong too. Extraction yields `??? OK`, `pdffonts` reports `emb no sub
  no uni no`, and every tool in the chain exits 0.
- `maxWidth` splits on spaces only: `defaultWordBreaks` is `[' ']`, so an 84-character
  Japanese string measuring 1008 pt stays one line, runs off a 595 pt page and loses its
  tail with no warning. `wordBreaks: ['']` fixes the wrapping but applies no kinsoku shori
  — a line can begin with `。` — and would break Latin words mid-word, so a mixed-script
  paragraph has no one correct value.
- A missing glyph is `.notdef` with a plausible width: `encodeText` returns glyph id 0 for
  every unsupported character while `widthOfTextAtSize` still returns a number. The page
  draws nothing, extraction returns zero bytes, and `pdffonts` still reports `emb yes …
  uni yes` — every font-level assertion passes on a page with no readable text.
- `PageSizes.A4` is `595.28`, not the exact `595.276` — a test asserting the exact value
  against a `PageSizes.A4` page fails.
- `pdffonts` reports `sub no` whether `subset` was true or false — the library applies no
  `ABCDEF+` tag — so assert on output size instead: the same document was 2,486 bytes
  subsetted and 2,321,699 unsubsetted from one 4 MB font.
- `PDFDocument.load` succeeding is not a validity claim: a file with a broken `startxref`
  loads and reports one page, and a truncated file loads and reports zero pages with no
  error at all; only a missing `%PDF-` header throws.
- Default `save()` output contains no `trailer` and no `xref` keyword — a byte check
  grepping for either fails on correct output.
- Two `save()` calls differ unless `setCreationDate` and `setModificationDate` are pinned,
  and the default `Creator`/`Producer` strings still name the upstream project and carry
  its repository URL into every document — describe that string, never quote it.
- `gh repo view --json latestRelease` returns `null` for this repository, which cuts no
  releases, so a checker keying on it concludes "abandoned" about a package published days
  earlier — use `pushedAt` and the registry publish date.
- The unscoped `pdf-lib` this is forked from is not the same package: its registry
  `time.modified` is 2022-05-12 and its repository was last pushed in July 2024 — a name
  is not a maintenance state.
- A file with a deliberately broken `startxref` offset still opens and still extracts
  correctly through poppler — readers reconstruct the cross-reference table by scanning —
  so "it renders" is never a validity claim.
- A page's contents are clipped to its crop box, which defaults to its media box, so
  content placed outside the page box is discarded — the format working as specified, not
  an error. Observed: a row drawn below `y = 0` puts no mark on the page and the
  extraction tools return nothing for it, while the structural check still passes and the
  page count still reads as expected. Worse, a row whose baseline straddles the edge is
  partly drawn — glyph tops clipped at the edge — and is still absent from extracted text,
  because extraction keys on the text origin, not the glyph box. Detect it positively:
  assert the expected page count and that the last expected string extracts — a
  header-only check passes on a document whose final rows nobody can see.
- The standard 14 fonts are Latin-only, and their availability guarantee is written for
  PDF 1.0–1.7 processors, not for every processor.
- Text with no `/ToUnicode` is unsearchable and uncopyable however correct it looks.
- PDF stores glyphs, not characters — shaping and bidirectional reordering (Arabic
  contextual forms, Indic conjuncts) must happen before placement and are not the viewer's
  job.
- `/Rotate` is not a layout tool and only takes multiples of 90.
- A page may inherit `/MediaBox` and `/Resources` from its parent, so reading a page
  dictionary alone does not tell you its size.
- `qpdf --check` passing does not mean the content streams are correct, by qpdf's own
  statement.
- PDF/A conformance is a separate check against a separate tool and is not implied by
  structural validity.
- `bun info` needs a `package.json` in the working directory.

## Resources

### Skills

- typescript-playbook
- bun-pm-playbook
- bun-runtime-playbook
- github-playbook
- docker-playbook

### MCP servers

None.
