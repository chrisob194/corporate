---
description: Deprecated alias for /corporate:design. Dispatch the technical-architect to choose an approach for an Open issue and return the task breakdown built on it, and file both the design and the plan in the issue store.
argument-hint: <issue> [--small] [--without-playbook <stack>]
---

# Plan (deprecated)

Issue: `$1` · Arguments: `$ARGUMENTS`

This command was merged into `/corporate:design`. The design and plan stages are
now one dispatch, one gate, two artifacts — there is no narrower redo of just
the breakdown, so redoing this command redoes the whole pass, approach and
breakdown together:

```
/corporate:design $ARGUMENTS
```

Say that the stages merged, in one line, then do exactly what
`${CLAUDE_PLUGIN_ROOT}/commands/design.md` says, with `$1` as its issue and
`$ARGUMENTS` as its arguments. Read that file and follow it — do not summarise
it, do not reimplement it, and do not carry a second copy of any of its rules.
</content>
