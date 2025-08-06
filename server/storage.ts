import { 
  type Client, type InsertClient,
  type Project, type InsertProject,
  type Campaign, type InsertCampaign,
  type Lead, type InsertLead,
  type Task, type InsertTask,
  type Invoice, type InsertInvoice,
  type User, type InsertUser,
  type CustomField, type InsertCustomField,
  type CustomFieldFolder, type InsertCustomFieldFolder,
  type ClientGroup, type InsertClientGroup,
  type Product, type InsertProduct,
  type ClientProduct, type InsertClientProduct,
  type Note, type InsertNote,
  type Appointment, type InsertAppointment,
  type Document, type InsertDocument,
  type Activity, type InsertActivity,
  type SocialMediaAccount, type InsertSocialMediaAccount,
  type SocialMediaPost, type InsertSocialMediaPost,
  type SocialMediaTemplate, type InsertSocialMediaTemplate,
  type SocialMediaAnalytics, type InsertSocialMediaAnalytics,
  type Workflow, type InsertWorkflow,
  type WorkflowExecution, type InsertWorkflowExecution,
  type WorkflowTemplate, type InsertWorkflowTemplate,
  type TaskCategory, type InsertTaskCategory,
  type TaskTemplate, type InsertTaskTemplate,
  type EnhancedTask, type InsertEnhancedTask,
  type TaskHistory, type InsertTaskHistory,
  type AutomationTrigger, type InsertAutomationTrigger,
  type AutomationAction, type InsertAutomationAction,
  type Notification, type InsertNotification
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
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
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByClient(clientId: string): Promise<Task[]>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
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
  
  // Automation Actions
  getAutomationActions(): Promise<AutomationAction[]>;
  getAutomationAction(id: string): Promise<AutomationAction | undefined>;
  getAutomationActionsByCategory(category: string): Promise<AutomationAction[]>;
  createAutomationAction(action: InsertAutomationAction): Promise<AutomationAction>;
  updateAutomationAction(id: string, action: Partial<InsertAutomationAction>): Promise<AutomationAction | undefined>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;
  deleteNotification(id: string): Promise<boolean>;
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
  private workflows: Map<string, Workflow> = new Map();
  private workflowExecutions: Map<string, WorkflowExecution> = new Map();
  private workflowTemplates: Map<string, WorkflowTemplate> = new Map();
  private taskCategories: Map<string, TaskCategory> = new Map();
  private taskTemplates: Map<string, TaskTemplate> = new Map();
  private enhancedTasks: Map<string, EnhancedTask> = new Map();
  private taskHistory: Map<string, TaskHistory[]> = new Map();
  private automationTriggers: Map<string, AutomationTrigger> = new Map();
  private automationActions: Map<string, AutomationAction> = new Map();
  private notifications: Map<string, Notification> = new Map();

  constructor() {
    // Add sample data for testing
    this.addSampleData();
    this.initializeWorkflowTemplates();
    this.initializeAutomationElements();
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
        rating: 4.8,
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
        rating: 4.9,
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
        rating: 4.7,
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
        name: "New Contact Created",
        type: "contact_created",
        description: "Triggers when a new contact is added to the system",
        category: "contact_management",
        configSchema: {
          source: { type: "string", options: ["website", "manual", "import", "api"] },
          tags: { type: "array", items: { type: "string" } }
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
      }
    ];

    triggers.forEach(trigger => {
      this.automationTriggers.set(trigger.id, trigger);
    });

    // Sample automation actions
    const actions: AutomationAction[] = [
      {
        id: "action-1",
        name: "Send Email",
        type: "send_email",
        description: "Send an email using a template",
        category: "communication",
        configSchema: {
          template_id: { type: "string", required: true },
          subject: { type: "string" },
          delay: { type: "number", default: 0 }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-2",
        name: "Create Task",
        type: "create_task",
        description: "Create a task for team members",
        category: "task_management",
        configSchema: {
          title: { type: "string", required: true },
          description: { type: "string" },
          assignee: { type: "string", required: true },
          priority: { type: "string", options: ["low", "medium", "high"], default: "medium" }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-3",
        name: "Send SMS",
        type: "send_sms",
        description: "Send an SMS message",
        category: "communication",
        configSchema: {
          message: { type: "string", required: true },
          delay: { type: "number", default: 0 }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "action-4",
        name: "Add Tag",
        type: "add_tag",
        description: "Add a tag to the contact",
        category: "contact_management",
        configSchema: {
          tag_name: { type: "string", required: true }
        },
        isActive: true,
        createdAt: new Date()
      }
    ];

    actions.forEach(action => {
      this.automationActions.set(action.id, action);
    });
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
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
    const task: Task = { 
      id,
      title: insertTask.title,
      description: insertTask.description || null,
      status: insertTask.status || "pending",
      priority: insertTask.priority || "medium",
      assignedTo: insertTask.assignedTo || null,
      clientId: insertTask.clientId || null,
      projectId: insertTask.projectId || null,
      campaignId: insertTask.campaignId || null,
      dueDate: insertTask.dueDate || null,
      dueTime: insertTask.dueTime || null,
      
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
    return this.tasks.delete(id);
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
      trigger: workflowData.trigger,
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
    return Array.from(this.automationTriggers.values());
  }

  async getAutomationTrigger(id: string): Promise<AutomationTrigger | undefined> {
    return this.automationTriggers.get(id);
  }

  async getAutomationTriggersByCategory(category: string): Promise<AutomationTrigger[]> {
    return Array.from(this.automationTriggers.values()).filter(trigger => trigger.category === category);
  }

  async createAutomationTrigger(triggerData: InsertAutomationTrigger): Promise<AutomationTrigger> {
    const trigger: AutomationTrigger = {
      id: randomUUID(),
      name: triggerData.name,
      type: triggerData.type,
      description: triggerData.description || null,
      category: triggerData.category,
      configSchema: triggerData.configSchema || null,
      isActive: triggerData.isActive || true,
      createdAt: new Date(),
    };
    this.automationTriggers.set(trigger.id, trigger);
    return trigger;
  }

  async updateAutomationTrigger(id: string, triggerData: Partial<InsertAutomationTrigger>): Promise<AutomationTrigger | undefined> {
    const existing = this.automationTriggers.get(id);
    if (!existing) return undefined;
    
    const updated: AutomationTrigger = {
      ...existing,
      ...triggerData,
    };
    this.automationTriggers.set(id, updated);
    return updated;
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
}

export const storage = new MemStorage();
