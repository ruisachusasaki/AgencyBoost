import { useQuery } from "@tanstack/react-query";

/**
 * Permission Key Migration Map (client-side)
 * Maps old permission keys to new hierarchical format
 */
const PERMISSION_KEY_MIGRATION_MAP: Record<string, string> = {
  // Clients module
  'clients.view_list': 'clients.list.view',
  'clients.view_details': 'clients.details.view',
  'clients.manage_clients': 'clients.details.edit',
  'clients.delete_clients': 'clients.list.delete',
  'clients.view_contacts': 'clients.contacts.view',
  'clients.manage_contacts': 'clients.contacts.edit',
  'clients.view_team_assignments': 'clients.team.view',
  'clients.manage_team_assignments': 'clients.team.manage',
  'clients.view_client_briefs': 'clients.briefs.view',
  'clients.manage_client_briefs': 'clients.briefs.edit',
  'clients.view_products': 'clients.products.view',
  'clients.manage_products': 'clients.products.manage',
  'clients.view_billing': 'clients.billing.view',
  'clients.manage_billing': 'clients.billing.edit',
  'clients.export_data': 'clients.list.export',
  
  // Sales module
  'sales.view_pipeline': 'sales.pipeline.view',
  'sales.manage_pipeline': 'sales.pipeline.manage',
  'sales.view_deals': 'sales.deals.view',
  'sales.manage_deals': 'sales.deals.edit',
  'sales.close_deals': 'sales.deals.close',
  'sales.delete_deals': 'sales.deals.delete',
  'sales.view_quotes': 'sales.quotes.view',
  'sales.manage_quotes': 'sales.quotes.edit',
  'sales.approve_quotes': 'sales.quotes.approve',
  'sales.view_reports': 'sales.reports.view',
  'sales.export_data': 'sales.reports.export',
  
  // Tasks module
  'tasks.view_own_tasks': 'tasks.own.view',
  'tasks.view_team_tasks': 'tasks.team.view',
  'tasks.view_all_tasks': 'tasks.all.view',
  'tasks.manage_own_tasks': 'tasks.own.edit',
  'tasks.manage_all_tasks': 'tasks.all.edit',
  'tasks.assign_tasks': 'tasks.team.assign',
  'tasks.delete_tasks': 'tasks.all.delete',
  'tasks.view_comments': 'tasks.comments.view',
  'tasks.manage_comments': 'tasks.comments.edit',
  'tasks.manage_task_templates': 'tasks.templates.manage',
  
  // Leads module
  'leads.view_leads': 'leads.list.view',
  'leads.manage_leads': 'leads.list.edit',
  'leads.delete_leads': 'leads.list.delete',
  'leads.convert_to_client': 'leads.convert.execute',
  'leads.view_lead_sources': 'leads.sources.view',
  'leads.manage_lead_sources': 'leads.sources.manage',
  'leads.export_data': 'leads.list.export',
  
  // Campaigns module
  'campaigns.view_email_templates': 'campaigns.email_templates.view',
  'campaigns.manage_email_templates': 'campaigns.email_templates.edit',
  'campaigns.view_sms_templates': 'campaigns.sms_templates.view',
  'campaigns.manage_sms_templates': 'campaigns.sms_templates.edit',
  'campaigns.send_emails': 'campaigns.send.email',
  'campaigns.send_sms': 'campaigns.send.sms',
  'campaigns.view_scheduled_emails': 'campaigns.scheduled.view',
  'campaigns.manage_scheduled_emails': 'campaigns.scheduled.manage',
  'campaigns.view_forms': 'campaigns.forms.view',
  'campaigns.manage_forms': 'campaigns.forms.edit',
  'campaigns.view_form_submissions': 'campaigns.forms.view_submissions',
  
  // Workflows module
  'workflows.view_workflows': 'workflows.list.view',
  'workflows.manage_workflows': 'workflows.list.edit',
  'workflows.activate_workflows': 'workflows.activation.toggle',
  'workflows.view_execution_logs': 'workflows.logs.view',
  'workflows.view_triggers': 'workflows.triggers.view',
  'workflows.manage_triggers': 'workflows.triggers.manage',
  
  // Calendar module
  'calendar.view_own_calendar': 'calendar.own.view',
  'calendar.view_team_calendars': 'calendar.team.view',
  'calendar.view_all_calendars': 'calendar.all.view',
  'calendar.manage_own_events': 'calendar.own.manage',
  'calendar.manage_all_events': 'calendar.all.manage',
  'calendar.view_appointments': 'calendar.appointments.view',
  'calendar.manage_appointments': 'calendar.appointments.edit',
  
  // HR module
  'hr.view_staff_directory': 'hr.staff.view',
  'hr.manage_staff': 'hr.staff.edit',
  'hr.view_time_off_requests': 'hr.time_off.view_all',
  'hr.manage_time_off_requests': 'hr.time_off.approve',
  'hr.view_job_applications': 'hr.applications.view',
  'hr.manage_job_applications': 'hr.applications.manage',
  'hr.view_job_openings': 'hr.job_openings.view',
  'hr.manage_job_openings': 'hr.job_openings.edit',
  'hr.view_expense_reports': 'hr.expenses.view_all',
  'hr.manage_expense_reports': 'hr.expenses.approve',
  
  // Training module
  'training.view_courses': 'training.courses.view',
  'training.manage_courses': 'training.courses.edit',
  'training.view_lessons': 'training.lessons.view',
  'training.manage_lessons': 'training.lessons.edit',
  'training.view_assignments': 'training.assignments.view',
  'training.manage_assignments': 'training.assignments.grade',
  'training.view_progress': 'training.progress.view_own',
  'training.view_analytics': 'training.analytics.view',
  
  // Knowledge Base module
  'knowledge_base.view_articles': 'knowledge_base.articles.view',
  'knowledge_base.manage_articles': 'knowledge_base.articles.edit',
  'knowledge_base.view_categories': 'knowledge_base.categories.view',
  'knowledge_base.manage_categories': 'knowledge_base.categories.manage',
  'knowledge_base.view_comments': 'knowledge_base.comments.view',
  'knowledge_base.manage_comments': 'knowledge_base.comments.moderate',
  
  // Reports module
  'reports.view_sales_reports': 'reports.sales.view',
  'reports.view_client_reports': 'reports.clients.view',
  'reports.view_pipeline_reports': 'reports.pipeline.view',
  'reports.view_team_reports': 'reports.team.view',
  'reports.view_1on1_performance': 'reports.one_on_one.view',
  'reports.view_cost_per_client': 'reports.cost_per_client.view',
  'reports.export_reports': 'reports.sales.export',
  
  // Settings module
  'settings.view_general_settings': 'settings.business_profile.view',
  'settings.manage_general_settings': 'settings.business_profile.manage',
  'settings.view_roles_permissions': 'settings.roles_permissions.view',
  'settings.manage_roles_permissions': 'settings.roles_permissions.manage',
  'settings.view_custom_fields': 'settings.custom_fields.view',
  'settings.manage_custom_fields': 'settings.custom_fields.manage',
  'settings.view_integrations': 'settings.integrations.view',
  'settings.manage_integrations': 'settings.integrations.manage',
  'settings.view_staff': 'settings.staff.view',
  'settings.manage_staff': 'settings.staff.manage',
  'settings.view_px_settings': 'settings.px_settings.view',
  'settings.manage_px_settings': 'settings.px_settings.manage',
  'settings.view_clients': 'settings.clients.view',
  'settings.manage_clients': 'settings.clients.manage',
  'settings.view_sales': 'settings.sales.view',
  'settings.manage_sales': 'settings.sales.manage',
  'settings.view_leads': 'settings.leads.view',
  'settings.manage_leads': 'settings.leads.manage',
  'settings.view_calendar': 'settings.calendar.view',
  'settings.manage_calendar': 'settings.calendar.manage',
  'settings.view_ai_assistant': 'settings.ai_assistant.view',
  'settings.manage_ai_assistant': 'settings.ai_assistant.manage',
  'settings.view_tags': 'settings.tags.view',
  'settings.manage_tags': 'settings.tags.manage',
  'settings.view_products': 'settings.products.view',
  'settings.manage_products': 'settings.products.manage',
  'settings.view_tasks': 'settings.tasks.view',
  'settings.manage_tasks': 'settings.tasks.manage',
  'settings.view_workflows': 'settings.workflows.view',
  'settings.manage_workflows': 'settings.workflows.manage',
  'settings.view_audit_logs': 'settings.audit_logs.view',
  'settings.manage_audit_logs': 'settings.audit_logs.manage',
  'settings.view_tickets': 'settings.tickets.view',
  'settings.manage_tickets': 'settings.tickets.manage',
  'settings.view_permission_audit': 'settings.permission_audit.view',
  'settings.manage_permission_audit': 'settings.permission_audit.manage',
};

