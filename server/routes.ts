import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import { storage } from "./storage";
import { 
  insertClientSchema, insertProjectSchema, insertProjectTemplateSchema, insertTemplateTaskSchema, insertCampaignSchema, insertLeadSchema, 
  insertTaskSchema, insertTaskActivitySchema, insertInvoiceSchema, insertSocialMediaAccountSchema, 
  insertSocialMediaPostSchema, insertSocialMediaTemplateSchema, 
  insertSocialMediaAnalyticsSchema, insertWorkflowSchema, insertEnhancedTaskSchema,
  insertTaskCategorySchema, insertAutomationTriggerSchema, insertAutomationActionSchema,
  insertTemplateFolderSchema, insertEmailTemplateSchema, insertSmsTemplateSchema,
  insertStaffSchema, insertDepartmentSchema, insertPositionSchema, insertCustomFieldSchema, insertCustomFieldFolderSchema,
  insertTaskCommentSchema, insertTaskCommentReactionSchema, insertCommentFileSchema, insertImageAnnotationSchema,
  insertTagSchema, insertProductSchema, insertProductCategorySchema, insertAuditLogSchema,
  insertRoleSchema, insertPermissionSchema, insertUserRoleSchema, insertNotificationSettingsSchema,
  insertProductBundleSchema, insertBundleProductSchema,
  insertClientNoteSchema, insertClientTaskSchema, insertClientAppointmentSchema,
  insertClientDocumentSchema, insertClientTransactionSchema,
  insertCalendarSchema, insertCalendarStaffSchema, insertCalendarAvailabilitySchema,
  insertCalendarAppointmentSchema, insertCustomFieldFileUploadSchema, insertFormFolderSchema,
  insertLeadPipelineStagSchema, insertLeadNoteSchema, insertLeadAppointmentSchema,
  insertTaskDependencySchema, insertTaskStatusSchema, insertTaskPrioritySchema, insertTaskSettingsSchema,
  insertTeamWorkflowSchema, insertTeamWorkflowStatusSchema,
  users, businessProfile, customFields, customFieldFolders, staff, departments, positions, tags, products, productCategories, auditLogs,
  roles, permissions, userRoles, notificationSettings, clientProducts, clientBundles, productBundles, bundleProducts,
  clientNotes, clientTasks, clientAppointments, clientDocuments, clientTransactions,
  calendars, calendarStaff, calendarAvailability, calendarAppointments, calendarDateOverrides, customFieldFileUploads,
  forms, formFields, formSubmissions, formFolders, leads, leadPipelineStages, leadNotes, leadAppointments, tasks, taskActivities, taskComments, taskCommentReactions, commentFiles, taskAttachments, invoices,
  socialMediaAccounts, socialMediaPosts, workflows, workflowExecutions, automationTriggers, automationActions, imageAnnotations, taskDependencies, notifications,
  taskStatuses, taskPriorities, taskSettings, teamWorkflows, teamWorkflowStatuses
} from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError, validateFileType, isForbiddenFileType, sanitizeFileName } from "./objectStorage";
import { db } from "./db";
import { eq, like, or, and, asc, desc, sql, inArray, isNotNull } from "drizzle-orm";
import { permissionAuditService } from "./permissionAuditService";
import { nanoid } from "nanoid";

