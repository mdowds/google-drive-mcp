# Google Drive MCP Server

A TypeScript MCP server that exposes Google Sheets and Google Drive as tools for Claude, authenticated via a service account.

## Setup

### 1. Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create (or select) a project.
2. Enable the **Google Sheets API** and **Google Drive API** under *APIs & Services → Library*.
3. Go to *IAM & Admin → Service Accounts* and create a new service account.
4. Under the service account, go to *Keys → Add Key → Create new key → JSON*. Download the file.

### 2. Configure the environment

Copy `.env.example` to `.env` and paste the entire downloaded JSON key as a single-line string:

```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{ "type": "service_account", ... }'
```

### 3. Share Drive resources

Share any Google Drive folders or spreadsheets you want the server to access with the service account's email address (`name@project.iam.gserviceaccount.com`).

### 4. Build

```bash
npm install
npm run build
```

### 5. Register in Claude Code

Add the following to `~/.claude/claude_desktop_config.json` (or your project's `.claude/mcp.json`):

```json
{
  "mcpServers": {
    "google-drive": {
      "command": "node",
      "args": ["/absolute/path/to/google-drive-mcp/build/index.js"],
      "env": {
        "GOOGLE_SERVICE_ACCOUNT_KEY": "<paste JSON key here>"
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
```
