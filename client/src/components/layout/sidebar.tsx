import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Users,
  FolderOpen,
  Megaphone,
  UserPlus,
  CheckSquare,
  Calendar,
  FileText,
  BarChart3,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Settings,
  Layout,
  UserCheck,
  BookOpen,
  GraduationCap,
  Banknote,
  Ticket,
  Headphones
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Marketing", href: "/marketing", icon: Megaphone },
  { name: "Sales", href: "/sales", icon: Banknote },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendars", href: "/calendar", icon: Calendar },
  { name: "Workflows", href: "/workflows", icon: GitBranch },
  { name: "HR", href: "/hr", icon: UserCheck },
  { name: "Training", href: "/training", icon: GraduationCap },
  { name: "Resources", href: "/resources", icon: BookOpen },
  { name: "Call Center", href: "/call-center", icon: Headphones },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  // Fetch current user data for permission checking
  const { data: currentUser, isLoading: loadingPermissions } = useQuery({
    queryKey: ['/api/auth/current-user'],
    retry: false,
    queryFn: async () => {
      const response = await fetch('/api/auth/current-user', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }
      return response.json();
    },
  });

  // Helper function to check if user has permission to view a module
  const hasPermission = (module: string) => {
    // If permissions are still loading, deny access to prevent flash of unauthorized content
    if (loadingPermissions) {
      return false;
    }
    
    // Only admins get automatic access
    if (currentUser?.role === 'Admin' || currentUser?.role === 'admin') {
      return true;
    }
    
    // Check granular permissions (flat array format from API)
    // User can access module if ANY permission for that module is enabled
    if (currentUser?.granularPermissions && currentUser.granularPermissions.length > 0) {
      const hasGranularPermission = currentUser.granularPermissions.some(
        (gp: any) => gp.module === module && gp.enabled === true
      );
      
      if (hasGranularPermission) {
        return true;
      }
    }
    
    // Fallback to legacy permissions
    if (currentUser?.permissions) {
      const permission = currentUser.permissions.find((p: any) => p.module === module);
      if (permission?.canView === true) {
        return true;
      }
    }
    
    // DENY by default if no permissions found
    return false;
  };

  // Filter navigation based on permissions
  const visibleNavigation = navigation.filter(item => {
    // Map navigation items to permission modules
    const moduleMap: Record<string, string> = {
      "/clients": "clients",
      "/marketing": "campaigns",
      "/sales": "sales",
      "/leads": "leads",
      "/tasks": "tasks",
      "/calendar": "calendar",
      "/workflows": "workflows",
      "/hr": "hr",
      "/training": "training",
      "/resources": "knowledge_base",
      "/call-center": "call_center",
      "/reports": "reports",
      "/tickets": "tickets",
      "/settings": "settings",
    };
    
    const module = moduleMap[item.href];
    
    // Always show Dashboard
    if (item.href === "/dashboard") {
      return true;
    }
    
    // If no module mapping, show by default
    if (!module) {
      return true;
    }
    
    // Check permission
    return hasPermission(module);
  });

  const NavItem = ({ item, showTooltip = false }: { item: typeof navigation[0], showTooltip?: boolean }) => {
    const Icon = item.icon;
    const isActive = location === item.href;
    
    const linkContent = (
      <Link href={item.href} className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        isActive
          ? "text-white bg-primary"
          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
        isCollapsed && !isMobile && "justify-center"
      )}>
        <Icon className="h-4 w-4" />
        {(!isCollapsed || isMobile) && item.name}
      </Link>
    );

    if (showTooltip && isCollapsed && !isMobile) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.name}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <TooltipProvider>
      {/* Desktop sidebar */}
      <aside className={cn(
        "bg-white dark:bg-slate-900 shadow-sm border-r border-slate-200 dark:border-slate-700 transition-all duration-300 relative min-h-screen",
        isMobile ? "hidden" : "block",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className={cn("p-6", isCollapsed && "p-3")}>
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center"
          )}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && <h1 className="text-xl font-bold text-slate-900 dark:text-white">Agency<span className="text-primary">Boost</span></h1>}
          </div>
        </div>
        
        {/* Toggle button */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "absolute top-6 -right-3 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-10",
            "shadow-sm"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 text-slate-600 dark:text-slate-300" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-slate-600 dark:text-slate-300" />
          )}
        </button>
        
        <nav className={cn("px-4 pb-4", isCollapsed && "px-2")}>
          <ul className="space-y-2">
            {visibleNavigation.map((item) => (
              <li key={item.name}>
                <NavItem item={item} showTooltip={isCollapsed} />
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile sidebar */}
      {isMobile && (
        <aside className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 shadow-lg z-50 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Agency<span className="text-primary">Boost</span></h1>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              {visibleNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href || (item.href === "/settings" && location?.startsWith("/settings/"));
                
                return (
                  <li key={item.name}>
                    <Link href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "text-white bg-primary"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      )}
    </TooltipProvider>
  );
}