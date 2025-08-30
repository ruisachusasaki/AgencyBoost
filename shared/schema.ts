import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, uuid, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for CRM users/admins
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  extension: text("extension"),
  role: text("role").notNull().default("User"), // Admin, Manager, User, Accounting
  status: text("status").notNull().default("active"), // active, inactive
  profileImage: text("profile_image"),
  signature: text("signature"),
  signatureEnabled: boolean("signature_enabled").default(false),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Profile Settings
export const businessProfile = pgTable("business_profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  businessType: text("business_type"),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  timezone: text("timezone").default("America/New_York"),
  logo: text("logo"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("United States"),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  type: text("type").notNull(), // text, multiline, email, phone, dropdown, dropdown_multiple, checkbox, radio, date, url, number, currency, file_upload
  options: text("options").array(), // for dropdown fields
  required: boolean("required").default(false),
  folderId: varchar("folder_id").references(() => customFieldFolders.id),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client notes - locked after creation, admin-only editing
export const clientNotes = pgTable("client_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  content: text("content").notNull(),
  createdById: uuid("created_by_id").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  editedBy: uuid("edited_by").references(() => staff.id),
  editedAt: timestamp("edited_at"),
  isLocked: boolean("is_locked").default(true), // Locked after creation
});

// Client tasks - enhanced with recurring functionality
export const clientTasks = pgTable("client_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, completed, overdue
  assignedTo: uuid("assigned_to").references(() => staff.id),
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: jsonb("recurrence_pattern"), // {type: 'daily/weekly/monthly', interval: 1, endType: 'never/date/count', endValue: null}
  createEvenIfOverdue: boolean("create_even_if_overdue").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client appointments - calendaring functionality
export const clientAppointments = pgTable("client_appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  status: text("status").notNull().default("confirmed"), // confirmed, showed, no_show, cancelled
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client documents - file uploads
export const clientDocuments = pgTable("client_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // pdf, xls, xlsx, jpg, png, doc, docx
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client payments/transactions (placeholder for future invoicing integration)
export const clientTransactions = pgTable("client_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  type: text("type").notNull(), // transaction, subscription, invoice
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  status: text("status").notNull(), // pending, completed, failed, cancelled
  transactionDate: timestamp("transaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tags for organizing clients
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").default("#46a1a0"), // Color for visual distinction
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client groups/folders
export const clientGroups = pgTable("client_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Categories
export const productCategories = pgTable("product_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products/Services - Cost-focused for agency profitability tracking
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  type: text("type").notNull(), // one_time, recurring
  categoryId: varchar("category_id").references(() => productCategories.id),
  status: text("status").notNull().default("active"), // active, inactive
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Bundles
export const productBundles = pgTable("product_bundles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bundle Products relationship (many-to-many) - just defines which products belong to a bundle
export const bundleProducts = pgTable("bundle_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id").notNull().references(() => productBundles.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  // Removed quantity - each product is 1 unit by default, client-specific quantities stored in clientBundles
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

// Client bundle assignments
export const clientBundles = pgTable("client_bundles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  bundleId: varchar("bundle_id").notNull().references(() => productBundles.id),
  price: decimal("price", { precision: 10, scale: 2 }),
  status: text("status").default("active"),
  customQuantities: jsonb("custom_quantities"), // Client-specific quantities: { "product_id": quantity }
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
  contactOwner: uuid("contact_owner").references(() => staff.id),
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

// Project templates for recurring project types
export const projectTemplates = pgTable("project_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").default("General"), // Marketing Campaign, Website Development, SEO Audit, etc.
  priority: text("priority").notNull().default("medium"), // low, medium, high
  estimatedDuration: integer("estimated_duration"), // in days
  estimatedBudget: decimal("estimated_budget", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0), // track how many times template is used
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Template tasks - predefined tasks for project templates
export const templateTasks = pgTable("template_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => projectTemplates.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("normal"), // urgent, high, normal, low
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  dayOffset: integer("day_offset").default(0), // days after project start
  dependsOn: varchar("depends_on_task_id"), // reference to another template task (same template)
  assignToRole: text("assign_to_role"), // "project_manager", "designer", "developer", etc.
  order: integer("order").default(0),
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

// Template folders for organizing email/SMS templates
export const templateFolders = pgTable("template_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // email, sms, workflow, both
  parentId: varchar("parent_id"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email templates
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(), // HTML content
  plainTextContent: text("plain_text_content"),
  previewText: text("preview_text"),
  folderId: varchar("folder_id").references(() => templateFolders.id),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SMS templates
export const smsTemplates = pgTable("sms_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  content: text("content").notNull(),
  folderId: varchar("folder_id").references(() => templateFolders.id),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Pipeline Stages - Customizable stages for lead management
export const leadPipelineStages = pgTable("lead_pipeline_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#6b7280"), // hex color for stage display
  order: integer("order").notNull().default(0),
  isDefault: boolean("is_default").default(false), // default stage for new leads
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  source: text("source"), // website, referral, social_media, advertising, cold_outreach
  status: text("status").notNull().default("new"), // will be deprecated in favor of stageId
  stageId: varchar("stage_id").references(() => leadPipelineStages.id),
  value: decimal("value", { precision: 10, scale: 2 }),
  probability: integer("probability").default(0), // 0-100
  notes: text("notes"),
  assignedTo: uuid("assigned_to").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  lastContactDate: timestamp("last_contact_date"),
  customFieldData: jsonb("custom_field_data"), // custom field values
  stageHistory: jsonb("stage_history").default([]), // track stage movements
  tags: text("tags").array().default([]), // array of tag names
});

// Smart Lists for saved client filters
export const smartLists = pgTable("smart_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  filters: jsonb("filters").notNull(), // JSON object containing filter criteria
  createdBy: varchar("created_by").notNull().references(() => users.id),
  visibility: text("visibility").notNull().default("personal"), // personal, shared, universal
  sharedWith: text("shared_with").array(), // Array of user IDs for shared lists
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  priority: text("priority").notNull().default("normal"), // urgent, high, normal, low
  categoryId: varchar("category_id").references(() => taskCategories.id), // Category for workflow assignment
  workflowId: varchar("workflow_id").references(() => teamWorkflows.id), // Direct workflow assignment
  assignedTo: uuid("assigned_to").references(() => staff.id),
  clientId: varchar("client_id").references(() => clients.id),
  projectId: varchar("project_id").references(() => projects.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  dueDate: timestamp("due_date"),
  startDate: timestamp("start_date"),
  dueTime: text("due_time"), // HH:MM format
  timeEstimate: integer("time_estimate"), // estimated time in minutes
  timeTracked: integer("time_tracked").default(0), // actual time tracked in minutes
  timeEntries: jsonb("time_entries").default(sql`'[]'`), // array of time tracking entries
  
  // Sub-task hierarchy support (up to 5 levels deep)
  parentTaskId: varchar("parent_task_id"), // Self-reference added after table definition
  level: integer("level").default(0), // 0 = root task, 1-5 = sub-task levels
  taskPath: text("task_path"), // Hierarchical path like "root_id/sub1_id/sub2_id" for efficient querying
  hasSubTasks: boolean("has_sub_tasks").default(false), // Cache field for performance
  
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

// Task Dependencies - Define prerequisite relationships between tasks
export const taskDependencies = pgTable("task_dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  dependsOnTaskId: varchar("depends_on_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  dependencyType: text("dependency_type").notNull().default("finish_to_start"), // finish_to_start, start_to_start, finish_to_finish, start_to_finish
  createdAt: timestamp("created_at").defaultNow(),
});

// Task Comments
export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  mentions: text("mentions").array(), // Array of user IDs mentioned in the comment
  parentId: varchar("parent_id"), // For threaded replies - will reference task_comments.id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Comment Reactions
export const taskCommentReactions = pgTable("task_comment_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => taskComments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: varchar("emoji").notNull(), // The emoji reaction (👍, ❤️, 😊, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

// File uploads for comments
export const commentFiles = pgTable("comment_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => taskComments.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // pdf, doc, docx, jpg, png, etc.
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(), // Object storage URL
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Image annotations for collaborative feedback on uploaded images
export const imageAnnotations = pgTable("image_annotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").notNull(), // Can reference either commentFiles or taskAttachments
  x: decimal("x", { precision: 5, scale: 2 }).notNull(), // X coordinate as percentage (0-100)
  y: decimal("y", { precision: 5, scale: 2 }).notNull(), // Y coordinate as percentage (0-100)
  content: text("content").notNull(), // Annotation text/comment
  mentions: text("mentions").array().default([]), // Array of mentioned user IDs
  authorId: varchar("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HR System - Time Off Policies (company-wide settings)
export const timeOffPolicies = pgTable("time_off_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  vacationDaysDefault: integer("vacation_days_default").default(15),
  sickDaysDefault: integer("sick_days_default").default(10),
  personalDaysDefault: integer("personal_days_default").default(3),
  carryOverAllowed: boolean("carry_over_allowed").default(false),
  maxCarryOverDays: integer("max_carry_over_days").default(0),
  policyDocument: text("policy_document"), // Rich text content
  effectiveDate: date("effective_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HR System - Time Off Requests
export const timeOffRequests = pgTable("time_off_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // PTO, Sick Leave, Unpaid Time Off
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  totalHours: decimal("total_hours", { precision: 5, scale: 2 }).notNull().default("0"),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: uuid("approved_by").references(() => staff.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HR System - Time Off Request Daily Details (for hour-by-hour breakdown)
export const timeOffRequestDays = pgTable("time_off_request_days", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timeOffRequestId: varchar("time_off_request_id").notNull().references(() => timeOffRequests.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// HR System - Job Applications
export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  positionId: varchar("position_id"),
  positionTitle: varchar("position_title").notNull(), // Add the missing position_title column
  applicantName: text("applicant_name").notNull(),
  applicantEmail: text("applicant_email").notNull(),
  applicantPhone: text("applicant_phone"),
  resumeUrl: text("resume_url"),
  coverLetterUrl: text("cover_letter_url"),
  portfolioUrl: text("portfolio_url"),
  stage: text("stage").notNull().default("new"), // new, review, interview, not_selected, test_sent, send_offer, offer_sent, offer_accepted, offer_rejected
  rating: integer("rating").default(0), // 1-5 star rating
  notes: text("notes"),
  assignedRecruiter: uuid("assigned_recruiter").references(() => staff.id),
  appliedAt: timestamp("applied_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  scheduledInterviewDate: timestamp("scheduled_interview_date"),
  salaryExpectation: decimal("salary_expectation", { precision: 10, scale: 2 }),
  experience: text("experience"), // junior, mid, senior
  source: text("source"), // website, referral, linkedin, job_board
  customFieldData: jsonb("custom_field_data") // for storing custom form field values
});

// HR System - Application Stage History
export const applicationStageHistory = pgTable("application_stage_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => jobApplications.id, { onDelete: "cascade" }),
  fromStage: text("from_stage"),
  toStage: text("to_stage").notNull(),
  changedBy: uuid("changed_by").notNull().references(() => staff.id),
  notes: text("notes"),
  changedAt: timestamp("changed_at").defaultNow(),
});

// HR System - Job Application Comments
export const jobApplicationComments = pgTable("job_application_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => jobApplications.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorId: uuid("author_id").notNull().references(() => staff.id),
  authorName: text("author_name").notNull(), // cached for display
  isInternal: boolean("is_internal").default(true), // internal team comments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HR System - Time Off Balances (for tracking remaining days)
export const timeOffBalances = pgTable("time_off_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  vacationDays: integer("vacation_days").default(20),
  sickDays: integer("sick_days").default(10),
  personalDays: integer("personal_days").default(5),
  vacationUsed: integer("vacation_used").default(0),
  sickUsed: integer("sick_used").default(0),
  personalUsed: integer("personal_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Activities for audit trail
export const taskActivities = pgTable("task_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  actionType: varchar("action_type").notNull(), // 'status_change', 'date_change', 'assignee_change', 'time_tracking'
  fieldName: varchar("field_name"), // 'status', 'startDate', 'dueDate', 'assignedTo', 'timeTracked'
  oldValue: text("old_value"),
  newValue: text("new_value"),
  userId: varchar("user_id"), // who made the change
  userName: varchar("user_name"), // cached user name for display
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



export const insertClientProductSchema = createInsertSchema(clientProducts).omit({
  id: true,
  createdAt: true,
});

export const insertClientBundleSchema = createInsertSchema(clientBundles).omit({
  id: true,
  createdAt: true,
});

export const insertClientAppointmentSchema = createInsertSchema(clientAppointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
}).extend({
  startDate: z.union([z.string(), z.date()]).transform((val) => val ? new Date(val) : undefined).optional(),
  endDate: z.union([z.string(), z.date()]).transform((val) => val ? new Date(val) : undefined).optional(),
});

export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export const insertTemplateTaskSchema = createInsertSchema(templateTasks).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateFolderSchema = createInsertSchema(templateFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUsed: true,
  usageCount: true,
});

export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUsed: true,
  usageCount: true,
});

export const insertSmartListSchema = createInsertSchema(smartLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadPipelineStagSchema = createInsertSchema(leadPipelineStages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
}).extend({
  value: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => {
    if (val === '' || val === null || val === undefined) return null;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed.toString();
    }
    return val?.toString() || null;
  }),
  probability: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => {
    if (val === '' || val === null || val === undefined) return 0;
    if (typeof val === 'string') {
      const parsed = parseInt(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val || 0;
  }),
  tags: z.array(z.string()).optional().default([]),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  level: true, // Auto-calculated based on parent hierarchy
  taskPath: true, // Auto-calculated based on parent hierarchy
  hasSubTasks: true, // Auto-calculated when sub-tasks exist
}).extend({
  startDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val || val === '' || val === null) return null;
    if (val instanceof Date) return val;
    return new Date(val);
  }),
  dueDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val || val === '' || val === null) return null;
    if (val instanceof Date) return val;
    return new Date(val);
  }),
  recurringEndDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val || val === '' || val === null) return null;
    if (val instanceof Date) return val;
    return new Date(val);
  }),
  // Ensure recurring fields are properly typed
  isRecurring: z.boolean().optional().default(false),
  recurringInterval: z.number().optional(),
  recurringUnit: z.enum(["hours", "days", "weeks", "months", "years"]).optional(),
  recurringEndType: z.enum(["never", "on_date", "after_occurrences"]).optional(),
  recurringEndOccurrences: z.number().optional(),
  createIfOverdue: z.boolean().optional().default(false),
});

export const insertTaskActivitySchema = createInsertSchema(taskActivities).omit({
  id: true,
  createdAt: true,
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

// Insert schemas for task comments and file uploads
export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskCommentReactionSchema = createInsertSchema(taskCommentReactions).omit({
  id: true,
  createdAt: true,
});

export const insertCommentFileSchema = createInsertSchema(commentFiles).omit({
  id: true,
  createdAt: true,
});

export const insertImageAnnotationSchema = createInsertSchema(imageAnnotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type TaskComment = typeof taskComments.$inferSelect;
export type TaskCommentReaction = typeof taskCommentReactions.$inferSelect;
export type CommentFile = typeof commentFiles.$inferSelect;
export type ImageAnnotation = typeof imageAnnotations.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type InsertTaskCommentReaction = z.infer<typeof insertTaskCommentReactionSchema>;
export type InsertCommentFile = z.infer<typeof insertCommentFileSchema>;
export type InsertImageAnnotation = z.infer<typeof insertImageAnnotationSchema>;

// HR System Schema Exports and Types
export const insertTimeOffRequestSchema = createInsertSchema(timeOffRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  appliedAt: true,
  lastUpdated: true,
});

export const insertApplicationStageHistorySchema = createInsertSchema(applicationStageHistory).omit({
  id: true,
  changedAt: true,
});

export const insertTimeOffBalanceSchema = createInsertSchema(timeOffBalances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeOffRequestDaySchema = createInsertSchema(timeOffRequestDays).omit({
  id: true,
  createdAt: true,
});

export type TimeOffRequest = typeof timeOffRequests.$inferSelect;
export type InsertTimeOffRequest = z.infer<typeof insertTimeOffRequestSchema>;
export type TimeOffRequestDay = typeof timeOffRequestDays.$inferSelect;
export type InsertTimeOffRequestDay = z.infer<typeof insertTimeOffRequestDaySchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type JobApplicationComment = typeof jobApplicationComments.$inferSelect;
export type InsertJobApplicationComment = typeof jobApplicationComments.$inferInsert;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type ApplicationStageHistory = typeof applicationStageHistory.$inferSelect;
export type InsertApplicationStageHistory = z.infer<typeof insertApplicationStageHistorySchema>;
export type TimeOffBalance = typeof timeOffBalances.$inferSelect;
export type InsertTimeOffBalance = z.infer<typeof insertTimeOffBalanceSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CustomFieldFolder = typeof customFieldFolders.$inferSelect;
export type InsertCustomFieldFolder = z.infer<typeof insertCustomFieldFolderSchema>;

export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;

export type ClientGroup = typeof clientGroups.$inferSelect;
export type InsertClientGroup = z.infer<typeof insertClientGroupSchema>;

export type ClientProduct = typeof clientProducts.$inferSelect;
export type InsertClientProduct = z.infer<typeof insertClientProductSchema>;

export type ClientBundle = typeof clientBundles.$inferSelect;
export type InsertClientBundle = z.infer<typeof insertClientBundleSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;

export type TemplateTask = typeof templateTasks.$inferSelect;
export type InsertTemplateTask = z.infer<typeof insertTemplateTaskSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type TemplateFolder = typeof templateFolders.$inferSelect;
export type InsertTemplateFolder = z.infer<typeof insertTemplateFolderSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;

export type SmartList = typeof smartLists.$inferSelect;
export type InsertSmartList = z.infer<typeof insertSmartListSchema>;

export type LeadPipelineStage = typeof leadPipelineStages.$inferSelect;
export type InsertLeadPipelineStage = z.infer<typeof insertLeadPipelineStagSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskActivity = typeof taskActivities.$inferSelect;
export type InsertTaskActivity = z.infer<typeof insertTaskActivitySchema>;

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
  folderId: varchar("folder_id").references(() => templateFolders.id),
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
  workflowId: varchar("workflow_id").references(() => teamWorkflows.id), // workflow for this category
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
  assignedTo: uuid("assigned_to").references(() => staff.id),
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
  userId: varchar("user_id").notNull(), // Staff ID stored as string - no foreign key to avoid type mismatch
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

// Roles and Permissions System
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").default(false), // System roles cannot be deleted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  module: text("module").notNull(), // clients, projects, campaigns, tasks, invoices, reports, settings, etc.
  canView: boolean("can_view").default(false),
  canCreate: boolean("can_create").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  canManage: boolean("can_manage").default(false), // for settings and admin functions
  canExport: boolean("can_export").default(false), // export data permissions
  canImport: boolean("can_import").default(false), // import data permissions
  
  // Data access level - CRM best practice for data segmentation
  dataAccessLevel: text("data_access_level").notNull().default("own"), // own, team, department, all
  
  // Field-level restrictions for sensitive data
  restrictedFields: text("restricted_fields").array(), // fields user cannot view/edit
  readOnlyFields: text("read_only_fields").array(), // fields user can view but not edit
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  assignedBy: uuid("assigned_by").references(() => staff.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Permission Audit Trail - Specialized audit logging for permission changes
export const permissionAuditLogs = pgTable("permission_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditType: text("audit_type").notNull(), // role_created, role_updated, role_deleted, role_assigned, role_unassigned, permission_changed
  
  // Role-related fields
  roleId: varchar("role_id").references(() => roles.id),
  roleName: text("role_name"),
  
  // User assignment fields
  targetUserId: uuid("target_user_id").references(() => staff.id), // User who received/lost role
  targetUserName: text("target_user_name"),
  
  // Permission change details
  moduleAffected: text("module_affected"), // Which module permissions changed
  permissionsBefore: jsonb("permissions_before"), // Previous permission state
  permissionsAfter: jsonb("permissions_after"), // New permission state
  
  // Change summary
  changesSummary: text("changes_summary").notNull(), // Human-readable description
  changesCount: integer("changes_count").default(0), // Number of permission changes
  
  // Actor information
  performedBy: uuid("performed_by").references(() => staff.id),
  performedByName: text("performed_by_name").notNull(),
  
  // Technical details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sessionId: text("session_id"),
  
  // Risk assessment
  riskLevel: text("risk_level").default("low"), // low, medium, high, critical
  isElevatedPermission: boolean("is_elevated_permission").default(false), // True if admin/manage permissions changed
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Permission Change History - Detailed tracking of individual permission modifications
export const permissionChangeHistory = pgTable("permission_change_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditLogId: varchar("audit_log_id").notNull().references(() => permissionAuditLogs.id, { onDelete: "cascade" }),
  
  module: text("module").notNull(),
  permissionType: text("permission_type").notNull(), // canView, canCreate, canEdit, canDelete, canManage
  
  oldValue: boolean("old_value"),
  newValue: boolean("new_value").notNull(),
  
  changeType: text("change_type").notNull(), // granted, revoked, modified
  
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

// Insert schemas for new client functionality
export const insertClientNoteSchema = createInsertSchema(clientNotes).omit({
  id: true,
  createdAt: true,
  editedAt: true,
});

export const insertClientTaskSchema = createInsertSchema(clientTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientDocumentSchema = createInsertSchema(clientDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertClientTransactionSchema = createInsertSchema(clientTransactions).omit({
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

// Export types for new client functionality
export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = z.infer<typeof insertClientNoteSchema>;

export type ClientTask = typeof clientTasks.$inferSelect;
export type InsertClientTask = z.infer<typeof insertClientTaskSchema>;

export type ClientAppointment = typeof clientAppointments.$inferSelect;
export type InsertClientAppointment = z.infer<typeof insertClientAppointmentSchema>;

export type ClientDocument = typeof clientDocuments.$inferSelect;
export type InsertClientDocument = z.infer<typeof insertClientDocumentSchema>;

export type ClientTransaction = typeof clientTransactions.$inferSelect;
export type InsertClientTransaction = z.infer<typeof insertClientTransactionSchema>;

// Departments and Positions Management
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  workflowId: varchar("workflow_id").references(() => teamWorkflows.id), // team's custom workflow
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  departmentId: varchar("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff Management
export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  roleId: varchar("role_id").references(() => roles.id),
  profileImagePath: text("profile_image_path"),
  
  // Address fields
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  country: varchar("country", { length: 100 }),
  
  // Additional profile fields
  hireDate: date("hire_date"),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  managerId: uuid("manager_id"),
  birthdate: date("birthdate"),
  assignedCalendarId: varchar("assigned_calendar_id"), // Links to calendar assignment
  
  // Time off entitlements (annual allocation)
  vacationDaysAnnually: integer("vacation_days_annually").default(15), // Default 15 vacation days per year
  sickDaysAnnually: integer("sick_days_annually").default(10), // Default 10 sick days per year
  personalDaysAnnually: integer("personal_days_annually").default(3), // Default 3 personal days per year

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

// Job Openings Management
export const jobOpenings = pgTable("job_openings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: varchar("department_id").notNull().references(() => departments.id),
  positionId: varchar("position_id").notNull().references(() => positions.id),
  status: text("status").notNull().default("draft"), // draft, open, on_hold, filled, canceled
  hiringManagerId: uuid("hiring_manager_id").notNull().references(() => staff.id),
  employmentType: text("employment_type").notNull(), // full_time, part_time
  compensation: decimal("compensation", { precision: 12, scale: 2 }),
  compensationType: text("compensation_type").default("annual"), // annual, hourly
  jobDescription: text("job_description"), // Can be overridden from position description
  requirements: text("requirements"),
  benefits: text("benefits"),
  
  // Approval workflow
  createdById: uuid("created_by_id").notNull().references(() => staff.id),
  approvalStatus: text("approval_status").notNull().default("pending"), // pending, approved, rejected
  approvedById: uuid("approved_by_id").references(() => staff.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  
  // Posting information
  isPublic: boolean("is_public").default(false), // Whether visible on public job board
  externalPostingUrl: text("external_posting_url"), // Link to external job posting
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobOpeningSchema = createInsertSchema(jobOpenings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type JobOpening = typeof jobOpenings.$inferSelect;
export type InsertJobOpening = z.infer<typeof insertJobOpeningSchema>;

// Department and Position schema exports
export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

// Tags schema exports
export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

// Product Categories schema exports
export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

// Products schema exports
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Product Bundles schema exports
export const insertProductBundleSchema = createInsertSchema(productBundles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBundleProductSchema = createInsertSchema(bundleProducts).omit({
  id: true,
  createdAt: true,
});

export type ProductBundle = typeof productBundles.$inferSelect;
export type InsertProductBundle = z.infer<typeof insertProductBundleSchema>;
export type BundleProduct = typeof bundleProducts.$inferSelect;
export type InsertBundleProduct = z.infer<typeof insertBundleProductSchema>;

// Audit Logs Table - Track all system actions for admin oversight
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(), // created, updated, deleted
  entityType: text("entity_type").notNull(), // contact, project, campaign, task, invoice, etc.
  entityId: varchar("entity_id").notNull(), // ID of the affected entity
  entityName: text("entity_name").notNull(), // Name/title of the affected entity
  userId: uuid("user_id").notNull().references(() => staff.id), // Who performed the action
  details: text("details").notNull(), // Description of what changed
  oldValues: jsonb("old_values"), // Previous values (for updates)
  newValues: jsonb("new_values"), // New values (for updates/creates)
  ipAddress: text("ip_address"), // IP address of the user
  userAgent: text("user_agent"), // Browser/client information
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Roles and Permissions schema exports
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  assignedAt: true,
});

export const insertPermissionAuditLogSchema = createInsertSchema(permissionAuditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertPermissionChangeHistorySchema = createInsertSchema(permissionChangeHistory).omit({
  id: true,
  createdAt: true,
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;

export type PermissionAuditLog = typeof permissionAuditLogs.$inferSelect;
export type InsertPermissionAuditLog = z.infer<typeof insertPermissionAuditLogSchema>;

export type PermissionChangeHistory = typeof permissionChangeHistory.$inferSelect;
export type InsertPermissionChangeHistory = z.infer<typeof insertPermissionChangeHistorySchema>;

// Notification Settings Table - User notification preferences
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  
  // Client assignment notifications
  clientAssignedInApp: boolean("client_assigned_in_app").default(true),
  clientAssignedEmail: boolean("client_assigned_email").default(true),
  clientAssignedSms: boolean("client_assigned_sms").default(false),
  
  // Internal chat notifications  
  chatAddedInApp: boolean("chat_added_in_app").default(true),
  chatAddedEmail: boolean("chat_added_email").default(false),
  chatAddedSms: boolean("chat_added_sms").default(false),
  
  // Chat messages notifications (In-App only for all messages)
  chatMessagesInApp: boolean("chat_messages_in_app").default(true),
  
  // Mention notifications
  mentionedInApp: boolean("mentioned_in_app").default(true),
  mentionedEmail: boolean("mentioned_email").default(true),
  mentionedSms: boolean("mentioned_sms").default(false),
  
  // Mention follow-up notifications
  mentionFollowUpInApp: boolean("mention_follow_up_in_app").default(true),
  mentionFollowUpEmail: boolean("mention_follow_up_email").default(false),
  mentionFollowUpSms: boolean("mention_follow_up_sms").default(false),
  
  // Task assignment notifications
  taskAssignedInApp: boolean("task_assigned_in_app").default(true),
  taskAssignedEmail: boolean("task_assigned_email").default(true),
  taskAssignedSms: boolean("task_assigned_sms").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;

// Calendar System Tables

// Calendar definitions (Personal Booking or Round Robin)
export const calendars = pgTable("calendars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'personal' or 'round_robin'
  customUrl: text("custom_url").notNull().unique(), // URL slug for public booking
  duration: integer("duration").notNull(), // meeting duration in minutes
  durationUnit: text("duration_unit").notNull().default("minutes"), // 'minutes' or 'hours'
  location: text("location"), // 'google_meet', 'zoom', 'phone', 'in_person', 'custom'
  locationDetails: text("location_details"), // Custom location text or meeting link template
  bufferTime: integer("buffer_time").default(15), // minutes between meetings
  scheduleWindowStart: integer("schedule_window_start").default(24), // hours ahead minimum
  scheduleWindowEnd: integer("schedule_window_end").default(1440), // hours ahead maximum (60 days)
  isActive: boolean("is_active").default(true),
  customFieldIds: text("custom_field_ids").array(), // Array of custom field IDs to show on booking form
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calendar staff assignments (for Personal Booking: 1 user, for Round Robin: multiple users)
export const calendarStaff = pgTable("calendar_staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calendarId: varchar("calendar_id").notNull().references(() => calendars.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true),
  roundRobinOrder: integer("round_robin_order"), // For round robin scheduling order
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar availability settings (per staff per calendar)
export const calendarAvailability = pgTable("calendar_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calendarId: varchar("calendar_id").notNull().references(() => calendars.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ... 6=Saturday
  startTime: text("start_time").notNull(), // HH:MM format (24-hour)
  endTime: text("end_time").notNull(), // HH:MM format (24-hour)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar date-specific overrides (holidays, vacation, extra hours)
export const calendarDateOverrides = pgTable("calendar_date_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calendarId: varchar("calendar_id").notNull().references(() => calendars.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  type: text("type").notNull(), // 'blocked', 'custom_hours'
  startTime: text("start_time"), // For custom hours (HH:MM format)
  endTime: text("end_time"), // For custom hours (HH:MM format)
  reason: text("reason"), // Optional reason for blocking/override
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar integrations (Google Calendar, Outlook, etc.)
export const calendarIntegrations = pgTable("calendar_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'google', 'outlook', 'apple'
  externalCalendarId: text("external_calendar_id").notNull(),
  accessToken: text("access_token").notNull(), // Encrypted OAuth token
  refreshToken: text("refresh_token"), // Encrypted OAuth refresh token
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncErrors: text("sync_errors"), // Latest sync error messages
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Notes - Multiple notes per lead  
export const leadNotes = pgTable("lead_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => staff.id),
  isLocked: boolean("is_locked").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Appointments - Calendar appointments specific to leads
export const leadAppointments = pgTable("lead_appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  calendarId: varchar("calendar_id").notNull().references(() => calendars.id),
  assignedTo: uuid("assigned_to").notNull().references(() => staff.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  status: text("status").notNull().default("confirmed"), // confirmed, showed, no_show, cancelled
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Notes schema exports
export const insertLeadNoteSchema = createInsertSchema(leadNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LeadNote = typeof leadNotes.$inferSelect;
export type InsertLeadNote = z.infer<typeof insertLeadNoteSchema>;

// Lead Appointments schema exports  
export const insertLeadAppointmentSchema = createInsertSchema(leadAppointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LeadAppointment = typeof leadAppointments.$inferSelect;
export type InsertLeadAppointment = z.infer<typeof insertLeadAppointmentSchema>;

// Calendar appointments/bookings (different from clientAppointments)
export const calendarAppointments = pgTable("calendar_appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calendarId: varchar("calendar_id").notNull().references(() => calendars.id),
  clientId: varchar("client_id").references(() => clients.id), // Can be null for external bookings
  assignedTo: uuid("assigned_to").notNull().references(() => staff.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("confirmed"), // 'confirmed', 'showed', 'no_show', 'cancelled'
  location: text("location"),
  locationDetails: text("location_details"),
  meetingLink: text("meeting_link"), // Generated meeting link for virtual meetings
  timezone: text("timezone").notNull(),
  // Booking form data
  bookerName: text("booker_name"),
  bookerEmail: text("booker_email").notNull(),
  bookerPhone: text("booker_phone"),
  customFieldData: jsonb("custom_field_data"), // Responses to custom fields
  // External calendar integration
  externalEventId: text("external_event_id"), // ID from external calendar (Google, Outlook)
  // Metadata
  bookingSource: text("booking_source").notNull().default("public"), // 'public', 'admin', 'api'
  bookingIp: text("booking_ip"),
  bookingUserAgent: text("booking_user_agent"),
  // Cancellation details
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: uuid("cancelled_by").references(() => staff.id),
  cancellationReason: text("cancellation_reason"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointment reminders
export const appointmentReminders = pgTable("appointment_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appointmentId: varchar("appointment_id").notNull().references(() => calendarAppointments.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'email', 'sms'
  sendAt: timestamp("send_at").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"), // 'pending', 'sent', 'failed'
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Round robin tracking for fair distribution
export const roundRobinTracking = pgTable("round_robin_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calendarId: varchar("calendar_id").notNull().references(() => calendars.id, { onDelete: "cascade" }),
  lastAssignedStaffId: uuid("last_assigned_staff_id").references(() => staff.id),
  assignmentCount: jsonb("assignment_count"), // {userId: count} for tracking assignments
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calendar schemas and types
export const insertCalendarSchema = createInsertSchema(calendars).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarStaffSchema = createInsertSchema(calendarStaff).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarAvailabilitySchema = createInsertSchema(calendarAvailability).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarDateOverrideSchema = createInsertSchema(calendarDateOverrides).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarIntegrationSchema = createInsertSchema(calendarIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarAppointmentSchema = createInsertSchema(calendarAppointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentReminderSchema = createInsertSchema(appointmentReminders).omit({
  id: true,
  createdAt: true,
});

export const insertRoundRobinTrackingSchema = createInsertSchema(roundRobinTracking).omit({
  id: true,
  updatedAt: true,
});

// Export types
export type Calendar = typeof calendars.$inferSelect;
export type InsertCalendar = z.infer<typeof insertCalendarSchema>;

export type CalendarStaff = typeof calendarStaff.$inferSelect;
export type InsertCalendarStaff = z.infer<typeof insertCalendarStaffSchema>;

export type CalendarAvailability = typeof calendarAvailability.$inferSelect;
export type InsertCalendarAvailability = z.infer<typeof insertCalendarAvailabilitySchema>;

export type CalendarDateOverride = typeof calendarDateOverrides.$inferSelect;
export type InsertCalendarDateOverride = z.infer<typeof insertCalendarDateOverrideSchema>;

export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type InsertCalendarIntegration = z.infer<typeof insertCalendarIntegrationSchema>;

export type CalendarAppointment = typeof calendarAppointments.$inferSelect;
export type InsertCalendarAppointment = z.infer<typeof insertCalendarAppointmentSchema>;

export type AppointmentReminder = typeof appointmentReminders.$inferSelect;
export type InsertAppointmentReminder = z.infer<typeof insertAppointmentReminderSchema>;

export type RoundRobinTracking = typeof roundRobinTracking.$inferSelect;
export type InsertRoundRobinTracking = z.infer<typeof insertRoundRobinTrackingSchema>;

// Custom field file uploads - for file upload custom fields
export const customFieldFileUploads = pgTable("custom_field_file_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  customFieldId: varchar("custom_field_id").notNull().references(() => customFields.id),
  fileName: text("file_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(), // Object storage path
  uploadedBy: uuid("uploaded_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomFieldFileUploadSchema = createInsertSchema(customFieldFileUploads).omit({
  id: true,
  createdAt: true,
});

export type CustomFieldFileUpload = typeof customFieldFileUploads.$inferSelect;
export type InsertCustomFieldFileUpload = z.infer<typeof insertCustomFieldFileUploadSchema>;

// Task attachments - for file attachments to tasks
export const taskAttachments = pgTable("task_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(), // Object storage URL
  uploadedBy: uuid("uploaded_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskAttachmentSchema = createInsertSchema(taskAttachments).omit({
  id: true,
  createdAt: true,
});

export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type InsertTaskAttachment = z.infer<typeof insertTaskAttachmentSchema>;

// Task Settings Tables - for admin configuration

// Task Statuses - customizable status options for tasks
export const taskStatuses = pgTable("task_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // e.g., "In Progress", "Under Review"
  value: text("value").notNull().unique(), // e.g., "in_progress", "under_review" - used in code
  color: text("color").notNull().default("#6b7280"), // hex color for badges
  description: text("description"),
  sortOrder: integer("sort_order").default(0), // for custom ordering
  isDefault: boolean("is_default").default(false), // one default status for new tasks
  isActive: boolean("is_active").default(true),
  isSystemStatus: boolean("is_system_status").default(false), // system statuses can't be deleted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team Workflows - define status flows for different teams/departments
export const teamWorkflows = pgTable("team_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Video Production Workflow"
  description: text("description"),
  isDefault: boolean("is_default").default(false), // default workflow for new departments
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team Workflow Statuses - maps statuses to team workflows with ordering
export const teamWorkflowStatuses = pgTable("team_workflow_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => teamWorkflows.id, { onDelete: "cascade" }),
  statusId: varchar("status_id").notNull().references(() => taskStatuses.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0), // status order within workflow
  isRequired: boolean("is_required").default(false), // if true, tasks must pass through this status
  createdAt: timestamp("created_at").defaultNow(),
});

// Task Priorities - customizable priority levels for tasks  
export const taskPriorities = pgTable("task_priorities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // e.g., "Critical", "High", "Medium"
  value: text("value").notNull().unique(), // e.g., "critical", "high", "medium" - used in code
  color: text("color").notNull().default("#6b7280"), // hex color for badges
  icon: text("icon").default("flag"), // lucide icon name
  description: text("description"),
  sortOrder: integer("sort_order").default(0), // for custom ordering (higher values = higher priority)
  isDefault: boolean("is_default").default(false), // one default priority for new tasks
  isActive: boolean("is_active").default(true),
  isSystemPriority: boolean("is_system_priority").default(false), // system priorities can't be deleted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Note: taskCategories already exists earlier in schema, reusing that table

// Task Global Settings - system-wide task configuration
export const taskSettings = pgTable("task_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(), // e.g., "default_status", "require_due_date"
  settingValue: jsonb("setting_value").notNull(), // flexible JSON value
  description: text("description"),
  updatedBy: uuid("updated_by").references(() => staff.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas for the new task settings tables
export const insertTaskStatusSchema = createInsertSchema(taskStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskPrioritySchema = createInsertSchema(taskPriorities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Using existing insertTaskCategorySchema defined earlier in file

export const insertTaskSettingsSchema = createInsertSchema(taskSettings).omit({
  id: true,
  updatedAt: true,
});

// Export types for the new tables
export type TaskStatus = typeof taskStatuses.$inferSelect;
export type InsertTaskStatus = z.infer<typeof insertTaskStatusSchema>;

export type TaskPriority = typeof taskPriorities.$inferSelect;
export type InsertTaskPriority = z.infer<typeof insertTaskPrioritySchema>;

// Using existing TaskCategory and InsertTaskCategory types defined earlier in file

export type TaskSettings = typeof taskSettings.$inferSelect;
export type InsertTaskSettings = z.infer<typeof insertTaskSettingsSchema>;

// Team Workflow schema exports
export const insertTeamWorkflowSchema = createInsertSchema(teamWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamWorkflowStatusSchema = createInsertSchema(teamWorkflowStatuses).omit({
  id: true,
  createdAt: true,
});

export type TeamWorkflow = typeof teamWorkflows.$inferSelect;
export type InsertTeamWorkflow = z.infer<typeof insertTeamWorkflowSchema>;

export type TeamWorkflowStatus = typeof teamWorkflowStatuses.$inferSelect;
export type InsertTeamWorkflowStatus = z.infer<typeof insertTeamWorkflowStatusSchema>;

// Form folders - for organizing forms
export const formFolders = pgTable("form_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(0),
  isDefault: boolean("is_default").default(false),
  canReorder: boolean("can_reorder").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Forms - for drag-and-drop form builder
export const forms = pgTable("forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  folderId: varchar("folder_id").references(() => formFolders.id),
  settings: jsonb("settings").default({}), // form settings like submit text, redirect url, etc.
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Form fields - the actual fields within forms
export const formFields = pgTable("form_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => forms.id),
  type: text("type").notNull(), // text, email, phone, dropdown, checkbox, radio, date, number, rating, html, terms_conditions, image, button, custom_field
  label: text("label"),
  placeholder: text("placeholder"),
  required: boolean("required").default(false),
  options: text("options").array(), // for dropdown/radio fields
  validation: jsonb("validation").default({}), // validation rules
  settings: jsonb("settings").default({}), // field-specific settings (rating max, html content, etc.)
  customFieldId: varchar("custom_field_id").references(() => customFields.id), // reference to existing custom field if selected
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Form submissions - when someone fills out a form
export const formSubmissions = pgTable("form_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => forms.id),
  data: jsonb("data").notNull(), // submitted form data
  submitterEmail: text("submitter_email"),
  submitterName: text("submitter_name"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Job Application Form Configuration - stores the customizable form field configuration
export const jobApplicationFormConfig = pgTable("job_application_form_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fields: jsonb("fields").notNull(), // Array of form field configurations
  updatedBy: varchar("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobApplicationFormConfigSchema = createInsertSchema(jobApplicationFormConfig).omit({
  id: true,
  updatedAt: true,
});

export type JobApplicationFormConfig = typeof jobApplicationFormConfig.$inferSelect;
export type InsertJobApplicationFormConfig = z.infer<typeof insertJobApplicationFormConfigSchema>;

export const insertFormFieldSchema = createInsertSchema(formFields).omit({
  id: true,
  createdAt: true,
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertFormFolderSchema = createInsertSchema(formFolders).omit({
  id: true,
  createdAt: true,
});

export type FormFolder = typeof formFolders.$inferSelect;
export type InsertFormFolder = z.infer<typeof insertFormFolderSchema>;

export type Form = typeof forms.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;

export type FormField = typeof formFields.$inferSelect;
export type InsertFormField = z.infer<typeof insertFormFieldSchema>;

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;

// Task Dependencies schema exports
export const insertTaskDependencySchema = createInsertSchema(taskDependencies).omit({
  id: true,
  createdAt: true,
});

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = z.infer<typeof insertTaskDependencySchema>;

// Client Team Assignments - for assigning staff to specific client positions
export const clientTeamAssignments = pgTable("client_team_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  position: text("position").notNull(), // setter, bdr, account_manager, media_buyer, cro_specialist, automation_specialist, show_rate_specialist, data_specialist, seo_specialist, social_media_specialist
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: uuid("assigned_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client Team Assignments schema exports
export const insertClientTeamAssignmentSchema = createInsertSchema(clientTeamAssignments).omit({
  id: true,
  assignedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type ClientTeamAssignment = typeof clientTeamAssignments.$inferSelect;
export type InsertClientTeamAssignment = z.infer<typeof insertClientTeamAssignmentSchema>;

// Knowledge Base Categories - for organizing articles
export const knowledgeBaseCategories: ReturnType<typeof pgTable> = pgTable("knowledge_base_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  parentId: varchar("parent_id").references(() => knowledgeBaseCategories.id), // for nested categories
  order: integer("order").default(0),
  icon: text("icon"), // lucide icon name
  color: text("color"), // hex color for category
  isVisible: boolean("is_visible").default(true),
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Knowledge Base Articles - the actual content
export const knowledgeBaseArticles: ReturnType<typeof pgTable> = pgTable("knowledge_base_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // rich editor content in blocks format
  excerpt: text("excerpt"), // brief description for search/listing
  categoryId: varchar("category_id").references(() => knowledgeBaseCategories.id),
  parentId: varchar("parent_id").references(() => knowledgeBaseArticles.id), // for nested articles
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  order: integer("order").default(0),
  status: text("status").notNull().default("published"), // draft, published, archived
  featuredImage: text("featured_image"), // optional cover image
  tags: text("tags").array(), // searchable tags
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  isPublic: boolean("is_public").default(true), // public or restricted access
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastViewedAt: timestamp("last_viewed_at"),
});

// Knowledge Base Article Permissions - for access control
export const knowledgeBasePermissions = pgTable("knowledge_base_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceType: text("resource_type").notNull(), // "category" or "article"
  resourceId: varchar("resource_id").notNull(), // category or article id
  accessType: text("access_type").notNull(), // "role" or "user"
  accessId: text("access_id").notNull(), // role name or user id
  permission: text("permission").notNull().default("read"), // read, write, admin
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge Base Bookmarks - user favorites
export const knowledgeBaseBookmarks = pgTable("knowledge_base_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge Base Likes - for article popularity
export const knowledgeBaseLikes = pgTable("knowledge_base_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge Base Comments - with @mention support
export const knowledgeBaseComments: ReturnType<typeof pgTable> = pgTable("knowledge_base_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id").references(() => knowledgeBaseComments.id), // for threaded comments
  content: text("content").notNull(),
  mentions: text("mentions").array(), // user IDs mentioned in comment
  authorId: uuid("author_id").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Knowledge Base Views - for tracking recent/popular content
export const knowledgeBaseViews = pgTable("knowledge_base_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => staff.id), // null for anonymous views
  viewedAt: timestamp("viewed_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Knowledge Base Settings - for system configuration
export const knowledgeBaseSettings = pgTable("knowledge_base_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedBy: uuid("updated_by").notNull().references(() => staff.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Knowledge Base schema exports
export const insertKnowledgeBaseCategorySchema = createInsertSchema(knowledgeBaseCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKnowledgeBaseArticleSchema = createInsertSchema(knowledgeBaseArticles).omit({
  id: true,
  viewCount: true,
  likeCount: true,
  createdAt: true,
  updatedAt: true,
  lastViewedAt: true,
});

export const insertKnowledgeBasePermissionSchema = createInsertSchema(knowledgeBasePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeBaseBookmarkSchema = createInsertSchema(knowledgeBaseBookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeBaseLikeSchema = createInsertSchema(knowledgeBaseLikes).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeBaseCommentSchema = createInsertSchema(knowledgeBaseComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKnowledgeBaseViewSchema = createInsertSchema(knowledgeBaseViews).omit({
  id: true,
  viewedAt: true,
});

export const insertKnowledgeBaseSettingSchema = createInsertSchema(knowledgeBaseSettings).omit({
  id: true,
  updatedAt: true,
});

export type KnowledgeBaseCategory = typeof knowledgeBaseCategories.$inferSelect;
export type InsertKnowledgeBaseCategory = z.infer<typeof insertKnowledgeBaseCategorySchema>;

export type KnowledgeBaseArticle = typeof knowledgeBaseArticles.$inferSelect;
export type InsertKnowledgeBaseArticle = z.infer<typeof insertKnowledgeBaseArticleSchema>;

export type KnowledgeBasePermission = typeof knowledgeBasePermissions.$inferSelect;
export type InsertKnowledgeBasePermission = z.infer<typeof insertKnowledgeBasePermissionSchema>;

export type KnowledgeBaseBookmark = typeof knowledgeBaseBookmarks.$inferSelect;
export type InsertKnowledgeBaseBookmark = z.infer<typeof insertKnowledgeBaseBookmarkSchema>;

export type KnowledgeBaseLike = typeof knowledgeBaseLikes.$inferSelect;
export type InsertKnowledgeBaseLike = z.infer<typeof insertKnowledgeBaseLikeSchema>;

export type KnowledgeBaseComment = typeof knowledgeBaseComments.$inferSelect;
export type InsertKnowledgeBaseComment = z.infer<typeof insertKnowledgeBaseCommentSchema>;

export type KnowledgeBaseView = typeof knowledgeBaseViews.$inferSelect;
export type InsertKnowledgeBaseView = z.infer<typeof insertKnowledgeBaseViewSchema>;

export type KnowledgeBaseSetting = typeof knowledgeBaseSettings.$inferSelect;
export type InsertKnowledgeBaseSetting = z.infer<typeof insertKnowledgeBaseSettingSchema>;

// Smart Lists schema exports - remove duplicate and use existing one
