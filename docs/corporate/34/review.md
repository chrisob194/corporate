Verdict: pass with findings
Defect origin: implementation

# Review — #34

Acceptance for all three tasks passes and `bun run validate` is clean; the close-out step as written satisfies all four functional requirements, and the one real defect is a broken Markdown table row in `README.md` introduced by T3.

## What I checked

- Read `docs/corporate/34/design.md` and `docs/corporate/34/plan.md` in full before the diff.
- Read the whole diff (`main...HEAD`, 3 task commits + 3 merges) file by file, and read the changed regions of `worktree-lifecycle.md` and `run.md` in their surrounding context rather than as hunks.
- Ran all three acceptance lines verbatim myself, plus `bun run validate`.
- Verified the git facts the prose asserts, in this worktree: `git symbolic-ref --short refs/remotes/origin/HEAD` → `fatal: ... is not a symbolic ref`, exit 128; `git ls-remote --symref origin HEAD` → `ref: refs/heads/main\tHEAD`, exit 0. `U` (unmerged) is a documented `--diff-filter` value for `git diff` (`git help diff`, line 562-566), so the discriminator does what the text claims.
- Rendered `README.md`'s "What's inside" table through a GFM-tables renderer to confirm the breakage below is real and not a reading error.
- Checked every other file in the repo that describes close-out, the reference, or the `Blocked` causes, for statements the new step makes false.

## Acceptance

All three pass, post-merge, in this worktree.

- **T1** — `bun run validate && grep -q -- '--no-edit origin/' … && grep -q -- '--diff-filter=U' … && grep -q 'ls-remote --symref' plugins/corporate/reference/worktree-lifecycle.md` → `OK — 0 warning(s).`, **exit 0**.
- **T2** — `bun run validate && grep -q 'close-out merge' … && grep -q 'default branch' plugins/corporate/commands/run.md` → **exit 0**. The second half, `sed -n '/^## Close-out/,/^## HR/p' plugins/corporate/commands/run.md`, shows exactly seven steps: `1.` brings the default branch in, `2.` is the push, `7.` is the final report.
- **T3** — `bun run validate && grep -q 'brought into the branch cleanly' … && grep -qF 'Bash(git fetch:*)' README.md && grep -qF 'Bash(git ls-remote:*)' README.md && grep -qF 'Bash(git symbolic-ref:*)' README.md && grep -qF '"version": "5.1.0"' …/plugin.json` → **exit 0**.
- `bun run validate` on its own: `OK — 0 warning(s).`

I also checked the other acceptance lines for the `grep` BRE class of defect that bit T3 the first time: T1's patterns contain no `*` and correctly use `--` before patterns starting with `-`; T2's patterns are plain literals with no BRE metacharacters; T3 uses `-F` throughout, as the plan's note demands. No further instances.

I additionally verified the permission block is still valid JSON after the three new entries (parsed with `json.load`: 23 allow entries).

## Functional requirements

1. **Branch brought up to date before the PR opens** — satisfied. `worktree-lifecycle.md:88-106` puts `git fetch origin` + `git merge --no-edit origin/<D>` at step 1 of *Leaving*; `run.md:343-347` orders it as close-out step 1, push as step 2.
2. **As late as practical** — satisfied. Nothing sits between the merge and the push, and the run's own work (waves, test, review, artifact commits) is all upstream of close-out.
3. **Genuine conflict ⇒ no PR, stop and report** — satisfied, and it is the branch the design handled most carefully. The reference discriminates non-zero exit once with `git diff --name-only --diff-filter=U`, aborts on a non-empty result *after* reading the paths, and forbids push and PR; `run.md:361-371` routes it to terminal `Blocked` with a `blocked_reason` naming the branch, the paths and the abort, a read-back, the state line, `ExitWorktree keep`, and `/corporate:brief --unblock <n>` named but not run — and says explicitly it is not a review cycle and gets no retry counter. `issue-store.md:442` now legalises that transition.
4. **No effect when main hasn't moved** — satisfied by git's own behaviour (`Already up to date.`, exit 0, no commit), not by a conditional; close-out then proceeds identically. The one added observable is an activity line and a clause in the final report, neither of which changes the run's outcome.

## Design drift

None. Every element the design prescribed is present and matches: the five-part command sequence, the `--no-edit`/no-`--no-ff`/never-`rebase` rationale, the never-guess-the-default-branch rule with the `ls-remote --symref` fallback stated as the *ordinary* path, the three outcomes, the fetch/unresolvable-branch cases as delivery failures, terminal `Blocked` with no retry counter, all four corrected claims in `run.md` (`:40-42`, the `Never` bullet at `:403-409`, the delivery-failure paragraph at `:373-377`, the new routing paragraph), and all three scoping corrections in `worktree-lifecycle.md` (wave-merge bullet at `:79-82`, *The outward actions* at `:147-148`, the *Never* merge bullet at `:170-172`). Bookkeeping: `issue-store.md:442`, the three README allowlist entries, the README reference-row description, `5.0.0 → 5.1.0`.

