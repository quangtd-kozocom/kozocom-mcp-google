import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authTools } from "./auth/tools.js";
import { isReadOnlyTool, registerAll, type ToolRegistration } from "../core/tool.js";
import { driveTools } from "./drive/tools.js";
import { sheetsTools } from "./sheets/tools.js";
import { DRIVE_SCOPE, SHEETS_SCOPE } from "../config/constants.js";
import { getAuthStatus } from "../google/auth.js";

/** Every Google tool exposed by this server, in registration order. */
export const googleTools: readonly ToolRegistration[] = [...authTools, ...driveTools, ...sheetsTools];

/** Tools whose API scope must have been granted at login before they work. */
const SCOPED_TOOLS: ReadonlyArray<{ scope: string; tools: readonly ToolRegistration[] }> = [
  { scope: DRIVE_SCOPE, tools: driveTools },
  { scope: SHEETS_SCOPE, tools: sheetsTools },
];

/**
 * The tools exposed for a given safety + scope level.
 *
 * - Safe mode keeps only the read-only tools; every mutating tool (create/write/
 *   delete) is dropped so a client can browse but never change anything.
 * - `grantedScopes`, when provided, drops a service's tools entirely unless its
 *   OAuth scope was granted at login — so a Sheets-only grant exposes no
 *   `drive_*` tools. `undefined` means "scope unknown" (e.g. not signed in yet)
 *   and keeps every tool. The `google_*` auth tools are never scope-gated.
 *
 * @see isReadOnlyTool
 */
export function selectGoogleTools(
  safeMode: boolean,
  grantedScopes?: readonly string[],
): readonly ToolRegistration[] {
  let tools = googleTools;
  if (grantedScopes) {
    const granted = new Set(grantedScopes);
    const ungranted = new Set(
      SCOPED_TOOLS.filter((s) => !granted.has(s.scope)).flatMap((s) => s.tools),
    );
    tools = tools.filter((t) => !ungranted.has(t));
  }
  return safeMode ? tools.filter(isReadOnlyTool) : tools;
}

/** Read-only tool names — the only ones enabled in safe mode (registration order). */
export const READ_ONLY_TOOL_NAMES: readonly string[] = googleTools
  .filter(isReadOnlyTool)
  .map((t) => t.toolName);

/** Mutating ("dangerous") tool names — disabled in safe mode (registration order). */
export const DANGEROUS_TOOL_NAMES: readonly string[] = googleTools
  .filter((t) => !isReadOnlyTool(t))
  .map((t) => t.toolName);

export async function registerGoogleTools(
  server: McpServer,
  options: { safeMode?: boolean } = {},
): Promise<void> {
  // Honor the scopes the user actually granted at login. If not signed in yet,
  // we can't know the grant, so register everything (calls fail later if a
  // scope is missing). Best-effort: a status lookup failure falls back to all.
  let grantedScopes: readonly string[] | undefined;
  try {
    const status = await getAuthStatus();
    grantedScopes = status.authenticated ? (status.scopes ?? undefined) : undefined;
  } catch {
    grantedScopes = undefined;
  }
  registerAll(server, selectGoogleTools(options.safeMode ?? false, grantedScopes));
}
