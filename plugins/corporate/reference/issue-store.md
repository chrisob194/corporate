# The issue store

The tracker. Issues live here, their state is here, and every artifact the
pipeline produces — design, plan, test report, review — is filed here beside the
issue that caused it. `/corporate:brief` files, `/corporate:run` works and
records.

**The record is a GitHub issue on the repository `origin` points at.** There is
one store and there is no configuration: no key to set, no backend to resolve,
no fallback. A repository whose `origin` is not GitHub cannot use this pipeline.

That is the whole appeal: the backlog is visible to everyone who can see the
repository, a `Draft` can be promoted from a phone, and a `Blocked` issue
explains itself to somebody who is not running the pipeline. It is also the
whole cost: **every store read and every store write is a network call to a
repository this plugin does not own**, so much of this file is about what
happens when one fails.

On a public repository the briefs, designs, plans, reviews and test output are
world-readable, permanently. `/corporate:brief --init` says so once, and nothing
asks again.

This file is the only definition of the store. A command names the artifact
**kind**, the state or the field, and lets this file answer how it is recorded —
a command that names a label or a comment marker has reached past the store into
its recipe.

## Toolchain

`gh`, and nothing else. No `git` command reads or writes this store, and no
direct `gh api` call is used where a subcommand exists — `gh api` against the
comments endpoint can edit and delete, which this file forbids, so it stays out
of reach.

**Always pass `--repo <owner>/<repo>`.** The orchestrator runs inside the
issue's worktree, and an inferred repository is one more thing that can be
wrong when it matters.

**Never write a temp file.** Bodies and comments are piped:
`gh issue … --body-file -` reads standard input, so use a heredoc. Four stages
fail on a non-empty `git status --short`, and the orchestrator is sitting inside
the worktree those stages check — a stray `tmp.md` turns a passing review into a
reported failure. If a file is genuinely unavoidable, `mktemp` outside every
worktree and delete it.

**Never `gh issue comment --edit-last`.** It exists, it would silently rewrite
the artifact or log line this run just posted, and append-only is the invariant
this store is built around.

## The orchestrator owns the store

**No subagent reads the store, and no subagent writes to it.** A dispatched role
returns its artifact as its final message and a short report; the orchestrator
records the artifact and appends the log line. Everything a role needs is
inlined into its dispatch brief.

This is not a convention, it is the reason the design works. A store write is a
write to a remote the role was never told about, from a worktree that is not the
tracker's repository. One writer also means the activity log is a single ordered
account rather than N agents racing.

## Preflight

Before the first store operation of any command, in this order:

| Check | Command |
|---|---|
| `gh` is installed | `gh --version` |
| authenticated | `gh auth status` |
| the target resolves | `git remote get-url origin` parses to a `github.com` (or GHES) host path |
| issues are on | `gh repo view <owner>/<repo> --json hasIssuesEnabled,visibility` |
| writes are permitted | one write-shaped call the run needs anyway — the label bootstrap on `--init`, otherwise `gh issue edit` of a field to its current value |

Any failure is a **hard stop** that names the check and the fix. **Never invent
a fallback.** There is nowhere else to file, and an issue filed somewhere the
user did not ask for is an issue nobody is looking for.

