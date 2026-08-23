---
description: Turn the team's own HR reports into issues on the plugin repository, one confirmation at a time — or turn HR on and off for this project.
argument-hint: [--enable owner/repo] [--disable] [--status] [--dry-run]
---

# HR

Arguments: `$ARGUMENTS`

The one command that leaves this project. Agents file records locally as they
work; this reads them, clusters them, and — only with the user confirming each
one — opens the issue that would fix the team.

## Modes

Read `$ARGUMENTS` first and pick exactly one:

| Argument | What runs |
|---|---|
| `--status` | the configuration report below, then stop |
| `--enable [owner/repo]` | the enable flow below, then stop |
| `--disable` | the disable flow below, then stop |
| `--dry-run`, or nothing | the filing flow: preconditions, then steps |

The three configuration modes never dispatch `hr-manager`, never touch the
network, and never read what a record says — they count records and edit two
files. Do not combine them with each other or with the filing flow.

## Configuration

Where the target repository is read from, in order. **First hit wins:**

1. `.claude/settings.json` → `env.CORPORATE_HR_REPO` — what `--enable` writes
2. `.claude/settings.local.json` → the same key
3. `~/.claude/settings.json` → the same key
4. the `CORPORATE_HR_REPO` environment variable

Read these as files. Absent from all four means HR is off, which is the default.

**Always name the source you resolved from.** A key left in `~/.claude/settings.json`
makes every project look enabled, and a project that believes HR is off would
otherwise file issues without anyone understanding why.

## Status — `--status`

Report, and nothing else:

- the resolved repository and which of the four sources it came from, or `off`,
- how many records sit in `.corporate/hr/`, and how many in `filed/`,
- whether `.corporate/` is covered by the project's `.gitignore`,
- `gh auth status` — read-only, and a failure here is information, not an error.

Never list record filenames or quote their contents. Status is about the
configuration, not the complaints.

## Enable — `--enable [owner/repo]`

Repository argument omitted: default to `chrisob194/corporate`. Reject anything
that is not `owner/repo` — a URL, a bare name, a local path — rather than writing
it and failing later.

1. Read `.claude/settings.json`. **If it exists and does not parse, stop and
   change nothing.** Never rewrite a settings file you could not read: a corrupt
   one breaks the consumer's next session, and that cost is not yours to impose.
   Absent is fine — create it holding only the `env` block.
2. Merge in the one key, preserving every other key and the file's existing
   indentation. If the key already holds a different repository, show old → new
   and confirm before overwriting it.
3. Show the resulting JSON, write it, then read it back and confirm it parses.
   Verifying the write is part of the write.
4. Add `.corporate/` to the project's `.gitignore` if no line already covers it,
   under a one-line comment saying what it is. Create the file if absent. This is
   not decoration: records must stay untracked, or a write-less `reviewer` filing
   one dirties the tree its own review checks.
5. Report both writes and the resolved state. Create no directory — the first
   record creates it.

## Disable — `--disable`

1. Remove `env.CORPORATE_HR_REPO` from `.claude/settings.json`, and remove the
   `env` object too if that key was all it held. Same parse-first rule as enable.
2. Touch nothing else. Records stay, `filed/` stays, the `.gitignore` line stays,
   and the session-start hook keeps mentioning the backlog. Disable means *do not
   publish*, never *destroy the evidence* — re-enabling resumes with the same
   records, and their recurrence counts are the whole point of keeping them.
3. If the resolved value came from one of the other three sources, say so
   plainly. This mode edits one file, and a user who thinks they have turned HR
   off while a user-global key still resolves is worse off than before they ran it.
4. Report: off, which file was edited, and how many records were kept.

## Preconditions

These apply to the filing flow only.

1. `.corporate/hr/` exists and holds at least one record outside `filed/`.
   Empty or absent: say the team has filed nothing and stop. That is the normal
   case and is not a problem.
2. Resolve the repository per `## Configuration`. Unresolved, or `--dry-run`
   given: this run is **drafts only**. Continue through the whole flow, print
   everything, and file nothing. Say plainly at the end that nothing was filed,
   and name `/corporate:hr --enable <owner>/<repo>` as the way to turn it on.
3. Filing run only: `gh auth status`. Not authenticated, degrade to a drafts-only
   run rather than failing — the drafts are still worth reading.

## Steps

1. List the records: `ls .corporate/hr/*.md`. Report the count, and state the
   resolved repository and its source before anything else runs. `<resolved repo>`
   below means that literal value, substituted into the command — it is read from
   a file, so do not rely on it being set in the environment.
2. Filing run only: fetch what already exists upstream —
   `gh issue list --repo <resolved repo> --state open --limit 200 --json number,title`.
   On a drafts-only run, skip this and tell the agent the list was unavailable.
3. Dispatch the `hr-manager` subagent with a brief containing:
   - the records directory `.corporate/hr/`,
   - the open-issue list from step 2, verbatim, or the fact that there is none,
   - that its output is filed verbatim and it must not write anything.
4. Print every drafted cluster exactly as returned — title and full body, not a
   summary. The user is approving text that becomes public; they read it as it
   will be filed.
5. **One confirmation per cluster, in order.** For each, ask, and act on the
   answer before moving to the next:
   - approved and `new` → `gh issue create --repo <resolved repo> --title … --body …`
   - approved and `matches #N` → `gh issue comment N --repo <resolved repo> --body …`
   - declined → leave its records where they are. A cluster the user declined is
     not filed later behind their back.
6. For each cluster actually filed, move only its records:
   `mkdir -p .corporate/hr/filed && mv .corporate/hr/<record>.md .corporate/hr/filed/`.
   Nothing moves on a drafts-only run, and nothing moves for a declined cluster.
7. Report: what was filed with its issue URL, what was commented on, what was
   declined, and anything `hr-manager` excluded as unfilable.

## Gate

- **Never batch the confirmations.** No "file all of these?". Each issue is a
  separate public artifact and gets a separate yes.
- **Never file what the agent did not draft**, and never edit a body past what
  the user approved. If a body needs changing, show the change and re-confirm.
- **Never invoked by `/corporate:ship`**, and never run unprompted after a
  pipeline stage. Surfacing that reports exist is a hint; running this is the
  user's decision.
- **Never file into the consumer's own repository.** The target is the plugin
  repository resolved per `## Configuration`. If that value looks like the project
  you are working in, stop and say so — these records are defects in the team,
  and they are useless in the tracker of the project that suffered them.
