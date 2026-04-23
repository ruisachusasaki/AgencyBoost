import { pgTable, index, varchar, serial, text, uuid, timestamp, boolean, jsonb, integer, numeric, unique, foreignKey, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const tickets = pgTable("tickets", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	ticketNumber: serial("ticket_number").notNull(),
	title: text().notNull(),
	description: text(),
	type: text().default('bug').notNull(),
	priority: text().default('medium').notNull(),
	status: text().default('open').notNull(),
	submittedBy: uuid("submitted_by").notNull(),
	assignedTo: uuid("assigned_to"),
	tags: text().array(),
	firstResponseAt: timestamp("first_response_at", { mode: 'string' }),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	closedAt: timestamp("closed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	loomVideoUrl: text("loom_video_url"),
	screenshots: text().array(),
}, (table) => [
	index("idx_tickets_assigned_to").using("btree", table.assignedTo.asc().nullsLast().op("uuid_ops")),
	index("idx_tickets_priority").using("btree", table.priority.asc().nullsLast().op("text_ops")),
	index("idx_tickets_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_tickets_submitted_by").using("btree", table.submittedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_tickets_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

export const aiAssistantSettings = pgTable("ai_assistant_settings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	customInstructions: text("custom_instructions"),
	isEnabled: boolean("is_enabled").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const aiIntegrations = pgTable("ai_integrations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	provider: text().notNull(),
	name: text().default('OpenAI').notNull(),
	apiKey: text("api_key").notNull(),
	model: text().default('gpt-4o'),
	isActive: boolean("is_active").default(true),
	lastTestAt: timestamp("last_test_at", { mode: 'string' }),
	connectionErrors: text("connection_errors"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const automationActions = pgTable("automation_actions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	description: text(),
	category: text().notNull(),
	configSchema: jsonb("config_schema"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const automationTriggers = pgTable("automation_triggers", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	description: text(),
	category: text().notNull(),
	configSchema: jsonb("config_schema"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const businessProfile = pgTable("business_profile", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	companyName: text("company_name").notNull(),
	businessType: text("business_type"),
	website: text(),
	phone: text(),
	email: text(),
	timezone: text().default('America/New_York'),
	logo: text(),
	address: text(),
	city: text(),
	state: text(),
	zipCode: text("zip_code"),
	country: text().default('United States'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const ticketRoutingRules = pgTable("ticket_routing_rules", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	priority: integer().default(0),
	conditions: text().default('{}').notNull(),
	assignToUserId: uuid("assign_to_user_id"),
	assignToTeam: text("assign_to_team"),
	autoSetPriority: text("auto_set_priority"),
	autoAddTags: text("auto_add_tags").array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const salaryHistory = pgTable("salary_history", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	staffId: uuid("staff_id").notNull(),
	previousSalary: numeric("previous_salary", { precision: 12, scale:  2 }),
	newSalary: numeric("new_salary", { precision: 12, scale:  2 }),
	effectiveDate: timestamp("effective_date", { mode: 'string' }).defaultNow(),
	notes: text(),
	changedBy: uuid("changed_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_salary_history_staff").using("btree", table.staffId.asc().nullsLast().op("uuid_ops")),
]);

export const callCenterTimeEntries = pgTable("call_center_time_entries", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	clientId: varchar("client_id").notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }),
	duration: integer(),
	isRunning: boolean("is_running").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_call_center_time_entries_client").using("btree", table.clientId.asc().nullsLast().op("text_ops")),
	index("idx_call_center_time_entries_date").using("btree", table.startTime.asc().nullsLast().op("timestamp_ops")),
	index("idx_call_center_time_entries_running").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.isRunning.asc().nullsLast().op("uuid_ops")),
	index("idx_call_center_time_entries_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const applicationStageHistory = pgTable("application_stage_history", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	applicationId: varchar("application_id").notNull(),
	fromStage: text("from_stage"),
	toStage: text("to_stage").notNull(),
	changedBy: uuid("changed_by").notNull(),
	notes: text(),
	changedAt: timestamp("changed_at", { mode: 'string' }).defaultNow(),
});

export const timeOffBalances = pgTable("time_off_balances", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	staffId: uuid("staff_id").notNull(),
	year: integer().notNull(),
	vacationDays: integer("vacation_days").default(20),
	sickDays: integer("sick_days").default(10),
	personalDays: integer("personal_days").default(5),
	vacationUsed: integer("vacation_used").default(0),
	sickUsed: integer("sick_used").default(0),
	personalUsed: integer("personal_used").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const dashboardWidgets = pgTable("dashboard_widgets", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	type: text().notNull(),
	name: text().notNull(),
	description: text(),
	category: text().notNull(),
	icon: text().default('LayoutDashboard').notNull(),
	defaultWidth: integer("default_width").default(2).notNull(),
	defaultHeight: integer("default_height").default(2).notNull(),
	minWidth: integer("min_width").default(1).notNull(),
	minHeight: integer("min_height").default(1).notNull(),
	maxWidth: integer("max_width").default(4).notNull(),
	maxHeight: integer("max_height").default(4).notNull(),
	defaultSettings: jsonb("default_settings").default({}),
	refreshInterval: integer("refresh_interval").default(300),
	requiresAuth: boolean("requires_auth").default(true),
	allowedRoles: text("allowed_roles").array(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("dashboard_widgets_type_unique").on(table.type),
]);

export const emailIntegrations = pgTable("email_integrations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	provider: text().notNull(),
	name: text().default('Primary').notNull(),
	apiKey: text("api_key").notNull(),
	domain: text().notNull(),
	fromName: text("from_name").notNull(),
	fromEmail: text("from_email").notNull(),
	isActive: boolean("is_active").default(true),
	lastTestAt: timestamp("last_test_at", { mode: 'string' }),
	connectionErrors: text("connection_errors"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const jobApplications = pgTable("job_applications", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	applicantName: text("applicant_name").notNull(),
	applicantEmail: text("applicant_email").notNull(),
	applicantPhone: text("applicant_phone"),
	positionTitle: varchar("position_title").notNull(),
	positionId: varchar("position_id"),
	departmentId: varchar("department_id"),
	resumeUrl: text("resume_url"),
	coverLetter: text("cover_letter"),
	applicationStatus: varchar("application_status").default('applied').notNull(),
	appliedAt: timestamp("applied_at", { mode: 'string' }).defaultNow(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	coverLetterUrl: text("cover_letter_url"),
	portfolioUrl: text("portfolio_url"),
	stage: text().default('new').notNull(),
	assignedRecruiter: uuid("assigned_recruiter"),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	scheduledInterviewDate: timestamp("scheduled_interview_date", { mode: 'string' }),
	salaryExpectation: numeric("salary_expectation", { precision: 10, scale:  2 }),
	experience: text(),
	source: text(),
	customFieldData: jsonb("custom_field_data"),
	rating: integer().default(0),
});

export const packageItems = pgTable("package_items", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	packageId: varchar("package_id").notNull(),
	productId: varchar("product_id"),
	bundleId: varchar("bundle_id"),
	itemType: text("item_type").notNull(),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const productPackages = pgTable("product_packages", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	buildFee: numeric("build_fee", { precision: 10, scale:  2 }),
	monthlyRetailPrice: numeric("monthly_retail_price", { precision: 10, scale:  2 }),
});

export const clientPackages = pgTable("client_packages", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	packageId: varchar("package_id").notNull(),
	price: numeric({ precision: 10, scale:  2 }),
	status: text().default('active'),
	customQuantities: jsonb("custom_quantities"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const quoteItems = pgTable("quote_items", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	quoteId: varchar("quote_id").notNull(),
	productId: varchar("product_id"),
	bundleId: varchar("bundle_id"),
	itemType: text("item_type").notNull(),
	quantity: integer().default(1).notNull(),
	unitCost: numeric("unit_cost", { precision: 10, scale:  2 }).notNull(),
	totalCost: numeric("total_cost", { precision: 10, scale:  2 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	customQuantities: jsonb("custom_quantities"),
	packageId: varchar("package_id"),
});

export const clientRecurringConfig = pgTable("client_recurring_config", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	cycleStartDate: timestamp("cycle_start_date", { mode: 'string' }),
	cycleLengthDays: integer("cycle_length_days").default(30).notNull(),
	advanceGenerationDays: integer("advance_generation_days").default(3).notNull(),
	status: varchar().default('active').notNull(),
	lastGeneratedCycle: integer("last_generated_cycle").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_client_recurring_config_client_id").using("btree", table.clientId.asc().nullsLast().op("text_ops")),
	index("idx_client_recurring_config_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("client_recurring_config_client_id_unique").on(table.clientId),
]);

export const projects = pgTable("projects", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	clientId: varchar("client_id").notNull(),
	status: text().default('planning').notNull(),
	priority: text().default('medium').notNull(),
	budget: numeric({ precision: 10, scale:  2 }),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	progress: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const clientTaskGenerations = pgTable("client_task_generations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	productId: varchar("product_id"),
	bundleId: varchar("bundle_id"),
	packageId: varchar("package_id"),
	templateId: varchar("template_id").notNull(),
	generationType: varchar("generation_type").notNull(),
	cycleNumber: integer("cycle_number"),
	cycleStartDate: timestamp("cycle_start_date", { mode: 'string' }),
	cycleEndDate: timestamp("cycle_end_date", { mode: 'string' }),
	generatedAt: timestamp("generated_at", { mode: 'string' }).defaultNow(),
	taskIds: jsonb("task_ids").default([]),
}, (table) => [
	index("idx_client_task_generations_client_id").using("btree", table.clientId.asc().nullsLast().op("text_ops")),
	index("idx_client_task_generations_cycle_number").using("btree", table.cycleNumber.asc().nullsLast().op("int4_ops")),
	index("idx_client_task_generations_type_cycle").using("btree", table.clientId.asc().nullsLast().op("int4_ops"), table.generationType.asc().nullsLast().op("int4_ops"), table.cycleNumber.asc().nullsLast().op("int4_ops")),
]);

export const productTaskTemplates = pgTable("product_task_templates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	productId: varchar("product_id"),
	bundleId: varchar("bundle_id"),
	packageId: varchar("package_id"),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	taskType: varchar("task_type").notNull(),
	quantityMode: varchar("quantity_mode").default('once').notNull(),
	departmentId: varchar("department_id"),
	assignedStaffId: uuid("assigned_staff_id"),
	dueDateOffset: integer("due_date_offset").default(7).notNull(),
	estimatedHours: numeric("estimated_hours", { precision: 6, scale:  2 }),
	priority: varchar().default('medium'),
	sortOrder: integer("sort_order").default(0).notNull(),
	dependsOnTemplateId: varchar("depends_on_template_id"),
	status: varchar().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	categoryId: varchar("category_id"),
	workflowId: varchar("workflow_id"),
}, (table) => [
	index("idx_product_task_templates_bundle_id").using("btree", table.bundleId.asc().nullsLast().op("text_ops")),
	index("idx_product_task_templates_package_id").using("btree", table.packageId.asc().nullsLast().op("text_ops")),
	index("idx_product_task_templates_product_id").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	index("idx_product_task_templates_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_product_task_templates_task_type").using("btree", table.taskType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [taskCategories.id],
			name: "product_task_templates_category_id_fkey"
		}),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [teamWorkflows.id],
			name: "product_task_templates_workflow_id_fkey"
		}),
]);

export const knowledgeBasePermissions = pgTable("knowledge_base_permissions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	resourceType: text("resource_type").notNull(),
	resourceId: varchar("resource_id").notNull(),
	accessType: text("access_type").notNull(),
	accessId: text("access_id").notNull(),
	permission: text().default('read').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const leadNoteTemplates = pgTable("lead_note_templates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	content: text().notNull(),
	isActive: boolean("is_active").default(true),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const leadSources = pgTable("lead_sources", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	isActive: boolean("is_active").default(true),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("lead_sources_name_unique").on(table.name),
]);

export const newHireOnboardingSubmissions = pgTable("new_hire_onboarding_submissions", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	address: text(),
	phoneNumber: text("phone_number"),
	dateOfBirth: date("date_of_birth"),
	startDate: date("start_date"),
	emergencyContactName: text("emergency_contact_name"),
	emergencyContactNumber: text("emergency_contact_number"),
	emergencyContactRelationship: text("emergency_contact_relationship"),
	tshirtSize: text("tshirt_size"),
	paymentPlatform: text("payment_platform"),
	paymentEmail: text("payment_email"),
	customFieldData: jsonb("custom_field_data"),
	status: text().default('pending').notNull(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow(),
	reviewedBy: varchar("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	notes: text(),
});

export const newHireOnboardingFormConfig = pgTable("new_hire_onboarding_form_config", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	fields: jsonb().notNull(),
	updatedBy: varchar("updated_by").notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const notifications = pgTable("notifications", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	entityType: text("entity_type"),
	entityId: text("entity_id"),
	priority: text().default('normal'),
	isRead: boolean("is_read").default(false),
	readAt: timestamp("read_at", { mode: 'string' }),
	actionUrl: text("action_url"),
	actionText: text("action_text"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const offboardingFormConfig = pgTable("offboarding_form_config", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	fields: jsonb().notNull(),
	updatedBy: uuid("updated_by").notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const offboardingSubmissions = pgTable("offboarding_submissions", {
	id: serial().primaryKey().notNull(),
	fullName: text("full_name").notNull(),
	departmentTeam: text("department_team"),
	position: text(),
	employmentEndDate: date("employment_end_date"),
	accountSuspensionDate: date("account_suspension_date"),
	payOffRamp: text("pay_off_ramp"),
	status: text().default('pending').notNull(),
	submittedById: uuid("submitted_by_id"),
	completedBy: uuid("completed_by"),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow(),
	customFieldData: jsonb("custom_field_data"),
});

export const oneOnOneProgressionStatuses = pgTable("one_on_one_progression_statuses", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	value: varchar({ length: 100 }).notNull(),
	label: varchar({ length: 100 }).notNull(),
	color: varchar({ length: 100 }).notNull(),
	orderIndex: integer("order_index").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("one_on_one_progression_statuses_value_unique").on(table.value),
]);

export const scheduledEmails = pgTable("scheduled_emails", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	fromUserId: varchar("from_user_id").notNull(),
	toEmail: varchar("to_email").notNull(),
	ccEmails: varchar("cc_emails").array(),
	bccEmails: varchar("bcc_emails").array(),
	subject: text().notNull(),
	content: text().notNull(),
	plainTextContent: text("plain_text_content"),
	templateId: varchar("template_id"),
	scheduledFor: timestamp("scheduled_for", { withTimezone: true, mode: 'string' }).notNull(),
	timezone: varchar().default('UTC'),
	status: varchar().default('pending').notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	failureReason: text("failure_reason"),
	retryCount: integer("retry_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
});

export const slackWorkspaces = pgTable("slack_workspaces", {
	id: varchar().default((gen_random_uuid())).primaryKey().notNull(),
	name: text().notNull(),
	teamId: text("team_id"),
	teamName: text("team_name"),
	botToken: text("bot_token").notNull(),
	botUserId: text("bot_user_id"),
	signingSecret: text("signing_secret"),
	isActive: boolean("is_active").default(true),
	isDefault: boolean("is_default").default(false),
	lastTestAt: timestamp("last_test_at", { mode: 'string' }),
	connectionErrors: text("connection_errors"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const smsIntegrations = pgTable("sms_integrations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	provider: text().notNull(),
	accountSid: text("account_sid").notNull(),
	authToken: text("auth_token").notNull(),
	phoneNumber: text("phone_number").notNull(),
	isActive: boolean("is_active").default(true),
	lastTestAt: timestamp("last_test_at", { mode: 'string' }),
	connectionErrors: text("connection_errors"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	name: text().default('Primary'),
});

export const tags = pgTable("tags", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	color: text().default('#46a1a0'),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("tags_name_unique").on(table.name),
]);

export const taskPriorities = pgTable("task_priorities", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	value: text().notNull(),
	color: text().default('#6b7280').notNull(),
	icon: text().default('flag'),
	description: text(),
	sortOrder: integer("sort_order").default(0),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	isSystemPriority: boolean("is_system_priority").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("task_priorities_name_unique").on(table.name),
	unique("task_priorities_value_unique").on(table.value),
]);

export const taskSettings = pgTable("task_settings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	settingKey: text("setting_key").notNull(),
	settingValue: jsonb("setting_value").notNull(),
	description: text(),
	updatedBy: uuid("updated_by"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("task_settings_setting_key_unique").on(table.settingKey),
]);

export const teamPositions = pgTable("team_positions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	key: text().notNull(),
	label: text().notNull(),
	description: text(),
	order: integer().default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	inOrgChart: boolean("in_org_chart").default(false),
	parentPositionId: varchar("parent_position_id"),
	orgChartOrder: integer("org_chart_order").default(0),
}, (table) => [
	unique("team_positions_key_unique").on(table.key),
]);

export const clients = pgTable("clients", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	phone: text(),
	company: text(),
	position: text(),
	status: text().default('active').notNull(),
	contactType: text("contact_type").default('client'),
	contactSource: text("contact_source"),
	address: text(),
	address2: text(),
	city: text(),
	state: text(),
	zipCode: text("zip_code"),
	website: text(),
	notes: text(),
	tags: text().array(),
	clientVertical: text("client_vertical"),
	contactOwner: uuid("contact_owner"),
	profileImage: text("profile_image"),
	mrr: numeric({ precision: 10, scale:  2 }),
	invoicingContact: text("invoicing_contact"),
	invoicingEmail: text("invoicing_email"),
	paymentTerms: text("payment_terms"),
	upsideBonus: numeric("upside_bonus", { precision: 5, scale:  2 }),
	clientBrief: text("client_brief"),
	growthOsDashboard: text("growth_os_dashboard"),
	storyBrand: text("story_brand"),
	styleGuide: text("style_guide"),
	googleDriveFolder: text("google_drive_folder"),
	testingLog: text("testing_log"),
	cornerstoneBlueprint: text("cornerstone_blueprint"),
	customGpt: text("custom_gpt"),
	dndAll: boolean("dnd_all").default(false),
	dndEmail: boolean("dnd_email").default(false),
	dndSms: boolean("dnd_sms").default(false),
	dndCalls: boolean("dnd_calls").default(false),
	groupId: varchar("group_id"),
	customFieldValues: jsonb("custom_field_values"),
	followers: varchar().array(),
	lastActivity: timestamp("last_activity", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	briefBackground: text("brief_background"),
	briefObjectives: text("brief_objectives"),
	briefBrandInfo: text("brief_brand_info"),
	briefAudienceInfo: text("brief_audience_info"),
	briefProductsServices: text("brief_products_services"),
	briefCompetitors: text("brief_competitors"),
	briefMarketingTech: text("brief_marketing_tech"),
	briefMiscellaneous: text("brief_miscellaneous"),
	isArchived: boolean("is_archived").default(false),
	roadmap: text(),
}, (table) => [
	foreignKey({
			columns: [table.contactOwner],
			foreignColumns: [staff.id],
			name: "clients_contact_owner_staff_id_fk"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [clientGroups.id],
			name: "clients_group_id_client_groups_id_fk"
		}),
	unique("clients_email_unique").on(table.email),
]);

export const activities = pgTable("activities", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	type: text().notNull(),
	description: text().notNull(),
	details: jsonb(),
	clientId: varchar("client_id").notNull(),
	userId: varchar("user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "activities_client_id_clients_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text().notNull(),
	phone: text(),
	extension: text(),
	role: text().default('User').notNull(),
	status: text().default('active').notNull(),
	profileImage: text("profile_image"),
	signature: text(),
	signatureEnabled: boolean("signature_enabled").default(false),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const calendarAppointments = pgTable("calendar_appointments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	calendarId: varchar("calendar_id").notNull(),
	clientId: varchar("client_id"),
	assignedTo: uuid("assigned_to").notNull(),
	title: text().notNull(),
	description: text(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	status: text().default('confirmed').notNull(),
	location: text(),
	locationDetails: text("location_details"),
	meetingLink: text("meeting_link"),
	timezone: text().notNull(),
	bookerName: text("booker_name"),
	bookerEmail: text("booker_email").notNull(),
	bookerPhone: text("booker_phone"),
	customFieldData: jsonb("custom_field_data"),
	externalEventId: text("external_event_id"),
	bookingSource: text("booking_source").default('public').notNull(),
	bookingIp: text("booking_ip"),
	bookingUserAgent: text("booking_user_agent"),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	cancelledBy: uuid("cancelled_by"),
	cancellationReason: text("cancellation_reason"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	googleEventId: text("google_event_id"),
	googleCalendarId: text("google_calendar_id"),
	syncedToGoogle: boolean("synced_to_google").default(false),
	timeEntryCreated: boolean("time_entry_created").default(false),
}, (table) => [
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [staff.id],
			name: "calendar_appointments_assigned_to_staff_id_fk"
		}),
	foreignKey({
			columns: [table.calendarId],
			foreignColumns: [calendars.id],
			name: "calendar_appointments_calendar_id_calendars_id_fk"
		}),
	foreignKey({
			columns: [table.cancelledBy],
			foreignColumns: [staff.id],
			name: "calendar_appointments_cancelled_by_staff_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "calendar_appointments_client_id_clients_id_fk"
		}),
]);

export const appointmentReminders = pgTable("appointment_reminders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	appointmentId: varchar("appointment_id").notNull(),
	type: text().notNull(),
	sendAt: timestamp("send_at", { mode: 'string' }).notNull(),
	message: text(),
	status: text().default('pending').notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const appointments = pgTable("appointments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	clientId: varchar("client_id").notNull(),
	scheduledBy: varchar("scheduled_by").notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	status: text().default('confirmed'),
	meetingLink: text("meeting_link"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "appointments_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.scheduledBy],
			foreignColumns: [users.id],
			name: "appointments_scheduled_by_users_id_fk"
		}),
]);

export const staff = pgTable("staff", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	profileImagePath: text("profile_image_path"),
	address: text(),
	city: varchar({ length: 100 }),
	state: varchar({ length: 50 }),
	zip: varchar({ length: 20 }),
	country: varchar({ length: 100 }),
	hireDate: date("hire_date"),
	department: varchar({ length: 100 }),
	managerId: uuid("manager_id"),
	birthdate: date(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	roleId: varchar("role_id"),
	position: varchar({ length: 100 }),
	assignedCalendarId: varchar("assigned_calendar_id"),
	vacationDaysAnnually: integer("vacation_days_annually").default(15),
	sickDaysAnnually: integer("sick_days_annually").default(10),
	personalDaysAnnually: integer("personal_days_annually").default(3),
	emergencyContactName: varchar("emergency_contact_name", { length: 200 }),
	emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
	emergencyContactRelationship: varchar("emergency_contact_relationship", { length: 100 }),
	shirtSize: varchar("shirt_size", { length: 10 }),
	replitAuthSub: varchar("replit_auth_sub", { length: 255 }),
	timeOffPolicyId: varchar("time_off_policy_id"),
	fathomApiKey: text("fathom_api_key"),
	annualSalary: numeric("annual_salary", { precision: 12, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "staff_role_id_roles_id_fk"
		}),
	unique("staff_email_unique").on(table.email),
	unique("staff_replit_auth_sub_unique").on(table.replitAuthSub),
]);

export const auditLogs = pgTable("audit_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	action: text().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: varchar("entity_id").notNull(),
	entityName: text("entity_name").notNull(),
	userId: uuid("user_id").notNull(),
	details: text().notNull(),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [staff.id],
			name: "audit_logs_user_id_staff_id_fk"
		}),
]);

export const authUsers = pgTable("auth_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	isActive: boolean("is_active").default(true),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	passwordResetToken: text("password_reset_token"),
	passwordResetExpires: timestamp("password_reset_expires", { mode: 'string' }),
}, (table) => [
	unique("auth_users_user_id_unique").on(table.userId),
	unique("auth_users_email_unique").on(table.email),
]);

export const bundleProducts = pgTable("bundle_products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	bundleId: varchar("bundle_id").notNull(),
	productId: varchar("product_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	quantity: integer().default(1).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bundleId],
			foreignColumns: [productBundles.id],
			name: "bundle_products_bundle_id_product_bundles_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "bundle_products_product_id_products_id_fk"
		}),
]);

export const products = pgTable("products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	cost: numeric({ precision: 10, scale:  2 }),
	categoryId: varchar("category_id"),
	status: text().default('active').notNull(),
	usageCount: integer("usage_count").default(0),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	price: numeric({ precision: 10, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [productCategories.id],
			name: "products_category_id_product_categories_id_fk"
		}),
]);

export const calendars = pgTable("calendars", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	type: text().notNull(),
	customUrl: text("custom_url").notNull(),
	duration: integer().notNull(),
	durationUnit: text("duration_unit").default('minutes').notNull(),
	location: text(),
	locationDetails: text("location_details"),
	bufferTime: integer("buffer_time").default(15),
	scheduleWindowStart: integer("schedule_window_start").default(24),
	scheduleWindowEnd: integer("schedule_window_end").default(1440),
	isActive: boolean("is_active").default(true),
	customFieldIds: text("custom_field_ids").array(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "calendars_created_by_staff_id_fk"
		}),
	unique("calendars_custom_url_unique").on(table.customUrl),
]);

export const calendarAvailability = pgTable("calendar_availability", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	calendarId: varchar("calendar_id").notNull(),
	staffId: uuid("staff_id").notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	startTime: text("start_time").notNull(),
	endTime: text("end_time").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.calendarId],
			foreignColumns: [calendars.id],
			name: "calendar_availability_calendar_id_calendars_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [staff.id],
			name: "calendar_availability_staff_id_staff_id_fk"
		}).onDelete("cascade"),
]);

export const calendarConnections = pgTable("calendar_connections", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	calendarId: text("calendar_id").default('primary').notNull(),
	calendarName: text("calendar_name"),
	email: text().notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	scope: text().notNull(),
	syncEnabled: boolean("sync_enabled").default(true),
	twoWaySync: boolean("two_way_sync").default(true),
	createContacts: boolean("create_contacts").default(false),
	triggerWorkflows: boolean("trigger_workflows").default(false),
	lastSyncedAt: timestamp("last_synced_at", { mode: 'string' }),
	syncToken: text("sync_token"),
	webhookChannelId: text("webhook_channel_id"),
	webhookExpiration: timestamp("webhook_expiration", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	blockAsAppointments: boolean("block_as_appointments").default(false),
	pageToken: text("page_token"),
	webhookResourceId: text("webhook_resource_id"),
}, (table) => [
	index("idx_calendar_connections_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	unique("unique_user_calendar").on(table.userId, table.calendarId),
]);

export const calendarDateOverrides = pgTable("calendar_date_overrides", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	calendarId: varchar("calendar_id").notNull(),
	staffId: uuid("staff_id").notNull(),
	date: date().notNull(),
	type: text().notNull(),
	startTime: text("start_time"),
	endTime: text("end_time"),
	reason: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.calendarId],
			foreignColumns: [calendars.id],
			name: "calendar_date_overrides_calendar_id_calendars_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [staff.id],
			name: "calendar_date_overrides_staff_id_staff_id_fk"
		}).onDelete("cascade"),
]);

export const calendarEventCache = pgTable("calendar_event_cache", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	date: date().notNull(),
	busySlots: jsonb("busy_slots").notNull(),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow().notNull(),
	etag: text(),
}, (table) => [
	index("idx_event_cache_user_date").using("btree", table.userId.asc().nullsLast().op("date_ops"), table.date.asc().nullsLast().op("date_ops")),
]);