The write-shaped check earns its place: a permission denial and an
authentication failure look nothing alike to the user and identical to a naive
report, and a user told "not authenticated" when the real answer is "`gh issue
edit` is not on the allowlist" will re-run `gh auth login` and get nowhere.

An origin that is not GitHub is a hard stop, and it has no fix inside this
plugin: the store is GitHub Issues and nothing else.

Outside a git repository there is no `origin` and no project to file against.
Same stop.

## The key

**The key of an issue is its GitHub issue number.** GitHub assigns it. Nothing
here derives one, caps one, or de-duplicates one, and there is no slug anywhere
in this plugin.

Every command takes the key as its first argument, in one of three forms, all
normalised to a bare integer before anything else happens:

```
123
#123
https://github.com/<owner>/<repo>/issues/123
```

- A URL whose `<owner>/<repo>` is not `origin`'s is a **hard stop** naming both.
  The store is this repository's issues; a number that resolves elsewhere would
  send a run into a worktree for the wrong codebase.
- A URL pointing at a pull request rather than an issue is the same stop.
- Anything else — a word, a kebab-case name, an empty argument — is a hard stop
  naming `/corporate:brief --list open`.

The number names a git branch (`corporate/<n>/work`), and an integer is a legal
ref path segment by construction. That is what makes a length cap or a character
rule unnecessary here; do not add one back.

## Target and labels

The target repository is `origin`'s `<owner>/<repo>`.

Four labels carry the mapping. `/corporate:brief --init` creates them
idempotently, behind one confirmation, because it writes to the user's
repository:

| Label | Meaning |
|---|---|
| `corporate` | this issue is a corporate record. Every list and lookup filters on it |
| `Draft` | state `Draft` |
| `In progress` | state `Open` |
| `Blocked` | state `Blocked` |

```
gh label create corporate --repo <owner>/<repo> --description "corporate pipeline record" --force
gh label create Draft --repo <owner>/<repo> --description "corporate: filed, not started" --force
gh label create "In progress" --repo <owner>/<repo> --description "corporate: work assigned" --force
gh label create Blocked --repo <owner>/<repo> --description "corporate: needs a human decision" --force
```

`--force` updates an existing label instead of failing, which is what makes the
bootstrap safe to re-run. The three state labels are **not namespaced**, on
purpose: they are the labels a human reads. A repository that already uses one
of those names for something else will find corporate issues mixed into it, and
that is a cost worth naming before switching, not a corruption.

## The record

One issue is one record. A record holds exactly four things:

| Part | What it is |
|---|---|
| the fields | the small mutable header below |
| the brief | the product owner's text, **verbatim**, never edited |
| the artifact set | the artifacts the stages produced, each with a kind and, where the kind is numbered, a number |
| the activity log | one line per completed stage, appended, never edited |

**The issue body is written once at filing and edited only for a field.** The
brief is in it verbatim, editing a brief is forbidden, and a
read-modify-write of the whole body by a language model — twelve to eighteen
times in a `/corporate:run` run — is how a brief gets silently reflowed and a log line
silently dropped, with no diff to catch either. So the body is small and nearly
immutable, and everything that grows lives in comments.

The title is the issue title and the creation date is GitHub's; neither is
mirrored. The fields are one HTML comment at the top of the body, with a
terminator:

```
<!-- corporate
branch: corporate/123/work
worktree: /home/x/proj/.claude/worktrees/corporate/123/work
pr:
blocked_reason:
closed_reason:
-->
<!-- corporate:end -->

