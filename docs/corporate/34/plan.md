# Plan — #34

Three parallel edits to instruction prose. T1 writes the protocol — the commands, the failure discrimination, the three scoping corrections — into `reference/worktree-lifecycle.md`, which is its only definition. T2 puts the step at the head of `run.md`'s close-out list, adds the terminal `Blocked` route for a genuine conflict, and repairs the four claims in that file that the new git operation makes false. T3 takes the bookkeeping the step invalidates: the store's list of `Blocked` causes, the README permission allowlist an unattended run needs, the README's one-line description of the reference, and the version. No two tasks share a file and no task needs another's output — the normative wording is fixed above — so all three run in one wave. T3's acceptance asserts allowlist entries whose literal text contains `*`; those greps use `-F` (fixed-string), because under POSIX BRE an unescaped `*` after `:` is a quantifier and can never match a literal asterisk — verified against the pre-existing `"Bash(git push:*)"` line in `README.md`, which `grep -q` misses and `grep -qF` matches.

## T1 — Define the close-out update in the worktree lifecycle reference
depends_on: none
files: plugins/corporate/reference/worktree-lifecycle.md
acceptance: `bun run validate && grep -q -- '--no-edit origin/' plugins/corporate/reference/worktree-lifecycle.md && grep -q -- '--diff-filter=U' plugins/corporate/reference/worktree-lifecycle.md && grep -q 'ls-remote --symref' plugins/corporate/reference/worktree-lifecycle.md` exits 0
steps:
  - In *Leaving* → *A passing run* (currently the four-step list at lines 85-96), insert a new **step 1** ahead of the push, and renumber the existing four to 2-5.
  - Write step 1 as: assert `git status --short` is empty, citing the same rule as the wave merges; if there is no `origin`, skip the step, say so, and let the no-`origin` clause at the end of this file govern the rest of close-out; otherwise `git fetch origin`, then resolve the default branch `<D>` with `git symbolic-ref --short refs/remotes/origin/HEAD` (stripping the `origin/` prefix), falling back to `git ls-remote --symref origin HEAD` and its `ref: refs/heads/<D>` line when that ref is not set; then `git merge --no-edit origin/<D>`.
  - State plainly that the default branch name is never guessed, and say why the fallback is the ordinary path, not a rare one — a worktree this pipeline created usually has no `refs/remotes/origin/HEAD`.
  - Say why plain `merge` and not `--no-ff`, and why never `rebase` (this file's own Never list, and the `path @ sha` artifact notes a rewrite would dangle).
  - Spell out the three outcomes: `Already up to date.` means nothing came in and close-out proceeds unchanged; a merge commit is the orchestrator's, in the same class as its artifact commits, and the push carries it; a non-zero exit is discriminated once with `git diff --name-only --diff-filter=U` — non-empty means a genuine conflict, so `git merge --abort`, no push, no pull request, and the caller decides what that means; empty means the merge never started, which is a delivery failure.
  - Add, in the same step, that a failed `git fetch` or an unresolvable default branch is a delivery failure too: no push and no pull request, because the branch was not brought up to date — and point at the existing no-`origin`/no-`gh` clause for what happens next.
  - Scope the *During the run* merge-conflict bullet (line 80-81) to the **wave** merges in place, and point at *Leaving* for the close-out merge, so the plan-defect route cannot be misapplied to it.
  - In *The outward actions*, add one clause noting the close-out fetch is a read of the code remote and sends nothing, so the "only things this pipeline sends" sentence stays true.
  - In *Never*, extend the "Merge `corporate/<n>/work` into anything" bullet with a clause saying that bringing the default branch *into* `corporate/<n>/work` at close-out is the opposite direction and is required by *Leaving*.
  - Do not restate any `Blocked`, `blocked_reason` or state-line mechanics here — they are the caller's, and `run.md` owns them.

## T2 — Order the update and route its conflict in run
depends_on: none
files: plugins/corporate/commands/run.md
acceptance: `bun run validate && grep -q 'close-out merge' plugins/corporate/commands/run.md && grep -q 'default branch' plugins/corporate/commands/run.md` exits 0, and `sed -n '/^## Close-out/,/^## HR/p' plugins/corporate/commands/run.md` shows a seven-step list whose step 1 brings the default branch in and whose step 2 is the push
steps:
  - In `## Close-out`, insert a new step 1 — bring the default branch into `corporate/<n>/work` per the worktree reference's *Leaving*, and log one activity line as `orchestrator` naming the merge's short sha or that it was already up to date — then renumber the existing six steps to 2-7. Do not restate the git commands; the reference owns them.
  - Extend step 7's final report so it says whether anything came in from the default branch.
  - Add a paragraph after the list for the conflict route: a close-out merge that conflicts ⇒ **Blocked**, immediately — `blocked_reason` one sentence naming the default branch, the conflicting paths and that the merge was aborted; no push and no pull request; transition, read back, print the state line, `ExitWorktree` with `keep`, and name `/corporate:brief --unblock <n>` without running it.
  - In that same paragraph, say explicitly that this is not a review cycle and gets no retry counter: nothing in the plan or the code is defective, no builder can resolve someone else's change on the default branch, and a retry would re-conflict. Distinguish it from the wave-merge conflict in the **Build** section, which stays a `plan`-origin cycle.
  - Extend the delivery-failure paragraph ("**Delivery failure and store failure are not the same thing.**") so a failed fetch or an unresolvable default branch is covered: no push, no pull request, the issue still goes to `Closed`, and the report names what the user has to run.
  - In *What you are, and what you are not*, add the close-out merge of the default branch into `corporate/<n>/work` to the sentence listing the command's only git operations.
  - In `## Never`, add the same operation to the bullet that enumerates "the wave merges, the push, and their necessary contents" as the git operations this command requires.
  - Change no state-line vocabulary: the stage stays `close-out` and the four terminal outcomes are unchanged.

## T3 — Align the store's Blocked causes, the permission allowlist and the version
depends_on: none
files: plugins/corporate/reference/issue-store.md, README.md, plugins/corporate/.claude-plugin/plugin.json
acceptance: `bun run validate && grep -q 'brought into the branch cleanly' plugins/corporate/reference/issue-store.md && grep -qF 'Bash(git fetch:*)' README.md && grep -qF 'Bash(git ls-remote:*)' README.md && grep -qF 'Bash(git symbolic-ref:*)' README.md && grep -qF '"version": "5.1.0"' plugins/corporate/.claude-plugin/plugin.json` exits 0
steps:
  - In `issue-store.md`'s states-and-transitions table, extend the `Open` → `Blocked` row's *When* cell with a fourth cause, worded so it contains the phrase `brought into the branch cleanly` — e.g. "…, or the default branch could not be brought into the branch cleanly at close-out". Change nothing else in that table.
  - In `README.md`'s permission allowlist JSON block, add `"Bash(git fetch:*)"`, `"Bash(git symbolic-ref:*)"` and `"Bash(git ls-remote:*)"` alongside the existing `git` entries (currently `README.md:509-517`), keeping the block valid JSON and the existing ordering style.
  - In `README.md`'s reference table row for `worktree-lifecycle.md`, change the description so it names the close-out update from the default branch alongside the worktree, the branch, the push and the PR.
  - Bump `version` in `plugins/corporate/.claude-plugin/plugin.json` from `5.0.0` to `5.1.0` — a feature, no breaking change. Keep the existing `"version": "5.1.0"` spacing (one space after the colon), which the acceptance matches literally.
  - Touch no other file: `run.md` and `worktree-lifecycle.md` belong to T1 and T2 and editing either here would conflict at the wave merge.
  - The allowlist and version assertions in the acceptance line use `grep -F` on purpose: the literal text contains `*` and `.`, and an unescaped `*` in a BRE is a quantifier that cannot match a literal asterisk. Do not "simplify" them back to plain `grep -q`.

## Test suites

| Suite | Layer | Command | Setup |
|---|---|---|---|

No rows: the design verdicts `unit`, `integration` and `e2e` all `not-required` — there is no program here, only instruction prose, and `scripts/validate.ts` validates manifests and frontmatter rather than command bodies. The per-task `acceptance` lines carry `bun run validate` and the content assertions.

## Waves

| Wave | Tasks | Runs in parallel |
|---|---|---|
| 1 | T1, T2, T3 | T1, T2, T3 — disjoint file scopes, no task consumes another's output |
