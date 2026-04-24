import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useHasPermissions } from "@/hooks/use-has-permission";
import {
  Building,
  User,
  Users,
  Shield,
  Plug,
  Database,
  Tag,
  Package,
  ScrollText,
  ShieldCheck,
  Calendar,
  Layers,
  UserCheck,
  Zap,
  Contact,
  Banknote,
  Target,
  Bot,
  Ticket,
  Mail
} from "lucide-react";

interface SettingsNavItem {
  name: string;
  href: string;
  icon: typeof Building;
  permission?: string;
}

const allSettingsNavigation: SettingsNavItem[] = [
  { name: "Business Profile", href: "/settings/business-profile", icon: Building, permission: "settings.business_profile.view" },
  { name: "My Profile", href: "/settings/my-profile", icon: User },
  { name: "Staff", href: "/settings/staff", icon: Users, permission: "settings.staff.view" },
  { name: "HR Settings", href: "/settings/hr-settings", icon: UserCheck, permission: "settings.px_settings.view" },
  { name: "Clients", href: "/settings/clients", icon: Contact, permission: "settings.clients.view" },
  { name: "Sales", href: "/settings/sales", icon: Banknote, permission: "settings.sales.view" },
  { name: "Leads", href: "/settings/leads", icon: Target, permission: "settings.leads.view" },
  { name: "Roles & Permissions", href: "/settings/roles-permissions", icon: Shield, permission: "settings.roles_permissions.view" },
  { name: "Permission Audit", href: "/settings/permission-audit", icon: ShieldCheck, permission: "settings.permission_audit.view" },
  { name: "Calendar Settings", href: "/settings/calendar-settings", icon: Calendar, permission: "settings.calendar.view" },
  { name: "Integrations", href: "/settings/integrations", icon: Plug, permission: "settings.integrations.view" },
  { name: "AI Assistant", href: "/settings/ai-assistant", icon: Bot, permission: "settings.ai_assistant.view" },
  { name: "Custom Fields", href: "/settings/custom-fields", icon: Database, permission: "settings.custom_fields.view" },
  { name: "Tags", href: "/settings/tags", icon: Tag, permission: "settings.tags.view" },
  { name: "Products", href: "/settings/products", icon: Package, permission: "settings.products.view" },
  { name: "Tasks", href: "/settings/tasks", icon: Layers, permission: "settings.tasks.view" },
  { name: "Workflows", href: "/settings/automation-triggers", icon: Zap, permission: "settings.workflows.view" },
  { name: "Audit Logs", href: "/settings/audit-logs", icon: ScrollText, permission: "settings.audit_logs.view" },
  { name: "Tickets", href: "/settings/tickets", icon: Ticket, permission: "settings.tickets.view" },
  { name: "Email Logging", href: "/settings/email-logging", icon: Mail, permission: "settings.email_logging.view" },
];

export default function Settings() {
  const [location] = useLocation();
  
  // Get all settings permissions
  const permissionKeys = allSettingsNavigation
    .filter(item => item.permission)
    .map(item => item.permission as string);
  
  const { permissions } = useHasPermissions(permissionKeys);
  
  // Filter navigation items based on permissions
  const settingsNavigation = useMemo(() => {
    return allSettingsNavigation.filter(item => {
      // Items without permission requirement are always visible (like My Profile)
      if (!item.permission) return true;
      // Check if user has this permission
      return permissions[item.permission];
    });
  }, [permissions]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your AgencyBoost CRM configuration</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {settingsNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {getSettingDescription(item.name)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getSettingDescription(name: string): string {
  const descriptions: Record<string, string> = {
    "Business Profile": "Manage company information and branding",
    "My Profile": "Update your personal profile and preferences",
    "Staff": "Manage team members and user accounts",
    "HR Settings": "Configure time off categories and HR policies",
    "Clients": "Configure client settings and management options",
    "Sales": "Manage sales calculations and commission settings",
    "Leads": "Customize lead source options and tracking settings",
    "Roles & Permissions": "Create custom roles and set permissions",
    "Permission Audit": "Track permission changes and role assignments",
    "Calendar Settings": "Configure calendar availability and booking pages",
    "Integrations": "Connect external services and tools",
    "AI Assistant": "Teach the AI Assistant about your setup",
    "Custom Fields": "Create and manage custom contact fields",
    "Tags": "Organize and manage system tags",
    "Products": "Manage your products and services catalog",
    "Tasks": "Configure task statuses, priorities, and settings",
    "Workflows": "Manage automation trigger definitions and workflows",
    "Audit Logs": "View system activity and audit trail",
    "Tickets": "Configure ticket routing and management rules",
    "Email Logging": "Configure Gmail two-way sync, exclusions and connected mailboxes",
  };
  return descriptions[name] || "";
}