/**
 * Normalize permission key - converts old format to new format if needed
 * Exported for use by RequirePermission component
 */
export function normalizePermissionKey(key: string): string {
  return PERMISSION_KEY_MIGRATION_MAP[key] || key;
}

/**
 * Check if key matches permission (handles both old and new formats)
 * Exported for use by RequirePermission component
 */
export function permissionMatches(storedKey: string, requestedKey: string): boolean {
  const normalizedStored = normalizePermissionKey(storedKey);
  const normalizedRequested = normalizePermissionKey(requestedKey);
  return normalizedStored === normalizedRequested;
}

interface GranularPermissionFromAPI {
  module: string;
  permissionKey: string;
  enabled: boolean;
}

interface CurrentUser {
  id: string;
  role: string;
  granularPermissions?: GranularPermissionFromAPI[];
  permissions?: Array<{
    module: string;
    canView?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canManage?: boolean;
  }>;
}

/**
 * Hook to check if current user has a specific permission
 * Supports both old format ("clients.view_list") and new format ("clients.list.view")
 * @param permissionKey - Either a module name ("hr") or a specific permission key
 * @returns Object with hasPermission boolean and isLoading state
 */
export function useHasPermission(permissionKey: string) {
  const { data: currentUser, isLoading } = useQuery<CurrentUser>({
    queryKey: ['/api/auth/current-user'],
    retry: false,
  });

  if (isLoading) {
    return { hasPermission: false, isLoading: true };
  }

  if (!currentUser) {
    return { hasPermission: false, isLoading: false };
  }

  // Admin role has all permissions
  if (currentUser.role === 'Admin' || currentUser.role === 'admin') {
    return { hasPermission: true, isLoading: false };
  }

  // Normalize the requested permission key
  const normalizedKey = normalizePermissionKey(permissionKey);

  // Check granular permissions from API (flat array format)
  if (currentUser.granularPermissions && currentUser.granularPermissions.length > 0) {
    if (permissionKey.includes('.')) {
      const hasGranular = currentUser.granularPermissions.some(
        (gp) => gp.enabled === true && permissionMatches(gp.permissionKey, permissionKey)
      );
      if (hasGranular) return { hasPermission: true, isLoading: false };
    } else {
      const hasModulePermission = currentUser.granularPermissions.some(
        (gp) => gp.enabled === true && (
          gp.module === permissionKey ||
          gp.permissionKey === `${permissionKey}.access`
        )
      );
      if (hasModulePermission) return { hasPermission: true, isLoading: false };
    }
  }

  // Fallback to legacy permissions (always check, even if granular permissions exist but didn't match)
  if (currentUser.permissions) {
    const legacyModule = permissionKey.includes('.') ? permissionKey.split('.')[0] : permissionKey;
    const permission = currentUser.permissions.find((p) => p.module === legacyModule);
    if (permission?.canView === true) {
      return { hasPermission: true, isLoading: false };
    }
  }

  return { hasPermission: false, isLoading: false };
}

