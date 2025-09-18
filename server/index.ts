import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { clientBriefSections } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Startup migration to ensure client brief columns exist
 * Adds 8 brief columns to clients table and backfills brief_background with existing client_brief data
 */
async function ensureClientBriefColumns() {
  try {
    log("Running startup migration: ensureClientBriefColumns");
    
    // Add all 8 brief columns to clients table (idempotent with IF NOT EXISTS)
    await db.execute(sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS brief_background text,
      ADD COLUMN IF NOT EXISTS brief_objectives text,
      ADD COLUMN IF NOT EXISTS brief_brand_info text,
      ADD COLUMN IF NOT EXISTS brief_audience_info text,
      ADD COLUMN IF NOT EXISTS brief_products_services text,
      ADD COLUMN IF NOT EXISTS brief_competitors text,
      ADD COLUMN IF NOT EXISTS brief_marketing_tech text,
      ADD COLUMN IF NOT EXISTS brief_miscellaneous text;
    `);
    
    // Backfill brief_background with existing client_brief data (if client_brief column exists)
    try {
      await db.execute(sql`
        UPDATE clients 
        SET brief_background = COALESCE(brief_background, client_brief) 
        WHERE brief_background IS NULL AND client_brief IS NOT NULL;
      `);
      log("Successfully backfilled brief_background from client_brief data");
    } catch (backfillError: any) {
      // client_brief column might not exist, which is fine
      if (backfillError.code === '42703') {
        log("client_brief column not found - skipping backfill (normal for new installations)");
      } else {
        log(`Backfill warning: ${backfillError.message}`);
      }
    }
    
    log("Client brief columns migration completed successfully");
  } catch (error: any) {
    log(`Migration error: ${error.message}`);
    // Don't crash the server if migration fails - log warning and continue
    log("WARNING: Client brief columns migration failed - server will continue but brief sections may not work correctly");
  }
}

/**
 * Initialize core client brief sections
 * Creates the 8 core sections that map to existing client table columns
 */
async function initializeCoreClientBriefSections() {
  try {
    log("Running startup migration: initializeCoreClientBriefSections");
    
    const coreSections = [
      {
        key: 'briefBackground',
        title: 'Background',
        placeholder: 'Add background information about the client...',
        icon: 'FileText',
        displayOrder: 0,
        scope: 'core'
      },
      {
        key: 'briefObjectives',
        title: 'Objectives/Goals',
        placeholder: 'Define client objectives and goals...',
        icon: 'Target',
        displayOrder: 1,
        scope: 'core'
      },
      {
        key: 'briefBrandInfo',
        title: 'Brand Info',
        placeholder: 'Add brand information, guidelines, messaging...',
        icon: 'Tag',
        displayOrder: 2,
        scope: 'core'
      },
      {
        key: 'briefAudienceInfo',
        title: 'Audience Info',
        placeholder: 'Describe the target audience and demographics...',
        icon: 'Users',
        displayOrder: 3,
        scope: 'core'
      },
      {
        key: 'briefProductsServices',
        title: 'Products/Services',
        placeholder: 'List and describe key products or services...',
        icon: 'Package',
        displayOrder: 4,
        scope: 'core'
      },
      {
        key: 'briefCompetitors',
        title: 'Competitors',
        placeholder: 'Identify competitors and competitive analysis...',
        icon: 'Activity',
        displayOrder: 5,
        scope: 'core'
      },
      {
        key: 'briefMarketingTech',
        title: 'Marketing Tech',
        placeholder: 'List marketing technology and tools used...',
        icon: 'Zap',
        displayOrder: 6,
        scope: 'core'
      },
      {
        key: 'briefMiscellaneous',
        title: 'Miscellaneous',
        placeholder: 'Add any additional information...',
        icon: 'Archive',
        displayOrder: 7,
        scope: 'core'
      }
    ];

    // Insert or update each core section (idempotent)
    for (const section of coreSections) {
      const existing = await db.select().from(clientBriefSections).where(eq(clientBriefSections.key, section.key)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(clientBriefSections).values({
          key: section.key,
          title: section.title,
          placeholder: section.placeholder,
          icon: section.icon,
          displayOrder: section.displayOrder,
          isEnabled: true,
          scope: section.scope,
          type: 'text'
        });
        log(`Created core brief section: ${section.title}`);
      } else {
        // Update existing core section to ensure it has latest configuration
        await db.update(clientBriefSections)
          .set({
            title: section.title,
            placeholder: section.placeholder,
            icon: section.icon,
            displayOrder: section.displayOrder,
            scope: section.scope,
            type: 'text'
          })
          .where(eq(clientBriefSections.key, section.key));
        log(`Updated core brief section: ${section.title}`);
      }
    }
    
    log("Core client brief sections initialization completed successfully");
  } catch (error: any) {
    log(`Core brief sections initialization error: ${error.message}`);
    // Don't crash the server if initialization fails - log warning and continue
    log("WARNING: Core brief sections initialization failed - custom brief functionality may not work correctly");
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run startup migrations before setting up routes
  await ensureClientBriefColumns();
  await initializeCoreClientBriefSections();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
