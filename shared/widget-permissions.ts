/**
 * Widget Permission Mapping
 * 
 * Maps dashboard widget types to the required permissions.
 * If a user doesn't have the required permission(s), the widget
 * will not be available to add to their dashboard.
 * 
 * Permission check logic:
 * - If requiredPermissions is empty/undefined, widget is available to all users
 * - If requiredPermissions contains multiple keys, user needs ANY of them (OR logic)
 * - Admin users bypass all permission checks
 * - Unknown widget types are DENIED by default for security
 */

import { PERMISSION_KEY_MIGRATION_MAP } from './permission-templates';

/**
 * Normalize permission key to handle both old and new formats
 */
function normalizePermissionKey(key: string): string {
  return PERMISSION_KEY_MIGRATION_MAP[key] || key;
}

/**
 * Check if a user's permission matches a required permission
 * Handles both old format ("clients.view_list") and new format ("clients.list.view")
 */
function permissionMatches(userPermission: string, requiredPermission: string): boolean {
  const normalizedUser = normalizePermissionKey(userPermission);
  const normalizedRequired = normalizePermissionKey(requiredPermission);
  return normalizedUser === normalizedRequired;
}

export interface WidgetPermissionConfig {
  widgetType: string;
  requiredPermissions: string[];
  description?: string;
}

/**
 * Widget to Permission Mapping
 * 
 * Each entry maps a widget type to the permission(s) required to access it.
 * Using OR logic: user needs at least one of the listed permissions.
 */
export const WIDGET_PERMISSION_MAP: WidgetPermissionConfig[] = [
  // Client Management Widgets
  {
    widgetType: 'client_health_overview',
    requiredPermissions: ['clients.list.view', 'clients.details.view'],
    description: 'View client health scores and overview',
  },
  {
    widgetType: 'recent_clients',
    requiredPermissions: ['clients.list.view'],
    description: 'View recently added/updated clients',
  },
  {
    widgetType: 'client_approval_queue',
    requiredPermissions: ['clients.assets.view', 'clients.assets.approve'],
    description: 'View and manage asset approvals',
  },
  {
    widgetType: 'client_distribution_by_vertical',
    requiredPermissions: ['clients.list.view'],
    description: 'View client distribution by industry vertical',
  },
  {
    widgetType: 'client_portal_activity',
    requiredPermissions: ['clients.details.view'],
    description: 'View client portal activity',
  },
  {
    widgetType: 'client_team_assignments',
    requiredPermissions: ['clients.team.view'],
    description: 'View team member assignments to clients',
  },

  // Sales & Revenue Widgets
  {
    widgetType: 'sales_pipeline_overview',
    requiredPermissions: ['sales.pipeline.view'],
    description: 'View sales pipeline overview',
  },
  {
    widgetType: 'quote_status_summary',
    requiredPermissions: ['sales.quotes.view'],
    description: 'View quote status breakdown',
  },
  {
    widgetType: 'revenue_this_month',
    requiredPermissions: ['sales.reports.view', 'clients.billing.view'],
    description: 'View monthly revenue metrics',
  },
  {
    widgetType: 'mrr_tracker',
    requiredPermissions: ['sales.reports.view', 'clients.billing.view'],
    description: 'Track monthly recurring revenue',
  },
  {
    widgetType: 'win_rate',
    requiredPermissions: ['sales.reports.view', 'sales.deals.view'],
    description: 'View deal win rate analytics',
  },
  {
    widgetType: 'top_performing_sales_reps',
    requiredPermissions: ['sales.reports.view'],
    description: 'View top performing sales representatives',
  },
  {
    widgetType: 'recent_deals_won',
    requiredPermissions: ['sales.deals.view'],
    description: 'View recently closed deals',
  },

  // Task Widgets
  {
    widgetType: 'my_tasks',
    requiredPermissions: ['tasks.own.view'],
    description: 'View your assigned tasks',
  },
  {
    widgetType: 'overdue_tasks',
    requiredPermissions: ['tasks.own.view', 'tasks.list.view'],
    description: 'View overdue tasks',
  },
  {
    widgetType: 'tasks_due_this_week',
    requiredPermissions: ['tasks.own.view', 'tasks.list.view'],
    description: 'View tasks due this week',
  },
  {
    widgetType: 'task_completion_rate',
    requiredPermissions: ['tasks.list.view'],
    description: 'View task completion analytics',
  },
  {
    widgetType: 'tasks_requiring_approval',
    requiredPermissions: ['tasks.list.approve'],
    description: 'View tasks pending approval',
  },
  {
    widgetType: 'tasks_by_status',
    requiredPermissions: ['tasks.list.view'],
    description: 'View tasks grouped by status',
  },
  {
    widgetType: 'time_tracked_this_week',
    requiredPermissions: ['tasks.own.view'],
    description: 'View time tracking summary',
  },
  {
    widgetType: 'team_workload',
    requiredPermissions: ['tasks.list.view', 'reports.workload.view'],
    description: 'View team workload distribution',
  },

  // Lead Management Widgets
  {
    widgetType: 'new_leads_today_week',
    requiredPermissions: ['leads.list.view'],
    description: 'View new leads today/this week',
  },
  {
    widgetType: 'leads_by_pipeline_stage',
    requiredPermissions: ['leads.pipeline.view'],
    description: 'View leads by pipeline stage',
  },
  {
    widgetType: 'my_assigned_leads',
    requiredPermissions: ['leads.list.view'],
    description: 'View your assigned leads',
  },
  {
    widgetType: 'stale_leads',
    requiredPermissions: ['leads.list.view'],
    description: 'View inactive/stale leads',
  },
  {
    widgetType: 'lead_conversion_rate',
    requiredPermissions: ['leads.reports.view', 'leads.list.view'],
    description: 'View lead conversion analytics',
  },
  {
    widgetType: 'lead_source_breakdown',
    requiredPermissions: ['leads.reports.view', 'leads.list.view'],
    description: 'View leads by source',
  },

  // HR & Team Widgets
  {
    widgetType: 'pending_time_off_requests',
    requiredPermissions: ['hr.timeoff.approve'],
    description: 'View pending time off requests for approval',
  },
  {
    widgetType: 'whos_off_today_week',
    requiredPermissions: [], // All staff can see who's off
    description: 'View team members on PTO',
  },
  {
    widgetType: 'new_job_applications',
    requiredPermissions: ['hr.hiring.view', 'hr.hiring.manage'],
    description: 'View new job applications',
  },
  {
    widgetType: 'onboarding_queue',
    requiredPermissions: ['hr.hiring.view', 'hr.hiring.manage'],
    description: 'View onboarding queue',
  },
  {
    widgetType: 'pending_expense_reports',
    requiredPermissions: ['hr.expenses.approve'],
    description: 'View pending expense reports for approval',
  },
  {
    widgetType: 'team_capacity_alerts',
    requiredPermissions: ['hr.hiring.view', 'reports.workload.view'],
    description: 'View team capacity predictions',
  },
  {
    widgetType: 'team_birthday_anniversary',
    requiredPermissions: [], // All staff can see celebrations
    description: 'View upcoming birthdays and anniversaries',
  },
  {
    widgetType: 'training_completion_status',
    requiredPermissions: ['hr.training.view', 'hr.training.manage'],
    description: 'View training completion rates',
  },

  // Calendar & Appointments Widgets
  {
    widgetType: 'todays_appointments',
    requiredPermissions: ['calendar.appointments.view'],
    description: 'View today\'s scheduled appointments',
  },
  {
    widgetType: 'upcoming_appointments',
    requiredPermissions: ['calendar.appointments.view'],
    description: 'View upcoming appointments',
  },
  {
    widgetType: 'appointment_no_shows',
    requiredPermissions: ['calendar.appointments.view'],
    description: 'View missed appointments',
  },
  {
    widgetType: 'overdue_appointments',
    requiredPermissions: ['calendar.appointments.view'],
    description: 'View overdue appointments',
  },

  // Activity & Alerts Widgets
  {
    widgetType: 'my_mentions',
    requiredPermissions: [], // All users can see their own mentions
    description: 'View comments and tasks where you\'re mentioned',
  },
  {
    widgetType: 'system_alerts',
    requiredPermissions: [], // All users can see their own alerts
    description: 'View system notifications and alerts',
  },
];

