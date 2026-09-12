import { describe, expect, test } from "bun:test";
import { findGraftServersMissingTelemetryOff } from "../scripts/validate.ts";

describe("findGraftServersMissingTelemetryOff", () => {
  test("passes a graft entry with DO_NOT_TRACK set", () => {
    const offending = findGraftServersMissingTelemetryOff({
      graft: { command: "npx", args: ["-y", "@nanonets/graft@0.18.0", "mcp"], env: { DO_NOT_TRACK: "1" } },
    });
    expect(offending).toEqual([]);
  });

  test("flags a graft entry with no env at all", () => {
    const offending = findGraftServersMissingTelemetryOff({
      graft: { command: "npx", args: ["-y", "@nanonets/graft@0.18.0", "mcp"] },
    });
    expect(offending).toEqual(["graft"]);
  });

  test("flags DO_NOT_TRACK set to an empty string or '0'", () => {
    expect(
      findGraftServersMissingTelemetryOff({
        graft: { command: "npx", args: ["-y", "@nanonets/graft@0.18.0", "mcp"], env: { DO_NOT_TRACK: "" } },
      }),
    ).toEqual(["graft"]);
    expect(
      findGraftServersMissingTelemetryOff({
        graft: { command: "npx", args: ["-y", "@nanonets/graft@0.18.0", "mcp"], env: { DO_NOT_TRACK: "0" } },
      }),
    ).toEqual(["graft"]);
  });

  test("ignores a non-graft server with no DO_NOT_TRACK", () => {
    const offending = findGraftServersMissingTelemetryOff({
      "my-server": { command: "bun", args: ["server.ts"], env: {} },
    });
    expect(offending).toEqual([]);
  });
});
