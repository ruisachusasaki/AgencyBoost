import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { staff, userRoles, roles, permissions, granularPermissions } from '@shared/schema';
import { eq, and, or, inArray } from 'drizzle-orm';

/**
 * Maps legacy `module` permission checks to the granular permission keys
 * that the UI actually toggles. When `requirePermission('products', 'canView')`
 * is called and the user has no rows in `permissions` or `granular_permissions`
 * with module='products', we fall back to checking these keys.
 *
 * This bridges the gap between the legacy module/action permission model
 * (used by older API middleware) and the granular keyed permission model
 * (used by the UI checkboxes in Settings > Roles & Permissions).
 */
const MODULE_TO_GRANULAR_FALLBACK: Record<string, { canView: string[]; canCreate: string[]; canEdit: string[]; canDelete: string[]; canManage: string[] }> = {
  products: {
    // View: anyone with either the settings catalog view OR the client-products
    // view permission can read the product catalog (needed to assign products
    // to clients). `*.manage` implies view.
    canView: ['settings.products.view', 'settings.products.manage', 'clients.products.view', 'clients.products.manage'],
    // Write actions on the settings catalog are restricted to `settings.products.manage`
    // only. `clients.products.manage` controls client-product assignment, not
    // catalog mutation, so it must NOT grant catalog write access.
    canCreate: ['settings.products.manage'],
    canEdit: ['settings.products.manage'],
    canDelete: ['settings.products.manage'],
    canManage: ['settings.products.manage'],
  },
};

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

const PERMISSION_CACHE_TTL = 30_000;
const permissionCache = new Map<string, { result: boolean; expires: number }>();

function getCachedPermission(key: string): boolean | undefined {
  const entry = permissionCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    permissionCache.delete(key);
    return undefined;
  }
  return entry.result;
}

function setCachedPermission(key: string, result: boolean): void {
  permissionCache.set(key, { result, expires: Date.now() + PERMISSION_CACHE_TTL });
}

export function clearPermissionCache(userId?: string): void {
  if (userId) {
    for (const key of permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        permissionCache.delete(key);
      }
    }
  } else {
    permissionCache.clear();
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of permissionCache) {
    if (now > entry.expires) permissionCache.delete(key);
  }
}, 60_000);

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
    // Client portal session data
    clientPortalUserId?: string;
    clientPortalUser?: {
      id: string;
      email: string;
      name: string;
      clientId: string;
      clientName: string;
    };
    // Impersonation tracking
    originalAdminUserId?: string; // The admin who is impersonating
    impersonatedUserId?: string; // The user being impersonated
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
 * Check if the current session is impersonating another user.
 */
export function isImpersonating(req: Request): boolean {
  return !!(req.session?.originalAdminUserId && req.session?.impersonatedUserId);
}

/**
 * Get the original admin user ID if impersonating, otherwise undefined.
 */
export function getOriginalAdminUserId(req: Request): string | undefined {
  return req.session?.originalAdminUserId;
}

/**
 * Get the impersonation context (who is impersonating whom).
 */
