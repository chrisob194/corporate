---
name: pdf-playbook
description: Use when work touches PDF — a `.pdf` file, a `%PDF-` header, `/MediaBox`, `/Type /Page`, a page size in points, a Type0 or CID font, `Identity-H`, `/ToUnicode`, an embedded or subset font, CSS `@page`, `printToPDF`, PDF/A, `qpdf --check`, `pdftotext`, `pdffonts`, `verapdf` — or when choosing how a server will produce documents, or asserting in a test that generated output is well-formed.
---

# PDF Playbook

## Stack

PDF is a byte format fixed by ISO 32000-2 — nothing about it is a library
choice. The thing that writes it is chosen per project and ruled in the
design: direct construction, an HTML/CSS engine printing to PDF, a
typesetting engine run as a subprocess, or a hosted API. This playbook is
the format and the choice between families, never a binding.

A minimal file is four parts, in order, closed by a trailer:

| Part | Holds |
|---|---|
| header | `%PDF-n.m` as the very first bytes, plus a binary comment line of at least four bytes with codes ≥ 128 |
| body | numbered indirect objects, `N 0 obj … endobj` |
| cross-reference section | the byte offset of every object |
| trailer | a dictionary — `/Size` and `/Root` required, `/ID` required from PDF 2.0 and whenever `/Encrypt` is present, `/Prev` chains an incremental update — followed by `startxref` and `%%EOF` |

A page object requires `/Type`, `/Parent`, `/Resources` and `/MediaBox` —
but `/Resources` and `/MediaBox` are inheritable from the parent page-tree
node, so a page dictionary can omit both and still be valid, and reading one
page's dictionary alone never tells you its size. `/Rotate` defaults to `0`
and only takes a multiple of 90; it is not a layout tool. The default
user-space unit is 1/72 inch, origin bottom-left: A4 is 595.276 × 841.89
units, US Letter is 612 × 792. The format expresses no margin at all — a
margin is a number in whatever computes coordinates before writing them.

A simple font maps one byte to one glyph, so it addresses at most 256
characters, chosen by an encoding name. Anything outside that repertoire
needs a Type 0 (composite) font: `/Encoding` is a CMap, either a stream or a
predefined name — `Identity-H` is one, alongside the CJK families — and
`/ToUnicode` is the optional stream that makes the result searchable and
extractable. Without it a reader has no way back from glyph codes to
characters.

PDF places glyphs at coordinates and has no concept of a line or a
paragraph: break opportunities come from Unicode's own line-breaking
algorithm, and for Japanese from kinsoku shori's start-of-line and
end-of-line prohibitions layered on top of it.

PDF has no concept of a page flow either: a page object owns a content
stream and nothing carries content from one page object to the next, so
pagination — tracking a vertical cursor, deciding where a block breaks,
emitting a new page and resetting the cursor — belongs to whatever
computes coordinates, exactly as a margin does. A page's contents are
clipped to its crop box, which defaults to its media box, so a mark placed
outside the page box is simply discarded.

| Family | Who does layout | What it costs |
|---|---|---|
| direct construction | the calling code — every coordinate, every line break and every page break | most control, most of the work |
| an HTML/CSS engine printing to PDF | the engine, via `@page`/`size`, pagination included | a browser-class process |
| a typesetting engine as a subprocess | the engine | a non-JS toolchain in the image |
| a hosted API | the remote service | no runtime cost, a network dependency, content leaves the process |

Choose against: script and font coverage, extractability, who breaks lines,
runtime fit, weight and cold start, determinism, licence, maintenance state,
removal cost.

## Toolchain

| Job | Command |
|---|---|
| candidate's licence, deps, versions, maintainers, publish date | `bun info <pkg>` |
| one registry field | `bun info <pkg> time.modified` |
| resolved version | `bun info <pkg> version` |
| repository side | `gh repo view <owner>/<repo> --json pushedAt,isArchived,licenseInfo,latestRelease` |
| structural check | `qpdf --check out.pdf` |
| page count, size, version | `pdfinfo out.pdf` |
| page boxes | `pdfinfo -box out.pdf` |
| extracted text | `pdftotext -enc UTF-8 out.pdf -` |
| layout-preserving extraction | `pdftotext -layout -enc UTF-8 out.pdf -` |
| font embedding and ToUnicode coverage | `pdffonts out.pdf` |
| PDF/A conformance | `verapdf -f 1b out.pdf` |

`qpdf --check` exits `0` for no errors or warnings, `2` for errors, `3` for
warnings only; `--warning-exit-0` collapses `3` to `0`.

