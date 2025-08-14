import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  BarChart3, 
  FileInput,
  Plus,
  FolderPlus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Form, FormFolder, FormSubmission } from "@shared/schema";

import FormsBuilder from "./forms/builder";
import FormsAnalytics from "./forms/analytics";
import FormsSubmissions from "./forms/submissions";

export default function Forms() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "updatedAt">("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Determine active sub-tab based on current path
  const getActiveSubTab = () => {
    if (location === "/marketing/forms/analytics") {
      return "analytics";
    } else if (location === "/marketing/forms/submissions") {
      return "submissions";
    }
    return "builder"; // default
  };

  const activeSubTab = getActiveSubTab();

  const subTabs = [
    {
      id: "builder",
      name: "Builder",
      href: "/marketing/forms",
      icon: FileText,
    },
    {
      id: "analytics",
      name: "Analytics", 
      href: "/marketing/forms/analytics",
      icon: BarChart3,
    },
    {
      id: "submissions",
      name: "Submissions",
      href: "/marketing/forms/submissions", 
      icon: FileInput,
    },
  ];

  const handleSort = (field: "name" | "updatedAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "name" | "updatedAt") => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const renderContent = () => {
    switch (activeSubTab) {
      case "analytics":
        return <FormsAnalytics />;
      case "submissions":
        return <FormsSubmissions />;
      case "builder":
      default:
        return <FormsBuilder />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Forms Tabs">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex items-center space-x-2 border-b-2 py-2 px-1 text-sm font-medium transition-colors hover:text-foreground",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
}