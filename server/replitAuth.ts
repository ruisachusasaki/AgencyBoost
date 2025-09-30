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
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
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
  const firstName = claims["first_name"] || "User";
  const lastName = claims["last_name"] || "";
  const profileImageUrl = claims["profile_image_url"];

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
        email,
        firstName,
        lastName,
        profileImagePath: profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(staff.id, existingStaff[0].id))
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
      email,
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
    const user: any = {};
    updateUserSession(user, tokens);
    const staffMember = await upsertStaffFromClaims(tokens.claims());
    user.staffId = staffMember.id;
    verified(null, user);
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
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
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
