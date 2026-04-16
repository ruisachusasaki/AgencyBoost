import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { staff, roles, userRoles } from "@shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // For iframe contexts (like Replit preview), we need sameSite: 'none' and secure: true
  // Replit always serves over HTTPS, so secure: true works in both dev and prod
  const isProduction = process.env.NODE_ENV === 'production';
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertStaffFromClaims(claims: any) {
  const replitSub = claims["sub"];
  const email = claims["email"];
  
  // Defensive check: ensure email is present
  if (!email || typeof email !== 'string') {
    throw new Error('Email claim is required for authentication');
  }
  
  const firstName = claims["first_name"] || "User";
  const lastName = claims["last_name"] || "";
  const profileImageUrl = claims["profile_image_url"];
  const normalizedEmail = email.toLowerCase().trim();

  // Check if staff member already exists by Replit Auth sub
  let existingStaff = await db
    .select()
    .from(staff)
    .where(eq(staff.replitAuthSub, replitSub))
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

  // Check if staff member exists by email (link OIDC to existing account)
  // Only link if the existing staff doesn't have a replitAuthSub yet
  let existingByEmail = await db
    .select()
    .from(staff)
    .where(eq(staff.email, normalizedEmail))
    .limit(1);

  if (existingByEmail.length > 0) {
    const existingStaffMember = existingByEmail[0];
    
    // Security: Only link if staff doesn't have an existing OIDC identity
    if (existingStaffMember.replitAuthSub) {
      // Staff already has a different OIDC identity linked
      throw new Error('This email is already linked to a different Replit account. Please contact your administrator.');
    }
    
    // Link OIDC identity to existing staff member (preserve existing data)
    const [updated] = await db
      .update(staff)
      .set({
        replitAuthSub: replitSub,
        // Only update profile image if not already set
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
      replitAuthSub: replitSub,
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
    
    // Find or create Admin role
    let adminRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "Admin"))
      .limit(1);

    if (adminRole.length === 0) {
      // Create admin role if it doesn't exist
      const [created] = await db
        .insert(roles)
        .values({
          name: "Admin",
          description: "Full system access",
        })
        .returning();
      adminRole = [created];
    }

    // Assign admin role to the new staff member
    await db
      .update(staff)
      .set({ roleId: adminRole[0].id })
      .where(eq(staff.id, newStaff.id));

    // Also add to userRoles junction table
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
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user: any = {};
      updateUserSession(user, tokens);
      const staffMember = await upsertStaffFromClaims(tokens.claims());
      user.staffId = staffMember.id;
      user.userId = staffMember.id; // Set userId for session compatibility
      verified(null, user);
    } catch (error: any) {
      console.error("Authentication error:", error.message);
      // Pass error to passport which will redirect to failureRedirect
      verified(error, false);
    }
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Clear any existing user data before starting new OAuth flow
    // This prevents stale session data (including impersonation) from persisting
    // BUT we keep the session alive because passport needs it for OAuth state
    const startOAuth = () => {
      console.log("🔐 Starting OAuth flow - forcing fresh login");
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login", // Force re-login
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    };

    if (req.session) {
      // Clear all user-related data from the session but keep session alive for OAuth
      delete req.session.userId;
      delete req.session.passport;
      delete req.session.impersonatedUserId;
      delete req.session.originalAdminUserId;
      delete req.session.user;
      
      // Save the cleared session, then start OAuth
      req.session.save((err) => {
        if (err) {
          console.error("Session save error during login cleanup:", err);
        }
        startOAuth();
      });
    } else {
      startOAuth();
    }
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, (err: any, user: any, info: any) => {
      if (err || !user) {
        console.error("Authentication failed:", err || info);
        return res.redirect("/login?error=auth_failed");
      }
      
      // Log the claims received from OIDC for debugging
      console.log("🔑 OIDC Claims received:", JSON.stringify({
        sub: user.claims?.sub,
        email: user.claims?.email,
        firstName: user.claims?.first_name,
        lastName: user.claims?.last_name,
        staffId: user.staffId,
      }));
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.redirect("/login?error=login_failed");
        }
        
        // Set userId in session for compatibility with existing auth system
        if (user.userId || user.staffId) {
          req.session.userId = user.userId || user.staffId;
        }
        
        // Save session and redirect
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.redirect("/login?error=session_failed");
          }
          
          console.log("✅ Authentication successful for:", user.claims?.email, "-> staffId:", user.staffId);
          res.redirect("/dashboard");
        });
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const endSessionUrl = client.buildEndSessionUrl(config, {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: `https://${req.hostname}`,
    }).href;

    // First logout from passport
    req.logout(() => {
      // Then destroy the entire session to clear all data including impersonation
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error during logout:", err);
          }
          
          // Clear the session cookie
          res.clearCookie('connect.sid', {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'none'
          });
          
          console.log("✅ Session destroyed, redirecting to OIDC end session");
          res.redirect(endSessionUrl);
        });
      } else {
        res.redirect(endSessionUrl);
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