Never reach any registry command through `npm`, `npx`, `yarn` or `pnpm` —
not in a shell, not in a `package.json` script, not in CI, including when
translating a copied upstream snippet. And never treat a file opening in a
viewer as evidence it is well-formed.

Where the inspection CLIs are absent from the image, make the structural
assertion in-process against the bytes themselves — the header, the trailer
keys, the `startxref` offset — and let a test whose tool is missing fail
rather than skip it.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | ISO 32000-2 is the authority and is available at no cost from the PDF Association at `pdfa.org/sponsored-standards`; line breaking is not in it and lives at `unicode.org/reports/tr14`; `references/docs-map.md` beside this file maps the decisions this team makes to the exact clause or rule. A fact either covers is read there, never asserted from memory, and no vendor guide, blog post or library README substitutes for it |
| choosing an approach | name the family before any candidate, then judge candidates against the criteria with the registry and repository state read at that moment, never remembered; record which family, which candidate, its licence and its publish date, and what the fallback is if it is abandoned |
| implementing | page size, orientation and margins fixed in writing before content is placed, because nothing in the format supplies a default margin; every font carrying non-ASCII text embedded and subset; a Type 0 font with a `/ToUnicode` map wherever text must remain searchable; line breaking done against Unicode's algorithm with the language's own prohibitions applied, and the same measurement used for breaking as for drawing |
| reviewing | reject a document whose fonts are not embedded, a non-Latin string drawn through a single-byte encoding, a font with no ToUnicode where the text must be searchable, a page size asserted in millimetres against a box measured in points, a golden-byte comparison of generated output, and a candidate adopted with no recorded maintenance check |
| testing | assert three things and never a screenshot: structure (the byte stream parses, or `qpdf --check` exits 0), content (extracted text contains the expected strings, compared as Unicode after normalisation), and encoding (a non-ASCII string survives extraction byte-identical, and every font reports embedded) |
| migrating or upgrading a candidate | re-run the maintenance check, re-run the extraction assertions on a document containing non-ASCII text, and diff extracted text rather than bytes |

## Traps

- Non-Latin text through a single-byte encoding produces no error at all:
  the UTF-8 bytes of `日本語` drawn in Helvetica with `/WinAnsiEncoding`
  extract as `æ—¥æœ¬èª`, one Latin glyph per byte, `pdffonts` reports
  `emb no sub no uni no`, and every tool in the chain exits 0.
- A file with a deliberately broken `startxref` offset still opens and
  still extracts correctly — readers reconstruct the cross-reference table
  by scanning — so "it renders" is never a validity claim.
- A page's contents are clipped to its crop box, which defaults to its
  media box, so content placed outside the page box is discarded — the
  format working as specified, not an error. Observed: a row drawn below
  `y = 0` puts no mark on the page and the extraction tools return nothing
  for it, while the structural check still passes and the page count still
  reads as expected. Worse, a row whose baseline straddles the edge is
  partly drawn — glyph tops clipped at the edge — and is still absent from
  extracted text, because extraction keys on the text origin, not the
  glyph box. Detect it positively: assert the expected page count and that
  the last expected string extracts — a header-only check passes on a
  document whose final rows nobody can see.
- The standard 14 fonts are Latin-only, and their availability guarantee is
  written for PDF 1.0–1.7 processors, not for every processor.
- A missing glyph is drawn as `.notdef`, a blank or a box, never an error.
- Text with no `/ToUnicode` is unsearchable and uncopyable however correct
  it looks.
- PDF stores glyphs, not characters — shaping and bidirectional reordering
  (Arabic contextual forms, Indic conjuncts) must happen before placement
  and are not the viewer's job.
- Measuring a line with one font and drawing it with another overflows
  silently.
- `/Rotate` is not a layout tool and only takes multiples of 90.
- A page may inherit `/MediaBox` and `/Resources` from its parent, so
  reading a page dictionary alone does not tell you its size.
- `qpdf --check` passing does not mean the content streams are correct, by
  qpdf's own statement.
- Generated output embeds a creation timestamp and a file identifier, so a
  byte-for-byte golden comparison fails on the second run and is not an
  assertion about content.
- PDF/A conformance is a separate check against a separate tool and is not
  implied by structural validity.
- `bun info` needs a `package.json` in the working directory.
- A fork carrying an unmaintained upstream's name inherits neither the
  upstream's maintenance state nor its own — check the fork's own publish
  date and repository activity, not the name.
- A candidate judged once is not judged forever, which is why the check is
  a command, not a note in a design.

## Resources

### Skills

- bun-pm-playbook
- bun-runtime-playbook
- github-playbook
- docker-playbook

### MCP servers

None.
