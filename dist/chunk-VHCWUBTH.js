import {
  db
} from "./chunk-KPQ6KEVY.js";
import {
  activities,
  appointments,
  auditLogs,
  authUsers,
  automationActions,
  automationTriggers,
  calendarAppointments,
  calendarEvents,
  calendars,
  campaigns,
  clientBriefSections,
  clientBriefValues,
  clientBundles,
  clientDocuments,
  clientHealthScores,
  clientNotes,
  clientPortalUsers,
  clientProducts,
  clientTasks,
  clientTeamAssignments,
  clientTransactions,
  clients,
  commentFiles,
  customFieldFileUploads,
  customFieldFolders,
  customFields,
  dashboardWidgets,
  dashboards,
  deals,
  departments,
  emailIntegrations,
  emailTemplates,
  eventTimeEntries,
  expenseReportSubmissions,
  goHighLevelIntegration,
  imageAnnotations,
  invoices,
  jobApplications,
  knowledgeBaseArticles,
  knowledgeBaseComments,
  leadNoteTemplates,
  leadPipelineStages,
  leadSources,
  leads,
  newHireOnboardingSubmissions,
  notes,
  notificationSettings,
  notifications,
  orgChartNodeAssignments,
  orgChartNodes,
  orgChartStructures,
  permissions,
  positionKpis,
  positions,
  products,
  pxMeetingAttendees,
  pxMeetings,
  quotes,
  roles,
  salesSettings,
  salesTargets,
  scheduledEmails,
  smartLists,
  smsIntegrations,
  smsTemplates,
  socialMediaAccounts,
  socialMediaPosts,
  socialMediaTemplates,
  staff,
  surveyFields,
  surveyFolders,
  surveyLogicRules,
  surveySlides,
  surveySubmissionAnswers,
  surveySubmissions,
  surveys,
  tags,
  taskAttachments,
  taskCategories,
  taskComments,
  taskHistory,
  tasks,
  teamPositions,
  templateFolders,
  timeOffRequests,
  timeOffTypes,
  trainingCourses,
  trainingEnrollments,
  userDashboardWidgets,
  userRoles,
  userViewPreferences,
  workflowExecutions,
  workflowTemplates,
  workflows
} from "./chunk-VCTCMHMP.js";