<the brief, exactly as the product owner wrote it>
```

| Field | What it is |
|---|---|
| `branch` | `corporate/<n>/work` — empty until the run that fills it |
| `worktree` | the run's worktree path — machine-local and advisory |
| `pr` | the pull request URL — empty until close-out |
| `blocked_reason` | one sentence, set on entering `Blocked`, cleared on leaving |
| `closed_reason` | why the issue closed |

There is no `state:` key. The status and the label are authoritative, and a
mirrored key would only be drift waiting to be repaired.

`worktree` is advisory because it names a path on one machine. A run that finds
a recorded path that does not exist re-derives it and rewrites the field; it
never treats the absence as an error.

`<!-- corporate:end -->` is a **hard terminator. Nothing below it is ever
parsed.** A brief can legitimately contain `branch: something` or `## Activity
log` — briefs about this very plugin do — so what separates the record from the
prose is position, never a pattern match.

Editing a field is read, replace that one line, write:

```
gh issue view <n> --repo <owner>/<repo> --json body --jq .body
gh issue edit <n> --repo <owner>/<repo> --body-file -
```

Then **read the body back and assert two things**: the field holds the value you
wrote, and everything from `<!-- corporate:end -->` down is byte-identical to
what you read. On a mismatch, stop and name the issue URL. `gh issue edit` has
no `If-Match` and no optimistic concurrency — last write wins, and the loser's
change vanishes with no error — so this assert detects a collision instead of
pretending to prevent one. Do not invent a lock: an assignee, a label or a lock
comment is enforced by nothing and is held forever by a session that crashed.

## Artifact kinds

Eleven, and each stage writes exactly one kind:

| Kind | Written by | Numbered |
|---|---|---|
| `brief` | `/corporate:brief`, filing and `--update` | yes |
| `loop` | `/corporate:design-loop` | yes |
| `design` | `/corporate:design` | yes |
| `plan` | `/corporate:design` | yes |
| `test` | `/corporate:test` | yes |
| `review` | `/corporate:review` | yes |
| `qa` | `/corporate:qa` | no |
| `ops` | `/corporate:deploy --check` | no |
| `deploy` | `/corporate:deploy` | yes |
| `diagnose` | `/corporate:diagnose` | yes |
| `rollback` | `/corporate:rollback` | yes |

`design`, `plan` and `review` are **relocated kinds** — their comment is a
three-line note and the document itself is a file in the repository. See
*Relocated kinds — design, plan and review* below.

**One comment per artifact**, opening with a marker naming the kind and, for a
numbered kind, the number:

```
<!-- corporate:artifact design 1 -->
<!-- corporate:artifact review 2 -->
```

then the artifact exactly as the role returned it — except for a relocated
kind, where the marker is the opening line of the three-line note, not of the
artifact itself. See *Relocated kinds — design, plan and review* below.

Reading the artifact set is one call:

```
gh issue view <n> --repo <owner>/<repo> --json comments
```

Comments come back in order.

**A numbered kind's next number is one more than the highest number already
observed — never the count of them.** Those two agree only while nothing is
missing, and something can always be missing: a comment can be deleted by
somebody with the access to delete it, and counting would then re-use a number.
The sequence of reviews is the record of how many cycles the work took, and
re-using a number destroys it. Two artifacts sharing a kind and a number is a
corrupt record.

**The current artifact of a kind is the newest one.** A stage re-run supersedes
its predecessor by that rule and by no other: it posts a **new** comment of that
kind. Nothing is edited and nothing is deleted, so every draft of a design and a
plan survives. Nothing anywhere may renumber, reorder or rewrite an artifact
that is already recorded.

**The brief in the body is a copy of the newest `brief` artifact.** Filing posts
`brief 1` and writes the same text into the body; `/corporate:brief --update`
posts the next number and rewrites the body's copy from it. The body is the
current view, the numbered comments are the amendment history — which is what
lets the body's copy be replaced at all without a rewrite that no diff would
catch. Every other kind exists only as a comment.

**There is no artifact table.** The comment stream *is* the artifact set: kind,
number and timestamp all come back from the call above, so a table would be a
hand-maintained index of a list the store already returns, and maintaining it
would make every artifact a second, non-atomic write into the body. Render it
into a report when a report needs one.

### Relocated kinds — design, plan and review

`design`, `plan` and `review` do not carry their text on the issue. The
document lives in the repository, at a path derived from the issue number and
the kind: `docs/corporate/<n>/<kind>.md`.

The file is the document byte-for-byte — Markdown, no front matter, no added
header — so a redo's diff shows only what the role actually changed. The
orchestrator writes and commits it; no subagent ever does, for the same reason
no subagent touches the store.

The write-and-commit is one uninterrupted sequence, never split by a dispatch:

```
mkdir -p docs/corporate/<n>
<write the file>
git add docs/corporate/<n>/<kind>.md          # exact paths, never -A
git commit -m "docs(corporate): <kinds> for #<n>"
git rev-parse --short HEAD
```

One stage completion is one commit, staging exactly the files that stage
wrote — the design stage commits `design.md` and `plan.md` together (or
`design.md` alone when the plan is withheld), the review stage commits
`review.md`. A byte-identical file means there is nothing to commit: the
path's current sha comes from `git log -1 --format=%h -- <path>` instead.

What stays on the issue is a three-line note:

```
<!-- corporate:artifact design 2 -->
docs/corporate/18/design.md @ a1b2c3d
Single-pass orchestrator write-and-commit; 2 alternatives rejected.
```

The commit happens **before** the note is posted, never after: a note pointing
at a sha that does not exist yet is unrecoverable, while a committed file with
no note posted is not — the orchestrator can still post the note on retry.

**Reading a relocated document.** Derive the path, then:

1. Read it from the working tree.
2. If it is absent there, `git show corporate/<n>/work:docs/corporate/<n>/<kind>.md`.

If both fail, hard stop naming the path and the branch. **Never fall back to
the note** — it is a pointer, not a copy.

Comparing two versions of a relocated document uses the two notes' shas:
`git log -p -- <path>` walks the whole history, or `git diff <sha-a> <sha-b>
-- <path>` compares two specific revisions.

**The durability trade.** A relocated document now shares the fate of the
branch that carries the work it describes. The pipeline never deletes that
branch or its worktree, so nothing this pipeline does loses a document — only
a human deleting an unmerged branch does, and that deletes the code the
document describes right along with it.

### Over the size cap

**The cap is 65,536 characters, and it is enforced inconsistently.** Test and
deploy artifacts carry verbatim command output and do reach it. `design`,
`plan` and `review` are three-line notes and cannot reach the cap, so the
splitting rule below applies only to the kinds that carry verbatim output.

What was actually measured, against `gh` 2.45, and why the rule is stricter than
the observed behaviour:

| Body size | What happens |
|---|---|
| ≤ 65,536 | accepted, on every path |
| 65,537 – 262,143 | **accepted and stored in full** — `gh` posts over REST, which does not enforce the limit |
| ≥ 262,144 (2^18) | rejected: `GraphQL: Body is too long (maximum is 65536 characters)` |

`gh` changes transport at exactly 256 KiB, and only the second transport
enforces the documented limit — so an oversized artifact is accepted or refused
depending on how far oversized it is, and the refusal quotes a number the
request did not exceed on the path it actually took. Nothing about that is
promised, and a `gh` upgrade can move the threshold under a working deployment.

So: **measure before posting and split at 65,536, whatever the API happens to
let through.** Split at a line boundary into ordered comments:

```
<!-- corporate:artifact test 3 part 1/2 -->
<!-- corporate:artifact test 3 part 2/2 -->
```

and say in the report that it was split. **Never truncate** — the verbatim
output is the evidence the artifact exists to preserve, and a silently shortened
log is a review classifying a defect it cannot see. A size rejection is a
`Blocked`, not a retry: retrying an unsplit body fails identically.

## The activity log

One line per completed stage, appended, never edited:

```
- <YYYY-MM-DD HH:MM> · <stage> · <who> · <what came of it, one clause>
```

`<who>` is the role dispatched, or `orchestrator` for a state change, a merge, a
push, a pull request or a repair. The line records an outcome, not a narration:
what was decided or what failed, never what was read along the way. A stage that
produced no artifact still logs — a `Blocked` transition with no line explaining
it is the one failure mode this log exists to prevent.

**One comment per line**, opening with a marker:

```
gh issue comment <n> --repo <owner>/<repo> --body-file -
```

```
<!-- corporate:log -->
- 2026-09-04 14:02 · design · technical-architect · single-pass parser over the existing reader; 2 alternatives rejected
```

An append is a POST: atomic, no read, nothing to lose an update against, and the
ordering and timestamps come from GitHub rather than from the model. That is
what makes the log append-only here in the same sense it is append-only on a
filesystem.

## States and transitions

There are exactly four states: `Draft`, `Open`, `Blocked`, `Closed`. An issue is
in one of them and nowhere else.

| From | To | Who | When |
|---|---|---|---|
| — | `Draft` | `brief` | an issue is filed |
| `Draft` | `Open` | **user only** | the user promotes it |
| `Open` | `Blocked` | orchestrator | a `required-missing` stack, the retry cap, or a plan defect it cannot resolve |
| `Open` | `Closed` | orchestrator | the review passed and the pull request is open |
| `Blocked` | `Open` | **user only** | the user resolved the blocker |
| `Closed` | `Open` | **user only** | the work came back |

Nothing else is legal. In particular: nothing files straight into `Open`,
nothing moves an issue out of `Blocked` on its own, and no state is ever skipped
— an issue reaching `Closed` passed through `Open`.

**Work is assigned on `Open` and only on `Open`.** `/corporate:run` refuses any
other state and says which one it found. `Draft` is the user's queue of things
not yet started; that gate is the whole reason the state exists.

`Closed` means *reviewed, and the pull request is open*. It does not mean
merged, shipped or abandoned. Nothing in this plugin merges a pull request.

### How a state is recorded

| State | GitHub status | Label |
|---|---|---|
| `Draft` | open | `Draft` |
| `Open` | open | `In progress` |
| `Blocked` | open | `Blocked` |
| `Closed` | **closed** | none of the three |

Two things record one state, so precedence is explicit:

- **The open/closed status always wins.** Closed ⇒ `Closed`, whatever the
  labels say. A closed issue still carrying a state label is repaired by
  removing the label, and the repair is logged.
- An **open** issue with zero, or with two or more, state labels cannot be read
  unambiguously. That is corrupt: stop and name the issue URL. Do not guess, and
  do not pick the first one.

**"User only" is an intent, not an enforcement.** The record is a shared object:
**anyone who can edit a label on this repository can promote a `Draft`**, and
`/corporate:run` will act on it unattended. That is a repository write
permission, and it is the price of a tracker the team can see.

### Making a transition

Exactly these four steps, in this order:

1. Record the new state.
2. Update `blocked_reason` — set it if the target is `Blocked`, clear it if the
   source was — and `closed_reason` if the target is `Closed`.
3. Append the activity line, `<who>` = `orchestrator`.
4. Say the transition out loud in the report, naming both states.

Never record a state without steps 2–4. A state change nobody can see in the log
is a state change nobody can audit.

Step 1 in `gh`. A label swap is **one call**, so no swap can be interrupted into
a half state:

```
gh issue edit <n> --repo <owner>/<repo> --remove-label Draft --add-label "In progress"
```

The two transitions that also change the status take two calls, and **the order
is load-bearing**: each is ordered so that the window between them holds the
state the precedence rule above repairs by itself.

| Transition | Calls, in this order |
|---|---|
| `Draft` → `Open` | one swap: remove `Draft`, add `In progress` |
| `Open` → `Blocked` | one swap: remove `In progress`, add `Blocked` |
| `Open` → `Closed` | `gh issue close <n> --reason completed`, **then** remove `In progress` |
| `Blocked` → `Open` | one swap: remove `Blocked`, add `In progress`. The issue is already open; there is nothing to reopen |
| `Closed` → `Open` | add `In progress` — labels are settable on a closed issue — **then** `gh issue reopen <n>` |

Inverting either two-call order leaves "open with no state label", which is
corrupt and needs a human. The orders above leave "closed with a state label",
which the next command repairs and logs. Do not tidy them into one shape.

**Never assert a state you did not read back.** After step 1, read the state
back and confirm it is the one you meant to set:

```
gh issue view <n> --repo <owner>/<repo> --json state,labels
```

A store whose write can fail is a store whose report can lie, and a stated
state that was never recorded is worse than a failed transition — the failure is
visible and the lie is not.

`--reason completed` is not a corporate state and cannot be read back through
`--json` in every `gh`; `closed_reason` in the marker block is what records why
an issue closed. Corporate `Closed` means *reviewed, pull request open* — so
say that in the marker block, because to anyone reading the repository a closed
issue with an open pull request reads as abandoned. For the same reason the
pull request body must not contain a `Closes #<n>` keyword: GitHub would try to
close the issue a second time when the branch merges.

