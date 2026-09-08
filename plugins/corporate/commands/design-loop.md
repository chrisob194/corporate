---
description: Dispatch the loop-engineer to design how an Open issue runs unattended — the kickoff, the line every turn must print, and the /goal condition that ends it — and file the loop in the issue store.
argument-hint: <issue>
---

# Design loop

Issue: `$1` · Arguments: `$ARGUMENTS`

Stage 0 — before the design, after the brief. This stage decides *what would stop
the run*. It ends by handing you two blocks to paste: a kickoff and a `/goal`
line. It starts nothing, opens no worktree, and writes no code.

`/corporate:run <n>` is the driver for ordinary pipeline work, and a loop
designed here usually names it. A `measured` loop names a prompt instead, because
the exit is a number a tool prints and no command produces it.

## Steps

1. If `$1` is empty, stop and ask for the number of an `Open` issue. Do not
   invent one — `/corporate:brief --list open` names the issues that exist.
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md` — if the path does not
   resolve, find the file under the plugin directory. Run its preflight,
   normalise `$1` per its *The key* — `<n>` below is that number — then resolve
   it per its *Finding an issue*. **Not `Open` is a hard stop**: say which state
   it is in, and for a `Draft` name `/corporate:brief --promote <n>`. Work is
   assigned on `Open` and only on `Open`.
3. Read `${CLAUDE_PLUGIN_ROOT}/reference/loop-design.md`. You validate against it
   in step 6 and you cannot do that from memory.
4. Read what the record already holds. If a `loop` artifact is filed, read the
   current one — the highest-numbered — and say what it designed before
   dispatching. You are not replacing it: loops are numbered, and the new one
   becomes current while the old one stays as the record of the attempt that did
   not work. Say why a redesign is happening, in one line, if one is.
5. Dispatch the `loop-engineer` subagent with a brief containing:
   - the issue's brief inlined **verbatim**, its `## Loop hints` section
     included, marked as settled — the criteria are the product owner's and are
     not re-opened here,
   - the repository root and anything relevant from `CLAUDE.md`,
   - the `/corporate:*` commands available in this session, and the MCP servers
     — a subagent cannot see either, and both are candidate drivers and candidate
     signals,
   - the current `loop` artifact in full, if step 4 found one, together with what
     went wrong with it. A redesign that is not told what failed repeats it,
   - that it must return the artifact as its final message and write no file.
     The store is yours to write, and the agent must not learn where it is.

   Do **not** inline the design. There is no design yet, and a loop that waits
   for one has the stage order backwards.
6. When it returns, run the **seven checks** from
   `reference/loop-design.md` yourself, every run. They are not the agent's to
   self-certify, and check 1 is the one that matters most: `## Signal` has to
   record what the command printed when it was run, not what it is expected to
   print. Read the goal line the way the evaluator will — with nothing but the
   print obligation in front of you — and confirm every token it tests is
   guaranteed to appear.

   A failed check is **one** re-dispatch, with the violations named and the
   previous artifact returned in full. Failing twice is a hard stop: report which
   check failed and stop. Do not file a loop that did not pass, and do not repair
   one yourself — a goal you fixed is a goal nobody designed.
7. File it: record the document as the next-numbered `loop` artifact and append
   the activity line with the loop engineer's report. The store reference owns
   the exact shapes; the numbering rule — highest observed plus one, never the
   count — is its business too.
8. Report to the user: the family, the rung and why nothing above it was
   available, the signal command and what it printed when it was run, the
   terminals, the cap and the worst case, and every hint that was rejected with
   what it was traded for.

   Then print exactly two copyable blocks, in this order, and nothing between
   them but the labels — the kickoff, then the goal line, each fenced and each
   exactly as the artifact holds it. This is the deliverable. A run that
   describes the loop but makes the user reconstruct the two lines has not
   finished.
9. If the loop engineer filed an HR record — a signal it had no way to observe, a
   tool it lacked — surface that it did and name `/corporate:hr`. Do not run it.

## Gate

Stop. Do not paste the kickoff, do not paste the goal line, and do not start the
run. Pasting them is the user's act, and it is the only gate an unattended run
gets: everything after it happens without anybody being asked.

If the artifact came back as `## Not a loop`, say so plainly and name what should
be run once instead. That is a valid outcome and it is still filed — the record
of *why* this work has no verifiable exit is worth as much as a loop would have
been.