export const clientAppointments = pgTable("client_appointments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	title: text().notNull(),
	description: text(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	location: text(),
	status: text().default('confirmed').notNull(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_appointments_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "client_appointments_created_by_staff_id_fk"
		}),
]);

export const calendarEvents = pgTable("calendar_events", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	connectionId: varchar("connection_id").notNull(),
	googleEventId: text("google_event_id").notNull(),
	appointmentId: varchar("appointment_id"),
	summary: text(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	allDay: boolean("all_day").default(false),
	status: text(),
	transparency: text(),
	attendees: jsonb(),
	syncedAt: timestamp("synced_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	organizerEmail: text("organizer_email"),
	etag: text(),
	lastModified: timestamp("last_modified", { mode: 'string' }),
	isRecurring: boolean("is_recurring").default(false),
	createdInAgencyFlow: boolean("created_in_agency_flow").default(false),
	description: text(),
	location: text(),
	googleHangoutLink: text("google_hangout_link"),
	googleHtmlLink: text("google_html_link"),
	organizer: jsonb(),
	clientId: varchar("client_id"),
	appointmentStatus: text("appointment_status").default('confirmed'),
	timeEntryCreated: boolean("time_entry_created").default(false),
}, (table) => [
	index("idx_calendar_events_appointment_id").using("btree", table.appointmentId.asc().nullsLast().op("text_ops")),
	index("idx_calendar_events_client_id").using("btree", table.clientId.asc().nullsLast().op("text_ops")),
	index("idx_calendar_events_connection_id").using("btree", table.connectionId.asc().nullsLast().op("text_ops")),
	index("idx_calendar_events_google_event_id").using("btree", table.googleEventId.asc().nullsLast().op("text_ops")),
	index("idx_calendar_events_time_range").using("btree", table.startTime.asc().nullsLast().op("timestamp_ops"), table.endTime.asc().nullsLast().op("timestamp_ops")),
	unique("unique_connection_google_event").on(table.connectionId, table.googleEventId),
]);

export const calendarIntegrations = pgTable("calendar_integrations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	staffId: uuid("staff_id").notNull(),
	provider: text().notNull(),
	externalCalendarId: text("external_calendar_id").notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"),
	tokenExpiresAt: timestamp("token_expires_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	syncErrors: text("sync_errors"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [staff.id],
			name: "calendar_integrations_staff_id_staff_id_fk"
		}).onDelete("cascade"),
]);

