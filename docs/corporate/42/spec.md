# Spec — PDF generation guidance

## Problem
A role asked to specify or design PDF output — with no ability to reach the network to look anything up — has nowhere to turn for how to generate a PDF with this project's chosen library, `@cantoo/pdf-lib`: how to use it to handle non-Latin-script text correctly, lay out a page and wrap lines within it, what actually makes a byte stream a valid PDF, or how to check generated output automatically. Today that role must either block, or hand the builder an underspecified design and let it improvise all of the above against an unfamiliar API. The grounding work this requires — learning the library's specific patterns and gotchas, working out format-specific rules empirically, writing the guidance down — has to be paid in full from scratch every time PDF output is asked for, and it falls hardest on the role structurally least able to do it, because it cannot search for anything itself.

## User scenarios
1. Before: an issue calls for PDF output; the role writing the design has no network access and no prior guidance, so it either stalls or ships a design silent on how the library handles text encoding, layout and validity, leaving the builder to guess. After: the role consults existing guidance built around `@cantoo/pdf-lib` and can specify page setup, non-Latin text handling, line breaking and validity expectations in the design itself, in terms of the library the guidance is built around.
2. Before: a builder receives a design with no stated way to verify generated PDF output, and invents an ad hoc check. After: the builder finds a documented way, using `@cantoo/pdf-lib`, to assert, in an automated test, that generated output is well-formed and contains what it should.
3. Before: `@cantoo/pdf-lib` was reasoned about once, for the issue that first needed PDF output, and the next request has no record of why it was chosen or how to tell if that reasoning has stopped holding. After: the next request finds the rationale (lighter weight than a browser-automation approach, async API) written down alongside the guidance, plus a short check for whether the library is still a safe choice, without re-deriving either from scratch.

## Functional requirements
1. Guidance must describe how to generate PDF documents for a JavaScript/TypeScript server runtime using `@cantoo/pdf-lib`, the library this playbook is built around.
2. Guidance must name `@cantoo/pdf-lib` as the chosen library and state the reasons it was chosen — lighter weight than a browser-automation approach such as Puppeteer, and an async API — as the rationale for a choice already made, not as one candidate among several still open for the reader to pick between.
3. Guidance must describe how to handle text outside the basic Latin character set using `@cantoo/pdf-lib`'s font-embedding and encoding facilities, using at least one concrete non-Latin-script language as a worked case, including what commonly goes wrong with fonts and encodings not built for it.
4. Guidance must describe page setup with `@cantoo/pdf-lib` — what has to be decided about page size, margins and orientation before content is placed, and how those decisions are expressed through the library.
5. Guidance must describe line breaking with `@cantoo/pdf-lib` — how text is wrapped across lines and across pages given what the library does and does not do for you.
6. Guidance must describe what minimally makes a byte stream a valid PDF, so someone producing one with `@cantoo/pdf-lib` can confirm the output is well-formed rather than merely something a particular viewer happens to render.
7. Guidance must describe how to check, in an automated test, that PDF output generated with `@cantoo/pdf-lib` meets expectations — structural validity, presence of expected content, and correct handling of non-ASCII text — without a person opening the file.
8. Guidance must be usable start to finish by a role that cannot reach the network while applying it — it must not assume the reader can look anything up live, including about `@cantoo/pdf-lib` itself.
9. Guidance must include a short, clearly secondary section for telling whether `@cantoo/pdf-lib` has stopped being a safe choice over time (for example, signs it is no longer maintained) and what to re-evaluate if so. This resolves the tension with the prior spec's requirement that guidance survive candidate churn: the guidance is now specific to `@cantoo/pdf-lib` — its API, patterns and gotchas — and is not required to remain valid if that library is ever replaced; the maintenance-state check is a footnote for noticing that day, not the organizing principle of the playbook.

## Non-goals
- Does not treat library selection as an open decision to work through — `@cantoo/pdf-lib` is the answer this guidance is built around, not one candidate weighed among others.
- Does not cover generating any format other than PDF.
- Does not cover the content or business logic of what any particular document should contain.
- Does not cover storing, transmitting or delivering the generated file once produced.
- Does not re-run the library-selection research on behalf of a future requester — the choice is made and documented; only the maintenance-state check for `@cantoo/pdf-lib` specifically is left to be re-run over time.

## Key entities
- Chosen library: `@cantoo/pdf-lib`, the library this playbook is built around — distinct from a candidate under evaluation, since the evaluation that produced this choice is already settled.
- Selection rationale: the specific reasons `@cantoo/pdf-lib` was chosen (lighter weight than a browser-automation approach, async API) — carried as the stated justification for the choice already made, not as reusable criteria meant to be re-applied to a new decision.
- Maintenance-state check: the fallback method for noticing if `@cantoo/pdf-lib` itself has stopped being maintained, and what to re-evaluate if so — distinct from the settled choice, since it exists only for the day that choice needs revisiting.
- Non-ASCII text case: the worked example demonstrating font and encoding handling in `@cantoo/pdf-lib` for a language outside basic Latin.
- Validity check: the minimum structural property that makes a byte stream a legitimate PDF, as opposed to something that merely happens to open in one viewer.
- Generated-output assertion: a test-time check against output produced with `@cantoo/pdf-lib`, as opposed to a person visually inspecting the result.

## Assumptions
- The target runtime is a JavaScript/TypeScript server environment, since that is what the reporting role and the surrounding guidance both target.
- "pdf-lib" means the fork `@cantoo/pdf-lib` (https://pdf-lib.js.org/) named in the issue, not the original upstream package of a similar name — worth stating explicitly since the two are easy to conflate downstream.
- "Non-ASCII language" is read as needing one concrete worked example rather than an abstract list of scripts, since the reporting role could not have grounded any of them itself.
- The guidance is meant to be read cold by a role preparing a design or a build, not walked through as a checklist during review.
- "What makes a byte stream valid" is read as the minimal structural contract of the format, not a full account of every optional feature it supports.

## Second ticket
none — the brief describes one connected body of guidance (library-specific generation, non-ASCII text handling, page setup and line breaking, validity, and output testing) for one recurring gap, not several separable asks.

## Loop hints
- Ends when: the guidance names `@cantoo/pdf-lib` and its selection rationale, and covers non-Latin text handling, page setup and line breaking, byte-stream validity, output assertion and the maintenance-state footnote, each usable without further research
- Repeats over: nothing — this is a one-time authoring of guidance, not a per-item task
- Partial value: any one topic covered on its own (the pdf-lib rationale alone, or validity alone, and so on) already saves the next requester from redoing that piece of the research
- Human looks after: once, when the guidance is first written, to confirm it reads as guidance built specifically around `@cantoo/pdf-lib`, not as a generic method that stops short of committing to it
