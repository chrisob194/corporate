#!/usr/bin/env bash
# EXAMPLE HOOK — shipped as a template. Prints nothing, injects nothing.
#
# SessionStart hooks inject their stdout into the session as context.
# Keep it silent until there is something worth spending tokens on.
#
# Rules for hooks in this plugin:
#   - bash only, no bun/node dependency (a missing interpreter breaks the session)
#   - always exit 0 unless the intent is to block the tool call
#   - stay under the declared timeout
#   - stderr is for diagnostics, stdout is context the model reads
#
# Example of what a real one would do:
#   [ -f "$CLAUDE_PROJECT_DIR/TODO.md" ] && echo "Open TODO.md found."

set -euo pipefail
exit 0
