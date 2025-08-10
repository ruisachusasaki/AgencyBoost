import { db } from "./db";
import { permissionAuditLogs, permissionChangeHistory, roles, permissions, users } from "../shared/schema";
import type { 
  InsertPermissionAuditLog, 
  InsertPermissionChangeHistory,
  Permission,
  Role 
} from "../shared/schema";
import { eq, desc, and, or, like, count } from "drizzle-orm";

export interface PermissionChange {
  module: string;
  permissionType: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canManage';
  oldValue: boolean | null;
  newValue: boolean;
}

export interface AuditContext {
  performedBy?: string | null;
  performedByName: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export class PermissionAuditService {
  // Risk assessment logic
  private assessRiskLevel(changes: PermissionChange[], auditType: string): string {
    const hasManagePermissions = changes.some(c => c.permissionType === 'canManage' && c.newValue);
    const hasDeletePermissions = changes.some(c => c.permissionType === 'canDelete' && c.newValue);
    const hasMultipleChanges = changes.length > 5;
    const isCriticalModule = changes.some(c => ['settings', 'staff', 'roles'].includes(c.module));
    
    if (auditType === 'role_deleted' || (hasManagePermissions && isCriticalModule)) {
      return 'critical';
    }
    
    if (hasManagePermissions || hasDeletePermissions || hasMultipleChanges) {
      return 'high';
    }
    
    if (changes.length > 2 || isCriticalModule) {
      return 'medium';
    }
    
    return 'low';
  }

  private hasElevatedPermissions(changes: PermissionChange[]): boolean {
    return changes.some(c => 
      (c.permissionType === 'canManage' || c.permissionType === 'canDelete') && c.newValue
    );
  }

  private generateChangesSummary(auditType: string, roleName: string, changes: PermissionChange[], targetUserName?: string): string {
    switch (auditType) {
      case 'role_created':
        return `Created new role "${roleName}" with ${changes.length} permissions configured`;
      
      case 'role_updated':
        const granted = changes.filter(c => c.newValue && !c.oldValue).length;
        const revoked = changes.filter(c => !c.newValue && c.oldValue).length;
        const modified = changes.filter(c => c.oldValue !== null && c.oldValue !== c.newValue).length;
        
        let summary = `Updated role "${roleName}":`;
        if (granted > 0) summary += ` granted ${granted} permissions,`;
        if (revoked > 0) summary += ` revoked ${revoked} permissions,`;
        if (modified > 0) summary += ` modified ${modified} permissions,`;
        return summary.replace(/,$/, '');
      
      case 'role_deleted':
        return `Deleted role "${roleName}" - all associated permissions removed`;
      
      case 'role_assigned':
        return `Assigned role "${roleName}" to user "${targetUserName}"`;
      
      case 'role_unassigned':
        return `Removed role "${roleName}" from user "${targetUserName}"`;
      
      default:
        return `Permission changes made to role "${roleName}"`;
    }
  }

  // Log role creation
  async logRoleCreation(
    role: Role,
    permissions: Permission[],
    context: AuditContext
  ): Promise<string> {
    const changes = this.convertPermissionsToChanges(permissions);
    const changesSummary = this.generateChangesSummary('role_created', role.name, changes);
    
    const auditLog: InsertPermissionAuditLog = {
      auditType: 'role_created',
      roleId: role.id,
      roleName: role.name,
      changesSummary,
      changesCount: changes.length,
      permissionsAfter: this.groupPermissionsByModule(permissions),
      performedBy: context.performedBy || null,
      performedByName: context.performedByName,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      riskLevel: this.assessRiskLevel(changes, 'role_created'),
      isElevatedPermission: this.hasElevatedPermissions(changes),
    };

    const [inserted] = await db.insert(permissionAuditLogs).values(auditLog).returning({ id: permissionAuditLogs.id });
    
    // Log individual permission changes
    await this.logPermissionChanges(inserted.id, changes);
    
    return inserted.id;
  }

  // Log role updates
  async logRoleUpdate(
    role: Role,
    oldPermissions: Permission[],
    newPermissions: Permission[],
    context: AuditContext
  ): Promise<string> {
    const changes = this.calculatePermissionChanges(oldPermissions, newPermissions);
    
    if (changes.length === 0) {
      // No actual permission changes, just metadata update
      return '';
    }

    const changesSummary = this.generateChangesSummary('role_updated', role.name, changes);
    
    const auditLog: InsertPermissionAuditLog = {
      auditType: 'role_updated',
      roleId: role.id,
      roleName: role.name,
      changesSummary,
      changesCount: changes.length,
      permissionsBefore: this.groupPermissionsByModule(oldPermissions),
      permissionsAfter: this.groupPermissionsByModule(newPermissions),
      performedBy: context.performedBy || null,
      performedByName: context.performedByName,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      riskLevel: this.assessRiskLevel(changes, 'role_updated'),
      isElevatedPermission: this.hasElevatedPermissions(changes),
    };

    const [inserted] = await db.insert(permissionAuditLogs).values(auditLog).returning({ id: permissionAuditLogs.id });
    
    // Log individual permission changes
    await this.logPermissionChanges(inserted.id, changes);
    
    return inserted.id;
  }

  // Log role deletion
  async logRoleDeletion(
    role: Role,
    permissions: Permission[],
    context: AuditContext
  ): Promise<string> {
    const changes = this.convertPermissionsToChanges(permissions, true);
    const changesSummary = this.generateChangesSummary('role_deleted', role.name, changes);
    
    const auditLog: InsertPermissionAuditLog = {
      auditType: 'role_deleted',
      roleId: role.id,
      roleName: role.name,
      changesSummary,
      changesCount: changes.length,
      permissionsBefore: this.groupPermissionsByModule(permissions),
      performedBy: context.performedBy || null,
      performedByName: context.performedByName,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      riskLevel: 'critical',
      isElevatedPermission: true,
    };

    const [inserted] = await db.insert(permissionAuditLogs).values(auditLog).returning({ id: permissionAuditLogs.id });
    
    return inserted.id;
  }

  // Log role assignment to user
  async logRoleAssignment(
    role: Role,
    targetUserId: string,
    targetUserName: string,
    context: AuditContext
  ): Promise<string> {
    const auditLog: InsertPermissionAuditLog = {
      auditType: 'role_assigned',
      roleId: role.id,
      roleName: role.name,
      targetUserId,
      targetUserName,
      changesSummary: this.generateChangesSummary('role_assigned', role.name, [], targetUserName),
      changesCount: 0,
      performedBy: context.performedBy || null,
      performedByName: context.performedByName,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      riskLevel: role.name.toLowerCase().includes('admin') ? 'high' : 'medium',
      isElevatedPermission: role.name.toLowerCase().includes('admin'),
    };

    const [inserted] = await db.insert(permissionAuditLogs).values(auditLog).returning({ id: permissionAuditLogs.id });
    
    return inserted.id;
  }

  // Log role removal from user
  async logRoleUnassignment(
    role: Role,
    targetUserId: string,
    targetUserName: string,
    context: AuditContext
  ): Promise<string> {
    const auditLog: InsertPermissionAuditLog = {
      auditType: 'role_unassigned',
      roleId: role.id,
      roleName: role.name,
      targetUserId,
      targetUserName,
      changesSummary: this.generateChangesSummary('role_unassigned', role.name, [], targetUserName),
      changesCount: 0,
      performedBy: context.performedBy || null,
      performedByName: context.performedByName,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      riskLevel: role.name.toLowerCase().includes('admin') ? 'high' : 'medium',
      isElevatedPermission: role.name.toLowerCase().includes('admin'),
    };

    const [inserted] = await db.insert(permissionAuditLogs).values(auditLog).returning({ id: permissionAuditLogs.id });
    
    return inserted.id;
  }

  // Get audit logs with filtering
  async getAuditLogs(filters: {
    roleId?: string;
    userId?: string;
    auditType?: string;
    riskLevel?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    const { roleId, userId, auditType, riskLevel, startDate, endDate, limit = 50, offset = 0 } = filters;
    
    const conditions = [];
    
    if (roleId) conditions.push(eq(permissionAuditLogs.roleId, roleId));
    if (userId) conditions.push(or(
      eq(permissionAuditLogs.performedBy, userId),
      eq(permissionAuditLogs.targetUserId, userId)
    ));
    if (auditType) conditions.push(eq(permissionAuditLogs.auditType, auditType));
    if (riskLevel) conditions.push(eq(permissionAuditLogs.riskLevel, riskLevel));
    if (startDate) conditions.push(eq(permissionAuditLogs.timestamp, startDate));
    if (endDate) conditions.push(eq(permissionAuditLogs.timestamp, endDate));

    const logs = await db
      .select({
        id: permissionAuditLogs.id,
        auditType: permissionAuditLogs.auditType,
        roleId: permissionAuditLogs.roleId,
        roleName: permissionAuditLogs.roleName,
        targetUserId: permissionAuditLogs.targetUserId,
        targetUserName: permissionAuditLogs.targetUserName,
        moduleAffected: permissionAuditLogs.moduleAffected,
        changesSummary: permissionAuditLogs.changesSummary,
        changesCount: permissionAuditLogs.changesCount,
        performedBy: permissionAuditLogs.performedBy,
        performedByName: permissionAuditLogs.performedByName,
        riskLevel: permissionAuditLogs.riskLevel,
        isElevatedPermission: permissionAuditLogs.isElevatedPermission,
        timestamp: permissionAuditLogs.timestamp,
      })
      .from(permissionAuditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(permissionAuditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(permissionAuditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return { logs, total };
  }

  // Get detailed audit log with change history
  async getAuditLogDetails(auditLogId: string) {
    const [auditLog] = await db
      .select()
      .from(permissionAuditLogs)
      .where(eq(permissionAuditLogs.id, auditLogId));

    if (!auditLog) {
      return null;
    }

    const changeHistory = await db
      .select()
      .from(permissionChangeHistory)
      .where(eq(permissionChangeHistory.auditLogId, auditLogId));

    return {
      ...auditLog,
      changeHistory,
    };
  }

  // Helper methods
  private async logPermissionChanges(auditLogId: string, changes: PermissionChange[]) {
    if (changes.length === 0) return;

    const changeRecords: InsertPermissionChangeHistory[] = changes.map(change => ({
      auditLogId,
      module: change.module,
      permissionType: change.permissionType,
      oldValue: change.oldValue,
      newValue: change.newValue,
      changeType: change.oldValue === null ? 'granted' : 
                  change.newValue ? 'granted' : 'revoked',
    }));

    await db.insert(permissionChangeHistory).values(changeRecords);
  }

  private convertPermissionsToChanges(permissions: Permission[], isDeleted = false): PermissionChange[] {
    const changes: PermissionChange[] = [];

    permissions.forEach(perm => {
      const permissionTypes: Array<keyof Pick<Permission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canManage'>> = 
        ['canView', 'canCreate', 'canEdit', 'canDelete', 'canManage'];

      permissionTypes.forEach(type => {
        const value = perm[type];
        if (value || isDeleted) {
          changes.push({
            module: perm.module,
            permissionType: type,
            oldValue: isDeleted ? value : null,
            newValue: isDeleted ? false : !!value,
          });
        }
      });
    });

    return changes;
  }

  private calculatePermissionChanges(oldPermissions: Permission[], newPermissions: Permission[]): PermissionChange[] {
    const changes: PermissionChange[] = [];
    const oldPermMap = new Map(oldPermissions.map(p => [p.module, p]));
    const newPermMap = new Map(newPermissions.map(p => [p.module, p]));

    // Check all modules that exist in either old or new permissions
    const allModules = Array.from(new Set([...Array.from(oldPermMap.keys()), ...Array.from(newPermMap.keys())]));

    allModules.forEach(module => {
      const oldPerm = oldPermMap.get(module);
      const newPerm = newPermMap.get(module);

      const permissionTypes: Array<keyof Pick<Permission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canManage'>> = 
        ['canView', 'canCreate', 'canEdit', 'canDelete', 'canManage'];

      permissionTypes.forEach(type => {
        const oldValue = oldPerm?.[type] ?? false;
        const newValue = newPerm?.[type] ?? false;

        if (oldValue !== newValue) {
          changes.push({
            module,
            permissionType: type,
            oldValue,
            newValue,
          });
        }
      });
    });

    return changes;
  }

  private groupPermissionsByModule(permissions: Permission[]) {
    const grouped: Record<string, any> = {};
    
    permissions.forEach(perm => {
      grouped[perm.module] = {
        canView: perm.canView,
        canCreate: perm.canCreate,
        canEdit: perm.canEdit,
        canDelete: perm.canDelete,
        canManage: perm.canManage,
      };
    });

    return grouped;
  }
}

export const permissionAuditService = new PermissionAuditService();