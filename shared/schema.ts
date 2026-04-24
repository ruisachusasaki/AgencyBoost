import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, uuid, date, serial, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// SECURITY: UUID generation with fallback for maximum compatibility
// Uses gen_random_uuid() if available, otherwise falls back to Node.js crypto.randomUUID()
const uuidDefault = sql`COALESCE(
  (SELECT gen_random_uuid()), 
  ('${sql.placeholder('fallback_uuid')}'::uuid)
)`;

// Helper function to ensure UUID generation always works
function getSecureUUID() {
  try {
    // Try to use crypto.randomUUID for fallback
    return crypto.randomUUID();
  } catch {
    // Ultimate fallback - generate a UUID-like string
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

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
  type: text("type").notNull(), // text, multiline, email, phone, dropdown, dropdown_multiple, checkbox, radio, date, url, number, currency, file_upload, contact_card
  options: text("options").array(), // for dropdown fields
  required: boolean("required").default(false),
  placeholderText: text("placeholder_text"),
  tooltipText: text("tooltip_text"),
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

// Client contacts - multiple contacts per client
export const clientContacts = pgTable("client_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  title: text("title"), // Job title/role at the company
  isPrimary: boolean("is_primary").default(false),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  price: decimal("price", { precision: 10, scale: 2 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  type: text("type").notNull(), // one_time, recurring
  categoryId: varchar("category_id").references(() => productCategories.id),
  status: text("status").notNull().default("active"), // active, inactive
  salesTooltip: text("sales_tooltip"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Bundles
export const productBundles = pgTable("product_bundles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("recurring"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bundle Products relationship (many-to-many) - defines which products belong to a bundle with quantities
export const bundleProducts = pgTable("bundle_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id").notNull().references(() => productBundles.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Packages - groups of products AND bundles
export const productPackages = pgTable("product_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  buildFee: decimal("build_fee", { precision: 10, scale: 2 }),
  monthlyRetailPrice: decimal("monthly_retail_price", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Package Items relationship - defines which products and/or bundles belong to a package
export const packageItems = pgTable("package_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packageId: varchar("package_id").notNull().references(() => productPackages.id),
  productId: varchar("product_id").references(() => products.id),
  bundleId: varchar("bundle_id").references(() => productBundles.id),
  itemType: text("item_type").notNull(), // 'product' or 'bundle'
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client products/services assignments
export const clientProducts = pgTable("client_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  price: decimal("price", { precision: 10, scale: 2 }),
  quantity: integer("quantity").notNull().default(1), // per-client quantity (e.g. 4 hours/month)
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

// Client package assignments
export const clientPackages = pgTable("client_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  packageId: varchar("package_id").notNull().references(() => productPackages.id),
  price: decimal("price", { precision: 10, scale: 2 }),
  status: text("status").default("active"),
  customQuantities: jsonb("custom_quantities"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales Quotes
export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  leadId: varchar("lead_id").references(() => leads.id),
  name: text("name").notNull(),
  clientBudget: decimal("client_budget", { precision: 10, scale: 2 }).notNull(),
  desiredMargin: decimal("desired_margin", { precision: 5, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default('0'),
  buildFee: decimal("build_fee", { precision: 10, scale: 2 }).default('0'),
  oneTimeCost: decimal("one_time_cost", { precision: 10, scale: 2 }).default('0'),
  monthlyCost: decimal("monthly_cost", { precision: 10, scale: 2 }).default('0'),
  status: text("status").notNull().default("draft"), // draft, pending_approval, approved, sent, signed, completed, accepted, rejected
  notes: text("notes"),
  viewCount: integer("view_count").default(0),
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  approvedBy: uuid("approved_by").references(() => staff.id),
  approvedAt: timestamp("approved_at"),
  publicToken: varchar("public_token"),
  signedAt: timestamp("signed_at"),
  signedByName: varchar("signed_by_name"),
  signedByEmail: varchar("signed_by_email"),
  signerIpAddress: varchar("signer_ip_address"),
  signatureData: text("signature_data"),
  termsAccepted: boolean("terms_accepted"),
  termsVersionId: varchar("terms_version_id"),
  paymentMethod: varchar("payment_method"),
  paymentIntentId: varchar("payment_intent_id"),
  paymentStatus: varchar("payment_status"),
  paidAt: timestamp("paid_at"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  paymentAmountType: varchar("payment_amount_type"),
  customPaymentAmount: decimal("custom_payment_amount", { precision: 10, scale: 2 }),
  billingMode: varchar("billing_mode").default("trial"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status"),
  stripeCustomerId: varchar("stripe_customer_id"),
  customAgreement: text("custom_agreement"),
  reminderSentAt: timestamp("reminder_sent_at"),
  reminderCount: integer("reminder_count").default(0),
  expiresAt: timestamp("expires_at"),
  sentAt: timestamp("sent_at"),
  sentByUserId: uuid("sent_by_user_id"),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quote Items (Products/Bundles in a quote)
export const quoteItems = pgTable("quote_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").notNull().references(() => quotes.id),
  productId: varchar("product_id").references(() => products.id),
  bundleId: varchar("bundle_id").references(() => productBundles.id),
  packageId: varchar("package_id").references(() => productPackages.id),
  itemType: text("item_type").notNull(), // 'product', 'bundle', or 'package'
  quantity: integer("quantity").notNull().default(1),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  customQuantities: jsonb("custom_quantities"), // For bundles: map of productId to quantity
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales Settings - global sales configuration
export const salesSettings = pgTable("sales_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  minimumMarginThreshold: decimal("minimum_margin_threshold", { precision: 5, scale: 2 }).notNull().default('35.00'), // percentage - quotes below this require approval
  updatedBy: uuid("updated_by").references(() => staff.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales Targets - monthly revenue targets
export const salesTargets = pgTable("sales_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  createdBy: uuid("created_by").references(() => staff.id),
  updatedBy: uuid("updated_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.year, table.month),
]);

// Capacity Settings - team capacity management for predictive hiring alerts
export const capacitySettings = pgTable("capacity_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  department: text("department").notNull(), // Department name (e.g., "Sales", "Marketing")
  role: text("role"), // Optional role filter (e.g., "Account Manager")
  maxClientsPerStaff: integer("max_clients_per_staff").notNull().default(10),
  alertThreshold: decimal("alert_threshold", { precision: 5, scale: 2 }).notNull().default('80.00'), // percentage - alert when team reaches this capacity
  notifyUserIds: text("notify_user_ids").array(), // Optional: specific staff IDs to notify. If empty, notifies all managers/admins
  notificationMessage: text("notification_message"), // Optional: custom message template. Supports placeholders: {department}, {role}, {capacity_percentage}, {current_clients}, {predicted_clients}, {max_capacity}
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by").references(() => staff.id),
  updatedBy: uuid("updated_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity log for tracking all client interactions
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // email, sms, call, note, task, appointment, etc.
  description: text("description").notNull(),
  details: jsonb("details"), // Additional data specific to activity type
  clientId: varchar("client_id").notNull().references(() => clients.id),
  userId: varchar("user_id").references(() => staff.id),
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
  contactOwner: uuid("contact_owner").references(() => staff.id),
  profileImage: text("profile_image"),
  
  // Billing information
  invoicingContact: text("invoicing_contact"),
  invoicingEmail: text("invoicing_email"),
  paymentTerms: text("payment_terms"), // due_upon_receipt, net_7, net_30
  upsideBonus: decimal("upside_bonus", { precision: 5, scale: 2 }),
  
  // Client Brief Sections - 8 separate fields for comprehensive client information
  briefBackground: text("brief_background"), // Background
  briefObjectives: text("brief_objectives"), // Objectives/Goals
  briefBrandInfo: text("brief_brand_info"), // Brand Info
  briefAudienceInfo: text("brief_audience_info"), // Audience Info
  briefProductsServices: text("brief_products_services"), // Products/Services
  briefCompetitors: text("brief_competitors"), // Competitors
  briefMarketingTech: text("brief_marketing_tech"), // Marketing Tech
  briefMiscellaneous: text("brief_miscellaneous"), // Miscellaneous

  // Important Resources URLs
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
  
  // Roadmap - rich text field for client roadmap
  roadmap: text("roadmap"),
  
  // Custom field values (JSON object)
  customFieldValues: jsonb("custom_field_values"),
  
  // Computed display name for performance (auto-updated from custom fields)
  
  // Followers (users who follow this client)
  followers: varchar("followers").array(),
  
  clientBrief: text("client_brief"),
  lastActivity: timestamp("last_activity"),
  isArchived: boolean("is_archived").default(false),
  onboardingToken: varchar("onboarding_token"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingProgress: jsonb("onboarding_progress"),
  onboardingCurrentStep: integer("onboarding_current_step").default(0),
  onboardingStartDate: timestamp("onboarding_start_date"),
  onboardingWeekReleased: integer("onboarding_week_released").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client Roadmap Entries - Monthly roadmap entries for clients
export const clientRoadmapEntries = pgTable("client_roadmap_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  content: text("content"), // Rich text content
  authorId: uuid("author_id").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.clientId, table.year, table.month),
]);

export const insertClientRoadmapEntrySchema = createInsertSchema(clientRoadmapEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export type ClientRoadmapEntry = typeof clientRoadmapEntries.$inferSelect;
export type InsertClientRoadmapEntry = z.infer<typeof insertClientRoadmapEntrySchema>;

// Client Roadmap Comments - Comments on client roadmaps with @mention support
export const clientRoadmapComments = pgTable("client_roadmap_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  roadmapEntryId: varchar("roadmap_entry_id").references(() => clientRoadmapEntries.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorId: uuid("author_id").notNull().references(() => staff.id),
  mentions: text("mentions").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientRoadmapCommentSchema = createInsertSchema(clientRoadmapComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ClientRoadmapComment = typeof clientRoadmapComments.$inferSelect;
export type InsertClientRoadmapComment = z.infer<typeof insertClientRoadmapCommentSchema>;

// Client Portal Users - Manages access to client-facing portal
export const clientPortalUsers = pgTable("client_portal_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  lastActivity: timestamp("last_activity"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate emails per client
  uniqueClientEmail: {
    columns: [table.clientId, table.email],
    unique: true
  }
}));

// Client Health Scores - Weekly scoring system for client performance tracking
export const clientHealthScores = pgTable("client_health_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  weekStartDate: date("week_start_date").notNull(), // Monday of the scoring week
  weekEndDate: date("week_end_date").notNull(), // Sunday of the scoring week
  weeklyRecap: text("weekly_recap"), // Large text input for weekly summary
  opportunities: text("opportunities"), // Large text input for opportunities
  solutions: text("solutions"), // Large text input for solutions
  goals: text("goals").notNull(), // 'Above', 'On Track', 'Below'
  fulfillment: text("fulfillment").notNull(), // 'Early', 'On Time', 'Behind'
  relationship: text("relationship").notNull(), // 'Engaged', 'Passive', 'Disengaged'
  clientActions: text("client_actions").notNull(), // 'Early', 'Up to Date', 'Late'
  paymentStatus: text("payment_status").notNull().default("Current"), // 'Current', 'Past Due', 'HOLD'
  totalScore: integer("total_score").notNull(), // Calculated from the 5 scoring fields
  averageScore: decimal("average_score", { precision: 3, scale: 2 }).notNull(), // totalScore / 5
  healthIndicator: text("health_indicator").notNull(), // 'Green', 'Yellow', 'Red'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate scores for same client and week
  uniqueClientWeek: {
    columns: [table.clientId, table.weekStartDate],
    unique: true
  }
}));

// Client Brief Sections - Configuration for dynamic brief sections (core + custom)
export const clientBriefSections = pgTable("client_brief_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // unique slug identifier (e.g., 'briefBackground', 'custom_section_1')
  title: text("title").notNull(), // display title (e.g., 'Background', 'Custom Section')
  placeholder: text("placeholder"), // placeholder text for input fields
  icon: text("icon").notNull().default("FileText"), // lucide-react icon name
  displayOrder: integer("display_order").notNull().default(0), // order for display
  isEnabled: boolean("is_enabled").notNull().default(true), // can be disabled without deletion
  scope: text("scope").notNull().default("custom"), // 'core' (existing 8 sections) or 'custom' (user-created)
  type: text("type").notNull().default("text"), // 'text' or 'rich_text'
  defaultTemplate: text("default_template"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client Brief Values - Stores values for custom sections (core sections use client table columns)
export const clientBriefValues = pgTable("client_brief_values", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  sectionId: varchar("section_id").notNull().references(() => clientBriefSections.id),
  value: text("value"), // text content for the section
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate values for same client and section
  uniqueClientSection: {
    columns: [table.clientId, table.sectionId],
    unique: true
  }
}));

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  status: text("status").notNull().default("planning"),
  priority: text("priority").notNull().default("medium"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  progress: integer("progress").default(0),
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
  createdBy: uuid("created_by").notNull().references(() => staff.id),
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
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scheduled Emails for delayed sending
export const scheduledEmails = pgTable("scheduled_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toEmail: text("to_email").notNull(),
  ccEmails: text("cc_emails").array(),
  bccEmails: text("bcc_emails").array(),
  subject: text("subject").notNull(),
  content: text("content").notNull(), // HTML content
  plainTextContent: text("plain_text_content"),
  templateId: varchar("template_id").references(() => emailTemplates.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  timezone: text("timezone").notNull().default("America/New_York"),
  status: text("status").notNull().default("pending"), // pending, sent, failed, cancelled
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scheduled Hired Welcome Emails
export const scheduledHiredEmails = pgTable("scheduled_hired_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => jobApplications.id),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  timezone: text("timezone").notNull().default("America/New_York"),
  status: text("status").notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  createdBy: varchar("created_by"),
  candidateName: text("candidate_name"),
  positionTitle: text("position_title"),
  createdAt: timestamp("created_at").defaultNow(),
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

// Lead Sources - Customizable source options for lead tracking
export const leadSources = pgTable("lead_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Note Templates - Pre-built note templates for sales reps
export const leadNoteTemplates = pgTable("lead_note_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  order: integer("order").notNull().default(0),
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
  status: text("status").notNull().default("Open"), // Lead status: Open, Lost, Won, Abandon
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
  projectedCloseDate: timestamp("projected_close_date"), // calculated from business days input
  isConverted: boolean("is_converted").default(false),
  convertedAt: timestamp("converted_at"),
  clientId: varchar("client_id"),
  convertedBy: text("converted_by"),
});

// Lead Stage Transitions - Track stage movements for pipeline analytics
export const leadStageTransitions = pgTable("lead_stage_transitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  fromStageId: varchar("from_stage_id").references(() => leadPipelineStages.id),
  toStageId: varchar("to_stage_id").notNull().references(() => leadPipelineStages.id),
  transitionedAt: timestamp("transitioned_at").notNull().defaultNow(),
  transitionedBy: uuid("transitioned_by").references(() => staff.id),
}, (table) => [
  index("idx_stage_transitions_lead").on(table.leadId),
  index("idx_stage_transitions_date").on(table.transitionedAt),
  index("idx_stage_transitions_stages").on(table.fromStageId, table.toStageId),
  index("idx_lead_stage_transitions_to_stage_date").on(table.toStageId, table.transitionedAt),
  index("idx_lead_stage_transitions_from_stage_date").on(table.fromStageId, table.transitionedAt),
]);

// Sales Activities - Track appointments, pitches, demos, etc.
export const salesActivities = pgTable("sales_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // appointment, pitch, demo, follow_up, proposal_sent
  outcome: text("outcome"), // scheduled, completed, no_show, cancelled, won, lost
  notes: text("notes"),
  assignedTo: uuid("assigned_to").notNull().references(() => staff.id),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sales_activities_lead").on(table.leadId),
  index("idx_sales_activities_rep").on(table.assignedTo),
  index("idx_sales_activities_type").on(table.type),
  index("idx_sales_activities_rep_date").on(table.assignedTo, table.createdAt),
  index("idx_sales_activities_lead_date").on(table.leadId, table.createdAt),
]);

// Deals - Track won deals with MRR and contract details
export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  clientId: varchar("client_id").references(() => clients.id),
  name: text("name").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  mrr: decimal("mrr", { precision: 10, scale: 2 }), // Monthly Recurring Revenue
  isRecurring: boolean("is_recurring").default(false),
  contractTerm: integer("contract_term"), // in months
  assignedTo: uuid("assigned_to").notNull().references(() => staff.id),
  wonDate: timestamp("won_date").notNull().defaultNow(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("active"), // active, paused, cancelled, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_deals_rep").on(table.assignedTo),
  index("idx_deals_won_date").on(table.wonDate),
  index("idx_deals_lead").on(table.leadId),
  index("idx_deals_rep_won_date").on(table.assignedTo, table.wonDate),
]);

// Smart Lists for saved client and task filters
export const smartLists = pgTable("smart_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  entityType: text("entity_type").notNull().default("clients"), // clients, tasks
  filters: jsonb("filters").notNull(), // JSON object containing filter criteria
  createdBy: uuid("created_by").notNull().references(() => staff.id),
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
  status: text("status").notNull().default("todo"), // todo, in_progress, completed, cancelled
  priority: text("priority").notNull().default("normal"), // urgent, high, normal, low
  categoryId: varchar("category_id").references(() => taskCategories.id), // Category for workflow assignment
  workflowId: varchar("workflow_id").references(() => teamWorkflows.id), // Direct workflow assignment
  assignedTo: uuid("assigned_to").references(() => staff.id),
  clientId: varchar("client_id").references(() => clients.id),
  projectId: varchar("project_id").references(() => projects.id),
  leadId: varchar("lead_id").references(() => leads.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  dueDate: timestamp("due_date"),
  startDate: timestamp("start_date"),
  dueTime: text("due_time"), // HH:MM format
  timeEstimate: integer("time_estimate"), // estimated time in minutes
  timeTracked: integer("time_tracked").default(0), // actual time tracked, stored in SECONDS (changed from minutes 2026-04-23). Always = SUM(task_time_entries.duration) for non-running entries.
  // DEPRECATED: Per-entry time tracking now lives in the normalized
  // `task_time_entries` table. This column is retained ONLY to preserve
  // historical data on existing deployments and to keep deploy diffs
  // non-destructive. Do NOT read from or write to this column in app code —
  // all readers/writers go through `task_time_entries`. To permanently
  // retire this column, run `scripts/migrate-prod-time-entries.sql` against
  // production, then remove this field in a follow-up deploy.
  // The `'[]'::jsonb` default mirrors the existing production column default
  // so deploy diffs do not propose a `DROP DEFAULT` (cosmetic but noisy).
  timeEntries: jsonb("time_entries").default(sql`'[]'::jsonb`),

  
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
  
  // Client portal visibility
  visibleToClient: boolean("visible_to_client").default(false), // Controls if clients can see this task in their portal
  
  // Client approval workflow
  requiresClientApproval: boolean("requires_client_approval").default(false), // If true, client must approve before task completion
  clientApprovalStatus: text("client_approval_status").default("pending"), // pending, approved, rejected, changes_requested
  clientApprovalNotes: text("client_approval_notes"), // Client feedback/notes on the task
  clientApprovalDate: timestamp("client_approval_date"), // When client approved/rejected
  
  // Fathom meeting recording integration
  fathomRecordingUrl: text("fathom_recording_url"), // URL to Fathom meeting recording
  calendarEventId: varchar("calendar_event_id"), // Reference to the source calendar event
  
  // 1-on-1 meeting integration
  oneOnOneMeetingId: varchar("one_on_one_meeting_id"), // Reference to HR 1-on-1 meeting record
  
  // Tags
  tags: text("tags").array().default([]), // array of tag names
  
  // Status history tracking for stage analytics
  // Array of { status, enteredAt, exitedAt, durationMs, timeTrackedInStage }
  statusHistory: jsonb("status_history").default(sql`'[]'`),
  
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),

  onboardingWeek: integer("onboarding_week"),

  sourceTemplateId: varchar("source_template_id"),
  generationId: varchar("generation_id"),
});

// Task Time Entries - normalized one-row-per-entry storage to replace
// the legacy tasks.time_entries jsonb array. Per-entry inserts/updates
// avoid concurrent read-modify-write races that previously erased entries.
export const taskTimeEntries = pgTable("task_time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  taskTitle: text("task_title"),
  userName: text("user_name"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // SECONDS (changed from minutes 2026-04-23). All writers MUST convert input units to seconds before insert/update; all readers/formatters MUST treat this as seconds.
  isRunning: boolean("is_running").default(false).notNull(),
  source: text("source").default("timer").notNull(), // 'timer' | 'manual' | 'auto' | 'legacy'
  notes: text("notes"),
  // Auto-stop / abandoned-timer metadata (populated by longRunningTimerService).
  stoppedBy: text("stopped_by"), // 'system' when auto-stopped, otherwise null
  stopReason: text("stop_reason"), // e.g. 'auto-stopped'
  autoStoppedAt: timestamp("auto_stopped_at"),
  autoStoppedThresholdHours: integer("auto_stopped_threshold_hours"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_task_time_entries_task").on(table.taskId),
  index("idx_task_time_entries_user").on(table.userId),
  index("idx_task_time_entries_start").on(table.startTime),
  index("idx_task_time_entries_user_running").on(table.userId, table.isRunning),
]);

export const insertTaskTimeEntrySchema = createInsertSchema(taskTimeEntries).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertTaskTimeEntry = z.infer<typeof insertTaskTimeEntrySchema>;
export type TaskTimeEntry = typeof taskTimeEntries.$inferSelect;

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
  authorId: uuid("author_id").notNull().references(() => staff.id),
  mentions: text("mentions").array(), // Array of user IDs mentioned in the comment
  parentId: varchar("parent_id"), // For threaded replies - will reference task_comments.id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Comment Reactions
export const taskCommentReactions = pgTable("task_comment_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => taskComments.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
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
  uploadedBy: uuid("uploaded_by").notNull().references(() => staff.id),
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
  authorId: uuid("author_id").notNull().references(() => staff.id),
  isCompleted: boolean("is_completed").default(false), // Track if annotation is resolved/completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HR System - Time Off Policies (DEPRECATED - kept for backward compatibility, use timeOffTypes instead)
export const timeOffPolicies = pgTable("time_off_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  vacationDaysDefault: integer("vacation_days_default").default(15),
  sickDaysDefault: integer("sick_days_default").default(10),
  personalDaysDefault: integer("personal_days_default").default(3),
  carryOverAllowed: boolean("carry_over_allowed").default(false),
  maxCarryOverDays: integer("max_carry_over_days").default(0),
  policyDocument: text("policy_document"),
  effectiveDate: date("effective_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HR System - Time Off Types (flexible PTO categories per policy)
export const timeOffTypes = pgTable("time_off_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  policyId: varchar("policy_id").notNull().references(() => timeOffPolicies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Annual Vacation", "Sick Days", "Bereavement"
  description: text("description"),
  defaultDaysPerYear: integer("default_days_per_year").notNull().default(0),
  allowCarryOver: boolean("allow_carry_over").default(false),
  maxCarryOverDays: integer("max_carry_over_days").default(0),
  color: varchar("color", { length: 50 }).default("bg-blue-100 text-blue-800"), // Badge color classes
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HR System - Time Off Requests
export const timeOffRequests = pgTable("time_off_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  timeOffTypeId: varchar("time_off_type_id").references(() => timeOffTypes.id), // NEW: FK to timeOffTypes (nullable for backward compat)
  type: text("type").notNull(), // DEPRECATED: Keep for backward compatibility, use timeOffTypeId going forward
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  totalHours: decimal("total_hours", { precision: 5, scale: 2 }).notNull().default("0"),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: uuid("approved_by").references(() => staff.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  managerNotes: text("manager_notes"),
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
  stage: text("stage").notNull().default("new"), // new, review, interview, not_selected, test_sent, send_offer, offer_sent, offer_accepted, offer_declined, hired
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

// HR System - Job Application Watchers (staff who should have visibility to specific applications)
export const jobApplicationWatchers = pgTable("job_application_watchers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => jobApplications.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  addedBy: uuid("added_by").notNull().references(() => staff.id),
  addedAt: timestamp("added_at").defaultNow(),
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

// Schema for user input validation (omits calculated fields)
export const inputClientHealthScoreSchema = createInsertSchema(clientHealthScores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalScore: true,
  averageScore: true,
  healthIndicator: true,
});

// Schema for storage validation (includes calculated fields)
export const insertClientHealthScoreSchema = createInsertSchema(clientHealthScores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientBriefSectionSchema = createInsertSchema(clientBriefSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientBriefValueSchema = createInsertSchema(clientBriefValues).omit({
  id: true,
  updatedAt: true,
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
  createdBy: true,
});

export const insertScheduledEmailSchema = createInsertSchema(scheduledEmails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
  failureReason: true,
  retryCount: true,
}).extend({
  // Require non-null date values and validate they're valid dates
  scheduledFor: z.union([z.string(), z.date()])
    .refine((val) => val !== null && val !== undefined && val !== '', {
      message: "Scheduled date is required"
    })
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), {
      message: "Invalid date format"
    }),
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

export const insertLeadSourceSchema = createInsertSchema(leadSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadNoteTemplateSchema = createInsertSchema(leadNoteTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  isConverted: true,
  convertedAt: true,
  clientId: true,
  convertedBy: true,
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

export const insertLeadStageTransitionSchema = createInsertSchema(leadStageTransitions).omit({
  id: true,
  transitionedAt: true,
});

export const insertSalesActivitySchema = createInsertSchema(salesActivities).omit({
  id: true,
  createdAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  value: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      return parseFloat(val).toString();
    }
    return val.toString();
  }),
  mrr: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => {
    if (val === '' || val === null || val === undefined) return null;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed.toString();
    }
    return val?.toString() || null;
  }),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  level: true, // Auto-calculated based on parent hierarchy
  taskPath: true, // Auto-calculated based on parent hierarchy
  hasSubTasks: true, // Auto-calculated when sub-tasks exist
  clientApprovalDate: true, // Auto-calculated when client approves/rejects
  timeEntries: true, // DEPRECATED legacy JSONB column — never accept from clients; all time entries go through `task_time_entries`.
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
  // Ensure recurring fields are properly typed (nullable to support clearing when disabling recurring)
  isRecurring: z.boolean().nullable().optional().default(false),
  recurringInterval: z.number().nullable().optional(),
  recurringUnit: z.enum(["hours", "days", "weeks", "months", "years"]).nullable().optional(),
  recurringEndType: z.enum(["never", "on_date", "after_occurrences"]).nullable().optional(),
  recurringEndOccurrences: z.number().nullable().optional(),
  createIfOverdue: z.boolean().nullable().optional().default(false),
  // Client approval workflow validation
  requiresClientApproval: z.boolean().optional().default(false),
  clientApprovalStatus: z.enum(["pending", "approved", "rejected", "changes_requested"]).optional().default("pending"),
  clientApprovalNotes: z.string().nullable().optional(),
});

// Server-side validated schema that enforces client approval invariants
export const insertTaskSchemaValidated = insertTaskSchema.superRefine((data, ctx) => {
  // Enforce invariant: requiresClientApproval=true requires visibleToClient=true and valid clientId
  if (data.requiresClientApproval) {
    if (!data.visibleToClient) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tasks requiring client approval must be visible to the client",
        path: ["requiresClientApproval"],
      });
    }
    if (!data.clientId || data.clientId === "" || data.clientId === "none") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tasks requiring client approval must have a client assigned",
        path: ["requiresClientApproval"],
      });
    }
  }
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

export const insertJobApplicationWatcherSchema = createInsertSchema(jobApplicationWatchers).omit({
  id: true,
  addedAt: true,
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
export type JobApplicationWatcher = typeof jobApplicationWatchers.$inferSelect;
export type InsertJobApplicationWatcher = z.infer<typeof insertJobApplicationWatcherSchema>;
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

export type ClientBriefSection = typeof clientBriefSections.$inferSelect;
export type InsertClientBriefSection = z.infer<typeof insertClientBriefSectionSchema>;

export type ClientBriefValue = typeof clientBriefValues.$inferSelect;
export type InsertClientBriefValue = z.infer<typeof insertClientBriefValueSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type TemplateFolder = typeof templateFolders.$inferSelect;
export type InsertTemplateFolder = z.infer<typeof insertTemplateFolderSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;

export type ScheduledEmail = typeof scheduledEmails.$inferSelect;
export type InsertScheduledEmail = z.infer<typeof insertScheduledEmailSchema>;

export type SmartList = typeof smartLists.$inferSelect;
export type InsertSmartList = z.infer<typeof insertSmartListSchema>;

export type LeadPipelineStage = typeof leadPipelineStages.$inferSelect;
export type InsertLeadPipelineStage = z.infer<typeof insertLeadPipelineStagSchema>;

export type LeadSource = typeof leadSources.$inferSelect;
export type InsertLeadSource = z.infer<typeof insertLeadSourceSchema>;

export type LeadNoteTemplate = typeof leadNoteTemplates.$inferSelect;
export type InsertLeadNoteTemplate = z.infer<typeof insertLeadNoteTemplateSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type LeadStageTransition = typeof leadStageTransitions.$inferSelect;
export type InsertLeadStageTransition = z.infer<typeof insertLeadStageTransitionSchema>;

export type SalesActivity = typeof salesActivities.$inferSelect;
export type InsertSalesActivity = z.infer<typeof insertSalesActivitySchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

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
  triggers: jsonb("triggers").notNull().default('[]'), // array of trigger configurations
  actions: jsonb("actions").notNull().default('[]'), // array of actions
  conditions: jsonb("conditions"), // branching logic
  settings: jsonb("settings"), // workflow-specific settings
  isTemplate: boolean("is_template").default(false),
  templateCategory: text("template_category"),
  version: integer("version").default(1),
  lastRun: timestamp("last_run"),
  totalRuns: integer("total_runs").default(0),
  successfulRuns: integer("successful_runs").default(0),
  failedRuns: integer("failed_runs").default(0),
  createdBy: varchar("created_by").notNull(),
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

export const workflowActionAnalytics = pgTable("workflow_action_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  actionType: text("action_type").notNull(), // send_email, send_sms
  
  // Email Analytics
  emailsSent: integer("emails_sent").default(0),
  emailsDelivered: integer("emails_delivered").default(0),
  emailsOpened: integer("emails_opened").default(0),
  emailsClicked: integer("emails_clicked").default(0),
  emailsReplied: integer("emails_replied").default(0),
  emailsBounced: integer("emails_bounced").default(0),
  emailsUnsubscribed: integer("emails_unsubscribed").default(0),
  emailsAccepted: integer("emails_accepted").default(0),
  emailsRejected: integer("emails_rejected").default(0),
  emailsComplained: integer("emails_complained").default(0),
  
  // SMS Analytics
  smsSent: integer("sms_sent").default(0),
  smsDelivered: integer("sms_delivered").default(0),
  smsClicked: integer("sms_clicked").default(0),
  smsFailed: integer("sms_failed").default(0),
  smsOptedOut: integer("sms_opted_out").default(0),
  
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_workflow_action_analytics_workflow_id").on(table.workflowId),
  index("idx_workflow_action_analytics_workflow_action").on(table.workflowId, table.actionType),
]);

export const workflowTemplates = pgTable("workflow_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  industry: text("industry"),
  useCase: text("use_case"),
  triggers: jsonb("triggers").notNull().default('[]'),
  actions: jsonb("actions").notNull(),
  conditions: jsonb("conditions"),
  settings: jsonb("settings"),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  tags: text("tags").array(),
  workflowId: varchar("workflow_id").notNull().unique().references(() => workflows.id), // UNIQUE constraint prevents duplicates
  createdBy: uuid("created_by").notNull().references(() => staff.id),
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
  
  // Complete task structure for advanced templates
  templateData: jsonb("template_data"), // Full task structure with sub-tasks and dependencies
  
  onboardingWeek: integer("onboarding_week"),

  createdBy: uuid("created_by").notNull().references(() => staff.id),
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
  module: text("module").notNull(), // clients, campaigns, tasks, invoices, reports, settings, etc.
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

// Granular Permissions - Sub-permissions within modules
export const granularPermissions = pgTable("granular_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  module: text("module").notNull(), // clients, campaigns, tasks, etc.
  permissionKey: text("permission_key").notNull(), // unique identifier like "clients.view_contacts"
  enabled: boolean("enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate permissions per role
  uniqueRolePermission: unique().on(table.roleId, table.permissionKey),
}));

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
  createdBy: true, // Will be added from session
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
});

export const insertWorkflowActionAnalyticsSchema = createInsertSchema(workflowActionAnalytics).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
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

export const insertClientContactSchema = createInsertSchema(clientContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClientContact = z.infer<typeof insertClientContactSchema>;
export type ClientContact = typeof clientContacts.$inferSelect;

export const insertClientTransactionSchema = createInsertSchema(clientTransactions).omit({
  id: true,
  createdAt: true,
});

// Export enhanced workflow and task types
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;

export type WorkflowActionAnalytics = typeof workflowActionAnalytics.$inferSelect;
export type InsertWorkflowActionAnalytics = z.infer<typeof insertWorkflowActionAnalyticsSchema>;

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

export type ClientHealthScore = typeof clientHealthScores.$inferSelect;
export type InputClientHealthScore = z.infer<typeof inputClientHealthScoreSchema>;
export type InsertClientHealthScore = z.infer<typeof insertClientHealthScoreSchema>;

// Health Scores bulk filtering query parameter validation schema
export const healthScoreFilterSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  statuses: z.string().transform(str => str.split(',')).pipe(z.array(z.enum(['Green', 'Yellow', 'Red']))).optional(),
  search: z.string().min(1).optional(),
  clientId: z.string().uuid().optional(),
  latestPerClient: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('25'),
  sort: z.enum(['weekStartDate', 'clientName', 'healthIndicator', 'totalScore', 'createdAt', 'paymentStatus']).optional().default('weekStartDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export type HealthScoreFilter = z.infer<typeof healthScoreFilterSchema>;

// Departments and Positions Management
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  managerId: varchar("manager_id"),
  workflowId: varchar("workflow_id").references(() => teamWorkflows.id), // team's custom workflow
  parentDepartmentId: varchar("parent_department_id"), // self-referencing for hierarchy
  orderIndex: integer("order_index").default(0), // for ordering within parent
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  departmentId: varchar("department_id").references(() => departments.id, { onDelete: "cascade" }),
  description: text("description"),
  level: text("level"),
  parentPositionId: varchar("parent_position_id"),
  orderIndex: integer("order_index").default(0),
  inOrgChart: boolean("in_org_chart").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Position KPIs
export const positionKpis = pgTable("position_kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  positionId: varchar("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  kpiName: varchar("kpi_name", { length: 200 }).notNull(),
  benchmark: varchar("benchmark", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPositionKpiSchema = createInsertSchema(positionKpis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PositionKpi = typeof positionKpis.$inferSelect;
export type InsertPositionKpi = z.infer<typeof insertPositionKpiSchema>;

// Staff Management
export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  replitAuthSub: varchar("replit_auth_sub", { length: 255 }).unique(), // Replit Auth user ID
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
  startDate: date("start_date"),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  managerId: uuid("manager_id"),
  birthdate: date("birthdate"),
  shirtSize: varchar("shirt_size", { length: 10 }), // S, M, L, XL, 2XL, 3XL
  assignedCalendarId: varchar("assigned_calendar_id"), // Links to calendar assignment
  
  // Emergency contact information
  emergencyContactName: varchar("emergency_contact_name", { length: 200 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  emergencyContactRelationship: varchar("emergency_contact_relationship", { length: 100 }),
  
  // DEPRECATED: Time off policy assignment - Replaced by global time off types system
  // TODO: Remove after confirming zero active writes and preparing migration (see deprecation plan)
  // Kept for backward compatibility - UI no longer allows setting this field
  timeOffPolicyId: varchar("time_off_policy_id").references(() => timeOffPolicies.id),
  
  // DEPRECATED: Time off entitlements (annual allocation) - Use timeOffPolicyId + timeOffTypes instead
  vacationDaysAnnually: integer("vacation_days_annually").default(15), // Default 15 vacation days per year
  sickDaysAnnually: integer("sick_days_annually").default(10), // Default 10 sick days per year
  personalDaysAnnually: integer("personal_days_annually").default(3), // Default 3 personal days per year

  // Compensation
  annualSalary: decimal("annual_salary", { precision: 12, scale: 2 }),

  // Fathom integration - API key for fetching meeting recordings
  fathomApiKey: text("fathom_api_key"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const salaryHistory = pgTable("salary_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  previousSalary: decimal("previous_salary", { precision: 12, scale: 2 }),
  newSalary: decimal("new_salary", { precision: 12, scale: 2 }),
  effectiveDate: timestamp("effective_date").defaultNow(),
  notes: text("notes"),
  changedBy: uuid("changed_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_salary_history_staff").on(table.staffId),
]);

export type SalaryHistory = typeof salaryHistory.$inferSelect;

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  timeOffPolicyId: z.string().nullable().optional(),
});

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

// Authentication Users - Session-based authentication
export const authUsers = pgTable("auth_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuthUserSchema = createInsertSchema(authUsers).omit({
  id: true,
  createdAt: true,
});

export type AuthUser = typeof authUsers.$inferSelect;
export type InsertAuthUser = z.infer<typeof insertAuthUserSchema>;

// Staff Linked Emails - Multiple Gmail accounts per staff member
export const staffLinkedEmails = pgTable("staff_linked_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  googleSub: varchar("google_sub", { length: 255 }), // Google account ID for this email
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueEmail: unique().on(table.email), // Each email can only be linked to one staff
}));

export const insertStaffLinkedEmailSchema = createInsertSchema(staffLinkedEmails).omit({
  id: true,
  createdAt: true,
});

export type StaffLinkedEmail = typeof staffLinkedEmails.$inferSelect;
export type InsertStaffLinkedEmail = z.infer<typeof insertStaffLinkedEmailSchema>;

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

export const insertProductPackageSchema = createInsertSchema(productPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPackageItemSchema = createInsertSchema(packageItems).omit({
  id: true,
  createdAt: true,
});

export const insertClientPackageSchema = createInsertSchema(clientPackages).omit({
  id: true,
  createdAt: true,
});

export type ProductPackage = typeof productPackages.$inferSelect;
export type InsertProductPackage = z.infer<typeof insertProductPackageSchema>;
export type PackageItem = typeof packageItems.$inferSelect;
export type InsertPackageItem = z.infer<typeof insertPackageItemSchema>;
export type ClientPackage = typeof clientPackages.$inferSelect;
export type InsertClientPackage = z.infer<typeof insertClientPackageSchema>;

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

export const insertGranularPermissionSchema = createInsertSchema(granularPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type GranularPermission = typeof granularPermissions.$inferSelect;
export type InsertGranularPermission = z.infer<typeof insertGranularPermissionSchema>;

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

// SMS integrations (Twilio, etc.)
export const smsIntegrations = pgTable("sms_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(), // 'twilio', 'sendgrid', etc.
  name: text("name").notNull().default("Primary"), // Purpose/name for the phone number (Sales, Support, etc.)
  accountSid: text("account_sid").notNull(), // Twilio Account SID
  authToken: text("auth_token").notNull(), // Twilio Auth Token (encrypted)
  phoneNumber: text("phone_number").notNull(), // From phone number
  isActive: boolean("is_active").default(true),
  lastTestAt: timestamp("last_test_at"),
  connectionErrors: text("connection_errors"), // Latest connection error messages
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email integrations (MailGun, SendGrid, etc.)
export const emailIntegrations = pgTable("email_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(), // 'mailgun', 'sendgrid', 'ses', etc.
  name: text("name").notNull().default("Primary"), // Purpose/name for the email config (Sales, Support, etc.)
  apiKey: text("api_key").notNull(), // API Key (encrypted)
  domain: text("domain").notNull(), // Email domain
  fromName: text("from_name").notNull(), // Default from name
  fromEmail: text("from_email").notNull(), // Default from email
  isActive: boolean("is_active").default(true),
  lastTestAt: timestamp("last_test_at"),
  connectionErrors: text("connection_errors"), // Latest connection error messages
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI integrations (OpenAI, etc.)
export const aiIntegrations = pgTable("ai_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(), // 'openai', 'anthropic', etc.
  name: text("name").notNull().default("OpenAI"), // Integration name
  apiKey: text("api_key").notNull(), // API Key (encrypted)
  model: text("model").default("gpt-4o"), // Default model to use
  isActive: boolean("is_active").default(true),
  lastTestAt: timestamp("last_test_at"),
  connectionErrors: text("connection_errors"), // Latest connection error messages
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiIntegrationSchema = createInsertSchema(aiIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AiIntegration = typeof aiIntegrations.$inferSelect;

export const stripeIntegrations = pgTable("stripe_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("Primary"),
  secretKey: text("secret_key").notNull(),
  publishableKey: text("publishable_key"),
  webhookSecret: text("webhook_secret"),
  isActive: boolean("is_active").default(true),
  lastTestAt: timestamp("last_test_at"),
  connectionErrors: text("connection_errors"),
  accountName: text("account_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStripeIntegrationSchema = createInsertSchema(stripeIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type StripeIntegration = typeof stripeIntegrations.$inferSelect;
export type InsertAiIntegration = z.infer<typeof insertAiIntegrationSchema>;

// AI Assistant Settings (custom instructions, context)
export const aiAssistantSettings = pgTable("ai_assistant_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customInstructions: text("custom_instructions"), // Custom instructions/context for the AI
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiAssistantSettingsSchema = createInsertSchema(aiAssistantSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AiAssistantSettings = typeof aiAssistantSettings.$inferSelect;
export type InsertAiAssistantSettings = z.infer<typeof insertAiAssistantSettingsSchema>;

// GoHighLevel integration for receiving leads via webhook
export const goHighLevelIntegration = pgTable("gohighlevel_integration", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookToken: text("webhook_token").notNull().unique(), // Secure token for webhook URL
  name: text("name").notNull().default("GoHighLevel"), // Integration name
  isActive: boolean("is_active").default(true),
  defaultSource: text("default_source").default("GoHighLevel"), // Default lead source
  defaultStageId: varchar("default_stage_id"), // Default pipeline stage for new leads
  assignToStaffId: uuid("assign_to_staff_id").references(() => staff.id), // Auto-assign leads to this staff
  triggerWorkflows: boolean("trigger_workflows").default(true), // Trigger automation workflows
  fieldMappings: jsonb("field_mappings"), // Map GHL fields to lead fields
  leadsReceived: integer("leads_received").default(0), // Count of leads received
  lastLeadAt: timestamp("last_lead_at"), // Last lead received timestamp
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGoHighLevelIntegrationSchema = createInsertSchema(goHighLevelIntegration).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type GoHighLevelIntegration = typeof goHighLevelIntegration.$inferSelect;
export type InsertGoHighLevelIntegration = z.infer<typeof insertGoHighLevelIntegrationSchema>;

// Slack Workspaces - Multi-workspace Slack integration
export const slackWorkspaces = pgTable("slack_workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Friendly name (e.g., "Agency Team", "Client - GoldBuds")
  teamId: text("team_id"), // Slack workspace/team ID
  teamName: text("team_name"), // Slack workspace name (from API)
  botToken: text("bot_token").notNull(), // Bot User OAuth Token (xoxb-...)
  botUserId: text("bot_user_id"), // Bot user ID in this workspace
  signingSecret: text("signing_secret"), // App signing secret for event verification
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Default workspace for workflows
  lastTestAt: timestamp("last_test_at"),
  connectionErrors: text("connection_errors"), // Latest connection error messages
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSlackWorkspaceSchema = createInsertSchema(slackWorkspaces).omit({
  id: true,
  teamId: true,
  teamName: true,
  botUserId: true,
  lastTestAt: true,
  connectionErrors: true,
  createdAt: true,
  updatedAt: true,
});

export type SlackWorkspace = typeof slackWorkspaces.$inferSelect;
export type InsertSlackWorkspace = z.infer<typeof insertSlackWorkspaceSchema>;

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
  activityType: text("activity_type").notNull().default("appointment"), // appointment, pitch, demo, follow_up, proposal_sent
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
  googleEventId: text("google_event_id"), // Specific Google Calendar event ID
  googleCalendarId: text("google_calendar_id"), // Which Google Calendar it's on
  syncedToGoogle: boolean("synced_to_google").default(false), // Track if pushed to Google
  // Metadata
  bookingSource: text("booking_source").notNull().default("public"), // 'public', 'admin', 'api'
  bookingIp: text("booking_ip"),
  bookingUserAgent: text("booking_user_agent"),
  // Cancellation details
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: uuid("cancelled_by").references(() => staff.id),
  cancellationReason: text("cancellation_reason"),
  // Time entry tracking
  timeEntryCreated: boolean("time_entry_created").default(false), // Track if time entry was auto-created for Showed status
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

export const insertSmsIntegrationSchema = createInsertSchema(smsIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailIntegrationSchema = createInsertSchema(emailIntegrations).omit({
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

export type SmsIntegration = typeof smsIntegrations.$inferSelect;
export type InsertSmsIntegration = z.infer<typeof insertSmsIntegrationSchema>;

export type EmailIntegration = typeof emailIntegrations.$inferSelect;
export type InsertEmailIntegration = z.infer<typeof insertEmailIntegrationSchema>;

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
  updatedBy: uuid("updated_by").references(() => staff.id),
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
  fields: jsonb("fields").notNull(),
  branding: jsonb("branding"),
  updatedBy: varchar("updated_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobApplicationFormConfigSchema = createInsertSchema(jobApplicationFormConfig).omit({
  id: true,
  updatedAt: true,
});

export type JobApplicationFormConfig = typeof jobApplicationFormConfig.$inferSelect;
export type InsertJobApplicationFormConfig = z.infer<typeof insertJobApplicationFormConfigSchema>;

// New Hire Onboarding Form Configuration - stores the customizable form field configuration
export const newHireOnboardingFormConfig = pgTable("new_hire_onboarding_form_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fields: jsonb("fields").notNull(), // Array of form field configurations
  branding: jsonb("branding"), // Branding & style settings (logo, colors, text)
  updatedBy: varchar("updated_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNewHireOnboardingFormConfigSchema = createInsertSchema(newHireOnboardingFormConfig).omit({
  id: true,
  updatedAt: true,
});

export type NewHireOnboardingFormConfig = typeof newHireOnboardingFormConfig.$inferSelect;
export type InsertNewHireOnboardingFormConfig = z.infer<typeof insertNewHireOnboardingFormConfigSchema>;

export const clientOnboardingFormConfig = pgTable("client_onboarding_form_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  steps: jsonb("steps").notNull(),
  branding: jsonb("branding"),
  updatedBy: varchar("updated_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientOnboardingFormConfigSchema = createInsertSchema(clientOnboardingFormConfig).omit({
  id: true,
  updatedAt: true,
});

export type ClientOnboardingFormConfig = typeof clientOnboardingFormConfig.$inferSelect;
export type InsertClientOnboardingFormConfig = z.infer<typeof insertClientOnboardingFormConfigSchema>;

// New Hire Onboarding Submissions - when someone fills out the onboarding form
export const newHireOnboardingSubmissions = pgTable("new_hire_onboarding_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phoneNumber: text("phone_number"),
  dateOfBirth: date("date_of_birth"),
  startDate: date("start_date"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactNumber: text("emergency_contact_number"),
  emergencyContactRelationship: text("emergency_contact_relationship"),
  tshirtSize: text("tshirt_size"),
  paymentPlatform: text("payment_platform"),
  paymentEmail: text("payment_email"),
  status: text("status").notNull().default("pending"), // pending, reviewed, processed
  reviewedBy: uuid("reviewed_by").references(() => staff.id),
  reviewedAt: timestamp("reviewed_at"),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  customFieldData: jsonb("custom_field_data"), // for storing custom form field values
});

export const insertNewHireOnboardingSubmissionSchema = createInsertSchema(newHireOnboardingSubmissions).omit({
  id: true,
  submittedAt: true,
});

export type NewHireOnboardingSubmission = typeof newHireOnboardingSubmissions.$inferSelect;
export type InsertNewHireOnboardingSubmission = z.infer<typeof insertNewHireOnboardingSubmissionSchema>;

// Expense Report Form Configuration - stores the customizable form field configuration
export const expenseReportFormConfig = pgTable("expense_report_form_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fields: jsonb("fields").notNull(), // Array of form field configurations
  updatedBy: uuid("updated_by").notNull().references(() => staff.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExpenseReportFormConfigSchema = createInsertSchema(expenseReportFormConfig).omit({
  id: true,
  updatedAt: true,
});

export type ExpenseReportFormConfig = typeof expenseReportFormConfig.$inferSelect;
export type InsertExpenseReportFormConfig = z.infer<typeof insertExpenseReportFormConfigSchema>;

// Expense Report Submissions - when someone submits an expense report
export const expenseReportSubmissions = pgTable("expense_report_submissions", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  supervisorId: uuid("supervisor_id").references(() => staff.id),
  purpose: text("purpose"),
  expenseType: text("expense_type"), // Hotel, Fuel, Travel, Meals, Education/Training, Other
  expenseDate: date("expense_date"),
  expenseTotal: decimal("expense_total", { precision: 10, scale: 2 }),
  departmentTeam: text("department_team"),
  clientId: varchar("client_id").references(() => clients.id),
  reimbursement: text("reimbursement"), // Yes, No, Not Sure
  paymentMethod: text("payment_method"), // Joe's Card, Che's Card, Personal Card
  notes: text("notes"),
  receiptFiles: text("receipt_files").array(), // array of file URLs/paths
  status: text("status").notNull().default("pending"), // pending, approved, rejected, processed
  submittedById: uuid("submitted_by_id").references(() => staff.id),
  reviewedBy: uuid("reviewed_by").references(() => staff.id),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  customFieldData: jsonb("custom_field_data"), // for storing custom form field values
});

export const insertExpenseReportSubmissionSchema = createInsertSchema(expenseReportSubmissions).omit({
  id: true,
  submittedAt: true,
});

export type ExpenseReportSubmission = typeof expenseReportSubmissions.$inferSelect;
export type InsertExpenseReportSubmission = z.infer<typeof insertExpenseReportSubmissionSchema>;

// Offboarding Form Configuration - stores the customizable form field configuration
export const offboardingFormConfig = pgTable("offboarding_form_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fields: jsonb("fields").notNull(), // Array of form field configurations
  updatedBy: uuid("updated_by").notNull().references(() => staff.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOffboardingFormConfigSchema = createInsertSchema(offboardingFormConfig).omit({
  id: true,
  updatedAt: true,
});

export type OffboardingFormConfig = typeof offboardingFormConfig.$inferSelect;
export type InsertOffboardingFormConfig = z.infer<typeof insertOffboardingFormConfigSchema>;

// Offboarding Submissions - when someone submits an offboarding form
export const offboardingSubmissions = pgTable("offboarding_submissions", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  departmentTeam: text("department_team"),
  position: text("position"),
  employmentEndDate: date("employment_end_date"),
  accountSuspensionDate: date("account_suspension_date"),
  payOffRamp: text("pay_off_ramp"),
  status: text("status").notNull().default("pending"), // pending, completed
  submittedById: uuid("submitted_by_id").references(() => staff.id),
  completedBy: uuid("completed_by").references(() => staff.id),
  completedAt: timestamp("completed_at"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  customFieldData: jsonb("custom_field_data"), // for storing custom form field values
});

export const insertOffboardingSubmissionSchema = createInsertSchema(offboardingSubmissions).omit({
  id: true,
  submittedAt: true,
});

export type OffboardingSubmission = typeof offboardingSubmissions.$inferSelect;
export type InsertOffboardingSubmission = z.infer<typeof insertOffboardingSubmissionSchema>;

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

// Team Positions - configurable positions that can be assigned to clients AND used in org chart
export const teamPositions = pgTable("team_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // unique identifier like "setter", "bdr", "account_manager"
  label: text("label").notNull(), // display name like "Setter", "BDR", "Account Manager"
  description: text("description"), // optional description
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  // Org Chart fields - positions can be added to the org chart hierarchy
  inOrgChart: boolean("in_org_chart").default(false), // Track if position is in the org chart structure
  parentPositionId: varchar("parent_position_id"), // self-referencing for org chart hierarchy
  orgChartOrder: integer("org_chart_order").default(0), // ordering within parent in org chart
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client Team Assignments - for assigning staff to specific client positions
export const clientTeamAssignments = pgTable("client_team_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  position: varchar("position").notNull().references(() => teamPositions.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: uuid("assigned_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure one assignment per client-position combination
  uniqueClientPosition: unique("client_team_assignments_client_position_unique").on(table.clientId, table.position),
}));

// Position Description Versions - track changes to position job descriptions
export const positionDescriptionVersions = pgTable("position_description_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  positionId: varchar("position_id").notNull().references(() => teamPositions.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  content: text("content"),
  changedByUserId: uuid("changed_by_user_id").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PositionDescriptionVersion = typeof positionDescriptionVersions.$inferSelect;

// Team Positions schema exports
export const insertTeamPositionSchema = createInsertSchema(teamPositions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TeamPosition = typeof teamPositions.$inferSelect;
export type InsertTeamPosition = z.infer<typeof insertTeamPositionSchema>;

// Reorder team positions schema
export const reorderTeamPositionsSchema = z.object({
  positions: z.array(z.object({
    id: z.string(),
    order: z.number().int().min(0)
  })).min(1)
});

export type ReorderTeamPositions = z.infer<typeof reorderTeamPositionsSchema>;

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
export const knowledgeBaseCategories = pgTable("knowledge_base_categories", {
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
export const knowledgeBaseArticles = pgTable("knowledge_base_articles", {
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
export const knowledgeBaseComments = pgTable("knowledge_base_comments", {
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

// Knowledge Base Article Versions - for version history
export const knowledgeBaseArticleVersions = pgTable("knowledge_base_article_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => knowledgeBaseArticles.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  changeDescription: text("change_description"), // optional description of what changed
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertKnowledgeBaseArticleVersionSchema = createInsertSchema(knowledgeBaseArticleVersions).omit({
  id: true,
  createdAt: true,
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

export type KnowledgeBaseArticleVersion = typeof knowledgeBaseArticleVersions.$inferSelect;
export type InsertKnowledgeBaseArticleVersion = z.infer<typeof insertKnowledgeBaseArticleVersionSchema>;

// =============================================================================
// TRAINING/LMS SYSTEM SCHEMA
// =============================================================================

// Training Categories
export const trainingCategories = pgTable("training_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3B82F6"), // For visual organization
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Courses
export const trainingCourses = pgTable("training_courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  shortDescription: text("short_description"), // For course cards
  categoryId: varchar("category_id").references(() => trainingCategories.id),
  tags: text("tags").array(), // For filtering and search
  thumbnailUrl: text("thumbnail_url"), // Course cover image
  estimatedDuration: integer("estimated_duration"), // Minutes
  difficulty: text("difficulty").default("beginner"), // beginner, intermediate, advanced
  isPublished: boolean("is_published").default(false),
  order: integer("order").default(0),
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  updatedBy: uuid("updated_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Modules (groups lessons within courses)
export const trainingModules = pgTable("training_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => trainingCourses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").default(0),
  isRequired: boolean("is_required").default(true),
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  updatedBy: uuid("updated_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Lessons
export const trainingLessons = pgTable("training_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => trainingCourses.id, { onDelete: "cascade" }),
  moduleId: varchar("module_id").references(() => trainingModules.id, { onDelete: "cascade" }), // Optional: lessons can be in modules or directly in course
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"), // Rich text content for articles
  contentType: text("content_type").notNull(), // video, article, pdf, quiz, assignment
  videoUrl: text("video_url"), // YouTube/Loom embed URL
  videoEmbedId: text("video_embed_id"), // Extracted video ID for embedding
  videoDuration: integer("video_duration"), // Seconds
  pdfUrl: text("pdf_url"), // For PDF lessons
  order: integer("order").default(0),
  isRequired: boolean("is_required").default(true),
  isLocked: boolean("is_locked").default(false), // Manual lock/unlock control
  canDownload: boolean("can_download").default(false), // For PDFs
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  updatedBy: uuid("updated_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Enrollments
export const trainingEnrollments = pgTable("training_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => trainingCourses.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  status: text("status").default("enrolled"), // enrolled, in_progress, completed, dropped
  progress: integer("progress").default(0), // Percentage 0-100
  completedLessons: integer("completed_lessons").default(0),
  totalLessons: integer("total_lessons").default(0),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
});

// Training Progress (per lesson)
export const trainingProgress = pgTable("training_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id").notNull().references(() => trainingEnrollments.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").notNull().references(() => trainingLessons.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  status: text("status").default("not_started"), // not_started, in_progress, completed
  watchTime: integer("watch_time").default(0), // Seconds watched for videos
  completionPercentage: integer("completion_percentage").default(0),
  firstStartedAt: timestamp("first_started_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training Course Permissions - similar to knowledge base permissions
export const trainingCoursePermissions = pgTable("training_course_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => trainingCourses.id, { onDelete: "cascade" }),
  accessType: text("access_type").notNull(), // "team" or "user"
  accessId: text("access_id").notNull(), // team/department id or user id
  createdAt: timestamp("created_at").defaultNow(),
});

// Training Quizzes
export const trainingQuizzes = pgTable("training_quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => trainingLessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").default(70), // Percentage
  maxAttempts: integer("max_attempts").default(3), // 0 = unlimited
  timeLimit: integer("time_limit"), // Minutes, null = no limit
  shuffleQuestions: boolean("shuffle_questions").default(false),
  showCorrectAnswers: boolean("show_correct_answers").default(true),
  isRequired: boolean("is_required").default(true),
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Quiz Questions
export const trainingQuizQuestions = pgTable("training_quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => trainingQuizzes.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  questionType: text("question_type").default("multiple_choice"), // multiple_choice, true_false, short_answer
  options: jsonb("options"), // Array of options for multiple choice
  correctAnswer: text("correct_answer").notNull(), // Index for MC, text for others
  explanation: text("explanation"), // Explanation shown after answer
  points: integer("points").default(1),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training Lesson Resources
export const trainingLessonResources = pgTable("training_lesson_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => trainingLessons.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "download" or "link"
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"), // For links: external URL, For downloads: object storage URL
  fileName: text("file_name"), // Original filename for downloads
  fileSize: integer("file_size"), // File size in bytes for downloads
  order: integer("order").default(0),
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Quiz Attempts
export const trainingQuizAttempts = pgTable("training_quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => trainingQuizzes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  enrollmentId: varchar("enrollment_id").notNull().references(() => trainingEnrollments.id, { onDelete: "cascade" }),
  score: integer("score").default(0), // Percentage
  totalPoints: integer("total_points").default(0),
  earnedPoints: integer("earned_points").default(0),
  answers: jsonb("answers"), // User's answers
  isPassed: boolean("is_passed").default(false),
  attemptNumber: integer("attempt_number").default(1),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  timeSpent: integer("time_spent"), // Minutes
});

// Training Assignments
export const trainingAssignments = pgTable("training_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => trainingLessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"), // Detailed instructions
  allowedFileTypes: text("allowed_file_types").array(), // ['pdf', 'doc', 'docx', 'txt']
  maxFileSize: integer("max_file_size").default(10), // MB
  maxFiles: integer("max_files").default(1),
  isRequired: boolean("is_required").default(true),
  templateFiles: jsonb("template_files"), // Array of instructor-provided template files
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Assignment Submissions
export const trainingAssignmentSubmissions = pgTable("training_assignment_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => trainingAssignments.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  enrollmentId: varchar("enrollment_id").notNull().references(() => trainingEnrollments.id, { onDelete: "cascade" }),
  submissionText: text("submission_text"), // Text response
  files: jsonb("files"), // Array of uploaded file info
  status: text("status").default("submitted"), // submitted, graded, returned
  grade: integer("grade"), // Percentage or points
  feedback: text("feedback"), // Instructor feedback
  gradedBy: uuid("graded_by").references(() => staff.id),
  submittedAt: timestamp("submitted_at").defaultNow(),
  gradedAt: timestamp("graded_at"),
});

// Training Discussions/Comments
export const trainingDiscussions = pgTable("training_discussions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => trainingCourses.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").references(() => trainingLessons.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id").references(() => trainingDiscussions.id), // For replies
  content: text("content").notNull(),
  isInstructor: boolean("is_instructor").default(false),
  isPinned: boolean("is_pinned").default(false),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Discussion Likes
export const trainingDiscussionLikes = pgTable("training_discussion_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discussionId: varchar("discussion_id").notNull().references(() => trainingDiscussions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// User View Preferences - Store per-user customization for views (column preferences, etc.)
export const userViewPreferences = pgTable("user_view_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  viewType: text("view_type").notNull(), // e.g., 'clients_all', 'leads_all', 'tasks_all'
  preferences: jsonb("preferences").notNull(), // Store column visibility, sort order, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.viewType), // One preference per user per view type
]);

// Dashboards - User-created dashboard containers
export const dashboards = pgTable("dashboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Dashboard name e.g., "Sales Dashboard", "My Dashboard"
  isDefault: boolean("is_default").default(false), // One default per user
  displayOrder: integer("display_order").default(0), // Order for display in tabs/lists
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dashboard Widgets - Customizable dashboard system
export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull().unique(), // e.g., 'client_health_overview', 'recent_clients', 'client_approval_queue'
  name: text("name").notNull(), // Display name
  description: text("description"), // Widget description
  category: text("category").notNull(), // 'client_management', 'sales', 'tasks', etc.
  icon: text("icon").notNull().default("LayoutDashboard"), // lucide-react icon name
  defaultWidth: integer("default_width").notNull().default(2), // Grid columns (1-4)
  defaultHeight: integer("default_height").notNull().default(2), // Grid rows (1-4)
  minWidth: integer("min_width").notNull().default(1),
  minHeight: integer("min_height").notNull().default(1),
  maxWidth: integer("max_width").notNull().default(4),
  maxHeight: integer("max_height").notNull().default(4),
  defaultSettings: jsonb("default_settings").default('{}'), // Default widget configuration
  refreshInterval: integer("refresh_interval").default(300), // Refresh in seconds (300 = 5 min)
  requiresAuth: boolean("requires_auth").default(true),
  allowedRoles: text("allowed_roles").array(), // null = all roles, or specific roles
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Dashboard Widgets - User's customized widget instances
export const userDashboardWidgets = pgTable("user_dashboard_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  dashboardId: varchar("dashboard_id").notNull().references(() => dashboards.id, { onDelete: "cascade" }),
  widgetType: text("widget_type").notNull(), // References dashboardWidgets.type
  x: integer("x").notNull().default(0), // Grid position X
  y: integer("y").notNull().default(0), // Grid position Y
  width: integer("width").notNull().default(2), // Grid width (1-4)
  height: integer("height").notNull().default(2), // Grid height (1-4)
  settings: jsonb("settings").default('{}'), // User-specific widget settings
  isVisible: boolean("is_visible").default(true),
  order: integer("order").default(0), // Display order for mobile/fallback
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =============================================================================
// TRAINING SYSTEM SCHEMAS & TYPES
// =============================================================================

// Training Categories
export const insertTrainingCategorySchema = createInsertSchema(trainingCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingCourseSchema = createInsertSchema(trainingCourses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingLessonSchema = createInsertSchema(trainingLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingEnrollmentSchema = createInsertSchema(trainingEnrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertTrainingProgressSchema = createInsertSchema(trainingProgress).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingCoursePermissionSchema = createInsertSchema(trainingCoursePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingQuizSchema = createInsertSchema(trainingQuizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingQuizQuestionSchema = createInsertSchema(trainingQuizQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingQuizAttemptSchema = createInsertSchema(trainingQuizAttempts).omit({
  id: true,
  startedAt: true,
});

export const insertTrainingAssignmentSchema = createInsertSchema(trainingAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingAssignmentSubmissionSchema = createInsertSchema(trainingAssignmentSubmissions).omit({
  id: true,
  submittedAt: true,
});

export const insertTrainingDiscussionSchema = createInsertSchema(trainingDiscussions).omit({
  id: true,
  likesCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingDiscussionLikeSchema = createInsertSchema(trainingDiscussionLikes).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingLessonResourceSchema = createInsertSchema(trainingLessonResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// User View Preferences insert schema
export const insertUserViewPreferenceSchema = createInsertSchema(userViewPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Dashboards insert schema
export const insertDashboardSchema = createInsertSchema(dashboards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Dashboard Widgets insert schemas
export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserDashboardWidgetSchema = createInsertSchema(userDashboardWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Quotes insert schemas
export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  totalCost: true,
  oneTimeCost: true,
  monthlyCost: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({
  id: true,
  createdAt: true,
});

// Sales Settings insert schema
export const insertSalesSettingsSchema = createInsertSchema(salesSettings).omit({
  id: true,
  updatedAt: true,
});

// Sales Settings update schema
export const updateSalesSettingsSchema = insertSalesSettingsSchema.partial();

// Sales Targets insert schema
export const insertSalesTargetSchema = createInsertSchema(salesTargets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  targetAmount: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'number') {
      return val.toString();
    }
    return val;
  }),
});

// Sales Targets update schema
export const updateSalesTargetSchema = insertSalesTargetSchema.partial();

// Capacity Settings insert schema
export const insertCapacitySettingsSchema = createInsertSchema(capacitySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  alertThreshold: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'number') {
      return val.toString();
    }
    return val;
  }),
});

// Capacity Settings update schema
export const updateCapacitySettingsSchema = insertCapacitySettingsSchema.partial();

// Training Types
export type TrainingCategory = typeof trainingCategories.$inferSelect;
export type InsertTrainingCategory = z.infer<typeof insertTrainingCategorySchema>;

export type TrainingCourse = typeof trainingCourses.$inferSelect;
export type InsertTrainingCourse = z.infer<typeof insertTrainingCourseSchema>;

export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;

export type TrainingLesson = typeof trainingLessons.$inferSelect;
export type InsertTrainingLesson = z.infer<typeof insertTrainingLessonSchema>;

export type TrainingEnrollment = typeof trainingEnrollments.$inferSelect;
export type InsertTrainingEnrollment = z.infer<typeof insertTrainingEnrollmentSchema>;

export type TrainingProgress = typeof trainingProgress.$inferSelect;
export type TrainingCoursePermission = typeof trainingCoursePermissions.$inferSelect;
export type InsertTrainingCoursePermission = z.infer<typeof insertTrainingCoursePermissionSchema>;
export type InsertTrainingProgress = z.infer<typeof insertTrainingProgressSchema>;

export type TrainingQuiz = typeof trainingQuizzes.$inferSelect;
export type InsertTrainingQuiz = z.infer<typeof insertTrainingQuizSchema>;

export type TrainingQuizQuestion = typeof trainingQuizQuestions.$inferSelect;
export type InsertTrainingQuizQuestion = z.infer<typeof insertTrainingQuizQuestionSchema>;

export type TrainingQuizAttempt = typeof trainingQuizAttempts.$inferSelect;
export type InsertTrainingQuizAttempt = z.infer<typeof insertTrainingQuizAttemptSchema>;

export type TrainingAssignment = typeof trainingAssignments.$inferSelect;
export type InsertTrainingAssignment = z.infer<typeof insertTrainingAssignmentSchema>;

export type TrainingAssignmentSubmission = typeof trainingAssignmentSubmissions.$inferSelect;
export type InsertTrainingAssignmentSubmission = z.infer<typeof insertTrainingAssignmentSubmissionSchema>;

export type TrainingDiscussion = typeof trainingDiscussions.$inferSelect;
export type InsertTrainingDiscussion = z.infer<typeof insertTrainingDiscussionSchema>;

export type TrainingDiscussionLike = typeof trainingDiscussionLikes.$inferSelect;
export type InsertTrainingDiscussionLike = z.infer<typeof insertTrainingDiscussionLikeSchema>;

export type TrainingLessonResource = typeof trainingLessonResources.$inferSelect;
export type InsertTrainingLessonResource = z.infer<typeof insertTrainingLessonResourceSchema>;

// User View Preferences Types
export type UserViewPreference = typeof userViewPreferences.$inferSelect;
export type InsertUserViewPreference = z.infer<typeof insertUserViewPreferenceSchema>;

// Dashboard Types
export type Dashboard = typeof dashboards.$inferSelect;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;

// Dashboard Widgets Types
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;

export type UserDashboardWidget = typeof userDashboardWidgets.$inferSelect;
export type InsertUserDashboardWidget = z.infer<typeof insertUserDashboardWidgetSchema>;

// Quotes Types
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;

// Sales Settings Types
export type SalesSettings = typeof salesSettings.$inferSelect;
export type InsertSalesSettings = z.infer<typeof insertSalesSettingsSchema>;

// Sales Targets Types
export type SalesTarget = typeof salesTargets.$inferSelect;
export type InsertSalesTarget = z.infer<typeof insertSalesTargetSchema>;
export type UpdateSalesTarget = z.infer<typeof updateSalesTargetSchema>;

// Capacity Settings Types
export type CapacitySettings = typeof capacitySettings.$inferSelect;
export type InsertCapacitySettings = z.infer<typeof insertCapacitySettingsSchema>;

// Smart Lists schema exports - remove duplicate and use existing one

// Time Tracking Report Types
export interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string;
  endTime?: string;
  userId: string;
  userName?: string;
  isRunning: boolean;
  duration?: number; // in minutes
  source?: string;
  notes?: string;
  // Auto-stop / abandoned-timer metadata mirrored from `task_time_entries`.
  stoppedBy?: string;
  stopReason?: string;
  autoStoppedAt?: string;
  autoStoppedThresholdHours?: number;
}

export interface UserSummary {
  userId: string;
  userName: string;
  userRole: string;
  department?: string;
  totalTime: number;
  tasksWorked: number;
  dailyTotals: Record<string, number>;
}

export interface ClientBreakdown {
  clientId: string;
  clientName: string;
  totalTime: number;
  tasksCount: number;
  users: Array<{
    userId: string;
    userName: string;
    timeSpent: number;
  }>;
}

export interface TimeTrackingReportData {
  tasks: Array<Task & {
    userInfo?: Staff;
    clientInfo?: Client;
    timeEntriesByDate: Record<string, TimeEntry[]>;
    totalTracked: number;
  }>;
  userSummaries: UserSummary[];
  clientBreakdowns: ClientBreakdown[];
  dailyTotals: Record<string, number>;
  grandTotal: number;
}

export interface TimeTrackingReportFilters {
  dateFrom: string;
  dateTo: string;
  userId?: string; // For filtering specific users (managers can see their reports)
  clientId?: string;
  taskStatus?: string[];
  reportType?: 'detailed' | 'summary';
}

// Time tracking report query validation schema
export const timeTrackingReportFiltersSchema = z.object({
  dateFrom: z.string().min(1, 'Start date is required'),
  dateTo: z.string().min(1, 'End date is required'),
  userId: z.string().optional(),
  clientId: z.string().optional(),
  taskStatus: z.array(z.string()).optional(),
  reportType: z.enum(['detailed', 'summary']).optional().default('detailed'),
});

// ===============================================
// 1-on-1 Meeting Tracker System
// ===============================================

// Main 1-on-1 meeting records
export const oneOnOneMeetings = pgTable("one_on_one_meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  managerId: uuid("manager_id").notNull().references(() => staff.id),
  directReportId: uuid("direct_report_id").notNull().references(() => staff.id),
  meetingDate: date("meeting_date").notNull(),
  meetingTime: text("meeting_time").notNull().default("09:00"), // Time of meeting in HH:mm format
  meetingDuration: integer("meeting_duration").notNull().default(30), // Duration in minutes
  weekOf: date("week_of").notNull(), // Week identifier (e.g., Monday of that week)
  
  // Calendar integration
  calendarAppointmentId: varchar("calendar_appointment_id").references(() => calendarAppointments.id, { onDelete: "set null" }), // Internal AgencyBoost calendar appointment
  calendarEventId: varchar("calendar_event_id"), // Reference to Google Calendar event (for two-way sync)
  
  // Feeling rating (emoji picker)
  feeling: text("feeling"), // terrible, bad, okay, good, excellent
  
  // Performance feedback
  performanceFeedback: text("performance_feedback"), // on_target, below_expectations, far_below_expectations
  performancePoints: integer("performance_points"), // 3, 2, or 1
  bonusPoints: integer("bonus_points").default(0), // 0, 1, or 2
  
  // Manager/Admin only fields
  progressionStatus: text("progression_status"), // retention_risk, performance_issues, ready_for_promotion
  hobbies: text("hobbies"),
  family: text("family"),
  privateNotes: text("private_notes"), // Only visible to manager and admins
  recordingLink: text("recording_link"), // Link to Fathom, Google Meet, or other video recording
  
  // Recurring meeting fields
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"), // "weekly", "biweekly", "monthly"
  recurringEndType: text("recurring_end_type"), // "never", "after_occurrences", "on_date"
  recurringEndDate: date("recurring_end_date"),
  recurringOccurrences: integer("recurring_occurrences"),
  recurringParentId: varchar("recurring_parent_id"),
  
  // Meeting time tracking fields
  meetingStartedAt: timestamp("meeting_started_at"),
  meetingEndedAt: timestamp("meeting_ended_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOneOnOneMeetingSchema = createInsertSchema(oneOnOneMeetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OneOnOneMeeting = typeof oneOnOneMeetings.$inferSelect;
export type InsertOneOnOneMeeting = z.infer<typeof insertOneOnOneMeetingSchema>;

// Talking points for meetings
export const oneOnOneTalkingPoints = pgTable("one_on_one_talking_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull().references(() => oneOnOneMeetings.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  addedBy: uuid("added_by").notNull().references(() => staff.id), // Who added this point
  orderIndex: integer("order_index").default(0),
  isCompleted: boolean("is_completed").default(false),
  notes: text("notes"), // Optional notes for the talking point
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOneOnOneTalkingPointSchema = createInsertSchema(oneOnOneTalkingPoints).omit({
  id: true,
  createdAt: true,
});

export type OneOnOneTalkingPoint = typeof oneOnOneTalkingPoints.$inferSelect;
export type InsertOneOnOneTalkingPoint = z.infer<typeof insertOneOnOneTalkingPointSchema>;

// Wins for meetings
export const oneOnOneWins = pgTable("one_on_one_wins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull().references(() => oneOnOneMeetings.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  addedBy: uuid("added_by").notNull().references(() => staff.id),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOneOnOneWinSchema = createInsertSchema(oneOnOneWins).omit({
  id: true,
  createdAt: true,
});

export type OneOnOneWin = typeof oneOnOneWins.$inferSelect;
export type InsertOneOnOneWin = z.infer<typeof insertOneOnOneWinSchema>;

// Objectives for meetings
export const oneOnOneObjectives = pgTable("one_on_one_objectives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull().references(() => oneOnOneMeetings.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  addedBy: uuid("added_by").notNull().references(() => staff.id),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOneOnOneObjectiveSchema = createInsertSchema(oneOnOneObjectives).omit({
  id: true,
  createdAt: true,
});

export type OneOnOneObjective = typeof oneOnOneObjectives.$inferSelect;
export type InsertOneOnOneObjective = z.infer<typeof insertOneOnOneObjectiveSchema>;

// Action items from meetings
export const oneOnOneActionItems = pgTable("one_on_one_action_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull().references(() => oneOnOneMeetings.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  assignedTo: uuid("assigned_to").references(() => staff.id),
  dueDate: date("due_date"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  taskId: varchar("task_id").references(() => tasks.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOneOnOneActionItemSchema = createInsertSchema(oneOnOneActionItems).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type OneOnOneActionItem = typeof oneOnOneActionItems.$inferSelect;
export type InsertOneOnOneActionItem = z.infer<typeof insertOneOnOneActionItemSchema>;

// Goals with status tracking
export const oneOnOneGoals = pgTable("one_on_one_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").references(() => oneOnOneMeetings.id, { onDelete: 'set null' }),
  directReportId: uuid("direct_report_id").notNull().references(() => staff.id),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"), // pending, on_track, off_track, complete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOneOnOneGoalSchema = createInsertSchema(oneOnOneGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OneOnOneGoal = typeof oneOnOneGoals.$inferSelect;
export type InsertOneOnOneGoal = z.infer<typeof insertOneOnOneGoalSchema>;

// Position KPI status tracking per meeting
export const oneOnOneMeetingKpiStatuses = pgTable("one_on_one_meeting_kpi_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull().references(() => oneOnOneMeetings.id, { onDelete: 'cascade' }),
  positionKpiId: varchar("position_kpi_id").notNull().references(() => positionKpis.id, { onDelete: 'cascade' }),
  status: text("status").notNull().default("on_track"), // on_track, off_track, complete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOneOnOneMeetingKpiStatusSchema = createInsertSchema(oneOnOneMeetingKpiStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OneOnOneMeetingKpiStatus = typeof oneOnOneMeetingKpiStatuses.$inferSelect;
export type InsertOneOnOneMeetingKpiStatus = z.infer<typeof insertOneOnOneMeetingKpiStatusSchema>;

// Comments visible to both manager and direct report
export const oneOnOneComments = pgTable("one_on_one_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull().references(() => oneOnOneMeetings.id, { onDelete: 'cascade' }),
  authorId: uuid("author_id").notNull().references(() => staff.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOneOnOneCommentSchema = createInsertSchema(oneOnOneComments).omit({
  id: true,
  createdAt: true,
});

export type OneOnOneComment = typeof oneOnOneComments.$inferSelect;
export type InsertOneOnOneComment = z.infer<typeof insertOneOnOneCommentSchema>;

// Progression status options for 1-on-1 meetings
export const oneOnOneProgressionStatuses = pgTable("one_on_one_progression_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  value: varchar("value", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  color: varchar("color", { length: 100 }).notNull(), // Tailwind color classes
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOneOnOneProgressionStatusSchema = createInsertSchema(oneOnOneProgressionStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OneOnOneProgressionStatus = typeof oneOnOneProgressionStatuses.$inferSelect;
export type InsertOneOnOneProgressionStatus = z.infer<typeof insertOneOnOneProgressionStatusSchema>;

// Organization Chart Structure Tables
export const orgChartStructures = pgTable("org_chart_structures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false), // Only one can be active at a time
  createdById: uuid("created_by_id").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrgChartStructureSchema = createInsertSchema(orgChartStructures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OrgChartStructure = typeof orgChartStructures.$inferSelect;
export type InsertOrgChartStructure = z.infer<typeof insertOrgChartStructureSchema>;

// Organization Chart Nodes (positions/roles in the hierarchy)
export const orgChartNodes = pgTable("org_chart_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  structureId: varchar("structure_id").notNull().references(() => orgChartStructures.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 200 }).notNull(), // Position title (e.g., "CEO", "VP of Sales")
  department: varchar("department", { length: 100 }), // Optional department
  position: varchar("position", { length: 100 }), // Optional position type
  roleType: varchar("role_type", { length: 50 }).default("standard"), // executive, management, individual_contributor, standard
  notes: text("notes"), // Job responsibilities, requirements, etc.
  parentId: varchar("parent_id"), // Self-reference to create hierarchy
  orderIndex: integer("order_index").default(0), // Order among siblings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrgChartNodeSchema = createInsertSchema(orgChartNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OrgChartNode = typeof orgChartNodes.$inferSelect;
export type InsertOrgChartNode = z.infer<typeof insertOrgChartNodeSchema>;

// Organization Chart Node Assignments (assign staff to positions)
export const orgChartNodeAssignments = pgTable("org_chart_node_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nodeId: varchar("node_id").notNull().references(() => orgChartNodes.id, { onDelete: 'cascade' }),
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: 'cascade' }),
  assignmentType: varchar("assignment_type", { length: 50 }).default("primary"), // primary, backup, interim
  effectiveDate: date("effective_date"), // When the assignment becomes effective
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure one primary assignment per node
  uniquePrimaryAssignment: unique().on(table.nodeId, table.assignmentType),
}));

export const insertOrgChartNodeAssignmentSchema = createInsertSchema(orgChartNodeAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OrgChartNodeAssignment = typeof orgChartNodeAssignments.$inferSelect;
export type InsertOrgChartNodeAssignment = z.infer<typeof insertOrgChartNodeAssignmentSchema>;

// Time Off Types schemas
export const insertTimeOffTypeSchema = createInsertSchema(timeOffTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  defaultDaysPerYear: z.coerce.number().min(0).max(365),
  maxCarryOverDays: z.coerce.number().min(0).max(365),
  orderIndex: z.coerce.number().min(0),
});
export type InsertTimeOffType = z.infer<typeof insertTimeOffTypeSchema>;
export type SelectTimeOffType = typeof timeOffTypes.$inferSelect;

// Google Calendar Connections - stores per-user OAuth tokens
export const calendarConnections = pgTable("calendar_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }), // Using uuid to match staff.id type
  calendarId: text("calendar_id").notNull().default("primary"),
  calendarName: text("calendar_name"),
  email: text("email").notNull(),
  accessToken: text("access_token").notNull(), // Encrypted
  refreshToken: text("refresh_token").notNull(), // Encrypted
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope").notNull(),
  // Sync preferences
  syncEnabled: boolean("sync_enabled").default(true),
  twoWaySync: boolean("two_way_sync").default(true),
  createContacts: boolean("create_contacts").default(false),
  triggerWorkflows: boolean("trigger_workflows").default(false),
  blockAsAppointments: boolean("block_as_appointments").default(false), // false = just block time, true = create full appointments
  // Sync state
  lastSyncedAt: timestamp("last_synced_at"),
  syncToken: text("sync_token"), // For incremental sync
  pageToken: text("page_token"), // For pagination during initial sync
  // Watch/webhook for real-time updates
  webhookChannelId: text("webhook_channel_id"),
  webhookExpiration: timestamp("webhook_expiration"),
  webhookResourceId: text("webhook_resource_id"),
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_calendar_connections_user_id").on(table.userId),
  unique("unique_user_calendar").on(table.userId, table.calendarId),
]);

// Calendar Sync State - tracks sync history and errors
export const calendarSyncState = pgTable("calendar_sync_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull().references(() => calendarConnections.id, { onDelete: "cascade" }),
  lastSyncStarted: timestamp("last_sync_started"),
  lastSyncCompleted: timestamp("last_sync_completed"),
  lastSyncStatus: text("last_sync_status"), // success, failed, in_progress
  lastSyncError: text("last_sync_error"),
  eventsCreated: integer("events_created").default(0),
  eventsUpdated: integer("events_updated").default(0),
  eventsDeleted: integer("events_deleted").default(0),
  nextSyncToken: text("next_sync_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_calendar_sync_state_connection_id").on(table.connectionId),
]);

// Calendar Events - optimized storage for Google Calendar events (only essential fields)
// Stores only events within rolling window (e.g., -90 to +365 days)
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull().references(() => calendarConnections.id, { onDelete: "cascade" }),
  googleEventId: text("google_event_id").notNull(),
  appointmentId: varchar("appointment_id").references(() => calendarAppointments.id, { onDelete: "set null" }), // Links to AgencyBoost appointment
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }), // Links to client for time tracking
  // Essential fields only for availability and display
  summary: text("summary"),
  description: text("description"), // Event description
  location: text("location"), // Event location
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  allDay: boolean("all_day").default(false),
  status: text("status"), // confirmed, tentative, cancelled
  transparency: text("transparency"), // opaque (busy), transparent (free)
  // Google Meet / Hangout link
  googleHangoutLink: text("google_hangout_link"), // For Google Meet links
  googleHtmlLink: text("google_html_link"), // Link to event in Google Calendar UI
  // Minimal attendee data for contact creation
  attendees: jsonb("attendees"), // Array of {email, name, responseStatus} - only stored if createContacts is enabled
  organizer: jsonb("organizer"), // {email, name, self} - organizer info
  organizerEmail: text("organizer_email"), // Just the email for quick lookup
  // Sync metadata
  etag: text("etag"), // For change detection
  lastModified: timestamp("last_modified"), // Google's updated timestamp
  syncedAt: timestamp("synced_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Flags
  isRecurring: boolean("is_recurring").default(false), // Flag instead of full recurrence data
  createdInAgencyBoost: boolean("created_in_agency_flow").default(false), // Track origin for two-way sync
  // Appointment status for time tracking
  appointmentStatus: text("appointment_status").default("confirmed"), // confirmed, showed, no_show, cancelled
  timeEntryCreated: boolean("time_entry_created").default(false), // Track if time entry was auto-created
}, (table) => [
  index("idx_calendar_events_connection_id").on(table.connectionId),
  index("idx_calendar_events_google_event_id").on(table.googleEventId),
  index("idx_calendar_events_appointment_id").on(table.appointmentId),
  index("idx_calendar_events_client_id").on(table.clientId),
  index("idx_calendar_events_time_range").on(table.startTime, table.endTime),
  index("idx_calendar_events_user_time").on(table.connectionId, table.startTime, table.endTime), // For availability checks
  unique("unique_connection_google_event").on(table.connectionId, table.googleEventId),
]);

// Calendar Event Cache - stores next 7 days of events for fast availability checks
export const calendarEventCache = pgTable("calendar_event_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  date: date("date").notNull(), // Date for this cache entry
  busySlots: jsonb("busy_slots").notNull(), // Array of {start, end} timestamps for this day
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  etag: text("etag"), // For cache validation
}, (table) => [
  index("idx_event_cache_user_date").on(table.userId, table.date),
  unique("unique_user_date_cache").on(table.userId, table.date),
]);

// Calendar Connection schemas
export const insertCalendarConnectionSchema = createInsertSchema(calendarConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncedAt: true,
  syncToken: true,
  webhookChannelId: true,
  webhookExpiration: true,
});
export type InsertCalendarConnection = z.infer<typeof insertCalendarConnectionSchema>;
export type CalendarConnection = typeof calendarConnections.$inferSelect;

// Calendar Sync State schemas
export const insertCalendarSyncStateSchema = createInsertSchema(calendarSyncState).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCalendarSyncState = z.infer<typeof insertCalendarSyncStateSchema>;
export type CalendarSyncState = typeof calendarSyncState.$inferSelect;

// Calendar Events schemas
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  syncedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// Event Time Entries - standalone time tracking for calendar events (auto-created when status = "Showed")
export const eventTimeEntries = pgTable("event_time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calendarEventId: varchar("calendar_event_id").notNull().references(() => calendarEvents.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  source: text("source").default("auto"), // auto (from calendar), manual
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_event_time_entries_calendar_event").on(table.calendarEventId),
  index("idx_event_time_entries_user").on(table.userId),
  index("idx_event_time_entries_client").on(table.clientId),
  index("idx_event_time_entries_date").on(table.startTime),
]);

export const insertEventTimeEntrySchema = createInsertSchema(eventTimeEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEventTimeEntry = z.infer<typeof insertEventTimeEntrySchema>;
export type EventTimeEntry = typeof eventTimeEntries.$inferSelect;

// ================================
// SURVEYS - Multi-step forms with conditional logic
// ================================

// Survey folders - for organizing surveys
export const surveyFolders = pgTable("survey_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Surveys - main survey entity
export const surveys = pgTable("surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  shortCode: text("short_code").unique(), // for public URLs like /survey/abc123
  folderId: varchar("folder_id").references(() => surveyFolders.id, { onDelete: "set null" }),
  settings: jsonb("settings").default({}), // general survey settings
  styling: jsonb("styling").default({}), // visual styling configuration
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  updatedBy: uuid("updated_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_surveys_folder").on(table.folderId),
  index("idx_surveys_status").on(table.status),
  index("idx_surveys_short_code").on(table.shortCode),
]);

// Survey slides - the pages/steps in a multi-step survey
export const surveySlides = pgTable("survey_slides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  title: text("title"),
  description: text("description"),
  order: integer("order").notNull().default(0),
  buttonText: text("button_text").default("Next"), // CTA button text
  settings: jsonb("settings").default({}), // slide-specific settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_survey_slides_survey").on(table.surveyId),
]);

// Survey fields - questions/inputs within each slide
export const surveyFields = pgTable("survey_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  slideId: varchar("slide_id").notNull().references(() => surveySlides.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // text, email, phone, dropdown, checkbox, radio, date, number, rating, textarea, html, etc.
  label: text("label"),
  placeholder: text("placeholder"),
  shortLabel: text("short_label"), // short name for reports
  queryKey: text("query_key"), // unique key for URL params and data exports
  required: boolean("required").default(false),
  hidden: boolean("hidden").default(false),
  options: text("options").array(), // for dropdown/radio/checkbox fields
  validation: jsonb("validation").default({}), // validation rules
  settings: jsonb("settings").default({}), // field-specific settings
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_survey_fields_survey").on(table.surveyId),
  index("idx_survey_fields_slide").on(table.slideId),
]);

// Survey logic rules - conditional logic for showing/hiding fields or jumping to slides
export const surveyLogicRules = pgTable("survey_logic_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  sourceFieldId: varchar("source_field_id").notNull().references(() => surveyFields.id, { onDelete: "cascade" }),
  operator: text("operator").notNull(), // equals, not_equals, contains, not_contains, is_empty, is_not_empty, greater_than, less_than
  comparisonValue: text("comparison_value"), // the value to compare against
  actionType: text("action_type").notNull(), // show, hide, jump_to_slide, skip_slide
  targetFieldId: varchar("target_field_id").references(() => surveyFields.id, { onDelete: "cascade" }), // for show/hide field
  targetSlideId: varchar("target_slide_id").references(() => surveySlides.id, { onDelete: "cascade" }), // for jump/skip slide
  order: integer("order").default(0), // rule priority
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_survey_logic_rules_survey").on(table.surveyId),
  index("idx_survey_logic_rules_source_field").on(table.sourceFieldId),
]);

// Survey submissions - when someone completes a survey
export const surveySubmissions = pgTable("survey_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  submitterEmail: text("submitter_email"),
  submitterName: text("submitter_name"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  status: text("status").default("completed"), // in_progress, completed, abandoned
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_survey_submissions_survey").on(table.surveyId),
  index("idx_survey_submissions_status").on(table.status),
]);

// Survey submission answers - individual answers for each field
export const surveySubmissionAnswers = pgTable("survey_submission_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => surveySubmissions.id, { onDelete: "cascade" }),
  fieldId: varchar("field_id").notNull().references(() => surveyFields.id, { onDelete: "cascade" }),
  value: text("value"), // the submitted value (JSON stringified for complex types)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_survey_submission_answers_submission").on(table.submissionId),
  index("idx_survey_submission_answers_field").on(table.fieldId),
]);

// Survey schemas and types
export const insertSurveyFolderSchema = createInsertSchema(surveyFolders).omit({
  id: true,
  createdAt: true,
});
export type SurveyFolder = typeof surveyFolders.$inferSelect;
export type InsertSurveyFolder = z.infer<typeof insertSurveyFolderSchema>;

// ===============================================
// PX Meetings System (Team Meetings)
// ===============================================

// Meeting segment types
export const PX_MEETING_SEGMENTS = [
  'whats_working_kpis',
  'sales_opportunities', 
  'areas_of_opportunities',
  'action_plan',
  'action_items'
] as const;

export type PxMeetingSegmentType = typeof PX_MEETING_SEGMENTS[number];

// Main PX meetings table
export const pxMeetings = pgTable("px_meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  meetingDate: date("meeting_date").notNull(),
  meetingTime: text("meeting_time").notNull(), // HH:mm format
  meetingDuration: integer("meeting_duration").notNull(), // Duration in minutes
  recordingLink: text("recording_link"),
  
  // Client relation
  clientId: varchar("client_id").references(() => clients.id),
  
  // Tags for filtering (stored as JSON array)
  tags: text("tags").array(),
  
  // Segment content fields
  whatsWorkingKpis: text("whats_working_kpis"),
  salesOpportunities: text("sales_opportunities"),
  areasOfOpportunities: text("areas_of_opportunities"),
  actionPlan: text("action_plan"),
  actionItems: text("action_items"),
  objectives: text("objectives"),
  
  // Notes field
  notes: text("notes"),
  
  // Privacy setting - if true, only attendees can see this meeting
  isPrivate: boolean("is_private").default(false),
  
  // Facilitator and Note Taker
  facilitatorId: uuid("facilitator_id").references(() => staff.id),
  noteTakerId: uuid("note_taker_id").references(() => staff.id),
  
  // Enabled meeting elements (stores which segments are visible)
  // Default: all elements enabled - ["whatsWorkingKpis", "salesOpportunities", "areasOfOpportunities", "actionPlan", "actionItems"]
  enabledElements: text("enabled_elements").array(),
  
  // Recurring meeting fields
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"), // "weekly", "biweekly", "monthly"
  recurringEndType: text("recurring_end_type"), // "never", "after_occurrences", "on_date"
  recurringEndDate: date("recurring_end_date"),
  recurringOccurrences: integer("recurring_occurrences"),
  recurringParentId: varchar("recurring_parent_id"),
  
  // Meeting time tracking fields
  meetingStartedAt: timestamp("meeting_started_at"),
  meetingEndedAt: timestamp("meeting_ended_at"),
  
  // Metadata
  createdById: uuid("created_by_id").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PX meeting attendees
export const pxMeetingAttendees = pgTable("px_meeting_attendees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull().references(() => pxMeetings.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_px_meeting_attendees_meeting").on(table.meetingId),
  index("idx_px_meeting_attendees_user").on(table.userId),
]);

// PX Meetings schemas and types
export const insertPxMeetingSchema = createInsertSchema(pxMeetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type PxMeeting = typeof pxMeetings.$inferSelect;
export type InsertPxMeeting = z.infer<typeof insertPxMeetingSchema>;

export const insertPxMeetingAttendeeSchema = createInsertSchema(pxMeetingAttendees).omit({
  id: true,
  createdAt: true,
});
export type PxMeetingAttendee = typeof pxMeetingAttendees.$inferSelect;
export type InsertPxMeetingAttendee = z.infer<typeof insertPxMeetingAttendeeSchema>;

// Staff Incidents (Incident Management for 1v1 Meetings)
export const staffIncidents = pgTable("staff_incidents", {
  id: serial("id").primaryKey(),
  staffId: uuid("staff_id").notNull().references(() => staff.id),
  incidentType: text("incident_type").notNull(),
  status: text("status").notNull().default("open"),
  description: text("description"),
  witness: text("witness"),
  employeeAcknowledged: boolean("employee_acknowledged").default(false),
  employeeAcknowledgedAt: timestamp("employee_acknowledged_at"),
  followUpDate: date("follow_up_date"),
  createdBy: uuid("created_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStaffIncidentSchema = createInsertSchema(staffIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type StaffIncident = typeof staffIncidents.$inferSelect;
export type InsertStaffIncident = z.infer<typeof insertStaffIncidentSchema>;

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;

export const insertSurveySlideSchema = createInsertSchema(surveySlides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type SurveySlide = typeof surveySlides.$inferSelect;
export type InsertSurveySlide = z.infer<typeof insertSurveySlideSchema>;

export const insertSurveyFieldSchema = createInsertSchema(surveyFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type SurveyField = typeof surveyFields.$inferSelect;
export type InsertSurveyField = z.infer<typeof insertSurveyFieldSchema>;

export const insertSurveyLogicRuleSchema = createInsertSchema(surveyLogicRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type SurveyLogicRule = typeof surveyLogicRules.$inferSelect;
export type InsertSurveyLogicRule = z.infer<typeof insertSurveyLogicRuleSchema>;

export const insertSurveySubmissionSchema = createInsertSchema(surveySubmissions).omit({
  id: true,
  createdAt: true,
});
export type SurveySubmission = typeof surveySubmissions.$inferSelect;
export type InsertSurveySubmission = z.infer<typeof insertSurveySubmissionSchema>;

export const insertSurveySubmissionAnswerSchema = createInsertSchema(surveySubmissionAnswers).omit({
  id: true,
  createdAt: true,
});
export type SurveySubmissionAnswer = typeof surveySubmissionAnswers.$inferSelect;
export type InsertSurveySubmissionAnswer = z.infer<typeof insertSurveySubmissionAnswerSchema>;

// Task Intake Form Configuration - extends surveys for task creation workflow
export const taskIntakeForms = pgTable("task_intake_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("Task Submission Form"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  updatedBy: uuid("updated_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Intake Sections - container for grouping questions with conditional visibility
export const taskIntakeSections = pgTable("task_intake_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => taskIntakeForms.id, { onDelete: "cascade" }),
  sectionName: text("section_name").notNull(),
  internalLabel: text("internal_label"), // admin notes
  orderIndex: integer("order_index").notNull().default(0),
  visibilityConditions: jsonb("visibility_conditions"), // null = always visible
  descriptionTemplate: text("description_template"), // for generating task description output
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_task_intake_sections_form").on(table.formId),
  index("idx_task_intake_sections_order").on(table.orderIndex),
]);

// Task Intake Questions - one question per slide/step
export const taskIntakeQuestions = pgTable("task_intake_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => taskIntakeForms.id, { onDelete: "cascade" }),
  sectionId: varchar("section_id").references(() => taskIntakeSections.id, { onDelete: "set null" }), // nullable for backward compatibility
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // single_choice, multi_choice, text, number, date
  helpText: text("help_text"), // optional hint below the question
  tooltip: text("tooltip"), // tooltip content shown on hover with (i) icon
  internalLabel: text("internal_label"), // admin-only label for organizing questions in logic rules
  isRequired: boolean("is_required").default(true),
  order: integer("order").notNull().default(0),
  settings: jsonb("settings").default({}), // additional settings like min/max for numbers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_task_intake_questions_form").on(table.formId),
  index("idx_task_intake_questions_order").on(table.order),
  index("idx_task_intake_questions_section").on(table.sectionId),
]);

// Task Intake Options - for single_choice and multi_choice questions
export const taskIntakeOptions = pgTable("task_intake_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => taskIntakeQuestions.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_task_intake_options_question").on(table.questionId),
]);

// Task Intake Logic Rules - conditional navigation (if X or Y, go to Z)
export const taskIntakeLogicRules = pgTable("task_intake_logic_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => taskIntakeForms.id, { onDelete: "cascade" }),
  sourceQuestionId: varchar("source_question_id").notNull().references(() => taskIntakeQuestions.id, { onDelete: "cascade" }),
  // Conditions stored as JSON array for OR logic: [{optionId: "x"}, {optionId: "y"}] means "if X or Y"
  conditions: jsonb("conditions").notNull().default([]),
  targetQuestionId: varchar("target_question_id").references(() => taskIntakeQuestions.id, { onDelete: "cascade" }),
  isEndForm: boolean("is_end_form").default(false), // if true, end form instead of going to target
  order: integer("order").default(0),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_task_intake_logic_form").on(table.formId),
  index("idx_task_intake_logic_source").on(table.sourceQuestionId),
]);

// Task Intake Assignment Rules - who gets assigned based on answers
export const taskIntakeAssignmentRules = pgTable("task_intake_assignment_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => taskIntakeForms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  conditions: jsonb("conditions").notNull().default([]),
  assignToRole: text("assign_to_role"), // Role/position name like "Creative Project Manager"
  assignToStaffId: uuid("assign_to_staff_id").references(() => staff.id), // Fallback direct assignment
  setCategoryId: varchar("set_category_id").references(() => taskCategories.id),
  setTags: text("set_tags").array().default([]),
  priority: integer("priority").default(10), // Lower number = higher priority
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_task_intake_assignment_form").on(table.formId),
  index("idx_task_intake_assignment_priority").on(table.priority),
]);

// Schema exports and types
export const insertTaskIntakeFormSchema = createInsertSchema(taskIntakeForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type TaskIntakeForm = typeof taskIntakeForms.$inferSelect;
export type InsertTaskIntakeForm = z.infer<typeof insertTaskIntakeFormSchema>;

export const insertTaskIntakeSectionSchema = createInsertSchema(taskIntakeSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type TaskIntakeSection = typeof taskIntakeSections.$inferSelect;
export type InsertTaskIntakeSection = z.infer<typeof insertTaskIntakeSectionSchema>;

export const insertTaskIntakeQuestionSchema = createInsertSchema(taskIntakeQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type TaskIntakeQuestion = typeof taskIntakeQuestions.$inferSelect;
export type InsertTaskIntakeQuestion = z.infer<typeof insertTaskIntakeQuestionSchema>;

export const insertTaskIntakeOptionSchema = createInsertSchema(taskIntakeOptions).omit({
  id: true,
  createdAt: true,
});
export type TaskIntakeOption = typeof taskIntakeOptions.$inferSelect;
export type InsertTaskIntakeOption = z.infer<typeof insertTaskIntakeOptionSchema>;

export const insertTaskIntakeLogicRuleSchema = createInsertSchema(taskIntakeLogicRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type TaskIntakeLogicRule = typeof taskIntakeLogicRules.$inferSelect;
export type InsertTaskIntakeLogicRule = z.infer<typeof insertTaskIntakeLogicRuleSchema>;

export const insertTaskIntakeAssignmentRuleSchema = createInsertSchema(taskIntakeAssignmentRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type TaskIntakeAssignmentRule = typeof taskIntakeAssignmentRules.$inferSelect;
export type InsertTaskIntakeAssignmentRule = z.infer<typeof insertTaskIntakeAssignmentRuleSchema>;

// Task Intake Submissions - stores form submissions before/after task creation
export const taskIntakeSubmissions = pgTable("task_intake_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "set null" }), // nullable initially, linked after task created
  formId: varchar("form_id").notNull().references(() => taskIntakeForms.id),
  submittedBy: uuid("submitted_by").notNull().references(() => staff.id),
  submittedAt: timestamp("submitted_at").defaultNow(),
  status: text("status").notNull().default("pending"), // pending, task_created, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_task_intake_submissions_task").on(table.taskId),
  index("idx_task_intake_submissions_form").on(table.formId),
  index("idx_task_intake_submissions_user").on(table.submittedBy),
]);

// Task Intake Answers - stores individual answers for each submission
export const taskIntakeAnswers = pgTable("task_intake_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => taskIntakeSubmissions.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => taskIntakeQuestions.id),
  sectionId: varchar("section_id").references(() => taskIntakeSections.id),
  answerValue: text("answer_value"), // store all answers as text/JSON string
  wasVisible: boolean("was_visible").default(true), // true if section was visible when submitted
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_task_intake_answers_submission").on(table.submissionId),
  index("idx_task_intake_answers_question").on(table.questionId),
]);

// Schema exports for submissions and answers
export const insertTaskIntakeSubmissionSchema = createInsertSchema(taskIntakeSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
});
export type TaskIntakeSubmission = typeof taskIntakeSubmissions.$inferSelect;
export type InsertTaskIntakeSubmission = z.infer<typeof insertTaskIntakeSubmissionSchema>;

export const insertTaskIntakeAnswerSchema = createInsertSchema(taskIntakeAnswers).omit({
  id: true,
  createdAt: true,
});
export type TaskIntakeAnswer = typeof taskIntakeAnswers.$inferSelect;
export type InsertTaskIntakeAnswer = z.infer<typeof insertTaskIntakeAnswerSchema>;

// ===== TOOL DIRECTORY =====
// Tool Directory Categories
export const toolDirectoryCategories = pgTable("tool_directory_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // lucide icon name
  color: text("color"), // hex color
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tool Directory Tools
export const toolDirectoryTools = pgTable("tool_directory_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  logoUrl: text("logo_url"),
  categoryId: varchar("category_id").references(() => toolDirectoryCategories.id, { onDelete: "set null" }),
  tags: text("tags").array(),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  createdBy: uuid("created_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tool_directory_tools_category").on(table.categoryId),
]);

// Schema exports for Tool Directory
export const insertToolDirectoryCategorySchema = createInsertSchema(toolDirectoryCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type ToolDirectoryCategory = typeof toolDirectoryCategories.$inferSelect;
export type InsertToolDirectoryCategory = z.infer<typeof insertToolDirectoryCategorySchema>;

export const insertToolDirectoryToolSchema = createInsertSchema(toolDirectoryTools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type ToolDirectoryTool = typeof toolDirectoryTools.$inferSelect;
export type InsertToolDirectoryTool = z.infer<typeof insertToolDirectoryToolSchema>;

// ============================
// Ticketing System
// ============================

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: serial("ticket_number"),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("bug"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  submittedBy: uuid("submitted_by").references(() => staff.id),
  assignedTo: uuid("assigned_to").references(() => staff.id),
  tags: text("tags").array(),
  loomVideoUrl: text("loom_video_url"),
  screenshots: text("screenshots").array(),
  submitterName: text("submitter_name"),
  submitterEmail: text("submitter_email"),
  platform: text("platform"),
  source: text("source").default("AgencyBoost"),
  firstResponseAt: timestamp("first_response_at"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tickets_status").on(table.status),
  index("idx_tickets_type").on(table.type),
  index("idx_tickets_priority").on(table.priority),
  index("idx_tickets_submitted_by").on(table.submittedBy),
  index("idx_tickets_assigned_to").on(table.assignedTo),
]);

export const ticketRoutingRules = pgTable("ticket_routing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  conditions: text("conditions").notNull().default("{}"),
  assignToUserId: uuid("assign_to_user_id").references(() => staff.id),
  assignToTeam: text("assign_to_team"),
  autoSetPriority: text("auto_set_priority"),
  autoAddTags: text("auto_add_tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ticketComments = pgTable("ticket_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => staff.id),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ticket_comments_ticket").on(table.ticketId),
]);

export const ticketAttachments = pgTable("ticket_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  commentId: varchar("comment_id").references(() => ticketComments.id, { onDelete: "set null" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  fileUrl: text("file_url").notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ticket_attachments_ticket").on(table.ticketId),
]);

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketNumber: true,
  firstResponseAt: true,
  resolvedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export const insertTicketCommentSchema = createInsertSchema(ticketComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertTicketComment = z.infer<typeof insertTicketCommentSchema>;

export const insertTicketAttachmentSchema = createInsertSchema(ticketAttachments).omit({
  id: true,
  createdAt: true,
});
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type InsertTicketAttachment = z.infer<typeof insertTicketAttachmentSchema>;

export const insertTicketRoutingRuleSchema = createInsertSchema(ticketRoutingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type TicketRoutingRule = typeof ticketRoutingRules.$inferSelect;
export type InsertTicketRoutingRule = z.infer<typeof insertTicketRoutingRuleSchema>;

// ================================
// CALL CENTER TIME TRACKING
// ================================

export const callCenterTimeEntries = pgTable("call_center_time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  isRunning: boolean("is_running").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_call_center_time_entries_user").on(table.userId),
  index("idx_call_center_time_entries_client").on(table.clientId),
  index("idx_call_center_time_entries_date").on(table.startTime),
  index("idx_call_center_time_entries_running").on(table.userId, table.isRunning),
]);

export const insertCallCenterTimeEntrySchema = createInsertSchema(callCenterTimeEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCallCenterTimeEntry = z.infer<typeof insertCallCenterTimeEntrySchema>;
export type CallCenterTimeEntry = typeof callCenterTimeEntries.$inferSelect;

// Product Task Templates - task templates tied to products/bundles/packages for auto-generation
export const productTaskTemplates = pgTable("product_task_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id),
  bundleId: varchar("bundle_id").references(() => productBundles.id),
  packageId: varchar("package_id").references(() => productPackages.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  taskType: varchar("task_type").notNull(), // 'onboarding' | 'recurring'
  quantityMode: varchar("quantity_mode").notNull().default("once"), // 'once' | 'per_unit' | 'per_unit_named'
  departmentId: varchar("department_id").references(() => departments.id),
  categoryId: varchar("category_id").references(() => taskCategories.id),
  workflowId: varchar("workflow_id").references(() => teamWorkflows.id),
  assignedStaffId: uuid("assigned_staff_id").references(() => staff.id),
  dueDateOffset: integer("due_date_offset").notNull().default(7),
  estimatedHours: decimal("estimated_hours", { precision: 6, scale: 2 }),
  priority: varchar("priority").default("medium"), // 'low' | 'medium' | 'high' | 'urgent'
  sortOrder: integer("sort_order").notNull().default(0),
  dependsOnTemplateId: varchar("depends_on_template_id"),
  onboardingWeek: integer("onboarding_week"),
  visibleToClient: boolean("visible_to_client").default(false),
  status: varchar("status").notNull().default("active"), // 'active' | 'inactive'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductTaskTemplateSchema = createInsertSchema(productTaskTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProductTaskTemplate = z.infer<typeof insertProductTaskTemplateSchema>;
export type ProductTaskTemplate = typeof productTaskTemplates.$inferSelect;

// Client Task Generations - tracks which tasks were generated from templates for a client
export const clientTaskGenerations = pgTable("client_task_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  productId: varchar("product_id").references(() => products.id),
  bundleId: varchar("bundle_id").references(() => productBundles.id),
  packageId: varchar("package_id").references(() => productPackages.id),
  templateId: varchar("template_id").notNull().references(() => productTaskTemplates.id),
  generationType: varchar("generation_type").notNull(), // 'onboarding' | 'recurring'
  cycleNumber: integer("cycle_number"),
  cycleStartDate: timestamp("cycle_start_date"),
  cycleEndDate: timestamp("cycle_end_date"),
  generatedAt: timestamp("generated_at").defaultNow(),
  taskIds: jsonb("task_ids").default(sql`'[]'`),
});

export const insertClientTaskGenerationSchema = createInsertSchema(clientTaskGenerations).omit({
  id: true,
  generatedAt: true,
});
export type InsertClientTaskGeneration = z.infer<typeof insertClientTaskGenerationSchema>;
export type ClientTaskGeneration = typeof clientTaskGenerations.$inferSelect;

// Client Recurring Config - per-client configuration for recurring task generation cycles
export const clientRecurringConfig = pgTable("client_recurring_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id).unique(),
  cycleStartDate: timestamp("cycle_start_date"),
  cycleLengthDays: integer("cycle_length_days").notNull().default(30),
  advanceGenerationDays: integer("advance_generation_days").notNull().default(3),
  status: varchar("status").notNull().default("active"), // 'active' | 'paused' | 'stopped'
  lastGeneratedCycle: integer("last_generated_cycle").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientRecurringConfigSchema = createInsertSchema(clientRecurringConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClientRecurringConfig = z.infer<typeof insertClientRecurringConfigSchema>;
export type ClientRecurringConfig = typeof clientRecurringConfig.$inferSelect;

export const proposals = pgTable("proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").notNull().references(() => quotes.id),
  clientId: varchar("client_id").references(() => clients.id),
  leadId: varchar("lead_id").references(() => leads.id),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  signedAt: timestamp("signed_at"),
  signedByName: varchar("signed_by_name", { length: 255 }),
  signedByEmail: varchar("signed_by_email", { length: 255 }),
  signatureData: text("signature_data"),
  termsAccepted: boolean("terms_accepted").default(false),
  termsVersionId: varchar("terms_version_id"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  paymentStatus: varchar("payment_status", { length: 50 }),
  paidAt: timestamp("paid_at"),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }),
  paymentAmountType: varchar("payment_amount_type", { length: 50 }).default("full"),
  customPaymentAmount: decimal("custom_payment_amount", { precision: 12, scale: 2 }),
  publicToken: varchar("public_token", { length: 64 }).notNull().unique(),
  reminderSentAt: timestamp("reminder_sent_at"),
  reminderCount: integer("reminder_count").default(0),
  expiresAt: timestamp("expires_at"),
  sentAt: timestamp("sent_at"),
  sentByUserId: uuid("sent_by_user_id").references(() => staff.id),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposals.$inferSelect;

export const proposalTerms = pgTable("proposal_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProposalTermsSchema = createInsertSchema(proposalTerms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProposalTerms = z.infer<typeof insertProposalTermsSchema>;
export type ProposalTerms = typeof proposalTerms.$inferSelect;

// ============================
// Custom Forms System (standalone form builder — NOT marketing surveys)
// ============================

export const customForms = pgTable("custom_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"),
  shortCode: varchar("short_code", { length: 20 }).unique().notNull(),
  destination: text("destination").notNull(),
  destinationConfig: jsonb("destination_config").default({}),
  settings: jsonb("settings").default({}),
  styling: jsonb("styling").default({}),
  embedApiKey: varchar("embed_api_key", { length: 64 }).unique(),
  platformLabel: text("platform_label"),
  createdBy: uuid("created_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_custom_forms_status").on(table.status),
  index("idx_custom_forms_short_code").on(table.shortCode),
  index("idx_custom_forms_created_by").on(table.createdBy),
]);

export const customFormFields = pgTable("custom_form_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => customForms.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  label: text("label").notNull(),
  placeholder: text("placeholder"),
  required: boolean("required").default(false),
  options: text("options").array(),
  validation: jsonb("validation"),
  fieldMapping: text("field_mapping"),
  order: integer("order").notNull().default(0),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_custom_form_fields_form").on(table.formId),
  index("idx_custom_form_fields_order").on(table.formId, table.order),
]);

export const customFormSubmissions = pgTable("custom_form_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => customForms.id, { onDelete: "cascade" }),
  submitterName: text("submitter_name"),
  submitterEmail: text("submitter_email"),
  platform: text("platform"),
  answers: jsonb("answers").default({}),
  destinationId: varchar("destination_id"),
  destinationType: text("destination_type"),
  ipAddress: text("ip_address"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_custom_form_submissions_form").on(table.formId),
  index("idx_custom_form_submissions_dest").on(table.destinationId),
]);

export const insertCustomFormSchema = createInsertSchema(customForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CustomForm = typeof customForms.$inferSelect;
export type InsertCustomForm = z.infer<typeof insertCustomFormSchema>;

export const insertCustomFormFieldSchema = createInsertSchema(customFormFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CustomFormField = typeof customFormFields.$inferSelect;
export type InsertCustomFormField = z.infer<typeof insertCustomFormFieldSchema>;

export const insertCustomFormSubmissionSchema = createInsertSchema(customFormSubmissions).omit({
  id: true,
  createdAt: true,
});
export type CustomFormSubmission = typeof customFormSubmissions.$inferSelect;
export type InsertCustomFormSubmission = z.infer<typeof insertCustomFormSubmissionSchema>;

export const onboardingTemplates = pgTable("onboarding_templates", {
  id: serial("id").primaryKey(),
  teamId: varchar("team_id").references(() => departments.id).notNull(),
  positionName: text("position_name").notNull(),
  totalDays: integer("total_days").notNull().default(10),
  dayUnlockMode: text("day_unlock_mode").notNull().default("calendar"),
  createdBy: uuid("created_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const onboardingTemplateItems = pgTable("onboarding_template_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => onboardingTemplates.id, { onDelete: "cascade" }).notNull(),
  dayNumber: integer("day_number").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  title: text("title").notNull(),
  description: text("description"),
  itemType: text("item_type").notNull(),
  referenceId: text("reference_id"),
  resources: jsonb("resources").default([]),
  isRequired: boolean("is_required").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const onboardingInstances = pgTable("onboarding_instances", {
  id: serial("id").primaryKey(),
  staffId: uuid("staff_id").references(() => staff.id).notNull(),
  templateId: integer("template_id").references(() => onboardingTemplates.id),
  templateSnapshot: jsonb("template_snapshot").notNull(),
  status: text("status").notNull().default("active"),
  startDate: date("start_date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const onboardingInstanceItems = pgTable("onboarding_instance_items", {
  id: serial("id").primaryKey(),
  instanceId: integer("instance_id").references(() => onboardingInstances.id, { onDelete: "cascade" }).notNull(),
  templateItemId: integer("template_item_id"),
  dayNumber: integer("day_number").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  title: text("title").notNull(),
  description: text("description"),
  itemType: text("item_type").notNull(),
  referenceId: text("reference_id"),
  resources: jsonb("resources").default([]),
  isRequired: boolean("is_required").default(true),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  completedBy: uuid("completed_by").references(() => staff.id),
  autoCompleted: boolean("auto_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOnboardingTemplateSchema = createInsertSchema(onboardingTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type OnboardingTemplate = typeof onboardingTemplates.$inferSelect;
export type InsertOnboardingTemplate = z.infer<typeof insertOnboardingTemplateSchema>;

export const insertOnboardingTemplateItemSchema = createInsertSchema(onboardingTemplateItems).omit({ id: true, createdAt: true });
export type OnboardingTemplateItem = typeof onboardingTemplateItems.$inferSelect;
export type InsertOnboardingTemplateItem = z.infer<typeof insertOnboardingTemplateItemSchema>;

export const insertOnboardingInstanceSchema = createInsertSchema(onboardingInstances).omit({ id: true, createdAt: true });
export type OnboardingInstance = typeof onboardingInstances.$inferSelect;
export type InsertOnboardingInstance = z.infer<typeof insertOnboardingInstanceSchema>;

export const insertOnboardingInstanceItemSchema = createInsertSchema(onboardingInstanceItems).omit({ id: true, createdAt: true });
export type OnboardingInstanceItem = typeof onboardingInstanceItems.$inferSelect;
export type InsertOnboardingInstanceItem = z.infer<typeof insertOnboardingInstanceItemSchema>;

// ═══════════════════════════════════════
// HR System - IC Agreement Templates
// ═══════════════════════════════════════
// Supported placeholders for template content:
//   {{candidate_name}}    — applicant's full name
//   {{position}}          — position they are being hired for
//   {{start_date}}        — their start date
//   {{compensation}}      — pay rate or salary
//   {{compensation_type}} — e.g. "per hour", "per month", "flat project rate"
//   {{manager_name}}      — hiring manager's full name
//   {{company_name}}      — static: "The Media Optimizers"
//   {{offer_date}}        — date the offer was sent
//   {{custom_terms}}      — optional additional terms
export const icAgreementTemplates = pgTable("ic_agreement_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ═══════════════════════════════════════
// HR System - Job Offers
// ═══════════════════════════════════════
export const jobOffers = pgTable("job_offers", {
  id: serial("id").primaryKey(),
  applicationId: varchar("application_id").notNull().references(() => jobApplications.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").references(() => staff.id),
  templateId: integer("template_id").references(() => icAgreementTemplates.id),
  populatedContent: text("populated_content").notNull(),
  compensation: text("compensation").notNull(),
  compensationType: text("compensation_type").notNull(), // 'per_hour', 'per_month', 'flat_rate'
  startDate: date("start_date").notNull(),
  customTerms: text("custom_terms"),
  signingToken: text("signing_token").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'signed', 'declined'
  sentAt: timestamp("sent_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("job_offers_application_id_unique").on(table.applicationId),
  unique("job_offers_signing_token_unique").on(table.signingToken),
  index("job_offers_status_idx").on(table.status),
]);

// ═══════════════════════════════════════
// HR System - Offer Signatures
// ═══════════════════════════════════════
export const offerSignatures = pgTable("offer_signatures", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").notNull().references(() => jobOffers.id, { onDelete: "cascade" }),
  signatureType: text("signature_type").notNull(), // 'drawn' or 'typed'
  signatureData: text("signature_data").notNull(),
  signerName: text("signer_name").notNull(),
  signerEmail: text("signer_email").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  signedAt: timestamp("signed_at").notNull().defaultNow(),
}, (table) => [
  unique("offer_signatures_offer_id_unique").on(table.offerId),
]);

// ═══════════════════════════════════════
// HR System - Offer Status Log
// ═══════════════════════════════════════
export const offerStatusLog = pgTable("offer_status_log", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").notNull().references(() => jobOffers.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  changedBy: uuid("changed_by").references(() => staff.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("offer_status_log_offer_id_idx").on(table.offerId),
]);

export const insertIcAgreementTemplateSchema = createInsertSchema(icAgreementTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type IcAgreementTemplate = typeof icAgreementTemplates.$inferSelect;
export type InsertIcAgreementTemplate = z.infer<typeof insertIcAgreementTemplateSchema>;

export const insertJobOfferSchema = createInsertSchema(jobOffers).omit({ id: true, createdAt: true, sentAt: true });
export type JobOffer = typeof jobOffers.$inferSelect;
export type InsertJobOffer = z.infer<typeof insertJobOfferSchema>;

export const insertOfferSignatureSchema = createInsertSchema(offerSignatures).omit({ id: true, signedAt: true });
export type OfferSignature = typeof offerSignatures.$inferSelect;
export type InsertOfferSignature = z.infer<typeof insertOfferSignatureSchema>;

export const insertOfferStatusLogSchema = createInsertSchema(offerStatusLog).omit({ id: true, createdAt: true });
export type OfferStatusLog = typeof offerStatusLog.$inferSelect;
export type InsertOfferStatusLog = z.infer<typeof insertOfferStatusLogSchema>;

// =================== Sticky Notes ===================
// Personal sticky notes per user
export const stickyNotes = pgTable("sticky_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull().default(""),
  content: text("content").notNull().default(""),
  color: varchar("color", { length: 32 }).notNull().default("yellow"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStickyNoteSchema = createInsertSchema(stickyNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type StickyNote = typeof stickyNotes.$inferSelect;
export type InsertStickyNote = z.infer<typeof insertStickyNoteSchema>;

// ============================================================================
// Asset Library
// ----------------------------------------------------------------------------
// Single-tenant today, future-proofed for multi-tenancy. Every row carries
// `agencyId` (default 1 = Media Optimizers, LLC). When multi-tenancy lands,
// add an `agencies` table with id=1 as the first row, then add the FK
// constraint — no data migration required.
// ============================================================================

export const assetTypes = pgTable("asset_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: integer("agency_id").notNull().default(1),
  name: text("name").notNull(),
  tooltip: text("tooltip"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqAgencyName: unique().on(table.agencyId, table.name),
}));

export const assetStatuses = pgTable("asset_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: integer("agency_id").notNull().default(1),
  name: text("name").notNull(),
  color: varchar("color", { length: 16 }).notNull().default("#6B7280"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqAgencyName: unique().on(table.agencyId, table.name),
}));

export const clientAssets = pgTable("client_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: integer("agency_id").notNull().default(1),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  linkUrl: text("link_url"),
  description: text("description"),
  assetTypeId: varchar("asset_type_id").references(() => assetTypes.id, { onDelete: "set null" }),
  assetStatusId: varchar("asset_status_id").references(() => assetStatuses.id, { onDelete: "set null" }),
  ownerStaffId: uuid("owner_staff_id").references(() => staff.id, { onDelete: "set null" }),
  portalVisible: boolean("portal_visible").notNull().default(false),
  addedToMb: boolean("added_to_mb").notNull().default(false),
  addedToAiTools: boolean("added_to_ai_tools").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientAssetComments = pgTable("client_asset_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: integer("agency_id").notNull().default(1),
  assetId: varchar("asset_id").notNull().references(() => clientAssets.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  mentions: text("mentions").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientAssetCommentSchema = createInsertSchema(clientAssetComments).omit({
  id: true,
  createdAt: true,
});
export type ClientAssetComment = typeof clientAssetComments.$inferSelect;
export type InsertClientAssetComment = z.infer<typeof insertClientAssetCommentSchema>;

export const insertAssetTypeSchema = createInsertSchema(assetTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertAssetStatusSchema = createInsertSchema(assetStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertClientAssetSchema = createInsertSchema(clientAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AssetType = typeof assetTypes.$inferSelect;
export type InsertAssetType = z.infer<typeof insertAssetTypeSchema>;
export type AssetStatus = typeof assetStatuses.$inferSelect;
export type InsertAssetStatus = z.infer<typeof insertAssetStatusSchema>;
export type ClientAsset = typeof clientAssets.$inferSelect;
export type InsertClientAsset = z.infer<typeof insertClientAssetSchema>;

// ==========================================================================
// Gmail Two-Way Sync — per-user OAuth, in-process background sync, hybrid
// storage with logged_emails as source-of-truth + thin audit_logs row for
// the existing Communications tab. See docs/plans/gmail-sync.md.
// ==========================================================================

// Gmail Connections - per-user OAuth tokens (gmail.readonly scope)
export const gmailConnections = pgTable("gmail_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  accessToken: text("access_token").notNull(), // Encrypted (AES-256-GCM)
  refreshToken: text("refresh_token").notNull(), // Encrypted
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope").notNull(),
  syncEnabled: boolean("sync_enabled").default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_gmail_connections_user_id").on(table.userId),
  unique("unique_user_gmail").on(table.userId, table.email),
]);

// Gmail Sync State - history_id + per-run stats for incremental sync
export const gmailSyncState = pgTable("gmail_sync_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull().references(() => gmailConnections.id, { onDelete: "cascade" }),
  historyId: text("history_id"), // Last seen Gmail historyId for delta sync
  initialSyncCompleted: boolean("initial_sync_completed").default(false),
  lastSyncStarted: timestamp("last_sync_started"),
  lastSyncCompleted: timestamp("last_sync_completed"),
  lastSyncStatus: text("last_sync_status"), // success, failed, in_progress
  lastSyncError: text("last_sync_error"),
  emailsScanned: integer("emails_scanned").default(0),
  emailsLogged: integer("emails_logged").default(0),
  // Live progress for the in-flight run. Reset to 0 when a run starts and
  // overwritten per page during the run; retains the final values of the
  // most recent run when idle. Used by the UI to show "Currently syncing —
  // X scanned, Y logged" without waiting for the whole cycle to complete.
  currentRunScanned: integer("current_run_scanned").default(0),
  currentRunLogged: integer("current_run_logged").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_gmail_sync_state_connection_id").on(table.connectionId),
  unique("unique_gmail_sync_state_connection").on(table.connectionId),
]);

// Logged Emails - source-of-truth row for each (message, matched-client) pair
// One Gmail message can match multiple clients => one row per match (clientId).
export const loggedEmails = pgTable("logged_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull().references(() => gmailConnections.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => staff.id, { onDelete: "cascade" }), // Owner of the mailbox
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }), // Matched client
  contactId: varchar("contact_id"), // Optional matched contact id (clients table uses this name in newValues)
  // Gmail identifiers
  gmailMessageId: text("gmail_message_id").notNull(),
  gmailThreadId: text("gmail_thread_id").notNull(),
  // Headers
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  toEmails: text("to_emails").array(), // List of recipient emails
  ccEmails: text("cc_emails").array(),
  bccEmails: text("bcc_emails").array(),
  subject: text("subject"),
  snippet: text("snippet"), // Gmail snippet
  bodyText: text("body_text"), // Plain text body (stripped)
  bodyHtml: text("body_html"), // Full HTML body (sanitised on render)
  // Metadata
  direction: text("direction").notNull(), // 'inbound' | 'outbound'
  labels: text("labels").array(), // Gmail labels (INBOX, SENT, IMPORTANT, etc.)
  hasAttachments: boolean("has_attachments").default(false),
  matchedDomain: text("matched_domain"), // Which contact domain matched
  matchedEmail: text("matched_email"), // Which contact email matched
  receivedAt: timestamp("received_at").notNull(), // When Gmail received it
  syncedAt: timestamp("synced_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_logged_emails_client_id").on(table.clientId),
  index("idx_logged_emails_user_id").on(table.userId),
  index("idx_logged_emails_thread_id").on(table.gmailThreadId),
  index("idx_logged_emails_received_at").on(table.receivedAt),
  unique("unique_message_per_client").on(table.gmailMessageId, table.clientId),
]);

// Logged Email Attachments - metadata only (filename, mime, size, attachmentId)
// Body of the attachment is fetched on-demand via Gmail API.
export const loggedEmailAttachments = pgTable("logged_email_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loggedEmailId: varchar("logged_email_id").notNull().references(() => loggedEmails.id, { onDelete: "cascade" }),
  gmailAttachmentId: text("gmail_attachment_id").notNull(), // Gmail's attachment id, used to fetch on demand
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  partId: text("part_id"), // Gmail message part id
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_logged_email_attachments_email_id").on(table.loggedEmailId),
]);

// Email Logging Settings - singleton row controlling system-wide sync defaults
export const emailLoggingSettings = pgTable("email_logging_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enabled: boolean("enabled").notNull().default(true),
  initialLookbackDays: integer("initial_lookback_days").notNull().default(90),
  syncIntervalSeconds: integer("sync_interval_seconds").notNull().default(120),
  excludePromotions: boolean("exclude_promotions").notNull().default(true),
  excludeSocial: boolean("exclude_social").notNull().default(true),
  excludeUpdates: boolean("exclude_updates").notNull().default(true),
  excludeSpam: boolean("exclude_spam").notNull().default(true),
  excludeTrash: boolean("exclude_trash").notNull().default(true),
  storeBodyHtml: boolean("store_body_html").notNull().default(true),
  storeBodyText: boolean("store_body_text").notNull().default(true),
  attachmentsMetadataOnly: boolean("attachments_metadata_only").notNull().default(true),
  updatedBy: uuid("updated_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Logging Domain Rules - per-domain inclusion/exclusion overrides
// type='exclude' => never log emails to/from this domain
// type='include' => always log even if exclusion rules would skip
export const emailLoggingDomainRules = pgTable("email_logging_domain_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domain: text("domain").notNull(), // e.g. "noreply.example.com"
  ruleType: text("rule_type").notNull(), // 'exclude' | 'include'
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_logging_domain_rules_domain").on(table.domain),
  unique("unique_email_logging_domain").on(table.domain),
]);

// Email Logging Exclusions - per-email-address exclusions
export const emailLoggingExclusions = pgTable("email_logging_exclusions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => staff.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_logging_exclusions_email").on(table.email),
  unique("unique_email_logging_exclusion").on(table.email),
]);

// Insert schemas
export const insertGmailConnectionSchema = createInsertSchema(gmailConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertGmailSyncStateSchema = createInsertSchema(gmailSyncState).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertLoggedEmailSchema = createInsertSchema(loggedEmails).omit({
  id: true,
  createdAt: true,
  syncedAt: true,
});
export const insertLoggedEmailAttachmentSchema = createInsertSchema(loggedEmailAttachments).omit({
  id: true,
  createdAt: true,
});
export const insertEmailLoggingSettingsSchema = createInsertSchema(emailLoggingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertEmailLoggingDomainRuleSchema = createInsertSchema(emailLoggingDomainRules).omit({
  id: true,
  createdAt: true,
});
export const insertEmailLoggingExclusionSchema = createInsertSchema(emailLoggingExclusions).omit({
  id: true,
  createdAt: true,
});

export type GmailConnection = typeof gmailConnections.$inferSelect;
export type InsertGmailConnection = z.infer<typeof insertGmailConnectionSchema>;
export type GmailSyncStateRow = typeof gmailSyncState.$inferSelect;
export type InsertGmailSyncState = z.infer<typeof insertGmailSyncStateSchema>;
export type LoggedEmail = typeof loggedEmails.$inferSelect;
export type InsertLoggedEmail = z.infer<typeof insertLoggedEmailSchema>;
export type LoggedEmailAttachment = typeof loggedEmailAttachments.$inferSelect;
export type InsertLoggedEmailAttachment = z.infer<typeof insertLoggedEmailAttachmentSchema>;
export type EmailLoggingSettings = typeof emailLoggingSettings.$inferSelect;
export type InsertEmailLoggingSettings = z.infer<typeof insertEmailLoggingSettingsSchema>;
export type EmailLoggingDomainRule = typeof emailLoggingDomainRules.$inferSelect;
export type InsertEmailLoggingDomainRule = z.infer<typeof insertEmailLoggingDomainRuleSchema>;
export type EmailLoggingExclusion = typeof emailLoggingExclusions.$inferSelect;
export type InsertEmailLoggingExclusion = z.infer<typeof insertEmailLoggingExclusionSchema>;
