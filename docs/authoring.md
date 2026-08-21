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