/**
 * Get the permission requirements for a specific widget type
 * @returns Permission config or undefined if widget type is not mapped
 */
export function getWidgetPermissions(widgetType: string): WidgetPermissionConfig | undefined {
  return WIDGET_PERMISSION_MAP.find(w => w.widgetType === widgetType);
}

/**
 * Check if a widget type exists in the permission map
 */
export function isKnownWidgetType(widgetType: string): boolean {
  return WIDGET_PERMISSION_MAP.some(w => w.widgetType === widgetType);
}

/**
 * Get all known widget types
 */
export function getAllKnownWidgetTypes(): string[] {
  return WIDGET_PERMISSION_MAP.map(w => w.widgetType);
}

/**
 * Check if a user has permission to access a widget
 * @param widgetType - The widget type to check
 * @param userPermissions - Array of permission keys the user has
 * @param isAdmin - Whether the user is an admin (bypasses all checks)
 * @returns true if user can access the widget
 * 
 * Security: Unknown widget types are DENIED by default
 */
export function canAccessWidget(
  widgetType: string,
  userPermissions: string[],
  isAdmin: boolean = false
): boolean {
  // Admin bypasses all permission checks
  if (isAdmin) {
    return true;
  }

  const widgetConfig = getWidgetPermissions(widgetType);
  
  // SECURITY: Unknown widget types are denied by default
  if (!widgetConfig) {
    console.warn(`[Widget Permissions] Unknown widget type: ${widgetType} - access denied`);
    return false;
  }

  const requiredPermissions = widgetConfig.requiredPermissions;
  
  // If no permissions required (empty array), widget is available to all
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // Check if user has ANY of the required permissions (OR logic)
  // Use permissionMatches for backward compatibility with legacy permission keys
  return requiredPermissions.some(requiredPerm => 
    userPermissions.some(userPerm => permissionMatches(userPerm, requiredPerm))
  );
}

/**
 * Filter a list of widgets to only those the user can access
 * @param widgets - Array of widget objects with a 'type' property
 * @param userPermissions - Array of permission keys the user has
 * @param isAdmin - Whether the user is an admin
 * @returns Filtered array of widgets
 */
export function filterWidgetsByPermission<T extends { type: string }>(
  widgets: T[],
  userPermissions: string[],
  isAdmin: boolean = false
): T[] {
  return widgets.filter(widget => canAccessWidget(widget.type, userPermissions, isAdmin));
}
