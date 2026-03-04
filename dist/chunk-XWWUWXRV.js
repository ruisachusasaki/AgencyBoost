import {
  EncryptionService
} from "./chunk-BGP47S4B.js";
import {
  db
} from "./chunk-6E5ZACMQ.js";
import {
  calendarConnections
} from "./chunk-LAXEHSWM.js";

// server/googleCalendarUtils.ts
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { eq, and } from "drizzle-orm";
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
function getRedirectUri() {
  if (process.env.NODE_ENV === "production") {
    return process.env.GOOGLE_REDIRECT_URI || "https://your-domain.com/api/google-calendar/oauth/callback";
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/api/google-calendar/oauth/callback`;
  }
  return process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/google-calendar/oauth/callback";
}
function createOAuth2Client() {
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
}
async function getUserCalendarClient(userId, calendarId = "primary") {
  const connection = await db.query.calendarConnections.findFirst({
    where: and(
      eq(calendarConnections.userId, userId),
      eq(calendarConnections.calendarId, calendarId)
    )
  });
  if (!connection || !connection.accessToken) {
    throw new Error("No valid calendar connection found");
  }
  const accessToken = EncryptionService.decrypt(connection.accessToken);
  let refreshToken = null;
  if (connection.refreshToken) {
    refreshToken = EncryptionService.decrypt(connection.refreshToken);
  }
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      const encryptedAccessToken = EncryptionService.encrypt(tokens.access_token);
      const updateData = {
        accessToken: encryptedAccessToken,
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (tokens.refresh_token) {
        updateData.refreshToken = EncryptionService.encrypt(tokens.refresh_token);
      }
      await db.update(calendarConnections).set(updateData).where(eq(calendarConnections.id, connection.id));
    }
  });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export {
  createOAuth2Client,
  getUserCalendarClient
};
