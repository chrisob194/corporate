# Review — #36

**Verdict:** pass with findings
**Defect origin:** none

Both tasks built what the design and plan specified, every acceptance command passes, and every Angular claim in the shipped skill traces to F1–F11 and re-verifies against upstream today; what is left is four small non-blocking gaps and some format taste.

## Acceptance

**T1 — Author the angular-playbook skill** (3 of 3)

- `bun run validate` → exit 0, `OK — 0 warning(s).`, no error naming `angular-playbook`. PASS
- `grep -n '^## ' plugins/corporate/skills/angular-playbook/SKILL.md` → `8:## Stack`, `33:## Toolchain`, `51:## Obligations by activity`, `68:## Traps`, `96:## Resources` — exactly five, in the required order. PASS
- `grep -c 'angular.dev' …/SKILL.md` → `2`, both on the pinned-source obligation rows (lines 55, 56). A broader `grep -nE 'https?://|\.dev|\.com|\.org'` returns only those same two lines, so the "one place a URL appears" rule holds. PASS

**T2 — Register the seventeenth playbook and bump the version** (4 of 4)

- `bun run validate` → exit 0. PASS
- `grep -riq 'sixteen' README.md CLAUDE.md` → exit 1 (no stale count). PASS
- `grep -q angular-playbook README.md && grep -q angular-playbook CLAUDE.md` → exit 0. PASS
- `grep -q '"version": "5.2.0"' plugins/corporate/.claude-plugin/plugin.json` → exit 0. PASS

**Declared suite** — `plugin structure` / integration / `bun run validate` → exit 0, matching the test stage's rolled-up `pass`.