## Plan drift

None on scope. Each task commit touches exactly its declared `files:` and nothing else (`afac17a` → `worktree-lifecycle.md`; `0175fdf` → `run.md`; `59971bf` → `issue-store.md`, `README.md`, `plugin.json`). No changes in the diff that no task asked for, apart from the orchestrator's `docs/corporate/34/` artifacts, which are not plan drift.

## Internal consistency (the design's own flagged risk)

I read the two halves against each other. `run.md`'s step 1 defers the commands to the reference and adds only what the reference may not know (the activity line, the `Blocked` mechanics); the reference defines the commands and explicitly stops at "the caller decides what that means" — no duplication, no contradiction, no restated `blocked_reason` or state-line vocabulary in the reference. `worktree-lifecycle.md`'s "A blocked run — `ExitWorktree` with `keep`, and nothing else… Do not push a blocked run" agrees with the new conflict route. The state line is untouched: stage stays `close-out`, the four terminal outcomes are unchanged. `run.md:21`'s "step 6 hands you a working default goal line" refers to the *Preflight* list's step 6 (`run.md:145`), not close-out, so the renumbering did not stale it — I checked. No other file in the repo describes close-out ordering or the `Blocked` causes.

## Correctness

**1. `README.md:415-416` — the "What's inside" table's `Reference` row was split across two physical lines, breaking the table.** *Non-blocking, but a genuine defect in shipped output; not taste.* `origin: implementation` — T3's step says "change the description so it names the close-out update from the default branch alongside the worktree, the branch, the push and the PR"; it does not authorise a line break, and a GFM table row must be one line.

Concrete failure — rendering `README.md` (Python `markdown` with `tables`, same row model GitHub uses) produces:

```
['Reference', 'plugins/corporate/reference/', 'plan-format.md — the plan grammar; issue-…']   <- 3rd cell ends mid-sentence: "…the push, the PR and the"
['close-out update from the default branch; stack-readin…', '', '']                            <- spurious 4th row, in the Component column
```

So on GitHub the Reference row is truncated at "the push, the PR and the" and an extra row appears containing the rest of the description — including the entries for `stack-readiness.md`, `test-plan.md`, `scale.md` and `runbook.md`, which now sit in the wrong column. The fix is to join lines 415 and 416 into one line. Nothing at runtime reads this table, no functional requirement is touched, and the permission block lower in the same file is intact and valid JSON — which is why I do not rate it severe enough to burn a cycle on if the orchestrator has none left, but it should be fixed before the PR is merged.

**2. `run.md:361-377` — two adjacent close-out paragraphs both end in "no push and no pull request" and route to opposite terminal states.** *Non-blocking observation, no origin.* The conflict paragraph (`Blocked`) is followed immediately by "**Delivery failure and store failure are not the same thing.** No remote, or no push, or no pull request … the issue still goes to `Closed`". A literal reader arriving at the second paragraph after aborting a conflicted merge has, in fact, "no push, no pull request". The precedence is recoverable — the conflict paragraph comes first, says "⇒ `Blocked`, **immediately**", and the delivery-failure paragraph enumerates its own causes (fetch failed, default branch unresolvable) — so I could not construct a reading that survives both paragraphs being read in order, and I am not calling it blocking. One clause ("a conflict is not a delivery failure — see above") would close it. Note this wording is exactly what the design prescribed (`design.md:31`), so it is not builder drift.

**3. `run.md` defines no route for a non-empty `git status --short` at close-out step 1.** *Non-blocking observation, no origin.* The reference sends it to the wave-merge rule ("a defect to report, not something to clean up"), but `run.md`, which owns the terminal outcomes, names none for it. I could not construct a reachable state: by close-out the reviewer has passed, the orchestrator's review artifact commit is "one uninterrupted sequence", and builders commit only in their own worktrees — so reaching it requires a role that already broke its contract, which the prose itself calls out. Reported for completeness, not as a defect.

## Taste (not blocking)

- `run.md:50-51` still glosses the worktree reference as "(the worktree, the branch, the push and the PR)", while `README.md`'s row for the same file was updated to name the close-out update. The gloss is incomplete rather than false, and neither the design nor T2 listed it among the claims to correct — so this is consistency polish, not drift.
- `issue-store.md:442`'s new clause reads "the default branch could not be brought into **the branch** cleanly" — "the branch" twice in one clause. The plan mandated the literal phrase `brought into the branch cleanly` for the acceptance grep, so the builder had no latitude here.

## Had to guess

Nothing material. One thing I could not execute rather than reason about: I could not run a throwaway conflicting merge to observe `git diff --name-only --diff-filter=U` empirically — this session refuses git commands outside its own worktree, and running one *inside* it would have modified the branch under review. I verified the semantics from `git help diff` (`U` = unmerged is a documented filter for `git diff`) and from the two resolution commands run read-only in this worktree, which behaved exactly as the design and the reference claim.