## Finding an issue

One call. No list, no `--search`, no label filter:

```
gh issue view <n> --repo <owner>/<repo> --json number,state,labels,title,body
```

Three outcomes:

- **found, and it carries the `corporate` label** — that is the issue.
- **404** — the issue does not exist. Say so and name `/corporate:brief --list`.
- **found, without the `corporate` label** — an issue in this repository that
  this pipeline did not file. **Hard stop**, naming the URL: it has no marker
  block, so every field read would be a guess. Never adopt it.

`--search` is rejected wherever a lookup is needed: its index is stale and
fuzzy, and a tracker lookup that is eventually consistent is a tracker lookup
that misses records that exist.

## Listing and counting

```
gh issue list --repo <owner>/<repo> --label corporate --label "In progress" --state open --json number,title,createdAt
gh issue list --repo <owner>/<repo> --label corporate --state closed --json number,title,createdAt
```

Newest first is `createdAt` descending; the grouped order is `Open`, `Draft`,
`Blocked`, `Closed`. `--limit` defaults to 30, so pass one high enough for the
backlog and say so if a readout was capped — a truncated list that does not
admit it is a lie about the backlog.

## Corruption

A record whose state cannot be read unambiguously, or a kind and number held by
two artifacts, is **corrupt**: stop, say exactly what you found, and name the
issue URL. Never guess which one is current.

