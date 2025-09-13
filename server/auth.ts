import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { staff, userRoles, roles, permissions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * 
 * Emergency security patch to fix 89 critical vulnerabilities where hardcoded 
 * admin fallbacks allowed complete system compromise without authentication.
 * 
 * This replaces dangerous patterns like:
 * const userId = req.session?.userId || "admin-id" 
 * 
 * With secure authentication checks that fail safely.
 */

// Extended Express Request interface with session
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

/**
 * Extract authenticated user ID from request session.
 * Returns undefined if no valid session exists.
 * NO FALLBACKS - fails safely if not authenticated.
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
async function hasPermission(
  userId: string, 
  module: string, 
  permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canManage'
): Promise<boolean> {
  try {
    // Check if user is admin - for demo purposes, keep existing admin list
    // In production, this would query roles from database
    const adminUserIds = ["e56be30d-c086-446c-ada4-7ccef37ad7fb"];
    
    // Admin users have all permissions
    if (adminUserIds.includes(userId)) {
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
        .select()
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
 * Returns the user ID or throws an error with a 401 response.
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
 * For audit logging and special admin operations.
 */
export async function isCurrentUserAdmin(req: Request): Promise<boolean> {
  const userId = getAuthenticatedUserId(req);
  
  if (!userId) {
    return false;
  }
  
  // For demo purposes, use hardcoded admin list
  // In production, this would check roles in database
  const adminUserIds = ["e56be30d-c086-446c-ada4-7ccef37ad7fb"];
  return adminUserIds.includes(userId);
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
 * Use this for operations that should only be performed by authenticated users.
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