export const calendarStaff = pgTable("calendar_staff", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	calendarId: varchar("calendar_id").notNull(),
	staffId: uuid("staff_id").notNull(),
	isActive: boolean("is_active").default(true),
	roundRobinOrder: integer("round_robin_order"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.calendarId],
			foreignColumns: [calendars.id],
			name: "calendar_staff_calendar_id_calendars_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [staff.id],
			name: "calendar_staff_staff_id_staff_id_fk"
		}).onDelete("cascade"),
]);

export const calendarSyncState = pgTable("calendar_sync_state", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	connectionId: varchar("connection_id").notNull(),
	lastSyncStarted: timestamp("last_sync_started", { mode: 'string' }),
	lastSyncCompleted: timestamp("last_sync_completed", { mode: 'string' }),
	lastSyncStatus: text("last_sync_status"),
	lastSyncError: text("last_sync_error"),
	eventsCreated: integer("events_created").default(0),
	eventsUpdated: integer("events_updated").default(0),
	eventsDeleted: integer("events_deleted").default(0),
	nextSyncToken: text("next_sync_token"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_calendar_sync_state_connection_id").using("btree", table.connectionId.asc().nullsLast().op("text_ops")),
]);

export const capacitySettings = pgTable("capacity_settings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	department: text().notNull(),
	role: text(),
	maxClientsPerStaff: integer("max_clients_per_staff").default(10).notNull(),
	alertThreshold: numeric("alert_threshold", { precision: 5, scale:  2 }).default('80.00').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdBy: uuid("created_by"),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	notifyUserIds: text("notify_user_ids").array(),
	notificationMessage: text("notification_message"),
});

export const clientBriefValues = pgTable("client_brief_values", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	sectionId: varchar("section_id").notNull(),
	value: text(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const clientBriefSections = pgTable("client_brief_sections", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	key: text().notNull(),
	title: text().notNull(),
	placeholder: text(),
	icon: text().default('FileText').notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	isEnabled: boolean("is_enabled").default(true).notNull(),
	scope: text().default('custom').notNull(),
	type: text().default('text').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("client_brief_sections_key_unique").on(table.key),
]);

export const clientBundles = pgTable("client_bundles", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	bundleId: varchar("bundle_id").notNull(),
	price: numeric({ precision: 10, scale:  2 }),
	status: text().default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	customQuantities: jsonb("custom_quantities"),
}, (table) => [
	foreignKey({
			columns: [table.bundleId],
			foreignColumns: [productBundles.id],
			name: "client_bundles_bundle_id_product_bundles_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_bundles_client_id_clients_id_fk"
		}),
]);

export const clientContacts = pgTable("client_contacts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name"),
	email: text(),
	phone: text(),
	title: text(),
	isPrimary: boolean("is_primary").default(false),
	notes: text(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const clientDocuments = pgTable("client_documents", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	fileName: text("file_name").notNull(),
	fileType: text("file_type").notNull(),
	fileSize: integer("file_size").notNull(),
	fileUrl: text("file_url").notNull(),
	uploadedBy: uuid("uploaded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_documents_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [staff.id],
			name: "client_documents_uploaded_by_staff_id_fk"
		}),
]);

export const clientHealthScores = pgTable("client_health_scores", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	weekStartDate: date("week_start_date").notNull(),
	weekEndDate: date("week_end_date").notNull(),
	weeklyRecap: text("weekly_recap"),
	opportunities: text(),
	solutions: text(),
	goals: text().notNull(),
	fulfillment: text().notNull(),
	relationship: text().notNull(),
	clientActions: text("client_actions").notNull(),
	totalScore: integer("total_score").notNull(),
	averageScore: numeric("average_score", { precision: 3, scale:  2 }).notNull(),
	healthIndicator: text("health_indicator").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const clientNotes = pgTable("client_notes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	content: text().notNull(),
	createdById: uuid("created_by_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	editedBy: uuid("edited_by"),
	editedAt: timestamp("edited_at", { mode: 'string' }),
	isLocked: boolean("is_locked").default(true),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_notes_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [staff.id],
			name: "client_notes_created_by_id_staff_id_fk"
		}),
	foreignKey({
			columns: [table.editedBy],
			foreignColumns: [staff.id],
			name: "client_notes_edited_by_staff_id_fk"
		}),
]);

export const clientPortalUsers = pgTable("client_portal_users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	isActive: boolean("is_active").default(true),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	passwordResetToken: text("password_reset_token"),
	passwordResetExpires: timestamp("password_reset_expires", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const clientProducts = pgTable("client_products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	productId: varchar("product_id").notNull(),
	price: numeric({ precision: 10, scale:  2 }),
	status: text().default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_products_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "client_products_product_id_products_id_fk"
		}),
]);

export const productBundles = pgTable("product_bundles", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	type: text().default('recurring').notNull(),
});

export const campaigns = pgTable("campaigns", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	clientId: varchar("client_id").notNull(),
	status: text().default('draft').notNull(),
	type: text().notNull(),
	budget: numeric({ precision: 10, scale:  2 }),
	spent: numeric({ precision: 10, scale:  2 }).default('0'),
	impressions: integer().default(0),
	clicks: integer().default(0),
	conversions: integer().default(0),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	projectId: varchar("project_id"),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "campaigns_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "campaigns_project_id_projects_id_fk"
		}),
]);

export const clientRoadmapComments = pgTable("client_roadmap_comments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	content: text().notNull(),
	authorId: uuid("author_id").notNull(),
	mentions: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	roadmapEntryId: varchar("roadmap_entry_id"),
});

export const clientRoadmapEntries = pgTable("client_roadmap_entries", {
	id: varchar().default((gen_random_uuid())).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	content: text(),
	authorId: uuid("author_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("client_roadmap_entries_client_id_year_month_unique").on(table.clientId, table.year, table.month),
]);

export const clientTasks = pgTable("client_tasks", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	title: text().notNull(),
	description: text(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	status: text().default('pending').notNull(),
	assignedTo: uuid("assigned_to"),
	createdBy: uuid("created_by").notNull(),
	isRecurring: boolean("is_recurring").default(false),
	recurrencePattern: jsonb("recurrence_pattern"),
	createEvenIfOverdue: boolean("create_even_if_overdue").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [staff.id],
			name: "client_tasks_assigned_to_staff_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_tasks_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "client_tasks_created_by_staff_id_fk"
		}),
]);

