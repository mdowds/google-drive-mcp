# Google Drive MCP Server

A TypeScript MCP server that exposes Google Sheets and Google Drive as tools for Claude, authenticated via OAuth 2.0.

## Setup

### 1. Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create (or select) a project.
2. Enable the **Google Sheets API** and **Google Drive API** under *APIs & Services → Library*.
3. Go to *APIs & Services → Credentials → Create Credentials → OAuth client ID*.
4. Choose **Desktop app** as the application type.
5. Add `http://localhost:3000/callback` as an authorized redirect URI.
6. Copy the **Client ID** and **Client Secret**.

### 2. Configure the environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
```

### 3. Build

```bash
npm install
npm run build
```

### 4. Authenticate

Run the one-time auth flow:

```bash
npm run auth
```

This prints an authorization URL. Open it in your browser, grant access, and the tokens will be saved to `tokens.json`. You only need to do this once — the server will auto-refresh tokens as needed.

### 5. Register in Claude Code

Add the following to `~/.claude/claude_desktop_config.json` (or your project's `.claude/mcp.json`):

```json
{
  "mcpServers": {
    "google-drive": {
      "command": "node",
      "args": ["/absolute/path/to/google-drive-mcp/build/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "GOCSPX-your-client-secret"
      }
    }
  }
}
```

Restart Claude Code after saving.

## Available Tools

### Drive
| Tool | Description |
|------|-------------|
| `drive_list_files` | List files/folders, optionally within a folder |
| `drive_get_file` | Get metadata for a file by ID |

### Sheets
| Tool | Description |
|------|-------------|
| `sheets_create` | Create a new spreadsheet |
| `sheets_read_range` | Read values from a range |
| `sheets_write_range` | Write values to a range |
| `sheets_add_sheet` | Add a new tab to a spreadsheet |
| `sheets_rename_sheet` | Rename an existing tab |
| `sheets_delete_sheet` | Delete a tab |
| `sheets_list_sheets` | List all tabs in a spreadsheet |

## Development

```bash
npm run dev   # run with tsx (no build step)
npm run build # compile TypeScript to build/
npm start     # run compiled output
npm run auth  # re-authenticate (if tokens are lost or revoked)
```
