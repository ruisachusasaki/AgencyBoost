import { relations } from "drizzle-orm/relations";
import { taskCategories, productTaskTemplates, teamWorkflows, staff, clients, clientGroups, activities, calendarAppointments, calendars, appointments, users, roles, auditLogs, productBundles, bundleProducts, products, productCategories, calendarAvailability, calendarDateOverrides, clientAppointments, calendarIntegrations, calendarStaff, clientBundles, clientDocuments, clientNotes, clientProducts, campaigns, projects, clientTasks, clientTransactions, taskComments, tasks, commentFiles, customFieldFileUploads, customFields, customFieldFolders, leads, leadPipelineStages, documents, emailTemplates, templateFolders, enhancedTasks, taskTemplates, workflows, formFields, forms, formFolders, formSubmissions, imageAnnotations, invoices, leadAppointments, leadNotes, notes, notificationSettings, permissionAuditLogs, permissions, roundRobinTracking, smsTemplates, socialMediaAccounts, socialMediaAnalytics, socialMediaPosts, socialMediaTemplates, taskActivities, taskAttachments, taskCommentReactions, taskDependencies, taskHistory, userRoles, workflowExecutions } from "./schema";

export const productTaskTemplatesRelations = relations(productTaskTemplates, ({one}) => ({
	taskCategory: one(taskCategories, {
		fields: [productTaskTemplates.categoryId],
		references: [taskCategories.id]
	}),
	teamWorkflow: one(teamWorkflows, {
		fields: [productTaskTemplates.workflowId],
		references: [teamWorkflows.id]
	}),
}));

export const taskCategoriesRelations = relations(taskCategories, ({many}) => ({
	productTaskTemplates: many(productTaskTemplates),
	enhancedTasks: many(enhancedTasks),
	taskTemplates: many(taskTemplates),
}));

export const teamWorkflowsRelations = relations(teamWorkflows, ({many}) => ({
	productTaskTemplates: many(productTaskTemplates),
}));

export const clientsRelations = relations(clients, ({one, many}) => ({
	staff: one(staff, {
		fields: [clients.contactOwner],
		references: [staff.id]
	}),
	clientGroup: one(clientGroups, {
		fields: [clients.groupId],
		references: [clientGroups.id]
	}),
	activities: many(activities),
	calendarAppointments: many(calendarAppointments),
	appointments: many(appointments),
	clientAppointments: many(clientAppointments),
	clientBundles: many(clientBundles),
	clientDocuments: many(clientDocuments),
	clientNotes: many(clientNotes),
	clientProducts: many(clientProducts),
	campaigns: many(campaigns),
	clientTasks: many(clientTasks),
	clientTransactions: many(clientTransactions),
	customFieldFileUploads: many(customFieldFileUploads),
	documents: many(documents),
	enhancedTasks: many(enhancedTasks),
	workflows: many(workflows),
	invoices: many(invoices),
	notes: many(notes),
	socialMediaAccounts: many(socialMediaAccounts),
	socialMediaPosts: many(socialMediaPosts),
	socialMediaTemplates: many(socialMediaTemplates),
	tasks: many(tasks),
	workflowExecutions: many(workflowExecutions),
}));