export const clientTeamAssignments = pgTable("client_team_assignments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	staffId: uuid("staff_id").notNull(),
	position: text().notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	assignedBy: uuid("assigned_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("client_team_assignments_client_position_unique").on(table.clientId, table.position),
]);

export const clientTransactions = pgTable("client_transactions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	type: text().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	description: text(),
	status: text().notNull(),
	transactionDate: timestamp("transaction_date", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_transactions_client_id_clients_id_fk"
		}),
]);

export const clientGroups = pgTable("client_groups", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const taskComments = pgTable("task_comments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	taskId: varchar("task_id").notNull(),
	content: text().notNull(),
	mentions: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	parentId: varchar("parent_id"),
	authorId: uuid("author_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [staff.id],
			name: "task_comments_author_id_staff_id_fk"
		}),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_comments_task_id_tasks_id_fk"
		}),
]);

export const commentFiles = pgTable("comment_files", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	commentId: varchar("comment_id").notNull(),
	fileName: text("file_name").notNull(),
	fileType: text("file_type").notNull(),
	fileSize: integer("file_size").notNull(),
	fileUrl: text("file_url").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	uploadedBy: uuid("uploaded_by").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [taskComments.id],
			name: "comment_files_comment_id_task_comments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [staff.id],
			name: "comment_files_uploaded_by_staff_id_fk"
		}),
]);

export const customFieldFileUploads = pgTable("custom_field_file_uploads", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	customFieldId: varchar("custom_field_id").notNull(),
	fileName: text("file_name").notNull(),
	originalFileName: text("original_file_name").notNull(),
	fileType: text("file_type").notNull(),
	fileSize: integer("file_size").notNull(),
	filePath: text("file_path").notNull(),
	uploadedBy: uuid("uploaded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "custom_field_file_uploads_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.customFieldId],
			foreignColumns: [customFields.id],
			name: "custom_field_file_uploads_custom_field_id_custom_fields_id_fk"
		}),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [staff.id],
			name: "custom_field_file_uploads_uploaded_by_staff_id_fk"
		}),
]);

export const customFields = pgTable("custom_fields", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	options: text().array(),
	required: boolean().default(false),
	folderId: varchar("folder_id"),
	order: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.folderId],
			foreignColumns: [customFieldFolders.id],
			name: "custom_fields_folder_id_custom_field_folders_id_fk"
		}),
]);

export const customFieldFolders = pgTable("custom_field_folders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	order: integer().default(0),
	isDefault: boolean("is_default").default(false),
	canReorder: boolean("can_reorder").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const dashboards = pgTable("dashboards", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: text().notNull(),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	displayOrder: integer("display_order").default(0),
});

export const deals = pgTable("deals", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	leadId: varchar("lead_id").notNull(),
	clientId: varchar("client_id"),
	name: text().notNull(),
	value: numeric({ precision: 10, scale:  2 }).notNull(),
	mrr: numeric({ precision: 10, scale:  2 }),
	isRecurring: boolean("is_recurring").default(false),
	contractTerm: integer("contract_term"),
	assignedTo: uuid("assigned_to").notNull(),
	wonDate: timestamp("won_date", { mode: 'string' }).defaultNow().notNull(),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	status: text().default('active').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_deals_lead").using("btree", table.leadId.asc().nullsLast().op("text_ops")),
	index("idx_deals_rep").using("btree", table.assignedTo.asc().nullsLast().op("uuid_ops")),
	index("idx_deals_rep_won_date").using("btree", table.assignedTo.asc().nullsLast().op("timestamp_ops"), table.wonDate.asc().nullsLast().op("timestamp_ops")),
	index("idx_deals_won_date").using("btree", table.wonDate.asc().nullsLast().op("timestamp_ops")),
]);

export const leads = pgTable("leads", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	phone: text(),
	company: text(),
	source: text(),
	status: text().default('new').notNull(),
	value: numeric({ precision: 10, scale:  2 }),
	probability: integer().default(0),
	notes: text(),
	assignedTo: uuid("assigned_to"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	lastContactDate: timestamp("last_contact_date", { mode: 'string' }),
	stageId: varchar("stage_id"),
	stageHistory: jsonb("stage_history").default([]),
	customFieldData: jsonb("custom_field_data"),
	tags: text().array().default([""]),
}, (table) => [
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [staff.id],
			name: "leads_assigned_to_staff_id_fk"
		}),
	foreignKey({
			columns: [table.stageId],
			foreignColumns: [leadPipelineStages.id],
			name: "leads_stage_id_lead_pipeline_stages_id_fk"
		}),
]);

export const teamWorkflows = pgTable("team_workflows", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const departments = pgTable("departments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	managerId: varchar("manager_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	isActive: boolean("is_active").default(true),
	workflowId: varchar("workflow_id"),
	parentDepartmentId: varchar("parent_department_id"),
	orderIndex: integer("order_index").default(0),
}, (table) => [
	unique("departments_name_unique").on(table.name),
]);

export const documents = pgTable("documents", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	fileName: text("file_name").notNull(),
	fileType: text("file_type").notNull(),
	fileSize: integer("file_size"),
	fileUrl: text("file_url").notNull(),
	clientId: varchar("client_id").notNull(),
	uploadedBy: varchar("uploaded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "documents_client_id_clients_id_fk"
		}),
]);

export const emailTemplates = pgTable("email_templates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	subject: text().notNull(),
	content: text().notNull(),
	plainTextContent: text("plain_text_content"),
	previewText: text("preview_text"),
	folderId: varchar("folder_id"),
	tags: text().array(),
	isPublic: boolean("is_public").default(false),
	usageCount: integer("usage_count").default(0),
	lastUsed: timestamp("last_used", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	createdBy: uuid("created_by").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "email_templates_created_by_staff_id_fk"
		}),
	foreignKey({
			columns: [table.folderId],
			foreignColumns: [templateFolders.id],
			name: "email_templates_folder_id_template_folders_id_fk"
		}),
]);

export const templateFolders = pgTable("template_folders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	type: text().notNull(),
	parentId: varchar("parent_id"),
	order: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const enhancedTasks = pgTable("enhanced_tasks", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	categoryId: varchar("category_id"),
	templateId: varchar("template_id"),
	clientId: varchar("client_id"),
	projectId: varchar("project_id"),
	campaignId: varchar("campaign_id"),
	workflowId: varchar("workflow_id"),
	parentTaskId: varchar("parent_task_id"),
	assignedTo: uuid("assigned_to"),
	createdBy: varchar("created_by").notNull(),
	priority: text().default('medium').notNull(),
	status: text().default('todo').notNull(),
	progress: integer().default(0),
	estimatedHours: numeric("estimated_hours", { precision: 5, scale:  2 }),
	actualHours: numeric("actual_hours", { precision: 5, scale:  2 }),
	dueDate: timestamp("due_date", { mode: 'string' }),
	startDate: timestamp("start_date", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	tags: text().array(),
	checklist: jsonb(),
	attachments: jsonb(),
	dependencies: text().array(),
	followers: text().array(),
	customFields: jsonb("custom_fields"),
	timeEntries: jsonb("time_entries"),
	comments: jsonb(),
	reminderSettings: jsonb("reminder_settings"),
	isRecurring: boolean("is_recurring").default(false),
	recurrencePattern: jsonb("recurrence_pattern"),
	recurringGroupId: text("recurring_group_id"),
	automationData: jsonb("automation_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [staff.id],
			name: "enhanced_tasks_assigned_to_staff_id_fk"
		}),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "enhanced_tasks_campaign_id_campaigns_id_fk"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [taskCategories.id],
			name: "enhanced_tasks_category_id_task_categories_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "enhanced_tasks_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "enhanced_tasks_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [taskTemplates.id],
			name: "enhanced_tasks_template_id_task_templates_id_fk"
		}),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "enhanced_tasks_workflow_id_workflows_id_fk"
		}),
]);

export const taskCategories = pgTable("task_categories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	color: text().notNull(),
	icon: text(),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	workflowId: varchar("workflow_id"),
});

export const taskTemplates = pgTable("task_templates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	categoryId: varchar("category_id"),
	priority: text().default('medium').notNull(),
	estimatedDuration: integer("estimated_duration"),
	instructions: text(),
	checklist: jsonb(),
	requiredFields: jsonb("required_fields"),
	assigneeRole: text("assignee_role"),
	tags: text().array(),
	isRecurring: boolean("is_recurring").default(false),
	recurrencePattern: jsonb("recurrence_pattern"),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	templateData: jsonb("template_data"),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [taskCategories.id],
			name: "task_templates_category_id_task_categories_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "task_templates_created_by_staff_id_fk"
		}),
]);

export const workflows = pgTable("workflows", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	clientId: varchar("client_id"),
	category: text(),
	status: text().default('draft').notNull(),
	actions: jsonb().default([]).notNull(),
	conditions: jsonb(),
	settings: jsonb(),
	isTemplate: boolean("is_template").default(false),
	templateCategory: text("template_category"),
	version: integer().default(1),
	lastRun: timestamp("last_run", { mode: 'string' }),
	totalRuns: integer("total_runs").default(0),
	successfulRuns: integer("successful_runs").default(0),
	failedRuns: integer("failed_runs").default(0),
	createdBy: varchar("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	folderId: varchar("folder_id"),
	triggers: jsonb().default([]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "workflows_client_id_clients_id_fk"
		}),
]);

export const eventTimeEntries = pgTable("event_time_entries", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	calendarEventId: varchar("calendar_event_id").notNull(),
	userId: uuid("user_id").notNull(),
	clientId: varchar("client_id"),
	title: text().notNull(),
	description: text(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	duration: integer().notNull(),
	source: text().default('auto'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_event_time_entries_calendar_event").using("btree", table.calendarEventId.asc().nullsLast().op("text_ops")),
	index("idx_event_time_entries_client").using("btree", table.clientId.asc().nullsLast().op("text_ops")),
	index("idx_event_time_entries_date").using("btree", table.startTime.asc().nullsLast().op("timestamp_ops")),
	index("idx_event_time_entries_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const expenseReportFormConfig = pgTable("expense_report_form_config", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	fields: jsonb().notNull(),
	updatedBy: uuid("updated_by").notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const expenseReportSubmissions = pgTable("expense_report_submissions", {
	id: serial().primaryKey().notNull(),
	fullName: text("full_name").notNull(),
	supervisorId: uuid("supervisor_id"),
	purpose: text(),
	expenseType: text("expense_type"),
	expenseDate: date("expense_date"),
	expenseTotal: numeric("expense_total", { precision: 10, scale:  2 }),
	departmentTeam: text("department_team"),
	clientId: varchar("client_id"),
	reimbursement: text(),
	paymentMethod: text("payment_method"),
	notes: text(),
	receiptFiles: text("receipt_files").array(),
	status: text().default('pending').notNull(),
	submittedById: uuid("submitted_by_id"),
	reviewedBy: uuid("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	customFieldData: jsonb("custom_field_data"),
});

export const formFields = pgTable("form_fields", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	formId: varchar("form_id").notNull(),
	type: text().notNull(),
	label: text(),
	placeholder: text(),
	required: boolean().default(false),
	options: text().array(),
	validation: jsonb().default({}),
	settings: jsonb().default({}),
	customFieldId: varchar("custom_field_id"),
	order: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.customFieldId],
			foreignColumns: [customFields.id],
			name: "form_fields_custom_field_id_custom_fields_id_fk"
		}),
	foreignKey({
			columns: [table.formId],
			foreignColumns: [forms.id],
			name: "form_fields_form_id_forms_id_fk"
		}),
]);

export const forms = pgTable("forms", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	status: text().default('draft').notNull(),
	settings: jsonb().default({}),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	folderId: varchar("folder_id"),
	updatedBy: uuid("updated_by"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "forms_created_by_staff_id_fk"
		}),
	foreignKey({
			columns: [table.folderId],
			foreignColumns: [formFolders.id],
			name: "forms_folder_id_form_folders_id_fk"
		}),
]);

