# terra-mcp — Google Drive + Sheets MCP server

Read/write access to your **Google Drive** and **Sheets**. OAuth + PKCE login — only the public
client ID ships in npm, consent happens in browser, token is cached and auto-refreshed.

## Quick start

```bash
npm install -g terra-mcp-google
terra-mcp auth login          # browser consent, caches token
terra-mcp client codex        # print safe (read-only) MCP config
```

## CLI

| Command | Does |
| --- | --- |
| `auth login` / `logout` / `status` | sign in / out / show account, scopes, expiry |
| `setup` | check config dir + auth, print MCP config for all clients |
| `client [codex\|claude\|copilot\|kiro\|all]` | print MCP config with **mutating tools disabled** (`--include-dangerous` keeps them) |
| *(no command)* | start the stdio server |

## Configuration

Set these in your MCP client's `env` block (or the launching shell):

| Variable | Default | Purpose |
| --- | --- | --- |
| `TERRA_MCP_DIR` | `~/.terra-mcp` | Directory holding the OAuth client config + cached token |
| `GOOGLE_OAUTH_CREDENTIALS` | `<TERRA_MCP_DIR>/client_secret.json` | Google OAuth client JSON; overrides the embedded client |
| `GOOGLE_OAUTH_TOKEN` | `<TERRA_MCP_DIR>/token.json` | Cached access/refresh token |
| `TERRA_MCP_SAFE_MODE` | unset | `1` → register **only read-only tools**; drop every mutating tool |
| `TERRA_MCP_LOCAL_FILE_ROOT` | unset | Only directory `local_path`/`save_path` may touch. Unset = local file up/download disabled |
| `TERRA_MCP_TOKEN_PROXY_URL` | bundled proxy | OAuth token-exchange proxy (advanced; only when self-hosting it) |
| `TERRA_MCP_PROXY_KEY` | bundled key | Deterrent key sent to the proxy (ships in the package — not a secret) |

**Restricting tools.** Disable the mutating tools server-side with `TERRA_MCP_SAFE_MODE=1`, or
per-client with `terra-mcp client <agent>` (pass `--include-dangerous` to keep them on). Tools are
also gated by the **OAuth scopes granted at login** — a Sheets-only grant exposes no `drive_*` tools.

## Tools

**Auth** — sign-in/out are CLI-only (`terra-mcp auth login`/`logout`).

| Tool | Does |
| --- | --- |
| `google_auth_status` | show signed-in account, granted scopes, token expiry |

**Drive**

| Tool | Does |
| --- | --- |
| `drive_list_files` | list / search files (Drive `q` query, pagination) |
| `drive_get_file` | get file metadata by ID |
| `drive_download_file` | download or export content (Google-native files → csv/txt/pdf/…) |
| `drive_create_folder` | create a folder |
| `drive_upload_file` | upload inline text or a local file |
| `drive_update_file` | rename, move, or replace content |
| `drive_copy_file` | duplicate a file |
| `drive_delete_file` | trash (default) or permanently delete |

**Sheets**

| Tool | Does |
| --- | --- |
| `sheets_create_spreadsheet` | create a spreadsheet |
| `sheets_get_spreadsheet` | list tabs and their dimensions |
| `sheets_read_range` | read one A1 range, or many at once (pass an array of ranges) |
| `sheets_write_range` | overwrite values in one A1 range, or many at once (pass `data`) |
| `sheets_append_rows` | append rows after the last row of a table |
| `sheets_clear_range` | clear values in a range |
| `sheets_add_sheet` / `sheets_delete_sheet` | add / remove a tab |
| `sheets_format_cells` | format a cell range (colors, bold, font size, alignment) |
| `sheets_set_data_validation` | set a dropdown (list) rule on a range |
| `sheets_batch_update` | escape hatch: raw `spreadsheets.batchUpdate` requests (merge, borders, sort, …) |
