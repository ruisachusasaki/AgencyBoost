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
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const MOCK_ADMIN_USER_ID = 'dev-admin-00000000-0000-0000-0000-000000000000';

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
 * In development mode: returns mock admin user ID for full platform access.
 * In production mode: returns session user ID or undefined if not authenticated.
 */
export function getAuthenticatedUserId(req: Request): string | undefined {
  // Development mode bypass - return mock admin user for full access
  if (IS_DEVELOPMENT) {
    return MOCK_ADMIN_USER_ID;
  }
  
  // Production mode - strict session-based authentication
  return req.session?.userId;
}

/**
 * Middleware to require authentication.
 * In development mode: creates mock admin session and always passes.
 * In production mode: returns 401 if no valid session exists.
 */
export function requireAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Development mode bypass - create mock admin session
    if (IS_DEVELOPMENT) {
      // Ensure session exists and set mock admin user
      if (!req.session) {
        req.session = {};
      }
      req.session.userId = MOCK_ADMIN_USER_ID;
      req.session.user = {
        id: MOCK_ADMIN_USER_ID,
        name: 'Dev Admin',
        role: 'admin',
        email: 'dev-admin@localhost'
      };
      return next();
    }
    
    // Production mode - strict authentication check
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
  // Development mode bypass - mock admin user has all permissions
  if (IS_DEVELOPMENT && userId === MOCK_ADMIN_USER_ID) {
    return true;
  }
  
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
 * In development mode: returns mock admin user ID.
 * In production mode: returns user ID or throws error with 401 response.
 * Use this in route handlers after requireAuth() middleware.
 */
export function getAuthenticatedUserIdOrFail(req: Request, res: Response): string | null {
  // Development mode bypass - return mock admin user
  if (IS_DEVELOPMENT) {
    return MOCK_ADMIN_USER_ID;
  }
  
  // Production mode - strict authentication check
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
 * In development mode: always returns true for mock admin user.
 * In production mode: checks admin role through database queries.
 */
export async function isCurrentUserAdmin(req: Request): Promise<boolean> {
  const userId = getAuthenticatedUserId(req);
  
  if (!userId) {
    return false;
  }
  
  // Development mode bypass - mock admin user is always admin
  if (IS_DEVELOPMENT && userId === MOCK_ADMIN_USER_ID) {
    return true;
  }
  
  // Production mode - check admin role through database queries
  const adminRoles = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(roles.name, 'admin')
      )
    );
  
  return adminRoles.length > 0;
}

/**
 * Middleware for admin-only operations.
 * In development mode: creates mock admin session and always passes.
 * In production mode: requires both authentication and admin privileges.
 */
export function requireAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Development mode bypass - create mock admin session
    if (IS_DEVELOPMENT) {
      // Ensure session exists and set mock admin user
      if (!req.session) {
        req.session = {};
      }
      req.session.userId = MOCK_ADMIN_USER_ID;
      req.session.user = {
        id: MOCK_ADMIN_USER_ID,
        name: 'Dev Admin',
        role: 'admin',
        email: 'dev-admin@localhost'
      };
      return next();
    }
    
    // Production mode - strict authentication and admin check
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
 * In development mode: uses mock admin user ID.
 * In production mode: returns null if not authenticated - no fallbacks.
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
 * In development mode: returns mock admin user context.
 * In production mode: requires authentication or returns null.
 */
export function getAuthenticatedAuditContext(req: Request, res: Response): { userId: string; ip: string; userAgent: string } | null {
  // Development mode bypass - return mock admin context
  if (IS_DEVELOPMENT) {
    return {
      userId: MOCK_ADMIN_USER_ID,
      ip: req.ip || req.connection?.remoteAddress || "127.0.0.1",
      userAgent: req.get("User-Agent") || "Unknown"
    };
  }
  
  // Production mode - strict authentication check
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