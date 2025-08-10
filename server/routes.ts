import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import { storage } from "./storage";
import { 
  insertClientSchema, insertProjectSchema, insertCampaignSchema, insertLeadSchema, 
  insertTaskSchema, insertInvoiceSchema, insertSocialMediaAccountSchema, 
  insertSocialMediaPostSchema, insertSocialMediaTemplateSchema, 
  insertSocialMediaAnalyticsSchema, insertWorkflowSchema, insertEnhancedTaskSchema,
  insertTaskCategorySchema, insertAutomationTriggerSchema, insertAutomationActionSchema,
  insertTemplateFolderSchema, insertEmailTemplateSchema, insertSmsTemplateSchema,
  insertStaffSchema, insertCustomFieldSchema, insertCustomFieldFolderSchema,
  insertTagSchema, insertProductSchema, insertProductCategorySchema, insertAuditLogSchema,
  insertRoleSchema, insertPermissionSchema, insertUserRoleSchema,
  users, businessProfile, customFields, customFieldFolders, staff, tags, products, productCategories, auditLogs,
  roles, permissions, userRoles
} from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { db } from "./db";
import { eq, like, or, and, asc, desc, sql } from "drizzle-orm";

// Helper function to create audit logs
async function createAuditLog(
  action: "created" | "updated" | "deleted",
  entityType: string,
  entityId: string,
  entityName: string,
  userId: string = "e56be30d-c086-446c-ada4-7ccef37ad7fb", // Default to first staff member, in real app get from session
  details: string,
  oldValues?: any,
  newValues?: any,
  req?: any
) {
  try {
    await db.insert(auditLogs).values({
      action,
      entityType,
      entityId,
      entityName,
      userId,
      details,
      oldValues: oldValues ? oldValues : null,
      newValues: newValues ? newValues : null,
      ipAddress: req?.ip || req?.connection?.remoteAddress || "127.0.0.1",
      userAgent: req?.get("User-Agent") || "Unknown",
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't fail the main operation if audit logging fails
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });
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
      
      // Log the creation
      await createAuditLog(
        "created",
        "contact",
        client.id,
        client.name || client.email,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `New contact record created with email: ${client.email}`,
        null,
        { name: client.name, email: client.email, company: client.company },
        req
      );
      
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
      // Get the old client data first for audit logging
      const oldClient = await storage.getClient(req.params.id);
      if (!oldClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Determine what changed for audit logging
      const changes = [];
      if (validatedData.name && validatedData.name !== oldClient.name) {
        changes.push(`name from "${oldClient.name}" to "${validatedData.name}"`);
      }
      if (validatedData.email && validatedData.email !== oldClient.email) {
        changes.push(`email from "${oldClient.email}" to "${validatedData.email}"`);
      }
      if (validatedData.phone && validatedData.phone !== oldClient.phone) {
        changes.push(`phone from "${oldClient.phone}" to "${validatedData.phone}"`);
      }
      
      // Log the update
      await createAuditLog(
        "updated",
        "contact",
        client.id,
        client.name || client.email,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        changes.length > 0 ? `Updated ${changes.join(", ")}` : "Contact record updated",
        { name: oldClient.name, email: oldClient.email, phone: oldClient.phone },
        { name: client.name, email: client.email, phone: client.phone },
        req
      );
      
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
      // Get client data before deletion for audit logging
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const deleted = await storage.deleteClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Log the deletion
      await createAuditLog(
        "deleted",
        "contact",
        req.params.id,
        client.name || client.email,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Contact record permanently deleted - ${client.name} (${client.email})`,
        { name: client.name, email: client.email, company: client.company },
        null,
        req
      );
      
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

  // Reorder custom fields within a folder
  app.put("/api/custom-fields/reorder", async (req, res) => {
    try {
      const { fieldIds } = req.body;
      
      if (!Array.isArray(fieldIds)) {
        return res.status(400).json({ message: "fieldIds must be an array" });
      }
      
      // Update the order for each field sequentially
      for (let i = 0; i < fieldIds.length; i++) {
        const fieldId = fieldIds[i];
        const newOrder = i + 1;
        
        await db.update(customFields)
          .set({ order: newOrder })
          .where(eq(customFields.id, fieldId));
      }
      
      res.json({ message: "Field order updated successfully" });
    } catch (error) {
      console.error('Error reordering custom fields:', error);
      res.status(500).json({ message: "Failed to reorder fields" });
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

  // Get individual custom field folder by ID
  app.get("/api/custom-field-folders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [folder] = await db.select().from(customFieldFolders).where(eq(customFieldFolders.id, id));
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.json(folder);
    } catch (error) {
      console.error('Error fetching custom field folder:', error);
      res.status(500).json({ message: "Failed to fetch custom field folder" });
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

  // Reorder custom field folders (MUST be before /:id route)
  app.put("/api/custom-field-folders/reorder", async (req, res) => {
    try {
      const { folderIds } = req.body;
      
      if (!Array.isArray(folderIds)) {
        return res.status(400).json({ message: "folderIds must be an array" });
      }
      
      // Update the order for each folder sequentially
      for (let i = 0; i < folderIds.length; i++) {
        const folderId = folderIds[i];
        const newOrder = i + 1;
        
        await db.update(customFieldFolders)
          .set({ order: newOrder })
          .where(eq(customFieldFolders.id, folderId));
      }
      
      res.json({ message: "Folder order updated successfully" });
    } catch (error) {
      console.error('Error reordering custom field folders:', error);
      res.status(500).json({ message: "Failed to reorder folders" });
    }
  });

  app.patch("/api/custom-field-folders/:id", async (req, res) => {
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

  // Product Categories API
  app.get("/api/product-categories", async (req, res) => {
    try {
      const categories = await db.select().from(productCategories).orderBy(asc(productCategories.name));
      res.json(categories);
    } catch (error) {
      console.error('Error fetching product categories:', error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  app.post("/api/product-categories", async (req, res) => {
    try {
      const validatedData = insertProductCategorySchema.parse(req.body);
      const [category] = await db.insert(productCategories).values(validatedData).returning();
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error creating product category:', error);
      res.status(500).json({ message: "Failed to create product category" });
    }
  });

  app.put("/api/product-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertProductCategorySchema.partial().parse(req.body);
      
      const [updatedCategory] = await db
        .update(productCategories)
        .set(validatedData)
        .where(eq(productCategories.id, id))
        .returning();

      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error updating product category:', error);
      res.status(500).json({ message: "Failed to update product category" });
    }
  });

  app.delete("/api/product-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if any products are using this category
      const productsUsingCategory = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.categoryId, id));
      
      const count = productsUsingCategory[0]?.count || 0;
      
      if (count > 0) {
        return res.status(400).json({ 
          message: `Cannot delete category. ${count} product(s) are currently using this category. Please reassign those products to a different category first.` 
        });
      }
      
      const [deletedCategory] = await db
        .delete(productCategories)
        .where(eq(productCategories.id, id))
        .returning();

      if (!deletedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error('Error deleting product category:', error);
      res.status(500).json({ message: "Failed to delete product category" });
    }
  });

  // Get category reference for CSV import/export
  app.get("/api/categories-reference", async (req, res) => {
    try {
      const categories = await db.select({
        id: productCategories.id,
        name: productCategories.name
      }).from(productCategories).orderBy(asc(productCategories.name));
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories reference:', error);
      res.status(500).json({ message: "Failed to fetch categories reference" });
    }
  });

  // Products API with search and filtering
  app.get("/api/products", async (req, res) => {
    try {
      const { search, category, status } = req.query;
      
      const conditions = [];
      
      if (search && typeof search === 'string') {
        conditions.push(
          or(
            like(products.name, `%${search}%`),
            like(products.description, `%${search}%`)
          )
        );
      }
      
      if (category && typeof category === 'string') {
        conditions.push(eq(products.categoryId, category));
      }
      
      if (status && typeof status === 'string') {
        conditions.push(eq(products.status, status));
      }

      let baseQuery = db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        cost: products.cost,
        type: products.type,
        categoryId: products.categoryId,
        status: products.status,
        usageCount: products.usageCount,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: productCategories.name
      })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id));
      
      const result = conditions.length > 0 
        ? await baseQuery.where(and(...conditions)).orderBy(asc(products.name))
        : await baseQuery.orderBy(asc(products.name));
      res.json(result);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [product] = await db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        cost: products.cost,
        type: products.type,
        categoryId: products.categoryId,
        status: products.status,
        usageCount: products.usageCount,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: productCategories.name
      })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(eq(products.id, id));
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const [product] = await db.insert(products).values(validatedData).returning();
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error creating product:', error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // CSV Import endpoint for products
  app.post("/api/products/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvData: any[] = [];
      const errors: string[] = [];
      let imported = 0;

      return new Promise((resolve, reject) => {
        const stream = Readable.from(req.file!.buffer);
        
        stream
          .pipe(csv())
          .on('data', (row) => {
            csvData.push(row);
          })
          .on('end', async () => {
            try {
              // Process each row
              for (let i = 0; i < csvData.length; i++) {
                const row = csvData[i];
                const rowNum = i + 2; // +2 because CSV starts from row 1 and we skip header
                
                try {
                  // Validate and clean the data
                  let categoryId = null;
                  
                  // Handle category: prefer categoryId, but also support categoryName
                  if (row.categoryId?.trim()) {
                    categoryId = row.categoryId.trim();
                  } else if (row.categoryName?.trim()) {
                    // Look up category by name
                    const categoryByName = await db.select().from(productCategories).where(eq(productCategories.name, row.categoryName.trim())).limit(1);
                    if (categoryByName.length > 0) {
                      categoryId = categoryByName[0].id;
                    } else {
                      errors.push(`Row ${rowNum}: Category name '${row.categoryName.trim()}' not found`);
                      continue;
                    }
                  }
                  
                  // Convert all values to proper types for the schema
                  const productData = {
                    name: String(row.name || '').trim(),
                    description: row.description ? String(row.description).trim() : null,
                    price: String(row.price || '0'),
                    cost: row.cost ? String(row.cost) : null,
                    type: String(row.type || 'one_time').trim(),
                    categoryId: categoryId,
                    status: String(row.status || 'active').trim()
                  };

                  // Validate required fields
                  if (!productData.name) {
                    errors.push(`Row ${rowNum}: Product name is required`);
                    continue;
                  }

                  if (!productData.price || parseFloat(productData.price) <= 0) {
                    errors.push(`Row ${rowNum}: Valid price is required`);
                    continue;
                  }

                  // Validate type
                  if (!['one_time', 'recurring'].includes(productData.type)) {
                    errors.push(`Row ${rowNum}: Type must be 'one_time' or 'recurring'`);
                    continue;
                  }

                  // Validate status
                  if (!['active', 'inactive'].includes(productData.status)) {
                    errors.push(`Row ${rowNum}: Status must be 'active' or 'inactive'`);
                    continue;
                  }

                  // Validate categoryId if provided
                  if (productData.categoryId) {
                    const categoryExists = await db.select().from(productCategories).where(eq(productCategories.id, productData.categoryId)).limit(1);
                    if (categoryExists.length === 0) {
                      errors.push(`Row ${rowNum}: Category ID '${productData.categoryId}' does not exist`);
                      continue;
                    }
                  }

                  // Validate the data with Zod schema
                  const validatedData = insertProductSchema.parse(productData);
                  
                  // Insert the product
                  await db.insert(products).values(validatedData);
                  imported++;
                  
                } catch (error) {
                  if (error instanceof z.ZodError) {
                    errors.push(`Row ${rowNum}: ${error.errors.map(e => e.message).join(', ')}`);
                  } else {
                    errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }
              }

              res.json({
                imported,
                total: csvData.length,
                errors: errors.length,
                errorDetails: errors.slice(0, 10), // Limit error details to first 10
                message: `Successfully imported ${imported} out of ${csvData.length} products${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
              });
              resolve(undefined);
            } catch (error) {
              console.error('Error processing CSV:', error);
              reject(error);
            }
          })
          .on('error', (error) => {
            console.error('Error reading CSV:', error);
            reject(error);
          });
      });

    } catch (error) {
      console.error('Error importing products:', error);
      res.status(500).json({ message: "Failed to import products", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertProductSchema.partial().parse(req.body);
      
      const [updatedProduct] = await db
        .update(products)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error updating product:', error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [deletedProduct] = await db
        .delete(products)
        .where(eq(products.id, id))
        .returning();

      if (!deletedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Audit Logs routes (Admin only)
  app.get("/api/audit-logs", async (req, res) => {
    try {
      // In a real app, check if user is admin
      // For now, return all logs from the database
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/:id", async (req, res) => {
    try {
      const log = await db.select().from(auditLogs).where(eq(auditLogs.id, req.params.id)).limit(1);
      if (!log.length) {
        return res.status(404).json({ message: "Audit log not found" });
      }
      res.json(log[0]);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });

  app.get("/api/audit-logs/entity/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const logs = await db.select().from(auditLogs)
        .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
        .orderBy(desc(auditLogs.timestamp));
      res.json(logs);
    } catch (error) {
      console.error('Error fetching entity audit logs:', error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/user/:userId", async (req, res) => {
    try {
      const logs = await db.select().from(auditLogs)
        .where(eq(auditLogs.userId, req.params.userId))
        .orderBy(desc(auditLogs.timestamp));
      res.json(logs);
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.post("/api/audit-logs", async (req, res) => {
    try {
      const validatedData = insertAuditLogSchema.parse(req.body);
      const [newLog] = await db.insert(auditLogs).values(validatedData).returning();
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error creating audit log:', error);
      res.status(500).json({ message: "Failed to create audit log" });
    }
  });

  // Roles API Routes
  app.get("/api/roles", async (req, res) => {
    try {
      const rolesWithPermissions = await db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
          isSystem: roles.isSystem,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt,
          userCount: sql<number>`CAST(COUNT(${userRoles.userId}) AS INTEGER)`,
        })
        .from(roles)
        .leftJoin(userRoles, eq(roles.id, userRoles.roleId))
        .groupBy(roles.id, roles.name, roles.description, roles.isSystem, roles.createdAt, roles.updatedAt)
        .orderBy(asc(roles.name));

      // Get permissions for each role
      const rolesWithPermissionsData = await Promise.all(
        rolesWithPermissions.map(async (role) => {
          const rolePermissions = await db
            .select()
            .from(permissions)
            .where(eq(permissions.roleId, role.id));
          
          return {
            ...role,
            permissions: rolePermissions
          };
        })
      );

      res.json(rolesWithPermissionsData);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const role = await db
        .select()
        .from(roles)
        .where(eq(roles.id, req.params.id))
        .limit(1);
      
      if (role.length === 0) {
        return res.status(404).json({ message: "Role not found" });
      }

      const rolePermissions = await db
        .select()
        .from(permissions)
        .where(eq(permissions.roleId, req.params.id));

      res.json({
        ...role[0],
        permissions: rolePermissions
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const { permissions: rolePermissions, ...roleData } = req.body;
      const validatedRoleData = insertRoleSchema.parse(roleData);
      
      // Create role
      const [newRole] = await db.insert(roles).values(validatedRoleData).returning();
      
      // Create permissions for the role
      if (rolePermissions && rolePermissions.length > 0) {
        const permissionsToInsert = rolePermissions.map((perm: any) => ({
          roleId: newRole.id,
          module: perm.module,
          canView: perm.canView || false,
          canCreate: perm.canCreate || false,
          canEdit: perm.canEdit || false,
          canDelete: perm.canDelete || false,
          canManage: perm.canManage || false,
        }));
        
        await db.insert(permissions).values(permissionsToInsert);
      }

      await createAuditLog(
        "created",
        "role",
        newRole.id,
        newRole.name,
        undefined,
        `Created new role: ${newRole.name}`,
        null,
        newRole,
        req
      );

      res.status(201).json(newRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error creating role:', error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.put("/api/roles/:id", async (req, res) => {
    try {
      const { permissions: rolePermissions, ...roleData } = req.body;
      
      // Get existing role for audit log
      const existingRole = await db
        .select()
        .from(roles)
        .where(eq(roles.id, req.params.id))
        .limit(1);
      
      if (existingRole.length === 0) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Update role
      const [updatedRole] = await db
        .update(roles)
        .set({ ...roleData, updatedAt: new Date() })
        .where(eq(roles.id, req.params.id))
        .returning();

      // Update permissions - delete existing and insert new ones
      await db.delete(permissions).where(eq(permissions.roleId, req.params.id));
      
      if (rolePermissions && rolePermissions.length > 0) {
        const permissionsToInsert = rolePermissions.map((perm: any) => ({
          roleId: req.params.id,
          module: perm.module,
          canView: perm.canView || false,
          canCreate: perm.canCreate || false,
          canEdit: perm.canEdit || false,
          canDelete: perm.canDelete || false,
          canManage: perm.canManage || false,
        }));
        
        await db.insert(permissions).values(permissionsToInsert);
      }

      await createAuditLog(
        "updated",
        "role",
        updatedRole.id,
        updatedRole.name,
        undefined,
        `Updated role: ${updatedRole.name}`,
        existingRole[0],
        updatedRole,
        req
      );

      res.json(updatedRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error updating role:', error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      // Check if role exists and is not a system role
      const role = await db
        .select()
        .from(roles)
        .where(eq(roles.id, req.params.id))
        .limit(1);
      
      if (role.length === 0) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (role[0].isSystem) {
        return res.status(400).json({ message: "Cannot delete system role" });
      }

      // Check if any users are assigned to this role
      const usersWithRole = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.roleId, req.params.id))
        .limit(1);
      
      if (usersWithRole.length > 0) {
        return res.status(400).json({ message: "Cannot delete role that is assigned to users" });
      }

      // Delete role (permissions will be deleted automatically due to cascade)
      await db.delete(roles).where(eq(roles.id, req.params.id));

      await createAuditLog(
        "deleted",
        "role",
        role[0].id,
        role[0].name,
        undefined,
        `Deleted role: ${role[0].name}`,
        role[0],
        null,
        req
      );

      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // User Roles API Routes
  app.get("/api/users/:userId/roles", async (req, res) => {
    try {
      const userRoleData = await db
        .select({
          roleId: userRoles.roleId,
          roleName: roles.name,
          roleDescription: roles.description,
          assignedAt: userRoles.assignedAt,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, req.params.userId));

      res.json(userRoleData);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      res.status(500).json({ message: "Failed to fetch user roles" });
    }
  });

  app.post("/api/users/:userId/roles", async (req, res) => {
    try {
      const { roleId, assignedBy } = req.body;
      const validatedData = insertUserRoleSchema.parse({
        userId: req.params.userId,
        roleId,
        assignedBy,
      });

      const [newUserRole] = await db.insert(userRoles).values(validatedData).returning();

      await createAuditLog(
        "created",
        "user_role",
        newUserRole.id,
        `User role assignment`,
        assignedBy,
        `Assigned role to user ${req.params.userId}`,
        null,
        newUserRole,
        req
      );

      res.status(201).json(newUserRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error assigning user role:', error);
      res.status(500).json({ message: "Failed to assign user role" });
    }
  });

  app.delete("/api/users/:userId/roles/:roleId", async (req, res) => {
    try {
      const result = await db
        .delete(userRoles)
        .where(and(
          eq(userRoles.userId, req.params.userId),
          eq(userRoles.roleId, req.params.roleId)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "User role assignment not found" });
      }

      await createAuditLog(
        "deleted",
        "user_role",
        result[0].id,
        "User role unassignment",
        undefined,
        `Removed role from user ${req.params.userId}`,
        result[0],
        null,
        req
      );

      res.json({ message: "User role removed successfully" });
    } catch (error) {
      console.error('Error removing user role:', error);
      res.status(500).json({ message: "Failed to remove user role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
