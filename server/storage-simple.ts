import { 
  type Client, type InsertClient, clients,
  type Project, type InsertProject,
  type Campaign, type InsertCampaign,
  type Lead, type InsertLead,
  type Task, type InsertTask,
  type Invoice, type InsertInvoice,
  type User, type InsertUser,
  type AuditLog, type InsertAuditLog,
  type CustomField, type InsertCustomField,
  type CustomFieldFolder, type InsertCustomFieldFolder,
  type Product, type InsertProduct,
  type Note, type InsertNote,
  type SocialMediaAccount, type InsertSocialMediaAccount,
  type SocialMediaPost, type InsertSocialMediaPost,
  type SocialMediaTemplate, type InsertSocialMediaTemplate,
  type SocialMediaAnalytics, type InsertSocialMediaAnalytics,
  type TemplateFolder, type InsertTemplateFolder,
  type EmailTemplate, type InsertEmailTemplate,
  type SmsTemplate, type InsertSmsTemplate,
  type SmartList, type InsertSmartList,
  type Workflow, type InsertWorkflow,
  type WorkflowExecution, type InsertWorkflowExecution,
  type WorkflowTemplate, type InsertWorkflowTemplate,
  type TaskCategory, type InsertTaskCategory,
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
  type FormSubmission, type InsertFormSubmission
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql, asc, desc, and } from "drizzle-orm";

export interface IStorage {
  // Essential methods only
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
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByClient(clientId: string): Promise<Task[]>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Stub methods for all the others to satisfy the interface
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignsByClient(clientId: string): Promise<Campaign[]>;
  getCampaignsByProject(projectId: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;

  // All the other methods as stubs
  [key: string]: any; // Allow any method to pass through
}

export class SimpleStorage implements IStorage {
  // Simple in-memory storage for now
  private clients: Map<string, Client> = new Map();
  private projects: Map<string, Project> = new Map();
  private tasks: Map<string, Task> = new Map();
  private campaigns: Map<string, Campaign> = new Map();

  constructor() {
    this.addSampleData();
  }

