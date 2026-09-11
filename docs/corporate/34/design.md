# Design — #34

## Problem

`/corporate:run`'s close-out pushes `corporate/<n>/work` and opens a pull request without ever bringing the default branch into the branch first (`plugins/corporate/commands/run.md:338-350`, canonically `plugins/corporate/reference/worktree-lifecycle.md:85-96`). Work that lands on main while the run is in flight therefore shows up as a conflict on a pull request the run has already declared finished, and the issue has already been moved to `Closed` (`run.md:349`).

The change is entirely in instruction prose read by an LLM orchestrator at run time: the close-out protocol in `reference/worktree-lifecycle.md`, its ordering and routing in `commands/run.md`, and the surrounding bookkeeping those two make claims about.

Out of scope: continuous syncing during the run, anything after the pull request is open, resolving a real conflict automatically, and any change to how wave-merge conflicts are handled (`worktree-lifecycle.md:80-81`, `run.md:234-236`).

## Approach

One new step at the head of close-out, defined once and referenced once.

**The protocol (normative text, `reference/worktree-lifecycle.md`, *Leaving* → *A passing run*, as the new step 1, ahead of the push at line 87).** Run inside the issue's worktree, in order:

1. `git status --short` must be empty — the same assertion the wave merges already carry (`worktree-lifecycle.md:63-67`); output here is a defect to report, not something to clean up.
2. If there is no `origin`, there is nothing to bring in. Skip the step, say so, and let the existing no-`origin` clause (`worktree-lifecycle.md:117-120`) govern the rest of close-out.
3. `git fetch origin`.
4. Resolve the default branch `<D>`: `git symbolic-ref --short refs/remotes/origin/HEAD` and strip the `origin/` prefix; if that ref is not set, `git ls-remote --symref origin HEAD` and take `<D>` from its `ref: refs/heads/<D>` line. Never guess a name. The fallback is not defensive padding — `refs/remotes/origin/HEAD` is genuinely unset in a worktree this pipeline created (verified: `git symbolic-ref --short refs/remotes/origin/HEAD` exits 128 here, while `git ls-remote --symref origin HEAD` prints `ref: refs/heads/main	HEAD`).
5. `git merge --no-edit origin/<D>`. `--no-edit` because there is no editor in an unattended run; no `--no-ff`, because with the branch's own commits present a fast-forward is impossible anyway, and in the one case where it is possible there is nothing on the branch worth a manufactured merge commit. No rebase, ever — see *Rejected*.

Outcomes:

- **`Already up to date.`** (exit 0, no commit) — nothing came in. Close-out continues exactly as it does today; this is functional requirement 4, satisfied by git's own behaviour rather than by a conditional in the prose.
- **exit 0 with a merge commit** — the orchestrator's commit, in the same class as its artifact commits (`run.md:40-41`); the push at the next step carries it.
- **non-zero exit** — discriminate once, with `git diff --name-only --diff-filter=U`:
  - **non-empty** → a genuine conflict. `git merge --abort`, then stop: no push, no pull request. The caller decides what that means (for `run`, `Blocked` — below).
  - **empty** → the merge never started (a bad ref, an unreadable state). Not a conflict; it takes the delivery-failure clause.

Every failure of steps 3-4 (fetch refused, default branch unresolvable) is likewise a delivery failure, not a conflict: no push, no pull request — the branch was not brought up to date, so functional requirement 1 forbids opening one — the issue still goes to `Closed`, and the report names what the user has to run. This reuses `worktree-lifecycle.md:117-120` verbatim rather than inventing a third outcome; the two failure modes map onto the two idioms this pipeline already has.

**The ordering and the route (`commands/run.md`).** The close-out list at `run.md:340-353` gains the update as step 1 and renumbers to seven, so the push is step 2 and the final report is step 7. Four adjacent claims in the same file become false the moment the step exists and are corrected in the same task:

- `run.md:40-41` — "Your only git operations are the wave merges, the artifact commits, the push and the pull request" — gains the close-out merge.
- `run.md:386-390` — the Never bullet bounding the artifact-commit rule, which enumerates "the wave merges, the push, and their necessary contents" as the git operations this command requires — same addition.
- `run.md:355-358` — the delivery-failure paragraph gains the fetch-failed and default-branch-unresolvable cases.
- A new paragraph after the list carries the conflict route: **Blocked**, immediately, `blocked_reason` one sentence naming the default branch, the conflicting paths and that the merge was aborted; then transition, read back, print the state line (`run.md:57-72`; stage stays `close-out`, no new vocabulary), `ExitWorktree` with `keep`, and name `/corporate:brief --unblock <n>` per `run.md:333-336`. It is **not** a review cycle and gets no retry counter.

