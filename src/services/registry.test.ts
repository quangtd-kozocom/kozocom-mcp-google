import { describe, expect, it } from "vitest";
import { DANGEROUS_TOOL_NAMES, googleTools, READ_ONLY_TOOL_NAMES, selectGoogleTools } from "./registry.js";
import { isReadOnlyTool } from "../core/tool.js";
import { DRIVE_SCOPE, SHEETS_SCOPE } from "../config/constants.js";

const toolNames = (tools: readonly { toolName: string }[]): string[] => tools.map((t) => t.toolName);

describe("selectGoogleTools", () => {
  it("returns every tool when not in safe mode", () => {
    expect(selectGoogleTools(false)).toEqual(googleTools);
  });

  it("keeps every tool when granted scopes are unknown", () => {
    expect(selectGoogleTools(false, undefined)).toEqual(googleTools);
  });

  it("drops sheets_* tools when only the Drive scope was granted", () => {
    const tools = toolNames(selectGoogleTools(false, [DRIVE_SCOPE]));
    expect(tools).toContain("google_auth_status");
    expect(tools.some((n) => n.startsWith("drive_"))).toBe(true);
    expect(tools.some((n) => n.startsWith("sheets_"))).toBe(false);
  });

  it("drops drive_* tools when only the Sheets scope was granted", () => {
    const tools = toolNames(selectGoogleTools(false, [SHEETS_SCOPE]));
    expect(tools).toContain("google_auth_status");
    expect(tools.some((n) => n.startsWith("sheets_"))).toBe(true);
    expect(tools.some((n) => n.startsWith("drive_"))).toBe(false);
  });

  it("keeps only the auth tools when no API scope was granted", () => {
    const tools = toolNames(selectGoogleTools(false, []));
    expect(tools.every((n) => n.startsWith("google_"))).toBe(true);
  });

  it("combines scope and safe-mode filters", () => {
    const tools = selectGoogleTools(true, [DRIVE_SCOPE]);
    expect(tools.every(isReadOnlyTool)).toBe(true);
    expect(toolNames(tools).some((n) => n.startsWith("sheets_"))).toBe(false);
  });

  it("keeps only read-only tools in safe mode", () => {
    const safe = selectGoogleTools(true);
    expect(safe.length).toBe(READ_ONLY_TOOL_NAMES.length);
    expect(safe.every(isReadOnlyTool)).toBe(true);
    const names = safe.map((t) => t.toolName);
    for (const dangerous of DANGEROUS_TOOL_NAMES) {
      expect(names).not.toContain(dangerous);
    }
  });

  it("partitions tools by the readOnly annotation", () => {
    expect(READ_ONLY_TOOL_NAMES.length + DANGEROUS_TOOL_NAMES.length).toBe(googleTools.length);
    for (const tool of googleTools) {
      expect(isReadOnlyTool(tool)).toBe(tool.annotations.readOnlyHint === true);
    }
  });
});