  private addSampleData() {
    // Add sample client
    const sampleClient: Client = {
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
      notes: "Very interested in our digital marketing services.",
      tags: ["high-priority", "tech"],
      clientVertical: "Technology",
      contactOwner: "user-1",
      profileImage: null,
      mrr: "5000.00",
      invoicingContact: "Sarah Johnson",
      invoicingEmail: "billing@techstartup.com",
      paymentTerms: "net_30",
      upsideBonus: "10.00",
      clientBrief: null,
      growthOsDashboard: null,
      storyBrand: null,
      styleGuide: null,
      googleDriveFolder: null,
      testingLog: null,
      cornerstoneBlueprint: null,
      customGpt: null,
      dndAll: false,
      dndEmail: false,
      dndSms: false,
      dndCalls: false,
      linkedInProfile: null,
      facebookProfile: null,
      twitterProfile: null,
      instagramProfile: null,
      country: "United States",
      timezone: "America/Chicago",
      birthday: null,
      spouse: null,
      children: null,
      lastActivity: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.clients.set(sampleClient.id, sampleClient);
  }

  // Implement essential methods
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClientsWithPagination(limit: number, offset: number, sortBy?: string, sortOrder?: string): Promise<{ clients: Client[]; total: number }> {
    const allClients = Array.from(this.clients.values());
    const total = allClients.length;
    const clients = allClients.slice(offset, offset + limit);
    return { clients, total };
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const newClient: Client = {
      ...client,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as Client;
    this.clients.set(newClient.id, newClient);
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...client, updatedAt: new Date() };
    this.clients.set(id, updated);
    return updated;
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

  async createProject(project: InsertProject): Promise<Project> {
    const newProject: Project = {
      ...project,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as Project;
    this.projects.set(newProject.id, newProject);
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...project, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
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

  async createTask(task: InsertTask): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null
    } as Task;
    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...task, updatedAt: new Date() };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
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

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const newCampaign: Campaign = {
      ...campaign,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as Campaign;
    this.campaigns.set(newCampaign.id, newCampaign);
    return newCampaign;
  }

  async updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const existing = this.campaigns.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...campaign, updatedAt: new Date() };
    this.campaigns.set(id, updated);
    return updated;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  // Stub implementations for all other methods
  [key: string]: any;

  // Create stub methods that return empty arrays or null
  private createStubMethod(returnType: 'array' | 'single' | 'boolean' | 'void') {
    return async (...args: any[]) => {
      switch (returnType) {
        case 'array': return [];
        case 'single': return undefined;
        case 'boolean': return true;
        case 'void': return;
        default: return undefined;
      }
    };
  }

  // Dynamically handle missing methods
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return 'SimpleStorage instance';
  }
}

// Add all the missing methods as stubs
const storage = new SimpleStorage();

// Add stub methods dynamically
const stubMethods = [
  'getLeads', 'getLead', 'createLead', 'updateLead', 'deleteLead',
  'getInvoices', 'getInvoice', 'getInvoicesByClient', 'createInvoice', 'updateInvoice', 'deleteInvoice',
  'getSocialMediaAccounts', 'getSocialMediaAccount', 'getSocialMediaAccountsByClient', 'createSocialMediaAccount', 'updateSocialMediaAccount', 'deleteSocialMediaAccount',
  'getSocialMediaPosts', 'getSocialMediaPost', 'getSocialMediaPostsByClient', 'getSocialMediaPostsByAccount', 'createSocialMediaPost', 'updateSocialMediaPost', 'deleteSocialMediaPost',
  'getSocialMediaTemplates', 'getSocialMediaTemplate', 'getSocialMediaTemplatesByClient', 'createSocialMediaTemplate', 'updateSocialMediaTemplate', 'deleteSocialMediaTemplate',
  'getSocialMediaAnalytics', 'getSocialMediaAnalyticsForAccount', 'createSocialMediaAnalytics',
  'getWorkflows', 'getWorkflow', 'getWorkflowsByClient', 'getWorkflowsByCategory', 'createWorkflow', 'updateWorkflow', 'deleteWorkflow',
  'getWorkflowExecutions', 'getWorkflowExecution', 'getWorkflowExecutionsByWorkflow', 'getWorkflowExecutionsByContact', 'createWorkflowExecution', 'updateWorkflowExecution',
  'getWorkflowTemplates', 'getWorkflowTemplate', 'getWorkflowTemplatesByCategory', 'createWorkflowTemplate', 'updateWorkflowTemplate', 'deleteWorkflowTemplate',
  'getTaskCategories', 'getTaskCategory', 'createTaskCategory', 'updateTaskCategory', 'deleteTaskCategory',
  'getTaskTemplates', 'getTaskTemplate', 'getTaskTemplatesByCategory', 'createTaskTemplate', 'updateTaskTemplate', 'deleteTaskTemplate',
  'getEnhancedTasks', 'getEnhancedTask', 'getEnhancedTasksByClient', 'getEnhancedTasksByProject', 'getEnhancedTasksByAssignee', 'getEnhancedTasksByWorkflow', 'createEnhancedTask', 'updateEnhancedTask', 'deleteEnhancedTask',
  'getTaskHistory', 'createTaskHistory',
  'getAutomationTriggers', 'getAutomationTrigger', 'getAutomationTriggersByCategory', 'createAutomationTrigger', 'updateAutomationTrigger',
  'getAutomationActions', 'getAutomationAction', 'getAutomationActionsByCategory', 'createAutomationAction', 'updateAutomationAction',
  'getTemplateFolders', 'getTemplateFolder', 'getTemplateFoldersByType', 'createTemplateFolder', 'updateTemplateFolder', 'deleteTemplateFolder',
  'getEmailTemplates', 'getEmailTemplate', 'getEmailTemplatesByFolder', 'createEmailTemplate', 'updateEmailTemplate', 'deleteEmailTemplate',
  'getSmsTemplates', 'getSmsTemplate', 'getSmsTemplatesByFolder', 'createSmsTemplate', 'updateSmsTemplate', 'deleteSmsTemplate',
  'getCustomFields', 'getCustomField', 'createCustomField', 'updateCustomField', 'deleteCustomField',
  'getCustomFieldFolders', 'getCustomFieldFolder', 'createCustomFieldFolder',
  'getTags', 'getTag', 'createTag', 'updateTag', 'deleteTag',
  'getNotifications', 'getNotification', 'getUnreadNotifications', 'createNotification', 'markNotificationAsRead', 'markAllNotificationsAsRead', 'deleteNotification',
  'getAuditLogs', 'getAuditLog', 'getAuditLogsByEntity', 'getAuditLogsByUser', 'createAuditLog',
  'getStaff', 'getStaffMember', 'createStaffMember', 'updateStaffMember', 'deleteStaffMember',
  'getRoles', 'getRole', 'createRole', 'updateRole', 'deleteRole',
  'getNotificationSettings', 'createNotificationSettings', 'updateNotificationSettings',
  'getCustomFieldFileUploads', 'getCustomFieldFileUpload', 'createCustomFieldFileUpload', 'deleteCustomFieldFileUpload',
  'getForms', 'getForm', 'createForm', 'updateForm', 'deleteForm',
  'getFormFields', 'getFormField', 'createFormField', 'updateFormField', 'deleteFormField', 'reorderFormFields',
  'getFormSubmissions', 'getFormSubmission', 'createFormSubmission',
  'reorderCustomFields', 'updateCustomFieldFolder', 'deleteCustomFieldFolder', 'reorderCustomFieldFolders',
  'getProducts', 'getProduct', 'createProduct', 'updateProduct', 'deleteProduct',
  'getProductCategories', 'createProductCategory', 'updateProductCategory', 'deleteProductCategory',
  'getClientProducts', 'createClientProduct', 'updateClientProduct', 'deleteClientProduct',
  'getClientBundles', 'createClientBundle', 'updateClientBundle', 'deleteClientBundle',
  'getClientNotes', 'createClientNote', 'updateClientNote', 'deleteClientNote',
  'getClientTasks', 'createClientTask', 'updateClientTask', 'deleteClientTask',
  'getClientAppointments', 'createClientAppointment', 'updateClientAppointment', 'deleteClientAppointment',
  'getClientDocuments', 'createClientDocument', 'updateClientDocument', 'deleteClientDocument',
  'getClientTransactions', 'createClientTransaction', 'updateClientTransaction', 'deleteClientTransaction',
  'getCalendars', 'getCalendar', 'createCalendar', 'updateCalendar', 'deleteCalendar',
  'getCalendarStaff', 'getCalendarAvailability', 'getCalendarAppointments', 'createCalendarAppointment', 'updateCalendarAppointment', 'deleteCalendarAppointment',
  'getTaskComments', 'createTaskComment', 'updateTaskComment', 'deleteTaskComment',
  'getSmartLists', 'getSmartList', 'createSmartList', 'updateSmartList', 'deleteSmartList',
  'getPermissions', 'getPermission', 'createPermission', 'updatePermission', 'deletePermission',
  'getUserRoles', 'getUserRole', 'getUserRolesByUser', 'getUserRolesByRole', 'createUserRole', 'updateUserRole', 'deleteUserRole',
  'deleteAutomationTrigger', 'deleteAutomationAction', 'deleteWorkflowExecution'
];

stubMethods.forEach(methodName => {
  if (!(storage as any)[methodName]) {
    if (methodName.startsWith('get') && !methodName.includes('ById') && !methodName.includes('ByClient') && !methodName.includes('ByProject')) {
      (storage as any)[methodName] = async () => [];
    } else if (methodName.startsWith('get')) {
      (storage as any)[methodName] = async () => undefined;
    } else if (methodName.startsWith('create') || methodName.startsWith('update')) {
      (storage as any)[methodName] = async (data: any) => ({ id: randomUUID(), ...data, createdAt: new Date(), updatedAt: new Date() });
    } else if (methodName.startsWith('delete')) {
      (storage as any)[methodName] = async () => true;
    } else {
      (storage as any)[methodName] = async () => undefined;
    }
  }
});

export { storage };