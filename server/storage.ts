import { 
  type Client, type InsertClient, clients,
  // Projects removed from system
  type Campaign, type InsertCampaign, campaigns,
  type Lead, type InsertLead, leads,
  type LeadPipelineStage, leadPipelineStages,
  type LeadSource, type InsertLeadSource, leadSources,
  type LeadNoteTemplate, type InsertLeadNoteTemplate, leadNoteTemplates,
  type Quote, type InsertQuote, quotes,
  type Task, type InsertTask, tasks,
  type TaskTimeEntry, type InsertTaskTimeEntry, taskTimeEntries,
  type Invoice, type InsertInvoice, invoices,
  clientNotes, clientTasks, clientDocuments, clientTransactions, clientProducts, clientBundles, deals,
  socialMediaAccounts, socialMediaPosts, socialMediaTemplates, calendarEvents, eventTimeEntries,
  type User, type InsertUser,
  type AuditLog, type InsertAuditLog, auditLogs,
  type CustomField, type InsertCustomField, customFields,
  type CustomFieldFolder, type InsertCustomFieldFolder, customFieldFolders,
  type ClientGroup, type InsertClientGroup,
  type Product, type InsertProduct, products,
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
  type TaskHistory, type InsertTaskHistory, taskHistory,
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
  taskAttachments,
  knowledgeBaseComments, knowledgeBaseArticles,
  notifications, notificationSettings,
  type Department, type InsertDepartment, departments,
  type Position, type InsertPosition, positions,
  type PositionKpi, type InsertPositionKpi, positionKpis,
  type JobApplication, type InsertJobApplication, jobApplications,
  type JobOpening, type InsertJobOpening, jobOpenings,
  type ClientBriefSection, type InsertClientBriefSection, clientBriefSections,
  type ClientBriefValue, type InsertClientBriefValue, clientBriefValues,
  type AuthUser, type InsertAuthUser, authUsers,
  type EmailIntegration, type InsertEmailIntegration, emailIntegrations,
  type SmsIntegration, type InsertSmsIntegration, smsIntegrations,
  type TeamPosition, type InsertTeamPosition, teamPositions,
  type ClientTeamAssignment, type InsertClientTeamAssignment, clientTeamAssignments,
  type UserViewPreference, type InsertUserViewPreference, userViewPreferences,
  type SalesSettings, type InsertSalesSettings, salesSettings,
  type SalesTarget, type InsertSalesTarget, type UpdateSalesTarget, salesTargets,
  type Dashboard, type InsertDashboard, dashboards,
  type DashboardWidget, type InsertDashboardWidget, dashboardWidgets,
  type UserDashboardWidget, type InsertUserDashboardWidget, userDashboardWidgets,
  type TimeOffRequest, type InsertTimeOffRequest, timeOffRequests,
  type TimeOffType, type InsertTimeOffType, type SelectTimeOffType, timeOffTypes,
  type NewHireOnboardingSubmission, type InsertNewHireOnboardingSubmission, newHireOnboardingSubmissions,
  type ExpenseReportSubmission, type InsertExpenseReportSubmission, expenseReportSubmissions,
  type TrainingEnrollment, type InsertTrainingEnrollment, trainingEnrollments,
  type TrainingProgress, trainingProgress,
  type TrainingCourse, trainingCourses,
  type CapacitySetting, capacitySettings,
  calendars, calendarAppointments,
  customFieldFileUploads, forms, formFields, formSubmissions, tags, automationTriggers, automationActions, staff, clientPortalUsers,
  type OrgChartStructure, type InsertOrgChartStructure, orgChartStructures,
  type OrgChartNode, type InsertOrgChartNode, orgChartNodes,
  type OrgChartNodeAssignment, type InsertOrgChartNodeAssignment, orgChartNodeAssignments,
  type GoHighLevelIntegration, type InsertGoHighLevelIntegration, goHighLevelIntegration,
  type Survey, type InsertSurvey, surveys,
  type SurveyFolder, type InsertSurveyFolder, surveyFolders,
  type SurveySlide, type InsertSurveySlide, surveySlides,
  type SurveyField, type InsertSurveyField, surveyFields,
  type SurveyLogicRule, type InsertSurveyLogicRule, surveyLogicRules,
  type SurveySubmission, type InsertSurveySubmission, surveySubmissions,
  type SurveySubmissionAnswer, type InsertSurveySubmissionAnswer, surveySubmissionAnswers,
  type PxMeeting, type InsertPxMeeting, pxMeetings,
  type PxMeetingAttendee, type InsertPxMeetingAttendee, pxMeetingAttendees
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql, asc, desc, and, or, max, isNull, inArray, isNotNull, ne, gte, lte, lt, gt } from "drizzle-orm";

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
    items: Array<ClientHealthScore & { clientName: string; clientEmail: string; clientCompany: string | null }>;
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
  
  // Lead Sources
  getLeadSources(): Promise<LeadSource[]>;
  getLeadSource(id: string): Promise<LeadSource | undefined>;
  createLeadSource(source: InsertLeadSource): Promise<LeadSource>;
  updateLeadSource(id: string, source: Partial<InsertLeadSource>): Promise<LeadSource | undefined>;
  deleteLeadSource(id: string): Promise<boolean>;
  reorderLeadSources(sourceIds: string[]): Promise<void>;
  
  // Lead Note Templates
  getLeadNoteTemplates(): Promise<LeadNoteTemplate[]>;
  getLeadNoteTemplate(id: string): Promise<LeadNoteTemplate | undefined>;
  createLeadNoteTemplate(template: InsertLeadNoteTemplate): Promise<LeadNoteTemplate>;
  updateLeadNoteTemplate(id: string, template: Partial<InsertLeadNoteTemplate>): Promise<LeadNoteTemplate | undefined>;
  deleteLeadNoteTemplate(id: string): Promise<boolean>;
  reorderLeadNoteTemplates(templateIds: string[]): Promise<void>;
  
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
  updateTimeEntry(taskId: string, entryId: string, updates: { duration?: number; startTime?: string; endTime?: string }): Promise<Task | undefined>;
  getTimeEntriesForUserOnDate(userId: string, date: string): Promise<Array<{ taskId: string; taskTitle: string; entries: import("@shared/schema").TimeEntry[] }>>;

  // Atomic per-row task time entry methods (new normalized table)
  startTaskTimer(input: { taskId: string; userId: string; taskTitle: string; userName: string }): Promise<TaskTimeEntry>;
  stopTaskTimerForUser(userId: string): Promise<{ entry: TaskTimeEntry; task: Task; totalTracked: number } | undefined>;
  getRunningTaskTimerForUser(userId: string): Promise<(TaskTimeEntry & { task: Task | null }) | undefined>;
  addManualTaskTimeEntry(input: { taskId: string; userId: string; userName: string; taskTitle: string; entryDate: Date; durationMinutes: number; notes?: string; source?: string }): Promise<{ entry: TaskTimeEntry; totalTracked: number }>;
  appendTaskTimeEntry(input: InsertTaskTimeEntry): Promise<TaskTimeEntry>;
  updateTaskTimeEntryById(taskId: string, entryId: string, updates: { duration?: number; startTime?: Date | string; endTime?: Date | string; notes?: string }): Promise<{ entry: TaskTimeEntry; task: Task | undefined; totalTracked: number } | undefined>;
  deleteTaskTimeEntryById(taskId: string, entryId: string): Promise<{ task: Task | undefined; totalTracked: number } | undefined>;
  recomputeTaskTimeTracked(taskId: string): Promise<number>;
  
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
  incrementWorkflowTemplateUsage(id: string): Promise<void>;
  
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
  reorderTeamPositions(positions: Array<{ id: string; order: number }>): Promise<boolean>;
  
  // Client Team Assignments
  getClientTeamAssignments(clientId: string): Promise<(ClientTeamAssignment & { position: TeamPosition; staffMember: Staff })[]>;
  getTeamAssignments(): Promise<(ClientTeamAssignment & { position: TeamPosition; staffMember: Staff })[]>;
  getClientTeamAssignmentsList(): Promise<Array<{
    id: string;
    clientId: string;
    staffId: string;
    positionId: string;
    assignedAt: Date | null;
    assignedBy: string;
    clientName: string | null;
    staffFirstName: string | null;
    staffLastName: string | null;
    positionLabel: string | null;
    positionKey: string | null;
  }>>;
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
  
  // Position KPIs
  getPositionKpis(positionId: string): Promise<import("@shared/schema").PositionKpi[]>;
  getPositionKpi(id: string): Promise<import("@shared/schema").PositionKpi | undefined>;
  createPositionKpi(kpi: import("@shared/schema").InsertPositionKpi): Promise<import("@shared/schema").PositionKpi>;
  updatePositionKpi(id: string, kpi: Partial<import("@shared/schema").InsertPositionKpi>): Promise<import("@shared/schema").PositionKpi | undefined>;
  deletePositionKpi(id: string): Promise<boolean>;

  // Organization Chart Structures
  getOrgChartStructures(): Promise<import("@shared/schema").OrgChartStructure[]>;
  getOrgChartStructure(id: string): Promise<import("@shared/schema").OrgChartStructure | undefined>;
  getActiveOrgChartStructure(): Promise<import("@shared/schema").OrgChartStructure | undefined>;
  createOrgChartStructure(structure: import("@shared/schema").InsertOrgChartStructure): Promise<import("@shared/schema").OrgChartStructure>;
  updateOrgChartStructure(id: string, structure: Partial<import("@shared/schema").InsertOrgChartStructure>): Promise<import("@shared/schema").OrgChartStructure | undefined>;
  deleteOrgChartStructure(id: string): Promise<boolean>;
  setActiveOrgChartStructure(id: string): Promise<import("@shared/schema").OrgChartStructure | undefined>;

  // Organization Chart Nodes
  getOrgChartNodes(structureId: string): Promise<import("@shared/schema").OrgChartNode[]>;
  getOrgChartNode(id: string): Promise<import("@shared/schema").OrgChartNode | undefined>;
  createOrgChartNode(node: import("@shared/schema").InsertOrgChartNode): Promise<import("@shared/schema").OrgChartNode>;
  updateOrgChartNode(id: string, node: Partial<import("@shared/schema").InsertOrgChartNode>): Promise<import("@shared/schema").OrgChartNode | undefined>;
  deleteOrgChartNode(id: string): Promise<boolean>;
  reorderOrgChartNodes(updates: Array<{ id: string; orderIndex: number; parentId?: string | null }>): Promise<void>;

  // Organization Chart Node Assignments
  getOrgChartNodeAssignments(nodeId: string): Promise<(import("@shared/schema").OrgChartNodeAssignment & { staff: Staff })[]>;
  getAllOrgChartAssignments(structureId: string): Promise<(import("@shared/schema").OrgChartNodeAssignment & { staff: Staff; node: import("@shared/schema").OrgChartNode })[]>;
  createOrgChartNodeAssignment(assignment: import("@shared/schema").InsertOrgChartNodeAssignment): Promise<import("@shared/schema").OrgChartNodeAssignment>;
  updateOrgChartNodeAssignment(id: string, assignment: Partial<import("@shared/schema").InsertOrgChartNodeAssignment>): Promise<import("@shared/schema").OrgChartNodeAssignment | undefined>;
  deleteOrgChartNodeAssignment(id: string): Promise<boolean>;

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
  
  // Sales Targets
  getSalesTargets(): Promise<SalesTarget[]>;
  getSalesTarget(id: string): Promise<SalesTarget | undefined>;
  getSalesTargetByMonth(year: number, month: number): Promise<SalesTarget | undefined>;
  createSalesTarget(target: InsertSalesTarget): Promise<SalesTarget>;
  updateSalesTarget(id: string, target: Partial<UpdateSalesTarget>): Promise<SalesTarget | undefined>;
  deleteSalesTarget(id: string): Promise<boolean>;
  
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
  getSmsIntegrations(): Promise<SmsIntegration[]>;
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
  
  // 1v1 Progression Statuses
  getProgressionStatuses(): Promise<OneOnOneProgressionStatus[]>;
  getProgressionStatus(id: string): Promise<OneOnOneProgressionStatus | undefined>;
  createProgressionStatus(data: InsertOneOnOneProgressionStatus): Promise<OneOnOneProgressionStatus>;
  updateProgressionStatus(id: string, data: Partial<InsertOneOnOneProgressionStatus>): Promise<OneOnOneProgressionStatus | undefined>;
  deleteProgressionStatus(id: string): Promise<boolean>;
  
  // Time Off Types
  getTimeOffTypes(policyId: string): Promise<SelectTimeOffType[]>;
  getTimeOffType(id: string): Promise<SelectTimeOffType | undefined>;
  createTimeOffType(data: InsertTimeOffType): Promise<SelectTimeOffType>;
  updateTimeOffType(id: string, data: Partial<InsertTimeOffType>): Promise<SelectTimeOffType | undefined>;
  deleteTimeOffType(id: string): Promise<boolean>;
  reorderTimeOffTypes(updates: Array<{ id: string; orderIndex: number }>): Promise<void>;
  
  // GoHighLevel Integration
  getGoHighLevelIntegration(): Promise<GoHighLevelIntegration | undefined>;
  getGoHighLevelIntegrationByToken(token: string): Promise<GoHighLevelIntegration | undefined>;
  createGoHighLevelIntegration(data: InsertGoHighLevelIntegration): Promise<GoHighLevelIntegration>;
  updateGoHighLevelIntegration(id: string, data: Partial<InsertGoHighLevelIntegration>): Promise<GoHighLevelIntegration | undefined>;
  deleteGoHighLevelIntegration(id: string): Promise<boolean>;
  incrementGoHighLevelLeadCount(id: string): Promise<void>;
  
  // PX Meetings
  getPxMeetings(): Promise<Array<PxMeeting & { attendees: Array<{ id: string; name: string }> }>>;
  getPxMeeting(id: string): Promise<(PxMeeting & { attendees: Array<{ id: string; name: string }> }) | undefined>;
  createPxMeeting(data: InsertPxMeeting, attendeeIds: string[]): Promise<PxMeeting>;
  updatePxMeeting(id: string, data: Partial<InsertPxMeeting>, attendeeIds?: string[]): Promise<PxMeeting | undefined>;
  deletePxMeeting(id: string): Promise<boolean>;
}

// Map a brief section.key (which may be camelCase like "briefAudienceInfo" or
// snake_case like "audience_info") to the corresponding `clients` column.
// Returns null if the key doesn't correspond to a known core brief column.
export function mapBriefSectionKeyToClientColumn(rawKey: string): keyof InsertClient | null {
  const map: Record<string, keyof InsertClient> = {
    background: 'briefBackground',
    briefBackground: 'briefBackground',
    objectives: 'briefObjectives',
    briefObjectives: 'briefObjectives',
    brand_info: 'briefBrandInfo',
    brandInfo: 'briefBrandInfo',
    briefBrandInfo: 'briefBrandInfo',
    audience_info: 'briefAudienceInfo',
    audienceInfo: 'briefAudienceInfo',
    briefAudienceInfo: 'briefAudienceInfo',
    products_services: 'briefProductsServices',
    productsServices: 'briefProductsServices',
    briefProductsServices: 'briefProductsServices',
    competitors: 'briefCompetitors',
    briefCompetitors: 'briefCompetitors',
    marketing_tech: 'briefMarketingTech',
    marketingTech: 'briefMarketingTech',
    briefMarketingTech: 'briefMarketingTech',
    miscellaneous: 'briefMiscellaneous',
    briefMiscellaneous: 'briefMiscellaneous',
  };
  return map[rawKey] ?? null;
}

function taskTimeEntryToLegacy(entry: TaskTimeEntry, taskTitle?: string): import("@shared/schema").TimeEntry {
  return {
    id: entry.id,
    taskId: entry.taskId,
    taskTitle: entry.taskTitle || taskTitle || '',
    startTime: entry.startTime instanceof Date ? entry.startTime.toISOString() : String(entry.startTime),
    endTime: entry.endTime ? (entry.endTime instanceof Date ? entry.endTime.toISOString() : String(entry.endTime)) : undefined,
    userId: entry.userId,
    userName: entry.userName ?? undefined,
    isRunning: !!entry.isRunning,
    duration: entry.duration ?? undefined,
    source: entry.source ?? undefined,
    notes: entry.notes ?? undefined,
    stoppedBy: entry.stoppedBy ?? undefined,
    stopReason: entry.stopReason ?? undefined,
    autoStoppedAt: entry.autoStoppedAt
      ? (entry.autoStoppedAt instanceof Date ? entry.autoStoppedAt.toISOString() : String(entry.autoStoppedAt))
      : undefined,
    autoStoppedThresholdHours: entry.autoStoppedThresholdHours ?? undefined,
  };
}

