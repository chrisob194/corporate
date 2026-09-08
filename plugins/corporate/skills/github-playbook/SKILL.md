---
name: github-playbook
description: Use when work touches GitHub — a workflow under `.github/workflows/`, a job, step, `uses:`, `runs-on:`, `permissions:`, `concurrency:`, `secrets` or `GITHUB_TOKEN`, a composite or reusable workflow, a matrix, an artifact or a cache, `gh` on the command line, `gh api`, a pull request, a release or a tag — or when CI passes locally and only fails on the runner.
---

# GitHub Playbook

## Stack

GitHub as one platform: the same account, the same permission model and the same
API underneath every surface. Three contracts, one entry point each:

| Contract | Where it lives | Driven by |
|---|---|---|
| a workflow | `.github/workflows/*.yml` | a repository event, `workflow_call`, or `workflow_dispatch` |
| a repository operation | `gh <command>` | the credential from `gh auth` |
| anything with no subcommand | `gh api` | the same credential |

A workflow is the automation surface; `gh` is how a human or an agent drives the
same repository from outside it. They share the auth model, which is why they
are one playbook: a rule about token scope is the same rule on both sides.

Three defaults decide most designs and none of them is the platform's:

- **`permissions:` is declared at the top of every workflow.** The implicit
  value is whatever the repository or organisation settings say, so a workflow
  without the block is least-privilege in one repo and write-all in the next.
- **A workflow that must not race itself declares `concurrency:`.** There is no
  implicit serialisation.
- **A third-party action is pinned by commit SHA.** A tag is a moving pointer
  someone else controls, and it runs with the job's token.

## Toolchain

| Job | Command |
|---|---|
| list workflows / trigger one | `gh workflow list` / `gh workflow run <file> -f <k>=<v>` |
| list runs, watch one | `gh run list --workflow <file>` / `gh run watch <id>` |
| see why a run failed | `gh run view <id> --log-failed` |
| re-run only what failed | `gh run rerun <id> --failed` |
| open a pull request | `gh pr create --fill` |
| the checks on a pull request | `gh pr checks <n> --watch` |
| publish a release | `gh release create <tag> --notes-file -` |
| anything with no subcommand | `gh api repos/{owner}/{repo}/... --jq '…'` |
| who the credential is, and its scopes | `gh auth status` |
| lint a workflow before pushing it | `actionlint` |

`gh api` is the escape hatch, and it carries the session credential. Never a
hand-rolled `curl https://api.github.com/...` with a token pasted into a header
or an env var — it duplicates an authentication the machine already has, puts a
credential in shell history and process listings, and is the form that leaks
into a committed script. Upstream docs, blog posts and generated snippets show
the `curl` shape freely; the translated `gh api` call is what lands in the file.

Inside a workflow, a step publishes through `$GITHUB_OUTPUT`, `$GITHUB_ENV`,
`$GITHUB_PATH` and `$GITHUB_STEP_SUMMARY`. The `::set-output` and `::save-state`
workflow commands are deprecated and are not written, in any repo, at any age.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `docs.github.com/en/actions/reference` is the authority. Workflow facts resolve under `…/reference/workflows-and-actions/` — `workflow-syntax`, `events-that-trigger-workflows`, `contexts`, `expressions`, `variables`, `reusing-workflow-configurations`, `dependency-caching` — and token, secret and fork facts under `…/reference/security/` — `secure-use`, `secrets`, `securely-using-pull_request_target`, `oidc`. `cli.github.com/manual` is the authority for `gh`. Copilot, Codespaces, Pages, billing and Enterprise administration are out of this playbook's area. A fact those pages cover is read there, never asserted from memory |
| choosing an approach | name the triggering event and its activity types in writing, and say what the workflow is allowed to write. An automation that reacts to work landing on the default branch, one that reacts to a proposal, and one a human starts are three different events — pick before designing the jobs |
| implementing | one workflow per outcome. Explicit `permissions:` at workflow level, widened per job only where needed; a `concurrency:` group wherever two runs would collide; third-party actions pinned by SHA; secrets read through `secrets.<NAME>` in `env:` and never interpolated into a `run:` line; every step that publishes a value uses `$GITHUB_OUTPUT` |
| reviewing | reject a workflow with no `permissions:` block, a floating third-party tag, a secret or untrusted input interpolated directly into `run:`, a deploy workflow with no `concurrency:`, a `pull_request_target` that checks out the pull request's head, a run identified by the wrong SHA, and any `curl` to `api.github.com` where `gh api` would do |
| testing | prove it on the runner, not locally — the runner's shell, image and token are the environment under test. A workflow is proven by the run it produces: `gh run view --log-failed` on a real failing run, and a `workflow_dispatch` entry point so the thing can be exercised without faking the event it normally answers |