export const formSubmissions = pgTable("form_submissions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	formId: varchar("form_id").notNull(),
	data: jsonb().notNull(),
	submitterEmail: text("submitter_email"),
	submitterName: text("submitter_name"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.formId],
			foreignColumns: [forms.id],
			name: "form_submissions_form_id_forms_id_fk"
		}),
]);

export const formFolders = pgTable("form_folders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	order: integer().default(0),
	isDefault: boolean("is_default").default(false),
	canReorder: boolean("can_reorder").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const gohighlevelIntegration = pgTable("gohighlevel_integration", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	webhookToken: text("webhook_token").notNull(),
	name: text().default('GoHighLevel').notNull(),
	isActive: boolean("is_active").default(true),
	defaultSource: text("default_source").default('GoHighLevel'),
	defaultStageId: varchar("default_stage_id"),
	assignToStaffId: uuid("assign_to_staff_id"),
	triggerWorkflows: boolean("trigger_workflows").default(true),
	fieldMappings: jsonb("field_mappings"),
	leadsReceived: integer("leads_received").default(0),
	lastLeadAt: timestamp("last_lead_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("gohighlevel_integration_webhook_token_unique").on(table.webhookToken),
]);

export const roles = pgTable("roles", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	isSystem: boolean("is_system").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("roles_name_unique").on(table.name),
]);

export const granularPermissions = pgTable("granular_permissions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	roleId: varchar("role_id").notNull(),
	module: text().notNull(),
	permissionKey: text("permission_key").notNull(),
	enabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("granular_permissions_role_id_permission_key_unique").on(table.roleId, table.permissionKey),
]);

export const imageAnnotations = pgTable("image_annotations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	fileId: varchar("file_id").notNull(),
	x: numeric({ precision: 5, scale:  2 }).notNull(),
	y: numeric({ precision: 5, scale:  2 }).notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	mentions: text().array().default([""]),
	authorId: uuid("author_id").notNull(),
	isCompleted: boolean("is_completed").default(false),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [staff.id],
			name: "image_annotations_author_id_staff_id_fk"
		}),
]);

export const invoices = pgTable("invoices", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	invoiceNumber: text("invoice_number").notNull(),
	clientId: varchar("client_id").notNull(),
	projectId: varchar("project_id"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	tax: numeric({ precision: 10, scale:  2 }).default('0'),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	status: text().default('draft').notNull(),
	issueDate: timestamp("issue_date", { mode: 'string' }).defaultNow(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	paidDate: timestamp("paid_date", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "invoices_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "invoices_project_id_projects_id_fk"
		}),
	unique("invoices_invoice_number_unique").on(table.invoiceNumber),
]);

export const jobApplicationComments = pgTable("job_application_comments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	applicationId: varchar("application_id").notNull(),
	content: text().notNull(),
	authorId: uuid("author_id").notNull(),
	authorName: text("author_name").notNull(),
	isInternal: boolean("is_internal").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const jobApplicationFormConfig = pgTable("job_application_form_config", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	fields: jsonb().notNull(),
	updatedBy: varchar("updated_by").notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const jobApplicationWatchers = pgTable("job_application_watchers", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	applicationId: varchar("application_id").notNull(),
	staffId: uuid("staff_id").notNull(),
	addedBy: uuid("added_by").notNull(),
	addedAt: timestamp("added_at", { mode: 'string' }).defaultNow(),
});

export const positions = pgTable("positions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	departmentId: varchar("department_id"),
	level: integer().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	isActive: boolean("is_active").default(true),
	parentPositionId: varchar("parent_position_id"),
	orderIndex: integer("order_index").default(0),
	inOrgChart: boolean("in_org_chart").default(false),
});

export const jobOpenings = pgTable("job_openings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	departmentId: varchar("department_id").notNull(),
	positionId: varchar("position_id").notNull(),
	status: text().default('draft').notNull(),
	hiringManagerId: uuid("hiring_manager_id").notNull(),
	employmentType: text("employment_type").notNull(),
	compensation: numeric({ precision: 12, scale:  2 }),
	compensationType: text("compensation_type").default('annual'),
	jobDescription: text("job_description"),
	requirements: text(),
	benefits: text(),
	createdById: uuid("created_by_id").notNull(),
	approvalStatus: text("approval_status").default('pending').notNull(),
	approvedById: uuid("approved_by_id"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	isPublic: boolean("is_public").default(false),
	externalPostingUrl: text("external_posting_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const knowledgeBaseArticles = pgTable("knowledge_base_articles", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: text().notNull(),
	content: jsonb().notNull(),
	excerpt: text(),
	categoryId: varchar("category_id"),
	parentId: varchar("parent_id"),
	slug: text().notNull(),
	order: integer().default(0),
	status: text().default('published').notNull(),
	featuredImage: text("featured_image"),
	tags: text().array(),
	viewCount: integer("view_count").default(0),
	likeCount: integer("like_count").default(0),
	isPublic: boolean("is_public").default(true),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	lastViewedAt: timestamp("last_viewed_at", { mode: 'string' }),
}, (table) => [
	unique("knowledge_base_articles_slug_unique").on(table.slug),
]);

export const knowledgeBaseArticleVersions = pgTable("knowledge_base_article_versions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	articleId: varchar("article_id").notNull(),
	version: integer().notNull(),
	title: text().notNull(),
	content: jsonb().notNull(),
	changeDescription: text("change_description"),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const knowledgeBaseCategories = pgTable("knowledge_base_categories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	parentId: varchar("parent_id"),
	order: integer().default(0),
	icon: text(),
	color: text(),
	isVisible: boolean("is_visible").default(true),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const knowledgeBaseBookmarks = pgTable("knowledge_base_bookmarks", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	articleId: varchar("article_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const knowledgeBaseComments = pgTable("knowledge_base_comments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	articleId: varchar("article_id").notNull(),
	parentId: varchar("parent_id"),
	content: text().notNull(),
	mentions: text().array(),
	authorId: uuid("author_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const knowledgeBaseLikes = pgTable("knowledge_base_likes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	articleId: varchar("article_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const knowledgeBaseSettings = pgTable("knowledge_base_settings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	key: text().notNull(),
	value: jsonb().notNull(),
	description: text(),
	updatedBy: uuid("updated_by").notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("knowledge_base_settings_key_unique").on(table.key),
]);

export const knowledgeBaseViews = pgTable("knowledge_base_views", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	articleId: varchar("article_id").notNull(),
	userId: uuid("user_id"),
	viewedAt: timestamp("viewed_at", { mode: 'string' }).defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
});

export const leadAppointments = pgTable("lead_appointments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	leadId: varchar("lead_id").notNull(),
	calendarId: varchar("calendar_id").notNull(),
	title: text().notNull(),
	description: text(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	location: text(),
	status: text().default('confirmed').notNull(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	assignedTo: uuid("assigned_to").notNull(),
	activityType: text("activity_type").default('appointment').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [staff.id],
			name: "lead_appointments_assigned_to_staff_id_fk"
		}),
	foreignKey({
			columns: [table.calendarId],
			foreignColumns: [calendars.id],
			name: "lead_appointments_calendar_id_calendars_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "lead_appointments_created_by_staff_id_fk"
		}),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "lead_appointments_lead_id_leads_id_fk"
		}).onDelete("cascade"),
]);

export const leadNotes = pgTable("lead_notes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	content: text().notNull(),
	leadId: varchar("lead_id").notNull(),
	authorId: uuid("author_id").notNull(),
	isLocked: boolean("is_locked").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [staff.id],
			name: "lead_notes_author_id_staff_id_fk"
		}),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "lead_notes_lead_id_leads_id_fk"
		}).onDelete("cascade"),
]);

export const leadPipelineStages = pgTable("lead_pipeline_stages", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	color: text().default('#6b7280').notNull(),
	order: integer().default(0).notNull(),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const leadStageTransitions = pgTable("lead_stage_transitions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	leadId: varchar("lead_id").notNull(),
	fromStageId: varchar("from_stage_id"),
	toStageId: varchar("to_stage_id").notNull(),
	transitionedAt: timestamp("transitioned_at", { mode: 'string' }).defaultNow().notNull(),
	transitionedBy: uuid("transitioned_by"),
}, (table) => [
	index("idx_lead_stage_transitions_from_stage_date").using("btree", table.fromStageId.asc().nullsLast().op("text_ops"), table.transitionedAt.asc().nullsLast().op("text_ops")),
	index("idx_lead_stage_transitions_to_stage_date").using("btree", table.toStageId.asc().nullsLast().op("timestamp_ops"), table.transitionedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_stage_transitions_date").using("btree", table.transitionedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_stage_transitions_lead").using("btree", table.leadId.asc().nullsLast().op("text_ops")),
	index("idx_stage_transitions_stages").using("btree", table.fromStageId.asc().nullsLast().op("text_ops"), table.toStageId.asc().nullsLast().op("text_ops")),
]);

export const notes = pgTable("notes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	content: text().notNull(),
	clientId: varchar("client_id").notNull(),
	authorId: varchar("author_id").notNull(),
	isLocked: boolean("is_locked").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "notes_author_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "notes_client_id_clients_id_fk"
		}),
]);

export const notificationSettings = pgTable("notification_settings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	clientAssignedInApp: boolean("client_assigned_in_app").default(true),
	clientAssignedEmail: boolean("client_assigned_email").default(true),
	clientAssignedSms: boolean("client_assigned_sms").default(false),
	chatAddedInApp: boolean("chat_added_in_app").default(true),
	chatAddedEmail: boolean("chat_added_email").default(false),
	chatAddedSms: boolean("chat_added_sms").default(false),
	chatMessagesInApp: boolean("chat_messages_in_app").default(true),
	mentionedInApp: boolean("mentioned_in_app").default(true),
	mentionedEmail: boolean("mentioned_email").default(true),
	mentionedSms: boolean("mentioned_sms").default(false),
	mentionFollowUpInApp: boolean("mention_follow_up_in_app").default(true),
	mentionFollowUpEmail: boolean("mention_follow_up_email").default(false),
	mentionFollowUpSms: boolean("mention_follow_up_sms").default(false),
	taskAssignedInApp: boolean("task_assigned_in_app").default(true),
	taskAssignedEmail: boolean("task_assigned_email").default(true),
	taskAssignedSms: boolean("task_assigned_sms").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [staff.id],
			name: "notification_settings_user_id_staff_id_fk"
		}).onDelete("cascade"),
]);

export const oneOnOneActionItems = pgTable("one_on_one_action_items", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	meetingId: varchar("meeting_id").notNull(),
	content: text().notNull(),
	assignedTo: uuid("assigned_to"),
	dueDate: date("due_date"),
	isCompleted: boolean("is_completed").default(false),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	taskId: varchar("task_id"),
});

export const oneOnOneMeetings = pgTable("one_on_one_meetings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	managerId: uuid("manager_id").notNull(),
	directReportId: uuid("direct_report_id").notNull(),
	meetingDate: date("meeting_date").notNull(),
	weekOf: date("week_of").notNull(),
	feeling: text(),
	performanceFeedback: text("performance_feedback"),
	performancePoints: integer("performance_points"),
	bonusPoints: integer("bonus_points").default(0),
	progressionStatus: text("progression_status"),
	hobbies: text(),
	family: text(),
	privateNotes: text("private_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	recordingLink: text("recording_link"),
	meetingTime: text("meeting_time").default('09:00').notNull(),
	meetingDuration: integer("meeting_duration").default(30).notNull(),
	calendarEventId: varchar("calendar_event_id"),
	calendarAppointmentId: varchar("calendar_appointment_id"),
	meetingStartedAt: timestamp("meeting_started_at", { mode: 'string' }),
	meetingEndedAt: timestamp("meeting_ended_at", { mode: 'string' }),
	isRecurring: boolean("is_recurring").default(false),
	recurringFrequency: text("recurring_frequency"),
	recurringEndType: text("recurring_end_type"),
	recurringEndDate: date("recurring_end_date"),
	recurringOccurrences: integer("recurring_occurrences"),
	recurringParentId: varchar("recurring_parent_id"),
});

