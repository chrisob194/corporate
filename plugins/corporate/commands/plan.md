---
description: Dispatch the technical-architect to choose an approach for an Open issue and return the task breakdown built on it, and file both the design and the plan in the issue store.
argument-hint: <issue> [--small] [--without-playbook <stack>]
---

# Plan (deprecated)

Arguments: `$ARGUMENTS`

This command was renamed. The design and plan stages merged into one: the
whole pass — approach *and* breakdown — is redone together now, not just the
breakdown, so a second cold dispatch on a settled approach no longer exists.

```
/corporate:design $ARGUMENTS
```

Do exactly what `${CLAUDE_PLUGIN_ROOT}/commands/design.md` says, with `$1` as
its issue and `$ARGUMENTS` as its arguments. Read that file and follow it — do
not summarise it, do not reimplement it, and do not carry a second copy of any
of its rules.
