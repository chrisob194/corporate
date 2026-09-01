---
name: typescript-mcp-playbook
description: Use when building an MCP server or client in TypeScript — @modelcontextprotocol/server, @modelcontextprotocol/client, McpServer, serveStdio, createMcpHandler, registerTool, Client, callTool, StdioClientTransport, .mcp.json, the MCP Inspector (`--cli`, `--method tools/call`) — or when a request mentions the Model Context Protocol in a TypeScript repo.
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
| list a local server's tools, non-interactively | `bunx @modelcontextprotocol/inspector --cli bun run src/index.ts --method tools/list --format json` |
| call a tool with a verbatim argument object | `… --cli <server> --method tools/call --tool-name <t> --tool-args-json '{"zip":"10001"}'` |
| reach a remote server | `… --cli https://host/mcp --transport http --method tools/list` |
| carry a bearer credential | `… --header "Authorization: Bearer $TOKEN"` |
| run it where nobody can complete a browser flow | add `--stored-auth-only` |

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `ts.sdk.modelcontextprotocol.io/v2` is the authority for the SDK and `modelcontextprotocol.io/docs/*/tools/inspector` for the inspector's flags, exact pages resolved through `/v2/llms.txt` and fetchable as `.md`. A fact it covers is read there, never asserted from memory, and no other source substitutes for it — with the tree unreachable, the packages' own type definitions are the fallback |
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
- The inspector is **three clients behind one binary** — `--web` (the default),
  `--cli`, `--tui` — and the mode flag is recognised only at the front of the
  command line. The web form is generated from the tool's `inputSchema`, so it
  cannot send a key the schema does not declare: an undeclared-key or wrong-type
  behaviour is only exercisable from `--cli`.
- `--tool-arg key=value` **coerces** by JSON-parsing the value, so `count=1` is a
  number and `"012"` becomes `12`. `--tool-args-json` passes the whole object
  verbatim and is the one that preserves a string. The two are mutually
  exclusive.
- `--cli` exit codes are the contract, not the prose: `3` needs auth, `4` server
  unreachable, `5` a `tools/call` that returned `isError: true` or a missing
  tool. A non-zero exit also writes one JSON line to stderr. A pipeline that
  greps the message instead of branching on the code is reading the wrong thing.
- Left alone, the CLI runs the same loopback OAuth flow as the UI and waits on a
  localhost callback no CI job can complete. `--stored-auth-only` is the flag
  that fails fast instead; `--use-stored-auth` reuses a token the web inspector
  already obtained on this machine.
- The reference flags are `--uri` (not `--resource-uri`) and `--prompt-args`
  (not `--prompt-arg`), and `--config <file>` is read-only while `--catalog` is
  the writable one. A `--config` naming a file that does not exist is an error,
  never a seed.
- `--` splits the inspector's own flags from the server's. Without it a server
  argument spelled `--config` is eaten by the inspector.
- Tearing down a Streamable HTTP client is two calls: `transport.terminateSession()`
  before `client.close()`.

## Resources

### Skills

- `bun-runtime-playbook`
- `bun-pm-playbook`
- `bun-bundler-playbook`
- `bun-test-playbook`
- `typescript-playbook`
- `zod-playbook`

### MCP servers

None.