type TaskWithLegacyEntries = Task & { timeEntries: import("@shared/schema").TimeEntry[] };

function groupEntriesByTask<R extends { entry: TaskTimeEntry; task: Task }>(
  rows: R[],
  extra?: (row: R) => Record<string, unknown>,
): TaskWithLegacyEntries[] {
  const map = new Map<string, TaskWithLegacyEntries>();
  for (const row of rows) {
    const key = row.task.id;
    if (!map.has(key)) {
      const base: TaskWithLegacyEntries = { ...row.task, timeEntries: [] };
      const merged = extra ? Object.assign(base, extra(row)) : base;
      map.set(key, merged);
    }
    map.get(key)!.timeEntries.push(taskTimeEntryToLegacy(row.entry, row.task.title));
  }
  return Array.from(map.values());
}

export class MemStorage implements IStorage {
  private clients: Map<string, Client> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private leads: Map<string, Lead> = new Map();
  private leadSources: Map<string, LeadSource> = new Map();
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

    // Comprehensive automation actions for AgencyBoost CRM
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
          channel: { type: "string", label: "Channel ID", placeholder: "Leave empty for default channel" },
          message: { type: "string", required: true, label: "Message", multiline: true }
        },
        isActive: true,
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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
        createdAt: new Date()
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

  // Lead Sources
  async getLeadSources(): Promise<LeadSource[]> {
    return Array.from(this.leadSources.values()).sort((a, b) => a.order - b.order);
  }

  async getLeadSource(id: string): Promise<LeadSource | undefined> {
    return this.leadSources.get(id);
  }

  async createLeadSource(insertSource: InsertLeadSource): Promise<LeadSource> {
    const id = randomUUID();
    const now = new Date();
    const source: LeadSource = {
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

  async updateLeadSource(id: string, sourceUpdate: Partial<InsertLeadSource>): Promise<LeadSource | undefined> {
    const source = this.leadSources.get(id);
    if (!source) return undefined;
    
    const updatedSource = { ...source, ...sourceUpdate, updatedAt: new Date() };
    this.leadSources.set(id, updatedSource);
    return updatedSource;
  }

  async deleteLeadSource(id: string): Promise<boolean> {
    return this.leadSources.delete(id);
  }

  async reorderLeadSources(sourceIds: string[]): Promise<void> {
    sourceIds.forEach((id, index) => {
      const source = this.leadSources.get(id);
      if (source) {
        this.leadSources.set(id, { ...source, order: index });
      }
    });
  }

  // Lead Note Templates
  private leadNoteTemplates: Map<string, LeadNoteTemplate> = new Map();

  async getLeadNoteTemplates(): Promise<LeadNoteTemplate[]> {
    return Array.from(this.leadNoteTemplates.values())
      .sort((a, b) => a.order - b.order);
  }

  async getLeadNoteTemplate(id: string): Promise<LeadNoteTemplate | undefined> {
    return this.leadNoteTemplates.get(id);
  }

  async createLeadNoteTemplate(insertTemplate: InsertLeadNoteTemplate): Promise<LeadNoteTemplate> {
    const id = randomUUID();
    const now = new Date();
    const template: LeadNoteTemplate = {
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

  async updateLeadNoteTemplate(id: string, templateUpdate: Partial<InsertLeadNoteTemplate>): Promise<LeadNoteTemplate | undefined> {
    const template = this.leadNoteTemplates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...templateUpdate, updatedAt: new Date() };
    this.leadNoteTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteLeadNoteTemplate(id: string): Promise<boolean> {
    return this.leadNoteTemplates.delete(id);
  }

  async reorderLeadNoteTemplates(templateIds: string[]): Promise<void> {
    templateIds.forEach((id, index) => {
      const template = this.leadNoteTemplates.get(id);
      if (template) {
        this.leadNoteTemplates.set(id, { ...template, order: index });
      }
    });
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

    // Defensive: strip any legacy `timeEntries` payload (column has been
    // retired; all time-entry mutations live on the normalized table).
    const { timeEntries: _ignored, ...taskWithoutTimeEntries } = taskUpdate as Partial<InsertTask> & { timeEntries?: unknown };

    const updatedTask = {
      ...task,
      ...taskWithoutTimeEntries,
      completedAt: taskUpdate.status === 'completed' ? new Date() : task.completedAt,
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
  // The methods below were originally backed by tasks.timeEntries (JSONB).
  // That column has been retired: production uses PostgresStorage which now
  // sources everything from the normalized task_time_entries table.
  // MemStorage retains these methods only to satisfy the IStorage contract.
  async getTimeTrackingReport(_filters: import('@shared/schema').TimeTrackingReportFilters): Promise<import('@shared/schema').TimeTrackingReportData> {
    return { tasks: [], userSummaries: [], clientBreakdowns: [], dailyTotals: {}, grandTotal: 0 };
  }

  async getUserTimeEntries(_userId: string, _dateFrom: string, _dateTo: string): Promise<Array<Task & { timeEntries: import('@shared/schema').TimeEntry[] }>> {
    return [];
  }

  async getRunningTimeEntries(): Promise<Array<{ taskId: string; userId: string; startTime: string }>> {
    return [];
  }

  async getTimeEntriesByDateRange(_dateFrom: string, _dateTo: string, _userId?: string, _clientId?: string): Promise<Array<Task & { timeEntries: import('@shared/schema').TimeEntry[] }>> {
    return [];
  }

  async updateTimeEntry(_taskId: string, _entryId: string, _updates: { duration?: number; startTime?: string; endTime?: string }): Promise<Task | undefined> {
    return undefined;
  }

  async getTimeEntriesForUserOnDate(_userId: string, _date: string): Promise<Array<{ taskId: string; taskTitle: string; entries: import('@shared/schema').TimeEntry[] }>> {
    return [];
  }


  // ---- New normalized per-row methods (MemStorage stubs / not used in prod) ----
  async startTaskTimer(_input: { taskId: string; userId: string; taskTitle: string; userName: string }): Promise<TaskTimeEntry> {
    throw new Error("startTaskTimer is not supported by MemStorage");
  }
  async stopTaskTimerForUser(_userId: string): Promise<{ entry: TaskTimeEntry; task: Task; totalTracked: number } | undefined> {
    throw new Error("stopTaskTimerForUser is not supported by MemStorage");
  }
  async getRunningTaskTimerForUser(_userId: string): Promise<(TaskTimeEntry & { task: Task | null }) | undefined> {
    return undefined;
  }
  async addManualTaskTimeEntry(_input: { taskId: string; userId: string; userName: string; taskTitle: string; entryDate: Date; durationMinutes: number; notes?: string; source?: string }): Promise<{ entry: TaskTimeEntry; totalTracked: number }> {
    throw new Error("addManualTaskTimeEntry is not supported by MemStorage");
  }
  async appendTaskTimeEntry(_input: InsertTaskTimeEntry): Promise<TaskTimeEntry> {
    throw new Error("appendTaskTimeEntry is not supported by MemStorage");
  }
  async updateTaskTimeEntryById(_taskId: string, _entryId: string, _updates: { duration?: number; startTime?: Date | string; endTime?: Date | string; notes?: string }): Promise<{ entry: TaskTimeEntry; task: Task | undefined; totalTracked: number } | undefined> {
    return undefined;
  }
  async deleteTaskTimeEntryById(_taskId: string, _entryId: string): Promise<{ task: Task | undefined; totalTracked: number } | undefined> {
    return undefined;
  }
  async recomputeTaskTimeTracked(_taskId: string): Promise<number> {
    return 0;
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

  async incrementWorkflowTemplateUsage(id: string): Promise<void> {
    const template = this.workflowTemplates.get(id);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      this.workflowTemplates.set(id, template);
    }
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
      let value: string | undefined = undefined;

      if (client && section.key) {
        const column = mapBriefSectionKeyToClientColumn(section.key);
        if (column) {
          value = ((client as any)[column] as string | null) || undefined;
        }
      }

      return { ...section, value };
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
        const column = mapBriefSectionKeyToClientColumn(section.key);
        if (column) {
          (updateData as any)[column] = value;
        }
        if (Object.keys(updateData).length === 0) {
          console.warn(`[setClientBriefValue] No client column mapping for core section key: ${section.key}`);
          return;
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

  async getSmsIntegrations(): Promise<SmsIntegration[]> {
    return Array.from(this.smsIntegrations.values());
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

    this.seedSlackActions().catch(err => console.error("Error seeding Slack actions:", err));
  }

  private async seedSlackActions() {
    const slackActionDefs = [
      { id: "action-slack-message", name: "Send Slack Message", type: "send_slack_message", description: "Send a message to Slack channel or user", category: "integration", configSchema: { channel: { type: "string", label: "Channel ID", placeholder: "Leave empty for default channel" }, message: { type: "string", required: true, label: "Message", multiline: true } } },
      { id: "action-slack-dm", name: "Send Slack DM", type: "send_slack_dm", description: "Send a direct message to a Slack user", category: "integration", configSchema: { userId: { type: "string", label: "Slack User ID", placeholder: "User ID or leave empty to use email" }, email: { type: "string", label: "User Email", placeholder: "Look up user by email if no User ID" }, message: { type: "string", required: true, label: "Message", multiline: true } } },
      { id: "action-slack-reaction", name: "Add Slack Reaction", type: "add_slack_reaction", description: "Add an emoji reaction to a Slack message", category: "integration", configSchema: { channel: { type: "string", required: true, label: "Channel ID" }, timestamp: { type: "string", required: true, label: "Message Timestamp", placeholder: "Message ts from trigger" }, emoji: { type: "string", required: true, label: "Emoji", placeholder: "thumbsup, heart, rocket, etc." } } },
      { id: "action-slack-channel", name: "Create Slack Channel", type: "create_slack_channel", description: "Create a new Slack channel", category: "integration", configSchema: { name: { type: "string", required: true, label: "Channel Name", placeholder: "project-{{trigger.name}}" }, description: { type: "string", label: "Channel Description" }, isPrivate: { type: "boolean", label: "Private Channel", default: false }, inviteUsers: { type: "array", items: { type: "string" }, label: "Invite User IDs" } } },
      { id: "action-slack-topic", name: "Set Slack Channel Topic", type: "set_slack_topic", description: "Set or update a Slack channel topic", category: "integration", configSchema: { channel: { type: "string", required: true, label: "Channel ID" }, topic: { type: "string", required: true, label: "Topic", multiline: true } } },
      { id: "action-slack-reminder", name: "Create Slack Reminder", type: "create_slack_reminder", description: "Create a reminder in Slack", category: "integration", configSchema: { text: { type: "string", required: true, label: "Reminder Text" }, time: { type: "string", required: true, label: "Time", placeholder: "in 1 hour, tomorrow at 9am, 1234567890" }, user: { type: "string", label: "User ID", placeholder: "Leave empty for yourself" } } },
    ];

    try {
      const existing = await db.select({ id: automationActions.id, type: automationActions.type }).from(automationActions);
      const existingTypes = new Set(existing.map(e => e.type));

      for (const def of slackActionDefs) {
        if (!existingTypes.has(def.type)) {
          await db.insert(automationActions).values({
            id: def.id,
            name: def.name,
            type: def.type,
            description: def.description,
            category: def.category,
            configSchema: def.configSchema,
            isActive: true,
            createdAt: new Date(),
          });
          console.log(`[Seed] Added Slack action: ${def.name}`);
        }
      }

      const slackTypes = slackActionDefs.map(d => d.type);
      await db.update(automationActions)
        .set({ category: "integration" })
        .where(and(
          inArray(automationActions.type, slackTypes),
          sql`${automationActions.category} != 'integration'`
        ));
    } catch (error) {
      console.error("Error seeding Slack actions:", error);
    }
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

  async upsertClientCustomFieldValue(clientId: string, customFieldId: string, value: string): Promise<Client | undefined> {
    try {
      // Get current client
      const client = await this.getClient(clientId);
      if (!client) {
        console.error(`Client ${clientId} not found for custom field update`);
        return undefined;
      }
      
      // Get current custom field values or initialize empty object
      const currentValues = (client.customFieldValues as Record<string, any>) || {};
      
      // Update the specific custom field
      currentValues[customFieldId] = value;
      
      // Save back to client
      const result = await db.update(clients)
        .set({
          customFieldValues: currentValues,
          updatedAt: new Date()
        })
        .where(eq(clients.id, clientId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error upserting client custom field value:", error);
      throw error;
    }
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      // First delete all related records that reference this client
      // Delete in order to avoid foreign key constraint issues
      
      // Delete client brief values
      await db.delete(clientBriefValues).where(eq(clientBriefValues.clientId, id));
      
      // Delete campaigns
      await db.delete(campaigns).where(eq(campaigns.clientId, id));
      
      // Delete client health scores  
      await db.delete(clientHealthScores).where(eq(clientHealthScores.clientId, id));
      
      // Delete client notes
      await db.delete(clientNotes).where(eq(clientNotes.clientId, id));
      
      // Delete client tasks (the client-specific tasks table)
      await db.delete(clientTasks).where(eq(clientTasks.clientId, id));
      
      // Delete client appointments (legacy table)
      await db.delete(appointments).where(eq(appointments.clientId, id));
      
      // Delete client documents
      await db.delete(clientDocuments).where(eq(clientDocuments.clientId, id));
      
      // Delete client transactions
      await db.delete(clientTransactions).where(eq(clientTransactions.clientId, id));
      
      // Delete client products
      await db.delete(clientProducts).where(eq(clientProducts.clientId, id));
      
      // Delete client bundles
      await db.delete(clientBundles).where(eq(clientBundles.clientId, id));
      
      // Delete activities related to client
      await db.delete(activities).where(eq(activities.clientId, id));
      
      // Delete client team assignments
      await db.delete(clientTeamAssignments).where(eq(clientTeamAssignments.clientId, id));
      
      // Delete custom field file uploads
      await db.delete(customFieldFileUploads).where(eq(customFieldFileUploads.clientId, id));
      
      // Delete invoices
      await db.delete(invoices).where(eq(invoices.clientId, id));
      
      // Delete scheduled emails
      await db.delete(scheduledEmails).where(eq(scheduledEmails.clientId, id));
      
      // Delete notes (legacy table)
      await db.delete(notes).where(eq(notes.clientId, id));
      
      // Delete client portal users
      await db.delete(clientPortalUsers).where(eq(clientPortalUsers.clientId, id));
      
      // Delete social media accounts
      await db.delete(socialMediaAccounts).where(eq(socialMediaAccounts.clientId, id));
      
      // Delete social media posts
      await db.delete(socialMediaPosts).where(eq(socialMediaPosts.clientId, id));
      
      // Delete social media templates
      await db.delete(socialMediaTemplates).where(eq(socialMediaTemplates.clientId, id));
      
      // Delete deals
      await db.delete(deals).where(eq(deals.clientId, id));
      
      // Update tasks to remove client reference (set to null instead of deleting)
      await db.update(tasks).set({ clientId: null }).where(eq(tasks.clientId, id));
      
      // Update quotes to remove client reference (set to null)
      await db.update(quotes).set({ clientId: null }).where(eq(quotes.clientId, id));
      
      // Update calendar appointments to remove client reference (set to null)
      await db.update(calendarAppointments).set({ clientId: null }).where(eq(calendarAppointments.clientId, id));
      
      // Update expense reports to remove client reference (set to null)
      await db.update(expenseReportSubmissions).set({ clientId: null }).where(eq(expenseReportSubmissions.clientId, id));
      
      // Update calendar events to remove client reference (set to null)
      await db.update(calendarEvents).set({ clientId: null }).where(eq(calendarEvents.clientId, id));
      
      // Update event time entries to remove client reference (set to null)
      await db.update(eventTimeEntries).set({ clientId: null }).where(eq(eventTimeEntries.clientId, id));
      
      // Update workflow executions to remove contact reference (set to null)
      await db.update(workflowExecutions).set({ contactId: null }).where(eq(workflowExecutions.contactId, id));
      
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
        paymentStatus: clientHealthScores.paymentStatus,
        totalScore: clientHealthScores.totalScore,
        averageScore: clientHealthScores.averageScore,
        healthIndicator: clientHealthScores.healthIndicator,
        createdAt: clientHealthScores.createdAt,
        updatedAt: clientHealthScores.updatedAt,
        clientName: clients.name,
        clientEmail: clients.email,
        clientCompany: clients.company
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
                       sort === 'createdAt' ? clientHealthScores.createdAt :
                       sort === 'paymentStatus' ? clientHealthScores.paymentStatus :
                       sort === 'goals' ? clientHealthScores.goals :
                       sort === 'fulfillment' ? clientHealthScores.fulfillment :
                       sort === 'relationship' ? clientHealthScores.relationship :
                       sort === 'clientActions' ? clientHealthScores.clientActions :
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
    
    // Sourced from the normalized task_time_entries table (legacy
    // tasks.time_entries JSONB column has been retired). We still pull the
    // related task / staff / client metadata so reports can group + label.
    const conditions: any[] = [
      sql`(${taskTimeEntries.startTime})::date >= ${dateFrom}::date`,
      sql`(${taskTimeEntries.startTime})::date <= ${dateTo}::date`,
    ];
    if (userId) conditions.push(eq(taskTimeEntries.userId, userId));
    if (clientId) conditions.push(eq(tasks.clientId, clientId));
    if (taskStatus && taskStatus.length > 0) {
      conditions.push(sql`${tasks.status} IN (${sql.join(taskStatus.map(status => sql`${status}`), sql`, `)})`);
    }

    const rows = await db
      .select({
        entry: taskTimeEntries,
        task: tasks,
        staff: staff,
        client: clients,
      })
      .from(taskTimeEntries)
      .innerJoin(tasks, eq(taskTimeEntries.taskId, tasks.id))
      .leftJoin(staff, eq(staff.id, taskTimeEntries.userId))
      .leftJoin(clients, eq(clients.id, tasks.clientId))
      .where(and(...conditions));

    // Group entries by task, materialising the legacy timeEntriesByDate shape.
    const tasksMap = new Map<string, any>();
    for (const row of rows) {
      const t = row.task;
      const e = row.entry;
      if (!e.startTime) continue;
      const dateKey = new Date(e.startTime as any).toISOString().split('T')[0];
      const userName = row.staff
        ? `${row.staff.firstName ?? ''} ${row.staff.lastName ?? ''}`.trim() || (e.userName ?? `User ${e.userId}`)
        : (e.userName ?? `User ${e.userId}`);
      const legacyEntry: import("@shared/schema").TimeEntry = {
        ...taskTimeEntryToLegacy(e, t.title),
        userName,
      };
      let bucket = tasksMap.get(t.id);
      if (!bucket) {
        bucket = {
          ...t,
          userInfo: row.staff
            ? { firstName: row.staff.firstName, lastName: row.staff.lastName, role: (row.staff as any).role, department: row.staff.department }
            : undefined,
          clientInfo: row.client ? { name: row.client.name } : undefined,
          timeEntriesByDate: {} as Record<string, import("@shared/schema").TimeEntry[]>,
          totalTracked: 0,
        };
        tasksMap.set(t.id, bucket);
      }
      if (!bucket.timeEntriesByDate[dateKey]) bucket.timeEntriesByDate[dateKey] = [];
      bucket.timeEntriesByDate[dateKey].push(legacyEntry);
      bucket.totalTracked += legacyEntry.duration || 0;
    }
    const tasksWithDetails = Array.from(tasksMap.values());
    
    // Calculate user summaries
    const userSummaries: import("@shared/schema").UserSummary[] = [];
    const userTimeMap = new Map<string, any>();
    
    tasksWithDetails.forEach(task => {
      Object.entries(task.timeEntriesByDate).forEach(([date, entries]) => {
        entries.forEach(entry => {
          if (!userTimeMap.has(entry.userId)) {
            userTimeMap.set(entry.userId, {
              userId: entry.userId,
              userName: entry.userName || (task.userInfo?.firstName ? `${task.userInfo.firstName} ${task.userInfo.lastName}` : `User ${entry.userId}`),
              userRole: (task.userInfo as any)?.role || 'User',
              department: (task.userInfo as any)?.department,
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
              userName: entry.userName || (task.userInfo?.firstName ? `${task.userInfo.firstName} ${task.userInfo.lastName}` : `User ${entry.userId}`),
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
    // Read entries from the new normalized table for the given user/date range,
    // join the parent task, then group entries by task to preserve the legacy
    // return shape (Array<Task & { timeEntries: TimeEntry[] }>).
    const rows = await db
      .select({
        entry: taskTimeEntries,
        task: tasks,
      })
      .from(taskTimeEntries)
      .innerJoin(tasks, eq(taskTimeEntries.taskId, tasks.id))
      .where(
        and(
          eq(taskTimeEntries.userId, userId),
          sql`(${taskTimeEntries.startTime})::date >= ${dateFrom}::date`,
          sql`(${taskTimeEntries.startTime})::date <= ${dateTo}::date`,
        ),
      );

    return groupEntriesByTask(rows);
  }

  async getRunningTimeEntries(): Promise<Array<{ taskId: string; userId: string; startTime: string }>> {
    const rows = await db
      .select({ taskId: taskTimeEntries.taskId, userId: taskTimeEntries.userId, startTime: taskTimeEntries.startTime })
      .from(taskTimeEntries)
      .where(eq(taskTimeEntries.isRunning, true));
    return rows.map(r => ({
      taskId: r.taskId,
      userId: r.userId,
      startTime: r.startTime instanceof Date ? r.startTime.toISOString() : String(r.startTime),
    }));
  }

  async getTimeEntriesByDateRange(dateFrom: string, dateTo: string, userId?: string, clientId?: string): Promise<Array<Task & { timeEntries: import("@shared/schema").TimeEntry[] }>> {
    console.log(`🔍 getTimeEntriesByDateRange called with:`, { dateFrom, dateTo, userId, clientId });

    // Dev-admin users get an unfiltered view (matches legacy behavior).
    let effectiveUserId = userId;
    if (userId && userId.startsWith('dev-admin-')) {
      console.log(`🚀 Dev-admin user detected, showing all time data instead of filtering by: ${userId}`);
      effectiveUserId = undefined;
    }

    const conditions: any[] = [
      sql`(${taskTimeEntries.startTime})::date >= ${dateFrom}::date`,
      sql`(${taskTimeEntries.startTime})::date <= ${dateTo}::date`,
    ];
    if (effectiveUserId) conditions.push(eq(taskTimeEntries.userId, effectiveUserId));
    if (clientId === 'no-client') conditions.push(isNull(tasks.clientId));
    else if (clientId) conditions.push(eq(tasks.clientId, clientId));

    const rows = await db
      .select({
        entry: taskTimeEntries,
        task: tasks,
        clientCompany: clients.company,
        clientName: clients.name,
      })
      .from(taskTimeEntries)
      .innerJoin(tasks, eq(taskTimeEntries.taskId, tasks.id))
      .leftJoin(clients, eq(tasks.clientId, clients.id))
      .where(and(...conditions));

    const grouped = groupEntriesByTask(rows, (r: any) => ({
      clientName: r.clientCompany || r.clientName || undefined,
    }));

    console.log(`🔍 getTimeEntriesByDateRange: Returning ${grouped.length} tasks with entries`);
    return grouped;
  }

  async updateTimeEntry(taskId: string, entryId: string, updates: { duration?: number; startTime?: string; endTime?: string }): Promise<Task | undefined> {
    const result = await this.updateTaskTimeEntryById(taskId, entryId, updates);
    if (!result) return undefined;
    return result.task;
  }

  async getTimeEntriesForUserOnDate(userId: string, date: string): Promise<Array<{ taskId: string; taskTitle: string; entries: import("@shared/schema").TimeEntry[] }>> {
    try {
      const rows = await db
        .select({
          entry: taskTimeEntries,
          taskId: tasks.id,
          taskTitle: tasks.title,
        })
        .from(taskTimeEntries)
        .innerJoin(tasks, eq(taskTimeEntries.taskId, tasks.id))
        .where(
          and(
            eq(taskTimeEntries.userId, userId),
            sql`((${taskTimeEntries.startTime})::timestamptz AT TIME ZONE 'America/New_York')::date = ${date}::date`,
          ),
        );

      const grouped = new Map<string, { taskId: string; taskTitle: string; entries: import("@shared/schema").TimeEntry[] }>();
      for (const row of rows) {
        const key = row.taskId;
        if (!grouped.has(key)) {
          grouped.set(key, { taskId: row.taskId, taskTitle: row.taskTitle, entries: [] });
        }
        grouped.get(key)!.entries.push(taskTimeEntryToLegacy(row.entry, row.taskTitle));
      }
      return Array.from(grouped.values());
    } catch (error) {
      console.error("Error getting time entries for user on date:", error);
      return [];
    }
  }

  // ---- New normalized per-row methods ----

  async startTaskTimer(input: { taskId: string; userId: string; taskTitle: string; userName: string }): Promise<TaskTimeEntry> {
    const now = new Date();
    const [entry] = await db
      .insert(taskTimeEntries)
      .values({
        taskId: input.taskId,
        userId: input.userId,
        taskTitle: input.taskTitle,
        userName: input.userName,
        startTime: now,
        isRunning: true,
        source: 'timer',
      })
      .returning();
    return entry;
  }

  async stopTaskTimerForUser(userId: string): Promise<{ entry: TaskTimeEntry; task: Task; totalTracked: number } | undefined> {
    // Atomic single-row update: find the running entry for this user and stop it.
    const now = new Date();
    const [running] = await db
      .select()
      .from(taskTimeEntries)
      .where(and(eq(taskTimeEntries.userId, userId), eq(taskTimeEntries.isRunning, true)))
      .orderBy(taskTimeEntries.startTime)
      .limit(1);
    if (!running) return undefined;

    const durationMin = Math.max(0, Math.floor((now.getTime() - new Date(running.startTime).getTime()) / 1000 / 60));
    // Predicate is_running=true makes the UPDATE a no-op if another writer
    // (e.g. the auto-stop service) already stopped the timer between our
    // SELECT and UPDATE — preventing duplicate stop overwrites.
    const [updated] = await db
      .update(taskTimeEntries)
      .set({ endTime: now, duration: durationMin, isRunning: false, updatedAt: now })
      .where(and(eq(taskTimeEntries.id, running.id), eq(taskTimeEntries.isRunning, true)))
      .returning();
    if (!updated) return undefined;

    const totalTracked = await this.recomputeTaskTimeTracked(updated.taskId);
    const [task] = await db.select().from(tasks).where(eq(tasks.id, updated.taskId));
    return { entry: updated, task: task!, totalTracked };
  }

  async getRunningTaskTimerForUser(userId: string): Promise<(TaskTimeEntry & { task: Task | null }) | undefined> {
    const rows = await db
      .select({ entry: taskTimeEntries, task: tasks })
      .from(taskTimeEntries)
      .innerJoin(tasks, eq(taskTimeEntries.taskId, tasks.id))
      .where(and(eq(taskTimeEntries.userId, userId), eq(taskTimeEntries.isRunning, true)))
      .limit(1);
    if (rows.length === 0) return undefined;
    const r = rows[0];
    const result: TaskTimeEntry & { task: Task | null } = { ...r.entry, task: r.task };
    return result;
  }

  async addManualTaskTimeEntry(input: { taskId: string; userId: string; userName: string; taskTitle: string; entryDate: Date; durationMinutes: number; notes?: string; source?: string }): Promise<{ entry: TaskTimeEntry; totalTracked: number }> {
    const [entry] = await db
      .insert(taskTimeEntries)
      .values({
        taskId: input.taskId,
        userId: input.userId,
        userName: input.userName,
        taskTitle: input.taskTitle,
        startTime: input.entryDate,
        endTime: input.entryDate,
        duration: input.durationMinutes,
        isRunning: false,
        source: input.source || 'manual',
        notes: input.notes,
      })
      .returning();
    const totalTracked = await this.recomputeTaskTimeTracked(input.taskId);
    return { entry, totalTracked };
  }

  async appendTaskTimeEntry(input: InsertTaskTimeEntry): Promise<TaskTimeEntry> {
    const [entry] = await db.insert(taskTimeEntries).values(input).returning();
    if (!entry.isRunning) {
      await this.recomputeTaskTimeTracked(entry.taskId);
    }
    return entry;
  }

  async updateTaskTimeEntryById(taskId: string, entryId: string, updates: { duration?: number; startTime?: Date | string; endTime?: Date | string; notes?: string }): Promise<{ entry: TaskTimeEntry; task: Task | undefined; totalTracked: number } | undefined> {
    const set: Partial<TaskTimeEntry> & { updatedAt: Date } = { updatedAt: new Date() };
    if (updates.duration !== undefined) set.duration = updates.duration;
    if (updates.startTime !== undefined) set.startTime = typeof updates.startTime === 'string' ? new Date(updates.startTime) : updates.startTime;
    if (updates.endTime !== undefined) set.endTime = typeof updates.endTime === 'string' ? new Date(updates.endTime) : updates.endTime;
    if (updates.notes !== undefined) set.notes = updates.notes;

    const [entry] = await db
      .update(taskTimeEntries)
      .set(set)
      .where(and(eq(taskTimeEntries.id, entryId), eq(taskTimeEntries.taskId, taskId)))
      .returning();
    if (!entry) return undefined;

    const totalTracked = await this.recomputeTaskTimeTracked(entry.taskId);
    const [task] = await db.select().from(tasks).where(eq(tasks.id, entry.taskId));
    return { entry, task, totalTracked };
  }

  async deleteTaskTimeEntryById(taskId: string, entryId: string): Promise<{ task: Task | undefined; totalTracked: number } | undefined> {
    const [deleted] = await db
      .delete(taskTimeEntries)
      .where(and(eq(taskTimeEntries.id, entryId), eq(taskTimeEntries.taskId, taskId)))
      .returning();
    if (!deleted) return undefined;
    const totalTracked = await this.recomputeTaskTimeTracked(taskId);
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    return { task, totalTracked };
  }

  async recomputeTaskTimeTracked(taskId: string): Promise<number> {
    const [row] = await db
      .select({ total: sql<number>`COALESCE(SUM(${taskTimeEntries.duration}), 0)` })
      .from(taskTimeEntries)
      .where(and(eq(taskTimeEntries.taskId, taskId), eq(taskTimeEntries.isRunning, false)));
    const total = Number(row?.total || 0);
    await db.update(tasks).set({ timeTracked: total }).where(eq(tasks.id, taskId));
    return total;
  }


  // Campaigns  
  async getCampaigns(): Promise<Campaign[]> { return this.memStorage.getCampaigns(); }
  async getCampaign(id: string): Promise<Campaign | undefined> { return this.memStorage.getCampaign(id); }
  async getCampaignsByClient(clientId: string): Promise<Campaign[]> { return this.memStorage.getCampaignsByClient(clientId); }
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> { return this.memStorage.createCampaign(campaign); }
  async updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> { return this.memStorage.updateCampaign(id, campaign); }
  async deleteCampaign(id: string): Promise<boolean> { return this.memStorage.deleteCampaign(id); }

  // Leads - Database implementation
  async getLeads(): Promise<Lead[]> {
    try {
      const result = await db.select().from(leads).orderBy(desc(leads.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching leads from database:", error);
      return [];
    }
  }
  
  async getLead(id: string): Promise<Lead | undefined> {
    try {
      const result = await db.select().from(leads).where(eq(leads.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching lead from database:", error);
      return undefined;
    }
  }
  
  async createLead(lead: InsertLead): Promise<Lead> {
    try {
      const now = new Date();
      const result = await db.insert(leads).values({
        ...lead,
        id: sql`gen_random_uuid()`,
        createdAt: now,
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating lead in database:", error);
      throw error;
    }
  }
  
  async updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    try {
      const result = await db.update(leads)
        .set({
          ...lead,
        })
        .where(eq(leads.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating lead in database:", error);
      return undefined;
    }
  }
  
  async deleteLead(id: string): Promise<boolean> {
    try {
      const result = await db.delete(leads).where(eq(leads.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting lead from database:", error);
      return false;
    }
  }

  // Lead Sources
  async getLeadSources(): Promise<LeadSource[]> {
    try {
      const sources = await db.select().from(leadSources).orderBy(asc(leadSources.order));
      return sources;
    } catch (error) {
      console.error("Error fetching lead sources:", error);
      return [];
    }
  }

  async getLeadSource(id: string): Promise<LeadSource | undefined> {
    try {
      const result = await db.select().from(leadSources).where(eq(leadSources.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching lead source:", error);
      return undefined;
    }
  }

  async createLeadSource(source: InsertLeadSource): Promise<LeadSource> {
    try {
      const result = await db.insert(leadSources).values({
        ...source,
        id: sql`gen_random_uuid()`,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating lead source:", error);
      throw error;
    }
  }

  async updateLeadSource(id: string, source: Partial<InsertLeadSource>): Promise<LeadSource | undefined> {
    try {
      const result = await db.update(leadSources)
        .set({ ...source, updatedAt: new Date() })
        .where(eq(leadSources.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating lead source:", error);
      return undefined;
    }
  }

  async deleteLeadSource(id: string): Promise<boolean> {
    try {
      await db.delete(leadSources).where(eq(leadSources.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting lead source:", error);
      return false;
    }
  }

  async reorderLeadSources(sourceIds: string[]): Promise<void> {
    try {
      for (let i = 0; i < sourceIds.length; i++) {
        await db.update(leadSources)
          .set({ order: i })
          .where(eq(leadSources.id, sourceIds[i]));
      }
    } catch (error) {
      console.error("Error reordering lead sources:", error);
      throw error;
    }
  }

  // Lead Note Templates - Database implementation
  async getLeadNoteTemplates(): Promise<LeadNoteTemplate[]> {
    try {
      const templates = await db.select().from(leadNoteTemplates)
        .orderBy(asc(leadNoteTemplates.order));
      return templates;
    } catch (error) {
      console.error("Error fetching lead note templates:", error);
      return [];
    }
  }

  async getLeadNoteTemplate(id: string): Promise<LeadNoteTemplate | undefined> {
    try {
      const result = await db.select().from(leadNoteTemplates).where(eq(leadNoteTemplates.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching lead note template:", error);
      return undefined;
    }
  }

  async createLeadNoteTemplate(template: InsertLeadNoteTemplate): Promise<LeadNoteTemplate> {
    try {
      const result = await db.insert(leadNoteTemplates).values({
        ...template,
        id: sql`gen_random_uuid()`,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating lead note template:", error);
      throw error;
    }
  }

  async updateLeadNoteTemplate(id: string, template: Partial<InsertLeadNoteTemplate>): Promise<LeadNoteTemplate | undefined> {
    try {
      const result = await db.update(leadNoteTemplates)
        .set({ ...template, updatedAt: new Date() })
        .where(eq(leadNoteTemplates.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating lead note template:", error);
      return undefined;
    }
  }

  async deleteLeadNoteTemplate(id: string): Promise<boolean> {
    try {
      await db.delete(leadNoteTemplates).where(eq(leadNoteTemplates.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting lead note template:", error);
      return false;
    }
  }

  async reorderLeadNoteTemplates(templateIds: string[]): Promise<void> {
    try {
      for (let i = 0; i < templateIds.length; i++) {
        await db.update(leadNoteTemplates)
          .set({ order: i })
          .where(eq(leadNoteTemplates.id, templateIds[i]));
      }
    } catch (error) {
      console.error("Error reordering lead note templates:", error);
      throw error;
    }
  }

  // Tasks - Database implementation
  async getTasks(): Promise<Task[]> {
    try {
      const result = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching tasks from database:", error);
      return [];
    }
  }
  
  async getTask(id: string): Promise<Task | undefined> {
    try {
      const result = await db.select().from(tasks).where(eq(tasks.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching task from database:", error);
      return undefined;
    }
  }
  
  async getTasksByClient(clientId: string): Promise<Task[]> {
    try {
      const result = await db.select().from(tasks).where(eq(tasks.clientId, clientId));
      return result;
    } catch (error) {
      console.error("Error fetching tasks by client:", error);
      return [];
    }
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    try {
      const now = new Date();
      const nowIso = now.toISOString();
      
      // Initialize statusHistory with the initial status
      const initialStatus = task.status || 'todo';
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
        statusHistory: statusHistory,
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating task in database:", error);
      throw error;
    }
  }
  
  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    try {
      // First, get the current task to check for status changes
      const [currentTask] = await db.select().from(tasks).where(eq(tasks.id, id));
      
      if (!currentTask) {
        return undefined;
      }
      
      // Prepare the update data. Strip the legacy `timeEntries` JSONB column so
      // task PUTs cannot read-modify-write the time-entries array (which would
      // race and lose entries). All time entry mutations must go through the
      // normalized task_time_entries table via the dedicated storage methods.
      const { timeEntries: _ignoredTimeEntries, ...taskWithoutTimeEntries } = task as Partial<InsertTask> & { timeEntries?: unknown };
      let updateData: any = { ...taskWithoutTimeEntries };
      
      // Track status changes if status is being updated
      if (task.status && task.status !== currentTask.status) {
        const now = new Date().toISOString();
        const statusHistory = (currentTask.statusHistory as any[]) || [];
        
        // Close out the previous status entry (if any)
        if (statusHistory.length > 0) {
          const lastEntry = statusHistory[statusHistory.length - 1];
          if (!lastEntry.exitedAt) {
            lastEntry.exitedAt = now;
            const enteredAt = new Date(lastEntry.enteredAt).getTime();
            const exitedAt = new Date(now).getTime();
            lastEntry.durationMs = exitedAt - enteredAt;
          }
        }
        
        // Add new status entry
        statusHistory.push({
          status: task.status,
          enteredAt: now,
          exitedAt: null,
          durationMs: null,
          hitCount: (statusHistory.filter(h => h.status === task.status).length) + 1,
          timeTrackedInStage: 0
        });
        
        updateData.statusHistory = statusHistory;
      }
      
      const result = await db.update(tasks)
        .set(updateData)
        .where(eq(tasks.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating task in database:", error);
      return undefined;
    }
  }
  
  async deleteTask(id: string): Promise<boolean> {
    try {
      const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting task from database:", error);
      return false;
    }
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
  
  // Client Approval Operations - Database implementation
  async updateTaskClientApproval(
    taskId: string, 
    status: 'pending' | 'approved' | 'rejected' | 'changes_requested',
    notes?: string
  ): Promise<Task | undefined> { 
    try {
      const result = await db.update(tasks)
        .set({
          clientApprovalStatus: status,
          clientApprovalNotes: notes,
          clientApprovalDate: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating task client approval:", error);
      return undefined;
    }
  }
  
  async approveTask(taskId: string, notes?: string): Promise<Task | undefined> { 
    try {
      const result = await db.update(tasks)
        .set({
          clientApprovalStatus: 'approved',
          clientApprovalNotes: notes,
          clientApprovalDate: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error approving task:", error);
      return undefined;
    }
  }
  
  async requestTaskChanges(taskId: string, notes: string): Promise<Task | undefined> { 
    try {
      const result = await db.update(tasks)
        .set({
          clientApprovalStatus: 'changes_requested',
          clientApprovalNotes: notes,
          clientApprovalDate: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error requesting task changes:", error);
      return undefined;
    }
  }

  // Smart Lists - using database implementation at end of file

  // Invoices - Database implementation
  async getInvoices(): Promise<Invoice[]> {
    try {
      const result = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching invoices from database:", error);
      return [];
    }
  }
  
  async getInvoice(id: string): Promise<Invoice | undefined> {
    try {
      const result = await db.select().from(invoices).where(eq(invoices.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching invoice from database:", error);
      return undefined;
    }
  }
  
  async getInvoicesByClient(clientId: string): Promise<Invoice[]> {
    try {
      const result = await db.select().from(invoices).where(eq(invoices.clientId, clientId));
      return result;
    } catch (error) {
      console.error("Error fetching invoices by client:", error);
      return [];
    }
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const now = new Date();
      const result = await db.insert(invoices).values({
        ...invoice,
        id: sql`gen_random_uuid()`,
        createdAt: now,
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating invoice in database:", error);
      throw error;
    }
  }
  
  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    try {
      const result = await db.update(invoices)
        .set({
          ...invoice,
        })
        .where(eq(invoices.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating invoice in database:", error);
      return undefined;
    }
  }
  
  async deleteInvoice(id: string): Promise<boolean> {
    try {
      const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting invoice from database:", error);
      return false;
    }
  }

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
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    try {
      const result = await db.insert(workflows).values({
        ...workflow,
        id: sql`gen_random_uuid()`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating workflow in database:", error);
      throw error;
    }
  }
  
  async updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    try {
      const result = await db.update(workflows)
        .set({ ...workflow, updatedAt: new Date() })
        .where(eq(workflows.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating workflow in database:", error);
      return undefined;
    }
  }
  
  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      await db.delete(workflows).where(eq(workflows.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting workflow from database:", error);
      return false;
    }
  }

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

  async incrementWorkflowTemplateUsage(id: string): Promise<void> {
    try {
      await db.update(workflowTemplates)
        .set({ usageCount: sql`${workflowTemplates.usageCount} + 1` })
        .where(eq(workflowTemplates.id, id));
    } catch (error) {
      console.error("Error incrementing workflow template usage:", error);
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
    // Sanitize workflowId - convert empty string to null to avoid FK constraint violation
    const sanitizedCategory = { ...category };
    if ('workflowId' in sanitizedCategory && (sanitizedCategory.workflowId === '' || sanitizedCategory.workflowId === undefined || sanitizedCategory.workflowId === 'none')) {
      sanitizedCategory.workflowId = null;
    }
    const result = await db.update(taskCategories).set(sanitizedCategory).where(eq(taskCategories.id, id)).returning();
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


  async createTaskHistory(history: InsertTaskHistory): Promise<TaskHistory> {
    try {
      const result = await db.insert(taskHistory).values(history).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating task history in database:", error);
      throw error;
    }
  }

  // Automation Triggers - Database operations
  async getAutomationTriggers(): Promise<AutomationTrigger[]> {
    try {
      const result = await db.select().from(automationTriggers).orderBy(asc(automationTriggers.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching automation triggers from database:", error);
      return [];
    }
  }
  
  async getAutomationTrigger(id: string): Promise<AutomationTrigger | undefined> {
    try {
      const result = await db.select().from(automationTriggers).where(eq(automationTriggers.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching automation trigger from database:", error);
      return undefined;
    }
  }
  
  async createAutomationTrigger(trigger: InsertAutomationTrigger): Promise<AutomationTrigger> {
    try {
      const result = await db.insert(automationTriggers).values(trigger).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating automation trigger in database:", error);
      throw error;
    }
  }
  
  async updateAutomationTrigger(id: string, trigger: Partial<InsertAutomationTrigger>): Promise<AutomationTrigger | undefined> {
    try {
      const result = await db.update(automationTriggers)
        .set(trigger)
        .where(eq(automationTriggers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating automation trigger in database:", error);
      return undefined;
    }
  }
  
  async deleteAutomationTrigger(id: string): Promise<boolean> {
    try {
      const result = await db.delete(automationTriggers).where(eq(automationTriggers.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting automation trigger from database:", error);
      return false;
    }
  }

  // Automation Actions - Database operations
  async getAutomationActions(): Promise<AutomationAction[]> {
    try {
      const result = await db.select().from(automationActions).orderBy(asc(automationActions.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching automation actions from database:", error);
      return [];
    }
  }
  
  async getAutomationAction(id: string): Promise<AutomationAction | undefined> {
    try {
      const result = await db.select().from(automationActions).where(eq(automationActions.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching automation action from database:", error);
      return undefined;
    }
  }
  
  async createAutomationAction(action: InsertAutomationAction): Promise<AutomationAction> {
    try {
      const result = await db.insert(automationActions).values(action).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating automation action in database:", error);
      throw error;
    }
  }
  
  async updateAutomationAction(id: string, action: Partial<InsertAutomationAction>): Promise<AutomationAction | undefined> {
    try {
      const result = await db.update(automationActions)
        .set(action)
        .where(eq(automationActions.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating automation action in database:", error);
      return undefined;
    }
  }
  
  async deleteAutomationAction(id: string): Promise<boolean> {
    try {
      const result = await db.delete(automationActions).where(eq(automationActions.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting automation action from database:", error);
      return false;
    }
  }

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

  // Custom Fields - Database implementation
  async getCustomFields(): Promise<CustomField[]> {
    try {
      const result = await db.select().from(customFields).orderBy(asc(customFields.order));
      return result;
    } catch (error) {
      console.error("Error fetching custom fields from database:", error);
      return [];
    }
  }
  
  async getCustomField(id: string): Promise<CustomField | undefined> {
    try {
      const result = await db.select().from(customFields).where(eq(customFields.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching custom field from database:", error);
      return undefined;
    }
  }
  
  async createCustomField(field: InsertCustomField): Promise<CustomField> {
    try {
      const result = await db.insert(customFields).values({
        ...field,
        id: sql`gen_random_uuid()`,
        createdAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating custom field in database:", error);
      throw error;
    }
  }
  
  async updateCustomField(id: string, field: Partial<InsertCustomField>): Promise<CustomField | undefined> {
    try {
      const result = await db.update(customFields)
        .set(field)
        .where(eq(customFields.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating custom field in database:", error);
      return undefined;
    }
  }
  
  async deleteCustomField(id: string): Promise<boolean> {
    try {
      const result = await db.delete(customFields).where(eq(customFields.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting custom field from database:", error);
      return false;
    }
  }
  
  async reorderCustomFields(fieldOrders: Array<{id: string, order: number}>): Promise<void> {
    try {
      for (const { id, order } of fieldOrders) {
        await db.update(customFields)
          .set({ order })
          .where(eq(customFields.id, id));
      }
    } catch (error) {
      console.error("Error reordering custom fields:", error);
      throw error;
    }
  }

  async getCustomFieldFolders(): Promise<CustomFieldFolder[]> {
    try {
      const result = await db.select().from(customFieldFolders).orderBy(asc(customFieldFolders.order));
      return result;
    } catch (error) {
      console.error("Error fetching custom field folders from database:", error);
      return [];
    }
  }
  
  async getCustomFieldFolder(id: string): Promise<CustomFieldFolder | undefined> {
    try {
      const result = await db.select().from(customFieldFolders).where(eq(customFieldFolders.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching custom field folder from database:", error);
      return undefined;
    }
  }
  
  async createCustomFieldFolder(folder: InsertCustomFieldFolder): Promise<CustomFieldFolder> {
    try {
      const result = await db.insert(customFieldFolders).values({
        ...folder,
        id: sql`gen_random_uuid()`,
        createdAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating custom field folder in database:", error);
      throw error;
    }
  }
  
  async updateCustomFieldFolder(id: string, folder: Partial<InsertCustomFieldFolder>): Promise<CustomFieldFolder | undefined> {
    try {
      const result = await db.update(customFieldFolders)
        .set(folder)
        .where(eq(customFieldFolders.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating custom field folder in database:", error);
      return undefined;
    }
  }
  
  async deleteCustomFieldFolder(id: string): Promise<boolean> {
    try {
      const result = await db.delete(customFieldFolders).where(eq(customFieldFolders.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting custom field folder from database:", error);
      return false;
    }
  }
  
  async reorderCustomFieldFolders(folderOrders: Array<{id: string, order: number}>): Promise<void> {
    try {
      for (const { id, order } of folderOrders) {
        await db.update(customFieldFolders)
          .set({ order })
          .where(eq(customFieldFolders.id, id));
      }
    } catch (error) {
      console.error("Error reordering custom field folders:", error);
      throw error;
    }
  }

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

  async reorderTeamPositions(positions: Array<{ id: string; order: number }>): Promise<boolean> {
    try {
      // Update all positions in a transaction
      await db.transaction(async (tx) => {
        for (const position of positions) {
          await tx.update(teamPositions)
            .set({ 
              order: position.order,
              updatedAt: new Date()
            })
            .where(eq(teamPositions.id, position.id));
        }
      });
      return true;
    } catch (error) {
      console.error('Error reordering team positions:', error);
      return false;
    }
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

  async getClientTeamAssignmentsList(): Promise<Array<{
    id: string;
    clientId: string;
    staffId: string;
    positionId: string;
    assignedAt: Date | null;
    assignedBy: string;
    clientName: string | null;
    staffFirstName: string | null;
    staffLastName: string | null;
    positionLabel: string | null;
    positionKey: string | null;
  }>> {
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
      positionKey: teamPositions.key,
    })
    .from(clientTeamAssignments)
    .leftJoin(clients, eq(clientTeamAssignments.clientId, clients.id))
    .leftJoin(staff, eq(clientTeamAssignments.staffId, staff.id))
    .leftJoin(teamPositions, eq(clientTeamAssignments.position, teamPositions.id))
    .orderBy(asc(clients.name), asc(teamPositions.order));

    return result;
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

  // Position KPIs
  async getPositionKpis(positionId: string): Promise<PositionKpi[]> {
    const result = await db
      .select()
      .from(positionKpis)
      .where(eq(positionKpis.positionId, positionId))
      .orderBy(asc(positionKpis.createdAt));
    return result;
  }

  async getPositionKpi(id: string): Promise<PositionKpi | undefined> {
    const result = await db.select().from(positionKpis).where(eq(positionKpis.id, id));
    return result[0];
  }

  async createPositionKpi(kpi: InsertPositionKpi): Promise<PositionKpi> {
    const result = await db.insert(positionKpis).values(kpi).returning();
    return result[0];
  }

  async updatePositionKpi(id: string, kpi: Partial<InsertPositionKpi>): Promise<PositionKpi | undefined> {
    const result = await db
      .update(positionKpis)
      .set({ ...kpi, updatedAt: new Date() })
      .where(eq(positionKpis.id, id))
      .returning();
    return result[0];
  }

  async deletePositionKpi(id: string): Promise<boolean> {
    try {
      await db.delete(positionKpis).where(eq(positionKpis.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting position KPI:", error);
      return false;
    }
  }

  // Organization Chart Structures
  async getOrgChartStructures(): Promise<OrgChartStructure[]> {
    const result = await db.select().from(orgChartStructures).orderBy(desc(orgChartStructures.createdAt));
    return result;
  }

  async getOrgChartStructure(id: string): Promise<OrgChartStructure | undefined> {
    const result = await db.select().from(orgChartStructures).where(eq(orgChartStructures.id, id));
    return result[0];
  }

  async getActiveOrgChartStructure(): Promise<OrgChartStructure | undefined> {
    const result = await db.select().from(orgChartStructures).where(eq(orgChartStructures.isActive, true));
    return result[0];
  }

  async createOrgChartStructure(structure: InsertOrgChartStructure): Promise<OrgChartStructure> {
    const result = await db.insert(orgChartStructures).values(structure).returning();
    return result[0];
  }

  async updateOrgChartStructure(id: string, structure: Partial<InsertOrgChartStructure>): Promise<OrgChartStructure | undefined> {
    const result = await db
      .update(orgChartStructures)
      .set({ ...structure, updatedAt: new Date() })
      .where(eq(orgChartStructures.id, id))
      .returning();
    return result[0];
  }

  async deleteOrgChartStructure(id: string): Promise<boolean> {
    try {
      await db.delete(orgChartStructures).where(eq(orgChartStructures.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting org chart structure:", error);
      return false;
    }
  }

  async setActiveOrgChartStructure(id: string): Promise<OrgChartStructure | undefined> {
    // First, deactivate all structures
    await db.update(orgChartStructures).set({ isActive: false, updatedAt: new Date() });
    
    // Then activate the specified one
    const result = await db
      .update(orgChartStructures)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(orgChartStructures.id, id))
      .returning();
    return result[0];
  }

  // Organization Chart Nodes
  async getOrgChartNodes(structureId: string): Promise<OrgChartNode[]> {
    const result = await db
      .select()
      .from(orgChartNodes)
      .where(eq(orgChartNodes.structureId, structureId))
      .orderBy(asc(orgChartNodes.orderIndex));
    return result;
  }

  async getOrgChartNode(id: string): Promise<OrgChartNode | undefined> {
    const result = await db.select().from(orgChartNodes).where(eq(orgChartNodes.id, id));
    return result[0];
  }

  async createOrgChartNode(node: InsertOrgChartNode): Promise<OrgChartNode> {
    const result = await db.insert(orgChartNodes).values(node).returning();
    return result[0];
  }

  async updateOrgChartNode(id: string, node: Partial<InsertOrgChartNode>): Promise<OrgChartNode | undefined> {
    const result = await db
      .update(orgChartNodes)
      .set({ ...node, updatedAt: new Date() })
      .where(eq(orgChartNodes.id, id))
      .returning();
    return result[0];
  }

  async deleteOrgChartNode(id: string): Promise<boolean> {
    try {
      await db.delete(orgChartNodes).where(eq(orgChartNodes.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting org chart node:", error);
      return false;
    }
  }

  async reorderOrgChartNodes(updates: Array<{ id: string; orderIndex: number; parentId?: string | null }>): Promise<void> {
    for (const update of updates) {
      await db
        .update(orgChartNodes)
        .set({ 
          orderIndex: update.orderIndex, 
          parentId: update.parentId !== undefined ? update.parentId : undefined,
          updatedAt: new Date() 
        })
        .where(eq(orgChartNodes.id, update.id));
    }
  }

  // Organization Chart Node Assignments
  async getOrgChartNodeAssignments(nodeId: string): Promise<(OrgChartNodeAssignment & { staff: Staff })[]> {
    const result = await db
      .select({
        id: orgChartNodeAssignments.id,
        nodeId: orgChartNodeAssignments.nodeId,
        staffId: orgChartNodeAssignments.staffId,
        assignmentType: orgChartNodeAssignments.assignmentType,
        effectiveDate: orgChartNodeAssignments.effectiveDate,
        notes: orgChartNodeAssignments.notes,
        createdAt: orgChartNodeAssignments.createdAt,
        updatedAt: orgChartNodeAssignments.updatedAt,
        staff: staff,
      })
      .from(orgChartNodeAssignments)
      .leftJoin(staff, eq(orgChartNodeAssignments.staffId, staff.id))
      .where(eq(orgChartNodeAssignments.nodeId, nodeId));
    return result;
  }

  async getAllOrgChartAssignments(structureId: string): Promise<(OrgChartNodeAssignment & { staff: Staff; node: OrgChartNode })[]> {
    const result = await db
      .select({
        id: orgChartNodeAssignments.id,
        nodeId: orgChartNodeAssignments.nodeId,
        staffId: orgChartNodeAssignments.staffId,
        assignmentType: orgChartNodeAssignments.assignmentType,
        effectiveDate: orgChartNodeAssignments.effectiveDate,
        notes: orgChartNodeAssignments.notes,
        createdAt: orgChartNodeAssignments.createdAt,
        updatedAt: orgChartNodeAssignments.updatedAt,
        staff: staff,
        node: orgChartNodes,
      })
      .from(orgChartNodeAssignments)
      .leftJoin(staff, eq(orgChartNodeAssignments.staffId, staff.id))
      .leftJoin(orgChartNodes, eq(orgChartNodeAssignments.nodeId, orgChartNodes.id))
      .where(eq(orgChartNodes.structureId, structureId));
    return result;
  }

  async createOrgChartNodeAssignment(assignment: InsertOrgChartNodeAssignment): Promise<OrgChartNodeAssignment> {
    const result = await db.insert(orgChartNodeAssignments).values(assignment).returning();
    return result[0];
  }

  async updateOrgChartNodeAssignment(id: string, assignment: Partial<InsertOrgChartNodeAssignment>): Promise<OrgChartNodeAssignment | undefined> {
    const result = await db
      .update(orgChartNodeAssignments)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(orgChartNodeAssignments.id, id))
      .returning();
    return result[0];
  }

  async deleteOrgChartNodeAssignment(id: string): Promise<boolean> {
    try {
      await db.delete(orgChartNodeAssignments).where(eq(orgChartNodeAssignments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting org chart node assignment:", error);
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

  // Products - Database implementation
  async getProducts(): Promise<Product[]> {
    try {
      const result = await db.select().from(products).orderBy(asc(products.name));
      return result;
    } catch (error) {
      console.error("Error fetching products from database:", error);
      return [];
    }
  }
  
  async getProduct(id: string): Promise<Product | undefined> {
    try {
      const result = await db.select().from(products).where(eq(products.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching product from database:", error);
      return undefined;
    }
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const result = await db.insert(products).values({
        ...product,
        id: sql`gen_random_uuid()`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating product in database:", error);
      throw error;
    }
  }
  
  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      const result = await db.update(products)
        .set({
          ...product,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating product in database:", error);
      return undefined;
    }
  }
  
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const result = await db.delete(products).where(eq(products.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting product from database:", error);
      return false;
    }
  }

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

  // Notifications - Database Implementation
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const result = await db.select().from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
      return result;
    } catch (error) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
      return [];
    }
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    try {
      const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Error fetching notification ${id}:`, error);
      return undefined;
    }
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const result = await db.select().from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        ))
        .orderBy(desc(notifications.createdAt));
      return result;
    } catch (error) {
      console.error(`Error fetching unread notifications for user ${userId}:`, error);
      return [];
    }
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values({
      id: randomUUID(),
      ...notificationData,
      read: false,
      createdAt: new Date()
    }).returning();
    return created;
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    try {
      const result = await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      return false;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      const result = await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error marking all notifications as read for user ${userId}:`, error);
      return false;
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    try {
      const result = await db.delete(notifications).where(eq(notifications.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      return false;
    }
  }

  // Notification Settings - Database Implementation
  async getNotificationSettings(userId: string): Promise<NotificationSettings | undefined> {
    try {
      const result = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Error fetching notification settings for user ${userId}:`, error);
      return undefined;
    }
  }

  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const [created] = await db.insert(notificationSettings).values({
      id: randomUUID(),
      ...settings,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return created;
  }

  async updateNotificationSettings(userId: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> {
    const [updated] = await db.update(notificationSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(notificationSettings.userId, userId))
      .returning();
    return updated;
  }

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

  // Sales Targets - Database Implementation
  async getSalesTargets(): Promise<SalesTarget[]> {
    try {
      const result = await db.select().from(salesTargets).orderBy(desc(salesTargets.year), desc(salesTargets.month));
      return result;
    } catch (error) {
      console.error("Error getting sales targets:", error);
      return [];
    }
  }

  async getSalesTarget(id: string): Promise<SalesTarget | undefined> {
    try {
      const result = await db.select().from(salesTargets).where(eq(salesTargets.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting sales target:", error);
      return undefined;
    }
  }

  async getSalesTargetByMonth(year: number, month: number): Promise<SalesTarget | undefined> {
    try {
      const result = await db.select()
        .from(salesTargets)
        .where(and(eq(salesTargets.year, year), eq(salesTargets.month, month)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting sales target by month:", error);
      return undefined;
    }
  }

  async createSalesTarget(target: InsertSalesTarget): Promise<SalesTarget> {
    try {
      const [created] = await db.insert(salesTargets)
        .values({
          id: randomUUID(),
          ...target,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return created;
    } catch (error) {
      console.error("Error creating sales target:", error);
      throw error;
    }
  }

  async updateSalesTarget(id: string, target: Partial<UpdateSalesTarget>): Promise<SalesTarget | undefined> {
    try {
      const [updated] = await db.update(salesTargets)
        .set({
          ...target,
          updatedAt: new Date()
        })
        .where(eq(salesTargets.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating sales target:", error);
      return undefined;
    }
  }

  async deleteSalesTarget(id: string): Promise<boolean> {
    try {
      const result = await db.delete(salesTargets).where(eq(salesTargets.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting sales target:", error);
      return false;
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
      
      if (section[0].isCoreSection || section[0].scope === 'core') {
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
        let value: string | undefined = undefined;

        // Get value from core client data if it's a core section
        if (client && section.key && (section.isCoreSection || section.scope === 'core')) {
          const column = mapBriefSectionKeyToClientColumn(section.key);
          if (column) {
            value = ((client as any)[column] as string | null) || undefined;
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
      if (section.key && (section.isCoreSection || section.scope === 'core')) {
        const updateData: Partial<InsertClient> = {};
        const column = mapBriefSectionKeyToClientColumn(section.key);
        if (column) {
          (updateData as any)[column] = value;
        }
        if (Object.keys(updateData).length === 0) {
          console.warn(`[setClientBriefValue] No client column mapping for core section key: ${section.key}`);
          return;
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

  // SMS Integrations
  async getSmsIntegrations(): Promise<SmsIntegration[]> {
    try {
      const result = await db.select().from(smsIntegrations);
      return result;
    } catch (error) {
      console.error("Error fetching SMS integrations:", error);
      return [];
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
        .orderBy(asc(dashboards.displayOrder), desc(dashboards.isDefault), asc(dashboards.name));
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

  async updateDashboardsOrder(updates: Array<{ id: string; displayOrder: number }>): Promise<void> {
    try {
      // Update each dashboard's displayOrder
      for (const update of updates) {
        await db
          .update(dashboards)
          .set({ 
            displayOrder: update.displayOrder,
            updatedAt: new Date() 
          })
          .where(eq(dashboards.id, update.id));
      }
    } catch (error) {
      console.error("Error updating dashboards order:", error);
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

  async getWidgetData(widgetType: string, userId: string, filters?: Record<string, string>): Promise<any> {
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
          return await this.getWinRateData(userId, isAdminOrManager);
        
        case 'top_performing_sales_reps':
          return await this.getTopPerformingSalesRepsData();
        
        case 'recent_deals_won':
          return await this.getRecentDealsWonData(userId, isAdminOrManager);
        
        // Task Widgets
        case 'my_tasks':
          return await this.getMyTasksData(userId);
        
        case 'overdue_tasks':
          return await this.getOverdueTasksData(userId, filters);
        
        case 'tasks_due_this_week':
          return await this.getTasksDueThisWeekData(userId);
        
        case 'task_completion_rate':
          return await this.getTaskCompletionRateData(userId);
        
        case 'tasks_requiring_approval':
          return await this.getTasksRequiringApprovalData(userId);
        
        case 'tasks_by_status':
          return await this.getTasksByStatusData(userId);
        
        case 'time_tracked_this_week':
          return await this.getTimeTrackedThisWeekData(userId);
        
        case 'team_workload':
          return await this.getTeamWorkloadData(userId);
        
        // Lead Management Widgets
        case 'new_leads_today_week':
          return await this.getNewLeadsTodayWeekData(userId, isAdminOrManager);
        
        case 'leads_by_pipeline_stage':
          return await this.getLeadsByPipelineStageData(userId, isAdminOrManager);
        
        case 'my_assigned_leads':
          return await this.getMyAssignedLeadsData(userId);
        
        case 'stale_leads':
          return await this.getStaleLeadsData(userId, isAdminOrManager);
        
        case 'lead_conversion_rate':
          return await this.getLeadConversionRateData(userId, isAdminOrManager);
        
        case 'lead_source_breakdown':
          return await this.getLeadSourceBreakdownData(userId, isAdminOrManager);
        
        // HR & Team Widgets
        case 'pending_time_off_requests':
          return await this.getPendingTimeOffRequestsData(userId, isAdminOrManager);
        
        case 'whos_off_today_week':
          return await this.getWhosOffTodayWeekData(userId);
        
        case 'new_job_applications':
          return await this.getNewJobApplicationsData(userId, isAdminOrManager);
        
        case 'onboarding_queue':
          return await this.getOnboardingQueueData(userId, isAdminOrManager);
        
        case 'pending_expense_reports':
          return await this.getPendingExpenseReportsData(userId, isAdminOrManager);
        
        case 'team_capacity_alerts':
          return await this.getTeamCapacityAlertsData(userId, isAdminOrManager);
        
        case 'team_birthday_anniversary':
          return await this.getTeamBirthdayAnniversaryData(userId);
        
        case 'training_completion_status':
          return await this.getTrainingCompletionStatusData(userId, isAdminOrManager);
        
        // Calendar & Appointments Widgets
        case 'todays_appointments':
          return await this.getTodaysAppointmentsData(userId);
        
        case 'upcoming_appointments':
          return await this.getUpcomingAppointmentsData(userId);
        
        case 'appointment_no_shows':
          return await this.getAppointmentNoShowsData(userId, isAdminOrManager);
        
        case 'overdue_appointments':
          return await this.getOverdueAppointmentsData(userId, isAdminOrManager);
        
        // Activity & Alerts Widgets
        case 'my_mentions':
          return await this.getMyMentionsData(userId);
        
        case 'system_alerts':
          return await this.getSystemAlertsData(userId);
        
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
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
      
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

      // Fetch target for current month from database
      const targetRecord = await this.getSalesTargetByMonth(currentYear, currentMonth);
      const target = targetRecord ? parseFloat(targetRecord.targetAmount as string) : 0;
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

  private async getWinRateData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      // Build where conditions
      const wonWhere = isAdminOrManager
        ? eq(leads.status, 'Won')
        : and(eq(leads.status, 'Won'), eq(leads.assignedTo, userId));

      const totalWhere = isAdminOrManager
        ? sql`${leads.status} IN ('Won', 'Lost')`
        : and(sql`${leads.status} IN ('Won', 'Lost')`, eq(leads.assignedTo, userId));

      const wonCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(wonWhere);

      const totalCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(totalWhere);

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
          staffId: leads.assignedTo,
          staffFirstName: staff.firstName,
          staffLastName: staff.lastName,
          dealsWon: sql<number>`count(*)::int`,
          totalRevenue: sql<number>`sum(COALESCE(CAST(${leads.value} AS NUMERIC), 0))::int`,
        })
        .from(leads)
        .leftJoin(staff, eq(leads.assignedTo, staff.id))
        .where(
          and(
            eq(leads.status, 'Won'),
            isNotNull(leads.assignedTo)
          )
        )
        .groupBy(leads.assignedTo, staff.firstName, staff.lastName)
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

  private async getRecentDealsWonData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      const recentDeals = await db
        .select({
          id: leads.id,
          companyName: leads.company,
          contactName: leads.name,
          estimatedValue: leads.value,
          wonDate: leads.updatedAt,
          staffFirstName: staff.firstName,
          staffLastName: staff.lastName,
        })
        .from(leads)
        .leftJoin(staff, eq(leads.assignedTo, staff.id))
        .where(
          and(
            eq(leads.status, 'Won'),
            !isAdminOrManager ? eq(leads.assignedTo, userId) : undefined
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

  // Task Widget Data Methods
  private async getMyTasksData(userId: string): Promise<any> {
    try {
      const myTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
          dueDate: tasks.dueDate,
          clientName: clients.name,
        })
        .from(tasks)
        .leftJoin(clients, eq(tasks.clientId, clients.id))
        .where(
          and(
            eq(tasks.assignedTo, userId),
            ne(tasks.status, 'completed'),
            ne(tasks.status, 'cancelled')
          )
        )
        .orderBy(desc(tasks.priority), asc(tasks.dueDate))
        .limit(10);

      return myTasks;
    } catch (error) {
      console.error("Error fetching my tasks:", error);
      return [];
    }
  }

  private async getOverdueTasksData(userId: string, filters?: Record<string, string>): Promise<any> {
    try {
      const now = new Date();
      const conditions = [
        sql`${tasks.dueDate} < ${now.toISOString()}`,
        ne(tasks.status, 'completed'),
        ne(tasks.status, 'cancelled')
      ];

      if (filters?.assignee === 'mine') {
        conditions.push(eq(tasks.assignedTo, userId));
      }

      const overdueTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
          dueDate: tasks.dueDate,
          clientName: clients.name,
          assignedToFirstName: staff.firstName,
          assignedToLastName: staff.lastName,
        })
        .from(tasks)
        .leftJoin(clients, eq(tasks.clientId, clients.id))
        .leftJoin(staff, eq(tasks.assignedTo, staff.id))
        .where(and(...conditions))
        .orderBy(asc(tasks.dueDate))
        .limit(20);

      return overdueTasks.map(task => ({
        ...task,
        assignedToName: task.assignedToFirstName && task.assignedToLastName
          ? `${task.assignedToFirstName} ${task.assignedToLastName}`
          : 'Unassigned',
      }));
    } catch (error) {
      console.error("Error fetching overdue tasks:", error);
      return [];
    }
  }

  private async getTasksDueThisWeekData(userId: string): Promise<any> {
    try {
      // Start of today (midnight)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      
      // End of this week (Saturday at 11:59:59 PM)
      const endOfWeek = new Date(startOfToday);
      endOfWeek.setDate(endOfWeek.getDate() + (6 - startOfToday.getDay())); // End of Saturday
      endOfWeek.setHours(23, 59, 59, 999);

      const tasksDueThisWeek = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
          dueDate: tasks.dueDate,
          clientName: clients.name,
        })
        .from(tasks)
        .leftJoin(clients, eq(tasks.clientId, clients.id))
        .where(
          and(
            eq(tasks.assignedTo, userId),
            sql`${tasks.dueDate} >= ${startOfToday.toISOString()}`,
            sql`${tasks.dueDate} <= ${endOfWeek.toISOString()}`,
            ne(tasks.status, 'completed'),
            ne(tasks.status, 'cancelled')
          )
        )
        .orderBy(asc(tasks.dueDate))
        .limit(10);

      return tasksDueThisWeek;
    } catch (error) {
      console.error("Error fetching tasks due this week:", error);
      return [];
    }
  }

  private async getTaskCompletionRateData(userId: string): Promise<any> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const completedTasks = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(tasks)
        .where(
          and(
            eq(tasks.assignedTo, userId),
            eq(tasks.status, 'completed'),
            sql`${tasks.completedAt} > ${thirtyDaysAgo.toISOString()}`
          )
        );

      const totalTasks = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(tasks)
        .where(
          and(
            eq(tasks.assignedTo, userId),
            sql`${tasks.createdAt} > ${thirtyDaysAgo.toISOString()}`
          )
        );

      const completed = completedTasks[0]?.count || 0;
      const total = totalTasks[0]?.count || 0;
      const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

      return {
        completed,
        total,
        rate,
      };
    } catch (error) {
      console.error("Error fetching task completion rate:", error);
      return { completed: 0, total: 0, rate: '0.0' };
    }
  }

  private async getTasksRequiringApprovalData(userId: string): Promise<any> {
    try {
      const approvalTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
          dueDate: tasks.dueDate,
          clientName: clients.name,
          assignedToFirstName: staff.firstName,
          assignedToLastName: staff.lastName,
        })
        .from(tasks)
        .leftJoin(clients, eq(tasks.clientId, clients.id))
        .leftJoin(staff, eq(tasks.assignedTo, staff.id))
        .where(
          and(
            sql`${tasks.description} ILIKE '%approval%' OR ${tasks.title} ILIKE '%approval%'`,
            eq(tasks.status, 'in_progress')
          )
        )
        .orderBy(asc(tasks.dueDate))
        .limit(10);

      return approvalTasks.map(task => ({
        ...task,
        assignedToName: task.assignedToFirstName && task.assignedToLastName
          ? `${task.assignedToFirstName} ${task.assignedToLastName}`
          : 'Unassigned',
      }));
    } catch (error) {
      console.error("Error fetching tasks requiring approval:", error);
      return [];
    }
  }

  private async getTasksByStatusData(userId: string): Promise<any> {
    try {
      const statusCounts = await db
        .select({
          status: tasks.status,
          count: sql<number>`count(*)::int`,
        })
        .from(tasks)
        .where(eq(tasks.assignedTo, userId))
        .groupBy(tasks.status);

      const counts = {
        todo: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      };

      statusCounts.forEach(item => {
        if (counts[item.status as keyof typeof counts] !== undefined) {
          counts[item.status as keyof typeof counts] = item.count;
        }
      });

      return counts;
    } catch (error) {
      console.error("Error fetching tasks by status:", error);
      return { todo: 0, in_progress: 0, completed: 0, cancelled: 0 };
    }
  }

  private async getTimeTrackedThisWeekData(userId: string): Promise<any> {
    try {
      const now = new Date();
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of this week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      // Use SQL to filter and sum time entries from this week
      // This is more reliable than parsing JSONB in TypeScript
      // Sum entries from the normalized task_time_entries table for this user.
      const result = await db.execute(sql`
        SELECT COALESCE(SUM(tte.duration), 0) AS total_minutes
        FROM ${taskTimeEntries} tte
        WHERE tte.user_id = ${userId}
        AND tte.end_time IS NOT NULL
        AND tte.end_time >= ${startOfWeek.toISOString()}::timestamp
      `);

      const totalMinutes = Number(result.rows[0]?.total_minutes || 0);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return {
        totalMinutes,
        hours,
        minutes,
        formatted: `${hours}h ${minutes}m`,
      };
    } catch (error) {
      console.error("Error fetching time tracked this week:", error);
      return { totalMinutes: 0, hours: 0, minutes: 0, formatted: '0h 0m' };
    }
  }

  private async getTeamWorkloadData(userId: string): Promise<any> {
    try {
      // Get the current user's department
      const currentUserResult = await db
        .select()
        .from(staff)
        .where(eq(staff.id, userId))
        .limit(1);
      
      if (!currentUserResult || currentUserResult.length === 0) {
        return [];
      }

      const userDepartment = currentUserResult[0].department;

      // Get team workload for staff in the same department
      const teamWorkload = await db
        .select({
          staffId: staff.id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          department: staff.department,
          taskCount: sql<number>`count(${tasks.id})::int`,
        })
        .from(staff)
        .leftJoin(
          tasks,
          and(
            eq(tasks.assignedTo, staff.id),
            ne(tasks.status, 'completed'),
            ne(tasks.status, 'cancelled')
          )
        )
        .where(
          and(
            eq(staff.isActive, true),
            eq(staff.department, userDepartment)
          )
        )
        .groupBy(staff.id, staff.firstName, staff.lastName, staff.department)
        .orderBy(desc(sql<number>`count(${tasks.id})`))
        .limit(10);

      return teamWorkload.map(member => ({
        staffId: member.staffId,
        staffName: `${member.firstName} ${member.lastName}`,
        taskCount: member.taskCount,
        capacity: member.taskCount > 10 ? 'high' : member.taskCount > 5 ? 'medium' : 'low',
      }));
    } catch (error) {
      console.error("Error fetching team workload:", error);
      return [];
    }
  }

  // Lead Management Widget Data Methods
  private async getNewLeadsTodayWeekData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      // Get leads created today
      const leadsToday = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(
          and(
            sql`${leads.createdAt} >= ${startOfToday}`,
            !isAdminOrManager ? eq(leads.assignedTo, userId) : undefined
          )
        );

      // Get leads created this week
      const leadsThisWeek = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(
          and(
            sql`${leads.createdAt} >= ${startOfWeek}`,
            !isAdminOrManager ? eq(leads.assignedTo, userId) : undefined
          )
        );

      return {
        today: leadsToday[0]?.count || 0,
        thisWeek: leadsThisWeek[0]?.count || 0,
      };
    } catch (error) {
      console.error("Error fetching new leads today/week:", error);
      return { today: 0, thisWeek: 0 };
    }
  }

  private async getLeadsByPipelineStageData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      const stageData = await db
        .select({
          stageId: leadPipelineStages.id,
          stageName: leadPipelineStages.name,
          stageColor: leadPipelineStages.color,
          stageOrder: leadPipelineStages.order,
          count: sql<number>`count(${leads.id})::int`,
        })
        .from(leadPipelineStages)
        .leftJoin(
          leads,
          and(
            eq(leads.stageId, leadPipelineStages.id),
            !isAdminOrManager ? eq(leads.assignedTo, userId) : undefined
          )
        )
        .where(eq(leadPipelineStages.isActive, true))
        .groupBy(leadPipelineStages.id, leadPipelineStages.name, leadPipelineStages.color, leadPipelineStages.order)
        .orderBy(leadPipelineStages.order);

      return stageData.map(stage => ({
        stageId: stage.stageId,
        stageName: stage.stageName,
        color: stage.stageColor,
        count: stage.count,
      }));
    } catch (error) {
      console.error("Error fetching leads by pipeline stage:", error);
      return [];
    }
  }

  private async getMyAssignedLeadsData(userId: string): Promise<any> {
    try {
      const assignedLeads = await db
        .select({
          id: leads.id,
          name: leads.name,
          email: leads.email,
          company: leads.company,
          status: leads.status,
          stageName: leadPipelineStages.name,
          value: leads.value,
          lastContactDate: leads.lastContactDate,
        })
        .from(leads)
        .leftJoin(leadPipelineStages, eq(leads.stageId, leadPipelineStages.id))
        .where(
          and(
            eq(leads.assignedTo, userId),
            eq(leads.status, 'Open')
          )
        )
        .orderBy(desc(leads.createdAt))
        .limit(10);

      return assignedLeads;
    } catch (error) {
      console.error("Error fetching my assigned leads:", error);
      return [];
    }
  }

  private async getStaleLeadsData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const staleLeads = await db
        .select({
          id: leads.id,
          name: leads.name,
          email: leads.email,
          company: leads.company,
          lastContactDate: leads.lastContactDate,
          createdAt: leads.createdAt,
          stageName: leadPipelineStages.name,
        })
        .from(leads)
        .leftJoin(leadPipelineStages, eq(leads.stageId, leadPipelineStages.id))
        .where(
          and(
            eq(leads.status, 'Open'),
            or(
              sql`${leads.lastContactDate} < ${thirtyDaysAgo}`,
              and(
                isNull(leads.lastContactDate),
                sql`${leads.createdAt} < ${thirtyDaysAgo}`
              )
            ),
            !isAdminOrManager ? eq(leads.assignedTo, userId) : undefined
          )
        )
        .orderBy(asc(leads.lastContactDate))
        .limit(10);

      return staleLeads;
    } catch (error) {
      console.error("Error fetching stale leads:", error);
      return [];
    }
  }

  private async getLeadConversionRateData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      // Get total leads
      const totalLeads = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(!isAdminOrManager ? eq(leads.assignedTo, userId) : undefined);

      // Get converted leads (status = 'Won')
      const convertedLeads = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(
          and(
            eq(leads.status, 'Won'),
            !isAdminOrManager ? eq(leads.assignedTo, userId) : undefined
          )
        );

      const total = totalLeads[0]?.count || 0;
      const converted = convertedLeads[0]?.count || 0;
      const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';

      return {
        total,
        converted,
        rate,
      };
    } catch (error) {
      console.error("Error fetching lead conversion rate:", error);
      return { total: 0, converted: 0, rate: '0.0' };
    }
  }

  private async getLeadSourceBreakdownData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      const sourceData = await db
        .select({
          source: leads.source,
          count: sql<number>`count(*)::int`,
        })
        .from(leads)
        .where(!isAdminOrManager ? eq(leads.assignedTo, userId) : undefined)
        .groupBy(leads.source)
        .orderBy(desc(sql<number>`count(*)`));

      return sourceData.map(item => ({
        source: item.source || 'Unknown',
        count: item.count,
      }));
    } catch (error) {
      console.error("Error fetching lead source breakdown:", error);
      return [];
    }
  }

  // ========== HR & TEAM WIDGET DATA METHODS ==========
  
  private async getPendingTimeOffRequestsData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      // Only managers/admins can see pending time off requests
      if (!isAdminOrManager) {
        return [];
      }

      const pendingRequests = await db
        .select({
          id: sql<string>`time_off_requests.id`,
          staffId: sql<string>`time_off_requests.staff_id`,
          staffName: sql<string>`CONCAT(staff.first_name, ' ', staff.last_name)`,
          startDate: sql<Date>`time_off_requests.start_date`,
          endDate: sql<Date>`time_off_requests.end_date`,
          type: sql<string>`time_off_requests.type`,
          reason: sql<string>`time_off_requests.reason`,
          status: sql<string>`time_off_requests.status`,
          createdAt: sql<Date>`time_off_requests.created_at`,
        })
        .from(timeOffRequests)
        .leftJoin(staff, sql`time_off_requests.staff_id = staff.id`)
        .where(sql`time_off_requests.status = 'pending'`)
        .orderBy(sql`time_off_requests.created_at ASC`)
        .limit(10);

      return pendingRequests;
    } catch (error) {
      console.error("Error fetching pending time off requests:", error);
      return [];
    }
  }

  private async getWhosOffTodayWeekData(userId: string): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);

      const offToday = await db
        .select({
          id: sql<string>`time_off_requests.id`,
          staffId: sql<string>`time_off_requests.staff_id`,
          staffName: sql<string>`CONCAT(staff.first_name, ' ', staff.last_name)`,
          type: sql<string>`time_off_requests.type`,
          startDate: sql<Date>`time_off_requests.start_date`,
          endDate: sql<Date>`time_off_requests.end_date`,
        })
        .from(timeOffRequests)
        .leftJoin(staff, sql`time_off_requests.staff_id = staff.id`)
        .where(sql`time_off_requests.status = 'approved' AND time_off_requests.start_date <= ${today} AND time_off_requests.end_date >= ${today}`)
        .orderBy(sql`staff.first_name ASC`);

      const offThisWeek = await db
        .select({
          id: sql<string>`time_off_requests.id`,
          staffId: sql<string>`time_off_requests.staff_id`,
          staffName: sql<string>`CONCAT(staff.first_name, ' ', staff.last_name)`,
          type: sql<string>`time_off_requests.type`,
          startDate: sql<Date>`time_off_requests.start_date`,
          endDate: sql<Date>`time_off_requests.end_date`,
        })
        .from(timeOffRequests)
        .leftJoin(staff, sql`time_off_requests.staff_id = staff.id`)
        .where(sql`time_off_requests.status = 'approved' AND time_off_requests.start_date <= ${endOfWeek} AND time_off_requests.end_date >= ${today}`)
        .orderBy(sql`time_off_requests.start_date ASC`);

      return {
        today: offToday,
        thisWeek: offThisWeek,
      };
    } catch (error) {
      console.error("Error fetching who's off today/week:", error);
      return { today: [], thisWeek: [] };
    }
  }

  private async getNewJobApplicationsData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      // Only managers/admins can see job applications
      if (!isAdminOrManager) {
        return [];
      }

      const recentApplications = await db
        .select({
          id: jobApplications.id,
          applicantName: sql<string>`applicant_name`,
          applicantEmail: sql<string>`applicant_email`,
          applicantPhone: sql<string>`applicant_phone`,
          positionId: sql<string>`position_id`,
          positionTitle: sql<string>`position_title`,
          applicationStatus: sql<string>`application_status`,
          appliedAt: sql<Date>`applied_at`,
        })
        .from(jobApplications)
        .orderBy(desc(sql`applied_at`))
        .limit(10);

      return recentApplications;
    } catch (error) {
      console.error("Error fetching new job applications:", error);
      return [];
    }
  }

  private async getOnboardingQueueData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      // Only managers/admins can see onboarding queue
      if (!isAdminOrManager) {
        return [];
      }

      const pendingOnboarding = await db
        .select({
          id: newHireOnboardingSubmissions.id,
          name: newHireOnboardingSubmissions.name,
          startDate: newHireOnboardingSubmissions.startDate,
          status: newHireOnboardingSubmissions.status,
          submittedAt: newHireOnboardingSubmissions.submittedAt,
          customFieldData: newHireOnboardingSubmissions.customFieldData,
        })
        .from(newHireOnboardingSubmissions)
        .where(eq(newHireOnboardingSubmissions.status, 'pending'))
        .orderBy(asc(newHireOnboardingSubmissions.submittedAt))
        .limit(10);

      return pendingOnboarding;
    } catch (error) {
      console.error("Error fetching onboarding queue:", error);
      return [];
    }
  }

  private async getPendingExpenseReportsData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      // Check if user has permission to view expense reports (Admin, Manager, or Accounting)
      const userRolesList = await this.getUserRolesByUser(userId);
      const roleNames = await Promise.all(
        userRolesList.map(async (ur) => {
          const role = await db.select().from(roles).where(eq(roles.id, ur.roleId)).limit(1);
          return role[0]?.name;
        })
      );

      const hasPermission = roleNames.some(role => 
        role === 'Admin' || role === 'Manager' || role === 'Accounting'
      );

      if (!hasPermission) {
        return [];
      }

      const pendingExpenses = await db
        .select({
          id: expenseReportSubmissions.id,
          submittedById: expenseReportSubmissions.submittedById,
          fullName: expenseReportSubmissions.fullName,
          expenseType: expenseReportSubmissions.expenseType,
          expenseTotal: expenseReportSubmissions.expenseTotal,
          status: expenseReportSubmissions.status,
          submittedAt: expenseReportSubmissions.submittedAt,
        })
        .from(expenseReportSubmissions)
        .where(eq(expenseReportSubmissions.status, 'pending'))
        .orderBy(asc(expenseReportSubmissions.submittedAt))
        .limit(10);

      return pendingExpenses;
    } catch (error) {
      console.error("Error fetching pending expense reports:", error);
      return [];
    }
  }

  private async getTeamCapacityAlertsData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      // Only managers/admins can see capacity alerts
      if (!isAdminOrManager) {
        return [];
      }

      // Get active capacity settings - note: predictive hiring fields don't exist in DB yet
      // For now, return empty array as this feature needs DB schema updates
      return [];
    } catch (error) {
      console.error("Error fetching team capacity alerts:", error);
      return [];
    }
  }

  private async getTeamBirthdayAnniversaryData(userId: string): Promise<any> {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Get calendar events for birthdays and anniversaries
      const upcomingEvents = await db
        .select({
          id: calendarAppointments.id,
          calendarId: calendarAppointments.calendarId,
          calendarName: calendars.name,
          title: calendarAppointments.title,
          startTime: calendarAppointments.startTime,
          description: calendarAppointments.description,
        })
        .from(calendarAppointments)
        .leftJoin(calendars, eq(calendarAppointments.calendarId, calendars.id))
        .where(
          and(
            or(
              eq(calendars.name, 'Birthdays'),
              eq(calendars.name, 'Anniversaries')
            ),
            sql`${calendarAppointments.startTime} >= ${today}`,
            sql`${calendarAppointments.startTime} <= ${thirtyDaysFromNow}`
          )
        )
        .orderBy(asc(calendarAppointments.startTime))
        .limit(10);

      return upcomingEvents;
    } catch (error) {
      console.error("Error fetching team birthday/anniversary data:", error);
      return [];
    }
  }

  private async getTrainingCompletionStatusData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      // Only managers/admins can see training completion status
      if (!isAdminOrManager) {
        return [];
      }

      // Get all published courses with enrollment and completion data
      const courseStats = await db
        .select({
          courseId: trainingCourses.id,
          courseName: trainingCourses.title,
          totalEnrollments: sql<number>`count(DISTINCT ${trainingEnrollments.id})::int`,
          completedEnrollments: sql<number>`count(DISTINCT CASE WHEN ${trainingEnrollments.status} = 'completed' THEN ${trainingEnrollments.id} END)::int`,
        })
        .from(trainingCourses)
        .leftJoin(trainingEnrollments, eq(trainingEnrollments.courseId, trainingCourses.id))
        .where(eq(trainingCourses.isPublished, true))
        .groupBy(trainingCourses.id, trainingCourses.title)
        .orderBy(desc(sql<number>`count(DISTINCT ${trainingEnrollments.id})`))
        .limit(10);

      return courseStats.map(stat => ({
        courseId: stat.courseId,
        courseName: stat.courseName,
        totalEnrollments: stat.totalEnrollments,
        completedEnrollments: stat.completedEnrollments,
        completionRate: stat.totalEnrollments > 0 
          ? ((stat.completedEnrollments / stat.totalEnrollments) * 100).toFixed(1)
          : '0.0',
      }));
    } catch (error) {
      console.error("Error fetching training completion status:", error);
      return [];
    }
  }

  // ========== CALENDAR & APPOINTMENTS WIDGET DATA METHODS ==========
  
  private async getTodaysAppointmentsData(userId: string): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const appointments = await db
        .select({
          id: calendarAppointments.id,
          title: calendarAppointments.title,
          startTime: calendarAppointments.startTime,
          endTime: calendarAppointments.endTime,
          status: calendarAppointments.status,
          location: calendarAppointments.location,
          bookerName: calendarAppointments.bookerName,
          bookerEmail: calendarAppointments.bookerEmail,
          clientId: calendarAppointments.clientId,
          clientName: sql<string>`clients.name`,
          assignedTo: calendarAppointments.assignedTo,
          assignedToName: sql<string>`CONCAT(staff.first_name, ' ', staff.last_name)`,
        })
        .from(calendarAppointments)
        .leftJoin(clients, eq(calendarAppointments.clientId, clients.id))
        .leftJoin(staff, eq(calendarAppointments.assignedTo, staff.id))
        .where(
          and(
            eq(calendarAppointments.assignedTo, userId),
            sql`${calendarAppointments.startTime} >= ${today}`,
            sql`${calendarAppointments.startTime} < ${tomorrow}`
          )
        )
        .orderBy(asc(calendarAppointments.startTime))
        .limit(20);

      return appointments;
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
      return [];
    }
  }

  private async getUpcomingAppointmentsData(userId: string): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);

      const appointments = await db
        .select({
          id: calendarAppointments.id,
          title: calendarAppointments.title,
          startTime: calendarAppointments.startTime,
          endTime: calendarAppointments.endTime,
          status: calendarAppointments.status,
          location: calendarAppointments.location,
          bookerName: calendarAppointments.bookerName,
          bookerEmail: calendarAppointments.bookerEmail,
          clientId: calendarAppointments.clientId,
          clientName: sql<string>`clients.name`,
          assignedTo: calendarAppointments.assignedTo,
          assignedToName: sql<string>`CONCAT(staff.first_name, ' ', staff.last_name)`,
        })
        .from(calendarAppointments)
        .leftJoin(clients, eq(calendarAppointments.clientId, clients.id))
        .leftJoin(staff, eq(calendarAppointments.assignedTo, staff.id))
        .where(
          and(
            eq(calendarAppointments.assignedTo, userId),
            ne(calendarAppointments.status, 'cancelled'),
            sql`${calendarAppointments.startTime} > ${today}`,
            sql`${calendarAppointments.startTime} <= ${sevenDaysFromNow}`
          )
        )
        .orderBy(asc(calendarAppointments.startTime))
        .limit(20);

      return appointments;
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
      return [];
    }
  }

  private async getAppointmentNoShowsData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const noShows = await db
        .select({
          id: calendarAppointments.id,
          title: calendarAppointments.title,
          startTime: calendarAppointments.startTime,
          endTime: calendarAppointments.endTime,
          status: calendarAppointments.status,
          location: calendarAppointments.location,
          bookerName: calendarAppointments.bookerName,
          bookerEmail: calendarAppointments.bookerEmail,
          clientId: calendarAppointments.clientId,
          clientName: sql<string>`clients.name`,
          assignedTo: calendarAppointments.assignedTo,
          assignedToName: sql<string>`CONCAT(staff.first_name, ' ', staff.last_name)`,
        })
        .from(calendarAppointments)
        .leftJoin(clients, eq(calendarAppointments.clientId, clients.id))
        .leftJoin(staff, eq(calendarAppointments.assignedTo, staff.id))
        .where(
          and(
            isAdminOrManager ? undefined : eq(calendarAppointments.assignedTo, userId),
            eq(calendarAppointments.status, 'no_show'),
            sql`${calendarAppointments.startTime} >= ${thirtyDaysAgo}`
          )
        )
        .orderBy(desc(calendarAppointments.startTime))
        .limit(15);

      return noShows;
    } catch (error) {
      console.error("Error fetching appointment no-shows:", error);
      return [];
    }
  }

  private async getOverdueAppointmentsData(userId: string, isAdminOrManager: boolean): Promise<any> {
    try {
      const now = new Date();

      // Get appointments that are past their end time but still have 'confirmed' status
      // These need to be updated to 'showed' or 'no_show'
      const overdueAppointments = await db
        .select({
          id: calendarAppointments.id,
          title: calendarAppointments.title,
          startTime: calendarAppointments.startTime,
          endTime: calendarAppointments.endTime,
          status: calendarAppointments.status,
          location: calendarAppointments.location,
          bookerName: calendarAppointments.bookerName,
          bookerEmail: calendarAppointments.bookerEmail,
          clientId: calendarAppointments.clientId,
          clientName: sql<string>`clients.name`,
          assignedTo: calendarAppointments.assignedTo,
          assignedToName: sql<string>`CONCAT(staff.first_name, ' ', staff.last_name)`,
        })
        .from(calendarAppointments)
        .leftJoin(clients, eq(calendarAppointments.clientId, clients.id))
        .leftJoin(staff, eq(calendarAppointments.assignedTo, staff.id))
        .where(
          and(
            isAdminOrManager ? undefined : eq(calendarAppointments.assignedTo, userId),
            eq(calendarAppointments.status, 'confirmed'),
            sql`${calendarAppointments.endTime} < ${now}`
          )
        )
        .orderBy(desc(calendarAppointments.startTime))
        .limit(15);

      return overdueAppointments;
    } catch (error) {
      console.error("Error fetching overdue appointments:", error);
      return [];
    }
  }

  // ========== ACTIVITY & ALERTS WIDGET DATA METHODS ==========

  private async getMyMentionsData(userId: string): Promise<any> {
    try {
      const mentions: any[] = [];

      // Get task comment mentions
      const taskCommentMentions = await db
        .select({
          id: taskComments.id,
          content: taskComments.content,
          createdAt: taskComments.createdAt,
          authorId: taskComments.authorId,
          authorName: sql<string>`CONCAT(staff.first_name, ' ', staff.last_name)`,
          taskId: taskComments.taskId,
          taskTitle: sql<string>`tasks.title`,
        })
        .from(taskComments)
        .leftJoin(staff, eq(taskComments.authorId, staff.id))
        .leftJoin(tasks, eq(taskComments.taskId, tasks.id))
        .where(sql`${userId} = ANY(${taskComments.mentions})`)
        .orderBy(desc(taskComments.createdAt))
        .limit(10);

      taskCommentMentions.forEach(comment => {
        mentions.push({
          id: comment.id,
          type: 'task_comment',
          content: comment.content,
          authorName: comment.authorName || 'Unknown',
          createdAt: comment.createdAt,
          entityId: comment.id,
          entityTitle: comment.taskTitle,
          taskId: comment.taskId,
        });
      });

      // Get file annotation mentions
      // File annotations can reference either task attachments or comment files
      // We need to join both to get the task information
      const annotationMentions = await db
        .select({
          id: imageAnnotations.id,
          content: imageAnnotations.content,
          createdAt: imageAnnotations.createdAt,
          authorId: imageAnnotations.authorId,
          authorName: sql<string>`CONCAT(staff.first_name, ' ', staff.last_name)`,
          fileId: imageAnnotations.fileId,
          // Try to get task ID from task attachments first
          taskIdFromAttachment: taskAttachments.taskId,
          taskTitleFromAttachment: tasks.title,
          // Also try to get task ID from comment files
          commentId: commentFiles.commentId,
        })
        .from(imageAnnotations)
        .leftJoin(staff, eq(imageAnnotations.authorId, staff.id))
        .leftJoin(taskAttachments, eq(taskAttachments.id, imageAnnotations.fileId))
        .leftJoin(tasks, eq(taskAttachments.taskId, tasks.id))
        .leftJoin(commentFiles, eq(commentFiles.id, imageAnnotations.fileId))
        .where(sql`${userId} = ANY(${imageAnnotations.mentions})`)
        .orderBy(desc(imageAnnotations.createdAt))
        .limit(10);

      // For annotations on comment files, we need to get the task from the comment
      for (const annotation of annotationMentions) {
        let taskId = annotation.taskIdFromAttachment;
        let taskTitle = annotation.taskTitleFromAttachment || 'File Annotation';

        // If not from task attachment, try to get from comment file
        if (!taskId && annotation.commentId) {
          const commentTask = await db
            .select({
              taskId: taskComments.taskId,
              taskTitle: sql<string>`tasks.title`,
            })
            .from(taskComments)
            .leftJoin(tasks, eq(taskComments.taskId, tasks.id))
            .where(eq(taskComments.id, annotation.commentId))
            .limit(1);

          if (commentTask.length > 0) {
            taskId = commentTask[0].taskId;
            taskTitle = commentTask[0].taskTitle || 'File Annotation';
          }
        }

        mentions.push({
          id: annotation.id,
          type: 'file_annotation',
          content: annotation.content,
          authorName: annotation.authorName || 'Unknown',
          createdAt: annotation.createdAt,
          entityId: annotation.id,
          entityTitle: taskTitle,
          taskId: taskId || null,
        });
      }

      // Get knowledge base comment mentions
      const kbCommentMentions = await db
        .select({
          id: knowledgeBaseComments.id,
          content: knowledgeBaseComments.content,
          createdAt: knowledgeBaseComments.createdAt,
          authorId: knowledgeBaseComments.authorId,
          authorName: sql<string>`CONCAT(staff.first_name, ' ', staff.last_name)`,
          articleId: knowledgeBaseComments.articleId,
          articleTitle: sql<string>`knowledge_base_articles.title`,
        })
        .from(knowledgeBaseComments)
        .leftJoin(staff, eq(knowledgeBaseComments.authorId, staff.id))
        .leftJoin(knowledgeBaseArticles, eq(knowledgeBaseComments.articleId, knowledgeBaseArticles.id))
        .where(sql`${userId} = ANY(${knowledgeBaseComments.mentions})`)
        .orderBy(desc(knowledgeBaseComments.createdAt))
        .limit(10);

      kbCommentMentions.forEach(comment => {
        mentions.push({
          id: comment.id,
          type: 'kb_comment',
          content: comment.content,
          authorName: comment.authorName || 'Unknown',
          createdAt: comment.createdAt,
          entityId: comment.articleId,
          entityTitle: comment.articleTitle,
          taskId: null,
        });
      });

      // Sort all mentions by date and limit to 15 most recent
      mentions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return mentions.slice(0, 15);
    } catch (error) {
      console.error("Error fetching my mentions:", error);
      return [];
    }
  }

  private async getSystemAlertsData(userId: string): Promise<any> {
    try {
      // Get system alerts and high/urgent priority notifications
      const alerts = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          priority: notifications.priority,
          isRead: notifications.isRead,
          actionUrl: notifications.actionUrl,
          actionText: notifications.actionText,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            or(
              eq(notifications.type, 'system'),
              eq(notifications.priority, 'high'),
              eq(notifications.priority, 'urgent')
            )
          )
        )
        .orderBy(
          desc(sql`CASE WHEN ${notifications.isRead} = false THEN 1 ELSE 0 END`),
          desc(notifications.createdAt)
        )
        .limit(20);

      return alerts;
    } catch (error) {
      console.error("Error fetching system alerts:", error);
      return [];
    }
  }

  // Time Off Types methods
  async getTimeOffTypes(policyId: string): Promise<SelectTimeOffType[]> {
    const types = await db
      .select()
      .from(timeOffTypes)
      .where(eq(timeOffTypes.policyId, policyId))
      .orderBy(asc(timeOffTypes.orderIndex));
    return types;
  }

  async getTimeOffType(id: string): Promise<SelectTimeOffType | undefined> {
    const [type] = await db
      .select()
      .from(timeOffTypes)
      .where(eq(timeOffTypes.id, id))
      .limit(1);
    return type;
  }

  async createTimeOffType(data: InsertTimeOffType): Promise<SelectTimeOffType> {
    const [newType] = await db.insert(timeOffTypes).values(data).returning();
    return newType;
  }

  async updateTimeOffType(id: string, data: Partial<InsertTimeOffType>): Promise<SelectTimeOffType | undefined> {
    const [updated] = await db
      .update(timeOffTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(timeOffTypes.id, id))
      .returning();
    return updated;
  }

  async deleteTimeOffType(id: string): Promise<boolean> {
    const result = await db.delete(timeOffTypes).where(eq(timeOffTypes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderTimeOffTypes(updates: Array<{ id: string; orderIndex: number }>): Promise<void> {
    await Promise.all(
      updates.map(({ id, orderIndex }) =>
        db.update(timeOffTypes).set({ orderIndex }).where(eq(timeOffTypes.id, id))
      )
    );
  }

  // GoHighLevel Integration methods
  async getGoHighLevelIntegration(): Promise<GoHighLevelIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(goHighLevelIntegration)
      .limit(1);
    return integration;
  }

  async getGoHighLevelIntegrationByToken(token: string): Promise<GoHighLevelIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(goHighLevelIntegration)
      .where(eq(goHighLevelIntegration.webhookToken, token))
      .limit(1);
    return integration;
  }

  async createGoHighLevelIntegration(data: InsertGoHighLevelIntegration): Promise<GoHighLevelIntegration> {
    const [newIntegration] = await db
      .insert(goHighLevelIntegration)
      .values(data)
      .returning();
    return newIntegration;
  }

  async updateGoHighLevelIntegration(id: string, data: Partial<InsertGoHighLevelIntegration>): Promise<GoHighLevelIntegration | undefined> {
    const [updated] = await db
      .update(goHighLevelIntegration)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(goHighLevelIntegration.id, id))
      .returning();
    return updated;
  }

  async deleteGoHighLevelIntegration(id: string): Promise<boolean> {
    const result = await db.delete(goHighLevelIntegration).where(eq(goHighLevelIntegration.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementGoHighLevelLeadCount(id: string): Promise<void> {
    await db
      .update(goHighLevelIntegration)
      .set({ 
        leadsReceived: sql`${goHighLevelIntegration.leadsReceived} + 1`,
        lastLeadAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(goHighLevelIntegration.id, id));
  }

  // ================================
  // SURVEY METHODS
  // ================================

  // Survey Folders
  async getSurveyFolders(): Promise<SurveyFolder[]> {
    return await db.select().from(surveyFolders).orderBy(asc(surveyFolders.order));
  }

  async createSurveyFolder(data: InsertSurveyFolder): Promise<SurveyFolder> {
    const [folder] = await db.insert(surveyFolders).values(data).returning();
    return folder;
  }

  async updateSurveyFolder(id: string, data: Partial<InsertSurveyFolder>): Promise<SurveyFolder | undefined> {
    const [updated] = await db.update(surveyFolders).set(data).where(eq(surveyFolders.id, id)).returning();
    return updated;
  }

  async deleteSurveyFolder(id: string): Promise<boolean> {
    const result = await db.delete(surveyFolders).where(eq(surveyFolders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Surveys
  async getSurveys(): Promise<(Survey & { createdByName: string })[]> {
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
      createdByName: sql<string>`COALESCE(${staff.firstName} || ' ' || ${staff.lastName}, 'Unknown')`,
    })
    .from(surveys)
    .leftJoin(staff, eq(surveys.createdBy, staff.id))
    .orderBy(desc(surveys.createdAt));
    
    return results as (Survey & { createdByName: string })[];
  }

  async getSurvey(id: string): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);
    return survey;
  }

  async getSurveyByShortCode(shortCode: string): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.shortCode, shortCode)).limit(1);
    return survey;
  }

  async createSurvey(data: InsertSurvey): Promise<Survey> {
    const shortCode = randomUUID().substring(0, 8);
    const [survey] = await db.insert(surveys).values({ ...data, shortCode }).returning();
    return survey;
  }

  async updateSurvey(id: string, data: Partial<InsertSurvey>): Promise<Survey | undefined> {
    const [updated] = await db.update(surveys).set({ ...data, updatedAt: new Date() }).where(eq(surveys.id, id)).returning();
    return updated;
  }

  async deleteSurvey(id: string): Promise<boolean> {
    const result = await db.delete(surveys).where(eq(surveys.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async duplicateSurvey(id: string, userId: string): Promise<Survey | undefined> {
    const survey = await this.getSurvey(id);
    if (!survey) return undefined;

    const newSurvey = await this.createSurvey({
      name: `${survey.name} (Copy)`,
      description: survey.description,
      status: 'draft',
      folderId: survey.folderId,
      settings: survey.settings,
      styling: survey.styling,
      createdBy: userId,
    });

    // Copy slides and fields
    const slides = await this.getSurveySlides(id);
    const fieldIdMap: Record<string, string> = {};

    for (const slide of slides) {
      const newSlide = await this.createSurveySlide({
        surveyId: newSurvey.id,
        title: slide.title,
        description: slide.description,
        order: slide.order,
        buttonText: slide.buttonText,
        settings: slide.settings,
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
          order: field.order,
        });
        fieldIdMap[field.id] = newField.id;
      }
    }

    return newSurvey;
  }

  // Survey Slides
  async getSurveySlides(surveyId: string): Promise<SurveySlide[]> {
    return await db.select().from(surveySlides).where(eq(surveySlides.surveyId, surveyId)).orderBy(asc(surveySlides.order));
  }

  async getSurveySlide(id: string): Promise<SurveySlide | undefined> {
    const [slide] = await db.select().from(surveySlides).where(eq(surveySlides.id, id)).limit(1);
    return slide;
  }

  async createSurveySlide(data: InsertSurveySlide): Promise<SurveySlide> {
    const [slide] = await db.insert(surveySlides).values(data).returning();
    return slide;
  }

  async updateSurveySlide(id: string, data: Partial<InsertSurveySlide>): Promise<SurveySlide | undefined> {
    const [updated] = await db.update(surveySlides).set({ ...data, updatedAt: new Date() }).where(eq(surveySlides.id, id)).returning();
    return updated;
  }

  async deleteSurveySlide(id: string): Promise<boolean> {
    const result = await db.delete(surveySlides).where(eq(surveySlides.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderSurveySlides(updates: Array<{ id: string; order: number }>): Promise<void> {
    await Promise.all(
      updates.map(({ id, order }) =>
        db.update(surveySlides).set({ order, updatedAt: new Date() }).where(eq(surveySlides.id, id))
      )
    );
  }

  // Survey Fields
  async getSurveyFields(surveyId: string): Promise<SurveyField[]> {
    return await db.select().from(surveyFields).where(eq(surveyFields.surveyId, surveyId)).orderBy(asc(surveyFields.order));
  }

  async getSurveyFieldsBySlide(slideId: string): Promise<SurveyField[]> {
    return await db.select().from(surveyFields).where(eq(surveyFields.slideId, slideId)).orderBy(asc(surveyFields.order));
  }

  async getSurveyField(id: string): Promise<SurveyField | undefined> {
    const [field] = await db.select().from(surveyFields).where(eq(surveyFields.id, id)).limit(1);
    return field;
  }

  async createSurveyField(data: InsertSurveyField): Promise<SurveyField> {
    const [field] = await db.insert(surveyFields).values(data).returning();
    return field;
  }

  async updateSurveyField(id: string, data: Partial<InsertSurveyField>): Promise<SurveyField | undefined> {
    const [updated] = await db.update(surveyFields).set({ ...data, updatedAt: new Date() }).where(eq(surveyFields.id, id)).returning();
    return updated;
  }

  async deleteSurveyField(id: string): Promise<boolean> {
    const result = await db.delete(surveyFields).where(eq(surveyFields.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderSurveyFields(updates: Array<{ id: string; order: number }>): Promise<void> {
    await Promise.all(
      updates.map(({ id, order }) =>
        db.update(surveyFields).set({ order, updatedAt: new Date() }).where(eq(surveyFields.id, id))
      )
    );
  }

  // Survey Logic Rules
  async getSurveyLogicRules(surveyId: string): Promise<SurveyLogicRule[]> {
    return await db.select().from(surveyLogicRules).where(eq(surveyLogicRules.surveyId, surveyId)).orderBy(asc(surveyLogicRules.order));
  }

  async createSurveyLogicRule(data: InsertSurveyLogicRule): Promise<SurveyLogicRule> {
    const [rule] = await db.insert(surveyLogicRules).values(data).returning();
    return rule;
  }

  async updateSurveyLogicRule(id: string, data: Partial<InsertSurveyLogicRule>): Promise<SurveyLogicRule | undefined> {
    const [updated] = await db.update(surveyLogicRules).set({ ...data, updatedAt: new Date() }).where(eq(surveyLogicRules.id, id)).returning();
    return updated;
  }

  async deleteSurveyLogicRule(id: string): Promise<boolean> {
    const result = await db.delete(surveyLogicRules).where(eq(surveyLogicRules.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Survey Submissions
  async getSurveySubmissions(surveyId: string): Promise<SurveySubmission[]> {
    return await db.select().from(surveySubmissions).where(eq(surveySubmissions.surveyId, surveyId)).orderBy(desc(surveySubmissions.createdAt));
  }

  async getSurveySubmission(id: string): Promise<SurveySubmission | undefined> {
    const [submission] = await db.select().from(surveySubmissions).where(eq(surveySubmissions.id, id)).limit(1);
    return submission;
  }

  async createSurveySubmission(data: InsertSurveySubmission): Promise<SurveySubmission> {
    const [submission] = await db.insert(surveySubmissions).values(data).returning();
    return submission;
  }

  async updateSurveySubmission(id: string, data: Partial<InsertSurveySubmission>): Promise<SurveySubmission | undefined> {
    const [updated] = await db.update(surveySubmissions).set(data).where(eq(surveySubmissions.id, id)).returning();
    return updated;
  }

  async deleteSurveySubmission(id: string): Promise<boolean> {
    const result = await db.delete(surveySubmissions).where(eq(surveySubmissions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Survey Submission Answers
  async getSurveySubmissionAnswers(submissionId: string): Promise<SurveySubmissionAnswer[]> {
    return await db.select().from(surveySubmissionAnswers).where(eq(surveySubmissionAnswers.submissionId, submissionId));
  }

  async createSurveySubmissionAnswer(data: InsertSurveySubmissionAnswer): Promise<SurveySubmissionAnswer> {
    const [answer] = await db.insert(surveySubmissionAnswers).values(data).returning();
    return answer;
  }

  async createSurveySubmissionAnswers(answers: InsertSurveySubmissionAnswer[]): Promise<SurveySubmissionAnswer[]> {
    if (answers.length === 0) return [];
    return await db.insert(surveySubmissionAnswers).values(answers).returning();
  }

  // Survey with full data (for builder)
  async getSurveyWithDetails(id: string): Promise<{
    survey: Survey;
    slides: SurveySlide[];
    fields: SurveyField[];
    logicRules: SurveyLogicRule[];
  } | undefined> {
    const survey = await this.getSurvey(id);
    if (!survey) return undefined;

    const [slides, fields, logicRules] = await Promise.all([
      this.getSurveySlides(id),
      this.getSurveyFields(id),
      this.getSurveyLogicRules(id),
    ]);

    return { survey, slides, fields, logicRules };
  }

  // PX Meetings
  async getPxMeetings(): Promise<Array<PxMeeting & { attendees: Array<{ id: string; name: string }> }>> {
    const meetings = await db.select().from(pxMeetings).orderBy(desc(pxMeetings.meetingDate), desc(pxMeetings.meetingTime));
    
    if (meetings.length === 0) return [];

    const meetingIds = meetings.map(m => m.id);
    const attendeeRows = await db.execute(sql`
      SELECT pma.meeting_id as "meetingId", s.id, s.first_name as "firstName", s.last_name as "lastName"
      FROM px_meeting_attendees pma
      INNER JOIN staff s ON pma.user_id::uuid = s.id
      WHERE pma.meeting_id IN (${sql.join(meetingIds.map(id => sql`${id}`), sql`, `)})
    `);

    const attendeesByMeeting = new Map<string, Array<{ id: string; name: string }>>();
    for (const row of attendeeRows.rows as Array<{ meetingId: string; id: string; firstName: string | null; lastName: string | null }>) {
      const list = attendeesByMeeting.get(row.meetingId) || [];
      list.push({ id: row.id, name: `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Unknown' });
      attendeesByMeeting.set(row.meetingId, list);
    }

    return meetings.map(meeting => ({
      ...meeting,
      attendees: attendeesByMeeting.get(meeting.id) || [],
    }));
  }

  async getPxMeeting(id: string): Promise<(PxMeeting & { attendees: Array<{ id: string; name: string }> }) | undefined> {
    const [meeting] = await db.select().from(pxMeetings).where(eq(pxMeetings.id, id)).limit(1);
    if (!meeting) return undefined;
    
    // Use raw SQL to handle varchar to uuid cast
    const attendeeRows = await db.execute(sql`
      SELECT s.id, s.first_name as "firstName", s.last_name as "lastName"
      FROM px_meeting_attendees pma
      INNER JOIN staff s ON pma.user_id::uuid = s.id
      WHERE pma.meeting_id = ${id}
    `);
    
    return {
      ...meeting,
      attendees: (attendeeRows.rows as Array<{ id: string; firstName: string | null; lastName: string | null }>).map(a => ({ 
        id: a.id, 
        name: `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Unknown'
      })),
    };
  }

  async createPxMeeting(data: InsertPxMeeting, attendeeIds: string[]): Promise<PxMeeting> {
    const [meeting] = await db.insert(pxMeetings).values(data).returning();
    
    if (attendeeIds.length > 0) {
      await db.insert(pxMeetingAttendees).values(
        attendeeIds.map(userId => ({
          meetingId: meeting.id,
          userId,
        }))
      );
    }
    
    return meeting;
  }

  async updatePxMeeting(id: string, data: Partial<InsertPxMeeting>, attendeeIds?: string[]): Promise<PxMeeting | undefined> {
    const [updated] = await db
      .update(pxMeetings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pxMeetings.id, id))
      .returning();
    
    if (!updated) return undefined;
    
    if (attendeeIds !== undefined) {
      await db.delete(pxMeetingAttendees).where(eq(pxMeetingAttendees.meetingId, id));
      
      if (attendeeIds.length > 0) {
        await db.insert(pxMeetingAttendees).values(
          attendeeIds.map(userId => ({
            meetingId: id,
            userId,
          }))
        );
      }
    }
    
    return updated;
  }

  async deletePxMeeting(id: string): Promise<boolean> {
    const result = await db.delete(pxMeetings).where(eq(pxMeetings.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DbStorage();
