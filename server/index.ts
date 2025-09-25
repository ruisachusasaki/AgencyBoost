import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { sql, eq } from "drizzle-orm";
import { clientBriefSections, automationTriggers } from "@shared/schema";

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
 * Initialize default automation triggers
 * Creates sample automation triggers in the database for system functionality
 */
async function initializeDefaultAutomationTriggers() {
  try {
    log("Running startup migration: initializeDefaultAutomationTriggers");
    
    // Check if triggers already exist
    const existingTriggers = await db.select().from(automationTriggers).limit(1);
    
    if (existingTriggers.length > 0) {
      log("Automation triggers already exist - skipping initialization");
      return;
    }
    
    // Sample automation triggers
    const sampleTriggers = [
      {
        id: "trigger-1",
        name: "New Client Created",
        type: "client_created",
        description: "Triggers when a new client is added to the system",
        category: "contact_management",
        configSchema: {
          status: { 
            type: "string", 
            options: ["active", "inactive", "pending"],
            label: "Client Status"
          },
          contactType: { 
            type: "string", 
            options: ["lead", "client"],
            label: "Contact Type"
          },
          contactSource: { 
            type: "string", 
            options: ["website", "referral", "cold_outreach", "social_media", "paid_ads", "manual", "import"],
            label: "Contact Source"
          }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-1a",
        name: "New Lead Created",
        type: "lead_created", 
        description: "Triggers when a new lead is added to the pipeline",
        category: "contact_management",
        configSchema: {
          source: { 
            type: "string", 
            options: ["website", "referral", "social_media", "advertising", "cold_outreach"],
            label: "Lead Source"
          },
          status: {
            type: "string",
            options: ["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"],
            label: "Lead Status"
          }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-2",
        name: "Form Submitted",
        type: "form_submitted",
        description: "Triggers when a specific form is submitted",
        category: "form_management",
        configSchema: {
          form_id: { type: "string", required: true },
          fields: { type: "object" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-3",
        name: "Tag Added",
        type: "tag_added",
        description: "Triggers when a specific tag is added to a contact",
        category: "contact_management",
        configSchema: {
          tag_name: { type: "string", required: true }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-4",
        name: "Client Status Changed",
        type: "client_status_changed",
        description: "Triggers when a client's status changes",
        category: "contact_management",
        configSchema: {
          from_status: { 
            type: "string", 
            options: ["lead", "prospect", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"],
            label: "From Status"
          },
          to_status: { 
            type: "string", 
            options: ["lead", "prospect", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"],
            label: "To Status",
            required: true
          }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-appointment-booked",
        name: "Appointment Booked",
        type: "appointment_booked",
        description: "Triggers when a new appointment is scheduled",
        category: "calendar_management",
        configSchema: {
          calendar_id: {
            type: "calendar_select",
            label: "Calendar",
            required: false
          },
          staff_id: {
            type: "staff_select", 
            label: "Assigned Staff Member",
            required: false
          },
          booking_source: {
            type: "string",
            label: "Booking Source",
            options: ["external_calendar_link", "manually", "api", "sync_google", "sync_microsoft"],
            required: false
          }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-appointment-status-changed",
        name: "Appointment Status Changed",
        type: "appointment_status_changed",
        description: "Triggers when an appointment status changes from one state to another",
        category: "calendar_management",
        configSchema: {
          from_status: {
            type: "string",
            label: "From Status",
            options: ["scheduled", "confirmed", "cancelled", "completed", "no_show"],
            required: false
          },
          to_status: {
            type: "string", 
            label: "To Status",
            options: ["scheduled", "confirmed", "cancelled", "completed", "no_show"],
            required: true
          }
        },
        isActive: true,
        createdAt: new Date()
      }
    ];

    // Insert all sample triggers
    await db.insert(automationTriggers).values(sampleTriggers);
    
    log(`Automation triggers initialization completed successfully - ${sampleTriggers.length} triggers created`);
  } catch (error: any) {
    log(`Automation triggers initialization error: ${error.message}`);
    // Don't crash the server if initialization fails
    log("WARNING: Automation triggers initialization failed - some automation functionality may not work correctly");
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

// Configure PostgreSQL session store
const PgSession = connectPgSimple(session);

// Session middleware configuration
console.log("🔧 Configuring session middleware with DATABASE_URL:", process.env.DATABASE_URL ? "FOUND" : "MISSING");

const sessionStore = new PgSession({
  conString: process.env.DATABASE_URL,
  tableName: 'user_sessions',
  createTableIfMissing: true
});

// Add comprehensive error handling for session store
sessionStore.on('error', (err) => {
  console.error("🚨 Session Store Error:", err);
});

sessionStore.on('connect', () => {
  console.log("✅ Session Store Connected to PostgreSQL");
});

sessionStore.on('disconnect', () => {
  console.error("❌ Session Store Disconnected from PostgreSQL");
});

// Test session store connection immediately
console.log("🔧 Testing session store connection...");
sessionStore.get('test-connection', (err, session) => {
  if (err) {
    console.error("❌ Session Store Connection Test Failed:", err);
  } else {
    console.log("✅ Session Store Connection Test Passed");
  }
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key-here-change-in-production',
  resave: true, // Force session save to ensure persistence
  saveUninitialized: true, // Save uninitialized sessions to store
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Note: Session debugging middleware removed for production

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
  await initializeDefaultAutomationTriggers();
  
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
