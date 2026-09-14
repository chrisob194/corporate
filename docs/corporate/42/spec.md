# Spec — PDF generation guidance

## Problem
A role asked to specify or design PDF output — with no ability to reach the network to look anything up — has nowhere to turn for how to choose a document-generation approach, how to handle non-Latin-script text correctly, how to lay out a page and wrap lines within it, what actually makes a byte stream a valid PDF, or how to check generated output automatically. Today that role must either block, or hand the builder an underspecified design and let it improvise all of the above. The grounding work this requires — checking a candidate's maintenance state, working out format-specific rules empirically, writing the guidance down — has to be paid in full from scratch every time PDF output is asked for, and it falls hardest on the role structurally least able to do it, because it cannot search for anything itself.

## User scenarios
1. Before: an issue calls for PDF output; the role writing the design has no network access and no prior guidance, so it either stalls or ships a design silent on library selection, text encoding and validity, leaving the builder to guess. After: the role consults existing guidance and can specify page setup, non-Latin text handling, line breaking and validity expectations in the design itself, and can ask the builder to run a documented selection process rather than guessing.
2. Before: a builder receives a design with no stated way to verify generated PDF output, and invents an ad hoc check. After: the builder finds a documented way to assert, in an automated test, that generated output is well-formed and contains what it should.
3. Before: a library is picked once for one issue, and the next PDF request either repeats the entire selection research or blindly reuses a now-possibly-stale choice. After: the next request re-runs the same documented selection and maintenance-state checks against whatever candidates exist at that time, without re-deriving the method itself.

## Functional requirements
1. Guidance must exist describing how to select a document-generation approach for a JavaScript/TypeScript server runtime, including how to determine whether a candidate is currently maintained.
2. Guidance must not designate any single library, tool or product as the answer; a reviewer must be able to confirm that no candidate is presented as "the" choice, only as an illustration of applying the criteria.
3. Guidance must describe how to handle text outside the basic Latin character set, using at least one concrete non-Latin-script language as a worked case, including what commonly goes wrong with fonts and encodings not built for it.
4. Guidance must describe page setup — what has to be decided about page size, margins and orientation before content is placed.
5. Guidance must describe line breaking — how text is wrapped across lines and across pages.
6. Guidance must describe what minimally makes a byte stream a valid PDF, so someone producing one can confirm it is well-formed rather than merely something a particular viewer happens to render.
7. Guidance must describe how to check, in an automated test, that generated PDF output meets expectations — structural validity, presence of expected content, and correct handling of non-ASCII text — without a person opening the file.
8. Guidance must be usable start to finish by a role that cannot reach the network while applying it — it must not assume the reader can look anything up live.
9. Guidance must remain applicable as candidate libraries change over time — it must not need rewriting merely because the currently-favored candidate's maintenance state changes.

## Non-goals
- Does not pick or endorse a specific library, tool or product for generating PDFs.
- Does not cover generating any format other than PDF, beyond noting that the same selection method applies elsewhere.
- Does not cover the content or business logic of what any particular document should contain.
- Does not cover storing, transmitting or delivering the generated file once produced.
- Does not perform the grounding research on behalf of a future requester — it documents a method, not a standing conclusion that will age.

## Key entities
- Selection criteria: the properties used to judge a candidate generation approach (maintenance activity, runtime fit, weight, API style) — distinct from any one candidate judged against them.
- Candidate: a document-generation option under evaluation at the time of use — distinct from the guidance, which outlives any single candidate.
- Non-ASCII text case: the worked example demonstrating font and encoding handling for a language outside basic Latin.
- Validity check: the minimum structural property that makes a byte stream a legitimate PDF, as opposed to something that merely happens to open in one viewer.
- Generated-output assertion: a test-time check against produced output, as opposed to a person visually inspecting the result.

## Assumptions
- The target runtime is a JavaScript/TypeScript server environment, since that is what the reporting role and the surrounding guidance both target.
- "Non-ASCII language" is read as needing one concrete worked example rather than an abstract list of scripts, since the reporting role could not have grounded any of them itself.
- The guidance is meant to be read cold by a role preparing a design or a build, not walked through as a checklist during review.
- "What makes a byte stream valid" is read as the minimal structural contract of the format, not a full account of every optional feature it supports.

## Second ticket
none — the brief describes one connected body of guidance (selection, non-ASCII text handling, page setup and line breaking, validity, and output testing) for one recurring gap, not several separable asks.

## Loop hints
- Ends when: the guidance covers selection method, non-Latin text handling, page setup and line breaking, byte-stream validity, and output assertion, each usable without further research
- Repeats over: nothing — this is a one-time authoring of guidance, not a per-item task
- Partial value: any one topic covered on its own (selection method alone, or validity alone, and so on) already saves the next requester from redoing that piece of the research
- Human looks after: once, when the guidance is first written, to confirm it reads as a method rather than as an endorsement of any one candidate