Two keys claiming one issue is impossible — GitHub assigns the number — so the
only corruption left is the two cases above and the closed-with-a-label case the
precedence rule repairs by itself.

**Two sessions working one issue is unsupported.** Two sessions working two
issues is the point, and is what the per-issue branch and worktree exist for.

## Failure modes

The failure channel and the recording channel are the same: a run can be unable
to reach `Blocked` *and* unable to log why. `/corporate:run` therefore carries a
fourth terminal outcome, `store-unreachable`, and this table is what routes into
it.

| Failure | What to do |
|---|---|
| a write times out, or fails ambiguously after the request may have landed | re-read the record and check whether the marker or the field is already there. Retry **only if absent**. `gh` does not retry writes, and a blind retry double-posts an artifact |
| rate limit, or 5xx | up to 3 retries, backing off. Then `Blocked`. If even that write fails, `store-unreachable` |
| 401 mid-run — the token expired | hard stop. Never an assumed state. Preflight proved nothing about an hour later |
| removing a label that is not there | a no-op, not a failure. Adding one that is there is the same |
| `close` on a closed issue, `reopen` on an open one | treat as satisfied |
| a state label a human deleted | re-create it idempotently, log that it was re-created, carry on |
| issues switched off mid-run | `store-unreachable` |
| a body or comment over the cap | split, per *Over the size cap* |
| the read-back after a transition disagrees | stop and name the URL. Do not write again |

