/**
 * Permission Migration Script
 * 
 * Migrates old permission keys to new hierarchical format (module.tab.action)
 * Run this after updating the permission templates to migrate existing data.
 */

import { db } from '../db';
import { granularPermissions, roles } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { PERMISSION_KEY_MIGRATION_MAP, getAllPermissionKeys } from '../../shared/permission-templates';
import { getDefaultPermissionsForRole } from '../../shared/role-templates';

/**
 * Migrate existing permissions from old format to new format
 */
export async function migratePermissions(): Promise<{
  migratedCount: number;
  skippedCount: number;
  errors: string[];
}> {
  const result = {
    migratedCount: 0,
    skippedCount: 0,
    errors: [] as string[],
  };

  try {
    // Get all existing permissions
    const existingPermissions = await db.select().from(granularPermissions);
    
    console.log(`[PermissionMigration] Found ${existingPermissions.length} existing permissions to check`);

    for (const permission of existingPermissions) {
      const oldKey = permission.permissionKey;
      
      // Check if this is an old-format key that needs migration
      if (oldKey in PERMISSION_KEY_MIGRATION_MAP) {
        const newKey = PERMISSION_KEY_MIGRATION_MAP[oldKey];
        
        try {
          // Check if new key already exists for this role
          const existing = await db.select().from(granularPermissions)
            .where(eq(granularPermissions.roleId, permission.roleId))
            .where(eq(granularPermissions.permissionKey, newKey));
          
          if (existing.length > 0) {
            // New key already exists, skip
            result.skippedCount++;
            continue;
          }
          
          // Update the permission key
          await db.update(granularPermissions)
            .set({ 
              permissionKey: newKey,
              module: extractModule(newKey),
              updatedAt: new Date(),
            })
            .where(eq(granularPermissions.id, permission.id));
          
          console.log(`[PermissionMigration] Migrated: ${oldKey} -> ${newKey}`);
          result.migratedCount++;
        } catch (err) {
          const error = `Failed to migrate ${oldKey}: ${err}`;
          console.error(`[PermissionMigration] ${error}`);
          result.errors.push(error);
        }
      } else {
        // Already in new format or unknown key
        result.skippedCount++;
      }
    }

    console.log(`[PermissionMigration] Migration complete: ${result.migratedCount} migrated, ${result.skippedCount} skipped, ${result.errors.length} errors`);
    return result;
  } catch (err) {
    console.error('[PermissionMigration] Migration failed:', err);
    result.errors.push(`Migration failed: ${err}`);
    return result;
  }
}

/**
 * Initialize permissions for a role based on role template
 */
export async function initializeRolePermissions(roleId: string, roleName: string): Promise<void> {
  const defaultPermissions = getDefaultPermissionsForRole(roleName);
  const allPermissionKeys = getAllPermissionKeys();
  
  console.log(`[PermissionInit] Initializing ${allPermissionKeys.length} permissions for role: ${roleName}`);

  for (const key of allPermissionKeys) {
    const isEnabled = defaultPermissions.includes(key);
    const module = extractModule(key);
    
    try {
      // Check if permission already exists
      const existing = await db.select().from(granularPermissions)
        .where(eq(granularPermissions.roleId, roleId))
        .where(eq(granularPermissions.permissionKey, key));
      
      if (existing.length === 0) {
        await db.insert(granularPermissions).values({
          roleId,
          module,
          permissionKey: key,
          enabled: isEnabled,
        });
      }
    } catch (err) {
      console.error(`[PermissionInit] Failed to initialize ${key} for role ${roleName}:`, err);
    }
  }
  
  console.log(`[PermissionInit] Completed initialization for role: ${roleName}`);
}

/**
 * Seed all roles with new permission structure
 */
export async function seedAllRolesWithNewPermissions(): Promise<void> {
  try {
    const allRoles = await db.select().from(roles);
    
    console.log(`[PermissionSeed] Seeding permissions for ${allRoles.length} roles`);
    
    for (const role of allRoles) {
      await initializeRolePermissions(role.id, role.name);
    }
    
    console.log('[PermissionSeed] Completed seeding all roles');
  } catch (err) {
    console.error('[PermissionSeed] Failed to seed roles:', err);
    throw err;
  }
}

/**
 * Extract module name from permission key
 */
function extractModule(key: string): string {
  const parts = key.split('.');
  return parts[0] || 'unknown';
}

/**
 * Check if role has specific permission
 */
export async function hasPermissionForRole(roleId: string, permissionKey: string): Promise<boolean> {
  try {
    const permission = await db.select().from(granularPermissions)
      .where(eq(granularPermissions.roleId, roleId))
      .where(eq(granularPermissions.permissionKey, permissionKey));
    
    return permission.length > 0 && permission[0].enabled === true;
  } catch (err) {
    console.error(`[PermissionCheck] Failed to check permission ${permissionKey}:`, err);
    return false;
  }
}

/**
 * Migrate a single permission key (for backward compatibility in hooks)
 */
export function migratePermissionKey(oldKey: string): string {
  return PERMISSION_KEY_MIGRATION_MAP[oldKey] || oldKey;
}
