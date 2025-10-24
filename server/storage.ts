import { 
  type Client, type InsertClient, clients,
  // Projects removed from system
  type Campaign, type InsertCampaign, campaigns,
  type Lead, type InsertLead, leads,
  type Quote, type InsertQuote, quotes,
  type Task, type InsertTask, tasks,
  type Invoice, type InsertInvoice, invoices,
  type User, type InsertUser,
  type AuditLog, type InsertAuditLog,
  type CustomField, type InsertCustomField,
  type CustomFieldFolder, type InsertCustomFieldFolder,
  type ClientGroup, type InsertClientGroup,
  type Product, type InsertProduct,
  type ClientProduct, type InsertClientProduct,
  type Note, type InsertNote, notes,
  type ClientAppointment, type InsertClientAppointment, appointments,
  type Document, type InsertDocument,
  type ClientHealthScore, type InsertClientHealthScore, clientHealthScores,
  clientBriefValues,
  type Activity, type InsertActivity, activities,
  type SocialMediaAccount, type InsertSocialMediaAccount,
  type SocialMediaPost, type InsertSocialMediaPost,
  type SocialMediaTemplate, type InsertSocialMediaTemplate,
  type SocialMediaAnalytics, type InsertSocialMediaAnalytics,
  type TemplateFolder, type InsertTemplateFolder, templateFolders,
  type EmailTemplate, type InsertEmailTemplate, emailTemplates,
  type SmsTemplate, type InsertSmsTemplate, smsTemplates,
  type ScheduledEmail, type InsertScheduledEmail, scheduledEmails,
  type SmartList, type InsertSmartList, smartLists,
  type Workflow, type InsertWorkflow, workflows,
  type WorkflowExecution, type InsertWorkflowExecution, workflowExecutions,
  type WorkflowTemplate, type InsertWorkflowTemplate, workflowTemplates,
  type TaskCategory, type InsertTaskCategory, taskCategories,
  type TaskTemplate, type InsertTaskTemplate,
  type EnhancedTask, type InsertEnhancedTask,
  type TaskHistory, type InsertTaskHistory,
  type AutomationTrigger, type InsertAutomationTrigger,
  type AutomationAction, type InsertAutomationAction,
  type Notification, type InsertNotification,
  type Tag, type InsertTag,
  type Staff, type InsertStaff,
  type Role, type InsertRole, roles,
  type Permission, type InsertPermission, permissions,
  type UserRole, type InsertUserRole, userRoles,
  type NotificationSettings, type InsertNotificationSettings,
  type CustomFieldFileUpload, type InsertCustomFieldFileUpload,
  type Form, type InsertForm, type FormField, type InsertFormField,
  type FormSubmission, type InsertFormSubmission,
  type CommentFile, type InsertCommentFile, commentFiles,
  type TaskComment, type InsertTaskComment, taskComments,
  type TaskCommentReaction, type InsertTaskCommentReaction, taskCommentReactions,
  type ImageAnnotation, type InsertImageAnnotation, imageAnnotations,
  type TaskActivity, type InsertTaskActivity, taskActivities,
  type TaskDependency, type InsertTaskDependency, taskDependencies,
  type Department, type InsertDepartment, departments,
  type Position, type InsertPosition, positions,
  type JobApplication, type InsertJobApplication, jobApplications,
  type JobOpening, type InsertJobOpening, jobOpenings,
  type ClientBriefSection, type InsertClientBriefSection, clientBriefSections,
  type ClientBriefValue, type InsertClientBriefValue, clientBriefValues,
  type AuthUser, type InsertAuthUser, authUsers,
  type EmailIntegration, type InsertEmailIntegration, emailIntegrations,
  type TeamPosition, type InsertTeamPosition, teamPositions,
  type ClientTeamAssignment, type InsertClientTeamAssignment, clientTeamAssignments,
  type UserViewPreference, type InsertUserViewPreference, userViewPreferences,
  type SalesSettings, type InsertSalesSettings, salesSettings,
  type Dashboard, type InsertDashboard, dashboards,
  type DashboardWidget, type InsertDashboardWidget, dashboardWidgets,
  type UserDashboardWidget, type InsertUserDashboardWidget, userDashboardWidgets,
  customFieldFileUploads, forms, formFields, formSubmissions, tags, automationTriggers, automationActions, staff, clientPortalUsers
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql, asc, desc, and, or, max, isNull, inArray, isNotNull } from "drizzle-orm";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClientsWithPagination(limit: number, offset: number, sortBy?: string, sortOrder?: string): Promise<{ clients: Client[]; total: number }>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  archiveClient(id: string): Promise<Client | undefined>;
  reassignClientTasks(fromClientId: string, toClientId: string): Promise<{ movedCount: number }>;
  getClientRelationsCounts(id: string): Promise<{ tasks: number; campaigns: number; invoices: number; healthScores: number }>;
  
  // Client Health Scores
  createClientHealthScore(data: InsertClientHealthScore): Promise<ClientHealthScore>;
  getClientHealthScores(clientId: string): Promise<ClientHealthScore[]>;
  getClientHealthScore(id: string): Promise<ClientHealthScore | null>;
  updateClientHealthScore(id: string, data: Partial<InsertClientHealthScore>): Promise<ClientHealthScore>;
  deleteClientHealthScore(id: string): Promise<void>;
  getClientHealthScoreByWeek(clientId: string, weekStartDate: Date): Promise<ClientHealthScore | null>;
  
  // Health Scores Bulk API
  getHealthScoresFiltered(filters: {
    from?: string;
    to?: string; 
    statuses?: string[];
    search?: string;
    clientId?: string;
    latestPerClient?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
    sortOrder?: string;
  }): Promise<{
    items: Array<ClientHealthScore & { clientName: string; clientEmail: string }>;
    total: number;
    page: number;
    limit: number;
  }>;
  
  // Client Brief Sections
  listBriefSections(): Promise<ClientBriefSection[]>;
  getBriefSection(id: string): Promise<ClientBriefSection | undefined>;
  getBriefSectionByKey(key: string): Promise<ClientBriefSection | undefined>;
  createBriefSection(section: InsertClientBriefSection): Promise<ClientBriefSection>;
  updateBriefSection(id: string, section: Partial<InsertClientBriefSection>): Promise<ClientBriefSection | undefined>;
  deleteBriefSection(id: string): Promise<boolean>;
  reorderBriefSections(sectionIds: string[]): Promise<void>;
  
  // Client Brief Values - Hybrid core/custom data
  getClientBrief(clientId: string): Promise<Array<ClientBriefSection & { value?: string }>>;
  setClientBriefValue(clientId: string, sectionId: string, value: string): Promise<void>;
  
  // Authentication
  getAuthUserByEmail(email: string): Promise<AuthUser | undefined>;
  createAuthUser(authUser: InsertAuthUser): Promise<AuthUser>;
  updateLastLogin(authUserId: string): Promise<void>;
  setPasswordHash(authUserId: string, passwordHash: string): Promise<void>;
  
  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignsByClient(clientId: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;
  
  // Leads
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  
  // Smart Lists
  getSmartLists(userId: string, entityType?: string): Promise<SmartList[]>;
  getSmartList(id: string): Promise<SmartList | undefined>;
  createSmartList(smartList: InsertSmartList): Promise<SmartList>;
  updateSmartList(id: string, smartList: Partial<InsertSmartList>): Promise<SmartList | undefined>;
  deleteSmartList(id: string): Promise<boolean>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByClient(clientId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  updateTasksStatusForClient(clientId: string, targetStatus: string, filters?: {
    includeStatuses?: string[];
    excludeStatuses?: string[];
    assignedTo?: string;
    priorities?: string[];
  }): Promise<{ count: number; taskIds: string[] }>;
  
  // Client Approval Operations
  updateTaskClientApproval(
    taskId: string, 
    status: 'pending' | 'approved' | 'rejected' | 'changes_requested',
    notes?: string
  ): Promise<Task | undefined>;
  approveTask(taskId: string, notes?: string): Promise<Task | undefined>;
  requestTaskChanges(taskId: string, notes: string): Promise<Task | undefined>;
  
  // Time Tracking Reports
  getTimeTrackingReport(filters: import("@shared/schema").TimeTrackingReportFilters): Promise<import("@shared/schema").TimeTrackingReportData>;
  getUserTimeEntries(userId: string, dateFrom: string, dateTo: string): Promise<Array<Task & { timeEntries: import("@shared/schema").TimeEntry[] }>>;
  getRunningTimeEntries(): Promise<Array<{ taskId: string; userId: string; startTime: string }>>;
  getTimeEntriesByDateRange(dateFrom: string, dateTo: string, userId?: string, clientId?: string): Promise<Array<Task & { timeEntries: import("@shared/schema").TimeEntry[] }>>;
  
  // Sub-task hierarchy methods (ClickUp-style up to 5 levels deep)
  getSubTasks(parentTaskId: string): Promise<Task[]>;
  getRootTasks(): Promise<Task[]>; // Tasks with no parent (level 0)
  getTaskHierarchy(rootTaskId: string): Promise<Task[]>; // Complete hierarchy tree
  createSubTask(parentTaskId: string, task: InsertTask): Promise<Task>;
  getParentTask(taskId: string): Promise<Task | undefined>;
  getTaskPath(taskId: string): Promise<Task[]>; // Breadcrumb path from root to task
  
  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByClient(clientId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  
  // Social Media Accounts
  getSocialMediaAccounts(): Promise<SocialMediaAccount[]>;
  getSocialMediaAccount(id: string): Promise<SocialMediaAccount | undefined>;
  getSocialMediaAccountsByClient(clientId: string): Promise<SocialMediaAccount[]>;
  createSocialMediaAccount(account: InsertSocialMediaAccount): Promise<SocialMediaAccount>;
  updateSocialMediaAccount(id: string, account: Partial<InsertSocialMediaAccount>): Promise<SocialMediaAccount | undefined>;
  deleteSocialMediaAccount(id: string): Promise<boolean>;
  
  // Social Media Posts
  getSocialMediaPosts(): Promise<SocialMediaPost[]>;
  getSocialMediaPost(id: string): Promise<SocialMediaPost | undefined>;
  getSocialMediaPostsByClient(clientId: string): Promise<SocialMediaPost[]>;
  getSocialMediaPostsByAccount(accountId: string): Promise<SocialMediaPost[]>;
  createSocialMediaPost(post: InsertSocialMediaPost): Promise<SocialMediaPost>;
  updateSocialMediaPost(id: string, post: Partial<InsertSocialMediaPost>): Promise<SocialMediaPost | undefined>;
  deleteSocialMediaPost(id: string): Promise<boolean>;
  
  // Social Media Templates
  getSocialMediaTemplates(): Promise<SocialMediaTemplate[]>;
  getSocialMediaTemplate(id: string): Promise<SocialMediaTemplate | undefined>;
  getSocialMediaTemplatesByClient(clientId: string): Promise<SocialMediaTemplate[]>;
  createSocialMediaTemplate(template: InsertSocialMediaTemplate): Promise<SocialMediaTemplate>;
  updateSocialMediaTemplate(id: string, template: Partial<InsertSocialMediaTemplate>): Promise<SocialMediaTemplate | undefined>;
  deleteSocialMediaTemplate(id: string): Promise<boolean>;
  
  // Social Media Analytics
  getSocialMediaAnalytics(): Promise<SocialMediaAnalytics[]>;
  getSocialMediaAnalyticsForAccount(accountId: string): Promise<SocialMediaAnalytics[]>;
  createSocialMediaAnalytics(analytics: InsertSocialMediaAnalytics): Promise<SocialMediaAnalytics>;
  
  // Workflows
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  getWorkflowsByClient(clientId: string): Promise<Workflow[]>;
  getWorkflowsByCategory(category: string): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;
  
  // Workflow Executions
  getWorkflowExecutions(): Promise<WorkflowExecution[]>;
  getWorkflowExecution(id: string): Promise<WorkflowExecution | undefined>;
  getWorkflowExecutionsByWorkflow(workflowId: string): Promise<WorkflowExecution[]>;
  getWorkflowExecutionsByContact(contactId: string): Promise<WorkflowExecution[]>;
  createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution>;
  updateWorkflowExecution(id: string, execution: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution | undefined>;
  
  // Workflow Templates
  getWorkflowTemplates(): Promise<WorkflowTemplate[]>;
  getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined>;
  getWorkflowTemplatesByCategory(category: string): Promise<WorkflowTemplate[]>;
  createWorkflowTemplate(template: InsertWorkflowTemplate): Promise<WorkflowTemplate>;
  updateWorkflowTemplate(id: string, template: Partial<InsertWorkflowTemplate>): Promise<WorkflowTemplate | undefined>;
  deleteWorkflowTemplate(id: string): Promise<boolean>;
  
  // Task Categories
  getTaskCategories(): Promise<TaskCategory[]>;
  getTaskCategory(id: string): Promise<TaskCategory | undefined>;
  createTaskCategory(category: InsertTaskCategory): Promise<TaskCategory>;
  updateTaskCategory(id: string, category: Partial<InsertTaskCategory>): Promise<TaskCategory | undefined>;
  deleteTaskCategory(id: string): Promise<boolean>;
  
  // Task Templates
  getTaskTemplates(): Promise<TaskTemplate[]>;
  getTaskTemplate(id: string): Promise<TaskTemplate | undefined>;
  getTaskTemplatesByCategory(categoryId: string): Promise<TaskTemplate[]>;
  createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate>;
  updateTaskTemplate(id: string, template: Partial<InsertTaskTemplate>): Promise<TaskTemplate | undefined>;
  deleteTaskTemplate(id: string): Promise<boolean>;
  
  // Enhanced Tasks
  getEnhancedTasks(): Promise<EnhancedTask[]>;
  getEnhancedTask(id: string): Promise<EnhancedTask | undefined>;
  getEnhancedTasksByClient(clientId: string): Promise<EnhancedTask[]>;
  getEnhancedTasksByAssignee(assigneeId: string): Promise<EnhancedTask[]>;
  getEnhancedTasksByWorkflow(workflowId: string): Promise<EnhancedTask[]>;
  createEnhancedTask(task: InsertEnhancedTask): Promise<EnhancedTask>;
  updateEnhancedTask(id: string, task: Partial<InsertEnhancedTask>): Promise<EnhancedTask | undefined>;
  deleteEnhancedTask(id: string): Promise<boolean>;
  
  // Task History
  getTaskHistory(taskId: string): Promise<TaskHistory[]>;
  createTaskHistory(history: InsertTaskHistory): Promise<TaskHistory>;
  
  // Automation Triggers
  getAutomationTriggers(): Promise<AutomationTrigger[]>;
  getAutomationTrigger(id: string): Promise<AutomationTrigger | undefined>;
  getAutomationTriggersByCategory(category: string): Promise<AutomationTrigger[]>;
  createAutomationTrigger(trigger: InsertAutomationTrigger): Promise<AutomationTrigger>;
  updateAutomationTrigger(id: string, trigger: Partial<InsertAutomationTrigger>): Promise<AutomationTrigger | undefined>;
  deleteAutomationTrigger(id: string): Promise<boolean>;
  
  // Automation Actions
  getAutomationActions(): Promise<AutomationAction[]>;
  getAutomationAction(id: string): Promise<AutomationAction | undefined>;
  getAutomationActionsByCategory(category: string): Promise<AutomationAction[]>;
  createAutomationAction(action: InsertAutomationAction): Promise<AutomationAction>;
  updateAutomationAction(id: string, action: Partial<InsertAutomationAction>): Promise<AutomationAction | undefined>;
  
  // Template Folders
  getTemplateFolders(): Promise<TemplateFolder[]>;
  getTemplateFolder(id: string): Promise<TemplateFolder | undefined>;
  getTemplateFoldersByType(type: string): Promise<TemplateFolder[]>;
  createTemplateFolder(folder: InsertTemplateFolder): Promise<TemplateFolder>;
  updateTemplateFolder(id: string, folder: Partial<InsertTemplateFolder>): Promise<TemplateFolder | undefined>;
  deleteTemplateFolder(id: string): Promise<boolean>;

  // Email Templates
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  getEmailTemplatesByFolder(folderId: string): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<boolean>;

  // Scheduled Emails
  getScheduledEmails(): Promise<ScheduledEmail[]>;
  getScheduledEmail(id: string): Promise<ScheduledEmail | undefined>;
  getScheduledEmailsByClient(clientId: string): Promise<ScheduledEmail[]>;
  createScheduledEmail(scheduledEmail: InsertScheduledEmail): Promise<ScheduledEmail>;
  updateScheduledEmail(id: string, scheduledEmail: Partial<InsertScheduledEmail>): Promise<ScheduledEmail | undefined>;
  deleteScheduledEmail(id: string): Promise<boolean>;
  markScheduledEmailAsSent(id: string, sentAt: Date): Promise<void>;
  markScheduledEmailAsFailed(id: string, failureReason: string): Promise<void>;

  // SMS Templates
  getSmsTemplates(): Promise<SmsTemplate[]>;
  getSmsTemplate(id: string): Promise<SmsTemplate | undefined>;
  getSmsTemplatesByFolder(folderId: string): Promise<SmsTemplate[]>;
  createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate>;
  updateSmsTemplate(id: string, template: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined>;
  deleteSmsTemplate(id: string): Promise<boolean>;

  // Custom Fields
  getCustomFields(): Promise<CustomField[]>;
  getCustomField(id: string): Promise<CustomField | undefined>;
  createCustomField(field: InsertCustomField): Promise<CustomField>;
  updateCustomField(id: string, field: Partial<InsertCustomField>): Promise<CustomField | undefined>;
  deleteCustomField(id: string): Promise<void>;
  
  // Custom Field Folders
  getCustomFieldFolders(): Promise<CustomFieldFolder[]>;
  getCustomFieldFolder(id: string): Promise<CustomFieldFolder | undefined>;
  createCustomFieldFolder(folder: InsertCustomFieldFolder): Promise<CustomFieldFolder>;

  // Tags
  getTags(): Promise<Tag[]>;
  getTag(id: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag | undefined>;
  deleteTag(id: string): Promise<boolean>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;
  deleteNotification(id: string): Promise<boolean>;

  // Audit Logs
  getAuditLogs(): Promise<AuditLog[]>;
  getAuditLog(id: string): Promise<AuditLog | undefined>;
  getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: string): Promise<AuditLog[]>;
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  
  // Staff
  getStaff(): Promise<Staff[]>;
  getStaffMember(id: string): Promise<Staff | undefined>;
  createStaffMember(staff: InsertStaff): Promise<Staff>;
  updateStaffMember(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaffMember(id: string): Promise<boolean>;
  
  // Team Positions
  getTeamPositions(): Promise<TeamPosition[]>;
  getTeamPosition(id: string): Promise<TeamPosition | undefined>;
  createTeamPosition(position: InsertTeamPosition): Promise<TeamPosition>;
  updateTeamPosition(id: string, position: Partial<InsertTeamPosition>): Promise<TeamPosition | undefined>;
  deleteTeamPosition(id: string): Promise<boolean>;
  
  // Client Team Assignments
  getClientTeamAssignments(clientId: string): Promise<(ClientTeamAssignment & { position: TeamPosition; staffMember: Staff })[]>;
  getTeamAssignments(): Promise<(ClientTeamAssignment & { position: TeamPosition; staffMember: Staff })[]>;
  createClientTeamAssignment(assignment: InsertClientTeamAssignment): Promise<ClientTeamAssignment>;
  updateClientTeamAssignment(id: string, assignment: Partial<InsertClientTeamAssignment>): Promise<ClientTeamAssignment | undefined>;
  deleteClientTeamAssignment(id: string): Promise<boolean>;
  
  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: string): Promise<boolean>;
  
  // Positions
  getPositions(): Promise<Position[]>;
  getPosition(id: string): Promise<Position | undefined>;
  getPositionsByDepartment(departmentId: string): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: string, position: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: string): Promise<boolean>;

  // Job Openings
  getJobOpenings(): Promise<JobOpening[]>;
  createJobOpening(jobOpening: InsertJobOpening): Promise<JobOpening>;
  updateJobOpening(id: string, updates: Partial<InsertJobOpening>): Promise<JobOpening>;
  approveJobOpening(id: string): Promise<JobOpening>;

  // Job Applications
  getJobApplications(): Promise<JobApplication[]>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  
  // Roles
  getRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;
  
  // Notification Settings
  getNotificationSettings(userId: string): Promise<NotificationSettings | undefined>;
  
  // Sales Settings
  getSalesSettings(): Promise<SalesSettings | undefined>;
  updateSalesSettings(settings: Partial<InsertSalesSettings>): Promise<SalesSettings>;
  
  // Custom Field File Uploads
  getCustomFieldFileUploads(clientId: string, customFieldId: string): Promise<CustomFieldFileUpload[]>;
  getCustomFieldFileUpload(id: string): Promise<CustomFieldFileUpload | undefined>;
  createCustomFieldFileUpload(upload: InsertCustomFieldFileUpload): Promise<CustomFieldFileUpload>;
  deleteCustomFieldFileUpload(id: string): Promise<boolean>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(userId: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined>;
  
  // Forms
  getForms(): Promise<Form[]>;
  getForm(id: string): Promise<Form | undefined>;
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: string, form: Partial<InsertForm>): Promise<Form | undefined>;
  deleteForm(id: string): Promise<boolean>;
  
  // Form Fields
  getFormFields(formId: string): Promise<FormField[]>;
  getFormField(id: string): Promise<FormField | undefined>;
  createFormField(field: InsertFormField): Promise<FormField>;
  updateFormField(id: string, field: Partial<InsertFormField>): Promise<FormField | undefined>;
  deleteFormField(id: string): Promise<boolean>;
  reorderFormFields(fieldIds: string[]): Promise<void>;
  
  // Form Submissions
  getFormSubmissions(formId: string): Promise<FormSubmission[]>;
  getFormSubmission(id: string): Promise<FormSubmission | undefined>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  
  // Additional methods that are called in routes.ts
  reorderCustomFields(fieldIds: string[]): Promise<void>;
  updateCustomFieldFolder(id: string, folder: Partial<InsertCustomFieldFolder>): Promise<CustomFieldFolder | undefined>;
  deleteCustomFieldFolder(id: string): Promise<boolean>;
  reorderCustomFieldFolders(folderIds: string[]): Promise<void>;
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getProductCategories(): Promise<any[]>;
  createProductCategory(category: any): Promise<any>;
  updateProductCategory(id: string, category: any): Promise<any>;
  deleteProductCategory(id: string): Promise<boolean>;
  
  // Client-related
  getClientProducts(clientId: string): Promise<any[]>;
  createClientProduct(clientProduct: any): Promise<any>;
  updateClientProduct(id: string, clientProduct: any): Promise<any>;
  deleteClientProduct(id: string): Promise<boolean>;
  
  getClientBundles(clientId: string): Promise<any[]>;
  createClientBundle(clientBundle: any): Promise<any>;
  updateClientBundle(id: string, clientBundle: any): Promise<any>;
  deleteClientBundle(id: string): Promise<boolean>;
  
  // Client notes, tasks, appointments
  getClientNotes(clientId: string): Promise<any[]>;
  createClientNote(note: any): Promise<any>;
  updateClientNote(id: string, note: any): Promise<any>;
  deleteClientNote(id: string): Promise<boolean>;
  
  getClientTasks(clientId: string): Promise<any[]>;
  createClientTask(task: any): Promise<any>;
  updateClientTask(id: string, task: any): Promise<any>;
  deleteClientTask(id: string): Promise<boolean>;
  
  getClientAppointments(clientId: string): Promise<any[]>;
  createClientAppointment(appointment: any): Promise<any>;
  updateClientAppointment(id: string, appointment: any): Promise<any>;
  deleteClientAppointment(id: string): Promise<boolean>;
  
  getClientDocuments(clientId: string): Promise<any[]>;
  createClientDocument(document: any): Promise<any>;
  updateClientDocument(id: string, document: any): Promise<any>;
  deleteClientDocument(id: string): Promise<boolean>;
  
  getClientTransactions(clientId: string): Promise<any[]>;
  createClientTransaction(transaction: any): Promise<any>;
  updateClientTransaction(id: string, transaction: any): Promise<any>;
  deleteClientTransaction(id: string): Promise<boolean>;

  // Calendar related
  getCalendars(): Promise<any[]>;
  getCalendar(id: string): Promise<any>;
  createCalendar(calendar: any): Promise<any>;
  updateCalendar(id: string, calendar: any): Promise<any>;
  deleteCalendar(id: string): Promise<boolean>;
  
  getCalendarStaff(calendarId: string): Promise<any[]>;
  getCalendarAvailability(calendarId: string): Promise<any[]>;
  getCalendarAppointments(calendarId?: string): Promise<any[]>;
  createCalendarAppointment(appointment: any): Promise<any>;
  updateCalendarAppointment(id: string, appointment: any): Promise<any>;
  deleteCalendarAppointment(id: string): Promise<boolean>;
  
  // Task comments
  getTaskComments(taskId: string): Promise<any[]>;
  createTaskComment(comment: any): Promise<any>;
  updateTaskComment(id: string, comment: any): Promise<any>;
  deleteTaskComment(id: string): Promise<boolean>;

  // Image Annotations
  getImageAnnotations(fileId: string): Promise<ImageAnnotation[]>;
  createImageAnnotation(annotation: InsertImageAnnotation): Promise<ImageAnnotation>;
  updateImageAnnotation(annotationId: string, updates: { content: string; updatedAt: Date }): Promise<ImageAnnotation | undefined>;
  deleteImageAnnotation(annotationId: string): Promise<boolean>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getPermissions(): Promise<Permission[]>;
  getPermission(id: string): Promise<Permission | undefined>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: string, permission: Partial<InsertPermission>): Promise<Permission | undefined>;
  deletePermission(id: string): Promise<boolean>;
  getUserRoles(): Promise<UserRole[]>;
  getUserRole(id: string): Promise<UserRole | undefined>;
  getUserRolesByUser(userId: string): Promise<UserRole[]>;
  getUserRolesByRole(roleId: string): Promise<UserRole[]>;
  createUserRole(userRole: InsertUserRole): Promise<UserRole>;
  updateUserRole(id: string, userRole: Partial<InsertUserRole>): Promise<UserRole | undefined>;
  deleteUserRole(id: string): Promise<boolean>;
  getSmartLists(userId: string, entityType?: string): Promise<SmartList[]>;
  getSmartList(id: string): Promise<SmartList | undefined>;
  createSmartList(smartList: InsertSmartList): Promise<SmartList>;
  updateSmartList(id: string, smartList: Partial<InsertSmartList>): Promise<SmartList | undefined>;
  deleteSmartList(id: string): Promise<boolean>;
  deleteAutomationTrigger(id: string): Promise<boolean>;
  deleteAutomationAction(id: string): Promise<boolean>;
  deleteWorkflowExecution(id: string): Promise<boolean>;
  
  // Email Integrations
  getEmailIntegrations(): Promise<EmailIntegration[]>;
  getEmailIntegration(id: string): Promise<EmailIntegration | undefined>;
  getEmailIntegrationByProvider(provider: string): Promise<EmailIntegration | undefined>;
  createEmailIntegration(integration: InsertEmailIntegration): Promise<EmailIntegration>;
  updateEmailIntegration(id: string, integration: Partial<InsertEmailIntegration>): Promise<EmailIntegration | undefined>;
  deleteEmailIntegration(id: string): Promise<boolean>;
  
  // User View Preferences
  getUserViewPreference(userId: string, viewType: string): Promise<any>;
  saveUserViewPreference(userId: string, viewType: string, preferences: any): Promise<any>;
  
  // Dashboards
  getUserDashboards(userId: string): Promise<Dashboard[]>;
  getDashboard(id: string): Promise<Dashboard | undefined>;
  createDashboard(data: InsertDashboard): Promise<Dashboard>;
  updateDashboard(id: string, data: Partial<InsertDashboard>): Promise<Dashboard | undefined>;
  deleteDashboard(id: string): Promise<boolean>;
  setDefaultDashboard(userId: string, dashboardId: string): Promise<void>;
  
  // Dashboard Widgets
  getDashboardWidgets(): Promise<DashboardWidget[]>;
  getUserDashboardWidgets(userId: string, dashboardId: string): Promise<UserDashboardWidget[]>;
  getUserDashboardWidget(id: string): Promise<UserDashboardWidget | undefined>;
  createUserDashboardWidget(data: InsertUserDashboardWidget): Promise<UserDashboardWidget>;
  updateUserDashboardWidget(id: string, data: Partial<InsertUserDashboardWidget>): Promise<UserDashboardWidget | undefined>;
  deleteUserDashboardWidget(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private clients: Map<string, Client> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private leads: Map<string, Lead> = new Map();
  private tasks: Map<string, Task> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private socialMediaAccounts: Map<string, SocialMediaAccount> = new Map();
  private socialMediaPosts: Map<string, SocialMediaPost> = new Map();
  private socialMediaTemplates: Map<string, SocialMediaTemplate> = new Map();
  private socialMediaAnalytics: Map<string, SocialMediaAnalytics> = new Map();
  private templateFolders: Map<string, TemplateFolder> = new Map();
  private emailTemplates: Map<string, EmailTemplate> = new Map();
  private smsTemplates: Map<string, SmsTemplate> = new Map();
  private scheduledEmails: Map<string, ScheduledEmail> = new Map();
  private customFields: Map<string, CustomField> = new Map();
  private customFieldFolders: Map<string, CustomFieldFolder> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private workflowExecutions: Map<string, WorkflowExecution> = new Map();
  private workflowTemplates: Map<string, WorkflowTemplate> = new Map();
  private taskCategories: Map<string, TaskCategory> = new Map();
  private taskTemplates: Map<string, TaskTemplate> = new Map();
  private enhancedTasks: Map<string, EnhancedTask> = new Map();
  private taskHistory: Map<string, TaskHistory[]> = new Map();
  private automationActions: Map<string, AutomationAction> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private templateTasks: Map<string, TemplateTask> = new Map();
  private authUsers: Map<string, AuthUser> = new Map();
  private emailIntegrations: Map<string, EmailIntegration> = new Map();

  constructor() {
    // Add sample data for testing
    this.addSampleData();
    this.initializeWorkflowTemplates();
    this.initializeAutomationElements();
    this.initializeTemplateFoldersAndTemplates();
    this.initializeCustomFields();
  }

  private addSampleData() {
    // Sample client data
    const sampleClient1: Client = {
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
      lastActivity: new Date("2024-01-15T10:30:00Z"),
      createdAt: new Date("2024-01-01T09:00:00Z"),
    };

    const sampleClient2: Client = {
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
      lastActivity: new Date("2024-01-14T15:45:00Z"),
      createdAt: new Date("2023-12-15T14:20:00Z"),
    };

    this.clients.set(sampleClient1.id, sampleClient1);
    this.clients.set(sampleClient2.id, sampleClient2);
  }


  private initializeWorkflowTemplates() {
    // No default templates - users can create their own from existing workflows
    const templates: WorkflowTemplate[] = [];

    templates.forEach(template => {
      this.workflowTemplates.set(template.id, template);
    });
  }

  private initializeAutomationElements() {
    // Sample automation triggers
    const triggers: AutomationTrigger[] = [
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
          },
          contact_source: { 
            type: "string",
            options: ["website", "referral", "cold_outreach", "social_media", "paid_ads"],
            label: "Contact Source (Optional)"
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
        createdAt: new Date()
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
        createdAt: new Date()
      }
    ];

    // Note: Triggers are now stored in the database, not in memory

    // Comprehensive automation actions for AgencyFlow CRM
    const actions: AutomationAction[] = [
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
      },
      {
        id: "action-4",
        name: "Send Slack Message",
        type: "send_slack_message",
        description: "Send a message to Slack channel or user",
        category: "communication",
        configSchema: {
          channel: { type: "string", required: true },
          message: { type: "string", required: true },
          mention_user: { type: "string" }
        },
        isActive: true,
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
          description: { type: "string" },
          // project_id removed - projects no longer exist
        },
        isActive: true,
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
      }
    ];

    actions.forEach(action => {
      this.automationActions.set(action.id, action);
    });
  }

  private initializeTemplateFoldersAndTemplates() {
    // Initialize sample template folders
    const folders: TemplateFolder[] = [
      {
        id: "folder-1",
        name: "Welcome Sequences",
        description: "Email templates for welcoming new leads and customers",
        type: "email",
        parentId: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "folder-2", 
        name: "Follow-up Emails",
        description: "Templates for following up with prospects and clients",
        type: "email",
        parentId: null,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "folder-3",
        name: "SMS Campaigns",
        description: "SMS message templates for quick communication",
        type: "sms",
        parentId: null,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "folder-4",
        name: "Onboarding",
        description: "Customer onboarding email sequences",
        type: "email",
        parentId: null,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    folders.forEach(folder => {
      this.templateFolders.set(folder.id, folder);
    });

    // Initialize sample email templates
    const emailTemplates: EmailTemplate[] = [
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
        lastUsed: new Date("2024-01-15"),
        createdBy: "user-1",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-15")
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
        lastUsed: new Date("2024-01-12"),
        createdBy: "user-1",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-12")
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
        lastUsed: new Date("2024-01-16"),
        createdBy: "user-1",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-16")
      }
    ];

    emailTemplates.forEach(template => {
      this.emailTemplates.set(template.id, template);
    });

    // Initialize sample SMS templates
    const smsTemplates: SmsTemplate[] = [
      {
        id: "sms-1",
        name: "Welcome SMS",
        content: "Hi {{first_name}}! Welcome to {{company_name}}. We're excited to work with you. Reply STOP to opt out.",
        folderId: "folder-3",
        tags: ["welcome", "new_customer"],
        isPublic: false,
        usageCount: 12,
        lastUsed: new Date("2024-01-14"),
        createdBy: "user-1",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-14")
      },
      {
        id: "sms-2",
        name: "Appointment Reminder",
        content: "Hi {{first_name}}, this is a reminder about your appointment tomorrow at {{time}}. See you then! Reply STOP to opt out.",
        folderId: "folder-3",
        tags: ["reminder", "appointment"],
        isPublic: false,
        usageCount: 8,
        lastUsed: new Date("2024-01-13"),
        createdBy: "user-1",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-13")
      }
    ];

    smsTemplates.forEach(template => {
      this.smsTemplates.set(template.id, template);
    });
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClientsWithPagination(limit: number, offset: number, sortBy?: string, sortOrder?: string): Promise<{ clients: Client[]; total: number }> {
    // Filter out archived clients by default
    const allClients = Array.from(this.clients.values()).filter(client => !client.isArchived);
    
    // Sort clients if sortBy is specified
    if (sortBy) {
      allClients.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Client];
        let bValue: any = b[sortBy as keyof Client];
        
        // Handle date sorting
        if (sortBy === 'createdAt') {
          aValue = new Date(aValue || 0);
          bValue = new Date(bValue || 0);
        }
        
        // Handle string sorting
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (sortOrder === 'desc') {
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

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const now = new Date();
    
    const client: Client = { 
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


  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  async archiveClient(id: string): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const archivedClient = { ...client, isArchived: true };
    this.clients.set(id, archivedClient);
    return archivedClient;
  }

  async reassignClientTasks(fromClientId: string, toClientId: string): Promise<{ movedCount: number }> {
    let movedCount = 0;
    for (const [id, task] of this.tasks) {
      if (task.clientId === fromClientId) {
        this.tasks.set(id, { ...task, clientId: toClientId });
        movedCount++;
      }
    }
    return { movedCount };
  }

  async getClientRelationsCounts(id: string): Promise<{ tasks: number; campaigns: number; invoices: number; healthScores: number }> {
    const tasksCount = Array.from(this.tasks.values()).filter(task => task.clientId === id).length;
    const campaignsCount = Array.from(this.campaigns.values()).filter(campaign => campaign.clientId === id).length;
    const invoicesCount = Array.from(this.invoices.values()).filter(invoice => invoice.clientId === id).length;
    const healthScoresCount = Array.from(this.clientHealthScores.values()).filter(score => score.clientId === id).length;

    return {
      tasks: tasksCount,
      campaigns: campaignsCount,
      invoices: invoicesCount,
      healthScores: healthScoresCount
    };
  }




  // Template Task Methods
  async getTemplateTasksByTemplate(templateId: string): Promise<TemplateTask[]> {
    return Array.from(this.templateTasks.values())
      .filter(task => task.templateId === templateId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async createTemplateTask(insertTask: InsertTemplateTask): Promise<TemplateTask> {
    const id = randomUUID();
    const now = new Date();
    const task: TemplateTask = {
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
      createdAt: now,
    };
    this.templateTasks.set(id, task);
    return task;
  }

  async deleteTemplateTasksByTemplate(templateId: string): Promise<void> {
    const tasksToDelete = Array.from(this.templateTasks.values())
      .filter(task => task.templateId === templateId);
    tasksToDelete.forEach(task => this.templateTasks.delete(task.id));
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByClient(clientId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.clientId === clientId);
  }


  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = randomUUID();
    const now = new Date();
    const campaign: Campaign = { 
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

  async updateCampaign(id: string, campaignUpdate: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, ...campaignUpdate };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const now = new Date();
    const lead: Lead = { 
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

  async updateLead(id: string, leadUpdate: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;
    
    const updatedLead = { ...lead, ...leadUpdate };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByClient(clientId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.clientId === clientId);
  }


  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    
    // Calculate hierarchy fields
    let level = 0;
    let taskPath = id;
    
    if (insertTask.parentTaskId) {
      const parentTask = this.tasks.get(insertTask.parentTaskId);
      if (parentTask) {
        level = parentTask.level! + 1;
        taskPath = parentTask.taskPath + "/" + id;
        
        // Update parent task to mark it as having sub-tasks
        const updatedParent = { ...parentTask, hasSubTasks: true };
        this.tasks.set(insertTask.parentTaskId, updatedParent);
      }
    }
    
    const task: Task = { 
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

  async updateTask(id: string, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { 
      ...task, 
      ...taskUpdate,
      completedAt: taskUpdate.status === 'completed' ? new Date() : task.completedAt
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Client Approval Operations
  async updateTaskClientApproval(
    taskId: string, 
    status: 'pending' | 'approved' | 'rejected' | 'changes_requested',
    notes?: string
  ): Promise<Task | undefined> {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;
    
    const updatedTask = {
      ...task,
      clientApprovalStatus: status,
      clientApprovalNotes: notes || null,
      clientApprovalDate: new Date()
    };
    this.tasks.set(taskId, updatedTask);
    return updatedTask;
  }

  async approveTask(taskId: string, notes?: string): Promise<Task | undefined> {
    return this.updateTaskClientApproval(taskId, 'approved', notes);
  }

  async requestTaskChanges(taskId: string, notes: string): Promise<Task | undefined> {
    return this.updateTaskClientApproval(taskId, 'changes_requested', notes);
  }

  async deleteTask(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;
    
    // If this task has sub-tasks, also delete them
    if (task.hasSubTasks) {
      const subTasks = await this.getSubTasks(id);
      for (const subTask of subTasks) {
        await this.deleteTask(subTask.id);
      }
    }
    
    // If this task has a parent, update parent's hasSubTasks flag
    if (task.parentTaskId) {
      const parentTask = this.tasks.get(task.parentTaskId);
      if (parentTask) {
        const remainingSiblings = Array.from(this.tasks.values())
          .filter(t => t.parentTaskId === task.parentTaskId && t.id !== id);
        
        if (remainingSiblings.length === 0) {
          const updatedParent = { ...parentTask, hasSubTasks: false };
          this.tasks.set(task.parentTaskId, updatedParent);
        }
      }
    }
    
    return this.tasks.delete(id);
  }

  async updateTasksStatusForClient(
    clientId: string, 
    targetStatus: string, 
    filters?: {
      includeStatuses?: string[];
      excludeStatuses?: string[];
      assignedTo?: string;
      priorities?: string[];
    }
  ): Promise<{ count: number; taskIds: string[] }> {
    const clientTasks = Array.from(this.tasks.values()).filter(t => t.clientId === clientId);
    const updatedTaskIds: string[] = [];

    for (const task of clientTasks) {
      // Apply filters
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

      // Update the task status
      task.status = targetStatus;
      task.updatedAt = new Date();
      this.tasks.set(task.id, task);
      updatedTaskIds.push(task.id);
    }

    return { count: updatedTaskIds.length, taskIds: updatedTaskIds };
  }

  // Sub-task hierarchy methods (ClickUp-style up to 5 levels deep)
  async getSubTasks(parentTaskId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.parentTaskId === parentTaskId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async getRootTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => !task.parentTaskId || task.level === 0)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async getTaskHierarchy(rootTaskId: string): Promise<Task[]> {
    const hierarchy: Task[] = [];
    const root = this.tasks.get(rootTaskId);
    
    if (!root) return hierarchy;
    
    // Add root task
    hierarchy.push(root);
    
    // Recursively get all descendants
    const addDescendants = async (parentId: string) => {
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

  async createSubTask(parentTaskId: string, task: InsertTask): Promise<Task> {
    const parentTask = this.tasks.get(parentTaskId);
    if (!parentTask) {
      throw new Error('Parent task not found');
    }
    
    if (parentTask.level! >= 4) { // Max 5 levels (0-4)
      throw new Error('Maximum task nesting level (5) reached');
    }
    
    // Create sub-task with parent reference
    const subTaskData: InsertTask = {
      ...task,
      parentTaskId: parentTaskId
    };
    
    return this.createTask(subTaskData);
  }

  async getParentTask(taskId: string): Promise<Task | undefined> {
    const task = this.tasks.get(taskId);
    if (!task || !task.parentTaskId) return undefined;
    
    return this.tasks.get(task.parentTaskId);
  }

  async getTaskPath(taskId: string): Promise<Task[]> {
    const path: Task[] = [];
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
  async getTimeTrackingReport(filters: import("@shared/schema").TimeTrackingReportFilters): Promise<import("@shared/schema").TimeTrackingReportData> {
    const { dateFrom, dateTo, userId, clientId, taskStatus, reportType } = filters;
    
    // Get all tasks with time entries in the date range
    const allTasks = Array.from(this.tasks.values());
    const filteredTasks = allTasks.filter(task => {
      // Filter by user if specified
      if (userId && task.assignedTo !== userId) return false;
      
      // Filter by client if specified  
      if (clientId && task.clientId !== clientId) return false;
      
      // Filter by task status if specified
      if (taskStatus && taskStatus.length > 0 && !taskStatus.includes(task.status)) return false;
      
      // Check if task has time entries in the date range
      if (!task.timeEntries || task.timeEntries.length === 0) return false;
      
      const hasEntriesInRange = (task.timeEntries as any[]).some((entry: any) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
        return entryDate >= dateFrom && entryDate <= dateTo;
      });
      
      return hasEntriesInRange;
    });
    
    // Process tasks and aggregate data
    const tasksWithDetails = filteredTasks.map(task => {
      const timeEntriesByDate: Record<string, import("@shared/schema").TimeEntry[]> = {};
      
      (task.timeEntries as any[]).forEach((entry: any) => {
        if (!entry.startTime) return;
        const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
        if (entryDate >= dateFrom && entryDate <= dateTo) {
          if (!timeEntriesByDate[entryDate]) {
            timeEntriesByDate[entryDate] = [];
          }
          timeEntriesByDate[entryDate].push(entry as import("@shared/schema").TimeEntry);
        }
      });
      
      const totalTracked = Object.values(timeEntriesByDate)
        .flat()
        .reduce((sum, entry) => sum + (entry.duration || 0), 0);
      
      return {
        ...task,
        userInfo: undefined, // MemStorage doesn't have user info
        clientInfo: undefined, // MemStorage doesn't have client info  
        timeEntriesByDate,
        totalTracked
      };
    });
    
    // Calculate user summaries
    const userSummaries: import("@shared/schema").UserSummary[] = [];
    const userTimeMap = new Map<string, any>();
    
    tasksWithDetails.forEach(task => {
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        entries.forEach(entry => {
          if (!userTimeMap.has(entry.userId)) {
            userTimeMap.set(entry.userId, {
              userId: entry.userId,
              userName: `User ${entry.userId}`,
              userRole: 'User',
              totalTime: 0,
              tasksWorked: new Set(),
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
    
    userTimeMap.forEach((userData, userId) => {
      userSummaries.push({
        userId,
        userName: userData.userName,
        userRole: userData.userRole,
        totalTime: userData.totalTime,
        tasksWorked: userData.tasksWorked.size,
        dailyTotals: userData.dailyTotals
      });
    });
    
    // Calculate client breakdowns
    const clientBreakdowns: import("@shared/schema").ClientBreakdown[] = [];
    const clientTimeMap = new Map<string, any>();
    
    tasksWithDetails.forEach(task => {
      if (!task.clientId) return;
      
      if (!clientTimeMap.has(task.clientId)) {
        clientTimeMap.set(task.clientId, {
          clientId: task.clientId,
          clientName: `Client ${task.clientId}`,
          totalTime: 0,
          tasksCount: new Set(),
          users: new Map()
        });
      }
      
      const clientData = clientTimeMap.get(task.clientId);
      clientData.tasksCount.add(task.id);
      
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        entries.forEach(entry => {
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
    
    clientTimeMap.forEach((clientData, clientId) => {
      clientBreakdowns.push({
        clientId,
        clientName: clientData.clientName,
        totalTime: clientData.totalTime,
        tasksCount: clientData.tasksCount.size,
        users: Array.from(clientData.users.values())
      });
    });
    
    // Calculate daily totals
    const dailyTotals: Record<string, number> = {};
    tasksWithDetails.forEach(task => {
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        if (!dailyTotals[date]) {
          dailyTotals[date] = 0;
        }
        entries.forEach(entry => {
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
  
  async getUserTimeEntries(userId: string, dateFrom: string, dateTo: string): Promise<Array<Task & { timeEntries: import("@shared/schema").TimeEntry[] }>> {
    const allTasks = Array.from(this.tasks.values());
    
    return allTasks.filter(task => {
      if (task.assignedTo !== userId) return false;
      if (!task.timeEntries || task.timeEntries.length === 0) return false;
      
      // Check if task has time entries in the date range
      const hasEntriesInRange = (task.timeEntries as any[]).some((entry: any) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
        return entryDate >= dateFrom && entryDate <= dateTo;
      });
      
      return hasEntriesInRange;
    }).map(task => ({
      ...task,
      timeEntries: (task.timeEntries as any[]).filter((entry: any) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
        return entryDate >= dateFrom && entryDate <= dateTo;
      }) as import("@shared/schema").TimeEntry[]
    }));
  }
  
  async getRunningTimeEntries(): Promise<Array<{ taskId: string; userId: string; startTime: string }>> {
    const allTasks = Array.from(this.tasks.values());
    const runningEntries: Array<{ taskId: string; userId: string; startTime: string }> = [];
    
    allTasks.forEach(task => {
      if (!task.timeEntries || task.timeEntries.length === 0) return;
      
      (task.timeEntries as any[]).forEach((entry: any) => {
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
  
  async getTimeEntriesByDateRange(dateFrom: string, dateTo: string, userId?: string, clientId?: string): Promise<Array<Task & { timeEntries: import("@shared/schema").TimeEntry[] }>> {
    const allTasks = Array.from(this.tasks.values());
    
    return allTasks.filter(task => {
      // Filter by user if specified
      if (userId && task.assignedTo !== userId) return false;
      
      // Filter by client if specified  
      if (clientId && task.clientId !== clientId) return false;
      
      // Check if task has time entries
      if (!task.timeEntries || task.timeEntries.length === 0) return false;
      
      // Check if task has time entries in the date range
      const hasEntriesInRange = (task.timeEntries as any[]).some((entry: any) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
        return entryDate >= dateFrom && entryDate <= dateTo;
      });
      
      return hasEntriesInRange;
    }).map(task => ({
      ...task,
      timeEntries: (task.timeEntries as any[]).filter((entry: any) => {
        if (!entry.startTime) return false;
        const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
        return entryDate >= dateFrom && entryDate <= dateTo;
      }) as import("@shared/schema").TimeEntry[]
    }));
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByClient(clientId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(i => i.clientId === clientId);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const now = new Date();
    const invoice: Invoice = { 
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

  async updateInvoice(id: string, invoiceUpdate: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { ...invoice, ...invoiceUpdate };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Social Media Accounts
  async getSocialMediaAccounts(): Promise<SocialMediaAccount[]> {
    return Array.from(this.socialMediaAccounts.values());
  }

  async getSocialMediaAccount(id: string): Promise<SocialMediaAccount | undefined> {
    return this.socialMediaAccounts.get(id);
  }

  async getSocialMediaAccountsByClient(clientId: string): Promise<SocialMediaAccount[]> {
    return Array.from(this.socialMediaAccounts.values()).filter(account => account.clientId === clientId);
  }

  async createSocialMediaAccount(accountData: InsertSocialMediaAccount): Promise<SocialMediaAccount> {
    const account: SocialMediaAccount = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.socialMediaAccounts.set(account.id, account);
    return account;
  }

  async updateSocialMediaAccount(id: string, accountData: Partial<InsertSocialMediaAccount>): Promise<SocialMediaAccount | undefined> {
    const account = this.socialMediaAccounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount = { ...account, ...accountData, updatedAt: new Date() };
    this.socialMediaAccounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteSocialMediaAccount(id: string): Promise<boolean> {
    return this.socialMediaAccounts.delete(id);
  }

  // Social Media Posts
  async getSocialMediaPosts(): Promise<SocialMediaPost[]> {
    return Array.from(this.socialMediaPosts.values());
  }

  async getSocialMediaPost(id: string): Promise<SocialMediaPost | undefined> {
    return this.socialMediaPosts.get(id);
  }

  async getSocialMediaPostsByClient(clientId: string): Promise<SocialMediaPost[]> {
    return Array.from(this.socialMediaPosts.values()).filter(post => post.clientId === clientId);
  }

  async getSocialMediaPostsByAccount(accountId: string): Promise<SocialMediaPost[]> {
    return Array.from(this.socialMediaPosts.values()).filter(post => post.accountId === accountId);
  }

  async createSocialMediaPost(postData: InsertSocialMediaPost): Promise<SocialMediaPost> {
    const post: SocialMediaPost = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.socialMediaPosts.set(post.id, post);
    return post;
  }

  async updateSocialMediaPost(id: string, postData: Partial<InsertSocialMediaPost>): Promise<SocialMediaPost | undefined> {
    const post = this.socialMediaPosts.get(id);
    if (!post) return undefined;
    
    const updatedPost = { ...post, ...postData, updatedAt: new Date() };
    this.socialMediaPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteSocialMediaPost(id: string): Promise<boolean> {
    return this.socialMediaPosts.delete(id);
  }

  // Social Media Templates
  async getSocialMediaTemplates(): Promise<SocialMediaTemplate[]> {
    return Array.from(this.socialMediaTemplates.values());
  }

  async getSocialMediaTemplate(id: string): Promise<SocialMediaTemplate | undefined> {
    return this.socialMediaTemplates.get(id);
  }

  async getSocialMediaTemplatesByClient(clientId: string): Promise<SocialMediaTemplate[]> {
    return Array.from(this.socialMediaTemplates.values()).filter(template => 
      template.clientId === clientId || template.isPublic
    );
  }

  async createSocialMediaTemplate(templateData: InsertSocialMediaTemplate): Promise<SocialMediaTemplate> {
    const template: SocialMediaTemplate = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.socialMediaTemplates.set(template.id, template);
    return template;
  }

  async updateSocialMediaTemplate(id: string, templateData: Partial<InsertSocialMediaTemplate>): Promise<SocialMediaTemplate | undefined> {
    const template = this.socialMediaTemplates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...templateData, updatedAt: new Date() };
    this.socialMediaTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteSocialMediaTemplate(id: string): Promise<boolean> {
    return this.socialMediaTemplates.delete(id);
  }

  // Social Media Analytics
  async getSocialMediaAnalytics(): Promise<SocialMediaAnalytics[]> {
    return Array.from(this.socialMediaAnalytics.values());
  }

  async getSocialMediaAnalyticsForAccount(accountId: string): Promise<SocialMediaAnalytics[]> {
    return Array.from(this.socialMediaAnalytics.values()).filter(analytics => analytics.accountId === accountId);
  }

  async createSocialMediaAnalytics(analyticsData: InsertSocialMediaAnalytics): Promise<SocialMediaAnalytics> {
    const analytics: SocialMediaAnalytics = {
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
      createdAt: new Date(),
    };
    this.socialMediaAnalytics.set(analytics.id, analytics);
    return analytics;
  }

  // Workflow Management
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getWorkflowsByClient(clientId: string): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(workflow => workflow.clientId === clientId);
  }

  async getWorkflowsByCategory(category: string): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(workflow => workflow.category === category);
  }

  async createWorkflow(workflowData: InsertWorkflow): Promise<Workflow> {
    const workflow: Workflow = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, workflowData: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const existing = this.workflows.get(id);
    if (!existing) return undefined;
    
    const updated: Workflow = {
      ...existing,
      ...workflowData,
      updatedAt: new Date(),
    };
    this.workflows.set(id, updated);
    return updated;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // Workflow Executions
  async getWorkflowExecutions(): Promise<WorkflowExecution[]> {
    return Array.from(this.workflowExecutions.values());
  }

  async getWorkflowExecution(id: string): Promise<WorkflowExecution | undefined> {
    return this.workflowExecutions.get(id);
  }

  async getWorkflowExecutionsByWorkflow(workflowId: string): Promise<WorkflowExecution[]> {
    return Array.from(this.workflowExecutions.values()).filter(exec => exec.workflowId === workflowId);
  }

  async getWorkflowExecutionsByContact(contactId: string): Promise<WorkflowExecution[]> {
    return Array.from(this.workflowExecutions.values()).filter(exec => exec.contactId === contactId);
  }

  async createWorkflowExecution(executionData: InsertWorkflowExecution): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
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
      nextRunAt: executionData.nextRunAt || null,
    };
    this.workflowExecutions.set(execution.id, execution);
    return execution;
  }

  async updateWorkflowExecution(id: string, executionData: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution | undefined> {
    const existing = this.workflowExecutions.get(id);
    if (!existing) return undefined;
    
    const updated: WorkflowExecution = {
      ...existing,
      ...executionData,
    };
    this.workflowExecutions.set(id, updated);
    return updated;
  }

  // Workflow Templates
  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return Array.from(this.workflowTemplates.values());
  }

  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined> {
    return this.workflowTemplates.get(id);
  }

  async getWorkflowTemplatesByCategory(category: string): Promise<WorkflowTemplate[]> {
    return Array.from(this.workflowTemplates.values()).filter(template => template.category === category);
  }

  async createWorkflowTemplate(templateData: InsertWorkflowTemplate): Promise<WorkflowTemplate> {
    const template: WorkflowTemplate = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflowTemplates.set(template.id, template);
    return template;
  }

  async updateWorkflowTemplate(id: string, templateData: Partial<InsertWorkflowTemplate>): Promise<WorkflowTemplate | undefined> {
    const existing = this.workflowTemplates.get(id);
    if (!existing) return undefined;
    
    const updated: WorkflowTemplate = {
      ...existing,
      ...templateData,
      updatedAt: new Date(),
    };
    this.workflowTemplates.set(id, updated);
    return updated;
  }

  async deleteWorkflowTemplate(id: string): Promise<boolean> {
    return this.workflowTemplates.delete(id);
  }

  // Task Categories
  async getTaskCategories(): Promise<TaskCategory[]> {
    return Array.from(this.taskCategories.values());
  }

  async getTaskCategory(id: string): Promise<TaskCategory | undefined> {
    return this.taskCategories.get(id);
  }

  async createTaskCategory(categoryData: InsertTaskCategory): Promise<TaskCategory> {
    const category: TaskCategory = {
      id: randomUUID(),
      name: categoryData.name,
      description: categoryData.description || null,
      color: categoryData.color,
      icon: categoryData.icon || null,
      isDefault: categoryData.isDefault || false,
      createdAt: new Date(),
    };
    this.taskCategories.set(category.id, category);
    return category;
  }

  async updateTaskCategory(id: string, categoryData: Partial<InsertTaskCategory>): Promise<TaskCategory | undefined> {
    const existing = this.taskCategories.get(id);
    if (!existing) return undefined;
    
    const updated: TaskCategory = {
      ...existing,
      ...categoryData,
    };
    this.taskCategories.set(id, updated);
    return updated;
  }

  async deleteTaskCategory(id: string): Promise<boolean> {
    return this.taskCategories.delete(id);
  }

  // Task Templates
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return Array.from(this.taskTemplates.values());
  }

  async getTaskTemplate(id: string): Promise<TaskTemplate | undefined> {
    return this.taskTemplates.get(id);
  }

  async getTaskTemplatesByCategory(categoryId: string): Promise<TaskTemplate[]> {
    return Array.from(this.taskTemplates.values()).filter(template => template.categoryId === categoryId);
  }

  async createTaskTemplate(templateData: InsertTaskTemplate): Promise<TaskTemplate> {
    const template: TaskTemplate = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.taskTemplates.set(template.id, template);
    return template;
  }

  async updateTaskTemplate(id: string, templateData: Partial<InsertTaskTemplate>): Promise<TaskTemplate | undefined> {
    const existing = this.taskTemplates.get(id);
    if (!existing) return undefined;
    
    const updated: TaskTemplate = {
      ...existing,
      ...templateData,
      updatedAt: new Date(),
    };
    this.taskTemplates.set(id, updated);
    return updated;
  }

  async deleteTaskTemplate(id: string): Promise<boolean> {
    return this.taskTemplates.delete(id);
  }

  // Enhanced Tasks
  async getEnhancedTasks(): Promise<EnhancedTask[]> {
    return Array.from(this.enhancedTasks.values());
  }

  async getEnhancedTask(id: string): Promise<EnhancedTask | undefined> {
    return this.enhancedTasks.get(id);
  }

  async getEnhancedTasksByClient(clientId: string): Promise<EnhancedTask[]> {
    return Array.from(this.enhancedTasks.values()).filter(task => task.clientId === clientId);
  }


  async getEnhancedTasksByAssignee(assigneeId: string): Promise<EnhancedTask[]> {
    return Array.from(this.enhancedTasks.values()).filter(task => task.assignedTo === assigneeId);
  }

  async getEnhancedTasksByWorkflow(workflowId: string): Promise<EnhancedTask[]> {
    return Array.from(this.enhancedTasks.values()).filter(task => task.workflowId === workflowId);
  }

  async createEnhancedTask(taskData: InsertEnhancedTask): Promise<EnhancedTask> {
    const task: EnhancedTask = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.enhancedTasks.set(task.id, task);
    return task;
  }

  async updateEnhancedTask(id: string, taskData: Partial<InsertEnhancedTask>): Promise<EnhancedTask | undefined> {
    const existing = this.enhancedTasks.get(id);
    if (!existing) return undefined;
    
    const updated: EnhancedTask = {
      ...existing,
      ...taskData,
      updatedAt: new Date(),
      completedAt: taskData.status === "completed" && !existing.completedAt ? new Date() : existing.completedAt,
    };
    this.enhancedTasks.set(id, updated);
    return updated;
  }

  async deleteEnhancedTask(id: string): Promise<boolean> {
    return this.enhancedTasks.delete(id);
  }

  // Task History
  async getTaskHistory(taskId: string): Promise<TaskHistory[]> {
    return this.taskHistory.get(taskId) || [];
  }

  async createTaskHistory(historyData: InsertTaskHistory): Promise<TaskHistory> {
    const history: TaskHistory = {
      id: randomUUID(),
      taskId: historyData.taskId,
      action: historyData.action,
      field: historyData.field || null,
      oldValue: historyData.oldValue || null,
      newValue: historyData.newValue || null,
      userId: historyData.userId,
      timestamp: historyData.timestamp,
      notes: historyData.notes || null,
    };
    
    const existingHistory = this.taskHistory.get(historyData.taskId) || [];
    existingHistory.push(history);
    this.taskHistory.set(historyData.taskId, existingHistory);
    return history;
  }

  // Automation Triggers
  async getAutomationTriggers(): Promise<AutomationTrigger[]> {
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

  async getAutomationTrigger(id: string): Promise<AutomationTrigger | undefined> {
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

  async getAutomationTriggersByCategory(category: string): Promise<AutomationTrigger[]> {
    const triggers = await db.select({
      id: automationTriggers.id,
      name: automationTriggers.name,
      type: automationTriggers.type,
      description: automationTriggers.description,
      category: automationTriggers.category,
      configSchema: automationTriggers.configSchema,
      isActive: automationTriggers.isActive,
      createdAt: automationTriggers.createdAt
    }).from(automationTriggers)
      .where(eq(automationTriggers.category, category))
      .orderBy(asc(automationTriggers.createdAt));
    return triggers;
  }

  async createAutomationTrigger(triggerData: InsertAutomationTrigger): Promise<AutomationTrigger> {
    const result = await db.insert(automationTriggers).values(triggerData).returning();
    return result[0];
  }

  async updateAutomationTrigger(id: string, triggerData: Partial<InsertAutomationTrigger>): Promise<AutomationTrigger | undefined> {
    const result = await db.update(automationTriggers)
      .set(triggerData)
      .where(eq(automationTriggers.id, id))
      .returning();
    return result[0];
  }

  async deleteAutomationTrigger(id: string): Promise<boolean> {
    const result = await db.delete(automationTriggers).where(eq(automationTriggers.id, id)).returning();
    return result.length > 0;
  }

  // Automation Actions
  async getAutomationActions(): Promise<AutomationAction[]> {
    return Array.from(this.automationActions.values());
  }

  async getAutomationAction(id: string): Promise<AutomationAction | undefined> {
    return this.automationActions.get(id);
  }

  async getAutomationActionsByCategory(category: string): Promise<AutomationAction[]> {
    return Array.from(this.automationActions.values()).filter(action => action.category === category);
  }

  async createAutomationAction(actionData: InsertAutomationAction): Promise<AutomationAction> {
    const action: AutomationAction = {
      id: randomUUID(),
      name: actionData.name,
      type: actionData.type,
      description: actionData.description || null,
      category: actionData.category,
      configSchema: actionData.configSchema || null,
      isActive: actionData.isActive || true,
      createdAt: new Date(),
    };
    this.automationActions.set(action.id, action);
    return action;
  }

  async updateAutomationAction(id: string, actionData: Partial<InsertAutomationAction>): Promise<AutomationAction | undefined> {
    const existing = this.automationActions.get(id);
    if (!existing) return undefined;
    
    const updated: AutomationAction = {
      ...existing,
      ...actionData,
    };
    this.automationActions.set(id, updated);
    return updated;
  }

  async deleteAutomationAction(id: string): Promise<boolean> {
    return this.automationActions.delete(id);
  }

  // Template Folders
  async getTemplateFolders(): Promise<TemplateFolder[]> {
    return Array.from(this.templateFolders.values());
  }

  async getTemplateFolder(id: string): Promise<TemplateFolder | undefined> {
    return this.templateFolders.get(id);
  }

  async getTemplateFoldersByType(type: string): Promise<TemplateFolder[]> {
    return Array.from(this.templateFolders.values()).filter(folder => folder.type === type || folder.type === "both");
  }

  async createTemplateFolder(folderData: InsertTemplateFolder): Promise<TemplateFolder> {
    const folder: TemplateFolder = {
      id: randomUUID(),
      name: folderData.name,
      description: folderData.description || null,
      type: folderData.type,
      parentId: folderData.parentId || null,
      order: folderData.order || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.templateFolders.set(folder.id, folder);
    return folder;
  }

  async updateTemplateFolder(id: string, folderData: Partial<InsertTemplateFolder>): Promise<TemplateFolder | undefined> {
    const existing = this.templateFolders.get(id);
    if (!existing) return undefined;
    
    const updated: TemplateFolder = {
      ...existing,
      ...folderData,
      updatedAt: new Date(),
    };
    this.templateFolders.set(id, updated);
    return updated;
  }

  async deleteTemplateFolder(id: string): Promise<boolean> {
    return this.templateFolders.delete(id);
  }

  // Email Templates
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values());
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async getEmailTemplatesByFolder(folderId: string): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values()).filter(template => template.folderId === folderId);
  }

  async createEmailTemplate(templateData: InsertEmailTemplate): Promise<EmailTemplate> {
    const template: EmailTemplate = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.emailTemplates.set(template.id, template);
    return template;
  }

  async updateEmailTemplate(id: string, templateData: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const existing = this.emailTemplates.get(id);
    if (!existing) return undefined;
    
    const updated: EmailTemplate = {
      ...existing,
      ...templateData,
      updatedAt: new Date(),
    };
    this.emailTemplates.set(id, updated);
    return updated;
  }

  async deleteEmailTemplate(id: string): Promise<boolean> {
    return this.emailTemplates.delete(id);
  }

  // Scheduled Emails
  async getScheduledEmails(): Promise<ScheduledEmail[]> {
    return Array.from(this.scheduledEmails.values());
  }

  async getScheduledEmail(id: string): Promise<ScheduledEmail | undefined> {
    return this.scheduledEmails.get(id);
  }

  async getScheduledEmailsByClient(clientId: string): Promise<ScheduledEmail[]> {
    return Array.from(this.scheduledEmails.values()).filter(email => email.clientId === clientId);
  }

  async createScheduledEmail(scheduledEmailData: InsertScheduledEmail): Promise<ScheduledEmail> {
    const scheduledEmail: ScheduledEmail = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.scheduledEmails.set(scheduledEmail.id, scheduledEmail);
    return scheduledEmail;
  }

  async updateScheduledEmail(id: string, scheduledEmailData: Partial<InsertScheduledEmail>): Promise<ScheduledEmail | undefined> {
    const existing = this.scheduledEmails.get(id);
    if (!existing) return undefined;
    
    const updated: ScheduledEmail = {
      ...existing,
      ...scheduledEmailData,
      updatedAt: new Date(),
    };
    this.scheduledEmails.set(id, updated);
    return updated;
  }

  async deleteScheduledEmail(id: string): Promise<boolean> {
    return this.scheduledEmails.delete(id);
  }

  async markScheduledEmailAsSent(id: string, sentAt: Date): Promise<void> {
    const existing = this.scheduledEmails.get(id);
    if (existing) {
      const updated: ScheduledEmail = {
        ...existing,
        status: "sent",
        sentAt,
        updatedAt: new Date(),
      };
      this.scheduledEmails.set(id, updated);
    }
  }

  async markScheduledEmailAsFailed(id: string, failureReason: string): Promise<void> {
    const existing = this.scheduledEmails.get(id);
    if (existing) {
      const updated: ScheduledEmail = {
        ...existing,
        status: "failed",
        failureReason,
        retryCount: (existing.retryCount || 0) + 1,
        updatedAt: new Date(),
      };
      this.scheduledEmails.set(id, updated);
    }
  }

  // SMS Templates
  async getSmsTemplates(): Promise<SmsTemplate[]> {
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

  async getSmsTemplate(id: string): Promise<SmsTemplate | undefined> {
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
      return undefined;
    }
  }

  async getSmsTemplatesByFolder(folderId: string): Promise<SmsTemplate[]> {
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

  async createSmsTemplate(templateData: InsertSmsTemplate): Promise<SmsTemplate> {
    try {
      const result = await db.insert(smsTemplates).values(templateData).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating SMS template:", error);
      throw error;
    }
  }

  async updateSmsTemplate(id: string, templateData: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined> {
    try {
      const result = await db.update(smsTemplates).set(templateData).where(eq(smsTemplates.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating SMS template:", error);
      return undefined;
    }
  }

  async deleteSmsTemplate(id: string): Promise<boolean> {
    try {
      await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting SMS template:", error);
      return false;
    }
  }

  // Custom Fields
  async getCustomFields(): Promise<CustomField[]> {
    return Array.from(this.customFields.values());
  }

  async getCustomField(id: string): Promise<CustomField | undefined> {
    return this.customFields.get(id);
  }

  async createCustomField(fieldData: InsertCustomField): Promise<CustomField> {
    const field: CustomField = {
      id: randomUUID(),
      name: fieldData.name,
      type: fieldData.type,
      options: fieldData.options || null,
      required: fieldData.required || false,
      order: fieldData.order || 0,
      folderId: fieldData.folderId || null,
      createdAt: new Date(),
    };
    this.customFields.set(field.id, field);
    return field;
  }

  async updateCustomField(id: string, fieldData: Partial<InsertCustomField>): Promise<CustomField | undefined> {
    const existing = this.customFields.get(id);
    if (!existing) return undefined;
    
    const updated: CustomField = {
      ...existing,
      ...fieldData,
    };
    this.customFields.set(id, updated);
    return updated;
  }

  async deleteCustomField(id: string): Promise<void> {
    this.customFields.delete(id);
  }

  // Tags
  private tags = new Map<string, Tag>();

  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTag(id: string): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async createTag(tagData: InsertTag): Promise<Tag> {
    const tag: Tag = {
      id: randomUUID(),
      name: tagData.name,
      color: tagData.color || "#46a1a0",
      description: tagData.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tags.set(tag.id, tag);
    return tag;
  }

  async updateTag(id: string, tagData: Partial<InsertTag>): Promise<Tag | undefined> {
    const existing = this.tags.get(id);
    if (!existing) return undefined;

    const updated: Tag = {
      ...existing,
      ...tagData,
      updatedAt: new Date(),
    };
    this.tags.set(id, updated);
    return updated;
  }

  async deleteTag(id: string): Promise<boolean> {
    return this.tags.delete(id);
  }

  // Custom Field Folders
  async getCustomFieldFolders(): Promise<CustomFieldFolder[]> {
    return Array.from(this.customFieldFolders.values());
  }

  async getCustomFieldFolder(id: string): Promise<CustomFieldFolder | undefined> {
    return this.customFieldFolders.get(id);
  }

  async createCustomFieldFolder(folderData: InsertCustomFieldFolder): Promise<CustomFieldFolder> {
    const folder: CustomFieldFolder = {
      id: randomUUID(),
      name: folderData.name,
      description: folderData.description || null,
      order: folderData.order || 0,
      isDefault: folderData.isDefault || false,
      canReorder: folderData.canReorder || true,
      createdAt: new Date(),
    };
    this.customFieldFolders.set(folder.id, folder);
    return folder;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(notification => notification.userId === userId);
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(notification => 
      notification.userId === userId && !notification.isRead
    );
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const notification: Notification = {
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
      createdAt: new Date(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    notification.isRead = true;
    notification.readAt = new Date();
    this.notifications.set(id, notification);
    return true;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.values()).filter(n => n.userId === userId);
    const now = new Date();
    
    userNotifications.forEach(notification => {
      notification.isRead = true;
      notification.readAt = now;
      this.notifications.set(notification.id, notification);
    });
    
    return true;
  }

  async deleteNotification(id: string): Promise<boolean> {
    return this.notifications.delete(id);
  }

  private initializeCustomFields() {
    // Sample custom fields that would be created by users
    const fields: CustomField[] = [
      {
        id: "cf-1",
        name: "Lead Score",
        type: "number",
        options: null,
        required: false,
        order: 1,
        folderId: null,
        createdAt: new Date(),
      },
      {
        id: "cf-2",
        name: "Marketing Preferences",
        type: "dropdown",
        options: ["Email", "Phone", "Text", "Direct Mail"],
        required: false,
        order: 2,
        folderId: null,
        createdAt: new Date(),
      },
      {
        id: "cf-3",
        name: "Acquisition Channel",
        type: "text",
        options: null,
        required: false,
        order: 3,
        folderId: null,
        createdAt: new Date(),
      },
      {
        id: "cf-4",
        name: "Customer Tier",
        type: "dropdown",
        options: ["Bronze", "Silver", "Gold", "Platinum"],
        required: false,
        order: 4,
        folderId: null,
        createdAt: new Date(),
      },
      {
        id: "cf-5",
        name: "Last Contact Date",
        type: "date",
        options: null,
        required: false,
        order: 5,
        folderId: null,
        createdAt: new Date(),
      }
    ];

    fields.forEach(field => {
      this.customFields.set(field.id, field);
    });
  }

  // Audit Logs Implementation
  async getAuditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getAuditLog(id: string): Promise<AuditLog | undefined> {
    return this.auditLogs.get(id);
  }

  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.entityType === entityType && log.entityId === entityId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const newAuditLog: AuditLog = {
      ...auditLog,
      id,
      timestamp: new Date(),
    };
    this.auditLogs.set(id, newAuditLog);
    return newAuditLog;
  }

  // Smart Lists implementation for MemStorage
  private smartLists: Map<string, SmartList> = new Map();

  async getSmartLists(userId: string, entityType?: string): Promise<SmartList[]> {
    const allLists = Array.from(this.smartLists.values());
    
    // Filter by entity type if provided
    const filteredByEntity = entityType 
      ? allLists.filter(list => list.entityType === entityType)
      : allLists;
    
    // Filter by visibility permissions  
    return filteredByEntity.filter(list => {
      // Universal lists are visible to everyone
      if (list.visibility === 'universal') return true;
      
      // Personal lists are only visible to the creator
      if (list.visibility === 'personal') return list.createdBy === userId;
      
      // Shared lists are visible to creator and shared users
      if (list.visibility === 'shared') {
        return list.createdBy === userId || (list.sharedWith && list.sharedWith.includes(userId));
      }
      
      return false;
    });
  }

  async getSmartList(id: string): Promise<SmartList | undefined> {
    return this.smartLists.get(id);
  }

  async createSmartList(smartList: InsertSmartList): Promise<SmartList> {
    const id = randomUUID();
    const newSmartList: SmartList = {
      ...smartList,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.smartLists.set(id, newSmartList);
    return newSmartList;
  }

  async updateSmartList(id: string, smartList: Partial<InsertSmartList>): Promise<SmartList | undefined> {
    const existing = this.smartLists.get(id);
    if (!existing) return undefined;
    
    const updated: SmartList = {
      ...existing,
      ...smartList,
      updatedAt: new Date(),
    };
    this.smartLists.set(id, updated);
    return updated;
  }

  async deleteSmartList(id: string): Promise<boolean> {
    return this.smartLists.delete(id);
  }

  // Client Brief Sections implementation for MemStorage
  private clientBriefSections: Map<string, ClientBriefSection> = new Map();
  private clientBriefValues: Map<string, ClientBriefValue> = new Map();

  async listBriefSections(): Promise<ClientBriefSection[]> {
    const sections = Array.from(this.clientBriefSections.values());
    return sections.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getBriefSection(id: string): Promise<ClientBriefSection | undefined> {
    return this.clientBriefSections.get(id);
  }

  async getBriefSectionByKey(key: string): Promise<ClientBriefSection | undefined> {
    return Array.from(this.clientBriefSections.values()).find(section => section.key === key);
  }

  async createBriefSection(section: InsertClientBriefSection): Promise<ClientBriefSection> {
    const id = randomUUID();
    const newSection: ClientBriefSection = {
      ...section,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.clientBriefSections.set(id, newSection);
    return newSection;
  }

  async updateBriefSection(id: string, sectionData: Partial<InsertClientBriefSection>): Promise<ClientBriefSection | undefined> {
    const existing = this.clientBriefSections.get(id);
    if (!existing) return undefined;

    const updated: ClientBriefSection = {
      ...existing,
      ...sectionData,
      updatedAt: new Date(),
    };
    this.clientBriefSections.set(id, updated);
    return updated;
  }

  async deleteBriefSection(id: string): Promise<boolean> {
    return this.clientBriefSections.delete(id);
  }

  async reorderBriefSections(sectionIds: string[]): Promise<void> {
    sectionIds.forEach((id, index) => {
      const section = this.clientBriefSections.get(id);
      if (section) {
        section.displayOrder = index;
        section.updatedAt = new Date();
        this.clientBriefSections.set(id, section);
      }
    });
  }

  async getClientBrief(clientId: string): Promise<Array<ClientBriefSection & { value?: string }>> {
    const sections = await this.listBriefSections();
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    
    return sections.map(section => {
      let value = undefined;
      
      // Get value from core client data if it's a core section
      if (client && section.key) {
        switch (section.key) {
          case 'background':
            value = client.briefBackground || undefined;
            break;
          case 'objectives':
            value = client.briefObjectives || undefined;
            break;
          case 'brand_info':
            value = client.briefBrandInfo || undefined;
            break;
          case 'audience_info':
            value = client.briefAudienceInfo || undefined;
            break;
          case 'products_services':
            value = client.briefProductsServices || undefined;
            break;
          case 'competitors':
            value = client.briefCompetitors || undefined;
            break;
          case 'marketing_tech':
            value = client.briefMarketingTech || undefined;
            break;
          case 'miscellaneous':
            value = client.briefMiscellaneous || undefined;
            break;
        }
      }

      // If no core value, check custom values
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

  async setClientBriefValue(clientId: string, sectionId: string, value: string): Promise<void> {
    const section = await this.getBriefSection(sectionId);
    if (!section) return;

    // If it's a core section, update client directly
    if (section.key && section.isCoreSection) {
      const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      if (client) {
        const updateData: Partial<InsertClient> = {};
        
        switch (section.key) {
          case 'background':
            updateData.briefBackground = value;
            break;
          case 'objectives':
            updateData.briefObjectives = value;
            break;
          case 'brand_info':
            updateData.briefBrandInfo = value;
            break;
          case 'audience_info':
            updateData.briefAudienceInfo = value;
            break;
          case 'products_services':
            updateData.briefProductsServices = value;
            break;
          case 'competitors':
            updateData.briefCompetitors = value;
            break;
          case 'marketing_tech':
            updateData.briefMarketingTech = value;
            break;
          case 'miscellaneous':
            updateData.briefMiscellaneous = value;
            break;
        }
        
        await this.updateClient(clientId, updateData);
      }
    } else {
      // Custom section, store in clientBriefValues
      const briefValueKey = `${clientId}-${sectionId}`;
      const briefValue: ClientBriefValue = {
        id: randomUUID(),
        clientId,
        sectionId,
        value,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.clientBriefValues.set(briefValueKey, briefValue);
    }
  }

  // Email Integrations
  async getEmailIntegrations(): Promise<EmailIntegration[]> {
    return Array.from(this.emailIntegrations.values());
  }

  async getEmailIntegration(id: string): Promise<EmailIntegration | undefined> {
    return this.emailIntegrations.get(id);
  }

  async getEmailIntegrationByProvider(provider: string): Promise<EmailIntegration | undefined> {
    return Array.from(this.emailIntegrations.values()).find(integration => integration.provider === provider);
  }

  async createEmailIntegration(integrationData: InsertEmailIntegration): Promise<EmailIntegration> {
    const integration: EmailIntegration = {
      id: randomUUID(),
      ...integrationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.emailIntegrations.set(integration.id, integration);
    return integration;
  }

  async updateEmailIntegration(id: string, integrationData: Partial<InsertEmailIntegration>): Promise<EmailIntegration | undefined> {
    const integration = this.emailIntegrations.get(id);
    if (!integration) return undefined;

    const updated: EmailIntegration = {
      ...integration,
      ...integrationData,
      updatedAt: new Date(),
    };
    this.emailIntegrations.set(id, updated);
    return updated;
  }

  async deleteEmailIntegration(id: string): Promise<boolean> {
    return this.emailIntegrations.delete(id);
  }

  async getUserViewPreference(userId: string, viewType: string): Promise<any> {
    return null;
  }

  async saveUserViewPreference(userId: string, viewType: string, preferences: any): Promise<any> {
    return { userId, viewType, preferences };
  }

}

// Database storage implementation using PostgreSQL

export class DbStorage implements IStorage {
  private memStorage = new MemStorage();
  
  constructor() {
    // Initialize auth methods as instance properties to ensure accessibility
    this.getAuthUserByEmail = async (email: string): Promise<AuthUser | undefined> => {
      try {
        const result = await db.select().from(authUsers).where(eq(authUsers.email, email.toLowerCase()));
        return result[0];
      } catch (error) {
        console.error("Error fetching auth user:", error);
        return undefined;
      }
    };

    this.createAuthUser = async (authUser: InsertAuthUser): Promise<AuthUser> => {
      try {
        const result = await db.insert(authUsers).values({
          ...authUser,
          email: authUser.email.toLowerCase(),
          id: sql`gen_random_uuid()`,
          createdAt: new Date(),
        }).returning();
        return result[0];
      } catch (error) {
        console.error("Error creating auth user:", error);
        throw error;
      }
    };

    this.updateLastLogin = async (authUserId: string): Promise<void> => {
      try {
        await db.update(authUsers)
          .set({ lastLogin: new Date() })
          .where(eq(authUsers.id, authUserId));
      } catch (error) {
        console.error("Error updating last login:", error);
        throw error;
      }
    };

    this.setPasswordHash = async (authUserId: string, passwordHash: string): Promise<void> => {
      try {
        await db.update(authUsers)
          .set({ passwordHash })
          .where(eq(authUsers.id, authUserId));
      } catch (error) {
        console.error("Error setting password hash:", error);
        throw error;
      }
    };
  }

  // Clients
  async getClients(): Promise<Client[]> {
    try {
      const result = await db.select().from(clients);
      return result;
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  }

  async getClient(id: string): Promise<Client | undefined> {
    try {
      const result = await db.select().from(clients).where(eq(clients.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching client:", error);
      return undefined;
    }
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    try {
      const result = await db.insert(clients).values({
        ...insertClient,
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  }

  async updateClient(id: string, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    try {
      const result = await db.update(clients)
        .set({
          ...clientData,
          updatedAt: new Date()
        })
        .where(eq(clients.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating client:", error);
      throw error;
    }
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      // First delete all related records that reference this client
      // Delete client brief values
      await db.delete(clientBriefValues).where(eq(clientBriefValues.clientId, id));
      
      // Delete campaigns
      await db.delete(campaigns).where(eq(campaigns.clientId, id));
      
      // Delete client health scores  
      await db.delete(clientHealthScores).where(eq(clientHealthScores.clientId, id));
      
      // Then delete the client itself
      const result = await db.delete(clients).where(eq(clients.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
  }

  async archiveClient(id: string): Promise<Client | undefined> {
    try {
      const result = await db
        .update(clients)
        .set({ isArchived: true })
        .where(eq(clients.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error archiving client:", error);
      throw error;
    }
  }

  async reassignClientTasks(fromClientId: string, toClientId: string): Promise<{ movedCount: number }> {
    try {
      const result = await db
        .update(tasks)
        .set({ clientId: toClientId })
        .where(eq(tasks.clientId, fromClientId))
        .returning();
      return { movedCount: result.length };
    } catch (error) {
      console.error("Error reassigning client tasks:", error);
      throw error;
    }
  }

  async getClientRelationsCounts(id: string): Promise<{ tasks: number; campaigns: number; invoices: number; healthScores: number }> {
    try {
      const [tasksCount, campaignsCount, invoicesCount, healthScoresCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.clientId, id)),
        db.select({ count: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.clientId, id)),
        db.select({ count: sql<number>`count(*)` }).from(invoices).where(eq(invoices.clientId, id)),
        db.select({ count: sql<number>`count(*)` }).from(clientHealthScores).where(eq(clientHealthScores.clientId, id))
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
  async createClientHealthScore(data: InsertClientHealthScore): Promise<ClientHealthScore> {
    const result = await db.insert(clientHealthScores).values({
      ...data,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getClientHealthScores(clientId: string): Promise<ClientHealthScore[]> {
    return await db.select()
      .from(clientHealthScores)
      .where(eq(clientHealthScores.clientId, clientId))
      .orderBy(desc(clientHealthScores.weekStartDate));
  }

  async getClientHealthScore(id: string): Promise<ClientHealthScore | null> {
    const result = await db.select()
      .from(clientHealthScores)
      .where(eq(clientHealthScores.id, id));
    return result[0] || null;
  }

  async updateClientHealthScore(id: string, data: Partial<InsertClientHealthScore>): Promise<ClientHealthScore> {
    const result = await db.update(clientHealthScores)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(clientHealthScores.id, id))
      .returning();
    return result[0];
  }

  async deleteClientHealthScore(id: string): Promise<void> {
    await db.delete(clientHealthScores).where(eq(clientHealthScores.id, id));
  }

  // Activities
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    try {
      const result = await db.insert(activities).values({
        ...insertActivity,
        id: randomUUID(),
        createdAt: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  }

  async getClientHealthScoreByWeek(clientId: string, weekStartDate: Date): Promise<ClientHealthScore | null> {
    const result = await db.select()
      .from(clientHealthScores)
      .where(and(
        eq(clientHealthScores.clientId, clientId),
        eq(clientHealthScores.weekStartDate, weekStartDate.toISOString().split('T')[0])
      ));
    return result[0] || null;
  }

  // Health Scores Bulk API
  async getHealthScoresFiltered(filters: {
    from?: string;
    to?: string; 
    statuses?: string[];
    search?: string;
    clientId?: string;
    latestPerClient?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
    sortOrder?: string;
  }): Promise<{
    items: Array<ClientHealthScore & { clientName: string; clientEmail: string }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      from,
      to,
      statuses,
      search,
      clientId,
      latestPerClient = false,
      page = 1,
      limit = 50,
      sort = 'weekStartDate',
      sortOrder = 'desc'
    } = filters;

    // Build WHERE conditions
    const conditions: any[] = [];

    // Date range filtering
    if (from) {
      conditions.push(sql`${clientHealthScores.weekStartDate} >= ${from}`);
    }
    if (to) {
      conditions.push(sql`${clientHealthScores.weekStartDate} <= ${to}`);
    }

    // Health status filtering
    if (statuses && statuses.length > 0) {
      // Use proper Drizzle ORM syntax for IN clause
      conditions.push(sql`${clientHealthScores.healthIndicator} IN (${sql.join(statuses.map(status => sql`${status}`), sql`, `)})`);
    }

    // Client search (name or email)
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          sql`LOWER(${clients.name}) LIKE LOWER(${searchTerm})`,
          sql`LOWER(${clients.email}) LIKE LOWER(${searchTerm})`
        )
      );
    }

    // Specific client filtering
    if (clientId) {
      conditions.push(eq(clientHealthScores.clientId, clientId));
    }

    // For latest per client, we need a different approach
    let baseQuery = db
      .select({
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
        totalScore: clientHealthScores.totalScore,
        averageScore: clientHealthScores.averageScore,
        healthIndicator: clientHealthScores.healthIndicator,
        createdAt: clientHealthScores.createdAt,
        updatedAt: clientHealthScores.updatedAt,
        clientName: clients.name,
        clientEmail: clients.email
      })
      .from(clientHealthScores)
      .innerJoin(clients, eq(clientHealthScores.clientId, clients.id));

    // Apply WHERE conditions to base query
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    // Handle latestPerClient option with a simpler two-step approach
    if (latestPerClient) {
      // First, get the latest week start date for each client
      const latestWeeks = await db
        .select({
          clientId: clientHealthScores.clientId,
          maxWeekStart: max(clientHealthScores.weekStartDate).as('maxWeekStart')
        })
        .from(clientHealthScores)
        .groupBy(clientHealthScores.clientId);

      // Create array of (clientId, maxWeekStart) pairs for filtering
      const clientWeekPairs = latestWeeks.map(item => ({
        clientId: item.clientId,
        weekStartDate: item.maxWeekStart
      }));

      // If we have pairs, add them as conditions
      if (clientWeekPairs.length > 0) {
        const latestConditions = clientWeekPairs.map(pair => 
          and(
            eq(clientHealthScores.clientId, pair.clientId),
            eq(clientHealthScores.weekStartDate, pair.weekStartDate)
          )
        );
        conditions.push(or(...latestConditions));
      }
    }

    // Apply sorting using proper column references
    const sortColumn = sort === 'weekStartDate' ? clientHealthScores.weekStartDate :
                       sort === 'clientName' ? clients.name :
                       sort === 'healthIndicator' ? clientHealthScores.healthIndicator :
                       sort === 'averageScore' ? clientHealthScores.averageScore :
                       clientHealthScores.weekStartDate;

    if (sortOrder === 'desc') {
      baseQuery = baseQuery.orderBy(desc(sortColumn));
    } else {
      baseQuery = baseQuery.orderBy(asc(sortColumn));
    }

    // Get total count (simpler approach)
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(clientHealthScores)
      .innerJoin(clients, eq(clientHealthScores.clientId, clients.id));

    // Apply same WHERE conditions to count query
    let countConditions = [...conditions];
    if (countConditions.length > 0) {
      countQuery = countQuery.where(and(...countConditions));
    }

    // For latestPerClient count, use a simplified approach
    if (latestPerClient) {
      // Count distinct clients instead of all records
      countQuery = db
        .select({ count: sql<number>`count(DISTINCT ${clientHealthScores.clientId})` })
        .from(clientHealthScores)
        .innerJoin(clients, eq(clientHealthScores.clientId, clients.id));
        
      if (countConditions.length > 0) {
        countQuery = countQuery.where(and(...countConditions));
      }
    }

    // Execute queries in parallel
    const offset = (page - 1) * limit;
    const [items, totalResult] = await Promise.all([
      baseQuery.limit(limit).offset(offset),
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      items: items as Array<ClientHealthScore & { clientName: string; clientEmail: string }>,
      total,
      page,
      limit
    };
  }

  async getAllClientsForExport(): Promise<Client[]> {
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
  async getTimeTrackingReport(filters: import("@shared/schema").TimeTrackingReportFilters): Promise<import("@shared/schema").TimeTrackingReportData> {
    const { dateFrom, dateTo, userId, clientId, taskStatus, reportType } = filters;
    
    // Build base query conditions
    const conditions: any[] = [];
    
    // Add date range conditions for timeEntries (JSONB query)
    // We'll filter tasks that have time entries within the date range
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements(${tasks.timeEntries}) AS entry
        WHERE entry->>'startTime' IS NOT NULL
        AND (entry->>'startTime')::date >= ${dateFrom}::date
        AND (entry->>'startTime')::date <= ${dateTo}::date
      )`
    );
    
    // Filter by user if specified
    if (userId) {
      conditions.push(eq(tasks.assignedTo, userId));
    }
    
    // Filter by client if specified
    if (clientId) {
      conditions.push(eq(tasks.clientId, clientId));
    }
    
    // Filter by task status if specified
    if (taskStatus && taskStatus.length > 0) {
      conditions.push(sql`${tasks.status} IN (${sql.join(taskStatus.map(status => sql`${status}`), sql`, `)})`);
    }
    
    // Get basic task data first to avoid complex join issues
    const tasksQuery = db
      .select()
      .from(tasks)
      .where(and(...conditions));
    
    const tasksData = await tasksQuery;
    
    // Process the results to format time entries by date
    const tasksWithDetails = tasksData.map(task => {
      const timeEntriesByDate: Record<string, import("@shared/schema").TimeEntry[]> = {};
      
      if (task.timeEntries && Array.isArray(task.timeEntries)) {
        (task.timeEntries as any[]).forEach((entry: any) => {
          if (!entry.startTime) return;
          const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
          if (entryDate >= dateFrom && entryDate <= dateTo) {
            if (!timeEntriesByDate[entryDate]) {
              timeEntriesByDate[entryDate] = [];
            }
            timeEntriesByDate[entryDate].push(entry as import("@shared/schema").TimeEntry);
          }
        });
      }
      
      const totalTracked = Object.values(timeEntriesByDate)
        .flat()
        .reduce((sum, entry) => sum + (entry.duration || 0), 0);
      
      return {
        ...task,
        userInfo: undefined, // Simplified - we'll get this info separately if needed
        clientInfo: undefined, // Simplified - we'll get this info separately if needed  
        timeEntriesByDate,
        totalTracked
      };
    });
    
    // Calculate user summaries
    const userSummaries: import("@shared/schema").UserSummary[] = [];
    const userTimeMap = new Map<string, any>();
    
    tasksWithDetails.forEach(task => {
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        entries.forEach(entry => {
          if (!userTimeMap.has(entry.userId)) {
            userTimeMap.set(entry.userId, {
              userId: entry.userId,
              userName: task.userInfo?.firstName ? `${task.userInfo.firstName} ${task.userInfo.lastName}` : `User ${entry.userId}`,
              userRole: task.userInfo?.role || 'User',
              department: task.userInfo ? tasksData.find(t => t.userId === entry.userId)?.userDepartment : undefined,
              totalTime: 0,
              tasksWorked: new Set(),
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
    
    userTimeMap.forEach((userData, userId) => {
      userSummaries.push({
        userId,
        userName: userData.userName,
        userRole: userData.userRole,
        department: userData.department,
        totalTime: userData.totalTime,
        tasksWorked: userData.tasksWorked.size,
        dailyTotals: userData.dailyTotals
      });
    });
    
    // Calculate client breakdowns
    const clientBreakdowns: import("@shared/schema").ClientBreakdown[] = [];
    const clientTimeMap = new Map<string, any>();
    
    tasksWithDetails.forEach(task => {
      if (!task.clientId) return;
      
      if (!clientTimeMap.has(task.clientId)) {
        clientTimeMap.set(task.clientId, {
          clientId: task.clientId,
          clientName: task.clientInfo?.name || `Client ${task.clientId}`,
          totalTime: 0,
          tasksCount: new Set(),
          users: new Map()
        });
      }
      
      const clientData = clientTimeMap.get(task.clientId);
      clientData.tasksCount.add(task.id);
      
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        entries.forEach(entry => {
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
    
    clientTimeMap.forEach((clientData, clientId) => {
      clientBreakdowns.push({
        clientId,
        clientName: clientData.clientName,
        totalTime: clientData.totalTime,
        tasksCount: clientData.tasksCount.size,
        users: Array.from(clientData.users.values())
      });
    });
    
    // Calculate daily totals
    const dailyTotals: Record<string, number> = {};
    tasksWithDetails.forEach(task => {
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        if (!dailyTotals[date]) {
          dailyTotals[date] = 0;
        }
        entries.forEach(entry => {
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
  
  async getUserTimeEntries(userId: string, dateFrom: string, dateTo: string): Promise<Array<Task & { timeEntries: import("@shared/schema").TimeEntry[] }>> {
    // Query tasks assigned to the user that have time entries in the date range
    const tasksData = await db
      .select()
      .from(tasks)
      .where(
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
    
    // Filter time entries to only include those in the date range
    return tasksData.map(task => ({
      ...task,
      timeEntries: task.timeEntries && Array.isArray(task.timeEntries) 
        ? (task.timeEntries as any[]).filter((entry: any) => {
            if (!entry.startTime) return false;
            const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
            return entryDate >= dateFrom && entryDate <= dateTo;
          }) as import("@shared/schema").TimeEntry[]
        : []
    }));
  }
  
  async getRunningTimeEntries(): Promise<Array<{ taskId: string; userId: string; startTime: string }>> {
    // Query tasks that have running time entries
    const tasksData = await db
      .select({
        id: tasks.id,
        timeEntries: tasks.timeEntries
      })
      .from(tasks)
      .where(
        sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements(${tasks.timeEntries}) AS entry
          WHERE (entry->>'isRunning')::boolean = true
        )`
      );
    
    const runningEntries: Array<{ taskId: string; userId: string; startTime: string }> = [];
    
    tasksData.forEach(task => {
      if (!task.timeEntries || !Array.isArray(task.timeEntries)) return;
      
      (task.timeEntries as any[]).forEach((entry: any) => {
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
  
  async getTimeEntriesByDateRange(dateFrom: string, dateTo: string, userId?: string, clientId?: string): Promise<Array<Task & { timeEntries: import("@shared/schema").TimeEntry[] }>> {
    console.log(`🔍 getTimeEntriesByDateRange called with userId: ${userId}`);
    
    // For dev-admin users, ignore the userId filter to show all data
    let effectiveUserId = userId;
    if (userId && userId.startsWith('dev-admin-')) {
      console.log(`🚀 Dev-admin user detected, showing all time data instead of filtering by: ${userId}`);
      effectiveUserId = undefined; // Don't filter by user - show all data
    }
    
    // Build conditions
    const conditions: any[] = [
      sql`EXISTS (
        SELECT 1 FROM jsonb_array_elements(${tasks.timeEntries}) AS entry
        WHERE entry->>'startTime' IS NOT NULL
        AND (entry->>'startTime')::date >= ${dateFrom}::date
        AND (entry->>'startTime')::date <= ${dateTo}::date
      )`
    ];
    
    // Filter by user if specified
    if (effectiveUserId) {
      conditions.push(eq(tasks.assignedTo, effectiveUserId));
    }
    
    // Filter by client if specified  
    if (clientId) {
      conditions.push(eq(tasks.clientId, clientId));
    }
    
    // Query tasks
    const tasksData = await db
      .select()
      .from(tasks)
      .where(and(...conditions));
    
    // Filter time entries to only include those in the date range
    return tasksData.map(task => ({
      ...task,
      timeEntries: task.timeEntries && Array.isArray(task.timeEntries) 
        ? (task.timeEntries as any[]).filter((entry: any) => {
            if (!entry.startTime) return false;
            const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
            return entryDate >= dateFrom && entryDate <= dateTo;
          }) as import("@shared/schema").TimeEntry[]
        : []
    }));
  }


  // Campaigns  
  async getCampaigns(): Promise<Campaign[]> { return this.memStorage.getCampaigns(); }
  async getCampaign(id: string): Promise<Campaign | undefined> { return this.memStorage.getCampaign(id); }
  async getCampaignsByClient(clientId: string): Promise<Campaign[]> { return this.memStorage.getCampaignsByClient(clientId); }
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> { return this.memStorage.createCampaign(campaign); }
  async updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> { return this.memStorage.updateCampaign(id, campaign); }
  async deleteCampaign(id: string): Promise<boolean> { return this.memStorage.deleteCampaign(id); }

  // Leads
  async getLeads(): Promise<Lead[]> { return this.memStorage.getLeads(); }
  async getLead(id: string): Promise<Lead | undefined> { return this.memStorage.getLead(id); }
  async createLead(lead: InsertLead): Promise<Lead> { return this.memStorage.createLead(lead); }
  async updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined> { return this.memStorage.updateLead(id, lead); }
  async deleteLead(id: string): Promise<boolean> { return this.memStorage.deleteLead(id); }

  // Tasks
  async getTasks(): Promise<Task[]> { return this.memStorage.getTasks(); }
  async getTask(id: string): Promise<Task | undefined> { return this.memStorage.getTask(id); }
  async getTasksByClient(clientId: string): Promise<Task[]> {
    // Query database directly for client tasks
    const clientTasks = await db.select().from(tasks).where(eq(tasks.clientId, clientId));
    return clientTasks;
  }
  async createTask(task: InsertTask): Promise<Task> { return this.memStorage.createTask(task); }
  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> { return this.memStorage.updateTask(id, task); }
  async deleteTask(id: string): Promise<boolean> { return this.memStorage.deleteTask(id); }
  
  async updateTasksStatusForClient(
    clientId: string, 
    targetStatus: string, 
    filters?: {
      includeStatuses?: string[];
      excludeStatuses?: string[];
      assignedTo?: string;
      priorities?: string[];
    }
  ): Promise<{ count: number; taskIds: string[] }> {
    const { db } = await import("./db");
    const { tasks } = await import("@shared/schema");
    const { eq, and, inArray, notInArray } = await import("drizzle-orm");
    
    // Build WHERE conditions
    const conditions = [eq(tasks.clientId, clientId)];
    
    if (filters?.includeStatuses && filters.includeStatuses.length > 0) {
      conditions.push(inArray(tasks.status, filters.includeStatuses));
    }
    
    if (filters?.excludeStatuses && filters.excludeStatuses.length > 0) {
      conditions.push(notInArray(tasks.status, filters.excludeStatuses));
    }
    
    if (filters?.assignedTo) {
      conditions.push(eq(tasks.assignedTo, filters.assignedTo));
    }
    
    if (filters?.priorities && filters.priorities.length > 0) {
      conditions.push(inArray(tasks.priority, filters.priorities));
    }
    
    // Update all matching tasks
    const result = await db
      .update(tasks)
      .set({ 
        status: targetStatus,
        updatedAt: new Date()
      })
      .where(and(...conditions))
      .returning({ id: tasks.id });
    
    return {
      count: result.length,
      taskIds: result.map(r => r.id)
    };
  }
  
  // Client Approval Operations
  async updateTaskClientApproval(
    taskId: string, 
    status: 'pending' | 'approved' | 'rejected' | 'changes_requested',
    notes?: string
  ): Promise<Task | undefined> { 
    return this.memStorage.updateTaskClientApproval(taskId, status, notes); 
  }
  async approveTask(taskId: string, notes?: string): Promise<Task | undefined> { 
    return this.memStorage.approveTask(taskId, notes); 
  }
  async requestTaskChanges(taskId: string, notes: string): Promise<Task | undefined> { 
    return this.memStorage.requestTaskChanges(taskId, notes); 
  }

  // Smart Lists - using database implementation at end of file

  // Invoices  
  async getInvoices(): Promise<Invoice[]> { return this.memStorage.getInvoices(); }
  async getInvoice(id: string): Promise<Invoice | undefined> { return this.memStorage.getInvoice(id); }
  async getInvoicesByClient(clientId: string): Promise<Invoice[]> { return this.memStorage.getInvoicesByClient(clientId); }
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> { return this.memStorage.createInvoice(invoice); }
  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> { return this.memStorage.updateInvoice(id, invoice); }
  async deleteInvoice(id: string): Promise<boolean> { return this.memStorage.deleteInvoice(id); }

  // Social Media
  async getSocialMediaAccounts(): Promise<SocialMediaAccount[]> { return this.memStorage.getSocialMediaAccounts(); }
  async getSocialMediaAccount(id: string): Promise<SocialMediaAccount | undefined> { return this.memStorage.getSocialMediaAccount(id); }
  async getSocialMediaAccountsByClient(clientId: string): Promise<SocialMediaAccount[]> { return this.memStorage.getSocialMediaAccountsByClient(clientId); }
  async createSocialMediaAccount(account: InsertSocialMediaAccount): Promise<SocialMediaAccount> { return this.memStorage.createSocialMediaAccount(account); }
  async updateSocialMediaAccount(id: string, account: Partial<InsertSocialMediaAccount>): Promise<SocialMediaAccount | undefined> { return this.memStorage.updateSocialMediaAccount(id, account); }
  async deleteSocialMediaAccount(id: string): Promise<boolean> { return this.memStorage.deleteSocialMediaAccount(id); }

  async getSocialMediaPosts(): Promise<SocialMediaPost[]> { return this.memStorage.getSocialMediaPosts(); }
  async getSocialMediaPost(id: string): Promise<SocialMediaPost | undefined> { return this.memStorage.getSocialMediaPost(id); }
  async getSocialMediaPostsByAccount(accountId: string): Promise<SocialMediaPost[]> { return this.memStorage.getSocialMediaPostsByAccount(accountId); }
  async createSocialMediaPost(post: InsertSocialMediaPost): Promise<SocialMediaPost> { return this.memStorage.createSocialMediaPost(post); }
  async updateSocialMediaPost(id: string, post: Partial<InsertSocialMediaPost>): Promise<SocialMediaPost | undefined> { return this.memStorage.updateSocialMediaPost(id, post); }
  async deleteSocialMediaPost(id: string): Promise<boolean> { return this.memStorage.deleteSocialMediaPost(id); }

  async getSocialMediaTemplates(): Promise<SocialMediaTemplate[]> { return this.memStorage.getSocialMediaTemplates(); }
  async getSocialMediaTemplate(id: string): Promise<SocialMediaTemplate | undefined> { return this.memStorage.getSocialMediaTemplate(id); }
  async createSocialMediaTemplate(template: InsertSocialMediaTemplate): Promise<SocialMediaTemplate> { return this.memStorage.createSocialMediaTemplate(template); }
  async updateSocialMediaTemplate(id: string, template: Partial<InsertSocialMediaTemplate>): Promise<SocialMediaTemplate | undefined> { return this.memStorage.updateSocialMediaTemplate(id, template); }
  async deleteSocialMediaTemplate(id: string): Promise<boolean> { return this.memStorage.deleteSocialMediaTemplate(id); }

  async getSocialMediaAnalytics(): Promise<SocialMediaAnalytics[]> { return this.memStorage.getSocialMediaAnalytics(); }
  async getSocialMediaAnalyticsForAccount(accountId: string): Promise<SocialMediaAnalytics[]> { return this.memStorage.getSocialMediaAnalyticsForAccount(accountId); }
  async createSocialMediaAnalytics(analytics: InsertSocialMediaAnalytics): Promise<SocialMediaAnalytics> { return this.memStorage.createSocialMediaAnalytics(analytics); }


  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    try {
      const result = await db.select().from(workflows);
      return result;
    } catch (error) {
      console.error("Error fetching workflows from database:", error);
      return [];
    }
  }
  
  async getWorkflow(id: string): Promise<Workflow | undefined> {
    try {
      const result = await db.select().from(workflows).where(eq(workflows.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching workflow from database:", error);
      return undefined;
    }
  }
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> { return this.memStorage.createWorkflow(workflow); }
  async updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> { return this.memStorage.updateWorkflow(id, workflow); }
  async deleteWorkflow(id: string): Promise<boolean> { return this.memStorage.deleteWorkflow(id); }

  async getWorkflowExecutions(): Promise<WorkflowExecution[]> { return this.memStorage.getWorkflowExecutions(); }
  async getWorkflowExecution(id: string): Promise<WorkflowExecution | undefined> { return this.memStorage.getWorkflowExecution(id); }
  async getWorkflowExecutionsByWorkflow(workflowId: string): Promise<WorkflowExecution[]> { return this.memStorage.getWorkflowExecutionsByWorkflow(workflowId); }
  async getWorkflowExecutionsByContact(contactId: string): Promise<WorkflowExecution[]> { return this.memStorage.getWorkflowExecutionsByContact(contactId); }
  async createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution> { return this.memStorage.createWorkflowExecution(execution); }
  async updateWorkflowExecution(id: string, execution: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution | undefined> { return this.memStorage.updateWorkflowExecution(id, execution); }


  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    try {
      const result = await db.select().from(workflowTemplates).orderBy(desc(workflowTemplates.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching workflow templates from database:", error);
      return [];
    }
  }

  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined> {
    try {
      const result = await db.select().from(workflowTemplates).where(eq(workflowTemplates.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching workflow template from database:", error);
      return undefined;
    }
  }

  async createWorkflowTemplate(template: InsertWorkflowTemplate): Promise<WorkflowTemplate> {
    try {
      const result = await db.insert(workflowTemplates).values({
        ...template,
        id: sql`gen_random_uuid()`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating workflow template in database:", error);
      throw error;
    }
  }

  async updateWorkflowTemplate(id: string, template: Partial<InsertWorkflowTemplate>): Promise<WorkflowTemplate | undefined> {
    try {
      const result = await db.update(workflowTemplates)
        .set({ ...template, updatedAt: new Date() })
        .where(eq(workflowTemplates.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating workflow template in database:", error);
      return undefined;
    }
  }

  async deleteWorkflowTemplate(id: string): Promise<boolean> {
    try {
      await db.delete(workflowTemplates).where(eq(workflowTemplates.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting workflow template from database:", error);
      return false;
    }
  }

  // Task Categories
  async getTaskCategories(): Promise<TaskCategory[]> {
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

  async getTaskCategory(id: string): Promise<TaskCategory | undefined> {
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

  async createTaskCategory(category: InsertTaskCategory): Promise<TaskCategory> {
    const result = await db.insert(taskCategories).values({
      ...category,
      id: sql`gen_random_uuid()`,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateTaskCategory(id: string, category: Partial<InsertTaskCategory>): Promise<TaskCategory | undefined> {
    const result = await db.update(taskCategories).set(category).where(eq(taskCategories.id, id)).returning();
    return result[0];
  }

  async deleteTaskCategory(id: string): Promise<boolean> {
    const result = await db.delete(taskCategories).where(eq(taskCategories.id, id)).returning();
    return result.length > 0;
  }

  // Enhanced Tasks  
  async getEnhancedTasks(): Promise<EnhancedTask[]> { return this.memStorage.getEnhancedTasks(); }
  async getEnhancedTask(id: string): Promise<EnhancedTask | undefined> { return this.memStorage.getEnhancedTask(id); }
  async getEnhancedTasksByClient(clientId: string): Promise<EnhancedTask[]> { return this.memStorage.getEnhancedTasksByClient(clientId); }
  async createEnhancedTask(task: InsertEnhancedTask): Promise<EnhancedTask> { return this.memStorage.createEnhancedTask(task); }
  async updateEnhancedTask(id: string, task: Partial<InsertEnhancedTask>): Promise<EnhancedTask | undefined> { return this.memStorage.updateEnhancedTask(id, task); }
  async deleteEnhancedTask(id: string): Promise<boolean> { return this.memStorage.deleteEnhancedTask(id); }

  // Task History
  async getTaskHistories(): Promise<TaskHistory[]> { return this.memStorage.getTaskHistories(); }
  async getTaskHistory(id: string): Promise<TaskHistory | undefined> { return this.memStorage.getTaskHistory(id); }
  async getTaskHistoriesByTask(taskId: string): Promise<TaskHistory[]> { return this.memStorage.getTaskHistoriesByTask(taskId); }
  async createTaskHistory(history: InsertTaskHistory): Promise<TaskHistory> { return this.memStorage.createTaskHistory(history); }

  // Automation
  async getAutomationTriggers(): Promise<AutomationTrigger[]> { return this.memStorage.getAutomationTriggers(); }
  async getAutomationTrigger(id: string): Promise<AutomationTrigger | undefined> { return this.memStorage.getAutomationTrigger(id); }
  async createAutomationTrigger(trigger: InsertAutomationTrigger): Promise<AutomationTrigger> { return this.memStorage.createAutomationTrigger(trigger); }
  async updateAutomationTrigger(id: string, trigger: Partial<InsertAutomationTrigger>): Promise<AutomationTrigger | undefined> { return this.memStorage.updateAutomationTrigger(id, trigger); }
  async deleteAutomationTrigger(id: string): Promise<boolean> { return this.memStorage.deleteAutomationTrigger(id); }

  async getAutomationActions(): Promise<AutomationAction[]> { return this.memStorage.getAutomationActions(); }
  async getAutomationAction(id: string): Promise<AutomationAction | undefined> { return this.memStorage.getAutomationAction(id); }
  async createAutomationAction(action: InsertAutomationAction): Promise<AutomationAction> { return this.memStorage.createAutomationAction(action); }
  async updateAutomationAction(id: string, action: Partial<InsertAutomationAction>): Promise<AutomationAction | undefined> { return this.memStorage.updateAutomationAction(id, action); }
  async deleteAutomationAction(id: string): Promise<boolean> { return this.memStorage.deleteAutomationAction(id); }

  // Templates
  async getTemplateFolders(): Promise<TemplateFolder[]> {
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

  async getTemplateFolder(id: string): Promise<TemplateFolder | undefined> {
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

  async createTemplateFolder(folderData: InsertTemplateFolder): Promise<TemplateFolder> {
    const folder: TemplateFolder = {
      id: randomUUID(),
      name: folderData.name,
      description: folderData.description || null,
      type: folderData.type,
      parentId: folderData.parentId || null,
      order: folderData.order || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(templateFolders).values(folder);
    return folder;
  }

  async updateTemplateFolder(id: string, folderData: Partial<InsertTemplateFolder>): Promise<TemplateFolder | undefined> {
    const updates = {
      ...folderData,
      updatedAt: new Date(),
    };
    
    await db.update(templateFolders).set(updates).where(eq(templateFolders.id, id));
    return this.getTemplateFolder(id);
  }

  async deleteTemplateFolder(id: string): Promise<boolean> {
    const result = await db.delete(templateFolders).where(eq(templateFolders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
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
  
  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
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
  
  async getEmailTemplatesByFolder(folderId: string): Promise<EmailTemplate[]> {
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
  
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const result = await db.insert(emailTemplates).values({
      ...template,
      id: sql`gen_random_uuid()`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }
  
  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const updatedTemplate = { ...template, updatedAt: new Date() };
    await db.update(emailTemplates).set(updatedTemplate).where(eq(emailTemplates.id, id));
    return await this.getEmailTemplate(id);
  }
  
  async deleteEmailTemplate(id: string): Promise<boolean> {
    const result = await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Scheduled Emails
  async getScheduledEmails(): Promise<ScheduledEmail[]> {
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

  async getScheduledEmail(id: string): Promise<ScheduledEmail | undefined> {
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
      return undefined;
    }
  }

  async getScheduledEmailsByClient(clientId: string): Promise<ScheduledEmail[]> {
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

  async createScheduledEmail(scheduledEmail: InsertScheduledEmail): Promise<ScheduledEmail> {
    const result = await db.insert(scheduledEmails).values({
      ...scheduledEmail,
      id: sql`gen_random_uuid()`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateScheduledEmail(id: string, scheduledEmail: Partial<InsertScheduledEmail>): Promise<ScheduledEmail | undefined> {
    const updatedEmail = { ...scheduledEmail, updatedAt: new Date() };
    await db.update(scheduledEmails).set(updatedEmail).where(eq(scheduledEmails.id, id));
    return await this.getScheduledEmail(id);
  }

  async deleteScheduledEmail(id: string): Promise<boolean> {
    const result = await db.delete(scheduledEmails).where(eq(scheduledEmails.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async markScheduledEmailAsSent(id: string, sentAt: Date): Promise<void> {
    await db.update(scheduledEmails).set({
      status: "sent",
      sentAt,
      updatedAt: new Date(),
    }).where(eq(scheduledEmails.id, id));
  }

  async markScheduledEmailAsFailed(id: string, failureReason: string): Promise<void> {
    const existing = await this.getScheduledEmail(id);
    await db.update(scheduledEmails).set({
      status: "failed",
      failureReason,
      retryCount: (existing?.retryCount || 0) + 1,
      updatedAt: new Date(),
    }).where(eq(scheduledEmails.id, id));
  }

  async getSmsTemplates(): Promise<SmsTemplate[]> {
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

  async getSmsTemplate(id: string): Promise<SmsTemplate | undefined> {
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

  async getSmsTemplatesByFolder(folderId: string): Promise<SmsTemplate[]> {
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

  async createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate> {
    const result = await db.insert(smsTemplates).values({
      ...template,
      id: sql`gen_random_uuid()`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateSmsTemplate(id: string, template: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined> {
    const result = await db.update(smsTemplates).set({
      ...template,
      updatedAt: new Date(),
    }).where(eq(smsTemplates.id, id)).returning();
    return result[0];
  }

  async deleteSmsTemplate(id: string): Promise<boolean> {
    const result = await db.delete(smsTemplates).where(eq(smsTemplates.id, id)).returning();
    return result.length > 0;
  }

  // Custom Fields
  async getCustomFields(): Promise<CustomField[]> { return this.memStorage.getCustomFields(); }
  async getCustomField(id: string): Promise<CustomField | undefined> { return this.memStorage.getCustomField(id); }
  async createCustomField(field: InsertCustomField): Promise<CustomField> { return this.memStorage.createCustomField(field); }
  async updateCustomField(id: string, field: Partial<InsertCustomField>): Promise<CustomField | undefined> { return this.memStorage.updateCustomField(id, field); }
  async deleteCustomField(id: string): Promise<boolean> { return this.memStorage.deleteCustomField(id); }
  async reorderCustomFields(fieldOrders: Array<{id: string, order: number}>): Promise<void> { return this.memStorage.reorderCustomFields(fieldOrders); }

  async getCustomFieldFolders(): Promise<CustomFieldFolder[]> { return this.memStorage.getCustomFieldFolders(); }
  async getCustomFieldFolder(id: string): Promise<CustomFieldFolder | undefined> { return this.memStorage.getCustomFieldFolder(id); }
  async createCustomFieldFolder(folder: InsertCustomFieldFolder): Promise<CustomFieldFolder> { return this.memStorage.createCustomFieldFolder(folder); }
  async updateCustomFieldFolder(id: string, folder: Partial<InsertCustomFieldFolder>): Promise<CustomFieldFolder | undefined> { return this.memStorage.updateCustomFieldFolder(id, folder); }
  async deleteCustomFieldFolder(id: string): Promise<boolean> { return this.memStorage.deleteCustomFieldFolder(id); }
  async reorderCustomFieldFolders(folderOrders: Array<{id: string, order: number}>): Promise<void> { return this.memStorage.reorderCustomFieldFolders(folderOrders); }

  // Staff
  async getStaff(): Promise<Staff[]> {
    const result = await db.select().from(staff).orderBy(asc(staff.firstName), asc(staff.lastName));
    return result;
  }
  
  async getStaffMember(id: string): Promise<Staff | undefined> {
    const result = await db.select().from(staff).where(eq(staff.id, id));
    return result[0];
  }
  
  async createStaffMember(staffData: InsertStaff): Promise<Staff> {
    const result = await db.insert(staff).values(staffData).returning();
    return result[0];
  }
  
  async updateStaffMember(id: string, staffData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const result = await db.update(staff).set({
      ...staffData,
      updatedAt: new Date(),
    }).where(eq(staff.id, id)).returning();
    return result[0];
  }
  
  async deleteStaffMember(id: string): Promise<boolean> {
    const result = await db.delete(staff).where(eq(staff.id, id)).returning();
    return result.length > 0;
  }

  // Team Positions
  async getTeamPositions(): Promise<TeamPosition[]> {
    const result = await db.select().from(teamPositions)
      .where(eq(teamPositions.isActive, true))
      .orderBy(asc(teamPositions.order), asc(teamPositions.label));
    return result;
  }
  
  async getTeamPosition(id: string): Promise<TeamPosition | undefined> {
    const result = await db.select().from(teamPositions).where(eq(teamPositions.id, id));
    return result[0];
  }
  
  async createTeamPosition(positionData: InsertTeamPosition): Promise<TeamPosition> {
    const result = await db.insert(teamPositions).values(positionData).returning();
    return result[0];
  }
  
  async updateTeamPosition(id: string, positionData: Partial<InsertTeamPosition>): Promise<TeamPosition | undefined> {
    const result = await db.update(teamPositions).set({
      ...positionData,
      updatedAt: new Date(),
    }).where(eq(teamPositions.id, id)).returning();
    return result[0];
  }
  
  async deleteTeamPosition(id: string): Promise<boolean> {
    const result = await db.delete(teamPositions).where(eq(teamPositions.id, id)).returning();
    return result.length > 0;
  }
  
  // Client Team Assignments
  async getClientTeamAssignments(clientId: string): Promise<(ClientTeamAssignment & { position: TeamPosition; staffMember: Staff })[]> {
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
      staffMember: staff,
    })
    .from(clientTeamAssignments)
    .leftJoin(teamPositions, eq(clientTeamAssignments.position, teamPositions.id))
    .leftJoin(staff, eq(clientTeamAssignments.staffId, staff.id))
    .where(eq(clientTeamAssignments.clientId, clientId))
    .orderBy(asc(teamPositions.order));
    
    return result.map(row => ({
      ...row,
      position: row.positionDetails,
    })) as (ClientTeamAssignment & { position: TeamPosition; staffMember: Staff })[];
  }

  async getTeamAssignments(): Promise<(ClientTeamAssignment & { position: TeamPosition; staffMember: Staff })[]> {
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
      staffMember: staff,
    })
    .from(clientTeamAssignments)
    .leftJoin(teamPositions, eq(clientTeamAssignments.position, teamPositions.id))
    .leftJoin(staff, eq(clientTeamAssignments.staffId, staff.id))
    .orderBy(asc(teamPositions.order));
    
    return result.map(row => ({
      ...row,
      position: row.positionDetails,
    })) as (ClientTeamAssignment & { position: TeamPosition; staffMember: Staff })[];
  }
  
  async createClientTeamAssignment(assignmentData: InsertClientTeamAssignment): Promise<ClientTeamAssignment> {
    const result = await db.insert(clientTeamAssignments).values(assignmentData).returning();
    return result[0];
  }
  
  async updateClientTeamAssignment(id: string, assignmentData: Partial<InsertClientTeamAssignment>): Promise<ClientTeamAssignment | undefined> {
    const result = await db.update(clientTeamAssignments).set({
      ...assignmentData,
      updatedAt: new Date(),
    }).where(eq(clientTeamAssignments.id, id)).returning();
    return result[0];
  }
  
  async deleteClientTeamAssignment(id: string): Promise<boolean> {
    const result = await db.delete(clientTeamAssignments).where(eq(clientTeamAssignments.id, id)).returning();
    return result.length > 0;
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    const result = await db.select().from(departments).orderBy(asc(departments.name));
    return result;
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    return result[0];
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values(department).returning();
    return result[0];
  }

  async updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const result = await db
      .update(departments)
      .set({ ...department, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return result[0];
  }

  async deleteDepartment(id: string): Promise<boolean> {
    try {
      await db.delete(departments).where(eq(departments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting department:", error);
      return false;
    }
  }

  // Positions
  async getPositions(): Promise<Position[]> {
    const result = await db.select().from(positions).orderBy(asc(positions.name));
    return result;
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const result = await db.select().from(positions).where(eq(positions.id, id));
    return result[0];
  }

  async getPositionsByDepartment(departmentId: string): Promise<Position[]> {
    const result = await db
      .select()
      .from(positions)
      .where(eq(positions.departmentId, departmentId))
      .orderBy(asc(positions.name));
    return result;
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const result = await db.insert(positions).values(position).returning();
    return result[0];
  }

  async updatePosition(id: string, position: Partial<InsertPosition>): Promise<Position | undefined> {
    const result = await db
      .update(positions)
      .set({ ...position, updatedAt: new Date() })
      .where(eq(positions.id, id))
      .returning();
    return result[0];
  }

  async deletePosition(id: string): Promise<boolean> {
    try {
      await db.delete(positions).where(eq(positions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting position:", error);
      return false;
    }
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    const result = await db.select().from(tags);
    return result;
  }

  async getTag(id: string): Promise<Tag | undefined> {
    const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
    return result[0];
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const result = await db.insert(tags).values({
      ...tag,
      id: sql`gen_random_uuid()`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag | undefined> {
    const result = await db.update(tags).set({
      ...tag,
      updatedAt: new Date(),
    }).where(eq(tags.id, id)).returning();
    return result[0];
  }

  async deleteTag(id: string): Promise<boolean> {
    const result = await db.delete(tags).where(eq(tags.id, id)).returning();
    return result.length > 0;
  }

  // Products
  async getProducts(): Promise<Product[]> { return this.memStorage.getProducts(); }
  async getProduct(id: string): Promise<Product | undefined> { return this.memStorage.getProduct(id); }
  async createProduct(product: InsertProduct): Promise<Product> { return this.memStorage.createProduct(product); }
  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> { return this.memStorage.updateProduct(id, product); }
  async deleteProduct(id: string): Promise<boolean> { return this.memStorage.deleteProduct(id); }

  // SECURITY: Audit Logs - MUST use database for security compliance
  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }
  async getAuditLog(id: string): Promise<AuditLog | undefined> {
    const result = await db.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1);
    return result[0];
  }
  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.createdAt));
  }
  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt));
  }
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const [newAuditLog] = await db.insert(auditLogs).values({
      id: randomUUID(),
      ...auditLog,
      createdAt: new Date()
    }).returning();
    return newAuditLog;
  }

  // SECURITY: Roles and Permissions - MUST use database for security compliance
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }
  async getRole(id: string): Promise<Role | undefined> {
    const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return result[0];
  }
  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values({
      id: randomUUID(),
      ...role,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newRole;
  }
  async updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined> {
    const [updatedRole] = await db.update(roles)
      .set({ ...role, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }
  async deleteRole(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return result.rowCount > 0;
  }

  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.module, permissions.roleId);
  }
  async getPermission(id: string): Promise<Permission | undefined> {
    const result = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1);
    return result[0];
  }
  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db.insert(permissions).values({
      id: randomUUID(),
      ...permission,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newPermission;
  }
  async updatePermission(id: string, permission: Partial<InsertPermission>): Promise<Permission | undefined> {
    const [updatedPermission] = await db.update(permissions)
      .set({ ...permission, updatedAt: new Date() })
      .where(eq(permissions.id, id))
      .returning();
    return updatedPermission;
  }
  async deletePermission(id: string): Promise<boolean> {
    const result = await db.delete(permissions).where(eq(permissions.id, id));
    return result.rowCount > 0;
  }

  async getUserRoles(): Promise<UserRole[]> {
    return await db.select().from(userRoles).orderBy(userRoles.userId, userRoles.roleId);
  }
  async getUserRole(id: string): Promise<UserRole | undefined> {
    const result = await db.select().from(userRoles).where(eq(userRoles.id, id)).limit(1);
    return result[0];
  }
  async getUserRolesByUser(userId: string): Promise<UserRole[]> {
    return await db.select().from(userRoles).where(eq(userRoles.userId, userId));
  }
  async getUserRolesByRole(roleId: string): Promise<UserRole[]> {
    return await db.select().from(userRoles).where(eq(userRoles.roleId, roleId));
  }
  async createUserRole(userRole: InsertUserRole): Promise<UserRole> {
    const [newUserRole] = await db.insert(userRoles).values({
      id: randomUUID(),
      ...userRole,
      createdAt: new Date()
    }).returning();
    return newUserRole;
  }
  async updateUserRole(id: string, userRole: Partial<InsertUserRole>): Promise<UserRole | undefined> {
    const [updatedUserRole] = await db.update(userRoles)
      .set({ ...userRole, updatedAt: new Date() })
      .where(eq(userRoles.id, id))
      .returning();
    return updatedUserRole;
  }
  async deleteUserRole(id: string): Promise<boolean> {
    const result = await db.delete(userRoles).where(eq(userRoles.id, id));
    return result.rowCount > 0;
  }

  // Notifications
  async getNotificationSettings(): Promise<NotificationSettings[]> { return this.memStorage.getNotificationSettings(); }
  async getNotificationSetting(id: string): Promise<NotificationSettings | undefined> { return this.memStorage.getNotificationSetting(id); }
  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> { return this.memStorage.createNotificationSettings(settings); }
  async updateNotificationSettings(id: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> { return this.memStorage.updateNotificationSettings(id, settings); }
  async deleteNotificationSettings(id: string): Promise<boolean> { return this.memStorage.deleteNotificationSettings(id); }

  // Sales Settings - Database Implementation
  async getSalesSettings(): Promise<SalesSettings | undefined> {
    try {
      const result = await db.select().from(salesSettings).limit(1);
      if (result.length === 0) {
        // Create default settings if none exist
        const [defaultSettings] = await db.insert(salesSettings).values({
          id: randomUUID(),
          minimumMarginThreshold: '35.00',
          updatedAt: new Date()
        }).returning();
        return defaultSettings;
      }
      return result[0];
    } catch (error) {
      console.error("Error getting sales settings:", error);
      return undefined;
    }
  }

  async updateSalesSettings(settings: Partial<InsertSalesSettings>): Promise<SalesSettings> {
    try {
      // Get the existing settings (or create default)
      const existing = await this.getSalesSettings();
      
      if (!existing) {
        throw new Error("Sales settings not found");
      }

      const [updated] = await db.update(salesSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(salesSettings.id, existing.id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error("Error updating sales settings:", error);
      throw error;
    }
  }

  // Smart Lists - Database Implementation  
  async getSmartLists(userId: string, entityType?: string): Promise<SmartList[]> {
    try {
      let query = db.select().from(smartLists);
      
      // Filter by entity type if provided
      if (entityType) {
        query = query.where(eq(smartLists.entityType, entityType));
      }
      
      const allLists = await query;
      
      // Filter by visibility permissions
      return allLists.filter(list => {
        // Universal lists are visible to everyone
        if (list.visibility === 'universal') return true;
        
        // Personal lists are only visible to the creator
        if (list.visibility === 'personal') return list.createdBy === userId;
        
        // Shared lists are visible to creator and shared users
        if (list.visibility === 'shared') {
          return list.createdBy === userId || (list.sharedWith && list.sharedWith.includes(userId));
        }
        
        return false;
      });
    } catch (error) {
      console.error("Error getting smart lists:", error);
      return [];
    }
  }

  async getSmartList(id: string): Promise<SmartList | undefined> {
    try {
      const result = await db.select().from(smartLists).where(eq(smartLists.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting smart list:", error);
      return undefined;
    }
  }

  async createSmartList(smartList: InsertSmartList): Promise<SmartList> {
    try {
      const result = await db.insert(smartLists).values({
        ...smartList,
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating smart list:", error);
      throw error;
    }
  }

  async updateSmartList(id: string, smartList: Partial<InsertSmartList>): Promise<SmartList | undefined> {
    try {
      const result = await db.update(smartLists)
        .set({ ...smartList, updatedAt: new Date() })
        .where(eq(smartLists.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating smart list:", error);
      return undefined;
    }
  }

  async deleteSmartList(id: string): Promise<boolean> {
    try {
      await db.delete(smartLists).where(eq(smartLists.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting smart list:", error);
      return false;
    }
  }

  // Client Brief Sections Management
  async listBriefSections(): Promise<ClientBriefSection[]> {
    try {
      return await db.select()
        .from(clientBriefSections)
        .orderBy(asc(clientBriefSections.displayOrder), asc(clientBriefSections.createdAt));
    } catch (error) {
      console.error("Error listing brief sections:", error);
      return [];
    }
  }

  async getBriefSection(id: string): Promise<ClientBriefSection | undefined> {
    try {
      const result = await db.select()
        .from(clientBriefSections)
        .where(eq(clientBriefSections.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting brief section:", error);
      throw error;
    }
  }

  async getBriefSectionByKey(key: string): Promise<ClientBriefSection | undefined> {
    try {
      const result = await db.select()
        .from(clientBriefSections)
        .where(eq(clientBriefSections.key, key))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting brief section by key:", error);
      throw error;
    }
  }

  async createBriefSection(section: InsertClientBriefSection): Promise<ClientBriefSection> {
    try {
      const result = await db.insert(clientBriefSections).values(section).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating brief section:", error);
      throw error;
    }
  }

  async updateBriefSection(id: string, sectionData: Partial<InsertClientBriefSection>): Promise<ClientBriefSection | undefined> {
    try {
      const result = await db.update(clientBriefSections)
        .set({ ...sectionData, updatedAt: new Date() })
        .where(eq(clientBriefSections.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating brief section:", error);
      throw error;
    }
  }

  async deleteBriefSection(id: string): Promise<boolean> {
    try {
      // First check if it's a core section (shouldn't be deleted)
      const section = await db.select()
        .from(clientBriefSections)
        .where(eq(clientBriefSections.id, id))
        .limit(1);
      
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

  async reorderBriefSections(sectionIds: string[]): Promise<void> {
    try {
      // Update display order for each section
      const promises = sectionIds.map((id, index) =>
        db.update(clientBriefSections)
          .set({ displayOrder: index, updatedAt: new Date() })
          .where(eq(clientBriefSections.id, id))
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error("Error reordering brief sections:", error);
      throw error;
    }
  }

  async getClientBrief(clientId: string): Promise<Array<ClientBriefSection & { value?: string }>> {
    try {
      // Get all sections ordered by display order
      const sections = await this.listBriefSections();
      
      // Get client data for core sections
      const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      
      // Get custom section values
      const customValues = await db.select()
        .from(clientBriefValues)
        .where(eq(clientBriefValues.clientId, clientId));
      
      return sections.map(section => {
        let value = undefined;
        
        // Get value from core client data if it's a core section
        if (client && section.key && section.isCoreSection) {
          switch (section.key) {
            case 'background':
              value = client.briefBackground || undefined;
              break;
            case 'objectives':
              value = client.briefObjectives || undefined;
              break;
            case 'brand_info':
              value = client.briefBrandInfo || undefined;
              break;
            case 'audience_info':
              value = client.briefAudienceInfo || undefined;
              break;
            case 'products_services':
              value = client.briefProductsServices || undefined;
              break;
            case 'competitors':
              value = client.briefCompetitors || undefined;
              break;
            case 'marketing_tech':
              value = client.briefMarketingTech || undefined;
              break;
            case 'miscellaneous':
              value = client.briefMiscellaneous || undefined;
              break;
          }
        }

        // If no core value, check custom values
        if (!value) {
          const customValue = customValues.find(cv => cv.sectionId === section.id);
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

  async setClientBriefValue(clientId: string, sectionId: string, value: string): Promise<void> {
    try {
      const section = await this.getBriefSection(sectionId);
      if (!section) {
        throw new Error("Section not found");
      }

      // If it's a core section, update client directly
      if (section.key && section.isCoreSection) {
        const updateData: Partial<InsertClient> = {};
        
        switch (section.key) {
          case 'background':
            updateData.briefBackground = value;
            break;
          case 'objectives':
            updateData.briefObjectives = value;
            break;
          case 'brand_info':
            updateData.briefBrandInfo = value;
            break;
          case 'audience_info':
            updateData.briefAudienceInfo = value;
            break;
          case 'products_services':
            updateData.briefProductsServices = value;
            break;
          case 'competitors':
            updateData.briefCompetitors = value;
            break;
          case 'marketing_tech':
            updateData.briefMarketingTech = value;
            break;
          case 'miscellaneous':
            updateData.briefMiscellaneous = value;
            break;
        }
        
        await this.updateClient(clientId, updateData);
      } else {
        // Custom section, store in clientBriefValues
        const existing = await db.select()
          .from(clientBriefValues)
          .where(and(
            eq(clientBriefValues.clientId, clientId),
            eq(clientBriefValues.sectionId, sectionId)
          ))
          .limit(1);
        
        if (existing.length > 0) {
          // Update existing value
          await db.update(clientBriefValues)
            .set({ value, updatedAt: new Date() })
            .where(and(
              eq(clientBriefValues.clientId, clientId),
              eq(clientBriefValues.sectionId, sectionId)
            ));
        } else {
          // Insert new value
          await db.insert(clientBriefValues).values({
            clientId,
            sectionId,
            value,
            updatedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error("Error setting client brief value:", error);
      throw error;
    }
  }

  async getClients(): Promise<Client[]> {
    try {
      const result = await db.select().from(clients);
      return result;
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  }

  async getClientsWithPagination(limit: number, offset: number, sortBy?: string, sortOrder?: string): Promise<{ clients: Client[]; total: number }> {
    try {
      // Get total count (excluding archived clients)
      const totalResult = await db.select({ count: sql`count(*)` })
        .from(clients)
        .where(or(eq(clients.isArchived, false), isNull(clients.isArchived)));
      const total = Number(totalResult[0]?.count) || 0;
      
      // Build the query with calculated lastActivity (excluding archived clients)
      // Calculate lastActivity as the maximum of:
      // - client's own createdAt
      // - max task createdAt (tasks table has no updatedAt)
      // - max note updatedAt or createdAt  
      // - max appointment createdAt
      // - max activity createdAt
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
        lastActivity: lastActivitySubquery.as('last_activity'),
        isArchived: clients.isArchived,
        createdAt: clients.createdAt,
      }).from(clients)
        .where(or(eq(clients.isArchived, false), isNull(clients.isArchived)));
      
      if (sortBy) {
        if (sortBy === 'lastActivity') {
          // Sort by calculated lastActivity
          if (sortOrder === 'desc') {
            query = query.orderBy(desc(lastActivitySubquery));
          } else {
            query = query.orderBy(asc(lastActivitySubquery));
          }
        } else {
          const column = clients[sortBy as keyof typeof clients];
          if (column) {
            if (sortOrder === 'desc') {
              query = query.orderBy(desc(column));
            } else {
              query = query.orderBy(asc(column));
            }
          }
        }
      } else {
        // Default sort by createdAt desc
        query = query.orderBy(desc(clients.createdAt));
      }
      
      // Add pagination
      query = query.limit(limit).offset(offset);
      
      const clientsResult = await query;
      
      // Custom field IDs for MRR and Client Vertical
      const MRR_FIELD_ID = '4e8e946b-1744-4d7c-a417-cdcb2713c6ca';
      const CLIENT_VERTICAL_FIELD_ID = 'cac6e6ee-bdf9-48bd-81a7-48672d2453ae';
      
      // Add MRR and Client Vertical from custom fields
      const clientsWithCustomFields = clientsResult.map(client => {
        const customFields = (client.customFieldValues as Record<string, any>) || {};
        const mrrValue = customFields[MRR_FIELD_ID];
        const clientVerticalValue = customFields[CLIENT_VERTICAL_FIELD_ID];
        
        return {
          ...client,
          mrr: mrrValue ? String(mrrValue) : null,
          clientVertical: clientVerticalValue ? String(clientVerticalValue) : null,
        };
      });
      
      return {
        clients: clientsWithCustomFields as any,
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
  async getEmailIntegrations(): Promise<EmailIntegration[]> {
    try {
      const result = await db.select().from(emailIntegrations);
      return result;
    } catch (error) {
      console.error("Error fetching email integrations:", error);
      return [];
    }
  }

  async getEmailIntegration(id: string): Promise<EmailIntegration | undefined> {
    try {
      const result = await db.select().from(emailIntegrations).where(eq(emailIntegrations.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching email integration:", error);
      return undefined;
    }
  }

  async getEmailIntegrationByProvider(provider: string): Promise<EmailIntegration | undefined> {
    try {
      const result = await db.select().from(emailIntegrations)
        .where(and(eq(emailIntegrations.provider, provider), eq(emailIntegrations.isActive, true)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching email integration by provider:", error);
      return undefined;
    }
  }

  async createEmailIntegration(integrationData: InsertEmailIntegration): Promise<EmailIntegration> {
    try {
      const result = await db.insert(emailIntegrations).values({
        ...integrationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating email integration:", error);
      throw error;
    }
  }

  async updateEmailIntegration(id: string, integrationData: Partial<InsertEmailIntegration>): Promise<EmailIntegration | undefined> {
    try {
      const result = await db.update(emailIntegrations)
        .set({
          ...integrationData,
          updatedAt: new Date(),
        })
        .where(eq(emailIntegrations.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating email integration:", error);
      return undefined;
    }
  }

  async deleteEmailIntegration(id: string): Promise<boolean> {
    try {
      const result = await db.delete(emailIntegrations).where(eq(emailIntegrations.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting email integration:", error);
      return false;
    }
  }

  async getUserViewPreference(userId: string, viewType: string): Promise<UserViewPreference | null> {
    try {
      const result = await db
        .select()
        .from(userViewPreferences)
        .where(and(
          eq(userViewPreferences.userId, userId),
          eq(userViewPreferences.viewType, viewType)
        ))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting user view preference:", error);
      return null;
    }
  }

  async saveUserViewPreference(userId: string, viewType: string, preferences: any): Promise<UserViewPreference> {
    try {
      const existing = await this.getUserViewPreference(userId, viewType);
      
      if (existing) {
        const result = await db
          .update(userViewPreferences)
          .set({
            preferences,
            updatedAt: new Date(),
          })
          .where(eq(userViewPreferences.id, existing.id))
          .returning();
        return result[0];
      } else {
        const result = await db
          .insert(userViewPreferences)
          .values({
            userId,
            viewType,
            preferences,
          })
          .returning();
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

  async getUserDashboards(userId: string): Promise<Dashboard[]> {
    try {
      const result = await db
        .select()
        .from(dashboards)
        .where(eq(dashboards.userId, userId))
        .orderBy(desc(dashboards.isDefault), asc(dashboards.name));
      return result;
    } catch (error) {
      console.error("Error fetching user dashboards:", error);
      return [];
    }
  }

  async getDashboard(id: string): Promise<Dashboard | undefined> {
    try {
      const result = await db
        .select()
        .from(dashboards)
        .where(eq(dashboards.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      return undefined;
    }
  }

  async createDashboard(data: InsertDashboard): Promise<Dashboard> {
    try {
      const result = await db
        .insert(dashboards)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating dashboard:", error);
      throw error;
    }
  }

  async updateDashboard(id: string, data: Partial<InsertDashboard>): Promise<Dashboard | undefined> {
    try {
      const result = await db
        .update(dashboards)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(dashboards.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating dashboard:", error);
      return undefined;
    }
  }

  async deleteDashboard(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(dashboards)
        .where(eq(dashboards.id, id));
      return result.rowCount! > 0;
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      return false;
    }
  }

  async setDefaultDashboard(userId: string, dashboardId: string): Promise<void> {
    try {
      // First, unset all other dashboards as non-default
      await db
        .update(dashboards)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(dashboards.userId, userId));
      
      // Then set the specified dashboard as default
      await db
        .update(dashboards)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(dashboards.id, dashboardId));
    } catch (error) {
      console.error("Error setting default dashboard:", error);
      throw error;
    }
  }

  // =============================================================================
  // DASHBOARD WIDGETS METHODS
  // =============================================================================

  async getDashboardWidgets(): Promise<DashboardWidget[]> {
    try {
      const widgets = await db
        .select()
        .from(dashboardWidgets)
        .where(eq(dashboardWidgets.isActive, true))
        .orderBy(dashboardWidgets.category, dashboardWidgets.name);
      return widgets;
    } catch (error) {
      console.error("Error fetching dashboard widgets:", error);
      return [];
    }
  }

  async getUserDashboardWidgets(userId: string, dashboardId: string): Promise<UserDashboardWidget[]> {
    try {
      const widgets = await db
        .select()
        .from(userDashboardWidgets)
        .where(and(
          eq(userDashboardWidgets.userId, userId),
          eq(userDashboardWidgets.dashboardId, dashboardId),
          eq(userDashboardWidgets.isVisible, true)
        ))
        .orderBy(userDashboardWidgets.order);
      return widgets;
    } catch (error) {
      console.error("Error fetching user dashboard widgets:", error);
      return [];
    }
  }

  async getUserDashboardWidget(id: string): Promise<UserDashboardWidget | undefined> {
    try {
      const result = await db
        .select()
        .from(userDashboardWidgets)
        .where(eq(userDashboardWidgets.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching user dashboard widget:", error);
      return undefined;
    }
  }

  async createUserDashboardWidget(data: InsertUserDashboardWidget): Promise<UserDashboardWidget> {
    try {
      const result = await db
        .insert(userDashboardWidgets)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user dashboard widget:", error);
      throw error;
    }
  }

  async updateUserDashboardWidget(id: string, data: Partial<InsertUserDashboardWidget>): Promise<UserDashboardWidget | undefined> {
    try {
      const result = await db
        .update(userDashboardWidgets)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(userDashboardWidgets.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating user dashboard widget:", error);
      return undefined;
    }
  }

  async deleteUserDashboardWidget(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(userDashboardWidgets)
        .where(eq(userDashboardWidgets.id, id));
      return result.rowCount! > 0;
    } catch (error) {
      console.error("Error deleting user dashboard widget:", error);
      return false;
    }
  }

  async getWidgetData(widgetType: string, userId: string): Promise<any> {
    try {
      // Get user's roles to check if they're Admin or Manager
      const userRolesList = await this.getUserRolesByUser(userId);
      const roleNames = await Promise.all(
        userRolesList.map(async (ur) => {
          const role = await this.getRole(ur.roleId);
          return role?.name || '';
        })
      );
      
      const isAdminOrManager = roleNames.some(name => 
        name.toLowerCase() === 'admin' || name.toLowerCase() === 'manager'
      );
      
      // Get user's team assignments for filtering
      // For Admin/Manager, use empty array to show all clients
      let assignedClientIds: string[] = [];
      
      if (!isAdminOrManager) {
        const userAssignments = await db
          .select({ clientId: clientTeamAssignments.clientId })
          .from(clientTeamAssignments)
          .where(eq(clientTeamAssignments.staffId, userId));
        
        assignedClientIds = userAssignments.map(a => a.clientId);
      }

      switch (widgetType) {
        case 'client_health_overview':
          return await this.getClientHealthOverviewData();
        
        case 'recent_clients':
          return await this.getRecentClientsData();
        
        case 'client_approval_queue':
          return await this.getClientApprovalQueueData(assignedClientIds);
        
        case 'client_distribution_by_vertical':
          return await this.getClientDistributionByVerticalData();
        
        case 'client_portal_activity':
          return await this.getClientPortalActivityData(assignedClientIds);
        
        case 'client_team_assignments':
          return await this.getClientTeamAssignmentsData();
        
        // Sales & Revenue Widgets
        case 'sales_pipeline_overview':
          return await this.getSalesPipelineOverviewData(userId, isAdminOrManager);
        
        case 'quote_status_summary':
          return await this.getQuoteStatusSummaryData(assignedClientIds);
        
        case 'revenue_this_month':
          return await this.getRevenueThisMonthData(assignedClientIds);
        
        case 'mrr_tracker':
          return await this.getMRRTrackerData(assignedClientIds);
        
        case 'win_rate':
          return await this.getWinRateData(assignedClientIds);
        
        case 'top_performing_sales_reps':
          return await this.getTopPerformingSalesRepsData();
        
        case 'recent_deals_won':
          return await this.getRecentDealsWonData(assignedClientIds);
        
        default:
          return { error: 'Unknown widget type' };
      }
    } catch (error) {
      console.error(`Error fetching widget data for ${widgetType}:`, error);
      throw error;
    }
  }

  // Widget-specific data fetching methods
  private async getClientHealthOverviewData(): Promise<any> {
    try {
      // Get the most recent health score for each client
      const healthScores = await db
        .select({
          clientId: clientHealthScores.clientId,
          healthIndicator: clientHealthScores.healthIndicator,
          averageScore: clientHealthScores.averageScore,
          weekStartDate: clientHealthScores.weekStartDate,
        })
        .from(clientHealthScores)
        .orderBy(desc(clientHealthScores.weekStartDate));

      // Group by client and get the latest score
      const latestScores = new Map();
      healthScores.forEach(score => {
        if (!latestScores.has(score.clientId)) {
          latestScores.set(score.clientId, score);
        }
      });

      // Count by health indicator
      const counts = {
        Green: 0,
        Yellow: 0,
        Red: 0,
        total: latestScores.size,
      };

      latestScores.forEach(score => {
        if (counts[score.healthIndicator] !== undefined) {
          counts[score.healthIndicator]++;
        }
      });

      return counts;
    } catch (error) {
      console.error("Error fetching client health overview:", error);
      return { Green: 0, Yellow: 0, Red: 0, total: 0 };
    }
  }

  private async getRecentClientsData(): Promise<any> {
    try {
      const recentClients = await db
        .select()
        .from(clients)
        .where(eq(clients.isArchived, false))
        .orderBy(desc(clients.createdAt))
        .limit(5);

      return recentClients;
    } catch (error) {
      console.error("Error fetching recent clients:", error);
      return [];
    }
  }

  private async getClientApprovalQueueData(assignedClientIds: string[]): Promise<any> {
    try {
      if (assignedClientIds.length === 0) {
        return [];
      }

      // Get tasks requiring client approval for assigned clients
      const approvalQueue = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          clientId: tasks.clientId,
          clientName: clients.name,
          status: tasks.clientApprovalStatus,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .leftJoin(clients, eq(tasks.clientId, clients.id))
        .where(and(
          eq(tasks.requiresClientApproval, true),
          inArray(tasks.clientId, assignedClientIds),
          eq(tasks.clientApprovalStatus, 'pending')
        ))
        .orderBy(desc(tasks.createdAt))
        .limit(10);

      return approvalQueue;
    } catch (error) {
      console.error("Error fetching client approval queue:", error);
      return [];
    }
  }

  private async getClientDistributionByVerticalData(): Promise<any> {
    try {
      const CLIENT_VERTICAL_FIELD_ID = 'cac6e6ee-bdf9-48bd-81a7-48672d2453ae';
      
      // Get all non-archived clients with their custom field values
      const allClients = await db
        .select({
          id: clients.id,
          customFieldValues: clients.customFieldValues,
        })
        .from(clients)
        .where(eq(clients.isArchived, false));

      // Extract verticals and count them
      const verticalCounts: Record<string, number> = {};
      
      allClients.forEach(client => {
        const customFields = (client.customFieldValues as Record<string, any>) || {};
        const vertical = customFields[CLIENT_VERTICAL_FIELD_ID] || 'Uncategorized';
        verticalCounts[vertical] = (verticalCounts[vertical] || 0) + 1;
      });

      // Convert to array and sort by count descending
      const distribution = Object.entries(verticalCounts)
        .map(([vertical, count]) => ({
          vertical,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      return distribution;
    } catch (error) {
      console.error("Error fetching client distribution by vertical:", error);
      return [];
    }
  }

  private async getClientPortalActivityData(assignedClientIds: string[]): Promise<any> {
    try {
      if (assignedClientIds.length === 0) {
        return [];
      }

      // Get recent portal user logins for assigned clients
      const recentActivity = await db
        .select({
          id: clientPortalUsers.id,
          clientId: clientPortalUsers.clientId,
          clientName: clients.name,
          email: clientPortalUsers.email,
          firstName: clientPortalUsers.firstName,
          lastName: clientPortalUsers.lastName,
          lastLogin: clientPortalUsers.lastLogin,
        })
        .from(clientPortalUsers)
        .leftJoin(clients, eq(clientPortalUsers.clientId, clients.id))
        .where(and(
          inArray(clientPortalUsers.clientId, assignedClientIds),
          eq(clientPortalUsers.isActive, true),
          isNotNull(clientPortalUsers.lastLogin)
        ))
        .orderBy(desc(clientPortalUsers.lastLogin))
        .limit(10);

      return recentActivity;
    } catch (error) {
      console.error("Error fetching client portal activity:", error);
      return [];
    }
  }

  private async getClientTeamAssignmentsData(): Promise<any> {
    try {
      // Get all client team assignments with client and staff details
      const assignments = await db
        .select({
          id: clientTeamAssignments.id,
          clientId: clientTeamAssignments.clientId,
          clientName: clients.name,
          staffId: clientTeamAssignments.staffId,
          staffFirstName: staff.firstName,
          staffLastName: staff.lastName,
          staffEmail: staff.email,
          position: clientTeamAssignments.position,
          isPrimary: clientTeamAssignments.isPrimary,
        })
        .from(clientTeamAssignments)
        .innerJoin(clients, eq(clientTeamAssignments.clientId, clients.id))
        .leftJoin(staff, eq(clientTeamAssignments.staffId, staff.id))
        .where(eq(clients.isArchived, false))
        .orderBy(clients.name, desc(clientTeamAssignments.isPrimary));

      // Group by client and filter out any null assignments
      const grouped = assignments.reduce((acc: any, assignment) => {
        const clientId = assignment.clientId;
        if (!clientId) return acc;
        
        if (!acc[clientId]) {
          acc[clientId] = {
            clientId,
            clientName: assignment.clientName || 'Unknown Client',
            teamMembers: [],
          };
        }
        
        if (assignment.staffId) {
          const staffName = assignment.staffFirstName && assignment.staffLastName
            ? `${assignment.staffFirstName} ${assignment.staffLastName}`
            : 'Unknown';
          
          acc[clientId].teamMembers.push({
            staffId: assignment.staffId,
            staffName,
            staffEmail: assignment.staffEmail || '',
            position: assignment.position,
            isPrimary: assignment.isPrimary,
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
  private async getSalesPipelineOverviewData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      // Get all leads grouped by pipeline stage
      const pipelineData = await db
        .select({
          stage: leadPipelineStages.name,
          count: sql<number>`count(*)::int`,
          totalValue: sql<number>`sum(COALESCE(CAST(${leads.value} AS NUMERIC), 0))::int`,
        })
        .from(leads)
        .leftJoin(leadPipelineStages, eq(leads.stageId, leadPipelineStages.id))
        .where(
          and(
            eq(leads.status, 'Open'),
            !isAdminOrManager ? eq(leads.assignedTo, userId) : undefined
          )
        )
        .groupBy(leadPipelineStages.name);

      // Calculate conversion rate (won / total leads)
      const wonLeads = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(
          and(
            eq(leads.status, 'Won'),
            !isAdminOrManager ? eq(leads.assignedTo, userId) : undefined
          )
        );
      
      const totalLeads = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(!isAdminOrManager ? eq(leads.assignedTo, userId) : undefined);

      const conversionRate = totalLeads[0]?.count > 0 
        ? ((wonLeads[0]?.count || 0) / totalLeads[0].count * 100).toFixed(1)
        : '0.0';

      return {
        stages: pipelineData,
        conversionRate,
        totalLeads: pipelineData.reduce((sum, s) => sum + s.count, 0),
      };
    } catch (error) {
      console.error("Error fetching sales pipeline overview:", error);
      return { stages: [], conversionRate: '0.0', totalLeads: 0 };
    }
  }

  private async getQuoteStatusSummaryData(assignedClientIds: string[]): Promise<any> {
    try {
      const statusCounts = await db
        .select({
          status: quotes.status,
          count: sql<number>`count(*)::int`,
          totalValue: sql<number>`sum(COALESCE(CAST(${quotes.clientBudget} AS NUMERIC), 0))::int`,
        })
        .from(quotes)
        .where(
          assignedClientIds.length > 0 
            ? inArray(quotes.clientId, assignedClientIds)
            : undefined
        )
        .groupBy(quotes.status);

      return statusCounts.map(s => ({
        status: s.status,
        count: s.count,
        totalValue: s.totalValue,
      }));
    } catch (error) {
      console.error("Error fetching quote status summary:", error);
      return [];
    }
  }

  private async getRevenueThisMonthData(assignedClientIds: string[]): Promise<any> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Calculate revenue from accepted quotes this month
      const revenue = await db
        .select({
          total: sql<number>`sum(COALESCE(CAST(${quotes.clientBudget} AS NUMERIC), 0))::int`,
          count: sql<number>`count(*)::int`,
        })
        .from(quotes)
        .where(
          and(
            eq(quotes.status, 'accepted'),
            sql`${quotes.updatedAt} >= ${startOfMonth}`,
            assignedClientIds.length > 0 
              ? inArray(quotes.clientId, assignedClientIds)
              : undefined
          )
        );

      // Mock target - could be stored in settings
      const target = 100000;
      const actual = revenue[0]?.total || 0;
      const percentage = target > 0 ? ((actual / target) * 100).toFixed(1) : '0.0';

      return {
        actual,
        target,
        percentage,
        deals: revenue[0]?.count || 0,
      };
    } catch (error) {
      console.error("Error fetching revenue this month:", error);
      return { actual: 0, target: 0, percentage: '0.0', deals: 0 };
    }
  }

  private async getMRRTrackerData(assignedClientIds: string[]): Promise<any> {
    try {
      // MRR custom field ID
      const MRR_FIELD_ID = '4e8e946b-1744-4d7c-a417-cdcb2713c6ca';
      
      // Get all active clients with their custom field values
      const activeClients = await db
        .select({
          id: clients.id,
          name: clients.name,
          customFieldValues: clients.customFieldValues,
        })
        .from(clients)
        .where(
          and(
            eq(clients.status, 'active'),
            assignedClientIds.length > 0 
              ? inArray(clients.id, assignedClientIds)
              : undefined
          )
        );

      // Extract MRR values from custom fields and calculate totals
      const clientsWithMrr = activeClients
        .map(client => {
          const customFields = (client.customFieldValues as Record<string, any>) || {};
          const mrrValue = customFields[MRR_FIELD_ID];
          const mrr = mrrValue ? parseFloat(String(mrrValue)) : 0;
          
          return {
            clientId: client.id,
            clientName: client.name,
            mrr: mrr,
          };
        })
        .filter(client => client.mrr > 0); // Only include clients with MRR > 0

      // Calculate total MRR
      const totalMrr = clientsWithMrr.reduce((sum, client) => sum + client.mrr, 0);
      
      // Sort by MRR descending and get top 10
      const topClients = clientsWithMrr
        .sort((a, b) => b.mrr - a.mrr)
        .slice(0, 10);

      return {
        totalMrr: totalMrr,
        clientCount: clientsWithMrr.length,
        topClients: topClients,
      };
    } catch (error) {
      console.error("Error fetching MRR tracker data:", error);
      return { totalMrr: 0, clientCount: 0, topClients: [] };
    }
  }

  private async getWinRateData(assignedClientIds: string[]): Promise<any> {
    try {
      const wonCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(
          and(
            eq(leads.status, 'won'),
            assignedClientIds.length > 0 
              ? sql`${leads.staffAssigned} = ANY(${assignedClientIds})`
              : undefined
          )
        );

      const totalCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(
          and(
            sql`${leads.status} IN ('won', 'lost')`,
            assignedClientIds.length > 0 
              ? sql`${leads.staffAssigned} = ANY(${assignedClientIds})`
              : undefined
          )
        );

      const won = wonCount[0]?.count || 0;
      const total = totalCount[0]?.count || 0;
      const winRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0.0';

      return {
        winRate,
        won,
        lost: total - won,
        total,
      };
    } catch (error) {
      console.error("Error fetching win rate data:", error);
      return { winRate: '0.0', won: 0, lost: 0, total: 0 };
    }
  }

  private async getTopPerformingSalesRepsData(): Promise<any> {
    try {
      // Get top 5 staff members by number of won deals
      const topReps = await db
        .select({
          staffId: leads.staffAssigned,
          staffFirstName: staff.firstName,
          staffLastName: staff.lastName,
          dealsWon: sql<number>`count(*)::int`,
          totalRevenue: sql<number>`sum(COALESCE(${leads.estimatedValue}, 0))::int`,
        })
        .from(leads)
        .leftJoin(staff, eq(leads.staffAssigned, staff.id))
        .where(eq(leads.status, 'won'))
        .groupBy(leads.staffAssigned, staff.firstName, staff.lastName)
        .orderBy(desc(sql`count(*)`))
        .limit(5);

      return topReps.map(rep => ({
        staffId: rep.staffId,
        staffName: rep.staffFirstName && rep.staffLastName 
          ? `${rep.staffFirstName} ${rep.staffLastName}` 
          : 'Unknown',
        dealsWon: rep.dealsWon,
        totalRevenue: rep.totalRevenue,
      }));
    } catch (error) {
      console.error("Error fetching top performing sales reps:", error);
      return [];
    }
  }

  private async getRecentDealsWonData(assignedClientIds: string[]): Promise<any> {
    try {
      const recentDeals = await db
        .select({
          id: leads.id,
          companyName: leads.companyName,
          contactName: leads.contactName,
          estimatedValue: leads.estimatedValue,
          wonDate: leads.updatedAt,
          staffFirstName: staff.firstName,
          staffLastName: staff.lastName,
        })
        .from(leads)
        .leftJoin(staff, eq(leads.staffAssigned, staff.id))
        .where(
          and(
            eq(leads.status, 'won'),
            assignedClientIds.length > 0 
              ? sql`${leads.staffAssigned} = ANY(${assignedClientIds})`
              : undefined
          )
        )
        .orderBy(desc(leads.updatedAt))
        .limit(10);

      return recentDeals.map(deal => ({
        id: deal.id,
        companyName: deal.companyName,
        contactName: deal.contactName,
        estimatedValue: deal.estimatedValue,
        wonDate: deal.wonDate,
        staffName: deal.staffFirstName && deal.staffLastName
          ? `${deal.staffFirstName} ${deal.staffLastName}`
          : 'Unknown',
      }));
    } catch (error) {
      console.error("Error fetching recent deals won:", error);
      return [];
    }
  }
}

export const storage = new DbStorage();
