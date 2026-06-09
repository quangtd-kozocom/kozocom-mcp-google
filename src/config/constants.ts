import { homedir } from "node:os";
import { join } from "node:path";

/** Server identity reported to MCP clients. */
export const SERVER_NAME = "kozocom-google-mcp-server";
export const SERVER_VERSION = "0.1.0";

/** Full read/write Drive scope — gates the `drive_*` tools. */
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
/** Full read/write Sheets scope — gates the `sheets_*` tools. */
export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

/** Sign-in scopes, always requested. Let us show which account is signed in. */
export const IDENTITY_SCOPES = ["https://www.googleapis.com/auth/userinfo.email", "openid"];

/**
 * OAuth scopes requested at login. Full read/write for both Drive and Sheets.
 * Google's granular consent screen lets the user grant only some of these; the
 * server then registers only the tools whose scope was actually granted (see
 * `selectGoogleTools`). Changing these requires re-running login (delete the
 * cached token first).
 */
export const SCOPES = [DRIVE_SCOPE, SHEETS_SCOPE, ...IDENTITY_SCOPES];

/** Directory holding the optional OAuth client config and cached token. */
export const CONFIG_DIR = process.env.TERRA_MCP_DIR ?? join(homedir(), ".terra-mcp");

/** Path to an optional downloaded Google OAuth client JSON. */
export const CLIENT_SECRET_PATH =
  process.env.GOOGLE_OAUTH_CREDENTIALS ?? join(CONFIG_DIR, "client_secret.json");

/** Path to the cached OAuth token (access + refresh). */
export const TOKEN_PATH = process.env.GOOGLE_OAUTH_TOKEN ?? join(CONFIG_DIR, "token.json");

/**
 * OAuth token-exchange proxy. Google "Desktop" clients are confidential — the
 * token endpoint requires `client_secret` even with PKCE. To keep the secret out
 * of the published package, the CLI does the PKCE authorize step itself and posts
 * the resulting `code` (and later, refresh tokens) to this Worker, which holds the
 * secret and completes the exchange. See the `quang-mcp-auth-proxy` repo.
 */
export const TOKEN_PROXY_URL =
  process.env.TERRA_MCP_TOKEN_PROXY_URL ??
  "https://quang-mcp-auth-proxy.getting-started-worker.workers.dev/token";

/**
 * Shared deterrent key sent to the proxy in `x-proxy-key`. This ships in the
 * package, so it is NOT a secret — just a casual-abuse speed bump. The real
 * protection is PKCE (binds each auth code to the CLI that started the flow).
 */
export const PROXY_SHARED_KEY =
  process.env.TERRA_MCP_PROXY_KEY ??
  "f80350f60e2c7950b72f3041c673d1194d45efa38217237ecc7bf87530f093d5";

/** Maximum characters returned in a single tool response before truncation. */
export const CHARACTER_LIMIT = 25000;

/**
 * Env var that, when set to "1", runs the server in safe mode: irreversible,
 * destructive tools (delete/clear) are not registered. The `config` CLI command
 * emits this in the generated MCP config so AI clients can't destroy data.
 */
const SAFE_MODE_ENV = "TERRA_MCP_SAFE_MODE";

/** Whether this process is running with dangerous tools disabled. */
export const SAFE_MODE = process.env[SAFE_MODE_ENV] === "1";

/** Env var naming the only directory local_path/save_path may read/write. */
export const LOCAL_FILE_ROOT_ENV = "TERRA_MCP_LOCAL_FILE_ROOT";
