import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./googleAuth";
import { setupGoogleCalendar } from "./googleCalendarSetup";
import { db } from "./db";
import { sql, eq } from "drizzle-orm";
import { clientBriefSections, automationTriggers, calendars, staff, calendarAppointments, teamPositions, expenseReportFormConfig, users, dashboardWidgets, oneOnOneProgressionStatuses, timeOffPolicies, timeOffTypes } from "@shared/schema";

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

/**
 * Initialize default calendars for Anniversaries and Birthdays
 * Creates two system calendars to track staff anniversaries and birthdays
 */
async function initializeDefaultCalendars() {
  try {
    log("Running startup migration: initializeDefaultCalendars");
    
    // Get the first available staff member to be the creator of system calendars
    const [firstStaff] = await db.select().from(staff).where(eq(staff.isActive, true)).limit(1);
    
    if (!firstStaff) {
      log("No active staff members found - skipping default calendars initialization");
      return;
    }
    
    const defaultCalendars = [
      {
        name: 'Anniversaries',
        description: 'Staff work anniversaries based on hire dates',
        type: 'system',
        customUrl: 'anniversaries-system',
        duration: 60,
        location: 'none',
        isActive: true,
        createdBy: firstStaff.id
      },
      {
        name: 'Birthdays',
        description: 'Staff birthdays',
        type: 'system',
        customUrl: 'birthdays-system',
        duration: 60,
        location: 'none',
        isActive: true,
        createdBy: firstStaff.id
      }
    ];

    // Check if calendars already exist and create them if they don't
    for (const calendarData of defaultCalendars) {
      const existing = await db.select().from(calendars).where(eq(calendars.name, calendarData.name)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(calendars).values(calendarData);
        log(`Created default calendar: ${calendarData.name}`);
      } else {
        log(`Default calendar already exists: ${calendarData.name}`);
      }
    }
    
    log("Default calendars initialization completed successfully");
  } catch (error: any) {
    log(`Default calendars initialization error: ${error.message}`);
    // Don't crash the server if initialization fails - log warning and continue
    log("WARNING: Default calendars initialization failed - calendar functionality may not work correctly");
  }
}

/**
 * Generate anniversary and birthday calendar events for current year
 * Creates calendar appointment entries for staff anniversaries and birthdays
 */
async function generateAnniversaryAndBirthdayEvents() {
  try {
    log("Running startup migration: generateAnniversaryAndBirthdayEvents");
    
    // Get the Anniversaries and Birthdays calendars
    const [anniversaryCalendar] = await db.select().from(calendars).where(eq(calendars.name, 'Anniversaries')).limit(1);
    const [birthdayCalendar] = await db.select().from(calendars).where(eq(calendars.name, 'Birthdays')).limit(1);
    
    if (!anniversaryCalendar || !birthdayCalendar) {
      log("Anniversary or Birthday calendars not found - skipping event generation");
      return;
    }
    
    // Get all active staff members with hire dates and birthdays
    const activeStaff = await db.select().from(staff).where(eq(staff.isActive, true));
    
    const currentYear = new Date().getFullYear();
    const eventsToCreate = [];
    
    // Generate anniversary events
    for (const staffMember of activeStaff) {
      if (staffMember.hireDate) {
        const hireDate = new Date(staffMember.hireDate);
        const anniversaryDate = new Date(currentYear, hireDate.getMonth(), hireDate.getDate());
        
        // Calculate years of service
        const yearsOfService = currentYear - hireDate.getFullYear();
        
        if (yearsOfService > 0) {
          eventsToCreate.push({
            calendarId: anniversaryCalendar.id,
            assignedTo: staffMember.id,
            title: `${staffMember.firstName} ${staffMember.lastName} - ${yearsOfService} Year Anniversary`,
            description: `${staffMember.firstName} ${staffMember.lastName} joined the company on ${hireDate.toLocaleDateString()}. Today marks ${yearsOfService} year${yearsOfService === 1 ? '' : 's'} of service!`,
            startTime: anniversaryDate,
            endTime: new Date(anniversaryDate.getTime() + 60 * 60 * 1000), // 1 hour duration
            status: 'confirmed',
            timezone: 'America/New_York',
            bookerEmail: staffMember.email || 'system@company.com',
            bookerName: 'System Generated',
            bookingSource: 'system'
          });
        }
      }
      
      // Generate birthday events
      if (staffMember.birthdate) {
        const birthDate = new Date(staffMember.birthdate);
        const birthdayDate = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        
        eventsToCreate.push({
          calendarId: birthdayCalendar.id,
          assignedTo: staffMember.id,
          title: `${staffMember.firstName} ${staffMember.lastName}'s Birthday`,
          description: `Today is ${staffMember.firstName} ${staffMember.lastName}'s birthday! Wish them a happy birthday.`,
          startTime: birthdayDate,
          endTime: new Date(birthdayDate.getTime() + 60 * 60 * 1000), // 1 hour duration
          status: 'confirmed',
          timezone: 'America/New_York',
          bookerEmail: staffMember.email || 'system@company.com',
          bookerName: 'System Generated',
          bookingSource: 'system'
        });
      }
    }
    
    // Check which events already exist and only create new ones
    let createdCount = 0;
    for (const eventData of eventsToCreate) {
      const existing = await db.select()
        .from(calendarAppointments)
        .where(eq(calendarAppointments.title, eventData.title))
        .limit(1);
        
      if (existing.length === 0) {
        await db.insert(calendarAppointments).values(eventData);
        createdCount++;
      }
    }
    
    log(`Anniversary and birthday events generation completed - created ${createdCount} new events for ${currentYear}`);
  } catch (error: any) {
    log(`Anniversary and birthday events generation error: ${error.message}`);
    log("WARNING: Event generation failed - some calendar events may be missing");
  }
}

