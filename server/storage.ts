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
  type SocialMediaAnalytics, type InsertSocialMediaAnalytics
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

  constructor() {
    // Add sample data for testing
    this.addSampleData();
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
}

export const storage = new MemStorage();