export const staffRelations = relations(staff, ({one, many}) => ({
	clients: many(clients),
	calendarAppointments_assignedTo: many(calendarAppointments, {
		relationName: "calendarAppointments_assignedTo_staff_id"
	}),
	calendarAppointments_cancelledBy: many(calendarAppointments, {
		relationName: "calendarAppointments_cancelledBy_staff_id"
	}),
	role: one(roles, {
		fields: [staff.roleId],
		references: [roles.id]
	}),
	auditLogs: many(auditLogs),
	calendars: many(calendars),
	calendarAvailabilities: many(calendarAvailability),
	calendarDateOverrides: many(calendarDateOverrides),
	clientAppointments: many(clientAppointments),
	calendarIntegrations: many(calendarIntegrations),
	calendarStaffs: many(calendarStaff),
	clientDocuments: many(clientDocuments),
	clientNotes_createdById: many(clientNotes, {
		relationName: "clientNotes_createdById_staff_id"
	}),
	clientNotes_editedBy: many(clientNotes, {
		relationName: "clientNotes_editedBy_staff_id"
	}),
	clientTasks_assignedTo: many(clientTasks, {
		relationName: "clientTasks_assignedTo_staff_id"
	}),
	clientTasks_createdBy: many(clientTasks, {
		relationName: "clientTasks_createdBy_staff_id"
	}),
	taskComments: many(taskComments),
	commentFiles: many(commentFiles),
	customFieldFileUploads: many(customFieldFileUploads),
	leads: many(leads),
	emailTemplates: many(emailTemplates),
	enhancedTasks: many(enhancedTasks),
	taskTemplates: many(taskTemplates),
	forms: many(forms),
	imageAnnotations: many(imageAnnotations),
	leadAppointments_assignedTo: many(leadAppointments, {
		relationName: "leadAppointments_assignedTo_staff_id"
	}),
	leadAppointments_createdBy: many(leadAppointments, {
		relationName: "leadAppointments_createdBy_staff_id"
	}),
	leadNotes: many(leadNotes),
	notificationSettings: many(notificationSettings),
	permissionAuditLogs_performedBy: many(permissionAuditLogs, {
		relationName: "permissionAuditLogs_performedBy_staff_id"
	}),
	permissionAuditLogs_targetUserId: many(permissionAuditLogs, {
		relationName: "permissionAuditLogs_targetUserId_staff_id"
	}),
	roundRobinTrackings: many(roundRobinTracking),
	smsTemplates: many(smsTemplates),
	tasks: many(tasks),
	taskAttachments: many(taskAttachments),
	taskCommentReactions: many(taskCommentReactions),
	userRoles_assignedBy: many(userRoles, {
		relationName: "userRoles_assignedBy_staff_id"
	}),
	userRoles_userId: many(userRoles, {
		relationName: "userRoles_userId_staff_id"
	}),
}));

export const clientGroupsRelations = relations(clientGroups, ({many}) => ({
	clients: many(clients),
}));

export const activitiesRelations = relations(activities, ({one}) => ({
	client: one(clients, {
		fields: [activities.clientId],
		references: [clients.id]
	}),
}));

export const calendarAppointmentsRelations = relations(calendarAppointments, ({one}) => ({
	staff_assignedTo: one(staff, {
		fields: [calendarAppointments.assignedTo],
		references: [staff.id],
		relationName: "calendarAppointments_assignedTo_staff_id"
	}),
	calendar: one(calendars, {
		fields: [calendarAppointments.calendarId],
		references: [calendars.id]
	}),
	staff_cancelledBy: one(staff, {
		fields: [calendarAppointments.cancelledBy],
		references: [staff.id],
		relationName: "calendarAppointments_cancelledBy_staff_id"
	}),
	client: one(clients, {
		fields: [calendarAppointments.clientId],
		references: [clients.id]
	}),
}));

export const calendarsRelations = relations(calendars, ({one, many}) => ({
	calendarAppointments: many(calendarAppointments),
	staff: one(staff, {
		fields: [calendars.createdBy],
		references: [staff.id]
	}),
	calendarAvailabilities: many(calendarAvailability),
	calendarDateOverrides: many(calendarDateOverrides),
	calendarStaffs: many(calendarStaff),
	leadAppointments: many(leadAppointments),
	roundRobinTrackings: many(roundRobinTracking),
}));