// Extend Express Request to include session
declare global {
  namespace Express {
    interface Request {
      session?: {
        userId?: string;
        user?: any;
      };
    }
  }
}

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

              res.json({
                imported,
                errors,
                total: csvData.length,
                errorDetails: errorDetails.slice(0, 10) // Limit error details
              });
              resolve();
            } catch (error) {
              res.status(500).json({ message: "Failed to process CSV data", error: error instanceof Error ? error.message : "Unknown error" });
              resolve();
            }
          })
          .on('error', (error) => {
            res.status(500).json({ message: "Failed to parse CSV", error: error.message });
            resolve();
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
      console.error("Project creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project", error: error instanceof Error ? error.message : "Unknown error" });
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

  // Project Template Routes - temporarily commented out until DbStorage implementation
  /*
  app.get("/api/project-templates", async (req, res) => {
    try {
      const templates = await storage.getProjectTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Failed to fetch project templates:", error);
      res.status(500).json({ message: "Failed to fetch project templates" });
    }
  });
  */

  /*
  app.get("/api/project-templates/:id", async (req, res) => {
    try {
      const template = await storage.getProjectTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Project template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Failed to fetch project template:", error);
      res.status(500).json({ message: "Failed to fetch project template" });
    }
  });

  app.post("/api/project-templates", async (req, res) => {
    try {
      const validatedData = insertProjectTemplateSchema.parse(req.body);
      const template = await storage.createProjectTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Project template creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project template", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  */

  /*
  app.put("/api/project-templates/:id", async (req, res) => {
    try {
      const validatedData = insertProjectTemplateSchema.partial().parse(req.body);
      const template = await storage.updateProjectTemplate(req.params.id, validatedData);
      if (!template) {
        return res.status(404).json({ message: "Project template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Failed to update project template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project template" });
    }
  });

  app.delete("/api/project-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProjectTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Project template not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete project template:", error);
      res.status(500).json({ message: "Failed to delete project template" });
    }
  });

  // Create project from template
  app.post("/api/project-templates/:id/create-project", async (req, res) => {
    try {
      const template = await storage.getProjectTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Project template not found" });
      }

      // Get template tasks
      const templateTasks = await storage.getTemplateTasksByTemplate(req.params.id);

      // Increment template usage
      await storage.incrementTemplateUsage(req.params.id);

      // Create project from template (without client assignment for now)
      const projectData = {
        name: `${template.name} Project`,
        description: template.description,
        clientId: "", // Will need to be set by user
        status: "planning" as const,
        priority: template.priority,
        budget: template.estimatedBudget,
        startDate: new Date(),
        endDate: template.estimatedDuration 
          ? new Date(Date.now() + template.estimatedDuration * 24 * 60 * 60 * 1000)
          : undefined,
        progress: 0,
      };

      const project = await storage.createProject(projectData);
      
      // Create tasks from template tasks
      const taskPromises = templateTasks.map(async (templateTask) => {
        const taskData = {
          title: templateTask.title,
          description: templateTask.description,
          projectId: project.id,
          clientId: "", // Will need to be set
          status: "todo" as const,
          priority: templateTask.priority,
          estimatedHours: templateTask.estimatedHours,
          startDate: templateTask.dayOffset 
            ? new Date(Date.now() + templateTask.dayOffset * 24 * 60 * 60 * 1000)
            : undefined,
          assignedTo: null, // Template role assignments would need to be mapped
          parentTaskId: null, // Dependencies would need to be handled
        };
        
        return storage.createTask(taskData);
      });

      await Promise.all(taskPromises);

      res.status(201).json({ 
        message: "Project created from template successfully",
        project,
        tasksCreated: templateTasks.length
      });
    } catch (error) {
      console.error("Failed to create project from template:", error);
      res.status(500).json({ message: "Failed to create project from template", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  */

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

  // Lead routes - Database Storage
  app.get("/api/leads", async (req, res) => {
    try {
      const { search } = req.query;
      
      let leadsQuery;
      if (search && typeof search === 'string') {
        leadsQuery = db.select()
          .from(leads)
          .where(
            or(
              like(leads.name, `%${search}%`),
              like(leads.email, `%${search}%`),
              like(leads.company, `%${search}%`)
            )
          )
          .orderBy(desc(leads.createdAt));
      } else {
        leadsQuery = db.select()
          .from(leads)
          .orderBy(desc(leads.createdAt));
      }
      
      const leadsList = await leadsQuery;
      res.json(leadsList);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const [lead] = await db.select()
        .from(leads)
        .where(eq(leads.id, req.params.id));
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const { customFields, ...leadData } = req.body;
      const validatedData = insertLeadSchema.parse({
        ...leadData,
        customFieldData: customFields || null
      });
      
      const [newLead] = await db.insert(leads)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newLead);
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", async (req, res) => {
    try {
      const { customFields, ...leadData } = req.body;
      const validatedData = insertLeadSchema.partial().parse({
        ...leadData,
        customFieldData: customFields !== undefined ? customFields : undefined
      });
      
      const [updatedLead] = await db.update(leads)
        .set(validatedData)
        .where(eq(leads.id, req.params.id))
        .returning();
      
      if (!updatedLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const deletedRows = await db.delete(leads)
        .where(eq(leads.id, req.params.id));
      
      if (deletedRows.rowCount === 0) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Lead Pipeline Stage routes
  app.get("/api/lead-pipeline-stages", async (req, res) => {
    try {
      const stages = await db.select()
        .from(leadPipelineStages)
        .where(eq(leadPipelineStages.isActive, true))
        .orderBy(asc(leadPipelineStages.order));
      
      res.json(stages);
    } catch (error) {
      console.error("Error fetching pipeline stages:", error);
      res.status(500).json({ message: "Failed to fetch pipeline stages" });
    }
  });

  app.post("/api/lead-pipeline-stages", async (req, res) => {
    try {
      const validatedData = insertLeadPipelineStagSchema.parse(req.body);
      
      // Get the highest order number and increment it
      const maxOrderResult = await db.select({ maxOrder: sql<number>`MAX(${leadPipelineStages.order})` })
        .from(leadPipelineStages);
      const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;
      
      const [newStage] = await db.insert(leadPipelineStages)
        .values({
          ...validatedData,
          order: nextOrder
        })
        .returning();
      
      res.status(201).json(newStage);
    } catch (error) {
      console.error("Error creating pipeline stage:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create pipeline stage" });
    }
  });

  app.put("/api/lead-pipeline-stages/:id", async (req, res) => {
    try {
      const validatedData = insertLeadPipelineStagSchema.partial().parse(req.body);
      
      const [updatedStage] = await db.update(leadPipelineStages)
        .set(validatedData)
        .where(eq(leadPipelineStages.id, req.params.id))
        .returning();
      
      if (!updatedStage) {
        return res.status(404).json({ message: "Pipeline stage not found" });
      }
      res.json(updatedStage);
    } catch (error) {
      console.error("Error updating pipeline stage:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update pipeline stage" });
    }
  });

  app.delete("/api/lead-pipeline-stages/:id", async (req, res) => {
    try {
      // Check if any leads are using this stage
      const leadsUsingStage = await db.select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(eq(leads.stageId, req.params.id));
      
      if (leadsUsingStage[0]?.count > 0) {
        return res.status(400).json({ 
          message: "Cannot delete stage that has leads assigned to it. Please move leads to another stage first." 
        });
      }
      
      const [deletedStage] = await db.delete(leadPipelineStages)
        .where(eq(leadPipelineStages.id, req.params.id))
        .returning();
      
      if (!deletedStage) {
        return res.status(404).json({ message: "Pipeline stage not found" });
      }
      res.json({ message: "Pipeline stage deleted successfully" });
    } catch (error) {
      console.error("Error deleting pipeline stage:", error);
      res.status(500).json({ message: "Failed to delete pipeline stage" });
    }
  });

  // Update stage order (for drag-and-drop reordering)
  app.put("/api/lead-pipeline-stages/reorder", async (req, res) => {
    try {
      const { stageOrders } = req.body; // Array of {id, order}
      
      if (!Array.isArray(stageOrders)) {
        return res.status(400).json({ message: "stageOrders must be an array" });
      }
      
      // Update each stage's order
      for (const { id, order } of stageOrders) {
        await db.update(leadPipelineStages)
          .set({ order })
          .where(eq(leadPipelineStages.id, id));
      }
      
      res.json({ message: "Stage order updated successfully" });
    } catch (error) {
      console.error("Error reordering stages:", error);
      res.status(500).json({ message: "Failed to reorder stages" });
    }
  });

  // Move lead to different stage
  app.put("/api/leads/:id/stage", async (req, res) => {
    try {
      const { stageId } = req.body;
      
      if (!stageId) {
        return res.status(400).json({ message: "stageId is required" });
      }
      
      // Verify stage exists
      const [stage] = await db.select()
        .from(leadPipelineStages)
        .where(eq(leadPipelineStages.id, stageId));
      
      if (!stage) {
        return res.status(404).json({ message: "Pipeline stage not found" });
      }
      
      // Get current lead to track history
      const [currentLead] = await db.select()
        .from(leads)
        .where(eq(leads.id, req.params.id));
      
      if (!currentLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Update stage history
      const stageHistory = Array.isArray(currentLead.stageHistory) ? currentLead.stageHistory : [];
      const historyEntry = {
        fromStageId: currentLead.stageId,
        toStageId: stageId,
        movedAt: new Date().toISOString(),
        movedBy: "current-user" // In real app, get from session
      };
      
      const [updatedLead] = await db.update(leads)
        .set({
          stageId,
          stageHistory: [...stageHistory, historyEntry]
        })
        .where(eq(leads.id, req.params.id))
        .returning();
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error moving lead stage:", error);
      res.status(500).json({ message: "Failed to move lead stage" });
    }
  });

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { search, status, priority, assignedTo, clientId, projectId } = req.query;
      
      const conditions = [];
      
      if (search && typeof search === 'string') {
        conditions.push(
          or(
            like(tasks.title, `%${search}%`),
            like(tasks.description, `%${search}%`)
          )
        );
      }
      
      if (status && typeof status === 'string') {
        conditions.push(eq(tasks.status, status));
      }
      
      if (priority && typeof priority === 'string') {
        conditions.push(eq(tasks.priority, priority));
      }
      
      if (assignedTo && typeof assignedTo === 'string') {
        conditions.push(eq(tasks.assignedTo, assignedTo));
      }
      
      if (clientId && typeof clientId === 'string') {
        conditions.push(eq(tasks.clientId, clientId));
      }
      
      if (projectId && typeof projectId === 'string') {
        conditions.push(eq(tasks.projectId, projectId));
      }
      
      let tasksList;
      if (conditions.length > 0) {
        tasksList = await db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
      } else {
        tasksList = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
      }
      res.json(tasksList);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Bulk delete tasks - MUST come before individual task routes with parameters
  app.delete("/api/tasks/bulk-delete", async (req, res) => {
    try {
      const { taskIds } = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: "Invalid or empty taskIds array" });
      }

      console.log(`BULK DELETE tasks request - Task IDs: ${taskIds.join(', ')}, User ID: ${userId}`);

      // Check if user has permission to delete tasks
      const canDelete = await hasPermission(userId, 'tasks', 'canDelete');

      let deletedCount = 0;
      const errors = [];

      for (const taskId of taskIds) {
        try {
          // Check if task exists and get its details
          const taskToDelete = await db.select()
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

          if (taskToDelete.length === 0) {
            errors.push(`Task not found: ${taskId}`);
            continue;
          }

          const task = taskToDelete[0];
          const isTaskOwner = task.createdBy === userId || task.assignedTo === userId;

          if (!canDelete && !isTaskOwner) {
            errors.push(`Access denied for task: ${taskId}`);
            continue;
          }

          // Delete sub-tasks first
          const subTasks = await db.select()
            .from(tasks)
            .where(eq(tasks.parentTaskId, taskId));

          if (subTasks.length > 0) {
            for (const subTask of subTasks) {
              await db.delete(tasks).where(eq(tasks.id, subTask.id));
            }
          }

          // Delete task dependencies
          await db.delete(taskDependencies).where(
            or(
              eq(taskDependencies.taskId, taskId),
              eq(taskDependencies.dependsOnTaskId, taskId)
            )
          );

          // Delete task comment files
          const commentFilesToDelete = await db.select()
            .from(commentFiles)
            .leftJoin(taskComments, eq(commentFiles.commentId, taskComments.id))
            .where(eq(taskComments.taskId, taskId));

          for (const file of commentFilesToDelete) {
            await db.delete(commentFiles).where(eq(commentFiles.id, file.comment_files.id));
          }

          // Delete task comment reactions
          await db.delete(taskCommentReactions)
            .where(sql`comment_id IN (SELECT id FROM task_comments WHERE task_id = ${taskId})`);

          // Delete task comments
          await db.delete(taskComments)
            .where(eq(taskComments.taskId, taskId));

          // Delete task activities
          await db.delete(taskActivities)
            .where(eq(taskActivities.taskId, taskId));

          // Delete task attachments
          await db.delete(taskAttachments)
            .where(eq(taskAttachments.taskId, taskId));

          // Delete the main task
          await db.delete(tasks).where(eq(tasks.id, taskId));

          // Create audit log
          await createAuditLog(
            "deleted",
            "task",
            taskId,
            "Task",
            userId,
            "Task bulk deleted",
            null,
            null,
            req
          );

          deletedCount++;
        } catch (error) {
          console.error(`Error deleting task ${taskId}:`, error);
          errors.push(`Failed to delete task: ${taskId}`);
        }
      }

      console.log(`Bulk deletion completed - ${deletedCount} tasks deleted, ${errors.length} errors`);
      
      res.json({
        message: `Successfully deleted ${deletedCount} tasks`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error in bulk delete tasks:", error);
      res.status(500).json({ message: "Failed to bulk delete tasks", error: error.message });
    }
  });

  // Bulk update tasks - MUST come before individual task routes with parameters
  app.put("/api/tasks/bulk-update", async (req, res) => {
    try {
      const { taskIds, updates } = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: "Invalid or empty taskIds array" });
      }

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ message: "Updates object is required" });
      }

      console.log(`BULK UPDATE tasks request - Task IDs: ${taskIds.join(', ')}, Updates:`, updates, `User ID: ${userId}`);

      // Check if user has permission to edit tasks
      const canEdit = await hasPermission(userId, 'tasks', 'canEdit');

      let updatedCount = 0;
      const errors = [];

      for (const taskId of taskIds) {
        try {
          // Check if task exists and get its details
          const existingTask = await db.select()
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

          if (existingTask.length === 0) {
            errors.push(`Task not found: ${taskId}`);
            continue;
          }

          const task = existingTask[0];
          const isTaskOwner = task.createdBy === userId || task.assignedTo === userId;

          if (!canEdit && !isTaskOwner) {
            errors.push(`Access denied for task: ${taskId}`);
            continue;
          }

          // Validate the updates using partial schema
          const validatedUpdates = insertTaskSchema.partial().parse(updates);

          // Update the task
          await db.update(tasks)
            .set({
              ...validatedUpdates,
              updatedAt: new Date()
            })
            .where(eq(tasks.id, taskId));

          // Create audit log for bulk update
          await createAuditLog(
            "updated",
            "task",
            taskId,
            "Task",
            userId,
            "Task bulk updated",
            task,
            validatedUpdates,
            req
          );

          updatedCount++;
        } catch (error) {
          console.error(`Error updating task ${taskId}:`, error);
          errors.push(`Failed to update task: ${taskId}`);
        }
      }

      console.log(`Bulk update completed - ${updatedCount} tasks updated, ${errors.length} errors`);
      
      res.json({
        message: `Successfully updated ${updatedCount} tasks`,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error in bulk update tasks:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to bulk update tasks", error: error.message });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const [task] = await db.select()
        .from(tasks)
        .where(eq(tasks.id, req.params.id));
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Helper function to calculate next occurrence date
  const calculateNextOccurrence = (startDate: Date, interval: number, unit: string, occurrenceCount: number = 1): Date => {
    const nextDate = new Date(startDate);
    const totalAmount = interval * occurrenceCount;
    
    switch (unit) {
      case "hours":
        nextDate.setHours(nextDate.getHours() + totalAmount);
        break;
      case "days":
        nextDate.setDate(nextDate.getDate() + totalAmount);
        break;
      case "weeks":
        nextDate.setDate(nextDate.getDate() + (totalAmount * 7));
        break;
      case "months":
        nextDate.setMonth(nextDate.getMonth() + totalAmount);
        break;
      case "years":
        nextDate.setFullYear(nextDate.getFullYear() + totalAmount);
        break;
    }
    
    return nextDate;
  };

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      
      const result = await db.insert(tasks)
        .values(validatedData)
        .returning();
      const newTask = result[0];
      
      // Note: Recurring task instances will be created on-demand when tasks are completed
      
      res.status(201).json(newTask);
    } catch (error) {
      console.error("Error creating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // API endpoint to generate recurring task instances (can be called by cron job)
  app.post("/api/tasks/generate-recurring", async (req, res) => {
    try {
      // Find all recurring tasks that need new instances
      const recurringTasks = await db.select()
        .from(tasks)
        .where(eq(tasks.isRecurring, true));
      
      let totalCreated = 0;
      
      for (const task of recurringTasks) {
        if (!task.startDate || !task.createIfOverdue) continue;
        
        // Find existing instances to determine next occurrence
        const existingInstances = await db.select()
          .from(tasks)
          .where(
            and(
              eq(tasks.title, task.title),
              eq(tasks.clientId, task.clientId || ""),
              eq(tasks.projectId, task.projectId || "")
            )
          )
          .orderBy(desc(tasks.startDate));
        
        const latestInstance = existingInstances[0];
        const nextStartDate = calculateNextOccurrence(
          new Date(latestInstance.startDate || task.startDate),
          task.recurringInterval || 1,
          task.recurringUnit || "days",
          1
        );
        
        // Check if we should create a new instance
        const now = new Date();
        const shouldCreate = nextStartDate <= now;
        
        if (shouldCreate) {
          // Check end conditions
          let shouldStop = false;
          
          if (task.recurringEndType === "after_occurrences" && task.recurringEndOccurrences) {
            const totalInstances = existingInstances.length;
            if (totalInstances >= task.recurringEndOccurrences) {
              shouldStop = true;
            }
          }
          
          if (task.recurringEndType === "on_date" && task.recurringEndDate) {
            if (nextStartDate > new Date(task.recurringEndDate)) {
              shouldStop = true;
            }
          }
          
          if (!shouldStop) {
            let nextDueDate = null;
            if (task.dueDate) {
              nextDueDate = calculateNextOccurrence(
                new Date(latestInstance.dueDate || task.dueDate),
                task.recurringInterval || 1,
                task.recurringUnit || "days",
                1
              );
            }
            
            const newInstanceData = {
              title: task.title,
              description: task.description,
              status: "pending" as const,
              priority: task.priority,
              assignedTo: task.assignedTo,
              clientId: task.clientId,
              projectId: task.projectId,
              campaignId: task.campaignId,
              startDate: nextStartDate,
              dueDate: nextDueDate,
              isRecurring: false,
            };
            
            await db.insert(tasks).values(newInstanceData);
            totalCreated++;
          }
        }
      }
      
      res.json({ message: `Generated ${totalCreated} recurring task instances` });
    } catch (error) {
      console.error("Error generating recurring tasks:", error);
      res.status(500).json({ message: "Failed to generate recurring tasks" });
    }
  });

  // Helper function to log task activities
  const logTaskActivity = async (taskId: string, actionType: string, fieldName: string, oldValue: any, newValue: any, userId: string = 'system', userName: string = 'System') => {
    try {
      const formatValue = (value: any) => {
        if (value === null || value === undefined) return null;
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      };

      const activity = {
        taskId,
        actionType,
        fieldName,
        oldValue: formatValue(oldValue),
        newValue: formatValue(newValue),
        userId,
        userName
      };

      await db.insert(taskActivities).values(activity);
    } catch (error) {
      console.error("Error logging task activity:", error);
    }
  };

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      // Get the current task data first
      const currentTaskResult = await db.select()
        .from(tasks)
        .where(eq(tasks.id, req.params.id));
      
      const currentTask = currentTaskResult[0];
      if (!currentTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const validatedData = insertTaskSchema.partial().parse(req.body);
      
      // Check task dependencies before allowing completion
      if (validatedData.status === 'completed' && currentTask.status !== 'completed') {
        // Get all dependencies for this task
        const dependencies = await db
          .select({
            dependencyType: taskDependencies.dependencyType,
            dependsOnTask: {
              id: tasks.id,
              title: tasks.title,
              status: tasks.status,
              completedAt: tasks.completedAt,
            }
          })
          .from(taskDependencies)
          .innerJoin(tasks, eq(taskDependencies.dependsOnTaskId, tasks.id))
          .where(eq(taskDependencies.taskId, req.params.id));

        // Check if all dependencies are satisfied
        const unsatisfiedDependencies = [];
        
        for (const dep of dependencies) {
          const { dependencyType, dependsOnTask } = dep;
          let isSatisfied = false;

          switch (dependencyType) {
            case 'finish_to_start':
            case 'finish_to_finish':
              // Dependency task must be completed
              isSatisfied = dependsOnTask.status === 'completed' || dependsOnTask.completedAt !== null;
              break;
            case 'start_to_start':
            case 'start_to_finish':
              // Dependency task must be started (not in todo status)
              isSatisfied = dependsOnTask.status !== 'todo';
              break;
          }

          if (!isSatisfied) {
            unsatisfiedDependencies.push({
              taskTitle: dependsOnTask.title,
              dependencyType,
              currentStatus: dependsOnTask.status
            });
          }
        }

        if (unsatisfiedDependencies.length > 0) {
          const dependencyMessages = unsatisfiedDependencies.map(dep => {
            const typeLabel = {
              finish_to_start: 'must be completed first',
              start_to_start: 'must be started first', 
              finish_to_finish: 'must be completed first',
              start_to_finish: 'must be started first'
            }[dep.dependencyType];
            
            return `• "${dep.taskTitle}" ${typeLabel}`;
          });

          return res.status(400).json({ 
            message: `This task has dependencies that need to be completed first`,
            details: dependencyMessages.join('\n'),
            unsatisfiedDependencies,
            isDependencyError: true
          });
        }
      }
      
      const [updatedTask] = await db.update(tasks)
        .set(validatedData)
        .where(eq(tasks.id, req.params.id))
        .returning();

      // Log activities for changed fields
      const currentUser = 'current-user'; // Replace with actual user from session
      const currentUserName = 'Current User'; // Replace with actual user name

      // Check for status changes
      if (validatedData.status && validatedData.status !== currentTask.status) {
        await logTaskActivity(req.params.id, 'status_change', 'status', currentTask.status, validatedData.status, currentUser, currentUserName);
      }

      // Check for assignee changes
      if (validatedData.assignedTo !== undefined && validatedData.assignedTo !== currentTask.assignedTo) {
        const getStaffName = async (staffId: string | null) => {
          if (!staffId) return 'Unassigned';
          const [staffMember] = await db.select().from(staff).where(eq(staff.id, staffId));
          return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown User';
        };

        const oldAssigneeName = await getStaffName(currentTask.assignedTo);
        const newAssigneeName = await getStaffName(validatedData.assignedTo);
        
        await logTaskActivity(req.params.id, 'assignee_change', 'assignedTo', oldAssigneeName, newAssigneeName, currentUser, currentUserName);
      }

      // Check for date changes
      if (validatedData.startDate !== undefined) {
        const oldDate = currentTask.startDate;
        const newDate = validatedData.startDate;
        if (JSON.stringify(oldDate) !== JSON.stringify(newDate)) {
          await logTaskActivity(req.params.id, 'date_change', 'startDate', oldDate, newDate, currentUser, currentUserName);
        }
      }

      if (validatedData.dueDate !== undefined) {
        const oldDate = currentTask.dueDate;
        const newDate = validatedData.dueDate;
        if (JSON.stringify(oldDate) !== JSON.stringify(newDate)) {
          await logTaskActivity(req.params.id, 'date_change', 'dueDate', oldDate, newDate, currentUser, currentUserName);
        }
      }

      // Check for priority changes
      if (validatedData.priority !== undefined && validatedData.priority !== currentTask.priority) {
        await logTaskActivity(req.params.id, 'priority_change', 'priority', currentTask.priority, validatedData.priority, currentUser, currentUserName);
      }

      // Check for time tracking changes
      if (validatedData.timeTracked !== undefined && validatedData.timeTracked !== currentTask.timeTracked) {
        await logTaskActivity(req.params.id, 'time_tracking', 'timeTracked', currentTask.timeTracked, validatedData.timeTracked, currentUser, currentUserName);
      }

      if (validatedData.timeEntries !== undefined) {
        const oldEntries = currentTask.timeEntries || [];
        const newEntries = validatedData.timeEntries || [];
        if (JSON.stringify(oldEntries) !== JSON.stringify(newEntries)) {
          await logTaskActivity(req.params.id, 'time_tracking', 'timeEntries', 'Time entry updated', 'Time tracking session', currentUser, currentUserName);
        }
      }

      // Check for time estimate changes
      if (validatedData.timeEstimate !== undefined && validatedData.timeEstimate !== currentTask.timeEstimate) {
        const formatTimeEstimate = (minutes: number | null) => {
          if (!minutes) return 'No estimate';
          if (minutes < 60) return `${minutes} minutes`;
          const hours = Math.floor(minutes / 60);
          const remainingMinutes = minutes % 60;
          if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
          return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
        };

        const oldEstimateDisplay = formatTimeEstimate(currentTask.timeEstimate);
        const newEstimateDisplay = formatTimeEstimate(validatedData.timeEstimate);
        
        await logTaskActivity(req.params.id, 'time_estimate_change', 'timeEstimate', oldEstimateDisplay, newEstimateDisplay, currentUser, currentUserName);
      }

      // ClickUp-style recurring task logic: Create next instance only when current task is completed
      if (validatedData.status === 'completed' && 
          currentTask.status !== 'completed' && 
          currentTask.isRecurring && 
          currentTask.startDate) {
        
        // Check if we should create the next occurrence based on end conditions
        let shouldCreateNext = true;
        
        // For "after_occurrences" end type, we need to count how many instances have been created
        if (currentTask.recurringEndType === "after_occurrences" && currentTask.recurringEndOccurrences) {
          // Count all instances of this recurring task series (including completed and pending)
          const totalInstances = await db
            .select({ count: sql`count(*)` })
            .from(tasks)
            .where(eq(tasks.title, currentTask.title));
          
          const totalCount = Number(totalInstances[0]?.count || 0);
          
          // If we've reached the limit, don't create another
          if (totalCount >= currentTask.recurringEndOccurrences) {
            shouldCreateNext = false;
          }
        }
        
        // For "on_date" end type, check if next occurrence would exceed end date
        if (currentTask.recurringEndType === "on_date" && currentTask.recurringEndDate) {
          const nextStartDate = calculateNextOccurrence(
            new Date(currentTask.startDate), 
            currentTask.recurringInterval || 1, 
            currentTask.recurringUnit || "days", 
            1
          );
          
          if (nextStartDate > new Date(currentTask.recurringEndDate)) {
            shouldCreateNext = false;
          }
        }
        
        if (shouldCreateNext) {
          // Calculate next occurrence dates
          const nextStartDate = calculateNextOccurrence(
            new Date(currentTask.startDate), 
            currentTask.recurringInterval || 1, 
            currentTask.recurringUnit || "days", 
            1
          );
          
          let nextDueDate = null;
          if (currentTask.dueDate) {
            nextDueDate = calculateNextOccurrence(
              new Date(currentTask.dueDate), 
              currentTask.recurringInterval || 1, 
              currentTask.recurringUnit || "days", 
              1
            );
          }
          
          // Create the next task instance
          const nextInstanceData = {
            title: currentTask.title,
            description: currentTask.description,
            status: 'pending' as const,
            priority: currentTask.priority,
            assignedTo: currentTask.assignedTo,
            clientId: currentTask.clientId,
            projectId: currentTask.projectId,
            campaignId: currentTask.campaignId,
            startDate: nextStartDate,
            dueDate: nextDueDate,
            timeEstimate: currentTask.timeEstimate,
            parentTaskId: currentTask.parentTaskId,
            // Keep the original recurring settings in the new instance
            isRecurring: true,
            recurringInterval: currentTask.recurringInterval,
            recurringUnit: currentTask.recurringUnit,
            recurringEndType: currentTask.recurringEndType,
            recurringEndDate: currentTask.recurringEndDate,
            recurringEndOccurrences: currentTask.recurringEndOccurrences,
            createIfOverdue: currentTask.createIfOverdue
          };
          
          await db.insert(tasks).values(nextInstanceData);
          
          // Log the recurring task creation
          await logTaskActivity(
            req.params.id, 
            'recurring_task_created', 
            'status', 
            'N/A', 
            `Next recurring task created for ${nextStartDate.toDateString()}`,
            currentUser, 
            currentUserName
          );
        }
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.get("/api/tasks/:id/activities", async (req, res) => {
    try {
      const activities = await db.select()
        .from(taskActivities)
        .where(eq(taskActivities.taskId, req.params.id))
        .orderBy(desc(taskActivities.createdAt));
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching task activities:", error);
      res.status(500).json({ message: "Failed to fetch task activities" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      console.log(`DELETE task request - Task ID: ${req.params.id}, User ID: ${userId}`);
      
      // Check if task exists and get its details
      const taskToDelete = await db.select()
        .from(tasks)
        .where(eq(tasks.id, req.params.id))
        .limit(1);
      
      if (taskToDelete.length === 0) {
        console.log(`Task not found: ${req.params.id}`);
        return res.status(404).json({ message: "Task not found" });
      }
      
      const task = taskToDelete[0];
      console.log(`Task found:`, { id: task.id, title: task.title, createdBy: task.createdBy, assignedTo: task.assignedTo });
      
      // Check if user has permission to delete tasks (admin or task creator/assignee)
      const canDelete = await hasPermission(userId, 'tasks', 'canDelete');
      const isTaskOwner = task.createdBy === userId || task.assignedTo === userId;
      
      console.log(`Permission check - canDelete: ${canDelete}, isTaskOwner: ${isTaskOwner}`);
      
      if (!canDelete && !isTaskOwner) {
        console.log(`Access denied for user ${userId} to delete task ${req.params.id}`);
        return res.status(403).json({ message: "Access denied. You can only delete tasks you created or are assigned to." });
      }

      // Delete sub-tasks first if any exist
      const subTasks = await db.select()
        .from(tasks)
        .where(eq(tasks.parentTaskId, req.params.id));
      
      console.log(`Found ${subTasks.length} sub-tasks to delete`);
      
      if (subTasks.length > 0) {
        // Delete comments for sub-tasks first
        for (const subTask of subTasks) {
          await db.delete(taskComments)
            .where(eq(taskComments.taskId, subTask.id));
        }
        await db.delete(tasks)
          .where(eq(tasks.parentTaskId, req.params.id));
        console.log(`Deleted ${subTasks.length} sub-tasks`);
      }
      
      // Delete all related data before deleting the main task
      console.log(`Deleting all related data for task: ${req.params.id}`);
      
      // Delete comment files first
      const commentFilesToDelete = await db.select()
        .from(commentFiles)
        .leftJoin(taskComments, eq(commentFiles.commentId, taskComments.id))
        .where(eq(taskComments.taskId, req.params.id));
      
      for (const file of commentFilesToDelete) {
        await db.delete(commentFiles).where(eq(commentFiles.id, file.comment_files.id));
      }
      
      // Delete task comment reactions
      await db.delete(taskCommentReactions)
        .where(sql`comment_id IN (SELECT id FROM task_comments WHERE task_id = ${req.params.id})`);
      
      // Delete task comments
      await db.delete(taskComments)
        .where(eq(taskComments.taskId, req.params.id));
      
      // Delete task activities
      await db.delete(taskActivities)
        .where(eq(taskActivities.taskId, req.params.id));
      
      // Delete task attachments
      await db.delete(taskAttachments)
        .where(eq(taskAttachments.taskId, req.params.id));
      
      console.log(`All related data deleted, now deleting main task: ${req.params.id}`);
      
      // Delete the main task
      const deletedRows = await db.delete(tasks)
        .where(eq(tasks.id, req.params.id));
      
      console.log(`Main task deletion result:`, deletedRows);

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

      console.log(`Task deletion successful: ${req.params.id}`);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task", error: error.message });
    }
  });

  // Sub-task Hierarchy API (ClickUp-style up to 5 levels deep)
  app.get("/api/tasks/:taskId/subtasks", async (req, res) => {
    try {
      const subTasks = await db.select()
        .from(tasks)
        .where(eq(tasks.parentTaskId, req.params.taskId))
        .orderBy(asc(tasks.createdAt));
      
      // For each subtask, check if it has its own subtasks
      const subTasksWithFlags = await Promise.all(
        subTasks.map(async (task) => {
          const childTasks = await db.select({ id: tasks.id })
            .from(tasks)
            .where(eq(tasks.parentTaskId, task.id))
            .limit(1);
          
          return {
            ...task,
            hasSubTasks: childTasks.length > 0
          };
        })
      );
      
      res.json(subTasksWithFlags);
    } catch (error) {
      console.error("Error fetching sub-tasks:", error);
      res.status(500).json({ message: "Failed to fetch sub-tasks" });
    }
  });

  app.get("/api/tasks/root", async (req, res) => {
    try {
      const rootTasks = await db.select()
        .from(tasks)
        .where(sql`${tasks.parentTaskId} IS NULL OR ${tasks.level} = 0`)
        .orderBy(asc(tasks.createdAt));
      
      res.json(rootTasks);
    } catch (error) {
      console.error("Error fetching root tasks:", error);
      res.status(500).json({ message: "Failed to fetch root tasks" });
    }
  });

  app.get("/api/tasks/:taskId/hierarchy", async (req, res) => {
    try {
      const { taskId } = req.params;
      
      // Get root task first
      const [rootTask] = await db.select()
        .from(tasks)
        .where(eq(tasks.id, taskId));
      
      if (!rootTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Get all tasks in hierarchy using task path
      const hierarchyTasks = await db.select()
        .from(tasks)
        .where(sql`${tasks.taskPath} LIKE ${rootTask.taskPath + '%'}`)
        .orderBy(asc(tasks.level), asc(tasks.createdAt));
      
      res.json(hierarchyTasks);
    } catch (error) {
      console.error("Error fetching task hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch task hierarchy" });
    }
  });

  app.post("/api/tasks/:parentTaskId/subtasks", async (req, res) => {
    try {
      const { parentTaskId } = req.params;
      
      // Check if parent task exists and get its level
      const [parentTask] = await db.select()
        .from(tasks)
        .where(eq(tasks.id, parentTaskId));
      
      if (!parentTask) {
        return res.status(404).json({ message: "Parent task not found" });
      }

      if (parentTask.level! >= 4) {
        return res.status(400).json({ message: "Maximum task nesting level (5) reached" });
      }

      // Validate sub-task data
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        parentTaskId: parentTaskId
      });

      // Calculate hierarchy fields
      const level = parentTask.level! + 1;
      
      // Create sub-task first to get the ID
      const [newSubTask] = await db.insert(tasks)
        .values({
          ...validatedData,
          parentTaskId: parentTaskId,
          level: level,
          taskPath: '', // Will update after getting the ID
          hasSubTasks: false
        })
        .returning();

      // Update the task path now that we have the ID
      const updatedTaskPath = `${parentTask.taskPath}/${newSubTask.id}`;
      await db.update(tasks)
        .set({ taskPath: updatedTaskPath })
        .where(eq(tasks.id, newSubTask.id));

      // Update parent task to mark it as having sub-tasks
      await db.update(tasks)
        .set({ hasSubTasks: true })
        .where(eq(tasks.id, parentTaskId));
      
      // Return the updated task with correct path
      const [finalSubTask] = await db.select()
        .from(tasks)
        .where(eq(tasks.id, newSubTask.id));
      
      res.status(201).json(finalSubTask);
    } catch (error) {
      console.error("Error creating sub-task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sub-task" });
    }
  });

  app.get("/api/tasks/:taskId/parent", async (req, res) => {
    try {
      const [task] = await db.select()
        .from(tasks)
        .where(eq(tasks.id, req.params.taskId));
      
      if (!task || !task.parentTaskId) {
        return res.status(404).json({ message: "Parent task not found" });
      }

      const [parentTask] = await db.select()
        .from(tasks)
        .where(eq(tasks.id, task.parentTaskId));
      
      if (!parentTask) {
        return res.status(404).json({ message: "Parent task not found" });
      }

      res.json(parentTask);
    } catch (error) {
      console.error("Error fetching parent task:", error);
      res.status(500).json({ message: "Failed to fetch parent task" });
    }
  });

  app.get("/api/tasks/:taskId/path", async (req, res) => {
    try {
      const { taskId } = req.params;
      const path = [];
      
      let currentTaskId = taskId;
      while (currentTaskId) {
        const [task] = await db.select()
          .from(tasks)
          .where(eq(tasks.id, currentTaskId));
        
        if (!task) break;
        
        path.unshift(task);
        currentTaskId = task.parentTaskId;
      }
      
      res.json(path);
    } catch (error) {
      console.error("Error fetching task path:", error);
      res.status(500).json({ message: "Failed to fetch task path" });
    }
  });

  // Task Attachments API
  app.get("/api/tasks/:taskId/attachments", async (req, res) => {
    try {
      const { taskId } = req.params;
      
      const attachments = await db
        .select({
          id: taskAttachments.id,
          taskId: taskAttachments.taskId,
          fileName: taskAttachments.fileName,
          fileType: taskAttachments.fileType,
          fileSize: taskAttachments.fileSize,
          fileUrl: taskAttachments.fileUrl,
          uploadedBy: taskAttachments.uploadedBy,
          createdAt: taskAttachments.createdAt,
          uploaderName: sql<string>`concat(${staff.firstName}, ' ', ${staff.lastName})`
        })
        .from(taskAttachments)
        .leftJoin(staff, eq(taskAttachments.uploadedBy, staff.id))
        .where(eq(taskAttachments.taskId, taskId))
        .orderBy(desc(taskAttachments.createdAt));
      
      console.log("Returning attachments with URLs:", attachments.map(a => ({ fileName: a.fileName, fileUrl: a.fileUrl })));
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching task attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  app.post("/api/tasks/:taskId/attachments", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { fileName, fileType, fileSize, fileUrl } = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Normalize the file URL using ObjectStorageService
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const normalizedFileUrl = objectStorageService.normalizeObjectEntityPath(fileUrl);

      const [attachment] = await db
        .insert(taskAttachments)
        .values({
          taskId,
          fileName,
          fileType,
          fileSize,
          fileUrl: normalizedFileUrl,
          uploadedBy: userId,
        })
        .returning();

      // Also create a corresponding record in comment_files for annotation support
      const { commentFiles } = await import("@shared/schema");
      try {
        await db
          .insert(commentFiles)
          .values({
            id: attachment.id, // Use the same ID as the task attachment
            commentId: null, // Not linked to a specific comment
            fileName,
            fileType,
            fileSize,
            fileUrl: normalizedFileUrl,
            uploadedBy: userId
          })
          .onConflictDoNothing(); // In case it already exists
      } catch (error) {
        console.log("Failed to create comment_files record for annotation support:", error);
      }

      // Log activity for file upload
      await db.insert(taskActivities).values({
        taskId,
        actionType: "file_uploaded",
        description: `Uploaded file: ${fileName}`,
        userId,
        details: {
          fileName,
          fileType,
          fileSize,
          fileUrl: normalizedFileUrl,
        },
      });

      res.json(attachment);
    } catch (error) {
      console.error("Error creating task attachment:", error);
      res.status(500).json({ message: "Failed to create attachment" });
    }
  });

  app.delete("/api/tasks/:taskId/attachments/:attachmentId", async (req, res) => {
    try {
      const { taskId, attachmentId } = req.params;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get attachment details before deletion for activity log
      const [attachment] = await db
        .select()
        .from(taskAttachments)
        .where(and(
          eq(taskAttachments.id, attachmentId),
          eq(taskAttachments.taskId, taskId)
        ));

      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      // Delete the attachment
      await db
        .delete(taskAttachments)
        .where(and(
          eq(taskAttachments.id, attachmentId),
          eq(taskAttachments.taskId, taskId)
        ));

      // Log activity for file deletion
      await db.insert(taskActivities).values({
        taskId,
        actionType: "file_deleted",
        description: `Deleted file: ${attachment.fileName}`,
        userId,
        details: {
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
        },
      });

      res.json({ message: "Attachment deleted successfully" });
    } catch (error) {
      console.error("Error deleting task attachment:", error);
      res.status(500).json({ message: "Failed to delete attachment" });
    }
  });

  // Task Dependencies routes - Database Storage
  // Get dependencies for a specific task
  app.get("/api/tasks/:taskId/dependencies", async (req, res) => {
    try {
      const { taskId } = req.params;

      // Get dependencies (tasks that this task depends on)
      const dependencies = await db
        .select({
          id: taskDependencies.id,
          dependsOnTaskId: taskDependencies.dependsOnTaskId,
          dependencyType: taskDependencies.dependencyType,
          createdAt: taskDependencies.createdAt,
          task: {
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            assignedTo: tasks.assignedTo,
            dueDate: tasks.dueDate,
            completedAt: tasks.completedAt,
          }
        })
        .from(taskDependencies)
        .innerJoin(tasks, eq(taskDependencies.dependsOnTaskId, tasks.id))
        .where(eq(taskDependencies.taskId, taskId))
        .orderBy(asc(taskDependencies.createdAt));

      // Get dependent tasks (tasks that depend on this task)
      const dependentTasks = await db
        .select({
          id: taskDependencies.id,
          taskId: taskDependencies.taskId,
          dependencyType: taskDependencies.dependencyType,
          createdAt: taskDependencies.createdAt,
          task: {
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            assignedTo: tasks.assignedTo,
            dueDate: tasks.dueDate,
            completedAt: tasks.completedAt,
          }
        })
        .from(taskDependencies)
        .innerJoin(tasks, eq(taskDependencies.taskId, tasks.id))
        .where(eq(taskDependencies.dependsOnTaskId, taskId))
        .orderBy(asc(taskDependencies.createdAt));

      res.json({
        dependencies,
        dependentTasks
      });
    } catch (error) {
      console.error("Error fetching task dependencies:", error);
      res.status(500).json({ message: "Failed to fetch task dependencies" });
    }
  });

  // Add a dependency to a task
  app.post("/api/tasks/:taskId/dependencies", async (req, res) => {
    try {
      const { taskId } = req.params;
      
      // Validate the request body manually first
      if (!req.body.dependsOnTaskId) {
        return res.status(400).json({ message: "dependsOnTaskId is required" });
      }
      
      // Create a schema that doesn't require taskId for validation
      const requestBodySchema = insertTaskDependencySchema.omit({ taskId: true });
      const validatedBody = requestBodySchema.parse(req.body);
      
      // Add taskId manually
      const dependencyData = {
        ...validatedBody,
        taskId
      };
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      // Validate that the dependency task exists
      const [dependsOnTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, dependencyData.dependsOnTaskId));

      if (!dependsOnTask) {
        return res.status(404).json({ message: "Dependency task not found" });
      }

      // Check if this would create a circular dependency
      const wouldCreateCircularDependency = await checkCircularDependency(taskId, dependencyData.dependsOnTaskId);
      if (wouldCreateCircularDependency) {
        return res.status(400).json({ 
          message: "Cannot create dependency: This would create a circular dependency loop" 
        });
      }

      // Check if dependency already exists
      const [existingDependency] = await db
        .select()
        .from(taskDependencies)
        .where(and(
          eq(taskDependencies.taskId, taskId),
          eq(taskDependencies.dependsOnTaskId, dependencyData.dependsOnTaskId)
        ));

      if (existingDependency) {
        return res.status(400).json({ message: "Dependency already exists" });
      }

      // Create the dependency
      const [dependency] = await db
        .insert(taskDependencies)
        .values(dependencyData)
        .returning();

      // Get the task title for activity log
      const [task] = await db.select({ title: tasks.title }).from(tasks).where(eq(tasks.id, taskId));

      // Log activity for dependency creation
      await db.insert(taskActivities).values({
        taskId,
        actionType: "dependency_added",
        description: `Added dependency on "${dependsOnTask.title}"`,
        userId,
        details: {
          dependsOnTaskId: dependencyData.dependsOnTaskId,
          dependsOnTaskTitle: dependsOnTask.title,
          dependencyType: dependencyData.dependencyType,
        },
      });

      res.json(dependency);
    } catch (error) {
      console.error("Error creating task dependency:", error);
      res.status(500).json({ message: "Failed to create task dependency" });
    }
  });

  // Remove a task dependency
  app.delete("/api/dependencies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      // Get dependency details before deletion for activity log
      const [dependency] = await db
        .select({
          id: taskDependencies.id,
          taskId: taskDependencies.taskId,
          dependsOnTaskId: taskDependencies.dependsOnTaskId,
          dependencyType: taskDependencies.dependencyType,
          task: tasks.title,
          dependsOnTask: tasks.title,
        })
        .from(taskDependencies)
        .innerJoin(tasks, eq(taskDependencies.dependsOnTaskId, tasks.id))
        .where(eq(taskDependencies.id, id));

      if (!dependency) {
        return res.status(404).json({ message: "Dependency not found" });
      }

      // Delete the dependency
      await db.delete(taskDependencies).where(eq(taskDependencies.id, id));

      // Log activity for dependency removal
      await db.insert(taskActivities).values({
        taskId: dependency.taskId,
        actionType: "dependency_removed",
        description: `Removed dependency on "${dependency.dependsOnTask}"`,
        userId,
        details: {
          dependsOnTaskId: dependency.dependsOnTaskId,
          dependsOnTaskTitle: dependency.dependsOnTask,
          dependencyType: dependency.dependencyType,
        },
      });

      res.json({ message: "Dependency removed successfully" });
    } catch (error) {
      console.error("Error deleting task dependency:", error);
      res.status(500).json({ message: "Failed to delete task dependency" });
    }
  });

  // Validate if adding a dependency would create a circular dependency
  app.post("/api/dependencies/validate", async (req, res) => {
    try {
      const { taskId, dependsOnTaskId } = req.body;

      if (!taskId || !dependsOnTaskId) {
        return res.status(400).json({ message: "taskId and dependsOnTaskId are required" });
      }

      const wouldCreateCircularDependency = await checkCircularDependency(taskId, dependsOnTaskId);
      
      res.json({ 
        isValid: !wouldCreateCircularDependency,
        wouldCreateCircularDependency 
      });
    } catch (error) {
      console.error("Error validating task dependency:", error);
      res.status(500).json({ message: "Failed to validate task dependency" });
    }
  });

  // Helper function to check for circular dependencies
  async function checkCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    // If task depends on itself, it's circular
    if (taskId === dependsOnTaskId) {
      return true;
    }

    // Get all dependencies of the dependsOnTaskId
    const visited = new Set<string>();
    const toCheck = [dependsOnTaskId];

    while (toCheck.length > 0) {
      const currentTaskId = toCheck.pop()!;
      
      // If we've seen this task before, skip it
      if (visited.has(currentTaskId)) {
        continue;
      }
      
      visited.add(currentTaskId);

      // If this task depends on our original taskId, we have a circular dependency
      if (currentTaskId === taskId) {
        return true;
      }

      // Get all tasks that this current task depends on
      const dependencies = await db
        .select({ dependsOnTaskId: taskDependencies.dependsOnTaskId })
        .from(taskDependencies)
        .where(eq(taskDependencies.taskId, currentTaskId));

      // Add them to our check list
      for (const dep of dependencies) {
        if (!visited.has(dep.dependsOnTaskId)) {
          toCheck.push(dep.dependsOnTaskId);
        }
      }
    }

    return false;
  }

  // Invoice routes - Database Storage
  app.get("/api/invoices", async (req, res) => {
    try {
      const { search, status, clientId, projectId } = req.query;
      
      const conditions = [];
      
      if (search && typeof search === 'string') {
        conditions.push(
          or(
            like(invoices.invoiceNumber, `%${search}%`),
            like(invoices.notes, `%${search}%`)
          )
        );
      }
      
      if (status && typeof status === 'string') {
        conditions.push(eq(invoices.status, status));
      }
      
      if (clientId && typeof clientId === 'string') {
        conditions.push(eq(invoices.clientId, clientId));
      }
      
      if (projectId && typeof projectId === 'string') {
        conditions.push(eq(invoices.projectId, projectId));
      }
      
      let invoicesList;
      if (conditions.length > 0) {
        invoicesList = await db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.createdAt));
      } else {
        invoicesList = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
      }
      res.json(invoicesList);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const [invoice] = await db.select()
        .from(invoices)
        .where(eq(invoices.id, req.params.id));
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      
      const [newInvoice] = await db.insert(invoices)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newInvoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      
      const [updatedInvoice] = await db.update(invoices)
        .set(validatedData)
        .where(eq(invoices.id, req.params.id))
        .returning();
      
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const deletedRows = await db.delete(invoices)
        .where(eq(invoices.id, req.params.id));
      
      if (deletedRows.rowCount === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Social Media Account routes - Database Storage
  app.get("/api/social-media-accounts", async (req, res) => {
    try {
      const { clientId } = req.query;
      
      let accounts;
      if (clientId && typeof clientId === 'string') {
        accounts = await db.select().from(socialMediaAccounts).where(eq(socialMediaAccounts.clientId, clientId)).orderBy(desc(socialMediaAccounts.createdAt));
      } else {
        accounts = await db.select().from(socialMediaAccounts).orderBy(desc(socialMediaAccounts.createdAt));
      }
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching social media accounts:", error);
      res.status(500).json({ message: "Failed to fetch social media accounts" });
    }
  });

  app.get("/api/social-media-accounts/:id", async (req, res) => {
    try {
      const [account] = await db.select()
        .from(socialMediaAccounts)
        .where(eq(socialMediaAccounts.id, req.params.id));
      
      if (!account) {
        return res.status(404).json({ message: "Social media account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching social media account:", error);
      res.status(500).json({ message: "Failed to fetch social media account" });
    }
  });

  app.get("/api/clients/:clientId/social-media-accounts", async (req, res) => {
    try {
      const accounts = await db.select()
        .from(socialMediaAccounts)
        .where(eq(socialMediaAccounts.clientId, req.params.clientId))
        .orderBy(desc(socialMediaAccounts.createdAt));
      
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching client social media accounts:", error);
      res.status(500).json({ message: "Failed to fetch client social media accounts" });
    }
  });

  app.post("/api/social-media-accounts", async (req, res) => {
    try {
      const validatedData = insertSocialMediaAccountSchema.parse(req.body);
      
      const [newAccount] = await db.insert(socialMediaAccounts)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newAccount);
    } catch (error) {
      console.error("Error creating social media account:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create social media account" });
    }
  });

  app.put("/api/social-media-accounts/:id", async (req, res) => {
    try {
      const validatedData = insertSocialMediaAccountSchema.partial().parse(req.body);
      
      const [updatedAccount] = await db.update(socialMediaAccounts)
        .set(validatedData)
        .where(eq(socialMediaAccounts.id, req.params.id))
        .returning();
      
      if (!updatedAccount) {
        return res.status(404).json({ message: "Social media account not found" });
      }
      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating social media account:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update social media account" });
    }
  });

  app.delete("/api/social-media-accounts/:id", async (req, res) => {
    try {
      const deletedRows = await db.delete(socialMediaAccounts)
        .where(eq(socialMediaAccounts.id, req.params.id));
      
      if (deletedRows.rowCount === 0) {
        return res.status(404).json({ message: "Social media account not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting social media account:", error);
      res.status(500).json({ message: "Failed to delete social media account" });
    }
  });

  // Social Media Post routes - Database Storage
  app.get("/api/social-media-posts", async (req, res) => {
    try {
      const { clientId, campaignId, status, accountId } = req.query;
      
      const conditions = [];
      
      if (clientId && typeof clientId === 'string') {
        conditions.push(eq(socialMediaPosts.clientId, clientId));
      }
      
      if (campaignId && typeof campaignId === 'string') {
        conditions.push(eq(socialMediaPosts.campaignId, campaignId));
      }
      
      if (status && typeof status === 'string') {
        conditions.push(eq(socialMediaPosts.status, status));
      }
      
      if (accountId && typeof accountId === 'string') {
        conditions.push(eq(socialMediaPosts.accountId, accountId));
      }
      
      let posts;
      if (conditions.length > 0) {
        posts = await db.select().from(socialMediaPosts).where(and(...conditions)).orderBy(desc(socialMediaPosts.createdAt));
      } else {
        posts = await db.select().from(socialMediaPosts).orderBy(desc(socialMediaPosts.createdAt));
      }
      res.json(posts);
    } catch (error) {
      console.error("Error fetching social media posts:", error);
      res.status(500).json({ message: "Failed to fetch social media posts" });
    }
  });

  app.get("/api/social-media-posts/:id", async (req, res) => {
    try {
      const [post] = await db.select()
        .from(socialMediaPosts)
        .where(eq(socialMediaPosts.id, req.params.id));
      
      if (!post) {
        return res.status(404).json({ message: "Social media post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching social media post:", error);
      res.status(500).json({ message: "Failed to fetch social media post" });
    }
  });

  app.get("/api/clients/:clientId/social-media-posts", async (req, res) => {
    try {
      const posts = await db.select()
        .from(socialMediaPosts)
        .where(eq(socialMediaPosts.clientId, req.params.clientId))
        .orderBy(desc(socialMediaPosts.createdAt));
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching client social media posts:", error);
      res.status(500).json({ message: "Failed to fetch client social media posts" });
    }
  });

  app.post("/api/social-media-posts", async (req, res) => {
    try {
      const validatedData = insertSocialMediaPostSchema.parse(req.body);
      
      const [newPost] = await db.insert(socialMediaPosts)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newPost);
    } catch (error) {
      console.error("Error creating social media post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create social media post" });
    }
  });

  app.put("/api/social-media-posts/:id", async (req, res) => {
    try {
      const validatedData = insertSocialMediaPostSchema.partial().parse(req.body);
      
      const [updatedPost] = await db.update(socialMediaPosts)
        .set(validatedData)
        .where(eq(socialMediaPosts.id, req.params.id))
        .returning();
      
      if (!updatedPost) {
        return res.status(404).json({ message: "Social media post not found" });
      }
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating social media post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update social media post" });
    }
  });

  app.delete("/api/social-media-posts/:id", async (req, res) => {
    try {
      const deletedRows = await db.delete(socialMediaPosts)
        .where(eq(socialMediaPosts.id, req.params.id));
      
      if (deletedRows.rowCount === 0) {
        return res.status(404).json({ message: "Social media post not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting social media post:", error);
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
      const templates = await storage.getSocialMediaTemplates();
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

  app.delete("/api/template-folders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if any templates are using this folder
      const emailTemplatesInFolder = await storage.getEmailTemplatesByFolder(id);
      const smsTemplatesInFolder = await storage.getSmsTemplatesByFolder(id);
      
      const totalTemplates = emailTemplatesInFolder.length + smsTemplatesInFolder.length;
      
      if (totalTemplates > 0) {
        return res.status(400).json({
          message: `Cannot delete folder that contains ${totalTemplates} template(s). Please move or delete the templates first.`
        });
      }
      
      const deleted = await storage.deleteTemplateFolder(id);
      if (!deleted) {
        return res.status(404).json({ message: "Template folder not found" });
      }

      res.json({ message: "Template folder deleted successfully" });
    } catch (error) {
      console.error('Error deleting template folder:', error);
      res.status(500).json({ message: "Failed to delete template folder" });
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
      console.log("Creating email template with data:", validatedData);
      const template = await storage.createEmailTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Email template creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create email template", error: error instanceof Error ? error.message : "Unknown error" });
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
      // Use a valid user ID instead of the frontend's "user-1"
      if (validatedData.createdBy === "user-1") {
        validatedData.createdBy = "9788c16a-ba2a-40cb-af7b-26d2816d6390";
      }
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

  // Workflow routes - Database Storage
  app.get("/api/workflows", async (req, res) => {
    try {
      const { clientId, category, status } = req.query;
      
      const conditions = [];
      
      if (clientId && typeof clientId === 'string') {
        conditions.push(eq(workflows.clientId, clientId));
      }
      
      if (category && typeof category === 'string') {
        conditions.push(eq(workflows.category, category));
      }
      
      if (status && typeof status === 'string') {
        conditions.push(eq(workflows.status, status));
      }
      
      let workflowsList;
      if (conditions.length > 0) {
        workflowsList = await db.select().from(workflows).where(and(...conditions)).orderBy(desc(workflows.createdAt));
      } else {
        workflowsList = await db.select().from(workflows).orderBy(desc(workflows.createdAt));
      }
      res.json(workflowsList);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const [workflow] = await db.select()
        .from(workflows)
        .where(eq(workflows.id, req.params.id));
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      
      const [newWorkflow] = await db.insert(workflows)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newWorkflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.partial().parse(req.body);
      
      const [updatedWorkflow] = await db.update(workflows)
        .set(validatedData)
        .where(eq(workflows.id, req.params.id))
        .returning();
      
      if (!updatedWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(updatedWorkflow);
    } catch (error) {
      console.error("Error updating workflow:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const deletedRows = await db.delete(workflows)
        .where(eq(workflows.id, req.params.id));
      
      if (deletedRows.rowCount === 0) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workflow:", error);
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

  // Helper function to check if file exists (either in comment_files or task_attachments)
  async function checkFileExists(fileId: string): Promise<{ exists: boolean, isTaskAttachment: boolean }> {
    try {
      const { db } = await import("./db");
      const { commentFiles, taskAttachments } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      // Check if it's a comment file
      const [commentFile] = await db.select()
        .from(commentFiles)
        .where(eq(commentFiles.id, fileId));
      
      if (commentFile) {
        return { exists: true, isTaskAttachment: false };
      }
      
      // Check if it's a task attachment
      const [taskAttachment] = await db.select()
        .from(taskAttachments)
        .where(eq(taskAttachments.id, fileId));
      
      if (taskAttachment) {
        return { exists: true, isTaskAttachment: true };
      }
      
      return { exists: false, isTaskAttachment: false };
    } catch (error) {
      console.log("Error checking file exists:", error);
      return { exists: false, isTaskAttachment: false };
    }
  }

  // Object Storage endpoints for image uploads

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      console.log("Serving object for path:", req.path);
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      // Get the file object first, then download it
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      const { ObjectNotFoundError } = await import("./objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Image Annotation endpoints
  

  
  // Get annotations for a specific image file
  app.get("/api/files/:fileId/annotations", async (req, res) => {
    try {
      // Check if file exists
      const fileCheck = await checkFileExists(req.params.fileId);
      if (!fileCheck.exists) {
        return res.status(404).json({ error: "File not found" });
      }
      
      const { db } = await import("./db");
      const { imageAnnotations } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const annotations = await db.select()
        .from(imageAnnotations)
        .where(eq(imageAnnotations.fileId, req.params.fileId));
      
      res.json(annotations);
    } catch (error) {
      console.error("Error fetching image annotations:", error);
      res.status(500).json({ error: "Failed to fetch image annotations" });
    }
  });

  // Create a new image annotation
  app.post("/api/files/:fileId/annotations", async (req, res) => {
    try {
      // Check if file exists
      const fileCheck = await checkFileExists(req.params.fileId);
      if (!fileCheck.exists) {
        return res.status(404).json({ error: "File not found" });
      }
      
      const userId = req.session?.userId || "3ea1a15d-eff5-4385-a638-cb001e24a932";
      const mentions = req.body.mentions || [];
      
      const insertAnnotation = insertImageAnnotationSchema.parse({
        id: nanoid(),
        fileId: req.params.fileId,
        x: req.body.x.toString(),
        y: req.body.y.toString(),
        content: req.body.content,
        mentions: mentions,
        authorId: userId,  // Use authorId instead of userId
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Direct database insertion
      const { db } = await import("./db");
      const { imageAnnotations, notifications } = await import("@shared/schema");
      
      const result = await db.insert(imageAnnotations).values(insertAnnotation).returning();
      const annotation = result[0];
      
      // Always return success for annotation creation
      res.status(201).json(annotation);
      
      // Try to create notifications asynchronously (don't await)
      if (mentions.length > 0) {
        console.log(`Annotation created with mentions: ${mentions.join(', ')}`);
        
        // Create notifications in background without blocking response
        (async () => {
          try {
            const { staff } = await import("@shared/schema");
            const { inArray } = await import("drizzle-orm");
            
            // Get mentioned staff members info
            const mentionedStaff = await db.select({ 
              id: staff.id, 
              firstName: staff.firstName, 
              lastName: staff.lastName, 
              email: staff.email 
            })
            .from(staff)
            .where(inArray(staff.id, mentions));
            
            // Create notifications for mentioned staff members directly
            for (const staffMember of mentionedStaff) {
              try {
                await db.insert(notifications).values({
                  userId: staffMember.id, // Use staff ID directly for notifications
                  type: "annotation_mention",
                  title: "You were mentioned in an annotation",
                  message: `You were mentioned in an annotation: "${req.body.content.substring(0, 100)}${req.body.content.length > 100 ? '...' : ''}"`,
                  entityType: "annotation",
                  entityId: annotation.id,
                  metadata: {
                    annotationId: annotation.id,
                    fileId: req.params.fileId,
                    mentionedBy: userId
                  },
                  isRead: false,
                });
                console.log(`Notification created for staff member: ${staffMember.firstName} ${staffMember.lastName} (${staffMember.email})`);
              } catch (singleNotificationError) {
                console.log(`Failed to create notification for staff member ${staffMember.email}:`, singleNotificationError);
              }
            }
          } catch (notificationError) {
            console.log("Failed to create notifications, but annotation was created successfully:", notificationError);
          }
        })();
      }
    } catch (error) {
      console.error("Error creating image annotation:", error);
      res.status(500).json({ error: "Failed to create image annotation" });
    }
  });

  // Update an image annotation
  app.put("/api/annotations/:annotationId", async (req, res) => {
    try {
      const userId = req.session?.userId || "3ea1a15d-eff5-4385-a638-cb001e24a932";
      const mentions = req.body.mentions || [];
      
      const updateData = {
        content: req.body.content,
        mentions: mentions,
        updatedAt: new Date(),
      };

      // Direct database update
      const { db } = await import("./db");
      const { imageAnnotations, notifications } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const result = await db
        .update(imageAnnotations)
        .set(updateData)
        .where(eq(imageAnnotations.id, req.params.annotationId))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: "Annotation not found" });
      }

      // Always return success for annotation update
      res.json(result[0]);

      // Try to create notifications asynchronously (don't await)
      if (mentions.length > 0) {
        console.log(`Annotation updated with mentions: ${mentions.join(', ')}`);
        
        // Create notifications in background without blocking response
        (async () => {
          try {
            const { staff } = await import("@shared/schema");
            const { inArray } = await import("drizzle-orm");
            
            // Get mentioned staff members info
            const mentionedStaff = await db.select({ 
              id: staff.id, 
              firstName: staff.firstName, 
              lastName: staff.lastName, 
              email: staff.email 
            })
            .from(staff)
            .where(inArray(staff.id, mentions));
            
            // Create notifications for mentioned staff members directly
            for (const staffMember of mentionedStaff) {
              try {
                await db.insert(notifications).values({
                  userId: staffMember.id, // Use staff ID directly for notifications
                  type: "annotation_mention",
                  title: "You were mentioned in an updated annotation",
                  message: `You were mentioned in an updated annotation: "${req.body.content.substring(0, 100)}${req.body.content.length > 100 ? '...' : ''}"`,
                  entityType: "annotation",
                  entityId: req.params.annotationId,
                  metadata: {
                    annotationId: req.params.annotationId,
                    mentionedBy: userId
                  },
                  isRead: false,
                });
                console.log(`Update notification created for staff member: ${staffMember.firstName} ${staffMember.lastName} (${staffMember.email})`);
              } catch (singleNotificationError) {
                console.log(`Failed to create update notification for staff member ${staffMember.email}:`, singleNotificationError);
              }
            }
          } catch (notificationError) {
            console.log("Failed to create notifications for annotation update, but annotation was updated successfully:", notificationError);
          }
        })();
      }
    } catch (error) {
      console.error("Error updating image annotation:", error);
      res.status(500).json({ error: "Failed to update image annotation" });
    }
  });

  // Delete an image annotation
  app.delete("/api/annotations/:annotationId", async (req, res) => {
    try {
      // Direct database deletion
      const { db } = await import("./db");
      const { imageAnnotations } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const result = await db
        .delete(imageAnnotations)
        .where(eq(imageAnnotations.id, req.params.annotationId))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: "Annotation not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting image annotation:", error);
      res.status(500).json({ error: "Failed to delete image annotation" });
    }
  });



  // Staff/Users Management API
  app.get("/api/staff", async (req, res) => {
    try {
      const { search, departmentId } = req.query;
      let whereConditions = [eq(staff.isActive, true)];
      
      if (search && typeof search === 'string') {
        whereConditions.push(
          or(
            like(sql`${staff.firstName} || ' ' || ${staff.lastName}`, `%${search}%`),
            like(staff.email, `%${search}%`),
            like(staff.department, `%${search}%`)
          )
        );
      }

      // Filter by department ID - lookup department name first
      if (departmentId && typeof departmentId === 'string') {
        const [department] = await db.select().from(departments).where(eq(departments.id, departmentId));
        if (department) {
          whereConditions.push(eq(staff.department, department.name));
        }
      }
      
      const query = db.select().from(staff).where(and(...whereConditions));
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
      // Clean up the request body to handle empty date fields properly
      const cleanedBody = { ...req.body };
      
      // Convert empty strings to null for date fields and remove undefined values
      if (cleanedBody.hireDate === '' || cleanedBody.hireDate === undefined) {
        delete cleanedBody.hireDate;
      }
      if (cleanedBody.birthdate === '' || cleanedBody.birthdate === undefined) {
        delete cleanedBody.birthdate;
      }
      
      // Also handle role assignment in user_roles table if roleId is provided
      if (cleanedBody.roleId) {
        // First, remove existing role assignments for this user
        await db.delete(userRoles).where(eq(userRoles.userId, req.params.id));
        
        // Then add the new role assignment
        await db.insert(userRoles).values({
          userId: req.params.id,
          roleId: cleanedBody.roleId,
          assignedBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb" // Using Brian (Admin) as default
        });
      }
      
      const [updatedStaff] = await db
        .update(staff)
        .set({
          ...cleanedBody,
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

  // Departments API
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.get("/api/departments/:id", async (req, res) => {
    try {
      const department = await storage.getDepartment(req.params.id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      console.error('Error fetching department:', error);
      res.status(500).json({ message: "Failed to fetch department" });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      const insertData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(insertData);
      
      // Log the creation
      await createAuditLog(
        "created",
        "department",
        department.id,
        department.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `New department created: ${department.name}`,
        null,
        { name: department.name, description: department.description },
        req
      );
      
      res.status(201).json(department);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error creating department:', error);
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.put("/api/departments/:id", async (req, res) => {
    try {
      const insertData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(req.params.id, insertData);
      
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      // Log the update
      await createAuditLog(
        "updated",
        "department",
        department.id,
        department.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Department updated: ${department.name}`,
        null,
        insertData,
        req
      );
      
      res.json(department);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error updating department:', error);
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", async (req, res) => {
    try {
      const department = await storage.getDepartment(req.params.id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      const success = await storage.deleteDepartment(req.params.id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete department" });
      }
      
      // Log the deletion
      await createAuditLog(
        "deleted",
        "department",
        req.params.id,
        department.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Department deleted: ${department.name}`,
        { name: department.name },
        null,
        req
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // Positions API
  app.get("/api/positions", async (req, res) => {
    try {
      const positions = await storage.getPositions();
      res.json(positions);
    } catch (error) {
      console.error('Error fetching positions:', error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  app.get("/api/positions/:id", async (req, res) => {
    try {
      const position = await storage.getPosition(req.params.id);
      if (!position) {
        return res.status(404).json({ message: "Position not found" });
      }
      res.json(position);
    } catch (error) {
      console.error('Error fetching position:', error);
      res.status(500).json({ message: "Failed to fetch position" });
    }
  });

  app.get("/api/departments/:departmentId/positions", async (req, res) => {
    try {
      const positions = await storage.getPositionsByDepartment(req.params.departmentId);
      res.json(positions);
    } catch (error) {
      console.error('Error fetching positions for department:', error);
      res.status(500).json({ message: "Failed to fetch positions for department" });
    }
  });

  app.post("/api/positions", async (req, res) => {
    try {
      const insertData = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(insertData);
      
      // Log the creation
      await createAuditLog(
        "created",
        "position",
        position.id,
        position.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `New position created: ${position.name}`,
        null,
        { name: position.name, departmentId: position.departmentId, description: position.description },
        req
      );
      
      res.status(201).json(position);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error creating position:', error);
      res.status(500).json({ message: "Failed to create position" });
    }
  });

  app.put("/api/positions/:id", async (req, res) => {
    try {
      const insertData = insertPositionSchema.partial().parse(req.body);
      const position = await storage.updatePosition(req.params.id, insertData);
      
      if (!position) {
        return res.status(404).json({ message: "Position not found" });
      }
      
      // Log the update
      await createAuditLog(
        "updated",
        "position",
        position.id,
        position.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Position updated: ${position.name}`,
        null,
        insertData,
        req
      );
      
      res.json(position);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error updating position:', error);
      res.status(500).json({ message: "Failed to update position" });
    }
  });

  app.delete("/api/positions/:id", async (req, res) => {
    try {
      const position = await storage.getPosition(req.params.id);
      if (!position) {
        return res.status(404).json({ message: "Position not found" });
      }
      
      const success = await storage.deletePosition(req.params.id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete position" });
      }
      
      // Log the deletion
      await createAuditLog(
        "deleted",
        "position",
        req.params.id,
        position.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Position deleted: ${position.name}`,
        { name: position.name },
        null,
        req
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting position:', error);
      res.status(500).json({ message: "Failed to delete position" });
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
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.profileImageURL);
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
          canExport: perm.canExport || false,
          canImport: perm.canImport || false,
          dataAccessLevel: perm.dataAccessLevel || "own",
          restrictedFields: perm.restrictedFields || [],
          readOnlyFields: perm.readOnlyFields || [],
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

  // Permission Check API Route - Check if current user has specific permission
  app.get("/api/permissions/check/:module/:action", async (req, res) => {
    try {
      const { module, action } = req.params;
      const userId = req.query.userId as string || "e56be30d-c086-446c-ada4-7ccef37ad7fb"; // Default for testing
      
      // Get user's roles and permissions
      const userPermissions = await db
        .select({
          canView: permissions.canView,
          canCreate: permissions.canCreate,
          canEdit: permissions.canEdit,
          canDelete: permissions.canDelete,
          canManage: permissions.canManage,
          canExport: permissions.canExport,
          canImport: permissions.canImport,
          dataAccessLevel: permissions.dataAccessLevel,
          restrictedFields: permissions.restrictedFields,
          readOnlyFields: permissions.readOnlyFields,
          module: permissions.module,
          roleName: roles.name
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(permissions, eq(roles.id, permissions.roleId))
        .where(and(
          eq(userRoles.userId, userId),
          eq(permissions.module, module)
        ));

      if (userPermissions.length === 0) {
        return res.json({ 
          hasPermission: false, 
          reason: "No permissions found for this module",
          userRoles: []
        });
      }

      // Aggregate permissions from all roles (OR logic - if any role grants permission, user has it)
      const hasPermission = userPermissions.some(perm => {
        switch (action.toLowerCase()) {
          case 'view': return perm.canView;
          case 'create': return perm.canCreate;
          case 'edit': return perm.canEdit;
          case 'delete': return perm.canDelete;
          case 'manage': return perm.canManage;
          case 'export': return perm.canExport;
          case 'import': return perm.canImport;
          default: return false;
        }
      });

      const aggregatedPermission = {
        canView: userPermissions.some(p => p.canView),
        canCreate: userPermissions.some(p => p.canCreate),
        canEdit: userPermissions.some(p => p.canEdit),
        canDelete: userPermissions.some(p => p.canDelete),
        canManage: userPermissions.some(p => p.canManage),
        canExport: userPermissions.some(p => p.canExport),
        canImport: userPermissions.some(p => p.canImport),
        dataAccessLevel: userPermissions.find(p => p.dataAccessLevel === 'all')?.dataAccessLevel || 
                        userPermissions.find(p => p.dataAccessLevel === 'department')?.dataAccessLevel ||
                        userPermissions.find(p => p.dataAccessLevel === 'team')?.dataAccessLevel || 'own',
        restrictedFields: [...new Set(userPermissions.flatMap(p => p.restrictedFields || []))],
        readOnlyFields: [...new Set(userPermissions.flatMap(p => p.readOnlyFields || []))],
        userRoles: userPermissions.map(p => p.roleName)
      };

      res.json({
        hasPermission,
        permissions: aggregatedPermission,
        requestedAction: action,
        module,
        userId
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
      res.status(500).json({ message: "Failed to check permissions" });
    }
  });

  // Get all permissions for a user across all modules
  app.get("/api/users/:userId/permissions", async (req, res) => {
    try {
      const userPermissions = await db
        .select({
          module: permissions.module,
          canView: permissions.canView,
          canCreate: permissions.canCreate,
          canEdit: permissions.canEdit,
          canDelete: permissions.canDelete,
          canManage: permissions.canManage,
          canExport: permissions.canExport,
          canImport: permissions.canImport,
          dataAccessLevel: permissions.dataAccessLevel,
          restrictedFields: permissions.restrictedFields,
          readOnlyFields: permissions.readOnlyFields,
          roleName: roles.name,
          roleId: roles.id
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(permissions, eq(roles.id, permissions.roleId))
        .where(eq(userRoles.userId, req.params.userId))
        .orderBy(permissions.module, roles.name);

      // Group by module and aggregate permissions
      const modulePermissions = userPermissions.reduce((acc, perm) => {
        if (!acc[perm.module]) {
          acc[perm.module] = {
            module: perm.module,
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canManage: false,
            canExport: false,
            canImport: false,
            dataAccessLevel: 'own',
            restrictedFields: [],
            readOnlyFields: [],
            grantedByRoles: []
          };
        }

        const current = acc[perm.module];
        current.canView = current.canView || perm.canView;
        current.canCreate = current.canCreate || perm.canCreate;
        current.canEdit = current.canEdit || perm.canEdit;
        current.canDelete = current.canDelete || perm.canDelete;
        current.canManage = current.canManage || perm.canManage;
        current.canExport = current.canExport || perm.canExport;
        current.canImport = current.canImport || perm.canImport;
        
        // Use highest data access level
        const accessLevels = ['own', 'team', 'department', 'all'];
        const currentLevel = accessLevels.indexOf(current.dataAccessLevel);
        const newLevel = accessLevels.indexOf(perm.dataAccessLevel);
        if (newLevel > currentLevel) {
          current.dataAccessLevel = perm.dataAccessLevel;
        }

        // Combine field restrictions
        current.restrictedFields = [...new Set([...current.restrictedFields, ...(perm.restrictedFields || [])])];
        current.readOnlyFields = [...new Set([...current.readOnlyFields, ...(perm.readOnlyFields || [])])];
        current.grantedByRoles.push({ roleId: perm.roleId, roleName: perm.roleName });

        return acc;
      }, {} as Record<string, any>);

      res.json(Object.values(modulePermissions));
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
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

  // === LEAD NOTES ===
  app.get("/api/lead-notes/:leadId", async (req, res) => {
    try {
      const { leadId } = req.params;
      const notes = await db.select()
        .from(leadNotes)
        .where(eq(leadNotes.leadId, leadId))
        .orderBy(desc(leadNotes.createdAt));

      res.json(notes);
    } catch (error) {
      console.error("Error fetching lead notes:", error);
      res.status(500).json({ error: "Failed to fetch lead notes" });
    }
  });

  app.post("/api/lead-notes", async (req, res) => {
    try {
      const validatedData = insertLeadNoteSchema.parse(req.body);
      const [note] = await db.insert(leadNotes).values(validatedData).returning();
      
      await createAuditLog(
        "created",
        "lead_note",
        note.id,
        `Note for lead ${validatedData.leadId}`,
        validatedData.authorId,
        "Lead note created",
        null,
        validatedData,
        req
      );

      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating lead note:", error);
      res.status(500).json({ error: "Failed to create lead note" });
    }
  });

  app.patch("/api/lead-notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertLeadNoteSchema.partial().parse(req.body);
      
      const [note] = await db.update(leadNotes)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(leadNotes.id, id))
        .returning();

      if (!note) {
        return res.status(404).json({ error: "Lead note not found" });
      }

      await createAuditLog(
        "updated",
        "lead_note",
        id,
        `Note for lead ${note.leadId}`,
        note.authorId,
        "Lead note updated",
        null,
        validatedData,
        req
      );

      res.json(note);
    } catch (error) {
      console.error("Error updating lead note:", error);
      res.status(500).json({ error: "Failed to update lead note" });
    }
  });

  app.delete("/api/lead-notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [note] = await db.delete(leadNotes)
        .where(eq(leadNotes.id, id))
        .returning();

      if (!note) {
        return res.status(404).json({ error: "Lead note not found" });
      }

      await createAuditLog(
        "deleted",
        "lead_note",
        id,
        `Note for lead ${note.leadId}`,
        note.authorId,
        "Lead note deleted",
        note,
        null,
        req
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead note:", error);
      res.status(500).json({ error: "Failed to delete lead note" });
    }
  });

  // === LEAD APPOINTMENTS ===
  app.get("/api/lead-appointments/:leadId", async (req, res) => {
    try {
      const { leadId } = req.params;
      const appointments = await db.select({
        id: leadAppointments.id,
        leadId: leadAppointments.leadId,
        calendarId: leadAppointments.calendarId,
        assignedTo: leadAppointments.assignedTo,
        title: leadAppointments.title,
        description: leadAppointments.description,
        startTime: leadAppointments.startTime,
        endTime: leadAppointments.endTime,
        location: leadAppointments.location,
        status: leadAppointments.status,
        createdBy: leadAppointments.createdBy,
        createdAt: leadAppointments.createdAt,
        calendarName: calendars.name,
        createdByName: sql<string>`${staff.firstName} || ' ' || ${staff.lastName}`,
      })
      .from(leadAppointments)
      .leftJoin(calendars, eq(leadAppointments.calendarId, calendars.id))
      .leftJoin(staff, eq(leadAppointments.createdBy, staff.id))
      .where(eq(leadAppointments.leadId, leadId))
      .orderBy(desc(leadAppointments.startTime));

      res.json(appointments);
    } catch (error) {
      console.error("Error fetching lead appointments:", error);
      res.status(500).json({ error: "Failed to fetch lead appointments" });
    }
  });

  app.post("/api/lead-appointments", async (req, res) => {
    try {
      // Convert string dates to Date objects
      const requestData = {
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
      };
      
      const validatedData = insertLeadAppointmentSchema.parse(requestData);
      const [appointment] = await db.insert(leadAppointments).values(validatedData).returning();
      
      await createAuditLog(
        "created",
        "lead_appointment",
        appointment.id,
        `${validatedData.title} - Lead ${validatedData.leadId}`,
        validatedData.createdBy,
        "Lead appointment booked",
        null,
        validatedData,
        req
      );

      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating lead appointment:", error);
      res.status(500).json({ error: "Failed to create lead appointment" });
    }
  });

  app.patch("/api/lead-appointments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Convert string dates to Date objects if they exist
      const requestData = { ...req.body };
      if (requestData.startTime) {
        requestData.startTime = new Date(requestData.startTime);
      }
      if (requestData.endTime) {
        requestData.endTime = new Date(requestData.endTime);
      }
      
      const validatedData = insertLeadAppointmentSchema.partial().parse(requestData);
      
      const [appointment] = await db.update(leadAppointments)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(leadAppointments.id, id))
        .returning();

      if (!appointment) {
        return res.status(404).json({ error: "Lead appointment not found" });
      }

      await createAuditLog(
        "updated",
        "lead_appointment",
        id,
        `${appointment.title} - Lead ${appointment.leadId}`,
        appointment.createdBy,
        "Lead appointment updated",
        null,
        validatedData,
        req
      );

      res.json(appointment);
    } catch (error) {
      console.error("Error updating lead appointment:", error);
      res.status(500).json({ error: "Failed to update lead appointment" });
    }
  });

  app.delete("/api/lead-appointments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [appointment] = await db.delete(leadAppointments)
        .where(eq(leadAppointments.id, id))
        .returning();

      if (!appointment) {
        return res.status(404).json({ error: "Lead appointment not found" });
      }

      await createAuditLog(
        "deleted",
        "lead_appointment",
        id,
        `${appointment.title} - Lead ${appointment.leadId}`,
        appointment.createdBy,
        "Lead appointment deleted",
        appointment,
        null,
        req
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead appointment:", error);
      res.status(500).json({ error: "Failed to delete lead appointment" });
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

      if (!(global as any).clientTasks?.[clientId]) {
        return res.status(404).json({ error: "Client not found or has no tasks" });
      }

      const taskIndex = (global as any).clientTasks[clientId].findIndex((t: any) => t.id === taskId);
      if (taskIndex === -1) {
        return res.status(404).json({ error: "Task not found" });
      }

      const deletedTask = (global as any).clientTasks[clientId][taskIndex];
      
      // Remove from client tasks
      (global as any).clientTasks[clientId].splice(taskIndex, 1);

      // Also remove from global tasks storage
      if ((global as any).tasks) {
        (global as any).tasks = (global as any).tasks.filter((task: any) => task.id !== taskId);
      }

      // Also delete associated comments
      if ((global as any).taskComments?.[taskId]) {
        delete (global as any).taskComments[taskId];
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
      
      // Get comments from database
      const commentsData = await db
        .select()
        .from(taskComments)
        .where(eq(taskComments.taskId, taskId))
        .orderBy(asc(taskComments.createdAt));

      // Get files for all comments
      const commentIds = commentsData.map(c => c.id);
      const filesData = commentIds.length > 0 
        ? await db
            .select()
            .from(commentFiles)
            .where(inArray(commentFiles.commentId, commentIds))
        : [];

      // Group files by comment ID
      const filesByComment = filesData.reduce((acc, file) => {
        if (!acc[file.commentId]) acc[file.commentId] = [];
        acc[file.commentId].push(file);
        return acc;
      }, {} as Record<string, any[]>);
      
      // Enrich comments with author information and files
      const enrichedComments = await Promise.all(
        commentsData.map(async (comment: any) => {
          try {
            const authorData = await db.select().from(staff).where(eq(staff.id, comment.authorId)).limit(1);
            return {
              ...comment,
              author: authorData.length > 0 ? {
                firstName: authorData[0].firstName,
                lastName: authorData[0].lastName,
                email: authorData[0].email
              } : { firstName: "Unknown", lastName: "User", email: "" },
              files: filesByComment[comment.id] || []
            };
          } catch (error) {
            return {
              ...comment,
              author: { firstName: "Unknown", lastName: "User", email: "" },
              files: filesByComment[comment.id] || []
            };
          }
        })
      );
      
      // Organize comments into threaded structure
      const topLevelComments = enrichedComments.filter(comment => !comment.parentId);
      const organizedComments = topLevelComments.map(comment => ({
        ...comment,
        replies: enrichedComments.filter(reply => reply.parentId === comment.id)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      }));
      
      res.json(organizedComments);
    } catch (error) {
      console.error("Error fetching task comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { content, mentions, fileUrls } = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";

      if (!content?.trim()) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      // Get author information
      const authorData = await db.select().from(staff).where(eq(staff.id, userId)).limit(1);
      const author = authorData.length > 0 ? {
        firstName: authorData[0].firstName,
        lastName: authorData[0].lastName,
        email: authorData[0].email
      } : { firstName: "Unknown", lastName: "User", email: "" };

      // Create comment in database
      const [newComment] = await db.insert(taskComments).values({
        taskId: taskId,
        content: content.trim(),
        authorId: userId,
        mentions: mentions || [],
        parentId: req.body.parentId || null,
      }).returning();

      // Handle file attachments if provided
      if (fileUrls && fileUrls.length > 0) {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        
        for (const fileData of fileUrls) {
          try {
            // Set ACL policy for the file
            await objectStorageService.trySetObjectEntityAclPolicy(fileData.url, {
              owner: userId,
              visibility: "private"
            });
            
            // Normalize the file URL
            const normalizedUrl = objectStorageService.normalizeObjectEntityPath(fileData.url);
            
            // Create file record
            await db.insert(commentFiles).values({
              commentId: newComment.id,
              fileName: fileData.name,
              fileType: fileData.type,
              fileSize: fileData.size,
              fileUrl: normalizedUrl,
              uploadedBy: userId,
            });
          } catch (error) {
            console.error("Error processing file attachment:", error);
          }
        }
      }

      // Create notifications for mentioned users
      if (mentions && mentions.length > 0) {
        for (const mentionedUserId of mentions) {
          // Add notification logic here if needed
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

      // Return comment with author info
      res.status(201).json({
        ...newComment,
        author
      });
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

  // Comment Reactions API
  app.get("/api/tasks/:taskId/comments/:commentId/reactions", async (req, res) => {
    try {
      const { taskId, commentId } = req.params;
      
      if (!global.commentReactions) {
        global.commentReactions = {};
      }
      
      const reactions = global.commentReactions[commentId] || [];
      
      // Group reactions by emoji and include user info
      const groupedReactions: any = {};
      
      for (const reaction of reactions) {
        if (!groupedReactions[reaction.emoji]) {
          groupedReactions[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: []
          };
        }
        
        // Get user info for this reaction
        const userData = await db.select().from(staff).where(eq(staff.id, reaction.userId)).limit(1);
        const user = userData.length > 0 ? {
          id: userData[0].id,
          name: `${userData[0].firstName} ${userData[0].lastName}`
        } : { id: reaction.userId, name: "Unknown User" };
        
        groupedReactions[reaction.emoji].count++;
        groupedReactions[reaction.emoji].users.push(user);
      }
      
      res.json(Object.values(groupedReactions));
    } catch (error) {
      console.error("Error fetching comment reactions:", error);
      res.status(500).json({ error: "Failed to fetch reactions" });
    }
  });

  app.post("/api/tasks/:taskId/comments/:commentId/reactions", async (req, res) => {
    try {
      const { taskId, commentId } = req.params;
      const { emoji } = req.body;
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      if (!emoji) {
        return res.status(400).json({ error: "Emoji is required" });
      }
      
      if (!global.commentReactions) {
        global.commentReactions = {};
      }
      
      if (!global.commentReactions[commentId]) {
        global.commentReactions[commentId] = [];
      }
      
      // Check if user already reacted with this emoji
      const existingReaction = global.commentReactions[commentId].find(
        (r: any) => r.userId === userId && r.emoji === emoji
      );
      
      if (existingReaction) {
        // Remove existing reaction (toggle off)
        global.commentReactions[commentId] = global.commentReactions[commentId].filter(
          (r: any) => !(r.userId === userId && r.emoji === emoji)
        );
        res.json({ action: "removed", emoji });
      } else {
        // Add new reaction
        const newReaction = {
          id: nanoid(),
          commentId,
          userId,
          emoji,
          createdAt: new Date().toISOString()
        };
        
        global.commentReactions[commentId].push(newReaction);
        res.json({ action: "added", emoji });
      }
    } catch (error) {
      console.error("Error handling comment reaction:", error);
      res.status(500).json({ error: "Failed to handle reaction" });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      // Query notifications from the database
      const userNotifications = await db.select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
      
      res.json(userNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      const [updated] = await db.update(notifications)
        .set({ 
          isRead: true,
          readAt: new Date()
        })
        .where(
          and(
            eq(notifications.id, req.params.id),
            eq(notifications.userId, userId)
          )
        )
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      const [deleted] = await db.delete(notifications)
        .where(
          and(
            eq(notifications.id, req.params.id),
            eq(notifications.userId, userId)
          )
        )
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const userId = req.session?.userId || "e56be30d-c086-446c-ada4-7ccef37ad7fb";
      
      const updated = await db.update(notifications)
        .set({ 
          isRead: true,
          readAt: new Date()
        })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        )
        .returning();
      
      res.json({ 
        message: `${updated.length} notifications marked as read`,
        updated: updated.length
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Test endpoint to view notifications for any staff member (dev only)
  app.get("/api/notifications/staff/:staffId", async (req, res) => {
    try {
      const staffId = req.params.staffId;
      
      // Query notifications from the database for specific staff member
      const userNotifications = await db.select()
        .from(notifications)
        .where(eq(notifications.userId, staffId))
        .orderBy(desc(notifications.createdAt));
      
      res.json(userNotifications);
    } catch (error) {
      console.error("Error fetching staff notifications:", error);
      res.status(500).json({ error: "Failed to fetch staff notifications" });
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

  // Get lead appointments
  app.get("/api/lead-appointments", async (req, res) => {
    try {
      const { leadId } = req.query;

      let query = db
        .select({
          id: leadAppointments.id,
          leadId: leadAppointments.leadId,
          calendarId: leadAppointments.calendarId,
          assignedTo: leadAppointments.assignedTo,
          title: leadAppointments.title,
          description: leadAppointments.description,
          startTime: leadAppointments.startTime,
          endTime: leadAppointments.endTime,
          location: leadAppointments.location,
          status: leadAppointments.status,
          createdBy: leadAppointments.createdBy,
          createdAt: leadAppointments.createdAt,
          updatedAt: leadAppointments.updatedAt,
          // Lead details
          leadName: leads.name,
          leadEmail: leads.email,
          leadCompany: leads.company,
          // Staff details
          staffFirstName: staff.firstName,
          staffLastName: staff.lastName,
          staffEmail: staff.email,
          // Calendar details
          calendarName: calendars.name,
        })
        .from(leadAppointments)
        .leftJoin(leads, eq(leadAppointments.leadId, leads.id))
        .leftJoin(staff, eq(leadAppointments.assignedTo, staff.id))
        .leftJoin(calendars, eq(leadAppointments.calendarId, calendars.id));

      if (leadId) {
        query = query.where(eq(leadAppointments.leadId, leadId as string));
      }

      const appointments = await query.orderBy(asc(leadAppointments.startTime));

      res.json(appointments);
    } catch (error) {
      console.error('Error fetching lead appointments:', error);
      res.status(500).json({ message: "Failed to fetch lead appointments" });
    }
  });

  // Get calendar appointments (modified to include lead appointments)
  app.get("/api/calendar-appointments", async (req, res) => {
    try {
      const { calendarId, staffId, startDate, endDate, includeLeadAppointments } = req.query;

      // Get regular calendar appointments
      let calendarQuery = db
        .select({
          id: calendarAppointments.id,
          calendarId: calendarAppointments.calendarId,
          clientId: calendarAppointments.clientId,
          assignedTo: calendarAppointments.assignedTo,
          title: calendarAppointments.title,
          description: calendarAppointments.description,
          startTime: calendarAppointments.startTime,
          endTime: calendarAppointments.endTime,
          status: calendarAppointments.status,
          location: calendarAppointments.location,
          locationDetails: calendarAppointments.locationDetails,
          meetingLink: calendarAppointments.meetingLink,
          timezone: calendarAppointments.timezone,
          bookerName: calendarAppointments.bookerName,
          bookerEmail: calendarAppointments.bookerEmail,
          bookerPhone: calendarAppointments.bookerPhone,
          customFieldData: calendarAppointments.customFieldData,
          externalEventId: calendarAppointments.externalEventId,
          bookingSource: calendarAppointments.bookingSource,
          cancelledAt: calendarAppointments.cancelledAt,
          cancelledBy: calendarAppointments.cancelledBy,
          cancellationReason: calendarAppointments.cancellationReason,
          createdAt: calendarAppointments.createdAt,
          updatedAt: calendarAppointments.updatedAt,
          type: sql<string>`'calendar'`.as('type'),
          leadId: sql<string>`null`.as('leadId'),
          leadName: sql<string>`null`.as('leadName'),
          leadEmail: sql<string>`null`.as('leadEmail'),
        })
        .from(calendarAppointments);

      if (calendarId) {
        calendarQuery = calendarQuery.where(eq(calendarAppointments.calendarId, calendarId as string));
      }

      const regularAppointments = await calendarQuery.orderBy(asc(calendarAppointments.startTime));

      // Get lead appointments if requested
      let allAppointments = regularAppointments;
      
      if (includeLeadAppointments === 'true') {
        let leadQuery = db
          .select({
            id: leadAppointments.id,
            calendarId: leadAppointments.calendarId,
            clientId: sql<string>`null`.as('clientId'),
            assignedTo: leadAppointments.assignedTo,
            title: leadAppointments.title,
            description: leadAppointments.description,
            startTime: leadAppointments.startTime,
            endTime: leadAppointments.endTime,
            status: leadAppointments.status,
            location: leadAppointments.location,
            locationDetails: sql<string>`null`.as('locationDetails'),
            meetingLink: sql<string>`null`.as('meetingLink'),
            timezone: sql<string>`'America/New_York'`.as('timezone'),
            bookerName: leads.name,
            bookerEmail: leads.email,
            bookerPhone: leads.phone,
            customFieldData: sql<any>`null`.as('customFieldData'),
            externalEventId: sql<string>`null`.as('externalEventId'),
            bookingSource: sql<string>`'lead'`.as('bookingSource'),
            cancelledAt: sql<any>`null`.as('cancelledAt'),
            cancelledBy: sql<string>`null`.as('cancelledBy'),
            cancellationReason: sql<string>`null`.as('cancellationReason'),
            createdAt: leadAppointments.createdAt,
            updatedAt: leadAppointments.updatedAt,
            type: sql<string>`'lead'`.as('type'),
            leadId: leadAppointments.leadId,
            leadName: leads.name,
            leadEmail: leads.email,
          })
          .from(leadAppointments)
          .leftJoin(leads, eq(leadAppointments.leadId, leads.id));

        if (calendarId) {
          leadQuery = leadQuery.where(eq(leadAppointments.calendarId, calendarId as string));
        }

        const leadAppointmentsData = await leadQuery.orderBy(asc(leadAppointments.startTime));
        
        // Combine both types of appointments
        allAppointments = [...regularAppointments, ...leadAppointmentsData];
        
        // Sort by start time
        allAppointments.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      }

      res.json(allAppointments);
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

  // Form folders endpoints
  app.get("/api/form-folders", async (req, res) => {
    try {
      const foldersResult = await db.select().from(formFolders).orderBy(asc(formFolders.order));
      res.json(foldersResult);
    } catch (error) {
      console.error("Error fetching form folders:", error);
      res.status(500).json({ message: "Failed to fetch form folders" });
    }
  });

  app.post("/api/form-folders", async (req, res) => {
    try {
      const folderData = insertFormFolderSchema.parse(req.body);
      const result = await db.insert(formFolders).values(folderData).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating form folder:", error);
      res.status(500).json({ message: "Failed to create form folder" });
    }
  });

  app.put("/api/form-folders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const folderData = insertFormFolderSchema.parse(req.body);
      const result = await db.update(formFolders)
        .set(folderData)
        .where(eq(formFolders.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ message: "Form folder not found" });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error("Error updating form folder:", error);
      res.status(500).json({ message: "Failed to update form folder" });
    }
  });

  app.delete("/api/form-folders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if any forms are using this folder
      const formsInFolder = await db.select().from(forms).where(eq(forms.folderId, id));
      if (formsInFolder.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete folder that contains forms. Please move or delete the forms first." 
        });
      }
      
      const result = await db.delete(formFolders).where(eq(formFolders.id, id)).returning();
      
      if (result.length === 0) {
        return res.status(404).json({ message: "Form folder not found" });
      }
      
      res.json({ message: "Form folder deleted successfully" });
    } catch (error) {
      console.error("Error deleting form folder:", error);
      res.status(500).json({ message: "Failed to delete form folder" });
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
      
      // Update form - only allow specific fields and let DB handle updatedAt
      const allowedFields = ['name', 'description', 'status', 'settings'];
      const cleanFormData: any = {};
      
      for (const field of allowedFields) {
        if (formData[field] !== undefined) {
          cleanFormData[field] = formData[field];
        }
      }
      
      // Use sql template to avoid timestamp conflicts
      const formResult = await db.execute(sql`
        UPDATE forms 
        SET 
          name = COALESCE(${cleanFormData.name}, name),
          description = COALESCE(${cleanFormData.description}, description),
          status = COALESCE(${cleanFormData.status}, status),
          settings = COALESCE(${cleanFormData.settings ? JSON.stringify(cleanFormData.settings) : null}, settings),
          updated_at = NOW()
        WHERE id = ${req.params.id}
        RETURNING *
      `);
      
      if (!formResult.rows || formResult.rows.length === 0) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      const form = formResult.rows[0];
      
      // Update form fields if provided
      if (fields && Array.isArray(fields)) {
        // Get existing fields to delete ones not included
        const existingFields = await db.select()
          .from(formFields)
          .where(eq(formFields.formId, req.params.id));
          
        // Filter out temporary IDs (temp-*) - these are new fields to be created
        const realFieldIds = fields.map(f => f.id).filter(id => id && !id.startsWith('temp-'));
        
        // Delete removed fields (only delete if not in the real field IDs)
        for (const existingField of existingFields) {
          if (!realFieldIds.includes(existingField.id)) {
            await db.delete(formFields).where(eq(formFields.id, existingField.id));
          }
        }
        
        // Update or create fields
        for (let i = 0; i < fields.length; i++) {
          const field = fields[i];
          if (field.id && !field.id.startsWith('temp-')) {
            // Update existing field - exclude timestamp fields
            const { createdAt, ...fieldData } = field;
            await db.update(formFields)
              .set({ ...fieldData, order: i })
              .where(eq(formFields.id, field.id));
          } else {
            // Create new field (either no ID or temp ID) - exclude timestamp fields  
            const { createdAt, id, ...fieldData } = field;
            await db.insert(formFields).values({
              ...fieldData,
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

  // Duplicate form
  app.post("/api/forms/:id/duplicate", async (req, res) => {
    try {
      // Get the original form
      const originalForm = await db.select().from(forms).where(eq(forms.id, req.params.id)).limit(1);
      if (!originalForm[0]) {
        return res.status(404).json({ message: "Form not found" });
      }

      // Get original form fields
      const originalFields = await db.select().from(formFields)
        .where(eq(formFields.formId, req.params.id))
        .orderBy(asc(formFields.orderIndex));

      // Create duplicated form
      const duplicatedForm = {
        ...originalForm[0],
        id: undefined, // Let DB generate new ID
        name: `${originalForm[0].name} (Copy)`,
        createdAt: undefined,
        updatedAt: undefined,
        createdBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb", // Default user ID
      };

      const formResult = await db.insert(forms).values(duplicatedForm).returning();
      const newForm = formResult[0];

      // Duplicate form fields
      if (originalFields.length > 0) {
        const duplicatedFields = originalFields.map(field => ({
          ...field,
          id: undefined, // Let DB generate new ID
          formId: newForm.id,
        }));

        await db.insert(formFields).values(duplicatedFields);
      }

      res.json(newForm);
    } catch (error) {
      console.error("Error duplicating form:", error);
      res.status(500).json({ message: "Failed to duplicate form" });
    }
  });

  // Move form to folder
  app.put("/api/forms/:id/move", async (req, res) => {
    try {
      const { folderId } = req.body;
      
      // Validate that the folder exists if folderId is provided
      if (folderId && folderId !== null) {
        const folder = await db.select().from(formFolders).where(eq(formFolders.id, folderId)).limit(1);
        if (!folder[0]) {
          return res.status(404).json({ message: "Folder not found" });
        }
      }

      // Update the form's folderId
      const result = await db.update(forms)
        .set({ folderId: folderId || null })
        .where(eq(forms.id, req.params.id))
        .returning();

      if (!result[0]) {
        return res.status(404).json({ message: "Form not found" });
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Error moving form:", error);
      res.status(500).json({ message: "Failed to move form" });
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

  // File upload routes for task comments
  app.get("/api/comments/upload-url", async (req, res) => {
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
  
  app.post("/api/comments/upload-url", async (req, res) => {
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

  // File download route for comment files
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(`/objects/${req.params.objectPath}`);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add file to comment after upload
  app.post("/api/comments/:commentId/files", async (req, res) => {
    try {
      const { fileName, fileType, fileSize, fileUrl } = req.body;
      const commentId = req.params.commentId;
      const userId = req.session?.userId || "system"; // In real app, get from session
      
      // Validate file type
      if (!validateFileType(fileName)) {
        return res.status(400).json({ error: "File type not allowed" });
      }
      
      if (isForbiddenFileType(fileName)) {
        return res.status(400).json({ error: "Dangerous file type detected" });
      }
      
      // Sanitize filename
      const sanitizedFileName = sanitizeFileName(fileName);
      
      // Normalize the file URL
      const objectStorageService = new ObjectStorageService();
      const normalizedUrl = objectStorageService.normalizeObjectEntityPath(fileUrl);
      
      // Set ACL policy for the file
      await objectStorageService.trySetObjectEntityAclPolicy(fileUrl, {
        owner: userId,
        visibility: "private"
      });
      
      // Create file record
      const [newFile] = await db.insert(commentFiles).values({
        commentId,
        fileName: sanitizedFileName,
        fileType: fileType.toLowerCase(),
        fileSize,
        fileUrl: normalizedUrl,
        uploadedBy: userId,
      }).returning();

      res.json(newFile);
    } catch (error) {
      console.error("Error adding file to comment:", error);
      res.status(500).json({ error: "Failed to add file" });
    }
  });

  // Timer endpoints for global timer functionality
  app.get("/api/time-entries/running", async (req, res) => {
    try {
      // Check all tasks for incomplete time entries (running timers)
      const allTasks = await storage.getTasks();
      
      for (const task of allTasks) {
        if (task.timeEntries && Array.isArray(task.timeEntries)) {
          const runningEntry = task.timeEntries.find((entry: any) => entry.isRunning);
          if (runningEntry) {
            res.json({
              ...runningEntry,
              taskId: task.id,
              taskTitle: task.title
            });
            return;
          }
        }
      }
      
      res.json(null); // No running timer found
    } catch (error) {
      console.error("Error checking for running timer:", error);
      res.status(500).json({ error: "Failed to check for running timer" });
    }
  });

  // Task Settings Management API Routes

  // Task Statuses Routes
  app.get("/api/task-statuses", async (req, res) => {
    try {
      const statuses = await db.select()
        .from(taskStatuses)
        .where(eq(taskStatuses.isActive, true))
        .orderBy(asc(taskStatuses.sortOrder), asc(taskStatuses.name));
      
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching task statuses:", error);
      res.status(500).json({ message: "Failed to fetch task statuses" });
    }
  });

  app.post("/api/task-statuses", async (req, res) => {
    try {
      const validatedData = insertTaskStatusSchema.parse(req.body);
      const [newStatus] = await db.insert(taskStatuses)
        .values(validatedData)
        .returning();
      
      // Log the creation
      await createAuditLog(
        "created",
        "task_status",
        newStatus.id,
        newStatus.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Task status created: ${newStatus.name}`,
        null,
        { name: newStatus.name, value: newStatus.value, color: newStatus.color },
        req
      );
      
      res.status(201).json(newStatus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating task status:", error);
      res.status(500).json({ message: "Failed to create task status" });
    }
  });

  app.put("/api/task-statuses/:id", async (req, res) => {
    try {
      const validatedData = insertTaskStatusSchema.partial().parse(req.body);
      const [updatedStatus] = await db.update(taskStatuses)
        .set({ ...validatedData, updatedAt: sql`now()` })
        .where(eq(taskStatuses.id, req.params.id))
        .returning();
      
      if (!updatedStatus) {
        return res.status(404).json({ message: "Task status not found" });
      }
      
      // Log the update
      await createAuditLog(
        "updated",
        "task_status",
        updatedStatus.id,
        updatedStatus.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Task status updated: ${updatedStatus.name}`,
        null,
        validatedData,
        req
      );
      
      res.json(updatedStatus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  app.delete("/api/task-statuses/:id", async (req, res) => {
    try {
      const [statusToDelete] = await db.select()
        .from(taskStatuses)
        .where(eq(taskStatuses.id, req.params.id));
      
      if (!statusToDelete) {
        return res.status(404).json({ message: "Task status not found" });
      }
      
      if (statusToDelete.isSystemStatus) {
        return res.status(400).json({ message: "Cannot delete system task status" });
      }
      
      // Soft delete by setting isActive to false
      const [deletedStatus] = await db.update(taskStatuses)
        .set({ isActive: false, updatedAt: sql`now()` })
        .where(eq(taskStatuses.id, req.params.id))
        .returning();
      
      // Log the deletion
      await createAuditLog(
        "deleted",
        "task_status",
        req.params.id,
        statusToDelete.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Task status deactivated: ${statusToDelete.name}`,
        { name: statusToDelete.name },
        null,
        req
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task status:", error);
      res.status(500).json({ message: "Failed to delete task status" });
    }
  });

  // Task Priorities Routes
  app.get("/api/task-priorities", async (req, res) => {
    try {
      const priorities = await db.select()
        .from(taskPriorities)
        .where(eq(taskPriorities.isActive, true))
        .orderBy(desc(taskPriorities.sortOrder), asc(taskPriorities.name));
      
      res.json(priorities);
    } catch (error) {
      console.error("Error fetching task priorities:", error);
      res.status(500).json({ message: "Failed to fetch task priorities" });
    }
  });

  app.post("/api/task-priorities", async (req, res) => {
    try {
      const validatedData = insertTaskPrioritySchema.parse(req.body);
      const [newPriority] = await db.insert(taskPriorities)
        .values(validatedData)
        .returning();
      
      // Log the creation
      await createAuditLog(
        "created",
        "task_priority",
        newPriority.id,
        newPriority.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Task priority created: ${newPriority.name}`,
        null,
        { name: newPriority.name, value: newPriority.value, color: newPriority.color },
        req
      );
      
      res.status(201).json(newPriority);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating task priority:", error);
      res.status(500).json({ message: "Failed to create task priority" });
    }
  });

  app.put("/api/task-priorities/:id", async (req, res) => {
    try {
      const validatedData = insertTaskPrioritySchema.partial().parse(req.body);
      const [updatedPriority] = await db.update(taskPriorities)
        .set({ ...validatedData, updatedAt: sql`now()` })
        .where(eq(taskPriorities.id, req.params.id))
        .returning();
      
      if (!updatedPriority) {
        return res.status(404).json({ message: "Task priority not found" });
      }
      
      // Log the update
      await createAuditLog(
        "updated",
        "task_priority",
        updatedPriority.id,
        updatedPriority.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Task priority updated: ${updatedPriority.name}`,
        null,
        validatedData,
        req
      );
      
      res.json(updatedPriority);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating task priority:", error);
      res.status(500).json({ message: "Failed to update task priority" });
    }
  });

  app.delete("/api/task-priorities/:id", async (req, res) => {
    try {
      const [priorityToDelete] = await db.select()
        .from(taskPriorities)
        .where(eq(taskPriorities.id, req.params.id));
      
      if (!priorityToDelete) {
        return res.status(404).json({ message: "Task priority not found" });
      }
      
      if (priorityToDelete.isSystemPriority) {
        return res.status(400).json({ message: "Cannot delete system task priority" });
      }
      
      // Soft delete by setting isActive to false
      const [deletedPriority] = await db.update(taskPriorities)
        .set({ isActive: false, updatedAt: sql`now()` })
        .where(eq(taskPriorities.id, req.params.id))
        .returning();
      
      // Log the deletion
      await createAuditLog(
        "deleted",
        "task_priority",
        req.params.id,
        priorityToDelete.name,
        "e56be30d-c086-446c-ada4-7ccef37ad7fb",
        `Task priority deactivated: ${priorityToDelete.name}`,
        { name: priorityToDelete.name },
        null,
        req
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task priority:", error);
      res.status(500).json({ message: "Failed to delete task priority" });
    }
  });

  // Task Settings Routes
  app.get("/api/task-settings", async (req, res) => {
    try {
      const settings = await db.select().from(taskSettings);
      
      // Transform into key-value object for easier consumption
      const settingsObject = settings.reduce((acc, setting) => {
        acc[setting.settingKey] = setting.settingValue;
        return acc;
      }, {} as Record<string, any>);
      
      res.json(settingsObject);
    } catch (error) {
      console.error("Error fetching task settings:", error);
      res.status(500).json({ message: "Failed to fetch task settings" });
    }
  });

  app.post("/api/task-settings", async (req, res) => {
    try {
      const validatedData = insertTaskSettingsSchema.parse(req.body);
      
      // Check if setting already exists
      const [existingSetting] = await db.select()
        .from(taskSettings)
        .where(eq(taskSettings.settingKey, validatedData.settingKey));
      
      if (existingSetting) {
        // Update existing setting
        const [updatedSetting] = await db.update(taskSettings)
          .set({ 
            settingValue: validatedData.settingValue,
            updatedBy: validatedData.updatedBy,
            updatedAt: sql`now()` 
          })
          .where(eq(taskSettings.settingKey, validatedData.settingKey))
          .returning();
        
        res.json(updatedSetting);
      } else {
        // Create new setting
        const [newSetting] = await db.insert(taskSettings)
          .values(validatedData)
          .returning();
        
        res.status(201).json(newSetting);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error saving task setting:", error);
      res.status(500).json({ message: "Failed to save task setting" });
    }
  });

  // Team Workflows - Manage team-specific status workflows
  app.get("/api/team-workflows", async (req, res) => {
    try {
      const workflows = await db.select()
        .from(teamWorkflows)
        .where(eq(teamWorkflows.isActive, true))
        .orderBy(asc(teamWorkflows.name));
      
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching team workflows:", error);
      res.status(500).json({ message: "Failed to fetch team workflows" });
    }
  });

  app.get("/api/team-workflows/:id", async (req, res) => {
    try {
      const [workflow] = await db.select()
        .from(teamWorkflows)
        .where(eq(teamWorkflows.id, req.params.id));
      
      if (!workflow) {
        return res.status(404).json({ message: "Team workflow not found" });
      }
      
      // Get workflow statuses with their status details
      const workflowStatuses = await db
        .select({
          id: teamWorkflowStatuses.id,
          workflowId: teamWorkflowStatuses.workflowId,
          order: teamWorkflowStatuses.order,
          isRequired: teamWorkflowStatuses.isRequired,
          status: {
            id: taskStatuses.id,
            name: taskStatuses.name,
            value: taskStatuses.value,
            color: taskStatuses.color,
            isDefault: taskStatuses.isDefault,
          }
        })
        .from(teamWorkflowStatuses)
        .innerJoin(taskStatuses, eq(teamWorkflowStatuses.statusId, taskStatuses.id))
        .where(eq(teamWorkflowStatuses.workflowId, req.params.id))
        .orderBy(asc(teamWorkflowStatuses.order));
      
      res.json({ ...workflow, statuses: workflowStatuses });
    } catch (error) {
      console.error("Error fetching team workflow:", error);
      res.status(500).json({ message: "Failed to fetch team workflow" });
    }
  });

  app.post("/api/team-workflows", async (req, res) => {
    try {
      const data = insertTeamWorkflowSchema.parse(req.body);
      
      const [newWorkflow] = await db.insert(teamWorkflows)
        .values(data)
        .returning();
      
      // Create audit log
      await createAuditLog("created", "team_workflow", newWorkflow.id, null, JSON.stringify(data), req.session?.userId || null);
      
      res.status(201).json(newWorkflow);
    } catch (error) {
      console.error("Error creating team workflow:", error);
      res.status(500).json({ message: "Failed to create team workflow" });
    }
  });

  app.patch("/api/team-workflows/:id", async (req, res) => {
    try {
      const data = insertTeamWorkflowSchema.partial().parse(req.body);
      
      // Get current workflow for audit log
      const [currentWorkflow] = await db.select()
        .from(teamWorkflows)
        .where(eq(teamWorkflows.id, req.params.id));
      
      if (!currentWorkflow) {
        return res.status(404).json({ message: "Team workflow not found" });
      }
      
      const [updatedWorkflow] = await db.update(teamWorkflows)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(teamWorkflows.id, req.params.id))
        .returning();
      
      // Create audit log
      await createAuditLog("updated", "team_workflow", updatedWorkflow.id, JSON.stringify(currentWorkflow), JSON.stringify(data), req.session?.userId || null);
      
      res.json(updatedWorkflow);
    } catch (error) {
      console.error("Error updating team workflow:", error);
      res.status(500).json({ message: "Failed to update team workflow" });
    }
  });

  app.delete("/api/team-workflows/:id", async (req, res) => {
    try {
      // Get current workflow for audit log
      const [currentWorkflow] = await db.select()
        .from(teamWorkflows)
        .where(eq(teamWorkflows.id, req.params.id));
      
      if (!currentWorkflow) {
        return res.status(404).json({ message: "Team workflow not found" });
      }
      
      // Check if any departments are using this workflow
      const [departmentCount] = await db.select({ count: sql`count(*)` })
        .from(departments)
        .where(eq(departments.workflowId, req.params.id));
      
      if (departmentCount.count > 0) {
        return res.status(400).json({ 
          message: "Cannot delete workflow that is assigned to departments" 
        });
      }
      
      await db.delete(teamWorkflows)
        .where(eq(teamWorkflows.id, req.params.id));
      
      // Create audit log
      await createAuditLog("deleted", "team_workflow", req.params.id, JSON.stringify(currentWorkflow), null, req.session?.userId || null);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team workflow:", error);
      res.status(500).json({ message: "Failed to delete team workflow" });
    }
  });

  // Team Workflow Statuses - Manage status order within workflows
  app.post("/api/team-workflows/:workflowId/statuses", async (req, res) => {
    try {
      const { statusId, order, isRequired } = req.body;
      
      const data = insertTeamWorkflowStatusSchema.parse({
        workflowId: req.params.workflowId,
        statusId,
        order,
        isRequired,
      });
      
      const [newWorkflowStatus] = await db.insert(teamWorkflowStatuses)
        .values(data)
        .returning();
      
      res.status(201).json(newWorkflowStatus);
    } catch (error) {
      console.error("Error adding status to workflow:", error);
      res.status(500).json({ message: "Failed to add status to workflow" });
    }
  });

  app.patch("/api/team-workflow-statuses/:id", async (req, res) => {
    try {
      const { order, isRequired } = req.body;
      
      const [updatedStatus] = await db.update(teamWorkflowStatuses)
        .set({ order, isRequired })
        .where(eq(teamWorkflowStatuses.id, req.params.id))
        .returning();
      
      res.json(updatedStatus);
    } catch (error) {
      console.error("Error updating workflow status:", error);
      res.status(500).json({ message: "Failed to update workflow status" });
    }
  });

  app.delete("/api/team-workflow-statuses/:id", async (req, res) => {
    try {
      await db.delete(teamWorkflowStatuses)
        .where(eq(teamWorkflowStatuses.id, req.params.id));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing status from workflow:", error);
      res.status(500).json({ message: "Failed to remove status from workflow" });
    }
  });

  // Department workflow assignment
  app.patch("/api/departments/:id/workflow", async (req, res) => {
    try {
      const { workflowId } = req.body;
      
      const [updatedDepartment] = await db.update(departments)
        .set({ workflowId })
        .where(eq(departments.id, req.params.id))
        .returning();
      
      res.json(updatedDepartment);
    } catch (error) {
      console.error("Error assigning workflow to department:", error);
      res.status(500).json({ message: "Failed to assign workflow to department" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
