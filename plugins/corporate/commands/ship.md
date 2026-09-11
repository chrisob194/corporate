---
description: Deprecated alias for /corporate:run. Work one Open issue end to end and unattended, then push and open a pull request.
argument-hint: <issue> [--small]
---

# Ship (deprecated)

Arguments: `$ARGUMENTS`

This command was renamed. The pipeline is now one loop among several, and the
command that drives it is named for what it does rather than for where it ends:

```
/corporate:run $ARGUMENTS
```

Say that the name changed, in one line, then do exactly what
`${CLAUDE_PLUGIN_ROOT}/commands/run.md` says, with `$1` as its issue and
`$ARGUMENTS` as its arguments. Read that file and follow it — do not summarise
it, do not reimplement it, and do not carry a second copy of any of its rules.

Before it, `/corporate:brief --promote <issue>` is what makes an issue eligible
to run. This alias exists for the muscle memory and goes away in the release
after next.
