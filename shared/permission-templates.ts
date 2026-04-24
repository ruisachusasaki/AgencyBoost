/**
 * Hierarchical Permission Templates
 * 
 * Structure: module.tab.action
 * - Module: Top-level section (e.g., clients, sales, hr)
 * - Tab: Sub-section within a module (e.g., list, details, contacts)
 * - Action: Specific operation (e.g., view, create, edit, delete, export)
 * 
 * Permission key format: "module.tab.action" or "module.action" for module-level actions
 */

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import' | 'manage' | 'approve';

export interface PermissionItem {
  key: string;
  label: string;
  description?: string;
  action: PermissionAction;
}

export interface PermissionTab {
  tab: string;
  label: string;
  description?: string;
  permissions: PermissionItem[];
}

export interface PermissionModule {
  module: string;
  label: string;
  icon?: string;
  description?: string;
  tabs: PermissionTab[];
  modulePermissions?: PermissionItem[];
}

/**
 * Complete hierarchical permission definitions
 */
export const PERMISSION_TEMPLATES: PermissionModule[] = [
  {
    module: 'clients',
    label: 'Clients',
    icon: 'Users',
    description: 'Manage client accounts and relationships',
    modulePermissions: [
      { key: 'clients.access', label: 'Access Clients Module', description: 'Can access the Clients section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'list',
        label: 'Client List',
        description: 'View and manage the list of clients',
        permissions: [
          { key: 'clients.list.view', label: 'View client list', description: 'See all clients in the list', action: 'view' },
          { key: 'clients.list.create', label: 'Add new clients', description: 'Create new client records', action: 'create' },
          { key: 'clients.list.delete', label: 'Delete clients', description: 'Remove clients from system', action: 'delete' },
          { key: 'clients.list.export', label: 'Export client list', description: 'Download client data as CSV', action: 'export' },
          { key: 'clients.list.import', label: 'Import clients', description: 'Upload client data from CSV', action: 'import' },
          { key: 'clients.list.bulk_actions', label: 'Bulk actions', description: 'Perform bulk operations on clients', action: 'manage' },
        ],
      },
      {
        tab: 'details',
        label: 'Client Details',
        description: 'View and edit individual client information',
        permissions: [
          { key: 'clients.details.view', label: 'View client details', description: 'Access client profile and info', action: 'view' },
          { key: 'clients.details.edit', label: 'Edit client details', description: 'Modify client information', action: 'edit' },
        ],
      },
      {
        tab: 'contacts',
        label: 'Contacts',
        description: 'Manage client contacts',
        permissions: [
          { key: 'clients.contacts.view', label: 'View contacts', description: 'See client contacts', action: 'view' },
          { key: 'clients.contacts.create', label: 'Add contacts', description: 'Create new contacts', action: 'create' },
          { key: 'clients.contacts.edit', label: 'Edit contacts', description: 'Modify contact info', action: 'edit' },
          { key: 'clients.contacts.delete', label: 'Delete contacts', description: 'Remove contacts', action: 'delete' },
        ],
      },
      {
        tab: 'team',
        label: 'Team Assignments',
        description: 'Manage team members assigned to clients',
        permissions: [
          { key: 'clients.team.view', label: 'View team assignments', description: 'See who is assigned to clients', action: 'view' },
          { key: 'clients.team.manage', label: 'Manage team assignments', description: 'Assign/unassign team members', action: 'manage' },
        ],
      },
      {
        tab: 'briefs',
        label: 'Client Briefs',
        description: 'Manage client briefing documents',
        permissions: [
          { key: 'clients.briefs.view', label: 'View briefs', description: 'Access client briefs', action: 'view' },
          { key: 'clients.briefs.create', label: 'Create briefs', description: 'Add new briefs', action: 'create' },
          { key: 'clients.briefs.edit', label: 'Edit briefs', description: 'Modify existing briefs', action: 'edit' },
          { key: 'clients.briefs.delete', label: 'Delete briefs', description: 'Remove briefs', action: 'delete' },
        ],
      },
      {
        tab: 'products',
        label: 'Client Products',
        description: 'Manage products assigned to clients',
        permissions: [
          { key: 'clients.products.view', label: 'View products', description: 'See client products', action: 'view' },
          { key: 'clients.products.manage', label: 'Manage products', description: 'Add/edit/remove products', action: 'manage' },
        ],
      },
      {
        tab: 'billing',
        label: 'Billing',
        description: 'Manage client billing information',
        permissions: [
          { key: 'clients.billing.view', label: 'View billing', description: 'Access billing and MRR data', action: 'view' },
          { key: 'clients.billing.edit', label: 'Edit billing', description: 'Modify billing information', action: 'edit' },
        ],
      },
      {
        tab: 'assets',
        label: 'Asset Approval',
        description: 'Manage client asset approvals',
        permissions: [
          { key: 'clients.assets.view', label: 'View assets', description: 'See client assets', action: 'view' },
          { key: 'clients.assets.upload', label: 'Upload assets', description: 'Add new assets for approval', action: 'create' },
          { key: 'clients.assets.approve', label: 'Approve assets', description: 'Approve or reject assets', action: 'approve' },
        ],
      },
      {
        tab: 'smart_lists',
        label: 'Smart Lists',
        description: 'Manage client smart lists',
        permissions: [
          { key: 'clients.smart_lists.view', label: 'View smart lists', description: 'See saved smart lists', action: 'view' },
          { key: 'clients.smart_lists.create', label: 'Create smart lists', description: 'Add new smart lists', action: 'create' },
          { key: 'clients.smart_lists.edit', label: 'Edit smart lists', description: 'Modify smart lists', action: 'edit' },
          { key: 'clients.smart_lists.delete', label: 'Delete smart lists', description: 'Remove smart lists', action: 'delete' },
          { key: 'clients.smart_lists.manage_universal', label: 'Manage universal lists', description: 'Edit/delete universal smart lists', action: 'manage' },
        ],
      },
    ],
  },
  {
    module: 'sales',
    label: 'Sales',
    icon: 'Banknote',
    description: 'Manage sales pipeline, deals, and quotes',
    modulePermissions: [
      { key: 'sales.access', label: 'Access Sales Module', description: 'Can access the Sales section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'pipeline',
        label: 'Pipeline',
        description: 'Manage sales pipeline and stages',
        permissions: [
          { key: 'sales.pipeline.view', label: 'View pipeline', description: 'See deals in pipeline', action: 'view' },
          { key: 'sales.pipeline.manage', label: 'Manage pipeline', description: 'Move deals between stages', action: 'manage' },
        ],
      },
      {
        tab: 'deals',
        label: 'Deals',
        description: 'Manage individual deals',
        permissions: [
          { key: 'sales.deals.view', label: 'View deals', description: 'Access deal details', action: 'view' },
          { key: 'sales.deals.create', label: 'Create deals', description: 'Add new deals', action: 'create' },
          { key: 'sales.deals.edit', label: 'Edit deals', description: 'Modify deal information', action: 'edit' },
          { key: 'sales.deals.delete', label: 'Delete deals', description: 'Remove deals', action: 'delete' },
          { key: 'sales.deals.close', label: 'Close deals', description: 'Mark deals as won/lost', action: 'manage' },
        ],
      },
      {
        tab: 'quotes',
        label: 'Quotes',
        description: 'Manage sales quotes',
        permissions: [
          { key: 'sales.quotes.view', label: 'View quotes', description: 'See all quotes', action: 'view' },
          { key: 'sales.quotes.create', label: 'Create quotes', description: 'Generate new quotes', action: 'create' },
          { key: 'sales.quotes.edit', label: 'Edit quotes', description: 'Modify quotes', action: 'edit' },
          { key: 'sales.quotes.delete', label: 'Delete quotes', description: 'Remove quotes', action: 'delete' },
          { key: 'sales.quotes.approve', label: 'Approve quotes', description: 'Approve quotes for sending', action: 'approve' },
          { key: 'sales.quotes.send', label: 'Send quotes', description: 'Send quotes to clients', action: 'manage' },
        ],
      },
      {
        tab: 'reports',
        label: 'Sales Reports',
        description: 'Access sales analytics',
        permissions: [
          { key: 'sales.reports.view', label: 'View sales reports', description: 'Access sales analytics', action: 'view' },
          { key: 'sales.reports.export', label: 'Export sales data', description: 'Download sales reports', action: 'export' },
        ],
      },
    ],
  },
  {
    module: 'tasks',
    label: 'Tasks',
    icon: 'CheckSquare',
    description: 'Manage tasks and projects',
    modulePermissions: [
      { key: 'tasks.access', label: 'Access Tasks Module', description: 'Can access the Tasks section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'own',
        label: 'My Tasks',
        description: 'Manage your own tasks',
        permissions: [
          { key: 'tasks.own.view', label: 'View own tasks', description: 'See tasks assigned to you', action: 'view' },
          { key: 'tasks.own.create', label: 'Create own tasks', description: 'Create tasks for yourself', action: 'create' },
          { key: 'tasks.own.edit', label: 'Edit own tasks', description: 'Modify your tasks', action: 'edit' },
          { key: 'tasks.own.delete', label: 'Delete own tasks', description: 'Remove your tasks', action: 'delete' },
        ],
      },
      {
        tab: 'team',
        label: 'Team Tasks',
        description: 'Manage team member tasks',
        permissions: [
          { key: 'tasks.team.view', label: 'View team tasks', description: 'See team member tasks', action: 'view' },
          { key: 'tasks.team.assign', label: 'Assign to team', description: 'Assign tasks to team members', action: 'manage' },
        ],
      },
      {
        tab: 'all',
        label: 'All Tasks',
        description: 'Manage all tasks in the system',
        permissions: [
          { key: 'tasks.all.view', label: 'View all tasks', description: 'See all tasks in system', action: 'view' },
          { key: 'tasks.all.create', label: 'Create any task', description: 'Create tasks for anyone', action: 'create' },
          { key: 'tasks.all.edit', label: 'Edit any task', description: 'Modify any task', action: 'edit' },
          { key: 'tasks.all.delete', label: 'Delete any task', description: 'Remove any task', action: 'delete' },
        ],
      },
      {
        tab: 'comments',
        label: 'Comments',
        description: 'Manage task comments',
        permissions: [
          { key: 'tasks.comments.view', label: 'View comments', description: 'See task comments', action: 'view' },
          { key: 'tasks.comments.create', label: 'Add comments', description: 'Post new comments', action: 'create' },
          { key: 'tasks.comments.edit', label: 'Edit comments', description: 'Modify comments', action: 'edit' },
          { key: 'tasks.comments.delete', label: 'Delete comments', description: 'Remove comments', action: 'delete' },
        ],
      },
      {
        tab: 'templates',
        label: 'Task Templates',
        description: 'Manage task templates',
        permissions: [
          { key: 'tasks.templates.view', label: 'View templates', description: 'See task templates', action: 'view' },
          { key: 'tasks.templates.manage', label: 'Manage templates', description: 'Create/edit/delete templates', action: 'manage' },
        ],
      },
      {
        tab: 'time_entries',
        label: 'Time Entries',
        description: 'Manage time tracking',
        permissions: [
          { key: 'tasks.time_entries.view_own', label: 'View own time', description: 'See your time entries', action: 'view' },
          { key: 'tasks.time_entries.view_all', label: 'View all time', description: 'See all time entries', action: 'view' },
          { key: 'tasks.time_entries.create', label: 'Log time', description: 'Add time entries', action: 'create' },
          { key: 'tasks.time_entries.edit_own', label: 'Edit own time', description: 'Modify your time entries', action: 'edit' },
          { key: 'tasks.time_entries.edit_all', label: 'Edit any time', description: 'Modify any time entry', action: 'edit' },
          { key: 'tasks.time_entries.delete', label: 'Delete time entries', description: 'Remove time entries', action: 'delete' },
        ],
      },
    ],
  },
  {
    module: 'leads',
    label: 'Leads',
    icon: 'UserPlus',
    description: 'Manage lead generation and tracking',
    modulePermissions: [
      { key: 'leads.access', label: 'Access Leads Module', description: 'Can access the Leads section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'list',
        label: 'Lead List',
        description: 'View and manage leads',
        permissions: [
          { key: 'leads.list.view', label: 'View leads', description: 'See all leads', action: 'view' },
          { key: 'leads.list.create', label: 'Create leads', description: 'Add new leads', action: 'create' },
          { key: 'leads.list.edit', label: 'Edit leads', description: 'Modify lead info', action: 'edit' },
          { key: 'leads.list.delete', label: 'Delete leads', description: 'Remove leads', action: 'delete' },
          { key: 'leads.list.export', label: 'Export leads', description: 'Download lead data', action: 'export' },
          { key: 'leads.list.import', label: 'Import leads', description: 'Upload lead data', action: 'import' },
        ],
      },
      {
        tab: 'details',
        label: 'Lead Details',
        description: 'View individual lead information',
        permissions: [
          { key: 'leads.details.view', label: 'View lead details', description: 'Access lead profile', action: 'view' },
          { key: 'leads.details.edit', label: 'Edit lead details', description: 'Modify lead information', action: 'edit' },
        ],
      },
      {
        tab: 'convert',
        label: 'Conversion',
        description: 'Convert leads to clients',
        permissions: [
          { key: 'leads.convert.execute', label: 'Convert to client', description: 'Move leads to clients', action: 'manage' },
        ],
      },
      {
        tab: 'sources',
        label: 'Lead Sources',
        description: 'Manage lead source configuration',
        permissions: [
          { key: 'leads.sources.view', label: 'View sources', description: 'See lead source options', action: 'view' },
          { key: 'leads.sources.manage', label: 'Manage sources', description: 'Configure lead sources', action: 'manage' },
        ],
      },
      {
        tab: 'calling',
        label: 'VoIP Calling',
        description: 'Make calls to leads',
        permissions: [
          { key: 'leads.calling.make_calls', label: 'Make calls', description: 'Call leads via VoIP', action: 'manage' },
          { key: 'leads.calling.view_history', label: 'View call history', description: 'See call logs', action: 'view' },
        ],
      },
    ],
  },
  {
    module: 'campaigns',
    label: 'Marketing',
    icon: 'Megaphone',
    description: 'Manage marketing campaigns and communication',
    modulePermissions: [
      { key: 'campaigns.access', label: 'Access Marketing Module', description: 'Can access Marketing section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'email_templates',
        label: 'Email Templates',
        description: 'Manage email templates',
        permissions: [
          { key: 'campaigns.email_templates.view', label: 'View templates', description: 'See email templates', action: 'view' },
          { key: 'campaigns.email_templates.create', label: 'Create templates', description: 'Add new templates', action: 'create' },
          { key: 'campaigns.email_templates.edit', label: 'Edit templates', description: 'Modify templates', action: 'edit' },
          { key: 'campaigns.email_templates.delete', label: 'Delete templates', description: 'Remove templates', action: 'delete' },
        ],
      },
      {
        tab: 'sms_templates',
        label: 'SMS Templates',
        description: 'Manage SMS templates',
        permissions: [
          { key: 'campaigns.sms_templates.view', label: 'View SMS templates', description: 'See SMS templates', action: 'view' },
          { key: 'campaigns.sms_templates.create', label: 'Create SMS templates', description: 'Add SMS templates', action: 'create' },
          { key: 'campaigns.sms_templates.edit', label: 'Edit SMS templates', description: 'Modify SMS templates', action: 'edit' },
          { key: 'campaigns.sms_templates.delete', label: 'Delete SMS templates', description: 'Remove SMS templates', action: 'delete' },
        ],
      },
      {
        tab: 'send',
        label: 'Send Messages',
        description: 'Send emails and SMS',
        permissions: [
          { key: 'campaigns.send.email', label: 'Send emails', description: 'Send individual/bulk emails', action: 'manage' },
          { key: 'campaigns.send.sms', label: 'Send SMS', description: 'Send individual/bulk SMS', action: 'manage' },
        ],
      },
      {
        tab: 'scheduled',
        label: 'Scheduled',
        description: 'Manage scheduled communications',
        permissions: [
          { key: 'campaigns.scheduled.view', label: 'View scheduled', description: 'See scheduled messages', action: 'view' },
          { key: 'campaigns.scheduled.manage', label: 'Manage scheduled', description: 'Create/edit/cancel scheduled', action: 'manage' },
        ],
      },
      {
        tab: 'forms',
        label: 'Forms',
        description: 'Manage marketing forms',
        permissions: [
          { key: 'campaigns.forms.view', label: 'View forms', description: 'See all forms', action: 'view' },
          { key: 'campaigns.forms.create', label: 'Create forms', description: 'Add new forms', action: 'create' },
          { key: 'campaigns.forms.edit', label: 'Edit forms', description: 'Modify forms', action: 'edit' },
          { key: 'campaigns.forms.delete', label: 'Delete forms', description: 'Remove forms', action: 'delete' },
          { key: 'campaigns.forms.view_submissions', label: 'View submissions', description: 'See form submissions', action: 'view' },
        ],
      },
    ],
  },
  {
    module: 'workflows',
    label: 'Workflows',
    icon: 'GitBranch',
    description: 'Manage automation workflows',
    modulePermissions: [
      { key: 'workflows.access', label: 'Access Workflows Module', description: 'Can access Workflows section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'list',
        label: 'Workflow List',
        description: 'View and manage workflows',
        permissions: [
          { key: 'workflows.list.view', label: 'View workflows', description: 'See all workflows', action: 'view' },
          { key: 'workflows.list.create', label: 'Create workflows', description: 'Add new workflows', action: 'create' },
          { key: 'workflows.list.edit', label: 'Edit workflows', description: 'Modify workflows', action: 'edit' },
          { key: 'workflows.list.delete', label: 'Delete workflows', description: 'Remove workflows', action: 'delete' },
        ],
      },
      {
        tab: 'activation',
        label: 'Activation',
        description: 'Control workflow activation',
        permissions: [
          { key: 'workflows.activation.toggle', label: 'Activate/deactivate', description: 'Turn workflows on/off', action: 'manage' },
        ],
      },
      {
        tab: 'logs',
        label: 'Execution Logs',
        description: 'View workflow execution history',
        permissions: [
          { key: 'workflows.logs.view', label: 'View logs', description: 'See execution history', action: 'view' },
        ],
      },
      {
        tab: 'triggers',
        label: 'Triggers',
        description: 'Manage automation triggers',
        permissions: [
          { key: 'workflows.triggers.view', label: 'View triggers', description: 'See trigger types', action: 'view' },
          { key: 'workflows.triggers.manage', label: 'Manage triggers', description: 'Configure triggers', action: 'manage' },
        ],
      },
    ],
  },
  {
    module: 'calendar',
    label: 'Calendars',
    icon: 'Calendar',
    description: 'Manage calendars and appointments',
    modulePermissions: [
      { key: 'calendar.access', label: 'Access Calendar Module', description: 'Can access Calendars section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'own',
        label: 'My Calendar',
        description: 'Manage your calendar',
        permissions: [
          { key: 'calendar.own.view', label: 'View own calendar', description: 'See your calendar', action: 'view' },
          { key: 'calendar.own.manage', label: 'Manage own events', description: 'Create/edit your events', action: 'manage' },
        ],
      },
      {
        tab: 'team',
        label: 'Team Calendars',
        description: 'View team member calendars',
        permissions: [
          { key: 'calendar.team.view', label: 'View team calendars', description: 'See team calendars', action: 'view' },
        ],
      },
      {
        tab: 'all',
        label: 'All Calendars',
        description: 'Access all calendar data',
        permissions: [
          { key: 'calendar.all.view', label: 'View all calendars', description: 'See all calendars', action: 'view' },
          { key: 'calendar.all.manage', label: 'Manage all events', description: 'Edit any event', action: 'manage' },
        ],
      },
      {
        tab: 'appointments',
        label: 'Appointments',
        description: 'Manage appointments',
        permissions: [
          { key: 'calendar.appointments.view', label: 'View appointments', description: 'See scheduled appointments', action: 'view' },
          { key: 'calendar.appointments.create', label: 'Create appointments', description: 'Schedule new appointments', action: 'create' },
          { key: 'calendar.appointments.edit', label: 'Edit appointments', description: 'Modify appointments', action: 'edit' },
          { key: 'calendar.appointments.delete', label: 'Delete appointments', description: 'Cancel appointments', action: 'delete' },
        ],
      },
      {
        tab: 'settings',
        label: 'Calendar Settings',
        description: 'Configure calendar settings',
        permissions: [
          { key: 'calendar.settings.view', label: 'View settings', description: 'See calendar configuration', action: 'view' },
          { key: 'calendar.settings.manage', label: 'Manage settings', description: 'Configure calendars', action: 'manage' },
        ],
      },
    ],
  },
  {
    module: 'hr',
    label: 'HR',
    icon: 'UserCheck',
    description: 'Manage human resources and staff',
    modulePermissions: [
      { key: 'hr.access', label: 'Access HR Module', description: 'Can access HR section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'dashboard',
        label: 'HR Dashboard',
        description: 'HR analytics and overview',
        permissions: [
          { key: 'hr.dashboard.view', label: 'View HR dashboard', description: 'See HR analytics', action: 'view' },
        ],
      },
      {
        tab: 'staff',
        label: 'Staff Directory',
        description: 'Manage staff members',
        permissions: [
          { key: 'hr.staff.view', label: 'View staff directory', description: 'See all staff', action: 'view' },
          { key: 'hr.staff.create', label: 'Add staff', description: 'Create staff records', action: 'create' },
          { key: 'hr.staff.edit', label: 'Edit staff', description: 'Modify staff records', action: 'edit' },
          { key: 'hr.staff.delete', label: 'Delete staff', description: 'Remove staff', action: 'delete' },
        ],
      },
      {
        tab: 'time_off',
        label: 'Time Off',
        description: 'Manage time off requests',
        permissions: [
          { key: 'hr.time_off.view_own', label: 'View own requests', description: 'See your time off requests', action: 'view' },
          { key: 'hr.time_off.view_team', label: 'View team requests', description: 'See team time off', action: 'view' },
          { key: 'hr.time_off.view_all', label: 'View all requests', description: 'See all time off requests', action: 'view' },
          { key: 'hr.time_off.create', label: 'Request time off', description: 'Submit time off requests', action: 'create' },
          { key: 'hr.time_off.approve', label: 'Approve time off', description: 'Approve/deny requests', action: 'approve' },
        ],
      },
      {
        tab: 'job_openings',
        label: 'Job Openings',
        description: 'Manage job postings',
        permissions: [
          { key: 'hr.job_openings.view', label: 'View openings', description: 'See job postings', action: 'view' },
          { key: 'hr.job_openings.create', label: 'Create openings', description: 'Add job postings', action: 'create' },
          { key: 'hr.job_openings.edit', label: 'Edit openings', description: 'Modify job postings', action: 'edit' },
          { key: 'hr.job_openings.delete', label: 'Delete openings', description: 'Remove job postings', action: 'delete' },
        ],
      },
      {
        tab: 'applications',
        label: 'Job Applications',
        description: 'Manage job applications',
        permissions: [
          { key: 'hr.applications.view', label: 'View applications', description: 'See job applications', action: 'view' },
          { key: 'hr.applications.manage', label: 'Manage applications', description: 'Process applications', action: 'manage' },
        ],
      },
      {
        tab: 'onboarding',
        label: 'Onboarding',
        description: 'Manage new hire onboarding',
        permissions: [
          { key: 'hr.onboarding.view', label: 'View onboarding', description: 'See onboarding submissions', action: 'view' },
          { key: 'hr.onboarding.manage', label: 'Manage onboarding', description: 'Process onboarding', action: 'manage' },
        ],
      },
      {
        tab: 'offboarding',
        label: 'Offboarding',
        description: 'Manage employee offboarding',
        permissions: [
          { key: 'hr.offboarding.view', label: 'View offboarding', description: 'See offboarding submissions', action: 'view' },
          { key: 'hr.offboarding.manage', label: 'Manage offboarding', description: 'Process offboarding', action: 'manage' },
        ],
      },
      {
        tab: 'expenses',
        label: 'Expense Reports',
        description: 'Manage expense reports',
        permissions: [
          { key: 'hr.expenses.view_own', label: 'View own expenses', description: 'See your expense reports', action: 'view' },
          { key: 'hr.expenses.view_all', label: 'View all expenses', description: 'See all expense reports', action: 'view' },
          { key: 'hr.expenses.create', label: 'Submit expenses', description: 'Create expense reports', action: 'create' },
          { key: 'hr.expenses.approve', label: 'Approve expenses', description: 'Approve/reject expenses', action: 'approve' },
        ],
      },
      {
        tab: 'one_on_one',
        label: '1-on-1 Meetings',
        description: 'Manage 1-on-1 meetings',
        permissions: [
          { key: 'hr.one_on_one.view_own', label: 'View own meetings', description: 'See your 1-on-1s', action: 'view' },
          { key: 'hr.one_on_one.view_all', label: 'View all meetings', description: 'See all 1-on-1s', action: 'view' },
          { key: 'hr.one_on_one.create', label: 'Create meetings', description: 'Schedule 1-on-1s', action: 'create' },
          { key: 'hr.one_on_one.manage', label: 'Manage meetings', description: 'Edit/delete 1-on-1s', action: 'manage' },
        ],
      },
      {
        tab: 'px_meetings',
        label: 'Meetings',
        description: 'Manage team meetings',
        permissions: [
          { key: 'hr.px_meetings.view', label: 'View meetings', description: 'See meetings', action: 'view' },
          { key: 'hr.px_meetings.create', label: 'Create meetings', description: 'Schedule meetings', action: 'create' },
          { key: 'hr.px_meetings.manage', label: 'Manage meetings', description: 'Edit meetings', action: 'manage' },
        ],
      },
      {
        tab: 'org_chart',
        label: 'Org Chart',
        description: 'View organization structure',
        permissions: [
          { key: 'hr.org_chart.view', label: 'View org chart', description: 'See organization structure', action: 'view' },
          { key: 'hr.org_chart.edit', label: 'Edit org chart', description: 'Modify structure', action: 'edit' },
        ],
      },
      {
        tab: 'approval_board',
        label: 'Approval Board',
        description: 'Manage HR approvals',
        permissions: [
          { key: 'hr.approval_board.view', label: 'View approval board', description: 'See pending approvals', action: 'view' },
          { key: 'hr.approval_board.approve', label: 'Process approvals', description: 'Approve/reject items', action: 'approve' },
        ],
      },
    ],
  },
  {
    module: 'training',
    label: 'Training',
    icon: 'GraduationCap',
    description: 'Manage training and development',
    modulePermissions: [
      { key: 'training.access', label: 'Access Training Module', description: 'Can access Training section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'courses',
        label: 'Courses',
        description: 'Manage training courses',
        permissions: [
          { key: 'training.courses.view', label: 'View courses', description: 'See available courses', action: 'view' },
          { key: 'training.courses.create', label: 'Create courses', description: 'Add new courses', action: 'create' },
          { key: 'training.courses.edit', label: 'Edit courses', description: 'Modify courses', action: 'edit' },
          { key: 'training.courses.delete', label: 'Delete courses', description: 'Remove courses', action: 'delete' },
        ],
      },
      {
        tab: 'lessons',
        label: 'Lessons',
        description: 'Manage course lessons',
        permissions: [
          { key: 'training.lessons.view', label: 'View lessons', description: 'Access lesson content', action: 'view' },
          { key: 'training.lessons.create', label: 'Create lessons', description: 'Add new lessons', action: 'create' },
          { key: 'training.lessons.edit', label: 'Edit lessons', description: 'Modify lessons', action: 'edit' },
          { key: 'training.lessons.delete', label: 'Delete lessons', description: 'Remove lessons', action: 'delete' },
        ],
      },
      {
        tab: 'assignments',
        label: 'Assignments',
        description: 'Manage training assignments',
        permissions: [
          { key: 'training.assignments.view', label: 'View assignments', description: 'See training assignments', action: 'view' },
          { key: 'training.assignments.create', label: 'Create assignments', description: 'Assign training', action: 'create' },
          { key: 'training.assignments.grade', label: 'Grade assignments', description: 'Review and grade', action: 'manage' },
        ],
      },
      {
        tab: 'progress',
        label: 'Progress',
        description: 'View training progress',
        permissions: [
          { key: 'training.progress.view_own', label: 'View own progress', description: 'See your completion status', action: 'view' },
          { key: 'training.progress.view_all', label: 'View all progress', description: 'See all completion status', action: 'view' },
        ],
      },
      {
        tab: 'analytics',
        label: 'Analytics',
        description: 'Training analytics and reports',
        permissions: [
          { key: 'training.analytics.view', label: 'View analytics', description: 'Access training reports', action: 'view' },
        ],
      },
    ],
  },
  {
    module: 'knowledge_base',
    label: 'Resources',
    icon: 'BookOpen',
    description: 'Manage knowledge base and documentation',
    modulePermissions: [
      { key: 'knowledge_base.access', label: 'Access Resources', description: 'Can access Resources section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'articles',
        label: 'Articles',
        description: 'Manage knowledge base articles',
        permissions: [
          { key: 'knowledge_base.articles.view', label: 'View articles', description: 'Read articles', action: 'view' },
          { key: 'knowledge_base.articles.create', label: 'Create articles', description: 'Write new articles', action: 'create' },
          { key: 'knowledge_base.articles.edit', label: 'Edit articles', description: 'Modify articles', action: 'edit' },
          { key: 'knowledge_base.articles.delete', label: 'Delete articles', description: 'Remove articles', action: 'delete' },
          { key: 'knowledge_base.articles.publish', label: 'Publish articles', description: 'Publish/unpublish articles', action: 'manage' },
          { key: 'knowledge_base.articles.reorder', label: 'Reorder articles', description: 'Change article order', action: 'manage' },
        ],
      },
      {
        tab: 'categories',
        label: 'Categories',
        description: 'Manage article categories',
        permissions: [
          { key: 'knowledge_base.categories.view', label: 'View categories', description: 'See categories', action: 'view' },
          { key: 'knowledge_base.categories.manage', label: 'Manage categories', description: 'Create/edit/delete categories', action: 'manage' },
        ],
      },
      {
        tab: 'comments',
        label: 'Comments',
        description: 'Manage article comments',
        permissions: [
          { key: 'knowledge_base.comments.view', label: 'View comments', description: 'See comments', action: 'view' },
          { key: 'knowledge_base.comments.create', label: 'Add comments', description: 'Post comments', action: 'create' },
          { key: 'knowledge_base.comments.moderate', label: 'Moderate comments', description: 'Edit/delete any comment', action: 'manage' },
        ],
      },
    ],
  },
  {
    module: 'reports',
    label: 'Reports',
    icon: 'BarChart3',
    description: 'Access reports and analytics',
    modulePermissions: [
      { key: 'reports.access', label: 'Access Reports Module', description: 'Can access Reports section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'sales',
        label: 'Sales Reports',
        description: 'Sales analytics',
        permissions: [
          { key: 'reports.sales.view', label: 'View sales reports', description: 'Access sales analytics', action: 'view' },
          { key: 'reports.sales.export', label: 'Export sales reports', description: 'Download sales data', action: 'export' },
        ],
      },
      {
        tab: 'clients',
        label: 'Client Reports',
        description: 'Client analytics',
        permissions: [
          { key: 'reports.clients.view', label: 'View client reports', description: 'Access client analytics', action: 'view' },
          { key: 'reports.clients.export', label: 'Export client reports', description: 'Download client data', action: 'export' },
        ],
      },
      {
        tab: 'pipeline',
        label: 'Pipeline Reports',
        description: 'Pipeline analytics',
        permissions: [
          { key: 'reports.pipeline.view', label: 'View pipeline reports', description: 'Access pipeline analytics', action: 'view' },
        ],
      },
      {
        tab: 'team',
        label: 'Team Reports',
        description: 'Team performance analytics',
        permissions: [
          { key: 'reports.team.view', label: 'View team reports', description: 'Access team performance', action: 'view' },
        ],
      },
      {
        tab: 'timesheet',
        label: 'Timesheet Reports',
        description: 'Time tracking reports',
        permissions: [
          { key: 'reports.timesheet.view_own', label: 'View own timesheet', description: 'See your time reports', action: 'view' },
          { key: 'reports.timesheet.view_all', label: 'View all timesheets', description: 'See all time reports', action: 'view' },
          { key: 'reports.timesheet.edit_all', label: 'Edit timesheets', description: 'Modify time entries', action: 'edit' },
          { key: 'reports.timesheet.export', label: 'Export timesheets', description: 'Download time data', action: 'export' },
        ],
      },
      {
        tab: 'one_on_one',
        label: '1-on-1 Performance',
        description: '1-on-1 meeting analytics',
        permissions: [
          { key: 'reports.one_on_one.view', label: 'View 1-on-1 reports', description: 'Access 1-on-1 analytics', action: 'view' },
        ],
      },
      {
        tab: 'cost_per_client',
        label: 'Cost Per Client',
        description: 'Staff labor cost by client',
        permissions: [
          { key: 'reports.cost_per_client.view', label: 'View cost per client', description: 'Access staff labor cost breakdown by client', action: 'view' },
        ],
      },
      {
        tab: 'call_center_cost',
        label: 'Call Center Cost',
        description: 'Call center labor cost by client',
        permissions: [
          { key: 'reports.call_center_cost.view', label: 'View call center cost', description: 'Access call center labor cost breakdown by client', action: 'view' },
        ],
      },
    ],
  },
  {
    module: 'call_center',
    label: 'Call Center',
    icon: 'Headphones',
    description: 'Call center time tracking',
    modulePermissions: [
      { key: 'call_center.access', label: 'Access Call Center', description: 'Can access the Call Center clock-in page', action: 'view' },
    ],
    tabs: [
      {
        tab: 'time_tracking',
        label: 'Time Tracking',
        description: 'Clock in/out and track time by client',
        permissions: [
          { key: 'call_center.time_tracking.clock_in', label: 'Clock In/Out', description: 'Can clock in and out for clients', action: 'create' },
          { key: 'call_center.time_tracking.view_own', label: 'View Own Report', description: 'Can view own weekly time report', action: 'view' },
          { key: 'call_center.time_tracking.view_all', label: 'View All Reports', description: 'Can view all call center time entries', action: 'view' },
          { key: 'call_center.time_tracking.add_time', label: 'Add Time Entry', description: 'Can manually add call center time entries for any rep', action: 'create' },
          { key: 'call_center.time_tracking.edit_time', label: 'Edit Time Entry', description: 'Can edit existing call center time entries', action: 'edit' },
        ],
      },
    ],
  },
  {
    module: 'settings',
    label: 'Settings',
    icon: 'Settings',
    description: 'System settings and configuration',
    modulePermissions: [
      { key: 'settings.access', label: 'Access Settings', description: 'Can access Settings section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'business_profile',
        label: 'Business Profile',
        description: 'Manage company/agency profile',
        permissions: [
          { key: 'settings.business_profile.view', label: 'View Business Profile', description: 'See company information', action: 'view' },
          { key: 'settings.business_profile.manage', label: 'Manage Business Profile', description: 'Edit company information', action: 'manage' },
        ],
      },
      {
        tab: 'staff',
        label: 'Staff',
        description: 'Manage staff members',
        permissions: [
          { key: 'settings.staff.view', label: 'View Staff', description: 'See staff list', action: 'view' },
          { key: 'settings.staff.manage', label: 'Manage Staff', description: 'Add/edit/remove staff', action: 'manage' },
        ],
      },
      {
        tab: 'px_settings',
        label: 'HR Settings',
        description: 'Configure HR settings',
        permissions: [
          { key: 'settings.px_settings.view', label: 'View HR Settings', description: 'See HR configuration', action: 'view' },
          { key: 'settings.px_settings.manage', label: 'Manage HR Settings', description: 'Configure HR settings', action: 'manage' },
        ],
      },
      {
        tab: 'clients',
        label: 'Clients',
        description: 'Configure client settings',
        permissions: [
          { key: 'settings.clients.view', label: 'View Client Settings', description: 'See client config', action: 'view' },
          { key: 'settings.clients.manage', label: 'Manage Client Settings', description: 'Configure clients', action: 'manage' },
        ],
      },
      {
        tab: 'sales',
        label: 'Sales',
        description: 'Configure sales settings',
        permissions: [
          { key: 'settings.sales.view', label: 'View Sales Settings', description: 'See sales configuration', action: 'view' },
          { key: 'settings.sales.manage', label: 'Manage Sales Settings', description: 'Configure sales', action: 'manage' },
        ],
      },
      {
        tab: 'leads',
        label: 'Leads',
        description: 'Configure lead settings',
        permissions: [
          { key: 'settings.leads.view', label: 'View Lead Settings', description: 'See lead configuration', action: 'view' },
          { key: 'settings.leads.manage', label: 'Manage Lead Settings', description: 'Configure leads', action: 'manage' },
        ],
      },
      {
        tab: 'roles_permissions',
        label: 'Roles & Permissions',
        description: 'Manage user roles and permissions',
        permissions: [
          { key: 'settings.roles_permissions.view', label: 'View Roles & Permissions', description: 'See role configurations', action: 'view' },
          { key: 'settings.roles_permissions.manage', label: 'Manage Roles & Permissions', description: 'Create/edit/delete roles', action: 'manage' },
        ],
      },
      {
        tab: 'permission_audit',
        label: 'Permission Audit',
        description: 'View permission audit reports',
        permissions: [
          { key: 'settings.permission_audit.view', label: 'View Permission Audit', description: 'See permission audit', action: 'view' },
          { key: 'settings.permission_audit.manage', label: 'Manage Permission Audit', description: 'Export audit reports', action: 'manage' },
        ],
      },
      {
        tab: 'calendar',
        label: 'Calendar Settings',
        description: 'Configure calendar settings',
        permissions: [
          { key: 'settings.calendar.view', label: 'View Calendar Settings', description: 'See calendar configuration', action: 'view' },
          { key: 'settings.calendar.manage', label: 'Manage Calendar Settings', description: 'Configure calendar', action: 'manage' },
        ],
      },
      {
        tab: 'integrations',
        label: 'Integrations',
        description: 'Manage third-party integrations',
        permissions: [
          { key: 'settings.integrations.view', label: 'View Integrations', description: 'See integration settings', action: 'view' },
          { key: 'settings.integrations.manage', label: 'Manage Integrations', description: 'Configure integrations', action: 'manage' },
        ],
      },
      {
        tab: 'ai_assistant',
        label: 'AI Assistant',
        description: 'Configure AI assistant settings',
        permissions: [
          { key: 'settings.ai_assistant.view', label: 'View AI Assistant', description: 'See AI configuration', action: 'view' },
          { key: 'settings.ai_assistant.manage', label: 'Manage AI Assistant', description: 'Configure AI assistant', action: 'manage' },
        ],
      },
      {
        tab: 'custom_fields',
        label: 'Custom Fields',
        description: 'Manage custom fields',
        permissions: [
          { key: 'settings.custom_fields.view', label: 'View Custom Fields', description: 'See field definitions', action: 'view' },
          { key: 'settings.custom_fields.manage', label: 'Manage Custom Fields', description: 'Create/edit/delete fields', action: 'manage' },
        ],
      },
      {
        tab: 'tags',
        label: 'Tags',
        description: 'Manage tags',
        permissions: [
          { key: 'settings.tags.view', label: 'View Tags', description: 'See tag settings', action: 'view' },
          { key: 'settings.tags.manage', label: 'Manage Tags', description: 'Create/edit/delete tags', action: 'manage' },
        ],
      },
      {
        tab: 'products',
        label: 'Products',
        description: 'Manage product catalog',
        permissions: [
          { key: 'settings.products.view', label: 'View Products', description: 'See product catalog', action: 'view' },
          { key: 'settings.products.manage', label: 'Manage Products', description: 'Create/edit/delete products', action: 'manage' },
        ],
      },
      {
        tab: 'tasks',
        label: 'Tasks',
        description: 'Configure task settings',
        permissions: [
          { key: 'settings.tasks.view', label: 'View Task Settings', description: 'See task configuration', action: 'view' },
          { key: 'settings.tasks.manage', label: 'Manage Task Settings', description: 'Configure tasks', action: 'manage' },
        ],
      },
      {
        tab: 'workflows',
        label: 'Workflows',
        description: 'Configure workflow settings',
        permissions: [
          { key: 'settings.workflows.view', label: 'View Workflows', description: 'See automation settings', action: 'view' },
          { key: 'settings.workflows.manage', label: 'Manage Workflows', description: 'Configure automation', action: 'manage' },
        ],
      },
      {
        tab: 'audit_logs',
        label: 'Audit Logs',
        description: 'View system audit logs',
        permissions: [
          { key: 'settings.audit_logs.view', label: 'View Audit Logs', description: 'See activity logs', action: 'view' },
          { key: 'settings.audit_logs.manage', label: 'Manage Audit Logs', description: 'Export audit logs', action: 'manage' },
        ],
      },
      {
        tab: 'tickets',
        label: 'Tickets',
        description: 'Manage ticket settings and forms',
        permissions: [
          { key: 'settings.tickets.view', label: 'View Ticket Settings', description: 'See ticket configuration', action: 'view' },
          { key: 'settings.tickets.manage', label: 'Manage Ticket Settings', description: 'Configure ticket settings and forms', action: 'manage' },
        ],
      },
      {
        tab: 'email_logging',
        label: 'Email Logging',
        description: 'Configure Gmail two-way sync and email logging defaults',
        permissions: [
          { key: 'settings.email_logging.view', label: 'View Email Logging', description: 'See Gmail sync configuration', action: 'view' },
          { key: 'settings.email_logging.manage', label: 'Manage Email Logging', description: 'Configure sync defaults, exclusions, and domain rules', action: 'manage' },
        ],
      },
    ],
  },
  {
    module: 'tickets',
    label: 'Tickets',
    icon: 'Ticket',
    description: 'System admin ticketing for bugs and feature requests',
    modulePermissions: [
      { key: 'tickets.access', label: 'Access Tickets', description: 'Can access the Tickets section', action: 'view' },
    ],
    tabs: [
      {
        tab: 'list',
        label: 'Ticket List',
        description: 'View and manage tickets',
        permissions: [
          { key: 'tickets.list.view', label: 'View tickets', description: 'See all tickets', action: 'view' },
          { key: 'tickets.list.create', label: 'Create tickets', description: 'Submit new tickets', action: 'create' },
          { key: 'tickets.list.edit', label: 'Edit tickets', description: 'Modify ticket details', action: 'edit' },
          { key: 'tickets.list.delete', label: 'Delete tickets', description: 'Remove tickets', action: 'delete' },
        ],
      },
      {
        tab: 'comments',
        label: 'Comments',
        description: 'Manage ticket comments',
        permissions: [
          { key: 'tickets.comments.view', label: 'View comments', description: 'See ticket comments', action: 'view' },
          { key: 'tickets.comments.create', label: 'Add comments', description: 'Post comments on tickets', action: 'create' },
          { key: 'tickets.comments.delete', label: 'Delete comments', description: 'Remove comments', action: 'delete' },
        ],
      },
      {
        tab: 'assign',
        label: 'Assignment',
        description: 'Assign tickets to staff',
        permissions: [
          { key: 'tickets.assign.manage', label: 'Assign tickets', description: 'Assign/reassign tickets to staff', action: 'manage' },
        ],
      },
      {
        tab: 'reports',
        label: 'Reports',
        description: 'View ticket reports and analytics',
        permissions: [
          { key: 'tickets.reports.view', label: 'View ticket reports', description: 'Access ticket analytics', action: 'view' },
          { key: 'tickets.reports.export', label: 'Export ticket reports', description: 'Download report data', action: 'export' },
        ],
      },
    ],
  },
];