## Traps

- **A `GITHUB_TOKEN`-triggered event starts nothing.** "With the exception of
  `workflow_dispatch` and `repository_dispatch`, other `GITHUB_TOKEN`-triggered
  events do not create workflow runs at all." A workflow that pushes a commit or
  opens a pull request expecting the next workflow to fire ends the chain
  silently, with no error anywhere. The ways out are `workflow_run`, a token that
  is not `GITHUB_TOKEN` (a PAT or a GitHub App), or doing the work in one
  workflow.
- **"Merged" is not an event.** An accepted promotion is the `pull_request` event
  with activity type `closed` plus a condition on
  `github.event.pull_request.merged` — a pull request closed without merging
  fires exactly the same event. `push` to the default branch is the other
  spelling, and it also fires for a direct commit that was never proposed.
- **Which SHA records what landed.** On `pull_request`, `GITHUB_SHA` is the last
  merge commit of the pull request's merge branch — a commit that exists on no
  branch and is discarded. The proposal's own head is
  `github.event.pull_request.head.sha`. Stamping an artifact, a tag or a
  deployment record with the wrong one produces an identifier nobody can resolve
  later.
- **A fork gets no secrets.** Secrets are not passed to the runner when a
  workflow is triggered from a forked repository, and `GITHUB_TOKEN` is read-only
  there — so a job that works on a branch fails on a contributor's pull request
  and only there.
- **`pull_request_target` is the dangerous mirror.** It runs the workflow from
  the base branch, with secrets and a writable token, in the context of a pull
  request whose code may be hostile. Checking out the head under it — or running
  anything the head can influence, including a dependency install — hands that
  code the token and the secrets.
- **Nothing serialises runs by default.** Two merges a minute apart run two
  deployments against the same target. `concurrency:` with a group key is the
  whole answer, and `cancel-in-progress` is a decision per workflow: right for a
  redundant build, wrong for a deploy that is halfway through.
- **`permissions:` inherits a setting, not a constant.** Omitting it means the
  repository's or organisation's default, which differs per repo and changes
  under the workflow without touching the file. Declare `contents: read` at the
  top and widen the one job that needs more.
- **A pull request opened by a workflow-authored token needs approval.** It runs
  only on `opened`, `synchronize` or `reopened` and only after someone with write
  access approves the run, so an unattended chain built on it stalls waiting for a
  human nobody told.
- **Draft releases fire nothing.** No workflow runs for the `created`, `edited`
  or `deleted` activity types on a draft release — an automation that watches for
  a release fires when the draft is published, not when it is written.
- **Notifications belong to the platform, not the workflow.** GitHub mails the
  actor for a failed run on the default branch; a failed run on any other branch,
  or a `workflow_run` child, notifies nobody unless the workflow says so. A
  pipeline whose only alarm is that default-branch rule is unmonitored everywhere
  else.
- **The runner is not the laptop.** A different image, a different shell
  (`bash -e` semantics), an empty cache and no interactive credential. "Works
  locally" is not evidence about a workflow.
- **Destructive, never run unprompted:** `gh release create` (it publishes and
  tags in one call), `gh workflow run` against a workflow that deploys,
  `gh api -X DELETE` anything, and any write of a repository or environment
  secret.

## Resources

### Skills

`docker-playbook`

### MCP servers

None.
