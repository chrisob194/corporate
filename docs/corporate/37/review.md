# Review — #37

**Verdict:** pass
**Defect origin:** none

Both tasks land exactly the files their `files:` lists name, every acceptance check passes when I run it, and every Tailwind claim in the shipped skill traces to the design's pinned F1–F13 set — three of which I re-verified against upstream, including the silent-rename table the design flagged as the sharpest hazard.

## Acceptance

**T1 — Author the tailwind-playbook skill** (4 of 4)

| Command | Result |
|---|---|
| `bun run validate` | exit 0, `OK — 0 warning(s).`, no error naming `tailwind-playbook` |
| `grep -n '^## ' plugins/corporate/skills/tailwind-playbook/SKILL.md` | `8:## Stack`, `41:## Toolchain`, `58:## Obligations by activity`, `69:## Traps`, `106:## Resources` — exactly those five, in that order |
| `grep -c 'tailwindcss\.com' …/SKILL.md` | `1` — line 62, the single `any` obligation row, carrying two URLs (`tailwindcss.com/docs`, `tailwindcss.com/docs/installation/framework-guides`). A regex sweep for any other host in the file returns nothing else |
| `sed -n '/^## Toolchain/,/^## Obligations/p' …\| grep -E '^\| [a-z]' \| grep -vc bun` | `0` |

**T2 — Register the eighteenth playbook and bump the version** (4 of 4)

| Command | Result |
|---|---|
| `bun run validate` | exit 0 |
| `grep -riq seventeen README.md CLAUDE.md` | exit 1 (no stale count) |
| `grep -q tailwind-playbook README.md && … CLAUDE.md && … angular-playbook/SKILL.md` | exit 0 |
| `grep -q '"version": "5.3.0"' plugins/corporate/.claude-plugin/plugin.json` | exit 0 |

Independent checks beyond the stated acceptance: `ls -d plugins/corporate/skills/*-playbook | wc -l` returns **18**, matching "Eighteen ship today"; the README prose block at `README.md:263-277` names 18 distinct playbooks; a repo-wide `seventeen` sweep outside `docs/corporate/` returns nothing; `ls` on the skill directory shows `SKILL.md` alone (no `references/` sibling); the file is 115 lines, inside the 110–150 band, with zero code fences.

I also checked for a registration surface the design might have missed: no file outside `README.md`, `CLAUDE.md`, the playbook directories and `docs/corporate/` enumerates playbook names (`stack-readiness.md:29` and `corporate-pipeline/SKILL.md` mention playbooks only generically). The four surfaces were the complete set.

## Design drift

None blocking. One cosmetic divergence: `docs/corporate/37/design.md:107` (Risks) asserts "`## Stack` names v4 and `4.3.3`", but the shipped `## Stack` names only the major. The plan's own T1 step (`plan.md:13`) asks only for "Tailwind CSS v4 is the current major (F1)", so the build followed the plan; the design's risk prose is inconsistent with its own Approach ruling 2, not with the build. Omitting the patch version does not weaken spec requirement 4 — that requirement is about a *major* wiring change, and the file states "the major in its own `tailwindcss` dependency governs which rules below apply", which is what makes staleness checkable.

## Plan drift

