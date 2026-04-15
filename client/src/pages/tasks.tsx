import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Calendar, CheckCircle, CheckSquare, GripVertical, Flag, User, ChevronDown, ChevronRight, ChevronUp, Table as TableIcon, Columns, Filter, Save, X, Share2, Globe, Lock, MoreHorizontal, Bookmark, Building2, FileText, Settings2, Clock, Eye, EyeOff, Play, Square, Repeat, Check } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { TaskIntakeDialog } from "@/components/task-intake-dialog";
import { TaskDependencyIcons, TaskDependency } from "@/components/task-dependency-icons";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useHasPermission, useRolePermissions } from "@/hooks/use-has-permission";
import type { Task, Client, Campaign, Staff, TaskStatus, TaskPriority, TaskCategory, TaskTemplate } from "@shared/schema";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TagDisplay } from "@/components/ui/tag-selector";
import { useTimer } from "@/contexts/TimerContext";
import { format, startOfDay, startOfWeek, endOfWeek, addDays, addWeeks, isSameDay, isWithinInterval } from "date-fns";


interface Column {
  id: string;
  label: string;
  width?: number;
  minWidth?: number;
  visible: boolean;
}

// Default column widths in pixels
const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  name: 200,
  assignee: 150,
  startDate: 120,
  dueDate: 120,
  status: 120,
  priority: 100,
  category: 120,
  tags: 150,
  approval: 100,
  client: 150,
  project: 150,
  timeEstimate: 110,
  timeTracked: 140,
  createdAt: 120,
};

// All available columns that can be shown/hidden
const ALL_AVAILABLE_COLUMNS: Column[] = [
  { id: "name", label: "Task Name", width: 200, minWidth: 150, visible: true },
  { id: "assignee", label: "Assignee", width: 150, minWidth: 100, visible: true },
  { id: "startDate", label: "Start Date", width: 120, minWidth: 100, visible: false },
  { id: "dueDate", label: "Due Date", width: 120, minWidth: 100, visible: true },
  { id: "status", label: "Status", width: 120, minWidth: 80, visible: true },
  { id: "priority", label: "Priority", width: 100, minWidth: 80, visible: true },
  { id: "category", label: "Category", width: 120, minWidth: 80, visible: true },
  { id: "tags", label: "Tags", width: 150, minWidth: 100, visible: true },
  { id: "approval", label: "Approval", width: 100, minWidth: 80, visible: true },
  { id: "client", label: "Client/Lead", width: 150, minWidth: 100, visible: true },
  { id: "project", label: "Project", width: 150, minWidth: 100, visible: false },
  { id: "timeEstimate", label: "Time Estimate", width: 110, minWidth: 80, visible: false },
  { id: "timeTracked", label: "Time Tracked", width: 140, minWidth: 100, visible: false },
  { id: "createdAt", label: "Created", width: 120, minWidth: 100, visible: false },
];

interface TaskFilterCondition {
  field: string;
  operator: string;
  value: string;
}

interface TaskFilter {
  conditions: TaskFilterCondition[];
  logic: 'AND' | 'OR';
}

