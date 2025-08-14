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
  insertRoleSchema, insertPermissionSchema, insertUserRoleSchema, insertNotificationSettingsSchema,
  insertProductBundleSchema, insertBundleProductSchema,
  insertClientNoteSchema, insertClientTaskSchema, insertClientAppointmentSchema,
  insertClientDocumentSchema, insertClientTransactionSchema,
  insertCalendarSchema, insertCalendarStaffSchema, insertCalendarAvailabilitySchema,
  insertCalendarAppointmentSchema, insertCustomFieldFileUploadSchema,
  users, businessProfile, customFields, customFieldFolders, staff, tags, products, productCategories, auditLogs,
  roles, permissions, userRoles, notificationSettings, clientProducts, clientBundles, productBundles, bundleProducts,
  clientNotes, clientTasks, clientAppointments, clientDocuments, clientTransactions,
  calendars, calendarStaff, calendarAvailability, calendarAppointments, customFieldFileUploads,
  forms, formFields, formSubmissions
} from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError, validateFileType, isForbiddenFileType, sanitizeFileName } from "./objectStorage";
import { db } from "./db";
import { eq, like, or, and, asc, desc, sql, inArray } from "drizzle-orm";
import { permissionAuditService } from "./permissionAuditService";
import { nanoid } from "nanoid";

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

