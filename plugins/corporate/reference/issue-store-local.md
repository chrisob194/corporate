# The issue store — the `local` mapping

The `local` backend of `${CLAUDE_PLUGIN_ROOT}/reference/issue-store.md`. That
file owns the rules; this one is the recipe, in the same order. Read the
contract first — nothing here repeats it, and nothing here overrides it.

The store is deliberately **outside the working tree**. An issue is backlog and
its artifacts are records of a decision; neither is a change to the software.
Filing one must never dirty a repository, need a branch, or land on whatever
happens to be checked out. It is also what lets several Claude Code instances
work different issues at once without sharing anything but the tracker.

## Preflight

None. The store is a directory in the user's home; it is created by the first
write and needs no authentication and no network.

## Layout

```
~/.corporate-issues/<repo-key>/
  Draft/<slug>/issue.md
  Open/<slug>/issue.md  design.md  plan.md  test-1.md  review-1.md  review-2.md
  Blocked/<slug>/…
  Closed/<slug>/…
```

The root is `~/.corporate-issues/`, not `~/.corporate/`. The latter name is
taken by the HR records directory *inside a consuming project* — two unrelated
things one character apart is a defect, so the issue store keeps its own root.

One folder per issue. `issue.md` is always present; the artifacts appear as the
stages that produce them complete.

## The record — `issue.md`

The fields are YAML frontmatter, the brief is the body, and the artifact set and
the activity log are two sections after it:

```markdown
---
slug: json-output-flag
title: Add a --json flag to the CLI
created: 2026-08-23
state: Open
backend: local
repo_key: chrisob194-corporate
branch: corporate/json-output-flag/work
worktree: /home/x/proj/.claude/worktrees/corporate/json-output-flag/work
pr:
blocked_reason:
closed_reason:
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

`state:` is here because the folder is invisible from inside the file. **The
folder is authoritative.** On a mismatch, rewrite the key from the folder and
log the repair — never move a folder to match a key.

## Artifacts

One file per artifact, named for its kind: `design.md`, `plan.md`, `qa.md`,
`ops.md`, and `test-<n>.md`, `review-<n>.md`, `deploy-<n>.md`,
`diagnose-<n>.md`, `rollback-<n>.md` for the numbered kinds. Filing one is three
writes: the file, its row in `## Artifacts`, and the activity line.

`<n>` is one more than the highest `<n>` present for that kind — read the
directory, do not count the rows.

The newest artifact of a kind is the current one, and here that is achieved by
**replacement**: a re-run of `design` or `plan` overwrites `design.md` or
`plan.md`, which the hand-driven commands ask about first and `/corporate:ship`
does as a route sends it back. The numbered kinds are never overwritten — a
second review is `review-2.md`, and the sequence is the record.

## Finding an issue

The slug alone does not say which state it is in. Look in all four folders and
take the one hit:

```
ls -d ~/.corporate-issues/<repo-key>/*/<slug>/ 2>/dev/null
```

No hit ⇒ the issue does not exist. More than one hit ⇒ a slug under two states,
which is corrupt per the contract.

Reading what a record already holds — which stages are done, which review is
newest — is `ls` on the issue folder.

## Recording a state

**The state is the folder.** There are exactly four, spelled exactly as the
contract spells them, and step 1 of a transition is:

```
mv <From>/<slug> <To>/<slug>
```

creating `<To>/` if it is absent. Then rewrite `state:` in `issue.md` and
continue with the contract's steps 2–4. The read-back is a `ls -d` of the
destination.

## Listing and counting

`ls` per state folder. A backlog readout is newest first by `created:`; the
grouped order is `Open`, `Draft`, `Blocked`, `Closed`.

## Failure modes

A failed write here is a failed filesystem write: no disk, no permission, or no
`<repo-key>` because there is no repository. All three are hard stops that name
what failed, and none of them is partial in a way the next command cannot see —
the folder and the file are either there or they are not.

There is no network, no authentication, no rate limit and no other writer, so
the contract's read-back exists here as cheap insurance rather than as a
defence. Two sessions on one slug is still unsupported: they would share one
`issue.md` and one branch.

## Never

- Push, pull, or commit anything here. This store is not version-controlled by
  us.
- Create `<repo-key>` from anything but the contract's derivation. A store keyed
  on the wrong name is a second, invisible backlog.