That last point is the one real routing decision. A wave-merge conflict routes as a plan defect (`run.md:234-236`) because two tasks in one wave shared a file — something the plan can fix. A close-out conflict is somebody else's change on main: no builder can fix it, no re-dispatch can, and spending a review cycle on it burns the cap for nothing. Terminal `Blocked` is also exactly what the spec asks for — stop and report, at the point it happened.

**Where the text goes, and where it does not.** `worktree-lifecycle.md:9` declares itself "the only definition of the protocol", and `build`, `review`, `test`, `qa`, `design` and `deploy` all read it (`commands/build.md:30`, `commands/review.md:30`, `commands/test.md:58`, `commands/qa.md:36`, `commands/design.md:48`, `commands/deploy.md:48`) — so the commands, the failure discrimination and the ordering live there and nowhere else. `run.md` is the only caller that reaches close-out, and it already restates the *order* (`run.md:340`, "In this order, per the worktree reference") while owning the `Blocked` mechanics that no reference doc knows about. So the split is: commands in the reference, order and route in the command.

Three surrounding statements are made non-misleading in the same pass, because each one, read literally today, forbids or misroutes the new step:

- `worktree-lifecycle.md:80-81` — "On a merge conflict: `git merge --abort`, then treat it as a plan defect" — is scoped in place to the **wave** merges, pointing at *Leaving* for the close-out one. Left alone, it is the likeliest way an orchestrator misroutes the new conflict as a plan defect.
- `worktree-lifecycle.md:133` — "Merge `corporate/<n>/work` into anything, locally or via the PR" — gains a clause saying that bringing the default branch *into* `corporate/<n>/work` at close-out is the opposite direction and is required.
- `worktree-lifecycle.md:106-111` — "The push and the pull request are the **only** things this pipeline sends to the code remote" — gains a clause noting the close-out fetch is a *read* of that remote and sends nothing, so the sentence stays true as written.

**Bookkeeping the step makes stale.** `reference/issue-store.md:442` lists the causes of `Open` → `Blocked` ("a `required-missing` stack, the retry cap, or a plan defect it cannot resolve"); a close-out conflict is a fourth and belongs in that cell, or a later reader of the store's own definition will conclude the transition is illegal. `README.md:512-517`'s permission allowlist — the one the README itself says matters most for an unattended run — has `git merge` and `git push` but no `git fetch`, `git symbolic-ref` or `git ls-remote`, so without those three entries the new step stalls on a prompt in exactly the run it exists for. `README.md:415` describes the reference as "the worktree, the branch, the push and the PR". And `plugin.json` bumps 5.0.0 → 5.1.0 per the repo's standing convention.

## Tools chosen

**Repo (layer 1) — the answer came from here, and the search stopped.** Close-out exists in exactly two places (`run.md:338-358`, `worktree-lifecycle.md:83-104`) and every idiom the spec needs is already in this repository: the clean-tree assertion before a merge (`worktree-lifecycle.md:63-67`), an orchestrator-owned git merge with `--abort` on failure (`worktree-lifecycle.md:80-81`), a terminal `Blocked` with a one-sentence `blocked_reason` and a read-back (`run.md:255-262`, `issue-store.md:184`, `issue-store.md:486`), the delivery-failure-is-not-store-failure split (`worktree-lifecycle.md:117-126`, `run.md:355-364`), and the activity line whose `<who>` is already `orchestrator` "for a state change, a merge, a push, a pull request" (`issue-store.md:411-412`). Nothing new is invented; the step is assembled from parts already ruled on.

**Installed capability (layer 2) — checked, nothing applicable.** The session's MCP servers (Asana, Atlassian, Linear, Figma, gitlab/jira tooling, angular-cli, claude-in-chrome, tree-of-knowledge) have no bearing on a local git merge. No skill covers plain git VCS semantics: `github-playbook` is GitHub-the-platform — workflows, `gh`, releases (`plugins/corporate/skills/github-playbook/SKILL.md:8-20,37-47`) — and not `git merge`. `git` itself, already required by every stage of this pipeline, is the installed capability being used.

**Libraries (layer 3) — skipped, and the "add nothing" option wins by default.** There is nothing to add: the deliverable is Markdown prose and the executor is git. No candidate was priced because no candidate exists that would not be strictly more machinery than `git merge`.

**Runtime and platform (layer 4) — skipped.** Existing repository; bun tooling, Markdown components, GitHub store, all already decided.

## Stack readiness

