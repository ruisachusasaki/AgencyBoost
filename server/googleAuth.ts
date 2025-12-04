import { OAuth2Client } from "google-auth-library";
import session from "express-session";
import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { staff, roles, userRoles } from "@shared/schema";
import { eq } from "drizzle-orm";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("⚠️ Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
}

function getRedirectUri(req: Request): string {
  const protocol = "https";
  const host = req.get("host") || req.hostname;
  return `${protocol}://${host}/api/callback`;
}

function createOAuth2Client(req: Request): OAuth2Client {
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    getRedirectUri(req)
  );
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      maxAge: sessionTtl,
    },
  });
}

async function upsertStaffFromGoogleProfile(profile: {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}) {
  const googleSub = profile.sub;
  const email = profile.email;

  if (!email || typeof email !== "string") {
    throw new Error("Email is required for authentication");
  }

  const firstName = profile.given_name || "User";
  const lastName = profile.family_name || "";
  const profileImageUrl = profile.picture;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if staff member already exists by Google sub (stored in replitAuthSub field)
  let existingStaff = await db
    .select()
    .from(staff)
    .where(eq(staff.replitAuthSub, googleSub))
    .limit(1);

  if (existingStaff.length > 0) {
    // Update existing staff member
    const [updated] = await db
      .update(staff)
      .set({
        email: normalizedEmail,
        firstName,
        lastName,
        profileImagePath: profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(staff.id, existingStaff[0].id))
      .returning();
    return updated;
  }

  // Check if staff member exists by email (link Google to existing account)
  let existingByEmail = await db
    .select()
    .from(staff)
    .where(eq(staff.email, normalizedEmail))
    .limit(1);

  if (existingByEmail.length > 0) {
    const existingStaffMember = existingByEmail[0];

    // Security: Only link if staff doesn't have an existing Google identity
    if (existingStaffMember.replitAuthSub) {
      throw new Error(
        "This email is already linked to a different Google account. Please contact your administrator."
      );
    }

    // Link Google identity to existing staff member
    const [updated] = await db
      .update(staff)
      .set({
        replitAuthSub: googleSub,
        profileImagePath: existingStaffMember.profileImagePath || profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(staff.id, existingStaffMember.id))
      .returning();
    return updated;
  }

  // Check if this is the first user (bootstrap admin)
  const staffCount = await db.select().from(staff);
  const isFirstUser = staffCount.length === 0;

  // Create new staff member
  const [newStaff] = await db
    .insert(staff)
    .values({
      replitAuthSub: googleSub,
      email: normalizedEmail,
      firstName,
      lastName,
      profileImagePath: profileImageUrl,
      isActive: true,
    })
    .returning();

  // If this is the first user, make them an admin
  if (isFirstUser) {
    console.log("🎉 First user detected! Bootstrapping admin role...");

    let adminRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "Admin"))
      .limit(1);

    if (adminRole.length === 0) {
      const [created] = await db
        .insert(roles)
        .values({
          name: "Admin",
          description: "Full system access",
        })
        .returning();
      adminRole = [created];
    }

    await db
      .update(staff)
      .set({ roleId: adminRole[0].id })
      .where(eq(staff.id, newStaff.id));

    await db.insert(userRoles).values({
      userId: newStaff.id,
      roleId: adminRole[0].id,
    });

    console.log(`✅ Admin role assigned to ${firstName} ${lastName} (${email})`);
  }

  return newStaff;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  console.log("✅ Google OAuth initialized");

  // Login route - redirect to Google
  app.get("/api/login", (req: Request, res: Response) => {
    try {
      // Clear any existing session data
      if (req.session) {
        delete req.session.userId;
        delete req.session.user;
        delete req.session.impersonatedUserId;
        delete req.session.originalAdminUserId;
      }

      const oauth2Client = createOAuth2Client(req);
      
      const redirectUri = getRedirectUri(req);
      console.log("🔐 Using redirect URI:", redirectUri);
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
          "openid",
        ],
        prompt: "select_account", // Always show account selector
        include_granted_scopes: true,
      });

      console.log("🔐 Starting Google OAuth flow - redirecting to:", authUrl.substring(0, 100) + "...");
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error starting OAuth flow:", error);
      res.redirect("/login?error=oauth_init_failed");
    }
  });

  // Callback route - handle Google's response
  app.get("/api/callback", async (req: Request, res: Response) => {
    console.log("📥 OAuth callback received:", {
      query: req.query,
      url: req.url,
      originalUrl: req.originalUrl,
      host: req.hostname,
    });
    
    const { code, error, error_description } = req.query;

    if (error) {
      console.error("Google OAuth error:", error, error_description);
      return res.redirect(`/login?error=google_denied&details=${encodeURIComponent(String(error_description || error))}`);
    }

    if (!code || typeof code !== "string") {
      console.error("No authorization code received. Query params:", JSON.stringify(req.query));
      return res.redirect("/login?error=no_code");
    }

    try {
      console.log("🔄 Exchanging authorization code for tokens...");
      const oauth2Client = createOAuth2Client(req);
      console.log("🔄 Using redirect URI for token exchange:", getRedirectUri(req));
      
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      console.log("✅ Tokens received:", {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      });
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        throw new Error("Failed to fetch user info from Google");
      }

      const userInfo = await userInfoResponse.json();
      
      console.log("🔑 Google user info received:", JSON.stringify({
        sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
      }));

      // Upsert staff member
      const staffMember = await upsertStaffFromGoogleProfile({
        sub: userInfo.sub,
        email: userInfo.email,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        picture: userInfo.picture,
      });

      // Store session data
      req.session.userId = staffMember.id;
      req.session.user = {
        id: staffMember.id,
        staffId: staffMember.id,
        email: userInfo.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date,
      };

      // Save session
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.redirect("/login?error=session_failed");
        }

        console.log("✅ Authentication successful for:", userInfo.email, "-> staffId:", staffMember.id);
        res.redirect("/");
      });
    } catch (error: any) {
      console.error("Google OAuth callback error:", error.message);
      console.error("Full error:", error);
      if (error.response?.data) {
        console.error("Error response data:", error.response.data);
      }
      res.redirect("/login?error=auth_failed");
    }
  });

  // Logout route
  app.get("/api/logout", (req: Request, res: Response) => {
    const redirectUrl = `https://${req.hostname}/login`;
    
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        
        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });

        console.log("✅ Session destroyed, redirecting to login");
        res.redirect(redirectUrl);
      });
    } else {
      res.redirect(redirectUrl);
    }
  });
}

export const isAuthenticated: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "Please log in to access this resource" 
    });
  }

  // Check if session has user data
  const sessionUser = req.session.user as any;
  if (!sessionUser) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "Session expired. Please log in again." 
    });
  }

  // Token refresh check - if access token is expired, we could refresh here
  // For now, let's just validate the session exists
  const expiresAt = sessionUser.expiresAt;
  const now = Date.now();

  if (expiresAt && now > expiresAt && sessionUser.refreshToken) {
    try {
      // Refresh the token
      const oauth2Client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({
        refresh_token: sessionUser.refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update session with new tokens
      req.session.user = {
        ...sessionUser,
        accessToken: credentials.access_token,
        expiresAt: credentials.expiry_date,
      };
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Don't fail the request - session is still valid
    }
  }

  return next();
};

// Type augmentation for express-session
declare module "express-session" {
  interface SessionData {
    userId: string;
    user: {
      id: string;
      staffId: string;
      email: string;
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    };
    impersonatedUserId?: string;
    originalAdminUserId?: string;
  }
}
