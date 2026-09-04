# The issue store — the `github` mapping

The `github` backend of `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md`. That
file owns the rules; this one is the recipe, in the same order. Read the
contract first — nothing here repeats it, and nothing here overrides it.

The record is a GitHub issue on the repository `origin` points at. That is the
whole appeal: the backlog is visible to everyone who can see the repository, a
`Draft` can be promoted from a phone, and a `Blocked` issue explains itself to
somebody who is not running the pipeline. It is also the whole cost: **every
store read and every store write is a network call to a repository this plugin
does not own**, so most of this file is about what happens when one fails.

On a public repository the briefs, designs, plans, reviews and test output are
world-readable, permanently. `/corporate:brief --use github` says so once, and
this backend does not ask again.

## Toolchain

`gh`, and nothing else. No `git` command reads or writes this store, and no
direct `gh api` call is used where a subcommand exists — `gh api` against the
comments endpoint can edit and delete, which the contract forbids, so it stays
out of reach.

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
this backend is built around.

## Preflight

Before the first store operation of any command, in this order:

| Check | Command |
|---|---|
| `gh` is installed | `gh --version` |
| authenticated | `gh auth status` |
| the target resolves | `git remote get-url origin` parses to a `github.com` (or GHES) host path |
| issues are on | `gh repo view <owner>/<repo> --json hasIssuesEnabled,visibility` |
| writes are permitted | one write-shaped call the run needs anyway — the label bootstrap on `--use`, otherwise `gh issue edit` of a field to its current value |

Any failure is a **hard stop** that names the check and the fix. **Never fall
back to `local`.** A configuration the user wrote on purpose, quietly answered
by a different tracker, is the failure mode the contract's hard stops exist to
prevent — and the issue would be filed where nobody is looking for it.

The write-shaped check earns its place: a permission denial and an
authentication failure look nothing alike to the user and identical to a naive
report, and a user told "not authenticated" when the real answer is "`gh issue
edit` is not on the allowlist" will re-run `gh auth login` and get nowhere.

An origin that is not GitHub is a hard stop naming `--use local` as the fix.
`github:owner/repo` is not available; the contract says why.

## Target and labels

The target repository is `origin`'s `<owner>/<repo>`. `<repo-key>` is still
derived per the contract and recorded on the issue, so a record always names its
project even though this backend has only one.

Four labels carry the mapping. `/corporate:brief --use github` creates them
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

Each record also carries `corporate:slug:<slug>`, created at filing time. See
*Finding an issue*.

## Recording a state

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
  unambiguously. That is corrupt per the contract: stop and name the issue URL.
  Do not guess, and do not pick the first one.

### The transitions

A label swap is **one call**, so no swap can be interrupted into a half state:

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
| `Blocked`/`Closed` → `Open` | add `In progress` — labels are settable on a closed issue — **then** `gh issue reopen <n>` |

Inverting either two-call order leaves "open with no state label", which is
corrupt and needs a human. The orders above leave "closed with a state label",
which the next command repairs and logs. Do not tidy them into one shape.

Then continue with the contract's steps 2–4, and read back:
`gh issue view <n> --repo <owner>/<repo> --json state,labels`.

`--reason completed` is not a corporate state and cannot be read back through
`--json` in every `gh`; `closed-reason` in the marker block is what records why
an issue closed. Corporate `Closed` means *reviewed, pull request open* — so
say that in the marker block, because to anyone reading the repository a closed
issue with an open pull request reads as abandoned. For the same reason the
pull request body must not contain a `Closes #<n>` keyword: GitHub would try to
close the issue a second time when the branch merges.

**Anyone who can edit a label on this repository can promote a `Draft`**, and
`/corporate:ship` will act on it unattended. The contract flags this; here it is
concretely a repository write permission, and it is the price of a tracker the
team can see.

## The record

**The issue body is written once at filing and edited only for a field.** The
brief is in it verbatim, the contract forbids editing a brief, and a
read-modify-write of the whole body by a language model — twelve to eighteen
times in a `ship` run — is how a brief gets silently reflowed and a log line
silently dropped, with no diff to catch either. So the body is small and nearly
immutable, and everything that grows lives in comments.

The title is the issue title. The fields are one HTML comment at the top of the
body, with a terminator:

```
<!-- corporate
slug: json-output-flag
created: 2026-09-04
backend: github
repo_key: chrisob194-corporate
branch: corporate/json-output-flag/work
worktree: /home/x/proj/.claude/worktrees/corporate/json-output-flag/work
pr:
blocked_reason:
closed_reason:
-->
<!-- corporate:end -->

<the brief, exactly as the product owner wrote it>
```

There is no `state:` key. The status and the label are authoritative, and a
mirrored key would only be drift waiting to be repaired.

`<!-- corporate:end -->` is a **hard terminator. Nothing below it is ever
parsed.** A brief can legitimately contain `slug: something` or `## Activity
log` — briefs about this very plugin do — so what separates the record from the
prose is position, never a pattern match.

Editing a field — `branch`, `worktree`, `pr`, `blocked_reason`, `closed_reason`
— is read, replace that one line, write:

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

## The activity log

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

## Artifacts

**One comment per artifact**, opening with a marker naming the kind and, for a
numbered kind, the number:

