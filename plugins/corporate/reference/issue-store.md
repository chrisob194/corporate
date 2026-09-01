# The issue store

The tracker. Issues live here, their state is here, and every artifact the
pipeline produces — design, plan, review — is filed here beside the issue that
caused it. `/corporate:brief` files, `/corporate:ship` works and records. This
file is the only definition of the layout, the states and the transitions — do
not restate them anywhere else.

The store is deliberately **outside the working tree**. An issue is backlog and
its artifacts are records of a decision; neither is a change to the software.
Filing one must never dirty a repository, need a branch, or land on whatever
happens to be checked out. It is also what lets several Claude Code instances
work different issues at once without sharing anything but the tracker.

## The orchestrator owns the store

**No subagent reads the store, and no subagent writes to it.** A dispatched role
returns its artifact as its final message and a short report; the orchestrator
writes the file, adds the artifact row and appends the log line. Everything a
role needs is inlined into its dispatch brief.

This is not a convention, it is the reason the design works: the store lives
outside every worktree, so an agent granted access to it would need write
permission on a directory unrelated to the repository it is changing. One writer
also means the activity log is a single ordered account rather than N agents
racing on one file.

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
| `github`, `github:owner/repo` | **not available in this version** |

The GitHub backend is deferred: the four states, the per-issue artifact folder
and the activity log have no settled mapping onto issues, labels and comments
yet, and half a mapping would silently lose artifacts. A configuration that
resolves to `github` is a **hard stop** — name the value, name the source it
came from, and say the backend is unimplemented rather than quietly filing
locally under a configuration the user wrote on purpose.

An unrecognised value is the same stop.

**Always name the source you resolved from.** A key left in
`~/.claude/settings.json` makes every project look the same, and a project that
believes it is local would otherwise behave in a way nobody can explain.

## Layout

```
~/.corporate-issues/<repo-key>/
  Draft/<slug>/issue.md
  Open/<slug>/issue.md  design.md  plan.md  test-1.md  review-1.md  review-2.md
  Blocked/<slug>/…
  Closed/<slug>/…
```

The root is `~/.corporate-issues/`, not `~/.corporate/`. The latter name is taken
by the HR records directory *inside a consuming project* — two unrelated things
one character apart is a defect, so the issue store keeps its own root.

`<repo-key>` is derived, in this order:

1. `git remote get-url origin` parses to a host path ⇒ `<owner>-<repo>`, with
   any `.git` suffix dropped.
2. Otherwise the basename of `git rev-parse --show-toplevel`.
3. Outside a repository ⇒ stop. There is no project to file against.

**The state is the folder.** There are exactly four, spelled exactly as above.
An issue is in one of them and nowhere else; a slug appearing under two states
is a corrupt store — report it and stop rather than guessing which is current.

One folder per issue. `issue.md` is always present; the artifacts appear as the
stages that produce them complete. Reviews and test reports are numbered from 1
and never overwritten — the sequence of reviews is the record of how many cycles
the work took, and the sequence of test reports is the record of how many times
the branch was measured.

## `issue.md`

```markdown
---
slug: json-output-flag
title: Add a --json flag to the CLI
created: 2026-08-23
state: Open
backend: local
branch: corporate/json-output-flag/work
worktree: /home/x/proj/.claude/worktrees/corporate/json-output-flag/work
pr:
blocked_reason:
---

<the brief, exactly as the product owner wrote it>

## Artifacts

| Artifact | File | Stage | Written | Note |
|---|---|---|---|---|
| design | design.md | design | 2026-09-01 14:02 | stack readiness: covered |
| plan | plan.md | plan | 2026-09-01 14:19 | 6 tasks, 3 waves |
| test 1 | test-1.md | test | 2026-09-01 14:58 | pass · 2 suites, e2e not required |
| review 1 | review-1.md | review | 2026-09-01 15:04 | blocked · origin: implementation |

## Activity log

- 2026-09-01 14:02 · design · technical-architect · single-pass parser over the existing reader; 2 alternatives rejected
- 2026-09-01 14:19 · plan · planner · 6 tasks, 3 waves
- 2026-09-01 14:58 · test · tester · 2 suites pass, e2e skipped as not-required
- 2026-09-01 15:04 · review · reviewer · blocked, origin implementation, T4 acceptance fails
```

The body below the frontmatter is the product owner's brief verbatim. The two
sections after it belong to the orchestrator and to nobody else.

`branch`, `worktree` and `pr` are empty until the run that fills them.
`blocked_reason` is one sentence, set when the state becomes `Blocked` and
cleared when it leaves.

`state:` mirrors the folder. **The folder is authoritative.** On a mismatch,
rewrite the key from the folder and log it — never move a folder to match a key.

### The activity log

One line per completed stage, appended, never edited:

```
- <YYYY-MM-DD HH:MM> · <stage> · <who> · <what came of it, one clause>
```

`<who>` is the role dispatched, or `orchestrator` for a state change, a merge, a
push or a PR. The line records an outcome, not a narration: what was decided or
what failed, never what was read along the way. A stage that produced no
artifact still logs — a `Blocked` transition with no line explaining it is the
one failure mode this log exists to prevent.

## States and transitions

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

### Making a transition

Exactly these four steps, in this order:

1. `mv <From>/<slug> <To>/<slug>` — create `<To>/` if it is absent.
2. Rewrite `state:` in `issue.md`, and `blocked_reason:` if the target is
   `Blocked` (set it) or the source is (clear it).
3. Append the activity line, `<who>` = `orchestrator`.
4. Say the transition out loud in the report, naming both states.

Never move a folder without steps 2–4. A state change nobody can see in the log
is a state change nobody can audit.

## Slugs

The store assigns the slug; the user never invents one. Kebab-case, derived from
the brief's title, at most five words. On collision with an existing slug **in
any state**, append `-2`, then `-3`. Never overwrite.

Every command downstream takes the slug as its first argument, so a slug must
never contain a space, a slash, or an uppercase letter. It also names a git
branch (`corporate/<slug>/work`), so it must be a legal ref path segment.

## Finding an issue

The slug alone does not say where it is. Resolve it by looking in all four state
folders and taking the one hit:

```
ls -d ~/.corporate-issues/<repo-key>/*/<slug>/ 2>/dev/null
```

No hit ⇒ the issue does not exist; say so and name `/corporate:brief --list`.
More than one hit ⇒ a corrupt store, per *Layout* above.

## Never

- Write an issue, or any artifact, inside the consuming repository. Artifacts
  are records of decisions about the code, not part of it; they outlive the
  branch and must survive it being deleted.
- Edit the brief body of a filed issue. The brief is replaced only by
  `/corporate:brief` asking first.
- Edit or renumber an existing artifact file. A second review is `review-2.md`.
- Rewrite or reorder the activity log. It is append-only.
- Delete an issue folder. `Closed` is how work ends.
- Push, pull, or commit anything here. This store is not version-controlled by
  us.
