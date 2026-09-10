#!/usr/bin/env bun
/**
 * Drives the plugin's registered `graft` MCP server exactly as declared in
 * plugins/corporate/.mcp.json, in a throwaway repo — never this one.
 *
 *   bun scripts/check-graft-mcp.ts
 *
 * Confirms:
 *   - the registration never advertises tools unconditionally (no `--dir`),
 *     and never forgets to turn telemetry off;
 *   - a cold repo (no graft graph) advertises zero tools, exit 0;
 *   - a repo with a built graph advertises the granted tools and answers a
 *     graft_trace_calls call with a `:L`-line-span pointer.
 */
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const ROOT = resolve(import.meta.dir, "..");
const MCP_PATH = join(ROOT, "plugins/corporate/.mcp.json");

function fail(message: string): never {
  console.error(`FAIL — ${message}`);
  process.exit(1);
}

const mcp = JSON.parse(await Bun.file(MCP_PATH).text());
const entry = mcp?.mcpServers?.graft;
if (!entry) fail(`no 'graft' entry in ${MCP_PATH}`);
if ((entry.args ?? []).includes("--dir")) fail("registration passes --dir, which forces unconditional tool advertisement");
const dnt = entry.env?.DO_NOT_TRACK;
if (dnt === undefined || dnt === "" || dnt === "0") fail("registration does not force DO_NOT_TRACK on");

type JsonRpcReply = { id: number; result?: any; error?: any };

function callServer(cwd: string, requests: object[], timeoutMs = 45_000): Promise<JsonRpcReply[]> {
  return new Promise((res, rej) => {
    const child = spawn(entry.command, entry.args, { cwd, env: { ...process.env, ...entry.env }, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill();
      rej(new Error(`timed out after ${timeoutMs}ms in ${cwd}; stderr so far:\n${err}`));
    }, timeoutMs);
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return rej(new Error(`server exited ${code} in ${cwd}; stderr:\n${err}`));
      const replies = out
        .split("\n")
        .filter((l) => l.trim().startsWith("{"))
        .map((l) => JSON.parse(l));
      res(replies);
    });
    for (const r of requests) child.stdin.write(JSON.stringify(r) + "\n");
    child.stdin.end();
  });
}

const initialize = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "check-graft-mcp", version: "0" } } };
const toolsList = { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} };

const dir = mkdtempSync(join(tmpdir(), "graft-mcp-check-"));
try {
  spawnSync("git", ["init", "-q"], { cwd: dir });
  spawnSync("git", ["config", "user.email", "check@local"], { cwd: dir });
  spawnSync("git", ["config", "user.name", "check"], { cwd: dir });
  writeFileSync(join(dir, "wiring.js"), "function alpha() { return beta(); }\nfunction beta() { return 1; }\n");
  spawnSync("git", ["add", "wiring.js"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "wiring"], { cwd: dir });

  // Cold case — no graph built yet.
  const cold = await callServer(dir, [initialize, toolsList]);
  const coldTools = cold.find((r) => r.id === 2)?.result?.tools ?? [];
  if (coldTools.length !== 0) fail(`cold repo advertised ${coldTools.length} tools, expected 0`);
  console.log(`cold repo: ${coldTools.length} tools advertised`);

  // Warm case — build the graph, then re-query.
  const build = spawnSync("npx", ["-y", "@nanonets/graft@0.18.0", "build", "."], { cwd: dir, env: { ...process.env, DO_NOT_TRACK: "1" } });
  if (build.status !== 0) fail(`graft build failed:\n${build.stderr?.toString()}`);

  const warm = await callServer(dir, [
    initialize,
    toolsList,
    { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "graft_trace_calls", arguments: { symbol: "beta" } } },
  ]);
  const warmTools = warm.find((r) => r.id === 2)?.result?.tools ?? [];
  console.log(`built graph: ${warmTools.length} tools advertised`);

  const traceResult = warm.find((r) => r.id === 3)?.result;
  const traceText = JSON.stringify(traceResult ?? "");
  const spanMatch = traceText.match(/:L\d+/);
  if (!spanMatch) fail(`graft_trace_calls reply had no ':L'-line-span pointer:\n${traceText}`);
  console.log(`graft_trace_calls pointer: ${spanMatch[0]}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log("\nOK");
