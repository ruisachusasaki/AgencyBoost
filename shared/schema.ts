import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for CRM users/admins
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"), // admin, user
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom field folders/sections
export const customFieldFolders = pgTable("custom_field_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  order: integer("order").default(0),
  isDefault: boolean("is_default").default(false),
  canReorder: boolean("can_reorder").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom field definitions
export const customFields = pgTable("custom_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // text, email, phone, dropdown, checkbox, date, url, number, currency
  options: text("options").array(), // for dropdown fields
  required: boolean("required").default(false),
  folderId: varchar("folder_id").references(() => customFieldFolders.id),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client groups/folders
export const clientGroups = pgTable("client_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products/Services
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  type: text("type").notNull(), // one_time, recurring
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client products/services assignments
export const clientProducts = pgTable("client_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  price: decimal("price", { precision: 10, scale: 2 }),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notes
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  isLocked: boolean("is_locked").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  scheduledBy: varchar("scheduled_by").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").default("confirmed"), // confirmed, showed, no_show, cancelled
  meetingLink: text("meeting_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  fileUrl: text("file_url").notNull(),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity log for tracking all client interactions
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // email, sms, call, note, task, appointment, etc.
  description: text("description").notNull(),
  details: jsonb("details"), // Additional data specific to activity type
  clientId: varchar("client_id").notNull().references(() => clients.id),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  status: text("status").notNull().default("active"), // active, inactive, pending
  contactType: text("contact_type").default("client"), // lead, client
  contactSource: text("contact_source"),
  
  // Address fields (replacing single address field)
  address: text("address"),
  address2: text("address2"), // Apt/Suite
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  
  website: text("website"),
  notes: text("notes"),
  tags: text("tags").array(),
  clientVertical: text("client_vertical"), // Live Events, Financial Lead Gen
  contactOwner: varchar("contact_owner").references(() => users.id),
  profileImage: text("profile_image"),
  
  // Billing information
  mrr: decimal("mrr", { precision: 10, scale: 2 }),
  invoicingContact: text("invoicing_contact"),
  invoicingEmail: text("invoicing_email"),
  paymentTerms: text("payment_terms"), // due_upon_receipt, net_7, net_30
  upsideBonus: decimal("upside_bonus", { precision: 5, scale: 2 }),
  
  // Important Resources URLs
  clientBrief: text("client_brief"),
  growthOsDashboard: text("growth_os_dashboard"),
  storyBrand: text("story_brand"),
  styleGuide: text("style_guide"),
  googleDriveFolder: text("google_drive_folder"),
  testingLog: text("testing_log"),
  cornerstoneBlueprint: text("cornerstone_blueprint"),
  customGpt: text("custom_gpt"),
  
  // DND settings
  dndAll: boolean("dnd_all").default(false),
  dndEmail: boolean("dnd_email").default(false),
  dndSms: boolean("dnd_sms").default(false),
  dndCalls: boolean("dnd_calls").default(false),
  
  // Group assignment
  groupId: varchar("group_id").references(() => clientGroups.id),
  
  // Custom field values (JSON object)
  customFieldValues: jsonb("custom_field_values"),
  
  // Followers (users who follow this client)
  followers: varchar("followers").array(),
  
  lastActivity: timestamp("last_activity"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  status: text("status").notNull().default("planning"), // planning, active, completed, cancelled, on_hold
  priority: text("priority").notNull().default("medium"), // low, medium, high
  budget: decimal("budget", { precision: 10, scale: 2 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  progress: integer("progress").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  projectId: varchar("project_id").references(() => projects.id),
  status: text("status").notNull().default("draft"), // draft, active, paused, completed, cancelled
  type: text("type").notNull(), // social_media, ppc, seo, email, content
  budget: decimal("budget", { precision: 10, scale: 2 }),
  spent: decimal("spent", { precision: 10, scale: 2 }).default("0"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  source: text("source"), // website, referral, social_media, advertising, cold_outreach
  status: text("status").notNull().default("new"), // new, qualified, proposal, negotiation, won, lost
  value: decimal("value", { precision: 10, scale: 2 }),
  probability: integer("probability").default(0), // 0-100
  notes: text("notes"),
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
  lastContactDate: timestamp("last_contact_date"),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high
  assignedTo: varchar("assigned_to").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  projectId: varchar("project_id").references(() => projects.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  dueDate: timestamp("due_date"),
  dueTime: text("due_time"), // HH:MM format
  
  // Recurring task settings
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: integer("recurring_interval"), // number for repeats every X
  recurringUnit: text("recurring_unit"), // hours, days, weeks, months, years
  recurringEndType: text("recurring_end_type"), // never, on_date, after_occurrences
  recurringEndDate: timestamp("recurring_end_date"),
  recurringEndOccurrences: integer("recurring_end_occurrences"),
  createIfOverdue: boolean("create_if_overdue").default(false),
  
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  projectId: varchar("project_id").references(() => projects.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  issueDate: timestamp("issue_date").defaultNow(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social Media Accounts
export const socialMediaAccounts = pgTable("social_media_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  platform: text("platform").notNull(), // facebook, instagram, twitter, linkedin, youtube, tiktok, pinterest
  accountName: text("account_name").notNull(),
  username: text("username").notNull(),
  accountId: text("account_id"), // Platform-specific account ID
  accessToken: text("access_token"), // Encrypted access token
  refreshToken: text("refresh_token"), // Encrypted refresh token
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  followers: integer("followers").default(0),
  following: integer("following").default(0),
  posts: integer("posts").default(0),
  profileImage: text("profile_image"),
  bio: text("bio"),
  website: text("website"),
  settings: jsonb("settings"), // Platform-specific settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social Media Posts
export const socialMediaPosts = pgTable("social_media_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  accountId: varchar("account_id").notNull().references(() => socialMediaAccounts.id),
  
  // Post content
  content: text("content").notNull(),
  hashtags: text("hashtags").array(),
  mentions: text("mentions").array(),
  mediaUrls: text("media_urls").array(),
  mediaType: text("media_type"), // image, video, carousel, story
  linkUrl: text("link_url"),
  linkPreview: jsonb("link_preview"),
  
  // Scheduling
  status: text("status").notNull().default("draft"), // draft, scheduled, published, failed
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  
  // Platform-specific data
  platformPostId: text("platform_post_id"), // ID from the social platform
  platformData: jsonb("platform_data"), // Platform-specific metadata
  
  // Engagement metrics
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  impressions: integer("impressions").default(0),
  reach: integer("reach").default(0),
  clicks: integer("clicks").default(0),
  saves: integer("saves").default(0),
  
  // Approval workflow
  requiresApproval: boolean("requires_approval").default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  
  authorId: varchar("author_id").notNull().references(() => users.id),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social Media Content Templates
export const socialMediaTemplates = pgTable("social_media_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // promotional, educational, engagement, announcement
  platforms: text("platforms").array(), // which platforms this template works for
  contentTemplate: text("content_template").notNull(),
  hashtagSuggestions: text("hashtag_suggestions").array(),
  mediaRequirements: jsonb("media_requirements"), // image dimensions, video length, etc.
  isPublic: boolean("is_public").default(false), // shared across all clients
  clientId: varchar("client_id").references(() => clients.id), // null for public templates
  authorId: varchar("author_id").notNull().references(() => users.id),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social Media Analytics Snapshots
export const socialMediaAnalytics = pgTable("social_media_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => socialMediaAccounts.id),
  date: timestamp("date").notNull(),
  
  // Account metrics
  followers: integer("followers").default(0),
  following: integer("following").default(0),
  posts: integer("posts").default(0),
  
  // Engagement metrics (daily totals)
  totalLikes: integer("total_likes").default(0),
  totalComments: integer("total_comments").default(0),
  totalShares: integer("total_shares").default(0),
  totalImpressions: integer("total_impressions").default(0),
  totalReach: integer("total_reach").default(0),
  totalClicks: integer("total_clicks").default(0),
  totalSaves: integer("total_saves").default(0),
  
  // Calculated metrics
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default("0"),
  impressionReachRatio: decimal("impression_reach_ratio", { precision: 5, scale: 2 }).default("0"),
  
  // Platform-specific metrics
  platformData: jsonb("platform_data"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCustomFieldFolderSchema = createInsertSchema(customFieldFolders).omit({
  id: true,
  createdAt: true,
});

export const insertCustomFieldSchema = createInsertSchema(customFields).omit({
  id: true,
  createdAt: true,
});

export const insertClientGroupSchema = createInsertSchema(clientGroups).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertClientProductSchema = createInsertSchema(clientProducts).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertSocialMediaAccountSchema = createInsertSchema(socialMediaAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialMediaTemplateSchema = createInsertSchema(socialMediaTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialMediaAnalyticsSchema = createInsertSchema(socialMediaAnalytics).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CustomFieldFolder = typeof customFieldFolders.$inferSelect;
export type InsertCustomFieldFolder = z.infer<typeof insertCustomFieldFolderSchema>;

export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;

export type ClientGroup = typeof clientGroups.$inferSelect;
export type InsertClientGroup = z.infer<typeof insertClientGroupSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ClientProduct = typeof clientProducts.$inferSelect;
export type InsertClientProduct = z.infer<typeof insertClientProductSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;
export type InsertSocialMediaAccount = z.infer<typeof insertSocialMediaAccountSchema>;

export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;

export type SocialMediaTemplate = typeof socialMediaTemplates.$inferSelect;
export type InsertSocialMediaTemplate = z.infer<typeof insertSocialMediaTemplateSchema>;

export type SocialMediaAnalytics = typeof socialMediaAnalytics.$inferSelect;
export type InsertSocialMediaAnalytics = z.infer<typeof insertSocialMediaAnalyticsSchema>;

// Workflow System Tables
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  clientId: varchar("client_id").references(() => clients.id),
  category: text("category"), // lead_management, email_marketing, task_automation, deal_management
  status: text("status").notNull().default("draft"), // draft, active, paused, archived
  trigger: jsonb("trigger").notNull(), // trigger configuration
  actions: jsonb("actions").notNull(), // array of actions
  conditions: jsonb("conditions"), // branching logic
  settings: jsonb("settings"), // workflow-specific settings
  isTemplate: boolean("is_template").default(false),
  templateCategory: text("template_category"),
  version: integer("version").default(1),
  lastRun: timestamp("last_run"),
  totalRuns: integer("total_runs").default(0),
  successfulRuns: integer("successful_runs").default(0),
  failedRuns: integer("failed_runs").default(0),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workflowExecutions = pgTable("workflow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  contactId: varchar("contact_id").references(() => clients.id),
  triggerData: jsonb("trigger_data"),
  status: text("status").notNull(), // running, completed, failed, cancelled
  currentStep: integer("current_step").default(0),
  totalSteps: integer("total_steps").notNull(),
  executionLog: jsonb("execution_log"), // detailed log of each step
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  nextRunAt: timestamp("next_run_at"), // for scheduled actions
});

export const workflowTemplates = pgTable("workflow_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  industry: text("industry"),
  useCase: text("use_case"),
  trigger: jsonb("trigger").notNull(),
  actions: jsonb("actions").notNull(),
  conditions: jsonb("conditions"),
  settings: jsonb("settings"),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  tags: text("tags").array(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced Task Management
export const taskCategories = pgTable("task_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull(),
  icon: text("icon"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskTemplates = pgTable("task_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => taskCategories.id),
  priority: text("priority").notNull().default("medium"),
  estimatedDuration: integer("estimated_duration"), // in minutes
  instructions: text("instructions"),
  checklist: jsonb("checklist"), // array of checklist items
  requiredFields: jsonb("required_fields"),
  assigneeRole: text("assignee_role"),
  tags: text("tags").array(),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: jsonb("recurrence_pattern"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const enhancedTasks = pgTable("enhanced_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => taskCategories.id),
  templateId: varchar("template_id").references(() => taskTemplates.id),
  clientId: varchar("client_id").references(() => clients.id),
  projectId: varchar("project_id").references(() => projects.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  workflowId: varchar("workflow_id").references(() => workflows.id),
  parentTaskId: varchar("parent_task_id"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("todo"), // todo, in_progress, review, blocked, completed, cancelled
  progress: integer("progress").default(0), // 0-100
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  dueDate: timestamp("due_date"),
  startDate: timestamp("start_date"),
  completedAt: timestamp("completed_at"),
  tags: text("tags").array(),
  checklist: jsonb("checklist"), // array of subtasks
  attachments: jsonb("attachments"), // file attachments
  dependencies: text("dependencies").array(), // task IDs this depends on
  followers: text("followers").array(), // users following this task
  customFields: jsonb("custom_fields"),
  timeEntries: jsonb("time_entries"), // time tracking
  comments: jsonb("comments"), // task comments/notes
  reminderSettings: jsonb("reminder_settings"),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: jsonb("recurrence_pattern"),
  recurringGroupId: text("recurring_group_id"),
  automationData: jsonb("automation_data"), // data from workflow automation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskHistory = pgTable("task_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => enhancedTasks.id).notNull(),
  action: text("action").notNull(), // created, updated, completed, assigned, commented
  field: text("field"), // which field was changed
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  userId: varchar("user_id").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").notNull(),
  notes: text("notes"),
});

export const automationTriggers = pgTable("automation_triggers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // form_submission, contact_created, deal_stage_change, task_completed, email_opened, etc.
  description: text("description"),
  category: text("category").notNull(), // contact, deal, task, email, time_based, webhook
  configSchema: jsonb("config_schema"), // JSON schema for configuration
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const automationActions = pgTable("automation_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // send_email, create_task, update_contact, assign_deal, wait, etc.
  description: text("description"),
  category: text("category").notNull(), // communication, task_management, data_management, flow_control
  configSchema: jsonb("config_schema"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications and Alerts
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // task_due, workflow_completed, assignment, mention, system
  title: text("title").notNull(),
  message: text("message").notNull(),
  entityType: text("entity_type"), // task, workflow, client, deal
  entityId: text("entity_id"),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  actionUrl: text("action_url"),
  actionText: text("action_text"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for workflow system
export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
});

export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskCategorySchema = createInsertSchema(taskCategories).omit({
  id: true,
  createdAt: true,
});

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEnhancedTaskSchema = createInsertSchema(enhancedTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertTaskHistorySchema = createInsertSchema(taskHistory).omit({
  id: true,
});

export const insertAutomationTriggerSchema = createInsertSchema(automationTriggers).omit({
  id: true,
  createdAt: true,
});

export const insertAutomationActionSchema = createInsertSchema(automationActions).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Export enhanced workflow and task types
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;

export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = z.infer<typeof insertWorkflowTemplateSchema>;

export type TaskCategory = typeof taskCategories.$inferSelect;
export type InsertTaskCategory = z.infer<typeof insertTaskCategorySchema>;

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;

export type EnhancedTask = typeof enhancedTasks.$inferSelect;
export type InsertEnhancedTask = z.infer<typeof insertEnhancedTaskSchema>;

export type TaskHistory = typeof taskHistory.$inferSelect;
export type InsertTaskHistory = z.infer<typeof insertTaskHistorySchema>;

export type AutomationTrigger = typeof automationTriggers.$inferSelect;
export type InsertAutomationTrigger = z.infer<typeof insertAutomationTriggerSchema>;

export type AutomationAction = typeof automationActions.$inferSelect;
export type InsertAutomationAction = z.infer<typeof insertAutomationActionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
