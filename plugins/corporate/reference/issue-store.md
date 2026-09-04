# The issue store

The tracker. Issues live here, their state is here, and every artifact the
pipeline produces — design, plan, test report, review — is filed here beside the
issue that caused it. `/corporate:brief` files, `/corporate:ship` works and
records.

This file is the **contract**: what a record holds, what the states are, how a
transition happens, what a slug is, and what nobody may do. It is backend-neutral
and names no file, folder, label or command.

**How a record is actually stored is the mapping's business**, and there is one
mapping per backend:

| Backend | Mapping |
|---|---|
| `local` | `${CLAUDE_PLUGIN_ROOT}/reference/issue-store-local.md` |
| `github` | `${CLAUDE_PLUGIN_ROOT}/reference/issue-store-github.md` |

Resolve the backend first, then read its mapping. The mapping gives a concrete
recipe for each rule below, in the same order, so the two read side by side. It
restates no rule stated here, and this file restates no recipe.

## The orchestrator owns the store

**No subagent reads the store, and no subagent writes to it.** A dispatched role
returns its artifact as its final message and a short report; the orchestrator
records the artifact and appends the log line. Everything a role needs is
inlined into its dispatch brief.

This is not a convention, it is the reason the design works. On `local` the
store sits outside every worktree, so an agent granted access would need write
permission on a directory unrelated to the repository it is changing. On
`github` it is a write to a remote the role was never told about. One writer
also means the activity log is a single ordered account rather than N agents
racing.

## Configuration

Where the backend is read from, in order. **First hit wins:**

1. `.claude/settings.json` → `env.CORPORATE_ISSUES` — what `--use` writes
2. `.claude/settings.local.json` → the same key
3. `~/.claude/settings.json` → the same key
4. the `CORPORATE_ISSUES` environment variable

Read these as files. Absent from all four means `local`, which is the default.

| Value | Backend |
|---|---|
| `local` | markdown files under the local store |
| `github` | GitHub Issues on the repository `origin` points at |
| `github:owner/repo` | **not available in this version** |

`github:owner/repo` is deferred, and the reason is the slug space. `local`
namespaces the store per repository, and `github` inherits that by pointing at
`origin`. An explicit third-party tracker does not: two projects filing into one
repository share one flat set of slugs, so the collision rule fires across
unrelated work, a backlog readout shows another project's issues, and a slug can
resolve to a record whose branch exists only in the other repository — which is
how an autonomous run enters a worktree for the wrong codebase. A configuration
that resolves to it is a **hard stop**: name the value, name the source it came
from, and say the form is unimplemented rather than quietly filing somewhere the
user did not ask for.

An unrecognised value is the same stop.

**Always name the source you resolved from.** A key left in
`~/.claude/settings.json` makes every project look the same, and a project that
believes it is local would otherwise behave in a way nobody can explain.

### The repository key

Both backends identify the project the same way. `<repo-key>` is derived, in
this order:

1. `git remote get-url origin` parses to a host path ⇒ `<owner>-<repo>`, with
   any `.git` suffix dropped.
2. Otherwise the basename of `git rev-parse --show-toplevel`.
3. Outside a repository ⇒ stop. There is no project to file against.

`local` uses it to separate one project's issues from another's. `github`
records it on the issue, so a record always says which project it belongs to.

## The record

One issue is one record. A record holds exactly four things:

| Part | What it is |
|---|---|
| the fields | the small mutable header below |
| the brief | the product owner's text, **verbatim**, never edited |
| the artifact set | the artifacts the stages produced, each with a kind and, where the kind is numbered, a number |
| the activity log | one line per completed stage, appended, never edited |

The fields:

```
slug            assigned by the store, never invented by the user
title           the issue's title
created         YYYY-MM-DD
backend         the backend that wrote this record
repo_key        the project, derived as above
branch          corporate/<slug>/work — empty until the run that fills it
worktree        the run's worktree path — machine-local and advisory
pr              the pull request URL — empty until close-out
blocked_reason  one sentence, set on entering Blocked, cleared on leaving
closed_reason   why the issue closed, where the backend can record it
```

The state is **not** a field. It is recorded by the backend and read from the
backend; see *States and transitions*.

`worktree` is advisory because it names a path on one machine. A run that finds
a recorded path that does not exist re-derives it and rewrites the field; it
never treats the absence as an error.

### Artifact kinds

Nine, and each stage writes exactly one kind:

| Kind | Written by | Numbered |
|---|---|---|
| `design` | `/corporate:design` | no |
| `plan` | `/corporate:plan` | no |
| `test` | `/corporate:test` | yes |
| `review` | `/corporate:review` | yes |
| `qa` | `/corporate:qa` | no |
| `ops` | `/corporate:deploy --check` | no |
| `deploy` | `/corporate:deploy` | yes |
| `diagnose` | `/corporate:diagnose` | yes |
| `rollback` | `/corporate:rollback` | yes |

