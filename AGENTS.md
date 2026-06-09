# AGENTS.md

Guidance for AI agents in this repo.

## What this is

`kozocom-mcp`: MCP server exposing **Google Drive + Sheets** over stdio. Auth = **OAuth user login**
(browser consent, cached + auto-refreshed token), not a service account.

Stack: TypeScript (NodeNext, strict), `@modelcontextprotocol/sdk`, `googleapis`, Zod v4, vitest,
oxlint. PM: **pnpm**. Use the `caveman` skill to communicate.

## Commands

`pnpm install` · `build` (→ `dist/`) · `typecheck` · `lint` (oxlint) · `test` (vitest, mocked) ·
`dev` (hot reload) · `login`/`logout` (needs built `dist/`) · `run setup` · `run client`.

`:dev` variants run from source via tsx. Pass flags to `run setup`/`run client` **without** `--`
(`pnpm run client codex`), or call `node dist/cli.js client codex`.

**Before any change:** `pnpm typecheck && pnpm lint && pnpm test` pass and `pnpm build` succeeds.

## Layout (`src/`)

- `cli.ts` — CLI: `auth login|logout|status` / `setup` / `client`; no command = start server
- `index.ts` — `startServer()`: McpServer + `registerGoogleTools()` + stdio
- `setup.ts` — `runSetup()`, MCP config snippets per client
- `constants.ts` — SCOPES, paths, `CHARACTER_LIMIT`, SAFE_MODE
- `format.ts` — `ToolResult` helpers, truncation, `handleGoogleError`, `NotAuthenticatedError`
- `auth.ts` — OAuth token load/save/clear, loopback login
- `google.ts` — `getGoogleClients()` → `{ drive, sheets }`
- `drive-adapter.ts` / `sheets-adapter.ts` — anti-corruption layers over the Google APIs
- `tools/` — `define.ts` (factories + `registerAll`, `isReadOnlyTool`), `auth.ts`, `drive.ts`,
  `sheets.ts`, `google.ts` (`selectGoogleTools`, tool-name lists, `registerGoogleTools`)
- `**/*.test.ts` — colocated vitest tests

## CLI & safe mode

Sign-in/out are **CLI-only** (no `google_login`/`google_logout` tools) so untrusted clients can't
trigger consent or wipe the token. **"Dangerous" = any non-read-only tool** (`readOnlyHint !== true`);
classification derives automatically from annotations via `isReadOnlyTool`. Two disabling paths:

- **Client-side** (`pnpm run client`): emits Codex/Claude/Copilot config that disables dangerous
  tools; server still registers everything.
- **Server-side** (`KOZOCOM_MCP_SAFE_MODE=1`): `selectGoogleTools(true)` registers only read-only tools.

Adding/re-annotating a tool updates the safe set automatically — but keep `setup.test.ts` assertions in sync.

## Conventions

- **Simplest, compact:** write code the most compact way that stays readable — caveman spirit applied
  to code; no boilerplate, no ceremony.
- **Register** tools via `tool`/`driveTool`/`sheetsTool` factory in `define.ts`
  (`{ name, title, description, inputSchema, annotations, run }`) → `ToolRegistration[]` → `registerAll`.
  `inputSchema` is a **Zod raw shape**, not `z.object()`.
- **Naming:** snake_case, service-prefixed (`drive_*`, `sheets_*`, `google_*`).
- **Descriptions** include `Args:`/`Returns:`; set annotations honestly
  (`readOnlyHint`/`destructiveHint`/`idempotentHint`/`openWorldHint`).
- **Handlers** are exported pure fns `(client, args) => Promise<ToolResult>` passed as `run`. Derive
  arg type via `ArgsOf<typeof inputSchema>` — never hand-write it.
- **API access** lives in the adapters, not handlers. New call = new adapter method; handlers map
  snake_case args → adapter calls and shape the response.
- **Errors:** never throw from a tool (factory returns `errorResult(handleGoogleError(e))`); add status
  cases to `handleGoogleError`.
- **Output:** human text + `structuredContent`; respect `response_format` (`markdown` default | `json`),
  truncate via `toolResult`/`CHARACTER_LIMIT`.
- **Types:** strict, no `any` in `src/` (tests may use one annotated `as any`).

## Testing

Colocated, fully mocked — **never** hit real Google API or filesystem. Mock `googleapis` with
`vi.fn()`, call handlers via `asDrive(...)`/`asSheets(...)`. Mock `node:fs/promises` for `auth.ts`;
mock `../google.js` only for the auth-failure path. Each handler needs happy-path + error/validation tests.

## Auth & secrets

- Secrets in `~/.kozocom-mcp/` (override: `KOZOCOM_MCP_DIR`, `GOOGLE_OAUTH_CREDENTIALS`,
  `GOOGLE_OAUTH_TOKEN`). `client_secret.json` / `token.json` are **git-ignored — never commit**.
- OAuth client must be **Desktop app** type. Scopes in `constants.ts`; changing them needs re-login
  (delete old token first). External+Testing consent expires refresh tokens after 7 days — prefer
  **Internal** for Workspace orgs.
- Never log tokens/secrets to **stdout** (JSON-RPC channel) — use **stderr**.
- Full setup: `SETUP.md`. Client snippets: `README.md`.

## Scope notes

Server holds **full read/write** Drive + Sheets scopes — write/delete tools are real side effects.
`drive_delete_file` trashes by default; `permanent: true` is irreversible. For untrusted clients use a
`kozocom-mcp client` snippet and/or `KOZOCOM_MCP_SAFE_MODE=1`.
