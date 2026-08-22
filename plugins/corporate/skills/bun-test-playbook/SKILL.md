---
name: bun-test-playbook
description: Use when writing or running tests in a Bun project — bun test, bun:test, describe/it/expect imported from bun:test, --preload, --coverage, --watch, snapshots, mock/spyOn, DOM testing — or when a project has or is about to gain a jest or vitest dependency or config.
---

# Bun Test Playbook

## Stack

Bun has a built-in test runner. It needs no dependency, no config file and no
transform step: `bun test` discovers and runs TypeScript tests directly.

- Runner: `bun test`
- Imports: `describe`, `it`, `expect`, `mock`, `spyOn` from `bun:test`
- Discovery: files matching `*.test.ts`, `*_test.ts`, `*.spec.ts`, `*_spec.ts`

## Toolchain

| Job | Command |
|---|---|
| run every test | `bun test` |
| one file or filter | `bun test <path-or-pattern>` |
| rerun on save | `bun test --watch` |
| coverage | `bun test --coverage` |
| setup before tests | `bun test --preload ./setup.ts` |

Never `jest`, `vitest`, `mocha` or `ava`, and never a test-runner dependency —
the runner ships with Bun.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `bun.com/docs/test` is the authority for test-runner facts and `bun.com/reference` for the `bun:test` API surface, exact pages resolved through `bun.com/llms.txt`. A fact either covers is read there, never asserted from memory, and no other source substitutes for it |
| testing | `bun test`, with assertions from `bun:test`. No runner is installed to get a feature that already exists |
| reviewing | reject a `jest`/`vitest` dependency, config file, or a `test` script that shells out to either |

## Traps

- `bun:test` is Jest-compatible, not Jest. A Jest snippet that imports from
  `@jest/globals` or relies on a `jest.config.js` does not carry over — the
  imports come from `bun:test` and the config does not exist.
- A test file matched by discovery runs even without a `test` script in
  `package.json`. Renaming a file to `*.test.ts` is enough to enrol it.
- `--preload` runs before the test files, which is where global setup belongs.
  Setup put at the top of one test file does not apply to the others.

## Resources

### Skills

- `bun-runtime-playbook`
- `bun-pm-playbook`
- `bun-bundler-playbook`

### MCP servers

None.