None. `git diff 38b9f34..HEAD --stat` shows exactly the T1 file, the four T2 files, and `docs/corporate/37/{design,plan,test}.md` — the orchestrator's own artifacts, not plan drift. Neither task touched the other's set (`468a6ad` is T1 alone; `cf151f9` is T2's four files alone). T2's explicit prohibitions hold: `docs/ideas.md` is untouched and still contains no case-insensitive match for "tailwind"; the angular-playbook edit is one added line (`SKILL.md:103`) and nothing else. Placement is as specified in every case — the README clause after the `angular-playbook` clause with the Bun sentence still last, the inventory row entry after `angular-playbook` and before the Bun four, the CLAUDE.md list entry in the same relative position.

## Correctness

No findings. What I checked and could not break:

- **Fact provenance.** Every Tailwind claim in the file maps to a pinned fact: the pipeline table to F2 (with `.postcssrc.json` from F12), the entry line to F3, the `@theme` namespaces and both `initial` forms to F4, `@config` plus the dead `corePlugins`/`safelist`/`separator` to F5, source detection and all five `@source` forms to F6, the dynamic-class trap to F7, the wiring deltas and `!flex` → `flex!` to F8, the renames to F9, the upgrade tool and Node 20 floor to F10, preprocessors/`@reference`/browser floor to F11, `--force` to F12, and the pinned-source row to F13. Nothing is asserted that F1–F13 does not hold.
- **The rename trap, verified upstream.** `SKILL.md:83-87` claims `shadow-sm`, `rounded-sm`, `blur-sm`, `drop-shadow-sm` and `backdrop-blur-sm` all exist in v4 meaning what the *unsuffixed* v3 class meant. Fetching `tailwindcss.com/docs/upgrade-guide` returns `shadow`→`shadow-sm`, `rounded`→`rounded-sm`, `blur`→`blur-sm`, `drop-shadow`→`drop-shadow-sm`, `backdrop-blur`→`backdrop-blur-sm`, plus `ring`→`ring-3` and `outline-none`→`outline-hidden`. The transcription is exact, including the direction of the shift — which was the one place a subtle inversion would have actively misled.
- **Two more upstream spot-checks.** `tailwindcss.com/docs/installation/using-vite` confirms the Vite row's packages, `vite.config.ts` registration and the verbatim `@import "tailwindcss";`. `tailwindcss.com/docs/compatibility` confirms Chrome 111 / Safari 16.4 / Firefox 128 and the "not designed to be used with CSS preprocessors" ruling as stated at `SKILL.md:92-101`.
- **Spec requirements.** Req 1: packages, governing config and entry point are all in `## Stack`, no fetch needed. Req 2: v4 in `## Stack`, v3 spellings in `## Traps` — the split the design committed to, present. Req 3: one pinned authority row naming the docs tree and the per-build-tool subtree. Req 4: the governing-major rule makes a future wiring change detectable.
- **Markdown.** All three tables have consistent cell counts. Line 49's fourth pipe is the GFM-escaped `\|` inside the code span `` `bun pm ls \| grep tailwindcss` ``, which resolves to a two-cell row — correct, not broken syntax. The code span at lines 24-25 wraps across a newline (`` `--color-*:\ninitial` ``), which CommonMark renders as a single space; it displays correctly.
- **Contract compliance.** `name` equals the directory and ends in `-playbook`; the description carries all fifteen identifiers the plan enumerated plus the utility-classes-in-markup closing clause; `## Resources` carries bare names with no summaries; the file names no agent, role or tool allowlist; the npm/npx/yarn/pnpm ban is present at `SKILL.md:52-54` and extends to `package.json` scripts, CI and copied snippets.

## Taste

Not blocking, all three:

- `plugins/corporate/skills/tailwind-playbook/SKILL.md:110-111` writes the resource names unbackticked (`- angular-playbook`). All eleven other playbooks with a populated `### Skills` list backtick them — including `angular-playbook`, edited in this same change, whose new line reads `` - `tailwind-playbook` ``. The contract says "bare names, nothing else", which this satisfies; it is a rendering inconsistency only.
- `SKILL.md:26-27` renders F4's "emitted as real CSS custom properties under `:root`" as "emitted as real CSS custom properties, usable directly in plain CSS". An entailment rather than an invention, but it drops the one detail (`:root`) that tells a reader where to look.
- Pre-existing and outside this diff: the `Skill` row of the component inventory at `README.md:418` omits `goal-suggest`, which `CLAUDE.md` does list as shipped. Not this issue's to fix; worth a line in whatever touches that table next.
