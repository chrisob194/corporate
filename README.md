# corporate

A personal [Claude Code](https://claude.com/claude-code) plugin marketplace.

It ships one plugin — `corporate` — a virtual dev team: subagents named after
the roles they play, plus the slash commands, skills and hooks they work with.

Its core is a four-stage delivery pipeline. The rest is example templates, wired
end to end so new components can be copied from something that already loads.

## The pipeline

```
/corporate:design  →  /corporate:plan  →  /corporate:build  →  /corporate:review
   architect            planner            builder ×N            reviewer
   design.md            plan.md            code + commits        review.md
```

Two optional bookends sit outside it: `/corporate:brief` before design, where the
`product-owner` turns a vague ask into criteria that can fail, and
`/corporate:qa` after build, where the `qa-engineer` attacks the running thing.
Neither is chained by `/corporate:ship` — both need a human present throughout.

`/corporate:ship <slug> "<task>"` chains all four. Every stage stops at a human
gate; the chain does not remove them.

**Agents are contracts, commands are choreography.** An agent file says what its
role is, what it may never do, and the exact shape of what it returns — never
what stage comes next. The commands hold the sequence. That split is what lets
the same four agents work on any kind of task.

**Handoffs are files**, under `docs/corporate/<slug>/`, committed:

| File | Written by | Read by |
|---|---|---|
| `brief.md` | product-owner | architect, qa-engineer |
| `design.md` | architect | planner, reviewer |
| `plan.md` | planner | build command, builders, reviewer |
| `review.md` | reviewer | you |
| `qa.md` | qa-engineer | you |

So any stage can be entered cold — `/corporate:build <slug>` needs nothing but
the directory — and the reviewer can check the code against what was actually
agreed instead of against a summary in someone's context.

### The roles

| Agent | Decides | Notably cannot |
|---|---|---|
| `product-owner` | what would count as done — falsifiable acceptance criteria, non-goals, and what is a second ticket | name a file, library or pattern, or hand off with a blocking question unanswered |
| `architect` | what to build it *out of* — searching this repo, then installed MCP/skills, then libraries, then platform, cheapest answer first | write code |
| `planner` | the task breakdown: dependencies, file scope, runnable acceptance | invent a design decision — it reports the gap instead |
| `builder` | how one task gets implemented, test-first, in its own git worktree | touch a file outside its task's scope |
| `reviewer` | design drift, plan drift, correctness | edit anything — no `Write`, on purpose |
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

Five ship today: `typescript-mcp-playbook`, and one per Bun doc area —
`bun-runtime-playbook`, `bun-pm-playbook`, `bun-bundler-playbook`,
`bun-test-playbook`. Each owns one doc area and one ban lane, so no rule is
stated twice. The format is settled — `docs/authoring.md` fixes the five body
sections — and `docs/ideas.md` drafts further candidates.

`architect`, `planner`, `builder`, `reviewer` and `qa-engineer` carry the `Skill`
tool so a playbook — and `hr-report` — is reachable from inside a dispatch.
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

`/corporate:hr` is the only component that touches the network. It dispatches
`hr-manager` — read-only, offline, and given the existing open issues in its
brief — which clusters the records, counts how often each recurs and across how
many projects, and drafts the issue text. Then you confirm them **one at a time**,
reading each body as it will be filed. Filed records move to `.corporate/hr/filed/`.

Off by default. To enable it, name the target repository in the consuming
project's committed `.claude/settings.json`:

```json
{
  "env": {
    "CORPORATE_HR_REPO": "<owner>/<repo>"
  }
}
```

Unset, and records are still written and still summarised — nothing is ever
filed. Add `.corporate/` to that project's `.gitignore`: records are local
evidence, and keeping them untracked is also what lets the write-less `reviewer`
file one without dirtying the tree its own review checks.

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
| Slash command | `plugins/corporate/commands/` | `/corporate:brief`, `:design`, `:plan`, `:build`, `:review`, `:qa`, `:ship`, `:hr` |
| Subagent | `plugins/corporate/agents/` | `product-owner`, `architect`, `planner`, `builder`, `reviewer`, `qa-engineer`, `scout`, `hr-manager` |
| Reference | `plugins/corporate/reference/` | `plan-format.md` — the `plan.md` grammar |
| Skill | `plugins/corporate/skills/` | `corporate-pipeline`, `hr-report`, `typescript-mcp-playbook`, `bun-runtime-playbook`, `bun-pm-playbook`, `bun-bundler-playbook`, `bun-test-playbook` |
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
/help                     # /corporate:brief … :ship should be listed
/agents                   # product-owner, architect, planner, builder, reviewer,
                          # qa-engineer, hr-manager should be listed
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
      "Bash(gh issue list:*)"
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
