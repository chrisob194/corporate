---
name: zod-playbook
description: Use when work touches Zod — `zod`, `zod/v4`, `zod/mini`, `z.object`, `z.strictObject`, `z.looseObject`, `.parse`, `.safeParse`, `ZodError`, `error.issues`, `z.toJSONSchema`, `.meta()`, `z.codec`, `.refine`, `z.discriminatedUnion` — or when a schema validates untrusted input, an MCP tool `inputSchema`, a request body, a config file, or an environment.
---

# Zod Playbook

## Stack

Zod 4, imported as `import * as z from 'zod/v4'`. The root `"zod"` export is
Zod 4 as well, but the versioned subpath is the import that survives the next
major — it is what `typescript-mcp-playbook` writes, and there is no reason for
two spellings in one repo.

One schema is the whole contract. It validates, it narrows the TypeScript type,
and `z.toJSONSchema` emits the JSON Schema a protocol needs — there is never a
second, hand-written schema to keep in step.

| Want | Constructor |
|---|---|
| unknown keys **stripped** from the result | `z.object()` — the default |
| unknown keys **rejected** | `z.strictObject()` |
| unknown keys **passed through** | `z.looseObject()` |
| unknown keys validated against a schema | `.catchall(schema)` |

- Parse at the boundary, once. Everything inside the boundary takes the parsed
  type, never the raw input.
- `.safeParse()` returns `{ success: true, data }` or `{ success: false, error }`.
  `.parse()` throws `ZodError`. `.parseAsync()` / `.safeParseAsync()` are
  required if any refinement or transform is async.
- `z.validate()` is a boolean type guard that never builds an error object —
  the fast path when the failure needs no message.

## Toolchain

| Job | Command |
|---|---|
| add it | `bun add zod` |
| check the installed major | `bun pm ls \| grep zod` |
| see the JSON Schema a schema emits | `bun -e "import * as z from 'zod/v4'; console.log(JSON.stringify(z.toJSONSchema(<schema>), null, 2))"` |
| watch a schema accept or reject one input | `bun -e "…; console.dir(S.safeParse(<input>), {depth:null})"` |

The last two are how a claim about Zod's behaviour is settled: run it against
the pinned version. A behaviour asserted from memory and not observed is not a
fact about this project.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `zod.dev` is the authority, its pages indexed by `zod.dev/llms.txt`. A fact it covers is read there, never asserted from memory, and no blog post or SDK README substitutes for it |
| choosing an approach | name the unknown-key policy in writing — strip, reject or pass through — before any schema is written. It is the decision this library makes silently and wrongly by default for a security boundary |
| implementing | one schema per boundary, `z.toJSONSchema` for anything a protocol must publish, `.meta({ description })` for anything a human or a model reads. A field that is optional and a field that has a default are different contracts — pick deliberately |
| reviewing | reject a `z.object()` on a trust boundary whose stripping is not stated as intended, a `.parse()` in a request path with no catch, a hand-written JSON Schema beside a Zod schema of the same thing, a raw `error.issues` dump sent to a user, and `.transform()` in a schema something calls `z.encode` on |
| testing | the rejection cases are the suite — the extra key, the wrong type, the missing required field, the boundary value. A schema is only proven by what it refuses |

## Traps

- **`z.object()` strips.** An undeclared key does not fail; it silently
  disappears from `data`. On a trust boundary that is the wrong default —
  `z.strictObject()` is what turns a typo'd or injected field into an error.
- `z.toJSONSchema` defaults to `io: "output"`, the type *after* transforms. A
  schema published so a caller knows what to **send** needs `io: "input"`.
  `z.string().transform(v => v.length).pipe(z.number())` emits `{ type: "number" }`
  in output mode and `{ type: "string" }` in input mode — the same schema, two
  opposite contracts.
- `additionalProperties: false` is emitted for `z.object()` in output mode and
  **not set at all** in input mode. `z.looseObject()` never sets it;
  `z.strictObject()` always does. A consumer that trusts the emitted schema to
  describe rejection is reading the wrong mode.
- Unrepresentable types — `bigint`, `symbol`, `undefined`, `void`, `date`,
  `map`, `set`, `nan`, a transform, a custom — make `z.toJSONSchema` **throw** by
  default. `unrepresentable: "any"` emits `{}`, which is a schema that validates
  nothing; choosing it is a decision, not a fix.
- `.optional()` accepts an explicit `undefined`. `.exactOptional()` is the one
  that allows the key to be absent without allowing `undefined` through it —
  the distinction TypeScript's `exactOptionalPropertyTypes` makes, and the one a
  JSON boundary usually means.
- `.default(v)` short-circuits on `undefined`, so the output type is not
  optional even though the input is. A caller reading the output type sees a
  guarantee the input never made.
- `.transform()` is **one-directional**. If one exists anywhere in a schema,
  `z.encode()` on it throws at runtime. A value that must convert both ways is a
  `z.codec`, whose two directions are `.decode()` / `.encode()` (with `safe`
  and `Async` variants).
- `error.issues` is machine data — `{ code, path, message, expected }`, `path`
  an array. It is not a user-facing message. `z.prettifyError()` gives the
  human string, `z.treeifyError()` the nested shape for a deep form,
  `z.flattenError()` the `formErrors` / `fieldErrors` pair for a flat one.
  `z.formatError()` is deprecated.
- `z.union` tries each option and reports every failure; `z.discriminatedUnion("kind", …)`
  narrows on the key and reports one. On anything with a tag field, the union is
  the worse error message as well as the slower parse.
- A schema in a registry with no `id` is **ignored** when the registry is
  converted — the `$ref`s silently do not appear.
- A self-referential schema is defined with a getter (`get subcategories() { return z.array(Category) }`),
  not a `z.lazy` wrapper reached for from memory.

## Resources

### Skills

- `typescript-playbook`
- `typescript-mcp-playbook`
- `bun-pm-playbook`
- `bun-test-playbook`

### MCP servers

None.
