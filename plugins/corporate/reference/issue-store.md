# The issue store

Where briefs live. `/corporate:brief` writes through this; every stage that
needs a brief reads through it. This file is the only definition of the
backends — do not restate them anywhere else.

The store is deliberately **outside the working tree**. A brief is backlog, not
a change: filing one must never dirty a repository, need a branch, or land on
whatever happens to be checked out.

## Configuration

Where the backend is read from, in order. **First hit wins:**

1. `.claude/settings.json` → `env.CORPORATE_ISSUES` — what `--use` writes
2. `.claude/settings.local.json` → the same key
3. `~/.claude/settings.json` → the same key
4. the `CORPORATE_ISSUES` environment variable

Read these as files. Absent from all four means `local`, which is the default.

Accepted values, and nothing else:

| Value | Backend |
|---|---|
| `local` | markdown files under the local store |
| `github` | GitHub issues on the repository `gh` infers from the remote |
| `github:owner/repo` | GitHub issues on that repository |

An unrecognised value is a configuration error: say what was found, name the
source it came from, and stop. Never silently fall back to `local` from a value
someone wrote on purpose.

**Always name the source you resolved from.** A key left in
`~/.claude/settings.json` makes every project look like it files to GitHub, and
a project that believes it is local would otherwise publish without anyone
understanding why.

## The local store

```
~/.corporate-issues/<repo-key>/<slug>.md
```

The root is `~/.corporate-issues/`, not `~/.corporate/`. The latter name is taken
by the HR records directory *inside a consuming project* — two unrelated things
one character apart is a defect, so the issue store keeps its own root.

`<repo-key>` is derived, in this order:

1. `git remote get-url origin` parses to a host path ⇒ `<owner>-<repo>`, with
   any `.git` suffix dropped.
2. Otherwise the basename of `git rev-parse --show-toplevel`.
3. Outside a repository ⇒ stop. There is no project to file against.

Both backends resolve to a path in this tree, and that path is the only thing
handed to a downstream stage. In `github` mode the issue is the source of truth
and this file is a cache of it; refresh the cache before reading it, and treat a
difference as the cache being stale, never the issue being wrong. A stage is
never told which backend is active — it is given a file to read.

## File format

```markdown
---
slug: json-output-flag
title: Add a --json flag to the CLI
created: 2026-08-23
backend: local
url:
---

<the brief, exactly as the product owner wrote it>
```

`url` carries the issue URL on the `github` backend and is empty on `local`.
The body below the frontmatter is the product owner's brief verbatim — this file
adds a header to it and changes nothing else.

## Slugs

The store assigns the slug; the user never invents one.

- `local`: kebab-case, derived from the brief's title, at most five words. On
  collision with an existing file, append `-2`, then `-3`. Never overwrite.
- `github`: `<number>-<kebab-title>`, the number first so the slug sorts by
  filing order and the issue is one `gh issue view <number>` away.

Every command downstream takes the slug as its first argument, so a slug must
never contain a space, a slash, or an uppercase letter.

## GitHub backend

The only commands this backend uses:

| Purpose | Command |
|---|---|
| file | `gh issue create --repo <repo> --title <title> --body-file <file>` |
| read | `gh issue view <number> --repo <repo> --json number,title,body,url` |
| list | `gh issue list --repo <repo> --state open --limit 200 --json number,title,url` |

With a bare `github` value, omit `--repo` and let `gh` infer it from the remote,
then report what it inferred.

**Degrade, never fail.** If `gh` is missing, or `gh auth status` fails, or the
repository cannot be resolved: say so plainly, write the brief to the local
store, and name the local path in the report. A brief that took an interview to
produce is never discarded because a network tool was unavailable. Do not
rewrite the configuration to `local` when this happens — the next run tries
GitHub again.

## Never

- Write an issue anywhere inside the consuming repository, or into
  `docs/corporate/`. That directory holds pipeline artifacts, which are
  committed on a branch; issues are neither.
- Edit or delete an existing issue file. A brief is replaced only by
  `/corporate:brief` asking first, and a filed GitHub issue is closed by a human
  on the tracker.
- Push, pull, or commit anything. This store is not version-controlled by us.
