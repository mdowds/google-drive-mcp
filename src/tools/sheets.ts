import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sheets, drive } from "../auth.js";

export function registerSheetsTools(server: McpServer) {
  server.tool(
    "sheets_create",
    "Create a new Google Spreadsheet, optionally placing it in a specific Drive folder",
    {
      title: z.string().describe("Title of the new spreadsheet"),
      folderId: z.string().optional().describe("Drive folder ID to place the spreadsheet in"),
    },
    async ({ title, folderId }) => {
      try {
        const res = await sheets.spreadsheets.create({
          requestBody: { properties: { title } },
          fields: "spreadsheetId,spreadsheetUrl",
        });

        const spreadsheetId = res.data.spreadsheetId!;

        if (folderId) {
          // Move to target folder: first get current parents, then update
          const fileRes = await drive.files.get({
            fileId: spreadsheetId,
            fields: "parents",
          });
          const currentParents = (fileRes.data.parents ?? []).join(",");
          await drive.files.update({
            fileId: spreadsheetId,
            addParents: folderId,
            removeParents: currentParents,
            fields: "id, parents",
          });
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { spreadsheetId, spreadsheetUrl: res.data.spreadsheetUrl },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error creating spreadsheet: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "sheets_read_range",
    "Read values from a range in a Google Spreadsheet",
    {
      spreadsheetId: z.string().describe("The spreadsheet ID"),
      range: z.string().describe("A1 notation range, e.g. 'Sheet1!A1:D10'"),
    },
    async ({ spreadsheetId, range }) => {
      try {
        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        return {
          content: [
            { type: "text", text: JSON.stringify(res.data.values ?? [], null, 2) },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error reading range: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "sheets_write_range",
    "Write values to a range in a Google Spreadsheet (overwrites existing content)",
    {
      spreadsheetId: z.string().describe("The spreadsheet ID"),
      range: z.string().describe("A1 notation range, e.g. 'Sheet1!A1'"),
      values: z.array(z.array(z.unknown())).describe("2D array of values to write"),
    },
    async ({ spreadsheetId, range, values }) => {
      try {
        const res = await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: values as string[][] },
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  updatedRange: res.data.updatedRange,
                  updatedRows: res.data.updatedRows,
                  updatedColumns: res.data.updatedColumns,
                  updatedCells: res.data.updatedCells,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error writing range: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "sheets_add_sheet",
    "Add a new tab (sheet) to an existing spreadsheet",
    {
      spreadsheetId: z.string().describe("The spreadsheet ID"),
      title: z.string().describe("Title for the new sheet tab"),
    },
    async ({ spreadsheetId, title }) => {
      try {
        const res = await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title } } }],
          },
        });
        const newSheet = res.data.replies?.[0]?.addSheet?.properties;
        return {
          content: [{ type: "text", text: JSON.stringify(newSheet, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error adding sheet: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "sheets_rename_sheet",
    "Rename an existing tab in a spreadsheet",
    {
      spreadsheetId: z.string().describe("The spreadsheet ID"),
      sheetId: z.number().int().describe("The numeric sheet ID (not the name)"),
      title: z.string().describe("New title for the sheet tab"),
    },
    async ({ spreadsheetId, sheetId, title }) => {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                updateSheetProperties: {
                  properties: { sheetId, title },
                  fields: "title",
                },
              },
            ],
          },
        });
        return {
          content: [{ type: "text", text: `Sheet ${sheetId} renamed to "${title}"` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error renaming sheet: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "sheets_delete_sheet",
    "Delete a tab from a spreadsheet",
    {
      spreadsheetId: z.string().describe("The spreadsheet ID"),
      sheetId: z.number().int().describe("The numeric sheet ID to delete"),
    },
    async ({ spreadsheetId, sheetId }) => {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ deleteSheet: { sheetId } }],
          },
        });
        return {
          content: [{ type: "text", text: `Sheet ${sheetId} deleted` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error deleting sheet: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "sheets_batch_update_values",
    "Write values to multiple ranges in a Google Spreadsheet in a single request",
    {
      spreadsheetId: z.string().describe("The spreadsheet ID"),
      updates: z
        .array(
          z.object({
            range: z.string().describe("A1 notation range, e.g. 'Sheet1!A1'"),
            values: z.array(z.array(z.unknown())).describe("2D array of values to write"),
          })
        )
        .describe("Array of range/values pairs to update"),
    },
    async ({ spreadsheetId, updates }) => {
      try {
        const res = await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: "USER_ENTERED",
            data: updates.map(({ range, values }) => ({ range, values: values as string[][] })),
          },
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalUpdatedSheets: res.data.totalUpdatedSheets,
                  totalUpdatedRows: res.data.totalUpdatedRows,
                  totalUpdatedColumns: res.data.totalUpdatedColumns,
                  totalUpdatedCells: res.data.totalUpdatedCells,
                  responses: res.data.responses?.map((r) => ({
                    updatedRange: r.updatedRange,
                    updatedRows: r.updatedRows,
                    updatedColumns: r.updatedColumns,
                    updatedCells: r.updatedCells,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error batch updating values: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "sheets_list_sheets",
    "List all tabs (sheets) in a spreadsheet",
    {
      spreadsheetId: z.string().describe("The spreadsheet ID"),
    },
    async ({ spreadsheetId }) => {
      try {
        const res = await sheets.spreadsheets.get({
          spreadsheetId,
          fields: "sheets.properties",
        });
        const sheetList = (res.data.sheets ?? []).map((s) => s.properties);
        return {
          content: [{ type: "text", text: JSON.stringify(sheetList, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error listing sheets: ${String(err)}` }],
          isError: true,
        };
      }
    }
  );
}
