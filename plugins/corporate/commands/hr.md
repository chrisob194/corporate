---
description: Turn the team's own HR reports into issues on the plugin repository, one confirmation at a time.
argument-hint: [--dry-run]
---

# HR

Arguments: `$ARGUMENTS`

The one command that leaves this project. Agents file records locally as they
work; this reads them, clusters them, and — only with the user confirming each
one — opens the issue that would fix the team.

## Preconditions

1. `.corporate/hr/` exists and holds at least one record outside `filed/`.
   Empty or absent: say the team has filed nothing and stop. That is the normal
   case and is not a problem.
2. Read `$CORPORATE_HR_REPO`. Unset, empty, or `--dry-run` given: this run is
   **drafts only**. Continue through the whole flow, print everything, and file
   nothing. Say plainly at the end that nothing was filed and name the
   `.claude/settings.json` `env` key that would enable it.
3. Filing run only: `gh auth status`. Not authenticated, degrade to a drafts-only
   run rather than failing — the drafts are still worth reading.

## Steps

1. List the records: `ls .corporate/hr/*.md`. Report the count.
2. Filing run only: fetch what already exists upstream —
   `gh issue list --repo "$CORPORATE_HR_REPO" --state open --limit 200 --json number,title`.
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
   - approved and `new` → `gh issue create --repo "$CORPORATE_HR_REPO" --title … --body …`
   - approved and `matches #N` → `gh issue comment N --repo "$CORPORATE_HR_REPO" --body …`
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
  repository named by `$CORPORATE_HR_REPO`. If that value looks like the project
  you are working in, stop and say so — these records are defects in the team,
  and they are useless in the tracker of the project that suffered them.