// server/storage.ts
import { randomUUID } from "crypto";
import { eq, sql, asc, desc, and, or, max, isNull, inArray, isNotNull, ne } from "drizzle-orm";
var MemStorage = class {
  clients = /* @__PURE__ */ new Map();
  campaigns = /* @__PURE__ */ new Map();
  leads = /* @__PURE__ */ new Map();
  leadSources = /* @__PURE__ */ new Map();
  tasks = /* @__PURE__ */ new Map();
  invoices = /* @__PURE__ */ new Map();
  socialMediaAccounts = /* @__PURE__ */ new Map();
  socialMediaPosts = /* @__PURE__ */ new Map();
  socialMediaTemplates = /* @__PURE__ */ new Map();
  socialMediaAnalytics = /* @__PURE__ */ new Map();
  templateFolders = /* @__PURE__ */ new Map();
  emailTemplates = /* @__PURE__ */ new Map();
  smsTemplates = /* @__PURE__ */ new Map();
  scheduledEmails = /* @__PURE__ */ new Map();
  customFields = /* @__PURE__ */ new Map();
  customFieldFolders = /* @__PURE__ */ new Map();
  workflows = /* @__PURE__ */ new Map();
  workflowExecutions = /* @__PURE__ */ new Map();
  workflowTemplates = /* @__PURE__ */ new Map();
  taskCategories = /* @__PURE__ */ new Map();
  taskTemplates = /* @__PURE__ */ new Map();
  enhancedTasks = /* @__PURE__ */ new Map();
  taskHistory = /* @__PURE__ */ new Map();
  automationActions = /* @__PURE__ */ new Map();
  notifications = /* @__PURE__ */ new Map();
  auditLogs = /* @__PURE__ */ new Map();
  templateTasks = /* @__PURE__ */ new Map();
  authUsers = /* @__PURE__ */ new Map();
  emailIntegrations = /* @__PURE__ */ new Map();
  constructor() {
    this.addSampleData();
    this.initializeWorkflowTemplates();
    this.initializeAutomationElements();
    this.initializeTemplateFoldersAndTemplates();
    this.initializeCustomFields();
  }
  addSampleData() {
    const sampleClient1 = {
      id: "client-1",
      name: "Sarah Johnson",
      email: "sarah@techstartup.com",
      phone: "14354569857",
      company: "TechStartup Inc",
      position: "CEO",
      status: "active",
      contactType: "client",
      contactSource: "referral",
      address: "123 Main Street",
      address2: "Suite 100",
      city: "Austin",
      state: "Texas",
      zipCode: "78701",
      website: "https://techstartup.com",
      notes: "Very interested in our digital marketing services. Follow up weekly.",
      tags: ["high-priority", "tech"],
      clientVertical: "Technology",
      contactOwner: "user-1",
      profileImage: null,
      mrr: "5000.00",
      invoicingContact: "Sarah Johnson",
      invoicingEmail: "billing@techstartup.com",
      paymentTerms: "net_30",
      upsideBonus: "10.00",
      clientBrief: "https://drive.google.com/client-brief-1",
      growthOsDashboard: "https://dashboard.growthos.com/client1",
      storyBrand: null,
      styleGuide: "https://brand.techstartup.com/style-guide",
      googleDriveFolder: "https://drive.google.com/folders/client1",
      testingLog: null,
      cornerstoneBlueprint: null,
      customGpt: null,
      dndAll: false,
      dndEmail: false,
      dndSms: false,
      dndCalls: false,
      groupId: null,
      customFieldValues: null,
      followers: null,
      lastActivity: /* @__PURE__ */ new Date("2024-01-15T10:30:00Z"),
      createdAt: /* @__PURE__ */ new Date("2024-01-01T09:00:00Z")
    };
    const sampleClient2 = {
      id: "client-2",
      name: "Michael Brown",
      email: "michael@healthcorp.com",
      phone: "12125551234",
      company: "HealthCorp Solutions",
      position: "Marketing Director",
      status: "active",
      contactType: "client",
      contactSource: "website",
      address: "456 Business Ave",
      address2: null,
      city: "New York",
      state: "NY",
      zipCode: "10001",
      website: "https://healthcorp.com",
      notes: "Large healthcare client, needs compliance-focused campaigns.",
      tags: ["healthcare", "enterprise"],
      clientVertical: "Healthcare",
      contactOwner: "user-2",
      profileImage: null,
      mrr: "12000.00",
      invoicingContact: "Finance Department",
      invoicingEmail: "finance@healthcorp.com",
      paymentTerms: "net_15",
      upsideBonus: "15.00",
      clientBrief: "https://drive.google.com/client-brief-2",
      growthOsDashboard: null,
      storyBrand: "https://storybrand.com/healthcorp",
      styleGuide: null,
      googleDriveFolder: "https://drive.google.com/folders/client2",
      testingLog: "https://testing.healthcorp.com/log",
      cornerstoneBlueprint: null,
      customGpt: "https://chat.openai.com/g/healthcorp-assistant",
      dndAll: false,
      dndEmail: true,
      dndSms: false,
      dndCalls: false,
      groupId: null,
      customFieldValues: null,
      followers: null,
      lastActivity: /* @__PURE__ */ new Date("2024-01-14T15:45:00Z"),
      createdAt: /* @__PURE__ */ new Date("2023-12-15T14:20:00Z")
    };
    this.clients.set(sampleClient1.id, sampleClient1);
    this.clients.set(sampleClient2.id, sampleClient2);
  }
  initializeWorkflowTemplates() {
    const templates = [];
    templates.forEach((template) => {
      this.workflowTemplates.set(template.id, template);
    });
  }
  initializeAutomationElements() {
    const triggers = [
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
          },
          company: {
            type: "string",
            label: "Company Name"
          },
          city: {
            type: "string",
            label: "City"
          },
          state: {
            type: "string",
            label: "State/Province"
          },
          country: {
            type: "string",
            label: "Country"
          }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
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
          },
          value: {
            type: "number",
            label: "Deal Value ($)",
            placeholder: "e.g., 5000"
          },
          probability: {
            type: "number",
            label: "Probability (%)",
            min: 0,
            max: 100,
            placeholder: "e.g., 75"
          },
          assignedTo: {
            type: "staff_select",
            label: "Assigned Staff Member"
          }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
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
        createdAt: /* @__PURE__ */ new Date()
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
        createdAt: /* @__PURE__ */ new Date()
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
          },
          contact_source: {
            type: "string",
            options: ["website", "referral", "cold_outreach", "social_media", "paid_ads"],
            label: "Contact Source (Optional)"
          }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
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
          tag: {
            type: "tag_select",
            label: "Has Tag",
            required: false
          },
          booking_source: {
            type: "string",
            label: "Booking Source",
            options: ["external_calendar_link", "manually", "api", "sync_google", "sync_microsoft"],
            required: false
          },
          filters: {
            type: "filters",
            label: "Additional Filters",
            description: "Add custom conditions to further refine when this trigger fires"
          }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "trigger-appointment-status-changed",
        name: "Appointment Status Changed",
        type: "appointment_status_changed",
        description: "Triggers when an appointment status changes from one state to another",
        category: "calendar_management",
        configSchema: {
          calendar_id: {
            type: "calendar_select",
            label: "Calendar",
            required: false
          },
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
          },
          filters: {
            type: "filters",
            label: "Additional Filters",
            description: "Add custom conditions to further refine when this trigger fires"
          }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      }
    ];
    const actions = [
      // 📧 Communication Actions
      {
        id: "action-1",
        name: "Send Email",
        type: "send_email",
        description: "Send an email using a template with merge tags",
        category: "communication",
        configSchema: {
          template_id: { type: "string", required: true },
          subject: { type: "string" },
          to_email: { type: "string" },
          delay: { type: "number", default: 0 }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-2",
        name: "Send SMS",
        type: "send_sms",
        description: "Send an SMS message using templates",
        category: "communication",
        configSchema: {
          template_id: { type: "string" },
          message: { type: "string", required: true },
          to_phone: { type: "string" },
          delay: { type: "number", default: 0 }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-3",
        name: "Create Internal Notification",
        type: "create_internal_notification",
        description: "Send emails, SMS, or notifications to users",
        category: "communication",
        configSchema: {
          notificationType: {
            type: "string",
            options: ["email", "sms", "notification"],
            required: true,
            label: "Notification Type"
          },
          // Email configuration
          emailTemplateId: {
            type: "string",
            label: "Email Template",
            dependsOn: { field: "notificationType", value: "email" }
          },
          // SMS configuration
          smsTemplateId: {
            type: "string",
            label: "SMS Template",
            dependsOn: { field: "notificationType", value: "sms" }
          },
          // Notification configuration
          title: {
            type: "string",
            label: "Notification Title",
            dependsOn: { field: "notificationType", value: "notification" }
          },
          message: {
            type: "string",
            label: "Message",
            dependsOn: { field: "notificationType", value: "notification" }
          },
          // User targeting (applies to all types)
          userType: {
            type: "string",
            options: ["all_users", "assigned_user", "particular_user", "custom_email", "custom_number"],
            required: true,
            label: "Send To"
          },
          // For particular user selection
          userId: {
            type: "string",
            label: "Select User",
            dependsOn: { field: "userType", value: "particular_user" }
          },
          // For custom email
          customEmail: {
            type: "string",
            label: "Custom Email",
            dependsOn: { field: "userType", value: "custom_email" }
          },
          // For custom number
          customNumber: {
            type: "string",
            label: "Custom Number",
            dependsOn: { field: "userType", value: "custom_number" }
          }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-4",
        name: "Send Slack Message",
        type: "send_slack_message",
        description: "Send a message to Slack channel or user",
        category: "communication",
        configSchema: {
          channel: { type: "string", label: "Channel ID", placeholder: "Leave empty for default channel" },
          message: { type: "string", required: true, label: "Message", multiline: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-slack-dm",
        name: "Send Slack DM",
        type: "send_slack_dm",
        description: "Send a direct message to a Slack user",
        category: "communication",
        configSchema: {
          userId: { type: "string", label: "Slack User ID", placeholder: "User ID or leave empty to use email" },
          email: { type: "string", label: "User Email", placeholder: "Look up user by email if no User ID" },
          message: { type: "string", required: true, label: "Message", multiline: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-slack-reaction",
        name: "Add Slack Reaction",
        type: "add_slack_reaction",
        description: "Add an emoji reaction to a Slack message",
        category: "communication",
        configSchema: {
          channel: { type: "string", required: true, label: "Channel ID" },
          timestamp: { type: "string", required: true, label: "Message Timestamp", placeholder: "Message ts from trigger" },
          emoji: { type: "string", required: true, label: "Emoji", placeholder: "thumbsup, heart, rocket, etc." }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-slack-channel",
        name: "Create Slack Channel",
        type: "create_slack_channel",
        description: "Create a new Slack channel",
        category: "communication",
        configSchema: {
          name: { type: "string", required: true, label: "Channel Name", placeholder: "project-{{trigger.name}}" },
          description: { type: "string", label: "Channel Description" },
          isPrivate: { type: "boolean", label: "Private Channel", default: false },
          inviteUsers: { type: "array", items: { type: "string" }, label: "Invite User IDs" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-slack-topic",
        name: "Set Slack Channel Topic",
        type: "set_slack_topic",
        description: "Set or update a Slack channel topic",
        category: "communication",
        configSchema: {
          channel: { type: "string", required: true, label: "Channel ID" },
          topic: { type: "string", required: true, label: "Topic", multiline: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-slack-reminder",
        name: "Create Slack Reminder",
        type: "create_slack_reminder",
        description: "Create a reminder in Slack",
        category: "communication",
        configSchema: {
          text: { type: "string", required: true, label: "Reminder Text" },
          time: { type: "string", required: true, label: "Time", placeholder: "in 1 hour, tomorrow at 9am, 1234567890" },
          user: { type: "string", label: "User ID", placeholder: "Leave empty for yourself" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-5",
        name: "Log Communication",
        type: "log_communication",
        description: "Track outreach attempts and communication history",
        category: "communication",
        configSchema: {
          type: { type: "string", options: ["email", "sms", "call", "meeting"], required: true },
          subject: { type: "string", required: true },
          notes: { type: "string" },
          outcome: { type: "string", options: ["sent", "delivered", "opened", "replied"] }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      // 📋 Data Management Actions
      {
        id: "action-6",
        name: "Create Lead",
        type: "create_lead",
        description: "Generate new leads with specified data",
        category: "data_management",
        configSchema: {
          name: { type: "string", required: true },
          email: { type: "string", required: true },
          phone: { type: "string" },
          company: { type: "string" },
          source: { type: "string", options: ["website", "referral", "social_media", "advertising", "cold_outreach"] },
          value: { type: "number" },
          assigned_to: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-7",
        name: "Create Task",
        type: "create_task",
        description: "Generate tasks including sub-tasks with assignments",
        category: "data_management",
        configSchema: {
          title: { type: "string", required: true },
          description: { type: "string" },
          assigned_to: { type: "string", required: true },
          priority: { type: "string", options: ["urgent", "high", "normal", "low"], default: "normal" },
          due_date: { type: "string" },
          client_id: { type: "string" },
          // project_id removed - projects no longer exist,
          parent_task_id: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      // Create Project automation removed - projects no longer exist
      {
        id: "action-9",
        name: "Update Client Fields",
        type: "update_client_fields",
        description: "Modify client information and data",
        category: "data_management",
        configSchema: {
          client_id: { type: "string", required: true },
          fields: { type: "object", required: true },
          merge_mode: { type: "string", options: ["replace", "merge"], default: "merge" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-10",
        name: "Update Lead Stage",
        type: "update_lead_stage",
        description: "Move leads through pipeline stages",
        category: "data_management",
        configSchema: {
          lead_id: { type: "string", required: true },
          stage_id: { type: "string", required: true },
          probability: { type: "number", min: 0, max: 100 },
          notes: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      // Update Project Status automation removed - projects no longer exist
      {
        id: "action-12",
        name: "Add Client Tags",
        type: "add_client_tags",
        description: "Organize contacts with tagging system",
        category: "data_management",
        configSchema: {
          client_id: { type: "string", required: true },
          tags: { type: "array", items: { type: "string" }, required: true },
          replace_existing: { type: "boolean", default: false }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      // 👥 Assignment Actions
      {
        id: "action-14",
        name: "Assign Contact Owner",
        type: "assign_contact_owner",
        description: "Set primary contact responsible person with support for multiple users and round-robin assignment",
        category: "assignment",
        configSchema: {
          contact_id: { type: "string", required: true },
          assignment_type: { type: "string", options: ["single", "round_robin"], default: "single", required: true },
          staff_ids: { type: "array", items: { type: "string" }, required: true },
          split_type: { type: "string", options: ["equally", "unevenly"], default: "equally" },
          staff_weights: { type: "array", items: { type: "object" } },
          notify_assignee: { type: "boolean", default: true },
          reassign_if_assigned: { type: "boolean", default: false },
          transfer_notes: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-15",
        name: "Assign Task to Staff",
        type: "assign_task_to_staff",
        description: "Delegate work to team members",
        category: "assignment",
        configSchema: {
          task_id: { type: "string", required: true },
          staff_id: { type: "string", required: true },
          notify_assignee: { type: "boolean", default: true },
          assignment_notes: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-16",
        name: "Assign Lead to Staff",
        type: "assign_lead_to_staff",
        description: "Distribute leads to sales team members",
        category: "assignment",
        configSchema: {
          lead_id: { type: "string", required: true },
          staff_id: { type: "string", required: true },
          notify_assignee: { type: "boolean", default: true },
          assignment_type: { type: "string", options: ["primary", "secondary"], default: "primary" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-17",
        name: "Add Team Role Assignment",
        type: "add_team_role_assignment",
        description: "Assign specialized positions to clients",
        category: "assignment",
        configSchema: {
          client_id: { type: "string", required: true },
          staff_id: { type: "string", required: true },
          position: { type: "string", options: ["setter", "bdr", "account_manager", "media_buyer", "cro_specialist", "automation_specialist", "show_rate_specialist", "data_specialist", "seo_specialist", "social_media_specialist"], required: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      // Reassign Project Manager automation removed - projects no longer exist
      {
        id: "action-19",
        name: "Remove Staff Assignment",
        type: "remove_staff_assignment",
        description: "Clear assignments from team members",
        category: "assignment",
        configSchema: {
          entity_type: { type: "string", options: ["client", "lead", "task"], required: true },
          entity_id: { type: "string", required: true },
          staff_id: { type: "string", required: true },
          notify_staff: { type: "boolean", default: true },
          removal_reason: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      // 📊 Status & Progress Actions
      {
        id: "action-20",
        name: "Mark Task Complete",
        type: "mark_task_complete",
        description: "Auto-complete tasks and sub-tasks",
        category: "status_progress",
        configSchema: {
          task_id: { type: "string", required: true },
          completion_notes: { type: "string" },
          notify_assignee: { type: "boolean", default: true },
          auto_complete_subtasks: { type: "boolean", default: false }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-22",
        name: "Change Client Status",
        type: "change_client_status",
        description: "Update client status (active/inactive/pending)",
        category: "status_progress",
        configSchema: {
          client_id: { type: "string", required: true },
          status: { type: "string", options: ["active", "inactive", "pending"], required: true },
          reason: { type: "string" },
          notify_team: { type: "boolean", default: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      // Set Project Priority automation removed - projects no longer exist
      {
        id: "action-25",
        name: "Update Task Priority",
        type: "update_task_priority",
        description: "Change task urgency levels",
        category: "status_progress",
        configSchema: {
          task_id: { type: "string", required: true },
          priority: { type: "string", options: ["urgent", "high", "normal", "low"], required: true },
          reason: { type: "string" },
          notify_assignee: { type: "boolean", default: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      // ⏰ Calendar & Time Actions
      {
        id: "action-26",
        name: "Create Appointment",
        type: "create_appointment",
        description: "Schedule client meetings and appointments",
        category: "calendar_time",
        configSchema: {
          client_id: { type: "string", required: true },
          title: { type: "string", required: true },
          description: { type: "string" },
          start_time: { type: "string", required: true },
          end_time: { type: "string", required: true },
          location: { type: "string" },
          staff_id: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-27",
        name: "Start Timer",
        type: "start_timer",
        description: "Begin time tracking for tasks",
        category: "calendar_time",
        configSchema: {
          task_id: { type: "string", required: true },
          staff_id: { type: "string", required: true },
          description: { type: "string" }
          // project_id removed - projects no longer exist
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-28",
        name: "Stop Timer",
        type: "stop_timer",
        description: "End time tracking sessions",
        category: "calendar_time",
        configSchema: {
          timer_id: { type: "string", required: true },
          completion_notes: { type: "string" },
          billable: { type: "boolean", default: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-29",
        name: "Create Calendar Block",
        type: "create_calendar_block",
        description: "Reserve time slots for specific activities",
        category: "calendar_time",
        configSchema: {
          staff_id: { type: "string", required: true },
          title: { type: "string", required: true },
          start_time: { type: "string", required: true },
          end_time: { type: "string", required: true },
          block_type: { type: "string", options: ["meeting", "focus_time", "admin", "break"], default: "meeting" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-30",
        name: "Send Meeting Reminder",
        type: "send_meeting_reminder",
        description: "Send automated meeting reminders",
        category: "calendar_time",
        configSchema: {
          appointment_id: { type: "string", required: true },
          reminder_time: { type: "number", required: true },
          reminder_type: { type: "string", options: ["email", "sms", "both"], default: "email" },
          custom_message: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-31",
        name: "Reschedule Appointment",
        type: "reschedule_appointment",
        description: "Update meeting times automatically",
        category: "calendar_time",
        configSchema: {
          appointment_id: { type: "string", required: true },
          new_start_time: { type: "string", required: true },
          new_end_time: { type: "string", required: true },
          reason: { type: "string" },
          notify_attendees: { type: "boolean", default: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      // 📁 File & Document Actions
      {
        id: "action-32",
        name: "Upload Document",
        type: "upload_document",
        description: "Attach files to client records",
        category: "file_document",
        configSchema: {
          entity_type: { type: "string", options: ["client", "task"], required: true },
          entity_id: { type: "string", required: true },
          file_url: { type: "string", required: true },
          file_name: { type: "string", required: true },
          description: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-33",
        name: "Generate Invoice",
        type: "generate_invoice",
        description: "Create billing documents automatically",
        category: "file_document",
        configSchema: {
          client_id: { type: "string", required: true },
          // project_id removed - projects no longer exist,
          amount: { type: "number", required: true },
          description: { type: "string", required: true },
          due_date: { type: "string" },
          payment_terms: { type: "string", options: ["due_upon_receipt", "net_7", "net_30"], default: "net_30" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-34",
        name: "Create Document Folder",
        type: "create_document_folder",
        description: "Organize file storage structure",
        category: "file_document",
        configSchema: {
          folder_name: { type: "string", required: true },
          parent_folder_id: { type: "string" },
          entity_type: { type: "string", options: ["client"], required: true },
          entity_id: { type: "string", required: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-35",
        name: "Send Document",
        type: "send_document",
        description: "Email documents as attachments",
        category: "file_document",
        configSchema: {
          document_id: { type: "string", required: true },
          recipient_email: { type: "string", required: true },
          subject: { type: "string", required: true },
          message: { type: "string" },
          password_protect: { type: "boolean", default: false }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-36",
        name: "Archive Files",
        type: "archive_files",
        description: "Move files to archive storage",
        category: "file_document",
        configSchema: {
          file_ids: { type: "array", items: { type: "string" }, required: true },
          archive_reason: { type: "string" },
          notify_owner: { type: "boolean", default: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      // 🔔 Notification & Alert Actions
      {
        id: "action-37",
        name: "Create Follow-up Reminder",
        type: "create_followup_reminder",
        description: "Set future reminders for follow-up",
        category: "notification_alert",
        configSchema: {
          entity_type: { type: "string", options: ["client", "lead", "project"], required: true },
          entity_id: { type: "string", required: true },
          reminder_date: { type: "string", required: true },
          reminder_text: { type: "string", required: true },
          assigned_to: { type: "string", required: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-38",
        name: "Send Manager Alert",
        type: "send_manager_alert",
        description: "Escalation notifications to managers",
        category: "notification_alert",
        configSchema: {
          manager_id: { type: "string", required: true },
          alert_type: { type: "string", options: ["escalation", "approval_needed", "deadline_missed", "high_value"], required: true },
          subject: { type: "string", required: true },
          message: { type: "string", required: true },
          priority: { type: "string", options: ["low", "medium", "high", "urgent"], default: "medium" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-39",
        name: "Log Activity",
        type: "log_activity",
        description: "Create audit trail entries",
        category: "notification_alert",
        configSchema: {
          entity_type: { type: "string", required: true },
          entity_id: { type: "string", required: true },
          activity_type: { type: "string", required: true },
          description: { type: "string", required: true },
          metadata: { type: "object" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-40",
        name: "Create System Alert",
        type: "create_system_alert",
        description: "Important system-wide notifications",
        category: "notification_alert",
        configSchema: {
          alert_level: { type: "string", options: ["info", "warning", "error", "critical"], required: true },
          title: { type: "string", required: true },
          message: { type: "string", required: true },
          target_roles: { type: "array", items: { type: "string" } },
          expires_at: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-41",
        name: "Send Birthday Reminder",
        type: "send_birthday_reminder",
        description: "Automated birthday notifications",
        category: "notification_alert",
        configSchema: {
          recipient_type: { type: "string", options: ["client", "staff"], required: true },
          recipient_id: { type: "string", required: true },
          reminder_template: { type: "string" },
          send_days_before: { type: "number", default: 0 },
          notification_method: { type: "string", options: ["email", "sms", "internal"], default: "email" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-42",
        name: "Overdue Task Alert",
        type: "overdue_task_alert",
        description: "Alert for missed deadlines",
        category: "notification_alert",
        configSchema: {
          task_id: { type: "string", required: true },
          alert_recipient: { type: "string", options: ["assignee", "manager", "both"], default: "assignee" },
          escalation_hours: { type: "number", default: 24 },
          alert_message: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      // 🔧 Internal Control Actions
      {
        id: "action-43",
        name: "Split",
        type: "split",
        description: "Conditional branching - route workflow based on criteria",
        category: "internal",
        configSchema: {
          conditions: {
            type: "array",
            items: {
              field: { type: "string", required: true },
              operator: { type: "string", options: ["equals", "not_equals", "contains", "not_contains", "greater_than", "less_than", "is_empty", "is_not_empty"], required: true },
              value: { type: "string" },
              branch_action_id: { type: "string", required: true }
            },
            required: true
          },
          default_branch_action_id: { type: "string", required: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-44",
        name: "Wait",
        type: "wait",
        description: "Pause workflow execution for time delays or events",
        category: "internal",
        configSchema: {
          wait_type: { type: "string", options: ["time_delay", "event_time"], required: true },
          // Time delay options
          delay_amount: { type: "number" },
          delay_unit: { type: "string", options: ["minutes", "hours", "days"] },
          // Event time options  
          event_timing: { type: "string", options: ["before", "after", "exact"] },
          time_offset_amount: { type: "number" },
          time_offset_unit: { type: "string", options: ["minutes", "hours", "days", "months"] },
          date_field: { type: "string" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-45",
        name: "Go To",
        type: "go_to",
        description: "Jump to another action in the workflow",
        category: "internal",
        configSchema: {
          target_action_id: { type: "string", required: true },
          condition: {
            type: "object",
            field: { type: "string" },
            operator: { type: "string", options: ["always", "equals", "not_equals", "contains", "greater_than", "less_than"] },
            value: { type: "string" }
          }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-46",
        name: "Date/Time Formatter",
        type: "date_time_formatter",
        description: "Transform date formats and date/time values",
        category: "internal",
        configSchema: {
          source_field: { type: "string", required: true },
          from_format: { type: "string", options: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "MM-DD-YYYY", "DD-MM-YYYY", "MMM DD, YYYY", "MMMM DD, YYYY", "DD MMM YYYY", "timestamp", "iso8601"], required: true },
          to_format: { type: "string", options: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "MM-DD-YYYY", "DD-MM-YYYY", "MMM DD, YYYY", "MMMM DD, YYYY", "DD MMM YYYY", "MM/DD/YYYY HH:mm", "YYYY-MM-DD HH:mm:ss", "timestamp", "iso8601"], required: true },
          target_field: { type: "string", required: true },
          timezone: { type: "string", default: "UTC" }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-47",
        name: "Number Formatter",
        type: "number_formatter",
        description: "Format numbers, phone numbers, and currency values",
        category: "internal",
        configSchema: {
          source_field: { type: "string", required: true },
          format_type: { type: "string", options: ["text_to_number", "format_number", "format_phone", "format_currency"], required: true },
          // Number formatting options
          decimal_places: { type: "number", default: 2 },
          thousands_separator: { type: "string", options: [",", ".", " ", ""], default: "," },
          decimal_separator: { type: "string", options: [".", ","], default: "." },
          // Phone formatting options
          phone_format: { type: "string", options: ["(XXX) XXX-XXXX", "XXX-XXX-XXXX", "+1 XXX XXX XXXX", "XXX.XXX.XXXX"], default: "(XXX) XXX-XXXX" },
          // Currency formatting options
          currency_code: { type: "string", options: ["USD", "EUR", "GBP", "CAD", "AUD"], default: "USD" },
          currency_symbol_position: { type: "string", options: ["before", "after"], default: "before" },
          target_field: { type: "string", required: true }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-48",
        name: "Update Client Tasks Status",
        type: "update_client_tasks_status",
        description: "Bulk update status of all tasks for a specific client with optional filters",
        category: "data_management",
        configSchema: {
          target_status: {
            type: "string",
            required: true,
            options: ["To Do", "In Progress", "On Hold", "Completed", "Cancelled"]
          },
          include_statuses: {
            type: "array",
            description: "Only update tasks with these statuses (empty = all tasks)"
          },
          exclude_statuses: {
            type: "array",
            description: "Skip tasks with these statuses"
          },
          assigned_to: {
            type: "string",
            description: "Only update tasks assigned to this staff member (optional)"
          },
          priorities: {
            type: "array",
            description: "Only update tasks with these priorities (optional)"
          }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "action-49",
        name: "Notify Task Owners",
        type: "notify_task_owners",
        description: "Send notifications to all staff members who own tasks affected by the previous action",
        category: "communication",
        configSchema: {
          notification_type: {
            type: "string",
            required: true,
            options: ["email", "sms"],
            default: "email"
          },
          template_id: {
            type: "string",
            required: true,
            description: "Email or SMS template to use for notifications"
          },
          subject: {
            type: "string",
            description: "Email subject line (for email notifications only)"
          }
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date()
      }
    ];
    actions.forEach((action) => {
      this.automationActions.set(action.id, action);
    });
  }
  initializeTemplateFoldersAndTemplates() {
    const folders = [
      {
        id: "folder-1",
        name: "Welcome Sequences",
        description: "Email templates for welcoming new leads and customers",
        type: "email",
        parentId: null,
        order: 1,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "folder-2",
        name: "Follow-up Emails",
        description: "Templates for following up with prospects and clients",
        type: "email",
        parentId: null,
        order: 2,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "folder-3",
        name: "SMS Campaigns",
        description: "SMS message templates for quick communication",
        type: "sms",
        parentId: null,
        order: 3,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "folder-4",
        name: "Onboarding",
        description: "Customer onboarding email sequences",
        type: "email",
        parentId: null,
        order: 4,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    folders.forEach((folder) => {
      this.templateFolders.set(folder.id, folder);
    });
    const emailTemplates2 = [
      {
        id: "email-1",
        name: "Welcome Email - New Lead",
        subject: "Welcome! Here's what happens next...",
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #46a1a0;">Welcome to Our Community!</h1>
            <p>Hi {{first_name}},</p>
            <p>Thank you for your interest in our services. We're excited to help you achieve your business goals.</p>
            <p>Here's what you can expect next:</p>
            <ul>
              <li>A personalized consultation within 24 hours</li>
              <li>Custom strategy recommendations</li>
              <li>Access to our exclusive resources</li>
            </ul>
            <p>If you have any questions, don't hesitate to reach out!</p>
            <p>Best regards,<br>The Marketing Team</p>
          </div>
        `,
        plainTextContent: "Welcome! Thank you for your interest in our services...",
        previewText: "Welcome to our community - here's what happens next",
        folderId: "folder-1",
        tags: ["welcome", "new_lead", "onboarding"],
        isPublic: false,
        usageCount: 24,
        lastUsed: /* @__PURE__ */ new Date("2024-01-15"),
        createdBy: "user-1",
        createdAt: /* @__PURE__ */ new Date("2024-01-01"),
        updatedAt: /* @__PURE__ */ new Date("2024-01-15")
      },
      {
        id: "email-2",
        name: "Follow-up - Check In",
        subject: "How are things going, {{first_name}}?",
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #46a1a0;">Quick Check-in</h2>
            <p>Hi {{first_name}},</p>
            <p>I wanted to follow up on our recent conversation about {{topic}}.</p>
            <p>How are things progressing on your end? Do you have any questions or need additional support?</p>
            <p>I'm here to help make sure you're getting the most value from our partnership.</p>
            <p>Feel free to reply to this email or schedule a quick call: {{calendar_link}}</p>
            <p>Best,<br>{{sender_name}}</p>
          </div>
        `,
        plainTextContent: "Quick follow-up to see how things are going...",
        previewText: "Checking in to see how we can help",
        folderId: "folder-2",
        tags: ["follow_up", "check_in", "customer_success"],
        isPublic: false,
        usageCount: 18,
        lastUsed: /* @__PURE__ */ new Date("2024-01-12"),
        createdBy: "user-1",
        createdAt: /* @__PURE__ */ new Date("2024-01-01"),
        updatedAt: /* @__PURE__ */ new Date("2024-01-12")
      },
      {
        id: "email-3",
        name: "Onboarding - Step 1",
        subject: "Let's get you set up! Your first steps",
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #46a1a0;">Welcome Aboard, {{first_name}}!</h1>
            <p>We're thrilled to have you as a new customer!</p>
            <p>To ensure you get the most out of our platform, here are your next steps:</p>
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>Step 1: Complete Your Profile</h3>
              <p>Add your company information and preferences to personalize your experience.</p>
              <a href="{{profile_link}}" style="background: #46a1a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Profile</a>
            </div>
            <p>Need help? Our support team is standing by: {{support_email}}</p>
            <p>Cheers,<br>The Onboarding Team</p>
          </div>
        `,
        plainTextContent: "Welcome aboard! Here are your first steps to get started...",
        previewText: "Let's get you set up with your first steps",
        folderId: "folder-4",
        tags: ["onboarding", "new_customer", "setup"],
        isPublic: false,
        usageCount: 31,
        lastUsed: /* @__PURE__ */ new Date("2024-01-16"),
        createdBy: "user-1",
        createdAt: /* @__PURE__ */ new Date("2024-01-01"),
        updatedAt: /* @__PURE__ */ new Date("2024-01-16")
      }
    ];
    emailTemplates2.forEach((template) => {
      this.emailTemplates.set(template.id, template);
    });
    const smsTemplates2 = [
      {
        id: "sms-1",
        name: "Welcome SMS",
        content: "Hi {{first_name}}! Welcome to {{company_name}}. We're excited to work with you. Reply STOP to opt out.",
        folderId: "folder-3",
        tags: ["welcome", "new_customer"],
        isPublic: false,
        usageCount: 12,
        lastUsed: /* @__PURE__ */ new Date("2024-01-14"),
        createdBy: "user-1",
        createdAt: /* @__PURE__ */ new Date("2024-01-01"),
        updatedAt: /* @__PURE__ */ new Date("2024-01-14")
      },
      {
        id: "sms-2",
        name: "Appointment Reminder",
        content: "Hi {{first_name}}, this is a reminder about your appointment tomorrow at {{time}}. See you then! Reply STOP to opt out.",
        folderId: "folder-3",
        tags: ["reminder", "appointment"],
        isPublic: false,
        usageCount: 8,
        lastUsed: /* @__PURE__ */ new Date("2024-01-13"),
        createdBy: "user-1",
        createdAt: /* @__PURE__ */ new Date("2024-01-01"),
        updatedAt: /* @__PURE__ */ new Date("2024-01-13")
      }
    ];
    smsTemplates2.forEach((template) => {
      this.smsTemplates.set(template.id, template);
    });
  }
  // Clients
  async getClients() {
    return Array.from(this.clients.values());
  }
  async getClientsWithPagination(limit, offset, sortBy, sortOrder) {
    const allClients = Array.from(this.clients.values()).filter((client) => !client.isArchived);
    if (sortBy) {
      allClients.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        if (sortBy === "createdAt") {
          aValue = new Date(aValue || 0);
          bValue = new Date(bValue || 0);
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (sortOrder === "desc") {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });
    }
    return {
      clients: allClients.slice(offset, offset + limit),
      total: allClients.length
    };
  }
  async getClient(id) {
    return this.clients.get(id);
  }
  async createClient(insertClient) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const client = {
      id,
      name: insertClient.name,
      email: insertClient.email,
      phone: insertClient.phone || null,
      company: insertClient.company || null,
      position: insertClient.position || null,
      status: insertClient.status || "active",
      contactType: insertClient.contactType || "client",
      contactSource: insertClient.contactSource || null,
      // Address fields
      address: insertClient.address || null,
      address2: insertClient.address2 || null,
      city: insertClient.city || null,
      state: insertClient.state || null,
      zipCode: insertClient.zipCode || null,
      website: insertClient.website || null,
      notes: insertClient.notes || null,
      tags: insertClient.tags || null,
      clientVertical: insertClient.clientVertical || null,
      contactOwner: insertClient.contactOwner || null,
      profileImage: insertClient.profileImage || null,
      // Billing information
      mrr: insertClient.mrr || null,
      invoicingContact: insertClient.invoicingContact || null,
      invoicingEmail: insertClient.invoicingEmail || null,
      paymentTerms: insertClient.paymentTerms || null,
      upsideBonus: insertClient.upsideBonus || null,
      // Important Resources URLs
      clientBrief: insertClient.clientBrief || null,
      growthOsDashboard: insertClient.growthOsDashboard || null,
      storyBrand: insertClient.storyBrand || null,
      styleGuide: insertClient.styleGuide || null,
      googleDriveFolder: insertClient.googleDriveFolder || null,
      testingLog: insertClient.testingLog || null,
      cornerstoneBlueprint: insertClient.cornerstoneBlueprint || null,
      customGpt: insertClient.customGpt || null,
      // DND settings
      dndAll: insertClient.dndAll || false,
      dndEmail: insertClient.dndEmail || false,
      dndSms: insertClient.dndSms || false,
      dndCalls: insertClient.dndCalls || false,
      groupId: insertClient.groupId || null,
      customFieldValues: insertClient.customFieldValues || null,
      followers: insertClient.followers || null,
      lastActivity: insertClient.lastActivity || null,
      createdAt: now
    };
    this.clients.set(id, client);
    return client;
  }
  async deleteClient(id) {
    return this.clients.delete(id);
  }
  async archiveClient(id) {
    const client = this.clients.get(id);
    if (!client) return void 0;
    const archivedClient = { ...client, isArchived: true };
    this.clients.set(id, archivedClient);
    return archivedClient;
  }
  async reassignClientTasks(fromClientId, toClientId) {
    let movedCount = 0;
    for (const [id, task] of this.tasks) {
      if (task.clientId === fromClientId) {
        this.tasks.set(id, { ...task, clientId: toClientId });
        movedCount++;
      }
    }
    return { movedCount };
  }
  async getClientRelationsCounts(id) {
    const tasksCount = Array.from(this.tasks.values()).filter((task) => task.clientId === id).length;
    const campaignsCount = Array.from(this.campaigns.values()).filter((campaign) => campaign.clientId === id).length;
    const invoicesCount = Array.from(this.invoices.values()).filter((invoice) => invoice.clientId === id).length;
    const healthScoresCount = Array.from(this.clientHealthScores.values()).filter((score) => score.clientId === id).length;
    return {
      tasks: tasksCount,
      campaigns: campaignsCount,
      invoices: invoicesCount,
      healthScores: healthScoresCount
    };
  }
  // Template Task Methods
  async getTemplateTasksByTemplate(templateId) {
    return Array.from(this.templateTasks.values()).filter((task) => task.templateId === templateId).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  async createTemplateTask(insertTask) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const task = {
      id,
      templateId: insertTask.templateId,
      title: insertTask.title,
      description: insertTask.description || null,
      priority: insertTask.priority || "normal",
      estimatedHours: insertTask.estimatedHours || null,
      dayOffset: insertTask.dayOffset || 0,
      dependsOn: insertTask.dependsOn || null,
      assignToRole: insertTask.assignToRole || null,
      order: insertTask.order || 0,
      createdAt: now
    };
    this.templateTasks.set(id, task);
    return task;
  }
  async deleteTemplateTasksByTemplate(templateId) {
    const tasksToDelete = Array.from(this.templateTasks.values()).filter((task) => task.templateId === templateId);
    tasksToDelete.forEach((task) => this.templateTasks.delete(task.id));
  }
  // Campaigns
  async getCampaigns() {
    return Array.from(this.campaigns.values());
  }
  async getCampaign(id) {
    return this.campaigns.get(id);
  }
  async getCampaignsByClient(clientId) {
    return Array.from(this.campaigns.values()).filter((c) => c.clientId === clientId);
  }
  async createCampaign(insertCampaign) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const campaign = {
      id,
      name: insertCampaign.name,
      description: insertCampaign.description || null,
      clientId: insertCampaign.clientId,
      projectId: insertCampaign.projectId || null,
      status: insertCampaign.status || "draft",
      type: insertCampaign.type,
      budget: insertCampaign.budget || null,
      spent: insertCampaign.spent || null,
      impressions: insertCampaign.impressions || null,
      clicks: insertCampaign.clicks || null,
      conversions: insertCampaign.conversions || null,
      startDate: insertCampaign.startDate || null,
      endDate: insertCampaign.endDate || null,
      createdAt: now
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }
  async updateCampaign(id, campaignUpdate) {
    const campaign = this.campaigns.get(id);
    if (!campaign) return void 0;
    const updatedCampaign = { ...campaign, ...campaignUpdate };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }
  async deleteCampaign(id) {
    return this.campaigns.delete(id);
  }
  // Leads
  async getLeads() {
    return Array.from(this.leads.values());
  }
  async getLead(id) {
    return this.leads.get(id);
  }
  async createLead(insertLead) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const lead = {
      id,
      name: insertLead.name,
      email: insertLead.email,
      phone: insertLead.phone || null,
      company: insertLead.company || null,
      source: insertLead.source || null,
      status: insertLead.status || "new",
      value: insertLead.value || null,
      probability: insertLead.probability || null,
      notes: insertLead.notes || null,
      assignedTo: insertLead.assignedTo || null,
      lastContactDate: insertLead.lastContactDate || null,
      createdAt: now
    };
    this.leads.set(id, lead);
    return lead;
  }
  async updateLead(id, leadUpdate) {
    const lead = this.leads.get(id);
    if (!lead) return void 0;
    const updatedLead = { ...lead, ...leadUpdate };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }
  async deleteLead(id) {
    return this.leads.delete(id);
  }
  // Lead Sources
  async getLeadSources() {
    return Array.from(this.leadSources.values()).sort((a, b) => a.order - b.order);
  }
  async getLeadSource(id) {
    return this.leadSources.get(id);
  }
  async createLeadSource(insertSource) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const source = {
      id,
      name: insertSource.name,
      isActive: insertSource.isActive ?? true,
      order: insertSource.order ?? 0,
      createdAt: now,
      updatedAt: now
    };
    this.leadSources.set(id, source);
    return source;
  }
  async updateLeadSource(id, sourceUpdate) {
    const source = this.leadSources.get(id);
    if (!source) return void 0;
    const updatedSource = { ...source, ...sourceUpdate, updatedAt: /* @__PURE__ */ new Date() };
    this.leadSources.set(id, updatedSource);
    return updatedSource;
  }
  async deleteLeadSource(id) {
    return this.leadSources.delete(id);
  }
  async reorderLeadSources(sourceIds) {
    sourceIds.forEach((id, index) => {
      const source = this.leadSources.get(id);
      if (source) {
        this.leadSources.set(id, { ...source, order: index });
      }
    });
  }
  // Lead Note Templates
  leadNoteTemplates = /* @__PURE__ */ new Map();
  async getLeadNoteTemplates() {
    return Array.from(this.leadNoteTemplates.values()).sort((a, b) => a.order - b.order);
  }
  async getLeadNoteTemplate(id) {
    return this.leadNoteTemplates.get(id);
  }
  async createLeadNoteTemplate(insertTemplate) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const template = {
      id,
      name: insertTemplate.name,
      content: insertTemplate.content,
      isActive: insertTemplate.isActive ?? true,
      order: insertTemplate.order ?? 0,
      createdAt: now,
      updatedAt: now
    };
    this.leadNoteTemplates.set(id, template);
    return template;
  }
  async updateLeadNoteTemplate(id, templateUpdate) {
    const template = this.leadNoteTemplates.get(id);
    if (!template) return void 0;
    const updatedTemplate = { ...template, ...templateUpdate, updatedAt: /* @__PURE__ */ new Date() };
    this.leadNoteTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  async deleteLeadNoteTemplate(id) {
    return this.leadNoteTemplates.delete(id);
  }
  async reorderLeadNoteTemplates(templateIds) {
    templateIds.forEach((id, index) => {
      const template = this.leadNoteTemplates.get(id);
      if (template) {
        this.leadNoteTemplates.set(id, { ...template, order: index });
      }
    });
  }
  // Tasks
  async getTasks() {
    return Array.from(this.tasks.values());
  }
  async getTask(id) {
    return this.tasks.get(id);
  }
  async getTasksByClient(clientId) {
    return Array.from(this.tasks.values()).filter((t) => t.clientId === clientId);
  }
  async createTask(insertTask) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    let level = 0;
    let taskPath = id;
    if (insertTask.parentTaskId) {
      const parentTask = this.tasks.get(insertTask.parentTaskId);
      if (parentTask) {
        level = parentTask.level + 1;
        taskPath = parentTask.taskPath + "/" + id;
        const updatedParent = { ...parentTask, hasSubTasks: true };
        this.tasks.set(insertTask.parentTaskId, updatedParent);
      }
    }
    const task = {
      id,
      title: insertTask.title,
      description: insertTask.description || null,
      status: insertTask.status || "pending",
      priority: insertTask.priority || "normal",
      assignedTo: insertTask.assignedTo || null,
      clientId: insertTask.clientId || null,
      projectId: insertTask.projectId || null,
      campaignId: insertTask.campaignId || null,
      dueDate: insertTask.dueDate || null,
      startDate: insertTask.startDate || null,
      dueTime: insertTask.dueTime || null,
      timeEstimate: insertTask.timeEstimate || null,
      timeTracked: insertTask.timeTracked || 0,
      timeEntries: insertTask.timeEntries || [],
      // Sub-task hierarchy fields
      parentTaskId: insertTask.parentTaskId || null,
      level,
      taskPath,
      hasSubTasks: false,
      // Recurring task settings
      isRecurring: insertTask.isRecurring || false,
      recurringInterval: insertTask.recurringInterval || null,
      recurringUnit: insertTask.recurringUnit || null,
      recurringEndType: insertTask.recurringEndType || null,
      recurringEndDate: insertTask.recurringEndDate || null,
      recurringEndOccurrences: insertTask.recurringEndOccurrences || null,
      createIfOverdue: insertTask.createIfOverdue || false,
      completedAt: null,
      createdAt: now
    };
    this.tasks.set(id, task);
    return task;
  }
  async updateTask(id, taskUpdate) {
    const task = this.tasks.get(id);
    if (!task) return void 0;
    const updatedTask = {
      ...task,
      ...taskUpdate,
      completedAt: taskUpdate.status === "completed" ? /* @__PURE__ */ new Date() : task.completedAt
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  // Client Approval Operations
  async updateTaskClientApproval(taskId, status, notes2) {
    const task = this.tasks.get(taskId);
    if (!task) return void 0;
    const updatedTask = {
      ...task,
      clientApprovalStatus: status,
      clientApprovalNotes: notes2 || null,
      clientApprovalDate: /* @__PURE__ */ new Date()
    };
    this.tasks.set(taskId, updatedTask);
    return updatedTask;
  }
  async approveTask(taskId, notes2) {
    return this.updateTaskClientApproval(taskId, "approved", notes2);
  }
  async requestTaskChanges(taskId, notes2) {
    return this.updateTaskClientApproval(taskId, "changes_requested", notes2);
  }
  async deleteTask(id) {
    const task = this.tasks.get(id);
    if (!task) return false;
    if (task.hasSubTasks) {
      const subTasks = await this.getSubTasks(id);
      for (const subTask of subTasks) {
        await this.deleteTask(subTask.id);
      }
    }
    if (task.parentTaskId) {
      const parentTask = this.tasks.get(task.parentTaskId);
      if (parentTask) {
        const remainingSiblings = Array.from(this.tasks.values()).filter((t) => t.parentTaskId === task.parentTaskId && t.id !== id);
        if (remainingSiblings.length === 0) {
          const updatedParent = { ...parentTask, hasSubTasks: false };
          this.tasks.set(task.parentTaskId, updatedParent);
        }
      }
    }
    return this.tasks.delete(id);
  }
  async updateTasksStatusForClient(clientId, targetStatus, filters) {
    const clientTasks2 = Array.from(this.tasks.values()).filter((t) => t.clientId === clientId);
    const updatedTaskIds = [];
    for (const task of clientTasks2) {
      if (filters?.includeStatuses && filters.includeStatuses.length > 0) {
        if (!filters.includeStatuses.includes(task.status)) continue;
      }
      if (filters?.excludeStatuses && filters.excludeStatuses.length > 0) {
        if (filters.excludeStatuses.includes(task.status)) continue;
      }
      if (filters?.assignedTo && task.assignedTo !== filters.assignedTo) {
        continue;
      }
      if (filters?.priorities && filters.priorities.length > 0) {
        if (!filters.priorities.includes(task.priority)) continue;
      }
      task.status = targetStatus;
      task.updatedAt = /* @__PURE__ */ new Date();
      this.tasks.set(task.id, task);
      updatedTaskIds.push(task.id);
    }
    return { count: updatedTaskIds.length, taskIds: updatedTaskIds };
  }
  // Sub-task hierarchy methods (ClickUp-style up to 5 levels deep)
  async getSubTasks(parentTaskId) {
    return Array.from(this.tasks.values()).filter((task) => task.parentTaskId === parentTaskId).sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }
  async getRootTasks() {
    return Array.from(this.tasks.values()).filter((task) => !task.parentTaskId || task.level === 0).sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }
  async getTaskHierarchy(rootTaskId) {
    const hierarchy = [];
    const root = this.tasks.get(rootTaskId);
    if (!root) return hierarchy;
    hierarchy.push(root);
    const addDescendants = async (parentId) => {
      const subTasks = await this.getSubTasks(parentId);
      for (const subTask of subTasks) {
        hierarchy.push(subTask);
        if (subTask.hasSubTasks) {
          await addDescendants(subTask.id);
        }
      }
    };
    if (root.hasSubTasks) {
      await addDescendants(rootTaskId);
    }
    return hierarchy;
  }
  async createSubTask(parentTaskId, task) {
    const parentTask = this.tasks.get(parentTaskId);
    if (!parentTask) {
      throw new Error("Parent task not found");
    }
    if (parentTask.level >= 4) {
      throw new Error("Maximum task nesting level (5) reached");
    }
    const subTaskData = {
      ...task,
      parentTaskId
    };
    return this.createTask(subTaskData);
  }
  async getParentTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || !task.parentTaskId) return void 0;
    return this.tasks.get(task.parentTaskId);
  }
  async getTaskPath(taskId) {
    const path = [];
    let currentTask = this.tasks.get(taskId);
    while (currentTask) {
      path.unshift(currentTask);
      if (currentTask.parentTaskId) {
        currentTask = this.tasks.get(currentTask.parentTaskId);
      } else {
        break;
      }
    }
    return path;
  }
  // Time Tracking Reports
  async getTimeTrackingReport(filters) {
    const { dateFrom, dateTo, userId, clientId, taskStatus, reportType } = filters;
    const allTasks = Array.from(this.tasks.values());
    const filteredTasks = allTasks.filter((task) => {
      if (userId && task.assignedTo !== userId) return false;
      if (clientId && task.clientId !== clientId) return false;
      if (taskStatus && taskStatus.length > 0 && !taskStatus.includes(task.status)) return false;
      if (!task.timeEntries || task.timeEntries.length === 0) return false;
      const hasEntriesInRange = task.timeEntries.some((entry) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split("T")[0];
        return entryDate >= dateFrom && entryDate <= dateTo;
      });
      return hasEntriesInRange;
    });
    const tasksWithDetails = filteredTasks.map((task) => {
      const timeEntriesByDate = {};
      task.timeEntries.forEach((entry) => {
        if (!entry.startTime) return;
        const entryDate = new Date(entry.startTime).toISOString().split("T")[0];
        if (entryDate >= dateFrom && entryDate <= dateTo) {
          if (!timeEntriesByDate[entryDate]) {
            timeEntriesByDate[entryDate] = [];
          }
          timeEntriesByDate[entryDate].push(entry);
        }
      });
      const totalTracked = Object.values(timeEntriesByDate).flat().reduce((sum, entry) => sum + (entry.duration || 0), 0);
      return {
        ...task,
        userInfo: void 0,
        // MemStorage doesn't have user info
        clientInfo: void 0,
        // MemStorage doesn't have client info  
        timeEntriesByDate,
        totalTracked
      };
    });
    const userSummaries = [];
    const userTimeMap = /* @__PURE__ */ new Map();
    tasksWithDetails.forEach((task) => {
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        entries.forEach((entry) => {
          if (!userTimeMap.has(entry.userId)) {
            userTimeMap.set(entry.userId, {
              userId: entry.userId,
              userName: `User ${entry.userId}`,
              userRole: "User",
              totalTime: 0,
              tasksWorked: /* @__PURE__ */ new Set(),
              dailyTotals: {}
            });
          }
          const userData = userTimeMap.get(entry.userId);
          userData.totalTime += entry.duration || 0;
          userData.tasksWorked.add(task.id);
          if (!userData.dailyTotals[date]) {
            userData.dailyTotals[date] = 0;
          }
          userData.dailyTotals[date] += entry.duration || 0;
        });
      });
    });
    userTimeMap.forEach((userData, userId2) => {
      userSummaries.push({
        userId: userId2,
        userName: userData.userName,
        userRole: userData.userRole,
        totalTime: userData.totalTime,
        tasksWorked: userData.tasksWorked.size,
        dailyTotals: userData.dailyTotals
      });
    });
    const clientBreakdowns = [];
    const clientTimeMap = /* @__PURE__ */ new Map();
    tasksWithDetails.forEach((task) => {
      if (!task.clientId) return;
      if (!clientTimeMap.has(task.clientId)) {
        clientTimeMap.set(task.clientId, {
          clientId: task.clientId,
          clientName: `Client ${task.clientId}`,
          totalTime: 0,
          tasksCount: /* @__PURE__ */ new Set(),
          users: /* @__PURE__ */ new Map()
        });
      }
      const clientData = clientTimeMap.get(task.clientId);
      clientData.tasksCount.add(task.id);
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        entries.forEach((entry) => {
          clientData.totalTime += entry.duration || 0;
          if (!clientData.users.has(entry.userId)) {
            clientData.users.set(entry.userId, {
              userId: entry.userId,
              userName: `User ${entry.userId}`,
              timeSpent: 0
            });
          }
          clientData.users.get(entry.userId).timeSpent += entry.duration || 0;
        });
      });
    });
    clientTimeMap.forEach((clientData, clientId2) => {
      clientBreakdowns.push({
        clientId: clientId2,
        clientName: clientData.clientName,
        totalTime: clientData.totalTime,
        tasksCount: clientData.tasksCount.size,
        users: Array.from(clientData.users.values())
      });
    });
    const dailyTotals = {};
    tasksWithDetails.forEach((task) => {
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        if (!dailyTotals[date]) {
          dailyTotals[date] = 0;
        }
        entries.forEach((entry) => {
          dailyTotals[date] += entry.duration || 0;
        });
      });
    });
    const grandTotal = Object.values(dailyTotals).reduce((sum, total) => sum + total, 0);
    return {
      tasks: tasksWithDetails,
      userSummaries,
      clientBreakdowns,
      dailyTotals,
      grandTotal
    };
  }
  async getUserTimeEntries(userId, dateFrom, dateTo) {
    const allTasks = Array.from(this.tasks.values());
    return allTasks.filter((task) => {
      if (task.assignedTo !== userId) return false;
      if (!task.timeEntries || task.timeEntries.length === 0) return false;
      const hasEntriesInRange = task.timeEntries.some((entry) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split("T")[0];
        return entryDate >= dateFrom && entryDate <= dateTo;
      });
      return hasEntriesInRange;
    }).map((task) => ({
      ...task,
      timeEntries: task.timeEntries.filter((entry) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split("T")[0];
        return entryDate >= dateFrom && entryDate <= dateTo;
      })
    }));
  }
  async getRunningTimeEntries() {
    const allTasks = Array.from(this.tasks.values());
    const runningEntries = [];
    allTasks.forEach((task) => {
      if (!task.timeEntries || task.timeEntries.length === 0) return;
      task.timeEntries.forEach((entry) => {
        if (entry.isRunning) {
          runningEntries.push({
            taskId: task.id,
            userId: entry.userId,
            startTime: entry.startTime
          });
        }
      });
    });
    return runningEntries;
  }
  async getTimeEntriesByDateRange(dateFrom, dateTo, userId, clientId) {
    const allTasks = Array.from(this.tasks.values());
    return allTasks.filter((task) => {
      if (clientId && task.clientId !== clientId) return false;
      if (!task.timeEntries || task.timeEntries.length === 0) return false;
      const hasEntriesInRange = task.timeEntries.some((entry) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split("T")[0];
        const dateMatch = entryDate >= dateFrom && entryDate <= dateTo;
        const userMatch = !userId || entry.userId === userId;
        return dateMatch && userMatch;
      });
      return hasEntriesInRange;
    }).map((task) => ({
      ...task,
      timeEntries: task.timeEntries.filter((entry) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split("T")[0];
        const dateMatch = entryDate >= dateFrom && entryDate <= dateTo;
        const userMatch = !userId || entry.userId === userId;
        return dateMatch && userMatch;
      })
    }));
  }
  async updateTimeEntry(taskId, entryId, updates) {
    const task = this.tasks.get(taskId);
    if (!task || !task.timeEntries) return void 0;
    const entries = task.timeEntries;
    const entryIndex = entries.findIndex((e) => e.id === entryId);
    if (entryIndex === -1) return void 0;
    const entry = entries[entryIndex];
    if (updates.duration !== void 0) entry.duration = updates.duration;
    if (updates.startTime !== void 0) entry.startTime = updates.startTime;
    if (updates.endTime !== void 0) entry.endTime = updates.endTime;
    entries[entryIndex] = entry;
    const updatedTask = { ...task, timeEntries: entries };
    this.tasks.set(taskId, updatedTask);
    return updatedTask;
  }
  async getTimeEntriesForUserOnDate(userId, date) {
    const results = [];
    for (const task of this.tasks.values()) {
      if (!task.timeEntries) continue;
      const matchingEntries = task.timeEntries.filter((entry) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
        return entryDate === date && entry.userId === userId;
      });
      if (matchingEntries.length > 0) {
        results.push({
          taskId: task.id,
          taskTitle: task.title,
          entries: matchingEntries
        });
      }
    }
    return results;
  }
  // Invoices
  async getInvoices() {
    return Array.from(this.invoices.values());
  }
  async getInvoice(id) {
    return this.invoices.get(id);
  }
  async getInvoicesByClient(clientId) {
    return Array.from(this.invoices.values()).filter((i) => i.clientId === clientId);
  }
  async createInvoice(insertInvoice) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const invoice = {
      id,
      clientId: insertInvoice.clientId,
      projectId: insertInvoice.projectId || null,
      invoiceNumber: insertInvoice.invoiceNumber,
      amount: insertInvoice.amount,
      tax: insertInvoice.tax || null,
      total: insertInvoice.total,
      status: insertInvoice.status || "draft",
      notes: insertInvoice.notes || null,
      issueDate: insertInvoice.issueDate || null,
      dueDate: insertInvoice.dueDate || null,
      paidDate: insertInvoice.paidDate || null,
      createdAt: now
    };
    this.invoices.set(id, invoice);
    return invoice;
  }
  async updateInvoice(id, invoiceUpdate) {
    const invoice = this.invoices.get(id);
    if (!invoice) return void 0;
    const updatedInvoice = { ...invoice, ...invoiceUpdate };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
  async deleteInvoice(id) {
    return this.invoices.delete(id);
  }
  // Social Media Accounts
  async getSocialMediaAccounts() {
    return Array.from(this.socialMediaAccounts.values());
  }
  async getSocialMediaAccount(id) {
    return this.socialMediaAccounts.get(id);
  }
  async getSocialMediaAccountsByClient(clientId) {
    return Array.from(this.socialMediaAccounts.values()).filter((account) => account.clientId === clientId);
  }
  async createSocialMediaAccount(accountData) {
    const account = {
      id: randomUUID(),
      clientId: accountData.clientId,
      platform: accountData.platform,
      accountName: accountData.accountName,
      username: accountData.username,
      accountId: accountData.accountId || null,
      accessToken: accountData.accessToken || null,
      refreshToken: accountData.refreshToken || null,
      tokenExpiresAt: accountData.tokenExpiresAt || null,
      isActive: accountData.isActive ?? true,
      lastSync: accountData.lastSync || null,
      followers: accountData.followers || null,
      following: accountData.following || null,
      posts: accountData.posts || null,
      profileImage: accountData.profileImage || null,
      bio: accountData.bio || null,
      website: accountData.website || null,
      settings: accountData.settings || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.socialMediaAccounts.set(account.id, account);
    return account;
  }
  async updateSocialMediaAccount(id, accountData) {
    const account = this.socialMediaAccounts.get(id);
    if (!account) return void 0;
    const updatedAccount = { ...account, ...accountData, updatedAt: /* @__PURE__ */ new Date() };
    this.socialMediaAccounts.set(id, updatedAccount);
    return updatedAccount;
  }
  async deleteSocialMediaAccount(id) {
    return this.socialMediaAccounts.delete(id);
  }
  // Social Media Posts
  async getSocialMediaPosts() {
    return Array.from(this.socialMediaPosts.values());
  }
  async getSocialMediaPost(id) {
    return this.socialMediaPosts.get(id);
  }
  async getSocialMediaPostsByClient(clientId) {
    return Array.from(this.socialMediaPosts.values()).filter((post) => post.clientId === clientId);
  }
  async getSocialMediaPostsByAccount(accountId) {
    return Array.from(this.socialMediaPosts.values()).filter((post) => post.accountId === accountId);
  }
  async createSocialMediaPost(postData) {
    const post = {
      id: randomUUID(),
      clientId: postData.clientId,
      campaignId: postData.campaignId || null,
      accountId: postData.accountId,
      content: postData.content,
      hashtags: postData.hashtags || null,
      mentions: postData.mentions || null,
      mediaUrls: postData.mediaUrls || null,
      mediaType: postData.mediaType || null,
      linkUrl: postData.linkUrl || null,
      linkPreview: postData.linkPreview || null,
      status: postData.status || "draft",
      scheduledAt: postData.scheduledAt || null,
      publishedAt: postData.publishedAt || null,
      platformPostId: postData.platformPostId || null,
      platformData: postData.platformData || null,
      likes: postData.likes || null,
      comments: postData.comments || null,
      shares: postData.shares || null,
      impressions: postData.impressions || null,
      reach: postData.reach || null,
      clicks: postData.clicks || null,
      saves: postData.saves || null,
      requiresApproval: postData.requiresApproval ?? false,
      approvedBy: postData.approvedBy || null,
      approvedAt: postData.approvedAt || null,
      rejectedBy: postData.rejectedBy || null,
      rejectedAt: postData.rejectedAt || null,
      rejectionReason: postData.rejectionReason || null,
      authorId: postData.authorId,
      lastSyncedAt: postData.lastSyncedAt || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.socialMediaPosts.set(post.id, post);
    return post;
  }
  async updateSocialMediaPost(id, postData) {
    const post = this.socialMediaPosts.get(id);
    if (!post) return void 0;
    const updatedPost = { ...post, ...postData, updatedAt: /* @__PURE__ */ new Date() };
    this.socialMediaPosts.set(id, updatedPost);
    return updatedPost;
  }
  async deleteSocialMediaPost(id) {
    return this.socialMediaPosts.delete(id);
  }
  // Social Media Templates
  async getSocialMediaTemplates() {
    return Array.from(this.socialMediaTemplates.values());
  }
  async getSocialMediaTemplate(id) {
    return this.socialMediaTemplates.get(id);
  }
  async getSocialMediaTemplatesByClient(clientId) {
    return Array.from(this.socialMediaTemplates.values()).filter(
      (template) => template.clientId === clientId || template.isPublic
    );
  }
  async createSocialMediaTemplate(templateData) {
    const template = {
      id: randomUUID(),
      name: templateData.name,
      description: templateData.description || null,
      category: templateData.category || null,
      platforms: templateData.platforms || null,
      contentTemplate: templateData.contentTemplate,
      hashtagSuggestions: templateData.hashtagSuggestions || null,
      mediaRequirements: templateData.mediaRequirements || null,
      isPublic: templateData.isPublic ?? false,
      clientId: templateData.clientId || null,
      authorId: templateData.authorId,
      usageCount: templateData.usageCount || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.socialMediaTemplates.set(template.id, template);
    return template;
  }
  async updateSocialMediaTemplate(id, templateData) {
    const template = this.socialMediaTemplates.get(id);
    if (!template) return void 0;
    const updatedTemplate = { ...template, ...templateData, updatedAt: /* @__PURE__ */ new Date() };
    this.socialMediaTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  async deleteSocialMediaTemplate(id) {
    return this.socialMediaTemplates.delete(id);
  }
  // Social Media Analytics
  async getSocialMediaAnalytics() {
    return Array.from(this.socialMediaAnalytics.values());
  }
  async getSocialMediaAnalyticsForAccount(accountId) {
    return Array.from(this.socialMediaAnalytics.values()).filter((analytics) => analytics.accountId === accountId);
  }
  async createSocialMediaAnalytics(analyticsData) {
    const analytics = {
      id: randomUUID(),
      accountId: analyticsData.accountId,
      date: analyticsData.date,
      followers: analyticsData.followers || null,
      following: analyticsData.following || null,
      posts: analyticsData.posts || null,
      totalLikes: analyticsData.totalLikes || null,
      totalComments: analyticsData.totalComments || null,
      totalShares: analyticsData.totalShares || null,
      totalImpressions: analyticsData.totalImpressions || null,
      totalReach: analyticsData.totalReach || null,
      totalClicks: analyticsData.totalClicks || null,
      totalSaves: analyticsData.totalSaves || null,
      engagementRate: analyticsData.engagementRate || null,
      impressionReachRatio: analyticsData.impressionReachRatio || null,
      platformData: analyticsData.platformData || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.socialMediaAnalytics.set(analytics.id, analytics);
    return analytics;
  }
  // Workflow Management
  async getWorkflows() {
    return Array.from(this.workflows.values());
  }
  async getWorkflow(id) {
    return this.workflows.get(id);
  }
  async getWorkflowsByClient(clientId) {
    return Array.from(this.workflows.values()).filter((workflow) => workflow.clientId === clientId);
  }
  async getWorkflowsByCategory(category) {
    return Array.from(this.workflows.values()).filter((workflow) => workflow.category === category);
  }
  async createWorkflow(workflowData) {
    const workflow = {
      id: randomUUID(),
      name: workflowData.name,
      description: workflowData.description || null,
      clientId: workflowData.clientId || null,
      category: workflowData.category || null,
      status: workflowData.status || "draft",
      triggers: workflowData.triggers || [],
      actions: workflowData.actions,
      conditions: workflowData.conditions || null,
      settings: workflowData.settings || null,
      isTemplate: workflowData.isTemplate || false,
      templateCategory: workflowData.templateCategory || null,
      version: workflowData.version || 1,
      lastRun: workflowData.lastRun || null,
      totalRuns: workflowData.totalRuns || 0,
      successfulRuns: workflowData.successfulRuns || 0,
      failedRuns: workflowData.failedRuns || 0,
      createdBy: workflowData.createdBy,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }
  async updateWorkflow(id, workflowData) {
    const existing = this.workflows.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...workflowData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.workflows.set(id, updated);
    return updated;
  }
  async deleteWorkflow(id) {
    return this.workflows.delete(id);
  }
  // Workflow Executions
  async getWorkflowExecutions() {
    return Array.from(this.workflowExecutions.values());
  }
  async getWorkflowExecution(id) {
    return this.workflowExecutions.get(id);
  }
  async getWorkflowExecutionsByWorkflow(workflowId) {
    return Array.from(this.workflowExecutions.values()).filter((exec) => exec.workflowId === workflowId);
  }
  async getWorkflowExecutionsByContact(contactId) {
    return Array.from(this.workflowExecutions.values()).filter((exec) => exec.contactId === contactId);
  }
  async createWorkflowExecution(executionData) {
    const execution = {
      id: randomUUID(),
      workflowId: executionData.workflowId,
      contactId: executionData.contactId || null,
      triggerData: executionData.triggerData || null,
      status: executionData.status,
      currentStep: executionData.currentStep || 0,
      totalSteps: executionData.totalSteps,
      executionLog: executionData.executionLog || null,
      errorMessage: executionData.errorMessage || null,
      startedAt: executionData.startedAt,
      completedAt: executionData.completedAt || null,
      nextRunAt: executionData.nextRunAt || null
    };
    this.workflowExecutions.set(execution.id, execution);
    return execution;
  }
  async updateWorkflowExecution(id, executionData) {
    const existing = this.workflowExecutions.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...executionData
    };
    this.workflowExecutions.set(id, updated);
    return updated;
  }
  // Workflow Templates
  async getWorkflowTemplates() {
    return Array.from(this.workflowTemplates.values());
  }
  async getWorkflowTemplate(id) {
    return this.workflowTemplates.get(id);
  }
  async getWorkflowTemplatesByCategory(category) {
    return Array.from(this.workflowTemplates.values()).filter((template) => template.category === category);
  }
  async createWorkflowTemplate(templateData) {
    const template = {
      id: randomUUID(),
      name: templateData.name,
      description: templateData.description || null,
      category: templateData.category,
      industry: templateData.industry || null,
      useCase: templateData.useCase || null,
      trigger: templateData.trigger,
      actions: templateData.actions,
      conditions: templateData.conditions || null,
      settings: templateData.settings || null,
      isPublic: templateData.isPublic || false,
      usageCount: templateData.usageCount || 0,
      rating: templateData.rating || null,
      tags: templateData.tags || null,
      createdBy: templateData.createdBy,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.workflowTemplates.set(template.id, template);
    return template;
  }
  async updateWorkflowTemplate(id, templateData) {
    const existing = this.workflowTemplates.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...templateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.workflowTemplates.set(id, updated);
    return updated;
  }
  async deleteWorkflowTemplate(id) {
    return this.workflowTemplates.delete(id);
  }
  async incrementWorkflowTemplateUsage(id) {
    const template = this.workflowTemplates.get(id);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      this.workflowTemplates.set(id, template);
    }
  }
  // Task Categories
  async getTaskCategories() {
    return Array.from(this.taskCategories.values());
  }
  async getTaskCategory(id) {
    return this.taskCategories.get(id);
  }
  async createTaskCategory(categoryData) {
    const category = {
      id: randomUUID(),
      name: categoryData.name,
      description: categoryData.description || null,
      color: categoryData.color,
      icon: categoryData.icon || null,
      isDefault: categoryData.isDefault || false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.taskCategories.set(category.id, category);
    return category;
  }
  async updateTaskCategory(id, categoryData) {
    const existing = this.taskCategories.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...categoryData
    };
    this.taskCategories.set(id, updated);
    return updated;
  }
  async deleteTaskCategory(id) {
    return this.taskCategories.delete(id);
  }
  // Task Templates
  async getTaskTemplates() {
    return Array.from(this.taskTemplates.values());
  }
  async getTaskTemplate(id) {
    return this.taskTemplates.get(id);
  }
  async getTaskTemplatesByCategory(categoryId) {
    return Array.from(this.taskTemplates.values()).filter((template) => template.categoryId === categoryId);
  }
  async createTaskTemplate(templateData) {
    const template = {
      id: randomUUID(),
      name: templateData.name,
      description: templateData.description || null,
      categoryId: templateData.categoryId || null,
      priority: templateData.priority || "medium",
      estimatedDuration: templateData.estimatedDuration || null,
      instructions: templateData.instructions || null,
      checklist: templateData.checklist || null,
      requiredFields: templateData.requiredFields || null,
      assigneeRole: templateData.assigneeRole || null,
      tags: templateData.tags || null,
      isRecurring: templateData.isRecurring || false,
      recurrencePattern: templateData.recurrencePattern || null,
      createdBy: templateData.createdBy,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.taskTemplates.set(template.id, template);
    return template;
  }
  async updateTaskTemplate(id, templateData) {
    const existing = this.taskTemplates.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...templateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.taskTemplates.set(id, updated);
    return updated;
  }
  async deleteTaskTemplate(id) {
    return this.taskTemplates.delete(id);
  }
  // Enhanced Tasks
  async getEnhancedTasks() {
    return Array.from(this.enhancedTasks.values());
  }
  async getEnhancedTask(id) {
    return this.enhancedTasks.get(id);
  }
  async getEnhancedTasksByClient(clientId) {
    return Array.from(this.enhancedTasks.values()).filter((task) => task.clientId === clientId);
  }
  async getEnhancedTasksByAssignee(assigneeId) {
    return Array.from(this.enhancedTasks.values()).filter((task) => task.assignedTo === assigneeId);
  }
  async getEnhancedTasksByWorkflow(workflowId) {
    return Array.from(this.enhancedTasks.values()).filter((task) => task.workflowId === workflowId);
  }
  async createEnhancedTask(taskData) {
    const task = {
      id: randomUUID(),
      title: taskData.title,
      description: taskData.description || null,
      categoryId: taskData.categoryId || null,
      templateId: taskData.templateId || null,
      clientId: taskData.clientId || null,
      projectId: taskData.projectId || null,
      campaignId: taskData.campaignId || null,
      workflowId: taskData.workflowId || null,
      parentTaskId: taskData.parentTaskId || null,
      assignedTo: taskData.assignedTo || null,
      createdBy: taskData.createdBy,
      priority: taskData.priority || "medium",
      status: taskData.status || "todo",
      progress: taskData.progress || 0,
      estimatedHours: taskData.estimatedHours || null,
      actualHours: taskData.actualHours || null,
      dueDate: taskData.dueDate || null,
      startDate: taskData.startDate || null,
      completedAt: null,
      tags: taskData.tags || null,
      checklist: taskData.checklist || null,
      attachments: taskData.attachments || null,
      dependencies: taskData.dependencies || null,
      followers: taskData.followers || null,
      customFields: taskData.customFields || null,
      timeEntries: taskData.timeEntries || null,
      comments: taskData.comments || null,
      reminderSettings: taskData.reminderSettings || null,
      isRecurring: taskData.isRecurring || false,
      recurrencePattern: taskData.recurrencePattern || null,
      recurringGroupId: taskData.recurringGroupId || null,
      automationData: taskData.automationData || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.enhancedTasks.set(task.id, task);
    return task;
  }
  async updateEnhancedTask(id, taskData) {
    const existing = this.enhancedTasks.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...taskData,
      updatedAt: /* @__PURE__ */ new Date(),
      completedAt: taskData.status === "completed" && !existing.completedAt ? /* @__PURE__ */ new Date() : existing.completedAt
    };
    this.enhancedTasks.set(id, updated);
    return updated;
  }
  async deleteEnhancedTask(id) {
    return this.enhancedTasks.delete(id);
  }
  // Task History
  async getTaskHistory(taskId) {
    return this.taskHistory.get(taskId) || [];
  }
  async createTaskHistory(historyData) {
    const history = {
      id: randomUUID(),
      taskId: historyData.taskId,
      action: historyData.action,
      field: historyData.field || null,
      oldValue: historyData.oldValue || null,
      newValue: historyData.newValue || null,
      userId: historyData.userId,
      timestamp: historyData.timestamp,
      notes: historyData.notes || null
    };
    const existingHistory = this.taskHistory.get(historyData.taskId) || [];
    existingHistory.push(history);
    this.taskHistory.set(historyData.taskId, existingHistory);
    return history;
  }
  // Automation Triggers
  async getAutomationTriggers() {
    const triggers = await db.select({
      id: automationTriggers.id,
      name: automationTriggers.name,
      type: automationTriggers.type,
      description: automationTriggers.description,
      category: automationTriggers.category,
      configSchema: automationTriggers.configSchema,
      isActive: automationTriggers.isActive,
      createdAt: automationTriggers.createdAt
    }).from(automationTriggers).orderBy(asc(automationTriggers.createdAt));
    return triggers;
  }
  async getAutomationTrigger(id) {
    const result = await db.select({
      id: automationTriggers.id,
      name: automationTriggers.name,
      type: automationTriggers.type,
      description: automationTriggers.description,
      category: automationTriggers.category,
      configSchema: automationTriggers.configSchema,
      isActive: automationTriggers.isActive,
      createdAt: automationTriggers.createdAt
    }).from(automationTriggers).where(eq(automationTriggers.id, id)).limit(1);
    return result[0];
  }
  async getAutomationTriggersByCategory(category) {
    const triggers = await db.select({
      id: automationTriggers.id,
      name: automationTriggers.name,
      type: automationTriggers.type,
      description: automationTriggers.description,
      category: automationTriggers.category,
      configSchema: automationTriggers.configSchema,
      isActive: automationTriggers.isActive,
      createdAt: automationTriggers.createdAt
    }).from(automationTriggers).where(eq(automationTriggers.category, category)).orderBy(asc(automationTriggers.createdAt));
    return triggers;
  }
  async createAutomationTrigger(triggerData) {
    const result = await db.insert(automationTriggers).values(triggerData).returning();
    return result[0];
  }
  async updateAutomationTrigger(id, triggerData) {
    const result = await db.update(automationTriggers).set(triggerData).where(eq(automationTriggers.id, id)).returning();
    return result[0];
  }
  async deleteAutomationTrigger(id) {
    const result = await db.delete(automationTriggers).where(eq(automationTriggers.id, id)).returning();
    return result.length > 0;
  }
  // Automation Actions
  async getAutomationActions() {
    return Array.from(this.automationActions.values());
  }
  async getAutomationAction(id) {
    return this.automationActions.get(id);
  }
  async getAutomationActionsByCategory(category) {
    return Array.from(this.automationActions.values()).filter((action) => action.category === category);
  }
  async createAutomationAction(actionData) {
    const action = {
      id: randomUUID(),
      name: actionData.name,
      type: actionData.type,
      description: actionData.description || null,
      category: actionData.category,
      configSchema: actionData.configSchema || null,
      isActive: actionData.isActive || true,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.automationActions.set(action.id, action);
    return action;
  }
  async updateAutomationAction(id, actionData) {
    const existing = this.automationActions.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...actionData
    };
    this.automationActions.set(id, updated);
    return updated;
  }
  async deleteAutomationAction(id) {
    return this.automationActions.delete(id);
  }
  // Template Folders
  async getTemplateFolders() {
    return Array.from(this.templateFolders.values());
  }
  async getTemplateFolder(id) {
    return this.templateFolders.get(id);
  }
  async getTemplateFoldersByType(type) {
    return Array.from(this.templateFolders.values()).filter((folder) => folder.type === type || folder.type === "both");
  }
  async createTemplateFolder(folderData) {
    const folder = {
      id: randomUUID(),
      name: folderData.name,
      description: folderData.description || null,
      type: folderData.type,
      parentId: folderData.parentId || null,
      order: folderData.order || 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.templateFolders.set(folder.id, folder);
    return folder;
  }
  async updateTemplateFolder(id, folderData) {
    const existing = this.templateFolders.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...folderData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.templateFolders.set(id, updated);
    return updated;
  }
  async deleteTemplateFolder(id) {
    return this.templateFolders.delete(id);
  }
  // Email Templates
  async getEmailTemplates() {
    return Array.from(this.emailTemplates.values());
  }
  async getEmailTemplate(id) {
    return this.emailTemplates.get(id);
  }
  async getEmailTemplatesByFolder(folderId) {
    return Array.from(this.emailTemplates.values()).filter((template) => template.folderId === folderId);
  }
  async createEmailTemplate(templateData) {
    const template = {
      id: randomUUID(),
      name: templateData.name,
      subject: templateData.subject,
      content: templateData.content,
      plainTextContent: templateData.plainTextContent || null,
      previewText: templateData.previewText || null,
      folderId: templateData.folderId || null,
      tags: templateData.tags || null,
      isPublic: templateData.isPublic || false,
      usageCount: 0,
      lastUsed: null,
      createdBy: templateData.createdBy,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.emailTemplates.set(template.id, template);
    return template;
  }
  async updateEmailTemplate(id, templateData) {
    const existing = this.emailTemplates.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...templateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.emailTemplates.set(id, updated);
    return updated;
  }
  async deleteEmailTemplate(id) {
    return this.emailTemplates.delete(id);
  }
  // Scheduled Emails
  async getScheduledEmails() {
    return Array.from(this.scheduledEmails.values());
  }
  async getScheduledEmail(id) {
    return this.scheduledEmails.get(id);
  }
  async getScheduledEmailsByClient(clientId) {
    return Array.from(this.scheduledEmails.values()).filter((email) => email.clientId === clientId);
  }
  async createScheduledEmail(scheduledEmailData) {
    const scheduledEmail = {
      id: randomUUID(),
      clientId: scheduledEmailData.clientId,
      fromUserId: scheduledEmailData.fromUserId,
      toEmail: scheduledEmailData.toEmail,
      ccEmails: scheduledEmailData.ccEmails || null,
      bccEmails: scheduledEmailData.bccEmails || null,
      subject: scheduledEmailData.subject,
      content: scheduledEmailData.content,
      plainTextContent: scheduledEmailData.plainTextContent || null,
      templateId: scheduledEmailData.templateId || null,
      scheduledFor: scheduledEmailData.scheduledFor,
      timezone: scheduledEmailData.timezone,
      status: scheduledEmailData.status || "pending",
      sentAt: null,
      failureReason: null,
      retryCount: 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.scheduledEmails.set(scheduledEmail.id, scheduledEmail);
    return scheduledEmail;
  }
  async updateScheduledEmail(id, scheduledEmailData) {
    const existing = this.scheduledEmails.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...scheduledEmailData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.scheduledEmails.set(id, updated);
    return updated;
  }
  async deleteScheduledEmail(id) {
    return this.scheduledEmails.delete(id);
  }
  async markScheduledEmailAsSent(id, sentAt) {
    const existing = this.scheduledEmails.get(id);
    if (existing) {
      const updated = {
        ...existing,
        status: "sent",
        sentAt,
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.scheduledEmails.set(id, updated);
    }
  }
  async markScheduledEmailAsFailed(id, failureReason) {
    const existing = this.scheduledEmails.get(id);
    if (existing) {
      const updated = {
        ...existing,
        status: "failed",
        failureReason,
        retryCount: (existing.retryCount || 0) + 1,
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.scheduledEmails.set(id, updated);
    }
  }
  // SMS Templates
  async getSmsTemplates() {
    try {
      const result = await db.select({
        id: smsTemplates.id,
        name: smsTemplates.name,
        content: smsTemplates.content,
        category: smsTemplates.category,
        folderId: smsTemplates.folderId,
        tags: smsTemplates.tags,
        isPublic: smsTemplates.isPublic,
        usageCount: smsTemplates.usageCount,
        lastUsed: smsTemplates.lastUsed,
        createdBy: smsTemplates.createdBy,
        createdAt: smsTemplates.createdAt,
        updatedAt: smsTemplates.updatedAt
      }).from(smsTemplates);
      return result;
    } catch (error) {
      console.error("Error fetching SMS templates:", error);
      return [];
    }
  }
  async getSmsTemplate(id) {
    try {
      const result = await db.select({
        id: smsTemplates.id,
        name: smsTemplates.name,
        content: smsTemplates.content,
        category: smsTemplates.category,
        folderId: smsTemplates.folderId,
        tags: smsTemplates.tags,
        isPublic: smsTemplates.isPublic,
        usageCount: smsTemplates.usageCount,
        lastUsed: smsTemplates.lastUsed,
        createdBy: smsTemplates.createdBy,
        createdAt: smsTemplates.createdAt,
        updatedAt: smsTemplates.updatedAt
      }).from(smsTemplates).where(eq(smsTemplates.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching SMS template:", error);
      return void 0;
    }
  }
  async getSmsTemplatesByFolder(folderId) {
    try {
      const result = await db.select({
        id: smsTemplates.id,
        name: smsTemplates.name,
        content: smsTemplates.content,
        category: smsTemplates.category,
        folderId: smsTemplates.folderId,
        tags: smsTemplates.tags,
        isPublic: smsTemplates.isPublic,
        usageCount: smsTemplates.usageCount,
        lastUsed: smsTemplates.lastUsed,
        createdBy: smsTemplates.createdBy,
        createdAt: smsTemplates.createdAt,
        updatedAt: smsTemplates.updatedAt
      }).from(smsTemplates).where(eq(smsTemplates.folderId, folderId));
      return result;
    } catch (error) {
      console.error("Error fetching SMS templates by folder:", error);
      return [];
    }
  }
  async createSmsTemplate(templateData) {
    try {
      const result = await db.insert(smsTemplates).values(templateData).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating SMS template:", error);
      throw error;
    }
  }
  async updateSmsTemplate(id, templateData) {
    try {
      const result = await db.update(smsTemplates).set(templateData).where(eq(smsTemplates.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating SMS template:", error);
      return void 0;
    }
  }
  async deleteSmsTemplate(id) {
    try {
      await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting SMS template:", error);
      return false;
    }
  }
  // Custom Fields
  async getCustomFields() {
    return Array.from(this.customFields.values());
  }
  async getCustomField(id) {
    return this.customFields.get(id);
  }
  async createCustomField(fieldData) {
    const field = {
      id: randomUUID(),
      name: fieldData.name,
      type: fieldData.type,
      options: fieldData.options || null,
      required: fieldData.required || false,
      order: fieldData.order || 0,
      folderId: fieldData.folderId || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.customFields.set(field.id, field);
    return field;
  }
  async updateCustomField(id, fieldData) {
    const existing = this.customFields.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...fieldData
    };
    this.customFields.set(id, updated);
    return updated;
  }
  async deleteCustomField(id) {
    this.customFields.delete(id);
  }
  // Tags
  tags = /* @__PURE__ */ new Map();
  async getTags() {
    return Array.from(this.tags.values());
  }
  async getTag(id) {
    return this.tags.get(id);
  }
  async createTag(tagData) {
    const tag = {
      id: randomUUID(),
      name: tagData.name,
      color: tagData.color || "#46a1a0",
      description: tagData.description || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.tags.set(tag.id, tag);
    return tag;
  }
  async updateTag(id, tagData) {
    const existing = this.tags.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...tagData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.tags.set(id, updated);
    return updated;
  }
  async deleteTag(id) {
    return this.tags.delete(id);
  }
  // Custom Field Folders
  async getCustomFieldFolders() {
    return Array.from(this.customFieldFolders.values());
  }
  async getCustomFieldFolder(id) {
    return this.customFieldFolders.get(id);
  }
  async createCustomFieldFolder(folderData) {
    const folder = {
      id: randomUUID(),
      name: folderData.name,
      description: folderData.description || null,
      order: folderData.order || 0,
      isDefault: folderData.isDefault || false,
      canReorder: folderData.canReorder || true,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.customFieldFolders.set(folder.id, folder);
    return folder;
  }
  // Notifications
  async getNotifications(userId) {
    return Array.from(this.notifications.values()).filter((notification) => notification.userId === userId);
  }
  async getNotification(id) {
    return this.notifications.get(id);
  }
  async getUnreadNotifications(userId) {
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.userId === userId && !notification.isRead
    );
  }
  async createNotification(notificationData) {
    const notification = {
      id: randomUUID(),
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      entityType: notificationData.entityType || null,
      entityId: notificationData.entityId || null,
      priority: notificationData.priority || "normal",
      isRead: notificationData.isRead || false,
      readAt: notificationData.readAt || null,
      actionUrl: notificationData.actionUrl || null,
      actionText: notificationData.actionText || null,
      metadata: notificationData.metadata || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }
  async markNotificationAsRead(id) {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    notification.isRead = true;
    notification.readAt = /* @__PURE__ */ new Date();
    this.notifications.set(id, notification);
    return true;
  }
  async markAllNotificationsAsRead(userId) {
    const userNotifications = Array.from(this.notifications.values()).filter((n) => n.userId === userId);
    const now = /* @__PURE__ */ new Date();
    userNotifications.forEach((notification) => {
      notification.isRead = true;
      notification.readAt = now;
      this.notifications.set(notification.id, notification);
    });
    return true;
  }
  async deleteNotification(id) {
    return this.notifications.delete(id);
  }
  initializeCustomFields() {
    const fields = [
      {
        id: "cf-1",
        name: "Lead Score",
        type: "number",
        options: null,
        required: false,
        order: 1,
        folderId: null,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "cf-2",
        name: "Marketing Preferences",
        type: "dropdown",
        options: ["Email", "Phone", "Text", "Direct Mail"],
        required: false,
        order: 2,
        folderId: null,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "cf-3",
        name: "Acquisition Channel",
        type: "text",
        options: null,
        required: false,
        order: 3,
        folderId: null,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "cf-4",
        name: "Customer Tier",
        type: "dropdown",
        options: ["Bronze", "Silver", "Gold", "Platinum"],
        required: false,
        order: 4,
        folderId: null,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: "cf-5",
        name: "Last Contact Date",
        type: "date",
        options: null,
        required: false,
        order: 5,
        folderId: null,
        createdAt: /* @__PURE__ */ new Date()
      }
    ];
    fields.forEach((field) => {
      this.customFields.set(field.id, field);
    });
  }
  // Audit Logs Implementation
  async getAuditLogs() {
    return Array.from(this.auditLogs.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  async getAuditLog(id) {
    return this.auditLogs.get(id);
  }
  async getAuditLogsByEntity(entityType, entityId) {
    return Array.from(this.auditLogs.values()).filter((log) => log.entityType === entityType && log.entityId === entityId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  async getAuditLogsByUser(userId) {
    return Array.from(this.auditLogs.values()).filter((log) => log.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  async createAuditLog(auditLog) {
    const id = randomUUID();
    const newAuditLog = {
      ...auditLog,
      id,
      timestamp: /* @__PURE__ */ new Date()
    };
    this.auditLogs.set(id, newAuditLog);
    return newAuditLog;
  }
  // Smart Lists implementation for MemStorage
  smartLists = /* @__PURE__ */ new Map();
  async getSmartLists(userId, entityType) {
    const allLists = Array.from(this.smartLists.values());
    const filteredByEntity = entityType ? allLists.filter((list) => list.entityType === entityType) : allLists;
    return filteredByEntity.filter((list) => {
      if (list.visibility === "universal") return true;
      if (list.visibility === "personal") return list.createdBy === userId;
      if (list.visibility === "shared") {
        return list.createdBy === userId || list.sharedWith && list.sharedWith.includes(userId);
      }
      return false;
    });
  }
  async getSmartList(id) {
    return this.smartLists.get(id);
  }
  async createSmartList(smartList) {
    const id = randomUUID();
    const newSmartList = {
      ...smartList,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.smartLists.set(id, newSmartList);
    return newSmartList;
  }
  async updateSmartList(id, smartList) {
    const existing = this.smartLists.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...smartList,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.smartLists.set(id, updated);
    return updated;
  }
  async deleteSmartList(id) {
    return this.smartLists.delete(id);
  }
  // Client Brief Sections implementation for MemStorage
  clientBriefSections = /* @__PURE__ */ new Map();
  clientBriefValues = /* @__PURE__ */ new Map();
  async listBriefSections() {
    const sections = Array.from(this.clientBriefSections.values());
    return sections.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }
  async getBriefSection(id) {
    return this.clientBriefSections.get(id);
  }
  async getBriefSectionByKey(key) {
    return Array.from(this.clientBriefSections.values()).find((section) => section.key === key);
  }
  async createBriefSection(section) {
    const id = randomUUID();
    const newSection = {
      ...section,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.clientBriefSections.set(id, newSection);
    return newSection;
  }
  async updateBriefSection(id, sectionData) {
    const existing = this.clientBriefSections.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...sectionData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.clientBriefSections.set(id, updated);
    return updated;
  }
  async deleteBriefSection(id) {
    return this.clientBriefSections.delete(id);
  }
  async reorderBriefSections(sectionIds) {
    sectionIds.forEach((id, index) => {
      const section = this.clientBriefSections.get(id);
      if (section) {
        section.displayOrder = index;
        section.updatedAt = /* @__PURE__ */ new Date();
        this.clientBriefSections.set(id, section);
      }
    });
  }
  async getClientBrief(clientId) {
    const sections = await this.listBriefSections();
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    return sections.map((section) => {
      let value = void 0;
      if (client && section.key) {
        switch (section.key) {
          case "background":
            value = client.briefBackground || void 0;
            break;
          case "objectives":
            value = client.briefObjectives || void 0;
            break;
          case "brand_info":
            value = client.briefBrandInfo || void 0;
            break;
          case "audience_info":
            value = client.briefAudienceInfo || void 0;
            break;
          case "products_services":
            value = client.briefProductsServices || void 0;
            break;
          case "competitors":
            value = client.briefCompetitors || void 0;
            break;
          case "marketing_tech":
            value = client.briefMarketingTech || void 0;
            break;
          case "miscellaneous":
            value = client.briefMiscellaneous || void 0;
            break;
        }
      }
      if (!value) {
        const briefValueKey = `${clientId}-${section.id}`;
        const briefValue = this.clientBriefValues.get(briefValueKey);
        value = briefValue?.value;
      }
      return {
        ...section,
        value
      };
    });
  }
  async setClientBriefValue(clientId, sectionId, value) {
    const section = await this.getBriefSection(sectionId);
    if (!section) return;
    if (section.key && section.isCoreSection) {
      const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      if (client) {
        const updateData = {};
        switch (section.key) {
          case "background":
            updateData.briefBackground = value;
            break;
          case "objectives":
            updateData.briefObjectives = value;
            break;
          case "brand_info":
            updateData.briefBrandInfo = value;
            break;
          case "audience_info":
            updateData.briefAudienceInfo = value;
            break;
          case "products_services":
            updateData.briefProductsServices = value;
            break;
          case "competitors":
            updateData.briefCompetitors = value;
            break;
          case "marketing_tech":
            updateData.briefMarketingTech = value;
            break;
          case "miscellaneous":
            updateData.briefMiscellaneous = value;
            break;
        }
        await this.updateClient(clientId, updateData);
      }
    } else {
      const briefValueKey = `${clientId}-${sectionId}`;
      const briefValue = {
        id: randomUUID(),
        clientId,
        sectionId,
        value,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.clientBriefValues.set(briefValueKey, briefValue);
    }
  }
  // Email Integrations
  async getEmailIntegrations() {
    return Array.from(this.emailIntegrations.values());
  }
  async getSmsIntegrations() {
    return Array.from(this.smsIntegrations.values());
  }
  async getEmailIntegration(id) {
    return this.emailIntegrations.get(id);
  }
  async getEmailIntegrationByProvider(provider) {
    return Array.from(this.emailIntegrations.values()).find((integration) => integration.provider === provider);
  }
  async createEmailIntegration(integrationData) {
    const integration = {
      id: randomUUID(),
      ...integrationData,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.emailIntegrations.set(integration.id, integration);
    return integration;
  }
  async updateEmailIntegration(id, integrationData) {
    const integration = this.emailIntegrations.get(id);
    if (!integration) return void 0;
    const updated = {
      ...integration,
      ...integrationData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.emailIntegrations.set(id, updated);
    return updated;
  }
  async deleteEmailIntegration(id) {
    return this.emailIntegrations.delete(id);
  }
  async getUserViewPreference(userId, viewType) {
    return null;
  }
  async saveUserViewPreference(userId, viewType, preferences) {
    return { userId, viewType, preferences };
  }
};
var DbStorage = class {
  memStorage = new MemStorage();
  constructor() {
    this.getAuthUserByEmail = async (email) => {
      try {
        const result = await db.select().from(authUsers).where(eq(authUsers.email, email.toLowerCase()));
        return result[0];
      } catch (error) {
        console.error("Error fetching auth user:", error);
        return void 0;
      }
    };
    this.createAuthUser = async (authUser) => {
      try {
        const result = await db.insert(authUsers).values({
          ...authUser,
          email: authUser.email.toLowerCase(),
          id: sql`gen_random_uuid()`,
          createdAt: /* @__PURE__ */ new Date()
        }).returning();
        return result[0];
      } catch (error) {
        console.error("Error creating auth user:", error);
        throw error;
      }
    };
    this.updateLastLogin = async (authUserId) => {
      try {
        await db.update(authUsers).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq(authUsers.id, authUserId));
      } catch (error) {
        console.error("Error updating last login:", error);
        throw error;
      }
    };
    this.setPasswordHash = async (authUserId, passwordHash) => {
      try {
        await db.update(authUsers).set({ passwordHash }).where(eq(authUsers.id, authUserId));
      } catch (error) {
        console.error("Error setting password hash:", error);
        throw error;
      }
    };
  }
  // Clients
  async getClients() {
    try {
      const result = await db.select().from(clients);
      return result;
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  }
  async getClient(id) {
    try {
      const result = await db.select().from(clients).where(eq(clients.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching client:", error);
      return void 0;
    }
  }
  async createClient(insertClient) {
    try {
      const result = await db.insert(clients).values({
        ...insertClient,
        id: randomUUID(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  }
  async updateClient(id, clientData) {
    try {
      const result = await db.update(clients).set({
        ...clientData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(clients.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating client:", error);
      throw error;
    }
  }
  async upsertClientCustomFieldValue(clientId, customFieldId, value) {
    try {
      const client = await this.getClient(clientId);
      if (!client) {
        console.error(`Client ${clientId} not found for custom field update`);
        return void 0;
      }
      const currentValues = client.customFieldValues || {};
      currentValues[customFieldId] = value;
      const result = await db.update(clients).set({
        customFieldValues: currentValues,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(clients.id, clientId)).returning();
      return result[0];
    } catch (error) {
      console.error("Error upserting client custom field value:", error);
      throw error;
    }
  }
  async deleteClient(id) {
    try {
      await db.delete(clientBriefValues).where(eq(clientBriefValues.clientId, id));
      await db.delete(campaigns).where(eq(campaigns.clientId, id));
      await db.delete(clientHealthScores).where(eq(clientHealthScores.clientId, id));
      await db.delete(clientNotes).where(eq(clientNotes.clientId, id));
      await db.delete(clientTasks).where(eq(clientTasks.clientId, id));
      await db.delete(appointments).where(eq(appointments.clientId, id));
      await db.delete(clientDocuments).where(eq(clientDocuments.clientId, id));
      await db.delete(clientTransactions).where(eq(clientTransactions.clientId, id));
      await db.delete(clientProducts).where(eq(clientProducts.clientId, id));
      await db.delete(clientBundles).where(eq(clientBundles.clientId, id));
      await db.delete(activities).where(eq(activities.clientId, id));
      await db.delete(clientTeamAssignments).where(eq(clientTeamAssignments.clientId, id));
      await db.delete(customFieldFileUploads).where(eq(customFieldFileUploads.clientId, id));
      await db.delete(invoices).where(eq(invoices.clientId, id));
      await db.delete(scheduledEmails).where(eq(scheduledEmails.clientId, id));
      await db.delete(notes).where(eq(notes.clientId, id));
      await db.delete(clientPortalUsers).where(eq(clientPortalUsers.clientId, id));
      await db.delete(socialMediaAccounts).where(eq(socialMediaAccounts.clientId, id));
      await db.delete(socialMediaPosts).where(eq(socialMediaPosts.clientId, id));
      await db.delete(socialMediaTemplates).where(eq(socialMediaTemplates.clientId, id));
      await db.delete(deals).where(eq(deals.clientId, id));
      await db.update(tasks).set({ clientId: null }).where(eq(tasks.clientId, id));
      await db.update(quotes).set({ clientId: null }).where(eq(quotes.clientId, id));
      await db.update(calendarAppointments).set({ clientId: null }).where(eq(calendarAppointments.clientId, id));
      await db.update(expenseReportSubmissions).set({ clientId: null }).where(eq(expenseReportSubmissions.clientId, id));
      await db.update(calendarEvents).set({ clientId: null }).where(eq(calendarEvents.clientId, id));
      await db.update(eventTimeEntries).set({ clientId: null }).where(eq(eventTimeEntries.clientId, id));
      await db.update(workflowExecutions).set({ contactId: null }).where(eq(workflowExecutions.contactId, id));
      const result = await db.delete(clients).where(eq(clients.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
  }
  async archiveClient(id) {
    try {
      const result = await db.update(clients).set({ isArchived: true }).where(eq(clients.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error archiving client:", error);
      throw error;
    }
  }
  async reassignClientTasks(fromClientId, toClientId) {
    try {
      const result = await db.update(tasks).set({ clientId: toClientId }).where(eq(tasks.clientId, fromClientId)).returning();
      return { movedCount: result.length };
    } catch (error) {
      console.error("Error reassigning client tasks:", error);
      throw error;
    }
  }
  async getClientRelationsCounts(id) {
    try {
      const [tasksCount, campaignsCount, invoicesCount, healthScoresCount] = await Promise.all([
        db.select({ count: sql`count(*)` }).from(tasks).where(eq(tasks.clientId, id)),
        db.select({ count: sql`count(*)` }).from(campaigns).where(eq(campaigns.clientId, id)),
        db.select({ count: sql`count(*)` }).from(invoices).where(eq(invoices.clientId, id)),
        db.select({ count: sql`count(*)` }).from(clientHealthScores).where(eq(clientHealthScores.clientId, id))
      ]);
      return {
        tasks: Number(tasksCount[0]?.count || 0),
        campaigns: Number(campaignsCount[0]?.count || 0),
        invoices: Number(invoicesCount[0]?.count || 0),
        healthScores: Number(healthScoresCount[0]?.count || 0)
      };
    } catch (error) {
      console.error("Error getting client relations counts:", error);
      throw error;
    }
  }
  // Client Health Scores
  async createClientHealthScore(data) {
    const result = await db.insert(clientHealthScores).values({
      ...data,
      id: randomUUID(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return result[0];
  }
  async getClientHealthScores(clientId) {
    return await db.select().from(clientHealthScores).where(eq(clientHealthScores.clientId, clientId)).orderBy(desc(clientHealthScores.weekStartDate));
  }
  async getClientHealthScore(id) {
    const result = await db.select().from(clientHealthScores).where(eq(clientHealthScores.id, id));
    return result[0] || null;
  }
  async updateClientHealthScore(id, data) {
    const result = await db.update(clientHealthScores).set({
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(clientHealthScores.id, id)).returning();
    return result[0];
  }
  async deleteClientHealthScore(id) {
    await db.delete(clientHealthScores).where(eq(clientHealthScores.id, id));
  }
  // Activities
  async createActivity(insertActivity) {
    try {
      const result = await db.insert(activities).values({
        ...insertActivity,
        id: randomUUID(),
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  }
  async getClientHealthScoreByWeek(clientId, weekStartDate) {
    const result = await db.select().from(clientHealthScores).where(and(
      eq(clientHealthScores.clientId, clientId),
      eq(clientHealthScores.weekStartDate, weekStartDate.toISOString().split("T")[0])
    ));
    return result[0] || null;
  }
  // Health Scores Bulk API
  async getHealthScoresFiltered(filters) {
    const {
      from,
      to,
      statuses,
      search,
      clientId,
      latestPerClient = false,
      page = 1,
      limit = 50,
      sort = "weekStartDate",
      sortOrder = "desc"
    } = filters;
    const conditions = [];
    if (from) {
      conditions.push(sql`${clientHealthScores.weekStartDate} >= ${from}`);
    }
    if (to) {
      conditions.push(sql`${clientHealthScores.weekStartDate} <= ${to}`);
    }
    if (statuses && statuses.length > 0) {
      conditions.push(sql`${clientHealthScores.healthIndicator} IN (${sql.join(statuses.map((status) => sql`${status}`), sql`, `)})`);
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          sql`LOWER(${clients.name}) LIKE LOWER(${searchTerm})`,
          sql`LOWER(${clients.email}) LIKE LOWER(${searchTerm})`
        )
      );
    }
    if (clientId) {
      conditions.push(eq(clientHealthScores.clientId, clientId));
    }
    let baseQuery = db.select({
      id: clientHealthScores.id,
      clientId: clientHealthScores.clientId,
      weekStartDate: clientHealthScores.weekStartDate,
      weekEndDate: clientHealthScores.weekEndDate,
      weeklyRecap: clientHealthScores.weeklyRecap,
      opportunities: clientHealthScores.opportunities,
      solutions: clientHealthScores.solutions,
      goals: clientHealthScores.goals,
      fulfillment: clientHealthScores.fulfillment,
      relationship: clientHealthScores.relationship,
      clientActions: clientHealthScores.clientActions,
      paymentStatus: clientHealthScores.paymentStatus,
      totalScore: clientHealthScores.totalScore,
      averageScore: clientHealthScores.averageScore,
      healthIndicator: clientHealthScores.healthIndicator,
      createdAt: clientHealthScores.createdAt,
      updatedAt: clientHealthScores.updatedAt,
      clientName: clients.name,
      clientEmail: clients.email,
      clientCompany: clients.company
    }).from(clientHealthScores).innerJoin(clients, eq(clientHealthScores.clientId, clients.id));
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }
    if (latestPerClient) {
      const latestWeeks = await db.select({
        clientId: clientHealthScores.clientId,
        maxWeekStart: max(clientHealthScores.weekStartDate).as("maxWeekStart")
      }).from(clientHealthScores).groupBy(clientHealthScores.clientId);
      const clientWeekPairs = latestWeeks.map((item) => ({
        clientId: item.clientId,
        weekStartDate: item.maxWeekStart
      }));
      if (clientWeekPairs.length > 0) {
        const latestConditions = clientWeekPairs.map(
          (pair) => and(
            eq(clientHealthScores.clientId, pair.clientId),
            eq(clientHealthScores.weekStartDate, pair.weekStartDate)
          )
        );
        conditions.push(or(...latestConditions));
      }
    }
    const sortColumn = sort === "weekStartDate" ? clientHealthScores.weekStartDate : sort === "clientName" ? clients.name : sort === "healthIndicator" ? clientHealthScores.healthIndicator : sort === "averageScore" ? clientHealthScores.averageScore : sort === "createdAt" ? clientHealthScores.createdAt : sort === "paymentStatus" ? clientHealthScores.paymentStatus : sort === "goals" ? clientHealthScores.goals : sort === "fulfillment" ? clientHealthScores.fulfillment : sort === "relationship" ? clientHealthScores.relationship : sort === "clientActions" ? clientHealthScores.clientActions : clientHealthScores.weekStartDate;
    if (sortOrder === "desc") {
      baseQuery = baseQuery.orderBy(desc(sortColumn));
    } else {
      baseQuery = baseQuery.orderBy(asc(sortColumn));
    }
    let countQuery = db.select({ count: sql`count(*)` }).from(clientHealthScores).innerJoin(clients, eq(clientHealthScores.clientId, clients.id));
    let countConditions = [...conditions];
    if (countConditions.length > 0) {
      countQuery = countQuery.where(and(...countConditions));
    }
    if (latestPerClient) {
      countQuery = db.select({ count: sql`count(DISTINCT ${clientHealthScores.clientId})` }).from(clientHealthScores).innerJoin(clients, eq(clientHealthScores.clientId, clients.id));
      if (countConditions.length > 0) {
        countQuery = countQuery.where(and(...countConditions));
      }
    }
    const offset = (page - 1) * limit;
    const [items, totalResult] = await Promise.all([
      baseQuery.limit(limit).offset(offset),
      countQuery
    ]);
    const total = totalResult[0]?.count || 0;
    return {
      items,
      total,
      page,
      limit
    };
  }
  async getAllClientsForExport() {
    return await db.select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      phone: clients.phone,
      company: clients.company,
      position: clients.position,
      status: clients.status,
      contactType: clients.contactType,
      contactSource: clients.contactSource,
      address: clients.address,
      address2: clients.address2,
      city: clients.city,
      state: clients.state,
      zipCode: clients.zipCode,
      country: clients.country,
      leadSource: clients.leadSource,
      referredBy: clients.referredBy,
      socialProfiles: clients.socialProfiles,
      tags: clients.tags,
      notes: clients.notes,
      customFields: clients.customFields,
      lastContactedAt: clients.lastContactedAt,
      nextFollowUpAt: clients.nextFollowUpAt,
      leadScore: clients.leadScore,
      lifetimeValue: clients.lifetimeValue,
      totalRevenue: clients.totalRevenue,
      pipelineStage: clients.pipelineStage,
      assignedTo: clients.assignedTo,
      teamId: clients.teamId,
      isArchived: clients.isArchived,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt
    }).from(clients).orderBy(clients.createdAt);
  }
  // SECURITY: MemStorage fallback REMOVED for security compliance
  // All methods must use database storage for data consistency and security
  // Time Tracking Reports - Database Implementation
  async getTimeTrackingReport(filters) {
    const { dateFrom, dateTo, userId, clientId, taskStatus, reportType } = filters;
    const conditions = [];
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements(${tasks.timeEntries}) AS entry
        WHERE entry->>'startTime' IS NOT NULL
        AND (entry->>'startTime')::date >= ${dateFrom}::date
        AND (entry->>'startTime')::date <= ${dateTo}::date
      )`
    );
    if (userId) {
      conditions.push(eq(tasks.assignedTo, userId));
    }
    if (clientId) {
      conditions.push(eq(tasks.clientId, clientId));
    }
    if (taskStatus && taskStatus.length > 0) {
      conditions.push(sql`${tasks.status} IN (${sql.join(taskStatus.map((status) => sql`${status}`), sql`, `)})`);
    }
    const tasksQuery = db.select().from(tasks).where(and(...conditions));
    const tasksData = await tasksQuery;
    const tasksWithDetails = tasksData.map((task) => {
      const timeEntriesByDate = {};
      if (task.timeEntries && Array.isArray(task.timeEntries)) {
        task.timeEntries.forEach((entry) => {
          if (!entry.startTime) return;
          const entryDate = new Date(entry.startTime).toISOString().split("T")[0];
          if (entryDate >= dateFrom && entryDate <= dateTo) {
            if (!timeEntriesByDate[entryDate]) {
              timeEntriesByDate[entryDate] = [];
            }
            timeEntriesByDate[entryDate].push(entry);
          }
        });
      }
      const totalTracked = Object.values(timeEntriesByDate).flat().reduce((sum, entry) => sum + (entry.duration || 0), 0);
      return {
        ...task,
        userInfo: void 0,
        // Simplified - we'll get this info separately if needed
        clientInfo: void 0,
        // Simplified - we'll get this info separately if needed  
        timeEntriesByDate,
        totalTracked
      };
    });
    const userSummaries = [];
    const userTimeMap = /* @__PURE__ */ new Map();
    tasksWithDetails.forEach((task) => {
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        entries.forEach((entry) => {
          if (!userTimeMap.has(entry.userId)) {
            userTimeMap.set(entry.userId, {
              userId: entry.userId,
              userName: task.userInfo?.firstName ? `${task.userInfo.firstName} ${task.userInfo.lastName}` : `User ${entry.userId}`,
              userRole: task.userInfo?.role || "User",
              department: task.userInfo ? tasksData.find((t) => t.userId === entry.userId)?.userDepartment : void 0,
              totalTime: 0,
              tasksWorked: /* @__PURE__ */ new Set(),
              dailyTotals: {}
            });
          }
          const userData = userTimeMap.get(entry.userId);
          userData.totalTime += entry.duration || 0;
          userData.tasksWorked.add(task.id);
          if (!userData.dailyTotals[date]) {
            userData.dailyTotals[date] = 0;
          }
          userData.dailyTotals[date] += entry.duration || 0;
        });
      });
    });
    userTimeMap.forEach((userData, userId2) => {
      userSummaries.push({
        userId: userId2,
        userName: userData.userName,
        userRole: userData.userRole,
        department: userData.department,
        totalTime: userData.totalTime,
        tasksWorked: userData.tasksWorked.size,
        dailyTotals: userData.dailyTotals
      });
    });
    const clientBreakdowns = [];
    const clientTimeMap = /* @__PURE__ */ new Map();
    tasksWithDetails.forEach((task) => {
      if (!task.clientId) return;
      if (!clientTimeMap.has(task.clientId)) {
        clientTimeMap.set(task.clientId, {
          clientId: task.clientId,
          clientName: task.clientInfo?.name || `Client ${task.clientId}`,
          totalTime: 0,
          tasksCount: /* @__PURE__ */ new Set(),
          users: /* @__PURE__ */ new Map()
        });
      }
      const clientData = clientTimeMap.get(task.clientId);
      clientData.tasksCount.add(task.id);
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        entries.forEach((entry) => {
          clientData.totalTime += entry.duration || 0;
          if (!clientData.users.has(entry.userId)) {
            clientData.users.set(entry.userId, {
              userId: entry.userId,
              userName: task.userInfo?.firstName ? `${task.userInfo.firstName} ${task.userInfo.lastName}` : `User ${entry.userId}`,
              timeSpent: 0
            });
          }
          clientData.users.get(entry.userId).timeSpent += entry.duration || 0;
        });
      });
    });
    clientTimeMap.forEach((clientData, clientId2) => {
      clientBreakdowns.push({
        clientId: clientId2,
        clientName: clientData.clientName,
        totalTime: clientData.totalTime,
        tasksCount: clientData.tasksCount.size,
        users: Array.from(clientData.users.values())
      });
    });
    const dailyTotals = {};
    tasksWithDetails.forEach((task) => {
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        if (!dailyTotals[date]) {
          dailyTotals[date] = 0;
        }
        entries.forEach((entry) => {
          dailyTotals[date] += entry.duration || 0;
        });
      });
    });
    const grandTotal = Object.values(dailyTotals).reduce((sum, total) => sum + total, 0);
    return {
      tasks: tasksWithDetails,
      userSummaries,
      clientBreakdowns,
      dailyTotals,
      grandTotal
    };
  }
  async getUserTimeEntries(userId, dateFrom, dateTo) {
    const tasksData = await db.select().from(tasks).where(
      and(
        eq(tasks.assignedTo, userId),
        sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${tasks.timeEntries}) AS entry
            WHERE entry->>'startTime' IS NOT NULL
            AND (entry->>'startTime')::date >= ${dateFrom}::date
            AND (entry->>'startTime')::date <= ${dateTo}::date
          )`
      )
    );
    return tasksData.map((task) => ({
      ...task,
      timeEntries: task.timeEntries && Array.isArray(task.timeEntries) ? task.timeEntries.filter((entry) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split("T")[0];
        return entryDate >= dateFrom && entryDate <= dateTo;
      }) : []
    }));
  }
  async getRunningTimeEntries() {
    const tasksData = await db.select({
      id: tasks.id,
      timeEntries: tasks.timeEntries
    }).from(tasks).where(
      sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements(${tasks.timeEntries}) AS entry
          WHERE (entry->>'isRunning')::boolean = true
        )`
    );
    const runningEntries = [];
    tasksData.forEach((task) => {
      if (!task.timeEntries || !Array.isArray(task.timeEntries)) return;
      task.timeEntries.forEach((entry) => {
        if (entry.isRunning) {
          runningEntries.push({
            taskId: task.id,
            userId: entry.userId,
            startTime: entry.startTime
          });
        }
      });
    });
    return runningEntries;
  }
  async getTimeEntriesByDateRange(dateFrom, dateTo, userId, clientId) {
    console.log(`\u{1F50D} getTimeEntriesByDateRange called with:`, { dateFrom, dateTo, userId, clientId });
    let effectiveUserId = userId;
    if (userId && userId.startsWith("dev-admin-")) {
      console.log(`\u{1F680} Dev-admin user detected, showing all time data instead of filtering by: ${userId}`);
      effectiveUserId = void 0;
    }
    const conditions = [
      sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements(${tasks.timeEntries}) AS entry
        WHERE entry->>'startTime' IS NOT NULL
        AND (entry->>'startTime')::date >= ${dateFrom}::date
        AND (entry->>'startTime')::date <= ${dateTo}::date
        ${effectiveUserId ? sql`AND entry->>'userId' = ${effectiveUserId}` : sql``}
      )`
    ];
    if (clientId === "no-client") {
      conditions.push(isNull(tasks.clientId));
    } else if (clientId) {
      conditions.push(eq(tasks.clientId, clientId));
    }
    const tasksData = await db.select({
      task: tasks,
      clientCompany: clients.company,
      clientName: clients.name
    }).from(tasks).leftJoin(clients, eq(tasks.clientId, clients.id)).where(and(...conditions));
    console.log(`\u{1F50D} getTimeEntriesByDateRange: Found ${tasksData.length} tasks with potential time entries`);
    const result = tasksData.map(({ task, clientCompany, clientName }) => {
      const originalEntries = task.timeEntries && Array.isArray(task.timeEntries) ? task.timeEntries : [];
      const filteredEntries = originalEntries.filter((entry) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split("T")[0];
        const dateMatch = entryDate >= dateFrom && entryDate <= dateTo;
        const userMatch = !effectiveUserId || entry.userId === effectiveUserId;
        if (originalEntries.length > 0 && effectiveUserId) {
          console.log(`\u{1F4CA} Entry filter check:`, {
            taskId: task.id,
            entryUserId: entry.userId,
            filterUserId: effectiveUserId,
            userMatch,
            entryDate,
            dateFrom,
            dateTo,
            dateMatch
          });
        }
        return dateMatch && userMatch;
      });
      if (originalEntries.length > 0) {
        console.log(`\u{1F4CA} Task ${task.id}: ${originalEntries.length} original entries -> ${filteredEntries.length} after filtering`);
      }
      return {
        ...task,
        clientName: clientCompany || clientName || void 0,
        timeEntries: filteredEntries
      };
    });
    const tasksWithEntries = result.filter((t) => t.timeEntries.length > 0);
    console.log(`\u{1F50D} getTimeEntriesByDateRange: Returning ${tasksWithEntries.length} tasks with entries`);
    return result;
  }
  async updateTimeEntry(taskId, entryId, updates) {
    try {
      const taskResult = await db.select().from(tasks).where(eq(tasks.id, taskId));
      const task = taskResult[0];
      if (!task || !task.timeEntries) return void 0;
      const entries = task.timeEntries;
      const entryIndex = entries.findIndex((e) => e.id === entryId);
      if (entryIndex === -1) return void 0;
      const entry = entries[entryIndex];
      if (updates.duration !== void 0) entry.duration = updates.duration;
      if (updates.startTime !== void 0) entry.startTime = updates.startTime;
      if (updates.endTime !== void 0) entry.endTime = updates.endTime;
      entries[entryIndex] = entry;
      const [updatedTask] = await db.update(tasks).set({ timeEntries: entries }).where(eq(tasks.id, taskId)).returning();
      return updatedTask;
    } catch (error) {
      console.error("Error updating time entry:", error);
      return void 0;
    }
  }
  async getTimeEntriesForUserOnDate(userId, date) {
    try {
      const tasksData = await db.select().from(tasks).where(
        sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${tasks.timeEntries}) AS entry
            WHERE entry->>'userId' = ${userId}
            AND ((entry->>'startTime')::timestamptz AT TIME ZONE 'America/New_York')::date = ${date}::date
          )`
      );
      return tasksData.map((task) => ({
        taskId: task.id,
        taskTitle: task.title,
        entries: task.timeEntries && Array.isArray(task.timeEntries) ? task.timeEntries.filter((entry) => {
          if (!entry.startTime) return false;
          const entryDate = new Date(entry.startTime).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
          return entryDate === date && entry.userId === userId;
        }) : []
      }));
    } catch (error) {
      console.error("Error getting time entries for user on date:", error);
      return [];
    }
  }
  // Campaigns  
  async getCampaigns() {
    return this.memStorage.getCampaigns();
  }
  async getCampaign(id) {
    return this.memStorage.getCampaign(id);
  }
  async getCampaignsByClient(clientId) {
    return this.memStorage.getCampaignsByClient(clientId);
  }
  async createCampaign(campaign) {
    return this.memStorage.createCampaign(campaign);
  }
  async updateCampaign(id, campaign) {
    return this.memStorage.updateCampaign(id, campaign);
  }
  async deleteCampaign(id) {
    return this.memStorage.deleteCampaign(id);
  }
  // Leads - Database implementation
  async getLeads() {
    try {
      const result = await db.select().from(leads).orderBy(desc(leads.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching leads from database:", error);
      return [];
    }
  }
  async getLead(id) {
    try {
      const result = await db.select().from(leads).where(eq(leads.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching lead from database:", error);
      return void 0;
    }
  }
  async createLead(lead) {
    try {
      const now = /* @__PURE__ */ new Date();
      const result = await db.insert(leads).values({
        ...lead,
        id: sql`gen_random_uuid()`,
        createdAt: now
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating lead in database:", error);
      throw error;
    }
  }
  async updateLead(id, lead) {
    try {
      const result = await db.update(leads).set({
        ...lead
      }).where(eq(leads.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating lead in database:", error);
      return void 0;
    }
  }
  async deleteLead(id) {
    try {
      const result = await db.delete(leads).where(eq(leads.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting lead from database:", error);
      return false;
    }
  }
  // Lead Sources
  async getLeadSources() {
    try {
      const sources = await db.select().from(leadSources).orderBy(asc(leadSources.order));
      return sources;
    } catch (error) {
      console.error("Error fetching lead sources:", error);
      return [];
    }
  }
  async getLeadSource(id) {
    try {
      const result = await db.select().from(leadSources).where(eq(leadSources.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching lead source:", error);
      return void 0;
    }
  }
  async createLeadSource(source) {
    try {
      const result = await db.insert(leadSources).values({
        ...source,
        id: sql`gen_random_uuid()`,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating lead source:", error);
      throw error;
    }
  }
  async updateLeadSource(id, source) {
    try {
      const result = await db.update(leadSources).set({ ...source, updatedAt: /* @__PURE__ */ new Date() }).where(eq(leadSources.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating lead source:", error);
      return void 0;
    }
  }
  async deleteLeadSource(id) {
    try {
      await db.delete(leadSources).where(eq(leadSources.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting lead source:", error);
      return false;
    }
  }
  async reorderLeadSources(sourceIds) {
    try {
      for (let i = 0; i < sourceIds.length; i++) {
        await db.update(leadSources).set({ order: i }).where(eq(leadSources.id, sourceIds[i]));
      }
    } catch (error) {
      console.error("Error reordering lead sources:", error);
      throw error;
    }
  }
  // Lead Note Templates - Database implementation
  async getLeadNoteTemplates() {
    try {
      const templates = await db.select().from(leadNoteTemplates).orderBy(asc(leadNoteTemplates.order));
      return templates;
    } catch (error) {
      console.error("Error fetching lead note templates:", error);
      return [];
    }
  }
  async getLeadNoteTemplate(id) {
    try {
      const result = await db.select().from(leadNoteTemplates).where(eq(leadNoteTemplates.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching lead note template:", error);
      return void 0;
    }
  }
  async createLeadNoteTemplate(template) {
    try {
      const result = await db.insert(leadNoteTemplates).values({
        ...template,
        id: sql`gen_random_uuid()`,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating lead note template:", error);
      throw error;
    }
  }
  async updateLeadNoteTemplate(id, template) {
    try {
      const result = await db.update(leadNoteTemplates).set({ ...template, updatedAt: /* @__PURE__ */ new Date() }).where(eq(leadNoteTemplates.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating lead note template:", error);
      return void 0;
    }
  }
  async deleteLeadNoteTemplate(id) {
    try {
      await db.delete(leadNoteTemplates).where(eq(leadNoteTemplates.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting lead note template:", error);
      return false;
    }
  }
  async reorderLeadNoteTemplates(templateIds) {
    try {
      for (let i = 0; i < templateIds.length; i++) {
        await db.update(leadNoteTemplates).set({ order: i }).where(eq(leadNoteTemplates.id, templateIds[i]));
      }
    } catch (error) {
      console.error("Error reordering lead note templates:", error);
      throw error;
    }
  }
  // Tasks - Database implementation
  async getTasks() {
    try {
      const result = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching tasks from database:", error);
      return [];
    }
  }
  async getTask(id) {
    try {
      const result = await db.select().from(tasks).where(eq(tasks.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching task from database:", error);
      return void 0;
    }
  }
  async getTasksByClient(clientId) {
    try {
      const result = await db.select().from(tasks).where(eq(tasks.clientId, clientId));
      return result;
    } catch (error) {
      console.error("Error fetching tasks by client:", error);
      return [];
    }
  }
  async createTask(task) {
    try {
      const now = /* @__PURE__ */ new Date();
      const nowIso = now.toISOString();
      const initialStatus = task.status || "todo";
      const statusHistory = [{
        status: initialStatus,
        enteredAt: nowIso,
        exitedAt: null,
        durationMs: null,
        hitCount: 1,
        timeTrackedInStage: 0
      }];
      const result = await db.insert(tasks).values({
        ...task,
        id: sql`gen_random_uuid()`,
        createdAt: now,
        statusHistory
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating task in database:", error);
      throw error;
    }
  }
  async updateTask(id, task) {
    try {
      const [currentTask] = await db.select().from(tasks).where(eq(tasks.id, id));
      if (!currentTask) {
        return void 0;
      }
      let updateData = { ...task };
      if (task.status && task.status !== currentTask.status) {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const statusHistory = currentTask.statusHistory || [];
        if (statusHistory.length > 0) {
          const lastEntry = statusHistory[statusHistory.length - 1];
          if (!lastEntry.exitedAt) {
            lastEntry.exitedAt = now;
            const enteredAt = new Date(lastEntry.enteredAt).getTime();
            const exitedAt = new Date(now).getTime();
            lastEntry.durationMs = exitedAt - enteredAt;
          }
        }
        statusHistory.push({
          status: task.status,
          enteredAt: now,
          exitedAt: null,
          durationMs: null,
          hitCount: statusHistory.filter((h) => h.status === task.status).length + 1,
          timeTrackedInStage: 0
        });
        updateData.statusHistory = statusHistory;
      }
      const result = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating task in database:", error);
      return void 0;
    }
  }
  async deleteTask(id) {
    try {
      const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting task from database:", error);
      return false;
    }
  }
  async updateTasksStatusForClient(clientId, targetStatus, filters) {
    const { db: db2 } = await import("./db-3XSWT6EC.js");
    const { tasks: tasks2 } = await import("./schema-6IMJ3MPL.js");
    const { eq: eq2, and: and2, inArray: inArray2, notInArray } = await import("drizzle-orm");
    const conditions = [eq2(tasks2.clientId, clientId)];
    if (filters?.includeStatuses && filters.includeStatuses.length > 0) {
      conditions.push(inArray2(tasks2.status, filters.includeStatuses));
    }
    if (filters?.excludeStatuses && filters.excludeStatuses.length > 0) {
      conditions.push(notInArray(tasks2.status, filters.excludeStatuses));
    }
    if (filters?.assignedTo) {
      conditions.push(eq2(tasks2.assignedTo, filters.assignedTo));
    }
    if (filters?.priorities && filters.priorities.length > 0) {
      conditions.push(inArray2(tasks2.priority, filters.priorities));
    }
    const result = await db2.update(tasks2).set({
      status: targetStatus,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and2(...conditions)).returning({ id: tasks2.id });
    return {
      count: result.length,
      taskIds: result.map((r) => r.id)
    };
  }
  // Client Approval Operations - Database implementation
  async updateTaskClientApproval(taskId, status, notes2) {
    try {
      const result = await db.update(tasks).set({
        clientApprovalStatus: status,
        clientApprovalNotes: notes2,
        clientApprovalDate: /* @__PURE__ */ new Date()
      }).where(eq(tasks.id, taskId)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating task client approval:", error);
      return void 0;
    }
  }
  async approveTask(taskId, notes2) {
    try {
      const result = await db.update(tasks).set({
        clientApprovalStatus: "approved",
        clientApprovalNotes: notes2,
        clientApprovalDate: /* @__PURE__ */ new Date()
      }).where(eq(tasks.id, taskId)).returning();
      return result[0];
    } catch (error) {
      console.error("Error approving task:", error);
      return void 0;
    }
  }
  async requestTaskChanges(taskId, notes2) {
    try {
      const result = await db.update(tasks).set({
        clientApprovalStatus: "changes_requested",
        clientApprovalNotes: notes2,
        clientApprovalDate: /* @__PURE__ */ new Date()
      }).where(eq(tasks.id, taskId)).returning();
      return result[0];
    } catch (error) {
      console.error("Error requesting task changes:", error);
      return void 0;
    }
  }
  // Smart Lists - using database implementation at end of file
  // Invoices - Database implementation
  async getInvoices() {
    try {
      const result = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching invoices from database:", error);
      return [];
    }
  }
  async getInvoice(id) {
    try {
      const result = await db.select().from(invoices).where(eq(invoices.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching invoice from database:", error);
      return void 0;
    }
  }
  async getInvoicesByClient(clientId) {
    try {
      const result = await db.select().from(invoices).where(eq(invoices.clientId, clientId));
      return result;
    } catch (error) {
      console.error("Error fetching invoices by client:", error);
      return [];
    }
  }
  async createInvoice(invoice) {
    try {
      const now = /* @__PURE__ */ new Date();
      const result = await db.insert(invoices).values({
        ...invoice,
        id: sql`gen_random_uuid()`,
        createdAt: now
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating invoice in database:", error);
      throw error;
    }
  }
  async updateInvoice(id, invoice) {
    try {
      const result = await db.update(invoices).set({
        ...invoice
      }).where(eq(invoices.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating invoice in database:", error);
      return void 0;
    }
  }
  async deleteInvoice(id) {
    try {
      const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting invoice from database:", error);
      return false;
    }
  }
  // Social Media
  async getSocialMediaAccounts() {
    return this.memStorage.getSocialMediaAccounts();
  }
  async getSocialMediaAccount(id) {
    return this.memStorage.getSocialMediaAccount(id);
  }
  async getSocialMediaAccountsByClient(clientId) {
    return this.memStorage.getSocialMediaAccountsByClient(clientId);
  }
  async createSocialMediaAccount(account) {
    return this.memStorage.createSocialMediaAccount(account);
  }
  async updateSocialMediaAccount(id, account) {
    return this.memStorage.updateSocialMediaAccount(id, account);
  }
  async deleteSocialMediaAccount(id) {
    return this.memStorage.deleteSocialMediaAccount(id);
  }
  async getSocialMediaPosts() {
    return this.memStorage.getSocialMediaPosts();
  }
  async getSocialMediaPost(id) {
    return this.memStorage.getSocialMediaPost(id);
  }
  async getSocialMediaPostsByAccount(accountId) {
    return this.memStorage.getSocialMediaPostsByAccount(accountId);
  }
  async createSocialMediaPost(post) {
    return this.memStorage.createSocialMediaPost(post);
  }
  async updateSocialMediaPost(id, post) {
    return this.memStorage.updateSocialMediaPost(id, post);
  }
  async deleteSocialMediaPost(id) {
    return this.memStorage.deleteSocialMediaPost(id);
  }
  async getSocialMediaTemplates() {
    return this.memStorage.getSocialMediaTemplates();
  }
  async getSocialMediaTemplate(id) {
    return this.memStorage.getSocialMediaTemplate(id);
  }
  async createSocialMediaTemplate(template) {
    return this.memStorage.createSocialMediaTemplate(template);
  }
  async updateSocialMediaTemplate(id, template) {
    return this.memStorage.updateSocialMediaTemplate(id, template);
  }
  async deleteSocialMediaTemplate(id) {
    return this.memStorage.deleteSocialMediaTemplate(id);
  }
  async getSocialMediaAnalytics() {
    return this.memStorage.getSocialMediaAnalytics();
  }
  async getSocialMediaAnalyticsForAccount(accountId) {
    return this.memStorage.getSocialMediaAnalyticsForAccount(accountId);
  }
  async createSocialMediaAnalytics(analytics) {
    return this.memStorage.createSocialMediaAnalytics(analytics);
  }
  // Workflows
  async getWorkflows() {
    try {
      const result = await db.select().from(workflows);
      return result;
    } catch (error) {
      console.error("Error fetching workflows from database:", error);
      return [];
    }
  }
  async getWorkflow(id) {
    try {
      const result = await db.select().from(workflows).where(eq(workflows.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching workflow from database:", error);
      return void 0;
    }
  }
  async createWorkflow(workflow) {
    try {
      const result = await db.insert(workflows).values({
        ...workflow,
        id: sql`gen_random_uuid()`,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating workflow in database:", error);
      throw error;
    }
  }
  async updateWorkflow(id, workflow) {
    try {
      const result = await db.update(workflows).set({ ...workflow, updatedAt: /* @__PURE__ */ new Date() }).where(eq(workflows.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating workflow in database:", error);
      return void 0;
    }
  }
  async deleteWorkflow(id) {
    try {
      await db.delete(workflows).where(eq(workflows.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting workflow from database:", error);
      return false;
    }
  }
  async getWorkflowExecutions() {
    return this.memStorage.getWorkflowExecutions();
  }
  async getWorkflowExecution(id) {
    return this.memStorage.getWorkflowExecution(id);
  }
  async getWorkflowExecutionsByWorkflow(workflowId) {
    return this.memStorage.getWorkflowExecutionsByWorkflow(workflowId);
  }
  async getWorkflowExecutionsByContact(contactId) {
    return this.memStorage.getWorkflowExecutionsByContact(contactId);
  }
  async createWorkflowExecution(execution) {
    return this.memStorage.createWorkflowExecution(execution);
  }
  async updateWorkflowExecution(id, execution) {
    return this.memStorage.updateWorkflowExecution(id, execution);
  }
  async getWorkflowTemplates() {
    try {
      const result = await db.select().from(workflowTemplates).orderBy(desc(workflowTemplates.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching workflow templates from database:", error);
      return [];
    }
  }
  async getWorkflowTemplate(id) {
    try {
      const result = await db.select().from(workflowTemplates).where(eq(workflowTemplates.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching workflow template from database:", error);
      return void 0;
    }
  }
  async createWorkflowTemplate(template) {
    try {
      const result = await db.insert(workflowTemplates).values({
        ...template,
        id: sql`gen_random_uuid()`,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating workflow template in database:", error);
      throw error;
    }
  }
  async updateWorkflowTemplate(id, template) {
    try {
      const result = await db.update(workflowTemplates).set({ ...template, updatedAt: /* @__PURE__ */ new Date() }).where(eq(workflowTemplates.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating workflow template in database:", error);
      return void 0;
    }
  }
  async deleteWorkflowTemplate(id) {
    try {
      await db.delete(workflowTemplates).where(eq(workflowTemplates.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting workflow template from database:", error);
      return false;
    }
  }
  async incrementWorkflowTemplateUsage(id) {
    try {
      await db.update(workflowTemplates).set({ usageCount: sql`${workflowTemplates.usageCount} + 1` }).where(eq(workflowTemplates.id, id));
    } catch (error) {
      console.error("Error incrementing workflow template usage:", error);
    }
  }
  // Task Categories
  async getTaskCategories() {
    const result = await db.select({
      id: taskCategories.id,
      name: taskCategories.name,
      description: taskCategories.description,
      color: taskCategories.color,
      icon: taskCategories.icon,
      workflowId: taskCategories.workflowId,
      isDefault: taskCategories.isDefault,
      createdAt: taskCategories.createdAt
    }).from(taskCategories);
    return result;
  }
  async getTaskCategory(id) {
    const result = await db.select({
      id: taskCategories.id,
      name: taskCategories.name,
      description: taskCategories.description,
      color: taskCategories.color,
      icon: taskCategories.icon,
      workflowId: taskCategories.workflowId,
      isDefault: taskCategories.isDefault,
      createdAt: taskCategories.createdAt
    }).from(taskCategories).where(eq(taskCategories.id, id)).limit(1);
    return result[0];
  }
  async createTaskCategory(category) {
    const result = await db.insert(taskCategories).values({
      ...category,
      id: sql`gen_random_uuid()`,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return result[0];
  }
  async updateTaskCategory(id, category) {
    const sanitizedCategory = { ...category };
    if ("workflowId" in sanitizedCategory && (sanitizedCategory.workflowId === "" || sanitizedCategory.workflowId === void 0 || sanitizedCategory.workflowId === "none")) {
      sanitizedCategory.workflowId = null;
    }
    const result = await db.update(taskCategories).set(sanitizedCategory).where(eq(taskCategories.id, id)).returning();
    return result[0];
  }
  async deleteTaskCategory(id) {
    const result = await db.delete(taskCategories).where(eq(taskCategories.id, id)).returning();
    return result.length > 0;
  }
  // Enhanced Tasks  
  async getEnhancedTasks() {
    return this.memStorage.getEnhancedTasks();
  }
  async getEnhancedTask(id) {
    return this.memStorage.getEnhancedTask(id);
  }
  async getEnhancedTasksByClient(clientId) {
    return this.memStorage.getEnhancedTasksByClient(clientId);
  }
  async createEnhancedTask(task) {
    return this.memStorage.createEnhancedTask(task);
  }
  async updateEnhancedTask(id, task) {
    return this.memStorage.updateEnhancedTask(id, task);
  }
  async deleteEnhancedTask(id) {
    return this.memStorage.deleteEnhancedTask(id);
  }
  async createTaskHistory(history) {
    try {
      const result = await db.insert(taskHistory).values(history).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating task history in database:", error);
      throw error;
    }
  }
  // Automation Triggers - Database operations
  async getAutomationTriggers() {
    try {
      const result = await db.select().from(automationTriggers).orderBy(asc(automationTriggers.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching automation triggers from database:", error);
      return [];
    }
  }
  async getAutomationTrigger(id) {
    try {
      const result = await db.select().from(automationTriggers).where(eq(automationTriggers.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching automation trigger from database:", error);
      return void 0;
    }
  }
  async createAutomationTrigger(trigger) {
    try {
      const result = await db.insert(automationTriggers).values(trigger).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating automation trigger in database:", error);
      throw error;
    }
  }
  async updateAutomationTrigger(id, trigger) {
    try {
      const result = await db.update(automationTriggers).set(trigger).where(eq(automationTriggers.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating automation trigger in database:", error);
      return void 0;
    }
  }
  async deleteAutomationTrigger(id) {
    try {
      const result = await db.delete(automationTriggers).where(eq(automationTriggers.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting automation trigger from database:", error);
      return false;
    }
  }
  // Automation Actions - Database operations
  async getAutomationActions() {
    try {
      const result = await db.select().from(automationActions).orderBy(asc(automationActions.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching automation actions from database:", error);
      return [];
    }
  }
  async getAutomationAction(id) {
    try {
      const result = await db.select().from(automationActions).where(eq(automationActions.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching automation action from database:", error);
      return void 0;
    }
  }
  async createAutomationAction(action) {
    try {
      const result = await db.insert(automationActions).values(action).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating automation action in database:", error);
      throw error;
    }
  }
  async updateAutomationAction(id, action) {
    try {
      const result = await db.update(automationActions).set(action).where(eq(automationActions.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating automation action in database:", error);
      return void 0;
    }
  }
  async deleteAutomationAction(id) {
    try {
      const result = await db.delete(automationActions).where(eq(automationActions.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting automation action from database:", error);
      return false;
    }
  }
  // Templates
  async getTemplateFolders() {
    const folders = await db.select({
      id: templateFolders.id,
      name: templateFolders.name,
      description: templateFolders.description,
      type: templateFolders.type,
      parentId: templateFolders.parentId,
      order: templateFolders.order,
      createdAt: templateFolders.createdAt,
      updatedAt: templateFolders.updatedAt
    }).from(templateFolders);
    return folders;
  }
  async getTemplateFolder(id) {
    const folder = await db.select({
      id: templateFolders.id,
      name: templateFolders.name,
      description: templateFolders.description,
      type: templateFolders.type,
      parentId: templateFolders.parentId,
      order: templateFolders.order,
      createdAt: templateFolders.createdAt,
      updatedAt: templateFolders.updatedAt
    }).from(templateFolders).where(eq(templateFolders.id, id)).limit(1);
    return folder[0];
  }
  async createTemplateFolder(folderData) {
    const folder = {
      id: randomUUID(),
      name: folderData.name,
      description: folderData.description || null,
      type: folderData.type,
      parentId: folderData.parentId || null,
      order: folderData.order || 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    await db.insert(templateFolders).values(folder);
    return folder;
  }
  async updateTemplateFolder(id, folderData) {
    const updates = {
      ...folderData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    await db.update(templateFolders).set(updates).where(eq(templateFolders.id, id));
    return this.getTemplateFolder(id);
  }
  async deleteTemplateFolder(id) {
    const result = await db.delete(templateFolders).where(eq(templateFolders.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async getEmailTemplates() {
    return await db.select({
      id: emailTemplates.id,
      name: emailTemplates.name,
      subject: emailTemplates.subject,
      content: emailTemplates.content,
      plainTextContent: emailTemplates.plainTextContent,
      previewText: emailTemplates.previewText,
      folderId: emailTemplates.folderId,
      tags: emailTemplates.tags,
      isPublic: emailTemplates.isPublic,
      usageCount: emailTemplates.usageCount,
      lastUsed: emailTemplates.lastUsed,
      createdBy: emailTemplates.createdBy,
      createdAt: emailTemplates.createdAt,
      updatedAt: emailTemplates.updatedAt
    }).from(emailTemplates).orderBy(asc(emailTemplates.name));
  }
  async getEmailTemplate(id) {
    const results = await db.select({
      id: emailTemplates.id,
      name: emailTemplates.name,
      subject: emailTemplates.subject,
      content: emailTemplates.content,
      plainTextContent: emailTemplates.plainTextContent,
      previewText: emailTemplates.previewText,
      folderId: emailTemplates.folderId,
      tags: emailTemplates.tags,
      isPublic: emailTemplates.isPublic,
      usageCount: emailTemplates.usageCount,
      lastUsed: emailTemplates.lastUsed,
      createdBy: emailTemplates.createdBy,
      createdAt: emailTemplates.createdAt,
      updatedAt: emailTemplates.updatedAt
    }).from(emailTemplates).where(eq(emailTemplates.id, id));
    return results[0];
  }
  async getEmailTemplatesByFolder(folderId) {
    return await db.select({
      id: emailTemplates.id,
      name: emailTemplates.name,
      subject: emailTemplates.subject,
      content: emailTemplates.content,
      plainTextContent: emailTemplates.plainTextContent,
      previewText: emailTemplates.previewText,
      folderId: emailTemplates.folderId,
      tags: emailTemplates.tags,
      isPublic: emailTemplates.isPublic,
      usageCount: emailTemplates.usageCount,
      lastUsed: emailTemplates.lastUsed,
      createdBy: emailTemplates.createdBy,
      createdAt: emailTemplates.createdAt,
      updatedAt: emailTemplates.updatedAt
    }).from(emailTemplates).where(eq(emailTemplates.folderId, folderId));
  }
  async createEmailTemplate(template) {
    const result = await db.insert(emailTemplates).values({
      ...template,
      id: sql`gen_random_uuid()`,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return result[0];
  }
  async updateEmailTemplate(id, template) {
    const updatedTemplate = { ...template, updatedAt: /* @__PURE__ */ new Date() };
    await db.update(emailTemplates).set(updatedTemplate).where(eq(emailTemplates.id, id));
    return await this.getEmailTemplate(id);
  }
  async deleteEmailTemplate(id) {
    const result = await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Scheduled Emails
  async getScheduledEmails() {
    try {
      const result = await db.select({
        id: scheduledEmails.id,
        clientId: scheduledEmails.clientId,
        fromUserId: scheduledEmails.fromUserId,
        toEmail: scheduledEmails.toEmail,
        ccEmails: scheduledEmails.ccEmails,
        bccEmails: scheduledEmails.bccEmails,
        subject: scheduledEmails.subject,
        content: scheduledEmails.content,
        plainTextContent: scheduledEmails.plainTextContent,
        templateId: scheduledEmails.templateId,
        scheduledFor: scheduledEmails.scheduledFor,
        timezone: scheduledEmails.timezone,
        status: scheduledEmails.status,
        sentAt: scheduledEmails.sentAt,
        failureReason: scheduledEmails.failureReason,
        retryCount: scheduledEmails.retryCount,
        createdAt: scheduledEmails.createdAt,
        updatedAt: scheduledEmails.updatedAt
      }).from(scheduledEmails).orderBy(desc(scheduledEmails.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching scheduled emails:", error);
      return [];
    }
  }
  async getScheduledEmail(id) {
    try {
      const result = await db.select({
        id: scheduledEmails.id,
        clientId: scheduledEmails.clientId,
        fromUserId: scheduledEmails.fromUserId,
        toEmail: scheduledEmails.toEmail,
        ccEmails: scheduledEmails.ccEmails,
        bccEmails: scheduledEmails.bccEmails,
        subject: scheduledEmails.subject,
        content: scheduledEmails.content,
        plainTextContent: scheduledEmails.plainTextContent,
        templateId: scheduledEmails.templateId,
        scheduledFor: scheduledEmails.scheduledFor,
        timezone: scheduledEmails.timezone,
        status: scheduledEmails.status,
        sentAt: scheduledEmails.sentAt,
        failureReason: scheduledEmails.failureReason,
        retryCount: scheduledEmails.retryCount,
        createdAt: scheduledEmails.createdAt,
        updatedAt: scheduledEmails.updatedAt
      }).from(scheduledEmails).where(eq(scheduledEmails.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching scheduled email:", error);
      return void 0;
    }
  }
  async getScheduledEmailsByClient(clientId) {
    try {
      const result = await db.select({
        id: scheduledEmails.id,
        clientId: scheduledEmails.clientId,
        fromUserId: scheduledEmails.fromUserId,
        toEmail: scheduledEmails.toEmail,
        ccEmails: scheduledEmails.ccEmails,
        bccEmails: scheduledEmails.bccEmails,
        subject: scheduledEmails.subject,
        content: scheduledEmails.content,
        plainTextContent: scheduledEmails.plainTextContent,
        templateId: scheduledEmails.templateId,
        scheduledFor: scheduledEmails.scheduledFor,
        timezone: scheduledEmails.timezone,
        status: scheduledEmails.status,
        sentAt: scheduledEmails.sentAt,
        failureReason: scheduledEmails.failureReason,
        retryCount: scheduledEmails.retryCount,
        createdAt: scheduledEmails.createdAt,
        updatedAt: scheduledEmails.updatedAt
      }).from(scheduledEmails).where(eq(scheduledEmails.clientId, clientId)).orderBy(desc(scheduledEmails.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching scheduled emails for client:", error);
      return [];
    }
  }
  async createScheduledEmail(scheduledEmail) {
    const result = await db.insert(scheduledEmails).values({
      ...scheduledEmail,
      id: sql`gen_random_uuid()`,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return result[0];
  }
  async updateScheduledEmail(id, scheduledEmail) {
    const updatedEmail = { ...scheduledEmail, updatedAt: /* @__PURE__ */ new Date() };
    await db.update(scheduledEmails).set(updatedEmail).where(eq(scheduledEmails.id, id));
    return await this.getScheduledEmail(id);
  }
  async deleteScheduledEmail(id) {
    const result = await db.delete(scheduledEmails).where(eq(scheduledEmails.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async markScheduledEmailAsSent(id, sentAt) {
    await db.update(scheduledEmails).set({
      status: "sent",
      sentAt,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(scheduledEmails.id, id));
  }
  async markScheduledEmailAsFailed(id, failureReason) {
    const existing = await this.getScheduledEmail(id);
    await db.update(scheduledEmails).set({
      status: "failed",
      failureReason,
      retryCount: (existing?.retryCount || 0) + 1,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(scheduledEmails.id, id));
  }
  async getSmsTemplates() {
    const result = await db.select({
      id: smsTemplates.id,
      name: smsTemplates.name,
      content: smsTemplates.content,
      folderId: smsTemplates.folderId,
      tags: smsTemplates.tags,
      isPublic: smsTemplates.isPublic,
      usageCount: smsTemplates.usageCount,
      lastUsed: smsTemplates.lastUsed,
      createdBy: smsTemplates.createdBy,
      createdAt: smsTemplates.createdAt,
      updatedAt: smsTemplates.updatedAt
    }).from(smsTemplates);
    return result;
  }
  async getSmsTemplate(id) {
    const result = await db.select({
      id: smsTemplates.id,
      name: smsTemplates.name,
      content: smsTemplates.content,
      folderId: smsTemplates.folderId,
      tags: smsTemplates.tags,
      isPublic: smsTemplates.isPublic,
      usageCount: smsTemplates.usageCount,
      lastUsed: smsTemplates.lastUsed,
      createdBy: smsTemplates.createdBy,
      createdAt: smsTemplates.createdAt,
      updatedAt: smsTemplates.updatedAt
    }).from(smsTemplates).where(eq(smsTemplates.id, id)).limit(1);
    return result[0];
  }
  async getSmsTemplatesByFolder(folderId) {
    return await db.select({
      id: smsTemplates.id,
      name: smsTemplates.name,
      content: smsTemplates.content,
      folderId: smsTemplates.folderId,
      tags: smsTemplates.tags,
      isPublic: smsTemplates.isPublic,
      usageCount: smsTemplates.usageCount,
      lastUsed: smsTemplates.lastUsed,
      createdBy: smsTemplates.createdBy,
      createdAt: smsTemplates.createdAt,
      updatedAt: smsTemplates.updatedAt
    }).from(smsTemplates).where(eq(smsTemplates.folderId, folderId));
  }
  async createSmsTemplate(template) {
    const result = await db.insert(smsTemplates).values({
      ...template,
      id: sql`gen_random_uuid()`,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return result[0];
  }
  async updateSmsTemplate(id, template) {
    const result = await db.update(smsTemplates).set({
      ...template,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(smsTemplates.id, id)).returning();
    return result[0];
  }
  async deleteSmsTemplate(id) {
    const result = await db.delete(smsTemplates).where(eq(smsTemplates.id, id)).returning();
    return result.length > 0;
  }
  // Custom Fields - Database implementation
  async getCustomFields() {
    try {
      const result = await db.select().from(customFields).orderBy(asc(customFields.order));
      return result;
    } catch (error) {
      console.error("Error fetching custom fields from database:", error);
      return [];
    }
  }
  async getCustomField(id) {
    try {
      const result = await db.select().from(customFields).where(eq(customFields.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching custom field from database:", error);
      return void 0;
    }
  }
  async createCustomField(field) {
    try {
      const result = await db.insert(customFields).values({
        ...field,
        id: sql`gen_random_uuid()`,
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating custom field in database:", error);
      throw error;
    }
  }
  async updateCustomField(id, field) {
    try {
      const result = await db.update(customFields).set(field).where(eq(customFields.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating custom field in database:", error);
      return void 0;
    }
  }
  async deleteCustomField(id) {
    try {
      const result = await db.delete(customFields).where(eq(customFields.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting custom field from database:", error);
      return false;
    }
  }
  async reorderCustomFields(fieldOrders) {
    try {
      for (const { id, order } of fieldOrders) {
        await db.update(customFields).set({ order }).where(eq(customFields.id, id));
      }
    } catch (error) {
      console.error("Error reordering custom fields:", error);
      throw error;
    }
  }
  async getCustomFieldFolders() {
    try {
      const result = await db.select().from(customFieldFolders).orderBy(asc(customFieldFolders.order));
      return result;
    } catch (error) {
      console.error("Error fetching custom field folders from database:", error);
      return [];
    }
  }
  async getCustomFieldFolder(id) {
    try {
      const result = await db.select().from(customFieldFolders).where(eq(customFieldFolders.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching custom field folder from database:", error);
      return void 0;
    }
  }
  async createCustomFieldFolder(folder) {
    try {
      const result = await db.insert(customFieldFolders).values({
        ...folder,
        id: sql`gen_random_uuid()`,
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating custom field folder in database:", error);
      throw error;
    }
  }
  async updateCustomFieldFolder(id, folder) {
    try {
      const result = await db.update(customFieldFolders).set(folder).where(eq(customFieldFolders.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating custom field folder in database:", error);
      return void 0;
    }
  }
  async deleteCustomFieldFolder(id) {
    try {
      const result = await db.delete(customFieldFolders).where(eq(customFieldFolders.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting custom field folder from database:", error);
      return false;
    }
  }
  async reorderCustomFieldFolders(folderOrders) {
    try {
      for (const { id, order } of folderOrders) {
        await db.update(customFieldFolders).set({ order }).where(eq(customFieldFolders.id, id));
      }
    } catch (error) {
      console.error("Error reordering custom field folders:", error);
      throw error;
    }
  }
  // Staff
  async getStaff() {
    const result = await db.select().from(staff).orderBy(asc(staff.firstName), asc(staff.lastName));
    return result;
  }
  async getStaffMember(id) {
    const result = await db.select().from(staff).where(eq(staff.id, id));
    return result[0];
  }
  async createStaffMember(staffData) {
    const result = await db.insert(staff).values(staffData).returning();
    return result[0];
  }
  async updateStaffMember(id, staffData) {
    const result = await db.update(staff).set({
      ...staffData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(staff.id, id)).returning();
    return result[0];
  }
  async deleteStaffMember(id) {
    const result = await db.delete(staff).where(eq(staff.id, id)).returning();
    return result.length > 0;
  }
  // Team Positions
  async getTeamPositions() {
    const result = await db.select().from(teamPositions).where(eq(teamPositions.isActive, true)).orderBy(asc(teamPositions.order), asc(teamPositions.label));
    return result;
  }
  async getTeamPosition(id) {
    const result = await db.select().from(teamPositions).where(eq(teamPositions.id, id));
    return result[0];
  }
  async createTeamPosition(positionData) {
    const result = await db.insert(teamPositions).values(positionData).returning();
    return result[0];
  }
  async updateTeamPosition(id, positionData) {
    const result = await db.update(teamPositions).set({
      ...positionData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(teamPositions.id, id)).returning();
    return result[0];
  }
  async deleteTeamPosition(id) {
    const result = await db.delete(teamPositions).where(eq(teamPositions.id, id)).returning();
    return result.length > 0;
  }
  async reorderTeamPositions(positions2) {
    try {
      await db.transaction(async (tx) => {
        for (const position of positions2) {
          await tx.update(teamPositions).set({
            order: position.order,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(teamPositions.id, position.id));
        }
      });
      return true;
    } catch (error) {
      console.error("Error reordering team positions:", error);
      return false;
    }
  }
  // Client Team Assignments
  async getClientTeamAssignments(clientId) {
    const result = await db.select({
      id: clientTeamAssignments.id,
      clientId: clientTeamAssignments.clientId,
      staffId: clientTeamAssignments.staffId,
      position: clientTeamAssignments.position,
      assignedAt: clientTeamAssignments.assignedAt,
      assignedBy: clientTeamAssignments.assignedBy,
      createdAt: clientTeamAssignments.createdAt,
      updatedAt: clientTeamAssignments.updatedAt,
      positionDetails: teamPositions,
      staffMember: staff
    }).from(clientTeamAssignments).leftJoin(teamPositions, eq(clientTeamAssignments.position, teamPositions.id)).leftJoin(staff, eq(clientTeamAssignments.staffId, staff.id)).where(eq(clientTeamAssignments.clientId, clientId)).orderBy(asc(teamPositions.order));
    return result.map((row) => ({
      ...row,
      position: row.positionDetails
    }));
  }
  async getTeamAssignments() {
    const result = await db.select({
      id: clientTeamAssignments.id,
      clientId: clientTeamAssignments.clientId,
      staffId: clientTeamAssignments.staffId,
      position: clientTeamAssignments.position,
      assignedAt: clientTeamAssignments.assignedAt,
      assignedBy: clientTeamAssignments.assignedBy,
      createdAt: clientTeamAssignments.createdAt,
      updatedAt: clientTeamAssignments.updatedAt,
      positionDetails: teamPositions,
      staffMember: staff
    }).from(clientTeamAssignments).leftJoin(teamPositions, eq(clientTeamAssignments.position, teamPositions.id)).leftJoin(staff, eq(clientTeamAssignments.staffId, staff.id)).orderBy(asc(teamPositions.order));
    return result.map((row) => ({
      ...row,
      position: row.positionDetails
    }));
  }
  async createClientTeamAssignment(assignmentData) {
    const result = await db.insert(clientTeamAssignments).values(assignmentData).returning();
    return result[0];
  }
  async updateClientTeamAssignment(id, assignmentData) {
    const result = await db.update(clientTeamAssignments).set({
      ...assignmentData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(clientTeamAssignments.id, id)).returning();
    return result[0];
  }
  async deleteClientTeamAssignment(id) {
    const result = await db.delete(clientTeamAssignments).where(eq(clientTeamAssignments.id, id)).returning();
    return result.length > 0;
  }
  async getClientTeamAssignmentsList() {
    const result = await db.select({
      id: clientTeamAssignments.id,
      clientId: clientTeamAssignments.clientId,
      staffId: clientTeamAssignments.staffId,
      positionId: clientTeamAssignments.position,
      assignedAt: clientTeamAssignments.assignedAt,
      assignedBy: clientTeamAssignments.assignedBy,
      clientName: clients.name,
      staffFirstName: staff.firstName,
      staffLastName: staff.lastName,
      positionLabel: teamPositions.label,
      positionKey: teamPositions.key
    }).from(clientTeamAssignments).leftJoin(clients, eq(clientTeamAssignments.clientId, clients.id)).leftJoin(staff, eq(clientTeamAssignments.staffId, staff.id)).leftJoin(teamPositions, eq(clientTeamAssignments.position, teamPositions.id)).orderBy(asc(clients.name), asc(teamPositions.order));
    return result;
  }
  // Departments
  async getDepartments() {
    const result = await db.select().from(departments).orderBy(asc(departments.name));
    return result;
  }
  async getDepartment(id) {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    return result[0];
  }
  async createDepartment(department) {
    const result = await db.insert(departments).values(department).returning();
    return result[0];
  }
  async updateDepartment(id, department) {
    const result = await db.update(departments).set({ ...department, updatedAt: /* @__PURE__ */ new Date() }).where(eq(departments.id, id)).returning();
    return result[0];
  }
  async deleteDepartment(id) {
    try {
      await db.delete(departments).where(eq(departments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting department:", error);
      return false;
    }
  }
  // Positions
  async getPositions() {
    const result = await db.select().from(positions).orderBy(asc(positions.name));
    return result;
  }
  async getPosition(id) {
    const result = await db.select().from(positions).where(eq(positions.id, id));
    return result[0];
  }
  async getPositionsByDepartment(departmentId) {
    const result = await db.select().from(positions).where(eq(positions.departmentId, departmentId)).orderBy(asc(positions.name));
    return result;
  }
  async createPosition(position) {
    const result = await db.insert(positions).values(position).returning();
    return result[0];
  }
  async updatePosition(id, position) {
    const result = await db.update(positions).set({ ...position, updatedAt: /* @__PURE__ */ new Date() }).where(eq(positions.id, id)).returning();
    return result[0];
  }
  async deletePosition(id) {
    try {
      await db.delete(positions).where(eq(positions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting position:", error);
      return false;
    }
  }
  // Position KPIs
  async getPositionKpis(positionId) {
    const result = await db.select().from(positionKpis).where(eq(positionKpis.positionId, positionId)).orderBy(asc(positionKpis.createdAt));
    return result;
  }
  async getPositionKpi(id) {
    const result = await db.select().from(positionKpis).where(eq(positionKpis.id, id));
    return result[0];
  }
  async createPositionKpi(kpi) {
    const result = await db.insert(positionKpis).values(kpi).returning();
    return result[0];
  }
  async updatePositionKpi(id, kpi) {
    const result = await db.update(positionKpis).set({ ...kpi, updatedAt: /* @__PURE__ */ new Date() }).where(eq(positionKpis.id, id)).returning();
    return result[0];
  }
  async deletePositionKpi(id) {
    try {
      await db.delete(positionKpis).where(eq(positionKpis.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting position KPI:", error);
      return false;
    }
  }
  // Organization Chart Structures
  async getOrgChartStructures() {
    const result = await db.select().from(orgChartStructures).orderBy(desc(orgChartStructures.createdAt));
    return result;
  }
  async getOrgChartStructure(id) {
    const result = await db.select().from(orgChartStructures).where(eq(orgChartStructures.id, id));
    return result[0];
  }
  async getActiveOrgChartStructure() {
    const result = await db.select().from(orgChartStructures).where(eq(orgChartStructures.isActive, true));
    return result[0];
  }
  async createOrgChartStructure(structure) {
    const result = await db.insert(orgChartStructures).values(structure).returning();
    return result[0];
  }
  async updateOrgChartStructure(id, structure) {
    const result = await db.update(orgChartStructures).set({ ...structure, updatedAt: /* @__PURE__ */ new Date() }).where(eq(orgChartStructures.id, id)).returning();
    return result[0];
  }
  async deleteOrgChartStructure(id) {
    try {
      await db.delete(orgChartStructures).where(eq(orgChartStructures.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting org chart structure:", error);
      return false;
    }
  }
  async setActiveOrgChartStructure(id) {
    await db.update(orgChartStructures).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() });
    const result = await db.update(orgChartStructures).set({ isActive: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(orgChartStructures.id, id)).returning();
    return result[0];
  }
  // Organization Chart Nodes
  async getOrgChartNodes(structureId) {
    const result = await db.select().from(orgChartNodes).where(eq(orgChartNodes.structureId, structureId)).orderBy(asc(orgChartNodes.orderIndex));
    return result;
  }
  async getOrgChartNode(id) {
    const result = await db.select().from(orgChartNodes).where(eq(orgChartNodes.id, id));
    return result[0];
  }
  async createOrgChartNode(node) {
    const result = await db.insert(orgChartNodes).values(node).returning();
    return result[0];
  }
  async updateOrgChartNode(id, node) {
    const result = await db.update(orgChartNodes).set({ ...node, updatedAt: /* @__PURE__ */ new Date() }).where(eq(orgChartNodes.id, id)).returning();
    return result[0];
  }
  async deleteOrgChartNode(id) {
    try {
      await db.delete(orgChartNodes).where(eq(orgChartNodes.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting org chart node:", error);
      return false;
    }
  }
  async reorderOrgChartNodes(updates) {
    for (const update of updates) {
      await db.update(orgChartNodes).set({
        orderIndex: update.orderIndex,
        parentId: update.parentId !== void 0 ? update.parentId : void 0,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(orgChartNodes.id, update.id));
    }
  }
  // Organization Chart Node Assignments
  async getOrgChartNodeAssignments(nodeId) {
    const result = await db.select({
      id: orgChartNodeAssignments.id,
      nodeId: orgChartNodeAssignments.nodeId,
      staffId: orgChartNodeAssignments.staffId,
      assignmentType: orgChartNodeAssignments.assignmentType,
      effectiveDate: orgChartNodeAssignments.effectiveDate,
      notes: orgChartNodeAssignments.notes,
      createdAt: orgChartNodeAssignments.createdAt,
      updatedAt: orgChartNodeAssignments.updatedAt,
      staff
    }).from(orgChartNodeAssignments).leftJoin(staff, eq(orgChartNodeAssignments.staffId, staff.id)).where(eq(orgChartNodeAssignments.nodeId, nodeId));
    return result;
  }
  async getAllOrgChartAssignments(structureId) {
    const result = await db.select({
      id: orgChartNodeAssignments.id,
      nodeId: orgChartNodeAssignments.nodeId,
      staffId: orgChartNodeAssignments.staffId,
      assignmentType: orgChartNodeAssignments.assignmentType,
      effectiveDate: orgChartNodeAssignments.effectiveDate,
      notes: orgChartNodeAssignments.notes,
      createdAt: orgChartNodeAssignments.createdAt,
      updatedAt: orgChartNodeAssignments.updatedAt,
      staff,
      node: orgChartNodes
    }).from(orgChartNodeAssignments).leftJoin(staff, eq(orgChartNodeAssignments.staffId, staff.id)).leftJoin(orgChartNodes, eq(orgChartNodeAssignments.nodeId, orgChartNodes.id)).where(eq(orgChartNodes.structureId, structureId));
    return result;
  }
  async createOrgChartNodeAssignment(assignment) {
    const result = await db.insert(orgChartNodeAssignments).values(assignment).returning();
    return result[0];
  }
  async updateOrgChartNodeAssignment(id, assignment) {
    const result = await db.update(orgChartNodeAssignments).set({ ...assignment, updatedAt: /* @__PURE__ */ new Date() }).where(eq(orgChartNodeAssignments.id, id)).returning();
    return result[0];
  }
  async deleteOrgChartNodeAssignment(id) {
    try {
      await db.delete(orgChartNodeAssignments).where(eq(orgChartNodeAssignments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting org chart node assignment:", error);
      return false;
    }
  }
  // Tags
  async getTags() {
    const result = await db.select().from(tags);
    return result;
  }
  async getTag(id) {
    const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
    return result[0];
  }
  async createTag(tag) {
    const result = await db.insert(tags).values({
      ...tag,
      id: sql`gen_random_uuid()`,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return result[0];
  }
  async updateTag(id, tag) {
    const result = await db.update(tags).set({
      ...tag,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(tags.id, id)).returning();
    return result[0];
  }
  async deleteTag(id) {
    const result = await db.delete(tags).where(eq(tags.id, id)).returning();
    return result.length > 0;
  }
  // Products - Database implementation
  async getProducts() {
    try {
      const result = await db.select().from(products).orderBy(asc(products.name));
      return result;
    } catch (error) {
      console.error("Error fetching products from database:", error);
      return [];
    }
  }
  async getProduct(id) {
    try {
      const result = await db.select().from(products).where(eq(products.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching product from database:", error);
      return void 0;
    }
  }
  async createProduct(product) {
    try {
      const result = await db.insert(products).values({
        ...product,
        id: sql`gen_random_uuid()`,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating product in database:", error);
      throw error;
    }
  }
  async updateProduct(id, product) {
    try {
      const result = await db.update(products).set({
        ...product,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(products.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating product in database:", error);
      return void 0;
    }
  }
  async deleteProduct(id) {
    try {
      const result = await db.delete(products).where(eq(products.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting product from database:", error);
      return false;
    }
  }
  // SECURITY: Audit Logs - MUST use database for security compliance
  async getAuditLogs() {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }
  async getAuditLog(id) {
    const result = await db.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1);
    return result[0];
  }
  async getAuditLogsByEntity(entityType, entityId) {
    return await db.select().from(auditLogs).where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId))).orderBy(desc(auditLogs.createdAt));
  }
  async getAuditLogsByUser(userId) {
    return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt));
  }
  async createAuditLog(auditLog) {
    const [newAuditLog] = await db.insert(auditLogs).values({
      id: randomUUID(),
      ...auditLog,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return newAuditLog;
  }
  // SECURITY: Roles and Permissions - MUST use database for security compliance
  async getRoles() {
    return await db.select().from(roles).orderBy(roles.name);
  }
  async getRole(id) {
    const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return result[0];
  }
  async createRole(role) {
    const [newRole] = await db.insert(roles).values({
      id: randomUUID(),
      ...role,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newRole;
  }
  async updateRole(id, role) {
    const [updatedRole] = await db.update(roles).set({ ...role, updatedAt: /* @__PURE__ */ new Date() }).where(eq(roles.id, id)).returning();
    return updatedRole;
  }
  async deleteRole(id) {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return result.rowCount > 0;
  }
  async getPermissions() {
    return await db.select().from(permissions).orderBy(permissions.module, permissions.roleId);
  }
  async getPermission(id) {
    const result = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1);
    return result[0];
  }
  async createPermission(permission) {
    const [newPermission] = await db.insert(permissions).values({
      id: randomUUID(),
      ...permission,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newPermission;
  }
  async updatePermission(id, permission) {
    const [updatedPermission] = await db.update(permissions).set({ ...permission, updatedAt: /* @__PURE__ */ new Date() }).where(eq(permissions.id, id)).returning();
    return updatedPermission;
  }
  async deletePermission(id) {
    const result = await db.delete(permissions).where(eq(permissions.id, id));
    return result.rowCount > 0;
  }
  async getUserRoles() {
    return await db.select().from(userRoles).orderBy(userRoles.userId, userRoles.roleId);
  }
  async getUserRole(id) {
    const result = await db.select().from(userRoles).where(eq(userRoles.id, id)).limit(1);
    return result[0];
  }
  async getUserRolesByUser(userId) {
    return await db.select().from(userRoles).where(eq(userRoles.userId, userId));
  }
  async getUserRolesByRole(roleId) {
    return await db.select().from(userRoles).where(eq(userRoles.roleId, roleId));
  }
  async createUserRole(userRole) {
    const [newUserRole] = await db.insert(userRoles).values({
      id: randomUUID(),
      ...userRole,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return newUserRole;
  }
  async updateUserRole(id, userRole) {
    const [updatedUserRole] = await db.update(userRoles).set({ ...userRole, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userRoles.id, id)).returning();
    return updatedUserRole;
  }
  async deleteUserRole(id) {
    const result = await db.delete(userRoles).where(eq(userRoles.id, id));
    return result.rowCount > 0;
  }
  // Notifications - Database Implementation
  async getNotifications(userId) {
    try {
      const result = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
      return result;
    } catch (error) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
      return [];
    }
  }
  async getNotification(id) {
    try {
      const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
      return result.length > 0 ? result[0] : void 0;
    } catch (error) {
      console.error(`Error fetching notification ${id}:`, error);
      return void 0;
    }
  }
  async getUnreadNotifications(userId) {
    try {
      const result = await db.select().from(notifications).where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      )).orderBy(desc(notifications.createdAt));
      return result;
    } catch (error) {
      console.error(`Error fetching unread notifications for user ${userId}:`, error);
      return [];
    }
  }
  async createNotification(notificationData) {
    const [created] = await db.insert(notifications).values({
      id: randomUUID(),
      ...notificationData,
      read: false,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return created;
  }
  async markNotificationAsRead(id) {
    try {
      const result = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      return false;
    }
  }
  async markAllNotificationsAsRead(userId) {
    try {
      const result = await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error marking all notifications as read for user ${userId}:`, error);
      return false;
    }
  }
  async deleteNotification(id) {
    try {
      const result = await db.delete(notifications).where(eq(notifications.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      return false;
    }
  }
  // Notification Settings - Database Implementation
  async getNotificationSettings(userId) {
    try {
      const result = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId)).limit(1);
      return result.length > 0 ? result[0] : void 0;
    } catch (error) {
      console.error(`Error fetching notification settings for user ${userId}:`, error);
      return void 0;
    }
  }
  async createNotificationSettings(settings) {
    const [created] = await db.insert(notificationSettings).values({
      id: randomUUID(),
      ...settings,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return created;
  }
  async updateNotificationSettings(userId, settings) {
    const [updated] = await db.update(notificationSettings).set({ ...settings, updatedAt: /* @__PURE__ */ new Date() }).where(eq(notificationSettings.userId, userId)).returning();
    return updated;
  }
  // Sales Settings - Database Implementation
  async getSalesSettings() {
    try {
      const result = await db.select().from(salesSettings).limit(1);
      if (result.length === 0) {
        const [defaultSettings] = await db.insert(salesSettings).values({
          id: randomUUID(),
          minimumMarginThreshold: "35.00",
          updatedAt: /* @__PURE__ */ new Date()
        }).returning();
        return defaultSettings;
      }
      return result[0];
    } catch (error) {
      console.error("Error getting sales settings:", error);
      return void 0;
    }
  }
  async updateSalesSettings(settings) {
    try {
      const existing = await this.getSalesSettings();
      if (!existing) {
        throw new Error("Sales settings not found");
      }
      const [updated] = await db.update(salesSettings).set({
        ...settings,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(salesSettings.id, existing.id)).returning();
      return updated;
    } catch (error) {
      console.error("Error updating sales settings:", error);
      throw error;
    }
  }
  // Sales Targets - Database Implementation
  async getSalesTargets() {
    try {
      const result = await db.select().from(salesTargets).orderBy(desc(salesTargets.year), desc(salesTargets.month));
      return result;
    } catch (error) {
      console.error("Error getting sales targets:", error);
      return [];
    }
  }
  async getSalesTarget(id) {
    try {
      const result = await db.select().from(salesTargets).where(eq(salesTargets.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting sales target:", error);
      return void 0;
    }
  }
  async getSalesTargetByMonth(year, month) {
    try {
      const result = await db.select().from(salesTargets).where(and(eq(salesTargets.year, year), eq(salesTargets.month, month))).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting sales target by month:", error);
      return void 0;
    }
  }
  async createSalesTarget(target) {
    try {
      const [created] = await db.insert(salesTargets).values({
        id: randomUUID(),
        ...target,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return created;
    } catch (error) {
      console.error("Error creating sales target:", error);
      throw error;
    }
  }
  async updateSalesTarget(id, target) {
    try {
      const [updated] = await db.update(salesTargets).set({
        ...target,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(salesTargets.id, id)).returning();
      return updated;
    } catch (error) {
      console.error("Error updating sales target:", error);
      return void 0;
    }
  }
  async deleteSalesTarget(id) {
    try {
      const result = await db.delete(salesTargets).where(eq(salesTargets.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting sales target:", error);
      return false;
    }
  }
  // Smart Lists - Database Implementation  
  async getSmartLists(userId, entityType) {
    try {
      let query = db.select().from(smartLists);
      if (entityType) {
        query = query.where(eq(smartLists.entityType, entityType));
      }
      const allLists = await query;
      return allLists.filter((list) => {
        if (list.visibility === "universal") return true;
        if (list.visibility === "personal") return list.createdBy === userId;
        if (list.visibility === "shared") {
          return list.createdBy === userId || list.sharedWith && list.sharedWith.includes(userId);
        }
        return false;
      });
    } catch (error) {
      console.error("Error getting smart lists:", error);
      return [];
    }
  }
  async getSmartList(id) {
    try {
      const result = await db.select().from(smartLists).where(eq(smartLists.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting smart list:", error);
      return void 0;
    }
  }
  async createSmartList(smartList) {
    try {
      const result = await db.insert(smartLists).values({
        ...smartList,
        id: randomUUID(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating smart list:", error);
      throw error;
    }
  }
  async updateSmartList(id, smartList) {
    try {
      const result = await db.update(smartLists).set({ ...smartList, updatedAt: /* @__PURE__ */ new Date() }).where(eq(smartLists.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating smart list:", error);
      return void 0;
    }
  }
  async deleteSmartList(id) {
    try {
      await db.delete(smartLists).where(eq(smartLists.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting smart list:", error);
      return false;
    }
  }
  // Client Brief Sections Management
  async listBriefSections() {
    try {
      return await db.select().from(clientBriefSections).orderBy(asc(clientBriefSections.displayOrder), asc(clientBriefSections.createdAt));
    } catch (error) {
      console.error("Error listing brief sections:", error);
      return [];
    }
  }
  async getBriefSection(id) {
    try {
      const result = await db.select().from(clientBriefSections).where(eq(clientBriefSections.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting brief section:", error);
      throw error;
    }
  }
  async getBriefSectionByKey(key) {
    try {
      const result = await db.select().from(clientBriefSections).where(eq(clientBriefSections.key, key)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting brief section by key:", error);
      throw error;
    }
  }
  async createBriefSection(section) {
    try {
      const result = await db.insert(clientBriefSections).values(section).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating brief section:", error);
      throw error;
    }
  }
  async updateBriefSection(id, sectionData) {
    try {
      const result = await db.update(clientBriefSections).set({ ...sectionData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clientBriefSections.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating brief section:", error);
      throw error;
    }
  }
  async deleteBriefSection(id) {
    try {
      const section = await db.select().from(clientBriefSections).where(eq(clientBriefSections.id, id)).limit(1);
      if (section.length === 0) return false;
      if (section[0].isCoreSection) {
        throw new Error("Cannot delete core client brief section");
      }
      await db.delete(clientBriefSections).where(eq(clientBriefSections.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting brief section:", error);
      throw error;
    }
  }
  async reorderBriefSections(sectionIds) {
    try {
      const promises = sectionIds.map(
        (id, index) => db.update(clientBriefSections).set({ displayOrder: index, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clientBriefSections.id, id))
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Error reordering brief sections:", error);
      throw error;
    }
  }
  async getClientBrief(clientId) {
    try {
      const sections = await this.listBriefSections();
      const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      const customValues = await db.select().from(clientBriefValues).where(eq(clientBriefValues.clientId, clientId));
      return sections.map((section) => {
        let value = void 0;
        if (client && section.key && section.isCoreSection) {
          switch (section.key) {
            case "background":
              value = client.briefBackground || void 0;
              break;
            case "objectives":
              value = client.briefObjectives || void 0;
              break;
            case "brand_info":
              value = client.briefBrandInfo || void 0;
              break;
            case "audience_info":
              value = client.briefAudienceInfo || void 0;
              break;
            case "products_services":
              value = client.briefProductsServices || void 0;
              break;
            case "competitors":
              value = client.briefCompetitors || void 0;
              break;
            case "marketing_tech":
              value = client.briefMarketingTech || void 0;
              break;
            case "miscellaneous":
              value = client.briefMiscellaneous || void 0;
              break;
          }
        }
        if (!value) {
          const customValue = customValues.find((cv) => cv.sectionId === section.id);
          value = customValue?.value;
        }
        return {
          ...section,
          value
        };
      });
    } catch (error) {
      console.error("Error getting client brief:", error);
      throw error;
    }
  }
  async setClientBriefValue(clientId, sectionId, value) {
    try {
      const section = await this.getBriefSection(sectionId);
      if (!section) {
        throw new Error("Section not found");
      }
      if (section.key && section.isCoreSection) {
        const updateData = {};
        switch (section.key) {
          case "background":
            updateData.briefBackground = value;
            break;
          case "objectives":
            updateData.briefObjectives = value;
            break;
          case "brand_info":
            updateData.briefBrandInfo = value;
            break;
          case "audience_info":
            updateData.briefAudienceInfo = value;
            break;
          case "products_services":
            updateData.briefProductsServices = value;
            break;
          case "competitors":
            updateData.briefCompetitors = value;
            break;
          case "marketing_tech":
            updateData.briefMarketingTech = value;
            break;
          case "miscellaneous":
            updateData.briefMiscellaneous = value;
            break;
        }
        await this.updateClient(clientId, updateData);
      } else {
        const existing = await db.select().from(clientBriefValues).where(and(
          eq(clientBriefValues.clientId, clientId),
          eq(clientBriefValues.sectionId, sectionId)
        )).limit(1);
        if (existing.length > 0) {
          await db.update(clientBriefValues).set({ value, updatedAt: /* @__PURE__ */ new Date() }).where(and(
            eq(clientBriefValues.clientId, clientId),
            eq(clientBriefValues.sectionId, sectionId)
          ));
        } else {
          await db.insert(clientBriefValues).values({
            clientId,
            sectionId,
            value,
            updatedAt: /* @__PURE__ */ new Date()
          });
        }
      }
    } catch (error) {
      console.error("Error setting client brief value:", error);
      throw error;
    }
  }
  async getClients() {
    try {
      const result = await db.select().from(clients);
      return result;
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  }
  async getClientsWithPagination(limit, offset, sortBy, sortOrder) {
    try {
      const totalResult = await db.select({ count: sql`count(*)` }).from(clients).where(or(eq(clients.isArchived, false), isNull(clients.isArchived)));
      const total = Number(totalResult[0]?.count) || 0;
      const lastActivitySubquery = sql`
        GREATEST(
          ${clients.createdAt},
          COALESCE((SELECT MAX(tasks.created_at) FROM tasks WHERE tasks.client_id = ${clients.id}), ${clients.createdAt}),
          COALESCE((SELECT MAX(GREATEST(COALESCE(notes.updated_at, notes.created_at), notes.created_at)) FROM notes WHERE notes.client_id = ${clients.id}), ${clients.createdAt}),
          COALESCE((SELECT MAX(appointments.created_at) FROM appointments WHERE appointments.client_id = ${clients.id}), ${clients.createdAt}),
          COALESCE((SELECT MAX(activities.created_at) FROM activities WHERE activities.client_id = ${clients.id}), ${clients.createdAt})
        )
      `;
      let query = db.select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        company: clients.company,
        position: clients.position,
        status: clients.status,
        contactType: clients.contactType,
        contactSource: clients.contactSource,
        address: clients.address,
        address2: clients.address2,
        city: clients.city,
        state: clients.state,
        zipCode: clients.zipCode,
        website: clients.website,
        notes: clients.notes,
        tags: clients.tags,
        contactOwner: clients.contactOwner,
        profileImage: clients.profileImage,
        invoicingContact: clients.invoicingContact,
        invoicingEmail: clients.invoicingEmail,
        paymentTerms: clients.paymentTerms,
        upsideBonus: clients.upsideBonus,
        briefBackground: clients.briefBackground,
        briefObjectives: clients.briefObjectives,
        briefBrandInfo: clients.briefBrandInfo,
        briefAudienceInfo: clients.briefAudienceInfo,
        briefProductsServices: clients.briefProductsServices,
        briefCompetitors: clients.briefCompetitors,
        briefMarketingTech: clients.briefMarketingTech,
        briefMiscellaneous: clients.briefMiscellaneous,
        growthOsDashboard: clients.growthOsDashboard,
        storyBrand: clients.storyBrand,
        styleGuide: clients.styleGuide,
        googleDriveFolder: clients.googleDriveFolder,
        testingLog: clients.testingLog,
        cornerstoneBlueprint: clients.cornerstoneBlueprint,
        customGpt: clients.customGpt,
        dndAll: clients.dndAll,
        dndEmail: clients.dndEmail,
        dndSms: clients.dndSms,
        dndCalls: clients.dndCalls,
        groupId: clients.groupId,
        customFieldValues: clients.customFieldValues,
        followers: clients.followers,
        lastActivity: lastActivitySubquery.as("last_activity"),
        isArchived: clients.isArchived,
        createdAt: clients.createdAt
      }).from(clients).where(or(eq(clients.isArchived, false), isNull(clients.isArchived)));
      if (sortBy) {
        if (sortBy === "lastActivity") {
          if (sortOrder === "desc") {
            query = query.orderBy(desc(lastActivitySubquery));
          } else {
            query = query.orderBy(asc(lastActivitySubquery));
          }
        } else {
          const column = clients[sortBy];
          if (column) {
            if (sortOrder === "desc") {
              query = query.orderBy(desc(column));
            } else {
              query = query.orderBy(asc(column));
            }
          }
        }
      } else {
        query = query.orderBy(desc(clients.createdAt));
      }
      query = query.limit(limit).offset(offset);
      const clientsResult = await query;
      const MRR_FIELD_ID = "4e8e946b-1744-4d7c-a417-cdcb2713c6ca";
      const CLIENT_VERTICAL_FIELD_ID = "cac6e6ee-bdf9-48bd-81a7-48672d2453ae";
      const clientsWithCustomFields = clientsResult.map((client) => {
        const customFields2 = client.customFieldValues || {};
        const mrrValue = customFields2[MRR_FIELD_ID];
        const clientVerticalValue = customFields2[CLIENT_VERTICAL_FIELD_ID];
        return {
          ...client,
          mrr: mrrValue ? String(mrrValue) : null,
          clientVertical: clientVerticalValue ? String(clientVerticalValue) : null
        };
      });
      return {
        clients: clientsWithCustomFields,
        total
      };
    } catch (error) {
      console.error("Error fetching clients with pagination:", error);
      return {
        clients: [],
        total: 0
      };
    }
  }
  // Email Integrations
  async getEmailIntegrations() {
    try {
      const result = await db.select().from(emailIntegrations);
      return result;
    } catch (error) {
      console.error("Error fetching email integrations:", error);
      return [];
    }
  }
  async getEmailIntegration(id) {
    try {
      const result = await db.select().from(emailIntegrations).where(eq(emailIntegrations.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching email integration:", error);
      return void 0;
    }
  }
  async getEmailIntegrationByProvider(provider) {
    try {
      const result = await db.select().from(emailIntegrations).where(and(eq(emailIntegrations.provider, provider), eq(emailIntegrations.isActive, true))).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching email integration by provider:", error);
      return void 0;
    }
  }
  async createEmailIntegration(integrationData) {
    try {
      const result = await db.insert(emailIntegrations).values({
        ...integrationData,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating email integration:", error);
      throw error;
    }
  }
  async updateEmailIntegration(id, integrationData) {
    try {
      const result = await db.update(emailIntegrations).set({
        ...integrationData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(emailIntegrations.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating email integration:", error);
      return void 0;
    }
  }
  async deleteEmailIntegration(id) {
    try {
      const result = await db.delete(emailIntegrations).where(eq(emailIntegrations.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting email integration:", error);
      return false;
    }
  }
  // SMS Integrations
  async getSmsIntegrations() {
    try {
      const result = await db.select().from(smsIntegrations);
      return result;
    } catch (error) {
      console.error("Error fetching SMS integrations:", error);
      return [];
    }
  }
  async getUserViewPreference(userId, viewType) {
    try {
      const result = await db.select().from(userViewPreferences).where(and(
        eq(userViewPreferences.userId, userId),
        eq(userViewPreferences.viewType, viewType)
      )).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting user view preference:", error);
      return null;
    }
  }
  async saveUserViewPreference(userId, viewType, preferences) {
    try {
      const existing = await this.getUserViewPreference(userId, viewType);
      if (existing) {
        const result = await db.update(userViewPreferences).set({
          preferences,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(userViewPreferences.id, existing.id)).returning();
        return result[0];
      } else {
        const result = await db.insert(userViewPreferences).values({
          userId,
          viewType,
          preferences
        }).returning();
        return result[0];
      }
    } catch (error) {
      console.error("Error saving user view preference:", error);
      throw error;
    }
  }
  // =============================================================================
  // DASHBOARDS METHODS
  // =============================================================================
  async getUserDashboards(userId) {
    try {
      const result = await db.select().from(dashboards).where(eq(dashboards.userId, userId)).orderBy(asc(dashboards.displayOrder), desc(dashboards.isDefault), asc(dashboards.name));
      return result;
    } catch (error) {
      console.error("Error fetching user dashboards:", error);
      return [];
    }
  }
  async getDashboard(id) {
    try {
      const result = await db.select().from(dashboards).where(eq(dashboards.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      return void 0;
    }
  }
  async createDashboard(data) {
    try {
      const result = await db.insert(dashboards).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating dashboard:", error);
      throw error;
    }
  }
  async updateDashboard(id, data) {
    try {
      const result = await db.update(dashboards).set({
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(dashboards.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating dashboard:", error);
      return void 0;
    }
  }
  async deleteDashboard(id) {
    try {
      const result = await db.delete(dashboards).where(eq(dashboards.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      return false;
    }
  }
  async setDefaultDashboard(userId, dashboardId) {
    try {
      await db.update(dashboards).set({ isDefault: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(dashboards.userId, userId));
      await db.update(dashboards).set({ isDefault: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(dashboards.id, dashboardId));
    } catch (error) {
      console.error("Error setting default dashboard:", error);
      throw error;
    }
  }
  async updateDashboardsOrder(updates) {
    try {
      for (const update of updates) {
        await db.update(dashboards).set({
          displayOrder: update.displayOrder,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(dashboards.id, update.id));
      }
    } catch (error) {
      console.error("Error updating dashboards order:", error);
      throw error;
    }
  }
  // =============================================================================
  // DASHBOARD WIDGETS METHODS
  // =============================================================================
  async getDashboardWidgets() {
    try {
      const widgets = await db.select().from(dashboardWidgets).where(eq(dashboardWidgets.isActive, true)).orderBy(dashboardWidgets.category, dashboardWidgets.name);
      return widgets;
    } catch (error) {
      console.error("Error fetching dashboard widgets:", error);
      return [];
    }
  }
  async getUserDashboardWidgets(userId, dashboardId) {
    try {
      const widgets = await db.select().from(userDashboardWidgets).where(and(
        eq(userDashboardWidgets.userId, userId),
        eq(userDashboardWidgets.dashboardId, dashboardId),
        eq(userDashboardWidgets.isVisible, true)
      )).orderBy(userDashboardWidgets.order);
      return widgets;
    } catch (error) {
      console.error("Error fetching user dashboard widgets:", error);
      return [];
    }
  }
  async getUserDashboardWidget(id) {
    try {
      const result = await db.select().from(userDashboardWidgets).where(eq(userDashboardWidgets.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching user dashboard widget:", error);
      return void 0;
    }
  }
  async createUserDashboardWidget(data) {
    try {
      const result = await db.insert(userDashboardWidgets).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user dashboard widget:", error);
      throw error;
    }
  }
  async updateUserDashboardWidget(id, data) {
    try {
      const result = await db.update(userDashboardWidgets).set({
        ...data,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(userDashboardWidgets.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating user dashboard widget:", error);
      return void 0;
    }
  }
  async deleteUserDashboardWidget(id) {
    try {
      const result = await db.delete(userDashboardWidgets).where(eq(userDashboardWidgets.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting user dashboard widget:", error);
      return false;
    }
  }
  async getWidgetData(widgetType, userId, filters) {
    try {
      const userRolesList = await this.getUserRolesByUser(userId);
      const roleNames = await Promise.all(
        userRolesList.map(async (ur) => {
          const role = await this.getRole(ur.roleId);
          return role?.name || "";
        })
      );
      const isAdminOrManager = roleNames.some(
        (name) => name.toLowerCase() === "admin" || name.toLowerCase() === "manager"
      );
      let assignedClientIds = [];
      if (!isAdminOrManager) {
        const userAssignments = await db.select({ clientId: clientTeamAssignments.clientId }).from(clientTeamAssignments).where(eq(clientTeamAssignments.staffId, userId));
        assignedClientIds = userAssignments.map((a) => a.clientId);
      }
      switch (widgetType) {
        case "client_health_overview":
          return await this.getClientHealthOverviewData();
        case "recent_clients":
          return await this.getRecentClientsData();
        case "client_approval_queue":
          return await this.getClientApprovalQueueData(assignedClientIds);
        case "client_distribution_by_vertical":
          return await this.getClientDistributionByVerticalData();
        case "client_portal_activity":
          return await this.getClientPortalActivityData(assignedClientIds);
        case "client_team_assignments":
          return await this.getClientTeamAssignmentsData();
        // Sales & Revenue Widgets
        case "sales_pipeline_overview":
          return await this.getSalesPipelineOverviewData(userId, isAdminOrManager);
        case "quote_status_summary":
          return await this.getQuoteStatusSummaryData(assignedClientIds);
        case "revenue_this_month":
          return await this.getRevenueThisMonthData(assignedClientIds);
        case "mrr_tracker":
          return await this.getMRRTrackerData(assignedClientIds);
        case "win_rate":
          return await this.getWinRateData(userId, isAdminOrManager);
        case "top_performing_sales_reps":
          return await this.getTopPerformingSalesRepsData();
        case "recent_deals_won":
          return await this.getRecentDealsWonData(userId, isAdminOrManager);
        // Task Widgets
        case "my_tasks":
          return await this.getMyTasksData(userId);
        case "overdue_tasks":
          return await this.getOverdueTasksData(userId, filters);
        case "tasks_due_this_week":
          return await this.getTasksDueThisWeekData(userId);
        case "task_completion_rate":
          return await this.getTaskCompletionRateData(userId);
        case "tasks_requiring_approval":
          return await this.getTasksRequiringApprovalData(userId);
        case "tasks_by_status":
          return await this.getTasksByStatusData(userId);
        case "time_tracked_this_week":
          return await this.getTimeTrackedThisWeekData(userId);
        case "team_workload":
          return await this.getTeamWorkloadData(userId);
        // Lead Management Widgets
        case "new_leads_today_week":
          return await this.getNewLeadsTodayWeekData(userId, isAdminOrManager);
        case "leads_by_pipeline_stage":
          return await this.getLeadsByPipelineStageData(userId, isAdminOrManager);
        case "my_assigned_leads":
          return await this.getMyAssignedLeadsData(userId);
        case "stale_leads":
          return await this.getStaleLeadsData(userId, isAdminOrManager);
        case "lead_conversion_rate":
          return await this.getLeadConversionRateData(userId, isAdminOrManager);
        case "lead_source_breakdown":
          return await this.getLeadSourceBreakdownData(userId, isAdminOrManager);
        // HR & Team Widgets
        case "pending_time_off_requests":
          return await this.getPendingTimeOffRequestsData(userId, isAdminOrManager);
        case "whos_off_today_week":
          return await this.getWhosOffTodayWeekData(userId);
        case "new_job_applications":
          return await this.getNewJobApplicationsData(userId, isAdminOrManager);
        case "onboarding_queue":
          return await this.getOnboardingQueueData(userId, isAdminOrManager);
        case "pending_expense_reports":
          return await this.getPendingExpenseReportsData(userId, isAdminOrManager);
        case "team_capacity_alerts":
          return await this.getTeamCapacityAlertsData(userId, isAdminOrManager);
        case "team_birthday_anniversary":
          return await this.getTeamBirthdayAnniversaryData(userId);
        case "training_completion_status":
          return await this.getTrainingCompletionStatusData(userId, isAdminOrManager);
        // Calendar & Appointments Widgets
        case "todays_appointments":
          return await this.getTodaysAppointmentsData(userId);
        case "upcoming_appointments":
          return await this.getUpcomingAppointmentsData(userId);
        case "appointment_no_shows":
          return await this.getAppointmentNoShowsData(userId, isAdminOrManager);
        case "overdue_appointments":
          return await this.getOverdueAppointmentsData(userId, isAdminOrManager);
        // Activity & Alerts Widgets
        case "my_mentions":
          return await this.getMyMentionsData(userId);
        case "system_alerts":
          return await this.getSystemAlertsData(userId);
        default:
          return { error: "Unknown widget type" };
      }
    } catch (error) {
      console.error(`Error fetching widget data for ${widgetType}:`, error);
      throw error;
    }
  }
  // Widget-specific data fetching methods
  async getClientHealthOverviewData() {
    try {
      const healthScores = await db.select({
        clientId: clientHealthScores.clientId,
        healthIndicator: clientHealthScores.healthIndicator,
        averageScore: clientHealthScores.averageScore,
        weekStartDate: clientHealthScores.weekStartDate
      }).from(clientHealthScores).orderBy(desc(clientHealthScores.weekStartDate));
      const latestScores = /* @__PURE__ */ new Map();
      healthScores.forEach((score) => {
        if (!latestScores.has(score.clientId)) {
          latestScores.set(score.clientId, score);
        }
      });
      const counts = {
        Green: 0,
        Yellow: 0,
        Red: 0,
        total: latestScores.size
      };
      latestScores.forEach((score) => {
        if (counts[score.healthIndicator] !== void 0) {
          counts[score.healthIndicator]++;
        }
      });
      return counts;
    } catch (error) {
      console.error("Error fetching client health overview:", error);
      return { Green: 0, Yellow: 0, Red: 0, total: 0 };
    }
  }
  async getRecentClientsData() {
    try {
      const recentClients = await db.select().from(clients).where(eq(clients.isArchived, false)).orderBy(desc(clients.createdAt)).limit(5);
      return recentClients;
    } catch (error) {
      console.error("Error fetching recent clients:", error);
      return [];
    }
  }
  async getClientApprovalQueueData(assignedClientIds) {
    try {
      if (assignedClientIds.length === 0) {
        return [];
      }
      const approvalQueue = await db.select({
        id: tasks.id,
        title: tasks.title,
        clientId: tasks.clientId,
        clientName: clients.name,
        status: tasks.clientApprovalStatus,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt
      }).from(tasks).leftJoin(clients, eq(tasks.clientId, clients.id)).where(and(
        eq(tasks.requiresClientApproval, true),
        inArray(tasks.clientId, assignedClientIds),
        eq(tasks.clientApprovalStatus, "pending")
      )).orderBy(desc(tasks.createdAt)).limit(10);
      return approvalQueue;
    } catch (error) {
      console.error("Error fetching client approval queue:", error);
      return [];
    }
  }
  async getClientDistributionByVerticalData() {
    try {
      const CLIENT_VERTICAL_FIELD_ID = "cac6e6ee-bdf9-48bd-81a7-48672d2453ae";
      const allClients = await db.select({
        id: clients.id,
        customFieldValues: clients.customFieldValues
      }).from(clients).where(eq(clients.isArchived, false));
      const verticalCounts = {};
      allClients.forEach((client) => {
        const customFields2 = client.customFieldValues || {};
        const vertical = customFields2[CLIENT_VERTICAL_FIELD_ID] || "Uncategorized";
        verticalCounts[vertical] = (verticalCounts[vertical] || 0) + 1;
      });
      const distribution = Object.entries(verticalCounts).map(([vertical, count]) => ({
        vertical,
        count
      })).sort((a, b) => b.count - a.count);
      return distribution;
    } catch (error) {
      console.error("Error fetching client distribution by vertical:", error);
      return [];
    }
  }
  async getClientPortalActivityData(assignedClientIds) {
    try {
      if (assignedClientIds.length === 0) {
        return [];
      }
      const recentActivity = await db.select({
        id: clientPortalUsers.id,
        clientId: clientPortalUsers.clientId,
        clientName: clients.name,
        email: clientPortalUsers.email,
        firstName: clientPortalUsers.firstName,
        lastName: clientPortalUsers.lastName,
        lastLogin: clientPortalUsers.lastLogin
      }).from(clientPortalUsers).leftJoin(clients, eq(clientPortalUsers.clientId, clients.id)).where(and(
        inArray(clientPortalUsers.clientId, assignedClientIds),
        eq(clientPortalUsers.isActive, true),
        isNotNull(clientPortalUsers.lastLogin)
      )).orderBy(desc(clientPortalUsers.lastLogin)).limit(10);
      return recentActivity;
    } catch (error) {
      console.error("Error fetching client portal activity:", error);
      return [];
    }
  }
  async getClientTeamAssignmentsData() {
    try {
      const assignments = await db.select({
        id: clientTeamAssignments.id,
        clientId: clientTeamAssignments.clientId,
        clientName: clients.name,
        staffId: clientTeamAssignments.staffId,
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName,
        staffEmail: staff.email,
        position: clientTeamAssignments.position,
        isPrimary: clientTeamAssignments.isPrimary
      }).from(clientTeamAssignments).innerJoin(clients, eq(clientTeamAssignments.clientId, clients.id)).leftJoin(staff, eq(clientTeamAssignments.staffId, staff.id)).where(eq(clients.isArchived, false)).orderBy(clients.name, desc(clientTeamAssignments.isPrimary));
      const grouped = assignments.reduce((acc, assignment) => {
        const clientId = assignment.clientId;
        if (!clientId) return acc;
        if (!acc[clientId]) {
          acc[clientId] = {
            clientId,
            clientName: assignment.clientName || "Unknown Client",
            teamMembers: []
          };
        }
        if (assignment.staffId) {
          const staffName = assignment.staffFirstName && assignment.staffLastName ? `${assignment.staffFirstName} ${assignment.staffLastName}` : "Unknown";
          acc[clientId].teamMembers.push({
            staffId: assignment.staffId,
            staffName,
            staffEmail: assignment.staffEmail || "",
            position: assignment.position,
            isPrimary: assignment.isPrimary
          });
        }
        return acc;
      }, {});
      return Object.values(grouped);
    } catch (error) {
      console.error("Error fetching client team assignments:", error);
      return [];
    }
  }
  // Sales & Revenue Widget Data Methods
  async getSalesPipelineOverviewData(userId, isAdminOrManager) {
    try {
      const pipelineData = await db.select({
        stage: leadPipelineStages.name,
        count: sql`count(*)::int`,
        totalValue: sql`sum(COALESCE(CAST(${leads.value} AS NUMERIC), 0))::int`
      }).from(leads).leftJoin(leadPipelineStages, eq(leads.stageId, leadPipelineStages.id)).where(
        and(
          eq(leads.status, "Open"),
          !isAdminOrManager ? eq(leads.assignedTo, userId) : void 0
        )
      ).groupBy(leadPipelineStages.name);
      const wonLeads = await db.select({ count: sql`count(*)::int` }).from(leads).where(
        and(
          eq(leads.status, "Won"),
          !isAdminOrManager ? eq(leads.assignedTo, userId) : void 0
        )
      );
      const totalLeads = await db.select({ count: sql`count(*)::int` }).from(leads).where(!isAdminOrManager ? eq(leads.assignedTo, userId) : void 0);
      const conversionRate = totalLeads[0]?.count > 0 ? ((wonLeads[0]?.count || 0) / totalLeads[0].count * 100).toFixed(1) : "0.0";
      return {
        stages: pipelineData,
        conversionRate,
        totalLeads: pipelineData.reduce((sum, s) => sum + s.count, 0)
      };
    } catch (error) {
      console.error("Error fetching sales pipeline overview:", error);
      return { stages: [], conversionRate: "0.0", totalLeads: 0 };
    }
  }
  async getQuoteStatusSummaryData(assignedClientIds) {
    try {
      const statusCounts = await db.select({
        status: quotes.status,
        count: sql`count(*)::int`,
        totalValue: sql`sum(COALESCE(CAST(${quotes.clientBudget} AS NUMERIC), 0))::int`
      }).from(quotes).where(
        assignedClientIds.length > 0 ? inArray(quotes.clientId, assignedClientIds) : void 0
      ).groupBy(quotes.status);
      return statusCounts.map((s) => ({
        status: s.status,
        count: s.count,
        totalValue: s.totalValue
      }));
    } catch (error) {
      console.error("Error fetching quote status summary:", error);
      return [];
    }
  }
  async getRevenueThisMonthData(assignedClientIds) {
    try {
      const now = /* @__PURE__ */ new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const revenue = await db.select({
        total: sql`sum(COALESCE(CAST(${quotes.clientBudget} AS NUMERIC), 0))::int`,
        count: sql`count(*)::int`
      }).from(quotes).where(
        and(
          eq(quotes.status, "accepted"),
          sql`${quotes.updatedAt} >= ${startOfMonth}`,
          assignedClientIds.length > 0 ? inArray(quotes.clientId, assignedClientIds) : void 0
        )
      );
      const targetRecord = await this.getSalesTargetByMonth(currentYear, currentMonth);
      const target = targetRecord ? parseFloat(targetRecord.targetAmount) : 0;
      const actual = revenue[0]?.total || 0;
      const percentage = target > 0 ? (actual / target * 100).toFixed(1) : "0.0";
      return {
        actual,
        target,
        percentage,
        deals: revenue[0]?.count || 0
      };
    } catch (error) {
      console.error("Error fetching revenue this month:", error);
      return { actual: 0, target: 0, percentage: "0.0", deals: 0 };
    }
  }
  async getMRRTrackerData(assignedClientIds) {
    try {
      const MRR_FIELD_ID = "4e8e946b-1744-4d7c-a417-cdcb2713c6ca";
      const activeClients = await db.select({
        id: clients.id,
        name: clients.name,
        customFieldValues: clients.customFieldValues
      }).from(clients).where(
        and(
          eq(clients.status, "active"),
          assignedClientIds.length > 0 ? inArray(clients.id, assignedClientIds) : void 0
        )
      );
      const clientsWithMrr = activeClients.map((client) => {
        const customFields2 = client.customFieldValues || {};
        const mrrValue = customFields2[MRR_FIELD_ID];
        const mrr = mrrValue ? parseFloat(String(mrrValue)) : 0;
        return {
          clientId: client.id,
          clientName: client.name,
          mrr
        };
      }).filter((client) => client.mrr > 0);
      const totalMrr = clientsWithMrr.reduce((sum, client) => sum + client.mrr, 0);
      const topClients = clientsWithMrr.sort((a, b) => b.mrr - a.mrr).slice(0, 10);
      return {
        totalMrr,
        clientCount: clientsWithMrr.length,
        topClients
      };
    } catch (error) {
      console.error("Error fetching MRR tracker data:", error);
      return { totalMrr: 0, clientCount: 0, topClients: [] };
    }
  }
  async getWinRateData(userId, isAdminOrManager) {
    try {
      const wonWhere = isAdminOrManager ? eq(leads.status, "Won") : and(eq(leads.status, "Won"), eq(leads.assignedTo, userId));
      const totalWhere = isAdminOrManager ? sql`${leads.status} IN ('Won', 'Lost')` : and(sql`${leads.status} IN ('Won', 'Lost')`, eq(leads.assignedTo, userId));
      const wonCount = await db.select({ count: sql`count(*)::int` }).from(leads).where(wonWhere);
      const totalCount = await db.select({ count: sql`count(*)::int` }).from(leads).where(totalWhere);
      const won = wonCount[0]?.count || 0;
      const total = totalCount[0]?.count || 0;
      const winRate = total > 0 ? (won / total * 100).toFixed(1) : "0.0";
      return {
        winRate,
        won,
        lost: total - won,
        total
      };
    } catch (error) {
      console.error("Error fetching win rate data:", error);
      return { winRate: "0.0", won: 0, lost: 0, total: 0 };
    }
  }
  async getTopPerformingSalesRepsData() {
    try {
      const topReps = await db.select({
        staffId: leads.assignedTo,
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName,
        dealsWon: sql`count(*)::int`,
        totalRevenue: sql`sum(COALESCE(CAST(${leads.value} AS NUMERIC), 0))::int`
      }).from(leads).leftJoin(staff, eq(leads.assignedTo, staff.id)).where(
        and(
          eq(leads.status, "Won"),
          isNotNull(leads.assignedTo)
        )
      ).groupBy(leads.assignedTo, staff.firstName, staff.lastName).orderBy(desc(sql`count(*)`)).limit(5);
      return topReps.map((rep) => ({
        staffId: rep.staffId,
        staffName: rep.staffFirstName && rep.staffLastName ? `${rep.staffFirstName} ${rep.staffLastName}` : "Unknown",
        dealsWon: rep.dealsWon,
        totalRevenue: rep.totalRevenue
      }));
    } catch (error) {
      console.error("Error fetching top performing sales reps:", error);
      return [];
    }
  }
  async getRecentDealsWonData(userId, isAdminOrManager) {
    try {
      const recentDeals = await db.select({
        id: leads.id,
        companyName: leads.company,
        contactName: leads.name,
        estimatedValue: leads.value,
        wonDate: leads.updatedAt,
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName
      }).from(leads).leftJoin(staff, eq(leads.assignedTo, staff.id)).where(
        and(
          eq(leads.status, "Won"),
          !isAdminOrManager ? eq(leads.assignedTo, userId) : void 0
        )
      ).orderBy(desc(leads.updatedAt)).limit(10);
      return recentDeals.map((deal) => ({
        id: deal.id,
        companyName: deal.companyName,
        contactName: deal.contactName,
        estimatedValue: deal.estimatedValue,
        wonDate: deal.wonDate,
        staffName: deal.staffFirstName && deal.staffLastName ? `${deal.staffFirstName} ${deal.staffLastName}` : "Unknown"
      }));
    } catch (error) {
      console.error("Error fetching recent deals won:", error);
      return [];
    }
  }
  // Task Widget Data Methods
  async getMyTasksData(userId) {
    try {
      const myTasks = await db.select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        clientName: clients.name
      }).from(tasks).leftJoin(clients, eq(tasks.clientId, clients.id)).where(
        and(
          eq(tasks.assignedTo, userId),
          ne(tasks.status, "completed"),
          ne(tasks.status, "cancelled")
        )
      ).orderBy(desc(tasks.priority), asc(tasks.dueDate)).limit(10);
      return myTasks;
    } catch (error) {
      console.error("Error fetching my tasks:", error);
      return [];
    }
  }
  async getOverdueTasksData(userId, filters) {
    try {
      const now = /* @__PURE__ */ new Date();
      const conditions = [
        sql`${tasks.dueDate} < ${now.toISOString()}`,
        ne(tasks.status, "completed"),
        ne(tasks.status, "cancelled")
      ];
      if (filters?.assignee === "mine") {
        conditions.push(eq(tasks.assignedTo, userId));
      }
      const overdueTasks = await db.select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        clientName: clients.name,
        assignedToFirstName: staff.firstName,
        assignedToLastName: staff.lastName
      }).from(tasks).leftJoin(clients, eq(tasks.clientId, clients.id)).leftJoin(staff, eq(tasks.assignedTo, staff.id)).where(and(...conditions)).orderBy(asc(tasks.dueDate)).limit(20);
      return overdueTasks.map((task) => ({
        ...task,
        assignedToName: task.assignedToFirstName && task.assignedToLastName ? `${task.assignedToFirstName} ${task.assignedToLastName}` : "Unassigned"
      }));
    } catch (error) {
      console.error("Error fetching overdue tasks:", error);
      return [];
    }
  }
  async getTasksDueThisWeekData(userId) {
    try {
      const startOfToday = /* @__PURE__ */ new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfToday);
      endOfWeek.setDate(endOfWeek.getDate() + (6 - startOfToday.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
      const tasksDueThisWeek = await db.select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        clientName: clients.name
      }).from(tasks).leftJoin(clients, eq(tasks.clientId, clients.id)).where(
        and(
          eq(tasks.assignedTo, userId),
          sql`${tasks.dueDate} >= ${startOfToday.toISOString()}`,
          sql`${tasks.dueDate} <= ${endOfWeek.toISOString()}`,
          ne(tasks.status, "completed"),
          ne(tasks.status, "cancelled")
        )
      ).orderBy(asc(tasks.dueDate)).limit(10);
      return tasksDueThisWeek;
    } catch (error) {
      console.error("Error fetching tasks due this week:", error);
      return [];
    }
  }
  async getTaskCompletionRateData(userId) {
    try {
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const completedTasks = await db.select({ count: sql`count(*)::int` }).from(tasks).where(
        and(
          eq(tasks.assignedTo, userId),
          eq(tasks.status, "completed"),
          sql`${tasks.completedAt} > ${thirtyDaysAgo.toISOString()}`
        )
      );
      const totalTasks = await db.select({ count: sql`count(*)::int` }).from(tasks).where(
        and(
          eq(tasks.assignedTo, userId),
          sql`${tasks.createdAt} > ${thirtyDaysAgo.toISOString()}`
        )
      );
      const completed = completedTasks[0]?.count || 0;
      const total = totalTasks[0]?.count || 0;
      const rate = total > 0 ? (completed / total * 100).toFixed(1) : "0.0";
      return {
        completed,
        total,
        rate
      };
    } catch (error) {
      console.error("Error fetching task completion rate:", error);
      return { completed: 0, total: 0, rate: "0.0" };
    }
  }
  async getTasksRequiringApprovalData(userId) {
    try {
      const approvalTasks = await db.select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        clientName: clients.name,
        assignedToFirstName: staff.firstName,
        assignedToLastName: staff.lastName
      }).from(tasks).leftJoin(clients, eq(tasks.clientId, clients.id)).leftJoin(staff, eq(tasks.assignedTo, staff.id)).where(
        and(
          sql`${tasks.description} ILIKE '%approval%' OR ${tasks.title} ILIKE '%approval%'`,
          eq(tasks.status, "in_progress")
        )
      ).orderBy(asc(tasks.dueDate)).limit(10);
      return approvalTasks.map((task) => ({
        ...task,
        assignedToName: task.assignedToFirstName && task.assignedToLastName ? `${task.assignedToFirstName} ${task.assignedToLastName}` : "Unassigned"
      }));
    } catch (error) {
      console.error("Error fetching tasks requiring approval:", error);
      return [];
    }
  }
  async getTasksByStatusData(userId) {
    try {
      const statusCounts = await db.select({
        status: tasks.status,
        count: sql`count(*)::int`
      }).from(tasks).where(eq(tasks.assignedTo, userId)).groupBy(tasks.status);
      const counts = {
        todo: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };
      statusCounts.forEach((item) => {
        if (counts[item.status] !== void 0) {
          counts[item.status] = item.count;
        }
      });
      return counts;
    } catch (error) {
      console.error("Error fetching tasks by status:", error);
      return { todo: 0, in_progress: 0, completed: 0, cancelled: 0 };
    }
  }
  async getTimeTrackedThisWeekData(userId) {
    try {
      const now = /* @__PURE__ */ new Date();
      const startOfWeek = /* @__PURE__ */ new Date();
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const result = await db.execute(sql`
        SELECT COALESCE(SUM((entry->>'duration')::int), 0) as total_minutes
        FROM ${tasks} t,
        jsonb_array_elements(t.time_entries) AS entry
        WHERE t.assigned_to = ${userId}
        AND (entry->>'endTime')::timestamp >= ${startOfWeek}::timestamp
      `);
      const totalMinutes = Number(result.rows[0]?.total_minutes || 0);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return {
        totalMinutes,
        hours,
        minutes,
        formatted: `${hours}h ${minutes}m`
      };
    } catch (error) {
      console.error("Error fetching time tracked this week:", error);
      return { totalMinutes: 0, hours: 0, minutes: 0, formatted: "0h 0m" };
    }
  }
  async getTeamWorkloadData(userId) {
    try {
      const currentUserResult = await db.select().from(staff).where(eq(staff.id, userId)).limit(1);
      if (!currentUserResult || currentUserResult.length === 0) {
        return [];
      }
      const userDepartment = currentUserResult[0].department;
      const teamWorkload = await db.select({
        staffId: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        department: staff.department,
        taskCount: sql`count(${tasks.id})::int`
      }).from(staff).leftJoin(
        tasks,
        and(
          eq(tasks.assignedTo, staff.id),
          ne(tasks.status, "completed"),
          ne(tasks.status, "cancelled")
        )
      ).where(
        and(
          eq(staff.isActive, true),
          eq(staff.department, userDepartment)
        )
      ).groupBy(staff.id, staff.firstName, staff.lastName, staff.department).orderBy(desc(sql`count(${tasks.id})`)).limit(10);
      return teamWorkload.map((member) => ({
        staffId: member.staffId,
        staffName: `${member.firstName} ${member.lastName}`,
        taskCount: member.taskCount,
        capacity: member.taskCount > 10 ? "high" : member.taskCount > 5 ? "medium" : "low"
      }));
    } catch (error) {
      console.error("Error fetching team workload:", error);
      return [];
    }
  }
  // Lead Management Widget Data Methods
  async getNewLeadsTodayWeekData(userId, isAdminOrManager) {
    try {
      const now = /* @__PURE__ */ new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = /* @__PURE__ */ new Date();
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const leadsToday = await db.select({ count: sql`count(*)::int` }).from(leads).where(
        and(
          sql`${leads.createdAt} >= ${startOfToday}`,
          !isAdminOrManager ? eq(leads.assignedTo, userId) : void 0
        )
      );
      const leadsThisWeek = await db.select({ count: sql`count(*)::int` }).from(leads).where(
        and(
          sql`${leads.createdAt} >= ${startOfWeek}`,
          !isAdminOrManager ? eq(leads.assignedTo, userId) : void 0
        )
      );
      return {
        today: leadsToday[0]?.count || 0,
        thisWeek: leadsThisWeek[0]?.count || 0
      };
    } catch (error) {
      console.error("Error fetching new leads today/week:", error);
      return { today: 0, thisWeek: 0 };
    }
  }
  async getLeadsByPipelineStageData(userId, isAdminOrManager) {
    try {
      const stageData = await db.select({
        stageId: leadPipelineStages.id,
        stageName: leadPipelineStages.name,
        stageColor: leadPipelineStages.color,
        stageOrder: leadPipelineStages.order,
        count: sql`count(${leads.id})::int`
      }).from(leadPipelineStages).leftJoin(
        leads,
        and(
          eq(leads.stageId, leadPipelineStages.id),
          !isAdminOrManager ? eq(leads.assignedTo, userId) : void 0
        )
      ).where(eq(leadPipelineStages.isActive, true)).groupBy(leadPipelineStages.id, leadPipelineStages.name, leadPipelineStages.color, leadPipelineStages.order).orderBy(leadPipelineStages.order);
      return stageData.map((stage) => ({
        stageId: stage.stageId,
        stageName: stage.stageName,
        color: stage.stageColor,
        count: stage.count
      }));
    } catch (error) {
      console.error("Error fetching leads by pipeline stage:", error);
      return [];
    }
  }
  async getMyAssignedLeadsData(userId) {
    try {
      const assignedLeads = await db.select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        company: leads.company,
        status: leads.status,
        stageName: leadPipelineStages.name,
        value: leads.value,
        lastContactDate: leads.lastContactDate
      }).from(leads).leftJoin(leadPipelineStages, eq(leads.stageId, leadPipelineStages.id)).where(
        and(
          eq(leads.assignedTo, userId),
          eq(leads.status, "Open")
        )
      ).orderBy(desc(leads.createdAt)).limit(10);
      return assignedLeads;
    } catch (error) {
      console.error("Error fetching my assigned leads:", error);
      return [];
    }
  }
  async getStaleLeadsData(userId, isAdminOrManager) {
    try {
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const staleLeads = await db.select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        company: leads.company,
        lastContactDate: leads.lastContactDate,
        createdAt: leads.createdAt,
        stageName: leadPipelineStages.name
      }).from(leads).leftJoin(leadPipelineStages, eq(leads.stageId, leadPipelineStages.id)).where(
        and(
          eq(leads.status, "Open"),
          or(
            sql`${leads.lastContactDate} < ${thirtyDaysAgo}`,
            and(
              isNull(leads.lastContactDate),
              sql`${leads.createdAt} < ${thirtyDaysAgo}`
            )
          ),
          !isAdminOrManager ? eq(leads.assignedTo, userId) : void 0
        )
      ).orderBy(asc(leads.lastContactDate)).limit(10);
      return staleLeads;
    } catch (error) {
      console.error("Error fetching stale leads:", error);
      return [];
    }
  }
  async getLeadConversionRateData(userId, isAdminOrManager) {
    try {
      const totalLeads = await db.select({ count: sql`count(*)::int` }).from(leads).where(!isAdminOrManager ? eq(leads.assignedTo, userId) : void 0);
      const convertedLeads = await db.select({ count: sql`count(*)::int` }).from(leads).where(
        and(
          eq(leads.status, "Won"),
          !isAdminOrManager ? eq(leads.assignedTo, userId) : void 0
        )
      );
      const total = totalLeads[0]?.count || 0;
      const converted = convertedLeads[0]?.count || 0;
      const rate = total > 0 ? (converted / total * 100).toFixed(1) : "0.0";
      return {
        total,
        converted,
        rate
      };
    } catch (error) {
      console.error("Error fetching lead conversion rate:", error);
      return { total: 0, converted: 0, rate: "0.0" };
    }
  }
  async getLeadSourceBreakdownData(userId, isAdminOrManager) {
    try {
      const sourceData = await db.select({
        source: leads.source,
        count: sql`count(*)::int`
      }).from(leads).where(!isAdminOrManager ? eq(leads.assignedTo, userId) : void 0).groupBy(leads.source).orderBy(desc(sql`count(*)`));
      return sourceData.map((item) => ({
        source: item.source || "Unknown",
        count: item.count
      }));
    } catch (error) {
      console.error("Error fetching lead source breakdown:", error);
      return [];
    }
  }
  // ========== HR & TEAM WIDGET DATA METHODS ==========
  async getPendingTimeOffRequestsData(userId, isAdminOrManager) {
    try {
      if (!isAdminOrManager) {
        return [];
      }
      const pendingRequests = await db.select({
        id: sql`time_off_requests.id`,
        staffId: sql`time_off_requests.staff_id`,
        staffName: sql`CONCAT(staff.first_name, ' ', staff.last_name)`,
        startDate: sql`time_off_requests.start_date`,
        endDate: sql`time_off_requests.end_date`,
        type: sql`time_off_requests.type`,
        reason: sql`time_off_requests.reason`,
        status: sql`time_off_requests.status`,
        createdAt: sql`time_off_requests.created_at`
      }).from(timeOffRequests).leftJoin(staff, sql`time_off_requests.staff_id = staff.id`).where(sql`time_off_requests.status = 'pending'`).orderBy(sql`time_off_requests.created_at ASC`).limit(10);
      return pendingRequests;
    } catch (error) {
      console.error("Error fetching pending time off requests:", error);
      return [];
    }
  }
  async getWhosOffTodayWeekData(userId) {
    try {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);
      const offToday = await db.select({
        id: sql`time_off_requests.id`,
        staffId: sql`time_off_requests.staff_id`,
        staffName: sql`CONCAT(staff.first_name, ' ', staff.last_name)`,
        type: sql`time_off_requests.type`,
        startDate: sql`time_off_requests.start_date`,
        endDate: sql`time_off_requests.end_date`
      }).from(timeOffRequests).leftJoin(staff, sql`time_off_requests.staff_id = staff.id`).where(sql`time_off_requests.status = 'approved' AND time_off_requests.start_date <= ${today} AND time_off_requests.end_date >= ${today}`).orderBy(sql`staff.first_name ASC`);
      const offThisWeek = await db.select({
        id: sql`time_off_requests.id`,
        staffId: sql`time_off_requests.staff_id`,
        staffName: sql`CONCAT(staff.first_name, ' ', staff.last_name)`,
        type: sql`time_off_requests.type`,
        startDate: sql`time_off_requests.start_date`,
        endDate: sql`time_off_requests.end_date`
      }).from(timeOffRequests).leftJoin(staff, sql`time_off_requests.staff_id = staff.id`).where(sql`time_off_requests.status = 'approved' AND time_off_requests.start_date <= ${endOfWeek} AND time_off_requests.end_date >= ${today}`).orderBy(sql`time_off_requests.start_date ASC`);
      return {
        today: offToday,
        thisWeek: offThisWeek
      };
    } catch (error) {
      console.error("Error fetching who's off today/week:", error);
      return { today: [], thisWeek: [] };
    }
  }
  async getNewJobApplicationsData(userId, isAdminOrManager) {
    try {
      if (!isAdminOrManager) {
        return [];
      }
      const recentApplications = await db.select({
        id: jobApplications.id,
        applicantName: sql`applicant_name`,
        applicantEmail: sql`applicant_email`,
        applicantPhone: sql`applicant_phone`,
        positionId: sql`position_id`,
        positionTitle: sql`position_title`,
        applicationStatus: sql`application_status`,
        appliedAt: sql`applied_at`
      }).from(jobApplications).orderBy(desc(sql`applied_at`)).limit(10);
      return recentApplications;
    } catch (error) {
      console.error("Error fetching new job applications:", error);
      return [];
    }
  }
  async getOnboardingQueueData(userId, isAdminOrManager) {
    try {
      if (!isAdminOrManager) {
        return [];
      }
      const pendingOnboarding = await db.select({
        id: newHireOnboardingSubmissions.id,
        name: newHireOnboardingSubmissions.name,
        startDate: newHireOnboardingSubmissions.startDate,
        status: newHireOnboardingSubmissions.status,
        submittedAt: newHireOnboardingSubmissions.submittedAt,
        customFieldData: newHireOnboardingSubmissions.customFieldData
      }).from(newHireOnboardingSubmissions).where(eq(newHireOnboardingSubmissions.status, "pending")).orderBy(asc(newHireOnboardingSubmissions.submittedAt)).limit(10);
      return pendingOnboarding;
    } catch (error) {
      console.error("Error fetching onboarding queue:", error);
      return [];
    }
  }
  async getPendingExpenseReportsData(userId, isAdminOrManager) {
    try {
      const userRolesList = await this.getUserRolesByUser(userId);
      const roleNames = await Promise.all(
        userRolesList.map(async (ur) => {
          const role = await db.select().from(roles).where(eq(roles.id, ur.roleId)).limit(1);
          return role[0]?.name;
        })
      );
      const hasPermission = roleNames.some(
        (role) => role === "Admin" || role === "Manager" || role === "Accounting"
      );
      if (!hasPermission) {
        return [];
      }
      const pendingExpenses = await db.select({
        id: expenseReportSubmissions.id,
        submittedById: expenseReportSubmissions.submittedById,
        fullName: expenseReportSubmissions.fullName,
        expenseType: expenseReportSubmissions.expenseType,
        expenseTotal: expenseReportSubmissions.expenseTotal,
        status: expenseReportSubmissions.status,
        submittedAt: expenseReportSubmissions.submittedAt
      }).from(expenseReportSubmissions).where(eq(expenseReportSubmissions.status, "pending")).orderBy(asc(expenseReportSubmissions.submittedAt)).limit(10);
      return pendingExpenses;
    } catch (error) {
      console.error("Error fetching pending expense reports:", error);
      return [];
    }
  }
  async getTeamCapacityAlertsData(userId, isAdminOrManager) {
    try {
      if (!isAdminOrManager) {
        return [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching team capacity alerts:", error);
      return [];
    }
  }
  async getTeamBirthdayAnniversaryData(userId) {
    try {
      const today = /* @__PURE__ */ new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      const upcomingEvents = await db.select({
        id: calendarAppointments.id,
        calendarId: calendarAppointments.calendarId,
        calendarName: calendars.name,
        title: calendarAppointments.title,
        startTime: calendarAppointments.startTime,
        description: calendarAppointments.description
      }).from(calendarAppointments).leftJoin(calendars, eq(calendarAppointments.calendarId, calendars.id)).where(
        and(
          or(
            eq(calendars.name, "Birthdays"),
            eq(calendars.name, "Anniversaries")
          ),
          sql`${calendarAppointments.startTime} >= ${today}`,
          sql`${calendarAppointments.startTime} <= ${thirtyDaysFromNow}`
        )
      ).orderBy(asc(calendarAppointments.startTime)).limit(10);
      return upcomingEvents;
    } catch (error) {
      console.error("Error fetching team birthday/anniversary data:", error);
      return [];
    }
  }
  async getTrainingCompletionStatusData(userId, isAdminOrManager) {
    try {
      if (!isAdminOrManager) {
        return [];
      }
      const courseStats = await db.select({
        courseId: trainingCourses.id,
        courseName: trainingCourses.title,
        totalEnrollments: sql`count(DISTINCT ${trainingEnrollments.id})::int`,
        completedEnrollments: sql`count(DISTINCT CASE WHEN ${trainingEnrollments.status} = 'completed' THEN ${trainingEnrollments.id} END)::int`
      }).from(trainingCourses).leftJoin(trainingEnrollments, eq(trainingEnrollments.courseId, trainingCourses.id)).where(eq(trainingCourses.isPublished, true)).groupBy(trainingCourses.id, trainingCourses.title).orderBy(desc(sql`count(DISTINCT ${trainingEnrollments.id})`)).limit(10);
      return courseStats.map((stat) => ({
        courseId: stat.courseId,
        courseName: stat.courseName,
        totalEnrollments: stat.totalEnrollments,
        completedEnrollments: stat.completedEnrollments,
        completionRate: stat.totalEnrollments > 0 ? (stat.completedEnrollments / stat.totalEnrollments * 100).toFixed(1) : "0.0"
      }));
    } catch (error) {
      console.error("Error fetching training completion status:", error);
      return [];
    }
  }
  // ========== CALENDAR & APPOINTMENTS WIDGET DATA METHODS ==========
  async getTodaysAppointmentsData(userId) {
    try {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const appointments2 = await db.select({
        id: calendarAppointments.id,
        title: calendarAppointments.title,
        startTime: calendarAppointments.startTime,
        endTime: calendarAppointments.endTime,
        status: calendarAppointments.status,
        location: calendarAppointments.location,
        bookerName: calendarAppointments.bookerName,
        bookerEmail: calendarAppointments.bookerEmail,
        clientId: calendarAppointments.clientId,
        clientName: sql`clients.name`,
        assignedTo: calendarAppointments.assignedTo,
        assignedToName: sql`CONCAT(staff.first_name, ' ', staff.last_name)`
      }).from(calendarAppointments).leftJoin(clients, eq(calendarAppointments.clientId, clients.id)).leftJoin(staff, eq(calendarAppointments.assignedTo, staff.id)).where(
        and(
          eq(calendarAppointments.assignedTo, userId),
          sql`${calendarAppointments.startTime} >= ${today}`,
          sql`${calendarAppointments.startTime} < ${tomorrow}`
        )
      ).orderBy(asc(calendarAppointments.startTime)).limit(20);
      return appointments2;
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
      return [];
    }
  }
  async getUpcomingAppointmentsData(userId) {
    try {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);
      const appointments2 = await db.select({
        id: calendarAppointments.id,
        title: calendarAppointments.title,
        startTime: calendarAppointments.startTime,
        endTime: calendarAppointments.endTime,
        status: calendarAppointments.status,
        location: calendarAppointments.location,
        bookerName: calendarAppointments.bookerName,
        bookerEmail: calendarAppointments.bookerEmail,
        clientId: calendarAppointments.clientId,
        clientName: sql`clients.name`,
        assignedTo: calendarAppointments.assignedTo,
        assignedToName: sql`CONCAT(staff.first_name, ' ', staff.last_name)`
      }).from(calendarAppointments).leftJoin(clients, eq(calendarAppointments.clientId, clients.id)).leftJoin(staff, eq(calendarAppointments.assignedTo, staff.id)).where(
        and(
          eq(calendarAppointments.assignedTo, userId),
          ne(calendarAppointments.status, "cancelled"),
          sql`${calendarAppointments.startTime} > ${today}`,
          sql`${calendarAppointments.startTime} <= ${sevenDaysFromNow}`
        )
      ).orderBy(asc(calendarAppointments.startTime)).limit(20);
      return appointments2;
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
      return [];
    }
  }
  async getAppointmentNoShowsData(userId, isAdminOrManager) {
    try {
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const noShows = await db.select({
        id: calendarAppointments.id,
        title: calendarAppointments.title,
        startTime: calendarAppointments.startTime,
        endTime: calendarAppointments.endTime,
        status: calendarAppointments.status,
        location: calendarAppointments.location,
        bookerName: calendarAppointments.bookerName,
        bookerEmail: calendarAppointments.bookerEmail,
        clientId: calendarAppointments.clientId,
        clientName: sql`clients.name`,
        assignedTo: calendarAppointments.assignedTo,
        assignedToName: sql`CONCAT(staff.first_name, ' ', staff.last_name)`
      }).from(calendarAppointments).leftJoin(clients, eq(calendarAppointments.clientId, clients.id)).leftJoin(staff, eq(calendarAppointments.assignedTo, staff.id)).where(
        and(
          isAdminOrManager ? void 0 : eq(calendarAppointments.assignedTo, userId),
          eq(calendarAppointments.status, "no_show"),
          sql`${calendarAppointments.startTime} >= ${thirtyDaysAgo}`
        )
      ).orderBy(desc(calendarAppointments.startTime)).limit(15);
      return noShows;
    } catch (error) {
      console.error("Error fetching appointment no-shows:", error);
      return [];
    }
  }
  async getOverdueAppointmentsData(userId, isAdminOrManager) {
    try {
      const now = /* @__PURE__ */ new Date();
      const overdueAppointments = await db.select({
        id: calendarAppointments.id,
        title: calendarAppointments.title,
        startTime: calendarAppointments.startTime,
        endTime: calendarAppointments.endTime,
        status: calendarAppointments.status,
        location: calendarAppointments.location,
        bookerName: calendarAppointments.bookerName,
        bookerEmail: calendarAppointments.bookerEmail,
        clientId: calendarAppointments.clientId,
        clientName: sql`clients.name`,
        assignedTo: calendarAppointments.assignedTo,
        assignedToName: sql`CONCAT(staff.first_name, ' ', staff.last_name)`
      }).from(calendarAppointments).leftJoin(clients, eq(calendarAppointments.clientId, clients.id)).leftJoin(staff, eq(calendarAppointments.assignedTo, staff.id)).where(
        and(
          isAdminOrManager ? void 0 : eq(calendarAppointments.assignedTo, userId),
          eq(calendarAppointments.status, "confirmed"),
          sql`${calendarAppointments.endTime} < ${now}`
        )
      ).orderBy(desc(calendarAppointments.startTime)).limit(15);
      return overdueAppointments;
    } catch (error) {
      console.error("Error fetching overdue appointments:", error);
      return [];
    }
  }
  // ========== ACTIVITY & ALERTS WIDGET DATA METHODS ==========
  async getMyMentionsData(userId) {
    try {
      const mentions = [];
      const taskCommentMentions = await db.select({
        id: taskComments.id,
        content: taskComments.content,
        createdAt: taskComments.createdAt,
        authorId: taskComments.authorId,
        authorName: sql`CONCAT(staff.first_name, ' ', staff.last_name)`,
        taskId: taskComments.taskId,
        taskTitle: sql`tasks.title`
      }).from(taskComments).leftJoin(staff, eq(taskComments.authorId, staff.id)).leftJoin(tasks, eq(taskComments.taskId, tasks.id)).where(sql`${userId} = ANY(${taskComments.mentions})`).orderBy(desc(taskComments.createdAt)).limit(10);
      taskCommentMentions.forEach((comment) => {
        mentions.push({
          id: comment.id,
          type: "task_comment",
          content: comment.content,
          authorName: comment.authorName || "Unknown",
          createdAt: comment.createdAt,
          entityId: comment.id,
          entityTitle: comment.taskTitle,
          taskId: comment.taskId
        });
      });
      const annotationMentions = await db.select({
        id: imageAnnotations.id,
        content: imageAnnotations.content,
        createdAt: imageAnnotations.createdAt,
        authorId: imageAnnotations.authorId,
        authorName: sql`CONCAT(staff.first_name, ' ', staff.last_name)`,
        fileId: imageAnnotations.fileId,
        // Try to get task ID from task attachments first
        taskIdFromAttachment: taskAttachments.taskId,
        taskTitleFromAttachment: tasks.title,
        // Also try to get task ID from comment files
        commentId: commentFiles.commentId
      }).from(imageAnnotations).leftJoin(staff, eq(imageAnnotations.authorId, staff.id)).leftJoin(taskAttachments, eq(taskAttachments.id, imageAnnotations.fileId)).leftJoin(tasks, eq(taskAttachments.taskId, tasks.id)).leftJoin(commentFiles, eq(commentFiles.id, imageAnnotations.fileId)).where(sql`${userId} = ANY(${imageAnnotations.mentions})`).orderBy(desc(imageAnnotations.createdAt)).limit(10);
      for (const annotation of annotationMentions) {
        let taskId = annotation.taskIdFromAttachment;
        let taskTitle = annotation.taskTitleFromAttachment || "File Annotation";
        if (!taskId && annotation.commentId) {
          const commentTask = await db.select({
            taskId: taskComments.taskId,
            taskTitle: sql`tasks.title`
          }).from(taskComments).leftJoin(tasks, eq(taskComments.taskId, tasks.id)).where(eq(taskComments.id, annotation.commentId)).limit(1);
          if (commentTask.length > 0) {
            taskId = commentTask[0].taskId;
            taskTitle = commentTask[0].taskTitle || "File Annotation";
          }
        }
        mentions.push({
          id: annotation.id,
          type: "file_annotation",
          content: annotation.content,
          authorName: annotation.authorName || "Unknown",
          createdAt: annotation.createdAt,
          entityId: annotation.id,
          entityTitle: taskTitle,
          taskId: taskId || null
        });
      }
      const kbCommentMentions = await db.select({
        id: knowledgeBaseComments.id,
        content: knowledgeBaseComments.content,
        createdAt: knowledgeBaseComments.createdAt,
        authorId: knowledgeBaseComments.authorId,
        authorName: sql`CONCAT(staff.first_name, ' ', staff.last_name)`,
        articleId: knowledgeBaseComments.articleId,
        articleTitle: sql`knowledge_base_articles.title`
      }).from(knowledgeBaseComments).leftJoin(staff, eq(knowledgeBaseComments.authorId, staff.id)).leftJoin(knowledgeBaseArticles, eq(knowledgeBaseComments.articleId, knowledgeBaseArticles.id)).where(sql`${userId} = ANY(${knowledgeBaseComments.mentions})`).orderBy(desc(knowledgeBaseComments.createdAt)).limit(10);
      kbCommentMentions.forEach((comment) => {
        mentions.push({
          id: comment.id,
          type: "kb_comment",
          content: comment.content,
          authorName: comment.authorName || "Unknown",
          createdAt: comment.createdAt,
          entityId: comment.articleId,
          entityTitle: comment.articleTitle,
          taskId: null
        });
      });
      mentions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return mentions.slice(0, 15);
    } catch (error) {
      console.error("Error fetching my mentions:", error);
      return [];
    }
  }
  async getSystemAlertsData(userId) {
    try {
      const alerts = await db.select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        priority: notifications.priority,
        isRead: notifications.isRead,
        actionUrl: notifications.actionUrl,
        actionText: notifications.actionText,
        createdAt: notifications.createdAt
      }).from(notifications).where(
        and(
          eq(notifications.userId, userId),
          or(
            eq(notifications.type, "system"),
            eq(notifications.priority, "high"),
            eq(notifications.priority, "urgent")
          )
        )
      ).orderBy(
        desc(sql`CASE WHEN ${notifications.isRead} = false THEN 1 ELSE 0 END`),
        desc(notifications.createdAt)
      ).limit(20);
      return alerts;
    } catch (error) {
      console.error("Error fetching system alerts:", error);
      return [];
    }
  }
  // Time Off Types methods
  async getTimeOffTypes(policyId) {
    const types = await db.select().from(timeOffTypes).where(eq(timeOffTypes.policyId, policyId)).orderBy(asc(timeOffTypes.orderIndex));
    return types;
  }
  async getTimeOffType(id) {
    const [type] = await db.select().from(timeOffTypes).where(eq(timeOffTypes.id, id)).limit(1);
    return type;
  }
  async createTimeOffType(data) {
    const [newType] = await db.insert(timeOffTypes).values(data).returning();
    return newType;
  }
  async updateTimeOffType(id, data) {
    const [updated] = await db.update(timeOffTypes).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(timeOffTypes.id, id)).returning();
    return updated;
  }
  async deleteTimeOffType(id) {
    const result = await db.delete(timeOffTypes).where(eq(timeOffTypes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async reorderTimeOffTypes(updates) {
    await Promise.all(
      updates.map(
        ({ id, orderIndex }) => db.update(timeOffTypes).set({ orderIndex }).where(eq(timeOffTypes.id, id))
      )
    );
  }
  // GoHighLevel Integration methods
  async getGoHighLevelIntegration() {
    const [integration] = await db.select().from(goHighLevelIntegration).limit(1);
    return integration;
  }
  async getGoHighLevelIntegrationByToken(token) {
    const [integration] = await db.select().from(goHighLevelIntegration).where(eq(goHighLevelIntegration.webhookToken, token)).limit(1);
    return integration;
  }
  async createGoHighLevelIntegration(data) {
    const [newIntegration] = await db.insert(goHighLevelIntegration).values(data).returning();
    return newIntegration;
  }
  async updateGoHighLevelIntegration(id, data) {
    const [updated] = await db.update(goHighLevelIntegration).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(goHighLevelIntegration.id, id)).returning();
    return updated;
  }
  async deleteGoHighLevelIntegration(id) {
    const result = await db.delete(goHighLevelIntegration).where(eq(goHighLevelIntegration.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async incrementGoHighLevelLeadCount(id) {
    await db.update(goHighLevelIntegration).set({
      leadsReceived: sql`${goHighLevelIntegration.leadsReceived} + 1`,
      lastLeadAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(goHighLevelIntegration.id, id));
  }
  // ================================
  // SURVEY METHODS
  // ================================
  // Survey Folders
  async getSurveyFolders() {
    return await db.select().from(surveyFolders).orderBy(asc(surveyFolders.order));
  }
  async createSurveyFolder(data) {
    const [folder] = await db.insert(surveyFolders).values(data).returning();
    return folder;
  }
  async updateSurveyFolder(id, data) {
    const [updated] = await db.update(surveyFolders).set(data).where(eq(surveyFolders.id, id)).returning();
    return updated;
  }
  async deleteSurveyFolder(id) {
    const result = await db.delete(surveyFolders).where(eq(surveyFolders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Surveys
  async getSurveys() {
    const results = await db.select({
      id: surveys.id,
      name: surveys.name,
      description: surveys.description,
      status: surveys.status,
      settings: surveys.settings,
      styling: surveys.styling,
      shortCode: surveys.shortCode,
      folderId: surveys.folderId,
      createdBy: surveys.createdBy,
      updatedBy: surveys.updatedBy,
      createdAt: surveys.createdAt,
      updatedAt: surveys.updatedAt,
      createdByName: sql`COALESCE(${staff.firstName} || ' ' || ${staff.lastName}, 'Unknown')`
    }).from(surveys).leftJoin(staff, eq(surveys.createdBy, staff.id)).orderBy(desc(surveys.createdAt));
    return results;
  }
  async getSurvey(id) {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);
    return survey;
  }
  async getSurveyByShortCode(shortCode) {
    const [survey] = await db.select().from(surveys).where(eq(surveys.shortCode, shortCode)).limit(1);
    return survey;
  }
  async createSurvey(data) {
    const shortCode = randomUUID().substring(0, 8);
    const [survey] = await db.insert(surveys).values({ ...data, shortCode }).returning();
    return survey;
  }
  async updateSurvey(id, data) {
    const [updated] = await db.update(surveys).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(surveys.id, id)).returning();
    return updated;
  }
  async deleteSurvey(id) {
    const result = await db.delete(surveys).where(eq(surveys.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async duplicateSurvey(id, userId) {
    const survey = await this.getSurvey(id);
    if (!survey) return void 0;
    const newSurvey = await this.createSurvey({
      name: `${survey.name} (Copy)`,
      description: survey.description,
      status: "draft",
      folderId: survey.folderId,
      settings: survey.settings,
      styling: survey.styling,
      createdBy: userId
    });
    const slides = await this.getSurveySlides(id);
    const fieldIdMap = {};
    for (const slide of slides) {
      const newSlide = await this.createSurveySlide({
        surveyId: newSurvey.id,
        title: slide.title,
        description: slide.description,
        order: slide.order,
        buttonText: slide.buttonText,
        settings: slide.settings
      });
      const fields = await this.getSurveyFieldsBySlide(slide.id);
      for (const field of fields) {
        const newField = await this.createSurveyField({
          surveyId: newSurvey.id,
          slideId: newSlide.id,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          shortLabel: field.shortLabel,
          queryKey: field.queryKey,
          required: field.required,
          hidden: field.hidden,
          options: field.options,
          validation: field.validation,
          settings: field.settings,
          order: field.order
        });
        fieldIdMap[field.id] = newField.id;
      }
    }
    return newSurvey;
  }
  // Survey Slides
  async getSurveySlides(surveyId) {
    return await db.select().from(surveySlides).where(eq(surveySlides.surveyId, surveyId)).orderBy(asc(surveySlides.order));
  }
  async getSurveySlide(id) {
    const [slide] = await db.select().from(surveySlides).where(eq(surveySlides.id, id)).limit(1);
    return slide;
  }
  async createSurveySlide(data) {
    const [slide] = await db.insert(surveySlides).values(data).returning();
    return slide;
  }
  async updateSurveySlide(id, data) {
    const [updated] = await db.update(surveySlides).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(surveySlides.id, id)).returning();
    return updated;
  }
  async deleteSurveySlide(id) {
    const result = await db.delete(surveySlides).where(eq(surveySlides.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async reorderSurveySlides(updates) {
    await Promise.all(
      updates.map(
        ({ id, order }) => db.update(surveySlides).set({ order, updatedAt: /* @__PURE__ */ new Date() }).where(eq(surveySlides.id, id))
      )
    );
  }
  // Survey Fields
  async getSurveyFields(surveyId) {
    return await db.select().from(surveyFields).where(eq(surveyFields.surveyId, surveyId)).orderBy(asc(surveyFields.order));
  }
  async getSurveyFieldsBySlide(slideId) {
    return await db.select().from(surveyFields).where(eq(surveyFields.slideId, slideId)).orderBy(asc(surveyFields.order));
  }
  async getSurveyField(id) {
    const [field] = await db.select().from(surveyFields).where(eq(surveyFields.id, id)).limit(1);
    return field;
  }
  async createSurveyField(data) {
    const [field] = await db.insert(surveyFields).values(data).returning();
    return field;
  }
  async updateSurveyField(id, data) {
    const [updated] = await db.update(surveyFields).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(surveyFields.id, id)).returning();
    return updated;
  }
  async deleteSurveyField(id) {
    const result = await db.delete(surveyFields).where(eq(surveyFields.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async reorderSurveyFields(updates) {
    await Promise.all(
      updates.map(
        ({ id, order }) => db.update(surveyFields).set({ order, updatedAt: /* @__PURE__ */ new Date() }).where(eq(surveyFields.id, id))
      )
    );
  }
  // Survey Logic Rules
  async getSurveyLogicRules(surveyId) {
    return await db.select().from(surveyLogicRules).where(eq(surveyLogicRules.surveyId, surveyId)).orderBy(asc(surveyLogicRules.order));
  }
  async createSurveyLogicRule(data) {
    const [rule] = await db.insert(surveyLogicRules).values(data).returning();
    return rule;
  }
  async updateSurveyLogicRule(id, data) {
    const [updated] = await db.update(surveyLogicRules).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(surveyLogicRules.id, id)).returning();
    return updated;
  }
  async deleteSurveyLogicRule(id) {
    const result = await db.delete(surveyLogicRules).where(eq(surveyLogicRules.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Survey Submissions
  async getSurveySubmissions(surveyId) {
    return await db.select().from(surveySubmissions).where(eq(surveySubmissions.surveyId, surveyId)).orderBy(desc(surveySubmissions.createdAt));
  }
  async getSurveySubmission(id) {
    const [submission] = await db.select().from(surveySubmissions).where(eq(surveySubmissions.id, id)).limit(1);
    return submission;
  }
  async createSurveySubmission(data) {
    const [submission] = await db.insert(surveySubmissions).values(data).returning();
    return submission;
  }
  async updateSurveySubmission(id, data) {
    const [updated] = await db.update(surveySubmissions).set(data).where(eq(surveySubmissions.id, id)).returning();
    return updated;
  }
  async deleteSurveySubmission(id) {
    const result = await db.delete(surveySubmissions).where(eq(surveySubmissions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Survey Submission Answers
  async getSurveySubmissionAnswers(submissionId) {
    return await db.select().from(surveySubmissionAnswers).where(eq(surveySubmissionAnswers.submissionId, submissionId));
  }
  async createSurveySubmissionAnswer(data) {
    const [answer] = await db.insert(surveySubmissionAnswers).values(data).returning();
    return answer;
  }
  async createSurveySubmissionAnswers(answers) {
    if (answers.length === 0) return [];
    return await db.insert(surveySubmissionAnswers).values(answers).returning();
  }
  // Survey with full data (for builder)
  async getSurveyWithDetails(id) {
    const survey = await this.getSurvey(id);
    if (!survey) return void 0;
    const [slides, fields, logicRules] = await Promise.all([
      this.getSurveySlides(id),
      this.getSurveyFields(id),
      this.getSurveyLogicRules(id)
    ]);
    return { survey, slides, fields, logicRules };
  }
  // PX Meetings
  async getPxMeetings() {
    const meetings = await db.select().from(pxMeetings).orderBy(desc(pxMeetings.meetingDate), desc(pxMeetings.meetingTime));
    if (meetings.length === 0) return [];
    const meetingIds = meetings.map((m) => m.id);
    const attendeeRows = await db.execute(sql`
      SELECT pma.meeting_id as "meetingId", s.id, s.first_name as "firstName", s.last_name as "lastName"
      FROM px_meeting_attendees pma
      INNER JOIN staff s ON pma.user_id::uuid = s.id
      WHERE pma.meeting_id IN (${sql.join(meetingIds.map((id) => sql`${id}`), sql`, `)})
    `);
    const attendeesByMeeting = /* @__PURE__ */ new Map();
    for (const row of attendeeRows.rows) {
      const list = attendeesByMeeting.get(row.meetingId) || [];
      list.push({ id: row.id, name: `${row.firstName || ""} ${row.lastName || ""}`.trim() || "Unknown" });
      attendeesByMeeting.set(row.meetingId, list);
    }
    return meetings.map((meeting) => ({
      ...meeting,
      attendees: attendeesByMeeting.get(meeting.id) || []
    }));
  }
  async getPxMeeting(id) {
    const [meeting] = await db.select().from(pxMeetings).where(eq(pxMeetings.id, id)).limit(1);
    if (!meeting) return void 0;
    const attendeeRows = await db.execute(sql`
      SELECT s.id, s.first_name as "firstName", s.last_name as "lastName"
      FROM px_meeting_attendees pma
      INNER JOIN staff s ON pma.user_id::uuid = s.id
      WHERE pma.meeting_id = ${id}
    `);
    return {
      ...meeting,
      attendees: attendeeRows.rows.map((a) => ({
        id: a.id,
        name: `${a.firstName || ""} ${a.lastName || ""}`.trim() || "Unknown"
      }))
    };
  }
  async createPxMeeting(data, attendeeIds) {
    const [meeting] = await db.insert(pxMeetings).values(data).returning();
    if (attendeeIds.length > 0) {
      await db.insert(pxMeetingAttendees).values(
        attendeeIds.map((userId) => ({
          meetingId: meeting.id,
          userId
        }))
      );
    }
    return meeting;
  }
  async updatePxMeeting(id, data, attendeeIds) {
    const [updated] = await db.update(pxMeetings).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(pxMeetings.id, id)).returning();
    if (!updated) return void 0;
    if (attendeeIds !== void 0) {
      await db.delete(pxMeetingAttendees).where(eq(pxMeetingAttendees.meetingId, id));
      if (attendeeIds.length > 0) {
        await db.insert(pxMeetingAttendees).values(
          attendeeIds.map((userId) => ({
            meetingId: id,
            userId
          }))
        );
      }
    }
    return updated;
  }
  async deletePxMeeting(id) {
    const result = await db.delete(pxMeetings).where(eq(pxMeetings.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
};
var storage = new DbStorage();

export {
  storage
};