| Stack | Verdict | Basis |
|---|---|---|
| git | not-required | every git command in this change is fixed and verified in this design — `git merge --no-edit` / `--abort` and the `Already up to date.` early exit against git-scm.com/docs/git-merge, and `git symbolic-ref --short refs/remotes/origin/HEAD` (exits 128 here), `git ls-remote --symref origin HEAD` and `git diff --name-only --diff-filter=U` run in this worktree on git 2.43.0 — so no plan or build decision turns on stack-specific fact; the builder transcribes fixed commands into prose |
| github | not-required | the `gh pr create` step and the store's `gh` traffic are untouched by this change |

## Verification

| Layer | Verdict | Why | Environment |
|---|---|---|---|
| unit | not-required | there is no unit: every artifact is instruction prose interpreted by an LLM at run time, and `scripts/validate.ts` checks manifests and frontmatter, not command bodies | — |
| integration | not-required | nothing in this change crosses a process, file-format or module boundary a test could hold still — the "integration" is between two Markdown documents and is checked by reading them | — |
| e2e | not-required | the end-to-end path is a full `/corporate:run` against a live GitHub tracker with a concurrently-moving default branch; it cannot be run unattended without a real remote, a real issue and a real racing commit, and the per-task acceptance greps plus `bun run validate` are what this repository can actually assert about prose | — |

## Scale

| Verdict | Reason |
|---|---|
| standard | three separable file sets edited in parallel, and it changes the close-out protocol that `run.md` and `worktree-lifecycle.md` share — not one coherent file set, and not one builder's pass |

## Rejected

- **`git rebase origin/<D>` or `git pull --rebase`.** Rewrites the branch's history, which `worktree-lifecycle.md:132` forbids outright ("Amend, rebase, reset, or force anything. Every stage appends") and which the spec's own stated assumption rules out. Concretely: the issue already holds `path @ sha` notes pointing at the artifact commits on this branch (`issue-store.md`, *Relocated kinds*), and a rebase dangles every one of them.
- **Let GitHub do it — open the pull request, then "update branch" / `gh pr merge`.** Loses functional requirement 3 outright: the pull request is already open when the conflict surfaces, which is the exact failure being fixed. It also puts the pipeline on the wrong side of `worktree-lifecycle.md:108-111` and `run.md:398`.
- **Route a close-out conflict as a review cycle with origin `plan`**, reusing the wave-merge idiom at `run.md:234-236`. Nothing in the plan or the code is defective — main moved. A re-dispatched architect or builder cannot resolve someone else's change, the retry would re-conflict identically, and it would consume the cycle cap before reaching the `Blocked` it was always going to reach.
- **Merge earlier — after each wave, or before review.** Directly against the spec's non-goal, and it drags unreviewed default-branch changes into the diff the reviewer is judging. Functional requirement 2 wants the update as late as practical, and close-out is that point.
- **Guess `main` (or read the current checkout's branch) as the default branch.** `refs/remotes/origin/HEAD` is empirically unset in this repository, so a guess is not a rare fallback but the ordinary path; a wrong guess either fails noisily or merges the wrong line of development.
- **Put it only in `run.md`, leaving the reference alone.** `worktree-lifecycle.md:9` is "the only definition of the protocol", read by six other commands; a second definition is the drift this repo's conventions exist to prevent.
- **Put it only in `worktree-lifecycle.md`.** `run.md` restates the close-out order (`run.md:340-353`) and owns the `Blocked` transition, `blocked_reason` and the state line — none of which a reference doc may know about. Both files, with the commands in one and the routing in the other.
- **Add nothing.** Priced and rejected by the spec, not by me: the cost is the requester resolving, by hand, a conflict on a request the pipeline reported as finished.

## Risks

- **The merge commit is unreviewed by this pipeline.** Whatever comes in from the default branch lands on the branch *after* the reviewer passed and after the test stage ran, so nothing in the run has looked at it. That is inherent to merging as late as functional requirement 2 demands, and the pull request the user still has to accept is where it gets looked at.
- **A clean merge can still be a broken branch.** Textual non-conflict does not mean semantic compatibility, and this design deliberately does not re-run the suites after the merge — the spec scopes the step to "merge, then open". Worth knowing it is a gap; not worth widening the spec for it unprompted.
- **Two new network calls in close-out.** `git fetch` always, `git ls-remote` when `origin/HEAD` is unset. Both are covered by the delivery-failure clause when they fail, but an allowlist missing the entries turns them into a permission prompt that stalls an unattended run — which is why the README entries are in scope rather than left for later.
- **Three tasks editing prose that must agree.** The normative text is fixed in this design and each task quotes its own portion, but a reviewer should still read the two halves together, since nothing mechanical checks that `run.md`'s step 1 and the reference's step 1 describe the same thing.
