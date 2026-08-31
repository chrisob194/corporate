---
name: typescript-playbook
description: Use when a project's types are the subject — tsconfig.json, tsc, --noEmit, strict, moduleResolution, skipLibCheck, paths, .d.ts, import type, any, @ts-ignore, a type error crossing a package boundary — or when picking, pinning or bumping the typescript version, or when a build script is about to shell out to tsc.
---

# TypeScript Playbook

## Stack

`typescript` is a devDependency and a checker only. Bun runs `.ts` directly and
the bundler owns output, so nothing here emits: `noEmit` is on and `tsc` never
appears in a build script.

- Checker: `typescript`, with `@types/bun` and `"types": ["bun"]`
- Config: one `tsconfig.json` per package, each extending one base at the root
- Baseline: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `verbatimModuleSyntax`, `noEmit`, `moduleResolution: "bundler"`,
  `module: "Preserve"`, `moduleDetection: "force"`, `allowImportingTsExtensions`
- Cross-package types: the consumed package's `exports` carries a `types`
  condition pointing at its **source** `.ts`. The workspace symlink plus that
  condition is the whole mechanism — no `paths`, no emitted `.d.ts`, no project
  references
- The major is decided by the strictest `typescript` peer range the project's
  dependencies declare, not by the registry's `latest`
- Style: no `any` and no `@ts-ignore`; type-only imports written `import type`

## Toolchain

| Job | Command |
|---|---|
| add the checker | `bun add -d typescript @types/bun` |
| typecheck | `bunx tsc --noEmit` |
| typecheck one package | `bunx tsc --noEmit -p packages/<name>` |
| rerun on save | `bunx tsc --noEmit --watch` |
| see the config actually in force | `bunx tsc --showConfig` |

Never `npm`, `npx`, `yarn` or `pnpm` to reach `tsc`, not in a shell, not in a
`package.json` script, not in CI. Never `tsc` in a `build` script — it is a
checker here and takes `--noEmit`.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `typescriptlang.org/tsconfig` is the authority for compiler options and `typescriptlang.org/docs/handbook/modules` for resolution behaviour. A fact either covers is read there, never asserted from memory, and no other source substitutes for it — with the tree unreachable, `tsc --showConfig` and the installed package's own type definitions are the fallback |
| choosing an approach | settle the major from the declared peer ranges before anything is installed, and say which dependency set it. A workspace gets a base config plus one per package, never a single root config standing in for all of them |
| implementing | the baseline stays on. A type error is fixed in the types; widening it away with `any`, an assertion or `@ts-ignore` is a different change and is named as one |
| testing | a type error crossing a package boundary is caught by `bunx tsc --noEmit`, not by running the code — Bun strips types without checking them, so a green suite proves nothing about types |
| reviewing | reject a loosened `strict`, a new `any`, assertion or `@ts-ignore` with no stated reason, a `paths` entry standing in for a workspace dependency, and `tsc` invoked anywhere without `--noEmit` |

## Traps

- Installing the newest published major is the default move and usually the
  wrong one: a framework declares a `typescript` peer range and hard-rejects
  anything past it, so the newest major stays out of range for months.
- `paths` is the pre-workspace habit for reaching a sibling package. It makes
  the import resolve for the checker only — the runtime and the bundler still do
  a real `node_modules` lookup, and still fail.
- `skipLibCheck` skips every `.d.ts`. A sibling package consumed through emitted
  declarations therefore goes unchecked, while one whose `types` condition
  points at source stays checked. That choice, not the flag, decides whether the
  boundary is covered.
- Passing files to `tsc` on the command line makes it ignore `tsconfig.json`
  entirely, so an ad-hoc check runs under different rules than CI.
- `allowImportingTsExtensions` is legal only alongside `noEmit`. It is in the
  baseline because nothing here emits; a package that starts emitting loses it.

## Resources

### Skills

- `bun-runtime-playbook`
- `bun-pm-playbook`
- `bun-bundler-playbook`
- `bun-test-playbook`
- `typescript-mcp-playbook`

### MCP servers

None.
