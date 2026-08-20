---
description: Summarize what changed in this repo since a given point, standup-style.
argument-hint: [since] (e.g. yesterday, 2 days ago, HEAD~5)
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(git status:*)
---

# Standup

EXAMPLE COMMAND — shipped as a template. Adapt or delete.

Range: `${1:-yesterday}`

1. Run `git log --since="${1:-yesterday}" --oneline --author="$(git config user.email)"`.
2. Run `git status --short` to catch uncommitted work.
3. Report three sections, one line per item, no filler:
   - **Done** — merged/committed work.
   - **In progress** — uncommitted or WIP-marked changes.
   - **Blocked** — only if evidence exists (failing tests, TODO/FIXME added, open conflict markers).

Say "nothing since <range>" when the log is empty. Never invent items.
