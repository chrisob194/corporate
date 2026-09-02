# corporate

A personal [Claude Code](https://claude.com/claude-code) plugin marketplace.

It ships one plugin — `corporate` — a virtual dev team: subagents named after
the roles they play, plus the slash commands, skills and hooks they work with.

Its core is a five-stage delivery pipeline. The rest is example templates, wired
end to end so new components can be copied from something that already loads.

## The pipeline

```
/corporate:design    →  /corporate:plan  →  /corporate:build  →  /corporate:test  →  /corporate:review
   technical-architect     planner            builder ×N           tester              reviewer
   design.md               plan.md            code + commits       test-<n>.md         review-<n>.md
```

Two stages sit at its ends, and `/corporate:ship` chains neither — both need a
human present throughout. `/corporate:brief "<ask>"` comes first, where the
`product-owner` turns a vague ask into criteria that can fail and files them as
an issue. `/corporate:qa <slug>` comes last, after review, where the
`qa-engineer` attacks the running thing.

`/corporate:test` and `/corporate:qa` are not the same instrument. The `tester`
runs the suites the plan declared and returns a verdict — cheap, deterministic,
and therefore safe to run unattended. The `qa-engineer` decides what nobody
tested, writes those tests, and ends in a decision about the failures it found,
which is why `ship` never runs it. Whether an end-to-end run is needed at all is
ruled in the design, so a skipped layer is always a skip somebody signed.

**Run it by hand, or hand it over.** The five commands above each stop at a
human gate. `/corporate:ship <slug>` runs the same five **unattended**: it asks
nothing, routes review findings back to whichever stage caused them, and ends at
a pull request you still have to accept — or at a `Blocked` issue, which is how
it asks a question. Drive it by hand when you want to argue with a result; ship
it when you already trust the shape of the work.

**One worktree per issue.** The whole lifecycle runs in the issue's own git
worktree on `corporate/<slug>/work`, and each builder's
`corporate/<slug>/<task-id>` merges into it. Two sessions can work two issues at
once, sharing nothing but the tracker. Only `ship` pushes, and only at the end
of a passing run; nothing here merges the pull request.

**No planning or building in a stack nobody documented.** The design ends with a
stack readiness ruling: every stack the approach relies on is `covered` by a
playbook skill, `not-required`, or `required-missing`. The `technical-architect`
is never blocked by a missing playbook — it can search the web and must cite
what it fetched — but `/corporate:plan` and `/corporate:build` are: they refuse
the slug until a playbook exists or you waive it for that run with
`--without-playbook <stack>`. A waiver costs one HR record per stack, which is
how the missing playbook eventually gets written. `/corporate:ship` cannot
waive: unattended, a `required-missing` stack moves the issue to `Blocked` and
hands the decision back to you.

**Agents are contracts, commands are choreography.** An agent file says what its
role is, what it may never do, and the exact shape of what it returns — never
what stage comes next. The commands hold the sequence. That split is what lets
the same four agents work on any kind of task.

**Handoffs are files, and they live with the issue** — not in your repository.
The issue folder in the store collects everything the run produced:

| File | Written by | Read by |
|---|---|---|
| `issue.md` | `brief`, then the orchestrator | you, and every stage |
| `design.md` | technical-architect | planner, reviewer |
| `plan.md` | planner | build, builders, tester, reviewer |
| `test-<n>.md` | tester | you, and the reviewer that classifies a failure |
| `review-<n>.md` | reviewer | you, and the retry routing |
| `qa.md` | qa-engineer | you |

Artifacts are records of decisions *about* the code, not part of it — they
outlive the branch and survive it being deleted. `issue.md` carries the ask, an
artifact table and an append-only activity log of what each stage did.

**Only the main session writes there.** A dispatched role returns its artifact
as its final message and a short report; the session files it and logs it. Roles
are handed what they need inlined in their brief, so no agent needs access to a
directory outside the repository it is changing, and the activity log stays one
ordered account instead of N agents racing on a file.

Any stage can still be entered cold: the issue folder says what is done, so
`/corporate:build <slug>` needs nothing but the slug.

### The issue store

`/corporate:brief` is asynchronous. It takes an ask, interviews you through the
`product-owner`, files the result as an issue, and stops — no branch, no
checkout, no artifact in the tree. Filing backlog is not a change to the code, so
it never dirties a repository. The slug comes back from it and is the first
argument to every later command.

```
/corporate:brief --status              # backend, and which file it came from
/corporate:brief --use local           # the default, and today the only backend
/corporate:brief --list [state]        # slugs and titles, nothing else
/corporate:brief --promote <slug>      # Draft -> Open
```

```json
{
  "env": {
    "CORPORATE_ISSUES": "local"
  }
}
```

**The state of an issue is the folder it is in:**

```
~/.corporate-issues/<repo-key>/
  Draft/<slug>/issue.md
  Open/<slug>/issue.md  design.md  plan.md  review-1.md
  Blocked/<slug>/…
  Closed/<slug>/…
```

`brief` files to `Draft`. **Work is assigned on `Open`, and only on `Open`** —
only you promote an issue, and only you move one out of `Blocked`. The
orchestrator moves `Open` → `Blocked` when it hits something a human has to
decide, and `Open` → `Closed` when the pull request is open. That gate is what
makes an unattended run safe to start.

Slugs are assigned by the store — kebab-case from the title, at most five words
— never invented by you. A GitHub backend is not available yet: the four states
and the per-issue artifact folder have no settled mapping onto issues, labels
and comments, and half a mapping would silently lose artifacts.

That root is `~/.corporate-issues/`, in your home directory, and has nothing to
do with the in-project `.corporate/` that holds HR records.

Resolution is the same chain HR uses, and every mode names the source it
resolved from.

### The roles

| Agent | Decides | Notably cannot |
|---|---|---|
| `product-owner` | what would count as done — falsifiable acceptance criteria, non-goals, and what is a second ticket | name a file, library or pattern, or hand off with a blocking question unanswered |
| `technical-architect` | what to build it *out of* — searching this repo, then installed MCP/skills, then libraries, then platform, cheapest answer first | write code |
| `planner` | the task breakdown: dependencies, file scope, runnable acceptance | invent a design decision — it reports the gap instead |
| `builder` | how one task gets implemented, test-first, in its own git worktree | touch a file outside its task's scope |
| `tester` | nothing — it runs the suites the plan declared and verdicts each one from its exit code | write anything, choose or filter a suite, or say whose fault a failure is |
| `reviewer` | design drift, plan drift, correctness — and which stage each blocking finding came from | edit anything — no `Write`, on purpose |
| `qa-engineer` | what nobody tested: the missing tests, written and run | edit the code under test — a failing test is the deliverable, not a fix |
| `hr-manager` | which of the team's own complaints are evidence, and what issue would fix the team | file anything, or edit the team it reports on |

Builders run in parallel within a dependency wave, each in its own git worktree,
merged wave by wave. A merge conflict halts the build and is reported as a plan
defect — it is never hand-resolved mid-pipeline.

### Stack playbooks

The role files say *how* work gets done, never *what stack it is done in*. That
belongs in a skill named `<stack>-playbook`, which the roles reach for on their
own — `builder.md` keeps saying "implement per plan"; the playbook says what that
means in this stack.

A playbook is an orientation card, not a tutorial: what the stack is, which
commands to run, and a `## Resources` list of the skills and MCP servers that
teach the rest. It never describes those resources — a bare name costs one line
when they are renamed, where a summary would quietly rot.

Thirteen ship today: `typescript-playbook` for the typechecker,
`typescript-mcp-playbook` for MCP servers, `oauth-playbook` for the protocol and
`mcp-oauth-playbook` for MCP's profile of it, `sqlite-playbook` for the embedded
store, `crypto-playbook` for hashing, keys and the secrets a server stores,
`zod-playbook` for the schema the MCP playbook validates its tools with,
`docker-playbook` for the container build and run surface,
`nginx-playbook` for the reverse proxy and TLS termination surface, and
one per Bun doc area — `bun-runtime-playbook`, `bun-pm-playbook`,
`bun-bundler-playbook`, `bun-test-playbook`. Each owns one doc area and one ban
lane, so no rule is stated twice. The format is settled — `docs/authoring.md` fixes the five body
sections — and `docs/ideas.md` drafts further candidates.

`technical-architect`, `planner`, `builder`, `reviewer` and `qa-engineer` carry
the `Skill` tool so a playbook — and `hr-report` — is reachable from inside a
dispatch.
`scout` and `product-owner` deliberately do not: one is a pinned-cheap search
role, the other is forbidden from naming a library at all.

The format every playbook follows is in `docs/authoring.md`.

One more skill ships that is not a playbook: `corporate-pipeline`, the router.
It is what makes a main session aware that this pipeline exists — which stage an
ask is at, which command comes next, where the handoff files live. It routes and
stops there: it names a command for you to run and never dispatches a role agent
itself, so the gates stay where they belong.

### HR

The team can complain about itself. When a role hits the edge of its own job
rather than the edge of the problem, it invokes `hr-report` and leaves one record
under `.corporate/hr/` — and then finishes the task anyway, saying what it had to
guess. Improvising silently is the failure mode this exists to stop.

Four kinds of complaint, each with exactly one shape of fix *in this repository*:

| Kind | The role is saying | The fix here |
|---|---|---|
| `remit` | this is not what I was hired for | that agent's description or body |
| `tooling` | my allowlist cannot do this | that agent's `tools:` line |
| `knowledge` | no playbook covers this stack | a new `<stack>-playbook` skill |
| `staffing` | this wants a specialist we do not employ | a new agent |

That is why the issues land on the plugin's own tracker and not on the project
that suffered them: every one of the four is a defect in the team.

`/corporate:hr` is the only component that talks to the plugin's own tracker —
`/corporate:ship` pushes and opens a pull request, but on *your* remote, and it
never carries a record there. It dispatches
`hr-manager` — read-only, offline, and given the existing open issues in its
brief — which clusters the records, counts how often each recurs and across how
many projects, and drafts the issue text. Then you confirm them **one at a time**,
reading each body as it will be filed. Filed records move to `.corporate/hr/filed/`.

Off by default, and the same command turns it on:

```
/corporate:hr --enable <owner>/<repo>    # or bare, defaulting to this repo
/corporate:hr --status
/corporate:hr --disable
```

`--enable` writes the key into the consuming project's committed
`.claude/settings.json` — so the decision lives in the project and arrives in a
pull request — and adds `.corporate/` to its `.gitignore` in the same pass:

```json
{
  "env": {
    "CORPORATE_HR_REPO": "<owner>/<repo>"
  }
}
```

That gitignore line is not tidiness. Records must stay untracked, or the
write-less `reviewer` filing one dirties the tree its own review checks.

The value is read as a *file*, in order: the project's `settings.json`, then its
`settings.local.json`, then `~/.claude/settings.json`, then the environment —
and every mode names which one it resolved from, so a stale user-global key
cannot quietly enable a project that believes HR is off. Unresolved, records are
still written and still clustered and summarised on request; nothing is ever
filed. `--disable` removes the key and keeps every record: it means *do not
publish*, not *destroy the evidence*, and recurrence counts are the point of
keeping them.

A record describes the plugin's defect and nothing else — no file paths, no
snippets, no repository names, no quoted task text — and `hr-manager` runs a
redaction pass over every body before you ever see it. A `SessionStart` hook
mentions unfiled records so they do not rot in the directory.

### Note on `superpowers`

corporate is standalone: it carries its own gates (no build without an approved
plan, no success claim without pasted evidence). If you also have the
`superpowers` plugin installed, disable it in projects where you use this
pipeline — two sets of process skills competing for the same triggers is worse
than either alone.

## What's inside

| Component | Path | Ships |
|---|---|---|
| Slash command | `plugins/corporate/commands/` | `/corporate:brief`, `:design`, `:plan`, `:build`, `:test`, `:review`, `:qa`, `:ship`, `:hr` |
| Subagent | `plugins/corporate/agents/` | `product-owner`, `technical-architect`, `planner`, `builder`, `tester`, `reviewer`, `qa-engineer`, `scout`, `hr-manager` |
| Reference | `plugins/corporate/reference/` | `plan-format.md` — the `plan.md` grammar; `issue-store.md` — the tracker, its states and its log; `worktree-lifecycle.md` — the worktree, the branch, the push and the PR; `stack-readiness.md` — the playbook-coverage verdicts and the waiver; `test-plan.md` — which verification layers run, which suites answer them, and what a skipped one requires |
| Skill | `plugins/corporate/skills/` | `corporate-pipeline`, `whiteboard`, `hr-report`, `typescript-playbook`, `typescript-mcp-playbook`, `oauth-playbook`, `mcp-oauth-playbook`, `sqlite-playbook`, `crypto-playbook`, `zod-playbook`, `docker-playbook`, `nginx-playbook`, `bun-runtime-playbook`, `bun-pm-playbook`, `bun-bundler-playbook`, `bun-test-playbook` |
| Hook | `plugins/corporate/hooks/` | `hr-backlog.sh` — `SessionStart`, mentions unfiled HR records |
| MCP servers | `plugins/corporate/.mcp.json` | none yet |

## Install

### From a local clone (development)

```bash
git clone <this-repo> ~/Projects/corporate
```

Then in Claude Code:

```
/plugin marketplace add ~/Projects/corporate
/plugin install corporate@corporate
```

### From a git remote

```
/plugin marketplace add <owner>/<repo>
/plugin install corporate@corporate
```

Restart the session (or `/clear`) so commands and agents register.

### Verify

```
/help                     # /corporate:brief … :ship, :hr should be listed
/corporate:hr --status    # reports HR off, and names --enable
/agents                   # product-owner, technical-architect, planner,
                          # builder, tester, reviewer, qa-engineer,
                          # hr-manager listed
```

Skills appear in the skill list once the session restarts.

## Update

```
/plugin marketplace update corporate
```

For a local clone, pull and then reinstall the plugin — local sources are read
from disk, so a restart is usually enough.

## Uninstall

```
/plugin uninstall corporate@corporate
/plugin marketplace remove corporate
```

## Permissions

Plugins cannot ship `settings.json` or a permission allowlist. To pre-approve
what this plugin's commands run, add it yourself in
`~/.claude/settings.json`:

An unattended `/corporate:ship` run is where this matters most — every prompt it
cannot answer is a stalled run.

```json
{
  "permissions": {
    "allow": [
      "Bash(git log:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git worktree:*)",
      "Bash(git merge:*)",
      "Bash(git switch:*)",
      "Bash(git branch:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(gh pr create:*)",
      "Bash(gh issue list:*)",
      "Bash(gh issue view:*)",
      "Bash(gh issue create:*)"
    ]
  }
}
```

## Development

Requires [bun](https://bun.sh) for tooling only. The plugin itself has no
runtime dependency.

```bash
bun run validate    # manifests parse, frontmatter present, hooks executable
```

See `docs/authoring.md` for the frontmatter reference of each component type,
and `CLAUDE.md` for the conventions Claude follows in this repo.
