#!/usr/bin/env bun
/**
 * Validates the marketplace and plugin structure.
 *
 *   bun run validate
 *
 * Exits 1 on the first category of failure found, after reporting all of them.
 */
import { readdirSync, statSync, existsSync, accessSync, constants, readFileSync } from "node:fs";
import { join, basename, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const errors: string[] = [];
const warnings: string[] = [];

const err = (file: string, msg: string) => errors.push(`${file}: ${msg}`);
const warn = (file: string, msg: string) => warnings.push(`${file}: ${msg}`);

function readJson(path: string): any | null {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    err(rel(path), `invalid JSON — ${(e as Error).message}`);
    return null;
  }
}

const rel = (p: string) => p.slice(ROOT.length + 1);

/** Returns the frontmatter block as a raw string, or null if absent. */
function frontmatter(path: string): string | null {
  const text = readFileSync(path, "utf8");
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  return end === -1 ? null : text.slice(4, end);
}

function field(fm: string, key: string): string | null {
  const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return m ? m[1].trim() : null;
}

/**
 * Returns the keys of any `mcpServers` entry that invokes `@nanonets/graft`
 * (graft) without forcing its telemetry off via `DO_NOT_TRACK`. An entry
 * with no `env.DO_NOT_TRACK`, or one set to `""` or `"0"`, is offending.
 */
export function findGraftServersMissingTelemetryOff(mcpServers: Record<string, any>): string[] {
  const offending: string[] = [];
  for (const [key, server] of Object.entries(mcpServers ?? {})) {
    const invocation = JSON.stringify([server?.command, server?.args]);
    if (!/@nanonets\/graft/.test(invocation)) continue;
    const dnt = server?.env?.DO_NOT_TRACK;
    if (dnt === undefined || dnt === "" || dnt === "0") offending.push(key);
  }
  return offending;
}

/**
 * The built-in tools a subagent can use to cause a side effect — the set
 * `disallowedTools` must name completely or not at all (R3). Derived from the
 * background-subagent built-in set and the first filter documented at
 * code.claude.com/docs/en/sub-agents, read 2026-09-12.
 */
export const SIDE_EFFECT_TOOLS = [
  "Agent",
  "Bash",
  "PowerShell",
  "Write",
  "Edit",
  "NotebookEdit",
  "Artifact",
  "EnterWorktree",
  "ExitWorktree",
  "SendMessage",
  "TaskStop",
];

/**
 * Returns every `mcp__…` entry found in an agent's raw `tools:` frontmatter
 * line, whether it names a single tool
 * (`mcp__plugin_corporate_graft__graft_find_code`) or a whole server
 * (`mcp__graft`, `mcp__graft__*`). No agent's `tools:` line may name one at
 * all (R1) — a role may hold no standing grant to a named server; the grant
 * is decided where the work's scope is.
 */
export function findServerBoundMcpGrants(toolsLine: string): string[] {
  const pattern = /mcp__[a-zA-Z0-9_-]+/g;
  const found: string[] = [];
  for (const m of toolsLine.matchAll(pattern)) {
    found.push(m[0].replace(/_+$/, ""));
  }
  return found;
}

/**
 * Returns one message per gap between an agent's `tools:` / `disallowedTools`
 * lines and R2/R3, empty when conformant. R2: an omitted `tools:` line means
 * the agent takes the generic pool, so `disallowedTools` must be present and
 * must name `Agent`. R3: a `disallowedTools` naming any `SIDE_EFFECT_TOOLS`
 * member must name all of them — a half-complete denylist is the failure
 * mode an inverted list has.
 */
export function findToolDeclarationGaps(toolsLine: string | null, disallowedLine: string | null): string[] {
  const gaps: string[] = [];
  const disallowed = (disallowedLine ?? "").split(",").map((s) => s.trim());

  if (toolsLine === null) {
    if (!disallowedLine) {
      gaps.push("no 'tools:' line means the generic pool, but 'disallowedTools' is absent");
    } else if (!disallowed.includes("Agent")) {
      gaps.push("no 'tools:' line means the generic pool, but 'disallowedTools' does not name 'Agent'");
    }
  }

  if (disallowedLine) {
    const namedSideEffect = SIDE_EFFECT_TOOLS.filter((t) => disallowed.includes(t));
    if (namedSideEffect.length > 0 && namedSideEffect.length < SIDE_EFFECT_TOOLS.length) {
      const missing = SIDE_EFFECT_TOOLS.filter((t) => !disallowed.includes(t));
      gaps.push(`'disallowedTools' names ${namedSideEffect.join(", ")} but not ${missing.join(", ")} — a half-complete denylist`);
    }
  }

  return gaps;
}