**Independent fact verification** (not an acceptance command, but the design's `not-required` stack verdict rests on F1–F11 being right, so I checked the load-bearing ones myself):

- `registry.npmjs.org/-/package/@angular/core|cli/dist-tags` → `latest` `22.1.6` / `22.1.8`, with `v21-lts` and `v20-lts` present. F1 confirmed; "Angular v22 is the current major" is true as written.
- `angular.dev/cli/new` → `--package-manager` allows `bun`; `--ai-config` allows `claude-code`; `--standalone` and `--strict` default true; no documented default for `--ssr`. F5 confirmed, including the scaffold command in `## Toolchain` being runnable.
- `angular.dev/tools/cli/deployment` → "you must configure the server to return the application's host page (`index.html`) when asked for a file that it does not have"; "Prefer `<base href>` where possible". F4 confirmed verbatim in substance.
- `angular.dev/reference/configs/workspace-config` → `outputPath` is "either a String which will be used as the `base` value or an Object"; `browser`/`server`/`media` default to `browser`/`server`/`media`. F3 confirmed.
- `angular.dev/assets/context/best-practices.md` → every practice claim in `## Traps` matches upstream, including the version keys ("default in Angular v20+" for standalone, "`OnPush` is the default in Angular v22+", "Do NOT use `mutate` on signals, use `update` or `set`").
- `angular.dev/ai/mcp` → documents `ai_tutor`, `devserver.start`, `devserver.stop`, `devserver.wait_for_build`, `get_best_practices`, `list_projects`, `onpush_zoneless_migration`, `run_target`, `search_documentation`, started as `npx @angular/cli mcp`. F9 confirmed, dot-separated names included; the five tools the skill names literally are all present.

Nothing in the skill reads as unstated recollection — no Angular claim was found that is not in F1–F11, and no F-fact is misquoted.

## Design drift

One minor divergence, non-blocking:

- `plugins/corporate/skills/angular-playbook/SKILL.md:55-56` — the design says "The pinned doc source **row** names two URLs and no more", and `docs/authoring.md:158-161` says "one `## Obligations by activity` row names it". It shipped as two `any` rows. The content is exactly the design's (authority, index, best-practices file, fallback ladder) and the two-URL cap is respected; only the row count differs. Siblings (`typescript-playbook:45`, `docker-playbook:54`, `nginx-playbook`) each use a single `any` row.

Everything else matches: five sections in order, no sixth, no version-resolution ladder, no `references/` sibling, no code block at all (let alone over ~15 lines), 106 lines (plan's 100–135 band), bun-only `## Toolchain` with `npm`/`npx`/`yarn`/`pnpm` appearing only inside the ban lane and the corresponding trap, `## Resources` names-only.

Non-goals hold. No change to `plugins/corporate/.mcp.json`, no change to any agent's `tools:` line, no second framework named anywhere in the skill, and the server's own protocol is not restated — no "call `list_projects` first", no quoted or dated instructions.

## Plan drift

None.

- T1 (`4e9d6a2`) touched exactly `plugins/corporate/skills/angular-playbook/SKILL.md`, 1 file, 106 insertions.
- T2 (`4369cc1`) touched exactly `README.md`, `CLAUDE.md`, `docs/ideas.md`, `plugins/corporate/.claude-plugin/plugin.json`, and nothing else. It did not touch T1's file.
- T2's edits land where the plan said: `README.md:263` "Seventeen ship today", the new clause placed before the "one per Bun doc area" sentence, `README.md:417` Skill row with `angular-playbook` after `github-playbook` and before the Bun four, `CLAUDE.md:37-43` "seventeen" with the name in the same relative position, `docs/ideas.md:54` status line only (`shipped — built and registered by issue #36`) with the entry's reasoning intact, version `5.1.0` → `5.2.0`.
- `docs/ideas.md:305` is untouched and belongs to the "Gate 2" entry, as the design predicted.
- A check for a registration surface the design might have missed (`grep -rln 'github-playbook'` outside `docs/corporate/`) returns only `README.md`, `CLAUDE.md` and `github-playbook/SKILL.md`, and no count word (`sixteen`/`seventeen`/numeric) survives anywhere else in the repo. `marketplace.json` carries no version. The four surfaces were the complete set.
- The `docs/corporate/36/*` commits are the orchestrator's own artifacts, not drift.

## Correctness

All four findings are **non-blocking**; none carries an origin.

**1. The scaffold command omits the one flag the file says must always be named.**
- `plugins/corporate/skills/angular-playbook/SKILL.md:37` (against `:28-29` and `:57`)
- The `## Stack` bullet says "Name `--ssr` explicitly — no default is documented", and the `choosing an approach` obligation repeats it, but the `## Toolchain` scaffold row is `bunx @angular/cli@latest new <name> --package-manager bun --ai-config claude-code` with no `--ssr`.
- Concrete failure: an agent copies the Toolchain row verbatim (the rows exist to be copied). Upstream documents no default for `--ssr`, so `ng new` prompts for it — in a non-interactive agent session that either blocks or takes an undeclared default, and the build output contract (`dist/<project>/browser` vs `+ server`) is then whatever the prompt resolved to. That is exactly the ambiguity the `## Stack` bullet exists to close. Non-blocking because the plan (step 14) specified that exact command string and the rule is stated two bullets above the table.

**2. The `outputPath` object form is described without the key it requires.**
- `plugins/corporate/skills/angular-playbook/SKILL.md:17-19`
- The skill lists the `browser`/`server`/`media` defaults but drops F3's "`base` has no default and is required in the object form".
- Concrete failure: an agent follows the bullet and writes `"outputPath": { "browser": "web" }` into `angular.json`; the build fails on the missing required `base` rather than using `dist/<project>` as the reader would expect from "`outputPath` is a string (the base) or an object". The fact is in the design; only the transcription is short. Non-blocking — the plan's step 13 asked only that the string/object duality be stated.

**3. The MCP tool-name paragraph couples this file to a component we do not own.**
- `plugins/corporate/skills/angular-playbook/SKILL.md:62-66`
- It names five tools and then explains an editorial policy about a naming discrepancy: "The dev-server tools are referred to by task, never by a pinned name — the two sources spell them differently."
- Concrete failure: upstream normalizes the separator (today `angular.dev/ai/mcp` prints `devserver.start`, the running server exposes `devserver_start`) and that sentence becomes false, or `run_target` is renamed and the list becomes wrong — the rot `docs/authoring.md:134-143` and `docs/ideas.md:86-94` ("never audits, dates or corrects another component's content") are written to prevent, and which the design's own `## Rejected` priced. It is also the one passage that gives the reader no actionable rule: the `implementing` row already names the activities. Non-blocking, and the tool list itself was explicitly authorized by plan step 16 — only the rationale sentence is the builder's addition, and it states a fact that is accurate today (verified above).

**4. Requirement 2's "registry metadata" leg is not traceable from the shipped file.**
- `plugins/corporate/skills/angular-playbook/SKILL.md:10-12`
- "Angular v22 is the current major" is the one claim whose source is a registry dist-tag, and the file pins only the two `angular.dev` URLs.
- No constructible runtime failure — the claim is correct (verified above), and `docs/authoring.md:161` caps a playbook at two URLs, so a third could not be added without breaking the format contract. Recording it because the spec names registry metadata explicitly: the trace for that one fact lives in `docs/corporate/36/design.md` F1, not in the guidance artifact. Worth knowing at the next major bump.

Requirements 1, 3, 4, 5 and 6 are met by the shipped file, not merely gestured at: all four rulings appear flat in `## Stack` (major, scaffolding baseline, build output, static serving), so a design act can verdict them without a fetch; `## Traps` carries the full superseded-pattern set including RxJS-heavy state, NgModules and the structural directives; and the `implementing` obligation directs an agent to prefer the Angular CLI MCP server's tooling for scaffolding help, best-practice lookup and build or dev-server verification *when it is in the session*, with the `## Toolchain` commands as the named fallback — conditional, so the non-goal against a standing grant holds.

## Taste

Not blocking, no origin.

- `angular-playbook` is the first playbook whose `### MCP servers` section is not `None.` — all sixteen siblings are. A reader skimming `## Resources` alone cannot tell `angular-cli` is bring-your-own; the `implementing` row does condition on presence, so `docs/authoring.md:147-148` is satisfied, but the asymmetry is new.
- Prose after the `## Obligations by activity` table is unprecedented among siblings (typescript, docker and nginx are table-only there). Prose after the `## Toolchain` table, which this file also has, *is* established (`docker-playbook`).
- `bunx ng …` resolves the workspace binary inside a workspace, but outside one `bunx` would fetch the unrelated npm package `ng`. Every row here is a workspace operation, so no failure could be constructed — noting it only because the design already flagged `bunx ng` friction under `## Risks`.
- Version rot on `## Stack`'s "v22" is real and already priced in the design's `## Risks`; the pinned best-practices file versions its own claims, which is what will catch it.

Files read: `docs/corporate/36/spec.md`, `docs/corporate/36/design.md`, `docs/corporate/36/plan.md`, `plugins/corporate/skills/angular-playbook/SKILL.md`, `docs/authoring.md`, `docs/ideas.md`, `README.md`, `CLAUDE.md`, `plugins/corporate/.claude-plugin/plugin.json`, `scripts/validate.ts`, and the `typescript-playbook`, `docker-playbook`, `nginx-playbook` SKILL.md files as format comparators.
