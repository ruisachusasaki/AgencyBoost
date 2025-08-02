import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, Search, Bell } from "lucide-react";
import { useLocation } from "wouter";

interface HeaderProps {
  onMenuClick: () => void;
}

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/clients": "Clients",
  "/projects": "Projects", 
  "/campaigns": "Campaigns",
  "/leads": "Leads",
  "/tasks": "Tasks",
  "/invoices": "Invoices",
  "/reports": "Reports"
};

export default function Header({ onMenuClick }: HeaderProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");

  const pageName = pageNames[location] || "Page";

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden p-2"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </Button>
          )}
          <h2 className="text-2xl font-bold text-slate-900">{pageName}</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Input
              type="search"
              placeholder="Search clients, projects..."
              className="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 hidden sm:block">Sarah Johnson</span>
            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-slate-600">SJ</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
