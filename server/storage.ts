import { type Client, type InsertClient, type Project, type InsertProject, type Campaign, type InsertCampaign, type Lead, type InsertLead, type Task, type InsertTask, type Invoice, type InsertInvoice } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private clients: Map<string, Client> = new Map();
  private projects: Map<string, Project> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private leads: Map<string, Lead> = new Map();
  private tasks: Map<string, Task> = new Map();
  private invoices: Map<string, Invoice> = new Map();

  constructor() {}

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
      industry: insertClient.industry || null,
      status: insertClient.status || "active",
      address: insertClient.address || null,
      city: insertClient.city || null,
      state: insertClient.state || null,
      website: insertClient.website || null,
      notes: insertClient.notes || null,
      tags: insertClient.tags || null,
      clientVertical: insertClient.clientVertical || null,
      contactOwner: insertClient.contactOwner || null,
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
}

export const storage = new MemStorage();
