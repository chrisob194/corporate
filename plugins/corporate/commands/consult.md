---
description: Reads a drafted issue and verdicts whether it looks buildable before a design exists; advisory, files nothing, changes nothing.
argument-hint: <issue>
---

# Consult

Issue: `$1`

Not a stage: it is not part of design → build → test → review, nothing chains
to it and nothing chains from it, it produces no artifact, and `/corporate:run`
never calls it. It is a cheap, advisory read you run before deciding whether an
ask is worth a design at all.

## Steps

1. If `$1` is empty, stop and name `/corporate:brief --list draft` — that lists
   the issues there are to consult.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` — if that path does not
   resolve, find it under the plugin directory. Run its preflight **except the
   write-permission check** — that check exists for a write-shaped call the run
   needs anyway, and this command performs no store write at all, so there is
   nothing for it to prove. Then normalise `$1` per the store's *The key* — `<n>`
   below is that number — and resolve it per its *Finding an issue*.
3. No worktree and no branch are created here, nothing is checked out, and the
   working tree is untouched — this runs in the user's own checkout, exactly
   like `/corporate:brief`.
4. If the record holds a `split` artifact, this issue is a parent; stop and
   name `/corporate:split <n> --status`. The rule is the store reference's, not
   repeated here.
5. Report the state the issue is in — `Draft`, `Open`, `Blocked` or `Closed` —
   and carry on regardless of which one it is. Never change it, never offer to
   promote it: the read leaves the record exactly as it found it.
6. Dispatch the `consultant` subagent with a brief containing:
   - the issue number,
   - the brief from the record, inlined verbatim,
   - the repository root and anything relevant from `CLAUDE.md`,
   - the list of MCP servers and plugin commands available in this session —
     the installed capability a subagent cannot see. Skills are not in that
     list: the consultant sees its own,
   - the reference path `${CLAUDE_PLUGIN_ROOT}/reference/consult.md` — if that
     path does not resolve, read the file yourself and inline its contents
     into the brief instead,
   - that it must return the document as its final message and write no file.
     The store is yours to write, and the agent must not learn where it is.
7. Validate what came back against the reference before showing it:
   - `# Consult — #<n>` is the only top-level `#` heading — split on unfenced
     headings only, ignoring anything that looks like a heading inside a
     fenced code block,
   - `## Verdict` holds one row with one of the three words,
   - every `## Dependencies` row carries `known` or `unknown` with a basis,
   - `## What to do next` names one of the three courses.

   Then check for over-delivery: any task breakdown, `depends_on`, `files:` or
   `acceptance:` line, or any `## Stack readiness`, `## Verification` or
   `## Scale` section is a defect. Re-dispatch rather than printing it.
8. Print the document. Nothing is filed, so the printed document is the
   deliverable — say that out loud, along with the fact that no comment, label
   or field was written to the record.
9. Translate the returned course into the command that performs it. Name it —
   do not run it:
   - `accept` → `/corporate:brief --promote <n>`, then `/corporate:design <n>`
   - `amend` → `/corporate:brief --update <n>`
   - `set aside` → nothing to run; the issue stays in `Draft`
10. If the consultant filed an HR record, surface that it did and name
    `/corporate:hr`. Do not run it.

## Gate

Stop. The verdict is advisory and gates nothing — `/corporate:design` may be
run whatever it said, and it still rules `## Stack readiness` on its own. A
`blocked` verdict is not a `Blocked` issue, and nothing here moves one.
Re-run this command after amending the brief for a fresh read.

There is no `consult` artifact kind, on purpose: a filed read goes stale
against the next amendment, and re-running is the freshness guarantee.