/**
 * Initialize default team positions for client assignments
 * Creates the standard positions used in the Client Hub
 */
async function initializeDefaultTeamPositions() {
  try {
    log("Running startup migration: initializeDefaultTeamPositions");
    
    // Create team_positions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS team_positions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        key text NOT NULL UNIQUE,
        label text NOT NULL,
        description text,
        "order" integer DEFAULT 0,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);
    
    // Create client_team_assignments table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS client_team_assignments (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id varchar NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        position_id varchar NOT NULL REFERENCES team_positions(id) ON DELETE CASCADE,
        assigned_at timestamp DEFAULT now(),
        assigned_by uuid NOT NULL REFERENCES staff(id),
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        UNIQUE(client_id, position_id)
      );
    `);
    
    log("Team position tables created successfully");

    // Check if positions already exist
    const existingPositions = await db.select().from(teamPositions).limit(1);
    if (existingPositions.length > 0) {
      log("Team positions already exist - skipping initialization");
      return;
    }

    const defaultPositions = [
      { key: "setter", label: "Setter", description: "Lead qualification and appointment setting", order: 1 },
      { key: "bdr", label: "BDR", description: "Business Development Representative", order: 2 },
      { key: "account_manager", label: "Account Manager", description: "Client relationship management", order: 3 },
      { key: "media_buyer", label: "Media Buyer", description: "Paid advertising management", order: 4 },
      { key: "cro_specialist", label: "CRO Specialist", description: "Conversion rate optimization", order: 5 },
      { key: "automation_specialist", label: "Automation Specialist", description: "Marketing automation setup", order: 6 },
      { key: "show_rate_specialist", label: "Show Rate Specialist", description: "Appointment show rate optimization", order: 7 },
      { key: "data_specialist", label: "Data Specialist", description: "Analytics and reporting", order: 8 },
      { key: "seo_specialist", label: "SEO Specialist", description: "Search engine optimization", order: 9 },
      { key: "social_media_specialist", label: "Social Media Specialist", description: "Social media management", order: 10 }
    ];

    for (const position of defaultPositions) {
      await db.insert(teamPositions).values(position);
      log(`Created default team position: ${position.label}`);
    }

    log("Default team positions initialization completed successfully");
  } catch (error: any) {
    log(`Default team positions initialization error: ${error.message}`);
    log("WARNING: Team positions initialization failed - team assignments may not work properly");
  }
}

/**
 * Initialize default expense report form fields
 * Creates default form configuration with 12 standard fields
 */
async function initializeDefaultExpenseReportFormFields() {
  try {
    log("Running startup migration: initializeDefaultExpenseReportFormFields");
    
    // Check if config already exists
    const existingConfig = await db.select().from(expenseReportFormConfig).limit(1);
    if (existingConfig.length > 0) {
      log("Expense report form config already exists - skipping initialization");
      return;
    }

    // Get the first admin user to be the creator
    const [adminUser] = await db.select().from(users).where(eq(users.role, 'Admin')).limit(1);
    
    if (!adminUser) {
      log("WARNING: No admin user found to create default expense report form config");
      return;
    }

    const defaultFields = [
      { id: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name', required: true, order: 0 },
      { id: 'supervisor', label: 'Your Supervisor', type: 'user-dropdown', required: true, order: 1 },
      { id: 'purpose', label: 'Purpose of the Expense', type: 'text', placeholder: 'Enter the purpose of this expense', required: true, order: 2 },
      { id: 'expense_type', label: 'Expense Type', type: 'select', required: true, options: ['Hotel', 'Fuel', 'Travel', 'Meals', 'Education/Training', 'Other'], order: 3 },
      { id: 'expense_date', label: 'Expense Date', type: 'date', required: true, order: 4 },
      { id: 'expense_total', label: 'Expense(s) Total', type: 'currency', placeholder: '0.00', required: true, order: 5 },
      { id: 'department_team', label: 'Department/Team', type: 'select', required: true, order: 6 },
      { id: 'client', label: 'Client', type: 'select', required: false, order: 7 },
      { id: 'reimbursement', label: 'Reimbursement', type: 'select', required: true, options: ['Yes', 'No', 'Not Sure'], order: 8 },
      { id: 'payment_method', label: 'Payment Method', type: 'select', required: true, options: ["Joe's Card", "Che's Card", "Personal Card"], order: 9 },
      { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Add any additional notes or details', required: false, order: 10 },
      { id: 'receipts', label: 'Receipt(s)', type: 'file', required: false, order: 11 }
    ];

    await db.insert(expenseReportFormConfig).values({
      fields: defaultFields,
      updatedBy: adminUser.id
    });

    log("Default expense report form fields initialization completed successfully");
  } catch (error: any) {
    log(`Default expense report form fields initialization error: ${error.message}`);
    log("WARNING: Expense report form initialization failed - using form defaults");
  }
}

/**
 * Initialize HR & Team Dashboard Widgets
 * Creates widget definitions for HR features with proper permission controls
 */
async function initializeHRTeamWidgets() {
  try {
    log("Running startup migration: initializeHRTeamWidgets");
    
    // Define the HR & Team widgets with proper permissions
    const hrTeamWidgets = [
      {
        type: 'pending_time_off_requests',
        name: 'Pending Time Off Requests',
        description: 'Requests awaiting approval',
        category: 'hr_team',
        icon: 'Calendar',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: ['Admin', 'Manager'], // Only HR managers can see
        isActive: true
      },
      {
        type: 'whos_off_today_week',
        name: "Who's Off Today/This Week",
        description: 'Team members on PTO',
        category: 'hr_team',
        icon: 'Users',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: null, // All staff can see who's off
        isActive: true
      },
      {
        type: 'new_job_applications',
        name: 'New Job Applications',
        description: 'Recent applications by position',
        category: 'hr_team',
        icon: 'Briefcase',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: ['Admin', 'Manager'], // Only HR managers can see
        isActive: true
      },
      {
        type: 'onboarding_queue',
        name: 'Onboarding Queue',
        description: 'New hire submissions pending review',
        category: 'hr_team',
        icon: 'UserPlus',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: ['Admin', 'Manager'], // Only HR managers can see
        isActive: true
      },
      {
        type: 'pending_expense_reports',
        name: 'Pending Expense Reports',
        description: 'Expense submissions awaiting approval',
        category: 'hr_team',
        icon: 'DollarSign',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: ['Admin', 'Manager', 'Accounting'], // Managers and accounting can see
        isActive: true
      },
      {
        type: 'team_capacity_alerts',
        name: 'Team Capacity Alerts',
        description: 'Predictive hiring notifications',
        category: 'hr_team',
        icon: 'AlertTriangle',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: ['Admin', 'Manager'], // Only managers can see
        isActive: true
      },
      {
        type: 'team_birthday_anniversary',
        name: 'Team Birthday/Anniversary Calendar',
        description: 'Upcoming celebrations',
        category: 'hr_team',
        icon: 'Gift',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: null, // All staff can see celebrations
        isActive: true
      },
      {
        type: 'training_completion_status',
        name: 'Training Completion Status',
        description: 'Course completion rates',
        category: 'hr_team',
        icon: 'GraduationCap',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: ['Admin', 'Manager'], // Only managers can see
        isActive: true
      }
    ];

    // Check if widgets already exist and insert only new ones
    for (const widget of hrTeamWidgets) {
      const existing = await db.select().from(dashboardWidgets).where(eq(dashboardWidgets.type, widget.type)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(dashboardWidgets).values(widget);
        log(`Created widget: ${widget.name}`);
      } else {
        log(`Widget already exists: ${widget.name} - skipping`);
      }
    }

    log("HR & Team widgets initialization completed successfully");
  } catch (error: any) {
    log(`HR & Team widgets initialization error: ${error.message}`);
    log("WARNING: HR & Team widgets initialization failed - widgets may not be available");
  }
}

/**
 * Initialize Calendar & Appointments Dashboard Widgets
 * Creates widget definitions for calendar and appointment tracking features
 */
async function initializeCalendarAppointmentWidgets() {
  try {
    log("Running startup migration: initializeCalendarAppointmentWidgets");
    
    // Define the Calendar & Appointments widgets
    const calendarWidgets = [
      {
        type: 'todays_appointments',
        name: "Today's Appointments",
        description: 'Scheduled for today',
        category: 'calendar_appointments',
        icon: 'Calendar',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: null, // All staff can see their own appointments
        isActive: true
      },
      {
        type: 'upcoming_appointments',
        name: 'Upcoming Appointments',
        description: 'Next 7 days',
        category: 'calendar_appointments',
        icon: 'CalendarDays',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: null, // All staff can see their own appointments
        isActive: true
      },
      {
        type: 'appointment_no_shows',
        name: 'Appointment No-Shows',
        description: 'Recent missed appointments',
        category: 'calendar_appointments',
        icon: 'UserX',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: null, // All staff can see, filtered by role in backend
        isActive: true
      },
      {
        type: 'overdue_appointments',
        name: 'Overdue Appointments',
        description: 'Past appointments needing status update',
        category: 'calendar_appointments',
        icon: 'AlertCircle',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: null, // All staff can see, filtered by role in backend
        isActive: true
      }
    ];

    // Check if widgets already exist and insert only new ones
    for (const widget of calendarWidgets) {
      const existing = await db.select().from(dashboardWidgets).where(eq(dashboardWidgets.type, widget.type)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(dashboardWidgets).values(widget);
        log(`Widget created: ${widget.name}`);
      } else {
        log(`Widget already exists: ${widget.name} - skipping`);
      }
    }

    log("Calendar & Appointments widgets initialization completed successfully");
  } catch (error: any) {
    log(`Calendar & Appointments widgets initialization error: ${error.message}`);
    log("WARNING: Calendar & Appointments widgets initialization failed - widgets may not be available");
  }
}

/**
 * Initialize Activity & Alerts Dashboard Widgets
 * Creates widget definitions for mentions and system notifications
 */
async function initializeActivityAlertsWidgets() {
  try {
    log("Running startup migration: initializeActivityAlertsWidgets");
    
    // Define the Activity & Alerts widgets
    const activityWidgets = [
      {
        type: 'my_mentions',
        name: 'My Mentions',
        description: 'Comments and tasks where you\'re mentioned',
        category: 'activity_alerts',
        icon: 'AtSign',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: null, // All staff can see their own mentions
        isActive: true
      },
      {
        type: 'system_alerts',
        name: 'System Alerts',
        description: 'Important notifications and warnings',
        category: 'activity_alerts',
        icon: 'Bell',
        defaultWidth: 2,
        defaultHeight: 2,
        minWidth: 2,
        minHeight: 2,
        maxWidth: 4,
        maxHeight: 4,
        allowedRoles: null, // All staff can see their own alerts
        isActive: true
      }
    ];

    // Check if widgets already exist and insert only new ones
    for (const widget of activityWidgets) {
      const existing = await db.select().from(dashboardWidgets).where(eq(dashboardWidgets.type, widget.type)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(dashboardWidgets).values(widget);
        log(`Widget created: ${widget.name}`);
      } else {
        log(`Widget already exists: ${widget.name} - skipping`);
      }
    }

    log("Activity & Alerts widgets initialization completed successfully");
  } catch (error: any) {
    log(`Activity & Alerts widgets initialization error: ${error.message}`);
    log("WARNING: Activity & Alerts widgets initialization failed - widgets may not be available");
  }
}

/**
 * Initialize default 1-on-1 progression statuses
 * Creates the standard progression status options for 1-on-1 meetings
 */
async function initializeDefaultProgressionStatuses() {
  try {
    log("Running startup migration: initializeDefaultProgressionStatuses");
    
    // Create table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS one_on_one_progression_statuses (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        value varchar(100) NOT NULL UNIQUE,
        label varchar(100) NOT NULL,
        color varchar(100) NOT NULL,
        order_index integer DEFAULT 0,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);
    
    // Check if statuses already exist
    const existingStatuses = await db.select().from(oneOnOneProgressionStatuses).limit(1);
    
    if (existingStatuses.length > 0) {
      log("Progression statuses already exist - skipping initialization");
      return;
    }
    
    // Default progression statuses
    const defaultStatuses = [
      {
        value: "retention_risk",
        label: "Retention Risk",
        color: "bg-red-100 text-red-800",
        orderIndex: 1,
        isActive: true
      },
      {
        value: "performance_issues",
        label: "Performance Issues",
        color: "bg-orange-100 text-orange-800",
        orderIndex: 2,
        isActive: true
      },
      {
        value: "ready_for_promotion",
        label: "Ready for Promotion",
        color: "bg-green-100 text-green-800",
        orderIndex: 3,
        isActive: true
      }
    ];
    
    await db.insert(oneOnOneProgressionStatuses).values(defaultStatuses);
    log(`Default progression statuses created: ${defaultStatuses.length} statuses`);
    
    log("Progression statuses initialization completed successfully");
  } catch (error: any) {
    log(`Progression statuses initialization error: ${error.message}`);
    log("WARNING: Progression statuses initialization failed - statuses may not be available");
  }
}

/**
 * Initialize default global time off types
 * Creates Vacation Time, Sick Days, and Personal Days as company-wide categories
 */
async function initializeDefaultTimeOffTypes() {
  try {
    log("Running startup migration: initializeDefaultTimeOffTypes");
    
    // Check if global types already exist
    const existingTypes = await db.select().from(timeOffTypes).limit(1);
    
    if (existingTypes.length > 0) {
      log("Time off types already exist - skipping initialization");
      return;
    }
    
    // Create global default types
    const defaultTypes = [
      {
        name: "Vacation Time",
        description: "Paid time off for personal rest and relaxation",
        defaultDaysPerYear: 15,
        allowCarryOver: false,
        maxCarryOverDays: 0,
        color: "bg-primary/10 text-primary",
        orderIndex: 0,
        isActive: true,
      },
      {
        name: "Sick Days",
        description: "Paid time off for illness or medical appointments",
        defaultDaysPerYear: 10,
        allowCarryOver: false,
        maxCarryOverDays: 0,
        color: "bg-orange-100 text-orange-800",
        orderIndex: 1,
        isActive: true,
      },
      {
        name: "Personal Days",
        description: "Paid time off for personal matters",
        defaultDaysPerYear: 3,
        allowCarryOver: false,
        maxCarryOverDays: 0,
        color: "bg-purple-100 text-purple-800",
        orderIndex: 2,
        isActive: true,
      },
    ];
    
    for (const typeData of defaultTypes) {
      await db.insert(timeOffTypes).values(typeData);
    }
    
    log(`Time off types initialization completed - created ${defaultTypes.length} global types`);
  } catch (error: any) {
    log(`Time off types initialization error: ${error.message}`);
    log("WARNING: Time off types initialization failed - types may not be available");
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  await initializeDefaultCalendars();
  await generateAnniversaryAndBirthdayEvents();
  await initializeDefaultTeamPositions();
  await initializeDefaultExpenseReportFormFields();
  await initializeHRTeamWidgets();
  await initializeCalendarAppointmentWidgets();
  await initializeActivityAlertsWidgets();
  await initializeDefaultProgressionStatuses();
  await initializeDefaultTimeOffTypes();
  
  // Setup Replit Auth
  await setupAuth(app);
  log("✅ Replit Auth initialized");
  
  // Setup Google Calendar OAuth routes
  setupGoogleCalendar(app);
  log("✅ Google Calendar OAuth routes initialized");
  
  // Start background calendar sync service
  const { startBackgroundSync } = await import('./googleCalendarBackgroundSync');
  startBackgroundSync();
  log("✅ Google Calendar background sync started");
  
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
