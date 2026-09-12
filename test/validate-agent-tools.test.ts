import { describe, expect, test } from "bun:test";
import { findServerBoundMcpGrants, findToolDeclarationGaps } from "../scripts/validate.ts";

describe("findServerBoundMcpGrants", () => {
  test("passes a plain allowlist with no MCP entries", () => {
    expect(findServerBoundMcpGrants("Read, Grep, Glob, Bash")).toEqual([]);
  });

  test("flags a tools: line naming a plugin-bundled MCP tool", () => {
    expect(findServerBoundMcpGrants("Read, Grep, Glob, mcp__plugin_corporate_graft__graft_find_code")).toEqual([
      "mcp__plugin_corporate_graft__graft_find_code",
    ]);
  });

  test("flags a tools: line naming a whole server", () => {
    expect(findServerBoundMcpGrants("Read, Grep, Glob, mcp__graft")).toEqual(["mcp__graft"]);
  });

  test("flags a server-level wildcard", () => {
    expect(findServerBoundMcpGrants("Read, mcp__graft__*")).toEqual(["mcp__graft"]);
  });
});

describe("findToolDeclarationGaps", () => {
  test("passes a plain allowlist with no disallowedTools", () => {
    expect(findToolDeclarationGaps("Read, Grep, Glob, Bash", null)).toEqual([]);
  });

  test("flags a null tools: line with no disallowedTools", () => {
    const gaps = findToolDeclarationGaps(null, null);
    expect(gaps.length).toBe(1);
    expect(gaps[0]).toMatch(/disallowedTools/);
  });

  test("flags a null tools: line whose disallowedTools omits Agent", () => {
    const gaps = findToolDeclarationGaps(null, "Bash, PowerShell, Write, Edit, NotebookEdit, Artifact, EnterWorktree, ExitWorktree, SendMessage, TaskStop");
    expect(gaps.some((g) => /disallowedTools.*Agent/.test(g))).toBe(true);
  });

  test("flags a disallowedTools naming Write but not Bash", () => {
    const gaps = findToolDeclarationGaps("Read, Grep, Glob", "Write");
    expect(gaps.length).toBe(1);
    expect(gaps[0]).toMatch(/Write/);
    expect(gaps[0]).toMatch(/Bash/);
  });

  test("the exact denial line scout.md now carries passes with no gaps", () => {
    const gaps = findToolDeclarationGaps(
      null,
      "Agent, Bash, PowerShell, Write, Edit, NotebookEdit, Artifact, EnterWorktree, ExitWorktree, SendMessage, TaskStop, Monitor, Skill, WebFetch, WebSearch, TodoWrite",
    );
    expect(gaps).toEqual([]);
  });
});
