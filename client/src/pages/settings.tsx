import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
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
  Bot
} from "lucide-react";

const settingsNavigation = [
  { name: "Business Profile", href: "/settings/business-profile", icon: Building },
  { name: "My Profile", href: "/settings/my-profile", icon: User },
  { name: "Staff", href: "/settings/staff", icon: Users },
  { name: "PX Settings", href: "/settings/hr-settings", icon: UserCheck },
  { name: "Clients", href: "/settings/clients", icon: Contact },
  { name: "Sales", href: "/settings/sales", icon: Banknote },
  { name: "Leads", href: "/settings/leads", icon: Target },
  { name: "Roles & Permissions", href: "/settings/roles-permissions", icon: Shield },
  { name: "Permission Audit", href: "/settings/permission-audit", icon: ShieldCheck },
  { name: "Calendar Settings", href: "/calendar-settings", icon: Calendar },
  { name: "Integrations", href: "/settings/integrations", icon: Plug },
  { name: "AI Assistant", href: "/settings/ai-assistant", icon: Bot },
  { name: "Custom Fields", href: "/settings/custom-fields", icon: Database },
  { name: "Tags", href: "/settings/tags", icon: Tag },
  { name: "Products", href: "/settings/products", icon: Package },
  { name: "Tasks", href: "/settings/tasks", icon: Layers },
  { name: "Workflows", href: "/settings/automation-triggers", icon: Zap },
  { name: "Audit Logs", href: "/settings/audit-logs", icon: ScrollText },
];

export default function Settings() {
  const [location] = useLocation();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your AgencyBoost CRM configuration</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {settingsNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
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
    "PX Settings": "Configure time off categories and PX policies",
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
  };
  return descriptions[name] || "";
}