export const appointmentsRelations = relations(appointments, ({one}) => ({
	client: one(clients, {
		fields: [appointments.clientId],
		references: [clients.id]
	}),
	user: one(users, {
		fields: [appointments.scheduledBy],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	appointments: many(appointments),
	enhancedTasks: many(enhancedTasks),
	notes: many(notes),
	socialMediaPosts_approvedBy: many(socialMediaPosts, {
		relationName: "socialMediaPosts_approvedBy_users_id"
	}),
	socialMediaPosts_authorId: many(socialMediaPosts, {
		relationName: "socialMediaPosts_authorId_users_id"
	}),
	socialMediaPosts_rejectedBy: many(socialMediaPosts, {
		relationName: "socialMediaPosts_rejectedBy_users_id"
	}),
	socialMediaTemplates: many(socialMediaTemplates),
	taskHistories: many(taskHistory),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	staff: many(staff),
	permissionAuditLogs: many(permissionAuditLogs),
	permissions: many(permissions),
	userRoles: many(userRoles),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	staff: one(staff, {
		fields: [auditLogs.userId],
		references: [staff.id]
	}),
}));

export const bundleProductsRelations = relations(bundleProducts, ({one}) => ({
	productBundle: one(productBundles, {
		fields: [bundleProducts.bundleId],
		references: [productBundles.id]
	}),
	product: one(products, {
		fields: [bundleProducts.productId],
		references: [products.id]
	}),
}));

export const productBundlesRelations = relations(productBundles, ({many}) => ({
	bundleProducts: many(bundleProducts),
	clientBundles: many(clientBundles),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	bundleProducts: many(bundleProducts),
	productCategory: one(productCategories, {
		fields: [products.categoryId],
		references: [productCategories.id]
	}),
	clientProducts: many(clientProducts),
}));

export const productCategoriesRelations = relations(productCategories, ({many}) => ({
	products: many(products),
}));

export const calendarAvailabilityRelations = relations(calendarAvailability, ({one}) => ({
	calendar: one(calendars, {
		fields: [calendarAvailability.calendarId],
		references: [calendars.id]
	}),
	staff: one(staff, {
		fields: [calendarAvailability.staffId],
		references: [staff.id]
	}),
}));

export const calendarDateOverridesRelations = relations(calendarDateOverrides, ({one}) => ({
	calendar: one(calendars, {
		fields: [calendarDateOverrides.calendarId],
		references: [calendars.id]
	}),
	staff: one(staff, {
		fields: [calendarDateOverrides.staffId],
		references: [staff.id]
	}),
}));

export const clientAppointmentsRelations = relations(clientAppointments, ({one}) => ({
	client: one(clients, {
		fields: [clientAppointments.clientId],
		references: [clients.id]
	}),
	staff: one(staff, {
		fields: [clientAppointments.createdBy],
		references: [staff.id]
	}),
}));

export const calendarIntegrationsRelations = relations(calendarIntegrations, ({one}) => ({
	staff: one(staff, {
		fields: [calendarIntegrations.staffId],
		references: [staff.id]
	}),
}));

export const calendarStaffRelations = relations(calendarStaff, ({one}) => ({
	calendar: one(calendars, {
		fields: [calendarStaff.calendarId],
		references: [calendars.id]
	}),
	staff: one(staff, {
		fields: [calendarStaff.staffId],
		references: [staff.id]
	}),
}));

export const clientBundlesRelations = relations(clientBundles, ({one}) => ({
	productBundle: one(productBundles, {
		fields: [clientBundles.bundleId],
		references: [productBundles.id]
	}),
	client: one(clients, {
		fields: [clientBundles.clientId],
		references: [clients.id]
	}),
}));

export const clientDocumentsRelations = relations(clientDocuments, ({one}) => ({
	client: one(clients, {
		fields: [clientDocuments.clientId],
		references: [clients.id]
	}),
	staff: one(staff, {
		fields: [clientDocuments.uploadedBy],
		references: [staff.id]
	}),
}));

export const clientNotesRelations = relations(clientNotes, ({one}) => ({
	client: one(clients, {
		fields: [clientNotes.clientId],
		references: [clients.id]
	}),
	staff_createdById: one(staff, {
		fields: [clientNotes.createdById],
		references: [staff.id],
		relationName: "clientNotes_createdById_staff_id"
	}),
	staff_editedBy: one(staff, {
		fields: [clientNotes.editedBy],
		references: [staff.id],
		relationName: "clientNotes_editedBy_staff_id"
	}),
}));

export const clientProductsRelations = relations(clientProducts, ({one}) => ({
	client: one(clients, {
		fields: [clientProducts.clientId],
		references: [clients.id]
	}),
	product: one(products, {
		fields: [clientProducts.productId],
		references: [products.id]
	}),
}));

export const campaignsRelations = relations(campaigns, ({one, many}) => ({
	client: one(clients, {
		fields: [campaigns.clientId],
		references: [clients.id]
	}),
	project: one(projects, {
		fields: [campaigns.projectId],
		references: [projects.id]
	}),
	enhancedTasks: many(enhancedTasks),
	socialMediaPosts: many(socialMediaPosts),
	tasks: many(tasks),
}));

export const projectsRelations = relations(projects, ({many}) => ({
	campaigns: many(campaigns),
	invoices: many(invoices),
	tasks: many(tasks),
}));

export const clientTasksRelations = relations(clientTasks, ({one}) => ({
	staff_assignedTo: one(staff, {
		fields: [clientTasks.assignedTo],
		references: [staff.id],
		relationName: "clientTasks_assignedTo_staff_id"
	}),
	client: one(clients, {
		fields: [clientTasks.clientId],
		references: [clients.id]
	}),
	staff_createdBy: one(staff, {
		fields: [clientTasks.createdBy],
		references: [staff.id],
		relationName: "clientTasks_createdBy_staff_id"
	}),
}));

export const clientTransactionsRelations = relations(clientTransactions, ({one}) => ({
	client: one(clients, {
		fields: [clientTransactions.clientId],
		references: [clients.id]
	}),
}));

export const taskCommentsRelations = relations(taskComments, ({one, many}) => ({
	staff: one(staff, {
		fields: [taskComments.authorId],
		references: [staff.id]
	}),
	task: one(tasks, {
		fields: [taskComments.taskId],
		references: [tasks.id]
	}),
	commentFiles: many(commentFiles),
	taskCommentReactions: many(taskCommentReactions),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	taskComments: many(taskComments),
	staff: one(staff, {
		fields: [tasks.assignedTo],
		references: [staff.id]
	}),
	campaign: one(campaigns, {
		fields: [tasks.campaignId],
		references: [campaigns.id]
	}),
	client: one(clients, {
		fields: [tasks.clientId],
		references: [clients.id]
	}),
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
	taskActivities: many(taskActivities),
	taskAttachments: many(taskAttachments),
	taskDependencies_dependsOnTaskId: many(taskDependencies, {
		relationName: "taskDependencies_dependsOnTaskId_tasks_id"
	}),
	taskDependencies_taskId: many(taskDependencies, {
		relationName: "taskDependencies_taskId_tasks_id"
	}),
}));

export const commentFilesRelations = relations(commentFiles, ({one}) => ({
	taskComment: one(taskComments, {
		fields: [commentFiles.commentId],
		references: [taskComments.id]
	}),
	staff: one(staff, {
		fields: [commentFiles.uploadedBy],
		references: [staff.id]
	}),
}));

export const customFieldFileUploadsRelations = relations(customFieldFileUploads, ({one}) => ({
	client: one(clients, {
		fields: [customFieldFileUploads.clientId],
		references: [clients.id]
	}),
	customField: one(customFields, {
		fields: [customFieldFileUploads.customFieldId],
		references: [customFields.id]
	}),
	staff: one(staff, {
		fields: [customFieldFileUploads.uploadedBy],
		references: [staff.id]
	}),
}));

export const customFieldsRelations = relations(customFields, ({one, many}) => ({
	customFieldFileUploads: many(customFieldFileUploads),
	customFieldFolder: one(customFieldFolders, {
		fields: [customFields.folderId],
		references: [customFieldFolders.id]
	}),
	formFields: many(formFields),
}));

export const customFieldFoldersRelations = relations(customFieldFolders, ({many}) => ({
	customFields: many(customFields),
}));

export const leadsRelations = relations(leads, ({one, many}) => ({
	staff: one(staff, {
		fields: [leads.assignedTo],
		references: [staff.id]
	}),
	leadPipelineStage: one(leadPipelineStages, {
		fields: [leads.stageId],
		references: [leadPipelineStages.id]
	}),
	leadAppointments: many(leadAppointments),
	leadNotes: many(leadNotes),
}));

export const leadPipelineStagesRelations = relations(leadPipelineStages, ({many}) => ({
	leads: many(leads),
}));

export const documentsRelations = relations(documents, ({one}) => ({
	client: one(clients, {
		fields: [documents.clientId],
		references: [clients.id]
	}),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({one}) => ({
	staff: one(staff, {
		fields: [emailTemplates.createdBy],
		references: [staff.id]
	}),
	templateFolder: one(templateFolders, {
		fields: [emailTemplates.folderId],
		references: [templateFolders.id]
	}),
}));

export const templateFoldersRelations = relations(templateFolders, ({many}) => ({
	emailTemplates: many(emailTemplates),
	smsTemplates: many(smsTemplates),
}));

export const enhancedTasksRelations = relations(enhancedTasks, ({one, many}) => ({
	staff: one(staff, {
		fields: [enhancedTasks.assignedTo],
		references: [staff.id]
	}),
	campaign: one(campaigns, {
		fields: [enhancedTasks.campaignId],
		references: [campaigns.id]
	}),
	taskCategory: one(taskCategories, {
		fields: [enhancedTasks.categoryId],
		references: [taskCategories.id]
	}),
	client: one(clients, {
		fields: [enhancedTasks.clientId],
		references: [clients.id]
	}),
	user: one(users, {
		fields: [enhancedTasks.createdBy],
		references: [users.id]
	}),
	taskTemplate: one(taskTemplates, {
		fields: [enhancedTasks.templateId],
		references: [taskTemplates.id]
	}),
	workflow: one(workflows, {
		fields: [enhancedTasks.workflowId],
		references: [workflows.id]
	}),
	taskHistories: many(taskHistory),
}));

export const taskTemplatesRelations = relations(taskTemplates, ({one, many}) => ({
	enhancedTasks: many(enhancedTasks),
	taskCategory: one(taskCategories, {
		fields: [taskTemplates.categoryId],
		references: [taskCategories.id]
	}),
	staff: one(staff, {
		fields: [taskTemplates.createdBy],
		references: [staff.id]
	}),
}));

export const workflowsRelations = relations(workflows, ({one, many}) => ({
	enhancedTasks: many(enhancedTasks),
	client: one(clients, {
		fields: [workflows.clientId],
		references: [clients.id]
	}),
	workflowExecutions: many(workflowExecutions),
}));

export const formFieldsRelations = relations(formFields, ({one}) => ({
	customField: one(customFields, {
		fields: [formFields.customFieldId],
		references: [customFields.id]
	}),
	form: one(forms, {
		fields: [formFields.formId],
		references: [forms.id]
	}),
}));

export const formsRelations = relations(forms, ({one, many}) => ({
	formFields: many(formFields),
	staff: one(staff, {
		fields: [forms.createdBy],
		references: [staff.id]
	}),
	formFolder: one(formFolders, {
		fields: [forms.folderId],
		references: [formFolders.id]
	}),
	formSubmissions: many(formSubmissions),
}));

export const formFoldersRelations = relations(formFolders, ({many}) => ({
	forms: many(forms),
}));

export const formSubmissionsRelations = relations(formSubmissions, ({one}) => ({
	form: one(forms, {
		fields: [formSubmissions.formId],
		references: [forms.id]
	}),
}));

export const imageAnnotationsRelations = relations(imageAnnotations, ({one}) => ({
	staff: one(staff, {
		fields: [imageAnnotations.authorId],
		references: [staff.id]
	}),
}));

export const invoicesRelations = relations(invoices, ({one}) => ({
	client: one(clients, {
		fields: [invoices.clientId],
		references: [clients.id]
	}),
	project: one(projects, {
		fields: [invoices.projectId],
		references: [projects.id]
	}),
}));

export const leadAppointmentsRelations = relations(leadAppointments, ({one}) => ({
	staff_assignedTo: one(staff, {
		fields: [leadAppointments.assignedTo],
		references: [staff.id],
		relationName: "leadAppointments_assignedTo_staff_id"
	}),
	calendar: one(calendars, {
		fields: [leadAppointments.calendarId],
		references: [calendars.id]
	}),
	staff_createdBy: one(staff, {
		fields: [leadAppointments.createdBy],
		references: [staff.id],
		relationName: "leadAppointments_createdBy_staff_id"
	}),
	lead: one(leads, {
		fields: [leadAppointments.leadId],
		references: [leads.id]
	}),
}));

export const leadNotesRelations = relations(leadNotes, ({one}) => ({
	staff: one(staff, {
		fields: [leadNotes.authorId],
		references: [staff.id]
	}),
	lead: one(leads, {
		fields: [leadNotes.leadId],
		references: [leads.id]
	}),
}));

export const notesRelations = relations(notes, ({one}) => ({
	user: one(users, {
		fields: [notes.authorId],
		references: [users.id]
	}),
	client: one(clients, {
		fields: [notes.clientId],
		references: [clients.id]
	}),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({one}) => ({
	staff: one(staff, {
		fields: [notificationSettings.userId],
		references: [staff.id]
	}),
}));

export const permissionAuditLogsRelations = relations(permissionAuditLogs, ({one}) => ({
	staff_performedBy: one(staff, {
		fields: [permissionAuditLogs.performedBy],
		references: [staff.id],
		relationName: "permissionAuditLogs_performedBy_staff_id"
	}),
	role: one(roles, {
		fields: [permissionAuditLogs.roleId],
		references: [roles.id]
	}),
	staff_targetUserId: one(staff, {
		fields: [permissionAuditLogs.targetUserId],
		references: [staff.id],
		relationName: "permissionAuditLogs_targetUserId_staff_id"
	}),
}));

export const permissionsRelations = relations(permissions, ({one}) => ({
	role: one(roles, {
		fields: [permissions.roleId],
		references: [roles.id]
	}),
}));

export const roundRobinTrackingRelations = relations(roundRobinTracking, ({one}) => ({
	calendar: one(calendars, {
		fields: [roundRobinTracking.calendarId],
		references: [calendars.id]
	}),
	staff: one(staff, {
		fields: [roundRobinTracking.lastAssignedStaffId],
		references: [staff.id]
	}),
}));

export const smsTemplatesRelations = relations(smsTemplates, ({one}) => ({
	staff: one(staff, {
		fields: [smsTemplates.createdBy],
		references: [staff.id]
	}),
	templateFolder: one(templateFolders, {
		fields: [smsTemplates.folderId],
		references: [templateFolders.id]
	}),
}));

export const socialMediaAccountsRelations = relations(socialMediaAccounts, ({one, many}) => ({
	client: one(clients, {
		fields: [socialMediaAccounts.clientId],
		references: [clients.id]
	}),
	socialMediaAnalytics: many(socialMediaAnalytics),
	socialMediaPosts: many(socialMediaPosts),
}));

export const socialMediaAnalyticsRelations = relations(socialMediaAnalytics, ({one}) => ({
	socialMediaAccount: one(socialMediaAccounts, {
		fields: [socialMediaAnalytics.accountId],
		references: [socialMediaAccounts.id]
	}),
}));

export const socialMediaPostsRelations = relations(socialMediaPosts, ({one}) => ({
	socialMediaAccount: one(socialMediaAccounts, {
		fields: [socialMediaPosts.accountId],
		references: [socialMediaAccounts.id]
	}),
	user_approvedBy: one(users, {
		fields: [socialMediaPosts.approvedBy],
		references: [users.id],
		relationName: "socialMediaPosts_approvedBy_users_id"
	}),
	user_authorId: one(users, {
		fields: [socialMediaPosts.authorId],
		references: [users.id],
		relationName: "socialMediaPosts_authorId_users_id"
	}),
	campaign: one(campaigns, {
		fields: [socialMediaPosts.campaignId],
		references: [campaigns.id]
	}),
	client: one(clients, {
		fields: [socialMediaPosts.clientId],
		references: [clients.id]
	}),
	user_rejectedBy: one(users, {
		fields: [socialMediaPosts.rejectedBy],
		references: [users.id],
		relationName: "socialMediaPosts_rejectedBy_users_id"
	}),
}));

export const socialMediaTemplatesRelations = relations(socialMediaTemplates, ({one}) => ({
	user: one(users, {
		fields: [socialMediaTemplates.authorId],
		references: [users.id]
	}),
	client: one(clients, {
		fields: [socialMediaTemplates.clientId],
		references: [clients.id]
	}),
}));

export const taskActivitiesRelations = relations(taskActivities, ({one}) => ({
	task: one(tasks, {
		fields: [taskActivities.taskId],
		references: [tasks.id]
	}),
}));

export const taskAttachmentsRelations = relations(taskAttachments, ({one}) => ({
	task: one(tasks, {
		fields: [taskAttachments.taskId],
		references: [tasks.id]
	}),
	staff: one(staff, {
		fields: [taskAttachments.uploadedBy],
		references: [staff.id]
	}),
}));

export const taskCommentReactionsRelations = relations(taskCommentReactions, ({one}) => ({
	taskComment: one(taskComments, {
		fields: [taskCommentReactions.commentId],
		references: [taskComments.id]
	}),
	staff: one(staff, {
		fields: [taskCommentReactions.userId],
		references: [staff.id]
	}),
}));

export const taskDependenciesRelations = relations(taskDependencies, ({one}) => ({
	task_dependsOnTaskId: one(tasks, {
		fields: [taskDependencies.dependsOnTaskId],
		references: [tasks.id],
		relationName: "taskDependencies_dependsOnTaskId_tasks_id"
	}),
	task_taskId: one(tasks, {
		fields: [taskDependencies.taskId],
		references: [tasks.id],
		relationName: "taskDependencies_taskId_tasks_id"
	}),
}));

export const taskHistoryRelations = relations(taskHistory, ({one}) => ({
	enhancedTask: one(enhancedTasks, {
		fields: [taskHistory.taskId],
		references: [enhancedTasks.id]
	}),
	user: one(users, {
		fields: [taskHistory.userId],
		references: [users.id]
	}),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	staff_assignedBy: one(staff, {
		fields: [userRoles.assignedBy],
		references: [staff.id],
		relationName: "userRoles_assignedBy_staff_id"
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
	staff_userId: one(staff, {
		fields: [userRoles.userId],
		references: [staff.id],
		relationName: "userRoles_userId_staff_id"
	}),
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({one}) => ({
	client: one(clients, {
		fields: [workflowExecutions.contactId],
		references: [clients.id]
	}),
	workflow: one(workflows, {
		fields: [workflowExecutions.workflowId],
		references: [workflows.id]
	}),
}));