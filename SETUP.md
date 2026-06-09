# Setup - Google Sheets + Drive MCP

This is a one-time setup for colleagues. The published GitHub Packages build includes the
internal Google Desktop OAuth client, so users do not create their own Google Cloud client.

## Step 1 - Authenticate to GitHub Packages

Create a GitHub Personal Access Token (classic) with:

- `read:packages`
- `repo` for private package access

Then log npm into GitHub Packages:

```bash
npm login --scope=@quangtd-kozocom --registry=https://npm.pkg.github.com --auth-type=legacy
```

Use your GitHub username, paste the PAT as the password, and use your GitHub email.

## Step 2 - Install

```bash
npm install -g @quangtd-kozocom/kozocom-mcp-google
```

## Step 3 - Sign in to Google

```bash
kozocom-mcp auth login
```

Your browser opens to Google's consent screen. Sign in with your company Google Workspace
account and click **Allow**. The token is saved to `~/.kozocom-mcp/token.json` and reused.

## Step 4 - Configure your MCP client

Print a safe read-only client config:

```bash
kozocom-mcp client codex
kozocom-mcp client claude
kozocom-mcp client copilot
```

Print all client configs:

```bash
kozocom-mcp client all
```

Run with all tools, including mutating Drive/Sheets tools:

```bash
kozocom-mcp client codex --include-dangerous
```

## Maintainer Setup

GitHub Actions publishes the package to GitHub Packages. Add these repository or organization
secrets before publishing:

- `KOZOCOM_GOOGLE_OAUTH_CLIENT_ID`
- `KOZOCOM_GOOGLE_OAUTH_CLIENT_SECRET`

The build injects those values only into `dist/generated/oauth-client.js` before publish. The
source tree keeps `src/generated/oauth-client.ts` as a null placeholder.

For local development without embedded credentials, use a downloaded Desktop OAuth JSON:

```bash
mkdir -p ~/.kozocom-mcp
mv ~/Downloads/client_secret_*.json ~/.kozocom-mcp/client_secret.json
pnpm install
pnpm build
pnpm login
```

Or point at another file:

```bash
GOOGLE_OAUTH_CREDENTIALS=/path/to/client_secret.json pnpm login
```

## Where Things Are Stored

| Item             | Default path                         | Override env var           |
| ---------------- | ------------------------------------ | -------------------------- |
| Client secret    | embedded in published package or `~/.kozocom-mcp/client_secret.json` | `GOOGLE_OAUTH_CREDENTIALS` |
| Cached user token| `~/.kozocom-mcp/token.json`          | `GOOGLE_OAUTH_TOKEN`       |
| Config dir       | `~/.kozocom-mcp/`                    | `KOZOCOM_MCP_DIR`          |

To switch Google accounts:

```bash
kozocom-mcp auth logout
kozocom-mcp auth login
```

## Troubleshooting

- **npm opens npmjs.com login** - rerun login with `--auth-type=legacy`.
- **npm install 401/403** - check PAT scopes and private repo/package access.
- **No OAuth client secret found** - install the GitHub Packages build, or set `GOOGLE_OAUTH_CREDENTIALS`.
- **access_denied in browser** - use a Google account in the Workspace allowed by the Internal OAuth app.
- **403 with API not enabled** - maintainer must enable Drive API and Sheets API on the Google Cloud project that owns the OAuth client.
