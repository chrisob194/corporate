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

Builders run in parallel within a dependency wave, each in its own git worktree,
merged wave by wave. A merge conflict halts the build and is reported as a plan
defect — it is never hand-resolved mid-pipeline.

### Note on `superpowers`

corporate is standalone: it carries its own gates (no build without an approved
plan, no success claim without pasted evidence). If you also have the
`superpowers` plugin installed, disable it in projects where you use this
pipeline — two sets of process skills competing for the same triggers is worse
than either alone.

## What's inside

| Component | Path | Ships |
|---|---|---|
| Slash command | `plugins/corporate/commands/` | `/corporate:brief`, `:design`, `:plan`, `:build`, `:review`, `:qa`, `:ship` |
| Subagent | `plugins/corporate/agents/` | `product-owner`, `architect`, `planner`, `builder`, `reviewer`, `qa-engineer`, `scout` |
| Reference | `plugins/corporate/reference/` | `plan-format.md` — the `plan.md` grammar |
| Skill | `plugins/corporate/skills/` | none yet |
| Hook | `plugins/corporate/hooks/` | none yet |
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
                          # qa-engineer should be listed
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
      "Bash(git switch:*)"
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
