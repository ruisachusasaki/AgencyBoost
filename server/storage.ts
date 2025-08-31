import { 
  type Client, type InsertClient, clients,
  type Project, type InsertProject, projects,
  type Campaign, type InsertCampaign,
  type Lead, type InsertLead,
  type Task, type InsertTask,
  type Invoice, type InsertInvoice,
  type User, type InsertUser,
  type AuditLog, type InsertAuditLog,
  type CustomField, type InsertCustomField,
  type CustomFieldFolder, type InsertCustomFieldFolder,
  type ClientGroup, type InsertClientGroup,
  type Product, type InsertProduct,
  type ClientProduct, type InsertClientProduct,
  type Note, type InsertNote,
  type ClientAppointment, type InsertClientAppointment,
  type Document, type InsertDocument,
  type Activity, type InsertActivity,
  type SocialMediaAccount, type InsertSocialMediaAccount,
  type SocialMediaPost, type InsertSocialMediaPost,
  type SocialMediaTemplate, type InsertSocialMediaTemplate,
  type SocialMediaAnalytics, type InsertSocialMediaAnalytics,
  type TemplateFolder, type InsertTemplateFolder, templateFolders,
  type EmailTemplate, type InsertEmailTemplate, emailTemplates,
  type SmsTemplate, type InsertSmsTemplate, smsTemplates,
  type SmartList, type InsertSmartList,
  type Workflow, type InsertWorkflow,
  type WorkflowExecution, type InsertWorkflowExecution,
  type WorkflowTemplate, type InsertWorkflowTemplate,
  type TaskCategory, type InsertTaskCategory, taskCategories,
  type TaskTemplate, type InsertTaskTemplate,
  type EnhancedTask, type InsertEnhancedTask,
  type TaskHistory, type InsertTaskHistory,
  type AutomationTrigger, type InsertAutomationTrigger,
  type AutomationAction, type InsertAutomationAction,
  type Notification, type InsertNotification,
  type Tag, type InsertTag,
  type Staff, type InsertStaff,
  type Role, type InsertRole,
  type Permission, type InsertPermission,
  type UserRole, type InsertUserRole,
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
  type ProjectTemplate, type InsertProjectTemplate, projectTemplates,
  type TemplateTask, type InsertTemplateTask, templateTasks,
  type Department, type InsertDepartment, departments,
  type Position, type InsertPosition, positions,
  type JobApplication, type InsertJobApplication, jobApplications,
  type JobOpening, type InsertJobOpening, jobOpenings,
  customFieldFileUploads, forms, formFields, formSubmissions, tags, automationTriggers, automationActions
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql, asc, desc, and } from "drizzle-orm";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClientsWithPagination(limit: number, offset: number, sortBy?: string, sortOrder?: string): Promise<{ clients: Client[]; total: number }>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByClient(clientId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Project Templates
  getProjectTemplates(): Promise<ProjectTemplate[]>;
  getProjectTemplate(id: string): Promise<ProjectTemplate | undefined>;
  createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate>;
  updateProjectTemplate(id: string, template: Partial<InsertProjectTemplate>): Promise<ProjectTemplate | undefined>;
  deleteProjectTemplate(id: string): Promise<boolean>;
  incrementTemplateUsage(id: string): Promise<void>;

  // Template Tasks
  getTemplateTasksByTemplate(templateId: string): Promise<TemplateTask[]>;
  createTemplateTask(task: InsertTemplateTask): Promise<TemplateTask>;
  deleteTemplateTasksByTemplate(templateId: string): Promise<void>;
  
  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignsByClient(clientId: string): Promise<Campaign[]>;
  getCampaignsByProject(projectId: string): Promise<Campaign[]>;
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
  getSmartLists(userId: string): Promise<SmartList[]>;
  getSmartList(id: string): Promise<SmartList | undefined>;
  createSmartList(smartList: InsertSmartList): Promise<SmartList>;
  updateSmartList(id: string, smartList: Partial<InsertSmartList>): Promise<SmartList | undefined>;
  deleteSmartList(id: string): Promise<boolean>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByClient(clientId: string): Promise<Task[]>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
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
  getEnhancedTasksByProject(projectId: string): Promise<EnhancedTask[]>;
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
  getSmartLists(userId: string): Promise<SmartList[]>;
  getSmartList(id: string): Promise<SmartList | undefined>;
  createSmartList(smartList: InsertSmartList): Promise<SmartList>;
  updateSmartList(id: string, smartList: Partial<InsertSmartList>): Promise<SmartList | undefined>;
  deleteSmartList(id: string): Promise<boolean>;
  deleteAutomationTrigger(id: string): Promise<boolean>;
  deleteAutomationAction(id: string): Promise<boolean>;
  deleteWorkflowExecution(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private clients: Map<string, Client> = new Map();
  private projects: Map<string, Project> = new Map();
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
  private projectTemplates: Map<string, ProjectTemplate> = new Map();
  private templateTasks: Map<string, TemplateTask> = new Map();

  constructor() {
    // Add sample data for testing
    this.addSampleData();
    this.addSampleProjectTemplates();
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

  private addSampleProjectTemplates() {
    // Sample project templates
    const template1: ProjectTemplate = {
      id: "template-1",
      name: "SEO Audit & Optimization",
      description: "Complete SEO analysis and optimization for client websites including technical audit, keyword research, and on-page optimization.",
      category: "SEO Audit",
      priority: "high",
      estimatedDuration: 21,
      estimatedBudget: "5000.00",
      isActive: true,
      usageCount: 12,
      createdBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const template2: ProjectTemplate = {
      id: "template-2", 
      name: "Social Media Campaign Setup",
      description: "Complete social media marketing campaign including content strategy, asset creation, and campaign launch across multiple platforms.",
      category: "Social Media Management",
      priority: "medium",
      estimatedDuration: 14,
      estimatedBudget: "3500.00",
      isActive: true,
      usageCount: 8,
      createdBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const template3: ProjectTemplate = {
      id: "template-3",
      name: "Website Development",
      description: "Full website development project including design, development, testing, and deployment with responsive design and SEO optimization.",
      category: "Website Development",
      priority: "high", 
      estimatedDuration: 45,
      estimatedBudget: "15000.00",
      isActive: true,
      usageCount: 5,
      createdBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const template4: ProjectTemplate = {
      id: "template-4",
      name: "PPC Campaign Launch", 
      description: "Google Ads and social media advertising campaign setup including keyword research, ad creation, landing page optimization, and campaign monitoring.",
      category: "PPC Campaign",
      priority: "medium",
      estimatedDuration: 10,
      estimatedBudget: "2500.00",
      isActive: true,
      usageCount: 15,
      createdBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projectTemplates.set("template-1", template1);
    this.projectTemplates.set("template-2", template2);
    this.projectTemplates.set("template-3", template3);
    this.projectTemplates.set("template-4", template4);

    // Sample template tasks for SEO Audit template
    const seoTasks = [
      {
        id: "task-template-1",
        templateId: "template-1",
        title: "Initial Website Audit",
        description: "Conduct comprehensive technical SEO audit of the website",
        priority: "high" as const,
        estimatedHours: "8.00",
        dayOffset: 0,
        dependsOn: null,
        assignToRole: "SEO Specialist",
        order: 1,
        createdAt: new Date(),
      },
      {
        id: "task-template-2", 
        templateId: "template-1",
        title: "Keyword Research",
        description: "Research and identify target keywords for optimization",
        priority: "high" as const,
        estimatedHours: "12.00", 
        dayOffset: 2,
        dependsOn: "task-template-1",
        assignToRole: "SEO Specialist",
        order: 2,
        createdAt: new Date(),
      },
      {
        id: "task-template-3",
        templateId: "template-1",
        title: "On-Page Optimization",
        description: "Implement on-page SEO improvements based on audit findings",
        priority: "medium" as const,
        estimatedHours: "16.00",
        dayOffset: 7,
        dependsOn: "task-template-2",
        assignToRole: "Developer", 
        order: 3,
        createdAt: new Date(),
      },
    ];

    // Add template tasks to storage
    seoTasks.forEach(task => {
      this.templateTasks.set(task.id, task as TemplateTask);
    });
  }

  private initializeWorkflowTemplates() {
    // Sample workflow templates based on best practices
    const templates: WorkflowTemplate[] = [
      {
        id: "template-1",
        name: "New Lead Welcome Sequence",
        description: "Automated welcome email sequence for new leads with follow-up tasks",
        category: "lead_management",
        industry: "General",
        useCase: "Lead nurturing and qualification",
        trigger: {
          type: "contact_created",
          conditions: {
            source: "website_form",
            tags: ["new_lead"]
          }
        },
        actions: [
          {
            type: "send_email",
            config: {
              template: "welcome_email",
              subject: "Welcome! Here's what happens next...",
              delay: 0
            }
          },
          {
            type: "wait",
            config: {
              duration: 24,
              unit: "hours"
            }
          },
          {
            type: "create_task",
            config: {
              title: "Follow up with new lead",
              description: "Personal outreach to qualify lead",
              priority: "high",
              assignee: "sales_team"
            }
          },
          {
            type: "wait",
            config: {
              duration: 3,
              unit: "days"
            }
          },
          {
            type: "send_email",
            config: {
              template: "case_study_email",
              subject: "See how we helped similar companies",
              delay: 0
            }
          }
        ],
        conditions: null,
        settings: {
          timezone: "America/New_York",
          business_hours_only: true
        },
        isPublic: true,
        usageCount: 45,
        rating: "4.8",
        tags: ["email_marketing", "lead_qualification", "sales"],
        createdBy: "system",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      },
      {
        id: "template-2",
        name: "Customer Onboarding Sequence",
        description: "Complete onboarding workflow for new customers",
        category: "customer_onboarding",
        industry: "SaaS",
        useCase: "Customer success and retention",
        trigger: {
          type: "tag_added",
          conditions: {
            tag_name: "new_customer"
          }
        },
        actions: [
          {
            type: "send_email",
            config: {
              template: "onboarding_welcome",
              subject: "Welcome to the team! Let's get started",
              delay: 0
            }
          },
          {
            type: "create_task",
            config: {
              title: "Schedule onboarding call",
              description: "Book 30-min onboarding call with new customer",
              priority: "high",
              assignee: "customer_success"
            }
          },
          {
            type: "wait",
            config: {
              duration: 7,
              unit: "days"
            }
          },
          {
            type: "send_email",
            config: {
              template: "tips_and_tricks",
              subject: "Pro tips to maximize your results",
              delay: 0
            }
          },
          {
            type: "wait",
            config: {
              duration: 14,
              unit: "days"
            }
          },
          {
            type: "create_task",
            config: {
              title: "Check-in with customer",
              description: "Follow up on onboarding progress",
              priority: "medium",
              assignee: "customer_success"
            }
          }
        ],
        conditions: null,
        settings: {
          timezone: "America/New_York",
          business_hours_only: true
        },
        isPublic: true,
        usageCount: 32,
        rating: "4.9",
        tags: ["onboarding", "customer_success", "retention"],
        createdBy: "system",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      },
      {
        id: "template-3",
        name: "Abandoned Cart Recovery",
        description: "Re-engage customers who abandoned their cart",
        category: "email_marketing",
        industry: "E-commerce",
        useCase: "Cart abandonment recovery",
        trigger: {
          type: "cart_abandoned",
          conditions: {
            time_threshold: 30,
            unit: "minutes"
          }
        },
        actions: [
          {
            type: "wait",
            config: {
              duration: 1,
              unit: "hours"
            }
          },
          {
            type: "send_email",
            config: {
              template: "cart_reminder",
              subject: "You left something behind...",
              delay: 0
            }
          },
          {
            type: "wait",
            config: {
              duration: 24,
              unit: "hours"
            }
          },
          {
            type: "send_email",
            config: {
              template: "cart_incentive",
              subject: "Complete your order and save 10%",
              delay: 0
            }
          },
          {
            type: "wait",
            config: {
              duration: 3,
              unit: "days"
            }
          },
          {
            type: "send_email",
            config: {
              template: "final_reminder",
              subject: "Last chance - your cart expires soon",
              delay: 0
            }
          }
        ],
        conditions: null,
        settings: {
          timezone: "America/New_York",
          business_hours_only: false
        },
        isPublic: true,
        usageCount: 78,
        rating: "4.7",
        tags: ["e-commerce", "cart_recovery", "email_automation"],
        createdBy: "system",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      }
    ];

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
        description: "Create a system notification for staff members",
        category: "communication",
        configSchema: {
          recipient: { type: "string", required: true },
          title: { type: "string", required: true },
          message: { type: "string", required: true },
          type: { type: "string", options: ["info", "warning", "success", "error"], default: "info" }
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
          project_id: { type: "string" },
          parent_task_id: { type: "string" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-8",
        name: "Create Project",
        type: "create_project",
        description: "Set up new client projects with details",
        category: "data_management",
        configSchema: {
          name: { type: "string", required: true },
          description: { type: "string" },
          client_id: { type: "string", required: true },
          budget: { type: "number" },
          start_date: { type: "string" },
          end_date: { type: "string" },
          priority: { type: "string", options: ["low", "medium", "high"], default: "medium" }
        },
        isActive: true,
        createdAt: new Date()
      },
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
      {
        id: "action-11",
        name: "Update Project Status",
        type: "update_project_status",
        description: "Change project status and progress",
        category: "data_management",
        configSchema: {
          project_id: { type: "string", required: true },
          status: { type: "string", options: ["planning", "active", "completed", "cancelled", "on_hold"], required: true },
          progress: { type: "number", min: 0, max: 100 },
          notes: { type: "string" }
        },
        isActive: true,
        createdAt: new Date()
      },
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
      {
        id: "action-13",
        name: "Update Custom Fields",
        type: "update_custom_fields",
        description: "Modify custom field values for contacts",
        category: "data_management",
        configSchema: {
          entity_type: { type: "string", options: ["client", "lead", "project"], required: true },
          entity_id: { type: "string", required: true },
          custom_fields: { type: "object", required: true }
        },
        isActive: true,
        createdAt: new Date()
      },

      // 👥 Assignment Actions
      {
        id: "action-14",
        name: "Assign Contact Owner",
        type: "assign_contact_owner",
        description: "Set primary contact responsible person",
        category: "assignment",
        configSchema: {
          contact_id: { type: "string", required: true },
          staff_id: { type: "string", required: true },
          notify_assignee: { type: "boolean", default: true },
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
      {
        id: "action-18",
        name: "Reassign Project Manager",
        type: "reassign_project_manager",
        description: "Change project ownership and management",
        category: "assignment",
        configSchema: {
          project_id: { type: "string", required: true },
          new_manager_id: { type: "string", required: true },
          notify_old_manager: { type: "boolean", default: true },
          notify_new_manager: { type: "boolean", default: true },
          handover_notes: { type: "string" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-19",
        name: "Remove Staff Assignment",
        type: "remove_staff_assignment",
        description: "Clear assignments from team members",
        category: "assignment",
        configSchema: {
          entity_type: { type: "string", options: ["client", "lead", "project", "task"], required: true },
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
        id: "action-21",
        name: "Update Lead Score",
        type: "update_lead_score",
        description: "Modify lead qualification scores",
        category: "status_progress",
        configSchema: {
          lead_id: { type: "string", required: true },
          score_change: { type: "number", required: true },
          score_type: { type: "string", options: ["add", "subtract", "set"], default: "add" },
          reason: { type: "string" }
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
      {
        id: "action-23",
        name: "Update Campaign Metrics",
        type: "update_campaign_metrics",
        description: "Track campaign performance data",
        category: "status_progress",
        configSchema: {
          campaign_id: { type: "string", required: true },
          metrics: { type: "object", required: true },
          increment_mode: { type: "boolean", default: true }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-24",
        name: "Set Project Priority",
        type: "set_project_priority",
        description: "Adjust project priority levels",
        category: "status_progress",
        configSchema: {
          project_id: { type: "string", required: true },
          priority: { type: "string", options: ["low", "medium", "high"], required: true },
          reason: { type: "string" },
          notify_team: { type: "boolean", default: true }
        },
        isActive: true,
        createdAt: new Date()
      },
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
          project_id: { type: "string" }
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
          entity_type: { type: "string", options: ["client", "project", "task"], required: true },
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
          project_id: { type: "string" },
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
          entity_type: { type: "string", options: ["client", "project"], required: true },
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
    const allClients = Array.from(this.clients.values());
    
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

  async updateClient(id: string, clientUpdate: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientUpdate };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByClient(clientId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.clientId === clientId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = new Date();
    const project: Project = { 
      id,
      name: insertProject.name,
      description: insertProject.description || null,
      clientId: insertProject.clientId,
      status: insertProject.status || "planning",
      priority: insertProject.priority || "medium",
      budget: insertProject.budget || null,
      startDate: insertProject.startDate || null,
      endDate: insertProject.endDate || null,
      progress: insertProject.progress || null,
      createdAt: now
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...projectUpdate };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Project Template Methods
  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    return Array.from(this.projectTemplates.values()).filter(t => t.isActive);
  }

  async getProjectTemplate(id: string): Promise<ProjectTemplate | undefined> {
    return this.projectTemplates.get(id);
  }

  async createProjectTemplate(insertTemplate: InsertProjectTemplate): Promise<ProjectTemplate> {
    const id = randomUUID();
    const now = new Date();
    const template: ProjectTemplate = {
      id,
      name: insertTemplate.name,
      description: insertTemplate.description || null,
      category: insertTemplate.category || "General",
      priority: insertTemplate.priority || "medium",
      estimatedDuration: insertTemplate.estimatedDuration || null,
      estimatedBudget: insertTemplate.estimatedBudget || null,
      isActive: insertTemplate.isActive ?? true,
      usageCount: 0,
      createdBy: insertTemplate.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.projectTemplates.set(id, template);
    return template;
  }

  async updateProjectTemplate(id: string, templateUpdate: Partial<InsertProjectTemplate>): Promise<ProjectTemplate | undefined> {
    const template = this.projectTemplates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { 
      ...template, 
      ...templateUpdate,
      updatedAt: new Date()
    };
    this.projectTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteProjectTemplate(id: string): Promise<boolean> {
    // Also delete associated template tasks
    const templateTasksToDelete = Array.from(this.templateTasks.values())
      .filter(task => task.templateId === id);
    templateTasksToDelete.forEach(task => this.templateTasks.delete(task.id));
    
    return this.projectTemplates.delete(id);
  }

  async incrementTemplateUsage(id: string): Promise<void> {
    const template = this.projectTemplates.get(id);
    if (template) {
      template.usageCount += 1;
      template.updatedAt = new Date();
      this.projectTemplates.set(id, template);
    }
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

  async getCampaignsByProject(projectId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.projectId === projectId);
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

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.projectId === projectId);
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

  async getEnhancedTasksByProject(projectId: string): Promise<EnhancedTask[]> {
    return Array.from(this.enhancedTasks.values()).filter(task => task.projectId === projectId);
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
    const triggers = await db.select().from(automationTriggers).orderBy(asc(automationTriggers.createdAt));
    return triggers;
  }

  async getAutomationTrigger(id: string): Promise<AutomationTrigger | undefined> {
    const result = await db.select().from(automationTriggers).where(eq(automationTriggers.id, id)).limit(1);
    return result[0];
  }

  async getAutomationTriggersByCategory(category: string): Promise<AutomationTrigger[]> {
    const triggers = await db.select().from(automationTriggers)
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

  // SMS Templates
  async getSmsTemplates(): Promise<SmsTemplate[]> {
    try {
      const result = await db.select().from(smsTemplates);
      return result;
    } catch (error) {
      console.error("Error fetching SMS templates:", error);
      return [];
    }
  }

  async getSmsTemplate(id: string): Promise<SmsTemplate | undefined> {
    try {
      const result = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching SMS template:", error);
      return undefined;
    }
  }

  async getSmsTemplatesByFolder(folderId: string): Promise<SmsTemplate[]> {
    try {
      const result = await db.select().from(smsTemplates).where(eq(smsTemplates.folderId, folderId));
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
}

// Database storage implementation using PostgreSQL

export class DbStorage implements IStorage {
  private db = db;
  // Clients
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClientsWithPagination(limit: number, offset: number, sortBy?: string, sortOrder?: string): Promise<{ clients: Client[]; total: number }> {
    // Build the query with proper sorting
    let query = db.select().from(clients);
    
    // Apply sorting
    if (sortBy && sortOrder) {
      if (sortBy === 'createdAt') {
        query = sortOrder === 'desc' ? query.orderBy(desc(clients.createdAt)) : query.orderBy(asc(clients.createdAt));
      } else if (sortBy === 'name') {
        query = sortOrder === 'desc' ? query.orderBy(desc(clients.name)) : query.orderBy(asc(clients.name));
      } else if (sortBy === 'email') {
        query = sortOrder === 'desc' ? query.orderBy(desc(clients.email)) : query.orderBy(asc(clients.email));
      } else {
        // Default fallback to name if invalid sortBy
        query = query.orderBy(asc(clients.name));
      }
    } else {
      // Default sorting by name
      query = query.orderBy(asc(clients.name));
    }
    
    const [clientsResult, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(clients)
    ]);
    
    return {
      clients: clientsResult,
      total: totalResult[0].count
    };
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const now = new Date();
    const client: Client = { 
      id,
      ...insertClient,
      createdAt: now,
    };
    
    await db.insert(clients).values(client);
    return client;
  }

  async updateClient(id: string, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db.update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return result[0];
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return true;
  }

  async getAllClientsForExport(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(clients.createdAt);
  }

  // For now, delegate other methods to memory storage until we need them
  // This allows the system to work while we migrate clients to database
  private memStorage = new MemStorage();

  // Projects
  async getProjects(): Promise<Project[]> {
    const result = await this.db.select().from(projects);
    return result;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async getProjectsByClient(clientId: string): Promise<Project[]> {
    const result = await this.db.select().from(projects).where(eq(projects.clientId, clientId));
    return result;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await this.db.insert(projects).values({
      ...project,
      id: sql`gen_random_uuid()`,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await this.db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await this.db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  // Campaigns  
  async getCampaigns(): Promise<Campaign[]> { return this.memStorage.getCampaigns(); }
  async getCampaign(id: string): Promise<Campaign | undefined> { return this.memStorage.getCampaign(id); }
  async getCampaignsByClient(clientId: string): Promise<Campaign[]> { return this.memStorage.getCampaignsByClient(clientId); }
  async getCampaignsByProject(projectId: string): Promise<Campaign[]> { return this.memStorage.getCampaignsByProject(projectId); }
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
  async getTasksByClient(clientId: string): Promise<Task[]> { return this.memStorage.getTasksByClient(clientId); }
  async getTasksByProject(projectId: string): Promise<Task[]> { return this.memStorage.getTasksByProject(projectId); }
  async createTask(task: InsertTask): Promise<Task> { return this.memStorage.createTask(task); }
  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> { return this.memStorage.updateTask(id, task); }
  async deleteTask(id: string): Promise<boolean> { return this.memStorage.deleteTask(id); }

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
  async getWorkflows(): Promise<Workflow[]> { return this.memStorage.getWorkflows(); }
  async getWorkflow(id: string): Promise<Workflow | undefined> { return this.memStorage.getWorkflow(id); }
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> { return this.memStorage.createWorkflow(workflow); }
  async updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> { return this.memStorage.updateWorkflow(id, workflow); }
  async deleteWorkflow(id: string): Promise<boolean> { return this.memStorage.deleteWorkflow(id); }

  async getWorkflowExecutions(): Promise<WorkflowExecution[]> { return this.memStorage.getWorkflowExecutions(); }
  async getWorkflowExecution(id: string): Promise<WorkflowExecution | undefined> { return this.memStorage.getWorkflowExecution(id); }
  async getWorkflowExecutionsByWorkflow(workflowId: string): Promise<WorkflowExecution[]> { return this.memStorage.getWorkflowExecutionsByWorkflow(workflowId); }
  async createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution> { return this.memStorage.createWorkflowExecution(execution); }
  async updateWorkflowExecution(id: string, execution: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution | undefined> { return this.memStorage.updateWorkflowExecution(id, execution); }


  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> { return this.memStorage.getWorkflowTemplates(); }
  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined> { return this.memStorage.getWorkflowTemplate(id); }
  async createWorkflowTemplate(template: InsertWorkflowTemplate): Promise<WorkflowTemplate> { return this.memStorage.createWorkflowTemplate(template); }
  async updateWorkflowTemplate(id: string, template: Partial<InsertWorkflowTemplate>): Promise<WorkflowTemplate | undefined> { return this.memStorage.updateWorkflowTemplate(id, template); }
  async deleteWorkflowTemplate(id: string): Promise<boolean> { return this.memStorage.deleteWorkflowTemplate(id); }

  // Task Categories
  async getTaskCategories(): Promise<TaskCategory[]> {
    const result = await this.db.select().from(taskCategories);
    return result;
  }

  async getTaskCategory(id: string): Promise<TaskCategory | undefined> {
    const result = await this.db.select().from(taskCategories).where(eq(taskCategories.id, id)).limit(1);
    return result[0];
  }

  async createTaskCategory(category: InsertTaskCategory): Promise<TaskCategory> {
    const result = await this.db.insert(taskCategories).values({
      ...category,
      id: sql`gen_random_uuid()`,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateTaskCategory(id: string, category: Partial<InsertTaskCategory>): Promise<TaskCategory | undefined> {
    const result = await this.db.update(taskCategories).set(category).where(eq(taskCategories.id, id)).returning();
    return result[0];
  }

  async deleteTaskCategory(id: string): Promise<boolean> {
    const result = await this.db.delete(taskCategories).where(eq(taskCategories.id, id)).returning();
    return result.length > 0;
  }

  // Enhanced Tasks  
  async getEnhancedTasks(): Promise<EnhancedTask[]> { return this.memStorage.getEnhancedTasks(); }
  async getEnhancedTask(id: string): Promise<EnhancedTask | undefined> { return this.memStorage.getEnhancedTask(id); }
  async getEnhancedTasksByClient(clientId: string): Promise<EnhancedTask[]> { return this.memStorage.getEnhancedTasksByClient(clientId); }
  async getEnhancedTasksByProject(projectId: string): Promise<EnhancedTask[]> { return this.memStorage.getEnhancedTasksByProject(projectId); }
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
    const folders = await this.db.select().from(templateFolders);
    return folders;
  }

  async getTemplateFolder(id: string): Promise<TemplateFolder | undefined> {
    const folder = await this.db.select().from(templateFolders).where(eq(templateFolders.id, id)).limit(1);
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
    
    await this.db.insert(templateFolders).values(folder);
    return folder;
  }

  async updateTemplateFolder(id: string, folderData: Partial<InsertTemplateFolder>): Promise<TemplateFolder | undefined> {
    const updates = {
      ...folderData,
      updatedAt: new Date(),
    };
    
    await this.db.update(templateFolders).set(updates).where(eq(templateFolders.id, id));
    return this.getTemplateFolder(id);
  }

  async deleteTemplateFolder(id: string): Promise<boolean> {
    const result = await this.db.delete(templateFolders).where(eq(templateFolders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(asc(emailTemplates.name));
  }
  
  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const results = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return results[0];
  }
  
  async getEmailTemplatesByFolder(folderId: string): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).where(eq(emailTemplates.folderId, folderId));
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

  async getSmsTemplates(): Promise<SmsTemplate[]> {
    const result = await this.db.select().from(smsTemplates);
    return result;
  }

  async getSmsTemplate(id: string): Promise<SmsTemplate | undefined> {
    const result = await this.db.select().from(smsTemplates).where(eq(smsTemplates.id, id)).limit(1);
    return result[0];
  }

  async getSmsTemplatesByFolder(folderId: string): Promise<SmsTemplate[]> {
    return await this.db.select().from(smsTemplates).where(eq(smsTemplates.folderId, folderId));
  }

  async createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate> {
    const result = await this.db.insert(smsTemplates).values({
      ...template,
      id: sql`gen_random_uuid()`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateSmsTemplate(id: string, template: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined> {
    const result = await this.db.update(smsTemplates).set({
      ...template,
      updatedAt: new Date(),
    }).where(eq(smsTemplates.id, id)).returning();
    return result[0];
  }

  async deleteSmsTemplate(id: string): Promise<boolean> {
    const result = await this.db.delete(smsTemplates).where(eq(smsTemplates.id, id)).returning();
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
  async getStaff(): Promise<Staff[]> { return this.memStorage.getStaff(); }
  async getStaffMember(id: string): Promise<Staff | undefined> { return this.memStorage.getStaffMember(id); }
  async createStaffMember(staff: InsertStaff): Promise<Staff> { return this.memStorage.createStaffMember(staff); }
  async updateStaffMember(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined> { return this.memStorage.updateStaffMember(id, staff); }
  async deleteStaffMember(id: string): Promise<boolean> { return this.memStorage.deleteStaffMember(id); }

  // Departments
  async getDepartments(): Promise<Department[]> {
    const result = await this.db.select().from(departments).orderBy(asc(departments.name));
    return result;
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const result = await this.db.select().from(departments).where(eq(departments.id, id));
    return result[0];
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await this.db.insert(departments).values(department).returning();
    return result[0];
  }

  async updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const result = await this.db
      .update(departments)
      .set({ ...department, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return result[0];
  }

  async deleteDepartment(id: string): Promise<boolean> {
    try {
      await this.db.delete(departments).where(eq(departments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting department:", error);
      return false;
    }
  }

  // Positions
  async getPositions(): Promise<Position[]> {
    const result = await this.db.select().from(positions).orderBy(asc(positions.name));
    return result;
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const result = await this.db.select().from(positions).where(eq(positions.id, id));
    return result[0];
  }

  async getPositionsByDepartment(departmentId: string): Promise<Position[]> {
    const result = await this.db
      .select()
      .from(positions)
      .where(eq(positions.departmentId, departmentId))
      .orderBy(asc(positions.name));
    return result;
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const result = await this.db.insert(positions).values(position).returning();
    return result[0];
  }

  async updatePosition(id: string, position: Partial<InsertPosition>): Promise<Position | undefined> {
    const result = await this.db
      .update(positions)
      .set({ ...position, updatedAt: new Date() })
      .where(eq(positions.id, id))
      .returning();
    return result[0];
  }

  async deletePosition(id: string): Promise<boolean> {
    try {
      await this.db.delete(positions).where(eq(positions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting position:", error);
      return false;
    }
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    const result = await this.db.select().from(tags);
    return result;
  }

  async getTag(id: string): Promise<Tag | undefined> {
    const result = await this.db.select().from(tags).where(eq(tags.id, id)).limit(1);
    return result[0];
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const result = await this.db.insert(tags).values({
      ...tag,
      id: sql`gen_random_uuid()`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag | undefined> {
    const result = await this.db.update(tags).set({
      ...tag,
      updatedAt: new Date(),
    }).where(eq(tags.id, id)).returning();
    return result[0];
  }

  async deleteTag(id: string): Promise<boolean> {
    const result = await this.db.delete(tags).where(eq(tags.id, id)).returning();
    return result.length > 0;
  }

  // Products
  async getProducts(): Promise<Product[]> { return this.memStorage.getProducts(); }
  async getProduct(id: string): Promise<Product | undefined> { return this.memStorage.getProduct(id); }
  async createProduct(product: InsertProduct): Promise<Product> { return this.memStorage.createProduct(product); }
  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> { return this.memStorage.updateProduct(id, product); }
  async deleteProduct(id: string): Promise<boolean> { return this.memStorage.deleteProduct(id); }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> { return this.memStorage.getAuditLogs(); }
  async getAuditLog(id: string): Promise<AuditLog | undefined> { return this.memStorage.getAuditLog(id); }
  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> { return this.memStorage.getAuditLogsByEntity(entityType, entityId); }
  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> { return this.memStorage.getAuditLogsByUser(userId); }
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> { return this.memStorage.createAuditLog(auditLog); }

  // Roles and Permissions  
  async getRoles(): Promise<Role[]> { return this.memStorage.getRoles(); }
  async getRole(id: string): Promise<Role | undefined> { return this.memStorage.getRole(id); }
  async createRole(role: InsertRole): Promise<Role> { return this.memStorage.createRole(role); }
  async updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined> { return this.memStorage.updateRole(id, role); }
  async deleteRole(id: string): Promise<boolean> { return this.memStorage.deleteRole(id); }

  async getPermissions(): Promise<Permission[]> { return this.memStorage.getPermissions(); }
  async getPermission(id: string): Promise<Permission | undefined> { return this.memStorage.getPermission(id); }
  async createPermission(permission: InsertPermission): Promise<Permission> { return this.memStorage.createPermission(permission); }
  async updatePermission(id: string, permission: Partial<InsertPermission>): Promise<Permission | undefined> { return this.memStorage.updatePermission(id, permission); }
  async deletePermission(id: string): Promise<boolean> { return this.memStorage.deletePermission(id); }

  async getUserRoles(): Promise<UserRole[]> { return this.memStorage.getUserRoles(); }
  async getUserRole(id: string): Promise<UserRole | undefined> { return this.memStorage.getUserRole(id); }
  async getUserRolesByUser(userId: string): Promise<UserRole[]> { return this.memStorage.getUserRolesByUser(userId); }
  async getUserRolesByRole(roleId: string): Promise<UserRole[]> { return this.memStorage.getUserRolesByRole(roleId); }
  async createUserRole(userRole: InsertUserRole): Promise<UserRole> { return this.memStorage.createUserRole(userRole); }
  async updateUserRole(id: string, userRole: Partial<InsertUserRole>): Promise<UserRole | undefined> { return this.memStorage.updateUserRole(id, userRole); }
  async deleteUserRole(id: string): Promise<boolean> { return this.memStorage.deleteUserRole(id); }

  // Notifications
  async getNotificationSettings(): Promise<NotificationSettings[]> { return this.memStorage.getNotificationSettings(); }
  async getNotificationSetting(id: string): Promise<NotificationSettings | undefined> { return this.memStorage.getNotificationSetting(id); }
  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> { return this.memStorage.createNotificationSettings(settings); }
  async updateNotificationSettings(id: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> { return this.memStorage.updateNotificationSettings(id, settings); }
  async deleteNotificationSettings(id: string): Promise<boolean> { return this.memStorage.deleteNotificationSettings(id); }
}

// For now, use a minimal working storage implementation
class MinimalStorage implements Partial<IStorage> {
  // Basic client operations that are needed
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
      // Get total count
      const totalResult = await db.select({ count: sql`count(*)` }).from(clients);
      const total = Number(totalResult[0]?.count) || 0;
      
      // Build the query with sorting
      let query = db.select().from(clients);
      
      if (sortBy) {
        const column = clients[sortBy as keyof typeof clients];
        if (column) {
          if (sortOrder === 'desc') {
            query = query.orderBy(desc(column));
          } else {
            query = query.orderBy(asc(column));
          }
        }
      } else {
        // Default sort by createdAt desc
        query = query.orderBy(desc(clients.createdAt));
      }
      
      // Add pagination
      query = query.limit(limit).offset(offset);
      
      const clientsResult = await query;
      
      return {
        clients: clientsResult,
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

  async getClient(id: string): Promise<Client | undefined> {
    try {
      const result = await db.select().from(clients).where(eq(clients.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching client:", error);
      return undefined;
    }
  }

  async createClient(client: InsertClient): Promise<Client> {
    try {
      const result = await db.insert(clients).values(client).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    try {
      const result = await db.update(clients).set(client).where(eq(clients.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating client:", error);
      return undefined;
    }
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      const result = await db.delete(clients).where(eq(clients.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting client:", error);
      return false;
    }
  }

  // Minimal implementations for other required methods
  async getTasks(): Promise<Task[]> { return []; }
  async getTask(id: string): Promise<Task | undefined> { return undefined; }
  async getProjects(): Promise<Project[]> { return []; }
  async getCampaigns(): Promise<Campaign[]> { return []; }
  async getLeads(): Promise<Lead[]> { return []; }
  async getInvoices(): Promise<Invoice[]> { return []; }
  async getSocialMediaAccounts(): Promise<SocialMediaAccount[]> { return []; }
  async getSocialMediaPosts(): Promise<SocialMediaPost[]> { return []; }
  async getSocialMediaTemplates(): Promise<SocialMediaTemplate[]> { return []; }
  async getSocialMediaAnalytics(): Promise<SocialMediaAnalytics[]> { return []; }
  async getWorkflows(): Promise<Workflow[]> { return []; }
  async getEnhancedTasks(): Promise<EnhancedTask[]> { return []; }
  async getAutomationTriggers(): Promise<AutomationTrigger[]> { return []; }
  async getAutomationActions(): Promise<AutomationAction[]> { return []; }
  async getAllClientsForExport(): Promise<Client[]> { return this.getClients(); }
  
  // Custom Field File Uploads
  async getCustomFieldFileUploads(clientId: string, customFieldId: string): Promise<CustomFieldFileUpload[]> {
    try {
      const uploads = await db.select()
        .from(customFieldFileUploads)
        .where(and(
          eq(customFieldFileUploads.clientId, clientId),
          eq(customFieldFileUploads.customFieldId, customFieldId)
        ));
      return uploads;
    } catch (error) {
      console.error("Error getting custom field file uploads:", error);
      return [];
    }
  }

  async getCustomFieldFileUpload(id: string): Promise<CustomFieldFileUpload | undefined> {
    try {
      const upload = await db.select()
        .from(customFieldFileUploads)
        .where(eq(customFieldFileUploads.id, id))
        .limit(1);
      return upload[0];
    } catch (error) {
      console.error("Error getting custom field file upload:", error);
      return undefined;
    }
  }

  async createCustomFieldFileUpload(upload: InsertCustomFieldFileUpload): Promise<CustomFieldFileUpload> {
    try {
      const result = await db.insert(customFieldFileUploads).values(upload).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating custom field file upload:", error);
      throw error;
    }
  }

  async deleteCustomFieldFileUpload(id: string): Promise<boolean> {
    try {
      await db.delete(customFieldFileUploads).where(eq(customFieldFileUploads.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting custom field file upload:", error);
      return false;
    }
  }

  // Forms
  async getForms(): Promise<Form[]> {
    try {
      return await db.select().from(forms).orderBy(desc(forms.createdAt));
    } catch (error) {
      console.error("Error getting forms:", error);
      return [];
    }
  }

  async getForm(id: string): Promise<Form | undefined> {
    try {
      const result = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting form:", error);
      return undefined;
    }
  }

  async createForm(form: InsertForm): Promise<Form> {
    try {
      const result = await db.insert(forms).values(form).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating form:", error);
      throw error;
    }
  }

  async updateForm(id: string, form: Partial<InsertForm>): Promise<Form | undefined> {
    try {
      const result = await db.update(forms)
        .set({ ...form, updatedAt: new Date() })
        .where(eq(forms.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating form:", error);
      return undefined;
    }
  }

  async deleteForm(id: string): Promise<boolean> {
    try {
      await db.delete(forms).where(eq(forms.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting form:", error);
      return false;
    }
  }

  // Form Fields
  async getFormFields(formId: string): Promise<FormField[]> {
    try {
      return await db.select()
        .from(formFields)
        .where(eq(formFields.formId, formId))
        .orderBy(asc(formFields.order));
    } catch (error) {
      console.error("Error getting form fields:", error);
      return [];
    }
  }

  async getFormField(id: string): Promise<FormField | undefined> {
    try {
      const result = await db.select().from(formFields).where(eq(formFields.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting form field:", error);
      return undefined;
    }
  }

  async createFormField(field: InsertFormField): Promise<FormField> {
    try {
      const result = await db.insert(formFields).values(field).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating form field:", error);
      throw error;
    }
  }

  async updateFormField(id: string, field: Partial<InsertFormField>): Promise<FormField | undefined> {
    try {
      const result = await db.update(formFields)
        .set(field)
        .where(eq(formFields.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating form field:", error);
      return undefined;
    }
  }

  async deleteFormField(id: string): Promise<boolean> {
    try {
      await db.delete(formFields).where(eq(formFields.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting form field:", error);
      return false;
    }
  }

  async reorderFormFields(fieldIds: string[]): Promise<void> {
    try {
      const updates = fieldIds.map((fieldId, index) => 
        db.update(formFields)
          .set({ order: index })
          .where(eq(formFields.id, fieldId))
      );
      await Promise.all(updates);
    } catch (error) {
      console.error("Error reordering form fields:", error);
      throw error;
    }
  }

  // Form Submissions
  async getFormSubmissions(formId: string): Promise<FormSubmission[]> {
    try {
      return await db.select()
        .from(formSubmissions)
        .where(eq(formSubmissions.formId, formId))
        .orderBy(desc(formSubmissions.createdAt));
    } catch (error) {
      console.error("Error getting form submissions:", error);
      return [];
    }
  }

  async getFormSubmission(id: string): Promise<FormSubmission | undefined> {
    try {
      const result = await db.select().from(formSubmissions).where(eq(formSubmissions.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting form submission:", error);
      return undefined;
    }
  }

  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    try {
      const result = await db.insert(formSubmissions).values(submission).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating form submission:", error);
      throw error;
    }
  }

  // Image Annotations
  async getImageAnnotations(fileId: string): Promise<ImageAnnotation[]> {
    try {
      return await db.select()
        .from(imageAnnotations)
        .where(eq(imageAnnotations.fileId, fileId))
        .orderBy(desc(imageAnnotations.createdAt));
    } catch (error) {
      console.error("Error getting image annotations:", error);
      return [];
    }
  }

  async createImageAnnotation(annotation: InsertImageAnnotation): Promise<ImageAnnotation> {
    try {
      const result = await db.insert(imageAnnotations).values(annotation).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating image annotation:", error);
      throw error;
    }
  }

  async updateImageAnnotation(annotationId: string, updates: { content: string; updatedAt: Date }): Promise<ImageAnnotation | undefined> {
    try {
      const result = await db.update(imageAnnotations)
        .set(updates)
        .where(eq(imageAnnotations.id, annotationId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating image annotation:", error);
      return undefined;
    }
  }

  async deleteImageAnnotation(annotationId: string): Promise<boolean> {
    try {
      await db.delete(imageAnnotations).where(eq(imageAnnotations.id, annotationId));
      return true;
    } catch (error) {
      console.error("Error deleting image annotation:", error);
      return false;
    }
  }

  // Additional form methods to ensure they're available at runtime
  async getFormsMethods(): Promise<string[]> {
    return ['getForms', 'getForm', 'createForm', 'updateForm', 'deleteForm', 'getFormFields', 'createFormField', 'updateFormField', 'deleteFormField', 'getFormSubmissions', 'getFormSubmission', 'createFormSubmission'];
  }

  // Job Openings
  async getJobOpenings(): Promise<JobOpening[]> {
    try {
      return await db.select().from(jobOpenings).orderBy(desc(jobOpenings.createdAt));
    } catch (error) {
      console.error("Error getting job openings:", error);
      return [];
    }
  }

  async createJobOpening(jobOpening: InsertJobOpening): Promise<JobOpening> {
    try {
      const result = await db.insert(jobOpenings).values(jobOpening).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating job opening:", error);
      throw error;
    }
  }

  async updateJobOpening(id: string, updates: Partial<InsertJobOpening>): Promise<JobOpening> {
    try {
      const result = await db.update(jobOpenings)
        .set(updates)
        .where(eq(jobOpenings.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating job opening:", error);
      throw error;
    }
  }

  async approveJobOpening(id: string): Promise<JobOpening> {
    try {
      const result = await db.update(jobOpenings)
        .set({ status: 'open', updatedAt: new Date() })
        .where(eq(jobOpenings.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error approving job opening:", error);
      throw error;
    }
  }

  // Job Applications
  async getJobApplications(): Promise<JobApplication[]> {
    try {
      return await db.select().from(jobApplications).orderBy(desc(jobApplications.createdAt));
    } catch (error) {
      console.error("Error getting job applications:", error);
      return [];
    }
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    try {
      const result = await db.insert(jobApplications).values(application).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating job application:", error);
      throw error;
    }
  }
}

export const storage = new DbStorage();
