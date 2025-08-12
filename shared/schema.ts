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
  type: text("type").notNull(), // text, multiline, email, phone, dropdown, dropdown_multiple, checkbox, radio, date, url, number, currency
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
  type: text("type").notNull(), // email, sms, both
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

// Task Comments
export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  mentions: text("mentions").array(), // Array of user IDs mentioned in the comment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export type ClientProduct = typeof clientProducts.$inferSelect;
export type InsertClientProduct = z.infer<typeof insertClientProductSchema>;

export type ClientBundle = typeof clientBundles.$inferSelect;
export type InsertClientBundle = z.infer<typeof insertClientBundleSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type ClientAppointment = typeof clientAppointments.$inferSelect;
export type InsertClientAppointment = z.infer<typeof insertClientAppointmentSchema>;

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

export type TemplateFolder = typeof templateFolders.$inferSelect;
export type InsertTemplateFolder = z.infer<typeof insertTemplateFolderSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;

export type SmartList = typeof smartLists.$inferSelect;
export type InsertSmartList = z.infer<typeof insertSmartListSchema>;

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
  managerId: uuid("manager_id"),
  birthdate: date("birthdate"),
  
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
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calendar staff assignments (for Personal Booking: 1 user, for Round Robin: multiple users)
export const calendarStaff = pgTable("calendar_staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calendarId: varchar("calendar_id").notNull().references(() => calendars.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true),
  roundRobinOrder: integer("round_robin_order"), // For round robin scheduling order
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar availability settings (per user per calendar)
export const calendarAvailability = pgTable("calendar_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calendarId: varchar("calendar_id").notNull().references(() => calendars.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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

// Calendar appointments/bookings (different from clientAppointments)
export const calendarAppointments = pgTable("calendar_appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calendarId: varchar("calendar_id").notNull().references(() => calendars.id),
  clientId: varchar("client_id").references(() => clients.id), // Can be null for external bookings
  assignedTo: varchar("assigned_to").notNull().references(() => users.id),
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
  cancelledBy: varchar("cancelled_by").references(() => users.id),
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
  lastAssignedUserId: varchar("last_assigned_user_id").references(() => users.id),
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

// Smart Lists schema exports - remove duplicate and use existing one