/**
 * Mapping from old permission keys to new permission keys
 * Used for migration and backward compatibility
 */
export const PERMISSION_KEY_MIGRATION_MAP: Record<string, string> = {
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
  'reports.view_call_center_cost': 'reports.call_center_cost.view',
  'reports.export_reports': 'reports.sales.export',
  
  // Settings module - legacy key mappings
  // Old underscore format to new dot format
  'settings.view_general_settings': 'settings.business_profile.view',
  'settings.manage_general_settings': 'settings.business_profile.manage',
  'settings.view_roles_permissions': 'settings.roles_permissions.view',
  'settings.manage_roles_permissions': 'settings.roles_permissions.manage',
  'settings.view_custom_fields': 'settings.custom_fields.view',
  'settings.manage_custom_fields': 'settings.custom_fields.manage',
  'settings.view_integrations': 'settings.integrations.view',
  'settings.manage_integrations': 'settings.integrations.manage',
  'settings.view_tags': 'settings.tags.view',
  'settings.manage_tags': 'settings.tags.manage',
  'settings.view_products': 'settings.products.view',
  'settings.manage_products': 'settings.products.manage',
  'settings.view_workflows': 'settings.workflows.view',
  'settings.manage_workflows': 'settings.workflows.manage',
  'settings.view_hr': 'settings.px_settings.view',
  'settings.manage_hr': 'settings.px_settings.manage',
  'settings.view_clients': 'settings.clients.view',
  'settings.manage_clients': 'settings.clients.manage',
  'settings.view_tasks': 'settings.tasks.view',
  'settings.manage_tasks': 'settings.tasks.manage',
  'settings.view_sales': 'settings.sales.view',
  'settings.manage_sales': 'settings.sales.manage',
  'settings.view_audit_logs': 'settings.audit_logs.view',
  'settings.manage_audit_logs': 'settings.audit_logs.manage',
  'settings.view_business_profile': 'settings.business_profile.view',
  'settings.manage_business_profile': 'settings.business_profile.manage',
  'settings.view_staff': 'settings.staff.view',
  'settings.manage_staff': 'settings.staff.manage',
  'settings.view_leads': 'settings.leads.view',
  'settings.manage_leads': 'settings.leads.manage',
  'settings.view_calendar': 'settings.calendar.view',
  'settings.manage_calendar': 'settings.calendar.manage',
  'settings.view_ai_assistant': 'settings.ai_assistant.view',
  'settings.manage_ai_assistant': 'settings.ai_assistant.manage',
  'settings.view_permission_audit': 'settings.permission_audit.view',
  'settings.manage_permission_audit': 'settings.permission_audit.manage',
  'settings.view_px_settings': 'settings.px_settings.view',
  'settings.manage_px_settings': 'settings.px_settings.manage',
  // Old dot format mappings for backward compatibility
  'settings.general.view': 'settings.business_profile.view',
  'settings.general.edit': 'settings.business_profile.manage',
  'settings.roles.view': 'settings.roles_permissions.view',
  'settings.roles.create': 'settings.roles_permissions.manage',
  'settings.roles.edit': 'settings.roles_permissions.manage',
  'settings.roles.delete': 'settings.roles_permissions.manage',
  'settings.hr.view': 'settings.px_settings.view',
  'settings.hr.manage': 'settings.px_settings.manage',
  'settings.view_tickets': 'settings.tickets.view',
  'settings.manage_tickets': 'settings.tickets.manage',
};

