---
name: typescript-mcp-playbook
description: Use when building an MCP server or client in TypeScript — @modelcontextprotocol/server, @modelcontextprotocol/client, McpServer, serveStdio, createMcpHandler, registerTool, Client, callTool, StdioClientTransport, .mcp.json — or when a request mentions the Model Context Protocol in a TypeScript repo.
---

# TypeScript MCP Playbook

## Stack

SDK v2, which is a package split: the server and the client are separate
packages. TypeScript on Bun, run from source — the Bun playbooks own the
toolchain.

- Server: `McpServer` from `@modelcontextprotocol/server`
- Client: `Client` from `@modelcontextprotocol/client`
- Input schemas: `zod`, imported as `import * as z from 'zod/v4'`
- Serve locally: `serveStdio` from `@modelcontextprotocol/server/stdio`, given a
  factory that returns an `McpServer`
- Serve remotely: `createMcpHandler`, which returns `{ fetch }` — `export default
  handler` is the mount on Bun, Deno and Workers
- Connect: `client.connect(transport)`, with `StdioClientTransport` from
  `@modelcontextprotocol/client/stdio`, or `StreamableHTTPClientTransport`
- Entrypoint: `src/index.ts`, first line `#!/usr/bin/env bun`

## Toolchain

| Job | Command |
|---|---|
| add the server package | `bun add @modelcontextprotocol/server zod` |
| add the client package | `bun add @modelcontextprotocol/client` |
| run a stdio server | `bun run src/index.ts` |
| drive a server by hand | `bunx @modelcontextprotocol/inspector bun run src/index.ts` |

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `ts.sdk.modelcontextprotocol.io/v2` is the authority, exact pages resolved through `/v2/llms.txt` and fetchable as `.md`. A fact it covers is read there, never asserted from memory, and no other source substitutes for it — with the tree unreachable, the packages' own type definitions are the fallback |
| implementing | one Zod schema per tool as `inputSchema` — JSON Schema, argument validation and handler types all derive from it, so there is no second schema to write. Nothing goes to stdout on a stdio server |
| testing | pair a real `Client` and server in-process: `InMemoryTransport.createLinkedPair()` gives two halves, and each side takes one through its own `connect` — the one place a server is handed a transport directly. A project that only ships a server still needs `@modelcontextprotocol/client` as a devDependency to do this |
| distributing | a server ships in exactly one of two forms, and which one is named before any packaging is added. **From source**: the host config runs `bun` against `src/index.ts`, nothing is built, and the consumer needs Bun — this is the form for a server this repo runs itself. **Bundled**: `bun build --target node` produces the published entrypoint, its first line rewritten to a `node` shebang, and the consumer needs only Node. Say which form and what it costs the consumer in the same message as the change |
| reviewing | reject a `console.log` on a stdio path, and any v1 import |

## Traps

- v1 is what the model writes by default, and it is a different package
  entirely: `@modelcontextprotocol/sdk` with `StdioServerTransport`,
  `StreamableHTTPServerTransport` and a transport handed to every server. v2
  servers import from `@modelcontextprotocol/server`, and serving one constructs
  no transport at all — `serveStdio` and `createMcpHandler` own it.
- `registerTool` is not a version tell — v1 has it too. The packages and the
  serving functions are what distinguish the two.
- The two sides are asymmetric when serving: a served server names no transport,
  while a client always constructs one and passes it to `connect`. A v1 habit
  writes a transport for both.
- `serveStdio` and `createMcpHandler` take a **factory**, not a server. A single
  long-lived instance shared across connections is the v1 shape.
- `createMcpHandler` builds a fresh instance per HTTP request and holds nothing
  between them. State parked in a closure over the factory is not per-session
  state.
- On stdio, stdout is the JSON-RPC channel — the host parses every line of it.
  Log with `console.error`. A dependency that prints a banner corrupts the
  stream just as effectively as your own code.
- Tearing down a Streamable HTTP client is two calls: `transport.terminateSession()`
  before `client.close()`.

## Resources

### Skills

- `bun-runtime-playbook`
- `bun-pm-playbook`
- `bun-bundler-playbook`
- `bun-test-playbook`

### MCP servers

None.