/**
 * Hook to check multiple permissions at once
 * Supports both old format and new format permission keys
 * Returns an object with each permission key mapped to its boolean value
 */
export function useHasPermissions(permissionKeys: string[]) {
  const { data: currentUser, isLoading } = useQuery<CurrentUser>({
    queryKey: ['/api/auth/current-user'],
    retry: false,
  });

  const permissions: Record<string, boolean> = {};
  
  for (const key of permissionKeys) {
    permissions[key] = false;
  }

  if (isLoading) {
    return { permissions, isLoading: true };
  }

  if (!currentUser) {
    return { permissions, isLoading: false };
  }

  // Admin role has all permissions
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'admin';
  
  for (const permissionKey of permissionKeys) {
    if (isAdmin) {
      permissions[permissionKey] = true;
      continue;
    }

    // Check granular permissions from API (flat array format)
    if (currentUser.granularPermissions && currentUser.granularPermissions.length > 0) {
      if (permissionKey.includes('.')) {
        // Check for specific permission key (try both old and new formats)
        permissions[permissionKey] = currentUser.granularPermissions.some(
          (gp) => gp.enabled === true && permissionMatches(gp.permissionKey, permissionKey)
        );
      } else {
        // Check for module-level access
        permissions[permissionKey] = currentUser.granularPermissions.some(
          (gp) => gp.enabled === true && (
            gp.module === permissionKey ||
            gp.permissionKey === `${permissionKey}.access`
          )
        );
      }
    }

    // Fallback to legacy permissions if not found
    if (!permissions[permissionKey] && currentUser.permissions) {
      const legacyModule = permissionKey.includes('.') ? permissionKey.split('.')[0] : permissionKey;
      const permission = currentUser.permissions.find((p) => p.module === legacyModule);
      if (permission?.canView === true) {
        permissions[permissionKey] = true;
      }
    }
  }

  return { permissions, isLoading: false };
}