// Permission checking function
async function hasPermission(userId: string, module: string, permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canManage'): Promise<boolean> {
  try {
    // For now, check if user is admin - in production this would check user roles from database
    const adminUserIds = ["e56be30d-c086-446c-ada4-7ccef37ad7fb"]; // Default admin user
    
    // Admin users have all permissions
    if (adminUserIds.includes(userId)) {
      return true;
    }
    
    // In a real implementation, this would:
    // 1. Query user roles from userRoles table
    // 2. Get permissions for those roles from permissions table
    // 3. Check if any role has the required permission for the module
    // For now, return false for non-admin users
    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy as string || "createdAt"; // default sort by creation date
      const sortOrder = req.query.sortOrder as string || "desc"; // default descending (newest first)
      
      // Add cache-busting headers for fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const result = await storage.getClientsWithPagination(limit, offset, sortBy, sortOrder);
      
      res.json({
        clients: result.clients,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasNext: page * limit < result.total,
          hasPrevious: page > 1
        }
      });
    } catch (error) {
      console.error("Error fetching clients:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      res.status(500).json({ message: "Failed to fetch clients", error: error instanceof Error ? error.message : String(error) });
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
      
      // Handle duplicate email constraint
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint "clients_email_unique"')) {
        return res.status(409).json({ 
          message: "A client with this email already exists", 
          error: "Email must be unique" 
        });
      }
      
      console.error("Error creating client:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create client", error: errorMessage });
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

      // Check for DND (Do Not Disturb) changes - CRITICAL for compliance
      const dndChanges = [];
      const dndDetails = [];
      
      if (validatedData.dndAll !== undefined && validatedData.dndAll !== oldClient.dndAll) {
        const status = validatedData.dndAll ? "ENABLED" : "DISABLED";
        const action = validatedData.dndAll ? "BLOCKED all communications" : "UNBLOCKED all communications";
        dndChanges.push(`DND All Channels ${status}`);
        dndDetails.push(`User ${action} for client ${client.name || client.email}`);
        changes.push(`DND All Channels ${status}`);
      }
      if (validatedData.dndEmail !== undefined && validatedData.dndEmail !== oldClient.dndEmail) {
        const status = validatedData.dndEmail ? "ENABLED" : "DISABLED";
        const action = validatedData.dndEmail ? "BLOCKED email communications" : "UNBLOCKED email communications";
        dndChanges.push(`Email DND ${status}`);
        dndDetails.push(`User ${action} for client ${client.name || client.email}`);
        changes.push(`Email DND ${status}`);
      }
      if (validatedData.dndSms !== undefined && validatedData.dndSms !== oldClient.dndSms) {
        const status = validatedData.dndSms ? "ENABLED" : "DISABLED";
        const action = validatedData.dndSms ? "BLOCKED SMS communications" : "UNBLOCKED SMS communications";
        dndChanges.push(`SMS DND ${status}`);
        dndDetails.push(`User ${action} for client ${client.name || client.email}`);
        changes.push(`SMS DND ${status}`);
      }
      if (validatedData.dndCalls !== undefined && validatedData.dndCalls !== oldClient.dndCalls) {
        const status = validatedData.dndCalls ? "ENABLED" : "DISABLED";
        const action = validatedData.dndCalls ? "BLOCKED call communications" : "UNBLOCKED call communications";
        dndChanges.push(`Calls DND ${status}`);
        dndDetails.push(`User ${action} for client ${client.name || client.email}`);
        changes.push(`Calls DND ${status}`);
      }

      // Create separate audit logs for DND changes due to their critical nature
      if (dndChanges.length > 0) {
        // Get current user - hardcoded for demo, in production get from session
        const currentUserId = "e56be30d-c086-446c-ada4-7ccef37ad7fb";
        
        // Get staff name for audit log
        const staffResult = await db.select().from(staff).where(eq(staff.id, currentUserId)).limit(1);
        const staffName = staffResult.length > 0 ? `${staffResult[0].firstName} ${staffResult[0].lastName}` : "System Admin";
        
        await createAuditLog(
          "updated",
          "dnd_settings",
          client.id,
          client.name || client.email,
          currentUserId,
          `CRITICAL DND CHANGE by ${staffName}: ${dndDetails.join(". ")}. Summary: ${dndChanges.join(", ")}`,
          {
            dndAll: oldClient.dndAll,
            dndEmail: oldClient.dndEmail,
            dndSms: oldClient.dndSms,
            dndCalls: oldClient.dndCalls
          },
          {
            dndAll: client.dndAll,
            dndEmail: client.dndEmail,
            dndSms: client.dndSms,
            dndCalls: client.dndCalls
          },
          req
        );

        // Also create individual audit logs for each DND change for maximum traceability
        for (const detail of dndDetails) {
          await createAuditLog(
            "updated",
            "communication_block",
            client.id,
            client.name || client.email,
            currentUserId,
            `${detail} - Action performed by ${staffName}`,
            null,
            null,
            req
          );
        }
      }
      
      // Log the general update
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

  // Import clients from CSV
  app.post("/api/clients/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
        return res.status(400).json({ message: "File must be a CSV" });
      }

      const csvData: any[] = [];
      const stream = Readable.from(req.file.buffer.toString());
      
      return new Promise((resolve) => {
        stream
          .pipe(csv())
          .on('data', (data) => csvData.push(data))
          .on('end', async () => {
            try {
              let imported = 0;
              let errors = 0;
              const errorDetails: string[] = [];

              for (const row of csvData) {
                try {
                  // Map CSV columns to client fields
                  const clientData = {
                    name: row.name || row.Name || `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
                    email: row.email || row.Email,
                    phone: row.phone || row.Phone,
                    company: row.company || row.Company || row['Business Name'],
                    status: row.status || row.Status || 'active',
                    contactOwner: row.contactOwner || "e56be30d-c086-446c-ada4-7ccef37ad7fb",
                    address: row.address || row.Address,
                    city: row.city || row.City,
                    state: row.state || row.State,
                    zipCode: row.zipCode || row['Zip Code'],
                    website: row.website || row.Website,
                    notes: row.notes || row.Notes,
                    clientVertical: row.clientVertical || row['Client Vertical']
                  };

                  // Validate required fields
                  if (!clientData.email) {
                    errorDetails.push(`Row ${imported + errors + 1}: Email is required`);
                    errors++;
                    continue;
                  }

                  const validatedData = insertClientSchema.parse(clientData);
                  await storage.createClient(validatedData);
                  imported++;

                  // Log the import for audit
                  await createAuditLog(
                    "created",
                    "contact",
                    "bulk-import",
                    validatedData.name || validatedData.email,
                    "e56be30d-c086-446c-ada4-7ccef37ad7fb",
                    "Contact imported from CSV",
                    null,
                    validatedData,
                    req
                  );
                } catch (error) {
                  errors++;
                  if (error instanceof Error) {
                    errorDetails.push(`Row ${imported + errors}: ${error.message}`);
                  }
                }
              }

              resolve(res.json({
                imported,
                errors,
                total: csvData.length,
                errorDetails: errorDetails.slice(0, 10) // Limit error details
              }));
            } catch (error) {
              resolve(res.status(500).json({ message: "Failed to process CSV data", error: error instanceof Error ? error.message : "Unknown error" }));
            }
          })
          .on('error', (error) => {
            resolve(res.status(500).json({ message: "Failed to parse CSV", error: error.message }));
          });
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to import clients", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Export clients to CSV
  app.get("/api/clients/export", async (req, res) => {
    try {
      const clients = await storage.getAllClientsForExport();
      
      if (clients.length === 0) {
        return res.status(404).json({ message: "No clients to export" });
      }

      // Prepare CSV headers
      const csvHeaders = [
        'Name', 'Email', 'Phone', 'Company', 'Status', 'Address', 'City', 
        'State', 'Zip Code', 'Website', 'Notes', 'Client Vertical', 'Created Date'
      ];

      // Prepare CSV data
      const csvData = clients.map(client => [
        client.name || '',
        client.email || '',
        client.phone || '',
        client.company || '',
        client.status || '',
        client.address || '',
        client.city || '',
        client.state || '',
        client.zipCode || '',
        client.website || '',
        client.notes || '',
        client.clientVertical || '',
        client.createdAt ? new Date(client.createdAt).toISOString().split('T')[0] : ''
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="clients-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);

      // Log the export
      await createAuditLog(
        "created",
        "export",
        "clients-export",
        "Clients Export",
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Exported ${clients.length} clients to CSV`,
        null,
        { count: clients.length },
        req
      );
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export clients", error: error instanceof Error ? error.message : "Unknown error" });
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
      
      // Just use tasks from storage for now
      const uniqueTasks = tasks;
      
      res.json(uniqueTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      let task = await storage.getTask(req.params.id);
      
      // Use task from storage only for now
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
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
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      // Check if user has permission to delete tasks
      const canDelete = await hasPermission(userId, 'tasks', 'canDelete');
      if (!canDelete) {
        return res.status(403).json({ message: "Access denied. Only administrators can delete tasks." });
      }

      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Also remove from global tasks storage if it exists
      if (global.tasks) {
        global.tasks = global.tasks.filter(task => task.id !== req.params.id);
      }

      // Remove from client tasks storage as well
      if (global.clientTasks) {
        Object.keys(global.clientTasks).forEach(clientId => {
          global.clientTasks[clientId] = global.clientTasks[clientId].filter(task => task.id !== req.params.id);
        });
      }

      // Log the deletion
      await createAuditLog(
        "deleted",
        "task",
        req.params.id,
        "Task",
        userId,
        "Task deleted by administrator",
        null,
        null,
        req
      );

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
      const posts = await storage.getSocialMediaPosts(); // Temporary fix - get all posts
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

  app.patch("/api/custom-fields/:id", async (req, res) => {
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
        workflows = await storage.getWorkflows(); // Temporary fix - get all workflows 
      } else if (category) {
        workflows = await storage.getWorkflows(); // Temporary fix - get all workflows
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
        tasks = await storage.getEnhancedTasks(); // Temporary fix - get all tasks
      } else if (projectId) {
        tasks = await storage.getEnhancedTasksByProject(projectId as string);
      } else if (assignedTo) {
        tasks = await storage.getEnhancedTasks(); // Temporary fix - get all tasks
      } else if (workflowId) {
        tasks = await storage.getEnhancedTasks(); // Temporary fix - get all tasks
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
        triggers = await storage.getAutomationTriggers(); // Temporary fix - get all triggers
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
        actions = await storage.getAutomationActions(); // Temporary fix - get all actions
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
                like(staff.department, `%${search}%`)
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

  // Client Products API - Get products for a specific client
  app.get("/api/clients/:clientId/products", async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Get client products
      const clientProductsList = await db
        .select({
          id: clientProducts.id,
          productId: clientProducts.productId,
          price: clientProducts.price,
          status: clientProducts.status,
          createdAt: clientProducts.createdAt,
          productName: products.name,
          productDescription: products.description,
          productCost: products.cost,
          productType: products.type,
          itemType: sql<string>`'product'`
        })
        .from(clientProducts)
        .leftJoin(products, eq(clientProducts.productId, products.id))
        .where(eq(clientProducts.clientId, clientId));

      // Get client bundles with calculated total cost
      let clientBundlesList = [];
      try {
        const result = await db.execute(sql`
          SELECT 
            cb.id,
            cb.bundle_id as "productId",
            cb.price,
            cb.status,
            cb.created_at as "createdAt",
            pb.name as "productName",
            pb.description as "productDescription",
            NULL as "productPrice", -- Kept for compatibility but not used
            COALESCE(
              (SELECT SUM(
                p.cost * COALESCE(
                  (cb.custom_quantities->>(bp.product_id))::integer, 
                  1
                )
              )
               FROM bundle_products bp 
               LEFT JOIN products p ON bp.product_id = p.id 
               WHERE bp.bundle_id = cb.bundle_id), 
              0
            ) as "productCost",
            'bundle' as "productType",
            'bundle' as "itemType"
          FROM client_bundles cb
          LEFT JOIN product_bundles pb ON cb.bundle_id = pb.id
          WHERE cb.client_id = ${clientId}
        `);
        clientBundlesList = result.rows;
      } catch (error) {
        console.log('Error fetching client bundles:', error);
        clientBundlesList = [];
      }

      // Combine and sort the results
      const allItems = [...clientProductsList, ...clientBundlesList].sort((a, b) => 
        a.productName?.localeCompare(b.productName || '') || 0
      );
      
      res.json(allItems);
    } catch (error) {
      console.error('Error fetching client products:', error);
      res.status(500).json({ message: "Failed to fetch client products" });
    }
  });

  // Add product or bundle to client
  app.post("/api/clients/:clientId/products", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { productId, price } = req.body;

      // First, check if this is a product or bundle by looking in both tables
      const isProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      const isBundle = await db
        .select()
        .from(productBundles)
        .where(eq(productBundles.id, productId))
        .limit(1);

      if (isProduct.length > 0) {
        // Handle product assignment
        const existing = await db
          .select()
          .from(clientProducts)
          .where(
            and(
              eq(clientProducts.clientId, clientId),
              eq(clientProducts.productId, productId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          return res.status(400).json({ message: "Product already assigned to client" });
        }

        const [newClientProduct] = await db
          .insert(clientProducts)
          .values({
            clientId,
            productId,
            price: price || null,
            status: "active"
          })
          .returning();

        res.status(201).json(newClientProduct);
      } else if (isBundle.length > 0) {
        // Handle bundle assignment
        const existing = await db
          .select()
          .from(clientBundles)
          .where(
            and(
              eq(clientBundles.clientId, clientId),
              eq(clientBundles.bundleId, productId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          return res.status(400).json({ message: "Bundle already assigned to client" });
        }

        const [newClientBundle] = await db
          .insert(clientBundles)
          .values({
            clientId,
            bundleId: productId,
            price: price || null,
            status: "active"
          })
          .returning();

        res.status(201).json(newClientBundle);
      } else {
        return res.status(404).json({ message: "Product or bundle not found" });
      }
    } catch (error) {
      console.error('Error adding product to client:', error);
      res.status(500).json({ message: "Failed to add product to client" });
    }
  });

  // Remove product or bundle from client
  app.delete("/api/clients/:clientId/products/:productId", async (req, res) => {
    try {
      const { clientId, productId } = req.params;

      // First try to delete from clientProducts
      const [deletedProduct] = await db
        .delete(clientProducts)
        .where(
          and(
            eq(clientProducts.clientId, clientId),
            eq(clientProducts.productId, productId)
          )
        )
        .returning();

      if (deletedProduct) {
        return res.status(204).send();
      }

      // If not found in products, try bundles
      const [deletedBundle] = await db
        .delete(clientBundles)
        .where(
          and(
            eq(clientBundles.clientId, clientId),
            eq(clientBundles.bundleId, productId)
          )
        )
        .returning();

      if (deletedBundle) {
        return res.status(204).send();
      }

      return res.status(404).json({ message: "Client product/bundle relationship not found" });
    } catch (error) {
      console.error('Error removing product from client:', error);
      res.status(500).json({ message: "Failed to remove product from client" });
    }
  });

  // Get bundle products details with client-specific overrides
  app.get("/api/product-bundles/:bundleId/products", async (req, res) => {
    try {
      const { bundleId } = req.params;
      const { clientId } = req.query;
      
      const bundleProductsList = await db
        .select({
          productId: bundleProducts.productId,
          productName: products.name,
          productDescription: products.description,
          productCost: products.cost,
          productType: products.type
        })
        .from(bundleProducts)
        .leftJoin(products, eq(bundleProducts.productId, products.id))
        .where(eq(bundleProducts.bundleId, bundleId));

      // If clientId is provided, get custom quantities
      let customQuantities = {};
      if (clientId) {
        const clientBundle = await db
          .select({
            customQuantities: clientBundles.customQuantities
          })
          .from(clientBundles)
          .where(
            and(
              eq(clientBundles.clientId, clientId as string),
              eq(clientBundles.bundleId, bundleId)
            )
          )
          .limit(1);

        if (clientBundle.length > 0 && clientBundle[0].customQuantities) {
          customQuantities = clientBundle[0].customQuantities as Record<string, number>;
        }
      }

      // Apply custom quantities to the products (default to 1 if no custom quantity)
      const productsWithCustomQuantities = bundleProductsList.map(product => ({
        ...product,
        quantity: customQuantities[product.productId] || 1, // Default to 1 unit
        baseQuantity: 1 // Base bundle always has 1 unit of each product
      }));

      res.json(productsWithCustomQuantities);
    } catch (error) {
      console.error('Error fetching bundle products:', error);
      res.status(500).json({ message: "Failed to fetch bundle products" });
    }
  });

  // Update client bundle custom quantities with cost recalculation
  app.patch("/api/clients/:clientId/bundles/:bundleId/quantities", async (req, res) => {
    try {
      const { clientId, bundleId } = req.params;
      const { customQuantities } = req.body;

      // Get bundle products with their costs to recalculate total
      const bundleProductsList = await db
        .select({
          productId: bundleProducts.productId,
          baseQuantity: sql<number>`1`, // Base bundle always has 1 unit of each product
          productCost: products.cost
        })
        .from(bundleProducts)
        .leftJoin(products, eq(bundleProducts.productId, products.id))
        .where(eq(bundleProducts.bundleId, bundleId));

      // Calculate new total cost based on custom quantities (price removed)
      let totalCost = 0;

      bundleProductsList.forEach(product => {
        const quantity = customQuantities[product.productId] || product.baseQuantity || 0;
        const cost = parseFloat(product.productCost || '0');
        
        totalCost += cost * quantity;
      });

      // Update the client bundle with custom quantities (price field removed)
      await db
        .update(clientBundles)
        .set({
          customQuantities: customQuantities
        })
        .where(
          and(
            eq(clientBundles.clientId, clientId),
            eq(clientBundles.bundleId, bundleId)
          )
        );

      res.json({ 
        success: true, 
        newCost: totalCost
      });
    } catch (error) {
      console.error('Error updating bundle quantities:', error);
      res.status(500).json({ message: "Failed to update bundle quantities" });
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

  // Product Bundles API
  app.get("/api/product-bundles", async (req, res) => {
    try {
      const { search, status } = req.query;
      
      const conditions = [];
      
      if (search && typeof search === 'string') {
        conditions.push(
          or(
            like(productBundles.name, `%${search}%`),
            like(productBundles.description, `%${search}%`)
          )
        );
      }
      
      if (status && typeof status === 'string') {
        conditions.push(eq(productBundles.status, status));
      }

      let baseQuery = db.select().from(productBundles);
      
      const bundles = conditions.length > 0 
        ? await baseQuery.where(and(...conditions)).orderBy(asc(productBundles.name))
        : await baseQuery.orderBy(asc(productBundles.name));
      
      // Calculate usage count for each bundle
      const bundlesWithUsage = await Promise.all(
        bundles.map(async (bundle) => {
          const usageCountResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(clientBundles)
            .where(and(
              eq(clientBundles.bundleId, bundle.id),
              eq(clientBundles.status, 'active')
            ));
          
          return {
            ...bundle,
            usageCount: Number(usageCountResult[0]?.count || 0)
          };
        })
      );
      
      res.json(bundlesWithUsage);
    } catch (error) {
      console.error('Error fetching product bundles:', error);
      res.status(500).json({ message: "Failed to fetch product bundles" });
    }
  });

  app.get("/api/product-bundles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get bundle details
      const [bundle] = await db
        .select()
        .from(productBundles)
        .where(eq(productBundles.id, id));
      
      if (!bundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }

      // Get bundle products with product details
      const bundleProductsList = await db
        .select({
          id: bundleProducts.id,
          bundleId: bundleProducts.bundleId,
          productId: bundleProducts.productId,
          // quantity field removed - stored in clientBundles.customQuantities
          productName: products.name,
          productDescription: products.description,
          productCost: products.cost,
          productType: products.type,
          productStatus: products.status
        })
        .from(bundleProducts)
        .leftJoin(products, eq(bundleProducts.productId, products.id))
        .where(eq(bundleProducts.bundleId, id))
        .orderBy(asc(products.name));

      res.json({
        ...bundle,
        products: bundleProductsList
      });
    } catch (error) {
      console.error('Error fetching bundle:', error);
      res.status(500).json({ message: "Failed to fetch bundle" });
    }
  });

  app.post("/api/product-bundles", async (req, res) => {
    try {
      const { products: bundleProductsData, ...bundleData } = req.body;
      
      const validatedBundleData = insertProductBundleSchema.parse(bundleData);
      
      // Create the bundle
      const [newBundle] = await db.insert(productBundles).values(validatedBundleData).returning();
      
      // Add products to bundle if provided
      if (bundleProductsData && bundleProductsData.length > 0) {
        const bundleProductsInserts = bundleProductsData.map((product: any) => ({
          bundleId: newBundle.id,
          productId: product.productId
          // No quantity field - each product is 1 unit by default
        }));
        
        await db.insert(bundleProducts).values(bundleProductsInserts);
      }
      
      res.status(201).json(newBundle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error creating bundle:', error);
      res.status(500).json({ message: "Failed to create bundle" });
    }
  });

  app.put("/api/product-bundles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { products: bundleProductsData, ...bundleData } = req.body;
      
      const validatedData = insertProductBundleSchema.partial().parse(bundleData);
      
      // Update bundle
      const [updatedBundle] = await db
        .update(productBundles)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(productBundles.id, id))
        .returning();

      if (!updatedBundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }

      // Update bundle products if provided
      if (bundleProductsData) {
        // Remove existing bundle products
        await db.delete(bundleProducts).where(eq(bundleProducts.bundleId, id));
        
        // Add new bundle products
        if (bundleProductsData.length > 0) {
          const bundleProductsInserts = bundleProductsData.map((product: any) => ({
            bundleId: id,
            productId: product.productId
            // No quantity field - each product is 1 unit by default
          }));
          
          await db.insert(bundleProducts).values(bundleProductsInserts);
        }
      }

      res.json(updatedBundle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error updating bundle:', error);
      res.status(500).json({ message: "Failed to update bundle" });
    }
  });

  app.delete("/api/product-bundles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // First, remove client bundles that reference this bundle
      await db.delete(clientBundles).where(eq(clientBundles.bundleId, id));
      
      // Remove bundle products
      await db.delete(bundleProducts).where(eq(bundleProducts.bundleId, id));
      
      // Remove the bundle
      const [deletedBundle] = await db
        .delete(productBundles)
        .where(eq(productBundles.id, id))
        .returning();

      if (!deletedBundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }

      res.json({ message: "Bundle deleted successfully" });
    } catch (error) {
      console.error('Error deleting bundle:', error);
      res.status(500).json({ message: "Failed to delete bundle" });
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
      const createdPermissions = [];
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
        
        const insertedPermissions = await db.insert(permissions).values(permissionsToInsert).returning();
        createdPermissions.push(...insertedPermissions);
      }

      // Create permission audit log
      try {
        await permissionAuditService.logRoleCreation(
          newRole,
          createdPermissions,
          {
            performedBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb", // Default user, should come from session
            performedByName: "System Admin", // Default name, should come from session
            ipAddress: req?.ip || req?.connection?.remoteAddress || "127.0.0.1",
            userAgent: req?.get("User-Agent") || "Unknown",
            sessionId: (req as any)?.sessionID,
          }
        );
      } catch (auditError) {
        console.error('Failed to create permission audit log:', auditError);
      }

      // Create regular audit log for backwards compatibility
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
      
      // Get existing role and permissions for audit log
      const existingRole = await db
        .select()
        .from(roles)
        .where(eq(roles.id, req.params.id))
        .limit(1);
      
      if (existingRole.length === 0) {
        return res.status(404).json({ message: "Role not found" });
      }

      const oldPermissions = await db
        .select()
        .from(permissions)
        .where(eq(permissions.roleId, req.params.id));

      // Update role
      const [updatedRole] = await db
        .update(roles)
        .set({ ...roleData, updatedAt: new Date() })
        .where(eq(roles.id, req.params.id))
        .returning();

      // Update permissions - delete existing and insert new ones
      await db.delete(permissions).where(eq(permissions.roleId, req.params.id));
      
      const newPermissions = [];
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
        
        const insertedPermissions = await db.insert(permissions).values(permissionsToInsert).returning();
        newPermissions.push(...insertedPermissions);
      }

      // Create permission audit log
      try {
        await permissionAuditService.logRoleUpdate(
          updatedRole,
          oldPermissions,
          newPermissions,
          {
            performedBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb", // Default user, should come from session
            performedByName: "System Admin", // Default name, should come from session
            ipAddress: req?.ip || req?.connection?.remoteAddress || "127.0.0.1",
            userAgent: req?.get("User-Agent") || "Unknown",
            sessionId: (req as any)?.sessionID,
          }
        );
      } catch (auditError) {
        console.error('Failed to create permission audit log:', auditError);
      }

      // Create regular audit log for backwards compatibility
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

  // Permission Audit Log API Routes
  app.get("/api/permission-audit-logs", async (req, res) => {
    try {
      const filters = {
        roleId: req.query.roleId as string,
        userId: req.query.userId as string,
        auditType: req.query.auditType as string,
        riskLevel: req.query.riskLevel as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const result = await permissionAuditService.getAuditLogs(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching permission audit logs:', error);
      res.status(500).json({ message: "Failed to fetch permission audit logs" });
    }
  });

  app.get("/api/permission-audit-logs/:id", async (req, res) => {
    try {
      const auditLog = await permissionAuditService.getAuditLogDetails(req.params.id);
      
      if (!auditLog) {
        return res.status(404).json({ message: "Permission audit log not found" });
      }

      res.json(auditLog);
    } catch (error) {
      console.error('Error fetching permission audit log details:', error);
      res.status(500).json({ message: "Failed to fetch permission audit log details" });
    }
  });

  // Notification Settings Routes
  app.get("/api/notification-settings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get notification settings from database
      const settings = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId)).limit(1);
      
      if (settings.length === 0) {
        // Return default settings if none exist
        return res.json({
          userId,
          clientAssignedInApp: true,
          clientAssignedEmail: true,
          clientAssignedSms: false,
          chatAddedInApp: true,
          chatAddedEmail: false,
          chatAddedSms: false,
          chatMessagesInApp: true,
          mentionedInApp: true,
          mentionedEmail: true,
          mentionedSms: false,
          mentionFollowUpInApp: true,
          mentionFollowUpEmail: false,
          mentionFollowUpSms: false,
          taskAssignedInApp: true,
          taskAssignedEmail: true,
          taskAssignedSms: false,
        });
      }
      
      res.json(settings[0]);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/notification-settings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settingsData = req.body;
      
      // Check if settings exist
      const existingSettings = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId)).limit(1);
      
      let result;
      if (existingSettings.length === 0) {
        // Create new settings
        result = await db.insert(notificationSettings).values({
          ...settingsData,
          userId,
        }).returning();
      } else {
        // Update existing settings
        result = await db.update(notificationSettings)
          .set({
            ...settingsData,
            updatedAt: new Date(),
          })
          .where(eq(notificationSettings.userId, userId))
          .returning();
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Client Notes endpoints
  app.get("/api/clients/:clientId/notes", async (req, res) => {
    try {
      const clientId = req.params.clientId;
      
      // Get notes from database with creator information
      const notes = await db
        .select({
          id: clientNotes.id,
          clientId: clientNotes.clientId,
          content: clientNotes.content,
          createdAt: clientNotes.createdAt,
          editedAt: clientNotes.editedAt,
          createdBy: {
            id: sql`created_by.id`,
            firstName: sql`created_by.first_name`,
            lastName: sql`created_by.last_name`
          },
          editedBy: sql`CASE WHEN edited_by.id IS NOT NULL THEN json_build_object('id', edited_by.id, 'firstName', edited_by.first_name, 'lastName', edited_by.last_name) ELSE NULL END`
        })
        .from(clientNotes)
        .leftJoin(sql`${staff} AS created_by`, eq(clientNotes.createdById, sql`created_by.id`))
        .leftJoin(sql`${staff} AS edited_by`, eq(clientNotes.editedBy, sql`edited_by.id`))
        .where(eq(clientNotes.clientId, clientId))
        .orderBy(desc(clientNotes.createdAt));
      
      res.json(notes);
    } catch (error) {
      console.error("Error fetching client notes:", error);
      res.status(500).json({ error: "Failed to fetch client notes" });
    }
  });

  app.post("/api/clients/:clientId/notes", async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const { content } = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!content?.trim()) {
        return res.status(400).json({ error: "Note content is required" });
      }

      // Get user info for the response
      const userInfo = await db.select().from(staff).where(eq(staff.id, userId)).limit(1);
      const user = userInfo[0] || { firstName: "System", lastName: "User" };

      // Insert note into database
      const newNoteData = {
        clientId: clientId,
        content: content.trim(),
        createdById: userId,
        isLocked: true // Notes are locked after creation as per schema
      };

      const insertedNote = await db.insert(clientNotes).values(newNoteData).returning();
      const createdNote = insertedNote[0];

      // Create audit log
      await createAuditLog(
        "created",
        "note", 
        createdNote.id,
        `Note for client ${clientId}`,
        userId,
        `Created note: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        null,
        { content, clientId },
        req
      );

      // Return note with user information for UI
      const noteResponse = {
        id: createdNote.id,
        clientId: createdNote.clientId,
        content: createdNote.content,
        createdById: createdNote.createdById,
        createdBy: { firstName: user.firstName, lastName: user.lastName },
        createdAt: createdNote.createdAt,
        editedBy: null,
        editedAt: null,
        isLocked: createdNote.isLocked
      };

      res.status(201).json(noteResponse);
    } catch (error) {
      console.error("Error creating client note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // Edit note endpoint (Admin only)
  app.put("/api/clients/:clientId/notes/:noteId", async (req, res) => {
    try {
      const { clientId, noteId } = req.params;
      const { content } = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!content?.trim()) {
        return res.status(400).json({ error: "Note content is required" });
      }

      // Check if user is admin using a simple role lookup
      const userWithRole = await db.select({
        firstName: staff.firstName,
        lastName: staff.lastName,
        roleName: roles.name
      })
      .from(staff)
      .leftJoin(roles, eq(staff.roleId, roles.id))
      .where(eq(staff.id, userId))
      .limit(1);
      
      const user = userWithRole[0];
      
      if (!user || user.roleName !== 'Admin') {
        return res.status(403).json({ error: "Only admins can edit notes" });
      }

      // Get the existing note to check if it exists and get old content for audit
      const existingNote = await db.select().from(clientNotes)
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.clientId, clientId)))
        .limit(1);

      if (!existingNote.length) {
        return res.status(404).json({ error: "Note not found" });
      }

      const oldNote = existingNote[0];

      // Update note in database
      const updatedNote = await db.update(clientNotes)
        .set({
          content: content.trim(),
          editedBy: userId,
          editedAt: new Date()
        })
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.clientId, clientId)))
        .returning();

      if (!updatedNote.length) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Log the edit
      await createAuditLog(
        "updated",
        "note",
        noteId,
        `Note for client ${clientId}`,
        userId,
        `Updated note content`,
        { content: oldNote.content },
        { content: updatedNote[0].content },
        req
      );

      // Return note with user information for UI
      const noteResponse = {
        id: updatedNote[0].id,
        clientId: updatedNote[0].clientId,
        content: updatedNote[0].content,
        createdById: updatedNote[0].createdById,
        createdAt: updatedNote[0].createdAt,
        editedBy: { firstName: user.firstName, lastName: user.lastName },
        editedAt: updatedNote[0].editedAt,
        isLocked: updatedNote[0].isLocked
      };

      res.json(noteResponse);
    } catch (error) {
      console.error("Error updating client note:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  // Delete note endpoint (Admin only)
  app.delete("/api/clients/:clientId/notes/:noteId", async (req, res) => {
    try {
      const { clientId, noteId } = req.params;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      // Check if user is admin using a simple role lookup
      const userWithRole = await db.select({
        roleName: roles.name
      })
      .from(staff)
      .leftJoin(roles, eq(staff.roleId, roles.id))
      .where(eq(staff.id, userId))
      .limit(1);
      
      const user = userWithRole[0];
      
      if (!user || user.roleName !== 'Admin') {
        return res.status(403).json({ error: "Only admins can delete notes" });
      }

      // Get the existing note before deletion for audit logging
      const existingNote = await db.select().from(clientNotes)
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.clientId, clientId)))
        .limit(1);

      if (!existingNote.length) {
        return res.status(404).json({ error: "Note not found" });
      }

      const noteToDelete = existingNote[0];

      // Delete note from database
      const deleteResult = await db.delete(clientNotes)
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.clientId, clientId)))
        .returning();

      if (!deleteResult.length) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Log the deletion
      await createAuditLog(
        "deleted",
        "note",
        noteId,
        `Note for client ${clientId}`,
        userId,
        `Deleted note: ${noteToDelete.content.substring(0, 100)}${noteToDelete.content.length > 100 ? '...' : ''}`,
        { content: noteToDelete.content },
        null,
        req
      );

      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting client note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Client Tasks endpoints
  app.get("/api/clients/:clientId/tasks", async (req, res) => {
    try {
      const clientId = req.params.clientId;
      
      // Get tasks from memory storage (temporary solution)  
      const tasks = global.clientTasks?.[clientId] || [];
      
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching client tasks:", error);
      res.status(500).json({ error: "Failed to fetch client tasks" });
    }
  });

  app.post("/api/clients/:clientId/tasks", async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const { title, description, dueDate, assignedTo, status, isRecurring, recurringConfig } = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!title?.trim()) {
        return res.status(400).json({ error: "Task title is required" });
      }

      // Find assigned user details if assignedTo is provided
      let assignedToUser = null;
      if (assignedTo) {
        const assignedStaff = await db.select().from(staff).where(eq(staff.id, assignedTo)).limit(1);
        if (assignedStaff.length > 0) {
          assignedToUser = {
            firstName: assignedStaff[0].firstName,
            lastName: assignedStaff[0].lastName
          };
        }
      }

      const newTask = {
        id: nanoid(),
        clientId: clientId,
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "pending",
        assignedTo: assignedTo || userId,
        assignedToUser: assignedToUser || { firstName: "Unassigned", lastName: "User" },
        createdBy: userId,
        isRecurring: !!isRecurring,
        // Map recurringConfig fields to schema fields
        recurringInterval: isRecurring ? (recurringConfig?.interval || 1) : null,
        recurringUnit: isRecurring ? (recurringConfig?.unit || "days") : null,
        recurringEndType: isRecurring ? (recurringConfig?.endType || "never") : null,
        recurringEndDate: isRecurring && recurringConfig?.endType === "on" && recurringConfig?.endDate ? new Date(recurringConfig.endDate) : null,
        recurringEndOccurrences: isRecurring && recurringConfig?.endType === "after" ? (recurringConfig?.endAfter || 1) : null,
        createIfOverdue: isRecurring ? !!recurringConfig?.createIfOverdue : false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in client-specific memory
      if (!global.clientTasks) global.clientTasks = {};
      if (!global.clientTasks[clientId]) global.clientTasks[clientId] = [];
      global.clientTasks[clientId].push(newTask);

      // Also store in global tasks storage for the main Tasks section
      if (!global.tasks) global.tasks = [];
      global.tasks.push(newTask);

      // Log the creation
      await createAuditLog(
        "created",
        "task",
        newTask.id,
        newTask.title,
        userId,
        `Created task for client ${clientId}: ${newTask.title}`,
        null,
        newTask,
        req
      );

      res.status(201).json(newTask);
    } catch (error) {
      console.error("Error creating client task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/clients/:clientId/tasks/:taskId", async (req, res) => {
    try {
      const { clientId, taskId } = req.params;
      const updateData = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!global.clientTasks?.[clientId]) {
        return res.status(404).json({ error: "Client not found or has no tasks" });
      }

      const taskIndex = global.clientTasks[clientId].findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        return res.status(404).json({ error: "Task not found" });
      }

      const oldTask = { ...global.clientTasks[clientId][taskIndex] };
      const updatedTask = {
        ...global.clientTasks[clientId][taskIndex],
        ...updateData,
        updatedAt: new Date()
      };

      global.clientTasks[clientId][taskIndex] = updatedTask;

      // Also update in global tasks storage
      if (global.tasks) {
        const globalTaskIndex = global.tasks.findIndex(t => t.id === taskId);
        if (globalTaskIndex !== -1) {
          global.tasks[globalTaskIndex] = updatedTask;
        }
      }

      // Log the update
      await createAuditLog(
        "updated",
        "task",
        taskId,
        updatedTask.title,
        userId,
        `Updated task: ${updatedTask.title}`,
        oldTask,
        updatedTask,
        req
      );

      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating client task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Full task update endpoint with detailed audit logging
  app.put("/api/clients/:clientId/tasks/:taskId", async (req, res) => {
    try {
      const { clientId, taskId } = req.params;
      const { title, description, dueDate, assignedTo, isRecurring, recurringConfig } = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!title?.trim()) {
        return res.status(400).json({ error: "Task title is required" });
      }

      if (!global.clientTasks?.[clientId]) {
        return res.status(404).json({ error: "Client not found or has no tasks" });
      }

      const taskIndex = global.clientTasks[clientId].findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Get assignee details if provided
      let assignedToUser = null;
      if (assignedTo) {
        const staffInfo = await db.select().from(staff).where(eq(staff.id, assignedTo)).limit(1);
        assignedToUser = staffInfo[0] ? {
          id: staffInfo[0].id,
          firstName: staffInfo[0].firstName,
          lastName: staffInfo[0].lastName
        } : null;
      }

      const oldTask = { ...global.clientTasks[clientId][taskIndex] };
      const updatedTask = {
        ...oldTask,
        title: title.trim(),
        description: description?.trim() || "",
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo: assignedTo || oldTask.assignedTo,
        assignedToUser: assignedToUser || oldTask.assignedToUser,
        isRecurring: !!isRecurring,
        // Map recurringConfig fields to schema fields
        recurringInterval: isRecurring ? (recurringConfig?.interval || 1) : null,
        recurringUnit: isRecurring ? (recurringConfig?.unit || "days") : null,
        recurringEndType: isRecurring ? (recurringConfig?.endType || "never") : null,
        recurringEndDate: isRecurring && recurringConfig?.endType === "on" && recurringConfig?.endDate ? new Date(recurringConfig.endDate) : null,
        recurringEndOccurrences: isRecurring && recurringConfig?.endType === "after" ? (recurringConfig?.endAfter || 1) : null,
        createIfOverdue: isRecurring ? !!recurringConfig?.createIfOverdue : false,
        updatedAt: new Date()
      };

      global.clientTasks[clientId][taskIndex] = updatedTask;

      // Also update in global tasks storage
      if (global.tasks) {
        const globalTaskIndex = global.tasks.findIndex(t => t.id === taskId);
        if (globalTaskIndex !== -1) {
          global.tasks[globalTaskIndex] = updatedTask;
        }
      }

      // Create detailed audit log entry
      const changes = [];
      if (oldTask.title !== updatedTask.title) changes.push(`title from "${oldTask.title}" to "${updatedTask.title}"`);
      if (oldTask.description !== updatedTask.description) changes.push(`description from "${oldTask.description || 'none'}" to "${updatedTask.description || 'none'}"`);
      if (oldTask.dueDate?.toString() !== updatedTask.dueDate?.toString()) {
        const oldDate = oldTask.dueDate ? new Date(oldTask.dueDate).toLocaleDateString() : 'none';
        const newDate = updatedTask.dueDate ? new Date(updatedTask.dueDate).toLocaleDateString() : 'none';
        changes.push(`due date from ${oldDate} to ${newDate}`);
      }
      if (oldTask.assignedTo !== updatedTask.assignedTo) {
        const oldAssignee = oldTask.assignedToUser ? `${oldTask.assignedToUser.firstName} ${oldTask.assignedToUser.lastName}` : 'none';
        const newAssignee = assignedToUser ? `${assignedToUser.firstName} ${assignedToUser.lastName}` : 'none';
        changes.push(`assignee from ${oldAssignee} to ${newAssignee}`);
      }
      if (oldTask.isRecurring !== updatedTask.isRecurring) changes.push(`recurring setting from ${oldTask.isRecurring} to ${updatedTask.isRecurring}`);

      await createAuditLog(
        "updated",
        "task",
        taskId,
        `Task for client ${clientId}`,
        userId,
        changes.length > 0 ? `Task updated: ${changes.join(', ')}` : 'Task updated',
        oldTask,
        updatedTask,
        req
      );

      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Delete client task route
  app.delete("/api/clients/:clientId/tasks/:taskId", async (req, res) => {
    try {
      const { clientId, taskId } = req.params;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      // Check if user has permission to delete tasks
      const canDelete = await hasPermission(userId, 'tasks', 'canDelete');
      if (!canDelete) {
        return res.status(403).json({ error: "Access denied. Only administrators can delete tasks." });
      }

      if (!global.clientTasks?.[clientId]) {
        return res.status(404).json({ error: "Client not found or has no tasks" });
      }

      const taskIndex = global.clientTasks[clientId].findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        return res.status(404).json({ error: "Task not found" });
      }

      const deletedTask = global.clientTasks[clientId][taskIndex];
      
      // Remove from client tasks
      global.clientTasks[clientId].splice(taskIndex, 1);

      // Also remove from global tasks storage
      if (global.tasks) {
        global.tasks = global.tasks.filter(task => task.id !== taskId);
      }

      // Also delete associated comments
      if (global.taskComments?.[taskId]) {
        delete global.taskComments[taskId];
      }

      // Log the deletion
      await createAuditLog(
        "deleted",
        "task",
        taskId,
        deletedTask.title,
        userId,
        `Task deleted by administrator from client ${clientId}`,
        deletedTask,
        null,
        req
      );

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting client task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });



  // User permissions endpoint
  app.get("/api/auth/permissions", async (req, res) => {
    try {
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      const permissions = {
        tasks: {
          canDelete: await hasPermission(userId, 'tasks', 'canDelete')
        }
      };
      
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  // User permissions endpoint for general permission checks
  app.get("/api/user-permissions", async (req, res) => {
    try {
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      const permissions = {
        tasks: {
          canDelete: await hasPermission(userId, 'tasks', 'canDelete'),
          canCreate: await hasPermission(userId, 'tasks', 'canCreate'),
          canEdit: await hasPermission(userId, 'tasks', 'canEdit'),
          canView: await hasPermission(userId, 'tasks', 'canView')
        },
        settings: {
          canAccess: await hasPermission(userId, 'settings', 'canManage')
        },
        clients: {
          canDelete: await hasPermission(userId, 'clients', 'canDelete'),
          canCreate: await hasPermission(userId, 'clients', 'canCreate'),
          canEdit: await hasPermission(userId, 'clients', 'canEdit'),
          canView: await hasPermission(userId, 'clients', 'canView')
        }
      };
      
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  // Task Comments endpoints
  app.get("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const { taskId } = req.params;
      
      if (!global.taskComments) {
        global.taskComments = {};
      }
      
      const comments = global.taskComments[taskId] || [];
      
      // Enrich comments with author information
      const enrichedComments = await Promise.all(
        comments.map(async (comment: any) => {
          try {
            const authorData = await db.select().from(staff).where(eq(staff.id, comment.authorId)).limit(1);
            return {
              ...comment,
              author: authorData.length > 0 ? {
                firstName: authorData[0].firstName,
                lastName: authorData[0].lastName,
                email: authorData[0].email
              } : { firstName: "Unknown", lastName: "User", email: "" }
            };
          } catch (error) {
            return {
              ...comment,
              author: { firstName: "Unknown", lastName: "User", email: "" }
            };
          }
        })
      );
      
      res.json(enrichedComments);
    } catch (error) {
      console.error("Error fetching task comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { content, mentions } = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!content?.trim()) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      if (!global.taskComments) {
        global.taskComments = {};
      }
      
      if (!global.taskComments[taskId]) {
        global.taskComments[taskId] = [];
      }

      // Get author information
      const authorData = await db.select().from(staff).where(eq(staff.id, userId)).limit(1);
      const author = authorData.length > 0 ? {
        firstName: authorData[0].firstName,
        lastName: authorData[0].lastName,
        email: authorData[0].email
      } : { firstName: "Unknown", lastName: "User", email: "" };

      const newComment = {
        id: nanoid(),
        taskId: taskId,
        content: content.trim(),
        authorId: userId,
        author: author,
        mentions: mentions || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      global.taskComments[taskId].push(newComment);

      // Create notifications for mentioned users
      if (mentions && mentions.length > 0) {
        if (!global.notifications) {
          global.notifications = {};
        }
        
        for (const mentionedUserId of mentions) {
          if (!global.notifications[mentionedUserId]) {
            global.notifications[mentionedUserId] = [];
          }
          
          const notification = {
            id: nanoid(),
            type: 'mention',
            title: 'You were mentioned in a task comment',
            message: `${author.firstName} ${author.lastName} mentioned you in a comment`,
            entityType: 'task',
            entityId: taskId,
            relatedId: newComment.id,
            isRead: false,
            createdAt: new Date(),
            createdBy: userId
          };
          
          global.notifications[mentionedUserId].push(notification);
        }
      }

      // Log the comment creation
      await createAuditLog(
        "created",
        "task_comment",
        newComment.id,
        `Comment on task`,
        userId,
        `Added comment to task: ${content.substring(0, 50)}...`,
        null,
        newComment,
        req
      );

      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error creating task comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.put("/api/tasks/:taskId/comments/:commentId", async (req, res) => {
    try {
      const { taskId, commentId } = req.params;
      const { content, mentions } = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!content?.trim()) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      if (!global.taskComments?.[taskId]) {
        return res.status(404).json({ error: "Task comments not found" });
      }

      const commentIndex = global.taskComments[taskId].findIndex((c: any) => c.id === commentId);
      if (commentIndex === -1) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const oldComment = { ...global.taskComments[taskId][commentIndex] };
      
      // Check if user is author or admin
      if (oldComment.authorId !== userId) {
        // Here you could add role-based permission check
        const currentUser = await db.select().from(staff).where(eq(staff.id, userId)).limit(1);
        if (currentUser.length === 0 || currentUser[0].role !== 'Admin') {
          return res.status(403).json({ error: "Not authorized to edit this comment" });
        }
      }

      const updatedComment = {
        ...oldComment,
        content: content.trim(),
        mentions: mentions || [],
        updatedAt: new Date()
      };

      global.taskComments[taskId][commentIndex] = updatedComment;

      // Log the update
      await createAuditLog(
        "updated",
        "task_comment",
        commentId,
        `Comment update`,
        userId,
        `Updated comment: ${content.substring(0, 50)}...`,
        oldComment,
        updatedComment,
        req
      );

      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating task comment:", error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  app.delete("/api/tasks/:taskId/comments/:commentId", async (req, res) => {
    try {
      const { taskId, commentId } = req.params;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!global.taskComments?.[taskId]) {
        return res.status(404).json({ error: "Task comments not found" });
      }

      const commentIndex = global.taskComments[taskId].findIndex((c: any) => c.id === commentId);
      if (commentIndex === -1) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const comment = global.taskComments[taskId][commentIndex];
      
      // Check if user is author or admin
      if (comment.authorId !== userId) {
        const currentUser = await db.select().from(staff).where(eq(staff.id, userId)).limit(1);
        if (currentUser.length === 0 || currentUser[0].role !== 'Admin') {
          return res.status(403).json({ error: "Not authorized to delete this comment" });
        }
      }

      global.taskComments[taskId].splice(commentIndex, 1);

      // Log the deletion
      await createAuditLog(
        "deleted",
        "task_comment",
        commentId,
        `Comment deletion`,
        userId,
        `Deleted comment: ${comment.content.substring(0, 50)}...`,
        comment,
        null,
        req
      );

      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting task comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      if (!global.notifications) {
        global.notifications = {};
      }
      
      const userNotifications = global.notifications[userId] || [];
      
      // Sort by newest first
      const sortedNotifications = userNotifications.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      res.json(sortedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:notificationId/read", async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      if (!global.notifications?.[userId]) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      const notification = global.notifications[userId].find((n: any) => n.id === notificationId);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      notification.isRead = true;
      
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      if (!global.notifications?.[userId]) {
        return res.json({ message: "No notifications to mark as read" });
      }
      
      global.notifications[userId].forEach((notification: any) => {
        notification.isRead = true;
      });
      
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:notificationId", async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      if (!global.notifications?.[userId]) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      const notificationIndex = global.notifications[userId].findIndex((n: any) => n.id === notificationId);
      if (notificationIndex === -1) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      global.notifications[userId].splice(notificationIndex, 1);
      
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // ===== SECURE DOCUMENT MANAGEMENT SYSTEM =====
  
  // Allowed file types for security validation
  const ALLOWED_FILE_TYPES = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'rtf', 'pages', 'numbers',
    'jpeg', 'jpg', 'png', 'gif', 'tiff', 'ppt', 'pptx', 'key'
  ];

  // Forbidden file types for security
  const FORBIDDEN_FILE_TYPES = [
    'exe', 'bat', 'sh', 'msi', 'js', 'php', 'html', 'css', 'zip'
  ];

  // File name sanitization function
  function sanitizeFileName(fileName: string): string {
    // Remove path information and dangerous characters
    let sanitized = fileName.replace(/[\/\\:*?"<>|]/g, '_');
    
    // Remove spaces with underscores
    sanitized = sanitized.replace(/\s+/g, '_');
    
    // Remove any remaining special characters except dots, dashes, and underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');
    
    // Ensure it doesn't start with a dot or dash
    sanitized = sanitized.replace(/^[.-]+/, '');
    
    // Limit length to 255 characters
    if (sanitized.length > 255) {
      const ext = sanitized.split('.').pop();
      const nameWithoutExt = sanitized.substring(0, 255 - (ext?.length || 0) - 1);
      sanitized = `${nameWithoutExt}.${ext}`;
    }
    
    return sanitized || 'unnamed_file';
  }

  // Validate file type function
  function validateFileType(fileName: string, mimeType?: string): { isValid: boolean; error?: string } {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (!extension) {
      return { isValid: false, error: 'File must have an extension' };
    }

    if (FORBIDDEN_FILE_TYPES.includes(extension)) {
      return { isValid: false, error: `File type .${extension} is not allowed for security reasons` };
    }

    if (!ALLOWED_FILE_TYPES.includes(extension)) {
      return { isValid: false, error: `File type .${extension} is not supported. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}` };
    }

    return { isValid: true };
  }

  // Get upload URL for document
  app.post("/api/documents/upload-url", async (req, res) => {
    try {
      const { fileName, fileType, fileSize, clientId } = req.body;

      // Basic validation
      if (!fileName || !clientId) {
        return res.status(400).json({ message: "fileName and clientId are required" });
      }

      // File size validation (250MB limit)
      if (fileSize > 250 * 1024 * 1024) {
        return res.status(400).json({ message: "File size exceeds 250MB limit" });
      }

      // Sanitize file name
      const sanitizedFileName = sanitizeFileName(fileName);

      // Validate file type
      const validation = validateFileType(sanitizedFileName, fileType);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }

      // Verify client exists
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Generate upload URL using object storage
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      res.json({ uploadURL });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Register uploaded document in database
  app.post("/api/documents", async (req, res) => {
    try {
      const { fileName, fileType, fileSize, fileUrl, clientId } = req.body;

      // Validate required fields
      if (!fileName || !fileType || !fileSize || !fileUrl || !clientId) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Sanitize file name
      const sanitizedFileName = sanitizeFileName(fileName);

      // Validate file type again
      const validation = validateFileType(sanitizedFileName, fileType);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }

      // File size validation
      if (fileSize > 250 * 1024 * 1024) {
        return res.status(400).json({ message: "File size exceeds 250MB limit" });
      }

      // Verify client exists
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Get current user (defaulting to admin for demo)
      const uploadedBy = "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      // Normalize object path from upload URL
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(fileUrl);

      // Create document record
      const documentData = {
        clientId: clientId,
        fileName: sanitizedFileName,
        fileType: sanitizedFileName.split('.').pop()?.toLowerCase() || 'unknown',
        fileSize: fileSize,
        fileUrl: normalizedPath,
        uploadedBy: uploadedBy,
      };

      const validatedData = insertClientDocumentSchema.parse(documentData);
      const [document] = await db.insert(clientDocuments).values(validatedData).returning();

      // Create audit log
      await createAuditLog(
        "created",
        "document",
        document.id,
        sanitizedFileName,
        uploadedBy,
        `Uploaded document: ${sanitizedFileName} for client: ${client.name}`,
        null,
        document,
        req
      );

      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error registering document:', error);
      res.status(500).json({ message: "Failed to register document" });
    }
  });

  // Get client documents with uploader information
  app.get("/api/clients/:clientId/documents", async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Verify client exists
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Get documents first
      const documents = await db
        .select()
        .from(clientDocuments)
        .where(eq(clientDocuments.clientId, clientId))
        .orderBy(desc(clientDocuments.createdAt));

      // Format response with basic uploader info (we'll fetch staff info separately if needed)
      const formattedDocuments = documents.map(doc => ({
        id: doc.id,
        clientId: doc.clientId,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        fileUrl: doc.fileUrl,
        downloadUrl: doc.fileUrl, // Frontend expects downloadUrl
        uploadedBy: doc.uploadedBy,
        uploadedByUser: {
          firstName: "Staff",
          lastName: "Member"
        },
        createdAt: doc.createdAt,
      }));

      res.json(formattedDocuments);
    } catch (error) {
      console.error("Error fetching client documents:", error);
      res.status(500).json({ error: "Failed to fetch client documents" });
    }
  });

  // Delete document (Admin only)
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Get current user (defaulting to admin for demo)
      const currentUserId = "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      // Check if user has permission to delete documents (Admin only)
      const hasDeletePermission = await hasPermission(currentUserId, 'documents', 'canDelete');
      if (!hasDeletePermission) {
        return res.status(403).json({ message: "Only administrators can delete documents" });
      }

      // Get document info before deletion
      const document = await db
        .select()
        .from(clientDocuments)
        .where(eq(clientDocuments.id, id))
        .limit(1);

      if (document.length === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      const docRecord = document[0];

      // Get client info for audit log
      const client = await storage.getClient(docRecord.clientId);

      // Delete from database
      await db.delete(clientDocuments).where(eq(clientDocuments.id, id));

      // Create audit log
      await createAuditLog(
        "deleted",
        "document",
        id,
        docRecord.fileName,
        currentUserId,
        `Deleted document: ${docRecord.fileName} from client: ${client?.name || 'Unknown'}`,
        docRecord,
        null,
        req
      );

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Serve documents securely
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // In a real implementation with user authentication, you would:
      // 1. Check if user is authenticated
      // 2. Verify user has access to the client associated with this document
      // 3. Check document permissions
      
      // For now, allow access (in production, implement proper access control)
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Document not found" });
      }
      return res.status(500).json({ message: "Failed to serve document" });
    }
  });

  // Temporary auth endpoint for demo purposes (returns admin user)
  app.get("/api/auth/current-user", async (req, res) => {
    try {
      // For demo purposes, return a mock admin user
      // In a real app, this would check session/JWT and return actual user data
      const mockUser = {
        id: "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        role: "Admin",
        firstName: "System",
        lastName: "Administrator"
      };
      res.json(mockUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to get current user" });
    }
  });

  // ===== CALENDAR SYSTEM API ROUTES =====

  // Calendar Management Routes
  app.get("/api/calendars", async (req, res) => {
    try {
      const calendarsData = await db
        .select()
        .from(calendars)
        .orderBy(asc(calendars.name));

      res.json(calendarsData);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      res.status(500).json({ message: "Failed to fetch calendars" });
    }
  });

  app.post("/api/calendars", async (req, res) => {
    try {
      // Extract assignedStaff from request body before validation
      const { assignedStaff, ...calendarData } = req.body;
      
      const validatedData = insertCalendarSchema.parse(calendarData);
      
      const [newCalendar] = await db
        .insert(calendars)
        .values(validatedData)
        .returning();

      // Handle staff assignment if provided
      if (assignedStaff && assignedStaff.trim() !== "") {
        await db
          .insert(calendarStaff)
          .values({
            calendarId: newCalendar.id,
            staffId: assignedStaff,
            isActive: true,
          });
      }

      await createAuditLog(
        "created",
        "calendar",
        newCalendar.id,
        newCalendar.name,
        undefined,
        `Created calendar: ${newCalendar.name}`,
        null,
        newCalendar,
        req
      );

      res.status(201).json(newCalendar);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error creating calendar:', error);
      res.status(500).json({ message: "Failed to create calendar" });
    }
  });

  app.get("/api/calendars/:id", async (req, res) => {
    try {
      const [calendar] = await db
        .select()
        .from(calendars)
        .where(eq(calendars.id, req.params.id));

      if (!calendar) {
        return res.status(404).json({ message: "Calendar not found" });
      }

      // Get assigned staff member for this calendar
      const [assignedStaffRecord] = await db
        .select({ staffId: calendarStaff.staffId })
        .from(calendarStaff)
        .where(and(
          eq(calendarStaff.calendarId, req.params.id),
          eq(calendarStaff.isActive, true)
        ));

      const calendarWithStaff = {
        ...calendar,
        assignedStaff: assignedStaffRecord?.staffId || null
      };

      res.json(calendarWithStaff);
    } catch (error) {
      console.error('Error fetching calendar:', error);
      res.status(500).json({ message: "Failed to fetch calendar" });
    }
  });

  app.get("/api/calendars/by-url/:customUrl", async (req, res) => {
    try {
      const [calendar] = await db
        .select()
        .from(calendars)
        .where(eq(calendars.customUrl, req.params.customUrl));

      if (!calendar) {
        return res.status(404).json({ message: "Calendar not found" });
      }

      res.json(calendar);
    } catch (error) {
      console.error('Error fetching calendar by URL:', error);
      res.status(500).json({ message: "Failed to fetch calendar" });
    }
  });

  // Get calendar appointments
  app.get("/api/calendar-appointments", async (req, res) => {
    try {
      const { calendarId, staffId, startDate, endDate } = req.query;

      const appointments = await db
        .select()
        .from(calendarAppointments)
        .where(
          calendarId 
            ? eq(calendarAppointments.calendarId, calendarId as string)
            : sql`1=1`
        )
        .orderBy(asc(calendarAppointments.startTime));

      res.json(appointments);
    } catch (error) {
      console.error('Error fetching calendar appointments:', error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Update calendar appointment
  app.put("/api/calendar-appointments/:id", async (req, res) => {
    try {
      const [existingAppointment] = await db
        .select()
        .from(calendarAppointments)
        .where(eq(calendarAppointments.id, req.params.id));

      if (!existingAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      const updateData = req.body;
      
      const [updatedAppointment] = await db
        .update(calendarAppointments)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(calendarAppointments.id, req.params.id))
        .returning();

      await createAuditLog(
        "updated",
        "appointment",
        updatedAppointment.id,
        updatedAppointment.title,
        undefined,
        `Updated appointment: ${updatedAppointment.title}`,
        existingAppointment,
        updatedAppointment,
        req
      );

      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Delete calendar appointment
  app.delete("/api/calendar-appointments/:id", async (req, res) => {
    try {
      const [existingAppointment] = await db
        .select()
        .from(calendarAppointments)
        .where(eq(calendarAppointments.id, req.params.id));

      if (!existingAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      await db.delete(calendarAppointments).where(eq(calendarAppointments.id, req.params.id));

      await createAuditLog(
        "deleted",
        "appointment",
        existingAppointment.id,
        existingAppointment.title,
        undefined,
        `Deleted appointment: ${existingAppointment.title}`,
        existingAppointment,
        null,
        req
      );

      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  app.put("/api/calendars/:id", async (req, res) => {
    try {
      const [existingCalendar] = await db
        .select()
        .from(calendars)
        .where(eq(calendars.id, req.params.id));

      if (!existingCalendar) {
        return res.status(404).json({ message: "Calendar not found" });
      }

      // Extract assignedStaff and other non-schema fields from request body before validation
      const { 
        assignedStaff, 
        color, 
        timezone, 
        meetingInviteTitle, 
        slotInterval, 
        maxBookingsPerDay, 
        maxBookersPerSlot, 
        publicUrl,
        ...calendarData 
      } = req.body;
      
      // Add required fields that may be missing
      const calendarUpdateData = {
        ...calendarData,
        type: existingCalendar.type, // Keep existing type
        durationUnit: existingCalendar.durationUnit, // Keep existing duration unit
        createdBy: existingCalendar.createdBy, // Keep existing creator
        customFieldIds: existingCalendar.customFieldIds || [], // Keep existing custom fields
      };
      
      console.log('Calendar update request body:', req.body);
      console.log('Calendar data after filtering:', calendarUpdateData);
      
      const validatedData = insertCalendarSchema.parse(calendarUpdateData);
      
      const [updatedCalendar] = await db
        .update(calendars)
        .set(validatedData)
        .where(eq(calendars.id, req.params.id))
        .returning();

      // Handle staff assignment if provided
      if (assignedStaff !== undefined) {
        // First, remove existing staff assignments for this calendar
        await db
          .delete(calendarStaff)
          .where(eq(calendarStaff.calendarId, req.params.id));
        
        // If assignedStaff is not empty, add the new assignment
        if (assignedStaff && assignedStaff.trim() !== "") {
          await db
            .insert(calendarStaff)
            .values({
              calendarId: req.params.id,
              staffId: assignedStaff,
              isActive: true,
            });
        }
      }

      await createAuditLog(
        "updated",
        "calendar",
        updatedCalendar.id,
        updatedCalendar.name,
        undefined,
        `Updated calendar: ${updatedCalendar.name}`,
        existingCalendar,
        updatedCalendar,
        req
      );

      res.json(updatedCalendar);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error updating calendar:', error);
      res.status(500).json({ message: "Failed to update calendar" });
    }
  });

  app.delete("/api/calendars/:id", async (req, res) => {
    try {
      const [existingCalendar] = await db
        .select()
        .from(calendars)
        .where(eq(calendars.id, req.params.id));

      if (!existingCalendar) {
        return res.status(404).json({ message: "Calendar not found" });
      }

      await db.delete(calendars).where(eq(calendars.id, req.params.id));

      await createAuditLog(
        "deleted",
        "calendar",
        existingCalendar.id,
        existingCalendar.name,
        undefined,
        `Deleted calendar: ${existingCalendar.name}`,
        existingCalendar,
        null,
        req
      );

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting calendar:', error);
      res.status(500).json({ message: "Failed to delete calendar" });
    }
  });

  // Calendar Appointments Routes
  app.get("/api/appointments", async (req, res) => {
    try {
      const calendarId = req.query.calendarId as string;
      const clientId = req.query.clientId as string;
      const staffId = req.query.staffId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      let query = db
        .select({
          id: calendarAppointments.id,
          title: calendarAppointments.title,
          description: calendarAppointments.description,
          startTime: calendarAppointments.startTime,
          endTime: calendarAppointments.endTime,
          status: calendarAppointments.status,
          location: calendarAppointments.location,
          calendarId: calendarAppointments.calendarId,
          clientId: calendarAppointments.clientId,
          assignedTo: calendarAppointments.assignedTo,
          customFieldData: calendarAppointments.customFieldData,
          createdAt: calendarAppointments.createdAt,
        })
        .from(calendarAppointments);

      if (calendarId) {
        query = query.where(eq(calendarAppointments.calendarId, calendarId));
      }

      if (clientId) {
        query = query.where(eq(calendarAppointments.clientId, clientId));
      }

      const appointments = await query.orderBy(asc(calendarAppointments.startTime));

      res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      // Convert date strings to Date objects before validation
      const requestData = {
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime)
      };
      
      const validatedData = insertCalendarAppointmentSchema.parse(requestData);
      
      const [newAppointment] = await db
        .insert(calendarAppointments)
        .values(validatedData)
        .returning();

      await createAuditLog(
        "created",
        "appointment",
        newAppointment.id,
        newAppointment.title,
        undefined,
        `Created appointment: ${newAppointment.title}`,
        null,
        newAppointment,
        req
      );

      res.status(201).json(newAppointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error creating appointment:', error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Public Booking Route - for external bookings via public calendar URLs
  app.post("/api/calendars/:customUrl/book", async (req, res) => {
    try {
      // First, get the calendar by custom URL
      const [calendar] = await db
        .select()
        .from(calendars)
        .where(eq(calendars.customUrl, req.params.customUrl));

      if (!calendar) {
        return res.status(404).json({ message: "Calendar not found" });
      }

      if (!calendar.isActive) {
        return res.status(400).json({ message: "Calendar is not accepting bookings" });
      }

      // Get assigned staff member for this calendar
      const [assignedStaffRecord] = await db
        .select({ staffId: calendarStaff.staffId })
        .from(calendarStaff)
        .where(and(
          eq(calendarStaff.calendarId, calendar.id),
          eq(calendarStaff.isActive, true)
        ));

      if (!assignedStaffRecord) {
        return res.status(400).json({ message: "No staff member assigned to this calendar" });
      }

      const { date, time, name, email, phone, message } = req.body;

      // Parse the date and time to create proper timestamps
      const startTime = new Date(`${date}T${time}:00`);
      const endTime = new Date(startTime.getTime() + (calendar.duration * 60000)); // Add duration in milliseconds

      // Create the appointment
      const appointmentData = {
        calendarId: calendar.id,
        assignedTo: assignedStaffRecord.staffId,
        title: `${name} - ${calendar.name}`,
        description: message || '',
        startTime,
        endTime,
        status: "confirmed",
        location: calendar.location || '',
        locationDetails: calendar.locationDetails || '',
        timezone: 'UTC', // Default timezone for public bookings
        bookerName: name,
        bookerEmail: email,
        bookerPhone: phone || '',
        bookingSource: "public",
        bookingIp: req.ip,
        bookingUserAgent: req.get('User-Agent') || '',
      };

      const [newAppointment] = await db
        .insert(calendarAppointments)
        .values(appointmentData)
        .returning();

      await createAuditLog(
        "created",
        "appointment",
        newAppointment.id,
        newAppointment.title,
        undefined,
        `Public booking created: ${newAppointment.title}`,
        null,
        newAppointment,
        req
      );

      res.status(201).json({
        success: true,
        appointment: newAppointment,
        message: "Booking confirmed successfully"
      });
    } catch (error) {
      console.error('Error creating public booking:', error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Custom Field File Upload Routes
  app.post("/api/custom-field-files/upload-url", async (req, res) => {
    try {
      const { customFieldId, clientId, fileName, fileSize, fileType } = req.body;
      
      // Validate file type
      if (!validateFileType(fileName)) {
        return res.status(400).json({ 
          message: "File type not supported", 
          supportedTypes: "PDF, DOC, DOCX, XLS, XLSX, TXT, RTF, Pages, Numbers, JPG, PNG, GIF, TIFF, PPT, PPTX, KEY" 
        });
      }
      
      if (isForbiddenFileType(fileName)) {
        return res.status(400).json({ 
          message: "File type is forbidden for security reasons" 
        });
      }
      
      // Validate file size (250MB limit)
      if (fileSize > 250 * 1024 * 1024) {
        return res.status(400).json({ 
          message: "File size exceeds 250MB limit" 
        });
      }
      
      const objectStorage = new ObjectStorageService();
      const uploadUrl = await objectStorage.getCustomFieldFileUploadURL(fileType);
      const filePath = objectStorage.extractFilePathFromUrl(uploadUrl);
      
      res.json({ uploadUrl, filePath });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.post("/api/custom-field-files", async (req, res) => {
    try {
      const data = req.body;
      
      // Sanitize filename for security
      data.fileName = sanitizeFileName(data.fileName);
      
      // Add default uploadedBy (in a real app, this would come from session)
      data.uploadedBy = "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      const validatedData = insertCustomFieldFileUploadSchema.parse(data);
      
      // Direct database insert to bypass the storage interface issue
      const fileUploadResult = await db.insert(customFieldFileUploads).values(validatedData).returning();
      const fileUpload = fileUploadResult[0];
      
      await createAuditLog(
        "created",
        "custom_field_file",
        fileUpload.id,
        fileUpload.originalFileName,
        undefined,
        `Uploaded file: ${fileUpload.originalFileName}`,
        null,
        fileUpload,
        req
      );
      
      res.json(fileUpload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error creating file upload record:', error);
      res.status(500).json({ message: "Failed to create file upload record" });
    }
  });

  app.get("/api/custom-field-files", async (req, res) => {
    try {
      const { clientId, customFieldId } = req.query as { clientId?: string; customFieldId?: string };
      
      if (!clientId || !customFieldId) {
        return res.status(400).json({ message: "clientId and customFieldId are required" });
      }
      
      const fileUploads = await db.select()
        .from(customFieldFileUploads)
        .where(and(
          eq(customFieldFileUploads.clientId, clientId),
          eq(customFieldFileUploads.customFieldId, customFieldId)
        ));
      res.json(fileUploads);
    } catch (error) {
      console.error('Error fetching custom field file uploads:', error);
      res.status(500).json({ message: "Failed to fetch file uploads" });
    }
  });

  app.get("/api/custom-field-files/:id/download", async (req, res) => {
    try {
      const fileUploadResult = await db.select()
        .from(customFieldFileUploads)
        .where(eq(customFieldFileUploads.id, req.params.id))
        .limit(1);
      const fileUpload = fileUploadResult[0];
      
      if (!fileUpload) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const objectStorage = new ObjectStorageService();
      const file = await objectStorage.getFileFromPath(fileUpload.filePath);
      
      await objectStorage.downloadFile(file, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "File not found" });
      }
      console.error('Error downloading file:', error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  app.delete("/api/custom-field-files/:id", async (req, res) => {
    try {
      const fileUploadResult = await db.select()
        .from(customFieldFileUploads)
        .where(eq(customFieldFileUploads.id, req.params.id))
        .limit(1);
      const fileUpload = fileUploadResult[0];
      
      if (!fileUpload) {
        return res.status(404).json({ message: "File not found" });
      }
      
      await db.delete(customFieldFileUploads).where(eq(customFieldFileUploads.id, req.params.id));
      
      await createAuditLog(
        "deleted",
        "custom_field_file",
        fileUpload.id,
        fileUpload.originalFileName,
        undefined,
        `Deleted file: ${fileUpload.originalFileName}`,
        fileUpload,
        null,
        req
      );
      
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Test route to bypass storage
  app.get("/api/forms/test", async (req, res) => {
    try {
      console.log("Storage type:", storage.constructor.name);
      console.log("Has getForms?", typeof storage.getForms);
      console.log("Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(storage)).filter(name => name !== 'constructor'));
      res.json({ success: true, storageType: storage.constructor.name });
    } catch (error) {
      console.error("Test error:", error);
      res.status(500).json({ message: "Test failed" });
    }
  });

  // Form Routes - Direct database operations (workaround for storage class compilation issue)
  app.get("/api/forms", async (req, res) => {
    try {
      const formsResult = await db.select().from(forms).orderBy(desc(forms.createdAt));
      res.json(formsResult);
    } catch (error) {
      console.error("Error fetching forms:", error);
      res.status(500).json({ message: "Failed to fetch forms" });
    }
  });

  app.get("/api/forms/:id", async (req, res) => {
    try {
      const formResult = await db.select().from(forms).where(eq(forms.id, req.params.id)).limit(1);
      if (!formResult[0]) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      const fieldsResult = await db.select()
        .from(formFields)
        .where(eq(formFields.formId, req.params.id))
        .orderBy(formFields.order);
      
      res.json({ ...formResult[0], fields: fieldsResult });
    } catch (error) {
      console.error("Error fetching form:", error);
      res.status(500).json({ message: "Failed to fetch form" });
    }
  });

  app.post("/api/forms", async (req, res) => {
    try {
      const { fields, ...formData } = req.body;
      
      // Clean form data and set defaults
      const { updatedAt, createdAt, id, ...cleanFormData } = formData;
      const formToInsert = {
        ...cleanFormData,
        createdBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb", // Default user ID
        status: cleanFormData.status || "draft"
      };
      
      // Create form
      const formResult = await db.insert(forms).values(formToInsert).returning();
      const form = formResult[0];
      
      // Create form fields if provided
      if (fields && Array.isArray(fields)) {
        for (let i = 0; i < fields.length; i++) {
          const field = fields[i];
          await db.insert(formFields).values({
            ...field,
            formId: form.id,
            order: i
          });
        }
      }
      
      res.status(201).json(form);
    } catch (error) {
      console.error("Error creating form:", error);
      res.status(500).json({ message: "Failed to create form" });
    }
  });

  app.put("/api/forms/:id", async (req, res) => {
    try {
      const { fields, ...formData } = req.body;
      
      console.log("PUT /api/forms - received data:", JSON.stringify({ formData, fields }, null, 2));
      
      // Update form - only allow specific fields and ensure proper types
      const allowedFields = ['name', 'description', 'status', 'settings'];
      const cleanFormData: any = {};
      
      for (const field of allowedFields) {
        if (formData[field] !== undefined) {
          cleanFormData[field] = formData[field];
        }
      }
      
      cleanFormData.updatedAt = new Date();
      
      console.log("PUT /api/forms - clean data to update:", JSON.stringify(cleanFormData, null, 2));
      
      const formResult = await db.update(forms)
        .set(cleanFormData)
        .where(eq(forms.id, req.params.id))
        .returning();
      
      if (!formResult[0]) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      const form = formResult[0];
      
      // Update form fields if provided
      if (fields && Array.isArray(fields)) {
        // Get existing fields to delete ones not included
        const existingFields = await db.select()
          .from(formFields)
          .where(eq(formFields.formId, req.params.id));
          
        const fieldIds = fields.map(f => f.id).filter(Boolean);
        
        // Delete removed fields
        for (const existingField of existingFields) {
          if (!fieldIds.includes(existingField.id)) {
            await db.delete(formFields).where(eq(formFields.id, existingField.id));
          }
        }
        
        // Update or create fields
        for (let i = 0; i < fields.length; i++) {
          const field = fields[i];
          if (field.id) {
            // Update existing field
            await db.update(formFields)
              .set({ ...field, order: i })
              .where(eq(formFields.id, field.id));
          } else {
            // Create new field
            await db.insert(formFields).values({
              ...field,
              formId: req.params.id,
              order: i
            });
          }
        }
      }
      
      res.json(form);
    } catch (error) {
      console.error("Error updating form:", error);
      res.status(500).json({ message: "Failed to update form" });
    }
  });

  app.delete("/api/forms/:id", async (req, res) => {
    try {
      // Delete form fields first (cascade delete)
      await db.delete(formFields).where(eq(formFields.formId, req.params.id));
      
      // Delete the form
      const result = await db.delete(forms).where(eq(forms.id, req.params.id)).returning();
      
      if (!result[0]) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      res.json({ message: "Form deleted successfully" });
    } catch (error) {
      console.error("Error deleting form:", error);
      res.status(500).json({ message: "Failed to delete form" });
    }
  });

  app.post("/api/forms/:formId/submit", async (req, res) => {
    try {
      const submissionResult = await db.insert(formSubmissions).values({
        formId: req.params.formId,
        data: req.body.data,
        submitterEmail: req.body.submitterEmail || null,
        submitterName: req.body.submitterName || null,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      }).returning();
      
      res.status(201).json(submissionResult[0]);
    } catch (error) {
      console.error("Error creating form submission:", error);
      res.status(500).json({ message: "Failed to submit form" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
