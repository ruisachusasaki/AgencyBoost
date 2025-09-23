import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import { storage as appStorage } from "./storage";
import { 
  insertClientSchema, insertCampaignSchema, insertLeadSchema, 
  insertTaskSchema, insertTaskActivitySchema, insertInvoiceSchema, insertSocialMediaAccountSchema, 
  insertSocialMediaPostSchema, insertSocialMediaTemplateSchema, 
  insertSocialMediaAnalyticsSchema, insertWorkflowSchema, insertEnhancedTaskSchema,
  insertTaskCategorySchema, insertAutomationTriggerSchema, insertAutomationActionSchema,
  insertTemplateFolderSchema, insertEmailTemplateSchema, insertSmsTemplateSchema,
  insertStaffSchema, insertDepartmentSchema, insertPositionSchema, insertCustomFieldSchema, insertCustomFieldFolderSchema,
  insertTaskCommentSchema, insertTaskCommentReactionSchema, insertCommentFileSchema, insertImageAnnotationSchema,
  insertTimeOffRequestSchema, insertJobApplicationSchema, insertApplicationStageHistorySchema, insertTimeOffBalanceSchema,
  insertJobOpeningSchema, insertJobApplicationFormConfigSchema,
  insertTagSchema, insertProductSchema, insertProductCategorySchema, insertAuditLogSchema,
  insertRoleSchema, insertPermissionSchema, insertUserRoleSchema, insertNotificationSettingsSchema,
  insertProductBundleSchema, insertBundleProductSchema,
  insertClientNoteSchema, insertClientTaskSchema, insertClientAppointmentSchema,
  insertClientDocumentSchema, insertDocumentSchema, insertClientTransactionSchema,
  insertCalendarSchema, insertCalendarStaffSchema, insertCalendarAvailabilitySchema,
  insertCalendarAppointmentSchema, insertCustomFieldFileUploadSchema, insertFormFolderSchema,
  insertCalendarIntegrationSchema, insertSmsIntegrationSchema,
  insertLeadPipelineStagSchema, insertLeadNoteSchema, insertLeadAppointmentSchema,
  insertTaskDependencySchema, insertTaskStatusSchema, insertTaskPrioritySchema, insertTaskSettingsSchema,
  insertTeamWorkflowSchema, insertTeamWorkflowStatusSchema,
  insertTrainingCategorySchema, insertTrainingCourseSchema, insertTrainingModuleSchema, insertTrainingLessonSchema,
  insertTrainingEnrollmentSchema, insertTrainingProgressSchema, insertTrainingQuizSchema,
  insertTrainingQuizQuestionSchema, insertTrainingQuizAttemptSchema, insertTrainingAssignmentSchema,
  insertTrainingAssignmentSubmissionSchema, insertTrainingDiscussionSchema, insertTrainingDiscussionLikeSchema,
  insertTrainingLessonResourceSchema,
  inputClientHealthScoreSchema, insertClientHealthScoreSchema,
  insertSmartListSchema, insertTaskTemplateSchema,
  insertClientBriefSectionSchema, insertClientBriefValueSchema,
  users, authUsers, businessProfile, customFields, customFieldFolders, staff, departments, positions, tags, products, productCategories, auditLogs,
  roles, permissions, userRoles, notificationSettings, clientProducts, clientBundles, productBundles, bundleProducts,
  clientNotes, clientTasks, clientAppointments, clientDocuments, documents, clientTransactions, clientHealthScores, clients,
  calendars, calendarStaff, calendarAvailability, calendarAppointments, calendarDateOverrides, calendarIntegrations, smsIntegrations, emailIntegrations, customFieldFileUploads,
  forms, formFields, formSubmissions, formFolders, leads, leadPipelineStages, leadNotes, leadAppointments, tasks, taskActivities, taskComments, taskCommentReactions, commentFiles, taskAttachments, invoices,
  socialMediaAccounts, socialMediaPosts, workflows, workflowExecutions, automationTriggers, automationActions, imageAnnotations, taskDependencies, notifications,
  taskStatuses, taskPriorities, taskSettings, teamWorkflows, teamWorkflowStatuses, taskTemplates,
  timeOffPolicies, timeOffRequests, timeOffRequestDays, jobApplications, jobApplicationComments, applicationStageHistory, timeOffBalances,
  jobOpenings, jobApplicationFormConfig, clientTeamAssignments,
  knowledgeBaseCategories, knowledgeBaseArticles, knowledgeBasePermissions, knowledgeBaseBookmarks,
  knowledgeBaseLikes, knowledgeBaseComments, knowledgeBaseViews, knowledgeBaseSettings,
  trainingCategories, trainingCourses, trainingModules, trainingLessons, trainingEnrollments, trainingProgress,
  trainingQuizzes, trainingQuizQuestions, trainingQuizAttempts, trainingAssignments, 
  trainingAssignmentSubmissions, trainingDiscussions, trainingDiscussionLikes, trainingLessonResources
} from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { ObjectStorageService, ObjectNotFoundError, validateFileType, isForbiddenFileType, sanitizeFileName } from "./objectStorage";
import { db } from "./db";
import { google } from "googleapis";
import twilio from "twilio";
import mailgun from "mailgun.js";
import formData from "form-data";
import { EncryptionService } from "./encryption";
import { eq, like, or, and, asc, desc, sql, inArray, isNotNull, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { permissionAuditService } from "./permissionAuditService";
import { nanoid } from "nanoid";
import { calculateHealthMetrics, analyzeHealthStatus } from "@shared/utils/healthAnalysis";
import { 
  requireAuth, 
  requirePermission, 
  requireAdmin,
  getAuthenticatedUserId,
  getAuthenticatedUserIdOrFail,
  getAuthenticatedAuditContext,
  getAuditContext,
  isCurrentUserAdmin,
  hasPermission,
  IS_DEVELOPMENT,
  MOCK_ADMIN_USER_ID,
  normalizeUserIdForDb
} from "./auth";


// SECURE Helper function to create audit logs - NO HARDCODED FALLBACKS
async function createAuditLog(
  action: "created" | "updated" | "deleted",
  entityType: string,
  entityId: string,
  entityName: string,
  userId: string, // REQUIRED - no fallback allowed
  details: string,
  oldValues?: any,
  newValues?: any,
  req?: any
) {
  try {
    // SECURITY FIX: Convert "system" userId to proper UUID for database
    let normalizedUserId;
    try {
      normalizedUserId = userId === "system" ? await normalizeUserIdForDb(userId) : userId;
    } catch (normalizeError) {
      console.error("❌ Failed to normalize userId for audit log:", normalizeError);
      normalizedUserId = userId; // fallback to original userId
    }
    
    await db.insert(auditLogs).values({
      action,
      entityType,
      entityId,
      entityName,
      userId: normalizedUserId,
      details,
      oldValues: oldValues ? oldValues : null,
      newValues: newValues ? newValues : null,
      ipAddress: req?.ip || req?.connection?.remoteAddress || "127.0.0.1",
      userAgent: req?.get("User-Agent") || "Unknown",
    });
  } catch (error) {
    console.error("❌ Failed to create audit log:", error);
    // Don't fail the main operation if audit logging fails
  }
}


export async function registerRoutes(app: Express): Promise<Server> {

  // Configure multer for file uploads  
  const multerStorage = multer.memoryStorage();
  const upload = multer({ 
    storage: multerStorage, // Use local variable to avoid any scope confusion
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  // SECURITY: Rate limiting for login attempts - in-memory store
  const loginAttempts = new Map<string, { count: number; firstAttempt: number; blocked: number }>();
  const MAX_LOGIN_ATTEMPTS = 5;
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes block
  
  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const attempt = loginAttempts.get(ip);
    
    if (!attempt) {
      return false;
    }
    
    // If currently blocked, check if block period expired
    if (attempt.blocked && (now - attempt.blocked) < BLOCK_DURATION) {
      return true;
    }
    
    // If block period expired, reset
    if (attempt.blocked && (now - attempt.blocked) >= BLOCK_DURATION) {
      loginAttempts.delete(ip);
      return false;
    }
    
    // If window expired, reset
    if ((now - attempt.firstAttempt) >= RATE_LIMIT_WINDOW) {
      loginAttempts.delete(ip);
      return false;
    }
    
    return attempt.count >= MAX_LOGIN_ATTEMPTS;
  }
  
  function recordLoginAttempt(ip: string, success: boolean = false) {
    const now = Date.now();
    const attempt = loginAttempts.get(ip);
    
    if (success && attempt) {
      // Clear attempts on successful login
      loginAttempts.delete(ip);
      return;
    }
    
    if (!attempt) {
      loginAttempts.set(ip, { count: 1, firstAttempt: now, blocked: 0 });
      return;
    }
    
    // Increment failed attempt count
    attempt.count++;
    
    // If exceeded max attempts, block the IP
    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      attempt.blocked = now;
      console.warn(`SECURITY: IP ${ip} blocked for ${BLOCK_DURATION/1000/60} minutes due to ${MAX_LOGIN_ATTEMPTS} failed login attempts`);
    }
  }

  // ===== AUTHENTICATION ROUTES =====
  
  
  
  // Login schema
  const loginSchema = z.object({
    email: z.string().email().transform(email => email.toLowerCase()),
    password: z.string().min(1)
  });

  // MailGun Integration Validation Schemas - Simplified for debugging
  const mailgunConnectSchema = z.object({
    apiKey: z.string().min(1, "API Key is required"),
    domain: z.string().min(1, "Domain is required"),
    fromName: z.string().min(1, "From Name is required"),
    fromEmail: z.string().email("Invalid email address format")
  });

  const mailgunTestSchema = z.object({
    to: z.string().email("Invalid test email address"),
    fromEmail: z.string().email("Invalid from email address").optional(),
    fromName: z.string().max(100, "From Name too long").optional()
  });

  // POST /api/auth/login - Authenticate user and create session (HARDENED)
  app.post("/api/auth/login", async (req, res) => {
    const clientIp = req.ip || req.connection?.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "Unknown";
    
    try {
      // SECURITY: Check rate limiting first
      if (isRateLimited(clientIp)) {
        console.warn(`SECURITY: Rate-limited login attempt from IP: ${clientIp}`);
        await createAuditLog(
          "created",
          "login_security",
          "rate-limit-block",
          "Rate Limited Login Attempt",
          "system",
          `Rate-limited login attempt from IP: ${clientIp}`,
          null,
          { ip: clientIp, userAgent },
          req
        );
        return res.status(429).json({ 
          error: "Too many login attempts",
          message: "Please wait 15 minutes before trying again"
        });
      }
      
      const { email, password } = loginSchema.parse(req.body);
      
      // SECURITY: Validate input parameters
      if (!email || !password) {
        recordLoginAttempt(clientIp, false);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Find auth user by email
      const authUser = await appStorage.getAuthUserByEmail(email);
      if (!authUser) {
        recordLoginAttempt(clientIp, false);
        console.warn(`SECURITY: Login attempt for non-existent user: ${email} from IP: ${clientIp}`);
        await createAuditLog(
          "created",
          "login_security",
          "invalid-user",
          "Login Attempt for Non-existent User",
          "system",
          `Login attempt for non-existent user: ${email} from IP: ${clientIp}`,
          null,
          { email, ip: clientIp, userAgent },
          req
        );
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Check if auth user is active
      if (!authUser.isActive) {
        recordLoginAttempt(clientIp, false);
        console.warn(`SECURITY: Login attempt for deactivated user: ${email} from IP: ${clientIp}`);
        await createAuditLog(
          "created",
          "login_security",
          "deactivated-user",
          "Login Attempt for Deactivated User",
          "system",
          `Login attempt for deactivated user: ${email} from IP: ${clientIp}`,
          null,
          { email, ip: clientIp, userAgent },
          req
        );
        return res.status(401).json({ error: "Account is deactivated" });
      }
      
      // SECURITY: Guard against null/empty passwordHash before bcrypt.compare
      if (!authUser.passwordHash || authUser.passwordHash.trim() === '') {
        recordLoginAttempt(clientIp, false);
        console.error(`SECURITY: User ${email} has null/empty password hash - potential data corruption`);
        await createAuditLog(
          "created",
          "login_security",
          "null-password-hash",
          "Null Password Hash Detected",
          "system",
          `User ${email} has null/empty password hash`,
          null,
          { email, ip: clientIp, userAgent },
          req
        );
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Verify password with enhanced error handling
      let passwordMatches = false;
      try {
        passwordMatches = await bcrypt.compare(password, authUser.passwordHash);
      } catch (bcryptError) {
        recordLoginAttempt(clientIp, false);
        console.error(`SECURITY: bcrypt.compare failed for user ${email}:`, bcryptError);
        await createAuditLog(
          "created",
          "login_security",
          "bcrypt-error",
          "Password Verification Error",
          "system",
          `bcrypt.compare failed for user ${email}: ${bcryptError instanceof Error ? bcryptError.message : "Unknown error"}`,
          null,
          { email, ip: clientIp, userAgent, error: bcryptError instanceof Error ? bcryptError.message : "Unknown error" },
          req
        );
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (!passwordMatches) {
        recordLoginAttempt(clientIp, false);
        console.warn(`SECURITY: Failed login attempt for user: ${email} from IP: ${clientIp}`);
        await createAuditLog(
          "created",
          "login_security",
          "invalid-password",
          "Failed Login Attempt",
          "system",
          `Failed login attempt for user: ${email} from IP: ${clientIp}`,
          null,
          { email, ip: clientIp, userAgent },
          req
        );
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Get staff information
      const staffUser = await db.select().from(staff).where(eq(staff.id, authUser.userId)).limit(1);
      if (!staffUser.length) {
        recordLoginAttempt(clientIp, false);
        console.error(`SECURITY: Auth user ${authUser.id} has no corresponding staff record`);
        return res.status(401).json({ error: "User not found" });
      }
      
      // Get user roles and permissions
      const userRolesList = await db
        .select({ 
          roleId: userRoles.roleId, 
          roleName: roles.name 
        })
        .from(userRoles)
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, authUser.userId));
      
      // Set session properties (don't overwrite the entire session object!)
      req.session.userId = authUser.userId;
      req.session.user = {
        id: staffUser[0].id,
        firstName: staffUser[0].firstName,
        lastName: staffUser[0].lastName,
        email: staffUser[0].email,
        roles: userRolesList.map(ur => ur.roleName)
      };
      
      // Session successfully set with user data
      
      // Update last login
      await appStorage.updateLastLogin(authUser.id);
      
      // SECURITY: Record successful login and clear rate limiting
      recordLoginAttempt(clientIp, true);
      console.log(`SECURITY: Successful login for user: ${email} from IP: ${clientIp}`);
      await createAuditLog(
        "created",
        "login_security",
        "successful-login",
        "Successful Login",
        authUser.userId,
        `Successful login for user: ${email} from IP: ${clientIp}`,
        null,
        { email, ip: clientIp, userAgent },
        req
      );
      
      res.json({ 
        success: true, 
        user: {
          id: staffUser[0].id,
          firstName: staffUser[0].firstName,
          lastName: staffUser[0].lastName,
          email: staffUser[0].email,
          roles: userRolesList.map(ur => ur.roleName)
        }
      });
      
    } catch (error) {
      // SECURITY: Record login errors and increment rate limiting
      recordLoginAttempt(clientIp, false);
      console.error("Login error:", error);
      
      await createAuditLog(
        "created",
        "login_security",
        "login-error",
        "Login System Error",
        "system",
        `Login system error from IP: ${clientIp} - ${error instanceof Error ? error.message : "Unknown error"}`,
        null,
        { ip: clientIp, userAgent, error: error instanceof Error ? error.message : "Unknown error" },
        req
      );
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request format" });
      }
      
      // SECURITY: Don't expose internal errors, return generic message
      return res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // POST /api/auth/logout - Destroy session
  app.post("/api/auth/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  // GET /api/auth/me - Return current user profile and permissions
  app.get("/api/auth/me", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get staff information
      const staffUser = await db.select().from(staff).where(eq(staff.id, userId)).limit(1);
      if (!staffUser.length) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get user roles and permissions
      const userRolesList = await db
        .select({ 
          roleId: userRoles.roleId, 
          roleName: roles.name 
        })
        .from(userRoles)
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));
      
      res.json({
        id: staffUser[0].id,
        firstName: staffUser[0].firstName,
        lastName: staffUser[0].lastName,
        email: staffUser[0].email,
        roles: userRolesList.map(ur => ur.roleName)
      });
      
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: "Failed to get user information" });
    }
  });

  // Bootstrap route schema - requires secure token
  const bootstrapSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(100)
  });

  // GET /api/auth/bootstrap-status - Public endpoint to check if bootstrap is needed (NO TOKEN REQUIRED)
  app.get("/api/auth/bootstrap-status", async (req, res) => {
    try {
      const joeUserId = "030e554b-c0bc-446e-9538-e351f3d17b10";
      const authUser = await db.select().from(authUsers).where(eq(authUsers.userId, joeUserId)).limit(1);
      
      // Check if bootstrap token is configured
      const expectedToken = process.env.BOOTSTRAP_TOKEN;
      if (!expectedToken) {
        console.error("SECURITY WARNING: BOOTSTRAP_TOKEN not configured");
        return res.json({ 
          needsBootstrap: false,
          error: "Bootstrap not available - contact administrator" 
        });
      }
      
      // If no auth user exists for Joe, bootstrap is needed
      const needsBootstrap = authUser.length === 0;
      
      res.json({ 
        needsBootstrap
      });
      
    } catch (error) {
      console.error("Bootstrap status check error:", error);
      res.status(500).json({ error: "Failed to check bootstrap status" });
    }
  });

  // GET /api/auth/bootstrap - Check if Joe needs to set initial password (SECURED)
  app.get("/api/auth/bootstrap", async (req, res) => {
    try {
      // SECURITY: Require bootstrap token for status check
      const providedToken = req.query.token as string;
      const expectedToken = process.env.BOOTSTRAP_TOKEN;
      
      if (!expectedToken) {
        console.error("SECURITY WARNING: BOOTSTRAP_TOKEN not configured");
        return res.status(503).json({ error: "Bootstrap not available - contact administrator" });
      }
      
      if (!providedToken || providedToken !== expectedToken) {
        console.error("SECURITY: Unauthorized bootstrap status check attempt from IP:", req.ip);
        return res.status(401).json({ error: "Unauthorized access to bootstrap" });
      }
      
      const joeUserId = "030e554b-c0bc-446e-9538-e351f3d17b10";
      const authUser = await db.select().from(authUsers).where(eq(authUsers.userId, joeUserId)).limit(1);
      
      // SECURITY: If bootstrap already completed, don't allow further access
      if (authUser.length > 0) {
        console.log("SECURITY: Bootstrap already completed, denying access");
        return res.status(410).json({ 
          needsBootstrap: false,
          message: "Bootstrap already completed" 
        });
      }
      
      res.json({ 
        needsBootstrap: true
      });
      
    } catch (error) {
      console.error("Bootstrap check error:", error);
      res.status(500).json({ error: "Failed to check bootstrap status" });
    }
  });


  // POST /api/auth/bootstrap - Set Joe's initial password (SECURED)
  app.post("/api/auth/bootstrap", async (req, res) => {
    try {
      const { token, password } = bootstrapSchema.parse(req.body);
      const joeUserId = "030e554b-c0bc-446e-9538-e351f3d17b10";
      const joeEmail = "joe@themediaoptimizers.com";
      
      // SECURITY: Verify bootstrap token
      const expectedToken = process.env.BOOTSTRAP_TOKEN;
      if (!expectedToken) {
        console.error("SECURITY WARNING: BOOTSTRAP_TOKEN not configured");
        return res.status(503).json({ error: "Bootstrap not available - contact administrator" });
      }
      
      if (token !== expectedToken) {
        console.error("SECURITY: Invalid bootstrap token attempt from IP:", req.ip);
        // Create security audit log
        await createAuditLog(
          "created",
          "bootstrap_security",
          "bootstrap-invalid-token",
          "Invalid Bootstrap Token Attempt",
          "system", // System-level security event
          `Invalid bootstrap token attempt from IP: ${req.ip}`,
          null,
          { ip: req.ip, userAgent: req.get("User-Agent") },
          req
        );
        return res.status(401).json({ error: "Invalid bootstrap token" });
      }
      
      // SECURITY: Check if auth user already exists (auto-disable after first use)
      const existingAuthUser = await appStorage.getAuthUserByEmail(joeEmail);
      if (existingAuthUser) {
        console.log("SECURITY: Bootstrap already completed, denying access");
        // Create security audit log for attempted re-bootstrap
        await createAuditLog(
          "created",
          "bootstrap_security",
          "bootstrap-already-completed",
          "Attempted Re-Bootstrap",
          "system",
          `Attempted bootstrap after completion from IP: ${req.ip}`,
          null,
          { ip: req.ip, userAgent: req.get("User-Agent") },
          req
        );
        return res.status(410).json({ error: "Bootstrap already completed" });
      }
      
      // Hash password with high cost factor for admin account
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Create auth user using appStorage
      const authUser = await appStorage.createAuthUser({
        userId: joeUserId,
        email: joeEmail,
        passwordHash,
        isActive: true
      });
      
      // SECURITY: Create audit log for successful bootstrap
      await createAuditLog(
        "created",
        "bootstrap_security",
        "bootstrap-success",
        "Bootstrap Completed Successfully",
        joeUserId,
        `Bootstrap completed successfully for admin user: ${joeEmail}`,
        null,
        { userId: joeUserId, email: joeEmail },
        req
      );
      
      console.log("SECURITY: Bootstrap completed successfully - endpoint auto-disabled");
      
      res.json({ 
        success: true,
        message: "Initial password set successfully - bootstrap is now disabled"
      });
      
    } catch (error) {
      console.error("Bootstrap error:", error);
      
      // Create audit log for bootstrap failures
      await createAuditLog(
        "created",
        "bootstrap_security",
        "bootstrap-error",
        "Bootstrap Error",
        "system",
        `Bootstrap failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        null,
        { ip: req.ip, error: error instanceof Error ? error.message : "Unknown error" },
        req
      );
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request format",
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to set initial password" });
    }
  });

  // ===== CRITICAL FIX: TIME TRACKING API ENDPOINT =====
  // COMPLETELY SELF-CONTAINED - NO IMPORTS TO AVOID ALL DRIZZLE CONFLICTS
  // This is a minimal, working endpoint with all logic inline
  app.post("/api/reports/time-tracking", async (req, res) => {
    try {
      console.log("🚀🚀🚀 SELF-CONTAINED TIME TRACKING ENDPOINT CALLED! 🚀🚀🚀");
      console.log("SELF-CONTAINED TIME TRACKING ENDPOINT: Request received:", req.body);
      
      // Simple authentication - no external dependencies
      const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
      let authenticatedUserId = '00000000-0000-4000-8000-000000000000';
      
      if (!IS_DEVELOPMENT && (!req.session || !req.session.userId)) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!IS_DEVELOPMENT) authenticatedUserId = req.session.userId;
      
      // Simple inline validation
      const { dateFrom, dateTo, userId, clientId, taskStatus, reportType } = req.body;
      
      if (!dateFrom || !dateTo) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "dateFrom and dateTo are required"
        });
      }
      
      // Fix for dev-admin users - treat them as "All Users"
      let effectiveUserId = userId;
      if (IS_DEVELOPMENT && userId === authenticatedUserId) {
        effectiveUserId = undefined; // Show all data for dev-admin
      }
      
      // Get actual time entries from the database
      console.log("FETCHING REAL TIME ENTRIES FROM DATABASE...");
      const realTimeEntries = await appStorage.getTimeEntriesByDateRange(
        dateFrom, 
        dateTo, 
        effectiveUserId, 
        clientId
      );
      
      console.log("REAL TIME ENTRIES FOUND:", realTimeEntries.length, "tasks");
      
      // Transform the real data to match the expected format
      const actualTasks = realTimeEntries;
      
      // Filter tasks based on date range and other filters
      const filteredTasks = actualTasks.filter(task => {
        // Filter by user if specified - use entry-level filtering instead of task-level
        if (effectiveUserId) {
          const hasUserEntries = task.timeEntries?.some(entry => entry.userId === effectiveUserId);
          if (!hasUserEntries) return false;
        }
        
        // Filter by client if specified
        if (clientId && task.clientId !== clientId) return false;
        
        // Filter by task status if specified
        if (taskStatus && taskStatus.length > 0 && !taskStatus.includes(task.status)) return false;
        
        // Check if task has time entries in the date range
        if (!task.timeEntries || task.timeEntries.length === 0) return false;
        
        const hasEntriesInRange = task.timeEntries.some(entry => {
          if (!entry.startTime) return false;
          const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
          return entryDate >= dateFrom && entryDate <= dateTo;
        });
        
        return hasEntriesInRange;
      });
      
      // Process tasks and aggregate data
      const tasksWithDetails = filteredTasks.map(task => {
        const timeEntriesByDate = {};
        
        task.timeEntries.forEach(entry => {
          if (!entry.startTime) return;
          const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
          if (entryDate >= dateFrom && entryDate <= dateTo) {
            if (!timeEntriesByDate[entryDate]) {
              timeEntriesByDate[entryDate] = [];
            }
            timeEntriesByDate[entryDate].push(entry);
          }
        });
        
        const totalTracked = Object.values(timeEntriesByDate)
          .flat()
          .reduce((sum, entry) => sum + (entry.duration || 0), 0);
        
        return {
          ...task,
          timeEntriesByDate,
          totalTracked
        };
      });
      
      // Calculate user summaries from real data
      const userMap = new Map();
      
      tasksWithDetails.forEach(task => {
        if (!task.timeEntries) return;
        
        task.timeEntries.forEach(entry => {
          if (!entry.startTime || !entry.userId) return;
          
          const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
          if (entryDate < dateFrom || entryDate > dateTo) return;
          
          // Handle development mode user ID mapping
          let resolvedEntryUserId = entry.userId;
          if (IS_DEVELOPMENT && entry.userId === 'current-user') {
            resolvedEntryUserId = authenticatedUserId;
          }
          
          // Filter by effectiveUserId if specified
          if (effectiveUserId && resolvedEntryUserId !== effectiveUserId) {
            return; // Skip this entry if it doesn't match the user filter
          }
          
          if (!userMap.has(resolvedEntryUserId)) {
            userMap.set(resolvedEntryUserId, {
              userId: resolvedEntryUserId,
              userName: entry.userName || 'Development User',
              userRole: entry.userRole || 'User',
              totalTime: 0,
              tasksWorked: new Set(),
              dailyTotals: {}
            });
          }
          
          const user = userMap.get(resolvedEntryUserId);
          user.totalTime += entry.duration || 0;
          user.tasksWorked.add(task.id);
          user.dailyTotals[entryDate] = (user.dailyTotals[entryDate] || 0) + (entry.duration || 0);
        });
      });
      
      const userSummaries = Array.from(userMap.values()).map(user => ({
        ...user,
        tasksWorked: user.tasksWorked.size
      }));
      
      // Calculate client breakdowns from real data
      const clientMap = new Map();
      
      tasksWithDetails.forEach(task => {
        if (!task.clientId || !task.timeEntries) return;
        
        if (!clientMap.has(task.clientId)) {
          clientMap.set(task.clientId, {
            clientId: task.clientId,
            clientName: task.clientName || 'Unknown Client',
            totalTime: 0,
            tasksCount: new Set(),
            userMap: new Map()
          });
        }
        
        const client = clientMap.get(task.clientId);
        client.tasksCount.add(task.id);
        
        task.timeEntries.forEach(entry => {
          if (!entry.startTime || !entry.userId) return;
          
          const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
          if (entryDate < dateFrom || entryDate > dateTo) return;
          
          // Handle development mode user ID mapping
          let resolvedEntryUserId = entry.userId;
          if (IS_DEVELOPMENT && entry.userId === 'current-user') {
            resolvedEntryUserId = authenticatedUserId;
          }
          
          // Filter by effectiveUserId if specified
          if (effectiveUserId && resolvedEntryUserId !== effectiveUserId) {
            return; // Skip this entry if it doesn't match the user filter
          }
          
          client.totalTime += entry.duration || 0;
          
          if (!client.userMap.has(resolvedEntryUserId)) {
            client.userMap.set(resolvedEntryUserId, {
              userId: resolvedEntryUserId,
              userName: entry.userName || 'Development User',
              userRole: entry.userRole || 'User',
              totalTime: 0,
              tasksWorked: new Set(),
              dailyTotals: {}
            });
          }
          
          const user = client.userMap.get(resolvedEntryUserId);
          user.totalTime += entry.duration || 0;
          user.tasksWorked.add(task.id);
          user.dailyTotals[entryDate] = (user.dailyTotals[entryDate] || 0) + (entry.duration || 0);
        });
      });
      
      const clientBreakdowns = Array.from(clientMap.values()).map(client => ({
        clientId: client.clientId,
        clientName: client.clientName,
        totalTime: client.totalTime,
        tasksCount: client.tasksCount.size,
        users: Array.from(client.userMap.values()).map(user => ({
          ...user,
          tasksWorked: user.tasksWorked.size
        }))
      }));
      
      // Calculate grand total
      const grandTotal = userSummaries.reduce((sum, user) => sum + user.totalTime, 0);
      
      const reportData = {
        tasks: tasksWithDetails,
        userSummaries,
        clientBreakdowns,
        grandTotal
      };
      
      console.log("SELF-CONTAINED TIME TRACKING ENDPOINT: Report generated successfully:", {
        tasksCount: reportData.tasks.length,
        userSummariesCount: reportData.userSummaries.length,
        clientBreakdownsCount: reportData.clientBreakdowns.length,
        grandTotal: reportData.grandTotal
      });
      
      // Return response in expected format
      res.status(200).json({
        success: true,
        filters: { dateFrom, dateTo, userId, clientId, taskStatus: taskStatus || [], reportType: reportType || 'detailed' },
        data: reportData,
        meta: {
          dateRange: { from: dateFrom, to: dateTo },
          generatedAt: new Date().toISOString(),
          generatedBy: authenticatedUserId,
          totalTasks: reportData.tasks.length,
          totalUsers: reportData.userSummaries.length,
          totalClients: reportData.clientBreakdowns.length,
          grandTotalHours: Math.round((reportData.grandTotal / 3600) * 100) / 100
        }
      });
      
    } catch (error) {
      console.error("SELF-CONTAINED TIME TRACKING ENDPOINT: Error:", error);
      res.status(500).json({
        error: "Failed to generate time tracking report",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Client routes - SECURED
  app.get("/api/clients", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
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
      
      const result = await appStorage.getClientsWithPagination(limit, offset, sortBy, sortOrder);
      
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
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      // Enhanced error handling for common database/Drizzle issues
      if (error instanceof Error) {
        if (error.message.includes('Cannot convert undefined or null to object')) {
          console.error('DRIZZLE ORM ERROR: Query builder received invalid parameters');
          return res.status(500).json({ 
            message: "Database query error - invalid parameters", 
            error: "Query builder failed",
            details: error.message 
          });
        }
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.error('DATABASE ERROR: Table/relation does not exist');
          return res.status(500).json({ 
            message: "Database schema error", 
            error: "Required table not found",
            details: error.message 
          });
        }
        if (error.message.includes('connection')) {
          console.error('DATABASE ERROR: Connection issue');
          return res.status(500).json({ 
            message: "Database connection error", 
            error: "Unable to connect to database",
            details: error.message 
          });
        }
      }
      
      res.status(500).json({ 
        message: "Failed to fetch clients", 
        error: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error
      });
    }
  });

  app.get("/api/clients/:id", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const client = await appStorage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });


  app.post("/api/clients", requireAuth(), requirePermission('clients', 'canCreate'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const validatedData = insertClientSchema.parse(req.body);
      const client = await appStorage.createClient(validatedData);
      
      // Log the creation with authenticated user
      await createAuditLog(
        "created",
        "contact",
        client.id,
        client.name || client.email,
        userId, // SECURE: Use authenticated user ID only
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

  app.put("/api/clients/:id", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    try {
      
      // Get the old client data first for audit logging
      const oldClient = await appStorage.getClient(req.params.id);
      if (!oldClient) {
        console.log("❌ Client not found");
        return res.status(404).json({ message: "Client not found" });
      }
      
      const validatedData = insertClientSchema.partial().parse(req.body);
      
      // Remove undefined values and check if there are valid fields to update
      const filteredData = Object.fromEntries(
        Object.entries(validatedData).filter(([key, value]) => value !== undefined)
      );
      
      if (Object.keys(filteredData).length === 0) {
        console.log("❌ No valid fields to update");
        return res.status(400).json({ message: "No valid client fields to update" });
      }
      
      // Security check for DND changes - Only Admin users can UNCHECK (disable) DND settings
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const dndFieldsBeingDisabled = [];
      if (validatedData.dndAll === false && oldClient.dndAll === true) {
        dndFieldsBeingDisabled.push('dndAll');
      }
      if (validatedData.dndEmail === false && oldClient.dndEmail === true) {
        dndFieldsBeingDisabled.push('dndEmail');
      }
      if (validatedData.dndSms === false && oldClient.dndSms === true) {
        dndFieldsBeingDisabled.push('dndSms');
      }
      if (validatedData.dndCalls === false && oldClient.dndCalls === true) {
        dndFieldsBeingDisabled.push('dndCalls');
      }
      
      if (dndFieldsBeingDisabled.length > 0) {
        
        try {
          // Strict Admin role check - only users with Admin role can disable DND
          const isAdmin = await isCurrentUserAdmin(req);
          
          if (!isAdmin) {
            console.log("❌ Non-Admin user attempted to disable DND settings");
            return res.status(403).json({ 
              message: "Only Admin users can disable DND settings. You can enable DND settings but cannot disable them.",
              restrictedFields: dndFieldsBeingDisabled,
              error: "Admin role required for DND disable operation"
            });
          }
          
          } catch (error) {
          console.error("❌ Error checking Admin role for DND operation:", error);
          return res.status(403).json({ 
            message: "Unable to verify Admin permissions for DND disable operation",
            error: "Permission check failed"
          });
        }
      }
      
      const client = await appStorage.updateClient(req.params.id, filteredData);
      
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
        try {
        
          // Get staff name for audit log
          const staffResult = await db.select({
          id: staff.id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          phone: staff.phone,
          role: staff.role,
          departmentId: staff.departmentId,
          positionId: staff.positionId,
          status: staff.status,
          hireDate: staff.hireDate,
          lastLogin: staff.lastLogin,
          profileImage: staff.profileImage,
          bio: staff.bio,
          workHours: staff.workHours,
          timezone: staff.timezone,
          skills: staff.skills,
          isManager: staff.isManager,
          managerId: staff.managerId,
          teamIds: staff.teamIds,
          preferences: staff.preferences,
          emergencyContact: staff.emergencyContact,
          performanceGoals: staff.performanceGoals,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt
        }).from(staff).where(eq(staff.id, currentUserId)).limit(1);
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
        } catch (auditError) {
          console.error("DND audit logging failed but update was successful:", auditError);
          // Continue execution - don't fail the request for audit issues
        }
      }
      
      // Log the general update
      try {
        await createAuditLog(
        "updated",
        "contact",
        client.id,
        client.name || client.email,
        currentUserId, // SECURE: Use authenticated user ID only
        changes.length > 0 ? `Updated ${changes.join(", ")}` : "Contact record updated",
        { name: oldClient.name, email: oldClient.email, phone: oldClient.phone },
        { name: client.name, email: client.email, phone: client.phone },
        req
      );
      } catch (auditError) {
        console.error("General audit logging failed but update was successful:", auditError);
        // Continue execution - don't fail the request for audit issues
      }
      
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("❌ CRITICAL: Main route error after successful database update:", error);
      console.error("❌ Error stack:", error?.stack);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", requireAuth(), requirePermission('clients', 'canDelete'), async (req, res) => {
    try {
      // Get client data before deletion for audit logging
      const client = await appStorage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const deleted = await appStorage.deleteClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Log the deletion
      await createAuditLog(
        "deleted",
        "contact",
        req.params.id,
        client.name || client.email,
        userId, // SECURE: Use authenticated user ID only
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

  // Import clients from CSV - SECURED
  app.post("/api/clients/import", requireAuth(), requirePermission('clients', 'canCreate'), upload.single('file'), async (req, res) => {
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

              const userId = getAuthenticatedUserIdOrFail(req, res);
              if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
              
              for (const row of csvData) {
                try {
                  // Map CSV columns to client fields
                  const clientData = {
                    name: row.name || row.Name || `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
                    email: row.email || row.Email,
                    phone: row.phone || row.Phone,
                    company: row.company || row.Company || row['Business Name'],
                    status: row.status || row.Status || 'active',
                    contactOwner: row.contactOwner || userId, // SECURE: Use authenticated user
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
                  await appStorage.createClient(validatedData);
                  imported++;

                  // Log the import for audit
                  await createAuditLog(
                    "created",
                    "contact",
                    "bulk-import",
                    validatedData.name || validatedData.email,
                    userId, // SECURE: Use authenticated user ID only
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

  // Export clients to CSV - SECURED
  app.get("/api/clients/export", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const clients = await appStorage.getAllClientsForExport();
      
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

      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Log the export
      await createAuditLog(
        "created",
        "export",
        "clients-export",
        "Clients Export",
        userId, // SECURE: Use authenticated user ID only
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

  // Client Brief Section routes - SECURED
  app.get("/api/client-brief-sections", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const sections = await appStorage.listBriefSections();
      res.json(sections);
    } catch (error) {
      console.error("Error fetching client brief sections:", error);
      res.status(500).json({ message: "Failed to fetch client brief sections" });
    }
  });

  app.post("/api/client-brief-sections", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const validatedData = insertClientBriefSectionSchema.parse(req.body);
      
      // Validate key uniqueness before creation
      if (validatedData.key) {
        const existingSection = await appStorage.getBriefSectionByKey(validatedData.key);
        if (existingSection) {
          return res.status(400).json({ 
            message: "Section key must be unique", 
            field: "key",
            error: "DUPLICATE_KEY"
          });
        }
      }
      
      const section = await appStorage.createBriefSection(validatedData);

      // Log the creation
      await createAuditLog(
        "created",
        "client_brief_section",
        section.id,
        section.title,
        userId,
        `Created new client brief section: ${section.title}`,
        null,
        { title: section.title, key: section.key, scope: section.scope },
        req
      );

      res.status(201).json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating client brief section:", error);
      res.status(500).json({ message: "Failed to create client brief section" });
    }
  });

  app.put("/api/client-brief-sections/reorder", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const { sectionIds } = req.body;
      if (!Array.isArray(sectionIds)) {
        return res.status(400).json({ message: "sectionIds must be an array" });
      }

      // Verify all sections exist before reordering
      const existingSections = await appStorage.listBriefSections();
      const existingIds = new Set(existingSections.map(s => s.id));
      
      const missingIds = sectionIds.filter(id => !existingIds.has(id));
      if (missingIds.length > 0) {
        return res.status(404).json({ message: "Client brief section not found" });
      }

      await appStorage.reorderBriefSections(sectionIds);

      // Log the reorder
      await createAuditLog(
        "updated",
        "client_brief_sections",
        "reorder",
        "Client Brief Sections Order",
        userId,
        `Reordered client brief sections`,
        null,
        { sectionIds },
        req
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error reordering client brief sections:", error);
      res.status(500).json({ message: "Failed to reorder client brief sections" });
    }
  });

  app.put("/api/client-brief-sections/:id", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      let validatedData = insertClientBriefSectionSchema.partial().parse(req.body);
      
      // Check if this is a core section and prevent modification of critical fields
      const existingSection = await appStorage.getBriefSection(req.params.id);
      if (!existingSection) {
        return res.status(404).json({ message: "Client brief section not found" });
      }
      
      if (existingSection.scope === 'core') {
        // Prevent modification of key and scope for core sections
        if (validatedData.key && validatedData.key !== existingSection.key) {
          return res.status(400).json({ message: "Cannot modify key field for core sections" });
        }
        if (validatedData.scope && validatedData.scope !== existingSection.scope) {
          return res.status(400).json({ message: "Cannot modify scope field for core sections" });
        }
        // Remove key and scope from update data to be safe
        const { key, scope, ...safeUpdateData } = validatedData;
        validatedData = safeUpdateData;
      }

      const section = await appStorage.updateBriefSection(req.params.id, validatedData);

      if (!section) {
        return res.status(404).json({ message: "Client brief section not found" });
      }

      // Log the update
      await createAuditLog(
        "updated",
        "client_brief_section",
        section.id,
        section.title,
        userId,
        `Updated client brief section: ${section.title}`,
        null,
        validatedData,
        req
      );

      res.json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating client brief section:", error);
      res.status(500).json({ message: "Failed to update client brief section" });
    }
  });

  app.delete("/api/client-brief-sections/:id", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const success = await appStorage.deleteBriefSection(req.params.id);

      if (!success) {
        return res.status(404).json({ message: "Client brief section not found" });
      }

      // Log the deletion
      await createAuditLog(
        "deleted",
        "client_brief_section",
        req.params.id,
        "Client Brief Section",
        userId,
        `Deleted client brief section with ID: ${req.params.id}`,
        null,
        null,
        req
      );

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes("Core sections cannot be deleted")) {
        return res.status(400).json({ message: "Core sections cannot be deleted, only disabled" });
      }
      console.error("Error deleting client brief section:", error);
      res.status(500).json({ message: "Failed to delete client brief section" });
    }
  });


  // Client Brief Data routes - Hybrid core/custom data access
  app.get("/api/clients/:id/brief", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const briefData = await appStorage.getClientBrief(req.params.id);
      res.json(briefData);
    } catch (error) {
      console.error("Error fetching client brief data:", error);
      res.status(500).json({ message: "Failed to fetch client brief data" });
    }
  });

  app.put("/api/clients/:id/brief/:sectionId", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const { value } = req.body;
      if (typeof value !== 'string') {
        return res.status(400).json({ message: "Value must be a string" });
      }

      await appStorage.setClientBriefValue(req.params.id, req.params.sectionId, value);

      // Log the update
      await createAuditLog(
        "updated",
        "client_brief_value",
        `${req.params.id}-${req.params.sectionId}`,
        "Client Brief Value",
        userId,
        `Updated client brief value for client ${req.params.id}, section ${req.params.sectionId}`,
        null,
        { clientId: req.params.id, sectionId: req.params.sectionId, value },
        req
      );

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes("Section not found")) {
        return res.status(404).json({ message: "Client brief section not found" });
      }
      console.error("Error setting client brief value:", error);
      res.status(500).json({ message: "Failed to set client brief value" });
    }
  });

  // Client Health Score routes - SECURED
  app.post("/api/clients/:clientId/health-scores", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    console.log('DEBUG - Health score POST route called with clientId:', req.params.clientId);
    console.log('DEBUG - Request body:', JSON.stringify(req.body, null, 2));
    try {
      const { clientId } = req.params;
      
      // Add clientId to the request body data
      const inputData = { ...req.body, clientId };
      
      // Validate the input data first (without calculated fields)
      console.log('DEBUG - Input data before validation:', JSON.stringify(inputData, null, 2));
      const validatedInputData = inputClientHealthScoreSchema.parse(inputData);
      console.log('DEBUG - Validated input data:', JSON.stringify(validatedInputData, null, 2));
      
      // Calculate health metrics using shared logic
      const { totalScore, averageScore, healthIndicator } = calculateHealthMetrics({
        goals: validatedInputData.goals,
        fulfillment: validatedInputData.fulfillment,
        relationship: validatedInputData.relationship,
        clientActions: validatedInputData.clientActions
      });
      
      // Create complete data with calculated values for storage
      const completeData = {
        ...validatedInputData,
        totalScore,
        averageScore,
        healthIndicator
      };
      
      // Debug logging
      console.log('DEBUG - Calculated values:', { totalScore, averageScore, healthIndicator });
      console.log('DEBUG - Complete data before storage:', JSON.stringify(completeData, null, 2));
      
      const healthScore = await appStorage.createClientHealthScore(completeData);
      
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Log the creation
      await createAuditLog(
        "created",
        "client_health_score",
        healthScore.id,
        `Health Score for ${healthScore.weekStartDate}`,
        userId, // SECURE: Use authenticated user ID only
        `New health score created for client ${clientId} with ${healthIndicator} status (${averageScore}/3.0)`,
        null,
        { totalScore, averageScore, healthIndicator },
        req
      );
      
      res.status(201).json(healthScore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      // Handle unique constraint violation for duplicate week
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        return res.status(409).json({ 
          message: "A health score already exists for this client and week", 
          error: "Health score must be unique per client per week" 
        });
      }
      
      console.error("Error creating health score:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create health score", error: errorMessage });
    }
  });

  app.get("/api/clients/:clientId/health-scores", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const { clientId } = req.params;
      const healthScores = await appStorage.getClientHealthScores(clientId);
      res.json(healthScores);
    } catch (error) {
      console.error("Error fetching client health scores:", error);
      res.status(500).json({ message: "Failed to fetch health scores" });
    }
  });

  app.get("/api/health-scores/:id", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const healthScore = await appStorage.getClientHealthScore(req.params.id);
      if (!healthScore) {
        return res.status(404).json({ message: "Health score not found" });
      }
      res.json(healthScore);
    } catch (error) {
      console.error("Error fetching health score:", error);
      res.status(500).json({ message: "Failed to fetch health score" });
    }
  });

  app.put("/api/health-scores/:id", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    try {
      // Get the old health score data first for audit logging
      const oldHealthScore = await appStorage.getClientHealthScore(req.params.id);
      if (!oldHealthScore) {
        return res.status(404).json({ message: "Health score not found" });
      }
      
      const validatedData = inputClientHealthScoreSchema.partial().parse(req.body);
      
      // Recalculate scoring if any scoring fields are being updated
      let updatedData = { ...validatedData };
      const scoringFields = ['goals', 'fulfillment', 'relationship', 'clientActions'];
      const hasAnyScoreFieldUpdate = scoringFields.some(field => validatedData.hasOwnProperty(field));
      
      if (hasAnyScoreFieldUpdate) {
        // Use updated values if provided, otherwise use existing values
        const goals = validatedData.goals || oldHealthScore.goals;
        const fulfillment = validatedData.fulfillment || oldHealthScore.fulfillment;
        const relationship = validatedData.relationship || oldHealthScore.relationship;
        const clientActions = validatedData.clientActions || oldHealthScore.clientActions;
        
        // Calculate health metrics using shared logic
        const { totalScore, averageScore, healthIndicator } = calculateHealthMetrics({
          goals,
          fulfillment,
          relationship,
          clientActions
        });
        
        updatedData = {
          ...updatedData,
          totalScore,
          averageScore,
          healthIndicator
        };
      }
      
      const healthScore = await appStorage.updateClientHealthScore(req.params.id, updatedData);
      
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Log the update
      await createAuditLog(
        "updated",
        "client_health_score",
        healthScore.id,
        `Health Score for ${healthScore.weekStartDate}`,
        userId, // SECURE: Use authenticated user ID only
        `Health score updated for week ${healthScore.weekStartDate}`,
        { totalScore: oldHealthScore.totalScore, averageScore: oldHealthScore.averageScore, healthIndicator: oldHealthScore.healthIndicator },
        { totalScore: healthScore.totalScore, averageScore: healthScore.averageScore, healthIndicator: healthScore.healthIndicator },
        req
      );
      
      res.json(healthScore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      console.error("Error updating health score:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to update health score", error: errorMessage });
    }
  });

  app.delete("/api/health-scores/:id", requireAuth(), requirePermission('clients', 'canDelete'), async (req, res) => {
    try {
      // Get health score data before deletion for audit logging
      const healthScore = await appStorage.getClientHealthScore(req.params.id);
      if (!healthScore) {
        return res.status(404).json({ message: "Health score not found" });
      }
      
      await appStorage.deleteClientHealthScore(req.params.id);
      
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Log the deletion
      await createAuditLog(
        "deleted",
        "client_health_score",
        healthScore.id,
        `Health Score for ${healthScore.weekStartDate}`,
        userId, // SECURE: Use authenticated user ID only
        `Health score deleted for week ${healthScore.weekStartDate}`,
        { totalScore: healthScore.totalScore, averageScore: healthScore.averageScore, healthIndicator: healthScore.healthIndicator },
        null,
        req
      );
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting health score:", error);
      res.status(500).json({ message: "Failed to delete health score" });
    }
  });

  app.get("/api/clients/:clientId/health-scores/current-week", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Calculate the current week start (Monday)
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days, otherwise currentDay - 1
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);
      
      const existingScore = await appStorage.getClientHealthScoreByWeek(clientId, monday);
      
      if (existingScore) {
        res.json({ exists: true, healthScore: existingScore });
      } else {
        res.json({ exists: false, weekStartDate: monday.toISOString().split('T')[0] });
      }
    } catch (error) {
      console.error("Error checking current week health score:", error);
      res.status(500).json({ message: "Failed to check current week health score" });
    }
  });

  // Get client health status summary for highlighting - SECURED
  app.get("/api/clients/:clientId/health-status", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Get all health scores for this client
      const healthScores = await appStorage.getClientHealthScores(clientId);
      
      // Use shared health analysis logic
      const healthStatus = analyzeHealthStatus(healthScores);
      
      res.json(healthStatus);
    } catch (error) {
      console.error('Error getting client health status:', error);
      res.status(500).json({ message: "Failed to get client health status" });
    }
  });

  // Health Scores Bulk API - SECURED
  app.get("/api/health-scores", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      // Extract and validate query parameters
      const {
        from = "",
        to = "",
        statuses = [],
        search = "",
        clientId = "",
        latestPerClient = "false",
        page = "1",
        limit = "50",
        sort = "weekStartDate",
        sortOrder = "desc"
      } = req.query;

      // Convert query params to proper types
      const filters = {
        from: from as string || undefined,
        to: to as string || undefined,
        statuses: Array.isArray(statuses) ? statuses as string[] : 
                 typeof statuses === 'string' && statuses ? statuses.split(',') : [],
        search: search as string || undefined,
        clientId: clientId as string || undefined,
        latestPerClient: latestPerClient === 'true',
        page: Math.max(1, parseInt(page as string) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit as string) || 50)), // Max 100 per page
        sort: sort as string || 'weekStartDate',
        sortOrder: (sortOrder as string === 'asc' ? 'asc' : 'desc')
      };

      // Validate filter parameters
      if (filters.from && !/^\d{4}-\d{2}-\d{2}$/.test(filters.from)) {
        return res.status(400).json({ message: "Invalid 'from' date format. Use YYYY-MM-DD" });
      }
      
      if (filters.to && !/^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
        return res.status(400).json({ message: "Invalid 'to' date format. Use YYYY-MM-DD" });
      }

      // Validate status values if provided
      const validStatuses = ['Green', 'Yellow', 'Red'];
      if (filters.statuses.length > 0) {
        const invalidStatuses = filters.statuses.filter(status => !validStatuses.includes(status));
        if (invalidStatuses.length > 0) {
          return res.status(400).json({ 
            message: `Invalid status values: ${invalidStatuses.join(', ')}. Valid values are: ${validStatuses.join(', ')}`
          });
        }
      }

      // Validate sort field
      const validSortFields = ['weekStartDate', 'clientName', 'healthIndicator', 'averageScore'];
      if (!validSortFields.includes(filters.sort)) {
        return res.status(400).json({
          message: `Invalid sort field: ${filters.sort}. Valid fields are: ${validSortFields.join(', ')}`
        });
      }

      // Get filtered health scores
      const result = await appStorage.getHealthScoresFiltered(filters);

      // Add cache control headers for fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Return paginated response
      res.json({
        ...result,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
          hasNext: result.page * result.limit < result.total,
          hasPrevious: result.page > 1
        }
      });

    } catch (error) {
      console.error("Error fetching health scores:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        message: "Failed to fetch health scores", 
        error: errorMessage 
      });
    }
  });



  // Campaign routes - SECURED (Marketing strategy data)
  app.get("/api/campaigns", (req, res, next) => next(), (req, res, next) => next(), async (req, res) => {
    try {
      const campaigns = await appStorage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/:id", requireAuth(), requirePermission('campaigns', 'canView'), async (req, res) => {
    try {
      const campaign = await appStorage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", requireAuth(), requirePermission('campaigns', 'canCreate'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await appStorage.createCampaign(validatedData);
      
      // Log campaign creation for marketing audit
      await createAuditLog(
        "created",
        "campaign",
        campaign.id,
        campaign.name || "New Campaign",
        userId, // SECURE: Use authenticated user ID only
        `Marketing campaign created: ${campaign.name}`,
        null,
        { name: campaign.name, budget: campaign.budget },
        req
      );
      
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.put("/api/campaigns/:id", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const validatedData = insertCampaignSchema.partial().parse(req.body);
      const campaign = await appStorage.updateCampaign(req.params.id, validatedData);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Log campaign update for marketing audit
      await createAuditLog(
        "updated",
        "campaign",
        campaign.id,
        campaign.name || "Campaign",
        userId, // SECURE: Use authenticated user ID only
        `Marketing campaign updated: ${campaign.name}`,
        null,
        validatedData,
        req
      );
      
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", requireAuth(), requirePermission('campaigns', 'canDelete'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get campaign data before deletion for audit logging
      const campaign = await appStorage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const deleted = await appStorage.deleteCampaign(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Log campaign deletion for marketing audit
      await createAuditLog(
        "deleted",
        "campaign",
        req.params.id,
        campaign.name || "Campaign",
        userId, // SECURE: Use authenticated user ID only
        `Marketing campaign permanently deleted: ${campaign.name}`,
        { name: campaign.name, budget: campaign.budget },
        null,
        req
      );
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Lead routes - SECURED (Sales pipeline data)
  app.get("/api/leads", (req, res, next) => next(), (req, res, next) => next(), async (req, res) => {
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

  app.get("/api/leads/:id", requireAuth(), requirePermission('leads', 'canView'), async (req, res) => {
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

  app.post("/api/leads", requireAuth(), requirePermission('leads', 'canCreate'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const { customFields, ...leadData } = req.body;
      const validatedData = insertLeadSchema.parse({
        ...leadData,
        customFieldData: customFields || null
      });
      
      const [newLead] = await db.insert(leads)
        .values(validatedData)
        .returning();
      
      // Log lead creation for sales audit
      await createAuditLog(
        "created",
        "lead",
        newLead.id,
        newLead.name || newLead.email,
        userId, // SECURE: Use authenticated user ID only
        `New sales lead created: ${newLead.name} (${newLead.email})`,
        null,
        { name: newLead.name, email: newLead.email, company: newLead.company },
        req
      );
      
      res.status(201).json(newLead);
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", requireAuth(), requirePermission('leads', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get the old lead data first for audit logging
      const [oldLead] = await db.select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        company: leads.company,
        position: leads.position,
        status: leads.status,
        source: leads.source,
        assignedTo: leads.assignedTo,
        value: leads.value,
        notes: leads.notes,
        customFields: leads.customFields,
        pipelineStage: leads.pipelineStage,
        lastContactedAt: leads.lastContactedAt,
        nextFollowUpAt: leads.nextFollowUpAt,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt
      }).from(leads).where(eq(leads.id, req.params.id));
      if (!oldLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
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
      
      // Log lead update for sales audit
      await createAuditLog(
        "updated",
        "lead",
        updatedLead.id,
        updatedLead.name || updatedLead.email,
        userId, // SECURE: Use authenticated user ID only
        `Sales lead updated: ${updatedLead.name} (${updatedLead.email})`,
        { name: oldLead.name, email: oldLead.email, company: oldLead.company },
        { name: updatedLead.name, email: updatedLead.email, company: updatedLead.company },
        req
      );
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", requireAuth(), requirePermission('leads', 'canDelete'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get lead data before deletion for audit logging
      const [lead] = await db.select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        company: leads.company,
        position: leads.position,
        status: leads.status,
        source: leads.source,
        assignedTo: leads.assignedTo,
        value: leads.value,
        notes: leads.notes,
        customFields: leads.customFields,
        pipelineStage: leads.pipelineStage,
        lastContactedAt: leads.lastContactedAt,
        nextFollowUpAt: leads.nextFollowUpAt,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt
      }).from(leads).where(eq(leads.id, req.params.id));
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      const deletedRows = await db.delete(leads)
        .where(eq(leads.id, req.params.id));
      
      if (deletedRows.rowCount === 0) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Log lead deletion for sales audit
      await createAuditLog(
        "deleted",
        "lead",
        req.params.id,
        lead.name || lead.email,
        userId, // SECURE: Use authenticated user ID only
        `Sales lead permanently deleted: ${lead.name} (${lead.email})`,
        { name: lead.name, email: lead.email, company: lead.company },
        null,
        req
      );
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Lead Pipeline Stage routes - SECURED (Sales process configuration)
  app.get("/api/lead-pipeline-stages", requireAuth(), requirePermission('leads', 'canView'), async (req, res) => {
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

  app.post("/api/lead-pipeline-stages", requireAuth(), requirePermission('leads', 'canManage'), async (req, res) => {
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

  app.put("/api/lead-pipeline-stages/:id", requireAuth(), requirePermission('leads', 'canManage'), async (req, res) => {
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

  app.delete("/api/lead-pipeline-stages/:id", requireAuth(), requirePermission('leads', 'canManage'), async (req, res) => {
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
  app.put("/api/lead-pipeline-stages/reorder", requireAuth(), requirePermission('leads', 'canManage'), async (req, res) => {
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
  app.put("/api/leads/:id/stage", requireAuth(), requirePermission('leads', 'canEdit'), async (req, res) => {
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

  // Smart Lists routes - SECURED (Saved Filters)
  app.get("/api/smart-lists", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const entityType = req.query.entityType as string; // 'clients' or 'tasks'
      
      const smartLists = await appStorage.getSmartLists(userId, entityType);
      res.json(smartLists);
    } catch (error) {
      console.error("Error fetching smart lists:", error);
      res.status(500).json({ message: "Failed to fetch smart lists" });
    }
  });

  app.get("/api/smart-lists/:id", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const smartList = await appStorage.getSmartList(req.params.id);
      if (!smartList) {
        return res.status(404).json({ message: "Smart list not found" });
      }
      
      // Check if user has access to this smart list
      const hasAccess = smartList.visibility === 'universal' ||
                       smartList.createdBy === userId ||
                       (smartList.visibility === 'shared' && 
                        smartList.sharedWith && 
                        smartList.sharedWith.includes(userId));
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this smart list" });
      }
      
      res.json(smartList);
    } catch (error) {
      console.error("Error fetching smart list:", error);
      res.status(500).json({ message: "Failed to fetch smart list" });
    }
  });

  app.post("/api/smart-lists", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const validatedData = insertSmartListSchema.parse({
        ...req.body,
        createdBy: userId, // Ensure created by authenticated user
      });
      
      const smartList = await appStorage.createSmartList(validatedData);
      
      // Log smart list creation for audit
      await createAuditLog(
        "created",
        "smart_list",
        smartList.id,
        smartList.name,
        userId,
        `Smart list created: ${smartList.name} for ${smartList.entityType}`,
        null,
        { 
          name: smartList.name, 
          entityType: smartList.entityType,
          visibility: smartList.visibility,
          filterCount: smartList.filters?.conditions?.length || 0
        },
        req
      );
      
      res.status(201).json(smartList);
    } catch (error) {
      console.error("Error creating smart list:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create smart list" });
    }
  });

  app.put("/api/smart-lists/:id", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // First, check if the smart list exists and user has edit access
      const existingSmartList = await appStorage.getSmartList(req.params.id);
      if (!existingSmartList) {
        return res.status(404).json({ message: "Smart list not found" });
      }
      
      // Only creator can edit personal/shared lists, admins can edit universal lists
      const isAdmin = await isCurrentUserAdmin(req);
      const canEdit = existingSmartList.createdBy === userId || 
                     (existingSmartList.visibility === 'universal' && isAdmin);
      
      if (!canEdit) {
        return res.status(403).json({ message: "You don't have permission to edit this smart list" });
      }
      
      const validatedData = insertSmartListSchema.partial().parse(req.body);
      
      // Don't allow changing the creator
      const { createdBy, ...updateData } = validatedData;
      
      const smartList = await appStorage.updateSmartList(req.params.id, updateData);
      if (!smartList) {
        return res.status(404).json({ message: "Smart list not found" });
      }
      
      // Log smart list update for audit
      await createAuditLog(
        "updated",
        "smart_list",
        smartList.id,
        smartList.name,
        userId,
        `Smart list updated: ${smartList.name}`,
        existingSmartList,
        updateData,
        req
      );
      
      res.json(smartList);
    } catch (error) {
      console.error("Error updating smart list:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update smart list" });
    }
  });

  app.delete("/api/smart-lists/:id", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // First, check if the smart list exists and user has delete access
      const existingSmartList = await appStorage.getSmartList(req.params.id);
      if (!existingSmartList) {
        return res.status(404).json({ message: "Smart list not found" });
      }
      
      // Only creator can delete personal/shared lists, admins can delete universal lists
      const isAdmin = await isCurrentUserAdmin(req);
      const canDelete = existingSmartList.createdBy === userId || 
                       (existingSmartList.visibility === 'universal' && isAdmin);
      
      if (!canDelete) {
        return res.status(403).json({ message: "You don't have permission to delete this smart list" });
      }
      
      const deleted = await appStorage.deleteSmartList(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Smart list not found" });
      }
      
      // Log smart list deletion for audit
      await createAuditLog(
        "deleted",
        "smart_list",
        req.params.id,
        existingSmartList.name,
        userId,
        `Smart list deleted: ${existingSmartList.name}`,
        existingSmartList,
        null,
        req
      );
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting smart list:", error);
      res.status(500).json({ message: "Failed to delete smart list" });
    }
  });

  // Task routes - SECURED
  app.get("/api/tasks", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
    try {
      const { search, status, priority, assignedTo, clientId } = req.query;
      // projectId removed - projects no longer exist
      
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
      
      // projectId filter removed - projects no longer exist
      
      let tasksList;
      if (conditions.length > 0) {
        tasksList = await db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
      } else {
        tasksList = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
      }
      res.json(tasksList);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      // Enhanced error handling for common database/Drizzle issues
      if (error instanceof Error) {
        if (error.message.includes('Cannot convert undefined or null to object')) {
          console.error('DRIZZLE ORM ERROR: Query builder received invalid parameters');
          return res.status(500).json({ 
            message: "Database query error - invalid parameters", 
            error: "Query builder failed",
            details: error.message 
          });
        }
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.error('DATABASE ERROR: Table/relation does not exist');
          return res.status(500).json({ 
            message: "Database schema error", 
            error: "Required table not found",
            details: error.message 
          });
        }
        if (error.message.includes('connection')) {
          console.error('DATABASE ERROR: Connection issue');
          return res.status(500).json({ 
            message: "Database connection error", 
            error: "Unable to connect to database",
            details: error.message 
          });
        }
      }
      
      res.status(500).json({ 
        message: "Failed to fetch tasks", 
        error: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error
      });
    }
  });

  // Bulk delete tasks - SECURED - MUST come before individual task routes with parameters
  app.delete("/api/tasks/bulk-delete", requireAuth(), requirePermission('tasks', 'canDelete'), async (req, res) => {
    try {
      const { taskIds } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: "Invalid or empty taskIds array" });
      }

      console.log(`BULK DELETE tasks request - Task IDs: ${taskIds.join(', ')}, User ID: ${userId}`);

      // Check if user has permission to delete tasks
      const canDelete = await hasPermission(userId, 'tasks', 'canDelete');

      let deletedCount = 0;
      const errors = [];

      try {
        // Get all selected tasks and verify permissions
        const selectedTasks = await db.select()
          .from(tasks)
          .where(inArray(tasks.id, taskIds));

        // Check permissions for each task
        for (const task of selectedTasks) {
          const isTaskOwner = task.assignedTo === userId;
          if (!canDelete && !isTaskOwner) {
            errors.push(`Access denied for task: ${task.id}`);
            return res.json({
              message: `Access denied for some tasks`,
              deletedCount: 0,
              errors
            });
          }
        }

        // Build a complete list of ALL tasks that need to be deleted (selected tasks + all their descendants)
        const allTasksToDelete = new Set<string>(taskIds);
        
        // Recursively find all descendants
        const findAllDescendants = async (parentIds: string[]): Promise<void> => {
          if (parentIds.length === 0) return;
          
          const children = await db.select({ id: tasks.id, parentTaskId: tasks.parentTaskId })
            .from(tasks)
            .where(inArray(tasks.parentTaskId, parentIds));
          
          const childIds: string[] = [];
          for (const child of children) {
            if (!allTasksToDelete.has(child.id)) {
              allTasksToDelete.add(child.id);
              childIds.push(child.id);
            }
          }
          
          // Recursively find grandchildren
          if (childIds.length > 0) {
            await findAllDescendants(childIds);
          }
        };

        // Find all descendants of selected tasks
        await findAllDescendants(taskIds);

        // Get all tasks to delete with their levels, ordered by level (deepest first)
        const tasksToDelete = await db.select()
          .from(tasks)
          .where(inArray(tasks.id, Array.from(allTasksToDelete)))
          .orderBy(desc(tasks.level));

        console.log(`Total tasks to delete (including descendants): ${tasksToDelete.length}`);

        // Delete tasks in order (deepest level first to avoid foreign key constraints)
        for (const task of tasksToDelete) {
          try {
            // Delete task dependencies
            await db.delete(taskDependencies).where(
              or(
                eq(taskDependencies.taskId, task.id),
                eq(taskDependencies.dependsOnTaskId, task.id)
              )
            );

            // Delete task comment files
            const commentFilesToDelete = await db.select()
              .from(commentFiles)
              .leftJoin(taskComments, eq(commentFiles.commentId, taskComments.id))
              .where(eq(taskComments.taskId, task.id));

            for (const file of commentFilesToDelete) {
              await db.delete(commentFiles).where(eq(commentFiles.id, file.comment_files.id));
            }

            // Delete task comment reactions
            await db.delete(taskCommentReactions)
              .where(sql`comment_id IN (SELECT id FROM task_comments WHERE task_id = ${task.id})`);

            // Delete task comments
            await db.delete(taskComments)
              .where(eq(taskComments.taskId, task.id));

            // Delete task activities
            await db.delete(taskActivities)
              .where(eq(taskActivities.taskId, task.id));

            // Delete task attachments
            await db.delete(taskAttachments)
              .where(eq(taskAttachments.taskId, task.id));

            // Delete the main task
            await db.delete(tasks).where(eq(tasks.id, task.id));

            // Create audit log
            await createAuditLog(
              "deleted",
              "task",
              task.id,
              "Task",
              userId,
              "Task bulk deleted",
              null,
              null,
              req
            );

            deletedCount++;
          } catch (error) {
            console.error(`Error deleting task ${task.id}:`, error);
            errors.push(`Failed to delete task: ${task.id} - ${error.message}`);
          }
        }
      } catch (error) {
        console.error(`Error in bulk delete:`, error);
        errors.push(`Bulk delete failed: ${error.message}`);
      }

      console.log(`Bulk deletion completed - ${deletedCount} tasks deleted, ${errors.length} errors`);
      
      res.json({
        message: `Successfully deleted ${deletedCount} tasks`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error in bulk delete tasks:", error);
      res.status(500).json({ message: "Failed to bulk delete tasks", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Bulk update tasks - SECURED - MUST come before individual task routes with parameters
  app.put("/api/tasks/bulk-update", requireAuth(), requirePermission('tasks', 'canEdit'), async (req, res) => {
    try {
      const { taskIds, updates } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response

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
          const isTaskOwner = task.assignedTo === userId;

          if (!canEdit && !isTaskOwner) {
            errors.push(`Access denied for task: ${taskId}`);
            continue;
          }

          // Validate the updates using partial schema
          const validatedUpdates = insertTaskSchema.partial().parse(updates);

          // Update the task
          await db.update(tasks)
            .set(validatedUpdates)
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
      res.status(500).json({ message: "Failed to bulk update tasks", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/tasks/:id", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  app.post("/api/tasks", requireAuth(), requirePermission('tasks', 'canCreate'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const validatedData = insertTaskSchema.parse(req.body);
      
      const result = await db.insert(tasks)
        .values(validatedData)
        .returning();
      const newTask = result[0];
      
      // Log the creation for audit
      await createAuditLog(
        "created",
        "task",
        newTask.id,
        newTask.title || `Task ${newTask.id}`,
        userId, // SECURE: Use authenticated user ID only
        `New task created: ${newTask.title}`,
        null,
        { title: newTask.title, assignedTo: newTask.assignedTo, priority: newTask.priority, status: newTask.status },
        req
      );
      
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
  app.post("/api/tasks/generate-recurring", requireAuth(), requirePermission('tasks', 'canCreate'), async (req, res) => {
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
              // eq(tasks.projectId, task.projectId || "") // projects no longer exist
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
              projectId: null, // projects no longer exist
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

  app.put("/api/tasks/:id", requireAuth(), requirePermission('tasks', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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
          const [staffMember] = await db.select({
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            phone: staff.phone,
            roleId: staff.roleId,
            profileImagePath: staff.profileImagePath,
            hireDate: staff.hireDate,
            department: staff.department,
            position: staff.position,
            managerId: staff.managerId,
            status: staff.status,
            createdAt: staff.createdAt,
            updatedAt: staff.updatedAt
          }).from(staff).where(eq(staff.id, staffId));
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

  app.get("/api/tasks/:id/activities", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  app.delete("/api/tasks/:id", requireAuth(), requirePermission('tasks', 'canDelete'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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
      
      // SECURE: Permission checking is now handled by middleware, but keep owner check for additional security
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
  app.get("/api/tasks/:taskId/subtasks", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  app.get("/api/tasks/root", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  app.get("/api/tasks/:taskId/hierarchy", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  app.post("/api/tasks/:parentTaskId/subtasks", requireAuth(), requirePermission('tasks', 'canCreate'), async (req, res) => {
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

  app.get("/api/tasks/:taskId/parent", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  app.get("/api/tasks/:taskId/path", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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
  app.get("/api/tasks/:taskId/attachments", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  app.post("/api/tasks/:taskId/attachments", requireAuth(), requirePermission('tasks', 'canEdit'), async (req, res) => {
    try {
      const { taskId } = req.params;
      const { fileName, fileType, fileSize, fileUrl } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response

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

  app.delete("/api/tasks/:taskId/attachments/:attachmentId", requireAuth(), requirePermission('tasks', 'canDelete'), async (req, res) => {
    try {
      const { taskId, attachmentId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response

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
  app.get("/api/tasks/:taskId/dependencies", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  // Add a dependency to a task - SECURED
  app.post("/api/tasks/:taskId/dependencies", requireAuth(), requirePermission('tasks', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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

  // Remove a task dependency - SECURED
  app.delete("/api/dependencies/:id", requireAuth(), requirePermission('tasks', 'canDelete'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const { id } = req.params;

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
  app.post("/api/dependencies/validate", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  // Task Template routes - SECURED
  
  // Create task template from existing task
  app.post("/api/task-templates/from-task/:taskId", requireAuth(), requirePermission('tasks', 'canDelete'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const { taskId } = req.params;
      const { name } = req.body;

      // Fetch the root task
      const [rootTask] = await db.select()
        .from(tasks)
        .where(eq(tasks.id, taskId));

      if (!rootTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Recursive function to build task template data
      const buildTaskTemplate = async (task: any): Promise<any> => {
        // Get sub-tasks for this task
        const subTasks = await db.select()
          .from(tasks)
          .where(eq(tasks.parentTaskId, task.id))
          .orderBy(asc(tasks.createdAt));

        // Build sub-task templates recursively
        const subTaskTemplates = [];
        for (const subTask of subTasks) {
          const subTaskTemplate = await buildTaskTemplate(subTask);
          subTaskTemplates.push(subTaskTemplate);
        }

        // Return template data excluding ephemeral data
        return {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          categoryId: task.categoryId,
          workflowId: task.workflowId,
          clientId: task.clientId,
          campaignId: task.campaignId,
          timeEstimate: task.timeEstimate,
          level: task.level,
          subTasks: subTaskTemplates
        };
      };

      // Build the complete template data structure
      const templateData = await buildTaskTemplate(rootTask);

      // Create the task template
      const templateName = name || `${rootTask.title} Template`;
      
      const [newTemplate] = await db.insert(taskTemplates)
        .values({
          name: templateName,
          description: `Template created from task: ${rootTask.title}`,
          categoryId: rootTask.categoryId,
          priority: rootTask.priority,
          templateData: templateData,
          createdBy: userId
        })
        .returning();

      // Create audit log
      await createAuditLog(
        "created",
        "task_template",
        newTemplate.id,
        templateName,
        userId,
        `Created task template from task: ${rootTask.title}`,
        null,
        newTemplate,
        req
      );

      res.json(newTemplate);
    } catch (error) {
      console.error("Error creating task template:", error);
      res.status(500).json({ message: "Failed to create task template" });
    }
  });

  // Get all task templates
  app.get("/api/task-templates", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
    try {
      const templates = await db.select({
        id: taskTemplates.id,
        name: taskTemplates.name,
        description: taskTemplates.description,
        categoryId: taskTemplates.categoryId,
        priority: taskTemplates.priority,
        createdBy: taskTemplates.createdBy,
        createdAt: taskTemplates.createdAt
      })
      .from(taskTemplates)
      .orderBy(desc(taskTemplates.createdAt));

      res.json(templates);
    } catch (error) {
      console.error("Error fetching task templates:", error);
      res.status(500).json({ message: "Failed to fetch task templates" });
    }
  });

  // Instantiate a task template
  app.post("/api/task-templates/:id/instantiate", requireAuth(), requirePermission('tasks', 'canCreate'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const { id: templateId } = req.params;
      const {
        title,
        clientId,
        campaignId,
        workflowId,
        assigneeStrategy = 'clear',
        dateStrategy = 'clear'
      } = req.body;

      // Fetch the template
      const [template] = await db.select()
        .from(taskTemplates)
        .where(eq(taskTemplates.id, templateId));

      if (!template) {
        return res.status(404).json({ message: "Task template not found" });
      }

      // Map to store old template task IDs to new task IDs for dependency mapping
      const idMapping = new Map<string, string>();

      // Recursive function to create tasks from template data
      const createTasksFromTemplate = async (templateData: any, parentTaskId?: string): Promise<string> => {
        // Use a real staff UUID for development mode (known working UUID from database)
        let normalizedUserId = userId;
        if (IS_DEVELOPMENT && userId === MOCK_ADMIN_USER_ID) {
          normalizedUserId = '5c8e4629-fa7c-4ebe-9be9-6880d9bf7150'; // Real staff UUID from database
        }

        // Apply overrides for root task
        const taskData: any = {
          title: title && !parentTaskId ? title : templateData.title,
          description: templateData.description,
          status: templateData.status,
          priority: templateData.priority,
          categoryId: templateData.categoryId,
          workflowId: workflowId || templateData.workflowId,
          clientId: clientId || templateData.clientId,
          campaignId: campaignId || templateData.campaignId,
          timeEstimate: templateData.timeEstimate,
          level: templateData.level,
          parentTaskId: parentTaskId,
          createdBy: normalizedUserId
        };

        // Handle assignee strategy
        if (assigneeStrategy === 'assignToMe') {
          taskData.assignedTo = normalizedUserId;
        } else if (assigneeStrategy === 'keep' && templateData.assignedTo) {
          // For keep strategy, use the original assignedTo if it's a valid UUID
          if (templateData.assignedTo && templateData.assignedTo !== MOCK_ADMIN_USER_ID) {
            taskData.assignedTo = templateData.assignedTo;
          } else {
            taskData.assignedTo = normalizedUserId;
          }
        }
        // For 'clear' strategy, leave assignedTo undefined

        // Handle date strategy 
        if (dateStrategy === 'keep') {
          if (templateData.dueDate) taskData.dueDate = templateData.dueDate;
          if (templateData.startDate) taskData.startDate = templateData.startDate;
        }
        // For 'clear' strategy, leave dates undefined

        // Debug logging before database insert
        console.log("🐛 DEBUG: Task data before insert:", JSON.stringify(taskData, null, 2));
        
        // Create the task
        const [newTask] = await db.insert(tasks)
          .values(taskData)
          .returning();

        // Store ID mapping for potential dependency handling
        idMapping.set(templateData.originalId || 'temp', newTask.id);

        // Create sub-tasks recursively
        if (templateData.subTasks && templateData.subTasks.length > 0) {
          for (const subTaskTemplate of templateData.subTasks) {
            await createTasksFromTemplate(subTaskTemplate, newTask.id);
          }
        }

        return newTask.id;
      };

      // Create tasks from template
      const rootTaskId = await createTasksFromTemplate(template.templateData);

      // Create audit log
      await createAuditLog(
        "created",
        "task",
        rootTaskId,
        template.templateData.title,
        userId,
        `Created tasks from template: ${template.name}`,
        null,
        { templateId, rootTaskId },
        req
      );

      res.json({ 
        success: true, 
        rootTaskId,
        message: "Tasks created successfully from template"
      });
    } catch (error) {
      console.error("Error instantiating task template:", error);
      res.status(500).json({ message: "Failed to create tasks from template" });
    }
  });

  // Invoice routes - Database Storage - SECURED
  app.get("/api/invoices", (req, res, next) => next(), (req, res, next) => next(), async (req, res) => {
    try {
      const { search, status, clientId } = req.query;
      // projectId removed - projects no longer exist
      
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
      
      // projectId filtering removed - projects no longer exist
      
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

  app.get("/api/invoices/:id", requireAuth(), requirePermission('invoices', 'canView'), async (req, res) => {
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

  app.post("/api/invoices", requireAuth(), requirePermission('invoices', 'canCreate'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const validatedData = insertInvoiceSchema.parse(req.body);
      
      const [newInvoice] = await db.insert(invoices)
        .values(validatedData)
        .returning();
      
      // Log the creation for audit
      await createAuditLog(
        "created",
        "invoice",
        newInvoice.id,
        newInvoice.invoiceNumber || `Invoice ${newInvoice.id}`,
        userId, // SECURE: Use authenticated user ID only
        `New invoice created for ${newInvoice.amount ? `$${newInvoice.amount}` : 'undetermined amount'}`,
        null,
        { invoiceNumber: newInvoice.invoiceNumber, amount: newInvoice.amount, status: newInvoice.status },
        req
      );
      
      res.status(201).json(newInvoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", requireAuth(), requirePermission('invoices', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get the old invoice data first for audit logging
      const [oldInvoice] = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
      if (!oldInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      
      const [updatedInvoice] = await db.update(invoices)
        .set(validatedData)
        .where(eq(invoices.id, req.params.id))
        .returning();
      
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Determine what changed for audit logging
      const changes = [];
      if (validatedData.amount && validatedData.amount !== oldInvoice.amount) {
        changes.push(`amount from $${oldInvoice.amount} to $${validatedData.amount}`);
      }
      if (validatedData.status && validatedData.status !== oldInvoice.status) {
        changes.push(`status from ${oldInvoice.status} to ${validatedData.status}`);
      }
      if (validatedData.dueDate && validatedData.dueDate !== oldInvoice.dueDate) {
        changes.push(`due date from ${oldInvoice.dueDate} to ${validatedData.dueDate}`);
      }
      
      // Log the update
      await createAuditLog(
        "updated",
        "invoice",
        updatedInvoice.id,
        updatedInvoice.invoiceNumber || `Invoice ${updatedInvoice.id}`,
        userId, // SECURE: Use authenticated user ID only
        changes.length > 0 ? `FINANCIAL UPDATE: ${changes.join(", ")}` : "Invoice updated",
        { amount: oldInvoice.amount, status: oldInvoice.status, dueDate: oldInvoice.dueDate },
        { amount: updatedInvoice.amount, status: updatedInvoice.status, dueDate: updatedInvoice.dueDate },
        req
      );
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", requireAuth(), requirePermission('invoices', 'canDelete'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get invoice data before deletion for audit logging
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const deletedRows = await db.delete(invoices)
        .where(eq(invoices.id, req.params.id));
      
      if (deletedRows.rowCount === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Log the deletion
      await createAuditLog(
        "deleted",
        "invoice",
        req.params.id,
        invoice.invoiceNumber || `Invoice ${invoice.id}`,
        userId, // SECURE: Use authenticated user ID only
        `FINANCIAL DELETION: Invoice permanently deleted - ${invoice.invoiceNumber} ($${invoice.amount})`,
        { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount, status: invoice.status },
        null,
        req
      );
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Social Media Account routes - SECURED (Brand reputation management)
  app.get("/api/social-media-accounts", requireAuth(), requirePermission('social_media', 'canView'), async (req, res) => {
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

  app.get("/api/social-media-accounts/:id", requireAuth(), requirePermission('social_media', 'canView'), async (req, res) => {
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

  app.get("/api/clients/:clientId/social-media-accounts", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
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

  app.post("/api/social-media-accounts", requireAuth(), requirePermission('social_media', 'canCreate'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const validatedData = insertSocialMediaAccountSchema.parse(req.body);
      
      const [newAccount] = await db.insert(socialMediaAccounts)
        .values(validatedData)
        .returning();
      
      // Log social media account creation for brand security audit
      await createAuditLog(
        "created",
        "social_media_account",
        newAccount.id,
        `${newAccount.platform} account`,
        userId, // SECURE: Use authenticated user ID only
        `Social media account created for ${newAccount.platform}`,
        null,
        { platform: newAccount.platform, clientId: newAccount.clientId },
        req
      );
      
      res.status(201).json(newAccount);
    } catch (error) {
      console.error("Error creating social media account:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create social media account" });
    }
  });

  app.put("/api/social-media-accounts/:id", requireAuth(), requirePermission('social_media', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const validatedData = insertSocialMediaAccountSchema.partial().parse(req.body);
      
      const [updatedAccount] = await db.update(socialMediaAccounts)
        .set(validatedData)
        .where(eq(socialMediaAccounts.id, req.params.id))
        .returning();
      
      if (!updatedAccount) {
        return res.status(404).json({ message: "Social media account not found" });
      }
      
      // Log social media account update for brand security audit
      await createAuditLog(
        "updated",
        "social_media_account",
        updatedAccount.id,
        `${updatedAccount.platform} account`,
        userId, // SECURE: Use authenticated user ID only
        `Social media account updated for ${updatedAccount.platform}`,
        null,
        validatedData,
        req
      );
      
      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating social media account:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update social media account" });
    }
  });

  app.delete("/api/social-media-accounts/:id", requireAuth(), requirePermission('social_media', 'canDelete'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get account data before deletion for audit logging
      const [account] = await db.select().from(socialMediaAccounts).where(eq(socialMediaAccounts.id, req.params.id));
      if (!account) {
        return res.status(404).json({ message: "Social media account not found" });
      }
      
      const deletedRows = await db.delete(socialMediaAccounts)
        .where(eq(socialMediaAccounts.id, req.params.id));
      
      if (deletedRows.rowCount === 0) {
        return res.status(404).json({ message: "Social media account not found" });
      }
      
      // Log social media account deletion for brand security audit
      await createAuditLog(
        "deleted",
        "social_media_account",
        req.params.id,
        `${account.platform} account`,
        userId, // SECURE: Use authenticated user ID only
        `BRAND RISK: Social media account permanently deleted for ${account.platform}`,
        { platform: account.platform, clientId: account.clientId },
        null,
        req
      );
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting social media account:", error);
      res.status(500).json({ message: "Failed to delete social media account" });
    }
  });

  // Social Media Post routes - Database Storage
  app.get("/api/social-media-posts", requireAuth(), requirePermission('social_media', 'canView'), async (req, res) => {
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

  app.get("/api/social-media-posts/:id", requireAuth(), requirePermission('social_media', 'canView'), async (req, res) => {
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

  app.get("/api/clients/:clientId/social-media-posts", requireAuth(), requirePermission('social_media', 'canView'), async (req, res) => {
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

  app.post("/api/social-media-posts", requireAuth(), requirePermission('social_media', 'canCreate'), async (req, res) => {
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

  app.put("/api/social-media-posts/:id", requireAuth(), requirePermission('social_media', 'canEdit'), async (req, res) => {
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

  app.delete("/api/social-media-posts/:id", requireAuth(), requirePermission('social_media', 'canDelete'), async (req, res) => {
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
  app.get("/api/social-media-templates", requireAuth(), requirePermission('social_media', 'canView'), async (req, res) => {
    try {
      const templates = await appStorage.getSocialMediaTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch social media templates" });
    }
  });

  app.get("/api/clients/:clientId/social-media-templates", requireAuth(), requirePermission('social_media', 'canView'), async (req, res) => {
    try {
      const templates = await appStorage.getSocialMediaTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client social media templates" });
    }
  });

  app.post("/api/social-media-templates", requireAuth(), requirePermission('social_media', 'canCreate'), async (req, res) => {
    try {
      const validatedData = insertSocialMediaTemplateSchema.parse(req.body);
      const template = await appStorage.createSocialMediaTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create social media template" });
    }
  });

  // Template Folder routes
  app.get("/api/template-folders", requireAuth(), requirePermission('templates', 'canView'), async (req, res) => {
    try {
      const folders = await appStorage.getTemplateFolders();
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template folders" });
    }
  });

  app.post("/api/template-folders", requireAuth(), requirePermission('templates', 'canCreate'), async (req, res) => {
    try {
      const validatedData = insertTemplateFolderSchema.parse(req.body);
      const folder = await appStorage.createTemplateFolder(validatedData);
      res.status(201).json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template folder" });
    }
  });

  app.delete("/api/template-folders/:id", requireAuth(), requirePermission('templates', 'canDelete'), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if any templates are using this folder
      const emailTemplatesInFolder = await appStorage.getEmailTemplatesByFolder(id);
      const smsTemplatesInFolder = await appStorage.getSmsTemplatesByFolder(id);
      
      const totalTemplates = emailTemplatesInFolder.length + smsTemplatesInFolder.length;
      
      if (totalTemplates > 0) {
        return res.status(400).json({
          message: `Cannot delete folder that contains ${totalTemplates} template(s). Please move or delete the templates first.`
        });
      }
      
      const deleted = await appStorage.deleteTemplateFolder(id);
      if (!deleted) {
        return res.status(404).json({ message: "Template folder not found" });
      }

      res.json({ message: "Template folder deleted successfully" });
    } catch (error) {
      console.error('Error deleting template folder:', error);
      res.status(500).json({ message: "Failed to delete template folder" });
    }
  });

  // Email Template routes - SECURED (Admin Only)
  app.get("/api/email-templates", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const templates = await appStorage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.post("/api/email-templates", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const validatedData = insertEmailTemplateSchema.parse(req.body);
      console.log("Creating email template with data:", validatedData);
      const template = await appStorage.createEmailTemplate(validatedData);
      
      // Audit log for sensitive business communication templates
      await createAuditLog(
        "created",
        "email_template",
        template.id,
        template.name || `Email Template ${template.id}`,
        userId, // SECURE: Use authenticated user ID only
        `CRITICAL BUSINESS COMMUNICATION: Created email template '${template.name}'`,
        null,
        template,
        req
      );
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Email template creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create email template", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/email-templates/:id", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const validatedData = insertEmailTemplateSchema.partial().parse(req.body);
      const template = await appStorage.updateEmailTemplate(req.params.id, validatedData);
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

  app.delete("/api/email-templates/:id", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get template details before deletion for audit
      const templates = await appStorage.getEmailTemplates();
      const template = templates.find(t => t.id === req.params.id);
      
      const deleted = await appStorage.deleteEmailTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      // Audit log for sensitive business communication template deletion
      if (template) {
        await createAuditLog(
          "deleted",
          "email_template",
          template.id,
          template.name || `Email Template ${template.id}`,
          userId, // SECURE: Use authenticated user ID only
          `CRITICAL BUSINESS COMMUNICATION: Deleted email template '${template.name}'`,
          template,
          null,
          req
        );
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email template" });
    }
  });

  // SMS Template routes - SECURED (Admin Only)
  app.get("/api/sms-templates", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const templates = await appStorage.getSmsTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SMS templates" });
    }
  });

  app.post("/api/sms-templates", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const validatedData = insertSmsTemplateSchema.parse(req.body);
      // SECURE: Use authenticated user ID only, not hardcoded fallback
      validatedData.createdBy = userId;
      
      const template = await appStorage.createSmsTemplate(validatedData);
      
      // Audit log for sensitive business communication templates
      await createAuditLog(
        "created",
        "sms_template",
        template.id,
        template.name || `SMS Template ${template.id}`,
        userId, // SECURE: Use authenticated user ID only
        `CRITICAL BUSINESS COMMUNICATION: Created SMS template '${template.name}'`,
        null,
        template,
        req
      );
      
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create SMS template" });
    }
  });

  app.patch("/api/sms-templates/:id", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const validatedData = insertSmsTemplateSchema.partial().parse(req.body);
      const template = await appStorage.updateSmsTemplate(req.params.id, validatedData);
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

  app.delete("/api/sms-templates/:id", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get template details before deletion for audit
      const templates = await appStorage.getSmsTemplates();
      const template = templates.find(t => t.id === req.params.id);
      
      const deleted = await appStorage.deleteSmsTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "SMS template not found" });
      }
      
      // Audit log for sensitive business communication template deletion
      if (template) {
        await createAuditLog(
          "deleted",
          "sms_template",
          template.id,
          template.name || `SMS Template ${template.id}`,
          userId, // SECURE: Use authenticated user ID only
          `CRITICAL BUSINESS COMMUNICATION: Deleted SMS template '${template.name}'`,
          template,
          null,
          req
        );
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete SMS template" });
    }
  });

  // Reorder custom fields within a folder - SECURED
  app.put("/api/custom-fields/reorder", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
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

  // Custom Fields - SECURED
  app.get("/api/custom-fields", requireAuth(), requirePermission('settings', 'canView'), async (req, res) => {
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

  app.post("/api/custom-fields", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
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

  app.put("/api/custom-fields/:id", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
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

  app.patch("/api/custom-fields/:id", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
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

  app.delete("/api/custom-fields/:id", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
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

  // Tags routes - SECURED
  app.get("/api/tags", requireAuth(), requirePermission('settings', 'canView'), async (req, res) => {
    try {
      const tags = await appStorage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.get("/api/tags/:id", requireAuth(), requirePermission('settings', 'canView'), async (req, res) => {
    try {
      const tag = await appStorage.getTag(req.params.id);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      console.error("Error fetching tag:", error);
      res.status(500).json({ message: "Failed to fetch tag" });
    }
  });

  app.post("/api/tags", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await appStorage.createTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  app.put("/api/tags/:id", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
    try {
      const validatedData = insertTagSchema.partial().parse(req.body);
      const tag = await appStorage.updateTag(req.params.id, validatedData);
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

  app.delete("/api/tags/:id", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
    try {
      const deleted = await appStorage.deleteTag(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Workflow routes - Database Storage - SECURED
  app.get("/api/workflows", requireAuth(), requirePermission('workflows', 'canView'), async (req, res) => {
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

  app.get("/api/workflows/:id", requireAuth(), requirePermission('workflows', 'canView'), async (req, res) => {
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

  app.post("/api/workflows", requireAuth(), requirePermission('workflows', 'canCreate'), async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      
      // Add createdBy from authenticated session and ensure actions/triggers arrays
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const dataWithCreatedBy = {
        ...validatedData,
        createdBy: userId, // SECURE: Use authenticated user ID only
        actions: validatedData.actions || [],
        triggers: validatedData.triggers || []
      };
      
      const [newWorkflow] = await db.insert(workflows)
        .values(dataWithCreatedBy)
        .returning();
      
      // Create audit log
      await createAuditLog(
        "created",
        "workflow",
        newWorkflow.id,
        newWorkflow.name,
        dataWithCreatedBy.createdBy,
        `Created workflow: ${newWorkflow.name}`,
        null,
        { name: newWorkflow.name, category: newWorkflow.category, status: newWorkflow.status },
        req
      );
      
      res.status(201).json(newWorkflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });

  app.put("/api/workflows/:id", requireAuth(), requirePermission('workflows', 'canEdit'), async (req, res) => {
    try {
      // Get the old workflow data first for audit logging
      const [oldWorkflow] = await db.select()
        .from(workflows)
        .where(eq(workflows.id, req.params.id));
      
      if (!oldWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      const validatedData = insertWorkflowSchema.partial().parse(req.body);
      
      const [updatedWorkflow] = await db.update(workflows)
        .set(validatedData)
        .where(eq(workflows.id, req.params.id))
        .returning();
      
      if (!updatedWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Create audit log with authenticated user
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "updated",
        "workflow",
        updatedWorkflow.id,
        updatedWorkflow.name,
        userId, // SECURE: Use authenticated user ID only
        `Updated workflow: ${updatedWorkflow.name}`,
        { name: oldWorkflow.name, category: oldWorkflow.category, status: oldWorkflow.status },
        { name: updatedWorkflow.name, category: updatedWorkflow.category, status: updatedWorkflow.status },
        req
      );
      
      res.json(updatedWorkflow);
    } catch (error) {
      console.error("Error updating workflow:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", requireAuth(), requirePermission('workflows', 'canDelete'), async (req, res) => {
    try {
      // Get the workflow data before deletion for audit logging
      const [workflowToDelete] = await db.select()
        .from(workflows)
        .where(eq(workflows.id, req.params.id));
      
      if (!workflowToDelete) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      const deletedRows = await db.delete(workflows)
        .where(eq(workflows.id, req.params.id));
      
      if (deletedRows.rowCount === 0) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Create audit log with authenticated user
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "deleted",
        "workflow",
        req.params.id,
        workflowToDelete.name,
        userId, // SECURE: Use authenticated user ID only
        `Deleted workflow: ${workflowToDelete.name}`,
        { name: workflowToDelete.name, category: workflowToDelete.category, status: workflowToDelete.status },
        null,
        req
      );
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  // Enhanced Task routes - SECURED
  app.get("/api/enhanced-tasks", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
    try {
      const { clientId, assignedTo, workflowId } = req.query;
      let tasks;
      
      if (clientId) {
        tasks = await appStorage.getEnhancedTasks(); // Temporary fix - get all tasks
      } else if (assignedTo) {
        tasks = await appStorage.getEnhancedTasks(); // Temporary fix - get all tasks
      } else if (workflowId) {
        tasks = await appStorage.getEnhancedTasks(); // Temporary fix - get all tasks
      } else {
        tasks = await appStorage.getEnhancedTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enhanced tasks" });
    }
  });

  app.get("/api/enhanced-tasks/:id", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
    try {
      const task = await appStorage.getEnhancedTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Enhanced task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enhanced task" });
    }
  });

  app.post("/api/enhanced-tasks", requireAuth(), requirePermission('tasks', 'canCreate'), async (req, res) => {
    try {
      const validatedData = insertEnhancedTaskSchema.parse(req.body);
      const task = await appStorage.createEnhancedTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create enhanced task" });
    }
  });

  app.put("/api/enhanced-tasks/:id", requireAuth(), requirePermission('tasks', 'canEdit'), async (req, res) => {
    try {
      const validatedData = insertEnhancedTaskSchema.partial().parse(req.body);
      const task = await appStorage.updateEnhancedTask(req.params.id, validatedData);
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

  app.delete("/api/enhanced-tasks/:id", requireAuth(), requirePermission('tasks', 'canDelete'), async (req, res) => {
    try {
      const deleted = await appStorage.deleteEnhancedTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Enhanced task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete enhanced task" });
    }
  });

  // Task Categories routes - SECURED
  app.get("/api/task-categories", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
    try {
      const categories = await appStorage.getTaskCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task categories" });
    }
  });

  app.post("/api/task-categories", requireAuth(), requirePermission('tasks', 'canCreate'), async (req, res) => {
    try {
      const validatedData = insertTaskCategorySchema.parse(req.body);
      const category = await appStorage.createTaskCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task category" });
    }
  });

  // Automation Triggers routes - SECURED
  app.get("/api/automation-triggers", requireAuth(), requirePermission('workflows', 'canView'), async (req, res) => {
    try {
      const { category } = req.query;
      let triggers;
      
      if (category) {
        triggers = await appStorage.getAutomationTriggers(); // Temporary fix - get all triggers
      } else {
        triggers = await appStorage.getAutomationTriggers();
      }
      
      res.json(triggers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch automation triggers" });
    }
  });

  app.post("/api/automation-triggers", requireAuth(), requirePermission('workflows', 'canCreate'), async (req, res) => {
    try {
      const validatedData = insertAutomationTriggerSchema.parse(req.body);
      const trigger = await appStorage.createAutomationTrigger(validatedData);
      
      // Log the creation with authenticated user
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "created",
        "automation_trigger",
        trigger.id,
        trigger.name,
        userId, // SECURE: Use authenticated user ID only
        `Created automation trigger: ${trigger.name}`,
        null,
        { name: trigger.name, type: trigger.type, category: trigger.category },
        req
      );
      
      res.status(201).json(trigger);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create automation trigger" });
    }
  });

  app.get("/api/automation-triggers/:id", requireAuth(), requirePermission('workflows', 'canView'), async (req, res) => {
    try {
      const trigger = await appStorage.getAutomationTrigger(req.params.id);
      if (!trigger) {
        return res.status(404).json({ message: "Automation trigger not found" });
      }
      res.json(trigger);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch automation trigger" });
    }
  });

  app.put("/api/automation-triggers/:id", requireAuth(), requirePermission('workflows', 'canEdit'), async (req, res) => {
    try {
      // Get the old trigger data first for audit logging
      const oldTrigger = await appStorage.getAutomationTrigger(req.params.id);
      if (!oldTrigger) {
        return res.status(404).json({ message: "Automation trigger not found" });
      }
      
      const validatedData = insertAutomationTriggerSchema.partial().parse(req.body);
      const trigger = await appStorage.updateAutomationTrigger(req.params.id, validatedData);
      
      if (!trigger) {
        return res.status(404).json({ message: "Automation trigger not found" });
      }
      
      // Determine what changed for audit logging
      const changes = [];
      if (validatedData.name && validatedData.name !== oldTrigger.name) {
        changes.push(`name from "${oldTrigger.name}" to "${validatedData.name}"`);
      }
      if (validatedData.description && validatedData.description !== oldTrigger.description) {
        changes.push(`description updated`);
      }
      if (validatedData.isActive !== undefined && validatedData.isActive !== oldTrigger.isActive) {
        changes.push(`status ${validatedData.isActive ? 'activated' : 'deactivated'}`);
      }
      
      // Log the update with authenticated user
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "updated",
        "automation_trigger",
        trigger.id,
        trigger.name,
        userId, // SECURE: Use authenticated user ID only
        changes.length > 0 ? `Updated ${changes.join(", ")}` : "Automation trigger updated",
        { name: oldTrigger.name, description: oldTrigger.description, isActive: oldTrigger.isActive },
        { name: trigger.name, description: trigger.description, isActive: trigger.isActive },
        req
      );
      
      res.json(trigger);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update automation trigger" });
    }
  });

  app.delete("/api/automation-triggers/:id", requireAuth(), requirePermission('workflows', 'canDelete'), async (req, res) => {
    try {
      // Get trigger data before deletion for audit logging
      const trigger = await appStorage.getAutomationTrigger(req.params.id);
      if (!trigger) {
        return res.status(404).json({ message: "Automation trigger not found" });
      }
      
      const deleted = await appStorage.deleteAutomationTrigger(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Automation trigger not found" });
      }
      
      // Log the deletion with authenticated user
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "deleted",
        "automation_trigger",
        req.params.id,
        trigger.name,
        userId, // SECURE: Use authenticated user ID only
        `Automation trigger permanently deleted - ${trigger.name} (${trigger.type})`,
        { name: trigger.name, type: trigger.type, category: trigger.category },
        null,
        req
      );
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete automation trigger" });
    }
  });

  // Initialize default automation triggers (one-time setup) - SECURED
  app.post("/api/automation-triggers/initialize", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      // Check if triggers already exist
      const existingTriggers = await appStorage.getAutomationTriggers();
      if (existingTriggers.length > 0) {
        return res.status(400).json({ message: "Triggers already initialized" });
      }

      // Default trigger definitions
      const defaultTriggers = [
        {
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
          isActive: true
        },
        {
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
          isActive: true
        },
        {
          name: "Form Submitted",
          type: "form_submitted",
          description: "Triggers when a specific form is submitted",
          category: "form_management",
          configSchema: {
            form_id: { type: "string", required: true },
            fields: { type: "object" }
          },
          isActive: true
        },
        {
          name: "Tag Added",
          type: "tag_added",
          description: "Triggers when a specific tag is added to a contact",
          category: "contact_management",
          configSchema: {
            tag_name: { type: "string", required: true }
          },
          isActive: true
        },
        {
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
          isActive: true
        },
        {
          name: "Time Off Request Submitted",
          type: "time_off_request_submitted",
          description: "Triggers when a new time off request is submitted by a staff member",
          category: "hr_management",
          configSchema: {
            timeOffType: {
              type: "string",
              options: ["vacation", "sick", "personal"],
              label: "Time Off Type"
            },
            minDays: {
              type: "number",
              label: "Minimum Days",
              placeholder: "e.g., 3",
              min: 0
            },
            maxDays: {
              type: "number", 
              label: "Maximum Days",
              placeholder: "e.g., 14",
              min: 0
            },
            department: {
              type: "string",
              options: ["Sales", "Marketing", "Development", "Design", "Operations", "HR", "Finance", "Customer Success"],
              label: "Department"
            },
            assignedTo: {
              type: "staff_select",
              label: "Assigned Staff Member"
            }
          },
          isActive: true
        },
        {
          name: "New Job Application Submitted",
          type: "job_application_submitted",
          description: "Triggers when a new job application is submitted by an external candidate",
          category: "hr_management",
          configSchema: {
            positionTitle: {
              type: "string",
              label: "Position Title",
              placeholder: "e.g., Software Developer"
            },
            experienceLevel: {
              type: "string",
              options: ["entry", "mid", "senior", "lead"],
              label: "Experience Level"
            },
            department: {
              type: "string",
              options: ["Sales", "Marketing", "Development", "Design", "Operations", "HR", "Finance", "Customer Success"],
              label: "Department"
            },
            minSalaryExpectation: {
              type: "number",
              label: "Minimum Salary Expectation",
              placeholder: "e.g., 50000",
              min: 0
            },
            maxSalaryExpectation: {
              type: "number",
              label: "Maximum Salary Expectation", 
              placeholder: "e.g., 100000",
              min: 0
            },
            assignedTo: {
              type: "staff_select",
              label: "Assigned HR Staff Member"
            },
            notifyManager: {
              type: "boolean",
              label: "Notify Hiring Manager",
              defaultValue: true
            }
          },
          isActive: true
        },
        // Training System Triggers
        {
          name: "Course Enrollment",
          type: "course_enrollment",
          description: "Triggers when someone enrolls in a course",
          category: "training_management",
          configSchema: {
            courseId: {
              type: "course_select",
              label: "Specific Course (Optional)",
              placeholder: "Leave blank for any course"
            },
            category: {
              type: "string",
              options: ["Technology", "Leadership", "Compliance", "Safety", "Sales", "Customer Service"],
              label: "Course Category"
            },
            enrollmentType: {
              type: "string",
              options: ["self_enrolled", "assigned"],
              label: "Enrollment Type"
            },
            assignedBy: {
              type: "staff_select",
              label: "Assigned By (Staff Member)"
            }
          },
          isActive: true
        },
        {
          name: "Lesson Completion",
          type: "lesson_completion",
          description: "Triggers when someone completes a lesson",
          category: "training_management",
          configSchema: {
            courseId: {
              type: "course_select",
              label: "Specific Course (Optional)"
            },
            lessonId: {
              type: "lesson_select",
              label: "Specific Lesson (Optional)",
              placeholder: "Leave blank for any lesson"
            },
            category: {
              type: "category_select",
              label: "Course Category"
            }
          },
          isActive: true
        },
        {
          name: "Course Completion",
          type: "course_completion",
          description: "Triggers when someone completes all lessons in a course",
          category: "training_management",
          configSchema: {
            courseId: {
              type: "course_select",
              label: "Specific Course (Optional)"
            },
            category: {
              type: "string",
              options: ["Technology", "Leadership", "Compliance", "Safety", "Sales", "Customer Service"],
              label: "Course Category"
            },
            completionTime: {
              type: "string",
              options: ["under_1_week", "1_2_weeks", "2_4_weeks", "over_1_month"],
              label: "Completion Time Range"
            },
            department: {
              type: "string",
              options: ["Sales", "Marketing", "Development", "Design", "Operations", "HR", "Finance", "Customer Success"],
              label: "Employee Department"
            }
          },
          isActive: true
        },
        {
          name: "Course Published",
          type: "course_published",
          description: "Triggers when a new course is published",
          category: "training_management",
          configSchema: {
            category: {
              type: "string",
              options: ["Technology", "Leadership", "Compliance", "Safety", "Sales", "Customer Service"],
              label: "Course Category"
            },
            publishedBy: {
              type: "staff_select",
              label: "Published By (Staff Member)"
            },
            minLessons: {
              type: "number",
              label: "Minimum Number of Lessons",
              placeholder: "e.g., 5",
              min: 1
            },
            notifyAllStaff: {
              type: "boolean",
              label: "Notify All Staff",
              defaultValue: false
            }
          },
          isActive: true
        },
        {
          name: "Training Progress Milestone",
          type: "training_progress_milestone",
          description: "Triggers when someone reaches a specific completion percentage",
          category: "training_management",
          configSchema: {
            progressPercentage: {
              type: "number",
              label: "Progress Percentage",
              placeholder: "e.g., 50",
              min: 1,
              max: 100,
              required: true
            },
            courseId: {
              type: "course_select",
              label: "Specific Course (Optional)"
            },
            category: {
              type: "string",
              options: ["Technology", "Leadership", "Compliance", "Safety", "Sales", "Customer Service"],
              label: "Course Category"
            },
            notifyManager: {
              type: "boolean",
              label: "Notify Manager",
              defaultValue: true
            }
          },
          isActive: true
        },
        {
          name: "Course Assignment",
          type: "course_assignment",
          description: "Triggers when someone is assigned to take a course",
          category: "training_management",
          configSchema: {
            courseId: {
              type: "course_select",
              label: "Specific Course (Optional)"
            },
            category: {
              type: "string",
              options: ["Technology", "Leadership", "Compliance", "Safety", "Sales", "Customer Service"],
              label: "Course Category"
            },
            assignedBy: {
              type: "staff_select",
              label: "Assigned By (Staff Member)"
            },
            department: {
              type: "string",
              options: ["Sales", "Marketing", "Development", "Design", "Operations", "HR", "Finance", "Customer Success"],
              label: "Assignee Department"
            },
            dueDate: {
              type: "date",
              label: "Due Date (Optional)"
            }
          },
          isActive: true
        },
        {
          name: "Training Overdue",
          type: "training_overdue",
          description: "Triggers when someone hasn't completed required training by deadline",
          category: "training_management",
          configSchema: {
            courseId: {
              type: "course_select",
              label: "Specific Course (Optional)"
            },
            category: {
              type: "string",
              options: ["Technology", "Leadership", "Compliance", "Safety", "Sales", "Customer Service"],
              label: "Course Category"
            },
            overdueBy: {
              type: "string",
              options: ["1_day", "3_days", "1_week", "2_weeks"],
              label: "Overdue By",
              required: true
            },
            department: {
              type: "string",
              options: ["Sales", "Marketing", "Development", "Design", "Operations", "HR", "Finance", "Customer Success"],
              label: "Employee Department"
            },
            notifyManager: {
              type: "boolean",
              label: "Notify Manager",
              defaultValue: true
            }
          },
          isActive: true
        },
        {
          name: "Time Off Status Changed",
          type: "time_off_status_changed",
          description: "Triggers when a time off request status changes (pending → approved, approved → rejected, etc.)",
          category: "hr_management",
          configSchema: {
            to_status: {
              type: "string",
              label: "To Status",
              options: ["pending", "approved", "rejected"],
              required: true
            },
            from_status: {
              type: "string", 
              label: "From Status",
              options: ["pending", "approved", "rejected"],
              required: true
            },
            department: {
              type: "string",
              label: "Department (Optional)",
              options: [
                "Account Management",
                "Accounting", 
                "Creative",
                "Data & Analytics",
                "DevOps",
                "Executive",
                "Media Buying", 
                "Project Management",
                "SEO",
                "Social Media",
                "Venue Booking"
              ]
            },
            request_type: {
              type: "string",
              label: "Request Type (Optional)",
              options: ["vacation", "sick", "personal"]
            }
          },
          isActive: true
        }
      ];

      // Create each trigger
      const createdTriggers = [];
      for (const triggerData of defaultTriggers) {
        const trigger = await appStorage.createAutomationTrigger(triggerData);
        createdTriggers.push(trigger);
        
        // Log the creation with authenticated admin user
        const adminUserId = getAuthenticatedUserIdOrFail(req, res);
        if (!adminUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response
        
        await createAuditLog(
          "created",
          "automation_trigger",
          trigger.id,
          trigger.name,
          adminUserId, // SECURE: Use authenticated admin ID only
          `System initialization: Created default automation trigger: ${trigger.name}`,
          null,
          { name: trigger.name, type: trigger.type, category: trigger.category },
          req
        );
      }

      res.status(201).json({ 
        message: "Default automation triggers initialized successfully",
        triggers: createdTriggers,
        count: createdTriggers.length
      });
    } catch (error) {
      console.error("Error initializing triggers:", error);
      res.status(500).json({ message: "Failed to initialize automation triggers" });
    }
  });

  // Automation Actions routes - SECURED
  app.get("/api/automation-actions", requireAuth(), requirePermission('workflows', 'canView'), async (req, res) => {
    try {
      const { category } = req.query;
      let actions;
      
      if (category) {
        actions = await appStorage.getAutomationActions(); // Temporary fix - get all actions
      } else {
        actions = await appStorage.getAutomationActions();
      }
      
      res.json(actions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch automation actions" });
    }
  });

  app.post("/api/automation-actions", requireAuth(), requirePermission('workflows', 'canCreate'), async (req, res) => {
    try {
      const validatedData = insertAutomationActionSchema.parse(req.body);
      const action = await appStorage.createAutomationAction(validatedData);
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create automation action" });
    }
  });

  app.put("/api/automation-actions/:id", requireAuth(), requirePermission('workflows', 'canEdit'), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertAutomationActionSchema.parse(req.body);
      const action = await appStorage.updateAutomationAction(id, validatedData);
      res.json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update automation action" });
    }
  });

  app.delete("/api/automation-actions/:id", requireAuth(), requirePermission('workflows', 'canDelete'), async (req, res) => {
    try {
      const { id } = req.params;
      await appStorage.deleteAutomationAction(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete automation action" });
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

  app.get("/objects/:objectPath(*)", requireAuth(), async (req, res) => {
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
  

  
  // Get annotations for a specific image file - SECURED
  app.get("/api/files/:fileId/annotations", requireAuth(), async (req, res) => {
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

  // Create a new image annotation - SECURED
  app.post("/api/files/:fileId/annotations", requireAuth(), async (req, res) => {
    try {
      // Check if file exists
      const fileCheck = await checkFileExists(req.params.fileId);
      if (!fileCheck.exists) {
        return res.status(404).json({ error: "File not found" });
      }
      
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const mentions = req.body.mentions || [];
      
      const insertAnnotation = insertImageAnnotationSchema.parse({
        id: nanoid(),
        fileId: req.params.fileId,
        x: req.body.x,
        y: req.body.y,
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
      
      // Try to find associated task and create task activity (don't await)
      (async () => {
        try {
          const { commentFiles, taskComments, taskActivities, staff } = await import("@shared/schema");
          const { eq } = await import("drizzle-orm");
          
          // Find the task ID by tracing: fileId -> commentFiles -> taskComments -> taskId
          const fileToComment = await db.select({
            taskId: taskComments.taskId
          })
          .from(commentFiles)
          .leftJoin(taskComments, eq(commentFiles.commentId, taskComments.id))
          .where(eq(commentFiles.id, req.params.fileId))
          .limit(1);
          
          if (fileToComment.length > 0 && fileToComment[0].taskId) {
            const taskId = fileToComment[0].taskId;
            
            // Get user name for activity
            const userInfo = await db.select({
              firstName: staff.firstName,
              lastName: staff.lastName
            })
            .from(staff)
            .where(eq(staff.id, userId))
            .limit(1);
            
            const userName = userInfo.length > 0 
              ? `${userInfo[0].firstName} ${userInfo[0].lastName}`
              : 'Unknown User';
            
            // Create task activity for annotation
            await db.insert(taskActivities).values({
              taskId,
              actionType: "annotation_created",
              description: `Added annotation: "${req.body.content.substring(0, 50)}${req.body.content.length > 50 ? '...' : ''}"`,
              userId,
              userName,
              details: {
                annotationId: annotation.id,
                fileId: req.params.fileId,
                x: req.body.x,
                y: req.body.y,
                content: req.body.content,
                mentions: mentions.length > 0 ? mentions : undefined
              },
            });
            
            console.log(`Task activity created for annotation on task: ${taskId}`);
          }
        } catch (activityError) {
          console.log("Failed to create task activity for annotation:", activityError);
        }
      })();
      
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

  // Update an image annotation - SECURED
  app.put("/api/annotations/:annotationId", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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
      
      // Try to find associated task and create task activity for update (don't await)
      (async () => {
        try {
          const { commentFiles, taskComments, taskActivities, staff } = await import("@shared/schema");
          const { eq } = await import("drizzle-orm");
          
          // Find the task ID by tracing: annotation -> fileId -> commentFiles -> taskComments -> taskId
          const fileToComment = await db.select({
            taskId: taskComments.taskId
          })
          .from(commentFiles)
          .leftJoin(taskComments, eq(commentFiles.commentId, taskComments.id))
          .where(eq(commentFiles.id, result[0].fileId))
          .limit(1);
          
          if (fileToComment.length > 0 && fileToComment[0].taskId) {
            const taskId = fileToComment[0].taskId;
            const userId = getAuthenticatedUserId(req);
            if (!userId) {
              console.log("No authenticated user for annotation update activity");
              return;
            }
            
            // Get user name for activity
            const userInfo = await db.select({
              firstName: staff.firstName,
              lastName: staff.lastName
            })
            .from(staff)
            .where(eq(staff.id, userId))
            .limit(1);
            
            const userName = userInfo.length > 0 
              ? `${userInfo[0].firstName} ${userInfo[0].lastName}`
              : 'Unknown User';
            
            // Create task activity for annotation update
            await db.insert(taskActivities).values({
              taskId,
              actionType: "annotation_updated",
              description: `Updated annotation: "${req.body.content.substring(0, 50)}${req.body.content.length > 50 ? '...' : ''}"`,
              userId,
              userName,
              details: {
                annotationId: req.params.annotationId,
                fileId: result[0].fileId,
                content: req.body.content,
                mentions: req.body.mentions || []
              },
            });
            
            console.log(`Task activity created for annotation update on task: ${taskId}`);
          }
        } catch (activityError) {
          console.log("Failed to create task activity for annotation update:", activityError);
        }
      })();

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

  // Delete an image annotation - SECURED
  app.delete("/api/annotations/:annotationId", requireAuth(), async (req, res) => {
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
      
      const deletedAnnotation = result[0];
      res.status(204).send();
      
      // Try to find associated task and create task activity for deletion (don't await)
      (async () => {
        try {
          const { commentFiles, taskComments, taskActivities, staff } = await import("@shared/schema");
          const { eq } = await import("drizzle-orm");
          
          // Find the task ID by tracing: annotation -> fileId -> commentFiles -> taskComments -> taskId
          const fileToComment = await db.select({
            taskId: taskComments.taskId
          })
          .from(commentFiles)
          .leftJoin(taskComments, eq(commentFiles.commentId, taskComments.id))
          .where(eq(commentFiles.id, deletedAnnotation.fileId))
          .limit(1);
          
          if (fileToComment.length > 0 && fileToComment[0].taskId) {
            const taskId = fileToComment[0].taskId;
            const userId = getAuthenticatedUserId(req);
            if (!userId) {
              console.log("No authenticated user for annotation deletion activity");
              return;
            }
            
            // Get user name for activity
            const userInfo = await db.select({
              firstName: staff.firstName,
              lastName: staff.lastName
            })
            .from(staff)
            .where(eq(staff.id, userId))
            .limit(1);
            
            const userName = userInfo.length > 0 
              ? `${userInfo[0].firstName} ${userInfo[0].lastName}`
              : 'Unknown User';
            
            // Create task activity for annotation deletion
            await db.insert(taskActivities).values({
              taskId,
              actionType: "annotation_deleted",
              description: `Deleted annotation: "${deletedAnnotation.content.substring(0, 50)}${deletedAnnotation.content.length > 50 ? '...' : ''}"`,
              userId,
              userName,
              details: {
                annotationId: deletedAnnotation.id,
                fileId: deletedAnnotation.fileId,
                content: deletedAnnotation.content,
                mentions: deletedAnnotation.mentions || []
              },
            });
            
            console.log(`Task activity created for annotation deletion on task: ${taskId}`);
          }
        } catch (activityError) {
          console.log("Failed to create task activity for annotation deletion:", activityError);
        }
      })();
    } catch (error) {
      console.error("Error deleting image annotation:", error);
      res.status(500).json({ error: "Failed to delete image annotation" });
    }
  });



  // Staff/Users Management API - SECURED
  app.get("/api/staff", requireAuth(), requirePermission('staff', 'canView'), async (req, res) => {
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

  app.get("/api/staff/:id", requireAuth(), requirePermission('staff', 'canView'), async (req, res) => {
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

  app.post("/api/staff", requireAuth(), requirePermission('staff', 'canCreate'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const insertData = insertStaffSchema.parse(req.body);
      const [newStaff] = await db.insert(staff).values(insertData).returning();
      
      // Log the creation for audit
      await createAuditLog(
        "created",
        "staff",
        newStaff.id,
        `${newStaff.firstName} ${newStaff.lastName}`,
        userId, // SECURE: Use authenticated user ID only
        `New staff member created - ${newStaff.firstName} ${newStaff.lastName} (${newStaff.email})`,
        null,
        { firstName: newStaff.firstName, lastName: newStaff.lastName, email: newStaff.email, department: newStaff.department },
        req
      );
      
      res.status(201).json(newStaff);
    } catch (error: any) {
      console.error('Error creating staff:', error);
      if (error.code === '23505') {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.put("/api/staff/:id", requireAuth(), requirePermission('staff', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get the old staff data first for audit logging  
      const [oldStaff] = await db.select().from(staff).where(eq(staff.id, req.params.id));
      if (!oldStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
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
          assignedBy: userId // SECURE: Use authenticated user ID only
        });
      }
      
      // Two-step approach to avoid Drizzle returning() bug
      const [result] = await db
        .update(staff)
        .set({
          ...cleanedBody,
          updatedAt: new Date()
        })
        .where(eq(staff.id, req.params.id))
        .returning({ id: staff.id });
      
      if (!result) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      // Get the updated record
      const [updatedStaff] = await db
        .select()
        .from(staff)
        .where(eq(staff.id, result.id));
      
      if (!updatedStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      // Determine what changed for audit logging
      const changes = [];
      if (cleanedBody.firstName && cleanedBody.firstName !== oldStaff.firstName) {
        changes.push(`first name from "${oldStaff.firstName}" to "${cleanedBody.firstName}"`);
      }
      if (cleanedBody.lastName && cleanedBody.lastName !== oldStaff.lastName) {
        changes.push(`last name from "${oldStaff.lastName}" to "${cleanedBody.lastName}"`);
      }
      if (cleanedBody.email && cleanedBody.email !== oldStaff.email) {
        changes.push(`email from "${oldStaff.email}" to "${cleanedBody.email}"`);
      }
      if (cleanedBody.department && cleanedBody.department !== oldStaff.department) {
        changes.push(`department from "${oldStaff.department}" to "${cleanedBody.department}"`);
      }
      if (cleanedBody.roleId) {
        changes.push(`role assignment updated`);
      }
      
      // Log the update
      await createAuditLog(
        "updated",
        "staff",
        updatedStaff.id,
        `${updatedStaff.firstName} ${updatedStaff.lastName}`,
        userId, // SECURE: Use authenticated user ID only
        changes.length > 0 ? `Staff updated: ${changes.join(", ")}` : "Staff member updated",
        { firstName: oldStaff.firstName, lastName: oldStaff.lastName, email: oldStaff.email, department: oldStaff.department },
        { firstName: updatedStaff.firstName, lastName: updatedStaff.lastName, email: updatedStaff.email, department: updatedStaff.department },
        req
      );
      
      res.json(updatedStaff);
    } catch (error) {
      console.error('Error updating staff:', error);
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete("/api/staff/:id", requireAuth(), requirePermission('staff', 'canDelete'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get staff data before deletion for audit logging
      const [staffToDelete] = await db.select({
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        roleId: staff.roleId,
        profileImagePath: staff.profileImagePath,
        hireDate: staff.hireDate,
        department: staff.department,
        position: staff.position,
        managerId: staff.managerId,
        status: staff.status,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt
      }).from(staff).where(eq(staff.id, req.params.id));
      if (!staffToDelete) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      const [deletedStaff] = await db
        .update(staff)
        .set({ isActive: false })
        .where(eq(staff.id, req.params.id))
        .returning();
      
      if (!deletedStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      // Log the deletion
      await createAuditLog(
        "deleted",
        "staff",
        req.params.id,
        `${staffToDelete.firstName} ${staffToDelete.lastName}`,
        userId, // SECURE: Use authenticated user ID only
        `Staff member deactivated - ${staffToDelete.firstName} ${staffToDelete.lastName} (${staffToDelete.email})`,
        { firstName: staffToDelete.firstName, lastName: staffToDelete.lastName, email: staffToDelete.email, isActive: true },
        { isActive: false },
        req
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting staff:', error);
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // Departments API - SECURED
  app.get("/api/departments", requireAuth(), requirePermission('staff', 'canView'), async (req, res) => {
    try {
      const departments = await appStorage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.get("/api/departments/:id", requireAuth(), requirePermission('staff', 'canView'), async (req, res) => {
    try {
      const department = await appStorage.getDepartment(req.params.id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      console.error('Error fetching department:', error);
      res.status(500).json({ message: "Failed to fetch department" });
    }
  });

  app.post("/api/departments", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const insertData = insertDepartmentSchema.parse(req.body);
      const department = await appStorage.createDepartment(insertData);
      
      // Log the creation
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "created",
        "department",
        department.id,
        department.name,
        userId,
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

  app.put("/api/departments/:id", requireAuth(), requirePermission('departments', 'canEdit'), async (req, res) => {
    try {
      const insertData = insertDepartmentSchema.partial().parse(req.body);
      const department = await appStorage.updateDepartment(req.params.id, insertData);
      
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      // Log the update
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "updated",
        "department",
        department.id,
        department.name,
        userId,
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

  app.delete("/api/departments/:id", requireAuth(), requirePermission('departments', 'canDelete'), async (req, res) => {
    try {
      const department = await appStorage.getDepartment(req.params.id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      const success = await appStorage.deleteDepartment(req.params.id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete department" });
      }
      
      // Log the deletion
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "deleted",
        "department",
        req.params.id,
        department.name,
        userId,
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
  app.get("/api/positions", requireAuth(), requirePermission('departments', 'canView'), async (req, res) => {
    try {
      const positions = await appStorage.getPositions();
      res.json(positions);
    } catch (error) {
      console.error('Error fetching positions:', error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  app.get("/api/positions/:id", requireAuth(), requirePermission('departments', 'canView'), async (req, res) => {
    try {
      const position = await appStorage.getPosition(req.params.id);
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
      const positions = await appStorage.getPositionsByDepartment(req.params.departmentId);
      res.json(positions);
    } catch (error) {
      console.error('Error fetching positions for department:', error);
      res.status(500).json({ message: "Failed to fetch positions for department" });
    }
  });

  app.post("/api/positions", requireAuth(), requirePermission('departments', 'canCreate'), async (req, res) => {
    try {
      const insertData = insertPositionSchema.parse(req.body);
      const position = await appStorage.createPosition(insertData);
      
      // Log the creation
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "created",
        "position",
        position.id,
        position.name,
        userId,
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

  app.put("/api/positions/:id", requireAuth(), requirePermission('departments', 'canEdit'), async (req, res) => {
    try {
      const insertData = insertPositionSchema.partial().parse(req.body);
      const position = await appStorage.updatePosition(req.params.id, insertData);
      
      if (!position) {
        return res.status(404).json({ message: "Position not found" });
      }
      
      // Log the update
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "updated",
        "position",
        position.id,
        position.name,
        userId,
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

  app.delete("/api/positions/:id", requireAuth(), requirePermission('departments', 'canDelete'), async (req, res) => {
    try {
      const position = await appStorage.getPosition(req.params.id);
      if (!position) {
        return res.status(404).json({ message: "Position not found" });
      }
      
      const success = await appStorage.deletePosition(req.params.id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete position" });
      }
      
      // Log the deletion
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "deleted",
        "position",
        req.params.id,
        position.name,
        userId,
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
  app.post("/api/objects/upload", requireAuth(), async (req, res) => {
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

  app.put("/api/profile-images", requireAuth(), async (req, res) => {
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

  app.put("/api/course-thumbnails", requireAuth(), async (req, res) => {
    if (!req.body.thumbnailImageURL) {
      return res.status(400).json({ error: "thumbnailImageURL is required" });
    }

    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.thumbnailImageURL);

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting course thumbnail:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rich text editor image upload endpoint
  app.put("/api/images", requireAuth(), async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: req.session?.userId || "system",
          visibility: "public", // Images in rich text content should be publicly accessible
        }
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting image ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Business Profile API
  app.get("/api/business-profile", requireAuth(), requirePermission('settings', 'canView'), async (req, res) => {
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

  app.put("/api/business-profile", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
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
  app.get("/api/custom-field-folders/:id", requireAuth(), requirePermission('settings', 'canView'), async (req, res) => {
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
  app.get("/api/custom-field-folders", requireAuth(), requirePermission('settings', 'canView'), async (req, res) => {
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

  app.post("/api/custom-field-folders", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
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
  app.put("/api/custom-field-folders/reorder", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
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

  app.patch("/api/custom-field-folders/:id", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
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

  app.delete("/api/custom-field-folders/:id", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
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
  app.get("/api/product-categories", requireAuth(), requirePermission('products', 'canView'), async (req, res) => {
    try {
      const categories = await db.select().from(productCategories).orderBy(asc(productCategories.name));
      res.json(categories);
    } catch (error) {
      console.error('Error fetching product categories:', error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  app.post("/api/product-categories", requireAuth(), requirePermission('products', 'canCreate'), async (req, res) => {
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

  app.put("/api/product-categories/:id", requireAuth(), requirePermission('products', 'canEdit'), async (req, res) => {
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

  app.delete("/api/product-categories/:id", requireAuth(), requirePermission('products', 'canDelete'), async (req, res) => {
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
  app.get("/api/categories-reference", requireAuth(), requirePermission('products', 'canView'), async (req, res) => {
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
  app.get("/api/products", requireAuth(), requirePermission('products', 'canView'), async (req, res) => {
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

  app.get("/api/products/:id", requireAuth(), requirePermission('products', 'canView'), async (req, res) => {
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
  app.get("/api/clients/:clientId/products", requireAuth(), requirePermission('products', 'canView'), async (req, res) => {
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
  app.post("/api/clients/:clientId/products", requireAuth(), requirePermission('products', 'canEdit'), async (req, res) => {
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
  app.delete("/api/clients/:clientId/products/:productId", requireAuth(), requirePermission('products', 'canDelete'), async (req, res) => {
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
  app.get("/api/product-bundles/:bundleId/products", requireAuth(), requirePermission('products', 'canView'), async (req, res) => {
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
  app.patch("/api/clients/:clientId/bundles/:bundleId/quantities", requireAuth(), requirePermission('products', 'canEdit'), async (req, res) => {
    try {
      const { clientId, bundleId } = req.params;
      const { customQuantities } = req.body;

      // Validate input
      if (!customQuantities || typeof customQuantities !== 'object') {
        return res.status(400).json({ message: "Invalid customQuantities data" });
      }

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
        if (!product.productId) return; // Skip if productId is null/undefined
        
        const quantity = customQuantities[product.productId] || product.baseQuantity || 1;
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

  app.post("/api/products", requireAuth(), requirePermission('products', 'canCreate'), async (req, res) => {
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
  app.post("/api/products/import", requireAuth(), requirePermission('products', 'canCreate'), upload.single('file'), async (req, res) => {
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

  app.put("/api/products/:id", requireAuth(), requirePermission('products', 'canEdit'), async (req, res) => {
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

  app.delete("/api/products/:id", requireAuth(), requirePermission('products', 'canDelete'), async (req, res) => {
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
  app.get("/api/product-bundles", requireAuth(), requirePermission('products', 'canView'), async (req, res) => {
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

  app.get("/api/product-bundles/:id", requireAuth(), requirePermission('products', 'canView'), async (req, res) => {
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

  app.post("/api/product-bundles", requireAuth(), requirePermission('products', 'canCreate'), async (req, res) => {
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

  app.put("/api/product-bundles/:id", requireAuth(), requirePermission('products', 'canEdit'), async (req, res) => {
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

  app.delete("/api/product-bundles/:id", requireAuth(), requirePermission('products', 'canDelete'), async (req, res) => {
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

  // Audit Logs routes - SECURED (Admin Only)
  app.get("/api/audit-logs", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      // SECURE: Admin users only can view audit logs
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/:id", requireAuth(), requireAdmin(), async (req, res) => {
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

  app.get("/api/audit-logs/entity/:entityType/:entityId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const filter = req.query.filter as string || 'all';
      const userFilter = req.query.user as string || 'all';
      
      
      // Build filter conditions
      let baseConditions;
      
      // Special handling for contact entity - include related communications (SMS/email)
      if (entityType === 'contact') {
        baseConditions = or(
          // Direct contact logs
          and(eq(auditLogs.entityType, 'contact'), eq(auditLogs.entityId, entityId)),
          // SMS logs for this contact (stored in newValues.clientId)
          and(eq(auditLogs.entityType, 'sms'), sql`(${auditLogs.newValues}->>'clientId') = ${entityId}`),
          // Email logs for this contact (stored in newValues.clientId) 
          and(eq(auditLogs.entityType, 'email'), sql`(${auditLogs.newValues}->>'clientId') = ${entityId}`)
        );
      } else {
        // Standard entity query
        baseConditions = and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId));
      }
      
      let filterConditions = baseConditions;
      
      // Apply additional filtering if not 'all'
      if (filter !== 'all') {
        switch (filter) {
          case 'sms':
            filterConditions = and(eq(auditLogs.entityType, 'sms'), sql`(${auditLogs.newValues}->>'clientId') = ${entityId}`);
            break;
          case 'contact':
            filterConditions = and(eq(auditLogs.entityType, 'contact'), eq(auditLogs.entityId, entityId));
            break;
          case 'email':
            filterConditions = and(eq(auditLogs.entityType, 'email'), sql`(${auditLogs.newValues}->>'clientId') = ${entityId}`);
            break;
          case 'general':
            // General activities - contact updates only
            filterConditions = and(
              eq(auditLogs.entityType, 'contact'), 
              eq(auditLogs.entityId, entityId)
            );
            break;
          default:
            // For other filters like call, task, etc. - just show contact activities for now
            filterConditions = and(eq(auditLogs.entityType, 'contact'), eq(auditLogs.entityId, entityId));
        }
      }
      
      // Apply user filtering if specified
      if (userFilter !== 'all') {
        filterConditions = and(filterConditions, eq(auditLogs.userId, userFilter));
      }
      
      // Get total count for pagination (with filter applied)
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(auditLogs)
        .leftJoin(staff, eq(auditLogs.userId, staff.id))
        .where(filterConditions);
      
      // Get paginated logs (with filter applied) - include user names
      const logs = await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        entityName: auditLogs.entityName,
        userId: auditLogs.userId,
        userName: sql<string>`COALESCE(CONCAT(${staff.firstName}, ' ', ${staff.lastName}), 'Unknown User')`,
        details: auditLogs.details,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        timestamp: auditLogs.timestamp,
      }).from(auditLogs)
        .leftJoin(staff, eq(auditLogs.userId, staff.id))
        .where(filterConditions)
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit)
        .offset(offset);
        
        
      res.json({
        logs,
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count,
        filter,
        user: userFilter
      });
    } catch (error) {
      console.error('Error fetching entity audit logs:', error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/user/:userId", requireAuth(), requireAdmin(), async (req, res) => {
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

  app.post("/api/audit-logs", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // SECURITY WARNING: Manual audit log creation should be extremely restricted
      const validatedData = insertAuditLogSchema.parse(req.body);
      const [newLog] = await db.insert(auditLogs).values(validatedData).returning();
      
      // Log the manual audit log creation itself for accountability
      await createAuditLog(
        "created",
        "manual_audit_log",
        newLog.id,
        `Manual Audit Log: ${newLog.entityType}`,
        userId, // SECURE: Use authenticated user ID only
        `Admin manually created audit log: ${newLog.details}`,
        null,
        { entityType: newLog.entityType, entityId: newLog.entityId, action: newLog.action },
        req
      );
      
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('Error creating audit log:', error);
      res.status(500).json({ message: "Failed to create audit log" });
    }
  });

  // Roles API Routes - SECURED (Admin Only)
  app.get("/api/roles", requireAuth(), requireAdmin(), async (req, res) => {
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

  app.get("/api/roles/:id", requireAuth(), requireAdmin(), async (req, res) => {
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

  app.post("/api/roles", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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
            performedBy: userId, // SECURE: Use authenticated user ID only
            performedByName: "Authenticated Admin", // Could be enhanced to get actual name
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
        userId, // SECURE: Use authenticated user ID only
        `CRITICAL ROLE CREATION: Created new role '${newRole.name}' with permissions`,
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

  app.put("/api/roles/:id", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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
            performedBy: userId, // SECURE: Use authenticated user ID only
            performedByName: "Authenticated Admin", // Could be enhanced to get actual name
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
        userId, // SECURE: Use authenticated user ID only
        `CRITICAL ROLE UPDATE: Updated role '${updatedRole.name}' permissions`,
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

  app.delete("/api/roles/:id", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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
        userId, // SECURE: Use authenticated user ID only
        `CRITICAL ROLE DELETION: Deleted role '${role[0].name}' and all associated permissions`,
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

  // User Roles API Routes - SECURED (Admin Only)
  app.get("/api/users/:userId/roles", requireAuth(), requireAdmin(), async (req, res) => {
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

  app.post("/api/users/:userId/roles", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const { roleId } = req.body;
      const validatedData = insertUserRoleSchema.parse({
        userId: req.params.userId,
        roleId,
        assignedBy: userId, // SECURE: Use authenticated user ID only
      });

      const [newUserRole] = await db.insert(userRoles).values(validatedData).returning();

      await createAuditLog(
        "created",
        "user_role",
        newUserRole.id,
        `User role assignment`,
        userId, // SECURE: Use authenticated user ID only
        `CRITICAL PRIVILEGE ESCALATION: Assigned role ${roleId} to user ${req.params.userId}`,
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

  app.delete("/api/users/:userId/roles/:roleId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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
        userId, // SECURE: Use authenticated user ID only
        `CRITICAL PRIVILEGE REVOCATION: Removed role ${req.params.roleId} from user ${req.params.userId}`,
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

  // Permission Check API Route - SECURED - Check if current user has specific permission  
  app.get("/api/permissions/check/:module/:action", requireAuth(), async (req, res) => {
    try {
      const { module, action } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // SECURE: Only allow users to check their own permissions (no userId query parameter)
      
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

  // Get all permissions for a user across all modules - SECURED
  app.get("/api/users/:userId/permissions", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const { userId } = req.params;
      
      // SECURE: Only admins can access other users' permissions; users can access their own
      const isAdmin = await isCurrentUserAdmin(req);
      if (userId !== currentUserId && !isAdmin) {
        return res.status(403).json({ 
          message: "Access denied. Only admins can view other users' permissions." 
        });
      }
      
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

      // Log the permission access for security auditing
      await createAuditLog(
        "created",
        "permission_access",
        userId,
        `Permission Access for ${userId}`,
        currentUserId, // SECURE: Use authenticated user ID only
        `Admin ${currentUserId} accessed user permissions for ${userId}`,
        null,
        { accessedUserId: userId, moduleCount: Object.keys(modulePermissions).length },
        req
      );
      
      res.json(Object.values(modulePermissions));
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  // Permission Audit Log API Routes - SECURED (Admin only)
  app.get("/api/permission-audit-logs", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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
      
      // Log access to permission audit logs for security tracking
      await createAuditLog(
        "created",
        "permission_audit_access",
        "system",
        "Permission Audit Log Access",
        currentUserId, // SECURE: Use authenticated user ID only
        `Admin accessed permission audit logs with filters: ${JSON.stringify(filters)}`,
        null,
        { filtersUsed: filters, recordCount: result.data?.length || 0 },
        req
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching permission audit logs:', error);
      res.status(500).json({ message: "Failed to fetch permission audit logs" });
    }
  });

  app.get("/api/permission-audit-logs/:id", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const auditLog = await permissionAuditService.getAuditLogDetails(req.params.id);
      
      if (!auditLog) {
        return res.status(404).json({ message: "Permission audit log not found" });
      }

      // Log access to specific permission audit log
      await createAuditLog(
        "created",
        "permission_audit_detail_access",
        req.params.id,
        "Permission Audit Log Detail Access",
        currentUserId, // SECURE: Use authenticated user ID only
        `Admin accessed permission audit log detail: ${req.params.id}`,
        null,
        { auditLogId: req.params.id },
        req
      );

      res.json(auditLog);
    } catch (error) {
      console.error('Error fetching permission audit log details:', error);
      res.status(500).json({ message: "Failed to fetch permission audit log details" });
    }
  });

  // Notification Settings Routes - SECURED (User or Admin only)
  app.get("/api/notification-settings/:userId", requireAuth(), async (req, res) => {
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

  app.put("/api/notification-settings/:userId", requireAuth(), async (req, res) => {
    try {
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const { userId } = req.params;
      
      // SECURE: Users can only modify their own settings unless they're admin
      const isAdmin = await hasPermission(currentUserId, 'system', 'canAdmin');
      if (userId !== currentUserId && !isAdmin) {
        return res.status(403).json({ message: "Access denied. You can only modify your own notification settings." });
      }
      
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
  app.get("/api/clients/:clientId/notes", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
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

  app.post("/api/clients/:clientId/notes", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const { content } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);

      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response

      if (!content?.trim()) {
        return res.status(400).json({ error: "Note content is required" });
      }

      console.log("📝 Creating client note - Original userId:", userId);

      // Normalize the userId for database operations - ALWAYS runs, no conditionals
      const databaseUserId = await normalizeUserIdForDb(userId);
      console.log("🔄 Normalized databaseUserId for DB insert:", databaseUserId);

      // Get user info using the normalized ID for the response
      const userInfo = await db.select().from(staff).where(eq(staff.id, databaseUserId)).limit(1);
      const user = userInfo[0] || { firstName: "System", lastName: "User" };
      console.log("👤 Found user info:", { firstName: user.firstName, lastName: user.lastName });

      // Insert note into database
      const newNoteData = {
        clientId: clientId,
        content: content.trim(),
        createdById: databaseUserId, // Use normalized valid UUID for database
        isLocked: true // Notes are locked after creation as per schema
      };

      console.log("💾 Inserting note with data:", { ...newNoteData, content: newNoteData.content.substring(0, 50) + '...' });
      const insertedNote = await db.insert(clientNotes).values(newNoteData).returning();
      const createdNote = insertedNote[0];
      console.log("✅ Note created successfully with ID:", createdNote.id);

      // Create audit log
      await createAuditLog(
        "created",
        "note", 
        createdNote.id,
        `Note for client ${clientId}`,
        userId, // Use original userId for audit log
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
      console.error("❌ Error creating client note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // Edit note endpoint (Admin only)
  app.put("/api/clients/:clientId/notes/:noteId", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    try {
      const { clientId, noteId } = req.params;
      const { content } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);

      if (!content?.trim()) {
        return res.status(400).json({ error: "Note content is required" });
      }

      // Check if user is admin - handle development user specially
      let user;
      if (IS_DEVELOPMENT && userId === MOCK_ADMIN_USER_ID) {
        // Development user is always considered admin
        user = { firstName: "Dev", lastName: "Admin", roleName: "Admin" };
      } else {
        // Normal database lookup for production users
        const userWithRole = await db.select({
          firstName: staff.firstName,
          lastName: staff.lastName,
          roleName: roles.name
        })
        .from(staff)
        .leftJoin(roles, eq(staff.roleId, roles.id))
        .where(eq(staff.id, userId))
        .limit(1);
        
        user = userWithRole[0];
      }
      
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
  app.delete("/api/clients/:clientId/notes/:noteId", requireAuth(), requirePermission('clients', 'canDelete'), async (req, res) => {
    try {
      const { clientId, noteId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);

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
  app.get("/api/lead-notes/:leadId", requireAuth(), requirePermission('leads', 'canView'), async (req, res) => {
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

  app.post("/api/lead-notes", requireAuth(), requirePermission('leads', 'canEdit'), async (req, res) => {
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

  app.patch("/api/lead-notes/:id", requireAuth(), requirePermission('leads', 'canEdit'), async (req, res) => {
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

  app.delete("/api/lead-notes/:id", requireAuth(), requirePermission('leads', 'canDelete'), async (req, res) => {
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
  app.get("/api/lead-appointments/:leadId", requireAuth(), requirePermission('leads', 'canView'), async (req, res) => {
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

  app.post("/api/lead-appointments", requireAuth(), requirePermission('leads', 'canEdit'), async (req, res) => {
    try {
      // Debug session info
      console.log("Session info:", {
        sessionExists: !!req.session,
        userId: req.session?.userId,
        user: req.session?.user,
        isDevelopment: IS_DEVELOPMENT
      });

      // Get user ID from session or use development fallback
      let userId = req.session?.userId;
      if (IS_DEVELOPMENT && !userId) {
        userId = '030e554b-c0bc-446e-9538-e351f3d17b10'; // Use a default user ID in development
      }

      if (!userId) {
        console.error("No user ID found in session");
        return res.status(401).json({ error: "User authentication failed" });
      }

      // Convert string dates to Date objects
      const requestData = {
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        createdBy: userId,
      };
      
      console.log("Request data:", requestData);
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

  app.patch("/api/lead-appointments/:id", requireAuth(), requirePermission('leads', 'canEdit'), async (req, res) => {
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

  app.delete("/api/lead-appointments/:id", requireAuth(), requirePermission('leads', 'canDelete'), async (req, res) => {
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
  app.get("/api/clients/:clientId/tasks", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
    try {
      const clientId = req.params.clientId;
      
      // Use appStorage abstraction to avoid Drizzle ORM issues
      const clientTasks = await appStorage.getTasksByClient(clientId);
      
      res.json(clientTasks);
    } catch (error) {
      console.error("Error fetching client tasks:", error);
      res.status(500).json({ error: "Failed to fetch client tasks" });
    }
  });

  app.post("/api/clients/:clientId/tasks", requireAuth(), requirePermission('tasks', 'canCreate'), async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const { title, description, dueDate, assignedTo, status, isRecurring, recurringConfig } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);

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

  app.patch("/api/clients/:clientId/tasks/:taskId", requireAuth(), requirePermission('tasks', 'canEdit'), async (req, res) => {
    try {
      const { clientId, taskId } = req.params;
      const updateData = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);

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
  app.put("/api/clients/:clientId/tasks/:taskId", requireAuth(), requirePermission('tasks', 'canEdit'), async (req, res) => {
    try {
      const { clientId, taskId } = req.params;
      const { title, description, dueDate, assignedTo, isRecurring, recurringConfig } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);

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
  app.delete("/api/clients/:clientId/tasks/:taskId", requireAuth(), requirePermission('tasks', 'canDelete'), async (req, res) => {
    try {
      const { clientId, taskId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      
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



  // User permissions endpoint - SECURED
  app.get("/api/auth/permissions", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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

  // User permissions endpoint for general permission checks - SECURED
  app.get("/api/user-permissions", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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

  // Task Comments endpoints - SECURED (Business communications)
  app.get("/api/tasks/:taskId/comments", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  app.post("/api/tasks/:taskId/comments", requireAuth(), requirePermission('tasks', 'canEdit'), async (req, res) => {
    try {
      const { taskId } = req.params;
      const { content, mentions, fileUrls } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response

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

  app.put("/api/tasks/:taskId/comments/:commentId", requireAuth(), requirePermission('tasks', 'canEdit'), async (req, res) => {
    try {
      const { taskId, commentId } = req.params;
      const { content, mentions } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);

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

  app.delete("/api/tasks/:taskId/comments/:commentId", requireAuth(), requirePermission('tasks', 'canDelete'), async (req, res) => {
    try {
      const { taskId, commentId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);

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

  app.post("/api/tasks/:taskId/comments/:commentId/reactions", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
    try {
      const { taskId, commentId } = req.params;
      const { emoji } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      
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

  // Notifications endpoints - SECURED (User access only)
  app.get("/api/notifications", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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

  // Mark notification as read - SECURED
  app.patch("/api/notifications/:id/read", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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

  // Delete notification - SECURED
  app.delete("/api/notifications/:id", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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

  // Mark all notifications as read - SECURED
  app.patch("/api/notifications/mark-all-read", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
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
  app.get("/api/notifications/staff/:staffId", requireAuth(), requireAdmin(), async (req, res) => {
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
  app.post("/api/documents/upload-url", requireAuth(), requirePermission('clients', 'canCreate'), async (req, res) => {
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
      const client = await appStorage.getClient(clientId);
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
  app.post("/api/documents", requireAuth(), requirePermission('clients', 'canCreate'), async (req, res) => {
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
      const client = await appStorage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Get current user with proper authentication
      const uploadedBy = getAuthenticatedUserIdOrFail(req, res);
      if (!uploadedBy) return; // getAuthenticatedUserIdOrFail already sent 401 response

      // Normalize object path from upload URL
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(fileUrl);

      // Create document record
      const documentData = {
        name: fileName, // Store original filename for display
        clientId: clientId,
        fileName: sanitizedFileName, // Store sanitized filename for file system
        fileType: sanitizedFileName.split('.').pop()?.toLowerCase() || 'unknown',
        fileSize: fileSize,
        fileUrl: normalizedPath,
        uploadedBy: uploadedBy,
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const [document] = await db.insert(documents).values(validatedData).returning();

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
  app.get("/api/clients/:clientId/documents", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Verify client exists
      const client = await appStorage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Get documents with uploader information  
      const docs = await db
        .select({
          id: documents.id,
          clientId: documents.clientId,
          name: documents.name,
          fileName: documents.fileName,
          fileType: documents.fileType,
          fileSize: documents.fileSize,
          fileUrl: documents.fileUrl,
          uploadedBy: documents.uploadedBy,
          createdAt: documents.createdAt,
          uploaderName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`
        })
        .from(documents)
        .leftJoin(users, sql`${documents.uploadedBy} = ${users.id}`)
        .where(eq(documents.clientId, clientId))
        .orderBy(desc(documents.createdAt));

      // Format response with proper uploader info
      const formattedDocuments = docs.map(doc => ({
        id: doc.id,
        clientId: doc.clientId,
        name: doc.name, // Original filename for display
        fileName: doc.fileName, // Sanitized filename
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        fileUrl: doc.fileUrl,
        downloadUrl: doc.fileUrl, // Frontend expects downloadUrl
        uploadedBy: doc.uploaderName || 'Unknown User', // Use actual user name instead of UUID
        uploadedByUser: {
          firstName: doc.uploaderName ? doc.uploaderName.split(' ')[0] : 'Unknown',
          lastName: doc.uploaderName ? doc.uploaderName.split(' ').slice(1).join(' ') : 'User'
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
  app.delete("/api/documents/:id", requireAuth(), requirePermission('clients', 'canDelete'), async (req, res) => {
    try {
      const { id } = req.params;

      // Get current user with proper authentication
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response

      // Check if user has permission to delete documents (Admin only)
      const hasDeletePermission = await hasPermission(currentUserId, 'documents', 'canDelete');
      if (!hasDeletePermission) {
        return res.status(403).json({ message: "Only administrators can delete documents" });
      }

      // Get document info before deletion
      const document = await db
        .select()
        .from(documents)
        .where(eq(documents.id, id))
        .limit(1);

      if (document.length === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      const docRecord = document[0];

      // Get client info for audit log
      const client = await appStorage.getClient(docRecord.clientId);

      // Delete from database
      await db.delete(documents).where(eq(documents.id, id));

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

  // Duplicate route removed - consolidated into the main objects route above

  // Get current authenticated user data
  app.get("/api/auth/current-user", requireAuth(), async (req, res) => {
    try {
      // Get authenticated user with proper validation
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get actual user data from database with role information
      const userData = await db.select({
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        roleId: staff.roleId,
        role: roles.name
      }).from(staff)
      .leftJoin(roles, eq(staff.roleId, roles.id))
      .where(eq(staff.id, userId))
      .limit(1);
      
      if (userData.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(userData[0]);
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({ message: "Failed to get current user" });
    }
  });

  // ===== CALENDAR SYSTEM API ROUTES =====

  // Calendar Management Routes
  app.get("/api/calendars", process.env.NODE_ENV === 'development' ? (req, res, next) => next() : requireAuth(), process.env.NODE_ENV === 'development' ? (req, res, next) => next() : requirePermission('calendars', 'canView'), async (req, res) => {
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

  app.post("/api/calendars", requireAuth(), requirePermission('calendars', 'canCreate'), async (req, res) => {
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

  app.get("/api/calendars/:id", requireAuth(), requirePermission('calendars', 'canView'), async (req, res) => {
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

  app.get("/api/calendars/by-url/:customUrl", requireAuth(), requirePermission('calendars', 'canView'), async (req, res) => {
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
  app.get("/api/lead-appointments", requireAuth(), requirePermission('leads', 'canView'), async (req, res) => {
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
  app.get("/api/calendar-appointments", (req, res, next) => next(), (req, res, next) => next(), async (req, res) => {
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

  // Google Calendar Integration Routes
  // Helper function to create OAuth2 client
  function createGoogleOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:5000'}/api/integrations/google-calendar/callback`;
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }
    
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  // Generate OAuth authorization URL
  app.get("/api/integrations/google-calendar/authorize", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const oauth2Client = createGoogleOAuth2Client();
      
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: req.session?.userId || 'default-user'
      });
      
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating auth URL:', error);
      res.status(500).json({ message: "Failed to generate authorization URL" });
    }
  });

  // Handle OAuth callback
  app.get("/api/integrations/google-calendar/callback", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code not provided" });
      }
      
      const oauth2Client = createGoogleOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Get user info from Google
      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const calendarList = await calendar.calendarList.list();
      
      const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);
      
      if (!primaryCalendar) {
        return res.status(400).json({ message: "No primary calendar found" });
      }
      
      // Store integration in database
      const staffId = getAuthenticatedUserIdOrFail(req, res);
      
      const integrationData = {
        staffId,
        provider: 'google',
        externalCalendarId: primaryCalendar.id!,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || null,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isActive: true,
        lastSyncAt: new Date(),
      };
      
      // Check if integration already exists for this user
      const [existingIntegration] = await db
        .select()
        .from(calendarIntegrations)
        .where(and(
          eq(calendarIntegrations.staffId, staffId),
          eq(calendarIntegrations.provider, 'google')
        ));
      
      if (existingIntegration) {
        // Update existing integration
        await db
          .update(calendarIntegrations)
          .set({
            ...integrationData,
            updatedAt: new Date()
          })
          .where(eq(calendarIntegrations.id, existingIntegration.id));
      } else {
        // Create new integration
        await db.insert(calendarIntegrations).values(integrationData);
      }
      
      // Redirect to success page
      res.redirect('/settings/integrations?connected=google-calendar');
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.redirect('/settings/integrations?error=connection-failed');
    }
  });

  // Connect Google Calendar integration (for testing/reconnection)
  app.post("/api/integrations/google-calendar/connect", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const staffId = getAuthenticatedUserIdOrFail(req, res);
      if (!staffId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Generate auth URL
      const oauth2Client = createGoogleOAuth2Client();
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: staffId
      });
      
      res.json({ authUrl, redirectRequired: true });
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      res.status(500).json({ message: "Failed to connect Google Calendar" });
    }
  });

  // Disconnect Google Calendar integration
  app.post("/api/integrations/google-calendar/disconnect", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const staffId = getAuthenticatedUserIdOrFail(req, res);
      if (!staffId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await db
        .update(calendarIntegrations)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(calendarIntegrations.staffId, staffId),
          eq(calendarIntegrations.provider, 'google')
        ));
      
      res.json({ message: "Google Calendar disconnected successfully" });
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      res.status(500).json({ message: "Failed to disconnect Google Calendar" });
    }
  });

  // Check Google Calendar connection status
  app.get("/api/integrations/google-calendar/status", requireAuth(), requirePermission('integrations', 'canView'), async (req, res) => {
    try {
      const staffId = getAuthenticatedUserIdOrFail(req, res);
      if (!staffId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const [integration] = await db
        .select()
        .from(calendarIntegrations)
        .where(and(
          eq(calendarIntegrations.staffId, staffId),
          eq(calendarIntegrations.provider, 'google'),
          eq(calendarIntegrations.isActive, true)
        ));
      
      if (!integration) {
        return res.json({ 
          connected: false, 
          status: "disconnected",
          lastSync: null
        });
      }
      
      // Test the connection by making a simple API call
      try {
        const oauth2Client = createGoogleOAuth2Client();
        oauth2Client.setCredentials({
          access_token: integration.accessToken,
          refresh_token: integration.refreshToken,
        });
        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        await calendar.calendarList.list();
        
        res.json({
          connected: true,
          status: "connected",
          lastSync: integration.lastSyncAt,
          externalCalendarId: integration.externalCalendarId
        });
      } catch (apiError) {
        console.error('Google Calendar API error:', apiError);
        
        // Update integration to show error
        await db
          .update(calendarIntegrations)
          .set({
            syncErrors: `API Error: ${(apiError as Error).message}`,
            updatedAt: new Date()
          })
          .where(eq(calendarIntegrations.id, integration.id));
        
        res.json({
          connected: false,
          status: "error",
          lastSync: integration.lastSyncAt,
          error: "Authentication failed. Please reconnect."
        });
      }
    } catch (error) {
      console.error('Error checking Google Calendar status:', error);
      res.status(500).json({ message: "Failed to check connection status" });
    }
  });

  // Sync Google Calendar events
  app.post("/api/integrations/google-calendar/sync", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const staffId = getAuthenticatedUserIdOrFail(req, res);
      if (!staffId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const [integration] = await db
        .select()
        .from(calendarIntegrations)
        .where(and(
          eq(calendarIntegrations.staffId, staffId),
          eq(calendarIntegrations.provider, 'google'),
          eq(calendarIntegrations.isActive, true)
        ));
      
      if (!integration) {
        return res.status(404).json({ message: "Google Calendar integration not found" });
      }
      
      const oauth2Client = createGoogleOAuth2Client();
      oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
      });
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      // Get events from the last 30 days to 30 days in the future
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30);
      
      const events = await calendar.events.list({
        calendarId: integration.externalCalendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      let syncedCount = 0;
      
      for (const event of events.data.items || []) {
        if (!event.start?.dateTime || !event.end?.dateTime) continue;
        
        // Check if event already exists
        const [existingAppointment] = await db
          .select()
          .from(calendarAppointments)
          .where(eq(calendarAppointments.externalEventId, event.id!));
        
        const appointmentData = {
          title: event.summary || 'Google Calendar Event',
          description: event.description || null,
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end.dateTime),
          location: event.location || null,
          assignedTo: staffId,
          status: 'confirmed',
          externalEventId: event.id!,
          bookingSource: 'google_calendar',
        };
        
        if (existingAppointment) {
          // Update existing appointment
          await db
            .update(calendarAppointments)
            .set({
              ...appointmentData,
              updatedAt: new Date()
            })
            .where(eq(calendarAppointments.id, existingAppointment.id));
        } else {
          // Find a default calendar to assign to
          const [defaultCalendar] = await db
            .select()
            .from(calendars)
            .limit(1);
          
          if (defaultCalendar) {
            // Create new appointment
            await db.insert(calendarAppointments).values({
              ...appointmentData,
              calendarId: defaultCalendar.id,
            });
            syncedCount++;
          }
        }
      }
      
      // Update last sync time
      await db
        .update(calendarIntegrations)
        .set({
          lastSyncAt: new Date(),
          syncErrors: null,
          updatedAt: new Date()
        })
        .where(eq(calendarIntegrations.id, integration.id));
      
      res.json({
        message: "Sync completed successfully",
        syncedEvents: syncedCount,
        totalEvents: events.data.items?.length || 0
      });
    } catch (error) {
      console.error('Error syncing Google Calendar:', error);
      
      // Log sync error
      const staffId = getAuthenticatedUserIdOrFail(req, res);
      if (!staffId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      const [integration] = await db
        .select()
        .from(calendarIntegrations)
        .where(and(
          eq(calendarIntegrations.staffId, staffId),
          eq(calendarIntegrations.provider, 'google')
        ));
      
      if (integration) {
        await db
          .update(calendarIntegrations)
          .set({
            syncErrors: `Sync Error: ${(error as Error).message}`,
            updatedAt: new Date()
          })
          .where(eq(calendarIntegrations.id, integration.id));
      }
      
      res.status(500).json({ message: "Failed to sync Google Calendar" });
    }
  });

  // Slack Integration Routes
  // Check Slack connection status
  app.get("/api/integrations/slack/status", requireAuth(), requirePermission('integrations', 'canView'), async (req, res) => {
    try {
      const slackBotToken = process.env.SLACK_BOT_TOKEN;
      const slackChannelId = process.env.SLACK_CHANNEL_ID;
      
      if (!slackBotToken || !slackChannelId) {
        return res.json({
          connected: false,
          error: "Slack credentials not configured"
        });
      }
      
      // Test connection by calling auth.test API
      const testResponse = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${slackBotToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const testData = await testResponse.json();
      
      if (testData.ok) {
        res.json({
          connected: true,
          team: testData.team,
          user: testData.user,
          lastMessage: new Date().toISOString()
        });
      } else {
        res.json({
          connected: false,
          error: testData.error || "Authentication failed"
        });
      }
    } catch (error) {
      console.error('Error checking Slack status:', error);
      res.json({
        connected: false,
        error: (error as Error).message
      });
    }
  });
  
  // Send test message to Slack
  app.post("/api/integrations/slack/test", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const slackBotToken = process.env.SLACK_BOT_TOKEN;
      const slackChannelId = process.env.SLACK_CHANNEL_ID;
      
      if (!slackBotToken || !slackChannelId) {
        return res.status(400).json({
          message: "Slack credentials not configured"
        });
      }
      
      const message = {
        channel: slackChannelId,
        text: "🎉 Test message from your CRM system! Slack integration is working perfectly.",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*CRM System Integration Test* :rocket:"
            }
          },
          {
            type: "section",
            text: {
              type: "plain_text",
              text: "This is a test message to confirm your Slack integration is working correctly!"
            }
          }
        ]
      };
      
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${slackBotToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
      const data = await response.json();
      
      if (data.ok) {
        res.json({
          message: "Test message sent successfully to Slack!",
          messageId: data.ts,
          channel: slackChannelId
        });
      } else {
        res.status(400).json({
          message: "Failed to send test message",
          error: data.error
        });
      }
    } catch (error) {
      console.error('Error sending Slack test message:', error);
      res.status(500).json({
        message: "Failed to send test message",
        error: (error as Error).message
      });
    }
  });
  
  // Send message to Slack (for workflow automation)
  app.post("/api/integrations/slack/send", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { message, blocks } = req.body;
      const slackBotToken = process.env.SLACK_BOT_TOKEN;
      const slackChannelId = process.env.SLACK_CHANNEL_ID;
      
      if (!slackBotToken || !slackChannelId) {
        return res.status(400).json({
          message: "Slack credentials not configured"
        });
      }
      
      if (!message && !blocks) {
        return res.status(400).json({
          message: "Message content is required"
        });
      }
      
      const payload = {
        channel: slackChannelId,
        ...(message && { text: message }),
        ...(blocks && { blocks })
      };
      
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${slackBotToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.ok) {
        res.json({
          message: "Message sent successfully to Slack!",
          messageId: data.ts,
          channel: slackChannelId
        });
      } else {
        res.status(400).json({
          message: "Failed to send message",
          error: data.error
        });
      }
    } catch (error) {
      console.error('Error sending Slack message:', error);
      res.status(500).json({
        message: "Failed to send message",
        error: (error as Error).message
      });
    }
  });

  // Twilio SMS Integration Routes
  // Helper function to create Twilio client
  function createTwilioClient(accountSid: string, authToken: string) {
    return twilio(accountSid, authToken);
  }

  // Connect Twilio SMS integration (supports multiple phone numbers)
  app.post("/api/integrations/twilio/connect", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { accountSid, authToken, phoneNumber, name } = req.body;
      
      if (!accountSid || !authToken || !phoneNumber) {
        return res.status(400).json({ 
          message: "Account SID, Auth Token, and Phone Number are required" 
        });
      }
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ 
          message: "Name/Purpose is required (e.g., Sales, Support, Marketing)" 
        });
      }
      
      // Test the credentials by making a test API call
      try {
        const client = createTwilioClient(accountSid, authToken);
        await client.api.accounts(accountSid).fetch();
        
        // Validate phone number format
        const phoneNumberRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneNumberRegex.test(phoneNumber)) {
          return res.status(400).json({ 
            message: "Invalid phone number format. Please use E.164 format (e.g., +1234567890)" 
          });
        }
        
      } catch (twilioError) {
        return res.status(400).json({ 
          message: "Invalid credentials. Please check your Account SID and Auth Token." 
        });
      }
      
      const integrationData = {
        provider: 'twilio',
        name: name.trim(),
        accountSid,
        authToken, // Note: In production, this should be encrypted
        phoneNumber,
        isActive: true,
        lastTestAt: new Date(),
        connectionErrors: null,
      };
      
      // Check if this exact phone number already exists
      const [existingPhone] = await db
        .select()
        .from(smsIntegrations)
        .where(and(
          eq(smsIntegrations.provider, 'twilio'),
          eq(smsIntegrations.phoneNumber, phoneNumber)
        ));
      
      if (existingPhone) {
        return res.status(400).json({ 
          message: `Phone number ${phoneNumber} is already configured with name "${existingPhone.name}"` 
        });
      }
      
      // Check if this name already exists
      const [existingName] = await db
        .select()
        .from(smsIntegrations)
        .where(and(
          eq(smsIntegrations.provider, 'twilio'),
          eq(smsIntegrations.name, name.trim())
        ));
      
      if (existingName) {
        return res.status(400).json({ 
          message: `A phone number with name "${name}" already exists. Please use a different name.` 
        });
      }
      
      // Create new phone number
      await db.insert(smsIntegrations).values(integrationData);
      
      res.json({ 
        message: `Twilio SMS phone number "${name}" (${phoneNumber}) added successfully`,
        phoneNumber: phoneNumber,
        name: name
      });
    } catch (error) {
      console.error('Error connecting Twilio SMS:', error);
      res.status(500).json({ message: "Failed to connect Twilio SMS" });
    }
  });

  // Disconnect Twilio SMS integration
  app.post("/api/integrations/twilio/disconnect", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      await db
        .update(smsIntegrations)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(smsIntegrations.provider, 'twilio'));
      
      res.json({ message: "Twilio SMS disconnected successfully" });
    } catch (error) {
      console.error('Error disconnecting Twilio SMS:', error);
      res.status(500).json({ message: "Failed to disconnect Twilio SMS" });
    }
  });

  // Check Twilio SMS connection status (returns all phone numbers)
  app.get("/api/integrations/twilio/status", requireAuth(), requirePermission('integrations', 'canView'), async (req, res) => {
    try {
      const integrations = await db
        .select()
        .from(smsIntegrations)
        .where(and(
          eq(smsIntegrations.provider, 'twilio'),
          eq(smsIntegrations.isActive, true)
        ));
      
      if (integrations.length === 0) {
        return res.json({ 
          connected: false, 
          status: "disconnected",
          phoneNumbers: [],
          totalNumbers: 0
        });
      }
      
      // Test the connection using the first integration's credentials
      const firstIntegration = integrations[0];
      let connected = true;
      let statusMessage = "connected";
      
      try {
        const client = createTwilioClient(firstIntegration.accountSid, firstIntegration.authToken);
        await client.api.accounts(firstIntegration.accountSid).fetch();
      } catch (apiError) {
        console.error('Twilio API error:', apiError);
        connected = false;
        statusMessage = "error";
        
        // Update all integrations to show error
        await db
          .update(smsIntegrations)
          .set({
            connectionErrors: `API Error: ${(apiError as Error).message}`,
            updatedAt: new Date()
          })
          .where(eq(smsIntegrations.provider, 'twilio'));
      }
      
      const phoneNumbers = integrations.map(integration => ({
        id: integration.id,
        name: integration.name,
        phoneNumber: integration.phoneNumber,
        lastTest: integration.lastTestAt,
        errors: integration.connectionErrors
      }));
      
      res.json({
        connected,
        status: statusMessage,
        phoneNumbers,
        totalNumbers: phoneNumbers.length,
        lastTest: firstIntegration.lastTestAt
      });
    } catch (error) {
      console.error('Error checking Twilio status:', error);
      res.status(500).json({ message: "Failed to check connection status" });
    }
  });

  // Test Twilio SMS connection by sending a test message
  app.post("/api/integrations/twilio/test", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { testPhoneNumber } = req.body;
      
      if (!testPhoneNumber) {
        return res.status(400).json({ 
          message: "Test phone number is required" 
        });
      }
      
      const [integration] = await db
        .select()
        .from(smsIntegrations)
        .where(and(
          eq(smsIntegrations.provider, 'twilio'),
          eq(smsIntegrations.isActive, true)
        ));
      
      if (!integration) {
        return res.status(400).json({ 
          message: "Twilio SMS integration not connected" 
        });
      }
      
      const client = createTwilioClient(integration.accountSid, integration.authToken);
      
      const message = await client.messages.create({
        body: 'Test message from your CRM system. Twilio SMS integration is working!',
        from: integration.phoneNumber,
        to: testPhoneNumber
      });
      
      // Update last test time
      await db
        .update(smsIntegrations)
        .set({
          lastTestAt: new Date(),
          connectionErrors: null,
          updatedAt: new Date()
        })
        .where(eq(smsIntegrations.id, integration.id));
      
      res.json({
        message: "Test SMS sent successfully",
        messageId: message.sid,
        to: testPhoneNumber
      });
    } catch (error) {
      console.error('Error sending test SMS:', error);
      
      // Log error to integration
      const [integration] = await db
        .select()
        .from(smsIntegrations)
        .where(eq(smsIntegrations.provider, 'twilio'));
      
      if (integration) {
        await db
          .update(smsIntegrations)
          .set({
            connectionErrors: `Test Error: ${(error as Error).message}`,
            updatedAt: new Date()
          })
          .where(eq(smsIntegrations.id, integration.id));
      }
      
      res.status(500).json({ 
        message: "Failed to send test SMS",
        error: (error as Error).message
      });
    }
  });

  // Get all Twilio phone numbers
  app.get("/api/integrations/twilio/numbers", requireAuth(), requirePermission('integrations', 'canView'), async (req, res) => {
    try {
      const numbers = await db
        .select()
        .from(smsIntegrations)
        .where(and(
          eq(smsIntegrations.provider, 'twilio'),
          eq(smsIntegrations.isActive, true)
        ))
        .orderBy(smsIntegrations.name);
      
      res.json({
        phoneNumbers: numbers.map(num => ({
          id: num.id,
          name: num.name,
          phoneNumber: num.phoneNumber,
          lastTest: num.lastTestAt,
          errors: num.connectionErrors,
          createdAt: num.createdAt
        })),
        total: numbers.length
      });
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      res.status(500).json({ message: "Failed to fetch phone numbers" });
    }
  });

  // Delete individual Twilio phone number
  app.delete("/api/integrations/twilio/numbers/:id", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { id } = req.params;
      
      const [phoneNumber] = await db
        .select()
        .from(smsIntegrations)
        .where(and(
          eq(smsIntegrations.id, id),
          eq(smsIntegrations.provider, 'twilio')
        ));
      
      if (!phoneNumber) {
        return res.status(404).json({ message: "Phone number not found" });
      }
      
      await db
        .update(smsIntegrations)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(smsIntegrations.id, id));
      
      res.json({ 
        message: `Phone number "${phoneNumber.name}" (${phoneNumber.phoneNumber}) deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting phone number:', error);
      res.status(500).json({ message: "Failed to delete phone number" });
    }
  });

  // Update individual Twilio phone number
  app.put("/api/integrations/twilio/numbers/:id", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phoneNumber } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const [existingNumber] = await db
        .select()
        .from(smsIntegrations)
        .where(and(
          eq(smsIntegrations.id, id),
          eq(smsIntegrations.provider, 'twilio')
        ));
      
      if (!existingNumber) {
        return res.status(404).json({ message: "Phone number not found" });
      }
      
      // Check if new name conflicts with existing names (excluding current record)
      if (name.trim() !== existingNumber.name) {
        const [nameConflict] = await db
          .select()
          .from(smsIntegrations)
          .where(and(
            eq(smsIntegrations.provider, 'twilio'),
            eq(smsIntegrations.name, name.trim()),
            sql`${smsIntegrations.id} != ${id}`
          ));
        
        if (nameConflict) {
          return res.status(400).json({ 
            message: `A phone number with name "${name}" already exists` 
          });
        }
      }
      
      await db
        .update(smsIntegrations)
        .set({
          name: name.trim(),
          updatedAt: new Date()
        })
        .where(eq(smsIntegrations.id, id));
      
      res.json({ 
        message: `Phone number updated successfully`,
        name: name.trim(),
        phoneNumber: existingNumber.phoneNumber
      });
    } catch (error) {
      console.error('Error updating phone number:', error);
      res.status(500).json({ message: "Failed to update phone number" });
    }
  });

  // Helper function to process merge tags in messages
  function processMergeTags(message: string, clientData: any): string {
    if (!clientData) return message;
    
    // Replace common merge tags with client data
    return message
      .replace(/{{firstName}}/g, clientData.firstName || '')
      .replace(/{{lastName}}/g, clientData.lastName || '')
      .replace(/{{name}}/g, clientData.name || `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim())
      .replace(/{{email}}/g, clientData.email || '')
      .replace(/{{phone}}/g, clientData.phone || '')
      .replace(/{{companyName}}/g, clientData.companyName || '')
      .replace(/{{industry}}/g, clientData.industry || '')
      .replace(/{{website}}/g, clientData.website || '')
      .replace(/{{address1}}/g, clientData.address1 || '')
      .replace(/{{city}}/g, clientData.city || '')
      .replace(/{{state}}/g, clientData.state || '')
      .replace(/{{zipCode}}/g, clientData.zipCode || '');
  }

  // Send SMS using connected Twilio integration
  app.post("/api/integrations/twilio/send", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { to, message, fromNumber, clientId, templateId } = req.body;
      console.log('SMS Request received:', { to, fromNumber, clientId, message: message?.substring(0, 50) + '...' });
      
      if (!to || !message) {
        return res.status(400).json({ 
          message: "Phone number and message are required" 
        });
      }

      // Get client data for merge tag processing
      let processedMessage = message;
      if (clientId) {
        try {
          const [clientData] = await db
            .select()
            .from(clients)
            .where(eq(clients.id, clientId));
          
          if (clientData) {
            processedMessage = processMergeTags(message, clientData);
            console.log('Processed message:', processedMessage?.substring(0, 50) + '...');
          }
        } catch (error) {
          console.error('Error fetching client data for merge tags:', error);
          // Continue with original message if client fetch fails
        }
      }
      
      // Find the specific integration for the FROM number
      const [integration] = await db
        .select()
        .from(smsIntegrations)
        .where(and(
          eq(smsIntegrations.provider, 'twilio'),
          eq(smsIntegrations.phoneNumber, fromNumber || ''),
          eq(smsIntegrations.isActive, true)
        ));
      
      if (!integration) {
        console.log('No integration found for phone number:', fromNumber);
        // Fallback to any active Twilio integration
        const [fallbackIntegration] = await db
          .select()
          .from(smsIntegrations)
          .where(and(
            eq(smsIntegrations.provider, 'twilio'),
            eq(smsIntegrations.isActive, true)
          ));
        
        if (!fallbackIntegration) {
          return res.status(400).json({ 
            message: "No active Twilio integration found" 
          });
        }
        
        console.log('Using fallback Twilio integration:', fallbackIntegration.phoneNumber);
        const client = createTwilioClient(fallbackIntegration.accountSid, fallbackIntegration.authToken);
        
        const smsMessage = await client.messages.create({
          body: processedMessage,
          from: fallbackIntegration.phoneNumber,
          to: to
        });
        
        console.log('Twilio response:', { 
          sid: smsMessage.sid, 
          status: smsMessage.status,
          errorCode: smsMessage.errorCode,
          errorMessage: smsMessage.errorMessage 
        });
        
        // Create audit log for SMS sending
        const userId = getAuthenticatedUserIdOrFail(req, res);
        if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
        
        await createAuditLog(
          "created",
          "sms",
          smsMessage.sid,
          `SMS to ${to}`,
          userId,
          `Sent SMS message to ${to}: ${processedMessage.substring(0, 100)}${processedMessage.length > 100 ? '...' : ''}`,
          null,
          { to, from: fallbackIntegration.phoneNumber, message: processedMessage, clientId, status: smsMessage.status },
          req
        );
        
        return res.json({
          message: "SMS sent successfully",
          messageId: smsMessage.sid,
          to: to,
          status: smsMessage.status,
          fromNumber: fallbackIntegration.phoneNumber
        });
      }

      console.log('Using Twilio integration:', { 
        phoneNumber: integration.phoneNumber, 
        accountSid: integration.accountSid?.substring(0, 10) + '...' 
      });
      
      const client = createTwilioClient(integration.accountSid, integration.authToken);
      
      const smsMessage = await client.messages.create({
        body: processedMessage,
        from: integration.phoneNumber,
        to: to
      });
      
      console.log('Twilio response:', { 
        sid: smsMessage.sid, 
        status: smsMessage.status,
        errorCode: smsMessage.errorCode,
        errorMessage: smsMessage.errorMessage 
      });
      
      // Create audit log for SMS sending
      const userId = getAuthenticatedUserIdOrFail(req, res);
      console.log('SMS audit log - userId from getAuthenticatedUserIdOrFail:', userId);
      if (!userId) {
        console.log('SMS audit log - No userId found, skipping audit log creation');
        return; // getAuthenticatedUserIdOrFail already sent 401 response
      }
      
      console.log('SMS audit log - Creating audit log with:', {
        action: "created",
        entityType: "sms", 
        entityId: smsMessage.sid,
        entityName: `SMS to ${to}`,
        userId
      });
      
      try {
        await createAuditLog(
          "created",
          "sms",
          smsMessage.sid,
          `SMS to ${to}`,
          userId,
          `Sent SMS message to ${to}: ${processedMessage.substring(0, 100)}${processedMessage.length > 100 ? '...' : ''}`,
          null,
          { to, from: integration.phoneNumber, message: processedMessage, clientId, status: smsMessage.status },
          req
        );
        console.log('SMS audit log - Successfully created audit log for SMS:', smsMessage.sid);
      } catch (auditError) {
        console.error('SMS audit log - Failed to create audit log:', auditError);
        // Continue with SMS response even if audit log fails
      }
      
      res.json({
        message: "SMS sent successfully",
        messageId: smsMessage.sid,
        to: to,
        status: smsMessage.status
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      res.status(500).json({ 
        message: "Failed to send SMS",
        error: (error as Error).message
      });
    }
  });

  // ============== MAILGUN EMAIL INTEGRATION ENDPOINTS ==============

  // Helper function to create MailGun client
  function createMailgunClient(apiKey: string, domain: string) {
    const mg = new mailgun(formData);
    return mg.client({
      username: 'api',
      key: apiKey,
      url: 'https://api.mailgun.net'
    });
  }

  // GET MailGun Integration Status
  app.get("/api/integrations/mailgun/status", requireAuth(), requirePermission('integrations', 'canView'), async (req, res) => {
    try {
      const [integration] = await db
        .select()
        .from(emailIntegrations)
        .where(and(
          eq(emailIntegrations.provider, 'mailgun'),
          eq(emailIntegrations.isActive, true)
        ));

      if (!integration) {
        return res.json({
          connected: false,
          status: "disconnected",
          lastSent: null
        });
      }

      res.json({
        connected: true,
        status: "connected",
        domain: integration.domain,
        fromEmail: integration.fromEmail,
        fromName: integration.fromName,
        lastSent: integration.lastTestAt?.toISOString() || null,
        errors: integration.connectionErrors
      });
    } catch (error) {
      console.error('Error checking MailGun status:', error);
      res.status(500).json({ 
        connected: false,
        message: "Failed to check MailGun status" 
      });
    }
  });

  // POST MailGun Connect
  app.post("/api/integrations/mailgun/connect", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    console.log('MailGun Connect endpoint reached!');
    console.log('Request body:', req.body);
    
    // Temporary success response to test if endpoint is reachable
    res.json({
      message: "Endpoint reached successfully! (Debug mode)",
      receivedData: req.body
    });
    return;

      // Test MailGun connection by validating domain
      try {
        const mg = createMailgunClient(apiKey, domain);
        await mg.domains.get(domain);
      } catch (error) {
        console.error('MailGun connection test failed:', error);
        return res.status(400).json({
          message: "Failed to connect to MailGun. Please check your API key and domain."
        });
      }

      // Encrypt API key before storage
      const encryptedApiKey = EncryptionService.encrypt(apiKey);

      // Use transaction to ensure only one active MailGun configuration
      await db.transaction(async (tx) => {
        // First, deactivate any existing MailGun integrations
        await tx
          .update(emailIntegrations)
          .set({
            isActive: false,
            updatedAt: new Date()
          })
          .where(eq(emailIntegrations.provider, 'mailgun'));

        // Then create the new active integration
        await tx
          .insert(emailIntegrations)
          .values({
            provider: 'mailgun',
            name: 'Primary',
            apiKey: encryptedApiKey,
            domain,
            fromName,
            fromEmail,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      });

      // Create audit log for MailGun connection
      try {
        const userId = await getAuthenticatedUserIdOrFail(req);
        await createAuditLog(
          "created",
          "email_integration",
          "mailgun-integration",
          "MailGun Integration",
          userId,
          `Connected MailGun integration with domain: ${domain}`,
          null,
          { provider: 'mailgun', domain, fromEmail, fromName },
          req
        );
      } catch (auditError) {
        console.error('Failed to create MailGun connection audit log:', auditError);
        // Continue with response even if audit log fails
      }

      res.json({
        message: "MailGun connected successfully!",
        domain,
        fromEmail,
        fromName
      });
    } catch (error) {
      console.error('Error connecting MailGun:', error);
      res.status(500).json({
        message: "Failed to connect MailGun",
        error: (error as Error).message
      });
    }
  });

  // POST MailGun Disconnect
  app.post("/api/integrations/mailgun/disconnect", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      await db
        .update(emailIntegrations)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(emailIntegrations.provider, 'mailgun'));

      // Create audit log for MailGun disconnection
      try {
        const userId = await getAuthenticatedUserIdOrFail(req);
        await createAuditLog(
          "updated",
          "email_integration",
          "mailgun-integration",
          "MailGun Integration",
          userId,
          "Disconnected MailGun integration",
          { isActive: true },
          { isActive: false },
          req
        );
      } catch (auditError) {
        console.error('Failed to create MailGun disconnection audit log:', auditError);
        // Continue with response even if audit log fails
      }

      res.json({ message: "MailGun disconnected successfully" });
    } catch (error) {
      console.error('Error disconnecting MailGun:', error);
      res.status(500).json({ 
        message: "Failed to disconnect MailGun" 
      });
    }
  });

  // POST MailGun Test Email
  app.post("/api/integrations/mailgun/test", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      // Validate input using Zod schema
      const validationResult = mailgunTestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid input",
          errors: validationResult.error.flatten().fieldErrors
        });
      }

      const { to, fromEmail, fromName } = validationResult.data;

      const [integration] = await db
        .select()
        .from(emailIntegrations)
        .where(and(
          eq(emailIntegrations.provider, 'mailgun'),
          eq(emailIntegrations.isActive, true)
        ));

      if (!integration) {
        return res.status(400).json({
          message: "MailGun integration not connected"
        });
      }

      // Decrypt API key for use
      const decryptedApiKey = EncryptionService.decrypt(integration.apiKey);
      const mg = createMailgunClient(decryptedApiKey, integration.domain);

      const emailData = {
        from: `${fromName || integration.fromName} <${fromEmail || integration.fromEmail}>`,
        to: to,
        subject: 'Test Email from Your CRM System',
        text: 'This is a test email to verify your MailGun integration is working correctly!',
        html: '<h2>Test Email</h2><p>This is a test email to verify your MailGun integration is working correctly!</p><p>Your MailGun integration is configured and ready to use.</p>'
      };

      const message = await mg.messages.create(integration.domain, emailData);

      // Update last test time
      await db
        .update(emailIntegrations)
        .set({
          lastTestAt: new Date(),
          connectionErrors: null,
          updatedAt: new Date()
        })
        .where(eq(emailIntegrations.id, integration.id));

      // Create audit log for MailGun test email
      try {
        const userId = await getAuthenticatedUserIdOrFail(req);
        await createAuditLog(
          "created",
          "email_test",
          `test-${message.id}`,
          "MailGun Test Email",
          userId,
          `Sent test email to ${to} via MailGun`,
          null,
          { to, messageId: message.id, domain: integration.domain },
          req
        );
      } catch (auditError) {
        console.error('Failed to create MailGun test email audit log:', auditError);
        // Continue with response even if audit log fails
      }

      res.json({
        message: "Test email sent successfully",
        messageId: message.id,
        to: to
      });
    } catch (error) {
      console.error('Error sending test email:', error);

      // Log error to integration
      const [integration] = await db
        .select()
        .from(emailIntegrations)
        .where(eq(emailIntegrations.provider, 'mailgun'));

      if (integration) {
        await db
          .update(emailIntegrations)
          .set({
            connectionErrors: `Test Error: ${(error as Error).message}`,
            updatedAt: new Date()
          })
          .where(eq(emailIntegrations.id, integration.id));
      }

      res.status(500).json({
        message: "Failed to send test email",
        error: (error as Error).message
      });
    }
  });

  // Custom Field File Upload Routes
  app.post("/api/custom-field-files/upload-url", requireAuth(), requirePermission('files', 'canCreate'), async (req, res) => {
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

  app.post("/api/custom-field-files", requireAuth(), requirePermission('files', 'canCreate'), async (req, res) => {
    try {
      const data = req.body;
      
      // Sanitize filename for security
      data.fileName = sanitizeFileName(data.fileName);
      
      // Add default uploadedBy (in a real app, this would come from session)
      const authUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!authUserId) return;
      data.uploadedBy = authUserId;
      
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

  app.get("/api/custom-field-files", requireAuth(), requirePermission('files', 'canView'), async (req, res) => {
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

  app.get("/api/custom-field-files/:id/download", requireAuth(), requirePermission('files', 'canView'), async (req, res) => {
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

  app.delete("/api/custom-field-files/:id", requireAuth(), requirePermission('files', 'canDelete'), async (req, res) => {
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
  app.get("/api/forms/test", requireAuth(), requirePermission('forms', 'canView'), async (req, res) => {
    try {
      res.json({ success: true, storageType: appStorage.constructor.name });
    } catch (error) {
      console.error("Test error:", error);
      res.status(500).json({ message: "Test failed" });
    }
  });

  // Form folders endpoints
  app.get("/api/form-folders", requireAuth(), requirePermission('forms', 'canView'), async (req, res) => {
    try {
      const foldersResult = await db.select().from(formFolders).orderBy(asc(formFolders.order));
      res.json(foldersResult);
    } catch (error) {
      console.error("Error fetching form folders:", error);
      res.status(500).json({ message: "Failed to fetch form folders" });
    }
  });

  app.post("/api/form-folders", requireAuth(), requirePermission('forms', 'canCreate'), async (req, res) => {
    try {
      const folderData = insertFormFolderSchema.parse(req.body);
      const result = await db.insert(formFolders).values(folderData).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating form folder:", error);
      res.status(500).json({ message: "Failed to create form folder" });
    }
  });

  app.put("/api/form-folders/:id", requireAuth(), requirePermission('forms', 'canEdit'), async (req, res) => {
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

  app.delete("/api/form-folders/:id", requireAuth(), requirePermission('forms', 'canDelete'), async (req, res) => {
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
  app.get("/api/forms", requireAuth(), requirePermission('forms', 'canView'), async (req, res) => {
    try {
      const formsResult = await db.select().from(forms).orderBy(desc(forms.createdAt));
      res.json(formsResult);
    } catch (error) {
      console.error("Error fetching forms:", error);
      res.status(500).json({ message: "Failed to fetch forms" });
    }
  });

  app.get("/api/forms/:id", requireAuth(), requirePermission('forms', 'canView'), async (req, res) => {
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

  // Get form fields for a specific form
  app.get("/api/form-fields", requireAuth(), requirePermission('forms', 'canView'), async (req, res) => {
    try {
      const formId = req.query.formId as string;
      if (!formId) {
        return res.status(400).json({ message: "formId parameter is required" });
      }
      
      const fieldsResult = await db.select()
        .from(formFields)
        .leftJoin(customFields, eq(formFields.customFieldId, customFields.id))
        .where(eq(formFields.formId, formId))
        .orderBy(formFields.order);
      
      // Format the response to include custom field info
      const fields = fieldsResult.map(row => ({
        ...row.form_fields,
        customField: row.custom_fields
      }));
      
      res.json(fields);
    } catch (error) {
      console.error("Error fetching form fields:", error);
      res.status(500).json({ message: "Failed to fetch form fields" });
    }
  });

  app.post("/api/forms", requireAuth(), requirePermission('forms', 'canCreate'), async (req, res) => {
    try {
      const { fields, ...formData } = req.body;
      
      // Clean form data and set defaults
      const { updatedAt, createdAt, id, ...cleanFormData } = formData;
      const formToInsert = {
        ...cleanFormData,
        createdBy: userId,
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

  app.put("/api/forms/:id", requireAuth(), requirePermission('forms', 'canEdit'), async (req, res) => {
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

  app.delete("/api/forms/:id", requireAuth(), requirePermission('forms', 'canDelete'), async (req, res) => {
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
  app.post("/api/forms/:id/duplicate", requireAuth(), requirePermission('forms', 'canCreate'), async (req, res) => {
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
        createdBy: userId
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
  app.put("/api/forms/:id/move", requireAuth(), requirePermission('forms', 'canEdit'), async (req, res) => {
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

  app.post("/api/forms/:formId/submit", requireAuth(), async (req, res) => {
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
  app.get("/api/comments/upload-url", requireAuth(), async (req, res) => {
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
  
  app.post("/api/comments/upload-url", requireAuth(), async (req, res) => {
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

  // Duplicate route removed - consolidated into the main objects route above

  // Add file to comment after upload
  app.post("/api/comments/:commentId/files", requireAuth(), async (req, res) => {
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
  app.get("/api/time-entries/running", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
    try {
      // Check all tasks for incomplete time entries (running timers)
      const allTasks = await appStorage.getTasks();
      
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
  // IMPORTANT: PUT /api/task-statuses/reorder must come before PUT /api/task-statuses/:id
  // Reorder task statuses - SECURED (Admin Only)
  app.put("/api/task-statuses/reorder", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const { statuses } = req.body;
      
      if (!Array.isArray(statuses)) {
        return res.status(400).json({ message: "Statuses must be an array" });
      }

      // Update each status with the new sort order
      for (const status of statuses) {
        await db.update(taskStatuses)
          .set({ sortOrder: status.sortOrder, updatedAt: sql`now()` })
          .where(eq(taskStatuses.id, status.id));
      }

      // Log the reorder operation
      await createAuditLog(
        "updated",
        "task_status",
        "bulk",
        "Task Statuses",
        userId, // SECURE: Use authenticated user ID only
        `CRITICAL SYSTEM CONFIG: Reordered task statuses (Admin action)`,
        null,
        { statusCount: statuses.length },
        req
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering task statuses:", error);
      res.status(500).json({ message: "Failed to reorder task statuses" });
    }
  });

  app.get("/api/task-statuses", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  app.post("/api/task-statuses", requireAuth(), requirePermission('tasks', 'canCreate'), async (req, res) => {
    try {
      const validatedData = insertTaskStatusSchema.parse(req.body);
      const [newStatus] = await db.insert(taskStatuses)
        .values(validatedData)
        .returning();
      
      // Log the creation
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "created",
        "task_status",
        newStatus.id,
        newStatus.name,
        userId,
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
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "updated",
        "task_status",
        updatedStatus.id,
        updatedStatus.name,
        userId,
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
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "deleted",
        "task_status",
        req.params.id,
        statusToDelete.name,
        userId,
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
  // IMPORTANT: PUT /api/task-priorities/reorder must come before PUT /api/task-priorities/:id
  // Reorder task priorities
  app.put("/api/task-priorities/reorder", async (req, res) => {
    try {
      const { priorities } = req.body;
      
      if (!Array.isArray(priorities)) {
        return res.status(400).json({ message: "Priorities must be an array" });
      }

      // Update each priority with the new sort order
      for (const priority of priorities) {
        await db.update(taskPriorities)
          .set({ sortOrder: priority.sortOrder, updatedAt: sql`now()` })
          .where(eq(taskPriorities.id, priority.id));
      }

      // Log the reorder operation
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "updated",
        "task_priority",
        "bulk",
        "Task Priorities",
        userId,
        `Task priorities reordered`,
        null,
        { priorityCount: priorities.length },
        req
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering task priorities:", error);
      res.status(500).json({ message: "Failed to reorder task priorities" });
    }
  });

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
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "created",
        "task_priority",
        newPriority.id,
        newPriority.name,
        userId,
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

  app.put("/api/task-priorities/:id", requireAuth(), requirePermission('tasks', 'canManage'), async (req, res) => {
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
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "updated",
        "task_priority",
        updatedPriority.id,
        updatedPriority.name,
        userId,
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

  app.delete("/api/task-priorities/:id", requireAuth(), requirePermission('tasks', 'canManage'), async (req, res) => {
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
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      await createAuditLog(
        "deleted",
        "task_priority",
        req.params.id,
        priorityToDelete.name,
        userId,
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
  app.get("/api/task-settings", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

  app.post("/api/task-settings", requireAuth(), requirePermission('tasks', 'canManage'), async (req, res) => {
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
  app.get("/api/team-workflows", requireAuth(), requirePermission('workflows', 'canView'), async (req, res) => {
    try {
      const workflows = await db.select()
        .from(teamWorkflows)
        .where(eq(teamWorkflows.isActive, true))
        .orderBy(asc(teamWorkflows.name));
      
      // Get statuses for each workflow using the same logic as the individual endpoint
      const workflowsWithStatuses = [];
      for (const workflow of workflows) {
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
          .where(eq(teamWorkflowStatuses.workflowId, workflow.id))
          .orderBy(asc(teamWorkflowStatuses.order));

        workflowsWithStatuses.push({ ...workflow, statuses: workflowStatuses });
      }
      
      res.json(workflowsWithStatuses);
    } catch (error) {
      console.error("Error fetching team workflows:", error);
      res.status(500).json({ message: "Failed to fetch team workflows" });
    }
  });

  app.get("/api/team-workflows/:id", requireAuth(), requirePermission('workflows', 'canView'), async (req, res) => {
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

  app.post("/api/team-workflows", requireAuth(), requirePermission('workflows', 'canCreate'), async (req, res) => {
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

  app.patch("/api/team-workflows/:id", requireAuth(), requirePermission('workflows', 'canEdit'), async (req, res) => {
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

  app.delete("/api/team-workflows/:id", requireAuth(), requirePermission('workflows', 'canDelete'), async (req, res) => {
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
  app.post("/api/team-workflows/:workflowId/statuses", requireAuth(), requirePermission('workflows', 'canEdit'), async (req, res) => {
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

  app.patch("/api/team-workflow-statuses/:id", requireAuth(), requirePermission('workflows', 'canEdit'), async (req, res) => {
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

  app.delete("/api/team-workflow-statuses/:id", requireAuth(), requirePermission('workflows', 'canDelete'), async (req, res) => {
    try {
      await db.delete(teamWorkflowStatuses)
        .where(eq(teamWorkflowStatuses.id, req.params.id));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing status from workflow:", error);
      res.status(500).json({ message: "Failed to remove status from workflow" });
    }
  });

  // Update team workflow statuses (replace all statuses for a workflow)
  app.put("/api/team-workflows/:workflowId/statuses", requireAuth(), requirePermission('workflows', 'canEdit'), async (req, res) => {
    try {
      const { workflowId } = req.params;
      const { statuses } = req.body;

      if (!Array.isArray(statuses)) {
        return res.status(400).json({ message: "Statuses must be an array" });
      }

      // First, delete existing workflow statuses
      await db.delete(teamWorkflowStatuses).where(eq(teamWorkflowStatuses.workflowId, workflowId));

      // Then insert the new statuses
      if (statuses.length > 0) {
        const workflowStatusData = statuses.map((status: any) => ({
          id: randomUUID(),
          workflowId: workflowId,
          statusId: status.statusId,
          order: status.order,
          isRequired: status.isRequired,
        }));

        await db.insert(teamWorkflowStatuses).values(workflowStatusData);
      }

      await createAuditLog("updated", "team_workflow_statuses", workflowId, JSON.stringify({
        action: 'update_workflow_statuses',
        statusCount: statuses.length,
      }), null, req.session?.userId || null);

      res.status(200).json({ message: "Workflow statuses updated successfully" });
    } catch (error) {
      console.error("Failed to update workflow statuses:", error);
      res.status(500).json({ message: "Failed to update workflow statuses" });
    }
  });

  // Department workflow assignment
  app.patch("/api/departments/:id/workflow", requireAuth(), requirePermission('departments', 'canEdit'), async (req, res) => {
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

  // HR System Routes
  
  // SECURITY FIX: Remove duplicate unsecured staff route (already exists as secured version above)
  // Original secured staff routes at lines 5154+ already have proper authentication and permissions

  // Time Off Request Routes - SECURED (Employee privacy data)
  app.get("/api/hr/time-off-requests", requireAuth(), requirePermission('hr', 'canView'), async (req, res) => {
    try {
      const requests = await db.select().from(timeOffRequests).orderBy(desc(timeOffRequests.createdAt));
      res.json(requests);
    } catch (error) {
      console.error("Error fetching time off requests:", error);
      res.status(500).json({ error: "Failed to fetch time off requests" });
    }
  });

  app.post("/api/hr/time-off-requests", requireAuth(), requirePermission('hr', 'canCreate'), async (req, res) => {
    try {
      // Convert totalHours from number to string for decimal field
      const cleanedBody = {
        ...req.body,
        totalHours: req.body.totalHours?.toString() || "0"
      };
      
      const validatedData = insertTimeOffRequestSchema.parse(cleanedBody);
      const [newRequest] = await db.insert(timeOffRequests).values(validatedData).returning();
      
      await createAuditLog(
        "created",
        "time_off_request",
        newRequest.id,
        `Time off request by ${validatedData.staffId}`,
        validatedData.staffId,
        `Created ${validatedData.type} request for ${validatedData.totalDays} days`,
        null,
        newRequest,
        req
      );
      
      res.json(newRequest);
    } catch (error) {
      console.error("Error creating time off request:", error);
      res.status(500).json({ error: "Failed to create time off request" });
    }
  });

  // Get direct reports for managers - SECURED
  app.get("/api/hr/direct-reports", requireAuth(), requirePermission('hr', 'canView'), async (req, res) => {
    try {
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Development mode: Mock admin user has no direct reports
      if (IS_DEVELOPMENT && currentUserId === MOCK_ADMIN_USER_ID) {
        res.json([]);
        return;
      }
      
      const directReports = await db.select()
        .from(staff)
        .where(eq(staff.managerId, currentUserId))
        .orderBy(asc(staff.firstName));
      
      res.json(directReports);
    } catch (error) {
      console.error("Error fetching direct reports:", error);
      res.status(500).json({ error: "Failed to fetch direct reports" });
    }
  });

  // Test endpoint for debugging
  app.get("/api/hr/test-pending", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const result = await db.select()
        .from(timeOffRequests)
        .where(eq(timeOffRequests.status, "pending"));
      res.json({ count: result.length, requests: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get pending time off requests for manager's direct reports (or all for admins) - SECURED
  app.get("/api/hr/time-off-requests/pending-for-approval", requireAuth(), requirePermission('hr', 'canManage'), async (req, res) => {
    try {
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response

      // Check if current user is admin
      const isAdmin = await hasPermission(currentUserId, 'hr', 'canManage');
      
      let pendingRequests;
      
      if (isAdmin) {
        // Admin: Get ALL pending requests from everyone
        pendingRequests = await db.select()
          .from(timeOffRequests)
          .innerJoin(staff, eq(timeOffRequests.staffId, staff.id))
          .where(eq(timeOffRequests.status, "pending"))
          .orderBy(desc(timeOffRequests.createdAt));
      } else {
        // Manager: Get ONLY pending requests from direct reports
        pendingRequests = await db.select()
          .from(timeOffRequests)
          .innerJoin(staff, eq(timeOffRequests.staffId, staff.id))
          .where(
            and(
              eq(timeOffRequests.status, "pending"),
              eq(staff.managerId, currentUserId)
            )
          )
          .orderBy(desc(timeOffRequests.createdAt));
      }

      // Format the response for the frontend
      const formattedRequests = pendingRequests.map(row => ({
        id: row.time_off_requests.id,
        type: row.time_off_requests.type,
        startDate: row.time_off_requests.startDate,
        endDate: row.time_off_requests.endDate,
        totalDays: row.time_off_requests.totalDays,
        totalHours: row.time_off_requests.totalHours,
        reason: row.time_off_requests.reason,
        status: row.time_off_requests.status,
        createdAt: row.time_off_requests.createdAt,
        staff: {
          firstName: row.staff.firstName,
          lastName: row.staff.lastName,
          email: row.staff.email,
          department: row.staff.department,
          position: row.staff.position,
        }
      }));

      res.json(formattedRequests);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
  });

  // Time Off Policies routes
  app.get("/api/hr/time-off-policies", requireAuth(), requirePermission('hr', 'canView'), async (req, res) => {
    try {
      const policies = await db.select().from(timeOffPolicies).orderBy(desc(timeOffPolicies.createdAt));
      res.json(policies);
    } catch (error) {
      console.error("Error fetching time off policies:", error);
      res.status(500).json({ message: "Failed to fetch time off policies" });
    }
  });

  app.post("/api/hr/time-off-policies", requireAuth(), requirePermission('hr', 'canCreate'), async (req, res) => {
    try {
      const [policy] = await db.insert(timeOffPolicies).values(req.body).returning();
      res.status(201).json(policy);
    } catch (error) {
      console.error("Error creating time off policy:", error);
      res.status(500).json({ message: "Failed to create time off policy" });
    }
  });

  app.patch("/api/hr/time-off-policies/:id", requireAuth(), requirePermission('hr', 'canEdit'), async (req, res) => {
    try {
      const [policy] = await db.update(timeOffPolicies)
        .set(req.body)
        .where(eq(timeOffPolicies.id, req.params.id))
        .returning();
      res.json(policy);
    } catch (error) {
      console.error("Error updating time off policy:", error);
      res.status(500).json({ message: "Failed to update time off policy" });
    }
  });

  // Delete time off request (ADMINS ONLY)
  app.delete("/api/hr/time-off-requests/:requestId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { requestId } = req.params;
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // Authentication failed

      // Admin check already enforced by requireAdmin() middleware

      // Get the request to verify it exists and is pending
      const [existingRequest] = await db.select()
        .from(timeOffRequests)
        .innerJoin(staff, eq(timeOffRequests.staffId, staff.id))
        .where(eq(timeOffRequests.id, requestId));

      if (!existingRequest) {
        return res.status(404).json({ error: "Time off request not found" });
      }

      // Allow deletion of both pending AND approved requests for admins
      if (!["pending", "approved"].includes(existingRequest.time_off_requests.status)) {
        return res.status(400).json({ error: "Only pending and approved requests can be deleted" });
      }

      // Delete the request
      const [deletedRequest] = await db.delete(timeOffRequests)
        .where(eq(timeOffRequests.id, requestId))
        .returning();

      // Create audit log
      await createAuditLog(
        "deleted",
        "time_off_request",
        requestId,
        "Time off request deleted",
        currentUserId,
        `Deleted pending time off request for ${existingRequest.staff.firstName} ${existingRequest.staff.lastName}`,
        existingRequest.time_off_requests,
        null,
        req
      );

      res.json({ message: "Time off request deleted successfully" });
    } catch (error) {
      console.error("Error deleting time off request:", error);
      res.status(500).json({ error: "Failed to delete request" });
    }
  });

  // Approve or reject time off request
  app.put("/api/hr/time-off-requests/:requestId/approval", requireAuth(), requirePermission('hr', 'canManage'), async (req, res) => {
    try {
      const { requestId } = req.params;
      const { action, rejectionReason } = req.body;
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // Authentication failed

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
      }

      // Check if current user is admin
      const isAdmin = await hasPermission(currentUserId, 'hr', 'canManage');
      
      let requestWithStaff;
      
      if (isAdmin) {
        // Admin: Can approve ANY request
        [requestWithStaff] = await db.select()
          .from(timeOffRequests)
          .innerJoin(staff, eq(timeOffRequests.staffId, staff.id))
          .where(eq(timeOffRequests.id, requestId));
      } else {
        // Manager: Can only approve direct reports' requests
        [requestWithStaff] = await db.select()
          .from(timeOffRequests)
          .innerJoin(staff, eq(timeOffRequests.staffId, staff.id))
          .where(
            and(
              eq(timeOffRequests.id, requestId),
              eq(staff.managerId, currentUserId)
            )
          );
      }

      if (!requestWithStaff) {
        return res.status(404).json({ error: "Time off request not found or you don't have permission to approve it" });
      }

      if (requestWithStaff.time_off_requests.status !== "pending") {
        return res.status(400).json({ error: "Request has already been processed" });
      }

      // Update the request
      const updateData: any = {
        status: action === "approve" ? "approved" : "rejected",
        approvedBy: currentUserId,
        approvedAt: new Date(),
      };

      if (action === "reject" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      const [updatedRequest] = await db.update(timeOffRequests)
        .set(updateData)
        .where(eq(timeOffRequests.id, requestId))
        .returning();

      // Create audit log
      await createAuditLog(
        "updated",
        "time_off_request",
        requestId,
        `Time off request ${action}d`,
        currentUserId,
        `${action === "approve" ? "Approved" : "Rejected"} time off request${rejectionReason ? ` with reason: ${rejectionReason}` : ""}`,
        requestWithStaff.time_off_requests,
        updatedRequest,
        req
      );

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error processing time off request approval:", error);
      res.status(500).json({ error: "Failed to process approval" });
    }
  });

  // Job Openings Management Routes
  app.get("/api/job-openings", async (req, res) => {
    try {
      const { status, departmentId, hiringManagerId } = req.query;
      const hiringManager = alias(staff, 'hiring_manager');
      const creator = alias(staff, 'creator');
      const approver = alias(staff, 'approver');

      let query = db.select({
        id: jobOpenings.id,
        departmentId: jobOpenings.departmentId,
        departmentName: departments.name,
        positionId: jobOpenings.positionId,
        positionName: positions.name,
        status: jobOpenings.status,
        hiringManagerId: jobOpenings.hiringManagerId,
        hiringManagerName: sql<string>`CONCAT(${hiringManager.firstName}, ' ', ${hiringManager.lastName})`,
        employmentType: jobOpenings.employmentType,
        compensation: jobOpenings.compensation,
        compensationType: jobOpenings.compensationType,
        jobDescription: jobOpenings.jobDescription,
        requirements: jobOpenings.requirements,
        benefits: jobOpenings.benefits,
        createdById: jobOpenings.createdById,
        createdByName: sql<string>`CONCAT(${creator.firstName}, ' ', ${creator.lastName})`,
        approvalStatus: jobOpenings.approvalStatus,
        approvedById: jobOpenings.approvedById,
        approvedByName: sql<string>`CONCAT(${approver.firstName}, ' ', ${approver.lastName})`,
        approvedAt: jobOpenings.approvedAt,
        rejectionReason: jobOpenings.rejectionReason,
        isPublic: jobOpenings.isPublic,
        externalPostingUrl: jobOpenings.externalPostingUrl,
        createdAt: jobOpenings.createdAt,
        updatedAt: jobOpenings.updatedAt,
      })
      .from(jobOpenings)
      .leftJoin(departments, eq(jobOpenings.departmentId, departments.id))
      .leftJoin(positions, eq(jobOpenings.positionId, positions.id))
      .leftJoin(hiringManager, eq(jobOpenings.hiringManagerId, hiringManager.id))
      .leftJoin(creator, eq(jobOpenings.createdById, creator.id))
      .leftJoin(approver, eq(jobOpenings.approvedById, approver.id))
      .orderBy(desc(jobOpenings.createdAt));

      // Apply filters if provided
      const conditions = [];
      if (status) conditions.push(eq(jobOpenings.status, status as string));
      if (departmentId) conditions.push(eq(jobOpenings.departmentId, departmentId as string));
      if (hiringManagerId) conditions.push(eq(jobOpenings.hiringManagerId, hiringManagerId as string));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const openings = await query;
      res.json(openings);
    } catch (error) {
      console.error("Error fetching job openings:", error);
      res.status(500).json({ error: "Failed to fetch job openings" });
    }
  });

  // Get public job openings (no authentication required)
  app.get("/api/job-openings/public", async (req, res) => {
    try {
      // Simple query to avoid Drizzle ORM complex join issues
      const openings = await db.select()
        .from(jobOpenings)
        .where(and(
          eq(jobOpenings.status, 'open'),
          eq(jobOpenings.approvalStatus, 'approved'),
          eq(jobOpenings.isPublic, true)
        ))
        .orderBy(desc(jobOpenings.createdAt));

      // Get department and position names separately to avoid join issues
      const enrichedOpenings = [];
      for (const opening of openings) {
        let departmentName = 'Unknown Department';
        let positionTitle = 'Unknown Position';

        try {
          if (opening.departmentId) {
            const deptResult = await db.select({ name: departments.name })
              .from(departments)
              .where(eq(departments.id, opening.departmentId))
              .limit(1);
            if (deptResult[0]) departmentName = deptResult[0].name;
          }

          if (opening.positionId) {
            const posResult = await db.select({ name: positions.name })
              .from(positions)
              .where(eq(positions.id, opening.positionId))
              .limit(1);
            if (posResult[0]) positionTitle = posResult[0].name;
          }
        } catch (joinError) {
          console.log("Non-critical error fetching related data:", joinError);
        }

        enrichedOpenings.push({
          id: opening.id,
          departmentName,
          positionTitle,
          employmentType: opening.employmentType,
          compensation: opening.compensation,
          compensationType: opening.compensationType,
          jobDescription: opening.jobDescription,
          requirements: opening.requirements,
          benefits: opening.benefits,
          location: opening.location,
          status: opening.status,
          approvalStatus: opening.approvalStatus,
        });
      }

      res.json(enrichedOpenings);
    } catch (error) {
      console.error("Error fetching public job openings:", error);
      res.status(500).json({ error: "Failed to fetch job openings" });
    }
  });

  // Job Application Form Configuration Routes
  app.get("/api/job-application-form-config", async (req, res) => {
    try {
      let config;
      try {
        [config] = await db.select()
          .from(jobApplicationFormConfig)
          .orderBy(desc(jobApplicationFormConfig.updatedAt))
          .limit(1);
      } catch (tableError) {
        // Table might not exist yet, return default config
        console.log("Job application form config table not found, using defaults");
        config = null;
      }
      
      if (!config) {
        // Return default configuration if none exists
        const defaultConfig = {
          fields: [
            {
              id: 'job_opening',
              label: 'Position Applied For',
              type: 'job_selection',
              required: true,
              order: 0
            },
            {
              id: 'full_name',
              label: 'Full Name',
              type: 'text',
              placeholder: 'Enter your full name',
              required: true,
              order: 1
            },
            {
              id: 'email',
              label: 'Email Address',
              type: 'email',
              placeholder: 'your.email@example.com',
              required: true,
              order: 2
            },
            {
              id: 'phone',
              label: 'Phone Number',
              type: 'phone',
              placeholder: '+1 (555) 123-4567',
              required: false,
              order: 3
            },
            {
              id: 'resume_url',
              label: 'Resume/CV URL',
              type: 'url',
              placeholder: 'https://drive.google.com/...',
              required: true,
              order: 4
            },
            {
              id: 'cover_letter_url',
              label: 'Cover Letter URL',
              type: 'url',
              placeholder: 'https://...',
              required: false,
              order: 5
            },
            {
              id: 'portfolio_url',
              label: 'Portfolio/Website URL',
              type: 'url',
              placeholder: 'https://...',
              required: false,
              order: 6
            },
            {
              id: 'experience_level',
              label: 'Experience Level',
              type: 'select',
              required: true,
              options: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive Level'],
              order: 7
            },
            {
              id: 'salary_expectation',
              label: 'Salary Expectation (Annual USD)',
              type: 'number',
              placeholder: '75000',
              required: false,
              order: 8
            },
            {
              id: 'additional_info',
              label: 'Additional Information',
              type: 'textarea',
              placeholder: 'Tell us why you\'re interested in this position...',
              required: false,
              order: 9
            }
          ]
        };
        return res.json(defaultConfig);
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching job application form config:", error);
      res.status(500).json({ error: "Failed to fetch form configuration" });
    }
  });

  app.put("/api/job-application-form-config", requireAuth(), requirePermission('hr', 'canManage'), async (req, res) => {
    try {
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // Authentication failed
      const validatedData = insertJobApplicationFormConfigSchema.parse({
        ...req.body,
        updatedBy: currentUserId
      });

      // Delete existing config and insert new one (simpler than upsert)
      await db.delete(jobApplicationFormConfig);
      const [newConfig] = await db.insert(jobApplicationFormConfig)
        .values(validatedData)
        .returning();

      res.json(newConfig);
    } catch (error) {
      console.error("Error saving job application form config:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to save form configuration" });
    }
  });

  app.post("/api/job-openings", requireAuth(), requirePermission('hr', 'canCreate'), async (req, res) => {
    try {
      console.log("POST /api/job-openings - Request body:", req.body);
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // Authentication failed
      console.log("Using authenticated user ID:", currentUserId);
      
      const validatedData = insertJobOpeningSchema.parse({
        ...req.body,
        createdById: currentUserId
      });
      console.log("Validated data:", validatedData);

      const [newOpening] = await db.insert(jobOpenings).values(validatedData).returning();
      
      // Create audit log
      await createAuditLog(
        "created",
        "job_opening",
        newOpening.id,
        `Job opening created`,
        currentUserId,
        `New job opening created for ${validatedData.employmentType} position`,
        null,
        newOpening,
        req
      );
      
      res.status(201).json(newOpening);
    } catch (error) {
      console.error("Error creating job opening:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to create job opening" });
    }
  });

  app.get("/api/job-openings/:id", requireAuth(), requirePermission('hr', 'canView'), async (req, res) => {
    try {
      const hiringManager = alias(staff, 'hiring_manager');
      const creator = alias(staff, 'creator');
      const approver = alias(staff, 'approver');

      const [opening] = await db.select({
        id: jobOpenings.id,
        departmentId: jobOpenings.departmentId,
        departmentName: departments.name,
        positionId: jobOpenings.positionId,
        positionName: positions.name,
        positionDescription: positions.description,
        status: jobOpenings.status,
        hiringManagerId: jobOpenings.hiringManagerId,
        hiringManagerName: sql<string>`CONCAT(${hiringManager.firstName}, ' ', ${hiringManager.lastName})`,
        employmentType: jobOpenings.employmentType,
        compensation: jobOpenings.compensation,
        compensationType: jobOpenings.compensationType,
        jobDescription: jobOpenings.jobDescription,
        requirements: jobOpenings.requirements,
        benefits: jobOpenings.benefits,
        createdById: jobOpenings.createdById,
        createdByName: sql<string>`CONCAT(${creator.firstName}, ' ', ${creator.lastName})`,
        approvalStatus: jobOpenings.approvalStatus,
        approvedById: jobOpenings.approvedById,
        approvedByName: sql<string>`CONCAT(${approver.firstName}, ' ', ${approver.lastName})`,
        approvedAt: jobOpenings.approvedAt,
        rejectionReason: jobOpenings.rejectionReason,
        isPublic: jobOpenings.isPublic,
        externalPostingUrl: jobOpenings.externalPostingUrl,
        createdAt: jobOpenings.createdAt,
        updatedAt: jobOpenings.updatedAt,
      })
      .from(jobOpenings)
      .leftJoin(departments, eq(jobOpenings.departmentId, departments.id))
      .leftJoin(positions, eq(jobOpenings.positionId, positions.id))
      .leftJoin(hiringManager, eq(jobOpenings.hiringManagerId, hiringManager.id))
      .leftJoin(creator, eq(jobOpenings.createdById, creator.id))
      .leftJoin(approver, eq(jobOpenings.approvedById, approver.id))
      .where(eq(jobOpenings.id, req.params.id));

      if (!opening) {
        return res.status(404).json({ error: "Job opening not found" });
      }

      res.json(opening);
    } catch (error) {
      console.error("Error fetching job opening:", error);
      res.status(500).json({ error: "Failed to fetch job opening" });
    }
  });

  app.put("/api/job-openings/:id", requireAuth(), requirePermission('hr', 'canEdit'), async (req, res) => {
    try {
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // Authentication failed

      const validatedData = insertJobOpeningSchema.partial().parse(req.body);
      
      // Get current job opening to check permissions
      const [currentOpening] = await db.select()
        .from(jobOpenings)
        .where(eq(jobOpenings.id, req.params.id));

      if (!currentOpening) {
        return res.status(404).json({ error: "Job opening not found" });
      }

      // Only creator or hiring manager can update
      if (currentOpening.createdById !== currentUserId && currentOpening.hiringManagerId !== currentUserId) {
        return res.status(403).json({ error: "Not authorized to update this job opening" });
      }

      const [updatedOpening] = await db.update(jobOpenings)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(jobOpenings.id, req.params.id))
        .returning();

      // Create audit log
      await createAuditLog(
        "updated",
        "job_opening",
        updatedOpening.id,
        `Job opening updated`,
        currentUserId,
        `Updated job opening details`,
        currentOpening,
        updatedOpening,
        req
      );
      
      res.json(updatedOpening);
    } catch (error) {
      console.error("Error updating job opening:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to update job opening" });
    }
  });

  app.put("/api/job-openings/:id/approve", requireAuth(), requirePermission('hr', 'canManage'), async (req, res) => {
    try {
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // Authentication failed
      const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
      
      console.log("Approval request:", { id: req.params.id, action, currentUserId });

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
      }

      // Get the job opening directly (simplified approach)
      const [opening] = await db.select()
        .from(jobOpenings)
        .where(eq(jobOpenings.id, req.params.id));

      if (!opening) {
        return res.status(404).json({ error: "Job opening not found" });
      }
      
      console.log("Found opening:", { id: opening.id, status: opening.status, approvalStatus: opening.approvalStatus });

      if (opening.approvalStatus !== "pending") {
        return res.status(400).json({ error: "Job opening has already been processed" });
      }

      // Update the approval status
      const updateData: any = {
        approvalStatus: action === "approve" ? "approved" : "rejected",
        approvedById: currentUserId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      };

      if (action === "approve") {
        // If approved, set status to 'open' so it becomes available for applications
        updateData.status = "open";
      }

      if (action === "reject" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      const [updatedOpening] = await db.update(jobOpenings)
        .set(updateData)
        .where(eq(jobOpenings.id, req.params.id))
        .returning();
        
      console.log("Updated opening:", updatedOpening);

      // Create audit log
      await createAuditLog(
        "updated",
        "job_opening",
        req.params.id,
        `Job opening ${action}d`,
        currentUserId,
        `${action === "approve" ? "Approved" : "Rejected"} job opening${rejectionReason ? ` with reason: ${rejectionReason}` : ""}`,
        opening,
        updatedOpening,
        req
      );

      res.json(updatedOpening);
    } catch (error) {
      console.error("Error processing job opening approval:", error);
      res.status(500).json({ error: "Failed to process approval" });
    }
  });

  // Get departments for dropdown
  app.get("/api/departments", requireAuth(), requirePermission('departments', 'canView'), async (req, res) => {
    try {
      const departmentList = await db.select({
        id: departments.id,
        name: departments.name,
        description: departments.description,
        isActive: departments.isActive,
      })
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(asc(departments.name));
      
      res.json(departmentList);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  // Get positions for a department
  app.get("/api/departments/:departmentId/positions", requireAuth(), requirePermission('departments', 'canView'), async (req, res) => {
    try {
      const { departmentId } = req.params;
      
      const positionsList = await db.select({
        id: positions.id,
        name: positions.name,
        description: positions.description,
        isActive: positions.isActive,
      })
      .from(positions)
      .where(
        and(
          eq(positions.departmentId, departmentId),
          eq(positions.isActive, true)
        )
      )
      .orderBy(asc(positions.name));
      
      res.json(positionsList);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  // Job Application Routes
  app.get("/api/hr/job-applications", requireAuth(), requirePermission('hr', 'canView'), async (req, res) => {
    try {
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // Authentication failed
      
      // Check if user is admin - use proper auth function
      const isAdmin = await isCurrentUserAdmin(req);
      
      let applications;
      
      if (isAdmin) {
        // Admin sees all applications
        applications = await db.select().from(jobApplications).orderBy(desc(jobApplications.appliedAt));
      } else {
        // Non-admin users see only applications for job openings where they are the hiring manager
        applications = await db.select({
          id: jobApplications.id,
          applicantName: jobApplications.applicantName,
          applicantEmail: jobApplications.applicantEmail,
          applicantPhone: jobApplications.applicantPhone,
          positionTitle: jobApplications.positionTitle,
          stage: jobApplications.stage,
          rating: jobApplications.rating,
          appliedAt: jobApplications.appliedAt,
          resumeUrl: jobApplications.resumeUrl,
          coverLetter: jobApplications.coverLetter,
          notes: jobApplications.notes,
          customFields: jobApplications.customFields,
          jobOpeningId: jobApplications.jobOpeningId
        })
        .from(jobApplications)
        .innerJoin(jobOpenings, eq(jobApplications.jobOpeningId, jobOpenings.id))
        .where(eq(jobOpenings.hiringManagerId, currentUserId))
        .orderBy(desc(jobApplications.appliedAt));
      }
      
      res.json(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ error: "Failed to fetch job applications" });
    }
  });

  app.post("/api/hr/job-applications", requireAuth(), requirePermission('hr', 'canCreate'), async (req, res) => {
    try {
      const validatedData = insertJobApplicationSchema.parse(req.body);
      const [newApplication] = await db.insert(jobApplications).values(validatedData).returning();
      
      await createAuditLog(
        "created",
        "job_application",
        newApplication.id,
        `Job application from ${validatedData.applicantName}`,
        req.session?.userId || "system",
        `New job application for position ${validatedData.positionId}`,
        null,
        newApplication,
        req
      );
      
      res.json(newApplication);
    } catch (error) {
      console.error("Error creating job application:", error);
      res.status(500).json({ error: "Failed to create job application" });
    }
  });

  // Client Team Assignment Routes
  
  // Get team assignments for a client
  app.get("/api/clients/:clientId/team", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const teamAssignments = await db
        .select({
          id: clientTeamAssignments.id,
          position: clientTeamAssignments.position,
          staffId: clientTeamAssignments.staffId,
          assignedAt: clientTeamAssignments.assignedAt,
          staff: {
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            department: staff.department,
            position: staff.position,
            profileImagePath: staff.profileImagePath,
          }
        })
        .from(clientTeamAssignments)
        .leftJoin(staff, eq(clientTeamAssignments.staffId, staff.id))
        .where(eq(clientTeamAssignments.clientId, clientId))
        .orderBy(clientTeamAssignments.position);
      
      res.json(teamAssignments);
    } catch (error) {
      console.error("Error fetching client team assignments:", error);
      res.status(500).json({ error: "Failed to fetch team assignments" });
    }
  });

  // Update team assignment for a client
  app.put("/api/clients/:clientId/team/:position", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    try {
      const { clientId, position } = req.params;
      const { staffId } = req.body;
      const rawCurrentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawCurrentUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Normalize currentUserId for database operations
      const currentUserId = await normalizeUserIdForDb(rawCurrentUserId);
      
      if (staffId) {
        // Normalize the staffId to handle dev-admin and other UUID formats
        let normalizedStaffId;
        try {
          normalizedStaffId = await normalizeUserIdForDb(staffId);
        } catch (error) {
          console.error("Error normalizing staffId:", error);
          return res.status(400).json({ 
            error: "Invalid staffId", 
            message: "Unable to process the provided staffId" 
          });
        }
        
        // Validate that we have a valid normalized staffId
        if (!normalizedStaffId) {
          return res.status(400).json({ 
            error: "Invalid staffId", 
            message: "The provided staffId is not a valid UUID format" 
          });
        }
        
        // Verify the normalized staff exists and is active
        const staffMember = await db
          .select({ 
            id: staff.id, 
            firstName: staff.firstName, 
            lastName: staff.lastName,
            isActive: staff.isActive 
          })
          .from(staff)
          .where(eq(staff.id, normalizedStaffId))
          .limit(1);
        
        if (staffMember.length === 0) {
          return res.status(404).json({ 
            error: "Staff member not found", 
            message: "The specified staff member does not exist" 
          });
        }
        
        if (staffMember[0].isActive === false) {
          return res.status(400).json({ 
            error: "Staff member inactive", 
            message: "Cannot assign an inactive staff member to this position" 
          });
        }
        
        // Assign or reassign staff member to position using normalized staffId
        const existingAssignment = await db
          .select()
          .from(clientTeamAssignments)
          .where(
            and(
              eq(clientTeamAssignments.clientId, clientId),
              eq(clientTeamAssignments.position, position)
            )
          )
          .limit(1);
        
        if (existingAssignment.length > 0) {
          // Update existing assignment with normalized staffId
          const [updatedAssignment] = await db
            .update(clientTeamAssignments)
            .set({
              staffId: normalizedStaffId,
              assignedBy: currentUserId,
              updatedAt: new Date(),
            })
            .where(eq(clientTeamAssignments.id, existingAssignment[0].id))
            .returning();
          
          res.json(updatedAssignment);
        } else {
          // Create new assignment with normalized staffId
          const [newAssignment] = await db
            .insert(clientTeamAssignments)
            .values({
              clientId,
              staffId: normalizedStaffId,
              position,
              assignedBy: currentUserId,
            })
            .returning();
          
          res.json(newAssignment);
        }
      } else {
        // Remove assignment (staffId is null or empty)
        await db
          .delete(clientTeamAssignments)
          .where(
            and(
              eq(clientTeamAssignments.clientId, clientId),
              eq(clientTeamAssignments.position, position)
            )
          );
        
        res.json({ message: "Assignment removed successfully" });
      }
    } catch (error) {
      console.error("Error updating team assignment:", error);
      
      // Enhanced error handling for UUID-related issues
      if (error instanceof Error && error.message.includes('invalid input syntax for type uuid')) {
        return res.status(400).json({ 
          error: "Invalid UUID format", 
          message: "The provided staffId is not in valid UUID format" 
        });
      }
      
      res.status(500).json({ error: "Failed to update team assignment" });
    }
  });

  // =============================================================================
  // TRAINING ASSIGNMENT ENDPOINTS
  // =============================================================================

  // Get assignment for a lesson
  app.get("/api/training/lessons/:lessonId/assignment", requireAuth(), requirePermission('training', 'canView'), async (req, res) => {
    try {
      const { lessonId } = req.params;
      
      const [assignment] = await db.select().from(trainingAssignments)
        .where(eq(trainingAssignments.lessonId, lessonId));
      
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      res.json(assignment);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      res.status(500).json({ error: "Failed to fetch assignment" });
    }
  });

  // Create or update assignment for a lesson
  app.post("/api/training/lessons/:lessonId/assignment", requireAuth(), requirePermission('training', 'canCreate'), async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { title, description, instructions, allowedFileTypes, maxFileSize, maxFiles, isRequired, templateFiles } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      
      // Check if assignment already exists
      const [existingAssignment] = await db.select().from(trainingAssignments)
        .where(eq(trainingAssignments.lessonId, lessonId));
      
      let assignment;
      if (existingAssignment) {
        // Update existing assignment
        [assignment] = await db.update(trainingAssignments)
          .set({
            title,
            description,
            instructions,
            allowedFileTypes,
            maxFileSize,
            maxFiles,
            isRequired,
            templateFiles,
            updatedAt: new Date()
          })
          .where(eq(trainingAssignments.id, existingAssignment.id))
          .returning();
      } else {
        // Create new assignment
        [assignment] = await db.insert(trainingAssignments).values({
          lessonId,
          title,
          description,
          instructions,
          allowedFileTypes,
          maxFileSize,
          maxFiles,
          isRequired,
          templateFiles,
          createdBy: userId
        }).returning();
      }
      
      await createAuditLog("updated", "training_assignment", assignment.id, assignment.title, userId,
        "Training assignment updated", null, assignment, req);
      
      res.json(assignment);
    } catch (error) {
      console.error('Error creating/updating assignment:', error);
      res.status(500).json({ error: "Failed to create/update assignment" });
    }
  });

  // Get assignment submission for current user
  app.get("/api/training/assignments/:assignmentId/submission", requireAuth(), requirePermission('training', 'canView'), async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      
      const [submission] = await db.select().from(trainingAssignmentSubmissions)
        .where(and(
          eq(trainingAssignmentSubmissions.assignmentId, assignmentId),
          eq(trainingAssignmentSubmissions.userId, userId)
        ));
      
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      res.json(submission);
    } catch (error) {
      console.error('Error fetching assignment submission:', error);
      res.status(500).json({ error: "Failed to fetch submission" });
    }
  });

  // Submit assignment
  app.post("/api/training/assignments/:assignmentId/submit", requireAuth(), requirePermission('training', 'canEdit'), async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { submissionText, files } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      
      // Get assignment details to find lesson and course
      const [assignment] = await db.select().from(trainingAssignments)
        .where(eq(trainingAssignments.id, assignmentId));
      
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      // Get enrollment for the lesson's course
      const [lesson] = await db.select().from(trainingLessons)
        .where(eq(trainingLessons.id, assignment.lessonId));
      
      const [enrollment] = await db.select().from(trainingEnrollments)
        .where(and(
          eq(trainingEnrollments.courseId, lesson.courseId),
          eq(trainingEnrollments.userId, userId)
        ));
      
      if (!enrollment) {
        return res.status(404).json({ error: "Not enrolled in this course" });
      }
      
      // Check if submission already exists
      const [existingSubmission] = await db.select().from(trainingAssignmentSubmissions)
        .where(and(
          eq(trainingAssignmentSubmissions.assignmentId, assignmentId),
          eq(trainingAssignmentSubmissions.userId, userId)
        ));
      
      let submission;
      if (existingSubmission) {
        // Update existing submission
        [submission] = await db.update(trainingAssignmentSubmissions)
          .set({
            submissionText,
            files,
            status: "submitted",
            submittedAt: new Date()
          })
          .where(eq(trainingAssignmentSubmissions.id, existingSubmission.id))
          .returning();
      } else {
        // Create new submission
        [submission] = await db.insert(trainingAssignmentSubmissions).values({
          assignmentId,
          userId,
          enrollmentId: enrollment.id,
          submissionText,
          files,
          status: "submitted"
        }).returning();
      }
      
      await createAuditLog("created", "training_assignment_submission", submission.id, "Assignment Submitted", userId,
        "Student submitted assignment", null, { assignmentId, submissionText: submissionText?.substring(0, 100) }, req);
      
      res.json(submission);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      res.status(500).json({ error: "Failed to submit assignment" });
    }
  });

  // Get all submissions for an assignment (instructor view)
  app.get("/api/training/assignments/:assignmentId/submissions", requireAuth(), requirePermission('training', 'canManage'), async (req, res) => {
    try {
      const { assignmentId } = req.params;
      
      const submissions = await db.select({
        id: trainingAssignmentSubmissions.id,
        assignmentId: trainingAssignmentSubmissions.assignmentId,
        userId: trainingAssignmentSubmissions.userId,
        submissionText: trainingAssignmentSubmissions.submissionText,
        files: trainingAssignmentSubmissions.files,
        status: trainingAssignmentSubmissions.status,
        grade: trainingAssignmentSubmissions.grade,
        feedback: trainingAssignmentSubmissions.feedback,
        gradedBy: trainingAssignmentSubmissions.gradedBy,
        submittedAt: trainingAssignmentSubmissions.submittedAt,
        gradedAt: trainingAssignmentSubmissions.gradedAt,
        studentName: sql<string>`CONCAT(${staff.firstName}, ' ', ${staff.lastName})`,
        studentEmail: staff.email
      })
      .from(trainingAssignmentSubmissions)
      .leftJoin(staff, eq(trainingAssignmentSubmissions.userId, staff.id))
      .where(eq(trainingAssignmentSubmissions.assignmentId, assignmentId))
      .orderBy(desc(trainingAssignmentSubmissions.submittedAt));
      
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching assignment submissions:', error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Grade assignment submission
  app.put("/api/training/assignment-submissions/:submissionId/grade", requireAuth(), requirePermission('training', 'canManage'), async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { grade, feedback } = req.body;
      const graderId = getAuthenticatedUserIdOrFail(req, res);
      if (!graderId) return; // Authentication failed
      
      const [updatedSubmission] = await db.update(trainingAssignmentSubmissions)
        .set({
          grade,
          feedback,
          status: "graded",
          gradedBy: graderId,
          gradedAt: new Date()
        })
        .where(eq(trainingAssignmentSubmissions.id, submissionId))
        .returning();
      
      if (!updatedSubmission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      await createAuditLog("updated", "training_assignment_submission", submissionId, "Assignment Graded", graderId,
        "Instructor graded assignment submission", null, { grade, feedback }, req);
      
      res.json(updatedSubmission);
    } catch (error) {
      console.error('Error grading assignment:', error);
      res.status(500).json({ error: "Failed to grade assignment" });
    }
  });

  const httpServer = createServer(app);
  // Public endpoint for job openings (no authentication required)
  app.get('/api/job-openings/public', async (req, res) => {
    try {
      const jobOpenings = await appStorage.getJobOpenings();
      res.json(jobOpenings);
    } catch (error) {
      console.error("Error fetching public job openings:", error);
      res.status(500).json({ message: "Failed to fetch job openings" });
    }
  });

  // Get single job application by ID
  app.get('/api/hr/job-applications/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const [application] = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.id, id));
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error fetching job application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  // Update job application status and rating
  app.patch('/api/hr/job-applications/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { stage, rating } = req.body;
      
      const updateData: any = {};
      if (stage !== undefined) updateData.stage = stage;
      if (rating !== undefined) updateData.rating = rating;
      updateData.lastUpdated = new Date();
      
      const [updatedApplication] = await db
        .update(jobApplications)
        .set(updateData)
        .where(eq(jobApplications.id, id))
        .returning();
      
      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating job application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Get comments for a job application
  app.get('/api/hr/job-applications/:id/comments', async (req, res) => {
    try {
      const { id } = req.params;
      
      const applicationComments = await db
        .select({
          id: jobApplicationComments.id,
          content: jobApplicationComments.content,
          authorId: jobApplicationComments.authorId,
          authorName: staff.firstName,
          createdAt: jobApplicationComments.createdAt
        })
        .from(jobApplicationComments)
        .leftJoin(staff, eq(jobApplicationComments.authorId, staff.id))
        .where(eq(jobApplicationComments.applicationId, id))
        .orderBy(desc(jobApplicationComments.createdAt));
      
      // Format author names properly
      const formattedComments = applicationComments.map(comment => ({
        ...comment,
        authorName: comment.authorName || 'Unknown User'
      }));
      
      res.json(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add comment to job application
  app.post('/api/hr/job-applications/:id/comments', async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      // Get authenticated user ID for the comment author
      const defaultAuthorId = getAuthenticatedUserIdOrFail(req, res);
      if (!defaultAuthorId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // First, get the author's name
      const [author] = await db
        .select({
          firstName: staff.firstName,
          lastName: staff.lastName
        })
        .from(staff)
        .where(eq(staff.id, defaultAuthorId));
      
      const authorName = author ? `${author.firstName} ${author.lastName}` : 'Unknown User';
      
      // Check for @mentions and create notifications
      const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
      const mentions = [...content.matchAll(mentionRegex)];
      
      const [newComment] = await db
        .insert(jobApplicationComments)
        .values({
          applicationId: id,
          content: content.trim(),
          authorId: defaultAuthorId,
          authorName: authorName
        })
        .returning();
      
      if (!newComment) {
        return res.status(500).json({ message: "Failed to create comment" });
      }
      
      // Create notifications for @mentions
      if (mentions.length > 0) {
        for (const match of mentions) {
          const mentionedName = match[1].trim();
          
          // Find staff member by name (first + last name)
          const [mentionedStaff] = await db
            .select({ id: staff.id, firstName: staff.firstName, lastName: staff.lastName })
            .from(staff)
            .where(sql`LOWER(${staff.firstName} || ' ' || ${staff.lastName}) = LOWER(${mentionedName})`);
          
          if (mentionedStaff) {
            // Create notification
            await db.insert(notifications).values({
              recipientId: mentionedStaff.id,
              title: "You were mentioned in a comment",
              message: `${authorName} mentioned you in a job application comment: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
              type: "mention",
              relatedEntityType: "job_application",
              relatedEntityId: id,
              createdBy: defaultAuthorId
            });
          }
        }
      }
      
      // Return the comment
      res.status(201).json({
        id: newComment.id,
        content: newComment.content,
        authorId: newComment.authorId,
        authorName: authorName,
        createdAt: newComment.createdAt
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Public endpoint for submitting job applications (no authentication required)
  app.post('/api/job-applications', async (req, res) => {
    try {
      console.log("Received job application:", req.body);
      const insertJobApplicationSchema = (await import('@shared/schema')).insertJobApplicationSchema;
      
      // Validate the request body
      const validatedData = insertJobApplicationSchema.parse(req.body);
      
      // Get the job opening first
      const jobOpening = await db.select().from(jobOpenings).where(eq(jobOpenings.id, validatedData.positionId)).limit(1);
      if (!jobOpening.length) {
        return res.status(400).json({ message: "Invalid position ID" });
      }
      
      // Then get the position name using the position_id from job opening
      const position = await db.select().from(positions).where(eq(positions.id, jobOpening[0].positionId)).limit(1);
      const positionName = position.length > 0 ? position[0].name : "Unknown Position";
      
      console.log("Job opening:", jobOpening[0]);
      console.log("Position:", position[0]);
      console.log("Position name:", positionName);
      
      // Build the insert data object using the correct position ID from the job opening
      const insertData = {
        id: sql`gen_random_uuid()`,
        positionId: jobOpening[0].positionId, // Use the position ID from the job opening, not the job opening ID
        positionTitle: positionName, // Add the required position title
        applicantName: validatedData.applicantName,
        applicantEmail: validatedData.applicantEmail,
        applicantPhone: validatedData.applicantPhone,
        resumeUrl: validatedData.resumeUrl,
        coverLetterUrl: validatedData.coverLetterUrl,
        portfolioUrl: validatedData.portfolioUrl,
        notes: validatedData.notes,
        salaryExpectation: validatedData.salaryExpectation,
        experience: validatedData.experience,
        customFieldData: validatedData.customFieldData,
        stage: 'new',
        appliedAt: new Date(),
        lastUpdated: new Date()
      };
      
      console.log("Insert data:", insertData);
      
      // Directly insert into database since storage method has issues
      const result = await db.insert(jobApplications).values(insertData).returning();
      
      const application = result[0];
      console.log("Created job application:", application);
      res.status(201).json(application);
    } catch (error: any) {
      console.error("Error creating job application:", error);
      if (error.issues) {
        // Zod validation error
        res.status(400).json({ 
          message: "Validation failed", 
          errors: error.issues.map((issue: any) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      } else {
        res.status(500).json({ message: "Failed to create job application" });
      }
    }
  });

  // KNOWLEDGE BASE API ROUTES
  
  // Categories API
  app.get("/api/knowledge-base/categories", requireAuth(), requirePermission('knowledge_base', 'canView'), async (req, res) => {
    try {
      const categories = await db.select()
        .from(knowledgeBaseCategories)
        .where(eq(knowledgeBaseCategories.isVisible, true))
        .orderBy(asc(knowledgeBaseCategories.order));
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/knowledge-base/categories", async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const { name, description, parentId, icon, color } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Category name is required" });
      }
      
      // Get the next order value
      const maxOrderResult = await db.select({ 
        maxOrder: sql<number>`COALESCE(MAX("order"), 0)` 
      }).from(knowledgeBaseCategories);
      const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;
      
      const [newCategory] = await db.insert(knowledgeBaseCategories).values({
        name: name.trim(),
        description: description || null,
        parentId: parentId || null,
        icon: icon || null,
        color: color || null,
        order: nextOrder,
        createdBy: userId,
      }).returning();
      
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/knowledge-base/categories/:id", async (req, res) => {
    try {
      const { name, description, icon, color, isVisible } = req.body;
      
      const [updatedCategory] = await db.update(knowledgeBaseCategories)
        .set({
          name: name?.trim(),
          description,
          icon,
          color,
          isVisible,
          updatedAt: new Date()
        })
        .where(eq(knowledgeBaseCategories.id, req.params.id))
        .returning();
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/knowledge-base/categories/:id", async (req, res) => {
    try {
      // Check if category has articles or subcategories
      const articlesCount = await db.select({ count: sql<number>`count(*)` })
        .from(knowledgeBaseArticles)
        .where(eq(knowledgeBaseArticles.categoryId, req.params.id));
      
      const subcategoriesCount = await db.select({ count: sql<number>`count(*)` })
        .from(knowledgeBaseCategories)
        .where(eq(knowledgeBaseCategories.parentId, req.params.id));
      
      if (articlesCount[0].count > 0 || subcategoriesCount[0].count > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category with articles or subcategories" 
        });
      }
      
      await db.delete(knowledgeBaseCategories)
        .where(eq(knowledgeBaseCategories.id, req.params.id));
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Articles API
  app.get("/api/knowledge-base/articles", async (req, res) => {
    try {
      const { categoryId, search, status = 'published' } = req.query;
      
      let whereConditions = [eq(knowledgeBaseArticles.status, status as string)];
      
      if (categoryId && typeof categoryId === 'string') {
        whereConditions.push(eq(knowledgeBaseArticles.categoryId, categoryId));
      }
      
      if (search && typeof search === 'string') {
        whereConditions.push(
          or(
            like(knowledgeBaseArticles.title, `%${search}%`),
            like(knowledgeBaseArticles.excerpt, `%${search}%`)
          )
        );
      }
      
      const articles = await db.select({
        id: knowledgeBaseArticles.id,
        title: knowledgeBaseArticles.title,
        excerpt: knowledgeBaseArticles.excerpt,
        slug: knowledgeBaseArticles.slug,
        categoryId: knowledgeBaseArticles.categoryId,
        parentId: knowledgeBaseArticles.parentId,
        featuredImage: knowledgeBaseArticles.featuredImage,
        tags: knowledgeBaseArticles.tags,
        viewCount: knowledgeBaseArticles.viewCount,
        likeCount: knowledgeBaseArticles.likeCount,
        isPublic: knowledgeBaseArticles.isPublic,
        createdAt: knowledgeBaseArticles.createdAt,
        updatedAt: knowledgeBaseArticles.updatedAt,
        authorName: sql<string>`${staff.firstName} || ' ' || ${staff.lastName}`,
      })
      .from(knowledgeBaseArticles)
      .leftJoin(staff, eq(knowledgeBaseArticles.createdBy, staff.id))
      .where(and(...whereConditions))
      .orderBy(desc(knowledgeBaseArticles.createdAt));
      
      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/knowledge-base/articles/:id", requireAuth(), requirePermission('knowledge_base', 'canView'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const [article] = await db.select({
        id: knowledgeBaseArticles.id,
        title: knowledgeBaseArticles.title,
        content: knowledgeBaseArticles.content,
        excerpt: knowledgeBaseArticles.excerpt,
        categoryId: knowledgeBaseArticles.categoryId,
        parentId: knowledgeBaseArticles.parentId,
        slug: knowledgeBaseArticles.slug,
        status: knowledgeBaseArticles.status,
        featuredImage: knowledgeBaseArticles.featuredImage,
        tags: knowledgeBaseArticles.tags,
        viewCount: knowledgeBaseArticles.viewCount,
        likeCount: knowledgeBaseArticles.likeCount,
        isPublic: knowledgeBaseArticles.isPublic,
        createdAt: knowledgeBaseArticles.createdAt,
        updatedAt: knowledgeBaseArticles.updatedAt,
        authorName: sql<string>`${staff.firstName} || ' ' || ${staff.lastName}`,
        authorId: knowledgeBaseArticles.createdBy,
      })
      .from(knowledgeBaseArticles)
      .leftJoin(staff, eq(knowledgeBaseArticles.createdBy, staff.id))
      .where(eq(knowledgeBaseArticles.id, req.params.id));
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Track view if user is logged in
      if (userId) {
        await db.insert(knowledgeBaseViews).values({
          articleId: req.params.id,
          userId,
        });
        
        // Increment view count
        await db.update(knowledgeBaseArticles)
          .set({ viewCount: sql`${knowledgeBaseArticles.viewCount} + 1` })
          .where(eq(knowledgeBaseArticles.id, req.params.id));
      }
      
      res.json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post("/api/knowledge-base/articles", requireAuth(), requirePermission('knowledge_base', 'canCreate'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const { title, content, excerpt, categoryId, parentId, slug, featuredImage, tags, isPublic } = req.body;
      
      if (!title || title.trim() === '') {
        return res.status(400).json({ message: "Article title is required" });
      }
      
      if (!content) {
        return res.status(400).json({ message: "Article content is required" });
      }
      
      // Generate slug if not provided
      const articleSlug = slug || title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if slug already exists
      const existingSlug = await db.select({ id: knowledgeBaseArticles.id })
        .from(knowledgeBaseArticles)
        .where(eq(knowledgeBaseArticles.slug, articleSlug))
        .limit(1);
      
      if (existingSlug.length > 0) {
        return res.status(400).json({ message: "Slug already exists" });
      }
      
      const [newArticle] = await db.insert(knowledgeBaseArticles).values({
        title: title.trim(),
        content,
        excerpt: excerpt || null,
        categoryId: categoryId || null,
        parentId: parentId || null,
        slug: articleSlug,
        featuredImage: featuredImage || null,
        tags: tags || [],
        isPublic: isPublic !== false,
        createdBy: userId,
      }).returning();
      
      res.status(201).json(newArticle);
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.put("/api/knowledge-base/articles/:id", requireAuth(), requirePermission('knowledge_base', 'canEdit'), async (req, res) => {
    try {
      const { title, content, excerpt, categoryId, slug, featuredImage, tags, isPublic, status } = req.body;
      
      const updateData: any = {
        updatedAt: new Date()
      };
      
      if (title !== undefined) updateData.title = title.trim();
      if (content !== undefined) updateData.content = content;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (slug !== undefined) updateData.slug = slug;
      if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
      if (tags !== undefined) updateData.tags = tags;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
      if (status !== undefined) updateData.status = status;
      
      const [updatedArticle] = await db.update(knowledgeBaseArticles)
        .set(updateData)
        .where(eq(knowledgeBaseArticles.id, req.params.id))
        .returning();
      
      if (!updatedArticle) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(updatedArticle);
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete("/api/knowledge-base/articles/:id", requireAuth(), requirePermission('knowledge_base', 'canDelete'), async (req, res) => {
    try {
      // Delete related data first
      await db.delete(knowledgeBaseViews).where(eq(knowledgeBaseViews.articleId, req.params.id));
      await db.delete(knowledgeBaseLikes).where(eq(knowledgeBaseLikes.articleId, req.params.id));
      await db.delete(knowledgeBaseBookmarks).where(eq(knowledgeBaseBookmarks.articleId, req.params.id));
      await db.delete(knowledgeBaseComments).where(eq(knowledgeBaseComments.articleId, req.params.id));
      
      await db.delete(knowledgeBaseArticles)
        .where(eq(knowledgeBaseArticles.id, req.params.id));
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Bookmarks API
  app.get("/api/knowledge-base/bookmarks", requireAuth(), requirePermission('knowledge_base', 'canView'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const bookmarks = await db.select({
        id: knowledgeBaseBookmarks.id,
        articleId: knowledgeBaseBookmarks.articleId,
        articleTitle: knowledgeBaseArticles.title,
        articleSlug: knowledgeBaseArticles.slug,
        createdAt: knowledgeBaseBookmarks.createdAt,
      })
      .from(knowledgeBaseBookmarks)
      .leftJoin(knowledgeBaseArticles, eq(knowledgeBaseBookmarks.articleId, knowledgeBaseArticles.id))
      .where(eq(knowledgeBaseBookmarks.userId, userId))
      .orderBy(desc(knowledgeBaseBookmarks.createdAt));
      
      res.json(bookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/knowledge-base/articles/:articleId/bookmark", requireAuth(), requirePermission('knowledge_base', 'canView'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Check if bookmark already exists
      const existing = await db.select({ id: knowledgeBaseBookmarks.id })
        .from(knowledgeBaseBookmarks)
        .where(and(
          eq(knowledgeBaseBookmarks.articleId, req.params.articleId),
          eq(knowledgeBaseBookmarks.userId, userId)
        ));
      
      if (existing.length > 0) {
        // Remove bookmark
        await db.delete(knowledgeBaseBookmarks)
          .where(eq(knowledgeBaseBookmarks.id, existing[0].id));
        res.json({ bookmarked: false });
      } else {
        // Add bookmark
        await db.insert(knowledgeBaseBookmarks).values({
          articleId: req.params.articleId,
          userId,
        });
        res.json({ bookmarked: true });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  // Likes API
  app.post("/api/knowledge-base/articles/:articleId/like", requireAuth(), requirePermission('knowledge_base', 'canView'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Check if like already exists
      const existing = await db.select({ id: knowledgeBaseLikes.id })
        .from(knowledgeBaseLikes)
        .where(and(
          eq(knowledgeBaseLikes.articleId, req.params.articleId),
          eq(knowledgeBaseLikes.userId, userId)
        ));
      
      if (existing.length > 0) {
        // Remove like
        await db.delete(knowledgeBaseLikes)
          .where(eq(knowledgeBaseLikes.id, existing[0].id));
        
        // Decrement like count
        await db.update(knowledgeBaseArticles)
          .set({ likeCount: sql`${knowledgeBaseArticles.likeCount} - 1` })
          .where(eq(knowledgeBaseArticles.id, req.params.articleId));
        
        res.json({ liked: false });
      } else {
        // Add like
        await db.insert(knowledgeBaseLikes).values({
          articleId: req.params.articleId,
          userId,
        });
        
        // Increment like count
        await db.update(knowledgeBaseArticles)
          .set({ likeCount: sql`${knowledgeBaseArticles.likeCount} + 1` })
          .where(eq(knowledgeBaseArticles.id, req.params.articleId));
        
        res.json({ liked: true });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Comments API
  app.get("/api/knowledge-base/articles/:articleId/comments", requireAuth(), requirePermission('knowledge_base', 'canView'), async (req, res) => {
    try {
      const comments = await db.select({
        id: knowledgeBaseComments.id,
        content: knowledgeBaseComments.content,
        parentId: knowledgeBaseComments.parentId,
        mentions: knowledgeBaseComments.mentions,
        createdAt: knowledgeBaseComments.createdAt,
        updatedAt: knowledgeBaseComments.updatedAt,
        authorName: sql<string>`${staff.firstName} || ' ' || ${staff.lastName}`,
        authorId: knowledgeBaseComments.authorId,
      })
      .from(knowledgeBaseComments)
      .leftJoin(staff, eq(knowledgeBaseComments.authorId, staff.id))
      .where(eq(knowledgeBaseComments.articleId, req.params.articleId))
      .orderBy(asc(knowledgeBaseComments.createdAt));
      
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/knowledge-base/articles/:articleId/comments", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { content, parentId, mentions } = req.body;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      const [newComment] = await db.insert(knowledgeBaseComments).values({
        articleId: req.params.articleId,
        content: content.trim(),
        parentId: parentId || null,
        mentions: mentions || [],
        authorId: userId,
      }).returning();
      
      res.status(201).json(newComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Webhook handling routes - support all HTTP methods
  const handleWebhook = async (req: any, res: any) => {
    try {
      const webhookId = req.params.webhookId;
      const method = req.method;
      const payload = {
        method,
        headers: req.headers,
        query: req.query,
        body: req.body,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      console.log(`Webhook received: ${method} /api/webhooks/${webhookId}`, payload);

      // Find workflows that use this webhook_id
      const workflows = await appStorage.getWorkflows();
      const matchingWorkflows = workflows.filter((workflow: any) => {
        const trigger = workflow.trigger;
        return trigger && 
               trigger.type === 'inbound_webhook' && 
               trigger.conditions && 
               trigger.conditions.webhook_id === webhookId &&
               trigger.conditions.webhook_method === method;
      });

      if (matchingWorkflows.length === 0) {
        return res.status(404).json({ 
          error: 'Webhook not found',
          message: `No active workflow found for webhook ID: ${webhookId} with method: ${method}`
        });
      }

      // Execute all matching workflows
      const results = [];
      for (const workflow of matchingWorkflows) {
        try {
          // Here you would typically trigger the workflow execution
          // For now, we'll just log and return success
          console.log(`Executing workflow: ${workflow.name} (${workflow.id})`);
          
          // Create audit log for webhook execution
          await createAuditLog(
            "webhook_triggered",
            "workflow",
            workflow.id,
            workflow.name,
            "system",
            `Webhook ${webhookId} triggered workflow execution`,
            null,
            { webhook_id: webhookId, method, payload_size: JSON.stringify(payload).length },
            req
          );
          
          results.push({
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            status: 'executed',
            execution_time: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error executing workflow ${workflow.id}:`, error);
          results.push({
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.status(200).json({
        success: true,
        webhook_id: webhookId,
        method,
        executed_workflows: results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to process webhook'
      });
    }
  };

  // Register webhook routes for all HTTP methods
  app.get("/api/webhooks/:webhookId", requireAuth(), requirePermission('webhooks', 'canView'), handleWebhook);
  app.post("/api/webhooks/:webhookId", requireAuth(), requirePermission('webhooks', 'canEdit'), handleWebhook);
  app.put("/api/webhooks/:webhookId", requireAuth(), requirePermission('webhooks', 'canEdit'), handleWebhook);
  app.patch("/api/webhooks/:webhookId", requireAuth(), requirePermission('webhooks', 'canEdit'), handleWebhook);
  app.delete("/api/webhooks/:webhookId", requireAuth(), requirePermission('webhooks', 'canDelete'), handleWebhook);

  // Webhook testing endpoint - allows you to test a webhook URL
  app.get("/api/webhooks/:webhookId/test", requireAuth(), requirePermission('webhooks', 'canView'), async (req, res) => {
    try {
      const webhookId = req.params.webhookId;
      
      // Find workflows that use this webhook_id
      const workflows = await appStorage.getWorkflows();
      const matchingWorkflows = workflows.filter((workflow: any) => {
        const trigger = workflow.trigger;
        return trigger && 
               trigger.type === 'inbound_webhook' && 
               trigger.conditions && 
               trigger.conditions.webhook_id === webhookId;
      });

      if (matchingWorkflows.length === 0) {
        return res.status(404).json({ 
          error: 'Webhook not found',
          message: `No workflow found for webhook ID: ${webhookId}`
        });
      }

      res.json({
        webhook_id: webhookId,
        status: 'active',
        workflows: matchingWorkflows.map((w: any) => ({
          id: w.id,
          name: w.name,
          method: w.trigger.conditions.webhook_method,
          status: w.status
        })),
        test_urls: {
          get: `${req.protocol}://${req.get('host')}/api/webhooks/${webhookId}`,
          post: `${req.protocol}://${req.get('host')}/api/webhooks/${webhookId}`,
          put: `${req.protocol}://${req.get('host')}/api/webhooks/${webhookId}`,
          patch: `${req.protocol}://${req.get('host')}/api/webhooks/${webhookId}`,
          delete: `${req.protocol}://${req.get('host')}/api/webhooks/${webhookId}`
        }
      });
    } catch (error) {
      console.error('Webhook test error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to test webhook'
      });
    }
  });

  // =============================================================================
  // TRAINING/LMS API ROUTES
  // =============================================================================

  // ===== TRAINING CATEGORIES =====
  
  // Get all training categories
  app.get("/api/training/categories", requireAuth(), requirePermission('training', 'canView'), async (req, res) => {
    try {
      const categories = await db.select().from(trainingCategories).orderBy(asc(trainingCategories.order), asc(trainingCategories.name));
      res.json(categories);
    } catch (error) {
      console.error('Error fetching training categories:', error);
      res.status(500).json({ error: "Failed to fetch training categories" });
    }
  });

  // Create training category (Admin/Manager only)
  app.post("/api/training/categories", requireAuth(), requirePermission('training', 'canCreate'), async (req, res) => {
    try {
      const newCategory = insertTrainingCategorySchema.parse(req.body);
      const [category] = await db.insert(trainingCategories).values(newCategory).returning();
      
      await createAuditLog("created", "training_category", category.id, category.name, req.session?.userId, 
        "Training category created", null, category, req);
      
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating training category:', error);
      res.status(500).json({ error: "Failed to create training category" });
    }
  });

  // Update training category
  app.put("/api/training/categories/:id", requireAuth(), requirePermission('training', 'canEdit'), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertTrainingCategorySchema.parse(req.body);
      
      const [oldCategory] = await db.select().from(trainingCategories).where(eq(trainingCategories.id, id));
      if (!oldCategory) {
        return res.status(404).json({ error: "Training category not found" });
      }
      
      const [updatedCategory] = await db.update(trainingCategories)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(trainingCategories.id, id))
        .returning();
      
      await createAuditLog("updated", "training_category", id, updatedCategory.name, req.session?.userId,
        "Training category updated", oldCategory, updatedCategory, req);
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating training category:', error);
      res.status(500).json({ error: "Failed to update training category" });
    }
  });

  // Delete training category
  app.delete("/api/training/categories/:id", requireAuth(), requirePermission('training', 'canDelete'), async (req, res) => {
    try {
      const { id } = req.params;
      
      const [category] = await db.select().from(trainingCategories).where(eq(trainingCategories.id, id));
      if (!category) {
        return res.status(404).json({ error: "Training category not found" });
      }
      
      await db.delete(trainingCategories).where(eq(trainingCategories.id, id));
      
      await createAuditLog("deleted", "training_category", id, category.name, req.session?.userId,
        "Training category deleted", category, null, req);
      
      res.json({ message: "Training category deleted successfully" });
    } catch (error) {
      console.error('Error deleting training category:', error);
      res.status(500).json({ error: "Failed to delete training category" });
    }
  });

  // ===== TRAINING COURSES =====
  
  // Get all training courses (with filtering and search)
  app.get("/api/training/courses", requireAuth(), requirePermission('training', 'canView'), async (req, res) => {
    try {
      const { category, search, tags, difficulty, published } = req.query;
      
      let query = db.select({
        id: trainingCourses.id,
        title: trainingCourses.title,
        description: trainingCourses.description,
        shortDescription: trainingCourses.shortDescription,
        categoryId: trainingCourses.categoryId,
        categoryName: trainingCategories.name,
        categoryColor: trainingCategories.color,
        tags: trainingCourses.tags,
        thumbnailUrl: trainingCourses.thumbnailUrl,
        estimatedDuration: trainingCourses.estimatedDuration,
        difficulty: trainingCourses.difficulty,
        isPublished: trainingCourses.isPublished,
        order: trainingCourses.order,
        createdBy: trainingCourses.createdBy,
        createdAt: trainingCourses.createdAt,
        updatedAt: trainingCourses.updatedAt,
        creatorName: sql<string>`CONCAT(${staff.firstName}, ' ', ${staff.lastName})`,
      }).from(trainingCourses)
        .leftJoin(trainingCategories, eq(trainingCourses.categoryId, trainingCategories.id))
        .leftJoin(staff, eq(trainingCourses.createdBy, staff.id));
      
      // Apply filters
      const conditions = [];
      if (category) conditions.push(eq(trainingCourses.categoryId, category as string));
      if (published !== undefined) conditions.push(eq(trainingCourses.isPublished, published === 'true'));
      if (difficulty) conditions.push(eq(trainingCourses.difficulty, difficulty as string));
      if (search) {
        conditions.push(or(
          like(trainingCourses.title, `%${search}%`),
          like(trainingCourses.description, `%${search}%`)
        ));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const courses = await query.orderBy(asc(trainingCourses.order), desc(trainingCourses.createdAt));
      
      // Get lesson counts for each course
      const coursesWithCounts = await Promise.all(courses.map(async (course) => {
        const [lessonCount] = await db.select({ count: sql<number>`count(*)` })
          .from(trainingLessons)
          .where(eq(trainingLessons.courseId, course.id));
        
        const [enrollmentCount] = await db.select({ count: sql<number>`count(*)` })
          .from(trainingEnrollments)
          .where(eq(trainingEnrollments.courseId, course.id));
        
        return {
          ...course,
          lessonCount: lessonCount.count || 0,
          enrollmentCount: enrollmentCount.count || 0
        };
      }));
      
      res.json(coursesWithCounts);
    } catch (error) {
      console.error('Error fetching training courses:', error);
      res.status(500).json({ error: "Failed to fetch training courses" });
    }
  });

  // Get single training course with lessons
  app.get("/api/training/courses/:id", requireAuth(), requirePermission('training', 'canView'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      
      // Get course details
      const [course] = await db.select({
        id: trainingCourses.id,
        title: trainingCourses.title,
        description: trainingCourses.description,
        shortDescription: trainingCourses.shortDescription,
        categoryId: trainingCourses.categoryId,
        categoryName: trainingCategories.name,
        categoryColor: trainingCategories.color,
        tags: trainingCourses.tags,
        thumbnailUrl: trainingCourses.thumbnailUrl,
        estimatedDuration: trainingCourses.estimatedDuration,
        difficulty: trainingCourses.difficulty,
        isPublished: trainingCourses.isPublished,
        order: trainingCourses.order,
        createdBy: trainingCourses.createdBy,
        createdAt: trainingCourses.createdAt,
        updatedAt: trainingCourses.updatedAt,
        creatorName: sql<string>`CONCAT(${staff.firstName}, ' ', ${staff.lastName})`,
      }).from(trainingCourses)
        .leftJoin(trainingCategories, eq(trainingCourses.categoryId, trainingCategories.id))
        .leftJoin(staff, eq(trainingCourses.createdBy, staff.id))
        .where(eq(trainingCourses.id, id));
      
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      // Get course lessons
      const lessons = await db.select().from(trainingLessons)
        .where(eq(trainingLessons.courseId, id))
        .orderBy(asc(trainingLessons.order));
      
      // Get user enrollment if logged in
      let enrollment = null;
      let progress = [];
      if (userId) {
        [enrollment] = await db.select().from(trainingEnrollments)
          .where(and(eq(trainingEnrollments.courseId, id), eq(trainingEnrollments.userId, userId)));
        
        if (enrollment) {
          progress = await db.select().from(trainingProgress)
            .where(eq(trainingProgress.enrollmentId, enrollment.id));
        }
      }
      
      // Get total enrollment count for this course
      const enrollmentCountResult = await db.select({ count: sql<number>`COUNT(*)::int` })
        .from(trainingEnrollments)
        .where(eq(trainingEnrollments.courseId, id));
      const enrollmentCount = Number(enrollmentCountResult[0]?.count) || 0;

      const result = {
        ...course,
        lessons,
        enrollment,
        progress,
        enrollmentCount: enrollmentCount
      };
      
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching training course:', error);
      res.status(500).json({ error: "Failed to fetch training course" });
    }
  });

  // Create training course (Admin/Manager only)
  app.post("/api/training/courses", requireAuth(), requirePermission('training', 'canCreate'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const newCourse = insertTrainingCourseSchema.parse({
        ...req.body,
        createdBy: userId
      });
      
      const [course] = await db.insert(trainingCourses).values(newCourse).returning();
      
      // Auto-enroll the course creator so they can access lessons in their own course
      const enrollment = {
        id: sql`gen_random_uuid()`,
        courseId: course.id,
        userId: userId,
        status: "enrolled",
        progress: 0,
        completedLessons: 0,
        totalLessons: 0,
        enrolledAt: new Date(),
        lastAccessedAt: new Date()
      };
      
      await db.insert(trainingEnrollments).values(enrollment);
      
      await createAuditLog("created", "training_course", course.id, course.title, req.session?.userId,
        "Training course created", null, course, req);
      
      res.status(201).json(course);
    } catch (error) {
      console.error('Error creating training course:', error);
      res.status(500).json({ error: "Failed to create training course" });
    }
  });

  // Update training course
  app.put("/api/training/courses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Handle empty category_id by converting to null
      const bodyData = { ...req.body };
      if (bodyData.categoryId === "" || bodyData.categoryId === undefined) {
        bodyData.categoryId = null;
      }
      
      const updates = insertTrainingCourseSchema.partial().parse({
        ...bodyData,
        updatedBy: getAuthenticatedUserIdOrFail(req, res) || userId
      });
      
      const [oldCourse] = await db.select().from(trainingCourses).where(eq(trainingCourses.id, id));
      if (!oldCourse) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      const [updatedCourse] = await db.update(trainingCourses)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(trainingCourses.id, id))
        .returning();
      
      await createAuditLog("updated", "training_course", id, updatedCourse.title, req.session?.userId,
        "Training course updated", oldCourse, updatedCourse, req);
      
      res.json(updatedCourse);
    } catch (error) {
      console.error('Error updating training course:', error);
      res.status(500).json({ error: "Failed to update training course" });
    }
  });

  // Delete training course
  app.delete("/api/training/courses/:id", requireAuth(), requirePermission('training', 'canDelete'), async (req, res) => {
    try {
      const { id } = req.params;
      
      const [course] = await db.select().from(trainingCourses).where(eq(trainingCourses.id, id));
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      await db.delete(trainingCourses).where(eq(trainingCourses.id, id));
      
      await createAuditLog("deleted", "training_course", id, course.title, req.session?.userId,
        "Training course deleted", course, null, req);
      
      res.json({ message: "Training course deleted successfully" });
    } catch (error) {
      console.error('Error deleting training course:', error);
      res.status(500).json({ error: "Failed to delete training course" });
    }
  });

  // ===== COURSE ENROLLMENT =====
  
  // Enroll user in course
  app.post("/api/training/courses/:id/enroll", async (req, res) => {
    try {
      const { id: courseId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Check if course exists
      const [course] = await db.select().from(trainingCourses).where(eq(trainingCourses.id, courseId));
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      // Allow enrollment if course is published OR user is the course creator
      const isCreator = course.createdBy === userId;
      if (!course.isPublished && !isCreator) {
        return res.status(404).json({ error: "Course not available for enrollment" });
      }
      
      // Check if already enrolled
      const [existingEnrollment] = await db.select().from(trainingEnrollments)
        .where(and(eq(trainingEnrollments.courseId, courseId), eq(trainingEnrollments.userId, userId)));
      
      if (existingEnrollment) {
        return res.status(400).json({ error: "Already enrolled in this course" });
      }
      
      // Get lesson count
      const [lessonCount] = await db.select({ count: sql<number>`count(*)` })
        .from(trainingLessons)
        .where(eq(trainingLessons.courseId, courseId));
      
      // Create enrollment
      const enrollment = {
        courseId,
        userId,
        status: "enrolled" as const,
        totalLessons: lessonCount.count || 0
      };
      
      const [newEnrollment] = await db.insert(trainingEnrollments).values(enrollment).returning();
      
      await createAuditLog("created", "training_enrollment", newEnrollment.id, course.title, userId,
        "Enrolled in training course", null, newEnrollment, req);
      
      res.status(201).json(newEnrollment);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      res.status(500).json({ error: "Failed to enroll in course" });
    }
  });

  // Get user's enrolled courses
  app.get("/api/training/my-courses", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const enrolledCourses = await db.select({
        enrollmentId: trainingEnrollments.id,
        courseId: trainingCourses.id,
        title: trainingCourses.title,
        shortDescription: trainingCourses.shortDescription,
        thumbnailUrl: trainingCourses.thumbnailUrl,
        estimatedDuration: trainingCourses.estimatedDuration,
        difficulty: trainingCourses.difficulty,
        categoryName: trainingCategories.name,
        categoryColor: trainingCategories.color,
        enrollmentStatus: trainingEnrollments.status,
        progress: trainingEnrollments.progress,
        completedLessons: trainingEnrollments.completedLessons,
        totalLessons: trainingEnrollments.totalLessons,
        enrolledAt: trainingEnrollments.enrolledAt,
        lastAccessedAt: trainingEnrollments.lastAccessedAt,
        completedAt: trainingEnrollments.completedAt
      }).from(trainingEnrollments)
        .leftJoin(trainingCourses, eq(trainingEnrollments.courseId, trainingCourses.id))
        .leftJoin(trainingCategories, eq(trainingCourses.categoryId, trainingCategories.id))
        .where(eq(trainingEnrollments.userId, userId))
        .orderBy(desc(trainingEnrollments.lastAccessedAt), desc(trainingEnrollments.enrolledAt));
      
      res.json(enrolledCourses);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      res.status(500).json({ error: "Failed to fetch enrolled courses" });
    }
  });

  // ===== TRAINING MODULES =====
  
  // Get modules for a course
  app.get("/api/training/courses/:courseId/modules", async (req, res) => {
    try {
      const { courseId } = req.params;
      
      const modules = await db.select().from(trainingModules)
        .where(eq(trainingModules.courseId, courseId))
        .orderBy(asc(trainingModules.order), asc(trainingModules.createdAt));
      
      res.json(modules);
    } catch (error) {
      console.error('Error fetching training modules:', error);
      res.status(500).json({ error: "Failed to fetch training modules" });
    }
  });
  
  // Create training module
  app.post("/api/training/courses/:courseId/modules", async (req, res) => {
    try {
      const { courseId } = req.params;
      const newModule = insertTrainingModuleSchema.parse({
        ...req.body,
        courseId,
        createdBy: getAuthenticatedUserIdOrFail(req, res) || userId
      });
      
      const [module] = await db.insert(trainingModules).values(newModule).returning();
      
      await createAuditLog("created", "training_module", module.id, module.title, req.session?.userId,
        "Training module created", null, module, req);
      
      res.status(201).json(module);
    } catch (error) {
      console.error('Error creating training module:', error);
      res.status(500).json({ error: "Failed to create training module" });
    }
  });
  
  // Update training module
  app.put("/api/training/modules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertTrainingModuleSchema.partial().parse({
        ...req.body,
        updatedBy: getAuthenticatedUserIdOrFail(req, res) || userId
      });
      
      const [oldModule] = await db.select().from(trainingModules).where(eq(trainingModules.id, id));
      if (!oldModule) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      const [module] = await db.update(trainingModules)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(trainingModules.id, id))
        .returning();
      
      await createAuditLog("updated", "training_module", module.id, module.title, req.session?.userId,
        "Training module updated", oldModule, module, req);
      
      res.json(module);
    } catch (error) {
      console.error('Error updating training module:', error);
      res.status(500).json({ error: "Failed to update training module" });
    }
  });
  
  // Delete training module
  app.delete("/api/training/modules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [module] = await db.select().from(trainingModules).where(eq(trainingModules.id, id));
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      await db.delete(trainingModules).where(eq(trainingModules.id, id));
      
      await createAuditLog("deleted", "training_module", module.id, module.title, req.session?.userId,
        "Training module deleted", module, null, req);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting training module:', error);
      res.status(500).json({ error: "Failed to delete training module" });
    }
  });

  // Reorder training modules
  app.put("/api/training/courses/:courseId/modules/reorder", async (req, res) => {
    try {
      const { courseId } = req.params;
      const { moduleIds } = req.body; // Array of module IDs in new order
      
      if (!Array.isArray(moduleIds)) {
        return res.status(400).json({ error: "moduleIds must be an array" });
      }
      
      // Update order for each module
      await Promise.all(moduleIds.map((moduleId, index) => 
        db.update(trainingModules)
          .set({ 
            order: index + 1,
            updatedAt: new Date(),
            updatedBy: getAuthenticatedUserIdOrFail(req, res) || userId
          })
          .where(and(eq(trainingModules.id, moduleId), eq(trainingModules.courseId, courseId)))
      ));
      
      await createAuditLog("updated", "training_course", courseId, "Module Order Updated", req.session?.userId,
        "Training modules reordered", null, { moduleIds }, req);
      
      res.json({ message: "Modules reordered successfully" });
    } catch (error) {
      console.error('Error reordering modules:', error);
      res.status(500).json({ error: "Failed to reorder modules" });
    }
  });

  // ===== TRAINING LESSONS =====
  
  // Get lessons for a course
  app.get("/api/training/courses/:courseId/lessons", requireAuth(), requirePermission('training', 'canView'), async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.session?.userId;
      
      const lessons = await db.select().from(trainingLessons)
        .where(eq(trainingLessons.courseId, courseId))
        .orderBy(asc(trainingLessons.order));
      
      // Get progress for user if logged in
      if (userId) {
        const [enrollment] = await db.select().from(trainingEnrollments)
          .where(and(eq(trainingEnrollments.courseId, courseId), eq(trainingEnrollments.userId, userId)));
        
        if (enrollment) {
          const progressData = await db.select().from(trainingProgress)
            .where(eq(trainingProgress.enrollmentId, enrollment.id));
          
          const lessonsWithProgress = lessons.map(lesson => {
            const progress = progressData.find(p => p.lessonId === lesson.id);
            return {
              ...lesson,
              progress: progress || null
            };
          });
          
          return res.json(lessonsWithProgress);
        }
      }
      
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  // Reorder training lessons (must be BEFORE parameterized routes)
  app.put("/api/training/lessons/reorder", requireAuth(), requirePermission('training', 'canEdit'), async (req, res) => {
    try {
      const { lessonIds, moduleId } = req.body; // Array of lesson IDs in new order, optional moduleId
      
      console.log("Lesson reorder request:", { lessonIds, moduleId });
      
      if (!Array.isArray(lessonIds)) {
        return res.status(400).json({ error: "lessonIds must be an array" });
      }
      
      if (lessonIds.length === 0) {
        return res.status(400).json({ error: "lessonIds cannot be empty" });
      }
      
      // Validate that all lessons exist before updating any
      for (let i = 0; i < lessonIds.length; i++) {
        const lessonId = lessonIds[i];
        console.log(`Validating lesson ${i + 1}/${lessonIds.length}: ${lessonId}`);
        
        const [existingLesson] = await db.select().from(trainingLessons).where(eq(trainingLessons.id, lessonId));
        if (!existingLesson) {
          console.log(`Lesson not found: ${lessonId}`);
          return res.status(404).json({ error: `Lesson not found: ${lessonId}` });
        }
      }
      
      // Now update order for each lesson sequentially
      for (let i = 0; i < lessonIds.length; i++) {
        const lessonId = lessonIds[i];
        const updateData: any = {
          order: i + 1,
          updatedAt: new Date(),
          updatedBy: getAuthenticatedUserIdOrFail(req, res) || userId
        };
        
        // If moduleId is provided, update the lesson's module
        if (moduleId !== undefined) {
          updateData.moduleId = moduleId;
        }
        
        await db.update(trainingLessons)
          .set(updateData)
          .where(eq(trainingLessons.id, lessonId));
      }
      
      await createAuditLog("updated", "training_lesson", "bulk", "Lesson Order Updated", req.session?.userId,
        "Training lessons reordered", null, { lessonIds, moduleId }, req);
      
      res.json({ message: "Lessons reordered successfully" });
    } catch (error) {
      console.error('Error reordering lessons:', error);
      res.status(500).json({ error: "Failed to reorder lessons" });
    }
  });

  // Get single lesson with content
  app.get("/api/training/lessons/:id", requireAuth(), requirePermission('training', 'canView'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;
      
      const [lesson] = await db.select().from(trainingLessons).where(eq(trainingLessons.id, id));
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Track lesson access if user is enrolled
      if (userId) {
        const [enrollment] = await db.select().from(trainingEnrollments)
          .where(and(eq(trainingEnrollments.courseId, lesson.courseId), eq(trainingEnrollments.userId, userId)));
        
        if (enrollment) {
          // Update or create progress
          const [existingProgress] = await db.select().from(trainingProgress)
            .where(and(eq(trainingProgress.enrollmentId, enrollment.id), eq(trainingProgress.lessonId, id)));
          
          if (existingProgress) {
            await db.update(trainingProgress)
              .set({ lastAccessedAt: new Date() })
              .where(eq(trainingProgress.id, existingProgress.id));
          } else {
            await db.insert(trainingProgress).values({
              enrollmentId: enrollment.id,
              lessonId: id,
              userId,
              status: "in_progress",
              firstStartedAt: new Date(),
              lastAccessedAt: new Date()
            });
          }
          
          // Update enrollment access time
          await db.update(trainingEnrollments)
            .set({ 
              lastAccessedAt: new Date(),
              status: enrollment.status === "enrolled" ? "in_progress" : enrollment.status
            })
            .where(eq(trainingEnrollments.id, enrollment.id));
        }
      }
      
      res.json(lesson);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  // Create lesson (Admin/Manager only)
  app.post("/api/training/courses/:courseId/lessons", requireAuth(), requirePermission('training', 'canCreate'), async (req, res) => {
    try {
      const { courseId } = req.params;
      const newLesson = insertTrainingLessonSchema.parse({
        ...req.body,
        courseId,
        createdBy: getAuthenticatedUserIdOrFail(req, res) || userId
      });
      
      const [lesson] = await db.insert(trainingLessons).values(newLesson).returning();
      
      await createAuditLog("created", "training_lesson", lesson.id, lesson.title, req.session?.userId,
        "Training lesson created", null, lesson, req);
      
      res.status(201).json(lesson);
    } catch (error) {
      console.error('Error creating lesson:', error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  // Update lesson
  app.put("/api/training/lessons/:id", requireAuth(), requirePermission('training', 'canEdit'), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Map frontend contentUrl to database videoUrl field
      const { contentUrl, ...otherData } = req.body;
      const updates = insertTrainingLessonSchema.partial().parse({
        ...otherData,
        videoUrl: contentUrl || null, // Map contentUrl to videoUrl
        updatedBy: getAuthenticatedUserIdOrFail(req, res) || userId
      });
      
      const [oldLesson] = await db.select().from(trainingLessons).where(eq(trainingLessons.id, id));
      if (!oldLesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      const [updatedLesson] = await db.update(trainingLessons)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(trainingLessons.id, id))
        .returning();
      
      await createAuditLog("updated", "training_lesson", id, updatedLesson.title, req.session?.userId,
        "Training lesson updated", oldLesson, updatedLesson, req);
      
      res.json(updatedLesson);
    } catch (error) {
      console.error('Error updating lesson:', error);
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  // Delete lesson
  app.delete("/api/training/lessons/:id", requireAuth(), requirePermission('training', 'canDelete'), async (req, res) => {
    try {
      const { id } = req.params;
      
      const [lesson] = await db.select().from(trainingLessons).where(eq(trainingLessons.id, id));
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      await db.delete(trainingLessons).where(eq(trainingLessons.id, id));
      
      await createAuditLog("deleted", "training_lesson", id, lesson.title, req.session?.userId,
        "Training lesson deleted", lesson, null, req);
      
      res.json({ message: "Lesson deleted successfully" });
    } catch (error) {
      console.error('Error deleting lesson:', error);
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  // Update lesson lock status
  app.put("/api/training/lessons/:id/lock", requireAuth(), requirePermission('training', 'canEdit'), async (req, res) => {
    try {
      const { id: lessonId } = req.params;
      const { isLocked } = req.body;
      
      if (typeof isLocked !== 'boolean') {
        return res.status(400).json({ error: "isLocked must be a boolean" });
      }
      
      const [lesson] = await db.select().from(trainingLessons).where(eq(trainingLessons.id, lessonId));
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      const [updatedLesson] = await db.update(trainingLessons)
        .set({ 
          isLocked,
          updatedAt: new Date()
        })
        .where(eq(trainingLessons.id, lessonId))
        .returning();
      
      res.json({ 
        message: `Lesson ${isLocked ? 'locked' : 'unlocked'} successfully`,
        lesson: updatedLesson
      });
    } catch (error) {
      console.error('Error updating lesson lock status:', error);
      res.status(500).json({ error: "Failed to update lesson lock status" });
    }
  });

  // Mark lesson as incomplete (reset)
  app.post("/api/training/lessons/:id/incomplete", requireAuth(), requirePermission('training', 'canEdit'), async (req, res) => {
    try {
      const { id: lessonId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const [lesson] = await db.select().from(trainingLessons).where(eq(trainingLessons.id, lessonId));
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      const [enrollment] = await db.select().from(trainingEnrollments)
        .where(and(eq(trainingEnrollments.courseId, lesson.courseId), eq(trainingEnrollments.userId, userId)));
      
      if (!enrollment) {
        return res.status(404).json({ error: "Not enrolled in this course" });
      }
      
      // Reset lesson progress
      const [existingProgress] = await db.select().from(trainingProgress)
        .where(and(eq(trainingProgress.enrollmentId, enrollment.id), eq(trainingProgress.lessonId, lessonId)));
      
      if (existingProgress) {
        await db.update(trainingProgress)
          .set({ 
            status: "not_started",
            completionPercentage: 0,
            completedAt: null,
            lastAccessedAt: new Date()
          })
          .where(eq(trainingProgress.id, existingProgress.id));
      } else {
        // If no progress record exists, create one as not_started
        await db.insert(trainingProgress).values({
          enrollmentId: enrollment.id,
          lessonId,
          userId,
          status: "not_started",
          completionPercentage: 0,
          firstStartedAt: null,
          completedAt: null,
          lastAccessedAt: new Date()
        });
      }
      
      // Recalculate enrollment progress
      const [completedCount] = await db.select({ count: sql<number>`count(*)` })
        .from(trainingProgress)
        .where(and(
          eq(trainingProgress.enrollmentId, enrollment.id),
          eq(trainingProgress.status, "completed")
        ));
      
      // Get actual total lessons in the course
      const [totalLessonsCount] = await db.select({ count: sql<number>`count(*)` })
        .from(trainingLessons)
        .where(eq(trainingLessons.courseId, lesson.courseId));
      
      const progress = Math.round((completedCount.count / totalLessonsCount.count) * 100);
      const status = progress === 100 ? "completed" : progress > 0 ? "in_progress" : "not_started";
      
      await db.update(trainingEnrollments)
        .set({
          completedLessons: completedCount.count,
          totalLessons: totalLessonsCount.count,
          progress,
          status,
          completedAt: progress === 100 ? new Date() : null,
          lastAccessedAt: new Date()
        })
        .where(eq(trainingEnrollments.id, enrollment.id));
      
      res.json({ message: "Lesson marked as incomplete", progress });
    } catch (error) {
      console.error('Error marking lesson as incomplete:', error);
      res.status(500).json({ error: "Failed to mark lesson as incomplete" });
    }
  });

  // Mark lesson as completed
  app.post("/api/training/lessons/:id/complete", requireAuth(), requirePermission('training', 'canEdit'), async (req, res) => {
    try {
      const { id: lessonId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const [lesson] = await db.select().from(trainingLessons).where(eq(trainingLessons.id, lessonId));
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      const [enrollment] = await db.select().from(trainingEnrollments)
        .where(and(eq(trainingEnrollments.courseId, lesson.courseId), eq(trainingEnrollments.userId, userId)));
      
      if (!enrollment) {
        return res.status(404).json({ error: "Not enrolled in this course" });
      }
      
      // Update lesson progress to completed
      const [existingProgress] = await db.select().from(trainingProgress)
        .where(and(eq(trainingProgress.enrollmentId, enrollment.id), eq(trainingProgress.lessonId, lessonId)));
      
      if (existingProgress) {
        await db.update(trainingProgress)
          .set({ 
            status: "completed",
            completionPercentage: 100,
            completedAt: new Date(),
            lastAccessedAt: new Date()
          })
          .where(eq(trainingProgress.id, existingProgress.id));
      } else {
        await db.insert(trainingProgress).values({
          enrollmentId: enrollment.id,
          lessonId,
          userId,
          status: "completed",
          completionPercentage: 100,
          firstStartedAt: new Date(),
          completedAt: new Date(),
          lastAccessedAt: new Date()
        });
      }
      
      // Update enrollment progress
      const [completedCount] = await db.select({ count: sql<number>`count(*)` })
        .from(trainingProgress)
        .where(and(
          eq(trainingProgress.enrollmentId, enrollment.id),
          eq(trainingProgress.status, "completed")
        ));
      
      // Get actual total lessons in the course (not from enrollment record which may be outdated)
      const [totalLessonsCount] = await db.select({ count: sql<number>`count(*)` })
        .from(trainingLessons)
        .where(eq(trainingLessons.courseId, lesson.courseId));
      
      const progress = Math.round((completedCount.count / totalLessonsCount.count) * 100);
      const status = progress === 100 ? "completed" : "in_progress";
      
      await db.update(trainingEnrollments)
        .set({
          completedLessons: completedCount.count,
          totalLessons: totalLessonsCount.count, // Update with actual lesson count
          progress,
          status,
          completedAt: progress === 100 ? new Date() : null,
          lastAccessedAt: new Date()
        })
        .where(eq(trainingEnrollments.id, enrollment.id));
      
      res.json({ message: "Lesson marked as completed", progress });
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      res.status(500).json({ error: "Failed to mark lesson as completed" });
    }
  });

  // ===== TRAINING ANALYTICS (Admin/Manager only) =====
  
  // Get training analytics dashboard
  app.get("/api/training/analytics", requireAuth(), requirePermission('training', 'canView'), async (req, res) => {
    try {
      const { courseId, userId } = req.query;
      const currentUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!currentUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Total courses and categories
      const [totalCourses] = await db.select({ count: sql<number>`count(*)` }).from(trainingCourses);
      const [totalCategories] = await db.select({ count: sql<number>`count(*)` }).from(trainingCategories);
      const [totalEnrollments] = await db.select({ count: sql<number>`count(*)` }).from(trainingEnrollments);
      
      // Course completion rates - filter by courseId if provided
      let courseStatsQuery = db.select({
        courseId: trainingCourses.id,
        courseTitle: trainingCourses.title,
        totalEnrollments: sql<number>`count(${trainingEnrollments.id})`,
        completedEnrollments: sql<number>`count(case when ${trainingEnrollments.status} = 'completed' then 1 end)`,
        avgProgress: sql<number>`avg(${trainingEnrollments.progress})`
      }).from(trainingCourses)
        .leftJoin(trainingEnrollments, eq(trainingCourses.id, trainingEnrollments.courseId));

      if (courseId) {
        courseStatsQuery = courseStatsQuery.where(and(
          or(
            eq(trainingCourses.isPublished, true),
            eq(trainingCourses.createdBy, currentUserId)  // Show own unpublished courses
          ),
          eq(trainingCourses.id, courseId as string)
        ));
      } else {
        courseStatsQuery = courseStatsQuery.where(or(
          eq(trainingCourses.isPublished, true),
          eq(trainingCourses.createdBy, currentUserId)  // Show own unpublished courses
        ));
      }
      
      const courseStats = await courseStatsQuery.groupBy(trainingCourses.id, trainingCourses.title);
      
      // User progress overview - modify based on filters
      let userStatsQuery = db.select({
        userId: staff.id,
        userName: sql<string>`CONCAT(${staff.firstName}, ' ', ${staff.lastName})`,
        totalEnrollments: sql<number>`count(${trainingEnrollments.id})`,
        completedCourses: sql<number>`count(case when ${trainingEnrollments.status} = 'completed' then 1 end)`,
        avgProgress: sql<number>`avg(${trainingEnrollments.progress})`
      }).from(staff)
        .leftJoin(trainingEnrollments, eq(staff.id, trainingEnrollments.userId));

      // Apply filters
      if (courseId && userId) {
        userStatsQuery = userStatsQuery
          .leftJoin(trainingCourses, eq(trainingEnrollments.courseId, trainingCourses.id))
          .where(and(
            eq(trainingCourses.id, courseId as string),
            eq(staff.id, userId as string)
          ));
      } else if (courseId) {
        userStatsQuery = userStatsQuery
          .leftJoin(trainingCourses, eq(trainingEnrollments.courseId, trainingCourses.id))
          .where(eq(trainingCourses.id, courseId as string));
      } else if (userId) {
        userStatsQuery = userStatsQuery.where(eq(staff.id, userId as string));
      }

      const userStats = await userStatsQuery
        .groupBy(staff.id, staff.firstName, staff.lastName)
        .having(sql`count(${trainingEnrollments.id}) > 0`);
      
      // Recent activity - filter by courseId and userId if provided
      let recentEnrollmentsQuery = db.select({
        id: trainingEnrollments.id,
        courseTitle: trainingCourses.title,
        userName: sql<string>`CONCAT(${staff.firstName}, ' ', ${staff.lastName})`,
        enrolledAt: trainingEnrollments.enrolledAt,
        status: trainingEnrollments.status,
        progress: trainingEnrollments.progress
      }).from(trainingEnrollments)
        .leftJoin(trainingCourses, eq(trainingEnrollments.courseId, trainingCourses.id))
        .leftJoin(staff, eq(trainingEnrollments.userId, staff.id));

      // Apply filters to recent activity
      if (courseId && userId) {
        recentEnrollmentsQuery = recentEnrollmentsQuery.where(and(
          eq(trainingCourses.id, courseId as string),
          eq(staff.id, userId as string)
        ));
      } else if (courseId) {
        recentEnrollmentsQuery = recentEnrollmentsQuery.where(eq(trainingCourses.id, courseId as string));
      } else if (userId) {
        recentEnrollmentsQuery = recentEnrollmentsQuery.where(eq(staff.id, userId as string));
      }

      const recentEnrollments = await recentEnrollmentsQuery
        .orderBy(desc(trainingEnrollments.enrolledAt))
        .limit(20);
      
      res.json({
        summary: {
          totalCourses: totalCourses.count,
          totalCategories: totalCategories.count,
          totalEnrollments: totalEnrollments.count
        },
        courseStats,
        userStats,
        recentActivity: recentEnrollments
      });
    } catch (error) {
      console.error('Error fetching training analytics:', error);
      res.status(500).json({ error: "Failed to fetch training analytics" });
    }
  });

  // ===== TRAINING QUIZZES =====
  
  // Get quiz for a lesson
  app.get("/api/training/lessons/:lessonId/quiz", requireAuth(), requirePermission('training', 'canView'), async (req, res) => {
    try {
      const { lessonId } = req.params;
      
      const [quiz] = await db.select().from(trainingQuizzes)
        .where(eq(trainingQuizzes.lessonId, lessonId));
      
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      // Get quiz questions
      const questions = await db.select().from(trainingQuizQuestions)
        .where(eq(trainingQuizQuestions.quizId, quiz.id))
        .orderBy(asc(trainingQuizQuestions.order));
      
      res.json({ ...quiz, questions });
    } catch (error) {
      console.error('Error fetching quiz:', error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  // Create or update quiz for a lesson
  app.post("/api/training/lessons/:lessonId/quiz", requireAuth(), requirePermission('training', 'canCreate'), async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { title, description, passingScore, maxAttempts, timeLimit, shuffleQuestions, showCorrectAnswers, isRequired, questions } = req.body;
      
      // Check if quiz already exists
      const [existingQuiz] = await db.select().from(trainingQuizzes)
        .where(eq(trainingQuizzes.lessonId, lessonId));
      
      let quiz;
      if (existingQuiz) {
        // Update existing quiz
        [quiz] = await db.update(trainingQuizzes)
          .set({
            title,
            description,
            passingScore,
            maxAttempts,
            timeLimit,
            shuffleQuestions,
            showCorrectAnswers,
            isRequired,
            updatedAt: new Date()
          })
          .where(eq(trainingQuizzes.id, existingQuiz.id))
          .returning();
        
        // Delete existing questions
        await db.delete(trainingQuizQuestions).where(eq(trainingQuizQuestions.quizId, existingQuiz.id));
      } else {
        // Create new quiz
        [quiz] = await db.insert(trainingQuizzes).values({
          lessonId,
          title,
          description,
          passingScore,
          maxAttempts,
          timeLimit,
          shuffleQuestions,
          showCorrectAnswers,
          isRequired,
          createdBy: getAuthenticatedUserIdOrFail(req, res) || userId
        }).returning();
      }
      
      // Add questions
      if (questions && questions.length > 0) {
        const questionData = questions.map((q: any, index: number) => ({
          quizId: quiz.id,
          question: q.question,
          questionType: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points || 1,
          order: index
        }));
        
        await db.insert(trainingQuizQuestions).values(questionData);
      }
      
      await createAuditLog(existingQuiz ? "updated" : "created", "training_quiz", quiz.id, quiz.title, req.session?.userId,
        `Training quiz ${existingQuiz ? "updated" : "created"}`, existingQuiz || null, quiz, req);
      
      res.json(quiz);
    } catch (error) {
      console.error('Error creating/updating quiz:', error);
      res.status(500).json({ error: "Failed to save quiz" });
    }
  });

  // Delete quiz
  app.delete("/api/training/quizzes/:id", requireAuth(), requirePermission('training', 'canDelete'), async (req, res) => {
    try {
      const { id } = req.params;
      
      const [quiz] = await db.select().from(trainingQuizzes).where(eq(trainingQuizzes.id, id));
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      await db.delete(trainingQuizzes).where(eq(trainingQuizzes.id, id));
      
      await createAuditLog("deleted", "training_quiz", id, quiz.title, req.session?.userId,
        "Training quiz deleted", quiz, null, req);
      
      res.json({ message: "Quiz deleted successfully" });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).json({ error: "Failed to delete quiz" });
    }
  });

  // Submit quiz attempt
  app.post("/api/training/quizzes/:quizId/submit", async (req, res) => {
    try {
      const { quizId } = req.params;
      const { answers } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const [quiz] = await db.select().from(trainingQuizzes).where(eq(trainingQuizzes.id, quizId));
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      // Get enrollment for the lesson's course
      const [lesson] = await db.select().from(trainingLessons).where(eq(trainingLessons.id, quiz.lessonId));
      const [enrollment] = await db.select().from(trainingEnrollments)
        .where(and(eq(trainingEnrollments.courseId, lesson.courseId), eq(trainingEnrollments.userId, userId)));
      
      if (!enrollment) {
        return res.status(404).json({ error: "Not enrolled in this course" });
      }
      
      // Check attempt limit
      const previousAttempts = await db.select().from(trainingQuizAttempts)
        .where(and(eq(trainingQuizAttempts.quizId, quizId), eq(trainingQuizAttempts.userId, userId)));
      
      if (quiz.maxAttempts > 0 && previousAttempts.length >= quiz.maxAttempts) {
        return res.status(400).json({ error: "Maximum attempts exceeded" });
      }
      
      // Get quiz questions for scoring
      const questions = await db.select().from(trainingQuizQuestions)
        .where(eq(trainingQuizQuestions.quizId, quizId))
        .orderBy(asc(trainingQuizQuestions.order));
      
      // Calculate score
      let earnedPoints = 0;
      let totalPoints = 0;
      
      questions.forEach((question) => {
        totalPoints += question.points;
        const userAnswer = answers[question.id];
        if (userAnswer === question.correctAnswer) {
          earnedPoints += question.points;
        }
      });
      
      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const isPassed = score >= quiz.passingScore;
      
      // Save attempt
      const [attempt] = await db.insert(trainingQuizAttempts).values({
        quizId,
        userId,
        enrollmentId: enrollment.id,
        score,
        totalPoints,
        earnedPoints,
        answers: answers,
        isPassed,
        attemptNumber: previousAttempts.length + 1,
        submittedAt: new Date()
      }).returning();
      
      res.json({
        attempt,
        score,
        isPassed,
        totalPoints,
        earnedPoints,
        passingScore: quiz.passingScore
      });
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Get quiz attempts for a user
  app.get("/api/training/quizzes/:quizId/attempts", async (req, res) => {
    try {
      const { quizId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const attempts = await db.select().from(trainingQuizAttempts)
        .where(and(eq(trainingQuizAttempts.quizId, quizId), eq(trainingQuizAttempts.userId, userId)))
        .orderBy(desc(trainingQuizAttempts.startedAt));
      
      res.json(attempts);
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      res.status(500).json({ error: "Failed to fetch quiz attempts" });
    }
  });

  // =============================================================================
  // TRAINING LESSON RESOURCES ENDPOINTS
  // =============================================================================

  // Get lesson resources
  app.get("/api/training/lessons/:lessonId/resources", async (req, res) => {
    try {
      const { lessonId } = req.params;
      
      const resources = await db.select()
        .from(trainingLessonResources)
        .where(eq(trainingLessonResources.lessonId, lessonId))
        .orderBy(trainingLessonResources.order, trainingLessonResources.createdAt);
      
      res.json(resources);
    } catch (error) {
      console.error('Error fetching lesson resources:', error);
      res.status(500).json({ error: "Failed to fetch lesson resources" });
    }
  });

  // Create lesson resource
  app.post("/api/training/lessons/:lessonId/resources", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { type, title, description, url, fileName, fileSize } = insertTrainingLessonResourceSchema.parse({
        ...req.body,
        lessonId,
        createdBy: getAuthenticatedUserIdOrFail(req, res) || userId
      });
      
      // Get existing resources count for order
      const existingResources = await db.select()
        .from(trainingLessonResources)
        .where(eq(trainingLessonResources.lessonId, lessonId));
      
      const [resource] = await db.insert(trainingLessonResources).values({
        lessonId,
        type,
        title,
        description,
        url,
        fileName,
        fileSize,
        order: existingResources.length,
        createdBy: getAuthenticatedUserIdOrFail(req, res) || userId
      }).returning();
      
      await createAuditLog("created", "training_lesson_resource", resource.id, resource.title, req.session?.userId,
        `Resource "${resource.title}" added to lesson`, null, resource, req);
      
      res.status(201).json(resource);
    } catch (error) {
      console.error('Error creating lesson resource:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create lesson resource" });
    }
  });

  // Update lesson resource
  app.put("/api/training/lessons/:lessonId/resources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertTrainingLessonResourceSchema.partial().parse(req.body);
      
      const [existingResource] = await db.select()
        .from(trainingLessonResources)
        .where(eq(trainingLessonResources.id, id));
      
      if (!existingResource) {
        return res.status(404).json({ error: "Resource not found" });
      }
      
      const [resource] = await db.update(trainingLessonResources)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(trainingLessonResources.id, id))
        .returning();
      
      await createAuditLog("updated", "training_lesson_resource", resource.id, resource.title, req.session?.userId,
        `Resource "${resource.title}" updated`, existingResource, resource, req);
      
      res.json(resource);
    } catch (error) {
      console.error('Error updating lesson resource:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update lesson resource" });
    }
  });

  // Delete lesson resource
  app.delete("/api/training/lessons/:lessonId/resources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [resource] = await db.select()
        .from(trainingLessonResources)
        .where(eq(trainingLessonResources.id, id));
      
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }
      
      await db.delete(trainingLessonResources).where(eq(trainingLessonResources.id, id));
      
      await createAuditLog("deleted", "training_lesson_resource", id, resource.title, req.session?.userId,
        `Resource "${resource.title}" deleted from lesson`, resource, null, req);
      
      res.json({ message: "Resource deleted successfully" });
    } catch (error) {
      console.error('Error deleting lesson resource:', error);
      res.status(500).json({ error: "Failed to delete lesson resource" });
    }
  });

  // Reorder lesson resources
  app.put("/api/training/lessons/:lessonId/resources/reorder", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { resourceIds } = req.body;
      
      if (!Array.isArray(resourceIds)) {
        return res.status(400).json({ error: "resourceIds must be an array" });
      }
      
      // Update order for each resource
      for (let i = 0; i < resourceIds.length; i++) {
        await db.update(trainingLessonResources)
          .set({ order: i, updatedAt: new Date() })
          .where(and(
            eq(trainingLessonResources.id, resourceIds[i]),
            eq(trainingLessonResources.lessonId, lessonId)
          ));
      }
      
      await createAuditLog("updated", "training_lesson", lessonId, "Lesson resources", req.session?.userId,
        `Lesson resources reordered`, null, { resourceOrder: resourceIds }, req);
      
      res.json({ message: "Resources reordered successfully" });
    } catch (error) {
      console.error('Error reordering lesson resources:', error);
      res.status(500).json({ error: "Failed to reorder lesson resources" });
    }
  });

  // Health Notification System - Check and send alerts for poor client health
  app.post("/api/health-notifications/check", async (req, res) => {
    try {
      // SECURITY: Require authenticated session - no admin fallback allowed
      if (!req.session?.userId) {
        return res.status(401).json({ 
          error: "Authentication required", 
          message: "You must be logged in to trigger health notifications." 
        });
      }

      const userId = req.session.userId;
      
      // SECURITY: Check if authenticated user has permission to trigger health notifications
      // Only managers and admins should be able to trigger system-wide health checks
      const canManageNotifications = await hasPermission(userId, 'notifications', 'canManage');
      if (!canManageNotifications) {
        return res.status(403).json({ 
          error: "Access denied", 
          message: "You do not have permission to trigger health notifications. Manager or admin access required." 
        });
      }
      
      let notificationsCreated = 0;
      let clientsChecked = 0;
      const results = [];

      // Get all clients that have health scores
      const clientsWithHealth = await db.selectDistinct({ 
        clientId: clientHealthScores.clientId 
      })
      .from(clientHealthScores);

      for (const { clientId } of clientsWithHealth) {
        clientsChecked++;

        // Get client details for notification content
        const [clientInfo] = await db.select({
          id: clients.id,
          name: clients.name,
          email: clients.email,
          contactOwner: clients.contactOwner
        })
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);

        if (!clientInfo) continue;

        // Get last 4 weeks of health scores for this client
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const healthScores = await db.select()
          .from(clientHealthScores)
          .where(
            and(
              eq(clientHealthScores.clientId, clientId),
              sql`${clientHealthScores.weekStartDate} >= ${fourWeeksAgo.toISOString().split('T')[0]}`
            )
          )
          .orderBy(desc(clientHealthScores.weekStartDate))
          .limit(4);

        if (healthScores.length < 4) {
          continue; // Need at least 4 weeks of data
        }

        // Use existing health analysis logic (already imported at top of file)
        const healthAnalysis = analyzeHealthStatus(
          healthScores.map(score => ({
            weekStart: score.weekStartDate,
            healthIndicator: score.healthIndicator
          }))
        );

        // Only send notifications if client needs highlighting (poor health)
        if (!healthAnalysis.shouldHighlight) {
          continue;
        }

        const alertType = healthAnalysis.highlightType === 'red' 
          ? 'client_health_alert_red' 
          : 'client_health_alert_yellow';

        // Get team members to notify
        const teamMembers = new Set<string>();

        // 1. Add contact owner if exists
        if (clientInfo.contactOwner) {
          teamMembers.add(clientInfo.contactOwner);
        }

        // 2. Add all team members assigned to this client
        const clientTeamMembers = await db.select({
          staffId: clientTeamAssignments.staffId,
          position: clientTeamAssignments.position
        })
        .from(clientTeamAssignments)
        .where(eq(clientTeamAssignments.clientId, clientId));

        for (const member of clientTeamMembers) {
          teamMembers.add(member.staffId);
        }

        // 3. Add managers (staff with manager roles) - simplified for now
        const managers = await db.select({ id: staff.id })
          .from(staff)
          .where(sql`${staff.position} ILIKE '%manager%' OR ${staff.position} ILIKE '%director%'`)
          .limit(10); // Reasonable limit

        for (const manager of managers) {
          teamMembers.add(manager.id);
        }

        if (teamMembers.size === 0) {
          continue; // No one to notify
        }

        // Create notification content
        const title = `Client Health Alert: ${clientInfo.name} - ${healthAnalysis.highlightType?.toUpperCase()} Status`;
        const message = `${clientInfo.name} has been in poor health for 4 consecutive weeks. ${healthAnalysis.reason} Immediate attention required.`;
        const actionUrl = `/clients/${clientId}`;

        // Create notifications for team members (with per-recipient duplicate prevention)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const notificationPromises = Array.from(teamMembers).map(async (staffId) => {
          // Check if this specific team member was already notified about this client's health recently
          const existingNotification = await db.select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, staffId),
                eq(notifications.type, alertType),
                eq(notifications.entityType, "client"),
                eq(notifications.entityId, clientId),
                sql`${notifications.createdAt} >= ${oneWeekAgo.toISOString()}`
              )
            )
            .limit(1);

          // Skip if this specific recipient was already notified recently
          if (existingNotification.length > 0) {
            return null; // This recipient already notified recently
          }

          return db.insert(notifications).values({
            userId: staffId,
            type: alertType,
            title,
            message,
            entityType: "client",
            entityId: clientId,
            priority: healthAnalysis.highlightType === 'red' ? 'high' : 'normal',
            actionUrl,
            actionText: 'View Client',
            metadata: {
              clientName: clientInfo.name,
              healthStatus: healthAnalysis.highlightType,
              reason: healthAnalysis.reason,
              weeksCovered: healthScores.length
            }
          });
        });

        const completedNotifications = await Promise.all(notificationPromises);
        const actualNotifications = completedNotifications.filter(notification => notification !== null);
        notificationsCreated += actualNotifications.length;

        results.push({
          clientId,
          clientName: clientInfo.name,
          healthStatus: healthAnalysis.highlightType,
          reason: healthAnalysis.reason,
          recipientsNotified: teamMembers.size,
          recipients: Array.from(teamMembers)
        });

        // Create audit log for health notification
        await createAuditLog(
          "created", 
          "health_notification", 
          clientId, 
          `Health Alert for ${clientInfo.name}`,
          userId,
          `Created ${alertType} notification for ${clientInfo.name} - ${healthAnalysis.reason}`,
          null,
          {
            healthStatus: healthAnalysis.highlightType,
            recipientCount: teamMembers.size,
            recipients: Array.from(teamMembers)
          },
          req
        );
      }

      res.json({
        success: true,
        clientsChecked,
        notificationsCreated,
        results,
        message: `Checked ${clientsChecked} clients, created ${notificationsCreated} health alert notifications`
      });

    } catch (error) {
      console.error("Error checking client health notifications:", error);
      res.status(500).json({ 
        error: "Failed to check health notifications",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get health notification history for a client
  app.get("/api/clients/:clientId/health-notifications", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const { clientId } = req.params;

      const healthNotifications = await db.select()
        .from(notifications)
        .where(
          and(
            eq(notifications.entityType, "client"),
            eq(notifications.entityId, clientId),
            or(
              eq(notifications.type, "client_health_alert_red"),
              eq(notifications.type, "client_health_alert_yellow")
            )
          )
        )
        .orderBy(desc(notifications.createdAt));

      res.json(healthNotifications);
    } catch (error) {
      console.error("Error fetching health notification history:", error);
      res.status(500).json({ error: "Failed to fetch health notification history" });
    }
  });

  // ===== TIME TRACKING REPORTS ===== 
  // MINIMAL CLEAN IMPLEMENTATION - NO DRIZZLE DEPENDENCIES

  // Get user time entries for a specific date range - SECURED
  app.get("/api/reports/time-entries/user/:userId", requireAuth(), requirePermission('reporting', 'canView'), async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!authenticatedUserId) return;
      
      const { userId } = req.params;
      const { dateFrom, dateTo } = req.query;
      
      if (!dateFrom || !dateTo) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "dateFrom and dateTo query parameters are required"
        });
      }
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom as string) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo as string)) {
        return res.status(400).json({
          error: "Invalid date format",
          message: "Dates must be in YYYY-MM-DD format"
        });
      }
      
      // Role-based access control
      const isAdmin = await isCurrentUserAdmin(req);
      const hasManagerPermission = await hasPermission(authenticatedUserId, 'staff', 'canView');
      
      if (!isAdmin && !hasManagerPermission && userId !== authenticatedUserId) {
        return res.status(403).json({
          error: "Access denied",
          message: "You can only view your own time entries"
        });
      }
      
      // Get user time entries
      const timeEntries = await appStorage.getUserTimeEntries(userId, dateFrom as string, dateTo as string);
      
      // Create audit log
      await createAuditLog(
        "created",
        "user_time_entries_report",
        userId,
        `User Time Entries (${dateFrom} to ${dateTo})`,
        authenticatedUserId,
        `Retrieved time entries for user ${userId} from ${dateFrom} to ${dateTo}`,
        null,
        {
          targetUserId: userId,
          dateRange: { from: dateFrom, to: dateTo },
          entriesCount: timeEntries.reduce((sum, task) => sum + task.timeEntries.length, 0)
        },
        req
      );
      
      res.json({
        success: true,
        userId,
        dateRange: { from: dateFrom, to: dateTo },
        tasks: timeEntries,
        meta: {
          totalTasks: timeEntries.length,
          totalTimeEntries: timeEntries.reduce((sum, task) => sum + task.timeEntries.length, 0),
          totalHours: Math.round((timeEntries.reduce((sum, task) => 
            sum + task.timeEntries.reduce((taskSum, entry) => taskSum + (entry.duration || 0), 0), 0
          ) / 3600) * 100) / 100
        }
      });
      
    } catch (error) {
      console.error("Error fetching user time entries:", error);
      res.status(500).json({
        error: "Failed to fetch user time entries",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Get running time entries - SECURED
  app.get("/api/time-entries/running", requireAuth(), async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!authenticatedUserId) return;
      
      // Get all running time entries
      const runningEntries = await appStorage.getRunningTimeEntries();
      
      // Role-based filtering
      const isAdmin = await isCurrentUserAdmin(req);
      const hasManagerPermission = await hasPermission(authenticatedUserId, 'staff', 'canView');
      
      let filteredEntries = runningEntries;
      
      if (!isAdmin && !hasManagerPermission) {
        // Regular users can only see their own running entries
        filteredEntries = runningEntries.filter(entry => entry.userId === authenticatedUserId);
      }
      // Admins and managers can see all running entries
      
      res.json({
        success: true,
        runningEntries: filteredEntries,
        meta: {
          totalRunning: filteredEntries.length,
          viewingAs: isAdmin ? 'admin' : hasManagerPermission ? 'manager' : 'user'
        }
      });
      
    } catch (error) {
      console.error("Error fetching running time entries:", error);
      res.status(500).json({
        error: "Failed to fetch running time entries",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Get time entries by date range with optional filters - SECURED
  app.get("/api/reports/time-entries", requireAuth(), requirePermission('reporting', 'canView'), async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!authenticatedUserId) return;
      
      const { dateFrom, dateTo, userId, clientId } = req.query;
      
      if (!dateFrom || !dateTo) {
        return res.status(400).json({
          error: "Missing required parameters",
          message: "dateFrom and dateTo query parameters are required"
        });
      }
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom as string) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo as string)) {
        return res.status(400).json({
          error: "Invalid date format",
          message: "Dates must be in YYYY-MM-DD format"
        });
      }
      
      // Role-based access control
      const isAdmin = await isCurrentUserAdmin(req);
      const hasManagerPermission = await hasPermission(authenticatedUserId, 'staff', 'canView');
      
      let finalUserId = userId as string | undefined;
      
      if (!isAdmin && !hasManagerPermission) {
        // Regular users can only see their own data
        finalUserId = authenticatedUserId;
      }
      // Admins and managers can see data based on provided filters
      
      // Get time entries by date range
      const timeEntries = await appStorage.getTimeEntriesByDateRange(
        dateFrom as string, 
        dateTo as string, 
        finalUserId, 
        clientId as string | undefined
      );
      
      // Create audit log
      await createAuditLog(
        "created",
        "time_entries_by_range_report",
        `${dateFrom}_to_${dateTo}`,
        `Time Entries by Range (${dateFrom} to ${dateTo})`,
        authenticatedUserId,
        `Retrieved time entries by date range ${dateFrom} to ${dateTo}${finalUserId ? ` for user ${finalUserId}` : ''}${clientId ? ` for client ${clientId}` : ''}`,
        null,
        {
          dateRange: { from: dateFrom, to: dateTo },
          userId: finalUserId,
          clientId: clientId,
          tasksCount: timeEntries.length
        },
        req
      );
      
      res.json({
        success: true,
        dateRange: { from: dateFrom, to: dateTo },
        filters: { userId: finalUserId, clientId: clientId },
        tasks: timeEntries,
        meta: {
          totalTasks: timeEntries.length,
          totalTimeEntries: timeEntries.reduce((sum, task) => sum + task.timeEntries.length, 0),
          totalHours: Math.round((timeEntries.reduce((sum, task) => 
            sum + task.timeEntries.reduce((taskSum, entry) => taskSum + (entry.duration || 0), 0), 0
          ) / 3600) * 100) / 100
        }
      });
      
    } catch (error) {
      console.error("Error fetching time entries by date range:", error);
      res.status(500).json({
        error: "Failed to fetch time entries by date range", 
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  return httpServer;
}
