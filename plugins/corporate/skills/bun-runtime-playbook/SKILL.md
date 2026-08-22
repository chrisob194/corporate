---
name: bun-runtime-playbook
description: Use when running or writing TypeScript on the Bun runtime — Bun.serve, Bun.file, Bun.spawn, bunfig.toml, bun run, bun --watch, bun --hot, bun repl, a `#!/usr/bin/env bun` shebang, or `node:` compatibility questions inside a Bun project.
---

# Bun Runtime Playbook

## Stack

Bun executes `.ts` and `.tsx` directly. Running needs no build step and no `dist/`;
types are checked separately.

- Entrypoint: `src/index.ts`, first line `#!/usr/bin/env bun`
- Server: `Bun.serve`, a `fetch(req: Request): Response` handler
- Files: `Bun.file`, `Bun.write`
- Subprocesses: `Bun.spawn`
- Config: `bunfig.toml`
- `node:*` modules are available and are the fallback, not the default

## Toolchain

| Job | Command |
|---|---|
| run a file | `bun run src/index.ts` |
| run and reload on save | `bun --watch src/index.ts` |
| reload without restarting | `bun --hot src/index.ts` |
| typecheck | `bunx tsc --noEmit` |
| REPL | `bun repl` |

Never `node`, `ts-node`, `tsx` or `nodemon` — not in a shell, not in a
`package.json` script, not in CI. A `.ts` file is run by `bun`, always.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `bun.com/docs/runtime` is the authority for runtime facts and `bun.com/reference` for API signatures, exact pages resolved through `bun.com/llms.txt`. A fact either covers is read there, never asserted from memory, and no other source substitutes for it |
| implementing | a Bun-native API where one exists (`Bun.serve`, `Bun.file`, `Bun.spawn`) in preference to the `node:` shim |
| reviewing | reject any `node`/`ts-node`/`tsx`/`nodemon` invocation and any `dist/` produced solely to run the program |

## Traps

- `bun --watch` reloads **in the same process** — the PID does not change, an
  inherited stdin survives the reload, and the previous module's listeners are
  torn down. A long-lived pipe to the process is not broken by a reload.
- `tsc` here is a typechecker, `--noEmit` always. Emitting output puts back the
  build step Bun removes.
- `bunfig.toml` is Bun's config, not `package.json`'s. Runtime settings put in
  `package.json` are silently ignored.
- Cloudflare Workers runs on workerd, not Bun. There Bun is the package manager
  and the dev driver only, and Bun-only APIs do not ship.

## Resources

### Skills

- `bun-pm-playbook`
- `bun-bundler-playbook`
- `bun-test-playbook`

### MCP servers

None.
