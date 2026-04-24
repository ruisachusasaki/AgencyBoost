/**
 * Role Templates with Default Permissions
 * 
 * Defines default permission sets for each role type.
 * These templates are used when creating new users or roles.
 */

import { getAllPermissionKeys } from './permission-templates';

export interface RoleTemplate {
  role: string;
  label: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

/**
 * Admin Role - Full access to everything
 */
export const ADMIN_PERMISSIONS: string[] = getAllPermissionKeys();

/**
 * Manager Role - Can manage teams and view most data
 */
export const MANAGER_PERMISSIONS: string[] = [
  // Module access
  'clients.access',
  'sales.access',
  'tasks.access',
  'leads.access',
  'campaigns.access',
  'workflows.access',
  'calendar.access',
  'hr.access',
  'training.access',
  'knowledge_base.access',
  'reports.access',
  'settings.access',
  
  // Clients - full view, limited manage
  'clients.list.view',
  'clients.list.create',
  'clients.list.export',
  'clients.details.view',
  'clients.details.edit',
  'clients.contacts.view',
  'clients.contacts.create',
  'clients.contacts.edit',
  'clients.team.view',
  'clients.team.manage',
  'clients.briefs.view',
  'clients.briefs.create',
  'clients.briefs.edit',
  'clients.products.view',
  'clients.products.manage',
  'clients.billing.view',
  'clients.assets.view',
  'clients.assets.upload',
  'clients.assets.approve',
  'clients.smart_lists.view',
  'clients.smart_lists.create',
  'clients.smart_lists.edit',
  
  // Sales - full view, manage own deals
  'sales.pipeline.view',
  'sales.pipeline.manage',
  'sales.deals.view',
  'sales.deals.create',
  'sales.deals.edit',
  'sales.deals.close',
  'sales.quotes.view',
  'sales.quotes.create',
  'sales.quotes.edit',
  'sales.quotes.send',
  'sales.reports.view',
  'sales.reports.export',
  
  // Tasks - full access to team tasks
  'tasks.own.view',
  'tasks.own.create',
  'tasks.own.edit',
  'tasks.own.delete',
  'tasks.team.view',
  'tasks.team.assign',
  'tasks.all.view',
  'tasks.all.create',
  'tasks.all.edit',
  'tasks.comments.view',
  'tasks.comments.create',
  'tasks.comments.edit',
  'tasks.templates.view',
  'tasks.templates.manage',
  'tasks.time_entries.view_own',
  'tasks.time_entries.view_all',
  'tasks.time_entries.create',
  'tasks.time_entries.edit_own',
  'tasks.time_entries.edit_all',
  
  // Leads - full access
  'leads.list.view',
  'leads.list.create',
  'leads.list.edit',
  'leads.list.export',
  'leads.details.view',
  'leads.details.edit',
  'leads.convert.execute',
  'leads.sources.view',
  'leads.calling.make_calls',
  'leads.calling.view_history',
  
  // Campaigns - view and use
  'campaigns.email_templates.view',
  'campaigns.email_templates.create',
  'campaigns.email_templates.edit',
  'campaigns.sms_templates.view',
  'campaigns.sms_templates.create',
  'campaigns.sms_templates.edit',
  'campaigns.send.email',
  'campaigns.send.sms',
  'campaigns.scheduled.view',
  'campaigns.scheduled.manage',
  'campaigns.forms.view',
  'campaigns.forms.create',
  'campaigns.forms.edit',
  'campaigns.forms.view_submissions',
  
  // Workflows - view only
  'workflows.list.view',
  'workflows.logs.view',
  'workflows.triggers.view',
  
  // Calendar - team access
  'calendar.own.view',
  'calendar.own.manage',
  'calendar.team.view',
  'calendar.appointments.view',
  'calendar.appointments.create',
  'calendar.appointments.edit',
  
  // HR - manage direct reports
  'hr.dashboard.view',
  'hr.staff.view',
  'hr.time_off.view_own',
  'hr.time_off.view_team',
  'hr.time_off.create',
  'hr.time_off.approve',
  'hr.job_openings.view',
  'hr.job_openings.create',
  'hr.job_openings.edit',
  'hr.applications.view',
  'hr.applications.manage',
  'hr.onboarding.view',
  'hr.onboarding.manage',
  'hr.offboarding.view',
  'hr.expenses.view_own',
  'hr.expenses.create',
  'hr.one_on_one.view_own',
  'hr.one_on_one.create',
  'hr.one_on_one.manage',
  'hr.px_meetings.view',
  'hr.px_meetings.create',
  'hr.px_meetings.manage',
  'hr.org_chart.view',
  'hr.approval_board.view',
  'hr.approval_board.approve',
  
  // Training - full view, manage own
  'training.courses.view',
  'training.lessons.view',
  'training.assignments.view',
  'training.assignments.create',
  'training.assignments.grade',
  'training.progress.view_own',
  'training.progress.view_all',
  'training.analytics.view',
  
  // Knowledge Base - full access
  'knowledge_base.articles.view',
  'knowledge_base.articles.create',
  'knowledge_base.articles.edit',
  'knowledge_base.articles.publish',
  'knowledge_base.categories.view',
  'knowledge_base.categories.manage',
  'knowledge_base.comments.view',
  'knowledge_base.comments.create',
  'knowledge_base.comments.moderate',
  
  // Reports - full view
  'reports.sales.view',
  'reports.sales.export',
  'reports.clients.view',
  'reports.clients.export',
  'reports.pipeline.view',
  'reports.team.view',
  'reports.timesheet.view_own',
  'reports.timesheet.view_all',
  'reports.timesheet.edit_all',
  'reports.timesheet.export',
  'reports.one_on_one.view',
  
  // Settings - view and manage for all 17 settings boxes (My Profile has no permission)
  'settings.business_profile.view',
  'settings.business_profile.manage',
  'settings.staff.view',
  'settings.staff.manage',
  'settings.px_settings.view',
  'settings.px_settings.manage',
  'settings.clients.view',
  'settings.clients.manage',
  'settings.sales.view',
  'settings.sales.manage',
  'settings.leads.view',
  'settings.leads.manage',
  'settings.roles_permissions.view',
  'settings.roles_permissions.manage',
  'settings.permission_audit.view',
  'settings.permission_audit.manage',
  'settings.calendar.view',
  'settings.calendar.manage',
  'settings.integrations.view',
  'settings.integrations.manage',
  'settings.ai_assistant.view',
  'settings.ai_assistant.manage',
  'settings.custom_fields.view',
  'settings.custom_fields.manage',
  'settings.tags.view',
  'settings.tags.manage',
  'settings.products.view',
  'settings.products.manage',
  'settings.tasks.view',
  'settings.tasks.manage',
  'settings.workflows.view',
  'settings.workflows.manage',
  'settings.audit_logs.view',
  'settings.audit_logs.manage',
  'settings.email_logging.view',
  'settings.email_logging.manage',
];

/**
 * Accounting Role - Financial focus
 */
export const ACCOUNTING_PERMISSIONS: string[] = [
  // Module access
  'clients.access',
  'sales.access',
  'reports.access',
  'hr.access',
  'settings.access',
  
  // Clients - billing focus
  'clients.list.view',
  'clients.list.export',
  'clients.details.view',
  'clients.billing.view',
  'clients.billing.edit',
  'clients.products.view',
  
  // Sales - quotes and reports
  'sales.pipeline.view',
  'sales.deals.view',
  'sales.quotes.view',
  'sales.quotes.approve',
  'sales.reports.view',
  'sales.reports.export',
  
  // HR - expenses
  'hr.expenses.view_own',
  'hr.expenses.view_all',
  'hr.expenses.create',
  'hr.expenses.approve',
  
  // Reports - financial focus
  'reports.sales.view',
  'reports.sales.export',
  'reports.clients.view',
  'reports.clients.export',
  'reports.pipeline.view',
  'reports.timesheet.view_all',
  'reports.timesheet.export',
  'reports.cost_per_client.view',
  
  // Settings - view only for financial relevant sections
  'settings.business_profile.view',
  'settings.products.view',
  'settings.sales.view',
];

/**
 * User Role - Basic access
 */
export const USER_PERMISSIONS: string[] = [
  // Module access
  'clients.access',
  'tasks.access',
  'calendar.access',
  'hr.access',
  'training.access',
  'knowledge_base.access',
  
  // Clients - view only
  'clients.list.view',
  'clients.details.view',
  'clients.contacts.view',
  'clients.team.view',
  'clients.briefs.view',
  'clients.products.view',
  'clients.assets.view',
  'clients.assets.upload',
  'clients.smart_lists.view',
  
  // Tasks - own tasks only
  'tasks.own.view',
  'tasks.own.create',
  'tasks.own.edit',
  'tasks.comments.view',
  'tasks.comments.create',
  'tasks.templates.view',
  'tasks.time_entries.view_own',
  'tasks.time_entries.create',
  'tasks.time_entries.edit_own',
  
  // Calendar - own only
  'calendar.own.view',
  'calendar.own.manage',
  'calendar.appointments.view',
  'calendar.appointments.create',
  
  // HR - basic self-service
  'hr.staff.view',
  'hr.time_off.view_own',
  'hr.time_off.create',
  'hr.expenses.view_own',
  'hr.expenses.create',
  'hr.one_on_one.view_own',
  'hr.org_chart.view',
  
  // Training - view and progress
  'training.courses.view',
  'training.lessons.view',
  'training.assignments.view',
  'training.progress.view_own',
  
  // Knowledge Base - read and comment
  'knowledge_base.articles.view',
  'knowledge_base.categories.view',
  'knowledge_base.comments.view',
  'knowledge_base.comments.create',
];

/**
 * Role templates with all default permissions
 */
export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    role: 'Admin',
    label: 'Administrator',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: ADMIN_PERMISSIONS,
  },
  {
    role: 'Manager',
    label: 'Manager',
    description: 'Team management with broad access',
    isSystem: true,
    permissions: MANAGER_PERMISSIONS,
  },
  {
    role: 'Accounting',
    label: 'Accounting',
    description: 'Financial operations focus',
    isSystem: true,
    permissions: ACCOUNTING_PERMISSIONS,
  },
  {
    role: 'User',
    label: 'User',
    description: 'Basic user access',
    isSystem: true,
    permissions: USER_PERMISSIONS,
  },
];

/**
 * Get role template by role name
 */
export function getRoleTemplate(role: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find(t => t.role.toLowerCase() === role.toLowerCase());
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissionsForRole(role: string): string[] {
  const template = getRoleTemplate(role);
  return template?.permissions || USER_PERMISSIONS;
}

/**
 * Check if a role has a specific permission by default
 */
export function roleHasDefaultPermission(role: string, permissionKey: string): boolean {
  const permissions = getDefaultPermissionsForRole(role);
  return permissions.includes(permissionKey);
}

/**
 * Get all system roles
 */
export function getSystemRoles(): string[] {
  return ROLE_TEMPLATES.filter(t => t.isSystem).map(t => t.role);
}
