---
name: bun-pm-playbook
description: Use when installing, adding, updating, linking, patching, auditing or publishing dependencies in a Bun project — bun install, bun add, bun.lock, bunx, workspaces, catalogs, overrides, bun publish, a stray package-lock.json or yarn.lock — or when translating an npm/pnpm/yarn command into this project.
---

# Bun PM Playbook

## Stack

Bun is the package manager. One lockfile, `bun.lock`, committed. Dependencies
are declared in `package.json` and resolved by `bun install`.

- Lockfile: `bun.lock`
- Workspaces: the `workspaces` field, resolved by `bun install` from the root
- One-off binaries: `bunx`
- Publishing: `bun publish`

## Toolchain

| Job | Command |
|---|---|
| install everything | `bun install` |
| add a dependency | `bun add <pkg>` |
| add a dev dependency | `bun add -d <pkg>` |
| remove | `bun remove <pkg>` |
| update | `bun update <pkg>` |
| run a one-off binary | `bunx <pkg>` |
| inspect a registry package | `bun info <pkg>` |
| make a tarball | `bun pm pack` |
| bump the version | `bun pm version <patch\|minor\|major>` |
| rehearse a publish | `bun publish --dry-run` |
| publish | `bun publish` |
| who am I on the registry | `bun pm whoami` |

Never `npm`, `pnpm`, `yarn` or `npx` for this project's own work — not in a
shell, not in a `package.json` script, not in CI. Every one of them has a Bun
equivalent above, including the registry and packaging operations.

What a consumer outside this project is told to run is a separate question,
answered by what *they* have installed. A published package's host-config
snippet naming `npx` is correct when the consumer has Node and not Bun.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | the `bun.com/docs/pm` subtree is the authority for package-manager facts, exact pages resolved through `bun.com/llms.txt`. A fact it covers is read there, never asserted from memory, and no other source substitutes for it |
| any | a command copied from upstream documentation is translated before it is run or committed: `npm install X` is `bun add X`, `npx X` is `bunx X`. The translated form is what lands in the file |
| reviewing | reject any lockfile other than `bun.lock`, and any `npm`/`pnpm`/`yarn`/`npx` invocation |

## Traps

- A `package-lock.json`, `pnpm-lock.yaml` or `yarn.lock` in the tree means
  someone ran the wrong tool. Delete it and `bun install`.
- `bunx` and `bun x` are the same command, and it has no `-y` — it installs
  without prompting. It runs the package's binary under **Node** by default;
  `bunx --bun` is what forces Bun.
- A published package whose `bin` points at a `.ts` file with a `bun` shebang
  cannot be executed by a consumer without Bun — including via plain `bunx`,
  which reaches for Node unless given `--bun`.

## Resources

### Skills

- `bun-runtime-playbook`
- `bun-bundler-playbook`
- `bun-test-playbook`

### MCP servers

None.
