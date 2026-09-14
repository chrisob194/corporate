# PDF doc map

Two authorities, not one: `pdf-lib.js.org` for the library's API, and ISO
32000-2 for the format. This file is a shortcut from a decision this team
makes to the page or clause that settles it — not a replacement for either
source, and not a summary of what it says. A question neither answers goes
to the standard itself, published at no cost by the PDF Association at
`pdfa.org/sponsored-standards`, with formalized errata per clause at
`pdf-issues.pdfa.org/32000-2-2020/`.

## The library

| Question | Source |
|---|---|
| the API reference for `PDFDocument`, `PDFPage` and `PDFFont` | `pdf-lib.js.org/docs/api/` |
| what this fork ships that upstream `pdf-lib` does not, and which fontkit builds work | `github.com/cantoo-scribe/pdf-lib` README and CHANGELOG |
| registry metadata behind `bun info` — `dist-tags`, `versions`, `time`, `maintainers`, `license`, `deprecated` | `github.com/npm/registry`, `docs/responses/package-metadata.md` |
| the browser-automation download size this choice was weighed against | `pptr.dev/guides/installation` |

## File structure and validity

| Question | Source |
|---|---|
| header, cross-reference section, trailer order | `pdfa.org/sponsored-standards` |
| trailer dictionary keys — `/Size`, `/Root`, `/ID`, `/Info`, `/Encrypt`, `/Prev`, `/XRefStm` | `github.com/pdf-association/arlington-pdf-model`, `tsv/latest/FileTrailer.tsv` |
| incremental update, `/Prev` chaining | `github.com/pdf-association/arlington-pdf-model`, `tsv/latest/FileTrailer.tsv` |
| document info deprecation, `/ID` required from PDF 2.0 | `pdflib.com/pdf-knowledge-base/pdf-20/deprecated-features/` |

## Pages and geometry

| Question | Source |
|---|---|
| page object keys, and which are required | `github.com/pdf-association/arlington-pdf-model`, `tsv/latest/PageObject.tsv` |
| `/Resources` and `/MediaBox` inheritance from the page tree | `github.com/pdf-association/arlington-pdf-model`, `tsv/latest/PageObject.tsv` |
| `/CropBox` default, `/Rotate` constraint (multiples of 90) | `github.com/pdf-association/arlington-pdf-model`, `tsv/latest/PageObject.tsv` |
| the user-space unit and its origin | `pdfa.org/sponsored-standards` |
| marks placed outside the page box — clipping to the crop box, defaulting to the media box | ISO 32000-2 clause `14.11.2`, "Page boundaries", `pdfa.org/sponsored-standards` |

## Text and fonts

| Question | Source |
|---|---|
| simple vs. composite (Type 0) fonts | `github.com/pdf-association/arlington-pdf-model`, `tsv/latest/FontType0.tsv` |
| CMaps and the `Identity-H`/`Identity-V` predefined names | `github.com/pdf-association/arlington-pdf-model`, `tsv/latest/FontType0.tsv` |
| `/ToUnicode`, and Table 125a for its stream dictionary | `pdf-issues.pdfa.org/32000-2-2020/clause09.html` |
| embedding and subsetting a font program | `pdfa.org/sponsored-standards` |
| the standard 14 fonts, and their PDF 1.0–1.7 scope | `pdf-issues.pdfa.org/32000-2-2020/clause09.html` |

## Line breaking

| Question | Source |
|---|---|
| break opportunities, mandatory vs. permissible, line-break classes | `unicode.org/reports/tr14/` |
| Japanese kinsoku shori — start/end-of-line prohibitions, line adjustment | `w3.org/TR/jlreq/` |

## Tools

| Question | Source |
|---|---|
| `qpdf --check`, its exit codes and its own stated limit | `qpdf.readthedocs.io/en/stable/cli.html` |
| PDF/A and PDF/UA conformance validation | `docs.verapdf.org/cli/validation/` |
| `pdfinfo`, `pdftotext`, `pdffonts` flags | local `-h` output on each command |
| repository fields accepted by `gh repo view --json` | local `gh repo view --json` with no argument |
