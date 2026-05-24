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
    "drive_create_folder",
    "Create a new folder in Google Drive",
    {
      name: z.string().describe("Name of the folder to create"),
      parentId: z.string().optional().describe("Parent folder ID; omit to create in root"),
    },
    async ({ name, parentId }) => {
      try {
        const res = await drive.files.create({
          requestBody: {
            name,
            mimeType: "application/vnd.google-apps.folder",
            parents: parentId ? [parentId] : undefined,
          },
          fields: "id, name, mimeType, parents, webViewLink",
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error creating folder: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "drive_share_file",
    "Share a file or folder by adding a permission",
    {
      fileId: z.string().describe("The Drive file or folder ID to share"),
      role: z.enum(["reader", "commenter", "writer", "fileOrganizer", "organizer", "owner"]).describe("Permission role to grant"),
      type: z.enum(["user", "group", "domain", "anyone"]).describe("The type of grantee"),
      emailAddress: z.string().optional().describe("Email address of the user or group (required when type is 'user' or 'group')"),
      domain: z.string().optional().describe("Domain name (required when type is 'domain')"),
      sendNotificationEmail: z.boolean().optional().default(false).describe("Whether to send a notification email to the grantee"),
    },
    async ({ fileId, role, type, emailAddress, domain, sendNotificationEmail }) => {
      try {
        const res = await drive.permissions.create({
          fileId,
          sendNotificationEmail,
          requestBody: {
            role,
            type,
            emailAddress: type === "user" || type === "group" ? emailAddress : undefined,
            domain: type === "domain" ? domain : undefined,
          },
          fields: "id, role, type, emailAddress, domain",
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error sharing file: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "drive_create_file",
    "Create a file in Google Drive with the given text content. Defaults to text/markdown if no mimeType is provided.",
    {
      name: z.string().describe("File name including extension (e.g. 'notes.md', 'data.csv')"),
      content: z.string().describe("Text content to write into the file"),
      mimeType: z.string().optional().default("text/markdown").describe("MIME type of the file (default: text/markdown)"),
      parentId: z.string().optional().describe("Parent folder ID; omit to place in root"),
    },
    async ({ name, content, mimeType, parentId }) => {
      try {
        const res = await drive.files.create({
          requestBody: {
            name,
            mimeType,
            parents: parentId ? [parentId] : undefined,
          },
          media: {
            mimeType,
            body: content,
          },
          fields: "id, name, mimeType, parents, webViewLink",
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error creating file: ${String(err)}` }],
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
