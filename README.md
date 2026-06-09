# kozocom-mcp — Google Drive + Sheets MCP server

Read/write access to your **Google Drive** and **Sheets**. OAuth login — consent once, token cached
and auto-refreshed.

## Quick start

```bash
npm install -g kozocom-mcp-google
kozocom-mcp auth login          # browser consent, caches token
kozocom-mcp client codex        # print safe (read-only) MCP config
```

## CLI

| Command | Does |
| --- | --- |
| `auth login` / `logout` / `status` | sign in / out / show account, scopes, expiry |
| `setup` | check config dir + auth, print MCP config for all clients |
| `client [codex\|claude\|copilot\|all]` | print MCP config with **mutating tools disabled** (`--include-dangerous` keeps them) |
| *(no command)* | start the stdio server |

## Tools

**Auth** — sign-in/out are CLI-only (`kozocom-mcp auth login`/`logout`).

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
| `drive_share_file` | grant a permission (user / group / domain / anyone) |

**Sheets**

| Tool | Does |
| --- | --- |
| `sheets_create_spreadsheet` | create a spreadsheet |
| `sheets_get_spreadsheet` | list tabs and their dimensions |
| `sheets_read_range` / `sheets_read_ranges` | read one / many A1 ranges |
| `sheets_write_range` | overwrite values in a range |
| `sheets_append_rows` | append rows after the last row of a table |
| `sheets_clear_range` | clear values in a range |
| `sheets_add_sheet` / `sheets_delete_sheet` | add / remove a tab |
