/**
 * Granular Permission Templates
 * Defines detailed sub-permissions for each module in the system
 * Inspired by GoHighLevel's granular permission system
 */

export interface SubPermission {
  key: string; // Unique identifier like "clients.view_contacts"
  label: string; // Display name like "View & manage client contacts"
  description?: string; // Optional tooltip description
  type: 'view' | 'manage' | 'view_manage' | 'delete' | 'export' | 'import'; // Permission type for categorization
}

export interface PermissionModule {
  module: string; // Module identifier
  label: string; // Display name
  icon?: string; // Icon name from lucide-react
  description?: string; // Module description
  subPermissions: SubPermission[];
}

export const PERMISSION_TEMPLATES: PermissionModule[] = [
  {
    module: 'clients',
    label: 'Clients',
    icon: 'Users',
    description: 'Manage client accounts and relationships',
    subPermissions: [
      {
        key: 'clients.view_list',
        label: 'View client list',
        description: 'See all clients in the system',
        type: 'view',
      },
      {
        key: 'clients.view_details',
        label: 'View client details',
        description: 'Access detailed client information',
        type: 'view',
      },
      {
        key: 'clients.manage_clients',
        label: 'View & manage clients',
        description: 'Create, edit, and update client records',
        type: 'view_manage',
      },
      {
        key: 'clients.delete_clients',
        label: 'Delete clients',
        description: 'Remove client records from the system',
        type: 'delete',
      },
      {
        key: 'clients.view_contacts',
        label: 'View client contacts',
        description: 'See contact information for clients',
        type: 'view',
      },
      {
        key: 'clients.manage_contacts',
        label: 'View & manage client contacts',
        description: 'Add, edit, and remove client contacts',
        type: 'view_manage',
      },
      {
        key: 'clients.view_team_assignments',
        label: 'View team assignments',
        description: 'See who is assigned to each client',
        type: 'view',
      },
      {
        key: 'clients.manage_team_assignments',
        label: 'View & manage team assignments',
        description: 'Assign and unassign team members to clients',
        type: 'view_manage',
      },
      {
        key: 'clients.view_client_briefs',
        label: 'View client briefs',
        description: 'Access client briefing information',
        type: 'view',
      },
      {
        key: 'clients.manage_client_briefs',
        label: 'View & manage client briefs',
        description: 'Create and edit client briefs',
        type: 'view_manage',
      },
      {
        key: 'clients.view_products',
        label: 'View client products',
        description: 'See products assigned to clients',
        type: 'view',
      },
      {
        key: 'clients.manage_products',
        label: 'View & manage client products',
        description: 'Add, edit, and remove client products',
        type: 'view_manage',
      },
      {
        key: 'clients.view_billing',
        label: 'View billing information',
        description: 'Access client billing and MRR data',
        type: 'view',
      },
      {
        key: 'clients.manage_billing',
        label: 'View & manage billing information',
        description: 'Edit client billing information and MRR',
        type: 'view_manage',
      },
      {
        key: 'clients.export_data',
        label: 'Export client data',
        description: 'Download client data as CSV',
        type: 'export',
      },
    ],
  },
  {
    module: 'campaigns',
    label: 'Marketing',
    icon: 'Megaphone',
    description: 'Manage marketing campaigns and communication',
    subPermissions: [
      {
        key: 'campaigns.view_email_templates',
        label: 'View email templates',
        description: 'See all email templates',
        type: 'view',
      },
      {
        key: 'campaigns.manage_email_templates',
        label: 'View & manage email templates',
        description: 'Create, edit, and delete email templates',
        type: 'view_manage',
      },
      {
        key: 'campaigns.view_sms_templates',
        label: 'View SMS templates',
        description: 'See all SMS templates',
        type: 'view',
      },
      {
        key: 'campaigns.manage_sms_templates',
        label: 'View & manage SMS templates',
        description: 'Create, edit, and delete SMS templates',
        type: 'view_manage',
      },
      {
        key: 'campaigns.send_emails',
        label: 'Send emails',
        description: 'Send individual and bulk emails',
        type: 'manage',
      },
      {
        key: 'campaigns.send_sms',
        label: 'Send SMS messages',
        description: 'Send individual and bulk SMS',
        type: 'manage',
      },
      {
        key: 'campaigns.view_scheduled_emails',
        label: 'View scheduled emails',
        description: 'See scheduled email sends',
        type: 'view',
      },
      {
        key: 'campaigns.manage_scheduled_emails',
        label: 'View & manage scheduled emails',
        description: 'Create, edit, and cancel scheduled emails',
        type: 'view_manage',
      },
      {
        key: 'campaigns.view_forms',
        label: 'View forms',
        description: 'See all forms',
        type: 'view',
      },
      {
        key: 'campaigns.manage_forms',
        label: 'View & manage forms',
        description: 'Create, edit, and delete forms',
        type: 'view_manage',
      },
      {
        key: 'campaigns.view_form_submissions',
        label: 'View form submissions',
        description: 'Access submitted form data',
        type: 'view',
      },
    ],
  },
  {
    module: 'sales',
    label: 'Sales',
    icon: 'Banknote',
    description: 'Manage sales pipeline and deals',
    subPermissions: [
      {
        key: 'sales.view_pipeline',
        label: 'View sales pipeline',
        description: 'See all deals in the pipeline',
        type: 'view',
      },
      {
        key: 'sales.manage_pipeline',
        label: 'View & manage pipeline',
        description: 'Create, edit, and move deals',
        type: 'view_manage',
      },
      {
        key: 'sales.view_deals',
        label: 'View deals',
        description: 'Access deal details',
        type: 'view',
      },
      {
        key: 'sales.manage_deals',
        label: 'View & manage deals',
        description: 'Create, edit, and update deals',
        type: 'view_manage',
      },
      {
        key: 'sales.close_deals',
        label: 'Close deals',
        description: 'Mark deals as won or lost',
        type: 'manage',
      },
      {
        key: 'sales.delete_deals',
        label: 'Delete deals',
        description: 'Remove deals from pipeline',
        type: 'delete',
      },
      {
        key: 'sales.view_quotes',
        label: 'View quotes',
        description: 'See all sales quotes',
        type: 'view',
      },
      {
        key: 'sales.manage_quotes',
        label: 'View & manage quotes',
        description: 'Create, edit, and send quotes',
        type: 'view_manage',
      },
      {
        key: 'sales.approve_quotes',
        label: 'Approve quotes',
        description: 'Mark quotes as approved',
        type: 'manage',
      },
      {
        key: 'sales.view_reports',
        label: 'View sales reports',
        description: 'Access sales analytics and reports',
        type: 'view',
      },
      {
        key: 'sales.export_data',
        label: 'Export sales data',
        description: 'Download sales data as CSV',
        type: 'export',
      },
    ],
  },
  {
    module: 'tasks',
    label: 'Tasks',
    icon: 'CheckSquare',
    description: 'Manage tasks and projects',
    subPermissions: [
      {
        key: 'tasks.view_own_tasks',
        label: 'View own tasks',
        description: 'See tasks assigned to you',
        type: 'view',
      },
      {
        key: 'tasks.view_team_tasks',
        label: 'View team tasks',
        description: 'See all tasks assigned to team members',
        type: 'view',
      },
      {
        key: 'tasks.view_all_tasks',
        label: 'View all tasks',
        description: 'See all tasks in the system',
        type: 'view',
      },
      {
        key: 'tasks.manage_own_tasks',
        label: 'View & manage own tasks',
        description: 'Create and edit your own tasks',
        type: 'view_manage',
      },
      {
        key: 'tasks.manage_all_tasks',
        label: 'View & manage all tasks',
        description: 'Create, edit, and delete any task',
        type: 'view_manage',
      },
      {
        key: 'tasks.assign_tasks',
        label: 'Assign tasks to others',
        description: 'Assign tasks to team members',
        type: 'manage',
      },
      {
        key: 'tasks.delete_tasks',
        label: 'Delete tasks',
        description: 'Remove tasks from the system',
        type: 'delete',
      },
      {
        key: 'tasks.view_comments',
        label: 'View task comments',
        description: 'See comments on tasks',
        type: 'view',
      },
      {
        key: 'tasks.manage_comments',
        label: 'View & manage comments',
        description: 'Add, edit, and delete task comments',
        type: 'view_manage',
      },
      {
        key: 'tasks.manage_task_templates',
        label: 'Manage task templates',
        description: 'Create, edit, and delete task templates',
        type: 'manage',
      },
    ],
  },
  {
    module: 'leads',
    label: 'Leads',
    icon: 'UserPlus',
    description: 'Manage lead generation and tracking',
    subPermissions: [
      {
        key: 'leads.view_leads',
        label: 'View leads',
        description: 'See all leads in the system',
        type: 'view',
      },
      {
        key: 'leads.manage_leads',
        label: 'View & manage leads',
        description: 'Create, edit, and update leads',
        type: 'view_manage',
      },
      {
        key: 'leads.delete_leads',
        label: 'Delete leads',
        description: 'Remove leads from the system',
        type: 'delete',
      },
      {
        key: 'leads.convert_to_client',
        label: 'Convert leads to clients',
        description: 'Move leads to client status',
        type: 'manage',
      },
      {
        key: 'leads.view_lead_sources',
        label: 'View lead sources',
        description: 'See lead source configuration',
        type: 'view',
      },
      {
        key: 'leads.manage_lead_sources',
        label: 'View & manage lead sources',
        description: 'Configure lead source options',
        type: 'view_manage',
      },
      {
        key: 'leads.export_data',
        label: 'Export lead data',
        description: 'Download lead data as CSV',
        type: 'export',
      },
    ],
  },
  {
    module: 'workflows',
    label: 'Workflows',
    icon: 'GitBranch',
    description: 'Manage automation workflows',
    subPermissions: [
      {
        key: 'workflows.view_workflows',
        label: 'View workflows',
        description: 'See all automation workflows',
        type: 'view',
      },
      {
        key: 'workflows.manage_workflows',
        label: 'View & manage workflows',
        description: 'Create, edit, and delete workflows',
        type: 'view_manage',
      },
      {
        key: 'workflows.activate_workflows',
        label: 'Activate/deactivate workflows',
        description: 'Turn workflows on or off',
        type: 'manage',
      },
      {
        key: 'workflows.view_execution_logs',
        label: 'View execution logs',
        description: 'See workflow execution history',
        type: 'view',
      },
      {
        key: 'workflows.view_triggers',
        label: 'View automation triggers',
        description: 'See available trigger types',
        type: 'view',
      },
      {
        key: 'workflows.manage_triggers',
        label: 'View & manage triggers',
        description: 'Configure automation triggers',
        type: 'view_manage',
      },
    ],
  },
  {
    module: 'calendar',
    label: 'Calendars',
    icon: 'Calendar',
    description: 'Manage calendars and appointments',
    subPermissions: [
      {
        key: 'calendar.view_own_calendar',
        label: 'View own calendar',
        description: 'See your calendar',
        type: 'view',
      },
      {
        key: 'calendar.view_team_calendars',
        label: 'View team calendars',
        description: 'See team member calendars',
        type: 'view',
      },
      {
        key: 'calendar.view_all_calendars',
        label: 'View all calendars',
        description: 'Access all calendar data',
        type: 'view',
      },
      {
        key: 'calendar.manage_own_events',
        label: 'View & manage own events',
        description: 'Create and edit your events',
        type: 'view_manage',
      },
      {
        key: 'calendar.manage_all_events',
        label: 'View & manage all events',
        description: 'Create and edit any event',
        type: 'view_manage',
      },
      {
        key: 'calendar.view_appointments',
        label: 'View appointments',
        description: 'See scheduled appointments',
        type: 'view',
      },
      {
        key: 'calendar.manage_appointments',
        label: 'View & manage appointments',
        description: 'Schedule and edit appointments',
        type: 'view_manage',
      },
    ],
  },
  {
    module: 'hr',
    label: 'HR',
    icon: 'UserCheck',
    description: 'Manage human resources and staff',
    subPermissions: [
      {
        key: 'hr.view_staff_directory',
        label: 'View staff directory',
        description: 'See all staff members',
        type: 'view',
      },
      {
        key: 'hr.manage_staff',
        label: 'View & manage staff',
        description: 'Create, edit, and manage staff records',
        type: 'view_manage',
      },
      {
        key: 'hr.view_time_off_requests',
        label: 'View time off requests',
        description: 'See time off requests',
        type: 'view',
      },
      {
        key: 'hr.manage_time_off_requests',
        label: 'View & manage time off requests',
        description: 'Approve or deny time off requests',
        type: 'view_manage',
      },
      {
        key: 'hr.view_job_applications',
        label: 'View job applications',
        description: 'See job applications',
        type: 'view',
      },
      {
        key: 'hr.manage_job_applications',
        label: 'View & manage job applications',
        description: 'Process and manage applications',
        type: 'view_manage',
      },
      {
        key: 'hr.view_job_openings',
        label: 'View job openings',
        description: 'See job postings',
        type: 'view',
      },
      {
        key: 'hr.manage_job_openings',
        label: 'View & manage job openings',
        description: 'Create and edit job postings',
        type: 'view_manage',
      },
      {
        key: 'hr.view_expense_reports',
        label: 'View expense reports',
        description: 'See submitted expense reports',
        type: 'view',
      },
      {
        key: 'hr.manage_expense_reports',
        label: 'View & manage expense reports',
        description: 'Approve or reject expense reports',
        type: 'view_manage',
      },
    ],
  },
  {
    module: 'training',
    label: 'Training',
    icon: 'GraduationCap',
    description: 'Manage training and development',
    subPermissions: [
      {
        key: 'training.view_courses',
        label: 'View training courses',
        description: 'See available courses',
        type: 'view',
      },
      {
        key: 'training.manage_courses',
        label: 'View & manage courses',
        description: 'Create, edit, and organize courses',
        type: 'view_manage',
      },
      {
        key: 'training.view_lessons',
        label: 'View lessons',
        description: 'Access lesson content',
        type: 'view',
      },
      {
        key: 'training.manage_lessons',
        label: 'View & manage lessons',
        description: 'Create and edit lessons',
        type: 'view_manage',
      },
      {
        key: 'training.view_assignments',
        label: 'View assignments',
        description: 'See training assignments',
        type: 'view',
      },
      {
        key: 'training.manage_assignments',
        label: 'View & manage assignments',
        description: 'Create and grade assignments',
        type: 'view_manage',
      },
      {
        key: 'training.view_progress',
        label: 'View training progress',
        description: 'See completion status',
        type: 'view',
      },
      {
        key: 'training.view_analytics',
        label: 'View training analytics',
        description: 'Access training reports and insights',
        type: 'view',
      },
    ],
  },
  {
    module: 'knowledge_base',
    label: 'Resources',
    icon: 'BookOpen',
    description: 'Manage knowledge base and documentation',
    subPermissions: [
      {
        key: 'knowledge_base.view_articles',
        label: 'View articles',
        description: 'Read knowledge base articles',
        type: 'view',
      },
      {
        key: 'knowledge_base.manage_articles',
        label: 'View & manage articles',
        description: 'Create, edit, and delete articles',
        type: 'view_manage',
      },
      {
        key: 'knowledge_base.view_categories',
        label: 'View categories',
        description: 'See article categories',
        type: 'view',
      },
      {
        key: 'knowledge_base.manage_categories',
        label: 'View & manage categories',
        description: 'Create and organize categories',
        type: 'view_manage',
      },
      {
        key: 'knowledge_base.view_comments',
        label: 'View comments',
        description: 'See article comments',
        type: 'view',
      },
      {
        key: 'knowledge_base.manage_comments',
        label: 'View & manage comments',
        description: 'Add and moderate comments',
        type: 'view_manage',
      },
    ],
  },
  {
    module: 'reports',
    label: 'Reports',
    icon: 'BarChart3',
    description: 'Access reports and analytics',
    subPermissions: [
      {
        key: 'reports.view_sales_reports',
        label: 'View sales reports',
        description: 'Access sales analytics',
        type: 'view',
      },
      {
        key: 'reports.view_client_reports',
        label: 'View client reports',
        description: 'Access client analytics',
        type: 'view',
      },
      {
        key: 'reports.view_pipeline_reports',
        label: 'View pipeline reports',
        description: 'Access pipeline analytics',
        type: 'view',
      },
      {
        key: 'reports.view_team_reports',
        label: 'View team reports',
        description: 'Access team performance data',
        type: 'view',
      },
      {
        key: 'reports.view_1on1_performance',
        label: 'View 1-on-1 performance reports',
        description: 'Access 1-on-1 meeting performance analytics',
        type: 'view',
      },
      {
        key: 'reports.export_reports',
        label: 'Export report data',
        description: 'Download reports as CSV or PDF',
        type: 'export',
      },
    ],
  },
  {
    module: 'settings',
    label: 'Settings',
    icon: 'Settings',
    description: 'System settings and configuration',
    subPermissions: [
      {
        key: 'settings.view_general_settings',
        label: 'View general settings',
        description: 'See system configuration',
        type: 'view',
      },
      {
        key: 'settings.manage_general_settings',
        label: 'View & manage general settings',
        description: 'Configure system settings',
        type: 'view_manage',
      },
      {
        key: 'settings.view_roles_permissions',
        label: 'View roles & permissions',
        description: 'See role configurations',
        type: 'view',
      },
      {
        key: 'settings.manage_roles_permissions',
        label: 'View & manage roles & permissions',
        description: 'Configure roles and permissions',
        type: 'view_manage',
      },
      {
        key: 'settings.view_custom_fields',
        label: 'View custom fields',
        description: 'See custom field definitions',
        type: 'view',
      },
      {
        key: 'settings.manage_custom_fields',
        label: 'View & manage custom fields',
        description: 'Create and edit custom fields',
        type: 'view_manage',
      },
      {
        key: 'settings.view_integrations',
        label: 'View integrations',
        description: 'See integration settings',
        type: 'view',
      },
      {
        key: 'settings.manage_integrations',
        label: 'View & manage integrations',
        description: 'Configure third-party integrations',
        type: 'view_manage',
      },
    ],
  },
];

/**
 * Get all permission keys for a specific module
 */
export function getModulePermissionKeys(module: string): string[] {
  const moduleTemplate = PERMISSION_TEMPLATES.find(t => t.module === module);
  return moduleTemplate?.subPermissions.map(p => p.key) || [];
}

/**
 * Get permission template for a specific module
 */
export function getModuleTemplate(module: string): PermissionModule | undefined {
  return PERMISSION_TEMPLATES.find(t => t.module === module);
}

/**
 * Get all modules
 */
export function getAllModules(): string[] {
  return PERMISSION_TEMPLATES.map(t => t.module);
}
