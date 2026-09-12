---
name: tailwind-playbook
description: Use when Tailwind CSS is the subject — `tailwindcss`, `@tailwindcss/vite`, `@tailwindcss/postcss`, `@tailwindcss/cli`, `@import "tailwindcss"`, `@theme`, `@source`, `@utility`, `@apply`, `@reference`, `@config`, `tailwind.config.js`, `@tailwind base`, `postcss.config.mjs`, `.postcssrc.json` — or when a project styles with utility classes directly in markup rather than through a separate stylesheet.
---

# Tailwind Playbook

## Stack

Tailwind CSS v4 is the current major; for an existing project, the major in
its own `tailwindcss` dependency governs which rules below apply.

| Pipeline | Packages | Plugin registered in |
|---|---|---|
| Vite | `tailwindcss`, `@tailwindcss/vite` | `vite.config.ts` |
| PostCSS | `tailwindcss`, `@tailwindcss/postcss`, `postcss` | `postcss.config.mjs` (or `.postcssrc.json`, where a framework's own guide names that file) |
| No bundler | `tailwindcss`, `@tailwindcss/cli` | none |

The stylesheet entry point is one line, identical across all three pipelines:
`@import "tailwindcss";`, placed in the project's CSS entry file.

That same file is the configuration. A top-level `@theme { … }` block declares
theme tokens in the namespaces `--color-*`, `--font-*`, `--text-*`,
`--breakpoint-*`, `--spacing-*`, `--radius-*`, `--shadow-*`. `--color-*:
initial` clears one namespace; `--*: initial` clears every default. Theme
variables are also emitted as real CSS custom properties, usable directly in
plain CSS.

`tailwind.config.js` still works, but it is opt-in — loaded explicitly with
`@config "../../tailwind.config.js";` — and even loaded, `corePlugins`,
`safelist` and `separator` do nothing in v4.

There is no `content` array. Tailwind scans project files as plain text,
skipping `.gitignore`d files, `node_modules`, binary files, CSS files and
lockfiles. `@source "…"` registers an extra source, `source("…")` on the
`@import` sets the base path, `source(none)` disables automatic detection,
`@source not "…"` excludes a path, and `@source inline("…")` safelists a
class — with brace expansion — rather than requiring it to appear literally
anywhere.

## Toolchain

| Job | Command |
|---|---|
| add it to a Vite pipeline | `bun add tailwindcss @tailwindcss/vite` |
| add it to a PostCSS pipeline | `bun add tailwindcss @tailwindcss/postcss postcss` |
| add it with no bundler | `bun add tailwindcss @tailwindcss/cli` |
| build or watch without a bundler | `bunx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch` |
| check the installed major | `bun pm ls \| grep tailwindcss` |
| migrate a v3 project | `bunx @tailwindcss/upgrade` |

Never `npm`, `npx`, `yarn` or `pnpm` to reach any of these — not in a shell,
not in a `package.json` script, not in CI, and not when translating a copied
upstream snippet, which prints `npm install` and `npx` throughout. The
upgrade tool needs Node.js 20 or higher; run it on a fresh branch and read the
diff rather than trusting it blind.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | Tailwind's own doc tree, `tailwindcss.com/docs`, is the authority; it publishes no `llms.txt`, so exact pages are reached through its own navigation, and `tailwindcss.com/docs/installation/framework-guides` is the subtree holding the per-build-tool wiring. A fact either page covers is read there, never asserted from memory, and no blog post, no v3-era tutorial and no framework's own README substitutes for it. Where the tree is unreachable, the installed `tailwindcss` package's own files are the fallback |
| choosing an approach | name which of the three wiring paths the pipeline dictates, and which major is in play, in writing, before any package is added — the packages, the plugin registration file and the config location all follow from those two answers, and the v3 answer is wrong for every path |
| implementing | one stylesheet entry, `@import "tailwindcss";`; theme tokens in `@theme` in that same file; extra sources through `@source`; custom utilities through `@utility`; complete class names only |
| migrating | run the upgrade tool on a fresh branch and read the diff — the renamed utilities in `## Traps` are the part it cannot verify for you |
| reviewing | reject a `@tailwind` directive, a `tailwind.config.js` relied on without `@config`, a `content` array, an `autoprefixer` or `postcss-import` entry left beside `@tailwindcss/postcss`, a `!`-prefixed important modifier, and any class name assembled from fragments |
| testing | the compiled stylesheet is the artifact — assert that a class the markup uses actually appears in the output, because source detection, not the markup, decides what ships |

## Traps

- `@tailwind base; @tailwind components; @tailwind utilities;` for the single
  `@import "tailwindcss";`
- a `tailwind.config.js` sitting in the repo and silently ignored, because v4
  does not auto-detect it — and `corePlugins`, `safelist` and `separator` not
  working even once it is loaded through `@config`
- a `content` array, replaced by automatic detection plus `@source`, with
  safelisting now `@source inline(...)`
- `tailwindcss` left as the PostCSS plugin entry when the plugin moved to
  `@tailwindcss/postcss`
- `autoprefixer` or `postcss-import` left in the chain — v4 does both itself
- `npx tailwindcss -i … -o …` when the CLI moved to `@tailwindcss/cli`
- `@layer utilities { … }` for `@utility`
- **the silent renames**, copied here rather than from memory: `shadow-sm`,
  `rounded-sm`, `blur-sm`, `drop-shadow-sm` and `backdrop-blur-sm` all exist in
  v4 and all mean what the *unsuffixed* v3 class meant — a surviving v3 class
  name renders a different size with no error. Also `ring` → `ring-3` and
  `outline-none` → `outline-hidden`
- `!flex` for `flex!` — the important modifier moved from prefix to suffix
- `bg-opacity-50` and its siblings (`text-opacity-*`, `border-opacity-*`,
  `divide-opacity-*`, `ring-opacity-*`, `placeholder-opacity-*`) for the `/50`
  opacity modifier
- Sass, Less or Stylus alongside Tailwind — v4 is explicitly not designed to
  sit underneath a preprocessor, and a workspace scaffolded `--style scss`
  discovers this late
- `@apply` inside a component-scoped stylesheet with no `@reference` to the
  global sheet — component styles compile separately and know nothing of the
  theme without it
- a dynamic class name (`class="text-{{ color }}-600"`) — the failure is a
  missing style, never an error, because Tailwind does not parse code
- assuming the browser floor is free — v4 needs Chrome 111, Safari 16.4 and
  Firefox 128, and older support means staying on v3.4
- `--force` copied from a framework's npm install line — it is an npm
  peer-resolution flag, not a Tailwind package or option, and has no place in
  a bun command

## Resources

### Skills

- angular-playbook
- bun-pm-playbook

### MCP servers

None.
