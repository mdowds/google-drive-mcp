import { google } from "googleapis";

const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
if (!keyJson) {
  console.error("GOOGLE_SERVICE_ACCOUNT_KEY env var is not set");
  process.exit(1);
}

const credentials = JSON.parse(keyJson);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
});

export const sheets = google.sheets({ version: "v4", auth });
export const drive = google.drive({ version: "v3", auth });