And the standing rule that matters most here: **never assert a state you did not
read back.** A turn that prints a state it failed to record is the plugin lying
about its tracker, and it is the likeliest way this store goes wrong — because
printing the line is easier than setting the state.

## Never

Some of these are things an administrator can still do — delete an issue, delete
a comment — which is what the repair rules above are for. They are things *this
plugin* does not do.

- Invent a fallback because a `gh` call failed. There is nowhere else to file.
- `gh issue comment --edit-last`, or any `gh api` call that could edit or delete
  a comment.
- Write a temp file inside a worktree.
- Parse anything below `<!-- corporate:end -->`.
- Put a `Closes #<n>` keyword in a pull request body.
- Re-serialise the whole body to add a log line or an artifact. Those are
  comments; the body holds the fields and the brief.
- Write an issue, or any of the eight non-relocated kinds, inside the
  consuming repository. Those artifacts are records of decisions about the
  code, not part of it; they outlive the branch and must survive it being
  deleted. `design`, `plan` and `review` are the exception — see *Relocated
  kinds* above.
- Post the full text of a design, plan or review as a comment. It is a file
  now; the comment is the note.
- Edit the brief of a filed issue. It is replaced only by
  `/corporate:brief --update`, which asks first and posts the replacement as the
  next `brief` artifact before it touches the body. There is no in-place edit,
  and no other command may write the brief.
- Edit, renumber or delete an artifact that is already recorded. A second review
  is `review` number 2.
- Rewrite or reorder the activity log. It is append-only.
- Delete a record. `Closed` is how work ends.
- Adopt an issue that does not carry the `corporate` label.
