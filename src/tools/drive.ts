import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { drive } from "../auth.js";

export function registerDriveTools(server: McpServer) {
  server.tool(
    "drive_list_files",
    "List files and folders in Google Drive, optionally filtered to a specific folder",
    {
      folderId: z.string().optional().describe("Parent folder ID to list contents of"),
      query: z.string().optional().describe("Additional Drive query string (e.g. \"mimeType='application/vnd.google-apps.spreadsheet'\")"),
      pageSize: z.number().int().min(1).max(1000).optional().default(50).describe("Maximum number of results to return"),
    },
    async ({ folderId, query, pageSize }) => {
      try {
        const qParts: string[] = ["trashed = false"];
        if (folderId) qParts.push(`'${folderId}' in parents`);
        if (query) qParts.push(query);

        const res = await drive.files.list({
          q: qParts.join(" and "),
          pageSize,
          fields: "files(id, name, mimeType, modifiedTime, size, parents)",
        });

        const files = res.data.files ?? [];
        return {
          content: [{ type: "text", text: JSON.stringify(files, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error listing files: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "drive_get_file",
    "Get metadata for a file or folder by its Drive ID",
    {
      fileId: z.string().describe("The Drive file or folder ID"),
    },
    async ({ fileId }) => {
      try {
        const res = await drive.files.get({
          fileId,
          fields: "id, name, mimeType, modifiedTime, size, parents, webViewLink, owners",
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error getting file: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );
}