export const oneOnOneComments = pgTable("one_on_one_comments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	meetingId: varchar("meeting_id").notNull(),
	authorId: uuid("author_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const oneOnOneGoals = pgTable("one_on_one_goals", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	meetingId: varchar("meeting_id"),
	directReportId: uuid("direct_report_id").notNull(),
	content: text().notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const oneOnOneMeetingKpiStatuses = pgTable("one_on_one_meeting_kpi_statuses", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	meetingId: varchar("meeting_id").notNull(),
	positionKpiId: varchar("position_kpi_id").notNull(),
	status: text().default('on_track').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const positionKpis = pgTable("position_kpis", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	positionId: varchar("position_id").notNull(),
	kpiName: varchar("kpi_name", { length: 200 }).notNull(),
	benchmark: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const oneOnOneTalkingPoints = pgTable("one_on_one_talking_points", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	meetingId: varchar("meeting_id").notNull(),
	content: text().notNull(),
	addedBy: uuid("added_by").notNull(),
	orderIndex: integer("order_index").default(0),
	isCompleted: boolean("is_completed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	notes: text(),
});

export const oneOnOneWins = pgTable("one_on_one_wins", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	meetingId: varchar("meeting_id").notNull(),
	content: text().notNull(),
	addedBy: uuid("added_by").notNull(),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const orgChartNodes = pgTable("org_chart_nodes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	structureId: varchar("structure_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	department: varchar({ length: 100 }),
	position: varchar({ length: 100 }),
	roleType: varchar("role_type", { length: 50 }).default('standard'),
	notes: text(),
	parentId: varchar("parent_id"),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const orgChartNodeAssignments = pgTable("org_chart_node_assignments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	nodeId: varchar("node_id").notNull(),
	staffId: uuid("staff_id").notNull(),
	assignmentType: varchar("assignment_type", { length: 50 }).default('primary'),
	effectiveDate: date("effective_date"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("org_chart_node_assignments_node_id_assignment_type_unique").on(table.nodeId, table.assignmentType),
]);

export const orgChartStructures = pgTable("org_chart_structures", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(false),
	createdById: uuid("created_by_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const permissionAuditLogs = pgTable("permission_audit_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	auditType: text("audit_type").notNull(),
	roleId: varchar("role_id"),
	roleName: text("role_name"),
	targetUserId: uuid("target_user_id"),
	targetUserName: text("target_user_name"),
	moduleAffected: text("module_affected"),
	permissionsBefore: jsonb("permissions_before"),
	permissionsAfter: jsonb("permissions_after"),
	changesSummary: text("changes_summary").notNull(),
	changesCount: integer("changes_count").default(0),
	performedBy: uuid("performed_by"),
	performedByName: text("performed_by_name").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	sessionId: text("session_id"),
	riskLevel: text("risk_level").default('low'),
	isElevatedPermission: boolean("is_elevated_permission").default(false),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.performedBy],
			foreignColumns: [staff.id],
			name: "permission_audit_logs_performed_by_staff_id_fk"
		}),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "permission_audit_logs_role_id_roles_id_fk"
		}),
	foreignKey({
			columns: [table.targetUserId],
			foreignColumns: [staff.id],
			name: "permission_audit_logs_target_user_id_staff_id_fk"
		}),
]);

export const permissionChangeHistory = pgTable("permission_change_history", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	auditLogId: varchar("audit_log_id").notNull(),
	module: text().notNull(),
	permissionType: text("permission_type").notNull(),
	oldValue: boolean("old_value"),
	newValue: boolean("new_value").notNull(),
	changeType: text("change_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const permissions = pgTable("permissions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	roleId: varchar("role_id").notNull(),
	module: text().notNull(),
	canView: boolean("can_view").default(false),
	canCreate: boolean("can_create").default(false),
	canEdit: boolean("can_edit").default(false),
	canDelete: boolean("can_delete").default(false),
	canManage: boolean("can_manage").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	canExport: boolean("can_export").default(false),
	canImport: boolean("can_import").default(false),
	dataAccessLevel: text("data_access_level").default('own').notNull(),
	restrictedFields: text("restricted_fields").array(),
	readOnlyFields: text("read_only_fields").array(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "permissions_role_id_roles_id_fk"
		}).onDelete("cascade"),
]);

export const productCategories = pgTable("product_categories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("product_categories_name_unique").on(table.name),
]);

export const pxMeetings = pgTable("px_meetings", {
	id: varchar({ length: 36 }).default((gen_random_uuid())).primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	meetingDate: date("meeting_date").notNull(),
	meetingTime: varchar("meeting_time", { length: 10 }).notNull(),
	meetingDuration: integer("meeting_duration").default(60),
	recordingLink: text("recording_link"),
	whatsWorkingKpis: text("whats_working_kpis"),
	salesOpportunities: text("sales_opportunities"),
	areasOfOpportunities: text("areas_of_opportunities"),
	actionPlan: text("action_plan"),
	actionItems: text("action_items"),
	createdById: varchar("created_by_id", { length: 36 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	clientId: varchar("client_id"),
	tags: text().array(),
	notes: text(),
	isPrivate: boolean("is_private").default(false),
	facilitatorId: uuid("facilitator_id"),
	noteTakerId: uuid("note_taker_id"),
	enabledElements: text("enabled_elements").array(),
	isRecurring: boolean("is_recurring").default(false),
	recurringFrequency: text("recurring_frequency"),
	recurringEndDate: date("recurring_end_date"),
	recurringParentId: varchar("recurring_parent_id"),
	recurringEndType: text("recurring_end_type"),
	recurringOccurrences: integer("recurring_occurrences"),
	meetingStartedAt: timestamp("meeting_started_at", { mode: 'string' }),
	meetingEndedAt: timestamp("meeting_ended_at", { mode: 'string' }),
});

export const pxMeetingAttendees = pgTable("px_meeting_attendees", {
	id: varchar({ length: 36 }).default((gen_random_uuid())).primaryKey().notNull(),
	meetingId: varchar("meeting_id", { length: 36 }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const quotes = pgTable("quotes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id"),
	leadId: varchar("lead_id"),
	name: text().notNull(),
	clientBudget: numeric("client_budget", { precision: 10, scale:  2 }).notNull(),
	desiredMargin: numeric("desired_margin", { precision: 5, scale:  2 }).notNull(),
	totalCost: numeric("total_cost", { precision: 10, scale:  2 }).default('0'),
	status: text().default('draft').notNull(),
	notes: text(),
	createdBy: uuid("created_by").notNull(),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	viewCount: integer("view_count").default(0),
});

export const roundRobinTracking = pgTable("round_robin_tracking", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	calendarId: varchar("calendar_id").notNull(),
	lastAssignedStaffId: uuid("last_assigned_staff_id"),
	assignmentCount: jsonb("assignment_count"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.calendarId],
			foreignColumns: [calendars.id],
			name: "round_robin_tracking_calendar_id_calendars_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.lastAssignedStaffId],
			foreignColumns: [staff.id],
			name: "round_robin_tracking_last_assigned_staff_id_staff_id_fk"
		}),
]);

export const salesActivities = pgTable("sales_activities", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	leadId: varchar("lead_id").notNull(),
	type: text().notNull(),
	outcome: text(),
	notes: text(),
	assignedTo: uuid("assigned_to").notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_sales_activities_lead").using("btree", table.leadId.asc().nullsLast().op("text_ops")),
	index("idx_sales_activities_lead_date").using("btree", table.leadId.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("idx_sales_activities_rep").using("btree", table.assignedTo.asc().nullsLast().op("uuid_ops")),
	index("idx_sales_activities_rep_date").using("btree", table.assignedTo.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_sales_activities_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

export const salesSettings = pgTable("sales_settings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	minimumMarginThreshold: numeric("minimum_margin_threshold", { precision: 5, scale:  2 }).default('35.00').notNull(),
	updatedBy: uuid("updated_by"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const salesTargets = pgTable("sales_targets", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	year: integer().notNull(),
	month: integer().notNull(),
	targetAmount: numeric("target_amount", { precision: 12, scale:  2 }).notNull(),
	createdBy: uuid("created_by"),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("sales_targets_year_month_unique").on(table.year, table.month),
]);

export const smartLists = pgTable("smart_lists", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	filters: jsonb().notNull(),
	visibility: text().default('personal').notNull(),
	sharedWith: text("shared_with").array(),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	entityType: text("entity_type").default('clients').notNull(),
	createdBy: uuid("created_by").notNull(),
});

export const smsTemplates = pgTable("sms_templates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	content: text().notNull(),
	folderId: varchar("folder_id"),
	tags: text().array(),
	isPublic: boolean("is_public").default(false),
	usageCount: integer("usage_count").default(0),
	lastUsed: timestamp("last_used", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	createdBy: uuid("created_by").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [staff.id],
			name: "sms_templates_created_by_staff_id_fk"
		}),
	foreignKey({
			columns: [table.folderId],
			foreignColumns: [templateFolders.id],
			name: "sms_templates_folder_id_template_folders_id_fk"
		}),
]);

export const socialMediaAccounts = pgTable("social_media_accounts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	platform: text().notNull(),
	accountName: text("account_name").notNull(),
	username: text().notNull(),
	accountId: text("account_id"),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	tokenExpiresAt: timestamp("token_expires_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	lastSync: timestamp("last_sync", { mode: 'string' }),
	followers: integer().default(0),
	following: integer().default(0),
	posts: integer().default(0),
	profileImage: text("profile_image"),
	bio: text(),
	website: text(),
	settings: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "social_media_accounts_client_id_clients_id_fk"
		}),
]);

export const socialMediaAnalytics = pgTable("social_media_analytics", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	accountId: varchar("account_id").notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	followers: integer().default(0),
	following: integer().default(0),
	posts: integer().default(0),
	totalLikes: integer("total_likes").default(0),
	totalComments: integer("total_comments").default(0),
	totalShares: integer("total_shares").default(0),
	totalImpressions: integer("total_impressions").default(0),
	totalReach: integer("total_reach").default(0),
	totalClicks: integer("total_clicks").default(0),
	totalSaves: integer("total_saves").default(0),
	engagementRate: numeric("engagement_rate", { precision: 5, scale:  2 }).default('0'),
	impressionReachRatio: numeric("impression_reach_ratio", { precision: 5, scale:  2 }).default('0'),
	platformData: jsonb("platform_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [socialMediaAccounts.id],
			name: "social_media_analytics_account_id_social_media_accounts_id_fk"
		}),
]);

export const socialMediaPosts = pgTable("social_media_posts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	clientId: varchar("client_id").notNull(),
	campaignId: varchar("campaign_id"),
	accountId: varchar("account_id").notNull(),
	content: text().notNull(),
	hashtags: text().array(),
	mentions: text().array(),
	mediaUrls: text("media_urls").array(),
	mediaType: text("media_type"),
	linkUrl: text("link_url"),
	linkPreview: jsonb("link_preview"),
	status: text().default('draft').notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	platformPostId: text("platform_post_id"),
	platformData: jsonb("platform_data"),
	likes: integer().default(0),
	comments: integer().default(0),
	shares: integer().default(0),
	impressions: integer().default(0),
	reach: integer().default(0),
	clicks: integer().default(0),
	saves: integer().default(0),
	requiresApproval: boolean("requires_approval").default(false),
	approvedBy: varchar("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectedBy: varchar("rejected_by"),
	rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	authorId: varchar("author_id").notNull(),
	lastSyncedAt: timestamp("last_synced_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [socialMediaAccounts.id],
			name: "social_media_posts_account_id_social_media_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "social_media_posts_approved_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "social_media_posts_author_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "social_media_posts_campaign_id_campaigns_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "social_media_posts_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.rejectedBy],
			foreignColumns: [users.id],
			name: "social_media_posts_rejected_by_users_id_fk"
		}),
]);

