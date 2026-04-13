import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./googleAuth";
import { setupGoogleCalendar } from "./googleCalendarSetup";
import { db } from "./db";
import { sql, eq, and } from "drizzle-orm";
import { clientBriefSections, automationTriggers, automationActions, calendars, staff, staffLinkedEmails, calendarAppointments, teamPositions, expenseReportFormConfig, users, dashboardWidgets, oneOnOneProgressionStatuses, timeOffPolicies, timeOffTypes, userRoles, tags, tasks } from "@shared/schema";

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
    
    // Get all existing trigger types to check which ones are missing
    const existingTriggers = await db.select({ type: automationTriggers.type }).from(automationTriggers);
    const existingTypes = new Set(existingTriggers.map(t => t.type));
    
    // If triggers exist, check for any missing critical triggers and add them
    if (existingTriggers.length > 0) {
      // Critical triggers that must exist - add any missing ones
      const criticalTriggers = [
        {
          id: "trigger-2a",
          name: "Survey Submitted",
          type: "survey_submitted",
          description: "Triggers when a survey is submitted",
          category: "form_management",
          configSchema: {
            survey_id: { type: "string", label: "Survey", required: true },
            fields: { type: "object" },
            filters: { type: "filters", label: "Custom Field Filters" }
          },
          isActive: true,
          createdAt: new Date()
        },
        // Slack triggers
        {
          id: "trigger-slack-message",
          name: "Slack Message Received",
          type: "slack_message_received",
          description: "Triggers when a message is posted in a Slack channel",
          category: "integration",
          configSchema: {
            channel_id: { type: "string", label: "Channel ID", placeholder: "Filter by channel (leave empty for all)" },
            contains_text: { type: "string", label: "Contains Text", placeholder: "Trigger only if message contains this text" },
            from_user_id: { type: "string", label: "From User ID", placeholder: "Filter by sender (leave empty for all)" }
          },
          isActive: true,
          createdAt: new Date()
        },
        {
          id: "trigger-slack-reaction",
          name: "Slack Reaction Added",
          type: "slack_reaction_added",
          description: "Triggers when an emoji reaction is added to a message",
          category: "integration",
          configSchema: {
            channel_id: { type: "string", label: "Channel ID", placeholder: "Filter by channel (leave empty for all)" },
            emoji: { type: "string", label: "Emoji", placeholder: "Filter by emoji name (leave empty for all)" },
            by_user_id: { type: "string", label: "By User ID", placeholder: "Filter by who added the reaction" }
          },
          isActive: true,
          createdAt: new Date()
        },
        {
          id: "trigger-slack-mention",
          name: "Slack Bot Mentioned",
          type: "slack_app_mention",
          description: "Triggers when your Slack bot is mentioned in a message",
          category: "integration",
          configSchema: {
            channel_id: { type: "string", label: "Channel ID", placeholder: "Filter by channel (leave empty for all)" }
          },
          isActive: true,
          createdAt: new Date()
        },
        {
          id: "trigger-slack-channel-created",
          name: "Slack Channel Created",
          type: "slack_channel_created",
          description: "Triggers when a new Slack channel is created",
          category: "integration",
          configSchema: {
            is_private: { type: "boolean", label: "Private Channel Only", default: false }
          },
          isActive: true,
          createdAt: new Date()
        },
        {
          id: "trigger-quote-signed",
          name: "Quote Signed",
          type: "quote_signed",
          description: "Triggers when a sales quote status is updated to Signed",
          category: "Sales",
          configSchema: {
            clientId: { type: "client_select", label: "Client", required: false },
            leadId: { type: "lead_select", label: "Lead", required: false }
          },
          isActive: true,
          createdAt: new Date()
        },
        {
          id: "trigger-client-onboarding-started",
          name: "Client Onboarding Started",
          type: "client_onboarding_started",
          description: "Triggers when a client opens and begins their onboarding form",
          category: "Client Management",
          configSchema: {
            clientId: { type: "client_select", label: "Client", required: false }
          },
          isActive: true,
          createdAt: new Date()
        },
        {
          id: "trigger-client-onboarding-saved",
          name: "Client Onboarding Progress Saved",
          type: "client_onboarding_saved",
          description: "Triggers when a client saves progress on their onboarding form",
          category: "Client Management",
          configSchema: {
            clientId: { type: "client_select", label: "Client", required: false },
            currentStep: { type: "number", label: "Step Number" }
          },
          isActive: true,
          createdAt: new Date()
        },
        {
          id: "trigger-client-onboarding-completed",
          name: "Client Onboarding Completed",
          type: "client_onboarding_completed",
          description: "Triggers when a client finishes and submits their onboarding form",
          category: "Client Management",
          configSchema: {
            clientId: { type: "client_select", label: "Client", required: false }
          },
          isActive: true,
          createdAt: new Date()
        },
        {
          id: "trigger-weekly-hours-below-threshold",
          name: "Weekly Hours Below Threshold",
          type: "weekly_hours_below_threshold",
          description: "Triggers when a staff member logs fewer hours than the configured threshold for the previous week. Fires once per week per staff member who is below the threshold.",
          category: "hr_management",
          configSchema: {
            hours_threshold: { type: "number", label: "Minimum Hours Threshold", placeholder: "40", default: 40 },
            check_day: { type: "string", label: "Day to Check", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], default: "Monday" },
            include_calendar_time: { type: "boolean", label: "Include Calendar Time Entries", default: true },
            staff_filter: { type: "string", label: "Staff Filter", options: ["all_staff", "my_direct_reports", "specific_department"], default: "my_direct_reports" },
            department: { type: "string", label: "Department (for specific department filter)", placeholder: "e.g. Creative, DevOps, Data" }
          },
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      const missingTriggers = criticalTriggers.filter(t => !existingTypes.has(t.type));
      
      if (missingTriggers.length > 0) {
        for (const trigger of missingTriggers) {
          try {
            await db.insert(automationTriggers).values(trigger);
            log(`Added missing critical trigger: ${trigger.name}`);
          } catch (insertError: any) {
            // Handle duplicate key error gracefully
            if (insertError.code !== '23505') {
              log(`Warning: Could not add trigger ${trigger.name}: ${insertError.message}`);
            }
          }
        }
      } else {
        log("Automation triggers already exist - all critical triggers present");
      }
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
          fields: { type: "object" },
          filters: { type: "filters", label: "Custom Field Filters" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-2a",
        name: "Survey Submitted",
        type: "survey_submitted",
        description: "Triggers when a survey is submitted",
        category: "form_management",
        configSchema: {
          survey_id: { type: "string", label: "Survey", required: true },
          fields: { type: "object" },
          filters: { type: "filters", label: "Custom Field Filters" }
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
      },
      // Slack triggers
      {
        id: "trigger-slack-message",
        name: "Slack Message Received",
        type: "slack_message_received",
        description: "Triggers when a message is posted in a Slack channel",
        category: "integration",
        configSchema: {
          channel_id: { type: "string", label: "Channel ID", placeholder: "Filter by channel (leave empty for all)" },
          contains_text: { type: "string", label: "Contains Text", placeholder: "Trigger only if message contains this text" },
          from_user_id: { type: "string", label: "From User ID", placeholder: "Filter by sender (leave empty for all)" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-slack-reaction",
        name: "Slack Reaction Added",
        type: "slack_reaction_added",
        description: "Triggers when an emoji reaction is added to a message",
        category: "integration",
        configSchema: {
          channel_id: { type: "string", label: "Channel ID", placeholder: "Filter by channel (leave empty for all)" },
          emoji: { type: "string", label: "Emoji", placeholder: "Filter by emoji name (leave empty for all)" },
          by_user_id: { type: "string", label: "By User ID", placeholder: "Filter by who added the reaction" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-slack-mention",
        name: "Slack Bot Mentioned",
        type: "slack_app_mention",
        description: "Triggers when your Slack bot is mentioned in a message",
        category: "integration",
        configSchema: {
          channel_id: { type: "string", label: "Channel ID", placeholder: "Filter by channel (leave empty for all)" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-slack-channel-created",
        name: "Slack Channel Created",
        type: "slack_channel_created",
        description: "Triggers when a new Slack channel is created",
        category: "integration",
        configSchema: {
          is_private: { type: "boolean", label: "Private Channel Only", default: false }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-quote-signed-sample",
        name: "Quote Signed",
        type: "quote_signed",
        description: "Triggers when a sales quote status is updated to Signed",
        category: "Sales",
        configSchema: {
          clientId: { type: "client_select", label: "Client", required: false },
          leadId: { type: "lead_select", label: "Lead", required: false }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-client-onboarding-started-sample",
        name: "Client Onboarding Started",
        type: "client_onboarding_started",
        description: "Triggers when a client opens and begins their onboarding form",
        category: "Client Management",
        configSchema: {
          clientId: { type: "client_select", label: "Client", required: false }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-client-onboarding-saved-sample",
        name: "Client Onboarding Progress Saved",
        type: "client_onboarding_saved",
        description: "Triggers when a client saves progress on their onboarding form",
        category: "Client Management",
        configSchema: {
          clientId: { type: "client_select", label: "Client", required: false },
          currentStep: { type: "number", label: "Step Number" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "trigger-client-onboarding-completed-sample",
        name: "Client Onboarding Completed",
        type: "client_onboarding_completed",
        description: "Triggers when a client finishes and submits their onboarding form",
        category: "Client Management",
        configSchema: {
          clientId: { type: "client_select", label: "Client", required: false }
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
 * Initialize default automation actions
 * Creates sample automation actions in the database for system functionality
 */
async function initializeDefaultAutomationActions() {
  try {
    log("Running startup migration: initializeDefaultAutomationActions");
    
    // Check if actions already exist
    const existingActions = await db.select().from(automationActions).limit(1);
    
    if (existingActions.length > 0) {
      log("Automation actions already exist - skipping initialization");
      return;
    }
    
    // Sample automation actions matching workflow engine capabilities
    const sampleActions = [
      // Communication Actions
      {
        id: "action-1",
        name: "Send Email",
        type: "send_email",
        description: "Send an email to a contact using a template or custom content",
        category: "communication",
        configSchema: {
          template_id: { type: "email_template", label: "Email Template" },
          to: { type: "string", label: "Recipient Email" },
          subject: { type: "string", label: "Subject (override)" },
          body: { type: "textarea", label: "Body (override)" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-2",
        name: "Send SMS",
        type: "send_sms",
        description: "Send an SMS message to a contact",
        category: "communication",
        configSchema: {
          template_id: { type: "sms_template", label: "SMS Template" },
          to: { type: "string", label: "Phone Number" },
          message: { type: "textarea", label: "Message Content" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-3",
        name: "Send Internal Notification",
        type: "send_internal_notification",
        description: "Send a notification to team members",
        category: "communication",
        configSchema: {
          recipient_type: { 
            type: "string", 
            options: ["specific_user", "contact_owner", "all_admins"], 
            label: "Send To",
            required: true 
          },
          recipient_id: { type: "staff_select", label: "Specific User" },
          title: { type: "string", label: "Notification Title", required: true },
          message: { type: "textarea", label: "Message", required: true }
        },
        isActive: true,
        createdAt: new Date()
      },
      // Assignment Actions
      {
        id: "action-4",
        name: "Assign Contact Owner",
        type: "assign_contact_owner",
        description: "Assign a staff member as the owner of a contact",
        category: "assignment",
        configSchema: {
          staff_id: { type: "staff_select", label: "Assign To", required: true },
          assignment_type: { 
            type: "string", 
            options: ["specific", "round_robin", "least_assigned"],
            label: "Assignment Type"
          }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-5",
        name: "Assign Lead",
        type: "assign_lead",
        description: "Assign a lead to a sales representative",
        category: "assignment",
        configSchema: {
          staff_id: { type: "staff_select", label: "Sales Rep", required: true },
          send_notification: { type: "boolean", label: "Notify Assignee" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-6",
        name: "Assign Task",
        type: "assign_task",
        description: "Assign a task to a team member",
        category: "assignment",
        configSchema: {
          staff_id: { type: "staff_select", label: "Assign To", required: true },
          task_id: { type: "task_select", label: "Task" }
        },
        isActive: true,
        createdAt: new Date()
      },
      // Data Management Actions
      {
        id: "action-7",
        name: "Update Contact Field",
        type: "update_contact",
        description: "Update a field on the contact record",
        category: "data_management",
        configSchema: {
          field: { type: "custom_field_select", label: "Field to Update", required: true },
          value: { type: "string", label: "New Value", required: true },
          use_form_value: { type: "boolean", label: "Use form submission value" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-8",
        name: "Add Tags",
        type: "add_tags",
        description: "Add one or more tags to a contact",
        category: "data_management",
        configSchema: {
          tags: { type: "tag_multi_select", label: "Tags to Add", required: true }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-9",
        name: "Remove Tags",
        type: "remove_tags",
        description: "Remove tags from a contact",
        category: "data_management",
        configSchema: {
          tags: { type: "tag_multi_select", label: "Tags to Remove", required: true }
        },
        isActive: true,
        createdAt: new Date()
      },
      // Status & Progress Actions
      {
        id: "action-10",
        name: "Update Lead Stage",
        type: "update_lead_stage",
        description: "Move a lead to a different pipeline stage",
        category: "status_progress",
        configSchema: {
          stage_id: { type: "lead_stage_select", label: "New Stage", required: true }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-11",
        name: "Update Client Status",
        type: "update_client_status",
        description: "Change the status of a client",
        category: "status_progress",
        configSchema: {
          status: { 
            type: "string", 
            options: ["active", "inactive", "pending", "churned"],
            label: "New Status",
            required: true 
          }
        },
        isActive: true,
        createdAt: new Date()
      },
      // Task Actions
      {
        id: "action-12",
        name: "Create Task",
        type: "create_task",
        description: "Create a new task associated with the contact",
        category: "data_management",
        configSchema: {
          title: { type: "string", label: "Task Title", required: true },
          description: { type: "textarea", label: "Description" },
          assignee_id: { type: "staff_select", label: "Assign To" },
          due_in_days: { type: "number", label: "Due In (Days)", min: 0 },
          priority: { 
            type: "string", 
            options: ["low", "medium", "high", "urgent"],
            label: "Priority"
          }
        },
        isActive: true,
        createdAt: new Date()
      },
      // Internal Control Actions
      {
        id: "action-13",
        name: "Wait/Delay",
        type: "wait",
        description: "Pause the workflow for a specified duration",
        category: "internal",
        configSchema: {
          duration: { type: "number", label: "Duration", required: true, min: 1 },
          unit: { 
            type: "string", 
            options: ["minutes", "hours", "days"],
            label: "Time Unit",
            required: true
          }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-14",
        name: "If/Else Condition",
        type: "condition",
        description: "Branch workflow based on conditions",
        category: "internal",
        configSchema: {
          field: { type: "custom_field_select", label: "Field to Check", required: true },
          operator: { 
            type: "string", 
            options: ["equals", "not_equals", "contains", "not_contains", "greater_than", "less_than", "is_empty", "is_not_empty"],
            label: "Operator",
            required: true
          },
          value: { type: "string", label: "Value" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-15",
        name: "Webhook",
        type: "webhook",
        description: "Send data to an external URL",
        category: "internal",
        configSchema: {
          url: { type: "string", label: "Webhook URL", required: true },
          method: { 
            type: "string", 
            options: ["POST", "GET", "PUT", "PATCH"],
            label: "HTTP Method",
            required: true
          },
          headers: { type: "key_value", label: "Headers" },
          payload: { type: "textarea", label: "Request Body (JSON)" }
        },
        isActive: true,
        createdAt: new Date()
      },
      // Calendar Actions
      {
        id: "action-16",
        name: "Create Appointment",
        type: "create_appointment",
        description: "Schedule an appointment for the contact",
        category: "calendar_scheduling",
        configSchema: {
          calendar_id: { type: "calendar_select", label: "Calendar", required: true },
          title: { type: "string", label: "Appointment Title", required: true },
          duration: { type: "number", label: "Duration (minutes)", min: 15 },
          assignee_id: { type: "staff_select", label: "Assign To" },
          days_from_now: { type: "number", label: "Schedule In (Days)", min: 0 }
        },
        isActive: true,
        createdAt: new Date()
      },
      // Note Actions
      {
        id: "action-17",
        name: "Add Note",
        type: "add_note",
        description: "Add a note to the contact record",
        category: "data_management",
        configSchema: {
          content: { type: "textarea", label: "Note Content", required: true },
          is_pinned: { type: "boolean", label: "Pin Note" }
        },
        isActive: true,
        createdAt: new Date()
      },
      // Activity Logging
      {
        id: "action-18",
        name: "Log Activity",
        type: "log_activity",
        description: "Record an activity in the contact timeline",
        category: "data_management",
        configSchema: {
          activity_type: { 
            type: "string", 
            options: ["call", "meeting", "email", "note", "task", "other"],
            label: "Activity Type",
            required: true
          },
          description: { type: "textarea", label: "Description", required: true }
        },
        isActive: true,
        createdAt: new Date()
      },
      // Slack Actions
      {
        id: "action-slack-message",
        name: "Send Slack Message",
        type: "send_slack_message",
        description: "Send a message to a Slack channel",
        category: "integration",
        configSchema: {
          channel: { type: "string", label: "Channel ID", placeholder: "Leave empty for default channel" },
          message: { type: "textarea", label: "Message", required: true }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-slack-dm",
        name: "Send Slack DM",
        type: "send_slack_dm",
        description: "Send a direct message to a Slack user",
        category: "integration",
        configSchema: {
          userId: { type: "string", label: "User ID", placeholder: "Slack user ID" },
          email: { type: "string", label: "User Email", placeholder: "Or lookup by email" },
          message: { type: "textarea", label: "Message", required: true }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-slack-reaction",
        name: "Add Slack Reaction",
        type: "add_slack_reaction",
        description: "Add an emoji reaction to a Slack message",
        category: "integration",
        configSchema: {
          channel: { type: "string", label: "Channel ID", required: true },
          timestamp: { type: "string", label: "Message Timestamp", required: true },
          emoji: { type: "string", label: "Emoji", required: true, placeholder: "thumbsup" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-slack-channel",
        name: "Create Slack Channel",
        type: "create_slack_channel",
        description: "Create a new Slack channel",
        category: "integration",
        configSchema: {
          name: { type: "string", label: "Channel Name", required: true },
          isPrivate: { type: "boolean", label: "Private Channel", default: false },
          description: { type: "string", label: "Channel Description" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-slack-topic",
        name: "Set Slack Channel Topic",
        type: "set_slack_topic",
        description: "Set the topic for a Slack channel",
        category: "integration",
        configSchema: {
          channel: { type: "string", label: "Channel ID", required: true },
          topic: { type: "string", label: "Topic", required: true }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-slack-reminder",
        name: "Create Slack Reminder",
        type: "create_slack_reminder",
        description: "Create a reminder in Slack",
        category: "integration",
        configSchema: {
          text: { type: "string", label: "Reminder Text", required: true },
          time: { type: "string", label: "Time", required: true, placeholder: "in 1 hour, tomorrow at 9am" },
          user: { type: "string", label: "User ID", placeholder: "Leave empty for yourself" }
        },
        isActive: true,
        createdAt: new Date()
      }
    ];

    // Insert all sample actions
    await db.insert(automationActions).values(sampleActions);
    
    log(`Automation actions initialization completed successfully - ${sampleActions.length} actions created`);
  } catch (error: any) {
    log(`Automation actions initialization error: ${error.message}`);
    // Don't crash the server if initialization fails
    log("WARNING: Automation actions initialization failed - some automation functionality may not work correctly");
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
        // Section already exists - only update placeholder and scope, preserve user customizations (icon, displayOrder, title)
        // This ensures user's icon and ordering changes are NOT overwritten on server restart
        await db.update(clientBriefSections)
          .set({
            placeholder: section.placeholder,
            scope: section.scope
          })
          .where(eq(clientBriefSections.key, section.key));
        log(`Preserved core brief section: ${section.title} (icon and order kept)`);
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
    
    let createdCount = 0;
    for (const eventData of eventsToCreate) {
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
      const existing = await db.select()
        .from(calendarAppointments)
        .where(
          and(
            eq(calendarAppointments.title, eventData.title),
            eq(calendarAppointments.calendarId, eventData.calendarId),
            sql`${calendarAppointments.startTime} >= ${yearStart}`,
            sql`${calendarAppointments.startTime} <= ${yearEnd}`
          )
        )
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
/**
 * Sync task tags to Settings > Tags
 * Ensures any tags used on tasks also appear in the system tags table
 */
async function syncTaskTagsToSettingsTags() {
  try {
    log("Running startup migration: syncTaskTagsToSettingsTags");
    
    // Get all existing tags from settings
    const existingTags = await db.select().from(tags);
    const existingTagNames = new Set(existingTags.map(t => t.name.toLowerCase()));
    
    // Get all unique tags from tasks
    const allTasks = await db.select({ tags: tasks.tags }).from(tasks);
    const taskTagsSet = new Set<string>();
    
    for (const task of allTasks) {
      if (task.tags && Array.isArray(task.tags)) {
        for (const tag of task.tags) {
          if (tag && typeof tag === "string") {
            taskTagsSet.add(tag);
          }
        }
      }
    }
    
    // Create missing tags
    let createdCount = 0;
    for (const tagName of taskTagsSet) {
      if (!existingTagNames.has(tagName.toLowerCase())) {
        try {
          await db.insert(tags).values({
            name: tagName,
            color: "#46a1a0",
          });
          createdCount++;
          log(`[Tags] Synced task tag to settings: ${tagName}`);
        } catch (err: any) {
          if (!err.message?.includes("duplicate")) {
            log(`[Tags] Warning: Could not sync tag ${tagName}: ${err.message}`);
          }
        }
      }
    }
    
    if (createdCount > 0) {
      log(`[Tags] Synced ${createdCount} task tag(s) to Settings > Tags`);
    } else {
      log("[Tags] All task tags already exist in Settings > Tags");
    }
    
  } catch (error) {
    log(`Warning: Failed to sync task tags: ${error}`);
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

// CRITICAL: Early health check endpoints - respond IMMEDIATELY before any other middleware
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

let appFullyLoaded = false;
app.get('/', (req, res, next) => {
  if (appFullyLoaded) {
    return next();
  }
  res.status(200).send('<!DOCTYPE html><html><head><title>AgencyBoost</title><meta http-equiv="refresh" content="3"></head><body><p>Starting up...</p></body></html>');
});

import { createServer as createHttpServer } from "http";

// Slack webhook status endpoint - helps verify configuration
app.get('/api/integrations/slack/events', (_req, res) => {
  const hasSigningSecret = !!process.env.SLACK_SIGNING_SECRET;
  const hasBotToken = !!process.env.SLACK_BOT_TOKEN;
  res.json({
    status: 'ready',
    message: 'Slack Events webhook is active. POST events to this endpoint.',
    configuration: {
      signingSecretConfigured: hasSigningSecret,
      botTokenConfigured: hasBotToken
    },
    instructions: [
      '1. Go to your Slack App settings at https://api.slack.com/apps',
      '2. Navigate to "Event Subscriptions" in the left sidebar',
      '3. Enable Events and set Request URL to: [YOUR_APP_URL]/api/integrations/slack/events',
      '4. Subscribe to bot events: message.channels, message.groups, reaction_added, channel_created',
      '5. Save and reinstall the app to your workspace'
    ]
  });
});

// Slack Events webhook with raw body capture for signature verification
// MUST be registered before express.json() to capture the raw request body
app.post('/api/integrations/slack/events', 
  express.raw({ type: 'application/json', limit: '1mb' }),
  async (req, res) => {
    console.log('[Slack Events] Received POST request');
    try {
      const rawBody = (req.body as Buffer).toString('utf8');
      console.log('[Slack Events] Raw body received:', rawBody.substring(0, 200));
      
      // STEP 1: Verify signature FIRST before any processing
      // This prevents unauthenticated requests from triggering any logic
      const timestamp = req.headers['x-slack-request-timestamp'] as string;
      const signature = req.headers['x-slack-signature'] as string;

      if (process.env.SLACK_SIGNING_SECRET) {
        if (!timestamp || !signature) {
          console.warn('[Slack Events] Missing signature headers');
          return res.status(401).json({ error: 'Missing authentication headers' });
        }

        const { slackService } = await import('./slack-service');
        if (!slackService.verifySlackRequest(timestamp, signature, rawBody)) {
          console.warn('[Slack Events] Invalid signature - rejecting request');
          return res.status(401).json({ error: 'Invalid signature' });
        }
        console.log('[Slack Events] Signature verified successfully');
      } else {
        console.log('[Slack Events] No signing secret configured, skipping verification');
      }
      
      // STEP 2: Parse JSON only AFTER signature verification
      let payload: any;
      try {
        payload = JSON.parse(rawBody);
      } catch (e) {
        console.error('[Slack Events] Invalid JSON in request body');
        return res.status(400).json({ error: 'Invalid JSON' });
      }

      // STEP 3: Handle URL verification challenge (only after verification)
      if (payload.type === 'url_verification') {
        console.log('[Slack Events] URL verification challenge received');
        return res.json({ challenge: payload.challenge });
      }

      // Import emitTrigger for workflow triggers
      const { emitTrigger } = await import('./workflow-engine');

      // Handle event callbacks
      if (payload.type === 'event_callback') {
        const event = payload.event;
        console.log(`[Slack Events] Received event: ${event.type}`, {
          channel: event.channel,
          user: event.user,
          text: event.text?.substring(0, 50)
        });

        // Map Slack events to workflow triggers
        switch (event.type) {
          case 'message':
            // Ignore bot messages to prevent infinite loops
            // Check for: bot_message subtype, bot_id presence, or message_changed/deleted subtypes
            if (event.subtype === 'bot_message' || 
                event.subtype === 'message_changed' || 
                event.subtype === 'message_deleted' ||
                event.bot_id) {
              console.log(`[Slack Events] Ignoring bot/system message (subtype: ${event.subtype}, bot_id: ${event.bot_id})`);
              return res.json({ ok: true });
            }
            await emitTrigger({
              type: 'slack_message_received',
              data: {
                channel: event.channel,
                channel_type: event.channel_type,
                user: event.user,
                text: event.text,
                ts: event.ts,
                thread_ts: event.thread_ts,
                team: payload.team_id
              },
              context: { timestamp: new Date(), metadata: { source: 'slack_events_api' } }
            });
            break;

          case 'reaction_added':
            await emitTrigger({
              type: 'slack_reaction_added',
              data: {
                channel: event.item.channel,
                message_ts: event.item.ts,
                user: event.user,
                emoji: event.reaction,
                item_user: event.item_user,
                team: payload.team_id
              },
              context: { timestamp: new Date(), metadata: { source: 'slack_events_api' } }
            });
            break;

          case 'app_mention':
            await emitTrigger({
              type: 'slack_app_mention',
              data: {
                channel: event.channel,
                user: event.user,
                text: event.text,
                ts: event.ts,
                team: payload.team_id
              },
              context: { timestamp: new Date(), metadata: { source: 'slack_events_api' } }
            });
            break;

          case 'channel_created':
            await emitTrigger({
              type: 'slack_channel_created',
              data: {
                channel_id: event.channel.id,
                channel_name: event.channel.name,
                creator: event.channel.creator,
                is_private: event.channel.is_private || false,
                team: payload.team_id
              },
              context: { timestamp: new Date(), metadata: { source: 'slack_events_api' } }
            });
            break;

          default:
            console.log(`[Slack Events] Unhandled event type: ${event.type}`);
        }
      }

      res.json({ ok: true });
    } catch (error) {
      console.error('[Slack Events] Error processing event:', error);
      res.status(500).json({ error: 'Failed to process event' });
    }
  }
);

// Stripe webhook with raw body for signature verification
// MUST be registered before express.json()
const stripeWebhookHandler: express.RequestHandler = async (req, res) => {
  try {
    const { handleStripeWebhook } = await import('./proposalRoutes');
    const { getNotificationService } = await import('./notification-service');
    const notificationService = getNotificationService();
    if (notificationService) {
      await handleStripeWebhook(req, res, notificationService);
    } else {
      res.status(503).json({ message: 'Service not ready' });
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler);
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// Standard body parsers for all other routes
// Increased limit for CSV imports which can be large
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Health check endpoint for deployment - must respond quickly before other middleware
app.get("/_health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

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



/**
 * Sync staff.roleId to user_roles junction table
 * This ensures all staff members have proper role assignments for permissions
 */
async function syncStaffRolesToUserRoles() {
  try {
    log("Running startup migration: syncStaffRolesToUserRoles");
    
    // Get all active staff with roleId but missing from user_roles
    const staffWithRoles = await db
      .select({
        id: staff.id,
        roleId: staff.roleId,
        email: staff.email
      })
      .from(staff)
      .where(
        and(
          eq(staff.isActive, true),
          sql`${staff.roleId} IS NOT NULL`
        )
      );
    
    let syncedCount = 0;
    for (const staffMember of staffWithRoles) {
      // Check if user_roles entry already exists
      const existing = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, staffMember.id))
        .limit(1);
      
      if (existing.length === 0 && staffMember.roleId) {
        // Add missing user_roles entry
        await db.insert(userRoles).values({
          userId: staffMember.id,
          roleId: staffMember.roleId,
          assignedBy: staffMember.id // Self-assigned for migration
        });
        syncedCount++;
        log(`Synced role for staff: ${staffMember.email}`);
      }
    }
    
    if (syncedCount > 0) {
      log(`Staff roles sync completed - synced ${syncedCount} users`);
    } else {
      log("All staff roles already synced - no action needed");
    }
  } catch (error) {
    console.error("Error syncing staff roles to user_roles:", error);
  }
}

/**
 * Run all startup migrations
 * Called AFTER server starts listening to avoid Cloud Run health check timeout
 */
async function ensureQuotesProposalColumns() {
  try {
    log("Running startup migration: ensureQuotesProposalColumns");
    await db.execute(sql`
      ALTER TABLE quotes
      ADD COLUMN IF NOT EXISTS public_token varchar,
      ADD COLUMN IF NOT EXISTS signed_at timestamp,
      ADD COLUMN IF NOT EXISTS signed_by_name varchar,
      ADD COLUMN IF NOT EXISTS signed_by_email varchar,
      ADD COLUMN IF NOT EXISTS signature_data text,
      ADD COLUMN IF NOT EXISTS terms_accepted boolean,
      ADD COLUMN IF NOT EXISTS terms_version_id varchar,
      ADD COLUMN IF NOT EXISTS payment_method varchar,
      ADD COLUMN IF NOT EXISTS payment_intent_id varchar,
      ADD COLUMN IF NOT EXISTS payment_status varchar,
      ADD COLUMN IF NOT EXISTS paid_at timestamp,
      ADD COLUMN IF NOT EXISTS paid_amount decimal(10,2),
      ADD COLUMN IF NOT EXISTS payment_amount_type varchar,
      ADD COLUMN IF NOT EXISTS custom_payment_amount decimal(10,2),
      ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp,
      ADD COLUMN IF NOT EXISTS reminder_count integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS expires_at timestamp,
      ADD COLUMN IF NOT EXISTS sent_at timestamp,
      ADD COLUMN IF NOT EXISTS sent_by_user_id uuid,
      ADD COLUMN IF NOT EXISTS viewed_at timestamp;
    `);
    log("Quotes proposal columns migration completed successfully");
  } catch (error: any) {
    log(`Quotes proposal columns migration error: ${error.message}`);
  }
}

async function ensureQuotesCostBreakdownColumns() {
  try {
    log("Running startup migration: ensureQuotesCostBreakdownColumns");
    await db.execute(sql`
      ALTER TABLE quotes
      ADD COLUMN IF NOT EXISTS one_time_cost decimal(10,2) DEFAULT '0',
      ADD COLUMN IF NOT EXISTS monthly_cost decimal(10,2) DEFAULT '0';
    `);
    log("Quotes cost breakdown columns migration completed successfully");
  } catch (error: any) {
    log(`Quotes cost breakdown columns migration error: ${error.message}`);
  }
}

async function ensureLeadProjectedCloseDate() {
  try {
    log("Running startup migration: ensureLeadProjectedCloseDate");
    await db.execute(sql`
      ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS projected_close_date TIMESTAMP
    `);
    log("Lead projected close date column migration completed successfully");
  } catch (error) {
    log(`Error in ensureLeadProjectedCloseDate: ${error}`);
  }
}

async function ensureTicketExternalSubmissionColumns() {
  try {
    log("Running startup migration: ensureTicketExternalSubmissionColumns");
    await db.execute(sql`
      ALTER TABLE tickets
      ADD COLUMN IF NOT EXISTS submitter_name text,
      ADD COLUMN IF NOT EXISTS submitter_email text,
      ADD COLUMN IF NOT EXISTS platform text;
    `);
    await db.execute(sql`
      ALTER TABLE tickets ALTER COLUMN submitted_by DROP NOT NULL;
    `);
    log("Ticket external submission columns migration completed successfully");
  } catch (error: any) {
    log(`Ticket external submission columns migration error: ${error.message}`);
  }
}

async function ensureFormsTablesExist() {
  try {
    log("Running startup migration: ensureFormsTablesExist");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS custom_forms (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        status text NOT NULL DEFAULT 'draft',
        short_code varchar(20) UNIQUE NOT NULL,
        destination text NOT NULL,
        destination_config jsonb DEFAULT '{}',
        settings jsonb DEFAULT '{}',
        styling jsonb DEFAULT '{}',
        embed_api_key varchar(64) UNIQUE,
        platform_label text,
        created_by uuid REFERENCES staff(id),
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_custom_forms_status ON custom_forms(status);
      CREATE INDEX IF NOT EXISTS idx_custom_forms_short_code ON custom_forms(short_code);
      CREATE INDEX IF NOT EXISTS idx_custom_forms_created_by ON custom_forms(created_by);
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS custom_form_fields (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id varchar NOT NULL REFERENCES custom_forms(id) ON DELETE CASCADE,
        type text NOT NULL,
        label text NOT NULL,
        placeholder text,
        required boolean DEFAULT false,
        options text[],
        validation jsonb,
        field_mapping text,
        "order" integer NOT NULL DEFAULT 0,
        settings jsonb DEFAULT '{}',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_custom_form_fields_form ON custom_form_fields(form_id);
      CREATE INDEX IF NOT EXISTS idx_custom_form_fields_order ON custom_form_fields(form_id, "order");
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS custom_form_submissions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id varchar NOT NULL REFERENCES custom_forms(id) ON DELETE CASCADE,
        submitter_name text,
        submitter_email text,
        platform text,
        answers jsonb DEFAULT '{}',
        destination_id varchar,
        destination_type text,
        ip_address text,
        completed_at timestamp,
        created_at timestamp DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_custom_form_submissions_form ON custom_form_submissions(form_id);
      CREATE INDEX IF NOT EXISTS idx_custom_form_submissions_dest ON custom_form_submissions(destination_id);
    `);
    log("Forms tables migration completed successfully");
  } catch (error: any) {
    log(`Forms tables migration error: ${error.message}`);
  }
}

async function ensureTaskCommentsClientPortalColumn() {
  try {
    log("Running startup migration: ensureTaskCommentsClientPortalColumn");
    await db.execute(sql`
      ALTER TABLE task_comments 
      ADD COLUMN IF NOT EXISTS client_portal_user_id varchar REFERENCES client_portal_users(id);
    `);
    log("Task comments client_portal_user_id column ensured");
  } catch (error: any) {
    log(`Task comments migration error: ${error.message}`);
  }
}

async function ensurePxMeetingsObjectivesColumn() {
  try {
    log("Running startup migration: ensurePxMeetingsObjectivesColumn");
    await db.execute(sql`
      ALTER TABLE px_meetings 
      ADD COLUMN IF NOT EXISTS objectives text;
    `);
    log("PX meetings objectives column ensured");
  } catch (error: any) {
    log(`PX meetings objectives migration error: ${error.message}`);
  }
}

async function ensureScheduledHiredEmailsTable() {
  try {
    log("Running startup migration: ensureScheduledHiredEmailsTable");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS scheduled_hired_emails (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id varchar NOT NULL REFERENCES job_applications(id),
        to_email text NOT NULL,
        subject text NOT NULL,
        html_content text NOT NULL,
        scheduled_for timestamp NOT NULL,
        timezone text NOT NULL DEFAULT 'America/New_York',
        status text NOT NULL DEFAULT 'pending',
        sent_at timestamp,
        failure_reason text,
        created_by varchar,
        candidate_name text,
        position_title text,
        created_at timestamp DEFAULT now()
      );
    `);
    log("Scheduled hired emails table ensured");
  } catch (error: any) {
    log(`Scheduled hired emails migration error: ${error.message}`);
  }
}

async function ensureOnboardingWeekColumns() {
  try {
    log("Running startup migration: ensureOnboardingWeekColumns");
    await db.execute(sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_start_date TIMESTAMP`);
    await db.execute(sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_week_released INTEGER DEFAULT 0`);
    await db.execute(sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS onboarding_week INTEGER`);
    await db.execute(sql`ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS onboarding_week INTEGER`);
    await db.execute(sql`ALTER TABLE product_task_templates ADD COLUMN IF NOT EXISTS onboarding_week INTEGER`);
    log("Onboarding week columns migration completed successfully");
  } catch (error: any) {
    log(`Onboarding week columns migration error: ${error.message}`);
  }
}

async function fixJoeEmailInProduction() {
  try {
    const joeActiveId = '030e554b-c0bc-446e-9538-e351f3d17b10';
    const joeOldDevId = 'ed828201-ad6c-4445-8205-548c9ac8e2fe';
    const correctEmail = 'joe@themediaoptimizers.com';

    const activeAccount = await db.select({ id: staff.id, email: staff.email }).from(staff).where(eq(staff.id, joeActiveId)).limit(1);
    if (activeAccount.length === 0) return;
    if (activeAccount[0].email === correctEmail) {
      log("Joe's email already correct, skipping migration");
      return;
    }

    log("Running startup migration: fixJoeEmailInProduction");

    await db.update(staff).set({ email: 'dev-old-joe@themediaoptimizers.com' }).where(eq(staff.id, joeOldDevId));

    await db.update(staff).set({ email: correctEmail }).where(eq(staff.id, joeActiveId));

    await db.update(staffLinkedEmails).set({ email: correctEmail }).where(eq(staffLinkedEmails.staffId, joeActiveId));

    await db.delete(staffLinkedEmails).where(eq(staffLinkedEmails.staffId, joeOldDevId));

    await db.update(staff).set({ replitAuthSub: null }).where(eq(staff.id, joeOldDevId));

    log("✅ Joe's email fixed: joe@boostmode.com → joe@themediaoptimizers.com");
  } catch (error) {
    log(`⚠️ fixJoeEmailInProduction error: ${error}`);
  }
}

async function runStartupMigrations() {
  log("Starting background migrations...");
  try {
    await fixJoeEmailInProduction();
    await ensureClientBriefColumns();
    await ensureQuotesProposalColumns();
    await ensureQuotesCostBreakdownColumns();
    await ensureLeadProjectedCloseDate();
    await ensureTicketExternalSubmissionColumns();
    await ensureFormsTablesExist();
    await initializeCoreClientBriefSections();
    await initializeDefaultAutomationTriggers();
    await initializeDefaultAutomationActions();
    await initializeDefaultCalendars();
    await generateAnniversaryAndBirthdayEvents();
    await initializeDefaultTeamPositions();
    await initializeDefaultExpenseReportFormFields();
    await initializeHRTeamWidgets();
    await initializeCalendarAppointmentWidgets();
    await initializeActivityAlertsWidgets();
    await initializeDefaultProgressionStatuses();
    await initializeDefaultTimeOffTypes();
    await syncStaffRolesToUserRoles();
    await syncTaskTagsToSettingsTags();
    await seedIntakeDescriptionTemplates();
    await ensureTaskCommentsClientPortalColumn();
    await ensurePxMeetingsObjectivesColumn();
    await ensureScheduledHiredEmailsTable();
    await ensureOnboardingWeekColumns();
    log("✅ All startup migrations completed successfully");
  } catch (error) {
    log(`⚠️ Startup migrations encountered an error: ${error}`);
    // Don't crash - migrations are non-blocking
  }
}

async function setupFullApp(server: any) {
  try {
    await setupAuth(app);
    log("✅ Replit Auth initialized");
    
    setupGoogleCalendar(app);
    log("✅ Google Calendar OAuth routes initialized");
    
    await registerRoutes(app, server);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const { startScheduledEmailProcessor } = await import("./services/hiredNotificationService");
    startScheduledEmailProcessor();
    log("✅ Scheduled email processor started");

    appFullyLoaded = true;
    log("✅ All routes and middleware configured");

    runStartupMigrations().then(() => {
      import('./googleCalendarBackgroundSync').then(({ startBackgroundSync }) => {
        startBackgroundSync();
        log("✅ Google Calendar background sync started");
      }).catch(err => {
        log(`⚠️ Failed to start background calendar sync: ${err.message}`);
      });

      import('./weeklyHoursCheckService').then(({ startWeeklyHoursCheck }) => {
        startWeeklyHoursCheck();
        log("✅ Weekly hours check service started");
      }).catch(err => {
        log(`⚠️ Failed to start weekly hours check service: ${err.message}`);
      });

      import('./longRunningTimerService').then(({ startLongRunningTimerCheck }) => {
        startLongRunningTimerCheck();
        log("✅ Long-running timer alert service started");
      }).catch(err => {
        log(`⚠️ Failed to start long-running timer alert service: ${err.message}`);
      });

      import('./proposalReminderService').then(({ startProposalReminderService }) => {
        startProposalReminderService();
        log("✅ Proposal reminder service started");
      }).catch(err => {
        log(`⚠️ Failed to start proposal reminder service: ${err.message}`);
      });

      import('./recurringTaskService').then(({ startRecurringTaskService }) => {
        startRecurringTaskService();
        log("✅ Recurring task generation service started");
      }).catch(err => {
        log(`⚠️ Failed to start recurring task generation service: ${err.message}`);
      });

      import('./services/onboardingNotificationService').then(({ startOnboardingNotificationService }) => {
        startOnboardingNotificationService();
        log("✅ Onboarding notification service started");
      }).catch(err => {
        log(`⚠️ Failed to start onboarding notification service: ${err.message}`);
      });
    });
  } catch (err: any) {
    log(`❌ Error during app initialization: ${err.message}`);
    console.error(err);
  }
}

export function getApp() {
  return app;
}

export async function initializeApp(existingServer?: any) {
  const server = existingServer || (await (async () => {
    const port = parseInt(process.env.PORT || '5000', 10);
    const { createServer } = await import("http");
    const s = createServer(app);
    await new Promise<void>((resolve) => {
      s.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
        log(`serving on port ${port}`);
        resolve();
      });
    });
    return s;
  })());
  
  log("✅ Server listening - health checks active");
  
  await setupFullApp(server);
}

// Startup logic:
// - PROD_ENTRY set: prodEntry.ts is the entry point, it will call initializeApp(server)
// - Otherwise: this file is the entry point (dev or direct production), auto-start
if (!process.env.PROD_ENTRY) {
  initializeApp();
}

// Seed description templates for task intake sections
async function seedIntakeDescriptionTemplates() {
  log("Running startup migration: seedIntakeDescriptionTemplates");
  try {
    const { sectionDescriptionTemplates } = await import("./seed-description-templates");
    const { taskIntakeSections } = await import("@shared/schema");
    
    for (const [sectionName, template] of Object.entries(sectionDescriptionTemplates)) {
      await db.update(taskIntakeSections)
        .set({ descriptionTemplate: template, updatedAt: new Date() })
        .where(eq(taskIntakeSections.sectionName, sectionName));
    }
    log("Task intake description templates seeded successfully");
  } catch (error) {
    log(`Error seeding intake description templates: ${error}`);
  }
}