const MODELS = ["inherit", "opus", "sonnet", "haiku", "fable", "opusplan"];
const EFFORTS = ["low", "medium", "high", "xhigh", "max"];

/** Validates the optional `model` / `effort` frontmatter pair shared by agents and commands. */
function checkModelEffort(fm: string, file: string) {
  const model = field(fm, "model");
  if (model && !MODELS.includes(model)) {
    err(rel(file), `frontmatter model '${model}' not one of ${MODELS.join(", ")}`);
  }
  const effort = field(fm, "effort");
  if (effort) {
    const asInt = Number(effort);
    const validInt = Number.isInteger(asInt) && asInt > 0;
    if (!EFFORTS.includes(effort) && !validInt) {
      err(rel(file), `frontmatter effort '${effort}' not one of ${EFFORTS.join(", ")} or a positive integer`);
    }
    if (!model || model === "inherit") {
      warn(rel(file), "'effort' is set but 'model' is absent or 'inherit' — effort is a no-op unless the model is pinned");
    }
  }
}

// --- plugin -----------------------------------------------------------------
function validatePlugin(dir: string) {
  const manifestPath = join(dir, ".claude-plugin/plugin.json");
  const manifest = readJson(manifestPath);
  if (manifest) {
    for (const k of ["name", "description", "version"]) {
      if (!manifest[k]) err(rel(manifestPath), `missing '${k}'`);
    }
  }

  // mcp
  const mcpPath = join(dir, ".mcp.json");
  let mcpServers: Record<string, any> = {};
  if (existsSync(mcpPath)) {
    const mcp = readJson(mcpPath);
    if (mcp && typeof mcp.mcpServers !== "object") err(rel(mcpPath), "missing 'mcpServers' object");
    else if (mcp) mcpServers = mcp.mcpServers ?? {};
  }
  for (const key of findGraftServersMissingTelemetryOff(mcpServers)) {
    err(rel(mcpPath), `server '${key}' invokes @nanonets/graft without forcing DO_NOT_TRACK on`);
  }

  // commands
  for (const f of mdFiles(join(dir, "commands"))) {
    const fm = frontmatter(f);
    if (!fm) { err(rel(f), "no frontmatter block"); continue; }
    if (!field(fm, "description")) err(rel(f), "frontmatter missing 'description'");
    checkModelEffort(fm, f);
  }

  // agents — name must match filename
  for (const f of mdFiles(join(dir, "agents"))) {
    const fm = frontmatter(f);
    if (!fm) { err(rel(f), "no frontmatter block"); continue; }
    const name = field(fm, "name");
    const expected = basename(f, ".md");
    if (!name) err(rel(f), "frontmatter missing 'name'");
    else if (name !== expected) err(rel(f), `frontmatter name '${name}' != filename '${expected}'`);
    if (!field(fm, "description")) err(rel(f), "frontmatter missing 'description'");
    checkModelEffort(fm, f);
    const toolsLine = field(fm, "tools");
    const disallowedLine = field(fm, "disallowedTools");
    if (toolsLine) {
      for (const badName of findServerBoundMcpGrants(toolsLine)) {
        err(rel(f), `tools: names '${badName}' — no agent's tools: may name an MCP server or tool, a grant is decided where the work's scope is`);
      }
    }
    for (const gap of findToolDeclarationGaps(toolsLine, disallowedLine)) {
      err(rel(f), gap);
    }
  }

  // skills — SKILL.md required, name must match directory
  const skillsDir = join(dir, "skills");
  if (existsSync(skillsDir)) {
    for (const entry of readdirSync(skillsDir)) {
      const skillDir = join(skillsDir, entry);
      if (!statSync(skillDir).isDirectory()) continue;
      const skill = join(skillDir, "SKILL.md");
      if (!existsSync(skill)) { err(rel(skillDir), "no SKILL.md"); continue; }
      const fm = frontmatter(skill);
      if (!fm) { err(rel(skill), "no frontmatter block"); continue; }
      const name = field(fm, "name");
      if (!name) err(rel(skill), "frontmatter missing 'name'");
      else if (name !== entry) err(rel(skill), `frontmatter name '${name}' != directory '${entry}'`);
      if (!field(fm, "description")) err(rel(skill), "frontmatter missing 'description'");
    }
  }

  // hooks — config parses, referenced scripts exist and are executable
  const hooksPath = join(dir, "hooks/hooks.json");
  if (existsSync(hooksPath)) {
    const cfg = readJson(hooksPath);
    if (cfg) {
      const raw = readFileSync(hooksPath, "utf8");
      if (/\b(bun|node|python3?)\s/.test(raw)) {
        warn(rel(hooksPath), "hook command uses a non-bash interpreter — a missing runtime breaks the session");
      }
      for (const m of raw.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"'\s\\]+)/g)) {
        const script = join(dir, m[1]);
        if (!existsSync(script)) { err(rel(hooksPath), `references missing script '${m[1]}'`); continue; }
        try { accessSync(script, constants.X_OK); }
        catch { err(rel(script), "not executable — run chmod +x"); }
      }
    }
  }

  // markdown — every ${CLAUDE_PLUGIN_ROOT} path a component points an agent at must exist,
  // and any mcpServers registration snippet shown in docs keeps graft's telemetry off too
  for (const sub of ["commands", "agents", "skills"]) {
    for (const file of mdFiles(join(dir, sub))) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([A-Za-z0-9._\/-]+)/g)) {
        if (!existsSync(join(dir, m[1]))) err(rel(file), `points at missing '${m[1]}'`);
      }
      for (const m of text.matchAll(/```json\n([\s\S]*?"mcpServers"[\s\S]*?)\n```/g)) {
        try {
          const snippet = JSON.parse(m[1]);
          for (const key of findGraftServersMissingTelemetryOff(snippet.mcpServers ?? {})) {
            err(rel(file), `mcpServers snippet '${key}' invokes @nanonets/graft without forcing DO_NOT_TRACK on`);
          }
        } catch { /* not valid standalone JSON — not this check's concern */ }
      }
    }
  }
}

function mdFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...mdFiles(p));
    else if (entry.endsWith(".md")) out.push(p);
  }
  return out;
}

// --- run, only when executed directly (not when imported, e.g. by tests) ---
if (import.meta.main) {
  const marketplacePath = join(ROOT, ".claude-plugin/marketplace.json");
  if (!existsSync(marketplacePath)) {
    err(".claude-plugin/marketplace.json", "missing");
  } else {
    const mk = readJson(marketplacePath);
    if (mk) {
      if (!mk.name) err(rel(marketplacePath), "missing 'name'");
      if (!Array.isArray(mk.plugins) || mk.plugins.length === 0) {
        err(rel(marketplacePath), "'plugins' must be a non-empty array");
      } else {
        for (const p of mk.plugins) {
          if (!p.name) err(rel(marketplacePath), "a plugin entry has no 'name'");
          if (!p.source) { err(rel(marketplacePath), `plugin '${p.name}' has no 'source'`); continue; }
          const dir = join(ROOT, p.source);
          if (!existsSync(join(dir, ".claude-plugin/plugin.json"))) {
            err(rel(marketplacePath), `plugin '${p.name}' source '${p.source}' has no .claude-plugin/plugin.json`);
          } else {
            validatePlugin(dir);
          }
        }
      }
    }
  }

  // --- report -----------------------------------------------------------------
  for (const w of warnings) console.log(`warn  ${w}`);
  for (const e of errors) console.log(`error ${e}`);
  console.log(
    errors.length
      ? `\n${errors.length} error(s), ${warnings.length} warning(s).`
      : `\nOK — ${warnings.length} warning(s).`,
  );
  process.exit(errors.length ? 1 : 0);
}