/**
 * Get all permission keys for a specific module
 */
export function getModulePermissionKeys(module: string): string[] {
  const moduleTemplate = PERMISSION_TEMPLATES.find(t => t.module === module);
  if (!moduleTemplate) return [];
  
  const keys: string[] = [];
  
  // Add module-level permissions
  if (moduleTemplate.modulePermissions) {
    keys.push(...moduleTemplate.modulePermissions.map(p => p.key));
  }
  
  // Add tab permissions
  for (const tab of moduleTemplate.tabs) {
    keys.push(...tab.permissions.map(p => p.key));
  }
  
  return keys;
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

/**
 * Get all permission keys in the system
 */
export function getAllPermissionKeys(): string[] {
  const keys: string[] = [];
  
  for (const module of PERMISSION_TEMPLATES) {
    if (module.modulePermissions) {
      keys.push(...module.modulePermissions.map(p => p.key));
    }
    for (const tab of module.tabs) {
      keys.push(...tab.permissions.map(p => p.key));
    }
  }
  
  return keys;
}

/**
 * Get permission item by key
 */
export function getPermissionByKey(key: string): PermissionItem | undefined {
  for (const module of PERMISSION_TEMPLATES) {
    if (module.modulePermissions) {
      const found = module.modulePermissions.find(p => p.key === key);
      if (found) return found;
    }
    for (const tab of module.tabs) {
      const found = tab.permissions.find(p => p.key === key);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Migrate old permission key to new format
 */
export function migratePermissionKey(oldKey: string): string {
  return PERMISSION_KEY_MIGRATION_MAP[oldKey] || oldKey;
}

/**
 * Check if a key is an old-format permission key
 */
export function isOldPermissionKey(key: string): boolean {
  return key in PERMISSION_KEY_MIGRATION_MAP;
}

/**
 * Legacy interface for backward compatibility
 */
export interface SubPermission {
  key: string;
  label: string;
  description?: string;
  type: 'view' | 'manage' | 'view_manage' | 'delete' | 'export' | 'import';
}

/**
 * Legacy module format for UI backward compatibility
 */
export interface LegacyPermissionModule {
  module: string;
  label: string;
  icon?: string;
  description?: string;
  subPermissions: SubPermission[];
}

/**
 * Get PERMISSION_TEMPLATES in legacy flat format for UI backward compatibility
 * This flattens the hierarchical tabs->permissions structure into a single subPermissions array
 */
export function getLegacyPermissionTemplates(): LegacyPermissionModule[] {
  return PERMISSION_TEMPLATES.map(module => ({
    module: module.module,
    label: module.label,
    icon: module.icon,
    description: module.description,
    subPermissions: getLegacyPermissions(module.module),
  }));
}

/**
 * Convert new permission structure to legacy format for backward compatibility
 */
export function getLegacyPermissions(module: string): SubPermission[] {
  const moduleTemplate = getModuleTemplate(module);
  if (!moduleTemplate) return [];
  
  const permissions: SubPermission[] = [];
  
  if (moduleTemplate.modulePermissions) {
    for (const p of moduleTemplate.modulePermissions) {
      permissions.push({
        key: p.key,
        label: p.label,
        description: p.description,
        type: actionToLegacyType(p.action),
      });
    }
  }
  
  for (const tab of moduleTemplate.tabs) {
    for (const p of tab.permissions) {
      permissions.push({
        key: p.key,
        label: p.label,
        description: p.description,
        type: actionToLegacyType(p.action),
      });
    }
  }
  
  return permissions;
}

function actionToLegacyType(action: PermissionAction): SubPermission['type'] {
  switch (action) {
    case 'view': return 'view';
    case 'create': return 'manage';
    case 'edit': return 'view_manage';
    case 'delete': return 'delete';
    case 'export': return 'export';
    case 'import': return 'import';
    case 'manage': return 'view_manage';
    case 'approve': return 'manage';
    default: return 'view';
  }
}
