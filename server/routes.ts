import { getGoogleCalendarEventsForView } from "./googleCalendarEventsEndpoint";
import { createCalendarEvent, updateCalendarEventStatus, getEventTimeEntries, createOneOnOneMeetingCalendarEvent } from "./googleCalendarCreateEvent";
import { createOneOnOneMeetingCalendars, deleteOneOnOneMeetingCalendars, updateOneOnOneMeetingCalendars } from "./oneOnOneMeetingService";
import { findFathomRecording } from "./fathomService";
import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import { storage as appStorage } from "./storage";
import { 
  insertClientSchema, insertCampaignSchema, insertLeadSchema, 
  insertTaskSchema, insertTaskSchemaValidated, insertTaskActivitySchema, insertSocialMediaAccountSchema, 
  insertSocialMediaPostSchema, insertSocialMediaTemplateSchema, 
  insertSocialMediaAnalyticsSchema, insertWorkflowSchema, insertEnhancedTaskSchema,
  insertTaskCategorySchema, insertAutomationTriggerSchema, insertAutomationActionSchema,
  insertTemplateFolderSchema, insertEmailTemplateSchema, insertSmsTemplateSchema,
  insertStaffSchema, insertDepartmentSchema, insertPositionSchema, insertPositionKpiSchema, insertTeamPositionSchema, reorderTeamPositionsSchema, insertClientTeamAssignmentSchema, insertCustomFieldSchema, insertCustomFieldFolderSchema,
  insertOrgChartStructureSchema, insertOrgChartNodeSchema, insertOrgChartNodeAssignmentSchema,
  insertTaskCommentSchema, insertTaskCommentReactionSchema, insertCommentFileSchema, insertImageAnnotationSchema,
  insertTimeOffRequestSchema, insertJobApplicationSchema, insertApplicationStageHistorySchema, insertTimeOffBalanceSchema,
  insertJobApplicationWatcherSchema,
  insertJobOpeningSchema, insertJobApplicationFormConfigSchema,
  insertNewHireOnboardingFormConfigSchema, insertNewHireOnboardingSubmissionSchema,
  insertExpenseReportFormConfigSchema, insertExpenseReportSubmissionSchema,
  insertOffboardingFormConfigSchema, insertOffboardingSubmissionSchema,
  insertTagSchema, insertProductSchema, insertProductCategorySchema, insertAuditLogSchema,
  insertRoleSchema, insertPermissionSchema, insertUserRoleSchema, insertGranularPermissionSchema, insertNotificationSettingsSchema,
  insertProductBundleSchema, insertBundleProductSchema,
  insertClientNoteSchema, insertClientTaskSchema, insertClientAppointmentSchema,
  insertClientDocumentSchema, insertDocumentSchema, insertClientTransactionSchema,
  insertCalendarSchema, insertCalendarStaffSchema, insertCalendarAvailabilitySchema,
  insertCalendarAppointmentSchema, insertCustomFieldFileUploadSchema, insertFormFolderSchema,
  insertCalendarIntegrationSchema, insertSmsIntegrationSchema,
  insertLeadPipelineStagSchema, insertLeadSourceSchema, insertLeadNoteTemplateSchema, insertLeadNoteSchema, insertLeadAppointmentSchema,
  insertTaskDependencySchema, insertTaskStatusSchema, insertTaskPrioritySchema, insertTaskSettingsSchema,
  insertScheduledEmailSchema,
  insertTeamWorkflowSchema, insertTeamWorkflowStatusSchema,
  insertTrainingCategorySchema, insertTrainingCourseSchema, insertTrainingModuleSchema, insertTrainingLessonSchema,
  insertTrainingEnrollmentSchema, insertTrainingProgressSchema, insertTrainingQuizSchema,
  insertTrainingQuizQuestionSchema, insertTrainingQuizAttemptSchema, insertTrainingAssignmentSchema,
  insertTrainingAssignmentSubmissionSchema, insertTrainingDiscussionSchema, insertTrainingDiscussionLikeSchema,
  insertTrainingLessonResourceSchema,
  inputClientHealthScoreSchema, insertClientHealthScoreSchema,
  insertSmartListSchema, insertTaskTemplateSchema,
  insertClientBriefSectionSchema, insertClientBriefValueSchema,
  insertQuoteSchema, insertQuoteItemSchema,
  updateSalesSettingsSchema,
  insertSalesTargetSchema, updateSalesTargetSchema,
  insertCapacitySettingsSchema, updateCapacitySettingsSchema,
  insertDashboardSchema,
  insertOneOnOneMeetingSchema, insertOneOnOneTalkingPointSchema, insertOneOnOneWinSchema, insertOneOnOneActionItemSchema, insertOneOnOneGoalSchema, insertOneOnOneCommentSchema, insertOneOnOneProgressionStatusSchema,
  oneOnOneProgressionStatuses,
  users, authUsers, businessProfile, customFields, customFieldFolders, staff, departments, positions, tags, products, productCategories, auditLogs,
  roles, permissions, userRoles, granularPermissions, notificationSettings, clientProducts, clientBundles, productBundles, bundleProducts,
  clientNotes, clientTasks, clientAppointments, clientDocuments, clientContacts, documents, clientTransactions, clientHealthScores, clients,
  calendars, calendarStaff, calendarAvailability, calendarAppointments, calendarDateOverrides, calendarIntegrations, eventTimeEntries, smsIntegrations, emailIntegrations, customFieldFileUploads,
  forms, formFields, formSubmissions, formFolders, leads, leadPipelineStages, leadNotes, leadAppointments, tasks, taskActivities, taskComments, taskCommentReactions, commentFiles, taskAttachments,
  socialMediaAccounts, socialMediaPosts, workflows, workflowTemplates, workflowExecutions, workflowActionAnalytics, automationTriggers, automationActions, imageAnnotations, taskDependencies, notifications,
  taskStatuses, taskPriorities, taskSettings, teamWorkflows, teamWorkflowStatuses, taskTemplates,
  timeOffPolicies, timeOffTypes, timeOffRequests, timeOffRequestDays, jobApplications, jobApplicationComments, jobApplicationWatchers, applicationStageHistory, timeOffBalances,
  jobOpenings, jobApplicationFormConfig, newHireOnboardingFormConfig, newHireOnboardingSubmissions, expenseReportFormConfig, expenseReportSubmissions, offboardingFormConfig, offboardingSubmissions, teamPositions, clientTeamAssignments,
  trainingCategories, trainingCourses, trainingModules, trainingLessons, trainingEnrollments, trainingProgress, trainingCoursePermissions,
  trainingQuizzes, trainingQuizQuestions, trainingQuizAttempts, trainingAssignments, 
  trainingAssignmentSubmissions, trainingDiscussions, trainingDiscussionLikes, trainingLessonResources,
  clientPortalUsers, quotes, quoteItems, leadStageTransitions, salesActivities, deals, salesSettings, salesTargets, capacitySettings,
  knowledgeBaseCategories, knowledgeBaseArticles, knowledgeBaseComments, knowledgeBaseViews, knowledgeBaseLikes, knowledgeBaseBookmarks, knowledgeBasePermissions, knowledgeBaseArticleVersions,
  oneOnOneMeetings, oneOnOneTalkingPoints, oneOnOneWins, oneOnOneActionItems, oneOnOneGoals, oneOnOneComments, oneOnOneMeetingKpiStatuses,
  clientRoadmapComments, insertClientRoadmapCommentSchema, clientRoadmapEntries, insertClientRoadmapEntrySchema, staffLinkedEmails,
  surveys, surveyFolders, surveySlides, surveyFields, surveyLogicRules, surveySubmissions, surveySubmissionAnswers,
  insertSurveySchema, insertSurveyFolderSchema, insertSurveySlideSchema, insertSurveyFieldSchema, insertSurveyLogicRuleSchema, insertSurveySubmissionSchema,
  taskIntakeForms, taskIntakeQuestions, taskIntakeOptions, taskIntakeLogicRules, taskIntakeAssignmentRules,
  insertTaskIntakeFormSchema, insertTaskIntakeQuestionSchema, insertTaskIntakeOptionSchema, insertTaskIntakeLogicRuleSchema, insertTaskIntakeAssignmentRuleSchema,
  aiIntegrations,
  aiAssistantSettings,
  slackWorkspaces
} from "@shared/schema";
import { SALES_CONFIG, ROLE_NAMES } from "@shared/constants";
import { z } from "zod";
import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { ObjectStorageService, ObjectNotFoundError, validateFileType, isForbiddenFileType, sanitizeFileName } from "./objectStorage";
import { db } from "./db";
import { google } from "googleapis";
import twilio from "twilio";
import mailgun from "mailgun.js";
import formData from "form-data";
import { NotificationService } from "./notification-service";
import { EncryptionService } from "./encryption";
import { eq, like, ilike, or, and, asc, desc, sql, inArray, isNotNull, gte, lte, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { permissionAuditService } from "./permissionAuditService";
import { nanoid } from "nanoid";
import { calculateHealthMetrics, analyzeHealthStatus } from "@shared/utils/healthAnalysis";
import { emitTrigger } from "./workflow-engine";
import { 
  requireAuth, 
  requirePermission,
  requireGranularPermission,
  requireRole,
  requireAdmin,
  getAuthenticatedUserId,
  getAuthenticatedUserIdOrFail,
  getAuthenticatedAuditContext,
  getImpersonationContext,
  isImpersonating,
  getOriginalAdminUserId,
  getAuditContext,
  isCurrentUserAdmin,
  hasPermission,
  IS_DEVELOPMENT,
  MOCK_ADMIN_USER_ID,
  normalizeUserIdForDb,
  // Client portal auth functions
  requireClientPortalAuth,
  getAuthenticatedClientPortalUserId,
  getAuthenticatedClientPortalUserIdOrFail
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

  // Initialize NotificationService for multi-channel notifications
  const notificationService = new NotificationService(appStorage);

  // Configure multer for file uploads  
  const multerStorage = multer.memoryStorage();
  const upload = multer({ 
    storage: multerStorage, // Use local variable to avoid any scope confusion
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
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


  // POST /api/auth/forgot-password - Request password reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Find auth user by email
      const authUser = await appStorage.getAuthUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!authUser) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return res.json({ success: true, message: "If the email exists, a reset link will be sent" });
      }
      
      // Generate secure reset token
      // Using imported randomBytes from crypto
      const resetToken = randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now
      
      // Store token in database
      await db.update(authUsers)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        })
        .where(eq(authUsers.id, authUser.id));
      
      // Get staff info for the email
      const [staffMember] = await db.select()
        .from(staff)
        .where(eq(staff.id, authUser.userId));
      
      // Send reset email using Mailgun directly
      const Mailgun = (await import("mailgun.js")).default;
      const formData = (await import("form-data")).default;
      const mailgun = new Mailgun(formData);
      
      // Get email configuration from database
      const [emailConfig] = await db.select()
        .from(emailIntegrations)
        .where(eq(emailIntegrations.isActive, true))
        .limit(1);
      
      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0]
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : (process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : 'http://localhost:5000');
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      
      if (emailConfig) {
        try {
          const decryptedApiKey = EncryptionService.decrypt(emailConfig.apiKey);
          const mg = mailgun.client({ username: 'api', key: decryptedApiKey });
          await mg.messages.create(emailConfig.domain, {
            from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
            to: email,
            subject: "AgencyBoost - Password Reset Request",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00C9C6;">Password Reset Request</h2>
                <p>Hi ${staffMember?.firstName || "there"},</p>
                <p>We received a request to reset your AgencyBoost password. Click the button below to set a new password:</p>
                <p style="margin: 30px 0;">
                  <a href="${resetUrl}" style="background-color: #00C9C6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Reset Password
                  </a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">AgencyBoost CRM</p>
              </div>
            `,
            text: `Password Reset Request\n\nHi ${staffMember?.firstName || "there"},\n\nWe received a request to reset your AgencyBoost password.\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this password reset, you can safely ignore this email.\n\nAgencyBoost CRM`,
          });
          console.log(`Password reset email sent to ${email}`);
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
        }
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
          case 'meeting':
            filterConditions = and(eq(auditLogs.entityType, 'meeting'), sql`(${auditLogs.newValues}->>ientId\) = ${entityId}`);
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

  // Simple role names for permissions assignment - available to managers and admins
  app.get("/api/roles/names", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      // Check if user is admin or manager
      const [currentUser] = await db.select({ role: staff.role })
        .from(staff)
        .where(eq(staff.id, userId));

      if (!currentUser || !['Admin', 'Manager'].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const roleNames = await db
        .select({
          name: roles.name,
        })
        .from(roles)
        .orderBy(asc(roles.name));

      res.json(roleNames.map(r => r.name));
    } catch (error) {
      console.error('Error fetching role names:', error);
      res.status(500).json({ message: "Failed to fetch role names" });
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

      // Get permissions and granular permissions for each role
      const rolesWithPermissionsData = await Promise.all(
        rolesWithPermissions.map(async (role) => {
          const rolePermissions = await db
            .select()
            .from(permissions)
            .where(eq(permissions.roleId, role.id));
          
          const roleGranularPermissions = await db
            .select()
            .from(granularPermissions)
            .where(eq(granularPermissions.roleId, role.id));
          
          return {
            ...role,
            permissions: rolePermissions,
            granularPermissions: roleGranularPermissions
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
      
      const { permissions: rolePermissions, granularPermissions: roleGranularPermissions, ...roleData } = req.body;
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
      
      // Create granular permissions for the role
      if (roleGranularPermissions && typeof roleGranularPermissions === 'object') {
        const granularPermsToInsert = [];
        for (const [module, modulePerms] of Object.entries(roleGranularPermissions)) {
          if (modulePerms && typeof modulePerms === 'object' && 'subPermissions' in modulePerms) {
            const subPermissions = (modulePerms as any).subPermissions;
            for (const [permissionKey, enabled] of Object.entries(subPermissions)) {
              if (enabled) {
                granularPermsToInsert.push({
                  roleId: newRole.id,
                  module,
                  permissionKey,
                  enabled: Boolean(enabled),
                });
              }
            }
          }
        }
        
        if (granularPermsToInsert.length > 0) {
          await db.insert(granularPermissions).values(granularPermsToInsert);
        }
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
      
      const { permissions: rolePermissions, granularPermissions: roleGranularPermissions, ...roleData } = req.body;
      
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
      
      // Update granular permissions - delete existing and insert new ones
      await db.delete(granularPermissions).where(eq(granularPermissions.roleId, req.params.id));
      
      if (roleGranularPermissions && typeof roleGranularPermissions === 'object') {
        const granularPermsToInsert = [];
        for (const [module, modulePerms] of Object.entries(roleGranularPermissions)) {
          if (modulePerms && typeof modulePerms === 'object' && 'subPermissions' in modulePerms) {
            const subPermissions = (modulePerms as any).subPermissions;
            for (const [permissionKey, enabled] of Object.entries(subPermissions)) {
              if (enabled) {
                granularPermsToInsert.push({
                  roleId: req.params.id,
                  module,
                  permissionKey,
                  enabled: Boolean(enabled),
                });
              }
            }
          }
        }
        
        if (granularPermsToInsert.length > 0) {
          await db.insert(granularPermissions).values(granularPermsToInsert);
        }
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


  // Roles & Permissions CSV Export/Import - SECURED (Admin Only)
  app.get("/api/roles-permissions/export", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { generateCSV } = await import('./lib/roles-permissions-csv');
      
      // Fetch all roles with their granular permissions
      const allRoles = await db
        .select({
          id: roles.id,
          name: roles.name,
        })
        .from(roles)
        .orderBy(asc(roles.name));

      // Build role permission data
      const roleDataList: Array<{ roleName: string; permissions: { [key: string]: boolean } }> = [];
      
      for (const role of allRoles) {
        const roleGranularPerms = await db
          .select({
            permissionKey: granularPermissions.permissionKey,
            enabled: granularPermissions.enabled,
          })
          .from(granularPermissions)
          .where(eq(granularPermissions.roleId, role.id));
        
        const permissionsMap: { [key: string]: boolean } = {};
        for (const perm of roleGranularPerms) {
          permissionsMap[perm.permissionKey] = perm.enabled ?? false;
        }
        
        roleDataList.push({
          roleName: role.name,
          permissions: permissionsMap,
        });
      }
      
      const csvContent = generateCSV(roleDataList);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="roles-permissions.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting roles permissions:', error);
      res.status(500).json({ message: "Failed to export roles permissions" });
    }
  });

  app.post("/api/roles-permissions/import", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;
      
      const { parseCSV, getAllValidPermissionKeys } = await import('./lib/roles-permissions-csv');
      const { csvContent } = req.body;
      
      if (!csvContent || typeof csvContent !== 'string') {
        return res.status(400).json({ message: "CSV content is required" });
      }
      
      // Get existing role names for comparison
      const existingRoles = await db
        .select({ name: roles.name, id: roles.id })
        .from(roles);
      const existingRoleNames = existingRoles.map(r => r.name);
      
      // Parse and validate CSV
      const parseResult = parseCSV(csvContent, existingRoleNames);
      
      if (!parseResult.success) {
        return res.status(400).json({
          message: "CSV validation failed",
          errors: parseResult.errors,
          warnings: parseResult.warnings,
        });
      }
      
      // Return preview data
      res.json({
        success: true,
        preview: {
          newRoles: parseResult.newRoles,
          existingRoles: parseResult.existingRoles,
          warnings: parseResult.warnings,
          totalRoles: parseResult.roles.length,
          totalPermissions: getAllValidPermissionKeys().length,
        },
        roles: parseResult.roles,
      });
    } catch (error) {
      console.error('Error parsing roles permissions CSV:', error);
      res.status(500).json({ message: "Failed to parse CSV" });
    }
  });

  app.post("/api/roles-permissions/apply", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;
      
      const { getAllValidPermissionKeys } = await import('./lib/roles-permissions-csv');
      const { roles: roleDataList } = req.body;
      
      if (!roleDataList || !Array.isArray(roleDataList)) {
        return res.status(400).json({ message: "Role data is required" });
      }
      
      // Get existing roles
      const existingRoles = await db
        .select({ name: roles.name, id: roles.id })
        .from(roles);
      const existingRoleMap = new Map(existingRoles.map(r => [r.name, r.id]));
      
      const validPermissionKeys = new Set(getAllValidPermissionKeys());
      const results = {
        created: [] as string[],
        updated: [] as string[],
        errors: [] as string[],
      };
      
      for (const roleData of roleDataList) {
        try {
          let roleId = existingRoleMap.get(roleData.roleName);
          
          if (!roleId) {
            // Create new role
            const [newRole] = await db.insert(roles).values({
              name: roleData.roleName,
              description: `Imported from CSV`,
              isSystem: false,
            }).returning();
            roleId = newRole.id;
            results.created.push(roleData.roleName);
            
            // Create audit log for role creation
            await createAuditLog(
              "created",
              "role",
              newRole.id,
              newRole.name,
              userId,
              `Created role '\${newRole.name}' via CSV import`,
              null,
              newRole,
              req
            );
          } else {
            results.updated.push(roleData.roleName);
          }
          
          // Update granular permissions for this role
          // First, delete existing granular permissions for this role
          await db.delete(granularPermissions).where(eq(granularPermissions.roleId, roleId));
          
          // Insert new granular permissions
          const permsToInsert = [];
          for (const [permKey, enabled] of Object.entries(roleData.permissions)) {
            if (validPermissionKeys.has(permKey)) {
              const [modulePart] = permKey.split('.');
              permsToInsert.push({
                roleId: roleId,
                module: modulePart,
                permissionKey: permKey,
                enabled: enabled === true,
              });
            }
          }
          
          if (permsToInsert.length > 0) {
            await db.insert(granularPermissions).values(permsToInsert);
          }
          
          // Create audit log for permission update
          await createAuditLog(
            "updated",
            "role",
            roleId,
            roleData.roleName,
            userId,
            `Updated permissions for role '\${roleData.roleName}' via CSV import`,
            null,
            { permissions: roleData.permissions },
            req
          );
        } catch (roleError: any) {
          results.errors.push(`Error processing role '\${roleData.roleName}': \${roleError.message}`);
        }
      }
      
      res.json({
        success: results.errors.length === 0,
        results,
      });
    } catch (error) {
      console.error('Error applying roles permissions:', error);
      res.status(500).json({ message: "Failed to apply roles permissions" });
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
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
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
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
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
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
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
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
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

      // Notify client followers about the new note
      try {
        const clientData = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
        const clientRecord = clientData[0];
        
        if (clientRecord && clientRecord.followers && clientRecord.followers.length > 0) {
          const clientName = clientRecord.company || clientRecord.name || 'Unknown Client';
          const authorName = `${user.firstName} ${user.lastName}`;
          
          // Create notifications for each follower (except the author)
          for (const followerId of clientRecord.followers) {
            if (followerId !== databaseUserId && followerId !== userId) {
              await db.insert(notifications).values({
                userId: followerId,
                type: "client_note",
                title: "New note on followed client",
                message: `${authorName} added a note to ${clientName}: "${content.substring(0, 80)}${content.length > 80 ? '...' : ''}"`,
                entityType: "client",
                entityId: clientId,
                priority: "normal",
                actionUrl: `/clients/${clientId}`,
                actionText: "View Client",
                metadata: {
                  noteId: createdNote.id,
                  authorId: databaseUserId,
                  authorName: authorName
                }
              });
            }
          }
        }
      } catch (notificationError) {
        console.error("Failed to create follower notifications:", notificationError);
        // Don't fail the request if notification creation fails
      }

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


  // === CLIENT CONTACTS ===
  // Get all contacts for a client
  app.get("/api/clients/:clientId/contacts", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const clientId = req.params.clientId;
      
      const contacts = await db
        .select({
          id: clientContacts.id,
          clientId: clientContacts.clientId,
          firstName: clientContacts.firstName,
          lastName: clientContacts.lastName,
          email: clientContacts.email,
          phone: clientContacts.phone,
          title: clientContacts.title,
          isPrimary: clientContacts.isPrimary,
          notes: clientContacts.notes,
          createdAt: clientContacts.createdAt,
          updatedAt: clientContacts.updatedAt,
          createdBy: {
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName
          }
        })
        .from(clientContacts)
        .leftJoin(staff, eq(clientContacts.createdBy, staff.id))
        .where(eq(clientContacts.clientId, clientId))
        .orderBy(desc(clientContacts.isPrimary), asc(clientContacts.firstName));
      
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching client contacts:", error);
      res.status(500).json({ error: "Failed to fetch client contacts" });
    }
  });

  // Create a new client contact
  app.post("/api/clients/:clientId/contacts", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;
      
      const { firstName, lastName, email, phone, title, isPrimary, notes } = req.body;
      
      if (!firstName?.trim()) {
        return res.status(400).json({ error: "First name is required" });
      }
      
      const databaseUserId = await normalizeUserIdForDb(userId);
      
      // If this contact is set as primary, unset other primary contacts first
      if (isPrimary) {
        await db.update(clientContacts)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(and(eq(clientContacts.clientId, clientId), eq(clientContacts.isPrimary, true)));
      }
      
      const [newContact] = await db.insert(clientContacts).values({
        clientId,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        title: title?.trim() || null,
        isPrimary: isPrimary || false,
        notes: notes?.trim() || null,
        createdBy: databaseUserId,
      }).returning();
      
      // Create audit log
      await createAuditLog(
        "created",
        "client_contact",
        newContact.id,
        `${newContact.firstName} ${newContact.lastName || ''}`.trim(),
        databaseUserId,
        `Created contact for client`,
        null,
        newContact,
        req
      );
      
      res.status(201).json(newContact);
    } catch (error) {
      console.error("Error creating client contact:", error);
      res.status(500).json({ error: "Failed to create client contact" });
    }
  });

  // Update a client contact
  app.put("/api/clients/:clientId/contacts/:contactId", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    try {
      const { clientId, contactId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;
      
      const { firstName, lastName, email, phone, title, isPrimary, notes } = req.body;
      
      if (!firstName?.trim()) {
        return res.status(400).json({ error: "First name is required" });
      }
      
      // Get existing contact
      const [existingContact] = await db.select()
        .from(clientContacts)
        .where(and(eq(clientContacts.id, contactId), eq(clientContacts.clientId, clientId)));
      
      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      const databaseUserId = await normalizeUserIdForDb(userId);
      
      // If this contact is being set as primary, unset other primary contacts first
      if (isPrimary && !existingContact.isPrimary) {
        await db.update(clientContacts)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(and(eq(clientContacts.clientId, clientId), eq(clientContacts.isPrimary, true)));
      }
      
      const [updatedContact] = await db.update(clientContacts)
        .set({
          firstName: firstName.trim(),
          lastName: lastName?.trim() || null,
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          title: title?.trim() || null,
          isPrimary: isPrimary || false,
          notes: notes?.trim() || null,
          updatedAt: new Date(),
        })
        .where(and(eq(clientContacts.id, contactId), eq(clientContacts.clientId, clientId)))
        .returning();
      
      // Create audit log
      await createAuditLog(
        "updated",
        "client_contact",
        updatedContact.id,
        `${updatedContact.firstName} ${updatedContact.lastName || ''}`.trim(),
        databaseUserId,
        `Updated contact for client`,
        existingContact,
        updatedContact,
        req
      );
      
      res.json(updatedContact);
    } catch (error) {
      console.error("Error updating client contact:", error);
      res.status(500).json({ error: "Failed to update client contact" });
    }
  });

  // Delete a client contact
  app.delete("/api/clients/:clientId/contacts/:contactId", requireAuth(), requirePermission('clients', 'canDelete'), async (req, res) => {
    try {
      const { clientId, contactId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;
      
      // Get existing contact
      const [existingContact] = await db.select()
        .from(clientContacts)
        .where(and(eq(clientContacts.id, contactId), eq(clientContacts.clientId, clientId)));
      
      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      const databaseUserId = await normalizeUserIdForDb(userId);
      
      await db.delete(clientContacts)
        .where(and(eq(clientContacts.id, contactId), eq(clientContacts.clientId, clientId)));
      
      // Create audit log
      await createAuditLog(
        "deleted",
        "client_contact",
        existingContact.id,
        `${existingContact.firstName} ${existingContact.lastName || ''}`.trim(),
        databaseUserId,
        `Deleted contact from client`,
        existingContact,
        null,
        req
      );
      
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting client contact:", error);
      res.status(500).json({ error: "Failed to delete client contact" });
    }
  });

  // Set a contact as primary
  app.patch("/api/clients/:clientId/contacts/:contactId/set-primary", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    try {
      const { clientId, contactId } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;
      
      // Get existing contact
      const [existingContact] = await db.select()
        .from(clientContacts)
        .where(and(eq(clientContacts.id, contactId), eq(clientContacts.clientId, clientId)));
      
      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      const databaseUserId = await normalizeUserIdForDb(userId);
      
      // Unset all other primary contacts for this client
      await db.update(clientContacts)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(and(eq(clientContacts.clientId, clientId), eq(clientContacts.isPrimary, true)));
      
      // Set this contact as primary
      const [updatedContact] = await db.update(clientContacts)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(and(eq(clientContacts.id, contactId), eq(clientContacts.clientId, clientId)))
        .returning();
      
      res.json(updatedContact);
    } catch (error) {
      console.error("Error setting primary contact:", error);
      res.status(500).json({ error: "Failed to set primary contact" });
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
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      // Validate only the fields from the request body (not authorId which comes from session)
      const requestSchema = insertLeadNoteSchema.pick({ content: true, leadId: true, isLocked: true });
      const validatedData = requestSchema.parse(req.body);
      const noteData = {
        ...validatedData,
        authorId: userId
      };
      const [note] = await db.insert(leadNotes).values(noteData).returning();
      
      await createAuditLog(
        "created",
        "lead_note",
        note.id,
        `Note for lead ${validatedData.leadId}`,
        userId,
        "Lead note created",
        null,
        noteData,
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

  // === SALES ACTIVITIES SYNC HELPER ===
  async function syncLeadAppointmentToSalesActivity(appointment: any) {
    try {
      // Map appointment status to sales activity outcome
      const statusToOutcomeMap: { [key: string]: string } = {
        'confirmed': 'scheduled',
        'showed': 'completed',
        'no_show': 'no_show',
        'cancelled': 'cancelled',
        'pending': 'scheduled'
      };

      // Validate and map activity type to allowed sales activity types
      const validActivityTypes = ['appointment', 'pitch', 'demo', 'follow-up'];
      let activityType = 'appointment'; // default
      
      if (appointment.activityType) {
        const normalized = appointment.activityType.toLowerCase().trim();
        if (validActivityTypes.includes(normalized)) {
          activityType = normalized;
        } else {
          console.warn(`Invalid activity type "${appointment.activityType}" - using default "appointment"`);
        }
      }

      const outcome = statusToOutcomeMap[appointment.status] || 'scheduled';
      const completedAt = appointment.status === 'showed' ? new Date() : null;

      // Check if a sales activity already exists for this appointment
      const existing = await db
        .select()
        .from(salesActivities)
        .where(sql`${salesActivities.notes} LIKE '%[appointment_id:' || ${appointment.id} || ']%'`)
        .limit(1);

      const salesActivityData = {
        leadId: appointment.leadId,
        type: activityType,
        outcome,
        notes: `${appointment.title || ''}\n${appointment.description || ''}\n[appointment_id:${appointment.id}]`,
        assignedTo: appointment.assignedTo,
        scheduledAt: appointment.startTime,
        completedAt,
      };

      if (existing && existing.length > 0) {
        // Update existing sales activity
        await db
          .update(salesActivities)
          .set(salesActivityData)
          .where(eq(salesActivities.id, existing[0].id));
        console.log(`✅ Updated sales activity ${existing[0].id} for appointment ${appointment.id}`);
      } else {
        // Create new sales activity
        await db.insert(salesActivities).values(salesActivityData);
        console.log(`✅ Created sales activity for appointment ${appointment.id}`);
      }
    } catch (error) {
      console.error('Error syncing lead appointment to sales activity:', error);
      // Don't throw - we don't want to fail the appointment creation if sync fails
    }
  }

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
      
      // Sync to sales activities
      await syncLeadAppointmentToSalesActivity(appointment);
      
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

      // Sync to sales activities
      await syncLeadAppointmentToSalesActivity(appointment);

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

  app.post("/api/tasks/:taskId/comments", requireAuth(), requirePermission('tasks', 'canView'), async (req, res) => {
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

      // Validate and create notifications for mentioned users
      if (mentions && mentions.length > 0) {
        // Extract actual @mentions from the comment content (supports Unicode, apostrophes, hyphens)
        const mentionRegex = /@([\p{L}\p{M}\p{N}\s'-]+)/gu;
        const mentionMatches = Array.from(content.matchAll(mentionRegex));
        const mentionNames = mentionMatches.map(match => match[1].trim().toLowerCase());
        
        // Get all staff to validate mentions
        const allStaff = await db.select().from(staff);
        
        // Build a set of valid user IDs that are actually mentioned in the content
        const validMentionIds = new Set<string>();
        mentionNames.forEach(mentionName => {
          const staffMember = allStaff.find((s: any) => {
            const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
            const name = s.name?.toLowerCase();
            return fullName === mentionName || name === mentionName;
          });
          if (staffMember) {
            validMentionIds.add(staffMember.id);
          }
        });
        
        // Only notify users whose IDs are both submitted AND validated as present in content
        for (const mentionedUserId of mentions) {
          if (validMentionIds.has(mentionedUserId) && mentionedUserId !== userId) {
            void notificationService.notifyMentioned(
              mentionedUserId,  // Who to notify
              userId,           // Who mentioned them (author ID)
              'task',           // Context type
              taskId,           // Context ID
              content.trim()    // Comment content
            ).catch(err => console.error('[Notification] Failed to send mention notification:', err));
          }
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

      // Log task activity for the comment
      const authorName = `${author.firstName} ${author.lastName}`.trim();
      await db.insert(taskActivities).values({
        taskId: taskId,
        actionType: "comment_added",
        fieldName: "comment",
        newValue: content.trim().substring(0, 100),
        userId,
        userName: authorName,
      });

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

  // Get unread notification count - SECURED
  app.get("/api/notifications/unread-count", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );
      
      res.json({ count: Number(result[0]?.count || 0) });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
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
      
      console.log('[Document Registration] Request body:', { fileName, fileType, fileSize, fileUrl: fileUrl?.substring(0, 100), clientId });

      // Validate required fields
      if (!fileName || !fileType || !fileSize || !fileUrl || !clientId) {
        console.log('[Document Registration] Missing required fields:', { hasFileName: !!fileName, hasFileType: !!fileType, hasFileSize: !!fileSize, hasFileUrl: !!fileUrl, hasClientId: !!clientId });
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

      // Emit file_uploaded trigger
      try {
        await emitTrigger('file_uploaded', {
          fileName: sanitizedFileName,
          fileType: documentData.fileType,
          fileSize: documentData.fileSize,
          uploadedBy: uploadedBy,
          location: 'client_documents',
          clientId: clientId,
          documentId: document.id,
          uploadedAt: new Date(),
        });
      } catch (triggerError) {
        console.error('Failed to emit file_uploaded trigger:', triggerError);
        // Don't fail the upload if trigger fails
      }

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
          uploaderName: sql<string>`concat(${staff.firstName}, ' ', ${staff.lastName})`
        })
        .from(documents)
        .leftJoin(staff, sql`${documents.uploadedBy}::uuid = ${staff.id}`)
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
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
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
      
      const user = userData[0];
      
      // Get user's permissions from their role
      let userPermissions: any[] = [];
      let userGranularPermissions: any[] = [];
      
      if (user.roleId) {
        userPermissions = await db.select({
          module: permissions.module,
          canView: permissions.canView,
          canCreate: permissions.canCreate,
          canEdit: permissions.canEdit,
          canDelete: permissions.canDelete,
          canManage: permissions.canManage,
          canExport: permissions.canExport,
          canImport: permissions.canImport,
          dataAccessLevel: permissions.dataAccessLevel,
        }).from(permissions)
        .where(eq(permissions.roleId, user.roleId));
        
        // Also get granular permissions
        userGranularPermissions = await db.select({
          module: granularPermissions.module,
          permissionKey: granularPermissions.permissionKey,
          enabled: granularPermissions.enabled,
        }).from(granularPermissions)
        .where(eq(granularPermissions.roleId, user.roleId));
      }
      
      // Return user data with both permissions arrays
      // Include roles as array for frontend compatibility
      res.json({
        ...user,
        roles: user.role ? [user.role] : [],
        permissions: userPermissions,
        granularPermissions: userGranularPermissions
      });
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

      // Construct public booking URLs from customUrl
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const calendarsWithPublicUrl = calendarsData.map(calendar => ({
        ...calendar,
        publicUrl: `${baseUrl}/book/${calendar.customUrl}`
      }));

      res.json(calendarsWithPublicUrl);
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

      // Construct public booking URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const calendarWithStaff = {
        ...calendar,
        assignedStaff: assignedStaffRecord?.staffId || null,
        publicUrl: `${baseUrl}/book/${calendar.customUrl}`
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

  // Utility function to interpolate merge tags in appointment fields
  function interpolateAppointmentMergeTags(text: string | null, appointment: any): string {
    if (!text) return "";
    
    return text.replace(/\{\{([^}]+)\}\}/g, (match, tag) => {
      const trimmedTag = tag.trim();
      
      // Lead information tags
      if (trimmedTag === 'name') return appointment.leadName || match;
      if (trimmedTag === 'email') return appointment.leadEmail || match;
      if (trimmedTag === 'phone') return appointment.leadPhone || match;
      if (trimmedTag === 'company') return appointment.leadCompany || match;
      if (trimmedTag === 'source') return appointment.leadSource || match;
      if (trimmedTag === 'status') return appointment.leadStatus || match;
      if (trimmedTag === 'value') return appointment.leadValue ? `$${appointment.leadValue}` : match;
      if (trimmedTag === 'assignedTo') return appointment.leadAssignedToName || match;
      
      // Appointment details tags
      if (trimmedTag === 'appointmentDate') {
        return appointment.startTime ? new Date(appointment.startTime).toLocaleDateString() : match;
      }
      if (trimmedTag === 'appointmentTime') {
        return appointment.startTime ? new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : match;
      }
      if (trimmedTag === 'calendarName') return appointment.calendarName || match;
      if (trimmedTag === 'teamMember') {
        return appointment.staffFirstName && appointment.staffLastName 
          ? `${appointment.staffFirstName} ${appointment.staffLastName}` 
          : match;
      }
      
      // Other tags
      if (trimmedTag === 'notes') return appointment.leadNotes || match;
      if (trimmedTag === 'lastContactDate') {
        return appointment.leadLastContactDate 
          ? new Date(appointment.leadLastContactDate).toLocaleDateString() 
          : match;
      }
      if (trimmedTag === 'location') return appointment.location || match;
      
      // If no match found, return the original tag
      return match;
    });
  }

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
          activityType: leadAppointments.activityType,
          // Lead details
          leadName: leads.name,
          leadEmail: leads.email,
          leadPhone: leads.phone,
          leadCompany: leads.company,
          leadSource: leads.source,
          leadStatus: leads.status,
          leadValue: leads.value,
          leadNotes: leads.notes,
          leadLastContactDate: leads.lastContactDate,
          leadAssignedTo: leads.assignedTo,
          // Staff details (for team member assigned to appointment)
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

      const rawAppointments = await query.orderBy(asc(leadAppointments.startTime));
      
      // Get assigned staff names for leads
      const appointmentsWithStaffNames = await Promise.all(
        rawAppointments.map(async (apt) => {
          let leadAssignedToName = null;
          if (apt.leadAssignedTo) {
            const [assignedStaff] = await db
              .select({
                firstName: staff.firstName,
                lastName: staff.lastName,
              })
              .from(staff)
              .where(eq(staff.id, apt.leadAssignedTo));
            
            if (assignedStaff) {
              leadAssignedToName = `${assignedStaff.firstName} ${assignedStaff.lastName}`;
            }
          }
          
          return {
            ...apt,
            leadAssignedToName,
          };
        })
      );

      // Interpolate merge tags in title and description
      const interpolatedAppointments = appointmentsWithStaffNames.map(apt => ({
        ...apt,
        title: interpolateAppointmentMergeTags(apt.title, apt),
        description: interpolateAppointmentMergeTags(apt.description, apt),
      }));

      res.json(interpolatedAppointments);
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
        
        // Apply merge tag interpolation to lead appointments
        const interpolatedLeadAppointments = leadAppointmentsData.map(apt => ({
          ...apt,
          title: interpolateAppointmentMergeTags(apt.title, apt),
          description: interpolateAppointmentMergeTags(apt.description, apt),
        }));
        
        // Combine both types of appointments
        allAppointments = [...regularAppointments, ...interpolatedLeadAppointments];
        
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

  // Update calendar appointment status (auto-creates time entry when "Showed")
  app.patch("/api/calendar-appointments/:id/status", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const { id } = req.params;
      const { appointmentStatus } = req.body;

      if (!appointmentStatus || !['confirmed', 'showed', 'no_show', 'cancelled'].includes(appointmentStatus)) {
        return res.status(400).json({ error: 'Valid appointment status is required (confirmed, showed, no_show, cancelled)' });
      }

      console.log('[UpdateAppointmentStatus] Updating internal appointment status:', { userId, id, appointmentStatus });

      const [existingAppointment] = await db
        .select()
        .from(calendarAppointments)
        .where(eq(calendarAppointments.id, id))
        .limit(1);

      if (!existingAppointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const isAdmin = await isCurrentUserAdmin(userId);
      if (!isAdmin && existingAppointment.assignedTo !== userId) {
        return res.status(403).json({ error: 'You do not have permission to update this appointment' });
      }

      const [updatedAppointment] = await db
        .update(calendarAppointments)
        .set({
          status: appointmentStatus,
          updatedAt: new Date(),
        })
        .where(eq(calendarAppointments.id, id))
        .returning();

      if (appointmentStatus === 'showed' && !existingAppointment.timeEntryCreated) {
        try {
          const startTime = new Date(existingAppointment.startTime);
          const endTime = new Date(existingAppointment.endTime);
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationMinutes = Math.round(durationMs / (1000 * 60));

          const taskId = randomUUID();
          const timeEntryId = randomUUID();
          const eventTitle = existingAppointment.title || 'Untitled Appointment';
          
          const timeEntry = {
            id: timeEntryId,
            userId: userId,
            userName: '',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: durationMinutes,
            description: `Auto-logged from calendar appointment: ${eventTitle}`,
            source: 'calendar_auto',
          };

          let fathomRecordingUrl: string | null = null;
          try {
            const [staffRecord] = await db
              .select()
              .from(staff)
              .where(eq(staff.id, userId))
              .limit(1);

            if ((staffRecord as any)?.fathomApiKey) {
              console.log('[UpdateAppointmentStatus] Searching for Fathom recording...');
              fathomRecordingUrl = await findFathomRecording(
                (staffRecord as any).fathomApiKey,
                startTime,
                endTime,
                eventTitle
              );
              if (fathomRecordingUrl) {
                console.log('[UpdateAppointmentStatus] Found Fathom recording:', fathomRecordingUrl);
              }
            }
          } catch (fathomError) {
            console.error('[UpdateAppointmentStatus] Error fetching Fathom recording:', fathomError);
          }

          // Find linked 1-on-1 meeting (if this appointment is from a 1-on-1 meeting)
          let linkedMeetingId: string | null = null;
          try {
            const [linkedMeeting] = await db
              .select({ id: oneOnOneMeetings.id, recordingLink: oneOnOneMeetings.recordingLink })
              .from(oneOnOneMeetings)
              .where(eq(oneOnOneMeetings.calendarAppointmentId, id))
              .limit(1);

            if (linkedMeeting) {
              linkedMeetingId = linkedMeeting.id;
              console.log('[UpdateAppointmentStatus] Found linked 1-on-1 meeting:', linkedMeetingId);

              // If Fathom recording found and meeting doesn't already have a recording link, update it
              if (fathomRecordingUrl && !linkedMeeting.recordingLink) {
                await db
                  .update(oneOnOneMeetings)
                  .set({
                    recordingLink: fathomRecordingUrl,
                    updatedAt: new Date(),
                  })
                  .where(eq(oneOnOneMeetings.id, linkedMeetingId));
                console.log('[UpdateAppointmentStatus] Updated 1-on-1 meeting with Fathom recording link');
              }
            }
          } catch (meetingLinkError) {
            console.error('[UpdateAppointmentStatus] Error linking to 1-on-1 meeting:', meetingLinkError);
          }

          const [createdTask] = await db
            .insert(tasks)
            .values({
              id: taskId,
              title: `Meeting: ${eventTitle}`,
              description: existingAppointment.description || `Time tracked from calendar appointment on ${startTime.toLocaleDateString()}`,
              status: 'completed',
              priority: 'normal',
              assignedTo: userId,
              clientId: existingAppointment.clientId,
              dueDate: startTime,
              startDate: startTime,
              timeEstimate: durationMinutes,
              timeTracked: durationMinutes,
              timeEntries: [timeEntry],
              visibleToClient: false,
              fathomRecordingUrl: fathomRecordingUrl,
              calendarEventId: id,
              oneOnOneMeetingId: linkedMeetingId,
            } as any)
            .returning();

          await db
            .insert(eventTimeEntries)
            .values({
              id: timeEntryId,
              calendarEventId: id,
              userId: userId,
              clientId: existingAppointment.clientId,
              title: eventTitle,
              description: existingAppointment.description || null,
              startTime: startTime,
              endTime: endTime,
              duration: durationMinutes,
              source: 'auto',
              createdAt: new Date(),
              updatedAt: new Date(),
            });

          await db
            .update(calendarAppointments)
            .set({
              timeEntryCreated: true,
              updatedAt: new Date(),
            })
            .where(eq(calendarAppointments.id, id));

          console.log('[UpdateAppointmentStatus] Created task and time entry:', { taskId, timeEntryId, fathomRecordingUrl, linkedMeetingId });

          return res.json({
            ...updatedAppointment,
            timeEntryCreated: true,
            task: createdTask,
            timeEntry: { id: timeEntryId, duration: durationMinutes },
            linkedMeetingId: linkedMeetingId,
            fathomRecordingLinkedToMeeting: linkedMeetingId && fathomRecordingUrl ? true : false,
            message: `Task created with ${durationMinutes} minutes of time tracked${fathomRecordingUrl ? ' (Fathom recording attached)' : ''}${linkedMeetingId ? ' and linked to 1-on-1 meeting' : ''}`
          });
        } catch (taskError) {
          console.error('[UpdateAppointmentStatus] Error creating task/time entry:', taskError);
          return res.json({
            ...updatedAppointment,
            taskCreationError: taskError instanceof Error ? taskError.message : 'Failed to create task'
          });
        }
      }

      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ error: 'Failed to update appointment status' });
    }
  });

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
        createdBy: calendarData.createdBy || existingCalendar.createdBy, // Use provided or keep existing creator
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

      // Delete associated appointments first (due to foreign key constraint)
      await db.delete(calendarAppointments).where(eq(calendarAppointments.calendarId, req.params.id));
      
      // Delete associated staff assignments
      await db.delete(calendarStaff).where(eq(calendarStaff.calendarId, req.params.id));
      
      // Now delete the calendar
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

  // Delete appointment
  app.delete("/api/appointments/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      
      const [existingAppointment] = await db
        .select()
        .from(calendarAppointments)
        .where(eq(calendarAppointments.id, id));

      if (!existingAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      await db.delete(calendarAppointments).where(eq(calendarAppointments.id, id));

      res.status(200).json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ message: "Failed to delete appointment" });
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
  app.get("/api/integrations/google-calendar/authorize", requireAuth(), async (req, res) => {
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
  app.get("/api/integrations/google-calendar/callback", requireAuth(), async (req, res) => {
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
  app.post("/api/integrations/google-calendar/connect", requireAuth(), async (req, res) => {
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
  app.post("/api/integrations/google-calendar/disconnect", requireAuth(), async (req, res) => {
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
  app.get("/api/integrations/google-calendar/status", requireAuth(), async (req, res) => {
    try {
      // Import the new Google Calendar service
      const { isGoogleCalendarConnected } = await import('./googleCalendar');
      
      const connected = await isGoogleCalendarConnected();
      
      return res.json({ 
        connected,
        status: connected ? "connected" : "disconnected",
        lastSync: connected ? new Date().toISOString() : null
      });
      
      // Legacy code - kept for reference but using new integration
      /*
      const staffId = getAuthenticatedUserIdOrFail(req, res);
      if (!staffId) return;
      
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
      */
    } catch (error) {
      console.error('Error checking Google Calendar status:', error);
      res.status(500).json({ message: "Failed to check connection status" });
    }
  });

  // Sync Google Calendar events
  app.post("/api/integrations/google-calendar/sync", requireAuth(), async (req, res) => {
    try {
      const staffId = getAuthenticatedUserIdOrFail(req, res);
      if (!staffId) return;
      
      // Import the new Google Calendar service
      const { getGoogleCalendarEvents, syncAppointmentToGoogleCalendar } = await import('./googleCalendar');
      
      // Get events from the last 30 days to 30 days in the future
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30);
      
      const result = await getGoogleCalendarEvents(timeMin, timeMax);
      
      if (!result.success) {
        return res.status(500).json({ message: result.error || "Failed to sync Google Calendar" });
      }
      
      // Also sync CRM appointments to Google Calendar
      const appointments = await db
        .select()
        .from(calendarAppointments)
        .where(and(
          eq(calendarAppointments.assignedTo, staffId),
          gte(calendarAppointments.startTime, timeMin),
          lte(calendarAppointments.startTime, timeMax)
        ));
      
      let syncedToGoogle = 0;
      for (const appointment of appointments) {
        if (!appointment.externalEventId) {
          const syncResult = await syncAppointmentToGoogleCalendar({
            id: appointment.id,
            title: appointment.title,
            description: appointment.description || undefined,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            location: appointment.location || undefined,
          });
          
          if (syncResult.success && syncResult.googleEventId) {
            await db
              .update(calendarAppointments)
              .set({
                externalEventId: syncResult.googleEventId,
                updatedAt: new Date()
              })
              .where(eq(calendarAppointments.id, appointment.id));
            syncedToGoogle++;
          }
        }
      }
      
      res.json({
        message: "Sync completed successfully",
        eventsFromGoogle: result.events.length,
        syncedToGoogle,
        totalEvents: result.events.length + syncedToGoogle
      });
      
      /* Legacy implementation - kept for reference
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
      */
      
    } catch (error) {
      console.error('Error syncing Google Calendar:', error);
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
  app.get("/api/integrations/slack/channels", requireAuth(), async (req, res) => {
    try {
      const { slackService } = await import('./slack-service');
      
      if (!slackService.isConfigured()) {
        return res.status(400).json({ error: 'Slack not configured' });
      }

      const result = await slackService.listChannels();
      
      if (result.success) {
        res.json({ channels: result.channels });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error('Error fetching Slack channels:', error);
      res.status(500).json({ error: 'Failed to fetch channels' });
    }
  });

  // Get Slack users list (for UI dropdowns)
  app.get("/api/integrations/slack/users", requireAuth(), async (req, res) => {
    try {
      const { slackService } = await import('./slack-service');
      
      if (!slackService.isConfigured()) {
        return res.status(400).json({ error: 'Slack not configured' });
      }

      const result = await slackService.listUsers();
      
      if (result.success) {
        res.json({ users: result.members });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error('Error fetching Slack users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });


  // Slack Workspaces Management Routes (Multi-Workspace Support)
  // Get all Slack workspaces
  app.get("/api/integrations/slack/workspaces", requireAuth(), requirePermission('integrations', 'canView'), async (req, res) => {
    try {
      const workspaces = await db.select().from(slackWorkspaces).orderBy(slackWorkspaces.name);
      // Don't expose full bot token, just first/last few chars
      const sanitized = workspaces.map(w => ({
        ...w,
        botToken: w.botToken ? `${w.botToken.slice(0, 10)}...${w.botToken.slice(-4)}` : null
      }));
      res.json(sanitized);
    } catch (error) {
      console.error('Error fetching Slack workspaces:', error);
      res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
  });

  // Get a single Slack workspace
  app.get("/api/integrations/slack/workspaces/:id", requireAuth(), requirePermission('integrations', 'canView'), async (req, res) => {
    try {
      const workspace = await db.select().from(slackWorkspaces).where(eq(slackWorkspaces.id, req.params.id)).limit(1);
      if (!workspace.length) {
        return res.status(404).json({ error: 'Workspace not found' });
      }
      const w = workspace[0];
      res.json({
        ...w,
        botToken: w.botToken ? `${w.botToken.slice(0, 10)}...${w.botToken.slice(-4)}` : null
      });
    } catch (error) {
      console.error('Error fetching Slack workspace:', error);
      res.status(500).json({ error: 'Failed to fetch workspace' });
    }
  });

  // Add new Slack workspace
  app.post("/api/integrations/slack/workspaces", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { name, botToken, signingSecret, isDefault } = req.body;
      
      if (!name || !botToken) {
        return res.status(400).json({ error: 'Name and Bot Token are required' });
      }

      // Test the bot token by calling auth.test
      const testResponse = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${botToken}`,
        },
      });
      const testData = await testResponse.json() as any;

      if (!testData.ok) {
        return res.status(400).json({ 
          error: `Invalid bot token: ${testData.error}`,
          connectionErrors: testData.error 
        });
      }

      // If this is set as default, unset other defaults first
      if (isDefault) {
        await db.update(slackWorkspaces).set({ isDefault: false }).where(eq(slackWorkspaces.isDefault, true));
      }

      const newWorkspace = await db.insert(slackWorkspaces).values({
        name,
        botToken,
        signingSecret: signingSecret || null,
        isDefault: isDefault || false,
        teamId: testData.team_id,
        teamName: testData.team,
        botUserId: testData.user_id,
        lastTestAt: new Date(),
      }).returning();

      const w = newWorkspace[0];
      res.json({
        ...w,
        botToken: `${w.botToken.slice(0, 10)}...${w.botToken.slice(-4)}`
      });
    } catch (error) {
      console.error('Error creating Slack workspace:', error);
      res.status(500).json({ error: 'Failed to create workspace' });
    }
  });

  // Update Slack workspace
  app.patch("/api/integrations/slack/workspaces/:id", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { name, botToken, signingSecret, isDefault, isActive } = req.body;
      const updates: any = { updatedAt: new Date() };

      if (name !== undefined) updates.name = name;
      if (signingSecret !== undefined) updates.signingSecret = signingSecret;
      if (isActive !== undefined) updates.isActive = isActive;

      // If updating bot token, validate it first
      if (botToken !== undefined) {
        const testResponse = await fetch('https://slack.com/api/auth.test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${botToken}`,
          },
        });
        const testData = await testResponse.json() as any;

        if (!testData.ok) {
          return res.status(400).json({ 
            error: `Invalid bot token: ${testData.error}` 
          });
        }

        updates.botToken = botToken;
        updates.teamId = testData.team_id;
        updates.teamName = testData.team;
        updates.botUserId = testData.user_id;
        updates.lastTestAt = new Date();
        updates.connectionErrors = null;
      }

      // If setting as default, unset other defaults first
      if (isDefault === true) {
        await db.update(slackWorkspaces).set({ isDefault: false }).where(eq(slackWorkspaces.isDefault, true));
        updates.isDefault = true;
      } else if (isDefault === false) {
        updates.isDefault = false;
      }

      const updated = await db.update(slackWorkspaces)
        .set(updates)
        .where(eq(slackWorkspaces.id, req.params.id))
        .returning();

      if (!updated.length) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const w = updated[0];
      res.json({
        ...w,
        botToken: w.botToken ? `${w.botToken.slice(0, 10)}...${w.botToken.slice(-4)}` : null
      });
    } catch (error) {
      console.error('Error updating Slack workspace:', error);
      res.status(500).json({ error: 'Failed to update workspace' });
    }
  });

  // Delete Slack workspace
  app.delete("/api/integrations/slack/workspaces/:id", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const deleted = await db.delete(slackWorkspaces)
        .where(eq(slackWorkspaces.id, req.params.id))
        .returning();

      if (!deleted.length) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      res.json({ success: true, message: 'Workspace deleted' });
    } catch (error) {
      console.error('Error deleting Slack workspace:', error);
      res.status(500).json({ error: 'Failed to delete workspace' });
    }
  });

  // Test Slack workspace connection
  app.post("/api/integrations/slack/workspaces/:id/test", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const workspace = await db.select().from(slackWorkspaces).where(eq(slackWorkspaces.id, req.params.id)).limit(1);
      if (!workspace.length) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const w = workspace[0];
      const testResponse = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${w.botToken}`,
        },
      });
      const testData = await testResponse.json() as any;

      if (testData.ok) {
        await db.update(slackWorkspaces).set({
          teamId: testData.team_id,
          teamName: testData.team,
          botUserId: testData.user_id,
          lastTestAt: new Date(),
          connectionErrors: null,
          updatedAt: new Date()
        }).where(eq(slackWorkspaces.id, req.params.id));

        res.json({ 
          success: true, 
          team: testData.team,
          user: testData.user 
        });
      } else {
        await db.update(slackWorkspaces).set({
          connectionErrors: testData.error,
          updatedAt: new Date()
        }).where(eq(slackWorkspaces.id, req.params.id));

        res.status(400).json({ 
          success: false, 
          error: testData.error 
        });
      }
    } catch (error) {
      console.error('Error testing Slack workspace:', error);
      res.status(500).json({ error: 'Failed to test workspace connection' });
    }
  });

  // Get channels for a specific workspace
  app.get("/api/integrations/slack/workspaces/:id/channels", requireAuth(), async (req, res) => {
    try {
      const workspace = await db.select().from(slackWorkspaces).where(eq(slackWorkspaces.id, req.params.id)).limit(1);
      if (!workspace.length) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const w = workspace[0];
      const channelsResponse = await fetch('https://slack.com/api/conversations.list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${w.botToken}`,
        },
        body: JSON.stringify({ types: 'public_channel,private_channel', limit: 200 }),
      });
      const channelsData = await channelsResponse.json() as any;

      if (channelsData.ok) {
        res.json({ 
          channels: channelsData.channels.map((c: any) => ({
            id: c.id,
            name: c.name,
            is_member: c.is_member,
            is_private: c.is_private
          }))
        });
      } else {
        res.status(400).json({ error: channelsData.error });
      }
    } catch (error) {
      console.error('Error fetching workspace channels:', error);
      res.status(500).json({ error: 'Failed to fetch channels' });
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
  function processMergeTags(message: string, clientData: any, userData?: any): string {
    let result = message;
    
    // Replace client merge tags
    if (clientData) {
      result = result
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
        .replace(/{{zipCode}}/g, clientData.zipCode || '')
        // Also support lowercase with underscores
        .replace(/{{first_name}}/g, clientData.firstName || '')
        .replace(/{{last_name}}/g, clientData.lastName || '')
        .replace(/{{full_name}}/g, clientData.name || `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim())
        .replace(/{{company}}/g, clientData.companyName || '');
    }
    
    // Replace user/staff merge tags
    if (userData) {
      result = result
        .replace(/{{user_first_name}}/g, userData.firstName || '')
        .replace(/{{user_last_name}}/g, userData.lastName || '')
        .replace(/{{user_full_name}}/g, `${userData.firstName || ''} ${userData.lastName || ''}`.trim())
        .replace(/{{user_email}}/g, userData.email || '')
        .replace(/{{user_phone}}/g, userData.phoneNumber || '');
    }
    
    return result;
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

      // Get authenticated user ID for merge tags
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;
      
      // Get user/staff data for merge tag processing
      let userData = null;
      try {
        const [staffData] = await db
          .select()
          .from(staff)
          .where(eq(staff.id, userId));
        userData = staffData;
      } catch (error) {
        console.error('Error fetching user data for merge tags:', error);
      }
      
      // Get client data for merge tag processing
      let processedMessage = message;
      let clientData = null;
      if (clientId) {
        try {
          const [data] = await db
            .select()
            .from(clients)
            .where(eq(clients.id, clientId));
          clientData = data;
        } catch (error) {
          console.error('Error fetching client data for merge tags:', error);
        }
      }
      
      // Process merge tags with both client and user data
      processedMessage = processMergeTags(message, clientData, userData);
      console.log('Processed message:', processedMessage?.substring(0, 50) + '...');
      
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
        await createAuditLog(
          "created",
          "sms",
          smsMessage.sid,
          `SMS to ${to}`,
          userId,
          `Sent SMS message to ${to}: ${processedMessage.substring(0, 100)}${processedMessage.length > 100 ? '...' : ''}`,
          null,
          { to, from: fallbackIntegration.phoneNumber, message: processedMessage, clientId, status: smsMessage.status, provider: 'twilio' },
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
      console.log('SMS audit log - userId:', userId);
      
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
          { to, from: integration.phoneNumber, message: processedMessage, clientId, status: smsMessage.status, provider: 'twilio' },
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

  // ============== TWILIO VOIP CALLING ENDPOINTS ==============

  // Generate Twilio Voice access token for browser-based calling
  app.get("/api/integrations/twilio/voice-token", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get active Twilio integration
      const [integration] = await db
        .select()
        .from(smsIntegrations)
        .where(and(
          eq(smsIntegrations.provider, 'twilio'),
          eq(smsIntegrations.isActive, true)
        ))
        .limit(1);

      if (!integration) {
        return res.status(400).json({ 
          message: "No active Twilio integration found. Please configure Twilio in Settings > Integrations." 
        });
      }

      // Check for TwiML App SID in environment
      const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
      if (!twimlAppSid) {
        return res.status(400).json({ 
          message: "Twilio TwiML App not configured. Please set TWILIO_TWIML_APP_SID environment variable." 
        });
      }

      // Check for API credentials
      const apiKeySid = process.env.TWILIO_API_KEY_SID;
      const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
      if (!apiKeySid || !apiKeySecret) {
        return res.status(400).json({ 
          message: "Twilio API credentials not configured. Please set TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET." 
        });
      }

      // Generate access token for Voice SDK
      const AccessToken = twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;

      const accessToken = new AccessToken(
        integration.accountSid,
        apiKeySid,
        apiKeySecret,
        { identity: userId }
      );

      // Create a Voice grant for this token
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: twimlAppSid,
        incomingAllow: false
      });

      accessToken.addGrant(voiceGrant);

      res.json({
        token: accessToken.toJwt(),
        identity: userId,
        callerIdNumber: integration.phoneNumber,
        expiresIn: 3600
      });
    } catch (error) {
      console.error('Error generating voice token:', error);
      res.status(500).json({ 
        message: "Failed to generate voice token",
        error: (error as Error).message
      });
    }
  });

  // TwiML webhook for outbound calls - Twilio calls this to get call instructions
  app.post("/api/integrations/twilio/voice-twiml", async (req, res) => {
    try {
      const { To, From, CallerId } = req.body;
      
      console.log('[TwiML] Outbound call request:', { To, From, CallerId });

      // Get the caller ID (phone number to show)
      const [integration] = await db
        .select()
        .from(smsIntegrations)
        .where(and(
          eq(smsIntegrations.provider, 'twilio'),
          eq(smsIntegrations.isActive, true)
        ))
        .limit(1);

      const callerIdNumber = CallerId || integration?.phoneNumber || From;

      // Build TwiML response
      const VoiceResponse = twilio.twiml.VoiceResponse;
      const twiml = new VoiceResponse();

      if (To) {
        const dial = twiml.dial({ callerId: callerIdNumber });
        if (To.startsWith('sip:')) {
          dial.sip(To);
        } else {
          dial.number(To);
        }
      } else {
        twiml.say('No phone number specified for outbound call.');
      }

      res.type('text/xml');
      res.send(twiml.toString());
    } catch (error) {
      console.error('Error generating TwiML:', error);
      
      const VoiceResponse = twilio.twiml.VoiceResponse;
      const twiml = new VoiceResponse();
      twiml.say('An error occurred while connecting your call. Please try again.');
      
      res.type('text/xml');
      res.send(twiml.toString());
    }
  });

  // Get VoIP configuration status
  app.get("/api/integrations/twilio/voice-status", requireAuth(), async (req, res) => {
    try {
      const [integration] = await db
        .select()
        .from(smsIntegrations)
        .where(and(
          eq(smsIntegrations.provider, 'twilio'),
          eq(smsIntegrations.isActive, true)
        ))
        .limit(1);

      const hasIntegration = !!integration;
      const hasTwimlApp = !!process.env.TWILIO_TWIML_APP_SID;
      const hasApiKey = !!process.env.TWILIO_API_KEY_SID && !!process.env.TWILIO_API_KEY_SECRET;

      res.json({
        configured: hasIntegration && hasTwimlApp && hasApiKey,
        hasIntegration,
        hasTwimlApp,
        hasApiKey,
        callerIdNumber: integration?.phoneNumber || null,
        message: !hasIntegration 
          ? "Configure Twilio integration in Settings > Integrations"
          : !hasTwimlApp 
          ? "Set TWILIO_TWIML_APP_SID environment variable"
          : !hasApiKey 
          ? "Set TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET environment variables"
          : "VoIP calling is ready"
      });
    } catch (error) {
      console.error('Error checking voice status:', error);
      res.status(500).json({ 
        configured: false,
        message: "Failed to check VoIP configuration" 
      });
    }
  });

  // Log a completed call for audit trail
  app.post("/api/integrations/twilio/call-log", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { entityId, entityName, entityType = "lead", phoneNumber, duration, callSid, status } = req.body;

      if (!entityId || !phoneNumber) {
        return res.status(400).json({ message: "Entity ID and phone number are required" });
      }

      await appStorage.createAuditLog({
        userId: userId!,
        action: "call",
        entityType: entityType === "client" ? "contact" : entityType,
        entityId: entityId,
        entityName: entityName || (entityType === "client" ? `Client ${entityId}` : `Lead ${entityId}`),
        details: `Called ${phoneNumber} - Duration: ${Math.floor(duration / 60)}m ${duration % 60}s - Status: ${status}`,
        newValues: { phoneNumber, duration, callSid, status, entityId, entityType },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error logging call:', error);
      res.status(500).json({ message: "Failed to log call" });
    }
  });

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
    try {
      console.log('MailGun Connect - Processing connection request');
      const { apiKey, domain, fromName, fromEmail } = req.body;
      
      // Check if this is an update request (no API key provided, using existing)
      let actualApiKey = apiKey;
      let encryptedApiKey: string;
      
      if (!apiKey) {
        console.log('No API key provided, checking for existing configuration...');
        // Load existing API key from database
        const [existingIntegration] = await db
          .select()
          .from(emailIntegrations)
          .where(and(
            eq(emailIntegrations.provider, 'mailgun'),
            eq(emailIntegrations.isActive, true)
          ));

        if (!existingIntegration) {
          return res.status(400).json({
            message: "No existing MailGun configuration found. Please provide an API key."
          });
        }

        // Use existing encrypted key and decrypt for testing
        encryptedApiKey = existingIntegration.apiKey;
        actualApiKey = EncryptionService.decrypt(existingIntegration.apiKey);
        console.log('Using existing API key for connection test');
      } else {
        // New API key provided, encrypt it
        encryptedApiKey = EncryptionService.encrypt(apiKey);
        console.log('New API key provided, encrypted for storage');
      }
      
      // Validate required fields
      if (!domain || !fromName || !fromEmail) {
        console.log('Missing required fields:', { domain: !!domain, fromName: !!fromName, fromEmail: !!fromEmail });
        return res.status(400).json({
          message: "All fields are required: Domain, From Name, and From Email"
        });
      }
      
      console.log('All fields present, testing MailGun connection...');
      
      // Test MailGun connection by validating domain
      try {
        const mg = createMailgunClient(actualApiKey, domain);
        console.log('Created MailGun client, testing domain:', domain);
        await mg.domains.get(domain);
        console.log('MailGun domain validation successful');
      } catch (error) {
        console.error('MailGun connection test failed:', error);
        return res.status(400).json({
          message: "Failed to connect to MailGun. Please check your API key and domain.",
          error: (error as Error).message
        });
      }

      console.log('API key ready for storage...');

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

      console.log('Database transaction completed successfully');

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
        console.log('Audit log created successfully');
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

  // POST Send Email through CRM Communication Interface
  app.post("/api/communications/send-email", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      console.log('CRM Email Send - Processing communication request');
      const { to, subject, message, fromEmail, fromName, clientId } = req.body;
      
      // Validate required fields
      if (!to || !subject || !message) {
        return res.status(400).json({
          message: "All fields are required: recipient email, subject, and message"
        });
      }
      
      // Get active MailGun integration
      const [integration] = await db
        .select()
        .from(emailIntegrations)
        .where(and(
          eq(emailIntegrations.provider, 'mailgun'),
          eq(emailIntegrations.isActive, true)
        ));

      if (!integration) {
        return res.status(400).json({
          message: "MailGun integration not configured. Please set up MailGun in Settings > Integrations."
        });
      }

      // Use integration settings or provided override
      const actualFromEmail = fromEmail || integration.fromEmail;
      const actualFromName = fromName || integration.fromName;
      
      // Get authenticated user ID for merge tags
      const userId = await getAuthenticatedUserIdOrFail(req);
      
      // Get user/staff data for merge tag processing
      let userData = null;
      try {
        const [staffData] = await db
          .select()
          .from(staff)
          .where(eq(staff.id, userId));
        userData = staffData;
      } catch (error) {
        console.error('Error fetching user data for merge tags:', error);
      }
      
      // Get client data for merge tag processing
      let clientData = null;
      if (clientId) {
        try {
          const [data] = await db
            .select()
            .from(clients)
            .where(eq(clients.id, clientId));
          clientData = data;
        } catch (error) {
          console.error('Error fetching client data for merge tags:', error);
        }
      }
      
      // Process merge tags in subject and message
      const processedSubject = processMergeTags(subject, clientData, userData);
      const processedMessage = processMergeTags(message, clientData, userData);
      
      console.log(`Sending email to ${to} via MailGun...`);

      // Decrypt API key and send email
      const decryptedApiKey = EncryptionService.decrypt(integration.apiKey);
      const mg = createMailgunClient(decryptedApiKey, integration.domain);

      const emailData = {
        from: `${actualFromName} <${actualFromEmail}>`,
        to: to,
        subject: processedSubject,
        html: processedMessage,
        text: processedMessage.replace(/<[^>]*>/g, '') // Strip HTML for plain text version
      };

      const result = await mg.messages.create(integration.domain, emailData);
      console.log('MailGun send successful:', { id: result.id, status: result.status, message: result.message });

      // Parse MailGun status from message (e.g., "Queued. Thank you." -> "Queued")
      let emailStatus = 'sent';
      if (result.message) {
        const messageLower = result.message.toLowerCase();
        if (messageLower.includes('queued')) {
          emailStatus = 'queued';
        } else if (messageLower.includes('sent')) {
          emailStatus = 'sent';
        } else if (messageLower.includes('delivered')) {
          emailStatus = 'delivered';
        } else {
          // Extract first word before period as status
          const firstWord = result.message.split('.')[0].trim().toLowerCase();
          emailStatus = firstWord || 'sent';
        }
      }

      // Create audit log for email communication
      try {
        await createAuditLog(
          "created",
          "email", 
          clientId || result.id,
          "Email Communication",
          userId,
          `Sent email to ${to}: "${subject}"`,
          null,
          { 
            to, 
            subject, 
            message, 
            fromEmail: actualFromEmail, 
            fromName: actualFromName, 
            messageId: result.id, 
            clientId,
            status: emailStatus,
            provider: 'mailgun'
          },
          req
        );
        console.log('Email communication audit log created with status:', emailStatus);
      } catch (auditError) {
        console.error('Failed to create email communication audit log:', auditError);
        // Continue with response even if audit log fails
      }

      res.json({
        message: "Email sent successfully!",
        messageId: result.id,
        to: to,
        subject: subject
      });

    } catch (error) {
      console.error('Error sending CRM email:', error);
      res.status(500).json({
        message: "Failed to send email",
        error: (error as Error).message
      });
    }
  });

  // ========================================
  // EMAIL RECEIVED TRIGGER - FUTURE INTEGRATION
  // ========================================
  // NOTE: The 'email_received' automation trigger exists in the database and UI,
  // but requires incoming email integration (webhook or IMAP/POP3) to emit.
  // When email receiving functionality is implemented, emit the trigger here:
  // 
  // await emitTrigger('email_received', {
  //   sender: email.from.email,
  //   subject: email.subject,
  //   body: email.body,
  //   receivedAt: new Date(),
  //   hasAttachments: email.attachments.length > 0 ? 'yes' : 'no',
  //   attachmentCount: email.attachments.length,
  //   recipientAddress: email.to.email,
  // });

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
      console.log('MailGun Test - Processing test email request');
      console.log('Test request body:', req.body);
      
      const { to, fromEmail, fromName } = req.body;
      
      // Simple validation
      if (!to || typeof to !== 'string' || !to.includes('@')) {
        console.log('Invalid email address provided:', to);
        return res.status(400).json({
          message: "Please provide a valid email address for testing"
        });
      }
      
      console.log('Valid test email address provided:', to);

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


  // ========================================
  // OpenAI/AI Integration Routes
  // ========================================

  // GET OpenAI integration status
  app.get("/api/integrations/openai/status", requireAuth(), requirePermission('integrations', 'canView'), async (req, res) => {
    try {
      const [integration] = await db
        .select()
        .from(aiIntegrations)
        .where(and(
          eq(aiIntegrations.provider, 'openai'),
          eq(aiIntegrations.isActive, true)
        ));

      if (!integration) {
        return res.json({
          connected: false,
          status: "disconnected",
          model: null,
          lastTestAt: null
        });
      }

      res.json({
        connected: true,
        status: "connected",
        model: integration.model,
        lastTestAt: integration.lastTestAt?.toISOString() || null,
        errors: integration.connectionErrors
      });
    } catch (error) {
      console.error('Error checking OpenAI status:', error);
      res.status(500).json({ 
        connected: false,
        message: "Failed to check OpenAI status" 
      });
    }
  });

  // POST OpenAI Connect
  app.post("/api/integrations/openai/connect", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { apiKey, model = 'gpt-4o' } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({
          message: "API key is required"
        });
      }
      
      // Test the API key by making a simple request
      try {
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({ apiKey });
        await openai.models.list();
      } catch (error: any) {
        return res.status(400).json({
          message: "Failed to connect to OpenAI. Please check your API key.",
          error: error.message
        });
      }

      // Encrypt the API key
      const encryptedApiKey = EncryptionService.encrypt(apiKey);
      
      // Check for existing integration
      const [existingIntegration] = await db
        .select()
        .from(aiIntegrations)
        .where(eq(aiIntegrations.provider, 'openai'));
      
      if (existingIntegration) {
        // Update existing
        await db
          .update(aiIntegrations)
          .set({
            apiKey: encryptedApiKey,
            model,
            isActive: true,
            lastTestAt: new Date(),
            connectionErrors: null,
            updatedAt: new Date()
          })
          .where(eq(aiIntegrations.id, existingIntegration.id));
      } else {
        // Create new
        await db.insert(aiIntegrations).values({
          provider: 'openai',
          name: 'OpenAI',
          apiKey: encryptedApiKey,
          model,
          isActive: true,
          lastTestAt: new Date()
        });
      }

      res.json({
        success: true,
        message: "OpenAI connected successfully"
      });
    } catch (error) {
      console.error('Error connecting OpenAI:', error);
      res.status(500).json({
        message: "Failed to connect OpenAI",
        error: (error as Error).message
      });
    }
  });

  // POST OpenAI Disconnect
  app.post("/api/integrations/openai/disconnect", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      await db
        .update(aiIntegrations)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(aiIntegrations.provider, 'openai'));

      res.json({
        success: true,
        message: "OpenAI disconnected successfully"
      });
    } catch (error) {
      console.error('Error disconnecting OpenAI:', error);
      res.status(500).json({
        message: "Failed to disconnect OpenAI",
        error: (error as Error).message
      });
    }
  });

  // POST OpenAI Test
  app.post("/api/integrations/openai/test", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const [integration] = await db
        .select()
        .from(aiIntegrations)
        .where(and(
          eq(aiIntegrations.provider, 'openai'),
          eq(aiIntegrations.isActive, true)
        ));

      if (!integration) {
        return res.status(400).json({
          message: "OpenAI is not connected"
        });
      }

      const decryptedApiKey = EncryptionService.decrypt(integration.apiKey);
      
      try {
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({ apiKey: decryptedApiKey });
        const response = await openai.chat.completions.create({
          model: integration.model || 'gpt-4o',
          messages: [{ role: 'user', content: 'Say "Connection successful!" in 3 words or less.' }],
          max_tokens: 20
        });

        // Update last test time
        await db
          .update(aiIntegrations)
          .set({
            lastTestAt: new Date(),
            connectionErrors: null,
            updatedAt: new Date()
          })
          .where(eq(aiIntegrations.id, integration.id));

        res.json({
          success: true,
          message: "OpenAI test successful",
          response: response.choices[0]?.message?.content
        });
      } catch (error: any) {
        // Update connection errors
        await db
          .update(aiIntegrations)
          .set({
            connectionErrors: `Test Error: ${error.message}`,
            updatedAt: new Date()
          })
          .where(eq(aiIntegrations.id, integration.id));

        res.status(500).json({
          message: "OpenAI test failed",
          error: error.message
        });
      }
    } catch (error) {
      console.error('Error testing OpenAI:', error);
      res.status(500).json({
        message: "Failed to test OpenAI connection",
        error: (error as Error).message
      });
    }
  });
  // ========================================
  // GoHighLevel Integration Routes
  // ========================================

  // GET GoHighLevel integration status
  app.get("/api/integrations/gohighlevel/status", requireAuth(), requirePermission('integrations', 'canView'), async (req, res) => {
    try {
      const integration = await appStorage.getGoHighLevelIntegration();
      
      if (!integration) {
        return res.json({
          connected: false,
          integration: null
        });
      }

      // Build the webhook URL
      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0]
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : (process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : process.env.BASE_URL || `https://${req.get('host')}`);
      
      const webhookUrl = `${baseUrl}/api/webhooks/gohighlevel/${integration.webhookToken}`;

      res.json({
        connected: integration.isActive,
        integration: {
          id: integration.id,
          name: integration.name,
          isActive: integration.isActive,
          defaultSource: integration.defaultSource,
          defaultStageId: integration.defaultStageId,
          assignToStaffId: integration.assignToStaffId,
          triggerWorkflows: integration.triggerWorkflows,
          leadsReceived: integration.leadsReceived,
          lastLeadAt: integration.lastLeadAt,
          webhookUrl,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt
        }
      });
    } catch (error) {
      console.error('Error getting GoHighLevel status:', error);
      res.status(500).json({ message: "Failed to get GoHighLevel integration status" });
    }
  });

  // POST Connect/Create GoHighLevel integration
  app.post("/api/integrations/gohighlevel/connect", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      // Check if integration already exists
      const existing = await appStorage.getGoHighLevelIntegration();
      if (existing) {
        return res.status(400).json({ message: "GoHighLevel integration already exists" });
      }

      // Generate a secure webhook token
      const webhookToken = randomUUID().replace(/-/g, '');

      const integration = await appStorage.createGoHighLevelIntegration({
        webhookToken,
        name: req.body.name || 'GoHighLevel',
        isActive: true,
        defaultSource: req.body.defaultSource || 'GoHighLevel',
        defaultStageId: req.body.defaultStageId || null,
        assignToStaffId: req.body.assignToStaffId || null,
        triggerWorkflows: req.body.triggerWorkflows !== false
      });

      // Build the webhook URL
      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0]
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : (process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : process.env.BASE_URL || `https://${req.get('host')}`);
      
      const webhookUrl = `${baseUrl}/api/webhooks/gohighlevel/${integration.webhookToken}`;

      // Create audit log
      try {
        const userId = await getAuthenticatedUserIdOrFail(req);
        await createAuditLog(
          "created",
          "integration",
          "gohighlevel",
          "GoHighLevel Integration",
          userId,
          "Connected GoHighLevel integration",
          null,
          { webhookUrl },
          req
        );
      } catch (auditError) {
        console.error('Failed to create GoHighLevel audit log:', auditError);
      }

      res.json({
        message: "GoHighLevel integration connected successfully",
        integration: {
          ...integration,
          webhookUrl
        }
      });
    } catch (error) {
      console.error('Error connecting GoHighLevel:', error);
      res.status(500).json({ message: "Failed to connect GoHighLevel integration" });
    }
  });

  // PATCH Update GoHighLevel integration settings
  app.patch("/api/integrations/gohighlevel/:id", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, defaultSource, defaultStageId, assignToStaffId, triggerWorkflows, isActive } = req.body;

      const updated = await appStorage.updateGoHighLevelIntegration(id, {
        ...(name !== undefined && { name }),
        ...(defaultSource !== undefined && { defaultSource }),
        ...(defaultStageId !== undefined && { defaultStageId }),
        ...(assignToStaffId !== undefined && { assignToStaffId }),
        ...(triggerWorkflows !== undefined && { triggerWorkflows }),
        ...(isActive !== undefined && { isActive })
      });

      if (!updated) {
        return res.status(404).json({ message: "GoHighLevel integration not found" });
      }

      res.json({ message: "Settings updated successfully", integration: updated });
    } catch (error) {
      console.error('Error updating GoHighLevel settings:', error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // POST Regenerate webhook token
  app.post("/api/integrations/gohighlevel/:id/regenerate-token", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { id } = req.params;
      const newToken = randomUUID().replace(/-/g, '');

      const updated = await appStorage.updateGoHighLevelIntegration(id, {
        webhookToken: newToken
      });

      if (!updated) {
        return res.status(404).json({ message: "GoHighLevel integration not found" });
      }

      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0]
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : (process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : process.env.BASE_URL || `https://${req.get('host')}`);
      
      const webhookUrl = `${baseUrl}/api/webhooks/gohighlevel/${newToken}`;

      res.json({ 
        message: "Webhook token regenerated successfully",
        webhookUrl 
      });
    } catch (error) {
      console.error('Error regenerating token:', error);
      res.status(500).json({ message: "Failed to regenerate token" });
    }
  });

  // DELETE Disconnect GoHighLevel integration
  app.delete("/api/integrations/gohighlevel/:id", requireAuth(), requirePermission('integrations', 'canManage'), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await appStorage.deleteGoHighLevelIntegration(id);

      if (!deleted) {
        return res.status(404).json({ message: "GoHighLevel integration not found" });
      }

      // Create audit log
      try {
        const userId = await getAuthenticatedUserIdOrFail(req);
        await createAuditLog(
          "deleted",
          "integration",
          "gohighlevel",
          "GoHighLevel Integration",
          userId,
          "Disconnected GoHighLevel integration",
          null,
          null,
          req
        );
      } catch (auditError) {
        console.error('Failed to create GoHighLevel disconnection audit log:', auditError);
      }

      res.json({ message: "GoHighLevel integration disconnected successfully" });
    } catch (error) {
      console.error('Error disconnecting GoHighLevel:', error);
      res.status(500).json({ message: "Failed to disconnect GoHighLevel" });
    }
  });

  // ========================================
  // GoHighLevel Webhook Endpoint (PUBLIC - no auth required)
  // ========================================
  app.post("/api/webhooks/gohighlevel/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Validate the webhook token
      const integration = await appStorage.getGoHighLevelIntegrationByToken(token);
      
      if (!integration || !integration.isActive) {
        console.log('GoHighLevel webhook: Invalid or inactive token');
        return res.status(401).json({ message: "Invalid webhook token" });
      }

      console.log('GoHighLevel webhook received:', JSON.stringify(req.body, null, 2));

      // Parse the incoming lead data from GoHighLevel
      const body = req.body;
      
      // Extract lead data - GHL may send in different structures
      const leadData = {
        name: body.full_name || body.name || body.first_name 
          ? `${body.first_name || ''} ${body.last_name || ''}`.trim() 
          : body.contact_name || 'Unknown Lead',
        email: body.email || body.contact_email || '',
        phone: body.phone || body.contact_phone || body.phone_number || null,
        company: body.company || body.company_name || body.business_name || null,
        source: integration.defaultSource || 'GoHighLevel',
        notes: body.message || body.notes || body.custom_message || null,
        stageId: integration.defaultStageId || null,
        assignedTo: integration.assignToStaffId || null,
        customFieldData: {
          gohighlevel_id: body.id || body.contact_id || null,
          gohighlevel_location: body.location_id || null,
          gohighlevel_tags: body.tags || [],
          form_name: body.form_name || body.formName || null,
          landing_page: body.page_url || body.landing_page || null,
          raw_payload: body
        }
      };

      // Validate required fields
      if (!leadData.email) {
        console.log('GoHighLevel webhook: Missing email');
        return res.status(400).json({ message: "Email is required" });
      }

      // Create the lead
      const lead = await storage.createLead({
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        company: leadData.company,
        source: leadData.source,
        notes: leadData.notes,
        stageId: leadData.stageId,
        assignedTo: leadData.assignedTo,
        status: 'Open',
        customFieldData: leadData.customFieldData
      });

      console.log('GoHighLevel webhook: Lead created:', lead.id);

      // Increment lead count
      await appStorage.incrementGoHighLevelLeadCount(integration.id);

      // Trigger workflows if enabled
      if (integration.triggerWorkflows) {
        try {
          await emitTrigger({
            triggerType: 'lead_created',
            data: {
              leadId: lead.id,
              leadName: lead.name,
              leadEmail: lead.email,
              source: 'gohighlevel_webhook'
            }
          });
        } catch (triggerError) {
          console.error('Failed to emit lead_created trigger:', triggerError);
        }
      }

      res.json({ 
        success: true, 
        message: "Lead created successfully",
        leadId: lead.id 
      });
    } catch (error) {
      console.error('GoHighLevel webhook error:', error);
      res.status(500).json({ message: "Failed to process webhook" });
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
  app.get("/api/forms/test", requireAuth(), requirePermission('campaigns', 'canView'), async (req, res) => {
    try {
      res.json({ success: true, storageType: appStorage.constructor.name });
    } catch (error) {
      console.error("Test error:", error);
      res.status(500).json({ message: "Test failed" });
    }
  });

  // Form folders endpoints
  app.get("/api/form-folders", requireAuth(), requirePermission('campaigns', 'canView'), async (req, res) => {
    try {
      const foldersResult = await db.select().from(formFolders).orderBy(asc(formFolders.order));
      res.json(foldersResult);
    } catch (error) {
      console.error("Error fetching form folders:", error);
      res.status(500).json({ message: "Failed to fetch form folders" });
    }
  });

  app.post("/api/form-folders", requireAuth(), requirePermission('campaigns', 'canCreate'), async (req, res) => {
    try {
      const folderData = insertFormFolderSchema.parse(req.body);
      const result = await db.insert(formFolders).values(folderData).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating form folder:", error);
      res.status(500).json({ message: "Failed to create form folder" });
    }
  });

  app.put("/api/form-folders/:id", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
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

  app.delete("/api/form-folders/:id", requireAuth(), requirePermission('campaigns', 'canDelete'), async (req, res) => {
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
  app.get("/api/forms", requireAuth(), requirePermission('campaigns', 'canView'), async (req, res) => {
    try {
      const formsResult = await db
        .select({
          id: forms.id,
          name: forms.name,
          description: forms.description,
          status: forms.status,
          folderId: forms.folderId,
          settings: forms.settings,
          createdBy: forms.createdBy,
          updatedBy: forms.updatedBy,
          createdAt: forms.createdAt,
          updatedAt: forms.updatedAt,
          updatedByName: sql`CONCAT(${staff.firstName}, ' ', ${staff.lastName})`.as('updated_by_name'),
        })
        .from(forms)
        .leftJoin(staff, eq(forms.updatedBy, staff.id))
        .orderBy(desc(forms.createdAt));
      res.json(formsResult);
    } catch (error) {
      console.error("Error fetching forms:", error);
      res.status(500).json({ message: "Failed to fetch forms" });
    }
  });

  app.get("/api/forms/:id", requireAuth(), requirePermission('campaigns', 'canView'), async (req, res) => {
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
  app.get("/api/form-fields", requireAuth(), requirePermission('campaigns', 'canView'), async (req, res) => {
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

  app.post("/api/forms", requireAuth(), requirePermission('campaigns', 'canCreate'), async (req, res) => {
    try {
      const { fields, ...formData } = req.body;
      const currentUserId = req.user?.id || req.session?.userId;
      
      // Clean form data and set defaults
      const { updatedAt, createdAt, id, ...cleanFormData } = formData;
      const formToInsert = {
        ...cleanFormData,
        createdBy: currentUserId,
        status: cleanFormData.status || "draft"
      };
      
      // Create form
      const formResult = await db.insert(forms).values(formToInsert).returning();
      const form = formResult[0];
      
      // Create form fields if provided
      if (fields && Array.isArray(fields)) {
        for (let i = 0; i < fields.length; i++) {
          const field = fields[i];
          // Generate new ID for each field to avoid conflicts with temp IDs
          const { id: _tempId, ...fieldWithoutId } = field;
          await db.insert(formFields).values({
            ...fieldWithoutId,
            id: crypto.randomUUID(),
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

  app.put("/api/forms/:id", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
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
          updated_by = ${userId},
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

  app.delete("/api/forms/:id", requireAuth(), requirePermission('campaigns', 'canDelete'), async (req, res) => {
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
  app.post("/api/forms/:id/duplicate", requireAuth(), requirePermission('campaigns', 'canCreate'), async (req, res) => {
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
  app.put("/api/forms/:id/move", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
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



  // ================================
  // SURVEY ROUTES - Multi-step forms with conditional logic
  // ================================

  // Survey Folders
  app.get("/api/survey-folders", requireAuth(), async (req, res) => {
    try {
      const folders = await appStorage.getSurveyFolders();
      res.json(folders);
    } catch (error) {
      console.error("Error fetching survey folders:", error);
      res.status(500).json({ message: "Failed to fetch survey folders" });
    }
  });

  app.post("/api/survey-folders", requireAuth(), requirePermission('campaigns', 'canCreate'), async (req, res) => {
    try {
      const folder = await appStorage.createSurveyFolder(req.body);
      res.status(201).json(folder);
    } catch (error) {
      console.error("Error creating survey folder:", error);
      res.status(500).json({ message: "Failed to create survey folder" });
    }
  });

  app.put("/api/survey-folders/:id", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const folder = await appStorage.updateSurveyFolder(req.params.id, req.body);
      if (!folder) {
        return res.status(404).json({ message: "Survey folder not found" });
      }
      res.json(folder);
    } catch (error) {
      console.error("Error updating survey folder:", error);
      res.status(500).json({ message: "Failed to update survey folder" });
    }
  });

  app.delete("/api/survey-folders/:id", requireAuth(), requirePermission('campaigns', 'canDelete'), async (req, res) => {
    try {
      const deleted = await appStorage.deleteSurveyFolder(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Survey folder not found" });
      }
      res.json({ message: "Survey folder deleted" });
    } catch (error) {
      console.error("Error deleting survey folder:", error);
      res.status(500).json({ message: "Failed to delete survey folder" });
    }
  });

  // Surveys - CRUD
  app.get("/api/surveys", requireAuth(), requirePermission('campaigns', 'canView'), async (req, res) => {
    try {
      const surveysList = await appStorage.getSurveys();
      res.json(surveysList);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      res.status(500).json({ message: "Failed to fetch surveys" });
    }
  });

  app.get("/api/surveys/:id", requireAuth(), requirePermission('campaigns', 'canView'), async (req, res) => {
    try {
      const survey = await appStorage.getSurveyWithDetails(req.params.id);
      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }
      res.json(survey);
    } catch (error) {
      console.error("Error fetching survey:", error);
      res.status(500).json({ message: "Failed to fetch survey" });
    }
  });

  app.post("/api/surveys", requireAuth(), requirePermission('campaigns', 'canCreate'), async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const surveyData = {
        ...req.body,
        createdBy: userId,
      };
      
      const survey = await appStorage.createSurvey(surveyData);
      
      // Create first slide automatically
      await appStorage.createSurveySlide({
        surveyId: survey.id,
        title: "Slide 1",
        order: 0,
        buttonText: "Next",
      });
      
      res.status(201).json(survey);
    } catch (error) {
      console.error("Error creating survey:", error);
      res.status(500).json({ message: "Failed to create survey" });
    }
  });

  app.put("/api/surveys/:id", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const userId = req.session?.userId;
      const surveyData = {
        ...req.body,
        updatedBy: userId,
      };
      
      const survey = await appStorage.updateSurvey(req.params.id, surveyData);
      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }
      res.json(survey);
    } catch (error) {
      console.error("Error updating survey:", error);
      res.status(500).json({ message: "Failed to update survey" });
    }
  });

  app.delete("/api/surveys/:id", requireAuth(), requirePermission('campaigns', 'canDelete'), async (req, res) => {
    try {
      const deleted = await appStorage.deleteSurvey(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Survey not found" });
      }
      res.json({ message: "Survey deleted" });
    } catch (error) {
      console.error("Error deleting survey:", error);
      res.status(500).json({ message: "Failed to delete survey" });
    }
  });

  app.post("/api/surveys/:id/duplicate", requireAuth(), requirePermission('campaigns', 'canCreate'), async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const survey = await appStorage.duplicateSurvey(req.params.id, userId);
      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }
      res.status(201).json(survey);
    } catch (error) {
      console.error("Error duplicating survey:", error);
      res.status(500).json({ message: "Failed to duplicate survey" });
    }
  });

  // Survey Slides
  app.get("/api/surveys/:surveyId/slides", requireAuth(), async (req, res) => {
    try {
      const slides = await appStorage.getSurveySlides(req.params.surveyId);
      res.json(slides);
    } catch (error) {
      console.error("Error fetching survey slides:", error);
      res.status(500).json({ message: "Failed to fetch slides" });
    }
  });

  app.post("/api/surveys/:surveyId/slides", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const slide = await appStorage.createSurveySlide({
        ...req.body,
        surveyId: req.params.surveyId,
      });
      res.status(201).json(slide);
    } catch (error) {
      console.error("Error creating survey slide:", error);
      res.status(500).json({ message: "Failed to create slide" });
    }
  });

  app.put("/api/surveys/:surveyId/slides/:slideId", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const slide = await appStorage.updateSurveySlide(req.params.slideId, req.body);
      if (!slide) {
        return res.status(404).json({ message: "Slide not found" });
      }
      res.json(slide);
    } catch (error) {
      console.error("Error updating survey slide:", error);
      res.status(500).json({ message: "Failed to update slide" });
    }
  });

  app.delete("/api/surveys/:surveyId/slides/:slideId", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const deleted = await appStorage.deleteSurveySlide(req.params.slideId);
      if (!deleted) {
        return res.status(404).json({ message: "Slide not found" });
      }
      res.json({ message: "Slide deleted" });
    } catch (error) {
      console.error("Error deleting survey slide:", error);
      res.status(500).json({ message: "Failed to delete slide" });
    }
  });

  app.put("/api/surveys/:surveyId/slides/reorder", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const { updates } = req.body;
      await appStorage.reorderSurveySlides(updates);
      res.json({ message: "Slides reordered" });
    } catch (error) {
      console.error("Error reordering slides:", error);
      res.status(500).json({ message: "Failed to reorder slides" });
    }
  });

  // Survey Fields
  app.get("/api/surveys/:surveyId/fields", requireAuth(), async (req, res) => {
    try {
      const fields = await appStorage.getSurveyFields(req.params.surveyId);
      res.json(fields);
    } catch (error) {
      console.error("Error fetching survey fields:", error);
      res.status(500).json({ message: "Failed to fetch fields" });
    }
  });

  app.post("/api/surveys/:surveyId/fields", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const field = await appStorage.createSurveyField({
        ...req.body,
        surveyId: req.params.surveyId,
      });
      res.status(201).json(field);
    } catch (error) {
      console.error("Error creating survey field:", error);
      res.status(500).json({ message: "Failed to create field" });
    }
  });

  // Reorder endpoint MUST be before :fieldId routes to avoid "reorder" being matched as a fieldId
  app.put("/api/surveys/:surveyId/fields/reorder", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const { updates } = req.body;
      await appStorage.reorderSurveyFields(updates);
      res.json({ message: "Fields reordered" });
    } catch (error) {
      console.error("Error reordering fields:", error);
      res.status(500).json({ message: "Failed to reorder fields" });
    }
  });

  app.put("/api/surveys/:surveyId/fields/:fieldId", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      // Get existing field to merge settings properly
      const existingField = await appStorage.getSurveyField(req.params.fieldId);
      let updateData = req.body;
      
      // Merge settings if both exist (prevents overwriting imageUrl when updating alignment)
      if (req.body.settings && existingField?.settings) {
        updateData = {
          ...req.body,
          settings: { ...existingField.settings, ...req.body.settings }
        };
      }
      
      const field = await appStorage.updateSurveyField(req.params.fieldId, updateData);
      if (!field) {
        return res.status(404).json({ message: "Field not found" });
      }
      res.json(field);
    } catch (error) {
      console.error("Error updating survey field:", error);
      res.status(500).json({ message: "Failed to update field" });
    }
  });

  app.delete("/api/surveys/:surveyId/fields/:fieldId", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const deleted = await appStorage.deleteSurveyField(req.params.fieldId);
      if (!deleted) {
        return res.status(404).json({ message: "Field not found" });
      }
      res.json({ message: "Field deleted" });
    } catch (error) {
      console.error("Error deleting survey field:", error);
      res.status(500).json({ message: "Failed to delete field" });
    }
  });

  // Survey Logic Rules
  app.get("/api/surveys/:surveyId/logic", requireAuth(), async (req, res) => {
    try {
      const rules = await appStorage.getSurveyLogicRules(req.params.surveyId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching survey logic rules:", error);
      res.status(500).json({ message: "Failed to fetch logic rules" });
    }
  });

  app.post("/api/surveys/:surveyId/logic", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const rule = await appStorage.createSurveyLogicRule({
        ...req.body,
        surveyId: req.params.surveyId,
      });
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating logic rule:", error);
      res.status(500).json({ message: "Failed to create logic rule" });
    }
  });

  app.put("/api/surveys/:surveyId/logic/:ruleId", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const rule = await appStorage.updateSurveyLogicRule(req.params.ruleId, req.body);
      if (!rule) {
        return res.status(404).json({ message: "Logic rule not found" });
      }
      res.json(rule);
    } catch (error) {
      console.error("Error updating logic rule:", error);
      res.status(500).json({ message: "Failed to update logic rule" });
    }
  });

  app.delete("/api/surveys/:surveyId/logic/:ruleId", requireAuth(), requirePermission('campaigns', 'canEdit'), async (req, res) => {
    try {
      const deleted = await appStorage.deleteSurveyLogicRule(req.params.ruleId);
      if (!deleted) {
        return res.status(404).json({ message: "Logic rule not found" });
      }
      res.json({ message: "Logic rule deleted" });
    } catch (error) {
      console.error("Error deleting logic rule:", error);
      res.status(500).json({ message: "Failed to delete logic rule" });
    }
  });

  // Survey Submissions
  app.get("/api/surveys/:surveyId/submissions", requireAuth(), requirePermission('campaigns', 'canView'), async (req, res) => {
    try {
      const submissions = await appStorage.getSurveySubmissions(req.params.surveyId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching survey submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.get("/api/surveys/:surveyId/submissions/:submissionId", requireAuth(), requirePermission('campaigns', 'canView'), async (req, res) => {
    try {
      const submission = await appStorage.getSurveySubmission(req.params.submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      const answers = await appStorage.getSurveySubmissionAnswers(req.params.submissionId);
      res.json({ submission, answers });
    } catch (error) {
      console.error("Error fetching survey submission:", error);
      res.status(500).json({ message: "Failed to fetch submission" });
    }
  });

  app.delete("/api/surveys/:surveyId/submissions/:submissionId", requireAuth(), requirePermission('campaigns', 'canDelete'), async (req, res) => {
    try {
      const deleted = await appStorage.deleteSurveySubmission(req.params.submissionId);
      if (!deleted) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json({ message: "Submission deleted" });
    } catch (error) {
      console.error("Error deleting submission:", error);
      res.status(500).json({ message: "Failed to delete submission" });
    }
  });

  // Public Survey Routes (no auth required for taking surveys)
  app.get("/api/public/surveys/:shortCode", async (req, res) => {
    try {
      const survey = await appStorage.getSurveyByShortCode(req.params.shortCode);
      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }
      if (survey.status !== 'published') {
        return res.status(404).json({ message: "Survey not available" });
      }
      
      const [slides, fields] = await Promise.all([
        appStorage.getSurveySlides(survey.id),
        appStorage.getSurveyFields(survey.id),
      ]);
      
      // Get logic rules for published survey
      const logicRules = await appStorage.getSurveyLogicRules(survey.id);
      
      res.json({ survey, slides, fields, logicRules });
    } catch (error) {
      console.error("Error fetching public survey:", error);
      res.status(500).json({ message: "Failed to fetch survey" });
    }
  });

  // Simple in-memory rate limiting for public survey submissions
  const surveySubmissionRateLimit = new Map<string, { count: number; resetAt: number }>();
  const SURVEY_RATE_LIMIT = 10; // max submissions per minute
  const SURVEY_RATE_WINDOW = 60000; // 1 minute

  app.post("/api/public/surveys/:shortCode/submit", async (req, res) => {
    try {
      // Rate limiting by IP + shortCode
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const rateKey = `${clientIP}:${req.params.shortCode}`;
      const now = Date.now();
      const rateData = surveySubmissionRateLimit.get(rateKey);
      
      if (rateData && now < rateData.resetAt) {
        if (rateData.count >= SURVEY_RATE_LIMIT) {
          return res.status(429).json({ message: "Too many submissions. Please try again later." });
        }
        rateData.count++;
      } else {
        surveySubmissionRateLimit.set(rateKey, { count: 1, resetAt: now + SURVEY_RATE_WINDOW });
      }
      
      const survey = await appStorage.getSurveyByShortCode(req.params.shortCode);
      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }
      if (survey.status !== 'published') {
        return res.status(400).json({ message: "Survey is not accepting submissions" });
      }
      
      // Validate request body with Zod
      const submissionSchema = z.object({
        answers: z.array(z.object({
          fieldId: z.string(),
          value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
        })).optional().default([]),
        submitterEmail: z.string().email().optional().or(z.literal('')).transform(val => val || undefined),
        submitterName: z.string().max(255).optional().transform(val => val || undefined),
        clientId: z.string().optional(), // Client ID to link survey submission to a client
      });
      
      const parseResult = submissionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid submission data", errors: parseResult.error.errors });
      }
      
      const { answers, submitterEmail, submitterName, clientId } = parseResult.data;
      
      // Create submission
      const submission = await appStorage.createSurveySubmission({
        surveyId: survey.id,
        submitterEmail,
        submitterName,
        ipAddress: clientIP,
        userAgent: req.get('User-Agent'),
        startedAt: new Date(),
        completedAt: new Date(),
        status: 'completed',
      });
      
      // Create answers (filter out empty values)
      if (answers && answers.length > 0) {
        const answerRecords = answers
          .filter((answer) => answer.value !== '' && answer.value !== undefined && answer.value !== null)
          .map((answer) => ({
            submissionId: submission.id,
            fieldId: answer.fieldId,
            value: typeof answer.value === 'object' ? JSON.stringify(answer.value) : String(answer.value),
          }));
        if (answerRecords.length > 0) {
          await appStorage.createSurveySubmissionAnswers(answerRecords);
        }
      }
      
      // Get survey fields for custom field mapping
      const surveyFields = await appStorage.getSurveyFields(survey.id);
      
      // Update client custom fields if clientId is provided
      if (clientId && answers && answers.length > 0) {
        try {
          // Find fields that are linked to custom fields
          for (const answer of answers) {
            const field = surveyFields.find(f => f.id === answer.fieldId);
            if (field?.customFieldId && answer.value !== undefined && answer.value !== '') {
              // Update or create the client's custom field value
              await appStorage.upsertClientCustomFieldValue(
                clientId,
                field.customFieldId,
                typeof answer.value === 'object' ? JSON.stringify(answer.value) : String(answer.value)
              );
            }
          }
          console.log(`Updated custom fields for client ${clientId} from survey submission`);
        } catch (customFieldError) {
          console.error("Error updating client custom fields:", customFieldError);
          // Don't fail the submission if custom field update fails
        }
      }
      
      // Emit survey submission trigger for workflows
      try {
        const { emitTrigger } = await import("./workflow-engine");
        
        // Build responses object for trigger data
        const responsesObj: Record<string, any> = {};
        if (answers && answers.length > 0) {
          answers.forEach((answer) => {
            const field = surveyFields.find(f => f.id === answer.fieldId);
            if (field) {
              responsesObj[field.label || answer.fieldId] = answer.value;
            }
          });
        }
        
        await emitTrigger({
          type: "survey_submitted",
          data: {
            survey_id: survey.id,
            survey_name: survey.name,
            submission_id: submission.id,
            submitter_email: submitterEmail,
            submitter_name: submitterName,
            responses: responsesObj,
          },
          context: {
            timestamp: new Date(),
            metadata: { surveyId: survey.id, shortCode: survey.shortCode }
          }
        });
      } catch (triggerError) {
        console.error("Error emitting survey_submitted trigger:", triggerError);
        // Don't fail the submission if trigger fails
      }
      
      res.status(201).json({ message: "Survey submitted successfully", submissionId: submission.id });
    } catch (error) {
      console.error("Error submitting survey:", error);
      res.status(500).json({ message: "Failed to submit survey" });
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

  // Sales Settings Routes
  app.get("/api/sales-settings", requireAuth(), requirePermission('settings', 'canView'), async (req, res) => {
    try {
      // Get or create sales settings
      let [settings] = await db.select().from(salesSettings).limit(1);
      
      if (!settings) {
        // Create default settings if none exist
        [settings] = await db.insert(salesSettings)
          .values({ minimumMarginThreshold: 35 })
          .returning();
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching sales settings:", error);
      res.status(500).json({ message: "Failed to fetch sales settings" });
    }
  });

  app.patch("/api/sales-settings", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const validatedData = updateSalesSettingsSchema.parse(req.body);
      
      // Get the first (and only) settings record
      let [settings] = await db.select().from(salesSettings).limit(1);
      
      if (!settings) {
        // Create if doesn't exist
        [settings] = await db.insert(salesSettings)
          .values({ 
            minimumMarginThreshold: validatedData.minimumMarginThreshold 
          })
          .returning();
      } else {
        // Update existing
        [settings] = await db.update(salesSettings)
          .set({ 
            minimumMarginThreshold: validatedData.minimumMarginThreshold,
            updatedAt: sql`now()`
          })
          .where(eq(salesSettings.id, settings.id))
          .returning();
      }
      
      // Log the update
      await createAuditLog(
        "updated",
        "sales_settings",
        settings.id.toString(),
        "Sales Settings",
        userId,
        `Sales settings updated - Minimum Margin Threshold: ${settings.minimumMarginThreshold}%`,
        null,
        { minimumMarginThreshold: settings.minimumMarginThreshold },
        req
      );

      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating sales settings:", error);
      res.status(500).json({ message: "Failed to update sales settings" });
    }
  });

  // Sales Targets Routes
  app.get("/api/sales-targets", requireAuth(), requirePermission('settings', 'canView'), async (req, res) => {
    try {
      const targets = await appStorage.getSalesTargets();
      res.json(targets);
    } catch (error) {
      console.error("Error fetching sales targets:", error);
      res.status(500).json({ message: "Failed to fetch sales targets" });
    }
  });

  app.get("/api/sales-targets/:id", requireAuth(), requirePermission('settings', 'canView'), async (req, res) => {
    try {
      const target = await appStorage.getSalesTarget(req.params.id);
      if (!target) {
        return res.status(404).json({ message: "Sales target not found" });
      }
      res.json(target);
    } catch (error) {
      console.error("Error fetching sales target:", error);
      res.status(500).json({ message: "Failed to fetch sales target" });
    }
  });

  app.post("/api/sales-targets", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const validatedData = insertSalesTargetSchema.parse(req.body);
      
      // Check if target already exists for this month
      const existing = await appStorage.getSalesTargetByMonth(validatedData.year, validatedData.month);
      if (existing) {
        return res.status(400).json({ message: "A target already exists for this month. Please update the existing target instead." });
      }

      const newTarget = await appStorage.createSalesTarget({
        ...validatedData,
        createdBy: userId,
        updatedBy: userId,
      });

      await createAuditLog(
        "created",
        "sales_target",
        newTarget.id,
        `Sales Target ${validatedData.year}-${String(validatedData.month).padStart(2, '0')}`,
        userId,
        `Created sales target for ${validatedData.year}-${String(validatedData.month).padStart(2, '0')}: $${validatedData.targetAmount}`,
        null,
        newTarget,
        req
      );

      res.status(201).json(newTarget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating sales target:", error);
      res.status(500).json({ message: "Failed to create sales target" });
    }
  });

  app.patch("/api/sales-targets/:id", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const validatedData = updateSalesTargetSchema.parse(req.body);
      
      const existing = await appStorage.getSalesTarget(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Sales target not found" });
      }

      // If year/month is being changed, check for duplicates
      if ((validatedData.year || validatedData.month) && (validatedData.year !== existing.year || validatedData.month !== existing.month)) {
        const checkYear = validatedData.year ?? existing.year;
        const checkMonth = validatedData.month ?? existing.month;
        const duplicate = await appStorage.getSalesTargetByMonth(checkYear, checkMonth);
        if (duplicate && duplicate.id !== req.params.id) {
          return res.status(400).json({ message: "A target already exists for this month" });
        }
      }

      const updated = await appStorage.updateSalesTarget(req.params.id, {
        ...validatedData,
        updatedBy: userId,
      });

      if (!updated) {
        return res.status(404).json({ message: "Sales target not found" });
      }

      await createAuditLog(
        "updated",
        "sales_target",
        updated.id,
        `Sales Target ${updated.year}-${String(updated.month).padStart(2, '0')}`,
        userId,
        `Updated sales target for ${updated.year}-${String(updated.month).padStart(2, '0')}: $${updated.targetAmount}`,
        existing,
        updated,
        req
      );

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating sales target:", error);
      res.status(500).json({ message: "Failed to update sales target" });
    }
  });

  app.delete("/api/sales-targets/:id", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const target = await appStorage.getSalesTarget(req.params.id);
      if (!target) {
        return res.status(404).json({ message: "Sales target not found" });
      }

      const deleted = await appStorage.deleteSalesTarget(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Sales target not found" });
      }

      await createAuditLog(
        "deleted",
        "sales_target",
        req.params.id,
        `Sales Target ${target.year}-${String(target.month).padStart(2, '0')}`,
        userId,
        `Deleted sales target for ${target.year}-${String(target.month).padStart(2, '0')}: $${target.targetAmount}`,
        target,
        null,
        req
      );

      res.json({ message: "Sales target deleted successfully" });
    } catch (error) {
      console.error("Error deleting sales target:", error);
      res.status(500).json({ message: "Failed to delete sales target" });
    }
  });

  // Capacity Settings Routes - Predictive hiring alerts
  app.get("/api/capacity-settings", requireAuth(), requirePermission('settings', 'canView'), async (req, res) => {
    try {
      const settings = await db.select().from(capacitySettings).orderBy(asc(capacitySettings.department));
      res.json(settings);
    } catch (error) {
      console.error("Error fetching capacity settings:", error);
      res.status(500).json({ message: "Failed to fetch capacity settings" });
    }
  });

  app.post("/api/capacity-settings", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const validatedData = insertCapacitySettingsSchema.parse(req.body);
      
      const [newSetting] = await db.insert(capacitySettings)
        .values({
          ...validatedData,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();
      
      await createAuditLog(
        "created",
        "capacity_settings",
        newSetting.id.toString(),
        `Capacity Setting - ${newSetting.department}${newSetting.role ? ` (${newSetting.role})` : ''}`,
        userId,
        `Created capacity setting: ${newSetting.department} - Max ${newSetting.maxClientsPerStaff} clients/staff, Alert at ${newSetting.alertThreshold}%`,
        null,
        newSetting,
        req
      );

      res.status(201).json(newSetting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating capacity setting:", error);
      res.status(500).json({ message: "Failed to create capacity setting" });
    }
  });

  app.patch("/api/capacity-settings/:id", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const { id } = req.params;
      const validatedData = updateCapacitySettingsSchema.parse(req.body);
      
      const [oldSetting] = await db.select().from(capacitySettings).where(eq(capacitySettings.id, id));
      if (!oldSetting) {
        return res.status(404).json({ message: "Capacity setting not found" });
      }

      const [updatedSetting] = await db.update(capacitySettings)
        .set({ 
          ...validatedData,
          updatedBy: userId,
          updatedAt: sql`now()`
        })
        .where(eq(capacitySettings.id, id))
        .returning();
      
      await createAuditLog(
        "updated",
        "capacity_settings",
        updatedSetting.id.toString(),
        `Capacity Setting - ${updatedSetting.department}${updatedSetting.role ? ` (${updatedSetting.role})` : ''}`,
        userId,
        `Updated capacity setting`,
        oldSetting,
        updatedSetting,
        req
      );

      res.json(updatedSetting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating capacity setting:", error);
      res.status(500).json({ message: "Failed to update capacity setting" });
    }
  });

  app.delete("/api/capacity-settings/:id", requireAuth(), requirePermission('settings', 'canManage'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const { id } = req.params;
      
      const [setting] = await db.select().from(capacitySettings).where(eq(capacitySettings.id, id));
      if (!setting) {
        return res.status(404).json({ message: "Capacity setting not found" });
      }

      await db.delete(capacitySettings).where(eq(capacitySettings.id, id));
      
      await createAuditLog(
        "deleted",
        "capacity_settings",
        setting.id.toString(),
        `Capacity Setting - ${setting.department}${setting.role ? ` (${setting.role})` : ''}`,
        userId,
        `Deleted capacity setting`,
        setting,
        null,
        req
      );

      res.json({ message: "Capacity setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting capacity setting:", error);
      res.status(500).json({ message: "Failed to delete capacity setting" });
    }
  });

  // Predictive Capacity Analysis - Calculate hiring predictions based on pipeline
  app.get("/api/capacity-predictions", requireAuth(), requirePermission('reports', 'canView'), async (req, res) => {
    try {
      // Step 1: Get capacity settings
      const capacityConfigs = await db.select().from(capacitySettings).where(eq(capacitySettings.isActive, true));
      
      if (capacityConfigs.length === 0) {
        return res.json({
          predictions: [],
          metrics: null,
          message: "No active capacity settings configured. Please configure capacity settings in Settings > Staff."
        });
      }

      // Step 2: Calculate historical metrics from closed deals
      // Get all leads that were converted to clients (deals with status = won)
      const closedDeals = await db.select({
        id: leads.id,
        createdAt: leads.createdAt,
        department: staff.department,
        closedDate: clients.createdAt,
      })
        .from(leads)
        .innerJoin(clients, eq(leads.email, clients.email)) // Match by email
        .innerJoin(staff, eq(leads.assignedTo, staff.id))
        .where(sql`${leads.status} = 'won'`);

      // Calculate average time to close (in days)
      let totalDaysToClose = 0;
      let validDeals = 0;
      
      for (const deal of closedDeals) {
        if (deal.createdAt && deal.closedDate) {
          const days = Math.floor((new Date(deal.closedDate).getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          if (days >= 0) {
            totalDaysToClose += days;
            validDeals++;
          }
        }
      }
      
      const avgDaysToClose = validDeals > 0 ? totalDaysToClose / validDeals : 14; // Default 14 days if no data

      // Calculate close rate
      const totalLeads = await db.select({ count: sql<number>`count(*)::int` }).from(leads);
      const totalClosed = closedDeals.length;
      const closeRate = totalLeads[0].count > 0 ? (totalClosed / totalLeads[0].count) : 0.30; // Default 30%

      // Step 3: Get active leads in pipeline by department
      const pipelineLeads = await db.select({
        id: leads.id,
        status: leads.status,
        department: staff.department,
      })
        .from(leads)
        .leftJoin(staff, eq(leads.assignedTo, staff.id))
        .where(and(
          sql`${leads.status} NOT IN ('won', 'lost', 'disqualified')`,
          isNotNull(staff.department)
        ));

      // Count leads by department
      const leadsByDepartment: Record<string, number> = {};
      for (const lead of pipelineLeads) {
        const dept = lead.department || 'Unassigned';
        leadsByDepartment[dept] = (leadsByDepartment[dept] || 0) + 1;
      }

      // Step 4: Get current client assignments by department
      const currentAssignments = await db.select({
        department: staff.department,
        staffId: clientTeamAssignments.staffId,
        staffName: staff.name,
        clientCount: sql<number>`count(distinct ${clientTeamAssignments.clientId})::int`,
      })
        .from(clientTeamAssignments)
        .innerJoin(staff, eq(clientTeamAssignments.staffId, staff.id))
        .where(isNotNull(staff.department))
        .groupBy(staff.department, clientTeamAssignments.staffId, staff.name);

      // Calculate current capacity by department
      const currentCapacity: Record<string, { totalStaff: number; totalClients: number; avgPerStaff: number }> = {};
      for (const assignment of currentAssignments) {
        const dept = assignment.department || 'Unassigned';
        if (!currentCapacity[dept]) {
          currentCapacity[dept] = { totalStaff: 0, totalClients: 0, avgPerStaff: 0 };
        }
        currentCapacity[dept].totalStaff++;
        currentCapacity[dept].totalClients += assignment.clientCount;
      }

      // Calculate averages
      for (const dept in currentCapacity) {
        const data = currentCapacity[dept];
        data.avgPerStaff = data.totalStaff > 0 ? data.totalClients / data.totalStaff : 0;
      }

      // Step 5: Generate predictions for each department with capacity settings
      const predictions = [];
      
      for (const config of capacityConfigs) {
        const dept = config.department;
        const leadsInPipeline = leadsByDepartment[dept] || 0;
        const predictedNewClients = Math.round(leadsInPipeline * closeRate);
        const expectedCloseDays = Math.ceil(avgDaysToClose);
        const expectedCloseDate = new Date();
        expectedCloseDate.setDate(expectedCloseDate.getDate() + expectedCloseDays);

        const current = currentCapacity[dept] || { totalStaff: 0, totalClients: 0, avgPerStaff: 0 };
        const futureClients = current.totalClients + predictedNewClients;
        const maxCapacity = current.totalStaff * config.maxClientsPerStaff;
        const futureCapacityPercent = maxCapacity > 0 ? (futureClients / maxCapacity) * 100 : 0;
        const currentCapacityPercent = maxCapacity > 0 ? (current.totalClients / maxCapacity) * 100 : 0;

        const needsHiring = futureCapacityPercent >= parseFloat(config.alertThreshold.toString());
        const staffNeeded = Math.ceil(Math.max(0, (futureClients - (current.totalStaff * config.maxClientsPerStaff)) / config.maxClientsPerStaff));

        predictions.push({
          department: dept,
          role: config.role,
          currentStaff: current.totalStaff,
          currentClients: current.totalClients,
          currentAvgPerStaff: parseFloat(current.avgPerStaff.toFixed(1)),
          currentCapacityPercent: parseFloat(currentCapacityPercent.toFixed(1)),
          leadsInPipeline,
          predictedNewClients,
          futureClients,
          futureCapacityPercent: parseFloat(futureCapacityPercent.toFixed(1)),
          maxClientsPerStaff: config.maxClientsPerStaff,
          alertThreshold: parseFloat(config.alertThreshold.toString()),
          needsHiring,
          staffNeeded,
          expectedCloseDate: expectedCloseDate.toISOString(),
          expectedCloseDays,
        });
      }

      res.json({
        predictions,
        metrics: {
          avgDaysToClose: Math.round(avgDaysToClose),
          closeRate: parseFloat((closeRate * 100).toFixed(1)),
          totalLeadsInPipeline: Object.values(leadsByDepartment).reduce((sum, count) => sum + count, 0),
          historicalDeals: validDeals,
        }
      });
    } catch (error) {
      console.error("Error calculating capacity predictions:", error);
      res.status(500).json({ message: "Failed to calculate capacity predictions" });
    }
  });

  // ============================================
  // TASK INTAKE FORM - Conditional Survey for Task Creation
  // ============================================
  
  // Get the active task intake form (with all questions, options, logic, and assignment rules)
  app.get("/api/task-intake-forms/active", requireAuth(), async (req, res) => {
    try {
      // Get the active form
      const [activeForm] = await db
        .select()
        .from(taskIntakeForms)
        .where(eq(taskIntakeForms.isActive, true))
        .limit(1);
      
      if (!activeForm) {
        return res.json(null);
      }
      
      // Get all questions with their options
      const questions = await db
        .select()
        .from(taskIntakeQuestions)
        .where(eq(taskIntakeQuestions.formId, activeForm.id))
        .orderBy(asc(taskIntakeQuestions.order));
      
      const questionIds = questions.map(q => q.id);
      
      let options: any[] = [];
      if (questionIds.length > 0) {
        options = await db
          .select()
          .from(taskIntakeOptions)
          .where(inArray(taskIntakeOptions.questionId, questionIds))
          .orderBy(asc(taskIntakeOptions.order));
      }
      
      // Get logic rules
      const logicRules = await db
        .select()
        .from(taskIntakeLogicRules)
        .where(and(eq(taskIntakeLogicRules.formId, activeForm.id), eq(taskIntakeLogicRules.enabled, true)))
        .orderBy(asc(taskIntakeLogicRules.order));
      
      // Get assignment rules
      const assignmentRules = await db
        .select()
        .from(taskIntakeAssignmentRules)
        .where(and(eq(taskIntakeAssignmentRules.formId, activeForm.id), eq(taskIntakeAssignmentRules.enabled, true)))
        .orderBy(desc(taskIntakeAssignmentRules.priority));
      
      res.json({
        ...activeForm,
        questions: questions.map(q => ({
          ...q,
          options: options.filter(o => o.questionId === q.id)
        })),
        logicRules,
        assignmentRules
      });
    } catch (error) {
      console.error("Error fetching active task intake form:", error);
      res.status(500).json({ error: "Failed to fetch task intake form" });
    }
  });
  
  // Get all task intake forms (admin)
  app.get("/api/task-intake-forms", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const forms = await db.select().from(taskIntakeForms).orderBy(desc(taskIntakeForms.createdAt));
      res.json(forms);
    } catch (error) {
      console.error("Error fetching task intake forms:", error);
      res.status(500).json({ error: "Failed to fetch task intake forms" });
    }
  });
  
  // Get single task intake form with all details (admin)
  app.get("/api/task-intake-forms/:formId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { formId } = req.params;
      
      const [form] = await db
        .select()
        .from(taskIntakeForms)
        .where(eq(taskIntakeForms.id, formId))
        .limit(1);
      
      if (!form) {
        return res.status(404).json({ error: "Form not found" });
      }
      
      const questions = await db
        .select()
        .from(taskIntakeQuestions)
        .where(eq(taskIntakeQuestions.formId, formId))
        .orderBy(asc(taskIntakeQuestions.order));
      
      const questionIds = questions.map(q => q.id);
      
      let options: any[] = [];
      if (questionIds.length > 0) {
        options = await db
          .select()
          .from(taskIntakeOptions)
          .where(inArray(taskIntakeOptions.questionId, questionIds))
          .orderBy(asc(taskIntakeOptions.order));
      }
      
      const logicRules = await db
        .select()
        .from(taskIntakeLogicRules)
        .where(eq(taskIntakeLogicRules.formId, formId))
        .orderBy(asc(taskIntakeLogicRules.order));
      
      const assignmentRules = await db
        .select()
        .from(taskIntakeAssignmentRules)
        .where(eq(taskIntakeAssignmentRules.formId, formId))
        .orderBy(desc(taskIntakeAssignmentRules.priority));
      
      res.json({
        ...form,
        questions: questions.map(q => ({
          ...q,
          options: options.filter(o => o.questionId === q.id)
        })),
        logicRules,
        assignmentRules
      });
    } catch (error) {
      console.error("Error fetching task intake form:", error);
      res.status(500).json({ error: "Failed to fetch task intake form" });
    }
  });
  
  // Create a new task intake form (admin)
  app.post("/api/task-intake-forms", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      const validatedData = insertTaskIntakeFormSchema.parse({
        ...req.body,
        createdBy: rawUserId
      });
      
      const [newForm] = await db.insert(taskIntakeForms).values(validatedData).returning();
      
      res.json(newForm);
    } catch (error) {
      console.error("Error creating task intake form:", error);
      res.status(500).json({ error: "Failed to create task intake form" });
    }
  });
  
  // Update a task intake form (admin)
  app.put("/api/task-intake-forms/:formId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      const { formId } = req.params;
      
      const [updatedForm] = await db
        .update(taskIntakeForms)
        .set({
          ...req.body,
          updatedBy: rawUserId,
          updatedAt: new Date()
        })
        .where(eq(taskIntakeForms.id, formId))
        .returning();
      
      if (!updatedForm) {
        return res.status(404).json({ error: "Form not found" });
      }
      
      res.json(updatedForm);
    } catch (error) {
      console.error("Error updating task intake form:", error);
      res.status(500).json({ error: "Failed to update task intake form" });
    }
  });
  
  // Delete a task intake form (admin)
  app.delete("/api/task-intake-forms/:formId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { formId } = req.params;
      
      await db.delete(taskIntakeForms).where(eq(taskIntakeForms.id, formId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task intake form:", error);
      res.status(500).json({ error: "Failed to delete task intake form" });
    }
  });
  
  // ============================================
  // TASK INTAKE QUESTIONS
  // ============================================
  
  // Add a question to a form
  app.post("/api/task-intake-forms/:formId/questions", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { formId } = req.params;
      const { options: optionsList, ...questionData } = req.body;
      
      // Get max order
      const [maxOrderResult] = await db
        .select({ maxOrder: sql`COALESCE(MAX("order"), -1)` })
        .from(taskIntakeQuestions)
        .where(eq(taskIntakeQuestions.formId, formId));
      
      const newOrder = (maxOrderResult?.maxOrder as number || -1) + 1;
      
      const validatedData = insertTaskIntakeQuestionSchema.parse({
        ...questionData,
        formId,
        order: newOrder
      });
      
      const [newQuestion] = await db.insert(taskIntakeQuestions).values(validatedData).returning();
      
      // If options provided (for single_choice/multi_choice), create them
      let createdOptions: any[] = [];
      if (optionsList && Array.isArray(optionsList) && optionsList.length > 0) {
        const optionsToInsert = optionsList.map((opt: { optionText: string }, idx: number) => ({
          questionId: newQuestion.id,
          optionText: opt.optionText || opt,
          order: idx
        }));
        createdOptions = await db.insert(taskIntakeOptions).values(optionsToInsert).returning();
      }
      
      res.json({ ...newQuestion, options: createdOptions });
    } catch (error) {
      console.error("Error creating task intake question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });
  
  // Update a question
  app.put("/api/task-intake-questions/:questionId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { questionId } = req.params;
      const { options: optionsList, ...questionData } = req.body;
      
      const [updatedQuestion] = await db
        .update(taskIntakeQuestions)
        .set({ ...questionData, updatedAt: new Date() })
        .where(eq(taskIntakeQuestions.id, questionId))
        .returning();
      
      if (!updatedQuestion) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // If options provided, replace existing options
      if (optionsList !== undefined) {
        // Delete existing options
        await db.delete(taskIntakeOptions).where(eq(taskIntakeOptions.questionId, questionId));
        
        // Create new options
        if (Array.isArray(optionsList) && optionsList.length > 0) {
          const optionsToInsert = optionsList.map((opt: any, idx: number) => ({
            questionId: questionId,
            optionText: typeof opt === 'string' ? opt : opt.optionText,
            order: idx
          }));
          await db.insert(taskIntakeOptions).values(optionsToInsert);
        }
      }
      
      // Fetch updated options
      const options = await db
        .select()
        .from(taskIntakeOptions)
        .where(eq(taskIntakeOptions.questionId, questionId))
        .orderBy(asc(taskIntakeOptions.order));
      
      res.json({ ...updatedQuestion, options });
    } catch (error) {
      console.error("Error updating task intake question:", error);
      res.status(500).json({ error: "Failed to update question" });
    }
  });
  
  // Reorder questions
  app.put("/api/task-intake-forms/:formId/questions/reorder", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { formId } = req.params;
      const { questionIds } = req.body; // Array of question IDs in new order
      
      if (!Array.isArray(questionIds)) {
        return res.status(400).json({ error: "questionIds must be an array" });
      }
      
      // Update order for each question
      await Promise.all(
        questionIds.map((id: string, index: number) =>
          db.update(taskIntakeQuestions)
            .set({ order: index })
            .where(and(eq(taskIntakeQuestions.id, id), eq(taskIntakeQuestions.formId, formId)))
        )
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering questions:", error);
      res.status(500).json({ error: "Failed to reorder questions" });
    }
  });
  
  // Delete a question
  app.delete("/api/task-intake-questions/:questionId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { questionId } = req.params;
      
      await db.delete(taskIntakeQuestions).where(eq(taskIntakeQuestions.id, questionId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task intake question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });
  
  // ============================================
  // TASK INTAKE LOGIC RULES
  // ============================================
  
  // Add a logic rule
  app.post("/api/task-intake-forms/:formId/logic-rules", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { formId } = req.params;
      
      const validatedData = insertTaskIntakeLogicRuleSchema.parse({
        ...req.body,
        formId
      });
      
      const [newRule] = await db.insert(taskIntakeLogicRules).values(validatedData).returning();
      
      res.json(newRule);
    } catch (error) {
      console.error("Error creating logic rule:", error);
      res.status(500).json({ error: "Failed to create logic rule" });
    }
  });
  
  // Update a logic rule
  app.put("/api/task-intake-logic-rules/:ruleId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { ruleId } = req.params;
      
      const [updatedRule] = await db
        .update(taskIntakeLogicRules)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(taskIntakeLogicRules.id, ruleId))
        .returning();
      
      if (!updatedRule) {
        return res.status(404).json({ error: "Rule not found" });
      }
      
      res.json(updatedRule);
    } catch (error) {
      console.error("Error updating logic rule:", error);
      res.status(500).json({ error: "Failed to update logic rule" });
    }
  });
  
  // Delete a logic rule
  app.delete("/api/task-intake-logic-rules/:ruleId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { ruleId } = req.params;
      
      await db.delete(taskIntakeLogicRules).where(eq(taskIntakeLogicRules.id, ruleId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting logic rule:", error);
      res.status(500).json({ error: "Failed to delete logic rule" });
    }
  });
  
  // ============================================
  // TASK INTAKE ASSIGNMENT RULES
  // ============================================
  
  // Add an assignment rule
  app.post("/api/task-intake-forms/:formId/assignment-rules", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { formId } = req.params;
      
      const validatedData = insertTaskIntakeAssignmentRuleSchema.parse({
        ...req.body,
        formId
      });
      
      const [newRule] = await db.insert(taskIntakeAssignmentRules).values(validatedData).returning();
      
      res.json(newRule);
    } catch (error) {
      console.error("Error creating assignment rule:", error);
      res.status(500).json({ error: "Failed to create assignment rule" });
    }
  });
  
  // Update an assignment rule
  app.put("/api/task-intake-assignment-rules/:ruleId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { ruleId } = req.params;
      
      const [updatedRule] = await db
        .update(taskIntakeAssignmentRules)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(taskIntakeAssignmentRules.id, ruleId))
        .returning();
      
      if (!updatedRule) {
        return res.status(404).json({ error: "Rule not found" });
      }
      
      res.json(updatedRule);
    } catch (error) {
      console.error("Error updating assignment rule:", error);
      res.status(500).json({ error: "Failed to update assignment rule" });
    }
  });
  
  // Delete an assignment rule
  app.delete("/api/task-intake-assignment-rules/:ruleId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { ruleId } = req.params;
      
      await db.delete(taskIntakeAssignmentRules).where(eq(taskIntakeAssignmentRules.id, ruleId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting assignment rule:", error);
      res.status(500).json({ error: "Failed to delete assignment rule" });
    }
  });

  // Team Workflows - Manage team-specific status workflows
  app.get("/api/team-workflows", requireAuth(), requirePermission('workflows', 'canView'), async (req, res) => {
    try {
      const workflows = await db.select()
        .from(teamWorkflows)
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      // Get total count
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(timeOffRequests);
      const total = Number(count);
      
      // Get paginated requests
      const requests = await db.select()
        .from(timeOffRequests)
        .orderBy(desc(timeOffRequests.createdAt))
        .limit(limit)
        .offset(offset);
      
      res.json({
        requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrevious: page > 1
        }
      });
    } catch (error) {
      console.error("Error fetching time off requests:", error);
      res.status(500).json({ error: "Failed to fetch time off requests" });
    }
  });

  app.post("/api/hr/time-off-requests", requireAuth(), requirePermission('hr', 'canCreate'), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      // Get staffId (auto-set to current user if not provided)
      const staffId = req.body.staffId || rawUserId;
      
      // Extract dayHours before processing (not part of main schema)
      const { dayHours, ...bodyWithoutDayHours } = req.body;
      
      // If timeOffTypeId is provided, look up the type and populate the legacy type field
      let legacyType = bodyWithoutDayHours.type || "vacation"; // Default for backward compat
      if (bodyWithoutDayHours.timeOffTypeId) {
        const [typeRecord] = await db
          .select()
          .from(timeOffTypes)
          .where(eq(timeOffTypes.id, bodyWithoutDayHours.timeOffTypeId))
          .limit(1);
        
        if (!typeRecord) {
          return res.status(400).json({ error: "Invalid time off type" });
        }
        
        // Map type name to legacy type value (basic mapping for now)
        const typeName = typeRecord.name.toLowerCase();
        if (typeName.includes('vacation') || typeName.includes('annual') || typeName.includes('pto')) {
          legacyType = 'vacation';
        } else if (typeName.includes('sick')) {
          legacyType = 'sick';
        } else if (typeName.includes('personal')) {
          legacyType = 'personal';
        } else {
          // For custom types, use first word as legacy type or default to 'personal'
          legacyType = typeName.split(' ')[0].toLowerCase() || 'personal';
        }
      }
      
      // Convert totalHours from number to string for decimal field
      const cleanedBody = {
        ...bodyWithoutDayHours,
        staffId,
        type: legacyType, // Populate legacy field
        timeOffTypeId: bodyWithoutDayHours.timeOffTypeId || null,
        totalHours: bodyWithoutDayHours.totalHours?.toString() || "0"
      };
      
      const validatedData = insertTimeOffRequestSchema.parse(cleanedBody);
      const [newRequest] = await db.insert(timeOffRequests).values(validatedData).returning();
      
      // Save individual day hours if provided (wrapped in try-catch for table existence)
      if (dayHours && Array.isArray(dayHours) && dayHours.length > 0) {
        try {
          const dayRecords = dayHours.map((day) => ({
            timeOffRequestId: newRequest.id,
            date: day.date,
            hours: day.hours?.toString() || "0"
          }));
          await db.insert(timeOffRequestDays).values(dayRecords);
        } catch (dayError: any) {
          // Log but don't fail if table doesn't exist yet
          console.warn("Could not save day hours (table may not exist):", dayError.message);
        }
      }
      
      await createAuditLog(
        "created",
        "time_off_request",
        newRequest.id,
        `Time off request by ${staffId}`,
        staffId,
        `Created ${legacyType} request for ${validatedData.totalDays} days`,
        null,
        newRequest,
        req
      );
      
      res.json(newRequest);
    } catch (error: any) {
      console.error("Error creating time off request:", error);
      console.error("Request body received:", JSON.stringify(req.body, null, 2));
      if (error.errors) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
      }
      res.status(500).json({ 
        error: "Failed to create time off request", 
        details: error.message || String(error),
        validationErrors: error.errors || null
      });
    }
  });

  // Get direct reports for managers - SECURED
  app.get("/api/hr/direct-reports", requireAuth(), requirePermission('hr', 'canView'), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Development mode: Mock admin user has no direct reports
      if (IS_DEVELOPMENT && rawUserId === MOCK_ADMIN_USER_ID) {
        res.json([]);
        return;
      }
      
      const directReports = await db.select()
        .from(staff)
        .where(and(eq(staff.managerId, rawUserId), eq(staff.isActive, true)))
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
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
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
              eq(staff.managerId, rawUserId)
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

  // Time Off Types routes
  // Get available time off types for requests - returns ALL active types (global system)
  app.get("/api/hr/time-off-types/available", requireAuth(), async (req, res) => {
    try {
      // Return all active time off types (simplified global system)
      const types = await db
        .select()
        .from(timeOffTypes)
        .where(eq(timeOffTypes.isActive, true))
        .orderBy(asc(timeOffTypes.orderIndex), asc(timeOffTypes.name));

      res.json(types);
    } catch (error) {
      console.error("Error fetching available time off types:", error);
      res.status(500).json({ message: "Failed to fetch available time off types" });
    }
  });

  // Get ALL time off types across all policies (global view)
  app.get("/api/hr/time-off-types", requireAuth(), requirePermission('hr', 'canView'), async (req, res) => {
    try {
      const types = await db
        .select()
        .from(timeOffTypes)
        .orderBy(asc(timeOffTypes.orderIndex), asc(timeOffTypes.name));
      res.json(types);
    } catch (error) {
      console.error("Error fetching all time off types:", error);
      res.status(500).json({ message: "Failed to fetch time off types" });
    }
  });

  app.get("/api/hr/time-off-policies/:policyId/types", requireAuth(), requirePermission('hr', 'canView'), async (req, res) => {
    try {
      const types = await appStorage.getTimeOffTypes(req.params.policyId);
      console.log(`[DEBUG] Fetching types for policy ${req.params.policyId}:`);
      console.log(`[DEBUG] First type:`, types[0]);
      res.json(types);
    } catch (error) {
      console.error("Error fetching time off types:", error);
      res.status(500).json({ message: "Failed to fetch time off policy" });
    }
  });

  app.post("/api/hr/time-off-policies/:policyId/types", requireAuth(), requirePermission('hr', 'canCreate'), async (req, res) => {
    try {
      const { policyId } = req.params;
      const newType = await appStorage.createTimeOffType({
        ...req.body,
        policyId,
      });
      res.status(201).json(newType);
    } catch (error) {
      console.error("Error creating time off type:", error);
      res.status(500).json({ message: "Failed to create time off type" });
    }
  });

  app.patch("/api/hr/time-off-types/:id", requireAuth(), requirePermission('hr', 'canEdit'), async (req, res) => {
    try {
      const updated = await appStorage.updateTimeOffType(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Time off type not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating time off type:", error);
      res.status(500).json({ message: "Failed to update time off type" });
    }
  });

  app.delete("/api/hr/time-off-types/:id", requireAuth(), requirePermission('hr', 'canDelete'), async (req, res) => {
    try {
      const success = await appStorage.deleteTimeOffType(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Time off type not found" });
      }
      res.json({ message: "Time off type deleted successfully" });
    } catch (error) {
      console.error("Error deleting time off type:", error);
      res.status(500).json({ message: "Failed to delete time off type" });
    }
  });

  app.patch("/api/hr/time-off-types/reorder", requireAuth(), requirePermission('hr', 'canEdit'), async (req, res) => {
    try {
      const { updates } = req.body;
      await appStorage.reorderTimeOffTypes(updates);
      res.json({ message: "Time off types reordered successfully" });
    } catch (error) {
      console.error("Error reordering time off types:", error);
      res.status(500).json({ message: "Failed to reorder time off types" });
    }
  });

  // Delete time off request (ADMINS ONLY)
  app.delete("/api/hr/time-off-requests/:requestId", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { requestId } = req.params;
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return; // Authentication failed

      const currentUserId = await normalizeUserIdForDb(rawUserId);

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
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return; // Authentication failed

      const currentUserId = await normalizeUserIdForDb(rawUserId);

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
              eq(staff.managerId, rawUserId)
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
    } catch (error: any) {
      console.error("Error processing time off request approval:", {
        error: error?.message || error,
        stack: error?.stack,
        requestId: req.params.requestId,
        action: req.body?.action
      });
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
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return; // Authentication failed

      const currentUserId = await normalizeUserIdForDb(rawUserId);
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

  // New Hire Onboarding Form Configuration Routes
  app.get("/api/new-hire-onboarding-form-config", async (req, res) => {
    try {
      let config;
      try {
        [config] = await db.select()
          .from(newHireOnboardingFormConfig)
          .orderBy(desc(newHireOnboardingFormConfig.updatedAt))
          .limit(1);
      } catch (tableError) {
        // Table might not exist yet, return default config
        console.log("New hire onboarding form config table not found, using defaults");
        return res.json({
          fields: [
            { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name', required: true, order: 0 },
            { id: 'address', label: 'Address', type: 'textarea', placeholder: 'Enter your full address', required: true, order: 1 },
            { id: 'phone_number', label: 'Phone Number', type: 'phone', placeholder: '+1 (555) 123-4567', required: true, order: 2 },
            { id: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true, order: 3 },
            { id: 'start_date', label: 'Start Date', type: 'date', required: true, order: 4 },
            { id: 'emergency_contact_name', label: 'Emergency Contact Name', type: 'text', placeholder: 'Enter emergency contact name', required: true, order: 5 },
            { id: 'emergency_contact_number', label: 'Emergency Contact Number', type: 'phone', placeholder: '+1 (555) 123-4567', required: true, order: 6 },
            { id: 'emergency_contact_relationship', label: 'Emergency Contact Relationship', type: 'select', required: true, options: ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'], order: 7 },
            { id: 'tshirt_size', label: 'T-shirt Size', type: 'select', required: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'], order: 8 },
            { id: 'payment_platform', label: 'Payment Platform', type: 'select', required: true, options: ['PayPal', 'Direct Deposit', 'Zelle', 'Venmo', 'Cash App', 'Wire Transfer'], order: 9 },
            { id: 'payment_email', label: 'Email linked to Payment Platform', type: 'email', placeholder: 'payment@example.com', required: true, order: 10 }
          ]
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching new hire onboarding form config:", error);
      res.status(500).json({ error: "Failed to fetch form configuration" });
    }
  });

  app.post("/api/new-hire-onboarding-form-config", requireAuth(), requirePermission('hr', 'canManage'), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return; // Authentication failed

      const currentUserId = await normalizeUserIdForDb(rawUserId);
      const validatedData = insertNewHireOnboardingFormConfigSchema.parse({
        ...req.body,
        updatedBy: currentUserId
      });

      // Delete existing config and insert new one (simpler than upsert)
      await db.delete(newHireOnboardingFormConfig);
      const [newConfig] = await db.insert(newHireOnboardingFormConfig)
        .values(validatedData)
        .returning();

      res.json(newConfig);
    } catch (error) {
      console.error("Error saving new hire onboarding form config:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to save form configuration" });
    }
  });

  // New Hire Onboarding Form Submission Routes
  app.post("/api/new-hire-onboarding-submissions", async (req, res) => {
    try {
      const validatedData = insertNewHireOnboardingSubmissionSchema.parse(req.body);

      const [newSubmission] = await db.insert(newHireOnboardingSubmissions)
        .values(validatedData)
        .returning();

      res.status(201).json(newSubmission);
    } catch (error) {
      console.error("Error creating new hire onboarding submission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  app.get("/api/new-hire-onboarding-submissions", requireAuth(), requirePermission('hr', 'canView'), async (req, res) => {
    try {
      const submissions = await db.select()
        .from(newHireOnboardingSubmissions)
        .orderBy(desc(newHireOnboardingSubmissions.submittedAt));

      res.json(submissions);
    } catch (error) {
      console.error("Error fetching new hire onboarding submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.put("/api/new-hire-onboarding-submissions/:id", requireAuth(), requirePermission('hr', 'canManage'), async (req, res) => {
    try {
      const { id } = req.params;
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return; // Authentication failed

      const currentUserId = await normalizeUserIdForDb(rawUserId);

      const validatedData = insertNewHireOnboardingSubmissionSchema.partial().parse({
        ...req.body,
        reviewedBy: currentUserId,
        reviewedAt: new Date()
      });

      const [updatedSubmission] = await db.update(newHireOnboardingSubmissions)
        .set(validatedData)
        .where(eq(newHireOnboardingSubmissions.id, id))
        .returning();

      if (!updatedSubmission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating new hire onboarding submission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to update submission" });
    }
  });

  app.delete("/api/new-hire-onboarding-submissions/:id", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return; // Authentication failed

      const currentUserId = await normalizeUserIdForDb(rawUserId);

      const [deletedSubmission] = await db.delete(newHireOnboardingSubmissions)
        .where(eq(newHireOnboardingSubmissions.id, Number(id)))
        .returning();

      if (!deletedSubmission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      res.json({ success: true, message: "Submission deleted successfully" });
    } catch (error) {
      console.error("Error deleting new hire onboarding submission:", error);
      res.status(500).json({ error: "Failed to delete submission" });
    }
  });

  // Expense Report Form Configuration Routes
  app.get("/api/expense-report-form-config", async (req, res) => {
    try {
      let config;
      try {
        [config] = await db.select()
          .from(expenseReportFormConfig)
          .orderBy(desc(expenseReportFormConfig.updatedAt))
          .limit(1);
      } catch (tableError) {
        console.log("Expense report form config table not found, using defaults");
        config = null;
      }
      
      if (!config) {
        // Return default configuration matching the requirements
        return res.json({
          id: null,
          fields: [],
          updatedBy: null,
          updatedAt: null
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching expense report form config:", error);
      res.status(500).json({ error: "Failed to fetch form configuration" });
    }
  });

  app.post("/api/expense-report-form-config", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      // Check if user is admin OR has settings/hr management permission
      const isAdmin = await isCurrentUserAdmin(currentUserId);
      
      // Short-circuit if admin
      if (!isAdmin) {
        const hasSettingsPermission = await hasPermission(currentUserId, 'settings', 'canManage');
        const hasHRPermission = await hasPermission(currentUserId, 'hr', 'canManage');
        
        if (!hasSettingsPermission && !hasHRPermission) {
          return res.status(403).json({ error: "You don't have permission to update form configuration" });
        }
      }
      
      const validatedData = insertExpenseReportFormConfigSchema.parse({
        ...req.body,
        updatedBy: currentUserId
      });

      // Delete existing config and insert new one
      await db.delete(expenseReportFormConfig);
      const [newConfig] = await db.insert(expenseReportFormConfig).values(validatedData).returning();

      res.json(newConfig);
    } catch (error) {
      console.error("Error saving expense report form config:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to save form configuration" });
    }
  });

  // Expense Report Submission Routes
  app.post("/api/expense-report-submissions", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      const validatedData = insertExpenseReportSubmissionSchema.parse({
        ...req.body,
        submittedById: rawUserId
      });

      const [newSubmission] = await db.insert(expenseReportSubmissions)
        .values(validatedData)
        .returning();

      res.status(201).json(newSubmission);
    } catch (error) {
      console.error("Error creating expense report submission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  app.get("/api/expense-report-submissions", requireAuth(), async (req, res) => {
    try {
      // Check if user has admin or accounting role to view all submissions
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      const isAdmin = await isCurrentUserAdmin(rawUserId);
      const hasAccountingPermission = await hasPermission(rawUserId, 'accounting', 'canView');
      
      let submissions;
      if (isAdmin || hasAccountingPermission) {
        // Admins and Accounting users can see all submissions
        submissions = await db.select()
          .from(expenseReportSubmissions)
          .orderBy(desc(expenseReportSubmissions.submittedAt));
      } else {
        // Regular users can only see their own submissions
        submissions = await db.select()
          .from(expenseReportSubmissions)
          .where(eq(expenseReportSubmissions.submittedById, rawUserId))
          .orderBy(desc(expenseReportSubmissions.submittedAt));
      }

      res.json(submissions);
    } catch (error) {
      console.error("Error fetching expense report submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.patch("/api/expense-report-submissions/:id/status", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      const isAdmin = await isCurrentUserAdmin(currentUserId);
      const hasAccountingPermission = await hasPermission(currentUserId, 'accounting', 'canEdit');
      
      if (!isAdmin && !hasAccountingPermission) {
        return res.status(403).json({ error: "You do not have permission to update submission status" });
      }

      // Validate status
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be: pending, approved, or rejected" });
      }

      const [updatedSubmission] = await db.update(expenseReportSubmissions)
        .set({ 
          status,
          reviewedBy: currentUserId,
          reviewedAt: new Date()
        })
        .where(eq(expenseReportSubmissions.id, Number(id)))
        .returning();

      if (!updatedSubmission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating expense report submission status:", error);
      res.status(500).json({ error: "Failed to update submission status" });
    }
  });

  app.put("/api/expense-report-submissions/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      const isAdmin = await isCurrentUserAdmin(currentUserId);
      const hasAccountingPermission = await hasPermission(currentUserId, 'accounting', 'canEdit');
      
      const validatedData = insertExpenseReportSubmissionSchema.partial().parse({
        ...req.body,
        ...(isAdmin || hasAccountingPermission ? { reviewedBy: currentUserId, reviewedAt: new Date() } : {})
      });

      const [updatedSubmission] = await db.update(expenseReportSubmissions)
        .set(validatedData)
        .where(eq(expenseReportSubmissions.id, Number(id)))
        .returning();

      if (!updatedSubmission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating expense report submission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to update submission" });
    }
  });

  // ===========================================
  // 1-on-1 Meeting Tracker Routes
  // ===========================================

  // Get manager's direct reports for 1-on-1 meetings
  app.get("/api/hr/one-on-one/direct-reports", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;

      // Get direct reports
      const directReports = await db.select({
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        profileImagePath: staff.profileImagePath,
        position: staff.position,
        department: staff.department,
        hireDate: staff.hireDate,
        birthdate: staff.birthdate,
      })
        .from(staff)
        .where(and(eq(staff.managerId, rawUserId), eq(staff.isActive, true)));

      res.json(directReports);
    } catch (error) {
      console.error("Error fetching direct reports for 1-on-1:", error);
      res.status(500).json({ error: "Failed to fetch direct reports" });
    }
  });

  // Get current user's own 1v1 meetings (where they are the direct report)
  // SECURITY: Private notes are excluded from this endpoint
  app.get("/api/hr/one-on-one/my-meetings", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;

      // Get meetings where current user is the direct report
      // Explicitly exclude privateNotes for security
      const meetings = await db.select({
        id: oneOnOneMeetings.id,
        managerId: oneOnOneMeetings.managerId,
        directReportId: oneOnOneMeetings.directReportId,
        meetingDate: oneOnOneMeetings.meetingDate,
        weekOf: oneOnOneMeetings.weekOf,
        feeling: oneOnOneMeetings.feeling,
        performanceFeedback: oneOnOneMeetings.performanceFeedback,
        performancePoints: oneOnOneMeetings.performancePoints,
        bonusPoints: oneOnOneMeetings.bonusPoints,
        progressionStatus: oneOnOneMeetings.progressionStatus,
        hobbies: oneOnOneMeetings.hobbies,
        family: oneOnOneMeetings.family,
        recordingLink: oneOnOneMeetings.recordingLink,
        createdAt: oneOnOneMeetings.createdAt,
        updatedAt: oneOnOneMeetings.updatedAt,
        // privateNotes intentionally excluded
      })
        .from(oneOnOneMeetings)
        .where(eq(oneOnOneMeetings.directReportId, rawUserId))
        .orderBy(desc(oneOnOneMeetings.meetingDate));

      res.json(meetings);
    } catch (error) {
      console.error("Error fetching user's own 1-on-1 meetings:", error);
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  // Get all meetings for a direct report
  app.get("/api/hr/one-on-one/meetings/:directReportId", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      const { directReportId } = req.params;

      // Check if user is manager of this direct report or admin
      const isAdmin = await isCurrentUserAdmin(rawUserId);
      const [directReport] = await db.select()
        .from(staff)
        .where(eq(staff.id, directReportId));

      if (!isAdmin && directReport?.managerId !== rawUserId && rawUserId !== directReportId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Get all meetings
      const meetings = await db.select()
        .from(oneOnOneMeetings)
        .where(eq(oneOnOneMeetings.directReportId, directReportId))
        .orderBy(desc(oneOnOneMeetings.weekOf));

      res.json(meetings);
    } catch (error) {
      console.error("Error fetching 1-on-1 meetings:", error);
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  // Get full meeting details with all related data
  app.get("/api/hr/one-on-one/meetings/:meetingId/details", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      const { meetingId } = req.params;

      // Get meeting
      const [meeting] = await db.select()
        .from(oneOnOneMeetings)
        .where(eq(oneOnOneMeetings.id, meetingId));

      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      // Check authorization
      const isAdmin = await isCurrentUserAdmin(rawUserId);
      if (!isAdmin && meeting.managerId !== rawUserId && meeting.directReportId !== rawUserId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Get all related data
      const talkingPoints = await db.select()
        .from(oneOnOneTalkingPoints)
        .where(eq(oneOnOneTalkingPoints.meetingId, meetingId))
        .orderBy(oneOnOneTalkingPoints.orderIndex);

      const wins = await db.select()
        .from(oneOnOneWins)
        .where(eq(oneOnOneWins.meetingId, meetingId))
        .orderBy(oneOnOneWins.orderIndex);

      const actionItems = await db.select()
        .from(oneOnOneActionItems)
        .where(eq(oneOnOneActionItems.meetingId, meetingId));

      const goals = await db.select()
        .from(oneOnOneGoals)
        .where(eq(oneOnOneGoals.meetingId, meetingId));

      const comments = await db.select({
        id: oneOnOneComments.id,
        meetingId: oneOnOneComments.meetingId,
        authorId: oneOnOneComments.authorId,
        content: oneOnOneComments.content,
        createdAt: oneOnOneComments.createdAt,
        authorFirstName: staff.firstName,
        authorLastName: staff.lastName,
        authorProfileImagePath: staff.profileImagePath,
      })
        .from(oneOnOneComments)
        .innerJoin(staff, eq(oneOnOneComments.authorId, staff.id))
        .where(eq(oneOnOneComments.meetingId, meetingId))
        .orderBy(oneOnOneComments.createdAt);

      // If user is direct report, filter out private notes
      const sanitizedMeeting = meeting.directReportId === rawUserId && meeting.managerId !== rawUserId
        ? { ...meeting, privateNotes: null, progressionStatus: null }
        : meeting;

      res.json({
        meeting: sanitizedMeeting,
        talkingPoints,
        wins,
        actionItems,
        goals,
        comments,
      });
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      res.status(500).json({ error: "Failed to fetch meeting details" });
    }
  });

  // Create a new 1-on-1 meeting
  app.post("/api/hr/one-on-one/meetings", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;

      const validatedData = insertOneOnOneMeetingSchema.parse({
        ...req.body,
        managerId: rawUserId,
      });

      // Check if user is manager of this direct report
      const [directReport] = await db.select()
        .from(staff)
        .where(eq(staff.id, validatedData.directReportId));

      const isAdmin = await isCurrentUserAdmin(rawUserId);
      if (!isAdmin && directReport?.managerId !== rawUserId) {
        return res.status(403).json({ error: "You can only create meetings for your direct reports" });
      }

      const [newMeeting] = await db.insert(oneOnOneMeetings)
        .values(validatedData)
        .returning();

      // Auto-create default KPI status rows for the direct report's position
      if (directReport?.positionId) {
        // Fetch all KPIs for this position
        const kpisForPosition = await db.select()
          .from(positionKpis)
          .where(eq(positionKpis.positionId, directReport.positionId));

        // Create default "on_track" status for each KPI
        if (kpisForPosition.length > 0) {
          await db.insert(oneOnOneMeetingKpiStatuses)
            .values(
              kpisForPosition.map((kpi) => ({
                meetingId: newMeeting.id,
                positionKpiId: kpi.id,
                status: 'on_track' as const,
              }))
            );
        }
      }

      // Create internal calendar appointment and optionally sync to Google Calendar
      let updatedMeeting = newMeeting;
      if (newMeeting.meetingTime && newMeeting.meetingDuration) {
        const calendarResult = await createOneOnOneMeetingCalendars({
          meetingId: newMeeting.id,
          managerId: rawUserId,
          directReportId: newMeeting.directReportId,
          meetingDate: newMeeting.meetingDate,
          meetingTime: newMeeting.meetingTime,
          meetingDuration: newMeeting.meetingDuration,
        });
        
        console.log('[1-on-1 Meeting] Calendar creation result:', calendarResult);
        
        if (calendarResult.success) {
          // Use the updated meeting from the service result (guaranteed to have calendarAppointmentId)
          if (calendarResult.updatedMeeting) {
            updatedMeeting = calendarResult.updatedMeeting;
          }
          
          // If Google sync failed but internal calendar succeeded, propagate the error for UI feedback
          if (calendarResult.googleSyncError) {
            return res.json({
              ...updatedMeeting,
              calendarEventError: calendarResult.googleSyncError
            });
          }
        } else if (!calendarResult.success && calendarResult.error) {
          // Internal calendar creation failed - return 500 with error
          console.error('[1-on-1 Meeting] Calendar creation failed:', calendarResult.error);
          return res.status(500).json({
            ...newMeeting,
            calendarCreationFailed: true,
            calendarEventError: calendarResult.error
          });
        }
      }

      res.json(updatedMeeting);
    } catch (error) {
      console.error("Error creating 1-on-1 meeting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  // Update a 1-on-1 meeting
  app.put("/api/hr/one-on-one/meetings/:meetingId", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      const { meetingId } = req.params;

      // Get existing meeting
      const [existingMeeting] = await db.select()
        .from(oneOnOneMeetings)
        .where(eq(oneOnOneMeetings.id, meetingId));

      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      // Check authorization - only manager can update
      const isAdmin = await isCurrentUserAdmin(rawUserId);
      if (!isAdmin && existingMeeting.managerId !== rawUserId) {
        return res.status(403).json({ error: "Only managers can update meetings" });
      }

      const validatedData = insertOneOnOneMeetingSchema.partial().parse(req.body);

      const [updatedMeeting] = await db.update(oneOnOneMeetings)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(oneOnOneMeetings.id, meetingId))
        .returning();

      // Check if date/time changed and sync to calendar
      const dateChanged = validatedData.meetingDate && validatedData.meetingDate !== existingMeeting.meetingDate;
      const timeChanged = validatedData.meetingTime && validatedData.meetingTime !== existingMeeting.meetingTime;
      const durationChanged = validatedData.meetingDuration && validatedData.meetingDuration !== existingMeeting.meetingDuration;
      
      let calendarSyncError: string | undefined;
      
      if (dateChanged || timeChanged || durationChanged) {
        const calendarResult = await updateOneOnOneMeetingCalendars({
          meetingId: updatedMeeting.id,
          managerId: updatedMeeting.managerId,
          directReportId: updatedMeeting.directReportId,
          calendarAppointmentId: updatedMeeting.calendarAppointmentId,
          calendarEventId: updatedMeeting.calendarEventId,
          meetingDate: updatedMeeting.meetingDate,
          meetingTime: updatedMeeting.meetingTime,
          meetingDuration: updatedMeeting.meetingDuration,
        });
        
        if (!calendarResult.success) {
          console.warn('[1-on-1 Meeting] Calendar sync had issues:', calendarResult.error);
          calendarSyncError = calendarResult.error;
        }
        if (calendarResult.googleSyncError) {
          calendarSyncError = calendarResult.googleSyncError;
        }
      }

      res.json({
        ...updatedMeeting,
        calendarSyncError,
      });
    } catch (error) {
      console.error("Error updating 1-on-1 meeting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  // Delete a 1-on-1 meeting
  app.delete("/api/hr/one-on-one/meetings/:meetingId", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      const { meetingId } = req.params;

      // Get existing meeting
      const [existingMeeting] = await db.select()
        .from(oneOnOneMeetings)
        .where(eq(oneOnOneMeetings.id, meetingId));

      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      // Check authorization
      const isAdmin = await isCurrentUserAdmin(rawUserId);
      if (!isAdmin && existingMeeting.managerId !== rawUserId) {
        return res.status(403).json({ error: "Only managers can delete meetings" });
      }

      // Delete calendar events first (internal and Google)
      const calendarResult = await deleteOneOnOneMeetingCalendars({
        id: existingMeeting.id,
        calendarAppointmentId: existingMeeting.calendarAppointmentId,
        calendarEventId: existingMeeting.calendarEventId,
        directReportId: existingMeeting.directReportId,
      });
      
      if (!calendarResult.success) {
        console.warn('[1-on-1 Meeting] Calendar deletion had issues:', calendarResult.error);
      }

      // Delete the meeting record
      await db.delete(oneOnOneMeetings)
        .where(eq(oneOnOneMeetings.id, meetingId));

      res.json({ 
        message: "Meeting deleted successfully",
        calendarDeleted: calendarResult.success,
        googleDeleteError: calendarResult.googleDeleteError 
      });
    } catch (error) {
      console.error("Error deleting 1-on-1 meeting:", error);
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  });

  // Talking Points Routes
  app.post("/api/hr/one-on-one/talking-points", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;

      const validatedData = insertOneOnOneTalkingPointSchema.parse({
        ...req.body,
        addedBy: rawUserId,
      });

      const [newPoint] = await db.insert(oneOnOneTalkingPoints)
        .values(validatedData)
        .returning();

      res.json(newPoint);
    } catch (error) {
      console.error("Error creating talking point:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to create talking point" });
    }
  });

  app.put("/api/hr/one-on-one/talking-points/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertOneOnOneTalkingPointSchema.partial().parse(req.body);

      const [updated] = await db.update(oneOnOneTalkingPoints)
        .set(validatedData)
        .where(eq(oneOnOneTalkingPoints.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Talking point not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating talking point:", error);
      res.status(500).json({ error: "Failed to update talking point" });
    }
  });

  app.delete("/api/hr/one-on-one/talking-points/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(oneOnOneTalkingPoints).where(eq(oneOnOneTalkingPoints.id, id));
      res.json({ message: "Talking point deleted" });
    } catch (error) {
      console.error("Error deleting talking point:", error);
      res.status(500).json({ error: "Failed to delete talking point" });
    }
  });


  // Wins Routes
  app.post("/api/hr/one-on-one/wins", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;

      const validatedData = insertOneOnOneWinSchema.parse({
        ...req.body,
        addedBy: rawUserId,
      });

      const [newWin] = await db.insert(oneOnOneWins)
        .values(validatedData)
        .returning();

      res.json(newWin);
    } catch (error) {
      console.error("Error creating win:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to create win" });
    }
  });

  app.put("/api/hr/one-on-one/wins/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertOneOnOneWinSchema.partial().parse(req.body);
      
      const [updatedWin] = await db.update(oneOnOneWins)
        .set(validatedData)
        .where(eq(oneOnOneWins.id, id))
        .returning();

      res.json(updatedWin);
    } catch (error) {
      console.error("Error updating win:", error);
      res.status(500).json({ error: "Failed to update win" });
    }
  });

  app.delete("/api/hr/one-on-one/wins/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(oneOnOneWins).where(eq(oneOnOneWins.id, id));
      res.json({ message: "Win deleted" });
    } catch (error) {
      console.error("Error deleting win:", error);
      res.status(500).json({ error: "Failed to delete win" });
    }
  });

  // Action Items Routes
  app.post("/api/hr/one-on-one/action-items", requireAuth(), async (req, res) => {
    try {
      const validatedData = insertOneOnOneActionItemSchema.parse(req.body);
      const [newItem] = await db.insert(oneOnOneActionItems)
        .values(validatedData)
        .returning();
      res.json(newItem);
    } catch (error) {
      console.error("Error creating action item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to create action item" });
    }
  });

  app.put("/api/hr/one-on-one/action-items/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertOneOnOneActionItemSchema.partial().parse(req.body);

      const [updated] = await db.update(oneOnOneActionItems)
        .set(validatedData)
        .where(eq(oneOnOneActionItems.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Action item not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating action item:", error);
      res.status(500).json({ error: "Failed to update action item" });
    }
  });

  app.delete("/api/hr/one-on-one/action-items/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(oneOnOneActionItems).where(eq(oneOnOneActionItems.id, id));
      res.json({ message: "Action item deleted" });
    } catch (error) {
      console.error("Error deleting action item:", error);
      res.status(500).json({ error: "Failed to delete action item" });
    }
  });

  // Goals Routes
  app.post("/api/hr/one-on-one/goals", requireAuth(), async (req, res) => {
    try {
      const validatedData = insertOneOnOneGoalSchema.parse(req.body);
      const [newGoal] = await db.insert(oneOnOneGoals)
        .values(validatedData)
        .returning();
      res.json(newGoal);
    } catch (error) {
      console.error("Error creating goal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.put("/api/hr/one-on-one/goals/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertOneOnOneGoalSchema.partial().parse(req.body);

      const [updated] = await db.update(oneOnOneGoals)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(oneOnOneGoals.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Goal not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/hr/one-on-one/goals/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(oneOnOneGoals).where(eq(oneOnOneGoals.id, id));
      res.json({ message: "Goal deleted" });
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Position KPI Status Routes
  app.get("/api/hr/one-on-one/meetings/:meetingId/kpi-statuses", requireAuth(), async (req, res) => {
    try {
      const { meetingId } = req.params;
      const statuses = await db.select()
        .from(oneOnOneMeetingKpiStatuses)
        .where(eq(oneOnOneMeetingKpiStatuses.meetingId, meetingId));
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching KPI statuses:", error);
      res.status(500).json({ error: "Failed to fetch KPI statuses" });
    }
  });

  app.put("/api/hr/one-on-one/kpi-statuses/:meetingId/:positionKpiId", requireAuth(), async (req, res) => {
    try {
      const { meetingId, positionKpiId } = req.params;
      const { status } = req.body;

      if (!status || !['on_track', 'off_track', 'complete'].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      // Check if status already exists
      const [existing] = await db.select()
        .from(oneOnOneMeetingKpiStatuses)
        .where(
          and(
            eq(oneOnOneMeetingKpiStatuses.meetingId, meetingId),
            eq(oneOnOneMeetingKpiStatuses.positionKpiId, positionKpiId)
          )
        );

      let result;
      if (existing) {
        // Update existing status
        [result] = await db.update(oneOnOneMeetingKpiStatuses)
          .set({ status, updatedAt: new Date() })
          .where(
            and(
              eq(oneOnOneMeetingKpiStatuses.meetingId, meetingId),
              eq(oneOnOneMeetingKpiStatuses.positionKpiId, positionKpiId)
            )
          )
          .returning();
      } else {
        // Insert new status
        [result] = await db.insert(oneOnOneMeetingKpiStatuses)
          .values({
            meetingId,
            positionKpiId,
            status,
          })
          .returning();
      }

      res.json(result);
    } catch (error) {
      console.error("Error updating KPI status:", error);
      res.status(500).json({ error: "Failed to update KPI status" });
    }
  });

  // Comments Routes
  app.post("/api/hr/one-on-one/comments", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;

      const validatedData = insertOneOnOneCommentSchema.parse({
        ...req.body,
        authorId: currentUserId,
      });

      const [newComment] = await db.insert(oneOnOneComments)
        .values(validatedData)
        .returning();

      // Get comment with author info
      const [commentWithAuthor] = await db.select({
        id: oneOnOneComments.id,
        meetingId: oneOnOneComments.meetingId,
        authorId: oneOnOneComments.authorId,
        content: oneOnOneComments.content,
        createdAt: oneOnOneComments.createdAt,
        authorFirstName: staff.firstName,
        authorLastName: staff.lastName,
        authorProfileImagePath: staff.profileImagePath,
      })
        .from(oneOnOneComments)
        .innerJoin(staff, eq(oneOnOneComments.authorId, staff.id))
        .where(eq(oneOnOneComments.id, newComment.id));

      res.json(commentWithAuthor);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.delete("/api/hr/one-on-one/comments/:id", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      const { id } = req.params;

      // Check if user is the author or admin
      const [comment] = await db.select()
        .from(oneOnOneComments)
        .where(eq(oneOnOneComments.id, id));

      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const isAdmin = await isCurrentUserAdmin(req);
      if (!isAdmin && comment.authorId !== currentUserId) {
        return res.status(403).json({ error: "You can only delete your own comments" });
      }

      await db.delete(oneOnOneComments).where(eq(oneOnOneComments.id, id));
      res.json({ message: "Comment deleted" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Progression Status Management Routes
  app.get("/api/hr/one-on-one/progression-statuses", requireAuth(), async (req, res) => {
    try {
      // All authenticated users can view progression statuses
      const statuses = await db.select()
        .from(oneOnOneProgressionStatuses)
        .orderBy(oneOnOneProgressionStatuses.orderIndex);
      
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching progression statuses:", error);
      res.status(500).json({ error: "Failed to fetch progression statuses" });
    }
  });

  app.post("/api/hr/one-on-one/progression-statuses", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;

      // Check if user is admin
      const isAdmin = await isCurrentUserAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ error: "Only administrators can create progression statuses" });
      }

      const validatedData = insertOneOnOneProgressionStatusSchema.parse(req.body);
      
      const [newStatus] = await db.insert(oneOnOneProgressionStatuses)
        .values(validatedData)
        .returning();

      res.json(newStatus);
    } catch (error) {
      console.error("Error creating progression status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to create progression status" });
    }
  });

  app.put("/api/hr/one-on-one/progression-statuses/:id", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      const { id } = req.params;

      // Check if user is admin
      const isAdmin = await isCurrentUserAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ error: "Only administrators can update progression statuses" });
      }

      const validatedData = insertOneOnOneProgressionStatusSchema.partial().parse(req.body);
      
      const [updated] = await db.update(oneOnOneProgressionStatuses)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(oneOnOneProgressionStatuses.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Progression status not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating progression status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to update progression status" });
    }
  });

  app.delete("/api/hr/one-on-one/progression-statuses/:id", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      const { id } = req.params;

      // Check if user is admin
      const isAdmin = await isCurrentUserAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ error: "Only administrators can delete progression statuses" });
      }

      await db.delete(oneOnOneProgressionStatuses)
        .where(eq(oneOnOneProgressionStatuses.id, id));

      res.json({ message: "Progression status deleted successfully" });
    } catch (error) {
      console.error("Error deleting progression status:", error);
      res.status(500).json({ error: "Failed to delete progression status" });
    }
  });

  // 1-on-1 Performance Reports
  app.get("/api/reports/one-on-one-performance", requireAuth(), async (req, res) => {
    try {
      const currentUserId = getAuthenticatedUserId(req);
      console.log("📊 1-on-1 Performance Report - currentUserId:", currentUserId);
      if (!rawUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const isAdmin = await isCurrentUserAdmin(req);
      console.log("📊 1-on-1 Performance Report - isAdmin:", isAdmin);
      
      // Get user info from staff table
      const staffUser = await db.select({ 
        firstName: staff.firstName,
        lastName: staff.lastName,
        roleId: staff.roleId
      })
        .from(staff)
        .where(eq(staff.id, currentUserId))
        .limit(1);
      
      if (!staffUser.length) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user is a manager (roleId corresponds to Manager role)
      const isManager = staffUser[0].roleId ? (await db.select({ name: roles.name })
        .from(roles)
        .where(eq(roles.id, staffUser[0].roleId))
        .limit(1)
      )[0]?.name?.toLowerCase() === 'manager' : false;

      // Extract filter parameters
      const { dateFrom, dateTo, feeling, progression, department } = req.query;
      
      // Build filter conditions
      const filters: any[] = [];
      
      // Date range filters
      if (dateFrom && typeof dateFrom === 'string') {
        filters.push(gte(oneOnOneMeetings.meetingDate, dateFrom));
      }
      if (dateTo && typeof dateTo === 'string') {
        filters.push(lte(oneOnOneMeetings.meetingDate, dateTo));
      }
      
      // Feeling filter
      if (feeling && typeof feeling === 'string' && feeling !== 'all') {
        filters.push(eq(oneOnOneMeetings.feeling, feeling));
      }
      
      // Progression status filter
      if (progression && typeof progression === 'string' && progression !== 'all') {
        filters.push(eq(oneOnOneMeetings.progressionStatus, progression));
      }
      
      // Department filter (applied via staff table)
      if (department && typeof department === 'string' && department !== 'all') {
        filters.push(eq(staff.department, department));
      }

      // Build the query based on role
      let meetingsQuery;
      const baseSelect = {
        id: oneOnOneMeetings.id,
        directReportId: oneOnOneMeetings.directReportId,
        managerId: oneOnOneMeetings.managerId,
        meetingDate: oneOnOneMeetings.meetingDate,
        weekOf: oneOnOneMeetings.weekOf,
        feeling: oneOnOneMeetings.feeling,
        performancePoints: oneOnOneMeetings.performancePoints,
        bonusPoints: oneOnOneMeetings.bonusPoints,
        progressionStatus: oneOnOneMeetings.progressionStatus,
        directReportFirstName: staff.firstName,
        directReportLastName: staff.lastName,
      };
      
      if (isAdmin) {
        console.log("📊 Using ADMIN query path - will return all meetings");
        // Admins see all meetings
        const adminConditions = filters.length > 0 ? and(...filters) : undefined;
        meetingsQuery = db.select(baseSelect)
          .from(oneOnOneMeetings)
          .leftJoin(staff, eq(oneOnOneMeetings.directReportId, staff.id))
          .where(adminConditions)
          .orderBy(desc(oneOnOneMeetings.meetingDate));
      } else if (isManager) {
        // Managers see their direct reports' meetings
        const managerConditions = [eq(oneOnOneMeetings.managerId, currentUserId), ...filters];
        meetingsQuery = db.select(baseSelect)
          .from(oneOnOneMeetings)
          .leftJoin(staff, eq(oneOnOneMeetings.directReportId, staff.id))
          .where(and(...managerConditions))
          .orderBy(desc(oneOnOneMeetings.meetingDate));
      } else {
        // Regular users see only their own meetings
        const userConditions = [eq(oneOnOneMeetings.directReportId, currentUserId), ...filters];
        meetingsQuery = db.select(baseSelect)
          .from(oneOnOneMeetings)
          .leftJoin(staff, eq(oneOnOneMeetings.directReportId, staff.id))
          .where(and(...userConditions))
          .orderBy(desc(oneOnOneMeetings.meetingDate));
      }

      const meetings = await meetingsQuery;
      console.log("📊 Meetings query returned:", meetings.length, "meetings");
      if (meetings.length > 0) {
        console.log("📊 First meeting:", meetings[0]);
      }

      // Fetch talking points, action items, goals, and KPI statuses for all meetings
      const meetingIds = meetings.map(m => m.id);
      
      const talkingPoints = meetingIds.length > 0 
        ? await db.select().from(oneOnOneTalkingPoints).where(inArray(oneOnOneTalkingPoints.meetingId, meetingIds))
        : [];
      
      const actionItems = meetingIds.length > 0
        ? await db.select().from(oneOnOneActionItems).where(inArray(oneOnOneActionItems.meetingId, meetingIds))
        : [];
      
      const goals = meetingIds.length > 0
        ? await db.select().from(oneOnOneGoals).where(inArray(oneOnOneGoals.meetingId, meetingIds))
        : [];
      
      const kpiStatuses = meetingIds.length > 0
        ? await db.select().from(oneOnOneMeetingKpiStatuses).where(inArray(oneOnOneMeetingKpiStatuses.meetingId, meetingIds))
        : [];

      // Group meetings by direct report
      const performanceByUser = new Map();

      for (const meeting of meetings) {
        const userId = meeting.directReportId;
        const userName = `${meeting.directReportFirstName || ''} ${meeting.directReportLastName || ''}`.trim();
        
        if (!performanceByUser.has(userId)) {
          performanceByUser.set(userId, {
            userId,
            userName,
            totalMeetings: 0,
            performancePoints: [],
            feelings: [],
            progressionStatuses: [],
            talkingPointsTotal: 0,
            talkingPointsCompleted: 0,
            actionItemsTotal: 0,
            actionItemsCompleted: 0,
            goalsTotal: 0,
            goalsCompleted: 0,
            kpisTotal: 0,
            kpisOnTrack: 0,
            kpisOffTrack: 0,
            kpisComplete: 0,
            meetings: [],
          });
        }

        const userData = performanceByUser.get(userId);
        userData.totalMeetings++;
        
        if (meeting.performancePoints !== null) {
          // Push total score (base + bonus)
          const totalScore = (meeting.performancePoints || 0) + (meeting.bonusPoints || 0);
          userData.performancePoints.push(totalScore);
        }
        if (meeting.feeling) {
          userData.feelings.push(meeting.feeling);
        }
        if (meeting.progressionStatus) {
          userData.progressionStatuses.push(meeting.progressionStatus);
        }

        // Count talking points
        const meetingTalkingPoints = talkingPoints.filter(tp => tp.meetingId === meeting.id);
        userData.talkingPointsTotal += meetingTalkingPoints.length;
        userData.talkingPointsCompleted += meetingTalkingPoints.filter(tp => tp.isCompleted).length;

        // Count action items
        const meetingActionItems = actionItems.filter(ai => ai.meetingId === meeting.id);
        userData.actionItemsTotal += meetingActionItems.length;
        userData.actionItemsCompleted += meetingActionItems.filter(ai => ai.isCompleted).length;

        // Count goals
        const meetingGoals = goals.filter(g => g.meetingId === meeting.id);
        userData.goalsTotal += meetingGoals.length;
        userData.goalsCompleted += meetingGoals.filter(g => g.status === 'complete').length;

        // Count KPIs
        const meetingKpis = kpiStatuses.filter(k => k.meetingId === meeting.id);
        userData.kpisTotal += meetingKpis.length;
        userData.kpisOnTrack += meetingKpis.filter(k => k.status === 'on_track').length;
        userData.kpisOffTrack += meetingKpis.filter(k => k.status === 'off_track').length;
        userData.kpisComplete += meetingKpis.filter(k => k.status === 'complete').length;

        userData.meetings.push({
          id: meeting.id,
          meetingDate: meeting.meetingDate,
          weekOf: meeting.weekOf,
          feeling: meeting.feeling,
          performancePoints: meeting.performancePoints,
          bonusPoints: meeting.bonusPoints,
          progressionStatus: meeting.progressionStatus,
        });
      }

      // Calculate averages and percentages
      const performanceReports = Array.from(performanceByUser.values()).map(userData => ({
        userId: userData.userId,
        userName: userData.userName,
        totalMeetings: userData.totalMeetings,
        avgPerformancePoints: userData.performancePoints.length > 0
          ? userData.performancePoints.reduce((a, b) => a + b, 0) / userData.performancePoints.length
          : null,
        talkingPointsCompletionRate: userData.talkingPointsTotal > 0
          ? (userData.talkingPointsCompleted / userData.talkingPointsTotal) * 100
          : null,
        actionItemsCompletionRate: userData.actionItemsTotal > 0
          ? (userData.actionItemsCompleted / userData.actionItemsTotal) * 100
          : null,
        goalsCompletionRate: userData.goalsTotal > 0
          ? (userData.goalsCompleted / userData.goalsTotal) * 100
          : null,
        kpiSummary: {
          total: userData.kpisTotal,
          onTrack: userData.kpisOnTrack,
          offTrack: userData.kpisOffTrack,
          complete: userData.kpisComplete,
          percentageComplete: userData.kpisTotal > 0
            ? (userData.kpisComplete / userData.kpisTotal) * 100
            : null,
        },
        mostCommonFeeling: userData.feelings.length > 0
          ? userData.feelings.sort((a, b) =>
              userData.feelings.filter(f => f === a).length - userData.feelings.filter(f => f === b).length
            ).pop()
          : null,
        mostCommonProgressionStatus: userData.progressionStatuses.length > 0
          ? userData.progressionStatuses.sort((a, b) =>
              userData.progressionStatuses.filter(s => s === a).length - userData.progressionStatuses.filter(s => s === b).length
            ).pop()
          : null,
        meetings: userData.meetings,
      }));

      res.json(performanceReports);
    } catch (error) {
      console.error("Error fetching 1-on-1 performance reports:", error);
      res.status(500).json({ error: "Failed to fetch performance reports" });
    }
  });

  // Offboarding Form Configuration Routes
  app.get("/api/offboarding-form-config", async (req, res) => {
    try {
      let config;
      try {
        [config] = await db.select()
          .from(offboardingFormConfig)
          .limit(1);
      } catch (dbError) {
        console.error("Database query error:", dbError);
        config = null;
      }
      
      if (!config) {
        return res.json({ fields: [] });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching offboarding form config:", error);
      res.status(500).json({ error: "Failed to fetch form configuration" });
    }
  });

  app.post("/api/offboarding-form-config", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      // Check if user is admin OR has settings/hr management permission
      const isAdmin = await isCurrentUserAdmin(currentUserId);
      const hasSettingsManagePermission = await hasPermission(currentUserId, 'settings', 'canManage');
      const hasHrManagePermission = await hasPermission(currentUserId, 'hr', 'canManage');
      
      if (!isAdmin && !hasSettingsManagePermission && !hasHrManagePermission) {
        return res.status(403).json({ error: "You do not have permission to configure the offboarding form" });
      }
      
      const validatedData = insertOffboardingFormConfigSchema.parse({
        fields: req.body.fields,
        updatedBy: currentUserId
      });

      // Check if a config already exists
      const [existingConfig] = await db.select()
        .from(offboardingFormConfig)
        .limit(1);

      let config;
      if (existingConfig) {
        [config] = await db.update(offboardingFormConfig)
          .set({ ...validatedData, updatedAt: new Date() })
          .where(eq(offboardingFormConfig.id, existingConfig.id))
          .returning();
      } else {
        [config] = await db.insert(offboardingFormConfig).values(validatedData).returning();
      }

      res.json(config);
    } catch (error) {
      console.error("Error saving offboarding form config:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to save form configuration" });
    }
  });

  // Offboarding Submission Routes
  app.post("/api/offboarding-submissions", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      const currentUserId = await normalizeUserIdForDb(rawUserId);
      
      const validatedData = insertOffboardingSubmissionSchema.parse({
        ...req.body,
        submittedById: rawUserId,
        status: 'pending'
      });

      const [newSubmission] = await db.insert(offboardingSubmissions).values(validatedData).returning();
      res.json(newSubmission);
    } catch (error) {
      console.error("Error creating offboarding submission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  app.get("/api/offboarding-submissions", requireAuth(), async (req, res) => {
    try {
      // Check if user has admin or manager role to view all submissions
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      const currentUserId = await normalizeUserIdForDb(rawUserId);
      
      const isAdmin = await isCurrentUserAdmin(currentUserId);
      const hasHrViewPermission = await hasPermission(currentUserId, 'hr', 'canView');
      const hasHrManagePermission = await hasPermission(currentUserId, 'hr', 'canManage');
      
      if (!isAdmin && !hasHrViewPermission && !hasHrManagePermission) {
        return res.status(403).json({ error: "You do not have permission to view offboarding submissions" });
      }
      
      const submissions = await db.select()
        .from(offboardingSubmissions)
        .orderBy(desc(offboardingSubmissions.submittedAt));
      
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching offboarding submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.patch("/api/offboarding-submissions/:id/status", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      const currentUserId = await normalizeUserIdForDb(rawUserId);
      // Check if user has admin or manager permissions
      const isAdmin = await isCurrentUserAdmin(currentUserId);
      const hasHrManagePermission = await hasPermission(currentUserId, 'hr', 'canManage');
      
      if (!isAdmin && !hasHrManagePermission) {
        return res.status(403).json({ error: "You do not have permission to update submission status" });
      }

      // Validate status
      const validStatuses = ['pending', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be: pending or completed" });
      }

      const updateData: any = { 
        status,
        ...(status === 'completed' ? {
          completedBy: currentUserId,
          completedAt: new Date()
        } : {})
      };

      const [updatedSubmission] = await db.update(offboardingSubmissions)
        .set(updateData)
        .where(eq(offboardingSubmissions.id, Number(id)))
        .returning();

      if (!updatedSubmission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating offboarding submission status:", error);
      res.status(500).json({ error: "Failed to update submission status" });
    }
  });

  app.post("/api/job-openings", requireAuth(), requirePermission('hr', 'canCreate'), async (req, res) => {
    try {
      console.log("POST /api/job-openings - Request body:", req.body);
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return; // Authentication failed

      const currentUserId = await normalizeUserIdForDb(rawUserId);
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
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return; // Authentication failed

      const currentUserId = await normalizeUserIdForDb(rawUserId);

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
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return; // Authentication failed

      const currentUserId = await normalizeUserIdForDb(rawUserId);
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
        // If approved, set status to 'open' and make it public so it appears on careers page
        updateData.status = "open";
        updateData.isPublic = true;
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


  // Delete job opening (admin only)
  app.delete("/api/job-openings/:id", requireAuth(), requirePermission('hr', 'canManage'), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;

      const [opening] = await db.select()
        .from(jobOpenings)
        .where(eq(jobOpenings.id, req.params.id));

      if (!opening) {
        return res.status(404).json({ error: "Job opening not found" });
      }

      await db.delete(jobOpenings).where(eq(jobOpenings.id, req.params.id));

      await createAuditLog(
        "deleted",
        "job_opening",
        req.params.id,
        "Job opening deleted",
        currentUserId,
        "Deleted job opening",
        opening,
        null,
        req
      );

      res.json({ success: true, message: "Job opening deleted successfully" });
    } catch (error) {
      console.error("Error deleting job opening:", error);
      res.status(500).json({ error: "Failed to delete job opening" });
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

  // Job Application Routes - Accessible to admins, hiring managers, and watchers
  app.get("/api/hr/job-applications", requireAuth(), async (req, res) => {
    try {
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return; // Authentication failed

      const currentUserId = await normalizeUserIdForDb(rawUserId);
      
      // Check if user is admin - use proper auth function
      const isAdmin = await isCurrentUserAdmin(req);
      
      let applications;
      
      if (isAdmin) {
        // Admin sees all applications
        applications = await db.select().from(jobApplications).orderBy(desc(jobApplications.appliedAt));
      } else {
        // Non-admin users see:
        // 1. Applications for job openings where they are the hiring manager
        // 2. Applications where they are added as a watcher
        
        // Get applications where user is hiring manager
        const hiringManagerApps = await db.select({
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
        
        // Get applications where user is a watcher
        const watchedApps = await db.select({
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
        .innerJoin(jobApplicationWatchers, eq(jobApplications.id, jobApplicationWatchers.applicationId))
        .where(eq(jobApplicationWatchers.staffId, currentUserId))
        .orderBy(desc(jobApplications.appliedAt));
        
        // Merge and deduplicate applications
        const applicationMap = new Map();
        [...hiringManagerApps, ...watchedApps].forEach(app => {
          applicationMap.set(app.id, app);
        });
        applications = Array.from(applicationMap.values());
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

  // Delete a job application (admin only)
  app.delete('/api/hr/job-applications/:id', requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      // Check if user is admin
      const [user] = await db.select({
        role: roles.name
      })
      .from(staff)
      .leftJoin(roles, eq(staff.roleId, roles.id))
      .where(eq(staff.id, userId));

      if (!user || user.role !== 'Admin') {
        return res.status(403).json({ message: "Only admins can delete job applications" });
      }

      const { id } = req.params;

      // Delete related comments first
      await db.delete(jobApplicationComments).where(eq(jobApplicationComments.applicationId, id));

      // Delete related watchers
      await db.delete(jobApplicationWatchers).where(eq(jobApplicationWatchers.applicationId, id));

      // Delete the application
      const [deletedApplication] = await db
        .delete(jobApplications)
        .where(eq(jobApplications.id, id))
        .returning();

      if (!deletedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json({ message: "Application deleted successfully" });
    } catch (error) {
      console.error("Error deleting job application:", error);
      res.status(500).json({ message: "Failed to delete application" });
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

  // Get watchers for a job application
  app.get('/api/hr/job-applications/:id/watchers', requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      
      const watchers = await db
        .select({
          id: jobApplicationWatchers.id,
          staffId: jobApplicationWatchers.staffId,
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          profileImagePath: staff.profileImagePath,
          addedAt: jobApplicationWatchers.addedAt,
          addedBy: jobApplicationWatchers.addedBy
        })
        .from(jobApplicationWatchers)
        .innerJoin(staff, eq(jobApplicationWatchers.staffId, staff.id))
        .where(eq(jobApplicationWatchers.applicationId, id))
        .orderBy(asc(jobApplicationWatchers.addedAt));
      
      res.json(watchers);
    } catch (error) {
      console.error("Error fetching watchers:", error);
      res.status(500).json({ message: "Failed to fetch watchers" });
    }
  });

  // Add a watcher to a job application
  app.post('/api/hr/job-applications/:id/watchers', requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { staffId } = req.body;
      
      if (!staffId) {
        return res.status(400).json({ message: "Staff ID is required" });
      }
      
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!rawUserId) return;
      
      // Check if watcher already exists
      const existing = await db
        .select()
        .from(jobApplicationWatchers)
        .where(
          and(
            eq(jobApplicationWatchers.applicationId, id),
            eq(jobApplicationWatchers.staffId, staffId)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ message: "This staff member is already a watcher" });
      }
      
      // Add the watcher
      const [newWatcher] = await db
        .insert(jobApplicationWatchers)
        .values({
          applicationId: id,
          staffId: staffId,
          addedBy: currentUserId
        })
        .returning();
      
      // Get staff details for the response
      const [staffDetails] = await db
        .select({
          id: staff.id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          profileImagePath: staff.profileImagePath
        })
        .from(staff)
        .where(eq(staff.id, staffId));
      
      res.status(201).json({
        id: newWatcher.id,
        staffId: newWatcher.staffId,
        firstName: staffDetails.firstName,
        lastName: staffDetails.lastName,
        email: staffDetails.email,
        profileImagePath: staffDetails.profileImagePath,
        addedAt: newWatcher.addedAt,
        addedBy: newWatcher.addedBy
      });
    } catch (error) {
      console.error("Error adding watcher:", error);
      res.status(500).json({ message: "Failed to add watcher" });
    }
  });

  // Remove a watcher from a job application
  app.delete('/api/hr/job-applications/:id/watchers/:watcherId', requireAuth(), async (req, res) => {
    try {
      const { id, watcherId } = req.params;
      
      const deleted = await db
        .delete(jobApplicationWatchers)
        .where(
          and(
            eq(jobApplicationWatchers.id, watcherId),
            eq(jobApplicationWatchers.applicationId, id)
          )
        )
        .returning();
      
      if (!deleted.length) {
        return res.status(404).json({ message: "Watcher not found" });
      }
      
      res.json({ message: "Watcher removed successfully" });
    } catch (error) {
      console.error("Error removing watcher:", error);
      res.status(500).json({ message: "Failed to remove watcher" });
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
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;
      
      // Check if user is admin
      const userRoleResult = await db.execute(sql`
        SELECT r.name as role FROM staff s 
        JOIN roles r ON s.role_id = r.id 
        WHERE s.id = ${userId}
      `);
      const userRoleRows = Array.isArray(userRoleResult) ? userRoleResult : userRoleResult.rows;
      const userRoleData = userRoleRows && userRoleRows.length > 0 ? userRoleRows[0] : null;
      const isAdmin = userRoleData && userRoleData.role === 'Admin';
      
      // Get user's department for team-based permissions
      const userTeamResult = await db.execute(sql`
        SELECT department FROM staff WHERE id = ${userId}
      `);
      const userTeamRows = Array.isArray(userTeamResult) ? userTeamResult : userTeamResult.rows;
      const userDepartment = userTeamRows && userTeamRows.length > 0 ? userTeamRows[0].department : null;
      
      let categories;
      
      if (isAdmin) {
        // Admins see all visible categories
        categories = await db.execute(sql`
          SELECT 
            id,
            name,
            description,
            parent_id as "parentId",
            "order",
            icon,
            color,
            is_visible as "isVisible",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM knowledge_base_categories
          WHERE is_visible = true
          ORDER BY "order" ASC
        `);
      } else {
        // Non-admins see: categories with no permissions (public) OR categories they have access to
        categories = await db.execute(sql`
          SELECT DISTINCT
            c.id,
            c.name,
            c.description,
            c.parent_id as "parentId",
            c."order",
            c.icon,
            c.color,
            c.is_visible as "isVisible",
            c.created_at as "createdAt",
            c.updated_at as "updatedAt"
          FROM knowledge_base_categories c
          WHERE c.is_visible = true
            AND (
              -- Categories with NO permissions are public (accessible to all)
              NOT EXISTS (
                SELECT 1 FROM knowledge_base_permissions p 
                WHERE p.resource_type = 'category' AND p.resource_id = c.id
              )
              OR
              -- Categories where user has specific access
              EXISTS (
                SELECT 1 FROM knowledge_base_permissions p 
                WHERE p.resource_type = 'category' 
                  AND p.resource_id = c.id
                  AND (
                    (p.access_type = 'user' AND p.access_id = ${userId})
                    OR (p.access_type = 'team' AND p.access_id IN (
                      SELECT id::text FROM departments WHERE name = ${userDepartment}
                    ))
                  )
              )
            )
          ORDER BY c."order" ASC
        `);
      }

      const categoriesArray = Array.isArray(categories) ? categories : categories.rows;
      res.json(categoriesArray);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/knowledge-base/categories", requireAuth(), requirePermission('knowledge_base', 'canCreate'), async (req, res) => {
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

  app.put("/api/knowledge-base/categories/:id", requireAuth(), requirePermission('knowledge_base', 'canEdit'), async (req, res) => {
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

  app.delete("/api/knowledge-base/categories/:id", requireAuth(), requirePermission('knowledge_base', 'canDelete'), async (req, res) => {
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

  // Category Permissions API
  app.get("/api/knowledge-base/categories/:id/permissions", requireAuth(), requirePermission('knowledge_base', 'canEdit'), async (req, res) => {
    try {
      const categoryId = req.params.id;
      
      // Get all permissions for this category
      const permissionsResult = await db.execute(sql`
        SELECT 
          p.id,
          p.resource_type as "resourceType",
          p.resource_id as "resourceId",
          p.access_type as "accessType",
          p.access_id as "accessId",
          p.permission,
          p.created_at as "createdAt",
          CASE 
            WHEN p.access_type = 'user' THEN s.first_name || ' ' || s.last_name
            WHEN p.access_type = 'team' THEN d.name
            ELSE NULL
          END as "accessName"
        FROM knowledge_base_permissions p
        LEFT JOIN staff s ON p.access_type = 'user' AND p.access_id = s.id::text
        LEFT JOIN departments d ON p.access_type = 'team' AND p.access_id = d.id::text
        WHERE p.resource_type = 'category' 
          AND p.resource_id = ${categoryId}
        ORDER BY p.access_type, p.created_at
      `);
      
      const permissions = Array.isArray(permissionsResult) ? permissionsResult : permissionsResult.rows;
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching category permissions:', error);
      res.status(500).json({ message: "Failed to fetch category permissions" });
    }
  });

  app.put("/api/knowledge-base/categories/:id/permissions", requireAuth(), requirePermission('knowledge_base', 'canEdit'), async (req, res) => {
    try {
      const categoryId = req.params.id;
      const { permissions } = req.body;
      
      // Validate permissions array
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: "Permissions must be an array" });
      }
      
      // Delete existing permissions for this category
      await db.delete(knowledgeBasePermissions)
        .where(and(
          eq(knowledgeBasePermissions.resourceType, 'category'),
          eq(knowledgeBasePermissions.resourceId, categoryId)
        ));
      
      // Insert new permissions
      for (const perm of permissions) {
        if (perm.accessType && perm.accessId) {
          await db.insert(knowledgeBasePermissions).values({
            resourceType: 'category',
            resourceId: categoryId,
            accessType: perm.accessType,
            accessId: perm.accessId,
            permission: perm.permission || 'read'
          });
        }
      }
      
      res.json({ message: "Category permissions updated successfully" });
    } catch (error) {
      console.error('Error updating category permissions:', error);
      res.status(500).json({ message: "Failed to update category permissions" });
    }
  });


  // Reorder categories (admin only)
  app.put("/api/knowledge-base/categories/reorder", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { categoryOrders } = req.body; // Array of {id, order}
      
      if (!Array.isArray(categoryOrders)) {
        return res.status(400).json({ message: "categoryOrders must be an array" });
      }
      
      // Update each category's order
      for (const { id, order } of categoryOrders) {
        await db.update(knowledgeBaseCategories)
          .set({ order })
          .where(eq(knowledgeBaseCategories.id, id));
      }
      
      res.json({ message: "Category order updated successfully" });
    } catch (error) {
      console.error("Error reordering categories:", error);
      res.status(500).json({ message: "Failed to reorder categories" });
    }
  });

  // Reorder articles within a category (admin only)
  app.put("/api/knowledge-base/articles/reorder", requireAuth(), requireAdmin(), async (req, res) => {
    try {
      const { articleOrders } = req.body; // Array of {id, order}
      
      if (!Array.isArray(articleOrders)) {
        return res.status(400).json({ message: "articleOrders must be an array" });
      }
      
      // Update each article's order
      for (const { id, order } of articleOrders) {
        await db.update(knowledgeBaseArticles)
          .set({ order })
          .where(eq(knowledgeBaseArticles.id, id));
      }
      
      res.json({ message: "Article order updated successfully" });
    } catch (error) {
      console.error("Error reordering articles:", error);
      res.status(500).json({ message: "Failed to reorder articles" });
    }
  });
  // Helper function to check if user has access to an article
  async function canUserAccessArticle(userId: string, articleId: string, userRole: string): Promise<boolean> {
    try {
      // Get article info using raw SQL
      const articleResult = await db.execute(sql`
        SELECT is_public as "isPublic", created_by as "createdBy"
        FROM knowledge_base_articles 
        WHERE id = ${articleId}
      `);
      
      const articles = Array.isArray(articleResult) ? articleResult : articleResult.rows;
      const article = articles && articles.length > 0 ? articles[0] : null;
      
      if (!article) return false;
      
      // If article is public, everyone can access
      if (article.isPublic) return true;
      
      // ADMIN OVERRIDE: Admins can access ALL articles regardless of permissions
      const userRoleResult = await db.execute(sql`
        SELECT r.name as role FROM staff s 
        JOIN roles r ON s.role_id = r.id 
        WHERE s.id = ${userId}
      `);
      const userRoleRows = Array.isArray(userRoleResult) ? userRoleResult : userRoleResult.rows;
      const userRoleData = userRoleRows && userRoleRows.length > 0 ? userRoleRows[0] : null;
      
      if (userRoleData && userRoleData.role === 'Admin') return true;
      
      // If user is the author, they can access
      if (article.createdBy === userId) return true;
      
      // Get user's department (team) for team-based permissions
      const userTeamResult = await db.execute(sql`
        SELECT department FROM staff WHERE id = ${userId}
      `);
      const userTeamRows = Array.isArray(userTeamResult) ? userTeamResult : userTeamResult.rows;
      const userDepartment = userTeamRows && userTeamRows.length > 0 ? userTeamRows[0].department : null;
      
      // Check if user has specific permissions using raw SQL
      const permissionsResult = await db.execute(sql`
        SELECT * FROM knowledge_base_permissions
        WHERE resource_type = 'article' 
          AND resource_id = ${articleId}
          AND (
            (access_type = 'user' AND access_id = ${userId})
            OR (access_type = 'team' AND access_id IN (
              SELECT id FROM departments WHERE name = ${userDepartment}
            ))
          )
      `);
      
      const permissions = Array.isArray(permissionsResult) ? permissionsResult : permissionsResult.rows;
      return permissions && permissions.length > 0;
    } catch (error) {
      console.error('Error checking article access:', error);
      return false;
    }
  }

  // Articles API - Ultra simplified version to get articles back
  app.get("/api/knowledge-base/articles", requireAuth(), requirePermission('knowledge_base', 'canView'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;
      
      console.log('🔍 Debug: Starting articles query - ultra simplified');
      
      // Check if user is admin
      const userRoleResult = await db.execute(sql`
        SELECT r.name as role FROM staff s 
        JOIN roles r ON s.role_id = r.id 
        WHERE s.id = ${userId}
      `);
      const userRoleRows = Array.isArray(userRoleResult) ? userRoleResult : userRoleResult.rows;
      const userRoleData = userRoleRows && userRoleRows.length > 0 ? userRoleRows[0] : null;
      const isAdmin = userRoleData && userRoleData.role === 'Admin';
      
      console.log('🔍 Debug: User role data:', userRoleData);
      console.log('🔍 Debug: Is admin:', isAdmin);
      
      // If admin, get ALL articles. If not admin, get public articles + articles they have access to
      let articles;
      if (isAdmin) {
        articles = await db.execute(sql`
          SELECT 
            kba.id,
            kba.title,
            kba.excerpt,
            kba.slug,
            kba.category_id as "categoryId",
            kba.parent_id as "parentId",
            kba.featured_image as "featuredImage",
            kba.tags,
            kba.view_count as "viewCount",
            kba.like_count as "likeCount",
            kba.is_public as "isPublic",
            kba."order",
            kba.created_at as "createdAt",
            kba.updated_at as "updatedAt",
            kba.created_by as "authorId",
            COALESCE(s.first_name || ' ' || s.last_name, 'Unknown Author') as "authorName"
          FROM knowledge_base_articles kba
          LEFT JOIN staff s ON kba.created_by = s.id
          WHERE kba.status = 'published'
          ORDER BY kba.created_at DESC
        `);
      } else {
        articles = await db.execute(sql`
          SELECT 
            kba.id,
            kba.title,
            kba.excerpt,
            kba.slug,
            kba.category_id as "categoryId",
            kba.parent_id as "parentId",
            kba.featured_image as "featuredImage",
            kba.tags,
            kba.view_count as "viewCount",
            kba.like_count as "likeCount",
            kba.is_public as "isPublic",
            kba."order",
            kba.created_at as "createdAt",
            kba.updated_at as "updatedAt",
            kba.created_by as "authorId",
            COALESCE(s.first_name || ' ' || s.last_name, 'Unknown Author') as "authorName"
          FROM knowledge_base_articles kba
          LEFT JOIN staff s ON kba.created_by = s.id
          WHERE kba.status = 'published' AND kba.is_public = true
          ORDER BY kba.created_at DESC
        `);
      }
      
      
      // Extract just the articles array from the database result
      const articlesArray = Array.isArray(articles) ? articles : articles.rows;
      res.json(articlesArray);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/knowledge-base/articles/:id", requireAuth(), requirePermission('knowledge_base', 'canView'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return; // getAuthenticatedUserIdOrFail already sent 401 response
      
      // Get user role using raw SQL
      const userResult = await db.execute(sql`
        SELECT role_id as role FROM staff WHERE id = ${userId}
      `);
      const users = Array.isArray(userResult) ? userResult : userResult.rows;
      const currentUser = users && users.length > 0 ? users[0] : null;
      
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Check if user has access to this specific article (admin override is handled inside the function)
      const hasAccess = await canUserAccessArticle(userId, req.params.id, '');
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this article" });
      }
      
      const articleResult = await db.execute(sql`
        SELECT 
          kba.id,
          kba.title,
          kba.content,
          kba.excerpt,
          kba.category_id as "categoryId",
          kba.parent_id as "parentId",
          kba.slug,
          kba.status,
          kba.featured_image as "featuredImage",
          kba.tags,
          kba.view_count as "viewCount",
          kba.like_count as "likeCount",
          kba.is_public as "isPublic",
            kba."order",
          kba.created_at as "createdAt",
          kba.updated_at as "updatedAt",
          COALESCE(s.first_name || ' ' || s.last_name, 'Unknown Author') as "authorName",
          kba.created_by as "authorId",
          CASE WHEN kbb.id IS NOT NULL THEN true ELSE false END as "isBookmarked",
          CASE WHEN kbl.id IS NOT NULL THEN true ELSE false END as "isLiked"
        FROM knowledge_base_articles kba
        LEFT JOIN staff s ON kba.created_by = s.id
        LEFT JOIN knowledge_base_bookmarks kbb ON kbb.article_id = kba.id AND kbb.user_id = ${userId}
        LEFT JOIN knowledge_base_likes kbl ON kbl.article_id = kba.id AND kbl.user_id = ${userId}
        WHERE kba.id = ${req.params.id}
      `);
      
      const articles = Array.isArray(articleResult) ? articleResult : articleResult.rows;
      const article = articles && articles.length > 0 ? articles[0] : null;
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Track view if user is logged in
      if (userId) {
        try {
          await db.execute(sql`
            INSERT INTO knowledge_base_views (article_id, user_id, viewed_at)
            VALUES (${req.params.id}, ${userId}, NOW())
          `);
          
          // Increment view count
          await db.execute(sql`
            UPDATE knowledge_base_articles
            SET view_count = view_count + 1
            WHERE id = ${req.params.id}
          `);
        } catch (viewError) {
          // View tracking errors shouldn't block article display
          console.warn('View tracking error:', viewError);
        }
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
      // Set child articles' parentId to null (orphan them rather than delete)
      await db.update(knowledgeBaseArticles)
        .set({ parentId: null })
        .where(eq(knowledgeBaseArticles.parentId, req.params.id));
      
      // Delete related data first
      await db.delete(knowledgeBaseViews).where(eq(knowledgeBaseViews.articleId, req.params.id));
      await db.delete(knowledgeBaseLikes).where(eq(knowledgeBaseLikes.articleId, req.params.id));
      await db.delete(knowledgeBaseBookmarks).where(eq(knowledgeBaseBookmarks.articleId, req.params.id));
      await db.delete(knowledgeBaseComments).where(eq(knowledgeBaseComments.articleId, req.params.id));
      await db.delete(knowledgeBaseArticleVersions).where(eq(knowledgeBaseArticleVersions.articleId, req.params.id));
      
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
        authorName: sql<string>`COALESCE(${staff.firstName} || ' ' || ${staff.lastName}, 'Unknown Author')`,
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

  app.post("/api/knowledge-base/articles/:articleId/comments", requireAuth(), requirePermission('knowledge_base', 'canEdit'), async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Validate request body
      const commentSchema = z.object({
        content: z.string().min(1, "Comment content is required").trim(),
        parentId: z.string().optional(),
        mentions: z.array(z.string()).optional().default([])
      });
      
      const validationResult = commentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { content, parentId, mentions } = validationResult.data;
      
      const [newComment] = await db.insert(knowledgeBaseComments).values({
        articleId: req.params.articleId,
        content: content.trim(),
        parentId: parentId || null,
        mentions: mentions || [],
        authorId: userId,
      }).returning();

      // Send notifications to mentioned users
      if (mentions && mentions.length > 0) {
        for (const mentionedUserId of mentions) {
          // Skip self-mentions
          if (mentionedUserId === userId) continue;

          // Use NotificationService for multi-channel delivery
          void notificationService.notifyMentioned(
            mentionedUserId,              // Who to notify
            userId,                       // Who mentioned them (author ID)
            'knowledge_base_article',     // Context type
            req.params.articleId,         // Context ID
            content                       // Comment content
          ).catch(err => console.error('[Notification] Failed to send mention notification:', err));
        }
      }
      
      res.status(201).json(newComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Article Permissions Management Routes
  app.get("/api/knowledge-base/articles/:id/permissions", requireAuth(), requirePermission('knowledge_base', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      // Check if user can manage permissions for this article using raw SQL
      const articleResult = await db.execute(sql`
        SELECT is_public, created_by FROM knowledge_base_articles WHERE id = ${req.params.id}
      `);
      const articleRows = Array.isArray(articleResult) ? articleResult : articleResult.rows;
      const article = articleRows && articleRows.length > 0 ? articleRows[0] : null;

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Only article author, admins, or managers can manage permissions using raw SQL
      const userResult = await db.execute(sql`
        SELECT r.name as role FROM staff s 
        JOIN roles r ON s.role_id = r.id 
        WHERE s.id = ${userId}
      `);
      const userRows = Array.isArray(userResult) ? userResult : userResult.rows;
      const currentUser = userRows && userRows.length > 0 ? userRows[0] : null;

      if (!currentUser || (article.created_by !== userId && !['Admin', 'Manager'].includes(currentUser.role))) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get current permissions using raw SQL
      const permissionsResult = await db.execute(sql`
        SELECT id, access_type, access_id, permission 
        FROM knowledge_base_permissions
        WHERE resource_type = 'article' AND resource_id = ${req.params.id}
      `);
      const permissionsRaw = Array.isArray(permissionsResult) ? permissionsResult : permissionsResult.rows;

      // Convert snake_case to camelCase for frontend
      const permissions = permissionsRaw.map((p: any) => ({
        id: p.id,
        accessType: p.access_type,
        accessId: p.access_id,
        permission: p.permission
      }));

      res.json({
        isPublic: article.is_public,
        permissions: permissions
      });
    } catch (error) {
      console.error('Error fetching article permissions:', error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.put("/api/knowledge-base/articles/:id/permissions", requireAuth(), requirePermission('knowledge_base', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const { isPublic, permissions } = req.body;

      // Check if user can manage permissions for this article using raw SQL
      const articleResult = await db.execute(sql`
        SELECT is_public, created_by FROM knowledge_base_articles WHERE id = ${req.params.id}
      `);
      const articleRows = Array.isArray(articleResult) ? articleResult : articleResult.rows;
      const article = articleRows && articleRows.length > 0 ? articleRows[0] : null;

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Only article author, admins, or managers can manage permissions using raw SQL
      const userResult = await db.execute(sql`
        SELECT r.name as role FROM staff s 
        JOIN roles r ON s.role_id = r.id 
        WHERE s.id = ${userId}
      `);
      const userRows = Array.isArray(userResult) ? userResult : userResult.rows;
      const currentUser = userRows && userRows.length > 0 ? userRows[0] : null;

      if (!currentUser || (article.created_by !== userId && !['Admin', 'Manager'].includes(currentUser.role))) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update article visibility using raw SQL
      if (typeof isPublic === 'boolean') {
        await db.execute(sql`
          UPDATE knowledge_base_articles 
          SET is_public = ${isPublic}, updated_at = NOW() 
          WHERE id = ${req.params.id}
        `);
      }

      // Update permissions using Drizzle ORM
      // Always delete existing permissions first
      await db.delete(knowledgeBasePermissions)
        .where(and(
          eq(knowledgeBasePermissions.resourceType, 'article'),
          eq(knowledgeBasePermissions.resourceId, req.params.id)
        ));

      // Only insert new permissions if the article is NOT public
      if (!isPublic && permissions && Array.isArray(permissions) && permissions.length > 0) {
        // Filter out any invalid permissions (missing accessType or accessId)
        const validPermissions = permissions.filter(p => p.accessType && p.accessId);
        
        if (validPermissions.length > 0) {
          await db.insert(knowledgeBasePermissions).values(
            validPermissions.map(permission => ({
              resourceType: 'article' as const,
              resourceId: req.params.id,
              accessType: permission.accessType,
              accessId: permission.accessId,
              permission: permission.permission || 'read',
            }))
          );
        }
      }

      res.json({ message: "Permissions updated successfully" });
    } catch (error) {
      console.error('Error updating article permissions:', error);
      res.status(500).json({ message: "Failed to update permissions" });
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

  // =============================================================================
  // KNOWLEDGE BASE VERSION HISTORY
  // =============================================================================

  // Get version history for an article
  app.get("/api/knowledge-base/articles/:id/versions", requireAuth(), requirePermission('knowledge_base', 'canView'), async (req, res) => {
    try {
      const versions = await db.select()
        .from(knowledgeBaseArticleVersions)
        .where(eq(knowledgeBaseArticleVersions.articleId, req.params.id))
        .orderBy(desc(knowledgeBaseArticleVersions.version));
      
      res.json(versions);
    } catch (error) {
      console.error('Error fetching article versions:', error);
      res.status(500).json({ message: "Failed to fetch versions" });
    }
  });

  // Get a specific version
  app.get("/api/knowledge-base/articles/:id/versions/:versionId", requireAuth(), requirePermission('knowledge_base', 'canView'), async (req, res) => {
    try {
      const [version] = await db.select()
        .from(knowledgeBaseArticleVersions)
        .where(eq(knowledgeBaseArticleVersions.id, req.params.versionId));
      
      if (!version) {
        return res.status(404).json({ message: "Version not found" });
      }
      
      res.json(version);
    } catch (error) {
      console.error('Error fetching article version:', error);
      res.status(500).json({ message: "Failed to fetch version" });
    }
  });

  // Restore a specific version
  app.post("/api/knowledge-base/articles/:id/versions/:versionId/restore", requireAuth(), requirePermission('knowledge_base', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const [version] = await db.select()
        .from(knowledgeBaseArticleVersions)
        .where(eq(knowledgeBaseArticleVersions.id, req.params.versionId));
      
      if (!version) {
        return res.status(404).json({ message: "Version not found" });
      }
      
      // Get current article to save as a version before restoring
      const [currentArticle] = await db.select()
        .from(knowledgeBaseArticles)
        .where(eq(knowledgeBaseArticles.id, req.params.id));
      
      if (currentArticle) {
        // Get highest version number
        const [maxVersion] = await db.select({ max: sql`MAX(version)` })
          .from(knowledgeBaseArticleVersions)
          .where(eq(knowledgeBaseArticleVersions.articleId, req.params.id));
        
        const nextVersion = (maxVersion?.max as number || 0) + 1;
        
        // Save current state as a version before restoring
        await db.insert(knowledgeBaseArticleVersions).values({
          articleId: req.params.id,
          version: nextVersion,
          title: currentArticle.title,
          content: currentArticle.content,
          changeDescription: 'Auto-saved before restore',
          createdBy: userId,
        });
        
        // Restore the selected version
        await db.update(knowledgeBaseArticles)
          .set({
            title: version.title,
            content: version.content,
            updatedAt: new Date()
          })
          .where(eq(knowledgeBaseArticles.id, req.params.id));
      }
      
      res.json({ message: "Version restored successfully" });
    } catch (error) {
      console.error('Error restoring article version:', error);
      res.status(500).json({ message: "Failed to restore version" });
    }
  });

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
  
  app.get("/api/training/courses", requireAuth(), requirePermission('training', 'canView'), async (req, res) => {
    try {
      const { category, search, tags, difficulty, published } = req.query;
      const userId = getAuthenticatedUserId(req);
      
      // Get current user's department using raw SQL
      let userDepartmentId: string | null = null;
      if (userId) {
        const userResult = await db.execute(sql`SELECT department_id FROM staff WHERE id = ${userId} LIMIT 1`);
        userDepartmentId = (userResult.rows[0] as any)?.department_id || null;
      }
      
      // Fetch all courses with raw SQL to avoid Drizzle builder issues
      const coursesResult = await db.execute(sql`
        SELECT 
          tc.id,
          tc.title,
          tc.description,
          tc.short_description as "shortDescription",
          tc.category_id as "categoryId",
          tcat.name as "categoryName",
          tcat.color as "categoryColor",
          tc.tags,
          tc.thumbnail_url as "thumbnailUrl",
          tc.estimated_duration as "estimatedDuration",
          tc.difficulty,
          tc.is_published as "isPublished",
          tc."order",
          tc.created_by as "createdBy",
          tc.created_at as "createdAt",
          tc.updated_at as "updatedAt",
          COALESCE(CONCAT(s.first_name, ' ', s.last_name), 'Unknown') as "creatorName"
        FROM training_courses tc
        LEFT JOIN training_categories tcat ON tc.category_id = tcat.id
        LEFT JOIN staff s ON tc.created_by = s.id
        ORDER BY tc."order" ASC NULLS LAST, tc.created_at DESC
      `);
      
      let courses = coursesResult.rows as any[];
      console.log("[DEBUG] Training courses fetched:", courses.length, "courses");
      
      // Apply filters in memory
      if (category) {
        courses = courses.filter(c => c.categoryId === category);
      }
      if (published !== undefined) {
        courses = courses.filter(c => c.isPublished === (published === 'true'));
      }
      if (difficulty) {
        courses = courses.filter(c => c.difficulty === difficulty);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        courses = courses.filter(c => 
          c.title?.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
        );
      }
      
      // Check if user is admin - admins see all courses
      const userIsAdmin = await isCurrentUserAdmin(req);
      
      // Get all course permissions
      const permResult = await db.execute(sql`SELECT * FROM training_course_permissions`);
      const allPermissions = permResult.rows as any[];
      
      // Filter courses based on permissions (admins bypass this)
      // Note: raw SQL returns snake_case column names (course_id, access_type, access_id)
      const filteredCourses = userIsAdmin ? courses : courses.filter(course => {
        const coursePerms = allPermissions.filter(p => p.course_id === course.id);
        
        // If no permissions set, course is available to everyone
        if (coursePerms.length === 0) {
          return true;
        }
        
        // Check if user has direct access
        const hasUserAccess = coursePerms.some(p => 
          p.access_type === 'user' && p.access_id === userId
        );
        if (hasUserAccess) return true;
        
        // Check if user's department has access
        if (userDepartmentId) {
          const hasDeptAccess = coursePerms.some(p => 
            p.access_type === 'team' && p.access_id === userDepartmentId
          );
          if (hasDeptAccess) return true;
        }
        
        return false;
      });
      
      // Get lesson counts for each course
      const coursesWithCounts = await Promise.all(filteredCourses.map(async (course) => {
        const lessonCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM training_lessons WHERE course_id = ${course.id}`);
        const lessonCount = { count: Number(lessonCountResult.rows[0]?.count || 0) };
        
        const enrollCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM training_enrollments WHERE course_id = ${course.id}`);
        const enrollmentCount = { count: Number(enrollCountResult.rows[0]?.count || 0) };
        
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


  // ===== TRAINING COURSE PERMISSIONS =====
  
  // Get course permissions
  app.get("/api/training/courses/:id/permissions", requireAuth(), requirePermission('training', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      // Check if course exists
      const [course] = await db.select().from(trainingCourses).where(eq(trainingCourses.id, req.params.id));
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Get current permissions
      const permissionsResult = await db.execute(sql`
        SELECT id, course_id, access_type, access_id, created_at 
        FROM training_course_permissions
        WHERE course_id = ${req.params.id}
      `);
      const permissionsRaw = Array.isArray(permissionsResult) ? permissionsResult : permissionsResult.rows;

      // Convert snake_case to camelCase for frontend
      const permissions = (permissionsRaw || []).map((p: any) => ({
        id: p.id,
        courseId: p.course_id,
        accessType: p.access_type,
        accessId: p.access_id,
        createdAt: p.created_at
      }));

      // If no permissions, the course is available to everyone
      res.json({
        isRestricted: permissions.length > 0,
        permissions: permissions
      });
    } catch (error) {
      console.error('Error fetching course permissions:', error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // Update course permissions
  app.put("/api/training/courses/:id/permissions", requireAuth(), requirePermission('training', 'canEdit'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      const { isRestricted, permissions } = req.body;

      // Check if course exists
      const [course] = await db.select().from(trainingCourses).where(eq(trainingCourses.id, req.params.id));
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Delete existing permissions
      await db.delete(trainingCoursePermissions)
        .where(eq(trainingCoursePermissions.courseId, req.params.id));

      // Only insert new permissions if the course is restricted
      if (isRestricted && permissions && Array.isArray(permissions) && permissions.length > 0) {
        const validPermissions = permissions.filter((p: any) => p.accessType && p.accessId);
        
        if (validPermissions.length > 0) {
          await db.insert(trainingCoursePermissions).values(
            validPermissions.map((permission: any) => ({
              courseId: req.params.id,
              accessType: permission.accessType,
              accessId: permission.accessId,
            }))
          );
        }
      }

      // Fetch updated permissions
      const updatedPermissionsResult = await db.execute(sql`
        SELECT id, course_id, access_type, access_id, created_at 
        FROM training_course_permissions
        WHERE course_id = ${req.params.id}
      `);
      const updatedPermissionsRaw = Array.isArray(updatedPermissionsResult) ? updatedPermissionsResult : updatedPermissionsResult.rows;

      const updatedPermissions = (updatedPermissionsRaw || []).map((p: any) => ({
        id: p.id,
        courseId: p.course_id,
        accessType: p.access_type,
        accessId: p.access_id,
        createdAt: p.created_at
      }));

      res.json({
        isRestricted: updatedPermissions.length > 0,
        permissions: updatedPermissions
      });
    } catch (error) {
      console.error('Error updating course permissions:', error);
      res.status(500).json({ message: "Failed to update permissions" });
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

  // Get user's personal training analytics
  app.get("/api/training/my-analytics", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;
      
      // Get all enrollments
      const enrollments = await db.select().from(trainingEnrollments)
        .where(eq(trainingEnrollments.userId, userId));
      
      // Calculate overall stats
      const totalEnrollments = enrollments.length;
      const completedCourses = enrollments.filter(e => e.status === 'completed').length;
      const inProgressCourses = enrollments.filter(e => e.status === 'in_progress').length;
      const averageProgress = totalEnrollments > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / totalEnrollments)
        : 0;
      
      // Get detailed course progress - ensure all course metadata is populated
      const courseProgressRaw = await db.select({
        courseId: trainingCourses.id,
        courseTitle: trainingCourses.title,
        courseThumbnail: trainingCourses.thumbnailUrl,
        categoryName: trainingCategories.name,
        categoryColor: trainingCategories.color,
        difficulty: trainingCourses.difficulty,
        enrollmentStatus: trainingEnrollments.status,
        progress: trainingEnrollments.progress,
        completedLessons: trainingEnrollments.completedLessons,
        totalLessons: trainingEnrollments.totalLessons,
        enrolledAt: trainingEnrollments.enrolledAt,
        lastAccessedAt: trainingEnrollments.lastAccessedAt,
        completedAt: trainingEnrollments.completedAt,
        estimatedDuration: trainingCourses.estimatedDuration
      }).from(trainingEnrollments)
        .innerJoin(trainingCourses, eq(trainingEnrollments.courseId, trainingCourses.id))
        .leftJoin(trainingCategories, eq(trainingCourses.categoryId, trainingCategories.id))
        .where(eq(trainingEnrollments.userId, userId))
        .orderBy(desc(trainingEnrollments.lastAccessedAt));
      
      // Filter out any enrollments with null course data (orphaned enrollments)
      const courseProgress = courseProgressRaw.filter(course => course.courseId && course.courseTitle);
      
      // Get total time spent (sum of completed lessons video duration)
      const progressRecords = await db.select({
        lessonId: trainingProgress.lessonId,
        status: trainingProgress.status
      }).from(trainingProgress)
        .where(and(
          eq(trainingProgress.userId, userId),
          eq(trainingProgress.status, 'completed')
        ));
      
      const completedLessonIds = progressRecords.map(p => p.lessonId);
      
      let totalTimeSpentMinutes = 0;
      if (completedLessonIds.length > 0) {
        const lessonsData = await db.select({
          videoDuration: trainingLessons.videoDuration
        }).from(trainingLessons)
          .where(inArray(trainingLessons.id, completedLessonIds));
        
        totalTimeSpentMinutes = Math.round(
          lessonsData.reduce((sum, l) => sum + (l.videoDuration || 0), 0) / 60
        );
      }
      
      // Calculate total lessons completed across all courses
      const totalLessonsCompleted = enrollments.reduce((sum, e) => sum + (e.completedLessons || 0), 0);
      
      // Recent activity (last 7 days) - include both accessed and completed lessons
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentActivity = await db.select({
        lessonId: trainingProgress.lessonId,
        lessonTitle: trainingLessons.title,
        courseTitle: trainingCourses.title,
        completedAt: trainingProgress.completedAt,
        lastAccessedAt: trainingProgress.lastAccessedAt,
        status: trainingProgress.status
      }).from(trainingProgress)
        .leftJoin(trainingLessons, eq(trainingProgress.lessonId, trainingLessons.id))
        .leftJoin(trainingCourses, eq(trainingLessons.courseId, trainingCourses.id))
        .where(and(
          eq(trainingProgress.userId, userId),
          or(
            and(
              isNotNull(trainingProgress.lastAccessedAt),
              gte(trainingProgress.lastAccessedAt, sevenDaysAgo)
            ),
            and(
              isNotNull(trainingProgress.completedAt),
              gte(trainingProgress.completedAt, sevenDaysAgo)
            )
          )
        ))
        .orderBy(
          desc(sql`COALESCE(${trainingProgress.completedAt}, ${trainingProgress.lastAccessedAt})`)
        )
        .limit(10);
      
      // Serialize dates to ISO strings for frontend
      const serializedCourseProgress = courseProgress.map(course => ({
        ...course,
        enrolledAt: course.enrolledAt ? new Date(course.enrolledAt).toISOString() : null,
        lastAccessedAt: course.lastAccessedAt ? new Date(course.lastAccessedAt).toISOString() : null,
        completedAt: course.completedAt ? new Date(course.completedAt).toISOString() : null
      }));

      const serializedRecentActivity = recentActivity.map(activity => ({
        ...activity,
        completedAt: activity.completedAt ? new Date(activity.completedAt).toISOString() : null,
        lastAccessedAt: activity.lastAccessedAt ? new Date(activity.lastAccessedAt).toISOString() : null
      }));

      res.json({
        overview: {
          totalEnrollments,
          completedCourses,
          inProgressCourses,
          averageProgress,
          totalLessonsCompleted,
          totalTimeSpentMinutes
        },
        courseProgress: serializedCourseProgress,
        recentActivity: serializedRecentActivity
      });
    } catch (error) {
      console.error('Error fetching personal analytics:', error);
      res.status(500).json({ error: "Failed to fetch personal analytics" });
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
        createdBy: getAuthenticatedUserIdOrFail(req, res) || userId,
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
      
      // Fetch lessons with their modules
      const lessonsWithModules = await db.select({
        lesson: trainingLessons,
        moduleOrder: trainingModules.order
      })
        .from(trainingLessons)
        .leftJoin(trainingModules, eq(trainingLessons.moduleId, trainingModules.id))
        .where(eq(trainingLessons.courseId, courseId));
      
      // Sort by module order first (nulls last), then by lesson order
      const lessons = lessonsWithModules
        .sort((a, b) => {
          const aModuleOrder = a.moduleOrder ?? 999999;
          const bModuleOrder = b.moduleOrder ?? 999999;
          if (aModuleOrder !== bModuleOrder) {
            return aModuleOrder - bModuleOrder;
          }
          return a.lesson.order - b.lesson.order;
        })
        .map(item => item.lesson);
      
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
      let isCompleted = false;
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
            isCompleted = existingProgress.status === "completed";
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
      
      // Map database fields to frontend fields
      res.json({ 
        ...lesson, 
        isCompleted,
        duration: lesson.videoDuration ? Math.round(lesson.videoDuration / 60) : 0 // Convert seconds to minutes for frontend
      });
    } catch (error) {
      console.error('Error fetching lesson:', error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  // Create lesson (Admin/Manager only)
  app.post("/api/training/courses/:courseId/lessons", requireAuth(), requirePermission('training', 'canCreate'), async (req, res) => {
    try {
      const { courseId } = req.params;
      const { duration, ...lessonBody } = req.body;
      const newLesson = insertTrainingLessonSchema.parse({
        ...lessonBody,
        courseId,
        videoDuration: duration ? duration * 60 : null, // Convert minutes to seconds
        createdBy: getAuthenticatedUserIdOrFail(req, res) || userId,
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
      
      // Map frontend fields to database fields
      const { contentUrl, duration, ...otherData } = req.body;
      const updates = insertTrainingLessonSchema.partial().parse({
        ...otherData,
        videoUrl: contentUrl || null, // Map contentUrl to videoUrl
        videoDuration: duration ? duration * 60 : null, // Convert minutes to seconds
        updatedBy: req.session?.userId
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
  app.get("/api/training/analytics", requireAuth(), requireGranularPermission('training.view_analytics'), async (req, res) => {
    try {
      const { courseId, userId } = req.query;
      const rawUserId = getAuthenticatedUserIdOrFail(req, res);
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
          createdBy: getAuthenticatedUserIdOrFail(req, res) || userId,
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
        createdBy: getAuthenticatedUserIdOrFail(req, res) || userId,
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
        createdBy: getAuthenticatedUserIdOrFail(req, res) || userId,
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

  // Check capacity alerts and notify managers
  app.post("/api/capacity-alerts/check", requireAuth(), requirePermission('staff', 'canView'), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req, res);
      if (!userId) return;

      // Get capacity predictions
      const capacityPredictionsData = await calculateCapacityPredictions();
      const predictions = capacityPredictionsData.predictions;

      // Filter predictions that need alerts
      const alertPredictions = predictions.filter(p => p.needsHiring);

      if (alertPredictions.length === 0) {
        return res.json({
          success: true,
          alertsCreated: 0,
          message: "No capacity alerts needed at this time"
        });
      }

      // Get all managers and admins to notify
      const managerRoles = await db.select()
        .from(roles)
        .where(or(
          eq(roles.name, ROLE_NAMES.MANAGER),
          eq(roles.name, ROLE_NAMES.ADMIN)
        ));

      const managerRoleIds = managerRoles.map(r => r.id);

      // Get staff members with manager or admin roles
      const managers = await db.select({
        staffId: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        department: staff.department,
      })
        .from(staff)
        .innerJoin(userRoles, eq(staff.id, userRoles.userId))
        .where(
          and(
            inArray(userRoles.roleId, managerRoleIds),
            eq(staff.isActive, true)
          )
        )
        .groupBy(staff.id, staff.firstName, staff.lastName, staff.email, staff.department);

      let alertsCreated = 0;
      const results: any[] = [];

      // Create notifications for each alert
      for (const prediction of alertPredictions) {
        // Get the capacity setting for this prediction to check for custom recipients/message
        const [capacitySetting] = await db.select()
          .from(capacitySettings)
          .where(
            and(
              eq(capacitySettings.department, prediction.department),
              prediction.role ? eq(capacitySettings.role, prediction.role) : sql`${capacitySettings.role} IS NULL`
            )
          )
          .limit(1);

        // Determine who to notify
        let recipientsToNotify: typeof managers = [];
        
        if (capacitySetting?.notifyUserIds && capacitySetting.notifyUserIds.length > 0) {
          // Use custom notification recipients
          recipientsToNotify = await db.select({
            staffId: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            department: staff.department,
          })
            .from(staff)
            .where(
              and(
                inArray(staff.id, capacitySetting.notifyUserIds),
                eq(staff.isActive, true)
              )
            );
        } else {
          // Use default: all managers/admins filtered by department
          recipientsToNotify = managers.filter(m => 
            !m.department || m.department === prediction.department || m.department === ''
          );
        }

        // Prepare notification message with placeholder replacement
        const defaultMessage = `The ${prediction.department}${prediction.role ? ` (${prediction.role})` : ''} team is approaching capacity (${prediction.projectedCapacityPercent.toFixed(1)}% projected). Current: ${prediction.currentClients} clients, Predicted: ${prediction.predictedNewClients} new clients from pipeline. Consider hiring additional staff.`;
        
        let notificationMessage = capacitySetting?.notificationMessage || defaultMessage;
        
        // Replace placeholders in custom message
        if (capacitySetting?.notificationMessage) {
          notificationMessage = notificationMessage
            .replace(/{department}/g, prediction.department)
            .replace(/{role}/g, prediction.role || '')
            .replace(/{capacity_percentage}/g, prediction.projectedCapacityPercent.toFixed(1))
            .replace(/{current_clients}/g, prediction.currentClients.toString())
            .replace(/{predicted_clients}/g, prediction.predictedNewClients.toString())
            .replace(/{max_capacity}/g, prediction.maxCapacity.toString());
        }

        for (const recipient of recipientsToNotify) {
          try {
            await db.insert(notifications).values({
              userId: recipient.staffId,
              type: "capacity_alert",
              title: `Capacity Alert: ${prediction.department}${prediction.role ? ` (${prediction.role})` : ''}`,
              message: notificationMessage,
              isRead: false,
              entityType: "department",
              entityId: prediction.department,
              metadata: {
                department: prediction.department,
                role: prediction.role,
                currentCapacity: prediction.currentCapacityPercent,
                projectedCapacity: prediction.projectedCapacityPercent,
                alertThreshold: prediction.alertThreshold,
                leadsInPipeline: prediction.leadsInPipeline,
                predictedNewClients: prediction.predictedNewClients,
                daysUntilCapacity: prediction.daysUntilCapacity,
              }
            });

            alertsCreated++;
          } catch (error) {
            console.error(`Failed to create notification for ${recipient.email}:`, error);
          }
        }

        results.push({
          department: prediction.department,
          role: prediction.role,
          projectedCapacity: prediction.projectedCapacityPercent,
          managersNotified: recipientsToNotify.length
        });

        // Create audit log
        await createAuditLog(
          "created",
          "capacity_alert",
          prediction.department,
          `Capacity Alert for ${prediction.department}${prediction.role ? ` (${prediction.role})` : ''}`,
          userId,
          `Created capacity alert - ${prediction.projectedCapacityPercent.toFixed(1)}% projected capacity (threshold: ${prediction.alertThreshold}%)`,
          null,
          {
            currentCapacity: prediction.currentCapacityPercent,
            projectedCapacity: prediction.projectedCapacityPercent,
            recipientsNotified: recipientsToNotify.length,
            recipients: recipientsToNotify.map(r => `${r.firstName} ${r.lastName}`),
            customRecipientsUsed: !!(capacitySetting?.notifyUserIds && capacitySetting.notifyUserIds.length > 0),
            customMessageUsed: !!capacitySetting?.notificationMessage
          },
          req
        );
      }

      res.json({
        success: true,
        alertsCreated,
        results,
        message: `Created ${alertsCreated} capacity alert notifications for ${alertPredictions.length} departments`
      });

    } catch (error) {
      console.error("Error checking capacity alerts:", error);
      res.status(500).json({ 
        error: "Failed to check capacity alerts",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get capacity alert notification history
  app.get("/api/capacity-alerts/history", requireAuth(), requirePermission('staff', 'canView'), async (req, res) => {
    try {
      const capacityAlerts = await db.select()
        .from(notifications)
        .where(eq(notifications.type, "capacity_alert"))
        .orderBy(desc(notifications.createdAt))
        .limit(50);

      res.json(capacityAlerts);
    } catch (error) {
      console.error("Error fetching capacity alert history:", error);
      res.status(500).json({ error: "Failed to fetch capacity alert history" });
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

  // Get running time entries - SECURED to current user only
  app.get("/api/time-entries/running", requireAuth(), async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserIdOrFail(req, res);
      if (!authenticatedUserId) return;
      
      // Search all tasks for a running time entry that belongs to the current user
      const allTasks = await appStorage.getTasks();
      
      for (const task of allTasks) {
        if (task.timeEntries && Array.isArray(task.timeEntries)) {
          // Find running entry for the CURRENT USER only
          const runningEntry = task.timeEntries.find((entry: any) => 
            entry.isRunning && entry.userId === authenticatedUserId
          );
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
      
      res.json(null); // No running timer found for this user
    } catch (error) {
      console.error("Error checking for running timer:", error);
      res.status(500).json({ error: "Failed to check for running timer" });
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

  // ========================================
  // CLIENT PORTAL AUTHENTICATION ROUTES
  // ========================================

  // Validation schema for client portal login
  const clientPortalLoginSchema = z.object({
    email: z.string().email().transform((email) => email.toLowerCase()),
    password: z.string().min(1, "Password is required")
  });

  // Client portal login
  app.post("/api/client-portal/login", async (req, res) => {
    const clientIp = req.ip || req.connection?.remoteAddress || "unknown";
    
    console.log("🔐 Client Portal Login Attempt:", { body: req.body, ip: clientIp });
    
    try {
      // SECURITY: Check rate limiting first
      if (isRateLimited(clientIp)) {
        console.warn(`SECURITY: Rate-limited client portal login attempt from IP: ${clientIp}`);
        await createAuditLog(
          "created",
          "client_portal_login_security",
          "rate-limit-block",
          "Rate Limited Client Portal Login Attempt",
          "system",
          `Rate-limited client portal login attempt from IP: ${clientIp}`,
          null,
          { ip: clientIp, userAgent: req.get("User-Agent") || "Unknown" },
          req
        );
        return res.status(429).json({
          error: "Too many login attempts",
          message: "Please wait before trying again"
        });
      }

      // Input validation
      const validatedData = clientPortalLoginSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({
          error: "Invalid input",
          message: "Please provide valid email and password",
          details: validatedData.error.errors
        });
      }

      const { email, password } = validatedData.data;

      // Find client portal user by email
      const [clientPortalUser] = await db
        .select({
          id: clientPortalUsers.id,
          email: clientPortalUsers.email,
          passwordHash: clientPortalUsers.passwordHash,
          firstName: clientPortalUsers.firstName,
          lastName: clientPortalUsers.lastName,
          clientId: clientPortalUsers.clientId,
          isActive: clientPortalUsers.isActive
        })
        .from(clientPortalUsers)
        .where(eq(clientPortalUsers.email, email))
        .limit(1);

      if (!clientPortalUser || !clientPortalUser.isActive) {
        // SECURITY: Record failed login attempt
        recordLoginAttempt(clientIp, false);
        
        // Log failed login attempt
        try {
          await createAuditLog(
            "created",
            "client_portal_login_attempt",
            "failed",
            `Failed login attempt for ${email}`,
            "system",
            `Client portal login failed - invalid credentials for email: ${email}`,
            null,
            { email, success: false, reason: "invalid_credentials" },
            req
          );
        } catch (auditError) {
          console.error("Failed to create audit log for failed client portal login:", auditError);
        }
        
        return res.status(401).json({
          error: "Invalid credentials",
          message: "Invalid email or password"
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, clientPortalUser.passwordHash);
      if (!isValidPassword) {
        // SECURITY: Record failed login attempt
        recordLoginAttempt(clientIp, false);
        
        // Log failed login attempt
        try {
          await createAuditLog(
            "created",
            "client_portal_login_attempt",
            "failed",
            `Failed login attempt for ${email}`,
            "system",
            `Client portal login failed - invalid password for email: ${email}`,
            null,
            { email, success: false, reason: "invalid_password" },
            req
          );
        } catch (auditError) {
          console.error("Failed to create audit log for failed client portal login:", auditError);
        }
        
        return res.status(401).json({
          error: "Invalid credentials",
          message: "Invalid email or password"
        });
      }

      // Get client name for session
      const [client] = await db
        .select({
          name: clients.name
        })
        .from(clients)
        .where(eq(clients.id, clientPortalUser.clientId))
        .limit(1);

      // Regenerate session to prevent session fixation attacks
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Clear main user session to prevent role confusion
      req.session.userId = undefined;
      req.session.user = undefined;

      // Create client portal session
      req.session.clientPortalUserId = clientPortalUser.id;
      req.session.clientPortalUser = {
        id: clientPortalUser.id,
        email: clientPortalUser.email,
        name: `${clientPortalUser.firstName} ${clientPortalUser.lastName}`,
        clientId: clientPortalUser.clientId,
        clientName: client?.name || "Unknown Client"
      };

      // Update last login time
      await db
        .update(clientPortalUsers)
        .set({
          lastLogin: new Date(),
          lastActivity: new Date()
        })
        .where(eq(clientPortalUsers.id, clientPortalUser.id));

      // SECURITY: Record successful login and clear rate limiting
      recordLoginAttempt(clientIp, true);

      // Log successful login attempt
      try {
        await createAuditLog(
          "created",
          "client_portal_login_attempt",
          "success",
          `Successful client portal login for ${email}`,
          "system",
          `Client portal login successful for email: ${email}, client: ${client?.name || "Unknown"}`,
          null,
          { 
            email, 
            success: true, 
            clientId: clientPortalUser.clientId,
            clientName: client?.name || "Unknown Client"
          },
          req
        );
      } catch (auditError) {
        console.error("Failed to create audit log for successful client portal login:", auditError);
      }

      // Emit client_portal_activity trigger for login
      try {
        await emitTrigger('client_portal_activity', {
          activityType: 'login',
          clientId: clientPortalUser.clientId,
          clientName: client?.name || "Unknown Client",
          clientEmail: clientPortalUser.email,
          portalUserId: clientPortalUser.id,
          portalUserName: `${clientPortalUser.firstName} ${clientPortalUser.lastName}`,
          timestamp: new Date(),
        });
      } catch (triggerError) {
        console.error('Failed to emit client_portal_activity trigger:', triggerError);
        // Don't fail the login if trigger fails
      }

      res.json({
        success: true,
        user: {
          id: clientPortalUser.id,
          email: clientPortalUser.email,
          name: `${clientPortalUser.firstName} ${clientPortalUser.lastName}`,
          clientId: clientPortalUser.clientId,
          clientName: client?.name || "Unknown Client"
        }
      });

    } catch (error) {
      // SECURITY: Record failed login attempt for system errors
      recordLoginAttempt(clientIp, false);
      
      console.error("Client portal login error:", error);
      res.status(500).json({
        error: "Login failed",
        message: "An error occurred during login"
      });
    }
  });

  // Client portal logout
  app.post("/api/client-portal/logout", requireClientPortalAuth(), async (req, res) => {
    try {
      const clientPortalUserId = getAuthenticatedClientPortalUserIdOrFail(req, res);
      if (!clientPortalUserId) return;

      // Update last activity
      await db
        .update(clientPortalUsers)
        .set({
          lastActivity: new Date()
        })
        .where(eq(clientPortalUsers.id, clientPortalUserId));

      // Destroy client portal session and regenerate session for security
      req.session.clientPortalUserId = undefined;
      req.session.clientPortalUser = undefined;

      // Regenerate session for proper session hygiene
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({
        success: true,
        message: "Logged out successfully"
      });

    } catch (error) {
      console.error("Client portal logout error:", error);
      res.status(500).json({
        error: "Logout failed",
        message: "An error occurred during logout"
      });
    }
  });

  // Get current client portal user
  app.get("/api/client-portal/me", requireClientPortalAuth(), async (req, res) => {
    try {
      const clientPortalUserId = getAuthenticatedClientPortalUserIdOrFail(req, res);
      if (!clientPortalUserId) return;

      // Get current user details
      const [clientPortalUser] = await db
        .select({
          id: clientPortalUsers.id,
          email: clientPortalUsers.email,
          firstName: clientPortalUsers.firstName,
          lastName: clientPortalUsers.lastName,
          clientId: clientPortalUsers.clientId,
          lastLogin: clientPortalUsers.lastLogin,
          lastActivity: clientPortalUsers.lastActivity
        })
        .from(clientPortalUsers)
        .where(eq(clientPortalUsers.id, clientPortalUserId))
        .limit(1);

      if (!clientPortalUser) {
        return res.status(404).json({
          error: "User not found",
          message: "Client portal user not found"
        });
      }

      // Get client name
      const [client] = await db
        .select({
          name: clients.name,
          profileImage: clients.profileImage
        })
        .from(clients)
        .where(eq(clients.id, clientPortalUser.clientId))
        .limit(1);

      // Update last activity
      await db
        .update(clientPortalUsers)
        .set({
          lastActivity: new Date()
        })
        .where(eq(clientPortalUsers.id, clientPortalUserId));

      res.json({
        success: true,
        user: {
          id: clientPortalUser.id,
          email: clientPortalUser.email,
          name: `${clientPortalUser.firstName} ${clientPortalUser.lastName}`,
          clientId: clientPortalUser.clientId,
          clientName: client?.name || "Unknown Client",
          clientLogo: client?.profileImage || null,
          lastLogin: clientPortalUser.lastLogin,
          lastActivity: clientPortalUser.lastActivity
        }
      });

    } catch (error) {
      console.error("Get client portal user error:", error);
      res.status(500).json({
        error: "Failed to get user information",
        message: "An error occurred while retrieving user information"
      });
    }
  });

  // Get client portal tasks
  app.get("/api/client-portal/tasks", requireClientPortalAuth(), async (req, res) => {
    try {
      const clientPortalUserId = getAuthenticatedClientPortalUserIdOrFail(req, res);
      if (!clientPortalUserId) return;

      // Get the client portal user's client ID
      const [clientPortalUser] = await db
        .select({
          clientId: clientPortalUsers.clientId
        })
        .from(clientPortalUsers)
        .where(eq(clientPortalUsers.id, clientPortalUserId))
        .limit(1);

      if (!clientPortalUser) {
        return res.status(404).json({
          error: "User not found",
          message: "Client portal user not found"
        });
      }

      // Parse query parameters for filtering
      const {
        status,
        priority,
        projectId,
        dateFrom,
        dateTo,
        dueDateFrom,
        dueDateTo,
        limit = "100",
        offset = "0"
      } = req.query;

      // Build filter conditions
      const filterConditions = [
        eq(tasks.clientId, clientPortalUser.clientId),
        eq(tasks.visibleToClient, true)
      ];

      // Filter by status (comma-separated list)
      if (status && typeof status === 'string') {
        const statusList = status.split(',').filter(s => s.trim());
        if (statusList.length > 0) {
          filterConditions.push(inArray(tasks.status, statusList as any));
        }
      }

      // Filter by priority (comma-separated list)
      if (priority && typeof priority === 'string') {
        const priorityList = priority.split(',').filter(p => p.trim());
        if (priorityList.length > 0) {
          filterConditions.push(inArray(tasks.priority, priorityList as any));
        }
      }

      // Filter by project
      if (projectId && typeof projectId === 'string') {
        filterConditions.push(eq(tasks.projectId, parseInt(projectId)));
      }

      // Filter by created date range
      if (dateFrom && typeof dateFrom === 'string') {
        filterConditions.push(gte(tasks.createdAt, new Date(dateFrom)));
      }
      if (dateTo && typeof dateTo === 'string') {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // End of day
        filterConditions.push(lte(tasks.createdAt, endDate));
      }

      // Filter by due date range
      if (dueDateFrom && typeof dueDateFrom === 'string') {
        filterConditions.push(
          and(
            isNotNull(tasks.dueDate),
            gte(tasks.dueDate, new Date(dueDateFrom))
          )
        );
      }
      if (dueDateTo && typeof dueDateTo === 'string') {
        const endDate = new Date(dueDateTo);
        endDate.setHours(23, 59, 59, 999); // End of day
        filterConditions.push(
          and(
            isNotNull(tasks.dueDate),
            lte(tasks.dueDate, endDate)
          )
        );
      }

      // Get tasks that are visible to client and belong to this client
      const clientTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          dueDate: tasks.dueDate,
          completedAt: tasks.completedAt,
          createdAt: tasks.createdAt,
          projectName: projects.name,
          assigneeName: staff.name
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .leftJoin(staff, eq(tasks.assigneeId, staff.id))
        .where(and(...filterConditions))
        .orderBy(desc(tasks.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Get total count for pagination (using same filter conditions, no limit/offset)
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .leftJoin(staff, eq(tasks.assigneeId, staff.id))
        .where(and(...filterConditions));

      const totalCount = totalCountResult[0]?.count || 0;

      res.json({
        tasks: clientTasks,
        total: totalCount,
        page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
        pageSize: parseInt(limit as string),
        totalPages: Math.ceil(totalCount / parseInt(limit as string))
      });

    } catch (error) {
      console.error("Get client portal tasks error:", error);
      res.status(500).json({
        error: "Failed to get tasks",
        message: "An error occurred while retrieving tasks"
      });
    }
  });

  // Client Approval Operations - SECURED FOR CLIENT PORTAL
  const clientApprovalSchema = z.object({
    notes: z.string().optional().transform(val => val?.trim() || null)
  });

  const clientRequestChangesSchema = z.object({
    notes: z.string().min(1, "Notes are required when requesting changes").transform(val => val.trim())
  });

  app.put("/api/client-portal/tasks/:id/approve", requireClientPortalAuth(), async (req, res) => {
    try {
      const clientPortalUserId = getAuthenticatedClientPortalUserIdOrFail(req, res);
      if (!clientPortalUserId) return;

      const taskId = req.params.id;
      const validation = clientApprovalSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validation.error.errors
        });
      }

      const { notes } = validation.data;

      // Get client portal user's client ID
      const [clientPortalUser] = await db
        .select({ clientId: clientPortalUsers.clientId, firstName: clientPortalUsers.firstName, lastName: clientPortalUsers.lastName })
        .from(clientPortalUsers)
        .where(eq(clientPortalUsers.id, clientPortalUserId))
        .limit(1);

      if (!clientPortalUser) {
        return res.status(404).json({ message: "Client portal user not found" });
      }

      // Get task to verify ownership and approval requirements
      const [task] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Verify ownership - task must belong to the client
      if (task.clientId !== clientPortalUser.clientId) {
        return res.status(403).json({ message: "Access denied - task does not belong to your organization" });
      }

      // Verify task requires client approval
      if (!task.requiresClientApproval) {
        return res.status(400).json({ message: "This task does not require client approval" });
      }

      // Verify task is in pending approval state
      if (task.clientApprovalStatus !== 'pending') {
        return res.status(400).json({ message: `Task approval status is already '${task.clientApprovalStatus}'` });
      }

      // Update task approval status
      const [updatedTask] = await db.update(tasks)
        .set({
          clientApprovalStatus: 'approved',
          clientApprovalNotes: notes,
          clientApprovalDate: new Date()
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Log the approval activity
      await logTaskActivity(
        taskId, 
        'client_approval', 
        'clientApprovalStatus', 
        'pending', 
        'approved',
        clientPortalUserId,
        `${clientPortalUser.firstName} ${clientPortalUser.lastName}`
      );

      res.json(updatedTask);
    } catch (error) {
      console.error("Error approving task:", error);
      res.status(500).json({ message: "Failed to approve task" });
    }
  });

  app.put("/api/client-portal/tasks/:id/request-changes", requireClientPortalAuth(), async (req, res) => {
    try {
      const clientPortalUserId = getAuthenticatedClientPortalUserIdOrFail(req, res);
      if (!clientPortalUserId) return;

      const taskId = req.params.id;
      const validation = clientRequestChangesSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validation.error.errors
        });
      }

      const { notes } = validation.data;

      // Get client portal user's client ID
      const [clientPortalUser] = await db
        .select({ clientId: clientPortalUsers.clientId, firstName: clientPortalUsers.firstName, lastName: clientPortalUsers.lastName })
        .from(clientPortalUsers)
        .where(eq(clientPortalUsers.id, clientPortalUserId))
        .limit(1);

      if (!clientPortalUser) {
        return res.status(404).json({ message: "Client portal user not found" });
      }

      // Get task to verify ownership and approval requirements
      const [task] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Verify ownership - task must belong to the client
      if (task.clientId !== clientPortalUser.clientId) {
        return res.status(403).json({ message: "Access denied - task does not belong to your organization" });
      }

      // Verify task requires client approval
      if (!task.requiresClientApproval) {
        return res.status(400).json({ message: "This task does not require client approval" });
      }

      // Verify task is in pending approval state
      if (task.clientApprovalStatus !== 'pending') {
        return res.status(400).json({ message: `Task approval status is already '${task.clientApprovalStatus}'` });
      }

      // Update task approval status
      const [updatedTask] = await db.update(tasks)
        .set({
          clientApprovalStatus: 'changes_requested',
          clientApprovalNotes: notes,
          clientApprovalDate: new Date()
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Log the changes request activity
      await logTaskActivity(
        taskId, 
        'client_changes_requested', 
        'clientApprovalStatus', 
        'pending', 
        'changes_requested',
        clientPortalUserId,
        `${clientPortalUser.firstName} ${clientPortalUser.lastName}`
      );

      res.json(updatedTask);
    } catch (error) {
      console.error("Error requesting task changes:", error);
      res.status(500).json({ message: "Failed to request task changes" });
    }
  });

  // Client Portal Task Attachments - SECURED FOR CLIENT PORTAL
  app.get("/api/client-portal/tasks/:taskId/attachments", requireClientPortalAuth(), async (req, res) => {
    try {
      const clientPortalUserId = getAuthenticatedClientPortalUserIdOrFail(req, res);
      if (!clientPortalUserId) return;

      const { taskId } = req.params;

      // Get client portal user's client ID
      const [clientPortalUser] = await db
        .select({ clientId: clientPortalUsers.clientId })
        .from(clientPortalUsers)
        .where(eq(clientPortalUsers.id, clientPortalUserId))
        .limit(1);

      if (!clientPortalUser) {
        return res.status(404).json({ message: "Client portal user not found" });
      }

      // Get task to verify ownership
      const [task] = await db
        .select({ clientId: tasks.clientId, visibleToClient: tasks.visibleToClient })
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Verify ownership - task must belong to the client
      if (task.clientId !== clientPortalUser.clientId) {
        return res.status(403).json({ message: "Access denied - task does not belong to your organization" });
      }

      // Verify task is visible to client
      if (!task.visibleToClient) {
        return res.status(403).json({ message: "Access denied - task is not visible to clients" });
      }

      // Get attachments for the task
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
          uploaderName: staff.firstName
        })
        .from(taskAttachments)
        .leftJoin(staff, eq(taskAttachments.uploadedBy, staff.id))
        .where(eq(taskAttachments.taskId, taskId))
        .orderBy(desc(taskAttachments.createdAt));

      console.log(`Returning attachments with URLs:`, attachments.map(a => ({
        fileName: a.fileName,
        fileUrl: a.fileUrl
      })));

      res.json(attachments);
    } catch (error) {
      console.error("Error fetching task attachments for client portal:", error);
      res.status(500).json({ message: "Failed to fetch task attachments" });
    }
  });

  // ==== CLIENT PORTAL USER MANAGEMENT ENDPOINTS ====
  
  // Get all client portal users (for admin management)
  app.get("/api/client-portal-users", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const portalUsers = await db
        .select({
          id: clientPortalUsers.id,
          email: clientPortalUsers.email,
          firstName: clientPortalUsers.firstName,
          lastName: clientPortalUsers.lastName,
          clientId: clientPortalUsers.clientId,
          clientName: clients.name,
          isActive: clientPortalUsers.isActive,
          lastLogin: clientPortalUsers.lastLogin,
          createdAt: clientPortalUsers.createdAt
        })
        .from(clientPortalUsers)
        .leftJoin(clients, eq(clientPortalUsers.clientId, clients.id))
        .orderBy(desc(clientPortalUsers.createdAt));

      res.json(portalUsers);
    } catch (error) {
      console.error("Error fetching client portal users:", error);
      res.status(500).json({ message: "Failed to fetch client portal users" });
    }
  });

  // Get client portal users for a specific client
  app.get("/api/clients/:clientId/portal-users", requireAuth(), requirePermission('clients', 'canView'), async (req, res) => {
    try {
      const { clientId } = req.params;

      const portalUsers = await db
        .select({
          id: clientPortalUsers.id,
          email: clientPortalUsers.email,
          firstName: clientPortalUsers.firstName,
          lastName: clientPortalUsers.lastName,
          isActive: clientPortalUsers.isActive,
          lastLogin: clientPortalUsers.lastLogin,
          createdAt: clientPortalUsers.createdAt
        })
        .from(clientPortalUsers)
        .where(eq(clientPortalUsers.clientId, clientId))
        .orderBy(desc(clientPortalUsers.createdAt));

      res.json(portalUsers);
    } catch (error) {
      console.error("Error fetching client portal users:", error);
      res.status(500).json({ message: "Failed to fetch client portal users" });
    }
  });

  // Create new client portal user
  app.post("/api/client-portal-users", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    try {
      const createPortalUserSchema = z.object({
        clientId: z.string().min(1, "Client ID is required"),
        email: z.string().email("Valid email is required"),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        password: z.string().min(6, "Password must be at least 6 characters")
      });

      const validation = createPortalUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validation.error.errors
        });
      }

      const { clientId, email, firstName, lastName, password } = validation.data;

      // Check if client exists
      const client = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      if (!client.length) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check if email already exists
      const existingUser = await db
        .select()
        .from(clientPortalUsers)
        .where(eq(clientPortalUsers.email, email))
        .limit(1);

      if (existingUser.length) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create new portal user
      const [newUser] = await db
        .insert(clientPortalUsers)
        .values({
          id: randomUUID(),
          clientId,
          email,
          firstName,
          lastName,
          passwordHash,
          isActive: true
        })
        .returning({
          id: clientPortalUsers.id,
          email: clientPortalUsers.email,
          firstName: clientPortalUsers.firstName,
          lastName: clientPortalUsers.lastName,
          clientId: clientPortalUsers.clientId,
          isActive: clientPortalUsers.isActive,
          createdAt: clientPortalUsers.createdAt
        });

      // Log the creation
      await createAuditLog(
        "created",
        "client_portal_user",
        newUser.id,
        `${firstName} ${lastName}`,
        req.user?.id || "system",
        `Created portal user for client ${client[0].name}`,
        {},
        {
          clientId,
          email,
          firstName,
          lastName,
          isActive: true
        },
        req
      );

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating client portal user:", error);
      res.status(500).json({ message: "Failed to create client portal user" });
    }
  });

  // Update client portal user
  app.put("/api/client-portal-users/:id", requireAuth(), requirePermission('clients', 'canEdit'), async (req, res) => {
    try {
      const { id } = req.params;
      
      const updatePortalUserSchema = z.object({
        firstName: z.string().min(1, "First name is required").optional(),
        lastName: z.string().min(1, "Last name is required").optional(),
        email: z.string().email("Valid email is required").optional(),
        isActive: z.boolean().optional(),
        password: z.string().min(6, "Password must be at least 6 characters").optional()
      });

      const validation = updatePortalUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validation.error.errors
        });
      }

      const updateData = validation.data;

      // Check if user exists
      const existingUser = await db
        .select()
        .from(clientPortalUsers)
        .where(eq(clientPortalUsers.id, id))
        .limit(1);

      if (!existingUser.length) {
        return res.status(404).json({ message: "Client portal user not found" });
      }

      // If updating email, check for conflicts
      if (updateData.email) {
        const emailConflict = await db
          .select()
          .from(clientPortalUsers)
          .where(and(
            eq(clientPortalUsers.email, updateData.email),
            sql`${clientPortalUsers.id} != ${id}`
          ))
          .limit(1);

        if (emailConflict.length) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 12);
      }

      // Update user
      const updateValues = {
        ...updateData,
        ...(updateData.password && { passwordHash: updateData.password })
      };

      // Remove password from updateValues as we use passwordHash
      if ('password' in updateValues) {
        delete (updateValues as any).password;
      }

      const [updatedUser] = await db
        .update(clientPortalUsers)
        .set(updateValues)
        .where(eq(clientPortalUsers.id, id))
        .returning({
          id: clientPortalUsers.id,
          email: clientPortalUsers.email,
          firstName: clientPortalUsers.firstName,
          lastName: clientPortalUsers.lastName,
          clientId: clientPortalUsers.clientId,
          isActive: clientPortalUsers.isActive,
          updatedAt: clientPortalUsers.updatedAt
        });

      // Log the update
      await createAuditLog(
        "updated",
        "client_portal_user",
        id,
        `${updatedUser.firstName} ${updatedUser.lastName}`,
        req.user?.id || "system",
        `Updated portal user`,
        existingUser[0],
        updateData,
        req
      );

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating client portal user:", error);
      res.status(500).json({ message: "Failed to update client portal user" });
    }
  });

  // Delete/deactivate client portal user
  app.delete("/api/client-portal-users/:id", requireAuth(), requirePermission('clients', 'canDelete'), async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await db
        .select()
        .from(clientPortalUsers)
        .where(eq(clientPortalUsers.id, id))
        .limit(1);

      if (!existingUser.length) {
        return res.status(404).json({ message: "Client portal user not found" });
      }

      // Soft delete by setting isActive to false
      const [updatedUser] = await db
        .update(clientPortalUsers)
        .set({ 
          isActive: false
        })
        .where(eq(clientPortalUsers.id, id))
        .returning({
          id: clientPortalUsers.id,
          isActive: clientPortalUsers.isActive
        });

      // Log the deletion
      await createAuditLog(
        "deleted",
        "client_portal_user",
        id,
        `${existingUser[0].firstName} ${existingUser[0].lastName}`,
        req.user?.id || "system",
        `Deactivated portal user via admin panel`,
        { isActive: true },
        { isActive: false },
        req
      );

      res.json({ message: "Client portal user deactivated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error deleting client portal user:", error);
      res.status(500).json({ message: "Failed to deactivate client portal user" });
    }
  });

  // ============================================
  // QUOTES API ROUTES
  // ============================================

  // GET /api/quotes - Fetch all quotes
  app.get("/api/quotes", requireAuth(), async (req, res) => {
    try {
      const quotesWithDetails = await db
        .select({
          id: quotes.id,
          name: quotes.name,
          clientBudget: quotes.clientBudget,
          desiredMargin: quotes.desiredMargin,
          totalCost: quotes.totalCost,
          status: quotes.status,
          notes: quotes.notes,
          createdBy: quotes.createdBy,
          approvedBy: quotes.approvedBy,
          approvedAt: quotes.approvedAt,
          createdAt: quotes.createdAt,
          updatedAt: quotes.updatedAt,
          clientId: quotes.clientId,
          leadId: quotes.leadId,
          // Join client data
          clientName: clients.name,
          clientCompany: clients.company,
          // Join lead data  
          leadName: leads.name,
          leadCompany: leads.company,
          // Join staff data
          createdByName: staff.firstName,
          createdByLastName: staff.lastName,
        })
        .from(quotes)
        .leftJoin(clients, eq(quotes.clientId, clients.id))
        .leftJoin(leads, eq(quotes.leadId, leads.id))
        .leftJoin(staff, eq(quotes.createdBy, staff.id))
        .orderBy(desc(quotes.createdAt));

      res.json(quotesWithDetails);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  // POST /api/quotes - Create new quote with items
  app.post("/api/quotes", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserIdOrFail(req);
      
      // Validate the quote data (ignore client-provided status)
      const validatedData = insertQuoteSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      // Server-side enforcement of minimum margin rule
      const desiredMargin = parseFloat(validatedData.desiredMargin);
      const effectiveStatus = desiredMargin < SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD ? "pending_approval" : "draft";
      
      // Use transaction to ensure atomic quote+items creation
      const result = await db.transaction(async (tx) => {
        // Calculate total cost from quote items using DATABASE prices (not client values)
        let calculatedTotalCost = 0;
        const processedItems: any[] = [];
        
        if (req.body.items && Array.isArray(req.body.items)) {
          for (const item of req.body.items) {
            let unitCost = 0;
            const quantity = parseInt(item.quantity) || 1;
            
            if (item.itemType === 'product' && item.productId) {
              // Get actual product cost from database
              const [product] = await tx
                .select({ cost: products.cost })
                .from(products)
                .where(eq(products.id, item.productId))
                .limit(1);
              
              if (!product) {
                throw new Error(`Product with ID ${item.productId} not found`);
              }
              
              unitCost = parseFloat(product.cost || '0');
            } else if (item.itemType === 'bundle' && item.bundleId) {
              // Verify bundle exists
              const [bundle] = await tx
                .select({ 
                  id: productBundles.id,
                  name: productBundles.name
                })
                .from(productBundles)
                .where(eq(productBundles.id, item.bundleId))
                .limit(1);
              
              if (!bundle) {
                throw new Error(`Bundle with ID ${item.bundleId} not found`);
              }
              
              // Calculate bundle cost from constituent products (each product = 1 unit)
              const bundleProductsList = await tx
                .select({
                  productCost: products.cost,
                })
                .from(bundleProducts)
                .leftJoin(products, eq(bundleProducts.productId, products.id))
                .where(eq(bundleProducts.bundleId, item.bundleId));
              
              const bundleCost = bundleProductsList.reduce((sum, bp) => {
                const cost = parseFloat(bp.productCost || '0');
                return sum + cost; // Each product is 1 unit by default
              }, 0);
              
              unitCost = bundleCost;
            } else {
              // Reject unknown item types
              throw new Error(`Invalid item type: ${item.itemType}. Must be 'product' or 'bundle'`);
            }
            
            const itemTotalCost = unitCost * quantity;
            calculatedTotalCost += itemTotalCost;
            
            processedItems.push({
              productId: item.productId || null,
              bundleId: item.bundleId || null,
              itemType: item.itemType,
              quantity,
              unitCost: unitCost.toString(),
              totalCost: itemTotalCost.toString(),
              notes: item.notes || null,
            });
          }
        }

        // Override status and totalCost based on server calculations
        const finalQuoteData = {
          ...validatedData,
          status: effectiveStatus,
          totalCost: calculatedTotalCost.toString(),
        };

        // Create the quote
        const [newQuote] = await tx
          .insert(quotes)
          .values(finalQuoteData)
          .returning();

        // Create quote items with server-calculated costs
        if (processedItems.length > 0) {
          const quoteItemsData = processedItems.map((item: any) => ({
            ...item,
            quoteId: newQuote.id,
          }));
          
          // Validate each item
          const validatedItems = quoteItemsData.map(item => 
            insertQuoteItemSchema.parse(item)
          );
          
          await tx.insert(quoteItems).values(validatedItems);
        }

        return { newQuote, processedItems };
      });

      const { newQuote } = result;

      // Log the creation
      await createAuditLog(
        "created",
        "quote",
        newQuote.id,
        newQuote.name || "New Quote",
        userId,
        `Created quote with status: ${newQuote.status}`,
        null,
        validatedData,
        req
      );

      // Create notifications for Sales Managers if approval required
      if (newQuote.status === "pending_approval") {
        // Get all Sales Managers
        const salesManagers = await db
          .select({
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
          })
          .from(staff)
          .innerJoin(roles, eq(staff.roleId, roles.id))
          .where(eq(roles.name, ROLE_NAMES.SALES_MANAGER));

        // Create notifications for each Sales Manager
        const notificationPromises = salesManagers.map(manager => 
          db.insert(notifications).values({
            userId: manager.id,
            type: "quote_approval_required",
            title: "Quote Approval Required",
            message: `Quote "${newQuote.name}" with ${desiredMargin}% margin requires your approval.`,
            metadata: JSON.stringify({ 
              quoteId: newQuote.id, 
              desiredMargin: desiredMargin,
              clientBudget: newQuote.clientBudget 
            }),
            isRead: false,
          })
        );

        await Promise.all(notificationPromises);
      }

      // Emit quote_created trigger
      try {
        await emitTrigger('quote_created', {
          quoteId: newQuote.id,
          quoteName: newQuote.name,
          clientId: newQuote.clientId,
          leadId: newQuote.leadId,
          totalCost: newQuote.totalCost,
          clientBudget: newQuote.clientBudget,
          desiredMargin: newQuote.desiredMargin,
          status: newQuote.status,
          createdBy: newQuote.createdBy,
          createdAt: newQuote.createdAt,
        });
      } catch (triggerError) {
        console.error('Failed to emit quote_created trigger:', triggerError);
        // Don't fail the quote creation if trigger fails
      }

      res.status(201).json(newQuote);
    } catch (error) {
      console.error("=== DETAILED QUOTE ERROR ===");
      console.error("Error creating quote:", error);
      console.error("Request body:", JSON.stringify(req.body, null, 2));
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      console.error("=== END QUOTE ERROR ===");
      res.status(500).json({ message: "Failed to create quote" });
    }
  });

  // GET /api/quotes/:id - Get specific quote with items
  app.get("/api/quotes/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;

      // Get quote details
      const [quote] = await db
        .select({
          id: quotes.id,
          name: quotes.name,
          clientBudget: quotes.clientBudget,
          desiredMargin: quotes.desiredMargin,
          totalCost: quotes.totalCost,
          status: quotes.status,
          notes: quotes.notes,
          createdBy: quotes.createdBy,
          approvedBy: quotes.approvedBy,
          approvedAt: quotes.approvedAt,
          createdAt: quotes.createdAt,
          updatedAt: quotes.updatedAt,
          clientId: quotes.clientId,
          leadId: quotes.leadId,
          // Join client data
          clientName: clients.name,
          clientCompany: clients.company,
          // Join lead data  
          leadName: leads.name,
          leadCompany: leads.company,
        })
        .from(quotes)
        .leftJoin(clients, eq(quotes.clientId, clients.id))
        .leftJoin(leads, eq(quotes.leadId, leads.id))
        .where(eq(quotes.id, id))
        .limit(1);

      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Get quote items
      const items = await db
        .select({
          id: quoteItems.id,
          productId: quoteItems.productId,
          bundleId: quoteItems.bundleId,
          itemType: quoteItems.itemType,
          quantity: quoteItems.quantity,
          unitCost: quoteItems.unitCost,
          totalCost: quoteItems.totalCost,
          notes: quoteItems.notes,
          // Join product data
          productName: products.name,
          productDescription: products.description,
          // Join bundle data
          bundleName: productBundles.name,
          bundleDescription: productBundles.description,
        })
        .from(quoteItems)
        .leftJoin(products, eq(quoteItems.productId, products.id))
        .leftJoin(productBundles, eq(quoteItems.bundleId, productBundles.id))
        .where(eq(quoteItems.quoteId, id));

      res.json({ ...quote, items });
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  // POST /api/quotes/:id/track-view - Track quote view and emit trigger
  app.post("/api/quotes/:id/track-view", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;

      // Get quote details
      const [quote] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, id))
        .limit(1);

      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Increment view count
      const [updatedQuote] = await db
        .update(quotes)
        .set({
          viewCount: sql`${quotes.viewCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, id))
        .returning();

      // Emit quote_viewed trigger
      try {
        await emitTrigger('quote_viewed', {
          quoteId: updatedQuote.id,
          quoteName: updatedQuote.name,
          clientId: updatedQuote.clientId,
          leadId: updatedQuote.leadId,
          totalCost: updatedQuote.totalCost,
          clientBudget: updatedQuote.clientBudget,
          desiredMargin: updatedQuote.desiredMargin,
          status: updatedQuote.status,
          viewCount: updatedQuote.viewCount,
          viewedAt: new Date(),
        });
      } catch (triggerError) {
        console.error('Failed to emit quote_viewed trigger:', triggerError);
        // Don't fail the view tracking if trigger fails
      }

      res.json({
        message: "Quote view tracked successfully",
        viewCount: updatedQuote.viewCount
      });
    } catch (error) {
      console.error("Error tracking quote view:", error);
      res.status(500).json({ message: "Failed to track quote view" });
    }
  });

  // PUT /api/quotes/:id - Update existing quote
  app.put("/api/quotes/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req);
      
      // Get existing quote to preserve createdBy and check authorization
      const [existingQuote] = await db
        .select({
          id: quotes.id,
          name: quotes.name,
          clientId: quotes.clientId,
          leadId: quotes.leadId,
          clientBudget: quotes.clientBudget,
          desiredMargin: quotes.desiredMargin,
          totalCost: quotes.totalCost,
          status: quotes.status,
          notes: quotes.notes,
          createdBy: quotes.createdBy,
          createdAt: quotes.createdAt,
          updatedAt: quotes.updatedAt,
          approvedBy: quotes.approvedBy,
          approvedAt: quotes.approvedAt,
        })
        .from(quotes)
        .where(eq(quotes.id, id))
        .limit(1);

      if (!existingQuote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Authorization: Check if user has permission to edit quotes OR owns the quote
      const userHasPermission = await hasPermission(userId, "sales", "canEdit");
      const isOwner = existingQuote.createdBy === userId;
      
      if (!userHasPermission && !isOwner) {
        return res.status(403).json({ 
          message: "You do not have permission to edit this quote" 
        });
      }

      // Validate the update payload
      const validatedQuote = insertQuoteSchema.omit({ 
        createdBy: true, 
        createdAt: true 
      }).parse({
        name: req.body.name,
        clientId: req.body.clientId || null,
        leadId: req.body.leadId || null,
        clientBudget: req.body.clientBudget,
        desiredMargin: req.body.desiredMargin,
        notes: req.body.notes || null,
      });

      // Validate desiredMargin and calculate status
      const desiredMargin = parseFloat(validatedQuote.desiredMargin);
      if (isNaN(desiredMargin) || desiredMargin < 0 || desiredMargin > 100) {
        return res.status(400).json({ message: "Invalid desired margin. Must be between 0 and 100." });
      }

      // Server-side enforcement of minimum margin rule
      const effectiveStatus = desiredMargin < SALES_CONFIG.MINIMUM_MARGIN_THRESHOLD ? "pending_approval" : "draft";
      
      // Validate items array structure
      const rawItems = req.body.items || [];
      if (!Array.isArray(rawItems)) {
        return res.status(400).json({ message: "Items must be an array" });
      }

      // Use transaction for atomic update with proper validation
      const result = await db.transaction(async (tx) => {
        // Validate and calculate costs inside transaction
        let calculatedTotalCost = 0;
        const processedItems: any[] = [];

        for (const item of rawItems) {
          // Validate item structure
          if (!item.itemType || !['product', 'bundle'].includes(item.itemType)) {
            throw new Error("Invalid item type. Must be 'product' or 'bundle'");
          }

          if (item.itemType === 'product' && !item.productId) {
            throw new Error("Product ID is required for product items");
          }
          
          if (item.itemType === 'bundle' && !item.bundleId) {
            throw new Error("Bundle ID is required for bundle items");
          }

          const quantity = Math.max(1, parseInt(item.quantity || '1'));
          let unitCost = 0;

          if (item.itemType === 'product' && item.productId) {
            const [product] = await tx
              .select({ cost: products.cost })
              .from(products)
              .where(eq(products.id, item.productId))
              .limit(1);
            
            if (!product) {
              throw new Error(`Product with ID ${item.productId} not found`);
            }
            
            unitCost = parseFloat(product.cost || '0');
          } else if (item.itemType === 'bundle' && item.bundleId) {
            // Verify bundle exists
            const [bundle] = await tx
              .select({ 
                id: productBundles.id,
                name: productBundles.name
              })
              .from(productBundles)
              .where(eq(productBundles.id, item.bundleId))
              .limit(1);
            
            if (!bundle) {
              throw new Error(`Bundle with ID ${item.bundleId} not found`);
            }
            
            // Calculate bundle cost from constituent products (each product = 1 unit)
            const bundleProductsList = await tx
              .select({
                productCost: products.cost,
              })
              .from(bundleProducts)
              .leftJoin(products, eq(bundleProducts.productId, products.id))
              .where(eq(bundleProducts.bundleId, item.bundleId));
            
            const bundleCost = bundleProductsList.reduce((sum, bp) => {
              const cost = parseFloat(bp.productCost || '0');
              return sum + cost; // Each product is 1 unit by default
            }, 0);
            
            unitCost = bundleCost;
          }

          const itemTotalCost = unitCost * quantity;
          calculatedTotalCost += itemTotalCost;

          processedItems.push({
            quoteId: id,
            productId: item.productId || null,
            bundleId: item.bundleId || null,
            itemType: item.itemType,
            quantity,
            unitCost: unitCost.toString(),
            totalCost: itemTotalCost.toString(),
            notes: item.notes || null,
          });
        }

        // Prepare update data, preserving createdBy
        const updateData = {
          name: validatedQuote.name,
          clientId: validatedQuote.clientId,
          leadId: validatedQuote.leadId,
          clientBudget: validatedQuote.clientBudget,
          desiredMargin: desiredMargin.toString(),
          totalCost: calculatedTotalCost.toString(),
          status: effectiveStatus,
          notes: validatedQuote.notes,
          updatedAt: new Date(),
          // Preserve createdBy from existing quote
          createdBy: existingQuote.createdBy,
        };

        // Update the quote
        await tx
          .update(quotes)
          .set(updateData)
          .where(eq(quotes.id, id));

        // Delete existing quote items
        await tx.delete(quoteItems).where(eq(quoteItems.quoteId, id));

        // Insert new quote items
        if (processedItems.length > 0) {
          await tx.insert(quoteItems).values(processedItems);
        }

        // Return update data (quote was already updated in transaction)
        return { updateData };
      });

      // Log the update (outside transaction for non-critical logging)
      await createAuditLog(
        "updated",
        "quote",
        id,
        result.updateData.name || "Quote",
        userId,
        `Updated quote with status: ${result.updateData.status}`,
        null,
        result.updateData,
        req
      );

      // Reselect the updated quote from DB to get accurate values
      const [updatedQuote] = await db
        .select({
          id: quotes.id,
          name: quotes.name,
          clientId: quotes.clientId,
          leadId: quotes.leadId,
          clientBudget: quotes.clientBudget,
          desiredMargin: quotes.desiredMargin,
          totalCost: quotes.totalCost,
          status: quotes.status,
          notes: quotes.notes,
          createdBy: quotes.createdBy,
          createdAt: quotes.createdAt,
          updatedAt: quotes.updatedAt,
          approvedBy: quotes.approvedBy,
          approvedAt: quotes.approvedAt,
        })
        .from(quotes)
        .where(eq(quotes.id, id))
        .limit(1);

      res.json(updatedQuote);
    } catch (error) {
      console.error("Error updating quote:", error);
      
      // Handle validation errors with 400
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        // Check for validation errors
        if (errorMessage.includes("not found") || 
            errorMessage.includes("Invalid") || 
            errorMessage.includes("required")) {
          return res.status(400).json({ message: errorMessage });
        }
      }
      
      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error 
        });
      }
      
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  // PUT /api/quotes/:id/approval - Approve or reject quote (Sales Manager or Admin only)
  app.put("/api/quotes/:id/approval", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { action, rejectionReason } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req);

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'reject'" });
      }

      // Verify user has Sales Manager role or is Admin
      const isAdmin = await isCurrentUserAdmin(req);
      const userRole = await db
        .select({
          roleName: roles.name,
        })
        .from(staff)
        .innerJoin(roles, eq(staff.roleId, roles.id))
        .where(and(eq(staff.id, userId), eq(roles.name, ROLE_NAMES.SALES_MANAGER)))
        .limit(1);

      if (!isAdmin && userRole.length === 0) {
        return res.status(403).json({ message: "Only Sales Managers or Admins can approve or reject quotes" });
      }

      // Check if quote exists and is pending approval
      const [quote] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, id))
        .limit(1);

      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      if (quote.status !== "pending_approval") {
        return res.status(400).json({ message: "Quote is not pending approval" });
      }

      // Update quote status
      const [updatedQuote] = await db
        .update(quotes)
        .set({
          status: action === "approve" ? "approved" : "rejected",
          approvedBy: userId,
          approvedAt: new Date(),
          notes: action === "reject" && rejectionReason 
            ? (quote.notes ? `${quote.notes}\n\nRejection reason: ${rejectionReason}` : `Rejection reason: ${rejectionReason}`)
            : quote.notes,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, id))
        .returning();

      // Log the approval/rejection
      await createAuditLog(
        "updated",
        "quote",
        id,
        quote.name || "Quote",
        userId,
        `${action === "approve" ? "Approved" : "Rejected"} quote${rejectionReason ? ` with reason: ${rejectionReason}` : ""}`,
        { status: quote.status },
        { status: updatedQuote.status },
        req
      );

      res.json({
        message: `Quote ${action === "approve" ? "approved" : "rejected"} successfully`,
        quote: updatedQuote
      });
    } catch (error) {
      console.error("Error processing quote approval:", error);
      res.status(500).json({ message: "Failed to process quote approval" });
    }
  });

  // PATCH /api/quotes/:id/status - Update quote status
  app.patch("/api/quotes/:id/status", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = getAuthenticatedUserIdOrFail(req);

      // Define valid status transitions
      const validTransitions: Record<string, string[]> = {
        "draft": ["draft", "sent"], // Can stay draft or move to sent
        "pending_approval": ["pending_approval"], // Can only stay pending (changed by approval endpoint)
        "approved": ["approved", "sent"], // Can stay approved or move to sent
        "sent": ["sent", "accepted"], // Can stay sent or move to accepted
        "accepted": ["accepted"], // Final state
        "rejected": ["rejected"], // Final state
      };

      // Check if quote exists
      const [quote] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, id))
        .limit(1);

      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Validate status transition
      const allowedNextStatuses = validTransitions[quote.status] || [];
      if (!allowedNextStatuses.includes(status)) {
        return res.status(400).json({ 
          message: `Invalid status transition from ${quote.status} to ${status}`,
          allowedStatuses: allowedNextStatuses
        });
      }

      // Update quote status
      const [updatedQuote] = await db
        .update(quotes)
        .set({
          status: status,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, id))
        .returning();

      // Auto-transfer products/bundles to client when quote is accepted
      if (status === "accepted" && quote.clientId) {
        try {
          // Fetch all quote items
          const items = await db
            .select()
            .from(quoteItems)
            .where(eq(quoteItems.quoteId, id));

          let transferredCount = 0;

          // Transfer each item to the client
          for (const item of items) {
            if (item.itemType === 'product' && item.productId) {
              // Check if product already assigned to client
              const existing = await db
                .select()
                .from(clientProducts)
                .where(
                  and(
                    eq(clientProducts.clientId, quote.clientId),
                    eq(clientProducts.productId, item.productId)
                  )
                )
                .limit(1);

              if (existing.length === 0) {
                // Add product to client
                await db
                  .insert(clientProducts)
                  .values({
                    clientId: quote.clientId,
                    productId: item.productId,
                    price: item.unitCost.toString(),
                    status: "active"
                  });
                transferredCount++;
              }
            } else if (item.itemType === 'bundle' && item.bundleId) {
              // Check if bundle already assigned to client
              const existing = await db
                .select()
                .from(clientBundles)
                .where(
                  and(
                    eq(clientBundles.clientId, quote.clientId),
                    eq(clientBundles.bundleId, item.bundleId)
                  )
                )
                .limit(1);

              if (existing.length === 0) {
                // Add bundle to client with custom quantities
                await db
                  .insert(clientBundles)
                  .values({
                    clientId: quote.clientId,
                    bundleId: item.bundleId,
                    price: item.unitCost.toString(),
                    status: "active",
                    customQuantities: item.customQuantities
                  });
                transferredCount++;
              }
            }
          }

          // Log product transfer if any were transferred
          if (transferredCount > 0) {
            await createAuditLog(
              "created",
              "client_products",
              quote.clientId,
              `Client Products from Quote ${quote.name}`,
              userId,
              `Automatically transferred ${transferredCount} products/bundles from accepted quote to client`,
              null,
              { quoteId: id, itemsTransferred: transferredCount },
              req
            );
          }
        } catch (transferError) {
          console.error("Error transferring quote items to client:", transferError);
          // Don't fail the status update if product transfer fails
          // The status was already updated successfully
        }
      }

      // Log the status change
      await createAuditLog(
        "updated",
        "quote",
        id,
        quote.name || "Quote",
        userId,
        `Changed quote status from ${quote.status} to ${status}`,
        { status: quote.status },
        { status: updatedQuote.status },
        req
      );

      // Emit quote_sent trigger when status changes to "sent"
      if (status === "sent") {
        try {
          await emitTrigger('quote_sent', {
            quoteId: updatedQuote.id,
            quoteName: updatedQuote.name,
            clientId: updatedQuote.clientId,
            leadId: updatedQuote.leadId,
            totalCost: updatedQuote.totalCost,
            clientBudget: updatedQuote.clientBudget,
            desiredMargin: updatedQuote.desiredMargin,
            status: updatedQuote.status,
            sentBy: userId,
            sentAt: updatedQuote.updatedAt,
          });
        } catch (triggerError) {
          console.error('Failed to emit quote_sent trigger:', triggerError);
          // Don't fail the status update if trigger fails
        }
      }

      // Emit quote_accepted trigger when status changes to "accepted"
      if (status === "accepted") {
        try {
          await emitTrigger('quote_accepted', {
            quoteId: updatedQuote.id,
            quoteName: updatedQuote.name,
            clientId: updatedQuote.clientId,
            leadId: updatedQuote.leadId,
            totalCost: updatedQuote.totalCost,
            clientBudget: updatedQuote.clientBudget,
            desiredMargin: updatedQuote.desiredMargin,
            status: updatedQuote.status,
            acceptedAt: updatedQuote.updatedAt,
          });
        } catch (triggerError) {
          console.error('Failed to emit quote_accepted trigger:', triggerError);
          // Don't fail the status update if trigger fails
        }
      }

      res.json({
        message: "Quote status updated successfully",
        quote: updatedQuote
      });
    } catch (error) {
      console.error("Error updating quote status:", error);
      res.status(500).json({ message: "Failed to update quote status" });
    }
  });

  // DELETE /api/quotes/:id - Delete a quote
  app.delete("/api/quotes/:id", requireAuth(), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserIdOrFail(req);

      // Check if quote exists
      const [quote] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, id))
        .limit(1);

      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Delete quote items first (due to foreign key constraint)
      await db
        .delete(quoteItems)
        .where(eq(quoteItems.quoteId, id));

      // Delete the quote
      await db
        .delete(quotes)
        .where(eq(quotes.id, id));

      // Log the deletion
      await createAuditLog(
        "deleted",
        "quote",
        id,
        quote.name || "Quote",
        userId,
        `Deleted quote`,
        null,
        null,
        req
      );

      res.json({
        message: "Quote deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ message: "Failed to delete quote" });
    }
  });

  // GET /api/sales/reports/pipeline - Pipeline Report with lead counts and conversion rates
  app.get("/api/sales/reports/pipeline", requireAuth(), async (req, res) => {
    try {
      const { startDate, endDate, salesRepId, sourceId } = req.query;
      
      // Build filters
      const filters = [];
      if (startDate && endDate) {
        filters.push(
          gte(leads.createdAt, new Date(startDate as string)),
          lte(leads.createdAt, new Date(new Date(endDate as string).getTime() + 24 * 60 * 60 * 1000 - 1))
        );
      }
      if (salesRepId && salesRepId !== 'all') {
        filters.push(eq(leads.assignedTo, salesRepId as string));
      }
      if (sourceId && sourceId !== 'all') {
        filters.push(eq(leads.source, sourceId as string));
      }
      const dateFilter = filters.length > 0 ? and(...filters) : undefined;

      // Get all active pipeline stages
      const stages = await db
        .select()
        .from(leadPipelineStages)
        .where(eq(leadPipelineStages.isActive, true))
        .orderBy(asc(leadPipelineStages.order));

      // Get lead counts by stage
      const leadCounts = await db
        .select({
          stageId: leads.stageId,
          count: sql<number>`count(*)::int`,
          totalValue: sql<string>`COALESCE(sum(${leads.value}), 0)::text`
        })
        .from(leads)
        .where(dateFilter)
        .groupBy(leads.stageId);

      // Create stage map with counts
      const stageMap = new Map(leadCounts.map(lc => [lc.stageId, lc]));

      // Get stage transitions for conversion rates
      // Build transition filters
      const transitionFilters = [];
      if (startDate && endDate) {
        transitionFilters.push(
          gte(leadStageTransitions.transitionedAt, new Date(startDate as string)),
          lte(leadStageTransitions.transitionedAt, new Date(endDate as string))
        );
      }
      if (salesRepId && salesRepId !== 'all') {
      }
      if (sourceId && sourceId !== 'all') {
        filters.push(eq(leads.source, sourceId as string));
        transitionFilters.push(eq(leads.assignedTo, salesRepId as string));
      }

      const transitions = await db
        .select({
          fromStageId: leadStageTransitions.fromStageId,
          toStageId: leadStageTransitions.toStageId,
          count: sql<number>`count(*)::int`
        })
        .from(leadStageTransitions)
        .innerJoin(leads, eq(leadStageTransitions.leadId, leads.id))
        .where(transitionFilters.length > 0 ? and(...transitionFilters) : undefined)
        .groupBy(leadStageTransitions.fromStageId, leadStageTransitions.toStageId);

      // Build report with stage data and conversion rates
      const stageData = stages.map(stage => {
        const counts = stageMap.get(stage.id) || { count: 0, totalValue: '0' };
        
        // Find transitions from this stage
        const outgoingTransitions = transitions.filter(t => t.fromStageId === stage.id);
        const totalTransitions = outgoingTransitions.reduce((sum, t) => sum + t.count, 0);
        
        // Calculate conversion rates correctly:
        // Rate = (transitions to next stage / total leads that were in this stage) * 100
        // Total leads in stage = current count + all transitions out
        const totalLeadsInStage = counts.count + totalTransitions;
        
        return {
          id: stage.id,
          name: stage.name,
          color: stage.color,
          order: stage.order,
          leadCount: counts.count,
          totalValue: parseFloat(counts.totalValue),
          conversions: outgoingTransitions.map(t => ({
            toStageId: t.toStageId,
            toStageName: stages.find(s => s.id === t.toStageId)?.name || 'Unknown',
            count: t.count,
            rate: totalLeadsInStage > 0 ? (t.count / totalLeadsInStage) * 100 : 0
          }))
        };
      });

      // Calculate overall pipeline metrics
      const totalLeads = leadCounts.reduce((sum, lc) => sum + lc.count, 0);
      const totalValue = leadCounts.reduce((sum, lc) => sum + parseFloat(lc.totalValue), 0);
      const totalTransitions = transitions.reduce((sum, t) => sum + t.count, 0);

      res.json({
        stages: stageData,
        summary: {
          totalLeads,
          totalValue,
          totalTransitions,
          averageValue: totalLeads > 0 ? totalValue / totalLeads : 0
        }
      });
    } catch (error) {
      console.error("Error fetching pipeline report:", error);
      res.status(500).json({ message: "Failed to fetch pipeline report" });
    }
  });

  // GET /api/sales/reports/sales-reps - Sales Rep Performance Report
  app.get("/api/sales/reports/sales-reps", requireAuth(), async (req, res) => {
    try {
      const { startDate, endDate, salesRepId, sourceId } = req.query;
      
      // Build date filter for deals
      const dealFilters = [];
      if (startDate && endDate) {
        dealFilters.push(
          gte(deals.wonDate, new Date(startDate as string)),
          lte(deals.wonDate, new Date(endDate as string))
        );
      }
      if (salesRepId && salesRepId !== 'all') {
        dealFilters.push(eq(deals.assignedTo, salesRepId as string));
      }
      const dealDateFilter = dealFilters.length > 0 ? and(...dealFilters) : undefined;

      // Build date filter for activities
      const activityFilters = [];
      if (startDate && endDate) {
        activityFilters.push(
          gte(salesActivities.createdAt, new Date(startDate as string)),
          lte(salesActivities.createdAt, new Date(endDate as string))
        );
      }
      if (salesRepId && salesRepId !== 'all') {
        activityFilters.push(eq(salesActivities.assignedTo, salesRepId as string));
      }
      const activityDateFilter = activityFilters.length > 0 ? and(...activityFilters) : undefined;

      // Build filter for leads
      const leadFilters = [];
      if (startDate && endDate) {
        leadFilters.push(
          gte(leads.createdAt, new Date(startDate as string)),
          lte(leads.createdAt, new Date(new Date(endDate as string).getTime() + 24 * 60 * 60 * 1000 - 1))
        );
      }
      if (salesRepId && salesRepId !== 'all') {
        leadFilters.push(eq(leads.assignedTo, salesRepId as string));
      }
      const leadDateFilter = leadFilters.length > 0 ? and(...leadFilters) : undefined;

      // Get Sales Representative and Sales Manager role IDs
      const salesRoles = await db
        .select({ id: roles.id })
        .from(roles)
        .where(or(
          eq(roles.name, 'Sales Representative'),
          eq(roles.name, 'Sales Manager')
        ));
      
      const salesRoleIds = salesRoles.map(r => r.id);

      // Get staff IDs who have any leads assigned (regardless of role)
      const staffWithLeads = await db
        .selectDistinct({ assignedTo: leads.assignedTo })
        .from(leads)
        .where(isNotNull(leads.assignedTo));
      const staffIdsWithLeads = staffWithLeads.map(s => s.assignedTo).filter(Boolean) as string[];

      // Get staff members who have sales roles OR have leads assigned to them
      // This ensures executives/anyone who closes deals will appear in the report
      let staffMembers;
      if (salesRepId && salesRepId !== 'all') {
        // Filter to specific rep
        staffMembers = await db
          .select({
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            department: staff.department
          })
          .from(staff)
          .where(and(eq(staff.isActive, true), eq(staff.id, salesRepId as string)));
      } else {
        // Get all staff with sales roles
        const salesStaff = salesRoleIds.length > 0 ? await db
          .selectDistinct({
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            department: staff.department
          })
          .from(staff)
          .innerJoin(userRoles, eq(userRoles.userId, staff.id))
          .where(and(eq(staff.isActive, true), inArray(userRoles.roleId, salesRoleIds))) : [];
        
        // Get all staff with leads assigned (this catches executives, etc.)
        const leadAssignedStaff = staffIdsWithLeads.length > 0 ? await db
          .select({
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            department: staff.department
          })
          .from(staff)
          .where(and(eq(staff.isActive, true), inArray(staff.id, staffIdsWithLeads))) : [];
        
        // Merge and dedupe by staff ID
        const staffMap = new Map();
        [...salesStaff, ...leadAssignedStaff].forEach(s => staffMap.set(s.id, s));
        staffMembers = Array.from(staffMap.values());
      }

      // Get appointment counts by rep
      const appointmentCounts = await db
        .select({
          assignedTo: salesActivities.assignedTo,
          appointmentCount: sql<number>`count(*) filter (where ${salesActivities.type} = 'appointment')::int`,
          pitchCount: sql<number>`count(*) filter (where ${salesActivities.type} IN ('pitch', 'demo'))::int`
        })
        .from(salesActivities)
        .where(activityDateFilter)
        .groupBy(salesActivities.assignedTo);

      // Get closed (Won) leads by rep - count leads in "Closed Won" pipeline stage
      // First get the "Closed Won" stage ID
      const closedWonStage = await db
        .select({ id: leadPipelineStages.id })
        .from(leadPipelineStages)
        .where(ilike(leadPipelineStages.name, '%closed won%'))
        .limit(1);
      
      const closedWonStageId = closedWonStage[0]?.id;
      
      // Build filter for won leads
      const wonLeadFilters = [...(leadFilters || [])];
      if (closedWonStageId) {
        wonLeadFilters.push(eq(leads.stageId, closedWonStageId));
      } else {
        // Fallback to status if no Closed Won stage exists
        wonLeadFilters.push(eq(leads.status, 'Won'));
      }
      const wonLeadFilter = wonLeadFilters.length > 0 ? and(...wonLeadFilters) : undefined;
      
      const dealStats = await db
        .select({
          assignedTo: leads.assignedTo,
          closedCount: sql<number>`count(*)::int`,
          totalValue: sql<string>`COALESCE(sum(${leads.value}), 0)::text`
        })
        .from(leads)
        .where(wonLeadFilter)
        .groupBy(leads.assignedTo);

      // Get total leads assigned to each rep
      const leadCounts = await db
        .select({
          assignedTo: leads.assignedTo,
          totalLeads: sql<number>`count(*)::int`
        })
        .from(leads)
        .where(leadDateFilter)
        .groupBy(leads.assignedTo);

      // Build report data
      const reportData = staffMembers.map(member => {
        const activities = appointmentCounts.find(a => a.assignedTo === member.id);
        const dealData = dealStats.find(d => d.assignedTo === member.id);
        const leadData = leadCounts.find(l => l.assignedTo === member.id);

        const appointmentCount = activities?.appointmentCount || 0;
        const pitchCount = activities?.pitchCount || 0;
        const closedCount = dealData?.closedCount || 0;
        const totalLeads = leadData?.totalLeads || 0;
        // Lead value represents MRR (Monthly Recurring Revenue)
        const totalMRR = parseFloat(dealData?.totalValue || '0');
        const avgMRR = closedCount > 0 ? totalMRR / closedCount : 0;
        // Total Value = Annual value (MRR × 12)
        const totalValue = totalMRR * 12;

        return {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          department: member.department,
          metrics: {
            appointments: appointmentCount,
            pitches: pitchCount,
            closedDeals: closedCount,
            totalLeads: totalLeads,
            closeRate: totalLeads > 0 ? (closedCount / totalLeads) * 100 : 0,
            totalValue: totalValue,
            avgMRR: avgMRR
          }
        };
      });

      // Sort by closed deals (highest first)
      reportData.sort((a, b) => b.metrics.closedDeals - a.metrics.closedDeals);

      // Calculate team totals
      const totals = reportData.reduce((acc, rep) => ({
        appointments: acc.appointments + rep.metrics.appointments,
        pitches: acc.pitches + rep.metrics.pitches,
        closedDeals: acc.closedDeals + rep.metrics.closedDeals,
        totalLeads: acc.totalLeads + rep.metrics.totalLeads,
        totalValue: acc.totalValue + rep.metrics.totalValue
      }), {
        appointments: 0,
        pitches: 0,
        closedDeals: 0,
        totalLeads: 0,
        totalValue: 0
      });

      res.json({
        salesReps: reportData,
        totals: {
          ...totals,
          avgCloseRate: totals.totalLeads > 0 ? (totals.closedDeals / totals.totalLeads) * 100 : 0,
          avgMRR: reportData.reduce((sum, rep) => sum + rep.metrics.avgMRR, 0) / reportData.length
        }
      });
    } catch (error) {
      console.error("Error fetching sales rep report:", error);
      res.status(500).json({ message: "Failed to fetch sales rep report" });
    }
  });

  // GET /api/sales/reports/opportunity-status - Opportunity Status Report
  app.get("/api/sales/reports/opportunity-status", requireAuth(), async (req, res) => {
    try {
      const { startDate, endDate, salesRepId, sourceId } = req.query;
      
      // Build date filter for leads
      const filters = [];
      if (startDate && endDate) {
        filters.push(
          gte(leads.createdAt, new Date(startDate as string)),
          lte(leads.createdAt, new Date(new Date(endDate as string).getTime() + 24 * 60 * 60 * 1000 - 1))
        );
      }
      if (salesRepId && salesRepId !== 'all') {
        filters.push(eq(leads.assignedTo, salesRepId as string));
      }
      if (sourceId && sourceId !== 'all') {
        filters.push(eq(leads.source, sourceId as string));
      }
      const dateFilter = filters.length > 0 ? and(...filters) : undefined;
      
      // Calculate previous period date range for comparison
      let previousPeriodFilter = undefined;
      if (startDate && endDate) {
        const startMs = new Date(startDate as string).getTime();
        const endMs = new Date(endDate as string).getTime();
        const periodLength = endMs - startMs;
        const prevStart = new Date(startMs - periodLength - 24 * 60 * 60 * 1000);
        const prevEnd = new Date(startMs - 1);
        
        const prevFilters = [
          gte(leads.createdAt, prevStart),
          lte(leads.createdAt, prevEnd)
        ];
        if (salesRepId && salesRepId !== 'all') {
          prevFilters.push(eq(leads.assignedTo, salesRepId as string));
        }
        if (sourceId && sourceId !== 'all') {
          prevFilters.push(eq(leads.source, sourceId as string));
        }
        previousPeriodFilter = and(...prevFilters);
      }

      // Get Closed Won and Closed Lost stage IDs
      const closedWonStage = await db
        .select({ id: leadPipelineStages.id })
        .from(leadPipelineStages)
        .where(ilike(leadPipelineStages.name, '%closed won%'))
        .limit(1);
      
      const closedLostStage = await db
        .select({ id: leadPipelineStages.id })
        .from(leadPipelineStages)
        .where(ilike(leadPipelineStages.name, '%closed lost%'))
        .limit(1);
      
      const closedWonStageId = closedWonStage[0]?.id;
      const closedLostStageId = closedLostStage[0]?.id;
      
      // Count leads by status category for current period
      const allLeadsCurrent = await db
        .select({
          stageId: leads.stageId,
          count: sql<number>`count(*)::int`
        })
        .from(leads)
        .where(dateFilter)
        .groupBy(leads.stageId);
      
      // Count leads for previous period
      const allLeadsPrevious = previousPeriodFilter ? await db
        .select({
          stageId: leads.stageId,
          count: sql<number>`count(*)::int`
        })
        .from(leads)
        .where(previousPeriodFilter)
        .groupBy(leads.stageId) : [];

      // Calculate current period counts
      let openCount = 0, wonCount = 0, lostCount = 0;
      for (const row of allLeadsCurrent) {
        if (row.stageId === closedWonStageId) {
          wonCount += row.count;
        } else if (row.stageId === closedLostStageId) {
          lostCount += row.count;
        } else {
          openCount += row.count;
        }
      }
      const totalCurrent = openCount + wonCount + lostCount;
      
      // Calculate previous period counts
      let prevOpenCount = 0, prevWonCount = 0, prevLostCount = 0;
      for (const row of allLeadsPrevious) {
        if (row.stageId === closedWonStageId) {
          prevWonCount += row.count;
        } else if (row.stageId === closedLostStageId) {
          prevLostCount += row.count;
        } else {
          prevOpenCount += row.count;
        }
      }
      const totalPrevious = prevOpenCount + prevWonCount + prevLostCount;
      
      // Calculate percent change
      const percentChange = totalPrevious > 0 
        ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 
        : totalCurrent > 0 ? 100 : 0;

      res.json({
        total: totalCurrent,
        percentChange,
        previousTotal: totalPrevious,
        breakdown: {
          open: openCount,
          won: wonCount,
          lost: lostCount
        }
      });
    } catch (error) {
      console.error("Error fetching opportunity status report:", error);
      res.status(500).json({ message: "Failed to fetch opportunity status report" });
    }
  });

  // GET /api/sales/reports/opportunity-value - Opportunity Value Report
  app.get("/api/sales/reports/opportunity-value", requireAuth(), async (req, res) => {
    try {
      const { startDate, endDate, salesRepId, sourceId } = req.query;
      
      // Build date filter for leads
      const filters = [];
      if (startDate && endDate) {
        filters.push(
          gte(leads.createdAt, new Date(startDate as string)),
          lte(leads.createdAt, new Date(new Date(endDate as string).getTime() + 24 * 60 * 60 * 1000 - 1))
        );
      }
      if (salesRepId && salesRepId !== 'all') {
        filters.push(eq(leads.assignedTo, salesRepId as string));
      }
      if (sourceId && sourceId !== 'all') {
        filters.push(eq(leads.source, sourceId as string));
      }
      const dateFilter = filters.length > 0 ? and(...filters) : undefined;
      
      // Calculate previous period date range for comparison
      let previousPeriodFilter = undefined;
      if (startDate && endDate) {
        const startMs = new Date(startDate as string).getTime();
        const endMs = new Date(endDate as string).getTime();
        const periodLength = endMs - startMs;
        const prevStart = new Date(startMs - periodLength - 24 * 60 * 60 * 1000);
        const prevEnd = new Date(startMs - 1);
        
        const prevFilters = [
          gte(leads.createdAt, prevStart),
          lte(leads.createdAt, prevEnd)
        ];
        if (salesRepId && salesRepId !== 'all') {
          prevFilters.push(eq(leads.assignedTo, salesRepId as string));
        }
        if (sourceId && sourceId !== 'all') {
          prevFilters.push(eq(leads.source, sourceId as string));
        }
        previousPeriodFilter = and(...prevFilters);
      }

      // Get Closed Won and Closed Lost stage IDs
      const closedWonStage = await db
        .select({ id: leadPipelineStages.id })
        .from(leadPipelineStages)
        .where(ilike(leadPipelineStages.name, '%closed won%'))
        .limit(1);
      
      const closedLostStage = await db
        .select({ id: leadPipelineStages.id })
        .from(leadPipelineStages)
        .where(ilike(leadPipelineStages.name, '%closed lost%'))
        .limit(1);
      
      const closedWonStageId = closedWonStage[0]?.id;
      const closedLostStageId = closedLostStage[0]?.id;
      
      // Get lead values by status for current period
      const valuesCurrent = await db
        .select({
          stageId: leads.stageId,
          totalValue: sql<string>`COALESCE(sum(${leads.value}), 0)::text`
        })
        .from(leads)
        .where(dateFilter)
        .groupBy(leads.stageId);
      
      // Get lead values for previous period
      const valuesPrevious = previousPeriodFilter ? await db
        .select({
          stageId: leads.stageId,
          totalValue: sql<string>`COALESCE(sum(${leads.value}), 0)::text`
        })
        .from(leads)
        .where(previousPeriodFilter)
        .groupBy(leads.stageId) : [];

      // Calculate current period values (convert MRR to annual by multiplying by 12)
      let openValue = 0, wonValue = 0, lostValue = 0;
      for (const row of valuesCurrent) {
        const monthlyValue = parseFloat(row.totalValue);
        const annualValue = monthlyValue * 12; // Convert MRR to annual
        if (row.stageId === closedWonStageId) {
          wonValue += annualValue;
        } else if (row.stageId === closedLostStageId) {
          lostValue += annualValue;
        } else {
          openValue += annualValue;
        }
      }
      const totalValueCurrent = openValue + wonValue + lostValue;
      
      // Calculate previous period values
      let prevOpenValue = 0, prevWonValue = 0, prevLostValue = 0;
      for (const row of valuesPrevious) {
        const monthlyValue = parseFloat(row.totalValue);
        const annualValue = monthlyValue * 12;
        if (row.stageId === closedWonStageId) {
          prevWonValue += annualValue;
        } else if (row.stageId === closedLostStageId) {
          prevLostValue += annualValue;
        } else {
          prevOpenValue += annualValue;
        }
      }
      const totalValuePrevious = prevOpenValue + prevWonValue + prevLostValue;
      
      // Calculate percent change
      const percentChange = totalValuePrevious > 0 
        ? ((totalValueCurrent - totalValuePrevious) / totalValuePrevious) * 100 
        : totalValueCurrent > 0 ? 100 : 0;

      res.json({
        totalRevenue: totalValueCurrent,
        percentChange,
        previousTotal: totalValuePrevious,
        breakdown: {
          open: openValue,
          won: wonValue,
          lost: lostValue
        }
      });
    } catch (error) {
      console.error("Error fetching opportunity value report:", error);
      res.status(500).json({ message: "Failed to fetch opportunity value report" });
    }
  });

  // Get user view preferences
  app.get("/api/user-view-preferences/:viewType", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { viewType } = req.params;
      const preference = await appStorage.getUserViewPreference(userId, viewType);
      
      res.json(preference || { preferences: {} });
    } catch (error) {
      console.error("Error fetching user view preference:", error);
      res.status(500).json({ message: "Failed to fetch view preferences" });
    }
  });

  // Save user view preferences
  app.post("/api/user-view-preferences/:viewType", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { viewType } = req.params;
      const { preferences } = req.body;
      
      const savedPreference = await appStorage.saveUserViewPreference(userId, viewType, preferences);
      
      res.json(savedPreference);
    } catch (error) {
      console.error("Error saving user view preference:", error);
      res.status(500).json({ message: "Failed to save view preferences" });
    }
  });

  // =============================================================================
  // DASHBOARDS ROUTES
  // =============================================================================

  // Get user's dashboards
  app.get("/api/dashboards", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const dashboards = await appStorage.getUserDashboards(userId);
      res.json(dashboards);
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      res.status(500).json({ message: "Failed to fetch dashboards" });
    }
  });

  // Get single dashboard
  app.get("/api/dashboards/:id", requireAuth(), async (req, res) => {
    try {
      const dashboard = await appStorage.getDashboard(req.params.id);
      if (!dashboard) {
        return res.status(404).json({ error: "Dashboard not found" });
      }
      res.json(dashboard);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard" });
    }
  });

  // Create new dashboard
  app.post("/api/dashboards", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validatedData = insertDashboardSchema.parse({
        ...req.body,
        userId,
      });

      const dashboard = await appStorage.createDashboard(validatedData);
      res.json(dashboard);
    } catch (error) {
      console.error("Error creating dashboard:", error);
      res.status(500).json({ message: "Failed to create dashboard" });
    }
  });

  // Update dashboard
  app.put("/api/dashboards/:id", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Verify ownership
      const existing = await appStorage.getDashboard(req.params.id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ error: "Dashboard not found" });
      }

      const dashboard = await appStorage.updateDashboard(req.params.id, req.body);
      res.json(dashboard);
    } catch (error) {
      console.error("Error updating dashboard:", error);
      res.status(500).json({ message: "Failed to update dashboard" });
    }
  });

  // Delete dashboard
  app.delete("/api/dashboards/:id", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Verify ownership
      const existing = await appStorage.getDashboard(req.params.id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ error: "Dashboard not found" });
      }

      // Don't allow deleting the default dashboard if it's the only one
      if (existing.isDefault) {
        const userDashboards = await appStorage.getUserDashboards(userId);
        if (userDashboards.length === 1) {
          return res.status(400).json({ error: "Cannot delete the only dashboard" });
        }
      }

      await appStorage.deleteDashboard(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      res.status(500).json({ message: "Failed to delete dashboard" });
    }
  });

  // Set default dashboard
  app.post("/api/dashboards/:id/set-default", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Verify ownership
      const existing = await appStorage.getDashboard(req.params.id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ error: "Dashboard not found" });
      }

      await appStorage.setDefaultDashboard(userId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default dashboard:", error);
      res.status(500).json({ message: "Failed to set default dashboard" });
    }
  });

  // Update dashboard order
  app.post("/api/dashboards/reorder", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const updates = req.body.updates as Array<{ id: string; displayOrder: number }>;
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ error: "Invalid updates format" });
      }

      // Verify ownership of all dashboards
      const userDashboards = await appStorage.getUserDashboards(userId);
      const userDashboardIds = userDashboards.map(d => d.id);
      
      for (const update of updates) {
        if (!userDashboardIds.includes(update.id)) {
          return res.status(403).json({ error: "Unauthorized to update dashboard order" });
        }
      }

      await appStorage.updateDashboardsOrder(updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating dashboard order:", error);
      res.status(500).json({ message: "Failed to update dashboard order" });
    }
  });

  // =============================================================================
  // DASHBOARD WIDGETS ROUTES
  // =============================================================================

  // Get all available dashboard widgets
  app.get("/api/dashboard-widgets", requireAuth(), async (req, res) => {
    try {
      const widgets = await appStorage.getDashboardWidgets();
      res.json(widgets);
    } catch (error) {
      console.error("Error fetching dashboard widgets:", error);
      res.status(500).json({ message: "Failed to fetch dashboard widgets" });
    }
  });

  // Get user's dashboard widget layout
  app.get("/api/user-dashboard-widgets", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const dashboardId = req.query.dashboardId as string;
      if (!dashboardId) {
        return res.status(400).json({ error: "Dashboard ID is required" });
      }

      const userWidgets = await appStorage.getUserDashboardWidgets(userId, dashboardId);
      res.json(userWidgets);
    } catch (error) {
      console.error("Error fetching user dashboard widgets:", error);
      res.status(500).json({ message: "Failed to fetch user dashboard widgets" });
    }
  });

  // Add widget to user's dashboard
  app.post("/api/user-dashboard-widgets", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const widgetData = {
        ...req.body,
        userId,
      };

      const newWidget = await appStorage.createUserDashboardWidget(widgetData);
      res.json(newWidget);
    } catch (error) {
      console.error("Error creating user dashboard widget:", error);
      res.status(500).json({ message: "Failed to add widget to dashboard" });
    }
  });

  // Update user dashboard widget (position, size, settings)
  app.put("/api/user-dashboard-widgets/:id", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      
      // Verify the widget belongs to the user
      const existing = await appStorage.getUserDashboardWidget(id);
      if (!existing || existing.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updated = await appStorage.updateUserDashboardWidget(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating user dashboard widget:", error);
      res.status(500).json({ message: "Failed to update widget" });
    }
  });

  // Bulk update user dashboard widgets (for drag-and-drop repositioning)
  app.post("/api/user-dashboard-widgets/bulk-update", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { widgets } = req.body;
      
      // Update all widgets
      const updates = await Promise.all(
        widgets.map((widget: any) => 
          appStorage.updateUserDashboardWidget(widget.id, {
            x: widget.x,
            y: widget.y,
            width: widget.width,
            height: widget.height,
            order: widget.order
          })
        )
      );

      res.json(updates);
    } catch (error) {
      console.error("Error bulk updating user dashboard widgets:", error);
      res.status(500).json({ message: "Failed to update widget positions" });
    }
  });

  // Delete widget from user's dashboard
  app.delete("/api/user-dashboard-widgets/:id", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      
      // Verify the widget belongs to the user
      const existing = await appStorage.getUserDashboardWidget(id);
      if (!existing || existing.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await appStorage.deleteUserDashboardWidget(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user dashboard widget:", error);
      res.status(500).json({ message: "Failed to delete widget" });
    }
  });

  // Get widget data by type
  app.get("/api/dashboard-widgets/:type/data", requireAuth(), async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { type } = req.params;
      const data = await appStorage.getWidgetData(type, userId);
      
      // Disable caching to ensure fresh widget data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(data);
    } catch (error) {
      console.error(`Error fetching widget data for ${req.params.type}:`, error);
      res.status(500).json({ message: "Failed to fetch widget data" });
    }
  });

  // Test-only endpoint for creating test users (DEVELOPMENT ONLY)
  // This endpoint allows automated tests to create users with known credentials
  if (process.env.NODE_ENV === 'development') {
    app.post("/api/test/create-user", async (req, res) => {
      try {
        const { email, password, firstName = "Test", lastName = "User", role = "Admin" } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: "Email and password are required" });
        }

        // Check if user already exists
        const existingStaff = await db
          .select()
          .from(staff)
          .where(eq(staff.email, email.toLowerCase().trim()))
          .limit(1);

        if (existingStaff.length > 0) {
          return res.status(200).json({ message: "User already exists", userId: existingStaff[0].id });
        }

        // Create the staff member
        const [newStaff] = await db
          .insert(staff)
          .values({
            email: email.toLowerCase().trim(),
            firstName,
            lastName,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create auth_users entry
        await db
          .insert(authUsers)
          .values({
            userId: newStaff.id,
            email: email.toLowerCase().trim(),
            passwordHash,
            isActive: true,
          });

        // Assign role
        const [targetRole] = await db
          .select()
          .from(roles)
          .where(eq(roles.name, role))
          .limit(1);

        if (targetRole) {
          await db
            .update(staff)
            .set({ roleId: targetRole.id })
            .where(eq(staff.id, newStaff.id));

          await db.insert(userRoles).values({
            userId: newStaff.id,
            roleId: targetRole.id,
          });
        }

        res.json({ 
          success: true, 
          message: "Test user created successfully",
          userId: newStaff.id,
          email: newStaff.email
        });
      } catch (error) {
        console.error("Error creating test user:", error);
        res.status(500).json({ error: "Failed to create test user" });
      }
    });
  }


  // Get synced Google Calendar events for the authenticated user
  app.get("/api/google-calendar-events", requireAuth(), async (req, res) => {
    try {
      const { calendarEvents } = await import('./db');
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get all calendar events for the user
      const events = await db
        .select({
          id: calendarEvents.id,
          googleEventId: calendarEvents.googleEventId,
          title: calendarEvents.title,
          description: calendarEvents.description,
          startTime: calendarEvents.startTime,
          endTime: calendarEvents.endTime,
          location: calendarEvents.location,
          status: calendarEvents.status,
          isAllDay: calendarEvents.isAllDay,
          organizerEmail: calendarEvents.organizerEmail,
          organizerName: calendarEvents.organizerName,
          recurringEventId: calendarEvents.recurringEventId,
          lastSyncedAt: calendarEvents.lastSyncedAt,
          createdAt: calendarEvents.createdAt
        })
        .from(calendarEvents)
        .where(eq(calendarEvents.userId, userId))
        .orderBy(desc(calendarEvents.startTime));

      res.json({ events });
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      res.status(500).json({ error: "Failed to fetch Google Calendar events" });
    }
  });
  app.get("/api/google-calendar/events", requireAuth(), getGoogleCalendarEventsForView);
  app.post("/api/calendar/events", requireAuth(), createCalendarEvent);
  app.patch("/api/calendar/events/:eventId/status", requireAuth(), updateCalendarEventStatus);
  app.get("/api/calendar/time-entries", requireAuth(), getEventTimeEntries);

  // AI Assistant endpoints
  const { chatWithAssistant } = await import("./ai-assistant");

  // Get AI Assistant settings (custom instructions)
  app.get("/api/ai-assistant/settings", requireAuth(["admin"]), async (req, res) => {
    try {
      const [settings] = await db
        .select()
        .from(aiAssistantSettings)
        .limit(1);
      
      res.json(settings || { customInstructions: null, isEnabled: true });
    } catch (error: any) {
      console.error("Error fetching AI assistant settings:", error);
      res.status(500).json({ error: "Failed to fetch AI assistant settings" });
    }
  });
  
  // Update AI Assistant settings (custom instructions)
  app.put("/api/ai-assistant/settings", requireAuth(["admin"]), async (req, res) => {
    try {
      const { customInstructions, isEnabled } = req.body;
      
      // Check if settings exist
      const [existingSettings] = await db
        .select()
        .from(aiAssistantSettings)
        .limit(1);
      
      if (existingSettings) {
        // Update existing settings
        const [updated] = await db
          .update(aiAssistantSettings)
          .set({
            customInstructions: customInstructions ?? existingSettings.customInstructions,
            isEnabled: isEnabled ?? existingSettings.isEnabled,
            updatedAt: new Date(),
          })
          .where(eq(aiAssistantSettings.id, existingSettings.id))
          .returning();
        
        res.json(updated);
      } else {
        // Create new settings
        const [created] = await db
          .insert(aiAssistantSettings)
          .values({
            customInstructions,
            isEnabled: isEnabled ?? true,
          })
          .returning();
        
        res.json(created);
      }
    } catch (error: any) {
      console.error("Error updating AI assistant settings:", error);
      res.status(500).json({ error: "Failed to update AI assistant settings" });
    }
  });
  
  app.post("/api/ai-assistant/chat", requireAuth(), async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const result = await chatWithAssistant(message, history);
      res.json(result);
    } catch (error: any) {
      console.error("AI Assistant error:", error);
      res.status(500).json({ error: error.message || "Failed to get AI response" });
    }
  });

  // PX Meetings
  app.get("/api/px-meetings", requireAuth(), async (req, res) => {
    try {
      const meetings = await appStorage.getPxMeetings();
      res.json(meetings);
    } catch (error: any) {
      console.error("Error fetching PX meetings:", error);
      res.status(500).json({ error: "Failed to fetch PX meetings" });
    }
  });

  app.get("/api/px-meetings/:id", requireAuth(), async (req, res) => {
    try {
      const meeting = await appStorage.getPxMeeting(req.params.id);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error: any) {
      console.error("Error fetching PX meeting:", error);
      res.status(500).json({ error: "Failed to fetch PX meeting" });
    }
  });

  app.post("/api/px-meetings", requireAuth(), async (req, res) => {
    try {
      const { attendeeIds, ...meetingData } = req.body;
      const user = req.session?.user;
      
      const meeting = await appStorage.createPxMeeting(
        {
          ...meetingData,
          createdById: user?.id,
        },
        attendeeIds || []
      );
      
      // If client is assigned on creation, log an audit entry
      if (meetingData.clientId) {
        try {
          const userId = user?.id || user?.staffId;
          if (userId) {
            const meetingDate = meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString() : "Unscheduled";
            
            await appStorage.createAuditLog({
              action: "linked",
              entityType: "meeting",
              entityId: meeting.id,
              entityName: meeting.title,
              userId: userId,
              details: `PX Meeting "${meeting.title}" was linked to this client`,
              newValues: {
                clientId: meetingData.clientId,
                meetingId: meeting.id,
                meetingTitle: meeting.title,
                meetingDate: meetingDate
              }
            });
          }
        } catch (auditError) {
          console.error("Error creating audit log for PX meeting:", auditError);
        }
      }
      
      res.status(201).json(meeting);
    } catch (error: any) {
      console.error("Error creating PX meeting:", error);
      res.status(500).json({ error: "Failed to create PX meeting" });
    }
  });

  app.put("/api/px-meetings/:id", requireAuth(), async (req, res) => {
    try {
      const { attendeeIds, ...meetingData } = req.body;
      
      // Get existing meeting to check if client is being changed
      const existingMeeting = await appStorage.getPxMeeting(req.params.id);
      const oldClientId = existingMeeting?.clientId;
      
      const updated = await appStorage.updatePxMeeting(
        req.params.id,
        meetingData,
        attendeeIds
      );
      
      if (!updated) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      // If client is assigned and its different from before, log an audit entry
      const newClientId = meetingData.clientId;
      if (newClientId && newClientId !== oldClientId) {
        try {
          const user = (req as any).user;
          const userId = user?.id || user?.staffId;
          if (userId) {
            const meetingDate = updated.meetingDate ? new Date(updated.meetingDate).toLocaleDateString() : "Unscheduled";
            
            await appStorage.createAuditLog({
              action: "linked",
              entityType: "meeting",
              entityId: updated.id,
              entityName: updated.title,
              userId: userId,
              details: `PX Meeting "${updated.title}" was linked to this client`,
              newValues: {
                clientId: newClientId,
                meetingId: updated.id,
                meetingTitle: updated.title,
                meetingDate: meetingDate
              }
            });
          }
        } catch (auditError) {
          console.error("Error creating audit log for PX meeting:", auditError);
        }
      }
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating PX meeting:", error);
      res.status(500).json({ error: "Failed to update PX meeting" });
    }
  });

  app.delete("/api/px-meetings/:id", requireAuth(), async (req, res) => {
    try {
      const deleted = await appStorage.deletePxMeeting(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting PX meeting:", error);
      res.status(500).json({ error: "Failed to delete PX meeting" });
    }
  });
  return httpServer;
}
