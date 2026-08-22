---
name: bun-bundler-playbook
description: Use when bundling or compiling a Bun project — bun build, --compile single-file executables, --target bun/node/browser, loaders, plugins, macros, minifier, bytecode caching — or when a project has or is about to gain a build script, a dist/ directory or a webpack/esbuild/rollup config.
---

# Bun Bundler Playbook

## Stack

Bundling is a deliberate act, not part of running. Bun executes TypeScript
directly, so a project bundles only to produce an artifact for somebody else:
a single-file executable, or output for a runtime that is not Bun.

- Bundler: `bun build`
- Executable: `bun build --compile`
- Targets: `bun` (default), `node`, `browser`

## Toolchain

| Job | Command |
|---|---|
| bundle | `bun build src/index.ts --outdir dist` |
| single-file executable | `bun build --compile src/index.ts` |
| target another runtime | `bun build --target node src/index.ts` |
| typecheck | `bunx tsc --noEmit` |

Never `webpack`, `rollup`, `esbuild`, `parcel`, or `tsc` as an emitter. `tsc` is
a typechecker here and takes `--noEmit`.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `bun.com/docs/bundler` is the authority for bundler facts, exact pages resolved through `bun.com/llms.txt`. A fact it covers is read there, never asserted from memory, and no other source substitutes for it |
| choosing an approach | state what consumes the artifact before adding a build. A program only this project runs needs no bundle at all |
| reviewing | reject a `build` script that exists so the program can be run locally, and any emitted output committed to the tree |

## Traps

- A `build` script added to make something runnable is the wrong fix — `bun run`
  already runs TypeScript. Only a consumer outside this project justifies one.
- `--compile` output is per-platform and tens of megabytes. Distributing it
  through npm means one artifact per target, not one package.
- `--target node` output is Node-compatible JavaScript; Bun-only APIs
  (`Bun.serve`, `Bun.file`) do not survive it.
- `bun build` copies the source's shebang into the bundle and injects a `// @bun`
  line after it. `--banner` is appended *below* both, so a bundle built from a
  `#!/usr/bin/env bun` source ends up with two shebangs and the wrong one first.
  Rewrite line one of the output instead.
- Emitted output belongs in `.gitignore`. Committed build output is stale the
  moment the source moves.

## Resources

### Skills

- `bun-runtime-playbook`
- `bun-pm-playbook`
- `bun-test-playbook`

### MCP servers

None.