interface SmartList {
  id: string;
  name: string;
  description?: string;
  entityType: 'tasks';
  filters: TaskFilter;
  createdBy: string;
  visibility: 'personal' | 'shared' | 'universal';
  sharedWith?: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type SortField = 'title' | 'assignedTo' | 'dueDate' | 'status' | 'priority' | 'clientId' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'kanban';

function MultiSelectFilter({ 
  selected, 
  onChange, 
  options, 
  placeholder 
}: { 
  selected: string[]; 
  onChange: (values: string[]) => void; 
  options: { value: string; label: string; color?: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  const filtered = search 
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())) 
    : options;

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  const displayText = selected.length === 0 
    ? placeholder 
    : selected.length === 1 
      ? options.find(o => o.value === selected[0])?.label || selected[0]
      : `${selected.length} selected`;

  return (
    <div ref={containerRef} className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => { setOpen(!open); if (!open) setSearch(""); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } }}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${selected.length > 0 ? "ring-1 ring-[hsl(179,100%,39%)]" : ""}`}
      >
        <span className={`truncate ${selected.length === 0 ? "text-muted-foreground" : ""}`}>{displayText}</span>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-gray-200 text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange([]); } }}
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 opacity-50 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
      {open && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg">
          {options.length > 6 && (
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-2 py-1.5 text-sm border rounded-md bg-background outline-none focus:ring-1 focus:ring-ring"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="overflow-y-auto" style={{ maxHeight: "220px" }}>
            {filtered.map((opt) => (
              <div
                key={opt.value}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => toggle(opt.value)}
              >
                <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(opt.value) ? "bg-[hsl(179,100%,39%)] border-[hsl(179,100%,39%)] text-white" : "border-input"}`}>
                  {selected.includes(opt.value) && <Check className="h-3 w-3" />}
                </div>
                {opt.color && <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
                <span className="truncate">{opt.label}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [columns, setColumns] = useState<Column[]>(ALL_AVAILABLE_COLUMNS);
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [overdueFilter, setOverdueFilter] = useState<string>("all");
  const [workflowFilter, setWorkflowFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  
  const { currentTimer, isTimerRunning, startTimer, stopTimer, elapsedTime } = useTimer();
  
  // Smart Lists state
  const [currentFilter, setCurrentFilter] = useState<TaskFilter>({
    conditions: [],
    logic: 'AND'
  });
  const [activeSmartList, setActiveSmartList] = useState<string | null>(null);
  const [smartListName, setSmartListName] = useState("");
  const [smartListDescription, setSmartListDescription] = useState("");
  const [isSaveSmartListOpen, setIsSaveSmartListOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [isShareSmartListOpen, setIsShareSmartListOpen] = useState(false);
  const [shareListId, setShareListId] = useState<string | null>(null);
  const [shareWithUsers, setShareWithUsers] = useState<string[]>([]);
  const [shareVisibility, setShareVisibility] = useState<'personal' | 'shared' | 'universal'>('personal');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Smart list overflow handling
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const maxVisibleTabs = 5; // Show "All Tasks" + "My Tasks" + up to 3 smart lists, then "More"
  
  // Confirmation dialog state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  const [location, setLocation] = useLocation();
  
  // Handle URL parameters - clean up if present (legacy support)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('openModal') || urlParams.has('leadId')) {
      // Clean up URL params
      window.history.replaceState({}, '', '/tasks');
    }
  }, []);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const taskIds = useMemo(() => (tasks || []).map((t: Task) => t.id), [tasks]);
  const { data: batchDepsData } = useQuery<Record<string, { dependencies: TaskDependency[]; dependentTasks: any[] }>>({
    queryKey: ["/api/tasks/batch-dependencies", taskIds],
    queryFn: async () => {
      if (taskIds.length === 0) return {};
      const res = await apiRequest("POST", "/api/tasks/batch-dependencies", { taskIds });
      return res.json();
    },
    enabled: taskIds.length > 0,
  });

  const { data: clientsData } = useQuery<{ clients: Client[] }>({
    queryKey: ["/api/clients"],
  });
  
  const clients = clientsData?.clients || [];

  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  // Fetch staff for assignee names
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Fetch dynamic task settings
  const { data: taskStatuses = [] } = useQuery<TaskStatus[]>({
    queryKey: ["/api/task-statuses"],
  });

  const { data: taskPriorities = [] } = useQuery<TaskPriority[]>({
    queryKey: ["/api/task-priorities"],
  });

  const { data: taskCategories = [] } = useQuery<TaskCategory[]>({
    queryKey: ["/api/task-categories"],
  });

  // Fetch team workflows for workflow-aware Kanban
  const { data: workflows = [] } = useQuery<any[]>({
    queryKey: ["/api/team-workflows"],
  });

  const { data: workflowStatusMap } = useQuery<{ workflows: any[]; categoryWorkflowMap: { id: string; workflowId: string }[] }>({
    queryKey: ["/api/task-workflow-status-map"],
  });

  // Fetch current user for Smart Lists authentication
  const { data: currentUser } = useQuery<{ id: string; role: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/current-user'],
  });

  // Fetch Smart Lists for tasks
  const { data: smartLists = [] } = useQuery<SmartList[]>({
    queryKey: ["/api/smart-lists", { entityType: "tasks" }],
    enabled: !!currentUser,
  });

  // Fetch user's saved column preferences
  const { data: savedPreferences } = useQuery<{ preferences: { columns?: { id: string; visible: boolean; width?: number }[] } }>({
    queryKey: ["/api/user-view-preferences/tasks-columns"],
    enabled: !!currentUser,
  });

  // Track if preferences have been initially loaded
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  
  // Track column being resized
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartXRef = React.useRef(0);
  const resizeStartWidthRef = React.useRef(0);
  const columnsRef = React.useRef(columns);
  
  useEffect(() => {
    if (currentUser && activeTab === "my-tasks") {
      setCurrentFilter({
        conditions: [{
          field: 'assignedTo',
          operator: 'equals',
          value: currentUser.id
        }],
        logic: 'AND'
      });
    }
  }, [currentUser]);

  // Keep columnsRef in sync with columns state
  React.useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  // Mutation to save column preferences
  const saveColumnPreferencesMutation = useMutation({
    mutationFn: async (columnPrefs: { id: string; visible: boolean; width?: number }[]) => {
      const response = await apiRequest("POST", "/api/user-view-preferences/tasks-columns", {
        preferences: { columns: columnPrefs }
      });
      if (!response.ok) {
        throw new Error("Failed to save column preferences");
      }
      return response.json();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save column preferences",
        variant: "destructive",
      });
    },
  });

  // Load saved column preferences when they're fetched (only once)
  useEffect(() => {
    if (savedPreferences?.preferences?.columns && !preferencesLoaded) {
      const savedCols = savedPreferences.preferences.columns as { id: string; visible: boolean; width?: number }[];
      
      // Restore column order from saved preferences
      setColumns(prev => {
        // Create a map of saved column preferences
        const savedColMap = new Map(savedCols.map(c => [c.id, c]));
        
        // Build ordered columns array based on saved order
        const orderedColumns: typeof prev = [];
        
        // First, add columns in the saved order
        for (const savedCol of savedCols) {
          const existingCol = prev.find(c => c.id === savedCol.id);
          if (existingCol) {
            orderedColumns.push({
              ...existingCol,
              visible: savedCol.visible,
              width: savedCol.width || existingCol.width || DEFAULT_COLUMN_WIDTHS[existingCol.id] || 120
            });
          }
        }
        
        // Add any new columns that weren't in saved preferences (at the end)
        for (const col of prev) {
          if (!savedColMap.has(col.id)) {
            orderedColumns.push(col);
          }
        }
        
        return orderedColumns;
      });
      setPreferencesLoaded(true);
    }
  }, [savedPreferences, preferencesLoaded]);

  // Use role-based permission hook for consistent permission checks
  const { canManageTaskTemplates, canManageUniversalSmartLists, isAdmin } = useRolePermissions();
  const { hasPermission: hasTaskTemplatesPermission } = useHasPermission('tasks.templates.manage');

  // Auto-select first workflow if none selected and workflows are available
  React.useEffect(() => {
    if (workflows.length > 0 && !workflowFilter) {
      setWorkflowFilter(workflows[0].id);
    }
  }, [workflows, workflowFilter]);

  // Clear selected team members when visibility changes away from "shared"
  React.useEffect(() => {
    if (shareVisibility !== 'shared') {
      setShareWithUsers([]);
    }
  }, [shareVisibility]);

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/tasks/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status}`);
      }
      return null; // 204 No Content has no response body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        variant: "default",
        description: "The task has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PUT", `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: any) => {
      // Handle dependency validation errors by checking message content
      const errorMessage = error?.message || "";
      if (errorMessage.includes("dependencies that need to be completed first") || error?.isDependencyError) {
        // Extract the details from the JSON in the error message if present
        let details = error?.details;
        if (!details && errorMessage.includes('{"message"')) {
          try {
            const jsonMatch = errorMessage.match(/\{.*\}/);
            if (jsonMatch) {
              const errorData = JSON.parse(jsonMatch[0]);
              details = errorData.details;
            }
          } catch (e) {
            // Fallback to a generic message
            details = "Please complete the required dependencies first";
          }
        }
        
        toast({
          title: "Cannot Complete Task",
          description: details || "This task has dependencies that need to be completed first",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update task. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const updateTaskFieldMutation = useMutation({
    mutationFn: async ({ id, ...fields }: { id: string; [key: string]: any }) => {
      await apiRequest("PUT", `/api/tasks/${id}`, fields);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper functions - moved above sorting logic
  const getClientOrLeadName = (task: Task) => {
    // Check if task has a client - show business name first
    if (task.clientId) {
      const client = clients.find((c: Client) => c.id === task.clientId);
      return client?.company || client?.name || "Unknown Client";
    }
    // Check if task has a lead
    if (task.leadId) {
      const lead = leads.find((l: any) => l.id === task.leadId);
      return lead?.name || "Unknown Lead";
    }
    return null;
  };

  // Keep old function for backward compatibility - show business name first
  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = clients.find((c: Client) => c.id === clientId);
    return client?.company || client?.name || "Unknown Client";
  };


  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = taskCategories.find(c => c.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return '#6b7280';
    const category = taskCategories.find(c => c.id === categoryId);
    return category?.color || '#6b7280';
  };

  const getTaskWorkflowStatuses = (task: Task) => {
    let wfId = task.workflowId;
    if (!wfId && task.categoryId) {
      const catMapping = workflowStatusMap?.categoryWorkflowMap?.find(c => c.id === task.categoryId);
      if (catMapping?.workflowId) {
        wfId = catMapping.workflowId;
      } else {
        const cat = taskCategories.find(c => c.id === task.categoryId);
        if (cat?.workflowId) wfId = cat.workflowId;
      }
    }
    if (wfId) {
      const mapWf = workflowStatusMap?.workflows?.find((w: any) => w.id === wfId);
      if (mapWf?.statuses?.length > 0) {
        return mapWf.statuses.map((ws: any) => ({
          value: ws.status.value,
          name: ws.status.name,
          color: ws.status.color,
        }));
      }
      const wf = workflows.find((w: any) => w.id === wfId);
      if (wf?.statuses?.length > 0) {
        return wf.statuses.map((ws: any) => ({
          value: ws.status.value,
          name: ws.status.name,
          color: ws.status.color,
        }));
      }
    }
    return taskStatuses.filter(s => s.isActive).map(s => ({
      value: s.value,
      name: s.name,
      color: s.color,
    }));
  };

  const getCampaignName = (campaignId: string | null) => {
    if (!campaignId) return null;
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.name || "Unknown Campaign";
  };

  const getStaffName = (staffId: string | null) => {
    if (!staffId) return null;
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Unknown";
  };

  const getStaffMember = (staffId: string | null) => {
    if (!staffId) return null;
    return staff.find(s => s.id === staffId) || null;
  };

  const getStaffInitials = (staffMember: Staff | null) => {
    if (!staffMember) return "?";
    const first = staffMember.firstName?.[0] || "";
    const last = staffMember.lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  // Get unique values for dropdown fields from actual task data
  const getFieldOptions = (fieldName: string): string[] => {
    if (!tasks || tasks.length === 0) return [];
    
    const values = tasks
      .map(task => {
        switch (fieldName) {
          case 'status': return task.status;
          case 'priority': return task.priority;
          case 'assignedTo': return getStaffName(task.assignedTo);
          case 'clientId': return getClientOrLeadName(task);
          case 'categoryId': return getCategoryName(task.categoryId);
          default: return null;
        }
      })
      .filter((value): value is string => Boolean(value) && value !== 'Unknown' && value !== 'Unknown Client' && value !== 'Unknown Project' && value !== 'Unknown Category')
      .filter((value, index, array) => array.indexOf(value) === index) // Remove duplicates
      .sort();
    
    return values;
  };

  // Check if a field should use dropdown for value selection
  const isDropdownField = (fieldName: string): boolean => {
    return ['status', 'priority', 'assignedTo', 'clientId', 'categoryId'].includes(fieldName);
  };

  // Get count for a specific smart list (independent of current active filter)
  const getSmartListCount = (smartList: SmartList): number => {
    if (!tasks || tasks.length === 0) return 0;
    return applyTaskFilter(tasks, smartList.filters).length;
  };

  // Get visible Smart Lists based on user permissions
  const getVisibleSmartLists = (): SmartList[] => {
    if (!currentUser) return [];
    
    // Filter and deduplicate Smart Lists
    const filtered = smartLists.filter(list => {
      // Only include tasks Smart Lists
      if (list.entityType !== 'tasks') return false;
      
      // Universal lists are visible to everyone
      if (list.visibility === 'universal') return true;
      
      // Personal lists are only visible to the creator
      if (list.visibility === 'personal') return list.createdBy === currentUser.id;
      
      // Shared lists are visible to creator and shared users
      if (list.visibility === 'shared') {
        return list.createdBy === currentUser.id || 
               (list.sharedWith && list.sharedWith.includes(currentUser.id));
      }
      
      return false;
    });

    // Deduplicate by ID
    const seen = new Set();
    return filtered.filter(list => {
      if (seen.has(list.id)) return false;
      seen.add(list.id);
      return true;
    });
  };

  // Apply filter to tasks
  const applyTaskFilter = (tasks: Task[], filter: TaskFilter): Task[] => {
    console.log('Applying task filter with conditions:', filter.conditions);
    console.log('Filter logic:', filter.logic);
    
    if (!filter.conditions || filter.conditions.length === 0) {
      console.log('No filter conditions, returning all tasks');
      return tasks;
    }

    return tasks.filter(task => {
      const results = filter.conditions.map(condition => {
        if (!condition.field || !condition.operator) return true;
        // Skip timeFilter - it's handled separately via UI state
        if (condition.field === 'timeFilter') return true;

        const getValue = (field: string): string => {
          switch (field) {
            case 'title': return task.title || '';
            case 'description': return task.description || '';
            case 'status': return task.status || '';
            case 'priority': return task.priority || '';
            case 'assignedTo': return task.assignedTo || '';
            case 'clientId': return task.clientId || '';
            case 'categoryId': return task.categoryId || '';
            case 'dueDate': return task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '';
            case 'createdAt': return task.createdAt ? format(new Date(task.createdAt), 'yyyy-MM-dd') : '';
            default: return '';
          }
        };

        const fieldValue = getValue(condition.field).toLowerCase();
        const searchValue = condition.value.toLowerCase();
        
        console.log(`Filter condition: ${condition.field} ${condition.operator} ${condition.value}`);
        console.log(`Field value: "${fieldValue}", Search value: "${searchValue}"`);

        switch (condition.operator) {
          case 'contains': return fieldValue.includes(searchValue);
          case 'equals': return fieldValue === searchValue;
          case 'in': return condition.value.split(',').map((v: string) => v.toLowerCase().trim()).includes(fieldValue);
          case 'starts_with': return fieldValue.startsWith(searchValue);
          case 'ends_with': return fieldValue.endsWith(searchValue);
          case 'not_equals': return fieldValue !== searchValue;
          case 'is_empty': return fieldValue === '';
          case 'is_not_empty': return fieldValue !== '';
          case 'before': 
            if (condition.field === 'dueDate' || condition.field === 'createdAt') {
              const taskDate = condition.field === 'dueDate' ? task.dueDate : task.createdAt;
              return taskDate ? new Date(taskDate) < new Date(condition.value) : false;
            }
            return false;
          case 'after':
            if (condition.field === 'dueDate' || condition.field === 'createdAt') {
              const taskDate = condition.field === 'dueDate' ? task.dueDate : task.createdAt;
              return taskDate ? new Date(taskDate) > new Date(condition.value) : false;
            }
            return false;
          default: return true;
        }
      });

      return filter.logic === 'AND' 
        ? results.every(result => result)
        : results.some(result => result);
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper function to check if any filters are active
  const areFiltersActive = (): boolean => {
    return (
      searchTerm.trim() !== "" ||
      statusFilter.length > 0 ||
      assigneeFilter.length > 0 ||
      priorityFilter.length > 0 ||
      clientFilter.length > 0 ||
      categoryFilter.length > 0 ||
      overdueFilter !== "all" ||
      timeFilter !== "all" ||
      showCompleted ||
      showCancelled ||
      currentFilter.conditions.length > 0
    );
  };

  // Clear all filters to default state
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter([]);
    setAssigneeFilter([]);
    setPriorityFilter([]);
    setClientFilter([]);
    setCategoryFilter([]);
    setOverdueFilter("all");
    setTimeFilter("all");
    setShowCompleted(false);
    setShowCancelled(false);
    setCurrentFilter({ conditions: [], logic: 'AND' });
    setActiveSmartList(null);
    setActiveTab("all-tasks");
    
    toast({
      title: "Filters Cleared",
      variant: "default",
      description: "All filters have been reset to default."
    });
  };

  // Convert current filters to Smart List format and open save dialog
  const handleSaveCurrentFiltersAsSmartList = () => {
    // Convert current filter states to TaskFilter conditions
    const conditions: any[] = [];
    
    if (searchTerm.trim()) {
      conditions.push({
        field: 'title',
        operator: 'contains',
        value: searchTerm.trim()
      });
    }
    
    if (statusFilter.length > 0) {
      conditions.push({
        field: 'status',
        operator: 'in',
        value: statusFilter.join(',')
      });
    }
    
    if (assigneeFilter.length > 0) {
      if (assigneeFilter.includes("unassigned") && assigneeFilter.length === 1) {
        conditions.push({
          field: 'assignedTo',
          operator: 'is_empty',
          value: ''
        });
      } else {
        const nonUnassigned = assigneeFilter.filter(a => a !== "unassigned");
        if (nonUnassigned.length > 0) {
          conditions.push({
            field: 'assignedTo',
            operator: 'in',
            value: nonUnassigned.join(',')
          });
        }
        if (assigneeFilter.includes("unassigned")) {
          conditions.push({
            field: 'assignedTo',
            operator: 'is_empty',
            value: ''
          });
        }
      }
    }
    
    if (priorityFilter.length > 0) {
      conditions.push({
        field: 'priority',
        operator: 'in',
        value: priorityFilter.join(',')
      });
    }
    
    if (clientFilter.length > 0) {
      const clientIds = clientFilter.filter(c => c.startsWith("client-")).map(c => c.replace("client-", ""));
      const leadIds = clientFilter.filter(c => c.startsWith("lead-")).map(c => c.replace("lead-", ""));
      const hasNone = clientFilter.includes("none");
      
      if (clientIds.length > 0) {
        conditions.push({
          field: 'clientId',
          operator: 'in',
          value: clientIds.join(',')
        });
      }
      if (leadIds.length > 0) {
        conditions.push({
          field: 'leadId',
          operator: 'in',
          value: leadIds.join(',')
        });
      }
      if (hasNone) {
        conditions.push({
          field: 'clientId',
          operator: 'is_empty',
          value: ''
        });
      }
    }
    
    if (categoryFilter.length > 0) {
      if (categoryFilter.includes("none") && categoryFilter.length === 1) {
        conditions.push({
          field: 'categoryId',
          operator: 'is_empty',
          value: ''
        });
      } else {
        const nonNone = categoryFilter.filter(c => c !== "none");
        if (nonNone.length > 0) {
          conditions.push({
            field: 'categoryId',
            operator: 'in',
            value: nonNone.join(',')
          });
        }
        if (categoryFilter.includes("none")) {
          conditions.push({
            field: 'categoryId',
            operator: 'is_empty',
            value: ''
          });
        }
      }
    }
    
    // Save time filter (Today, This Week, etc.)
    if (timeFilter !== "all") {
      conditions.push({
        field: 'timeFilter',
        operator: 'equals',
        value: timeFilter
      });
    }

    // Note: We build the Smart List filter solely from current UI state
    // to avoid duplicate/conflicting conditions
    
    // Set the filter for saving
    setCurrentFilter({
      conditions,
      logic: 'AND'
    });
    
    // Open the save dialog
    setIsSaveSmartListOpen(true);
  };

  // Smart Lists management functions
  const handleLoadSmartList = (smartList: SmartList) => {
    console.log('Loading Smart List:', smartList.name, smartList.filters);
    setCurrentFilter(smartList.filters);
    setActiveSmartList(smartList.id);
    setActiveTab(smartList.id);
    
    setSearchTerm("");
    setStatusFilter([]);
    setAssigneeFilter([]);
    setPriorityFilter([]);
    setClientFilter([]);
    setCategoryFilter([]);
    setTimeFilter("all");
    
    if (smartList.filters?.conditions) {
      const newStatus: string[] = [];
      const newAssignee: string[] = [];
      const newPriority: string[] = [];
      const newClient: string[] = [];
      const newCategory: string[] = [];
      
      for (const condition of smartList.filters.conditions) {
        switch (condition.field) {
          case 'title':
            if (condition.operator === 'contains') setSearchTerm(condition.value);
            break;
          case 'status':
            if (condition.operator === 'in') newStatus.push(...condition.value.split(','));
            else if (condition.operator === 'equals') newStatus.push(condition.value);
            break;
          case 'assignedTo':
            if (condition.operator === 'in') newAssignee.push(...condition.value.split(','));
            else if (condition.operator === 'equals') newAssignee.push(condition.value);
            else if (condition.operator === 'is_empty') newAssignee.push("unassigned");
            break;
          case 'priority':
            if (condition.operator === 'in') newPriority.push(...condition.value.split(','));
            else if (condition.operator === 'equals') newPriority.push(condition.value);
            break;
          case 'clientId':
            if (condition.operator === 'in') newClient.push(...condition.value.split(',').map((id: string) => `client-${id}`));
            else if (condition.operator === 'equals') newClient.push(`client-${condition.value}`);
            else if (condition.operator === 'is_empty') newClient.push("none");
            break;
          case 'leadId':
            if (condition.operator === 'in') newClient.push(...condition.value.split(',').map((id: string) => `lead-${id}`));
            else if (condition.operator === 'equals') newClient.push(`lead-${condition.value}`);
            break;
          case 'categoryId':
            if (condition.operator === 'in') newCategory.push(...condition.value.split(','));
            else if (condition.operator === 'equals') newCategory.push(condition.value);
            else if (condition.operator === 'is_empty') newCategory.push("none");
            break;
          case 'timeFilter':
            if (condition.operator === 'equals') setTimeFilter(condition.value);
            break;
        }
      }
      
      if (newStatus.length > 0) setStatusFilter(newStatus);
      if (newAssignee.length > 0) setAssigneeFilter(newAssignee);
      if (newPriority.length > 0) setPriorityFilter(newPriority);
      if (newClient.length > 0) setClientFilter(newClient);
      if (newCategory.length > 0) setCategoryFilter(newCategory);
    }
  };

  const handleTabChange = (tabValue: string) => {
    if (tabValue === "all-tasks") {
      setCurrentFilter({ conditions: [], logic: 'AND' });
      setActiveSmartList(null);
    } else if (tabValue === "my-tasks") {
      // Filter to show only tasks assigned to current user
      if (currentUser) {
        setCurrentFilter({
          conditions: [{
            field: 'assignedTo',
            operator: 'equals',
            value: currentUser.id
          }],
          logic: 'AND'
        });
      }
      setActiveSmartList(null);
    } else {
      const smartList = getVisibleSmartLists().find(list => list.id === tabValue);
      if (smartList) {
        handleLoadSmartList(smartList);
      }
    }
    setActiveTab(tabValue);
  };

  const saveSmartListMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; filters: TaskFilter; visibility: 'personal' | 'shared' | 'universal'; sharedWith?: string[] }) => {
      return await apiRequest("POST", "/api/smart-lists", {
        name: data.name,
        description: data.description,
        entityType: "tasks",
        filters: data.filters,
        visibility: data.visibility,
        sharedWith: data.sharedWith,
        isDefault: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Smart List saved successfully."
      });
      setSmartListName('');
      setSmartListDescription('');
      setShareVisibility('personal');
      setShareWithUsers([]);
      setIsSaveSmartListOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save Smart List.",
        variant: "destructive"
      });
    }
  });

  const deleteSmartListMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/smart-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists"] });
      toast({
        title: "Smart List Deleted",
        variant: "default",
        description: "Smart List removed successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete Smart List.",
        variant: "destructive"
      });
    }
  });

  const updateSmartListMutation = useMutation({
    mutationFn: async (data: { id: string; visibility: 'personal' | 'shared' | 'universal'; sharedWith?: string[] }) => {
      return await apiRequest("PUT", `/api/smart-lists/${data.id}`, {
        visibility: data.visibility,
        sharedWith: data.sharedWith
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-lists"] });
      toast({
        title: "Sharing Updated",
        variant: "default",
        description: "Smart List sharing settings updated successfully."
      });
      setIsShareSmartListOpen(false);
      setShareListId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sharing settings.",
        variant: "destructive"
      });
    }
  });

  const handleSaveSmartList = async () => {
    try {
      console.log('Saving Smart List with currentFilter:', currentFilter);
      console.log('Current filter conditions:', currentFilter.conditions);
      
      await saveSmartListMutation.mutateAsync({
        name: smartListName,
        description: smartListDescription,
        filters: currentFilter,
        visibility: shareVisibility,
        sharedWith: shareVisibility === 'shared' ? shareWithUsers : undefined
      });
    } catch (error) {
      // Error is handled by the mutation onError callback
    }
  };

  const handleDeleteSmartList = (smartListId: string) => {
    try {
      const smartList = getVisibleSmartLists().find(list => list.id === smartListId);
      const currentUserId = currentUser?.id;
      
      // Only allow deletion if user is the creator or has universal smart list management permission
      const canDelete = smartList?.createdBy === currentUserId || 
                       (smartList?.visibility === 'universal' && canManageUniversalSmartLists);
      
      if (!canDelete) {
        toast({
          title: "Permission Denied",
          description: "You can only delete Smart Lists you created.",
          variant: "destructive"
        });
        return;
      }

      if (activeSmartList === smartListId) {
        setActiveSmartList(null);
        setActiveTab("all-tasks");
        setCurrentFilter({ conditions: [], logic: 'AND' });
      }

      deleteSmartListMutation.mutate(smartListId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete Smart List.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSharing = async () => {
    if (!shareListId) return;
    
    try {
      await updateSmartListMutation.mutateAsync({
        id: shareListId,
        visibility: shareVisibility,
        sharedWith: shareVisibility === 'shared' ? shareWithUsers : undefined
      });
    } catch (error) {
      // Error is handled by the mutation onError callback
    }
  };

  // Apply filtering and sorting to tasks
  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return tasks;

    console.log('Current filter state:', currentFilter);
    console.log('Active Smart List:', activeSmartList);
    console.log('Search term:', searchTerm);

    // First apply Smart List filters if any
    let filtered = currentFilter.conditions.length > 0 
      ? applyTaskFilter(tasks, currentFilter) 
      : tasks;
    
    // Then apply legacy filter states for backward compatibility
    filtered = filtered.filter(task => {
      const matchesSearch = (
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getStaffName(task.assignedTo)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientOrLeadName(task)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(task.status);
      const matchesAssignee = assigneeFilter.length === 0 || 
        (assigneeFilter.includes("unassigned") && !task.assignedTo) ||
        (task.assignedTo && assigneeFilter.includes(task.assignedTo));
      const matchesPriority = priorityFilter.length === 0 || (task.priority && priorityFilter.includes(task.priority));
      
      let matchesClient = false;
      if (clientFilter.length === 0) {
        matchesClient = true;
      } else {
        const hasNone = clientFilter.includes("none");
        const selectedClientIds = clientFilter.filter(c => c.startsWith("client-")).map(c => c.replace("client-", ""));
        const selectedLeadIds = clientFilter.filter(c => c.startsWith("lead-")).map(c => c.replace("lead-", ""));
        
        if (hasNone && !task.clientId && !task.leadId) matchesClient = true;
        if (task.clientId && selectedClientIds.includes(task.clientId)) matchesClient = true;
        if (task.leadId && selectedLeadIds.includes(task.leadId)) matchesClient = true;
      }
      const matchesProject = true;
      const matchesCategory = categoryFilter.length === 0 || 
        (categoryFilter.includes("none") && !task.categoryId) ||
        (task.categoryId && categoryFilter.includes(task.categoryId));
      
      // Overdue filter - check if task is overdue (due date is in the past and task is not completed)
      let matchesOverdue = true;
      if (overdueFilter === "overdue") {
        const today = startOfDay(new Date());
        const isOverdue = task.dueDate && 
          new Date(task.dueDate) < today && 
          task.status !== "completed" && 
          task.status !== "cancelled";
        matchesOverdue = !!isOverdue;
      }

      // Time filter based on due date
      let matchesTime = true;
      if (timeFilter !== "all" && task.dueDate) {
        const taskDueDate = startOfDay(new Date(task.dueDate));
        const today = startOfDay(new Date());
        const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
        const currentWeekEnd = endOfWeek(today, { weekStartsOn: 0 }); // Saturday
        const nextWeekStart = addWeeks(currentWeekStart, 1);
        const nextWeekEnd = addWeeks(currentWeekEnd, 1);
        
        switch (timeFilter) {
          case "today":
            matchesTime = isSameDay(taskDueDate, today);
            break;
          case "monday":
            matchesTime = isSameDay(taskDueDate, addDays(currentWeekStart, 1));
            break;
          case "tuesday":
            matchesTime = isSameDay(taskDueDate, addDays(currentWeekStart, 2));
            break;
          case "wednesday":
            matchesTime = isSameDay(taskDueDate, addDays(currentWeekStart, 3));
            break;
          case "thursday":
            matchesTime = isSameDay(taskDueDate, addDays(currentWeekStart, 4));
            break;
          case "friday":
            matchesTime = isSameDay(taskDueDate, addDays(currentWeekStart, 5));
            break;
          case "saturday":
            matchesTime = isSameDay(taskDueDate, addDays(currentWeekStart, 6));
            break;
          case "sunday":
            matchesTime = isSameDay(taskDueDate, currentWeekStart);
            break;
          case "this_week":
            matchesTime = isWithinInterval(taskDueDate, { start: currentWeekStart, end: currentWeekEnd });
            break;
          case "next_week":
            matchesTime = isWithinInterval(taskDueDate, { start: nextWeekStart, end: nextWeekEnd });
            break;
          default:
            matchesTime = true;
        }
      } else if (timeFilter !== "all" && !task.dueDate) {
        matchesTime = false; // Tasks without due dates don't match time filters
      }

      const shouldShowCompleted = showCompleted || statusFilter.includes("completed") || task.status !== "completed";
      const shouldShowCancelled = showCancelled || statusFilter.includes("cancelled") || task.status !== "cancelled";
      
      return matchesSearch && matchesStatus && matchesAssignee && matchesPriority && matchesClient && matchesProject && matchesCategory && matchesOverdue && matchesTime && shouldShowCompleted && shouldShowCancelled;
    })
    .sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'assignedTo':
          aValue = (getStaffName(a.assignedTo) || 'Unassigned').toLowerCase();
          bValue = (getStaffName(b.assignedTo) || 'Unassigned').toLowerCase();
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'priority':
          const aPriority = taskPriorities.find(p => p.value === a.priority);
          const bPriority = taskPriorities.find(p => p.value === b.priority);
          aValue = aPriority?.sortOrder || 0;
          bValue = bPriority?.sortOrder || 0;
          break;
        case 'clientId':
          aValue = (getClientName(a.clientId) || 'No client').toLowerCase();
          bValue = (getClientName(b.clientId) || 'No client').toLowerCase();
          break;
        case 'projectId':
          // Projects removed - no sorting by project
          return 0;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, currentFilter, searchTerm, statusFilter, assigneeFilter, priorityFilter, clientFilter, categoryFilter, overdueFilter, timeFilter, showCompleted, showCancelled, sortField, sortDirection, staff, clients, taskCategories]);

  const handleColumnDragEnd = (result: any) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const draggableVisible = visibleColumns.slice(1);
    const reordered = Array.from(draggableVisible);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    const newOrder = [visibleColumns[0], ...reordered];
    const hidden = columns.filter(col => !col.visible);
    const newColumns = [...newOrder, ...hidden];

    setColumns(newColumns);

    const columnPrefs = newColumns.map(col => ({ id: col.id, visible: col.visible, width: col.width }));
    saveColumnPreferencesMutation.mutate(columnPrefs);
    
    toast({
      title: "Column order saved",
      description: "Your column arrangement has been saved.",
    });
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    // Don't allow hiding the name column
    if (columnId === "name") return;
    
    setColumns(prev => {
      const updated = prev.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      );
      // Save to API with widths
      const columnPrefs = updated.map(col => ({ id: col.id, visible: col.visible, width: col.width }));
      saveColumnPreferencesMutation.mutate(columnPrefs);
      return updated;
    });
  };

  // Handle column resize start
  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const column = columns.find(c => c.id === columnId);
    if (!column) return;
    
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = column.width || DEFAULT_COLUMN_WIDTHS[columnId] || 120;
    setResizingColumn(columnId);
  };

  // Handle column resize move
  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartXRef.current;
      const column = columnsRef.current.find(c => c.id === resizingColumn);
      const minWidth = column?.minWidth || 60;
      const newWidth = Math.max(minWidth, resizeStartWidthRef.current + diff);
      
      setColumns(prev => prev.map(col => 
        col.id === resizingColumn ? { ...col, width: newWidth } : col
      ));
    };

    const handleMouseUp = () => {
      // Use functional setState to get latest columns state for saving
      setColumns(currentColumns => {
        const columnPrefs = currentColumns.map(col => ({ id: col.id, visible: col.visible, width: col.width }));
        saveColumnPreferencesMutation.mutate(columnPrefs);
        return currentColumns;
      });
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, saveColumnPreferencesMutation]);

  // Get only visible columns
  const visibleColumns = useMemo(() => columns.filter(col => col.visible), [columns]);

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Get hierarchical tasks (main tasks + their sub-tasks when expanded)
  const getHierarchicalTasks = () => {
    const mainTasks = filteredAndSortedTasks.filter(task => !task.parentTaskId);
    const result: (Task & { level: number })[] = [];
    
    const addTaskAndSubTasks = (task: Task, level: number = 0) => {
      result.push({ ...task, level });
      
      if (expandedTasks.has(task.id)) {
        const subTasks = filteredAndSortedTasks.filter(t => t.parentTaskId === task.id);
        subTasks.forEach(subTask => addTaskAndSubTasks(subTask, level + 1));
      }
    };
    
    mainTasks.forEach(task => addTaskAndSubTasks(task));
    return result;
  };

  // SortableHeader component matching leads.tsx style with resize handle
  const SortableHeader = ({ column, children, sortField: columnSortField, showResizeHandle = true }: { 
    column: Column; 
    children: React.ReactNode; 
    sortField?: SortField;
    showResizeHandle?: boolean;
  }) => {
    const isActive = sortField === columnSortField;
    const canSort = columnSortField && column.id !== "name";
    const columnWidth = column.width || DEFAULT_COLUMN_WIDTHS[column.id] || 120;
    
    const ResizeHandle = () => (
      <div
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-slate-300 dark:group-hover:bg-slate-600 z-10"
        onMouseDown={(e) => handleResizeStart(e, column.id)}
        onClick={(e) => e.stopPropagation()}
      />
    );
    
    if (!canSort) {
      return (
        <TableHead 
          className="relative group"
          style={{ width: `${columnWidth}px`, minWidth: `${column.minWidth || 60}px` }}
        >
          <span className="font-medium">{children}</span>
          {showResizeHandle && <ResizeHandle />}
        </TableHead>
      );
    }
    
    return (
      <TableHead 
        className="relative group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 select-none"
        style={{ width: `${columnWidth}px`, minWidth: `${column.minWidth || 60}px` }}
        onClick={() => handleSort(columnSortField)}
      >
        <div className="flex items-center gap-1">
          <span className="font-medium">{children}</span>
          <div className="flex flex-col ml-1">
            <ChevronUp 
              className={`h-3 w-3 ${
                isActive && sortDirection === 'asc' 
                  ? 'text-blue-600' 
                  : 'text-gray-400'
              }`} 
            />
            <ChevronDown 
              className={`h-3 w-3 -mt-1 ${
                isActive && sortDirection === 'desc' 
                  ? 'text-blue-600' 
                  : 'text-gray-400'
              }`} 
            />
          </div>
        </div>
        {showResizeHandle && <ResizeHandle />}
      </TableHead>
    );
  };

  // Render cell content based on column type
  const renderCellContent = (column: Column, task: Task & { level?: number }) => {
    switch (column.id) {
      case "name":
        const hasSubTasks = filteredAndSortedTasks.some(t => t.parentTaskId === task.id);
        const indentLevel = (task.level || 0) * 24; // 24px per level
        
        return (
          <div className="flex items-center gap-1.5" style={{ paddingLeft: `${indentLevel}px` }}>
            <div className="flex-shrink-0 w-5 flex items-center justify-center">
              {hasSubTasks && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskExpansion(task.id);
                  }}
                  className="p-0 h-5 w-5"
                >
                  {expandedTasks.has(task.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    borderColor: (() => {
                      const statuses = getTaskWorkflowStatuses(task);
                      const match = statuses.find(s => s.value === task.status);
                      return match?.color || "#eab308";
                    })(),
                    backgroundColor: task.status === "completed" || task.status === "done" ? (() => {
                      const statuses = getTaskWorkflowStatuses(task);
                      const match = statuses.find(s => s.value === task.status);
                      return match?.color || "#22c55e";
                    })() : "transparent",
                  }}
                  title="Change status"
                >
                  {(task.status === "completed" || task.status === "done") && <Check className="h-3 w-3 text-white" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[140px]">
                {getTaskWorkflowStatuses(task).map((statusObj) => (
                  <DropdownMenuItem
                    key={statusObj.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskMutation.mutate({ id: task.id, status: statusObj.value });
                    }}
                    className={task.status === statusObj.value ? "bg-accent font-medium" : ""}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: statusObj.color || "#eab308" }}
                    />
                    {statusObj.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href={`/tasks/${task.id}`}>
              <span className={`font-medium hover:text-blue-600 cursor-pointer ${
                task.status === "completed" 
                  ? "text-slate-500 line-through" 
                  : "text-slate-900"
              }`}>
                {task.title}
              </span>
            </Link>
            {task.isRecurring && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Repeat className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>Recurring task</TooltipContent>
              </Tooltip>
            )}
            <TaskDependencyIcons taskId={task.id} prefetchedDependencies={batchDepsData?.[task.id]?.dependencies} />
          </div>
        );
      
      case "assignee":
        const assignedStaff = getStaffMember(task.assignedTo);
        return task.assignedTo && assignedStaff ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 cursor-pointer">
                  {assignedStaff.profileImagePath ? (
                    <AvatarImage src={`/objects${assignedStaff.profileImagePath}`} alt={getStaffName(task.assignedTo) || ""} />
                  ) : null}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getStaffInitials(assignedStaff)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getStaffName(task.assignedTo)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-slate-400 text-sm">Unassigned</span>
        );
      
      case "dueDate":
        return task.dueDate ? (
          <span className={`text-sm ${
            new Date(task.dueDate) < new Date() && task.status !== "completed"
              ? "text-red-600 font-medium"
              : "text-slate-600"
          }`}>
            {formatDate(task.dueDate)}
          </span>
        ) : (
          <span className="text-slate-400 text-sm">No due date</span>
        );
      
      case "status":
        return (
          <Badge className={getStatusColor(task.status)}>
            {task.status?.replace('_', ' ') || 'Unknown'}
          </Badge>
        );
      
      case "priority":
        return (
          <div className="flex items-center gap-1">
            <Flag className={`h-3 w-3 ${getPriorityColor(task.priority)}`} />
            <Badge className={getPriorityColor(task.priority)} variant="outline">
              {task.priority}
            </Badge>
          </div>
        );
      
      case "client":
        return task.clientId || task.leadId ? (
          <span className="text-sm">{getClientOrLeadName(task)}</span>
        ) : (
          <span className="text-slate-400 text-sm">No client/lead</span>
        );
      
      case "project":
        return task.projectId ? (
          <span className="text-sm">{getProjectName(task.projectId)}</span>
        ) : (
          <span className="text-slate-400 text-sm">No project</span>
        );
      
      case "category":
        return task.categoryId ? (
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getCategoryColor(task.categoryId) }}
            />
            <span className="text-sm">{getCategoryName(task.categoryId)}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-sm">No category</span>
        );

      case "tags":
        return task.tags && task.tags.length > 0 ? (
          <TagDisplay tags={task.tags} />
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-sm">No tags</span>
        );

      case "approval":
        if (!task.requiresClientApproval) {
          return <span className="text-slate-400 text-sm">Not required</span>;
        }
        
        const getApprovalBadge = () => {
          switch (task.clientApprovalStatus) {
            case "pending":
              return <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">Pending</Badge>;
            case "approved":
              return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Approved</Badge>;
            case "rejected":
              return <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">Rejected</Badge>;
            case "changes_requested":
              return <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50">Changes Requested</Badge>;
            default:
              return <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">Pending</Badge>;
          }
        };
        
        return (
          <div className="flex items-center gap-1">
            {getApprovalBadge()}
          </div>
        );
      
      case "startDate":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-1.5 py-0.5 -mx-1.5 transition-colors text-left"
                onClick={(e) => e.stopPropagation()}
              >
                {task.startDate ? (
                  <span className="text-slate-600 dark:text-slate-300">{format(new Date(task.startDate), "MMM d, yyyy")}</span>
                ) : (
                  <span className="text-slate-400 text-sm">No start date</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
              <CalendarWidget
                mode="single"
                selected={task.startDate ? new Date(task.startDate) : undefined}
                onSelect={(date) => {
                  updateTaskFieldMutation.mutate({
                    id: task.id,
                    startDate: date ? format(date, "yyyy-MM-dd") : null,
                  });
                }}
                initialFocus
              />
              {task.startDate && (
                <div className="border-t px-3 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => {
                      updateTaskFieldMutation.mutate({ id: task.id, startDate: null });
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear start date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        );
      
      case "timeEstimate":
        if (!task.timeEstimate) {
          return <span className="text-slate-400 text-sm">Not set</span>;
        }
        const estHours = Math.floor(task.timeEstimate / 60);
        const estMinutes = task.timeEstimate % 60;
        return (
          <span className="text-sm text-slate-600">
            {estHours > 0 ? `${estHours}h ` : ''}{estMinutes > 0 ? `${estMinutes}m` : estHours > 0 ? '' : '0m'}
          </span>
        );
      
      case "timeTracked": {
        const isThisTaskTimerRunning = isTimerRunning && currentTimer?.taskId === task.id;
        const formatElapsed = (seconds: number) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          const s = seconds % 60;
          if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          return `${m}:${s.toString().padStart(2, '0')}`;
        };
        const trackHours = Math.floor((task.timeTracked || 0) / 60);
        const trackMinutes = (task.timeTracked || 0) % 60;
        const timeDisplay = task.timeTracked
          ? `${trackHours > 0 ? `${trackHours}h ` : ''}${trackMinutes > 0 ? `${trackMinutes}m` : trackHours > 0 ? '' : '0m'}`
          : null;

        if (isThisTaskTimerRunning) {
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); stopTimer(); }}
                className="flex items-center justify-center h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                title="Stop timer"
              >
                <Square className="h-2.5 w-2.5 text-white fill-white" />
              </button>
              <span className="text-sm font-mono text-red-600 animate-pulse">
                {formatElapsed(elapsedTime)}
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1.5 group/timer">
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); startTimer(task.id, task.title); }}
              className="flex items-center justify-center h-5 w-5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover/timer:opacity-100"
              title="Start timer"
            >
              <Play className="h-2.5 w-2.5 ml-0.5" />
            </button>
            <span className={`text-sm ${timeDisplay ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {timeDisplay || 'Add time'}
            </span>
          </div>
        );
      }
      
      case "createdAt":
        return task.createdAt ? (
          <span className="text-sm text-slate-600">
            {format(new Date(task.createdAt), "MMM d, yyyy")}
          </span>
        ) : (
          <span className="text-slate-400 text-sm">Unknown</span>
        );
      
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-teal-100 text-teal-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "No due date";
    
    const taskDate = new Date(date);
    const today = new Date();
    const isToday = taskDate.toDateString() === today.toDateString();
    const isTomorrow = taskDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
    const isPast = taskDate < today && !isToday;
    
    if (isToday) return "Due today";
    if (isTomorrow) return "Due tomorrow";
    if (isPast) return `Overdue (${taskDate.toLocaleDateString()})`;
    
    return `Due ${taskDate.toLocaleDateString()}`;
  };

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    updateTaskMutation.mutate({
      id: taskId,
      status: completed ? "completed" : "todo"
    });
  };

  const handleDeleteTask = (id: string) => {
    setTaskToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete);
      setTaskToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedTasks));
    setIsBulkDeleteConfirmOpen(false);
    setSelectedTasks(new Set());
  };

  // Bulk actions helper functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(filteredAndSortedTasks.map(task => task.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const clearSelection = () => setSelectedTasks(new Set());

  // Bulk actions mutations
  const bulkDeleteMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      await apiRequest('DELETE', '/api/tasks/bulk-delete', { taskIds });
      return taskIds.length; // Return count for onSuccess
    },
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      clearSelection();
      toast({
        title: "Tasks deleted",
        variant: "default",
        description: `${deletedCount} tasks have been successfully deleted.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ taskIds, updates }: { taskIds: string[], updates: any }) => {
      await apiRequest('PUT', '/api/tasks/bulk-update', { taskIds, updates });
      return taskIds.length; // Return count for onSuccess
    },
    onSuccess: (updatedCount) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      clearSelection();
      toast({
        title: "Tasks updated",
        variant: "default",
        description: `${updatedCount} tasks have been successfully updated.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [bulkAssigneeDialogOpen, setBulkAssigneeDialogOpen] = useState(false);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkDueDateDialogOpen, setBulkDueDateDialogOpen] = useState(false);
  const [bulkPriorityDialogOpen, setBulkPriorityDialogOpen] = useState(false);
  const [bulkClientDialogOpen, setBulkClientDialogOpen] = useState(false);
  const [tempAssignee, setTempAssignee] = useState("");
  const [tempStatus, setTempStatus] = useState("");
  const [tempDueDate, setTempDueDate] = useState("");
  const [tempPriority, setTempPriority] = useState("");
  const [tempClient, setTempClient] = useState("");

  const handleBulkDelete = () => {
    setIsBulkDeleteConfirmOpen(true);
  };

  const handleBulkAssignee = () => {
    if (!tempAssignee) return;
    bulkUpdateMutation.mutate({
      taskIds: Array.from(selectedTasks),
      updates: { assignedTo: tempAssignee }
    });
    setBulkAssigneeDialogOpen(false);
    setTempAssignee("");
  };

  const handleBulkStatus = () => {
    if (!tempStatus) return;
    bulkUpdateMutation.mutate({
      taskIds: Array.from(selectedTasks),
      updates: { status: tempStatus }
    });
    setBulkStatusDialogOpen(false);
    setTempStatus("");
  };

  const handleBulkDueDate = () => {
    if (!tempDueDate) return;
    bulkUpdateMutation.mutate({
      taskIds: Array.from(selectedTasks),
      updates: { dueDate: new Date(tempDueDate).toISOString() }
    });
    setBulkDueDateDialogOpen(false);
    setTempDueDate("");
  };

  const handleBulkPriority = () => {
    if (!tempPriority) return;
    bulkUpdateMutation.mutate({
      taskIds: Array.from(selectedTasks),
      updates: { priority: tempPriority }
    });
    setBulkPriorityDialogOpen(false);
    setTempPriority("");
  };

  const handleBulkClient = () => {
    if (!tempClient) return;
    
    let updates: any = {};
    if (tempClient === "none") {
      updates.clientId = null;
      updates.leadId = null;
    } else if (tempClient.startsWith("client-")) {
      const clientId = tempClient.replace("client-", "");
      updates.clientId = clientId;
      updates.leadId = null;
    } else if (tempClient.startsWith("lead-")) {
      const leadId = tempClient.replace("lead-", "");
      updates.clientId = null;
      updates.leadId = leadId;
    }
    
    bulkUpdateMutation.mutate({
      taskIds: Array.from(selectedTasks),
      updates
    });
    setBulkClientDialogOpen(false);
    setTempClient("");
  };

  const renderBulkActionsToolbar = () => {
    if (selectedTasks.size === 0) return null;

    return (
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-blue-900">
            {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
          </span>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear Selection
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>

          <Dialog open={bulkAssigneeDialogOpen} onOpenChange={setBulkAssigneeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-1" />
                Assignee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Assignee for {selectedTasks.size} tasks</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={tempAssignee} onValueChange={setTempAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBulkAssigneeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkAssignee} disabled={!tempAssignee}>
                    Update Assignee
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Status for {selectedTasks.size} tasks</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={tempStatus} onValueChange={setTempStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBulkStatusDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkStatus} disabled={!tempStatus}>
                    Update Status
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={bulkDueDateDialogOpen} onOpenChange={setBulkDueDateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Due Date
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Due Date for {selectedTasks.size} tasks</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="datetime-local"
                  value={tempDueDate}
                  onChange={(e) => setTempDueDate(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBulkDueDateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkDueDate} disabled={!tempDueDate}>
                    Update Due Date
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={bulkPriorityDialogOpen} onOpenChange={setBulkPriorityDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Flag className="h-4 w-4 mr-1" />
                Priority
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Priority for {selectedTasks.size} tasks</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={tempPriority} onValueChange={setTempPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBulkPriorityDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkPriority} disabled={!tempPriority}>
                    Update Priority
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={bulkClientDialogOpen} onOpenChange={setBulkClientDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-bulk-client">
                <Building2 className="h-4 w-4 mr-1" />
                Client/Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Client/Lead for {selectedTasks.size} tasks</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={tempClient} onValueChange={setTempClient}>
                  <SelectTrigger data-testid="select-bulk-client">
                    <SelectValue placeholder="Select client or lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" data-testid="option-no-client">No Client/Lead</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={`client-${client.id}`} value={`client-${client.id}`} data-testid={`option-client-${client.id}`}>
                        {client.company || client.name} (Client)
                      </SelectItem>
                    ))}
                    {leads.map((lead) => (
                      <SelectItem key={`lead-${lead.id}`} value={`lead-${lead.id}`} data-testid={`option-lead-${lead.id}`}>
                        {lead.name || lead.email} (Lead)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBulkClientDialogOpen(false)} data-testid="button-cancel-bulk-client">
                    Cancel
                  </Button>
                  <Button onClick={handleBulkClient} disabled={!tempClient} data-testid="button-update-bulk-client">
                    Update Client/Lead
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  };

  // Handle drag and drop for Kanban board
  const handleKanbanDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    
    // Get the new status from the destination column
    const newStatus = destination.droppableId;
    
    // Update the task status
    updateTaskMutation.mutate({
      id: draggableId,
      status: newStatus
    });
  };

  const selectedWorkflow = workflows.find(w => w.id === workflowFilter) || workflows[0];
  const workflowStatuses = selectedWorkflow?.statuses || [];
  
  const taskStats = useMemo(() => {
    const statsSource = filteredAndSortedTasks;
    return {
      total: statsSource.length,
      byStatus: workflowStatuses.reduce((acc: any, workflowStatus: any) => {
        acc[workflowStatus.status.value] = statsSource.filter(t => 
          t.status === workflowStatus.status.value
        ).length;
        return acc;
      }, {}),
      overdue: statsSource.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < new Date() && 
        !workflowStatuses.find((s: any) => s.status.value === t.status && (s.status.value === "completed" || s.status.value === "cancelled"))
      ).length,
    };
  }, [filteredAndSortedTasks, workflowStatuses]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-8 bg-slate-200 rounded" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Kanban View Component
  const KanbanView = ({ tasks, staff, clients, onDragEnd, onDeleteTask, deleteTaskMutation }: {
    tasks: Task[];
    staff: Staff[];
    clients: Client[];
    onDragEnd: (result: any) => void;
    onDeleteTask: (id: string) => void;
    deleteTaskMutation: any;
  }) => {
    // Helper function to strip HTML tags and get plain text
    const stripHtml = (html: string) => {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      return temp.textContent || temp.innerText || '';
    };

    // Get the selected workflow or default to the first one
    const selectedWorkflow = workflows.find(w => w.id === workflowFilter) || workflows[0];
    
    // Generate dynamic columns based on workflow statuses
    const columns = selectedWorkflow?.statuses?.map((workflowStatus: any, index: number) => {
      const colors = [
        'bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-red-100', 
        'bg-purple-100', 'bg-orange-100', 'bg-pink-100', 'bg-gray-100'
      ];
      return {
        id: workflowStatus.status.value, // Use the actual status value (e.g., "todo", "in_progress")
        title: workflowStatus.status.name, // Use the display name (e.g., "To Do", "In Progress")
        color: colors[index % colors.length]
      };
    }) || [];

    const getTasksByStatus = (status: string) => {
      return tasks.filter(task => {
        // Match tasks by status
        const statusMatches = task.status === status;
        
        // Include tasks that either:
        // 1. Have a workflowId that matches the selected workflow, OR
        // 2. Have no workflowId (null) - these should appear in any workflow
        const workflowMatches = !task.workflowId || task.workflowId === selectedWorkflow?.id;
        
        return statusMatches && workflowMatches;
      });
    };

    const TaskCard = ({ task, index }: { task: Task; index: number }) => (
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-white border border-slate-200 rounded-lg p-3 mb-2 shadow-sm hover:shadow-md transition-shadow ${
              snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-0">
                <h4 className="font-medium text-sm text-slate-900 line-clamp-2">{task.title}</h4>
                {task.isRecurring && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Repeat className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>Recurring task</TooltipContent>
                  </Tooltip>
                )}
                <TaskDependencyIcons taskId={task.id} prefetchedDependencies={batchDepsData?.[task.id]?.dependencies} />
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Link href={`/tasks/${task.id}`}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDeleteTask(task.id)}
                  disabled={deleteTaskMutation.isPending}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </div>
            
            {task.description && (
              <p className="text-xs text-slate-600 mb-2 line-clamp-2">{stripHtml(task.description)}</p>
            )}
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {task.priority && (
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                )}
                {task.assignedTo && (
                  <span className="text-slate-600">
                    {getStaffName(task.assignedTo)}
                  </span>
                )}
              </div>
              {task.dueDate && (
                <span className={`text-xs ${
                  new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-slate-500'
                }`}>
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>
          </div>
        )}
      </Draggable>
    );

    if (!selectedWorkflow || columns.length === 0) {
      return (
        <div className="space-y-4">
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">No workflows found. Create a workflow first to use Kanban view.</p>
              <Link href="/settings/tasks">
                <Button>Go to Workflow Settings</Button>
              </Link>
            </div>
          ) : !selectedWorkflow ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Please select a workflow to view tasks in Kanban format.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">This workflow has no status columns configured.</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Kanban Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {columns.map(column => (
              <div key={column.id} className="bg-slate-50 rounded-lg p-3">
                <div className={`${column.color} rounded-md p-2 mb-3`}>
                  <h3 className="font-medium text-slate-900 text-sm">{column.title}</h3>
                  <span className="text-xs text-slate-600">
                    {getTasksByStatus(column.id).length} tasks
                  </span>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-slate-100' : ''
                      }`}
                    >
                      {getTasksByStatus(column.id).map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    );
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <CheckSquare className="h-8 w-8 text-primary" />
          Tasks
        </h1>
        <div className="flex items-center gap-2">
          {canManageTaskTemplates && (
            <Link href="/task-templates">
              <Button variant="outline" data-testid="button-task-templates">
                <FileText className="h-4 w-4 mr-2" />
                Task Templates
              </Button>
            </Link>
          )}
          <TaskIntakeDialog
            trigger={
              <Button data-testid="button-add-task">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            }
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
            }}
          />
        </div>
      </div>

      {/* Task Statistics - Dynamic based on workflow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{taskStats.total}</p>
              <p className="text-sm text-slate-600">Total Tasks</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Dynamic workflow status cards */}
        {workflowStatuses.slice(0, 2).map((workflowStatus: any, index: number) => {
          const colors = ['text-yellow-600', 'text-blue-600', 'text-green-600', 'text-purple-600'];
          return (
            <Card key={workflowStatus.status.value}>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className={`text-2xl font-bold ${colors[index] || 'text-slate-600'}`}>
                    {taskStats.byStatus[workflowStatus.status.value] || 0}
                  </p>
                  <p className="text-sm text-slate-600">{workflowStatus.status.name}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
              <p className="text-sm text-slate-600">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="space-y-4">
            {/* Smart Lists Tabs - styled like 1v1 Meetings tabs */}
            <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto" style={{ width: 'fit-content' }}>
              <button
                onClick={() => handleTabChange("all-tasks")}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === "all-tasks"
                    ? "text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                style={activeTab === "all-tasks" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                data-testid="tab-all-tasks"
              >
                All Tasks
              </button>
              <button
                onClick={() => handleTabChange("my-tasks")}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === "my-tasks"
                    ? "text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                style={activeTab === "my-tasks" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                data-testid="tab-my-tasks"
              >
                My Tasks
              </button>
              {getVisibleSmartLists().slice(0, maxVisibleTabs - 2).map((smartList) => (
                <div key={smartList.id} className="relative flex items-center">
                  <button
                    onClick={() => handleTabChange(smartList.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap pr-6 ${
                      activeTab === smartList.id
                        ? "text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    style={activeTab === smartList.id ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                    data-testid={`tab-smart-list-${smartList.id}`}
                  >
                    {smartList.name}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 h-4 w-4 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareListId(smartList.id);
                        }}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSmartList(smartList.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {getVisibleSmartLists().length > maxVisibleTabs - 2 && (
                <DropdownMenu open={isMoreDropdownOpen} onOpenChange={setIsMoreDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                        getVisibleSmartLists().slice(maxVisibleTabs - 2).some(s => s.id === activeTab)
                          ? "text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      }`}
                      style={getVisibleSmartLists().slice(maxVisibleTabs - 2).some(s => s.id === activeTab) ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                    >
                      More
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {getVisibleSmartLists().slice(maxVisibleTabs - 2).map((smartList) => (
                      <DropdownMenuItem
                        key={smartList.id}
                        onClick={() => {
                          handleTabChange(smartList.id);
                          setIsMoreDropdownOpen(false);
                        }}
                      >
                        {smartList.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-4">
                {/* Show/Hide Multi-Select Dropdown */}
                <Select value="show-options" onValueChange={() => {}}>
                  <SelectTrigger className="w-48">
                    <SelectValue>
                      {(() => {
                        const selected = [];
                        if (showCompleted) selected.push("Completed");
                        if (showCancelled) selected.push("Cancelled");
                        if (selected.length === 0) return "Show Options";
                        if (selected.length === 1) return `Show ${selected[0]}`;
                        return `Show ${selected.length} Types`;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id="multi-show-completed"
                          checked={showCompleted}
                          onCheckedChange={(checked) => setShowCompleted(!!checked)}
                          data-testid="multi-toggle-completed-tasks"
                        />
                        <label
                          htmlFor="multi-show-completed"
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Show Completed
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id="multi-show-cancelled"
                          checked={showCancelled}
                          onCheckedChange={(checked) => setShowCancelled(!!checked)}
                          data-testid="multi-toggle-cancelled-tasks"
                        />
                        <label
                          htmlFor="multi-show-cancelled"
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Show Cancelled
                        </label>
                      </div>
                    </div>
                  </SelectContent>
                </Select>
                
                <div className="text-sm text-slate-600">
                  {filteredAndSortedTasks.length} task{filteredAndSortedTasks.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    viewMode === "table"
                      ? "text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={viewMode === "table" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                >
                  <TableIcon className="h-4 w-4" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    viewMode === "kanban"
                      ? "text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={viewMode === "kanban" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                >
                  <Columns className="h-4 w-4" />
                  Kanban
                </button>
              </div>
              
              {/* Column Configuration */}
              {viewMode === "table" && (
                <Popover open={isColumnConfigOpen} onOpenChange={setIsColumnConfigOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2" data-testid="button-column-config">
                      <Settings2 className="h-4 w-4" />
                      Columns
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Show/Hide Columns</h4>
                        <span className="text-xs text-muted-foreground">
                          {visibleColumns.length} visible
                        </span>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {columns.map((column) => (
                          <div 
                            key={column.id} 
                            className="flex items-center gap-2 py-1"
                          >
                            <Checkbox
                              id={`col-${column.id}`}
                              checked={column.visible}
                              onCheckedChange={() => toggleColumnVisibility(column.id)}
                              disabled={column.id === "name"}
                              data-testid={`checkbox-column-${column.id}`}
                            />
                            <label 
                              htmlFor={`col-${column.id}`}
                              className={`text-sm cursor-pointer flex-1 ${
                                column.id === "name" ? "text-muted-foreground" : ""
                              }`}
                            >
                              {column.label}
                              {column.id === "name" && (
                                <span className="text-xs text-muted-foreground ml-1">(required)</span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {/* Status Filter */}
              <MultiSelectFilter
                selected={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
                options={taskStatuses.filter(s => s.isActive).map(s => ({ value: s.value, label: s.name, color: s.color }))}
              />
              
              {/* Assignee Filter */}
              <MultiSelectFilter
                selected={assigneeFilter}
                onChange={setAssigneeFilter}
                placeholder="All Assignees"
                options={[
                  { value: "unassigned", label: "Unassigned" },
                  ...staff.map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName}` }))
                ]}
              />
              
              {/* Priority Filter */}
              <MultiSelectFilter
                selected={priorityFilter}
                onChange={setPriorityFilter}
                placeholder="All Priorities"
                options={taskPriorities.filter(p => p.isActive).map(p => ({ value: p.value, label: p.name, color: p.color }))}
              />
              
              {/* Client/Lead Filter */}
              <MultiSelectFilter
                selected={clientFilter}
                onChange={setClientFilter}
                placeholder="All Clients/Leads"
                options={[
                  { value: "none", label: "No Client/Lead" },
                  ...clients.map(c => ({ value: `client-${c.id}`, label: `${c.company || c.name} (Client)` })),
                  ...leads.map(l => ({ value: `lead-${l.id}`, label: `${l.name || l.email} (Lead)` }))
                ]}
              />
              
              {/* Category Filter */}
              <MultiSelectFilter
                selected={categoryFilter}
                onChange={setCategoryFilter}
                placeholder="All Categories"
                options={[
                  { value: "none", label: "No Category" },
                  ...taskCategories.map(c => ({ value: c.id, label: c.name, color: c.color }))
                ]}
              />
              
              {/* Overdue Filter */}
              <Select value={overdueFilter} onValueChange={setOverdueFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="overdue">Overdue Only</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Time Filter */}
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger data-testid="select-time-filter">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="sunday">Sunday (This Week)</SelectItem>
                  <SelectItem value="monday">Monday (This Week)</SelectItem>
                  <SelectItem value="tuesday">Tuesday (This Week)</SelectItem>
                  <SelectItem value="wednesday">Wednesday (This Week)</SelectItem>
                  <SelectItem value="thursday">Thursday (This Week)</SelectItem>
                  <SelectItem value="friday">Friday (This Week)</SelectItem>
                  <SelectItem value="saturday">Saturday (This Week)</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="next_week">Next Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              {/* Clear Filters Button */}
              {areFiltersActive() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex items-center gap-2"
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              
              {/* Save as Smart List Button */}
              {areFiltersActive() && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveCurrentFiltersAsSmartList}
                  className="flex items-center gap-2"
                  data-testid="button-save-smart-list"
                >
                  <Bookmark className="h-4 w-4" />
                  Save as Smart List
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Bulk Actions Toolbar */}
          {viewMode === "table" && filteredAndSortedTasks.length > 0 && (
            <div className="p-4 pb-0">
              {renderBulkActionsToolbar()}
            </div>
          )}
          
          {viewMode === "table" && filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">
                {searchTerm || statusFilter !== "all" || assigneeFilter !== "all" || priorityFilter !== "all" || clientFilter !== "all" || categoryFilter !== "all" || overdueFilter !== "all" || timeFilter !== "all"
                  ? "No tasks found matching your criteria." 
                  : "No tasks found."
                }
              </p>
              {!searchTerm && statusFilter === "all" && assigneeFilter === "all" && priorityFilter === "all" && clientFilter === "all" && categoryFilter === "all" && overdueFilter === "all" && timeFilter === "all" && (
                <TaskIntakeDialog
                  trigger={<Button>Create Your First Task</Button>}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
                  }}
                />
              )}
            </div>
          ) : viewMode === "table" ? (
            <DragDropContext onDragEnd={handleColumnDragEnd}>
              <div className="overflow-x-auto">
              <Table className="w-max min-w-full" style={{ tableLayout: 'fixed' }}>
                <TableHeader>
                  <Droppable droppableId="table-headers" direction="horizontal">
                    {(provided) => (
                      <TableRow ref={provided.innerRef} {...provided.droppableProps}>
                        {/* Bulk selection checkbox column */}
                        <TableHead className="w-12">
                          <div className="flex items-center justify-center">
                            <Checkbox 
                              checked={selectedTasks.size === filteredAndSortedTasks.length && filteredAndSortedTasks.length > 0}
                              onCheckedChange={handleSelectAll}
                              data-testid="select-all-tasks"
                              className="bulk-select-checkbox"
                            />
                          </div>
                        </TableHead>
                        
                        {/* Fixed Task Name column (non-draggable) */}
                        <SortableHeader 
                          column={visibleColumns[0]}
                          sortField="title"
                        >
                          {visibleColumns[0].label}
                        </SortableHeader>
                        
                        {/* Draggable columns (all visible except Task Name) */}
                        {visibleColumns.slice(1).map((column, index) => {
                          // Map column IDs to their corresponding sort fields
                          const sortFieldMap: Record<string, SortField> = {
                            name: 'title',
                            assignee: 'assignedTo', 
                            startDate: 'dueDate',
                            dueDate: 'dueDate',
                            status: 'status',
                            priority: 'priority',
                            client: 'clientId',
                            project: 'projectId',
                            createdAt: 'createdAt'
                          };
                          
                          const columnWidth = column.width || DEFAULT_COLUMN_WIDTHS[column.id] || 120;
                          
                          return (
                            <Draggable
                              key={column.id}
                              draggableId={column.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <TableHead
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`relative group ${
                                    snapshot.isDragging ? 'bg-blue-50 shadow-lg z-50' : ''
                                  }`}
                                  style={{ 
                                    ...provided.draggableProps.style,
                                    width: `${columnWidth}px`, 
                                    minWidth: `${column.minWidth || 60}px` 
                                  }}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="flex items-center gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 select-none p-1 rounded"
                                    onClick={() => {
                                      const sortField = sortFieldMap[column.id];
                                      if (sortField) handleSort(sortField);
                                    }}
                                  >
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">{column.label}</span>
                                    {sortFieldMap[column.id] && (
                                      <div className="flex flex-col ml-1">
                                        <ChevronUp 
                                          className={`h-3 w-3 ${
                                            sortField === sortFieldMap[column.id] && sortDirection === 'asc' 
                                              ? 'text-blue-600' 
                                              : 'text-gray-400'
                                          }`} 
                                        />
                                        <ChevronDown 
                                          className={`h-3 w-3 -mt-1 ${
                                            sortField === sortFieldMap[column.id] && sortDirection === 'desc' 
                                              ? 'text-blue-600' 
                                              : 'text-gray-400'
                                          }`} 
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-slate-300 dark:group-hover:bg-slate-600 z-10"
                                    onMouseDown={(e) => handleResizeStart(e, column.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </TableHead>
                              )}
                            </Draggable>
                          );
                        })}
                        
                        {provided.placeholder}
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    )}
                  </Droppable>
                </TableHeader>
              <TableBody>
                  {getHierarchicalTasks().map((task) => (
                    <TableRow key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                      {/* Bulk selection checkbox column */}
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center">
                          <Checkbox 
                            checked={selectedTasks.has(task.id)}
                            onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                            data-testid={`select-task-${task.id}`}
                            className="bulk-select-checkbox"
                          />
                        </div>
                      </TableCell>
                      
                      {visibleColumns.map((column) => {
                        const columnWidth = column.width || DEFAULT_COLUMN_WIDTHS[column.id] || 120;
                        return (
                          <TableCell 
                            key={column.id} 
                            className="py-3"
                            style={{ width: `${columnWidth}px`, minWidth: `${column.minWidth || 60}px` }}
                          >
                            {renderCellContent(column, task)}
                          </TableCell>
                        );
                      })}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/tasks/${task.id}`}>
                            <Button variant="ghost" size="sm" title="Edit task">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={deleteTaskMutation.isPending}
                            title="Delete task"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </DragDropContext>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <label className="text-sm font-medium text-slate-700">Workflow:</label>
                <Select 
                  value={workflowFilter} 
                  onValueChange={setWorkflowFilter}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((workflow: any) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <KanbanView 
                tasks={filteredAndSortedTasks}
                staff={staff}
                clients={clients}
                onDragEnd={handleKanbanDragEnd}
                onDeleteTask={handleDeleteTask}
                deleteTaskMutation={deleteTaskMutation}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Smart List Dialog */}
      <Dialog open={isSaveSmartListOpen} onOpenChange={setIsSaveSmartListOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Smart List</DialogTitle>
            <DialogDescription>
              Save the current filter settings as a reusable Smart List.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="smart-list-name">Name *</Label>
              <Input
                id="smart-list-name"
                placeholder="Enter Smart List name"
                value={smartListName}
                onChange={(e) => setSmartListName(e.target.value)}
                data-testid="input-smart-list-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smart-list-description">Description</Label>
              <Textarea
                id="smart-list-description"
                placeholder="Optional description"
                value={smartListDescription}
                onChange={(e) => setSmartListDescription(e.target.value)}
                rows={3}
                data-testid="input-smart-list-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={shareVisibility} onValueChange={(value: 'personal' | 'shared' | 'universal') => setShareVisibility(value)}>
                <SelectTrigger data-testid="select-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="shared">Shared with Team</SelectItem>
                  <SelectItem value="universal">Universal (All Users)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Member Selection - Only show when "Shared with Team" is selected */}
            {shareVisibility === 'shared' && (
              <div className="space-y-2">
                <Label>Share With</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`share-${member.id}`}
                        checked={shareWithUsers.includes(member.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setShareWithUsers([...shareWithUsers, member.id]);
                          } else {
                            setShareWithUsers(shareWithUsers.filter(id => id !== member.id));
                          }
                        }}
                        data-testid={`checkbox-share-${member.id}`}
                      />
                      <label
                        htmlFor={`share-${member.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {member.firstName} {member.lastName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSaveSmartListOpen(false);
                setSmartListName("");
                setSmartListDescription("");
                setShareVisibility('personal');
                setShareWithUsers([]);
              }}
              data-testid="button-cancel-smart-list"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (smartListName.trim()) {
                  saveSmartListMutation.mutate({
                    name: smartListName.trim(),
                    description: smartListDescription.trim() || undefined,
                    filters: currentFilter,
                    visibility: shareVisibility,
                    sharedWith: shareVisibility === 'shared' ? shareWithUsers : undefined
                  });
                }
              }}
              disabled={!smartListName.trim() || saveSmartListMutation.isPending}
              data-testid="button-save-smart-list-confirm"
            >
              {saveSmartListMutation.isPending ? "Saving..." : "Save Smart List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Task Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setTaskToDelete(null);
              }}
              data-testid="button-cancel-task-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTask}
              disabled={deleteTaskMutation.isPending}
              data-testid="button-confirm-task-delete"
            >
              {deleteTaskMutation.isPending ? "Deleting..." : "Delete Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tasks</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTasks.size} selected tasks? This action cannot be undone and will also delete any subtasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteConfirmOpen(false)}
              data-testid="button-cancel-bulk-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-confirm-bulk-delete"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedTasks.size} Tasks`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
