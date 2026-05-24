import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDriveTools } from "./tools/drive.js";
import { registerSheetsTools } from "./tools/sheets.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "google-drive",
    version: "1.0.0",
  });

  registerDriveTools(server);
  registerSheetsTools(server);

  return server;
}