export function getImpersonationContext(req: Request): { originalAdminId: string; impersonatedUserId: string } | null {
  if (isImpersonating(req)) {
    return {
      originalAdminId: req.session!.originalAdminUserId!,
      impersonatedUserId: req.session!.impersonatedUserId!
    };
  }
  return null;
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
  
  const moduleAliases: Record<string, string> = {
    'calendars': 'calendar',
  };
  const normalizedModule = moduleAliases[module] || module;
  const cacheKey = `${userId}:${normalizedModule}:${permission}`;
  const cached = getCachedPermission(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const adminRoles = await db
      .select({ roleId: userRoles.roleId, roleName: roles.name })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(roles.name, 'Admin')
        )
      );
    
    if (adminRoles.length > 0) {
      setCachedPermission(cacheKey, true);
      return true;
    }
    
    const userRolesList = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    
    if (userRolesList.length === 0) {
      setCachedPermission(cacheKey, false);
      return false;
    }
    
    for (const userRole of userRolesList) {
      const granularPerms = await db
        .select({
          module: granularPermissions.module,
          permissionKey: granularPermissions.permissionKey,
          enabled: granularPermissions.enabled
        })
        .from(granularPermissions)
        .where(
          and(
            eq(granularPermissions.roleId, userRole.roleId),
            eq(granularPermissions.module, normalizedModule),
            eq(granularPermissions.enabled, true)
          )
        );
      
      if (granularPerms.length > 0) {
        setCachedPermission(cacheKey, true);
        return true;
      }
    }
    
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
            eq(permissions.module, normalizedModule)
          )
        );
      
      for (const perm of rolePermissions) {
        if (perm[permission] === true) {
          setCachedPermission(cacheKey, true);
          return true;
        }
      }
    }
    
    // Fallback: check granular UI keys mapped to this module/action.
    // This bridges the legacy module/action permission gates (used by older
    // API middleware) to the granular keys that the UI checkboxes actually toggle.
    const fallbackKeys = MODULE_TO_GRANULAR_FALLBACK[normalizedModule]?.[permission];
    if (fallbackKeys && fallbackKeys.length > 0) {
      for (const userRole of userRolesList) {
        const matches = await db
          .select({ id: granularPermissions.id })
          .from(granularPermissions)
          .where(
            and(
              eq(granularPermissions.roleId, userRole.roleId),
              inArray(granularPermissions.permissionKey, fallbackKeys),
              eq(granularPermissions.enabled, true)
            )
          )
          .limit(1);

        if (matches.length > 0) {
          setCachedPermission(cacheKey, true);
          return true;
        }
      }
    }
    
    setCachedPermission(cacheKey, false);
    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Check if user has specific granular sub-permission (e.g., 'training.view_analytics').
 */
export async function hasGranularPermission(
  userId: string,
  permissionKey: string
): Promise<boolean> {
  const cacheKey = `${userId}:granular:${permissionKey}`;
  const cached = getCachedPermission(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const adminRoles = await db
      .select({ roleId: userRoles.roleId, roleName: roles.name })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(roles.name, 'Admin')
        )
      );
    
    if (adminRoles.length > 0) {
      setCachedPermission(cacheKey, true);
      return true;
    }
    
    const userRolesList = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    
    if (userRolesList.length === 0) {
      setCachedPermission(cacheKey, false);
      return false;
    }
    
    for (const userRole of userRolesList) {
      const granularPerms = await db
        .select({
          permissionKey: granularPermissions.permissionKey,
          enabled: granularPermissions.enabled
        })
        .from(granularPermissions)
        .where(
          and(
            eq(granularPermissions.roleId, userRole.roleId),
            eq(granularPermissions.permissionKey, permissionKey),
            eq(granularPermissions.enabled, true)
          )
        );
      
      if (granularPerms.length > 0) {
        setCachedPermission(cacheKey, true);
        return true;
      }
    }
    
    setCachedPermission(cacheKey, false);
    return false;
  } catch (error) {
    console.error('Error checking granular permission:', error);
    return false;
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
 * Middleware to require specific granular permission (e.g., 'training.view_analytics').
 * Must be used AFTER requireAuth().
 */
export function requireGranularPermission(permissionKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = getAuthenticatedUserId(req);
    
    if (!userId) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "Please log in to access this resource"
      });
    }
    
    const allowed = await hasGranularPermission(userId, permissionKey);
    
    if (!allowed) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        message: `You don't have permission to access this resource`
      });
    }
    
    next();
  };
}

/**
 * Middleware to require specific role(s).
 * Must be used AFTER requireAuth().
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = getAuthenticatedUserId(req);
    
    // This should never happen if requireAuth() is used first
    if (!userId) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "Please log in to access this resource"
      });
    }
    
    // Get user's roles from database
    const userRolesList = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    
    // Normalize allowed roles and user roles for case-insensitive comparison
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    const userHasRole = userRolesList.some(userRole => 
      userRole.roleName && normalizedAllowedRoles.includes(userRole.roleName.toLowerCase())
    );
    
    if (!userHasRole) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        message: `This operation requires one of the following roles: ${allowedRoles.join(', ')}`
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
 * In development mode, mock admin user always returns true.
 */