```
<!-- corporate:artifact design -->
<!-- corporate:artifact review 2 -->
```

then the artifact exactly as the role returned it.

Reading the artifact set is one call:

```
gh issue view <n> --repo <owner>/<repo> --json comments
```

Comments come back in order. The next number for a kind is one more than the
**highest** number observed in those markers — never the count of them, per the
contract; a comment can be deleted by somebody with the access to delete it, and
counting would then re-use a number. Two comments carrying the same kind and
number is corrupt.

**There is no artifact table on this backend.** The comment stream *is* the
artifact set: kind, number and timestamp all come back from the call above, so a
table would be a hand-maintained index of a list the store already returns, and
maintaining it would make every artifact a second, non-atomic write into the
body. Render it into a report when a report needs one.

Superseding: a re-run posts a **new** comment of that kind, and the newest
comment of a kind is the current one. Nothing is edited and nothing is deleted,
so this backend keeps every draft of a design and a plan while `local` keeps
only the last. That difference is real and accepted; the invariant both satisfy
is the contract's.

### Over the size cap

An issue body or a comment is capped at 65,536 characters, and the API answers
422 above it. Test and deploy artifacts carry verbatim command output and do hit
this.

Measure before posting. Over the cap, split at a line boundary into ordered
comments:

```
<!-- corporate:artifact test 3 part 1/2 -->
<!-- corporate:artifact test 3 part 2/2 -->
```

and say in the report that it was split. **Never truncate** — the verbatim
output is the evidence the artifact exists to preserve, and a silently shortened
log is a review classifying a defect it cannot see. A 422 that is not a size
problem is a `Blocked`, not a retry.

## Finding an issue

The slug is a label, and resolution is one server-filtered call:

```
gh issue list --repo <owner>/<repo> --label corporate --label "corporate:slug:<slug>" --state all --json number,state,labels,title
```

Zero, one or more than one hit, read per the contract.

The label is what makes this sound. The obvious alternative — listing the
corporate issues and matching `slug:` inside each body — pulls hundreds of
kilobytes of records into the orchestrator's context before every store
operation, asks a language model to match a key by eye against prose that may
contain the same key, and turns the list's page limit into silent truncation: an
issue past the limit "does not exist", so `brief` files a duplicate. `--search`
is also rejected — its index is stale and fuzzy, and a tracker lookup that is
eventually consistent is a tracker lookup that files duplicates.

The cost is one label per issue. They all share the `corporate:slug:` prefix, so
they filter and delete together.

Create it with the issue:

```
gh label create "corporate:slug:<slug>" --repo <owner>/<repo> --description "corporate record" --force
gh issue create --repo <owner>/<repo> --title "<title>" --body-file - --label corporate --label Draft --label "corporate:slug:<slug>"
```

Filing is: derive the slug, resolve it to prove it is free, create the label,
create the issue, post the filing log comment.

## Listing and counting

```
gh issue list --repo <owner>/<repo> --label corporate --label "In progress" --state open --json number,title,createdAt
gh issue list --repo <owner>/<repo> --label corporate --state closed --json number,title,createdAt
```

Newest first is `createdAt` descending; the grouped order is `Open`, `Draft`,
`Blocked`, `Closed`. `--limit` defaults to 30, so pass one high enough for the
backlog and say so if a readout was capped — a truncated list that does not
admit it is the same defect as a truncated lookup.

## Failure modes

The failure channel and the recording channel are the same here, which is the
one structural difference from `local`: a run can be unable to reach `Blocked`
*and* unable to log why. `/corporate:ship` therefore carries a fourth terminal
outcome, `store-unreachable`, and this table is what routes into it.

| Failure | What to do |
|---|---|
| a write times out, or fails ambiguously after the request may have landed | re-read the record and check whether the marker or the field is already there. Retry **only if absent**. `gh` does not retry writes, and a blind retry double-posts an artifact |
| rate limit, or 5xx | up to 3 retries, backing off. Then `Blocked`. If even that write fails, `store-unreachable` |
| 401 mid-run — the token expired | hard stop. Never a fallback, never an assumed state. Preflight proved nothing about an hour later |
| removing a label that is not there | a no-op, not a failure. Adding one that is there is the same |
| `close` on a closed issue, `reopen` on an open one | treat as satisfied |
| a state label a human deleted | re-create it idempotently, log that it was re-created, carry on |
| issues switched off mid-run | `store-unreachable` |
| a body or comment over the cap | split, per *Over the size cap* |
| the read-back after a transition disagrees | stop and name the URL. Do not write again |

And the standing rule the contract states, which matters most here: **never
assert a state you did not read back.** A turn that prints a state it failed to
record is the plugin lying about its tracker, and it is the likeliest way this
backend goes wrong — because printing the line is easier than setting the state.

## Never

- Fall back to `local` because a `gh` call failed.
- `gh issue comment --edit-last`, or any `gh api` call that could edit or delete
  a comment.
- Write a temp file inside a worktree.
- Parse anything below `<!-- corporate:end -->`.
- Put a `Closes #<n>` keyword in a pull request body.
- Re-serialise the whole body to add a log line or an artifact. Those are
  comments; the body holds the fields and the brief.
