---
name: hr-report
description: Use when you hit the edge of your own role rather than the edge of
  the problem — the task needed stack knowledge no playbook covers, a tool you
  were not granted, work outside your stated remit, or a specialist role this
  team does not employ. Files one record for HR. Not for gaps in the work itself.
---

# Reporting to HR

You are an employee of a team that can be changed. When the job you were given
does not fit the job you were hired for, that is a defect in the team, not in
you — and the only way it gets fixed is if you say so in writing.

Improvising is the failure mode this exists to stop. Answering from memory a
question the team should have shipped an answer to costs more than the report.

## What is reportable

Four kinds, and the `kind` field takes exactly one of these words:

| `kind` | You are saying |
|---|---|
| `remit` | this task is not what my role is for — I did it anyway, or I could not |
| `tooling` | my tool allowlist cannot do what this task needs |
| `knowledge` | this task needed a stack this team ships no playbook for |
| `staffing` | this work wants a specialist role the team does not employ |

## What is not reportable

- **A gap in the work.** A design that does not say, a plan with no acceptance,
  an ask that cannot fail — those go back to the user in your final message, the
  way your own role file already tells you to. HR is about the team, not the task.
- **A tool the user has not permitted here.** That is the consumer's settings
  file, not our defect. Say it in your final message instead.
- **A stack you simply found hard.** `knowledge` means no playbook exists, not
  that the playbook was thin.
- **A one-off.** If you would not report it a second time on a second project,
  it is not worth a record.

## Privacy — hard rules

The record leaves this project. It describes *our* defect and nothing else.

Never write: a file path, a code snippet, a repository or directory name, a
branch name, a URL from this project, or the task text quoted. `subject` is a
bare stack identifier (`python`, `terraform`, `postgres`) or one of our own role
names — nothing else is a legal value.

If you cannot state the problem without naming something from this project, the
report is not about the team. Do not file it.

## How to file

One record is one new file, never an edit of an existing one:

```
.corporate/hr/<kind>-<subject>-<slug>.md
```

Create it with `Write` if you hold that tool. If you do not — some roles are
write-less on purpose — write it with a single `Bash` heredoc redirect
(`mkdir -p .corporate/hr && cat > .corporate/hr/<name>.md <<'EOF' … EOF`). Both
paths create one file and touch nothing else, which is what the write-less
posture is protecting. The directory is gitignored in a consuming project, so
the record never dirties the tree a reviewer has to leave alone.

`<slug>` is the pipeline slug from your brief. If your brief has no slug, use
`adhoc`. A user filing by hand uses `user`.

```markdown
---
kind: knowledge
subject: python
reporter: planner
---

Needed: what the task demanded of the team.
Did instead: what you fell back on, stated plainly — including "answered from
memory" when that is the truth.
Would fix it: the one change to this team that removes the problem.
```

Three lines is a good record. Ten is a complaint.

## Never

- **Never edit or delete an existing record**, yours or anyone else's. If the
  filename already exists, the report is already on file — leave it alone and
  move on. Recurrence is counted across projects, not inside one.
- **Never file an issue, open a browser, or touch the network.** You write one
  local file. `/corporate:hr` is the only thing that files anything, it needs the
  user present, and it is not yours to invoke.
- **Never let the report replace the work.** File it, then finish the task as
  well as you can and say in your final message what you had to guess.