/**
 * Get current user data with permissions
 */
export function useCurrentUser() {
  const { data: currentUser, isLoading, error } = useQuery<CurrentUser>({
    queryKey: ['/api/auth/current-user'],
    retry: false,
  });

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'manager';
  const isAccounting = currentUser?.role === 'Accounting' || currentUser?.role === 'accounting';

  return { currentUser, isLoading, error, isAdmin, isManager, isAccounting };
}

/**
 * Hook for semantic permission checks that replaces hardcoded role checks.
 * 
 * Purpose:
 * - Provides clean abstraction layer over role-based permissions
 * - Centralizes permission logic for UI controls
 * - Can be extended to use granular permissions in the future
 * 
 * Usage:
 * const { canEditAllTimeEntries, canManageArticles } = useRolePermissions();
 * if (canEditAllTimeEntries) { ... }
 * 
 * Implementation:
 * Currently uses role-based checks (Admin, Manager, Accounting) aligned with role templates.
 * These flags provide semantic meaning for UI controls and can be migrated to
 * granular permission checks without changing component code.
 * 
 * Backend enforcement:
 * Backend routes use isCurrentUserAdmin() and hasPermission() for authorization.
 * This hook only controls UI visibility - actual security is enforced server-side.
 */
export function useRolePermissions() {
  const { currentUser, isLoading, isAdmin, isManager, isAccounting } = useCurrentUser();
  
  const hasGranularPermission = (permKey: string): boolean => {
    if (isAdmin) return true;
    if (!currentUser?.granularPermissions) return false;
    return currentUser.granularPermissions.some(
      (gp) => gp.enabled === true && permissionMatches(gp.permissionKey, permKey)
    );
  };

  // Semantic permission flags aligned with role templates
  // These replace hardcoded role checks throughout the frontend
  return {
    isLoading,
    currentUser,
    isAdmin,
    isManager,
    isAccounting,
    
    // Time entry editing - based on granular permission reports.timesheet.edit_all
    canEditAllTimeEntries: isAdmin || isManager || hasGranularPermission('reports.timesheet.edit_all'),
    
    // Manual time logging - Admin and Manager can add manual time
    canAddManualTime: isAdmin || isManager,
    
    // Task template management - Admin and Manager, or with specific permission
    canManageTaskTemplates: isAdmin || isManager,
    
    // Smart list management - Admin can manage universal lists
    canManageUniversalSmartLists: isAdmin,
    
    // Article management - Admin and Manager can manage articles
    canManageArticles: isAdmin || isManager,
    
    // Workflow management - Admin can manage all workflows
    canManageAllWorkflows: isAdmin,
    
    // HR data access - Admin can view all HR data
    canViewAllHrData: isAdmin,
    
    // Calendar settings access
    canAccessCalendarSettings: isAdmin,
    
    // Expense approvals - Admin or Accounting can approve
    canApproveExpenses: isAdmin || isAccounting,
    
    // 1-on-1 meeting reports - Admin or Manager can view
    canView1on1Reports: isAdmin || isManager,
    
    // Timesheet viewing/editing - based on granular permission reports.timesheet.view_all
    canEditOthersTimesheets: isAdmin || isManager || hasGranularPermission('reports.timesheet.view_all'),
    
    // Export admin reports
    canExportAdminReports: isAdmin,
    
    // Settings access
    canAccessSettings: isAdmin,
    
    // Impersonation
    canImpersonate: isAdmin,
    
    // Workflow template management - Admin or Manager
    canManageWorkflowTemplates: isAdmin || isManager,
    
    // Team deletion - Admin only
    canDeleteTeams: isAdmin,
    
    // Combined role check - Admin or Manager
    isAdminOrManager: isAdmin || isManager,
    
    // Client-related permissions
    canDeleteRoadmapEntries: isAdmin,
    canManageClientNotes: isAdmin,
    canDeleteDocuments: isAdmin,
    canViewCosts: isAdmin || isManager,
    canManageDndSettings: isAdmin,
    canDeleteProducts: isAdmin || isAccounting || isManager,
  };
}
