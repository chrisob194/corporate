# Authoring components

Frontmatter reference for each component type in `plugins/corporate/`.
Keep `description` written as a trigger ("Use when …") — that string is what
Claude reads when deciding whether to load the component.

## Slash command — `commands/<name>.md`

Invoked as `/corporate:<name>`. A subdirectory adds a namespace segment.

```markdown
---
description: One line, shown in /help.
argument-hint: [issue-number] [--dry-run]
allowed-tools: Bash(git log:*), Read
model: inherit
disable-model-invocation: false
---

Body = the prompt. `$1`, `$2` are positional args, `$ARGUMENTS` is all of them.
`!`command`` inline-executes and injects output. `@path` injects a file.
```

Only `description` is required in practice. `allowed-tools` narrows what the
command may run; omit it to inherit the session's tools.

## Subagent — `agents/<name>.md`

```markdown
---
name: reviewer               # must equal the filename
description: Use when … (this is what routes work to the agent)
tools: Read, Grep, Glob, Bash   # omit for all tools
model: opus                  # or inherit / sonnet / haiku / fable
effort: high                 # low | medium | high | xhigh | max
---

System prompt for the agent. Say what it does, what it must not do, and the
exact output shape you want back — the final message IS the return value.
```

One role per file. An agent that needs to write code and review code is two
agents.

`tools` is an allowlist. To let an agent delegate, name the types it may spawn
— `Agent(scout)` — rather than bare `Agent`, which permits every type. Nesting
is capped at three layers below the main session; at the cap the `Agent` tool is
withheld, so a delegating agent must still work when it cannot delegate.

An agent granted `Skill` is also granted `WebFetch`. The playbook skills make an
upstream doc tree the authority for their stack and forbid answering from
memory; without `WebFetch` the agent cannot honour that. `WebSearch` is not part
of the pair — only `architect` searches open-endedly.

`effort` sets reasoning effort for that agent and only applies when `model` is
pinned — on `inherit` it is a no-op. Convention in this repo: judgment roles
(`architect`, `planner`, `reviewer`, `product-owner`) get `opus` with
`high`/`xhigh`; fan-out and tool-loop roles (`builder`, `qa-engineer`) get
`sonnet`. Use `inherit` with no `effort` only for an agent that should follow
whatever model the session is on.

## Skill — `skills/<name>/SKILL.md`

```markdown
---
name: release-checklist      # must equal the directory name
description: Use when … — the trigger. Be specific; this is the only part
  always in context.
---

# Title

Instructions. Keep SKILL.md short and push detail into sibling files
(`reference.md`, `examples/`) that the body tells Claude to read when needed.
```

Progressive disclosure is the point: the description is always loaded, the body
loads on invocation, sibling files load on demand.

## Stack playbook — `skills/<stack>-playbook/`

A skill whose subject is a technology stack rather than a procedure. It keeps
stack knowledge out of the role files: `builder.md` still says "implement per
plan", the playbook says what that means in *this* stack.

One playbook per stack. A narrow description routes better than a broad one, so
there is no single `stack-playbook` with per-stack sections.

Where a stack is large enough that its own documentation splits into areas, it
gets one playbook per area — `bun-runtime-playbook`, `bun-pm-playbook`,
`bun-bundler-playbook`, `bun-test-playbook`. Each owns exactly one doc area and
one ban lane, so "one toolchain, stated absolutely" holds without a sentence
being duplicated across files. Split by the areas upstream already uses, never
by a taxonomy of your own.

### Frontmatter

`name` must equal the directory and end in `-playbook`. The `description` is a
"Use when …" trigger that names the stack **and its identifiers** — package
names, file extensions, config filenames. Those are the words that appear in a
request; the stack's marketing name often is not.

### What it is, and what it is not

A playbook is an **orientation card**: what the stack is, which commands an agent
runs, and which resources teach the stack properly. It is not a tutorial. If a
skill or MCP server already teaches the stack, the playbook lists it under
`## Resources` and spends its own body on this team's stack — nothing else.

### Body sections — this order, these names

