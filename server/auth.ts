import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { staff, userRoles, roles, permissions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * 
 * Provides secure authentication with development mode bypass.
 * 
 * DEVELOPMENT MODE:
 * - When NODE_ENV=development, creates mock admin session for full platform access
 * - Bypasses all permission checks to allow testing and development
 * 
 * PRODUCTION MODE:
 * - Strict authentication required - no fallbacks or bypasses
 * - All permission checks enforced through database queries
 */

// Development mode detection and mock user configuration
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const MOCK_ADMIN_USER_ID = '00000000-0000-4000-8000-000000000000';

// Extend express-session's SessionData interface instead of overriding Express.Request
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      roles: string[];
    };
  }
}

/**
 * Extract authenticated user ID from request session.
 * Returns session user ID or undefined if not authenticated.
 */
export function getAuthenticatedUserId(req: Request): string | undefined {
  return req.session?.userId;
}

/**
 * Middleware to require authentication.
 * Returns 401 if no valid session exists.
 */
export function requireAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = getAuthenticatedUserId(req);
    
    if (!userId) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "Please log in to access this resource"
      });
    }
    
    next();
  };
}

/**
 * Check if user has specific permission for a module.
 * Uses existing hasPermission logic but requires valid userId.
 */
export async function hasPermission(
  userId: string, 
  module: string, 
  permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canManage'
): Promise<boolean> {
  
  try {
    // Check if user has admin role through proper database queries
    const adminRoles = await db
      .select({ roleId: userRoles.roleId, roleName: roles.name })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(roles.name, 'admin')
        )
      );
    
    // Users with admin role have all permissions
    if (adminRoles.length > 0) {
      return true;
    }
    
    // For non-admin users, query actual roles and permissions from database
    // This is the proper implementation that should be used in production:
    
    // 1. Get user roles
    const userRolesList = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    
    if (userRolesList.length === 0) {
      return false; // User has no roles
    }
    
    // 2. Check if any role has the required permission
    for (const userRole of userRolesList) {
      const rolePermissions = await db
        .select({
          id: permissions.id,
          module: permissions.module,
          canView: permissions.canView,
          canCreate: permissions.canCreate,
          canEdit: permissions.canEdit,
          canDelete: permissions.canDelete,
          canManage: permissions.canManage
        })
        .from(permissions)
        .where(
          and(
            eq(permissions.roleId, userRole.roleId),
            eq(permissions.module, module)
          )
        );
      
      for (const perm of rolePermissions) {
        if (perm[permission] === true) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false; // Fail safely - deny access on error
  }
}

/**
 * Middleware to require specific permission.
 * Must be used AFTER requireAuth().
 */
export function requirePermission(module: string, permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canManage') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = getAuthenticatedUserId(req);
    
    // This should never happen if requireAuth() is used first
    if (!userId) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "Please log in to access this resource"
      });
    }
    
    const allowed = await hasPermission(userId, module, permission);
    
    if (!allowed) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        message: `You don't have ${permission} permission for ${module}`
      });
    }
    
    next();
  };
}

/**
 * Get authenticated user ID with error handling.
 * Returns user ID or throws error with 401 response.
 * Use this in route handlers after requireAuth() middleware.
 */
export function getAuthenticatedUserIdOrFail(req: Request, res: Response): string | null {
  const userId = getAuthenticatedUserId(req);
  
  if (!userId) {
    res.status(401).json({ 
      error: "Authentication required",
      message: "Please log in to access this resource"
    });
    return null;
  }
  
  return userId;
}

/**
 * Check if current user is admin.
 * Checks admin role through database queries.
 */
export async function isCurrentUserAdmin(req: Request): Promise<boolean> {
  const userId = getAuthenticatedUserId(req);
  
  if (!userId) {
    return false;
  }
  
  // Production mode - check admin role through database queries
  const adminRoles = await db
    .select({ 
      roleId: staff.roleId,
      roleName: roles.name 
    })
    .from(staff)
    .leftJoin(roles, eq(staff.roleId, roles.id))
    .where(
      and(
        eq(staff.id, userId),
        or(
          eq(roles.name, 'admin'),
          eq(roles.name, 'Admin')
        )
      )
    );
  
  return adminRoles.length > 0;
}

/**
 * Middleware for admin-only operations.
 * Requires both authentication and admin privileges.
 */
export function requireAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = getAuthenticatedUserId(req);
    
    if (!userId) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "Please log in to access this resource"
      });
    }
    
    const isAdmin = await isCurrentUserAdmin(req);
    
    if (!isAdmin) {
      return res.status(403).json({ 
        error: "Admin access required",
        message: "This operation requires administrator privileges"
      });
    }
    
    next();
  };
}

/**
 * Get safe user context for audit logging.
 * Returns null if not authenticated - no fallbacks.
 */
export function getAuditContext(req: Request): { userId: string | null; ip: string; userAgent: string } {
  return {
    userId: getAuthenticatedUserId(req) || null,
    ip: req.ip || req.connection?.remoteAddress || "127.0.0.1",
    userAgent: req.get("User-Agent") || "Unknown"
  };
}

/**
 * Type-safe wrapper for audit logging that requires authentication.
 * Requires authentication or returns null.
 */
export function getAuthenticatedAuditContext(req: Request, res: Response): { userId: string; ip: string; userAgent: string } | null {
  const userId = getAuthenticatedUserId(req);
  
  if (!userId) {
    res.status(401).json({ 
      error: "Authentication required",
      message: "Please log in to perform this action"
    });
    return null;
  }
  
  return {
    userId,
    ip: req.ip || req.connection?.remoteAddress || "127.0.0.1",
    userAgent: req.get("User-Agent") || "Unknown"
  };
}

/**
 * Helper function to check if a string is a valid UUID.
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * UNCONDITIONAL helper function to normalize user IDs for database operations.
 * 
 * This function solves the development mode UUID problem by always converting
 * development sentinel user IDs to valid staff UUIDs from the database.
 * 
 * @param userId - The user ID to normalize (could be development sentinel or real UUID)
 * @returns Promise<string> - Always returns a valid staff UUID that exists in the database
 * @throws Error if no staff exists for attribution
 */
export async function normalizeUserIdForDb(userId: string): Promise<string> {
  console.log("🔍 normalizeUserIdForDb - Input userId:", userId);
  
  // If userId is development sentinel or not valid UUID, get real staff ID
  if (userId === MOCK_ADMIN_USER_ID || !isValidUUID(userId)) {
    console.log("🔄 Development/invalid UUID detected, fetching real staff ID...");
    
    const firstStaff = await db.select({ id: staff.id }).from(staff).limit(1);
    if (!firstStaff.length) {
      console.error("❌ No staff exists for attribution");
      throw new Error('No staff exists for attribution');
    }
    
    const normalizedId = firstStaff[0].id;
    console.log("✅ Normalized to staff UUID:", normalizedId);
    return normalizedId;
  }
  
  console.log("✅ Using original valid UUID:", userId);
  return userId;
}