export async function isCurrentUserAdmin(req: Request): Promise<boolean> {
  const userId = getAuthenticatedUserId(req);
  
  console.log('DEBUG isCurrentUserAdmin - userId:', userId);
  
  if (!userId) {
    console.log('DEBUG isCurrentUserAdmin - No userId found');
    return false;
  }
  
  // Development mode bypass - mock admin user is always admin
  if (IS_DEVELOPMENT && userId === MOCK_ADMIN_USER_ID) {
    console.log('🔧 Development mode: Mock admin user detected, granting admin access');
    return true;
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
  
  console.log('DEBUG isCurrentUserAdmin - adminRoles results:', adminRoles);
  console.log('DEBUG isCurrentUserAdmin - adminRoles.length:', adminRoles.length);
  
  return adminRoles.length > 0;
}

/**
 * Middleware for admin-only operations.
 * Requires both authentication and admin privileges.
 */
export function requireAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log('DEBUG requireAdmin - middleware called for:', req.method, req.path);
    
    const userId = getAuthenticatedUserId(req);
    console.log('DEBUG requireAdmin - userId:', userId);
    
    if (!userId) {
      console.log('DEBUG requireAdmin - No userId, returning 401');
      return res.status(401).json({ 
        error: "Authentication required",
        message: "Please log in to access this resource"
      });
    }
    
    const isAdmin = await isCurrentUserAdmin(req);
    console.log('DEBUG requireAdmin - isAdmin result:', isAdmin);
    
    if (!isAdmin) {
      console.log('DEBUG requireAdmin - Not admin, returning 403');
      return res.status(403).json({ 
        error: "Admin access required",
        message: "This operation requires administrator privileges",
        debug: {
          userId: userId,
          hasUserId: !!userId,
          adminCheckResult: isAdmin,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    console.log('DEBUG requireAdmin - Admin check passed, calling next()');
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

/**
 * CLIENT PORTAL AUTHENTICATION FUNCTIONS
 * 
 * Separate authentication system for client portal access.
 * Uses clientPortalUsers table and separate session management.
 */

/**
 * Extract authenticated client portal user ID from request session.
 * Returns client portal user ID or undefined if not authenticated.
 */
export function getAuthenticatedClientPortalUserId(req: Request): string | undefined {
  return req.session?.clientPortalUserId;
}

/**
 * Middleware to require client portal authentication.
 * Returns 401 if no valid client portal session exists.
 * Updates last activity on each authenticated request.
 */
export function requireClientPortalAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const clientPortalUserId = getAuthenticatedClientPortalUserId(req);
    
    if (!clientPortalUserId) {
      return res.status(401).json({ 
        error: "Client portal authentication required",
        message: "Please log in to access your client portal"
      });
    }
    
    // Update last activity for the client portal user
    try {
      const { db } = await import('./db');
      const { clientPortalUsers } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      await db
        .update(clientPortalUsers)
        .set({
          lastLogin: new Date()
        })
        .where(eq(clientPortalUsers.id, clientPortalUserId));
    } catch (error) {
      console.error("Failed to update client portal user last activity:", error);
      // Don't block the request for this error
    }
    
    next();
  };
}

/**
 * Get authenticated client portal user ID with error handling.
 * Returns client portal user ID or throws error with 401 response.
 * Use this in client portal route handlers after requireClientPortalAuth() middleware.
 */
export function getAuthenticatedClientPortalUserIdOrFail(req: Request, res: Response): string | null {
  const clientPortalUserId = getAuthenticatedClientPortalUserId(req);
  
  if (!clientPortalUserId) {
    res.status(401).json({ 
      error: "Client portal authentication required",
      message: "Please log in to access your client portal"
    });
    return null;
  }
  
  return clientPortalUserId;
}