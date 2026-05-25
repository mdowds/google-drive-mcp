import "dotenv/config";
import fs from "fs";
import http from "http";
import path from "path";
import { URL } from "url";
import { google } from "googleapis";

const TOKENS_PATH = path.join(process.cwd(), "tokens.json");
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents",
];

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars must be set");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("Open this URL in your browser to authenticate:\n");
console.log(authUrl);
console.log("\nWaiting for callback on port", PORT, "...");

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/callback")) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(`Authentication failed: ${error ?? "no code received"}`);
    server.close();
    process.exit(1);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    console.log(`\nAuthentication successful. Tokens saved to ${TOKENS_PATH}`);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Authentication successful. You can close this tab.");
  } catch (err) {
    console.error("Failed to exchange auth code:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Authentication failed. Check the console for details.");
  } finally {
    server.close();
  }
});

server.listen(PORT);
