---
name: typescript-mcp-server-playbook
description: Use when building or changing an MCP server in TypeScript — @modelcontextprotocol/sdk, StdioServerTransport, StreamableHTTPServerTransport, tool/resource/prompt handlers, mcp.json, .mcp.json, bun.lock — or when a request mentions a Model Context Protocol server in a TypeScript repo.
---

# TypeScript MCP Server Playbook

## Stack

TypeScript, run by **Bun**. Bun executes `.ts` directly, so there is no build step and no
`dist/`.

- SDK: `@modelcontextprotocol/sdk`
- Input schemas: `zod`
- Local transport: `StdioServerTransport`
- Remote transport: `StreamableHTTPServerTransport`, served by `Bun.serve`
- Entrypoint: `src/index.ts`, first line `#!/usr/bin/env bun`
- Lockfile: `bun.lock`

## Toolchain

| Job | Command |
|---|---|
| install | `bun install` |
| add a dependency | `bun add <pkg>` |
| run the server | `bun run src/index.ts` |
| typecheck | `bunx tsc --noEmit` |
| test | `bun test` |
| one-off binary | `bunx <pkg>` |
| single-file executable | `bun build --compile src/index.ts` |

Never `npm`, `pnpm`, `yarn`, `npx`, `node`, `ts-node`, `tsx`, `nodemon`, `jest` or
`vitest` — not in a shell, not in a `package.json` script, not in CI.

## Obligations by activity

| Activity | Obligation |
|---|---|
| choosing an approach | deployment model, tool-design pattern and auth come from `build-mcp-server`. This file settles the runtime and the commands, nothing else |
| implementing | a Bun-native API where one exists (`Bun.serve`, `Bun.file`) in preference to the `node:` shim; no `build` script and no `dist/` in `package.json` |
| testing | `bun test`; do not add a test-runner dependency |
| reviewing | reject any `npm` or `node` invocation, any lockfile other than `bun.lock`, and any reintroduced build step |
| any | translate every command taken from upstream documentation into the toolchain above before it is run or committed |

If `build-mcp-server` is not available, build against `@modelcontextprotocol/sdk`
directly — the toolchain and traps here still hold.

## Traps

- Upstream snippets are npm and node. `npm install X` is `bun add X`; `node build/index.js`
  is `bun run src/index.ts`. A translated command that lands in `package.json` outlives
  the paste that produced it.
- On stdio, anything written to stdout that is not JSON-RPC corrupts the stream. Log with
  `console.error`, never `console.log`.
- `tsc` is a typechecker here, `--noEmit` always. Emitting `dist/` puts back the build
  step Bun removes.
- `bun --watch` restarting a stdio server kills the client's session. Restart the host
  instead.
- Cloudflare Workers runs on workerd, not Bun. There Bun is the package manager and the
  dev driver only, and Bun-only APIs do not ship.
- A `package-lock.json` in the tree means someone ran npm. Delete it and `bun install`.

## Resources

### Skills

- `build-mcp-server`

### MCP servers

None.
