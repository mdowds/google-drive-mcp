import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const TOKENS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "tokens.json");

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars must be set");
  process.exit(1);
}

if (!fs.existsSync(TOKENS_PATH)) {
  console.error(`No tokens found at ${TOKENS_PATH}. Run "npm run auth" to authenticate.`);
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, "http://localhost:3000/callback");

const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"));
oauth2Client.setCredentials(tokens);

oauth2Client.on("tokens", (updated) => {
  const merged = { ...tokens, ...updated };
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(merged, null, 2), { mode: 0o600 });
});

export const sheets = google.sheets({ version: "v4", auth: oauth2Client });
export const drive = google.drive({ version: "v3", auth: oauth2Client });