| Section | Holds |
|---|---|
| `## Stack` | what the stack *is*, stated flat: the packages to import, the runtime, the schema library, how it serves. Facts, not a procedure for discovering facts |
| `## Toolchain` | `\| Job \| Command \|` — commands only, and what never to shell out to |
| `## Obligations by activity` | `\| Activity \| Obligation \|` — what the job demands, keyed to the activity (choosing an approach, implementing, reviewing, testing, migrating) |
| `## Traps` | where the model is wrong by default. The highest-value section |
| `## Resources` | `### Skills` / `### MCP servers` — **bare names, nothing else** |

Five sections, no others. In particular there is no version-resolution section
and no index of sibling files: name the current package in `## Stack` and the
superseded one in `## Traps`, and let the model read a `package.json` on its
own. A URL appears in exactly one place — the pinned doc source below — and
nowhere else in the file.

### Rules

- **State what we do, never what another component says.** An MCP server that
  broadcasts "call `list_projects` first", or an installed skill that teaches the
  stack end to end, needs no second copy here — but neither does it need
  reviewing. A playbook never quotes, dates, audits or corrects another
  component's content: that couples this file to one we do not own, and it rots
  the moment that component is renamed, restructured or simply fixed. Say what
  this stack does. Where that differs from what a teacher elsewhere recommends,
  the difference stands on its own and needs no commentary.
- **`## Resources` is names only.** No summaries, no "use this for X", no
  versions, no paths. A rename should cost exactly one line. What a resource
  teaches is its own description's job, and that description is already loaded.
- **Degrade gracefully.** Say what to do when the resources are absent, and never
  claim the plugin provides something it does not.
- **State facts, not procedures for finding facts.** A ladder telling the model
  how to resolve a version is machinery the model does not need. Name the package
  and move on.
- **No code block over ~15 lines in `SKILL.md`.** Longer goes to a sibling, and a
  sibling exists only when it carries a real delta.
- **Agent-agnostic.** A playbook never names an agent, a role or a tool
  allowlist. It states what an *activity* demands and lets whoever is doing that
  activity read the row. Naming roles couples the stack knowledge to the current
  team shape, and the two drift apart on the next agent rename.
- **Pin the doc source.** Where the stack has an authoritative upstream doc, one
  `## Obligations by activity` row names it: the index that resolves exact pages,
  the subtree that is this playbook's area, and that no other source substitutes
  for it. Two URLs at most, and this is the only place a playbook carries one.
  Name the authority, do not ban navigation: reaching a pinned page by search is
  fine, treating a blog post or a memory of the API as equivalent is not. It is a
  statement about where truth lives, not a procedure for finding it.
- **One toolchain, stated absolutely.** Name the package manager and runner the
  team uses and forbid the alternatives outright, including in copied doc
  snippets — upstream docs will show `npm install`, and a translated command that
  lands in a repo outlives the paste.

## Hook — `hooks/hooks.json` + `hooks/<name>.sh`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/guard.sh\"",
            "shell": "bash",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

Events: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`,
`Stop`, `SubagentStop`, `PreCompact`, `Notification`.

Rules:

- bash only — no bun/node in a hook command.
- The hook receives the event JSON on **stdin**.
- `SessionStart` / `UserPromptSubmit`: stdout is injected as context.
- `PreToolUse`: exit `2` blocks the call and shows stderr to Claude; exit `0`
  allows it. Everything else should exit `0`.
- Stay under `timeout` (seconds).
- `matcher` is a regex on the tool name (or the start reason for
  `SessionStart`); omit it to match everything.

## Reference files — `reference/<name>.md`

Plain markdown, no frontmatter, never auto-loaded. A reference file holds a
definition that more than one component needs to agree on — `plan-format.md` is
the grammar the `planner` writes and `/corporate:build` reads.

Use one whenever a format would otherwise be restated in two places. Commands
load it as `${CLAUDE_PLUGIN_ROOT}/reference/<name>.md`; agents get the path in
their brief from the dispatching command, and the command inlines the contents
if the variable does not resolve inside an agent prompt.

Not a skill: a skill is model-invoked on a trigger, which is wrong for something
that must be read every time. Not part of the agent file: two copies drift.

## MCP servers — `.mcp.json`

```json
{
  "mcpServers": {
    "my-server": {
      "command": "bun",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/server.ts"],
      "env": {}
    }
  }
}
```

Servers declared here start with the plugin. Prefer a skill or command when the
work does not need a long-lived process — an MCP server's tool schemas cost
context in every session.
