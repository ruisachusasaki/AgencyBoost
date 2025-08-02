import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Home,
  Users,
  FolderOpen,
  Megaphone,
  UserPlus,
  CheckSquare,
  FileText,
  BarChart3,
  TrendingUp,
  X
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "w-64 bg-white shadow-sm border-r border-slate-200 transition-transform duration-300",
        isMobile ? "hidden" : "block"
      )}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">AgencyFlow</h1>
          </div>
        </div>
        
        <nav className="px-4 pb-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "text-white bg-primary"
                        : "text-slate-700 hover:bg-slate-100"
                    )}>
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile sidebar */}
      {isMobile && (
        <aside className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">AgencyFlow</h1>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <a 
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          isActive
                            ? "text-white bg-primary"
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      )}
    </>
  );
}