export const socialMediaTemplates = pgTable("social_media_templates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	category: text(),
	platforms: text().array(),
	contentTemplate: text("content_template").notNull(),
	hashtagSuggestions: text("hashtag_suggestions").array(),
	mediaRequirements: jsonb("media_requirements"),
	isPublic: boolean("is_public").default(false),
	clientId: varchar("client_id"),
	authorId: varchar("author_id").notNull(),
	usageCount: integer("usage_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "social_media_templates_author_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "social_media_templates_client_id_clients_id_fk"
		}),
]);

export const staffLinkedEmails = pgTable("staff_linked_emails", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	staffId: uuid("staff_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	googleSub: varchar("google_sub", { length: 255 }),
	isPrimary: boolean("is_primary").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("staff_linked_emails_email_unique").on(table.email),
]);

export const timeOffPolicies = pgTable("time_off_policies", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	vacationDaysDefault: integer("vacation_days_default").default(15),
	sickDaysDefault: integer("sick_days_default").default(10),
	personalDaysDefault: integer("personal_days_default").default(3),
	carryOverAllowed: boolean("carry_over_allowed").default(false),
	maxCarryOverDays: integer("max_carry_over_days").default(0),
	policyDocument: text("policy_document"),
	effectiveDate: date("effective_date").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const surveySlides = pgTable("survey_slides", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	surveyId: varchar("survey_id").notNull(),
	title: text(),
	description: text(),
	order: integer().default(0).notNull(),
	buttonText: text("button_text").default('Next'),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_survey_slides_survey").using("btree", table.surveyId.asc().nullsLast().op("text_ops")),
]);

export const surveyFields = pgTable("survey_fields", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	surveyId: varchar("survey_id").notNull(),
	slideId: varchar("slide_id").notNull(),
	type: text().notNull(),
	label: text(),
	placeholder: text(),
	shortLabel: text("short_label"),
	queryKey: text("query_key"),
	required: boolean().default(false),
	hidden: boolean().default(false),
	options: text().array(),
	validation: jsonb().default({}),
	settings: jsonb().default({}),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_survey_fields_slide").using("btree", table.slideId.asc().nullsLast().op("text_ops")),
	index("idx_survey_fields_survey").using("btree", table.surveyId.asc().nullsLast().op("text_ops")),
]);

export const tasks = pgTable("tasks", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	status: text().default('pending').notNull(),
	priority: text().default('normal').notNull(),
	assignedTo: uuid("assigned_to"),
	clientId: varchar("client_id"),
	projectId: varchar("project_id"),
	campaignId: varchar("campaign_id"),
	dueDate: timestamp("due_date", { mode: 'string' }),
	dueTime: text("due_time"),
	isRecurring: boolean("is_recurring").default(false),
	recurringInterval: integer("recurring_interval"),
	recurringUnit: text("recurring_unit"),
	recurringEndType: text("recurring_end_type"),
	recurringEndDate: timestamp("recurring_end_date", { mode: 'string' }),
	recurringEndOccurrences: integer("recurring_end_occurrences"),
	createIfOverdue: boolean("create_if_overdue").default(false),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	startDate: timestamp("start_date", { mode: 'string' }),
	timeEstimate: integer("time_estimate"),
	timeTracked: integer("time_tracked").default(0),
	parentTaskId: varchar("parent_task_id"),
	level: integer().default(0),
	taskPath: text("task_path"),
	hasSubTasks: boolean("has_sub_tasks").default(false),
	categoryId: varchar("category_id"),
	workflowId: varchar("workflow_id"),
	visibleToClient: boolean("visible_to_client").default(false),
	requiresClientApproval: boolean("requires_client_approval").default(false),
	clientApprovalStatus: text("client_approval_status").default('pending'),
	clientApprovalNotes: text("client_approval_notes"),
	clientApprovalDate: timestamp("client_approval_date", { mode: 'string' }),
	leadId: varchar("lead_id"),
	fathomRecordingUrl: text("fathom_recording_url"),
	calendarEventId: varchar("calendar_event_id"),
	oneOnOneMeetingId: varchar("one_on_one_meeting_id"),
	tags: text().array().default([""]),
	statusHistory: jsonb("status_history").default([]),
	sourceTemplateId: varchar("source_template_id"),
	generationId: varchar("generation_id"),
}, (table) => [
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [staff.id],
			name: "tasks_assigned_to_staff_id_fk"
		}),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "tasks_campaign_id_campaigns_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "tasks_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "tasks_project_id_projects_id_fk"
		}),
]);

export const surveys = pgTable("surveys", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	status: text().default('draft').notNull(),
	shortCode: text("short_code"),
	folderId: varchar("folder_id"),
	settings: jsonb().default({}),
	styling: jsonb().default({}),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_surveys_folder").using("btree", table.folderId.asc().nullsLast().op("text_ops")),
	index("idx_surveys_short_code").using("btree", table.shortCode.asc().nullsLast().op("text_ops")),
	index("idx_surveys_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("surveys_short_code_unique").on(table.shortCode),
]);

export const surveyLogicRules = pgTable("survey_logic_rules", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	surveyId: varchar("survey_id").notNull(),
	sourceFieldId: varchar("source_field_id").notNull(),
	operator: text().notNull(),
	comparisonValue: text("comparison_value"),
	actionType: text("action_type").notNull(),
	targetFieldId: varchar("target_field_id"),
	targetSlideId: varchar("target_slide_id"),
	order: integer().default(0),
	enabled: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_survey_logic_rules_source_field").using("btree", table.sourceFieldId.asc().nullsLast().op("text_ops")),
	index("idx_survey_logic_rules_survey").using("btree", table.surveyId.asc().nullsLast().op("text_ops")),
]);

export const surveySubmissionAnswers = pgTable("survey_submission_answers", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	submissionId: varchar("submission_id").notNull(),
	fieldId: varchar("field_id").notNull(),
	value: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_survey_submission_answers_field").using("btree", table.fieldId.asc().nullsLast().op("text_ops")),
	index("idx_survey_submission_answers_submission").using("btree", table.submissionId.asc().nullsLast().op("text_ops")),
]);

export const surveySubmissions = pgTable("survey_submissions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	surveyId: varchar("survey_id").notNull(),
	submitterEmail: text("submitter_email"),
	submitterName: text("submitter_name"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	status: text().default('completed'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_survey_submissions_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_survey_submissions_survey").using("btree", table.surveyId.asc().nullsLast().op("text_ops")),
]);

export const surveyFolders = pgTable("survey_folders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	order: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const taskActivities = pgTable("task_activities", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	taskId: varchar("task_id").notNull(),
	actionType: varchar("action_type").notNull(),
	fieldName: varchar("field_name"),
	oldValue: text("old_value"),
	newValue: text("new_value"),
	userId: varchar("user_id"),
	userName: varchar("user_name"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_activities_task_id_tasks_id_fk"
		}).onDelete("cascade"),
]);

export const taskAttachments = pgTable("task_attachments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	taskId: varchar("task_id").notNull(),
	fileName: text("file_name").notNull(),
	fileType: text("file_type").notNull(),
	fileSize: integer("file_size").notNull(),
	fileUrl: text("file_url").notNull(),
	uploadedBy: uuid("uploaded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_attachments_task_id_tasks_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [staff.id],
			name: "task_attachments_uploaded_by_staff_id_fk"
		}),
]);

export const taskCommentReactions = pgTable("task_comment_reactions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	commentId: varchar("comment_id").notNull(),
	emoji: varchar().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	userId: uuid("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [taskComments.id],
			name: "task_comment_reactions_comment_id_task_comments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [staff.id],
			name: "task_comment_reactions_user_id_staff_id_fk"
		}).onDelete("cascade"),
]);

export const taskDependencies = pgTable("task_dependencies", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	taskId: varchar("task_id").notNull(),
	dependsOnTaskId: varchar("depends_on_task_id").notNull(),
	dependencyType: text("dependency_type").default('finish_to_start').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.dependsOnTaskId],
			foreignColumns: [tasks.id],
			name: "task_dependencies_depends_on_task_id_tasks_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_dependencies_task_id_tasks_id_fk"
		}).onDelete("cascade"),
]);

export const taskHistory = pgTable("task_history", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	taskId: varchar("task_id").notNull(),
	action: text().notNull(),
	field: text(),
	oldValue: jsonb("old_value"),
	newValue: jsonb("new_value"),
	userId: varchar("user_id").notNull(),
	timestamp: timestamp({ mode: 'string' }).notNull(),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [enhancedTasks.id],
			name: "task_history_task_id_enhanced_tasks_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "task_history_user_id_users_id_fk"
		}),
]);

export const taskIntakeQuestions = pgTable("task_intake_questions", {
	id: varchar().default((gen_random_uuid())).primaryKey().notNull(),
	formId: varchar("form_id").notNull(),
	questionText: text("question_text").notNull(),
	questionType: text("question_type").notNull(),
	helpText: text("help_text"),
	isRequired: boolean("is_required").default(true),
	order: integer().default(0).notNull(),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	internalLabel: text("internal_label"),
	sectionId: varchar("section_id"),
	tooltip: text(),
}, (table) => [
	index("idx_task_intake_questions_form").using("btree", table.formId.asc().nullsLast().op("text_ops")),
	index("idx_task_intake_questions_order").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	index("idx_task_intake_questions_section").using("btree", table.sectionId.asc().nullsLast().op("text_ops")),
]);

export const taskIntakeAnswers = pgTable("task_intake_answers", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	submissionId: varchar("submission_id").notNull(),
	questionId: varchar("question_id").notNull(),
	sectionId: varchar("section_id"),
	answerValue: text("answer_value"),
	wasVisible: boolean("was_visible").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_task_intake_answers_question").using("btree", table.questionId.asc().nullsLast().op("text_ops")),
	index("idx_task_intake_answers_submission").using("btree", table.submissionId.asc().nullsLast().op("text_ops")),
]);

export const taskIntakeSections = pgTable("task_intake_sections", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	formId: varchar("form_id").notNull(),
	sectionName: text("section_name").notNull(),
	internalLabel: text("internal_label"),
	orderIndex: integer("order_index").default(0).notNull(),
	visibilityConditions: jsonb("visibility_conditions"),
	descriptionTemplate: text("description_template"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_task_intake_sections_form").using("btree", table.formId.asc().nullsLast().op("text_ops")),
	index("idx_task_intake_sections_order").using("btree", table.orderIndex.asc().nullsLast().op("int4_ops")),
]);

export const taskIntakeSubmissions = pgTable("task_intake_submissions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	taskId: varchar("task_id"),
	formId: varchar("form_id").notNull(),
	submittedBy: uuid("submitted_by").notNull(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_task_intake_submissions_form").using("btree", table.formId.asc().nullsLast().op("text_ops")),
	index("idx_task_intake_submissions_task").using("btree", table.taskId.asc().nullsLast().op("text_ops")),
	index("idx_task_intake_submissions_user").using("btree", table.submittedBy.asc().nullsLast().op("uuid_ops")),
]);

export const taskIntakeAssignmentRules = pgTable("task_intake_assignment_rules", {
	id: varchar().default((gen_random_uuid())).primaryKey().notNull(),
	formId: varchar("form_id").notNull(),
	name: text().notNull(),
	conditions: jsonb().default([]).notNull(),
	assignToStaffId: uuid("assign_to_staff_id"),
	priority: integer().default(0),
	enabled: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	assignToRole: text("assign_to_role"),
	setCategoryId: varchar("set_category_id"),
	setTags: text("set_tags").array().default([""]),
}, (table) => [
	index("idx_task_intake_assignment_form").using("btree", table.formId.asc().nullsLast().op("text_ops")),
]);

