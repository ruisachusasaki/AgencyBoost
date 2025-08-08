import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClientSchema, insertProjectSchema, insertCampaignSchema, insertLeadSchema, 
  insertTaskSchema, insertInvoiceSchema, insertSocialMediaAccountSchema, 
  insertSocialMediaPostSchema, insertSocialMediaTemplateSchema, 
  insertSocialMediaAnalyticsSchema, insertWorkflowSchema, insertEnhancedTaskSchema,
  insertTaskCategorySchema, insertAutomationTriggerSchema, insertAutomationActionSchema,
  insertTemplateFolderSchema, insertEmailTemplateSchema, insertSmsTemplateSchema,
  insertStaffSchema, insertCustomFieldSchema, insertCustomFieldFolderSchema,
  insertTagSchema,
  users, businessProfile, customFields, customFieldFolders, staff, tags
} from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { db } from "./db";
import { eq, like, or, and, asc, desc, sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.get("/api/clients/:clientId/projects", async (req, res) => {
    try {
      const projects = await storage.getProjectsByClient(req.params.clientId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(req.params.id, validatedData);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCampaign(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Lead routes
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(req.params.id, validatedData);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLead(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, validatedData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInvoice(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Social Media Account routes
  app.get("/api/social-media-accounts", async (req, res) => {
    try {
      const accounts = await storage.getSocialMediaAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch social media accounts" });
    }
  });

  app.get("/api/social-media-accounts/:id", async (req, res) => {
    try {
      const account = await storage.getSocialMediaAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "Social media account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch social media account" });
    }
  });

  app.get("/api/clients/:clientId/social-media-accounts", async (req, res) => {
    try {
      const accounts = await storage.getSocialMediaAccountsByClient(req.params.clientId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client social media accounts" });
    }
  });

  app.post("/api/social-media-accounts", async (req, res) => {
    try {
      const validatedData = insertSocialMediaAccountSchema.parse(req.body);
      const account = await storage.createSocialMediaAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create social media account" });
    }
  });

  app.put("/api/social-media-accounts/:id", async (req, res) => {
    try {
      const validatedData = insertSocialMediaAccountSchema.partial().parse(req.body);
      const account = await storage.updateSocialMediaAccount(req.params.id, validatedData);
      if (!account) {
        return res.status(404).json({ message: "Social media account not found" });
      }
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update social media account" });
    }
  });

  app.delete("/api/social-media-accounts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSocialMediaAccount(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Social media account not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete social media account" });
    }
  });

  // Social Media Post routes
  app.get("/api/social-media-posts", async (req, res) => {
    try {
      const posts = await storage.getSocialMediaPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch social media posts" });
    }
  });

  app.get("/api/social-media-posts/:id", async (req, res) => {
    try {
      const post = await storage.getSocialMediaPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Social media post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch social media post" });
    }
  });

  app.get("/api/clients/:clientId/social-media-posts", async (req, res) => {
    try {
      const posts = await storage.getSocialMediaPostsByClient(req.params.clientId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client social media posts" });
    }
  });

  app.post("/api/social-media-posts", async (req, res) => {
    try {
      const validatedData = insertSocialMediaPostSchema.parse(req.body);
      const post = await storage.createSocialMediaPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create social media post" });
    }
  });

  app.put("/api/social-media-posts/:id", async (req, res) => {
    try {
      const validatedData = insertSocialMediaPostSchema.partial().parse(req.body);
      const post = await storage.updateSocialMediaPost(req.params.id, validatedData);
      if (!post) {
        return res.status(404).json({ message: "Social media post not found" });
      }
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update social media post" });
    }
  });

  app.delete("/api/social-media-posts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSocialMediaPost(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Social media post not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete social media post" });
    }
  });

  // Social Media Template routes
  app.get("/api/social-media-templates", async (req, res) => {
    try {
      const templates = await storage.getSocialMediaTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch social media templates" });
    }
  });

  app.get("/api/clients/:clientId/social-media-templates", async (req, res) => {
    try {
      const templates = await storage.getSocialMediaTemplatesByClient(req.params.clientId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client social media templates" });
    }
  });

  app.post("/api/social-media-templates", async (req, res) => {
    try {
      const validatedData = insertSocialMediaTemplateSchema.parse(req.body);
      const template = await storage.createSocialMediaTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create social media template" });
    }
  });

  // Template Folder routes
  app.get("/api/template-folders", async (req, res) => {
    try {
      const folders = await storage.getTemplateFolders();
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template folders" });
    }
  });

  app.post("/api/template-folders", async (req, res) => {
    try {
      const validatedData = insertTemplateFolderSchema.parse(req.body);
      const folder = await storage.createTemplateFolder(validatedData);
      res.status(201).json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template folder" });
    }
  });

  // Email Template routes
  app.get("/api/email-templates", async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.post("/api/email-templates", async (req, res) => {
    try {
      const validatedData = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  app.patch("/api/email-templates/:id", async (req, res) => {
    try {
      const validatedData = insertEmailTemplateSchema.partial().parse(req.body);
      const template = await storage.updateEmailTemplate(req.params.id, validatedData);
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  app.delete("/api/email-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEmailTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Email template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email template" });
    }
  });

  // SMS Template routes  
  app.get("/api/sms-templates", async (req, res) => {
    try {
      const templates = await storage.getSmsTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SMS templates" });
    }
  });

  app.post("/api/sms-templates", async (req, res) => {
    try {
      const validatedData = insertSmsTemplateSchema.parse(req.body);
      const template = await storage.createSmsTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create SMS template" });
    }
  });

  app.patch("/api/sms-templates/:id", async (req, res) => {
    try {
      const validatedData = insertSmsTemplateSchema.partial().parse(req.body);
      const template = await storage.updateSmsTemplate(req.params.id, validatedData);
      if (!template) {
        return res.status(404).json({ message: "SMS template not found" });
      }
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update SMS template" });
    }
  });

  app.delete("/api/sms-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSmsTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "SMS template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete SMS template" });
    }
  });

  // Custom Fields
  app.get("/api/custom-fields", async (req, res) => {
    try {
      const { search } = req.query;
      
      let fields;
      if (search && typeof search === 'string') {
        fields = await db.select()
          .from(customFields)
          .where(
            or(
              like(customFields.name, `%${search}%`),
              like(customFields.type, `%${search}%`)
            )
          )
          .orderBy(asc(customFields.order));
      } else {
        fields = await db.select()
          .from(customFields)
          .orderBy(asc(customFields.order));
      }
      
      res.json(fields);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/custom-fields", async (req, res) => {
    try {
      const result = insertCustomFieldSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid custom field data",
          details: result.error.issues
        });
      }

      // Get the maximum order value and increment it
      const maxOrderResult = await db.select({ maxOrder: sql<number>`COALESCE(MAX(${customFields.order}), 0)` })
        .from(customFields);
      const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;

      const [newField] = await db.insert(customFields).values({
        ...result.data,
        order: nextOrder
      }).returning();

      res.status(201).json(newField);
    } catch (error) {
      console.error("Error creating custom field:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/custom-fields/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCustomFieldSchema.partial().parse(req.body);
      
      const [updatedField] = await db
        .update(customFields)
        .set(validatedData)
        .where(eq(customFields.id, id))
        .returning();

      if (!updatedField) {
        return res.status(404).json({ message: "Custom field not found" });
      }

      res.json(updatedField);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating custom field:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/custom-fields/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [deletedField] = await db
        .delete(customFields)
        .where(eq(customFields.id, id))
        .returning();

      if (!deletedField) {
        return res.status(404).json({ message: "Custom field not found" });
      }

      res.json({ message: "Custom field deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom field:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Tags routes
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.get("/api/tags/:id", async (req, res) => {
    try {
      const tag = await storage.getTag(req.params.id);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      console.error("Error fetching tag:", error);
      res.status(500).json({ message: "Failed to fetch tag" });
    }
  });

  app.post("/api/tags", async (req, res) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  app.put("/api/tags/:id", async (req, res) => {
    try {
      const validatedData = insertTagSchema.partial().parse(req.body);
      const tag = await storage.updateTag(req.params.id, validatedData);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Failed to update tag" });
    }
  });

  app.delete("/api/tags/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTag(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Workflow routes
  app.get("/api/workflows", async (req, res) => {
    try {
      const { clientId, category } = req.query;
      let workflows;
      
      if (clientId) {
        workflows = await storage.getWorkflowsByClient(clientId as string);
      } else if (category) {
        workflows = await storage.getWorkflowsByCategory(category as string);
      } else {
        workflows = await storage.getWorkflows();
      }
      
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(validatedData);
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.partial().parse(req.body);
      const workflow = await storage.updateWorkflow(req.params.id, validatedData);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkflow(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  // Enhanced Task routes
  app.get("/api/enhanced-tasks", async (req, res) => {
    try {
      const { clientId, projectId, assignedTo, workflowId } = req.query;
      let tasks;
      
      if (clientId) {
        tasks = await storage.getEnhancedTasksByClient(clientId as string);
      } else if (projectId) {
        tasks = await storage.getEnhancedTasksByProject(projectId as string);
      } else if (assignedTo) {
        tasks = await storage.getEnhancedTasksByAssignee(assignedTo as string);
      } else if (workflowId) {
        tasks = await storage.getEnhancedTasksByWorkflow(workflowId as string);
      } else {
        tasks = await storage.getEnhancedTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enhanced tasks" });
    }
  });

  app.get("/api/enhanced-tasks/:id", async (req, res) => {
    try {
      const task = await storage.getEnhancedTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Enhanced task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enhanced task" });
    }
  });

  app.post("/api/enhanced-tasks", async (req, res) => {
    try {
      const validatedData = insertEnhancedTaskSchema.parse(req.body);
      const task = await storage.createEnhancedTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create enhanced task" });
    }
  });

  app.put("/api/enhanced-tasks/:id", async (req, res) => {
    try {
      const validatedData = insertEnhancedTaskSchema.partial().parse(req.body);
      const task = await storage.updateEnhancedTask(req.params.id, validatedData);
      if (!task) {
        return res.status(404).json({ message: "Enhanced task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update enhanced task" });
    }
  });

  app.delete("/api/enhanced-tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEnhancedTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Enhanced task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete enhanced task" });
    }
  });

  // Task Categories routes
  app.get("/api/task-categories", async (req, res) => {
    try {
      const categories = await storage.getTaskCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task categories" });
    }
  });

  app.post("/api/task-categories", async (req, res) => {
    try {
      const validatedData = insertTaskCategorySchema.parse(req.body);
      const category = await storage.createTaskCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task category" });
    }
  });

  // Automation Triggers routes
  app.get("/api/automation-triggers", async (req, res) => {
    try {
      const { category } = req.query;
      let triggers;
      
      if (category) {
        triggers = await storage.getAutomationTriggersByCategory(category as string);
      } else {
        triggers = await storage.getAutomationTriggers();
      }
      
      res.json(triggers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch automation triggers" });
    }
  });

  app.post("/api/automation-triggers", async (req, res) => {
    try {
      const validatedData = insertAutomationTriggerSchema.parse(req.body);
      const trigger = await storage.createAutomationTrigger(validatedData);
      res.status(201).json(trigger);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create automation trigger" });
    }
  });

  // Automation Actions routes
  app.get("/api/automation-actions", async (req, res) => {
    try {
      const { category } = req.query;
      let actions;
      
      if (category) {
        actions = await storage.getAutomationActionsByCategory(category as string);
      } else {
        actions = await storage.getAutomationActions();
      }
      
      res.json(actions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch automation actions" });
    }
  });

  app.post("/api/automation-actions", async (req, res) => {
    try {
      const validatedData = insertAutomationActionSchema.parse(req.body);
      const action = await storage.createAutomationAction(validatedData);
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create automation action" });
    }
  });

  // Object Storage endpoints for image uploads


  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      const { ObjectNotFoundError } = await import("./objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });



  // Staff/Users Management API
  app.get("/api/staff", async (req, res) => {
    try {
      const { search } = req.query;
      let query = db.select().from(staff).where(eq(staff.isActive, true));
      
      if (search && typeof search === 'string') {
        query = db.select().from(staff)
          .where(
            and(
              eq(staff.isActive, true),
              or(
                like(sql`${staff.firstName} || ' ' || ${staff.lastName}`, `%${search}%`),
                like(staff.email, `%${search}%`),
                like(staff.userType, `%${search}%`)
              )
            )
          );
      }
      
      const staffMembers = await query.orderBy(asc(staff.firstName));
      res.json(staffMembers);
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const [staffMember] = await db.select().from(staff).where(eq(staff.id, req.params.id));
      
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      res.json(staffMember);
    } catch (error) {
      console.error('Error fetching staff member:', error);
      res.status(500).json({ message: "Failed to fetch staff member" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const insertData = insertStaffSchema.parse(req.body);
      const [newStaff] = await db.insert(staff).values(insertData).returning();
      res.status(201).json(newStaff);
    } catch (error: any) {
      console.error('Error creating staff:', error);
      if (error.code === '23505') {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    try {
      const [updatedStaff] = await db
        .update(staff)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(staff.id, req.params.id))
        .returning();
      
      if (!updatedStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      res.json(updatedStaff);
    } catch (error) {
      console.error('Error updating staff:', error);
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const [deletedStaff] = await db
        .update(staff)
        .set({ isActive: false })
        .where(eq(staff.id, req.params.id))
        .returning();
      
      if (!deletedStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting staff:', error);
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // Object storage routes for profile images
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/profile-images", async (req, res) => {
    console.log("Profile image request body:", req.body);
    if (!req.body.profileImageURL) {
      return res.status(400).json({ error: "profileImageURL is required" });
    }

    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.profileImageURL,
      );
      console.log("Normalized object path:", objectPath);

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting profile image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Business Profile API
  app.get("/api/business-profile", async (req, res) => {
    try {
      const profile = await db.select().from(businessProfile).limit(1);
      
      if (profile.length === 0) {
        const defaultProfile = await db.insert(businessProfile).values({
          companyName: "Your Company Name",
          businessType: "",
          website: "",
          phone: "",
          email: "",
          timezone: "America/New_York",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          country: "United States"
        }).returning();
        
        return res.json(defaultProfile[0]);
      }
      
      res.json(profile[0]);
    } catch (error) {
      console.error('Error fetching business profile:', error);
      res.status(500).json({ message: "Failed to fetch business profile" });
    }
  });

  app.put("/api/business-profile", async (req, res) => {
    try {
      const profileData = req.body;
      const existingProfile = await db.select().from(businessProfile).limit(1);
      
      if (existingProfile.length === 0) {
        const newProfile = await db.insert(businessProfile).values({
          ...profileData,
          updatedAt: new Date()
        }).returning();
        
        return res.json(newProfile[0]);
      } else {
        const updatedProfile = await db.update(businessProfile)
          .set({
            ...profileData,
            updatedAt: new Date()
          })
          .where(eq(businessProfile.id, existingProfile[0].id))
          .returning();
        
        return res.json(updatedProfile[0]);
      }
    } catch (error) {
      console.error('Error updating business profile:', error);
      res.status(500).json({ message: "Failed to update business profile" });
    }
  });

  // Custom Field Folders API with search
  app.get("/api/custom-field-folders", async (req, res) => {
    try {
      const { search } = req.query;
      
      let folders;
      if (search && typeof search === 'string') {
        folders = await db.select({
          id: customFieldFolders.id,
          name: customFieldFolders.name,
          order: customFieldFolders.order,
          isDefault: customFieldFolders.isDefault,
          canReorder: customFieldFolders.canReorder,
          createdAt: customFieldFolders.createdAt,
          fieldCount: sql<number>`(SELECT COUNT(*) FROM ${customFields} WHERE ${customFields.folderId} = ${customFieldFolders.id})`
        })
        .from(customFieldFolders)
        .where(like(customFieldFolders.name, `%${search}%`))
        .orderBy(asc(customFieldFolders.order));
      } else {
        folders = await db.select({
          id: customFieldFolders.id,
          name: customFieldFolders.name,
          order: customFieldFolders.order,
          isDefault: customFieldFolders.isDefault,
          canReorder: customFieldFolders.canReorder,
          createdAt: customFieldFolders.createdAt,
          fieldCount: sql<number>`(SELECT COUNT(*) FROM ${customFields} WHERE ${customFields.folderId} = ${customFieldFolders.id})`
        })
        .from(customFieldFolders)
        .orderBy(asc(customFieldFolders.order));
      }
      
      res.json(folders);
    } catch (error) {
      console.error('Error fetching custom field folders:', error);
      res.status(500).json({ message: "Failed to fetch custom field folders" });
    }
  });

  app.post("/api/custom-field-folders", async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Folder name is required" });
      }
      
      const maxOrderResult = await db.select({ maxOrder: sql<number>`COALESCE(MAX(${customFieldFolders.order}), 0)` })
        .from(customFieldFolders);
      const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;
      
      const newFolder = await db.insert(customFieldFolders).values({
        name: name.trim(),
        order: nextOrder,
        isDefault: false,
        canReorder: true
      }).returning();
      
      res.status(201).json(newFolder[0]);
    } catch (error) {
      console.error('Error creating custom field folder:', error);
      res.status(500).json({ message: "Failed to create custom field folder" });
    }
  });

  app.put("/api/custom-field-folders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCustomFieldFolderSchema.partial().parse(req.body);
      
      const [updatedFolder] = await db
        .update(customFieldFolders)
        .set(validatedData)
        .where(eq(customFieldFolders.id, id))
        .returning();

      if (!updatedFolder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      res.json(updatedFolder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error updating custom field folder:', error);
      res.status(500).json({ message: "Failed to update custom field folder" });
    }
  });

  app.delete("/api/custom-field-folders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // First, update any custom fields that belong to this folder to have no folder
      await db
        .update(customFields)
        .set({ folderId: null })
        .where(eq(customFields.folderId, id));
      
      // Then delete the folder
      const [deletedFolder] = await db
        .delete(customFieldFolders)
        .where(eq(customFieldFolders.id, id))
        .returning();

      if (!deletedFolder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      res.json({ message: "Folder deleted successfully" });
    } catch (error) {
      console.error('Error deleting custom field folder:', error);
      res.status(500).json({ message: "Failed to delete custom field folder" });
    }
  });

  // Reorder custom field folders
  app.put("/api/custom-field-folders/reorder", async (req, res) => {
    try {
      const { folderIds } = req.body;
      
      if (!Array.isArray(folderIds)) {
        return res.status(400).json({ message: "folderIds must be an array" });
      }
      
      // Update the order for each folder
      const updatePromises = folderIds.map(async (folderId: string, index: number) => {
        await db.update(customFieldFolders)
          .set({ order: index + 1 })
          .where(eq(customFieldFolders.id, folderId));
      });
      
      await Promise.all(updatePromises);
      
      res.json({ message: "Folder order updated successfully" });
    } catch (error) {
      console.error('Error reordering custom field folders:', error);
      res.status(500).json({ message: "Failed to reorder folders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