A command names the **kind**, never a filename. Whether a kind is a file, a
comment or a row is the mapping's answer, and a command that names a file has
picked a backend it was not asked to pick.

**A numbered kind's next number is one more than the highest number already
observed — never the count of them.** Those two agree only while nothing is
missing, and something can always be missing: the sequence of reviews is the
record of how many cycles the work took, and re-using a number destroys it. Two
artifacts sharing a kind and a number is a corrupt record.

**The current artifact of a kind is the newest one.** A stage re-run supersedes
its predecessor by that rule and by no other; how much of the older one survives
is the mapping's business, and the two backends do differ. Nothing anywhere may
renumber, reorder or rewrite an artifact that is already recorded.

### The activity log

One line per completed stage, appended, never edited:

```
- <YYYY-MM-DD HH:MM> · <stage> · <who> · <what came of it, one clause>
```

`<who>` is the role dispatched, or `orchestrator` for a state change, a merge, a
push, a pull request or a repair. The line records an outcome, not a narration:
what was decided or what failed, never what was read along the way. A stage that
produced no artifact still logs — a `Blocked` transition with no line explaining
it is the one failure mode this log exists to prevent.

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

**Work is assigned on `Open` and only on `Open`.** `/corporate:ship` refuses any
other state and says which one it found. `Draft` is the user's queue of things
not yet started; that gate is the whole reason the state exists.

`Closed` means *reviewed, and the pull request is open*. It does not mean
merged, shipped or abandoned. Nothing in this plugin merges a pull request.

**"User only" is an intent, not always an enforcement.** On `local` nothing but
the user can reach the store. On a backend where the record is a shared object,
anyone with write access to it can promote a `Draft`, and an unattended run will
act on that. The mapping says what that access actually is; a team pointing the
pipeline at a shared tracker is choosing to let the tracker's writers start
autonomous runs.

### Making a transition

Exactly these four steps, in this order:

1. Record the new state, per the mapping.
2. Update `blocked_reason` — set it if the target is `Blocked`, clear it if the
   source was — and `closed_reason` if the target is `Closed`.
3. Append the activity line, `<who>` = `orchestrator`.
4. Say the transition out loud in the report, naming both states.

Never record a state without steps 2–4. A state change nobody can see in the log
is a state change nobody can audit.

**Never assert a state you did not read back.** After step 1, read the state
from the store and confirm it is the one you meant to set. A backend whose write
can fail is a backend whose report can lie, and a stated state that was never
recorded is worse than a failed transition — the failure is visible and the lie
is not.

## Slugs

The store assigns the slug; the user never invents one. Kebab-case, derived from
the brief's title, at most five words. On collision with an existing slug **in
any state**, append `-2`, then `-3`. Never overwrite.

Every command downstream takes the slug as its first argument, so a slug must
never contain a space, a slash, or an uppercase letter. It also names a git
branch (`corporate/<slug>/work`), so it must be a legal ref path segment.

## Finding an issue

The mapping says how a slug resolves to a record. Whatever the recipe, the
outcome is one of three:

- **exactly one hit** — that is the issue.
- **no hit** — the issue does not exist. Say so and name
  `/corporate:brief --list`.
- **more than one hit** — a corrupt store; see below.

## Corruption, and getting out of it

A record whose state cannot be read unambiguously, or a slug held by two
records, or a kind and number held by two artifacts, is **corrupt**: stop, say
exactly what you found, and name the record. Never guess which one is current.

Two rules keep corruption from being a dead end, because an unattended run that
reaches one still has to reach a terminal state:

- **Two records claiming one slug**: the older record keeps the slug; the newer
  is re-slugged with the next free suffix, and the change is logged on it. Name
  both records in the report. This is the resolution of a check-then-act race —
  two sessions filing the same ask at the same moment — not a licence to
  de-duplicate work by hand.
- **A state recorded two ways that disagree**: the mapping names which one is
  authoritative and how the other is repaired. The repair is logged. Never move
  the authoritative record to match the derived one.

**Two sessions working one slug is unsupported on every backend.** Two sessions
working two slugs is the point, and is what the per-issue branch and worktree
exist for.

## Never

These are things this plugin does not do. On a backend the plugin does not own,
they are not things that cannot happen — an administrator can delete an issue or
a comment, and the repair rules above are why.

- Write an issue, or any artifact, inside the consuming repository. Artifacts
  are records of decisions about the code, not part of it; they outlive the
  branch and must survive it being deleted.
- Edit the brief of a filed issue. The brief is replaced only by
  `/corporate:brief` asking first.
- Edit, renumber or delete an artifact that is already recorded. A second review
  is `review` number 2.
- Rewrite or reorder the activity log. It is append-only.
- Delete a record. `Closed` is how work ends.
- Name a file, a folder or a label in a command. Name the kind, the state or the
  field, and let the mapping answer.