export const taskIntakeForms = pgTable("task_intake_forms", {
	id: varchar().default((gen_random_uuid())).primaryKey().notNull(),
	name: text().default('Task Submission Form').notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const taskIntakeLogicRules = pgTable("task_intake_logic_rules", {
	id: varchar().default((gen_random_uuid())).primaryKey().notNull(),
	formId: varchar("form_id").notNull(),
	sourceQuestionId: varchar("source_question_id").notNull(),
	conditions: jsonb().default([]).notNull(),
	targetQuestionId: varchar("target_question_id"),
	isEndForm: boolean("is_end_form").default(false),
	order: integer().default(0),
	enabled: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_task_intake_logic_form").using("btree", table.formId.asc().nullsLast().op("text_ops")),
	index("idx_task_intake_logic_source").using("btree", table.sourceQuestionId.asc().nullsLast().op("text_ops")),
]);

export const taskIntakeOptions = pgTable("task_intake_options", {
	id: varchar().default((gen_random_uuid())).primaryKey().notNull(),
	questionId: varchar("question_id").notNull(),
	optionText: text("option_text").notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_task_intake_options_question").using("btree", table.questionId.asc().nullsLast().op("text_ops")),
]);

export const taskStatuses = pgTable("task_statuses", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	value: text().notNull(),
	color: text().default('#6b7280').notNull(),
	description: text(),
	sortOrder: integer("sort_order").default(0),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	isSystemStatus: boolean("is_system_status").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("task_statuses_name_unique").on(table.name),
	unique("task_statuses_value_unique").on(table.value),
]);

export const teamWorkflowStatuses = pgTable("team_workflow_statuses", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	workflowId: varchar("workflow_id").notNull(),
	statusId: varchar("status_id").notNull(),
	order: integer().default(0).notNull(),
	isRequired: boolean("is_required").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const ticketComments = pgTable("ticket_comments", {
	id: varchar().default((gen_random_uuid())).primaryKey().notNull(),
	ticketId: varchar("ticket_id").notNull(),
	authorId: uuid("author_id").notNull(),
	content: text().notNull(),
	isInternal: boolean("is_internal").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ticket_comments_ticket").using("btree", table.ticketId.asc().nullsLast().op("text_ops")),
]);

export const ticketAttachments = pgTable("ticket_attachments", {
	id: varchar().default((gen_random_uuid())).primaryKey().notNull(),
	ticketId: varchar("ticket_id").notNull(),
	commentId: varchar("comment_id"),
	fileName: text("file_name").notNull(),
	fileType: text("file_type"),
	fileSize: integer("file_size"),
	fileUrl: text("file_url").notNull(),
	uploadedBy: uuid("uploaded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ticket_attachments_ticket").using("btree", table.ticketId.asc().nullsLast().op("text_ops")),
]);

export const timeOffRequestDays = pgTable("time_off_request_days", {
	id: varchar().default((gen_random_uuid())).primaryKey().notNull(),
	timeOffRequestId: varchar("time_off_request_id").notNull(),
	date: date().notNull(),
	hours: numeric({ precision: 5, scale:  2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const timeOffTypes = pgTable("time_off_types", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	policyId: varchar("policy_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	defaultDaysPerYear: integer("default_days_per_year").default(0).notNull(),
	allowCarryOver: boolean("allow_carry_over").default(false),
	maxCarryOverDays: integer("max_carry_over_days").default(0),
	color: varchar({ length: 50 }).default('bg-blue-100 text-blue-800'),
	isActive: boolean("is_active").default(true),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const toolDirectoryCategories = pgTable("tool_directory_categories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	icon: text(),
	color: text(),
	order: integer().default(0),
	isActive: boolean("is_active").default(true),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const toolDirectoryTools = pgTable("tool_directory_tools", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	url: text().notNull(),
	logoUrl: text("logo_url"),
	categoryId: varchar("category_id"),
	tags: text().array(),
	isFeatured: boolean("is_featured").default(false),
	isActive: boolean("is_active").default(true),
	order: integer().default(0),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_tool_directory_tools_category").using("btree", table.categoryId.asc().nullsLast().op("text_ops")),
]);

export const trainingAssignments = pgTable("training_assignments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	lessonId: varchar("lesson_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	instructions: text(),
	allowedFileTypes: text("allowed_file_types").array(),
	maxFileSize: integer("max_file_size").default(10),
	maxFiles: integer("max_files").default(1),
	isRequired: boolean("is_required").default(true),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	templateFiles: jsonb("template_files"),
});

export const trainingAssignmentSubmissions = pgTable("training_assignment_submissions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	assignmentId: varchar("assignment_id").notNull(),
	userId: uuid("user_id").notNull(),
	enrollmentId: varchar("enrollment_id").notNull(),
	submissionText: text("submission_text"),
	files: jsonb(),
	status: text().default('submitted'),
	grade: integer(),
	feedback: text(),
	gradedBy: uuid("graded_by"),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow(),
	gradedAt: timestamp("graded_at", { mode: 'string' }),
});

export const trainingEnrollments = pgTable("training_enrollments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	courseId: varchar("course_id").notNull(),
	userId: uuid("user_id").notNull(),
	status: text().default('enrolled'),
	progress: integer().default(0),
	completedLessons: integer("completed_lessons").default(0),
	totalLessons: integer("total_lessons").default(0),
	enrolledAt: timestamp("enrolled_at", { mode: 'string' }).defaultNow(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	lastAccessedAt: timestamp("last_accessed_at", { mode: 'string' }),
});

export const trainingLessons = pgTable("training_lessons", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	courseId: varchar("course_id").notNull(),
	title: text().notNull(),
	description: text(),
	content: text(),
	contentType: text("content_type").notNull(),
	videoUrl: text("video_url"),
	videoEmbedId: text("video_embed_id"),
	videoDuration: integer("video_duration"),
	pdfUrl: text("pdf_url"),
	order: integer().default(0),
	isRequired: boolean("is_required").default(true),
	canDownload: boolean("can_download").default(false),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	moduleId: varchar("module_id"),
	isLocked: boolean("is_locked").default(false),
});

export const trainingCourses = pgTable("training_courses", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	shortDescription: text("short_description"),
	categoryId: varchar("category_id"),
	tags: text().array(),
	thumbnailUrl: text("thumbnail_url"),
	estimatedDuration: integer("estimated_duration"),
	difficulty: text().default('beginner'),
	isPublished: boolean("is_published").default(false),
	order: integer().default(0),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const trainingCoursePermissions = pgTable("training_course_permissions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	courseId: varchar("course_id").notNull(),
	accessType: text("access_type").notNull(),
	accessId: text("access_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const trainingCategories = pgTable("training_categories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	color: text().default('#3B82F6'),
	order: integer().default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const trainingDiscussions = pgTable("training_discussions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	courseId: varchar("course_id"),
	lessonId: varchar("lesson_id"),
	userId: uuid("user_id").notNull(),
	parentId: varchar("parent_id"),
	content: text().notNull(),
	isInstructor: boolean("is_instructor").default(false),
	isPinned: boolean("is_pinned").default(false),
	likesCount: integer("likes_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const trainingDiscussionLikes = pgTable("training_discussion_likes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	discussionId: varchar("discussion_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const trainingModules = pgTable("training_modules", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	courseId: varchar("course_id").notNull(),
	title: text().notNull(),
	description: text(),
	order: integer().default(0),
	isRequired: boolean("is_required").default(true),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const trainingProgress = pgTable("training_progress", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	enrollmentId: varchar("enrollment_id").notNull(),
	lessonId: varchar("lesson_id").notNull(),
	userId: uuid("user_id").notNull(),
	status: text().default('not_started'),
	watchTime: integer("watch_time").default(0),
	completionPercentage: integer("completion_percentage").default(0),
	firstStartedAt: timestamp("first_started_at", { mode: 'string' }),
	lastAccessedAt: timestamp("last_accessed_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const trainingQuizAttempts = pgTable("training_quiz_attempts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	quizId: varchar("quiz_id").notNull(),
	userId: uuid("user_id").notNull(),
	enrollmentId: varchar("enrollment_id").notNull(),
	score: integer().default(0),
	totalPoints: integer("total_points").default(0),
	earnedPoints: integer("earned_points").default(0),
	answers: jsonb(),
	isPassed: boolean("is_passed").default(false),
	attemptNumber: integer("attempt_number").default(1),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	timeSpent: integer("time_spent"),
});

export const trainingQuizzes = pgTable("training_quizzes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	lessonId: varchar("lesson_id").notNull(),
	title: text().notNull(),
	description: text(),
	passingScore: integer("passing_score").default(70),
	maxAttempts: integer("max_attempts").default(3),
	timeLimit: integer("time_limit"),
	shuffleQuestions: boolean("shuffle_questions").default(false),
	showCorrectAnswers: boolean("show_correct_answers").default(true),
	isRequired: boolean("is_required").default(true),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const trainingQuizQuestions = pgTable("training_quiz_questions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	quizId: varchar("quiz_id").notNull(),
	question: text().notNull(),
	questionType: text("question_type").default('multiple_choice'),
	options: jsonb(),
	correctAnswer: text("correct_answer").notNull(),
	explanation: text(),
	points: integer().default(1),
	order: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const userDashboardWidgets = pgTable("user_dashboard_widgets", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	widgetType: text("widget_type").notNull(),
	x: integer().default(0).notNull(),
	y: integer().default(0).notNull(),
	width: integer().default(2).notNull(),
	height: integer().default(2).notNull(),
	settings: jsonb().default({}),
	isVisible: boolean("is_visible").default(true),
	order: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	dashboardId: varchar("dashboard_id"),
});

export const timeOffRequests = pgTable("time_off_requests", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	staffId: uuid("staff_id").notNull(),
	type: varchar().notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	totalDays: numeric("total_days").notNull(),
	reason: text(),
	status: varchar().default('pending').notNull(),
	managerNotes: text("manager_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	totalHours: numeric("total_hours", { precision: 5, scale:  2 }).default('0'),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	timeOffTypeId: varchar("time_off_type_id"),
});

export const trainingLessonResources = pgTable("training_lesson_resources", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	lessonId: varchar("lesson_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	description: text(),
	url: text(),
	fileName: text("file_name"),
	fileSize: integer("file_size"),
	order: integer().default(0),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const userRoles = pgTable("user_roles", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	roleId: varchar("role_id").notNull(),
	assignedBy: uuid("assigned_by"),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [staff.id],
			name: "user_roles_assigned_by_staff_id_fk"
		}),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [staff.id],
			name: "user_roles_user_id_staff_id_fk"
		}).onDelete("cascade"),
]);

export const userViewPreferences = pgTable("user_view_preferences", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	viewType: text("view_type").notNull(),
	preferences: jsonb().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("user_view_preferences_user_id_view_type_unique").on(table.userId, table.viewType),
]);

export const workflowActionAnalytics = pgTable("workflow_action_analytics", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	workflowId: varchar("workflow_id").notNull(),
	actionType: text("action_type").notNull(),
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
	smsSent: integer("sms_sent").default(0),
	smsDelivered: integer("sms_delivered").default(0),
	smsClicked: integer("sms_clicked").default(0),
	smsFailed: integer("sms_failed").default(0),
	smsOptedOut: integer("sms_opted_out").default(0),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_workflow_action_analytics_workflow_action").using("btree", table.workflowId.asc().nullsLast().op("text_ops"), table.actionType.asc().nullsLast().op("text_ops")),
	index("idx_workflow_action_analytics_workflow_id").using("btree", table.workflowId.asc().nullsLast().op("text_ops")),
]);

export const workflowExecutions = pgTable("workflow_executions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	workflowId: varchar("workflow_id").notNull(),
	contactId: varchar("contact_id"),
	triggerData: jsonb("trigger_data"),
	status: text().notNull(),
	currentStep: integer("current_step").default(0),
	totalSteps: integer("total_steps").notNull(),
	executionLog: jsonb("execution_log"),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { mode: 'string' }).notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	nextRunAt: timestamp("next_run_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [clients.id],
			name: "workflow_executions_contact_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "workflow_executions_workflow_id_workflows_id_fk"
		}),
]);

export const workflowTemplates = pgTable("workflow_templates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	category: text().notNull(),
	industry: text(),
	useCase: text("use_case"),
	actions: jsonb().notNull(),
	conditions: jsonb(),
	settings: jsonb(),
	isPublic: boolean("is_public").default(false),
	usageCount: integer("usage_count").default(0),
	rating: numeric({ precision: 3, scale:  2 }),
	tags: text().array(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	triggers: jsonb().default([]).notNull(),
	workflowId: varchar("workflow_id").notNull(),
}, (table) => [
	unique("workflow_templates_workflow_id_unique").on(table.workflowId),
]);
