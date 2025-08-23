import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Calendar, CheckCircle, GripVertical, Flag, User, ChevronDown, ChevronRight, ChevronUp, Table as TableIcon, Columns } from "lucide-react";
import TaskForm from "@/components/forms/task-form";
import { TaskDependencyIcons } from "@/components/task-dependency-icons";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, Client, Project, Campaign, Staff, TaskStatus, TaskPriority, TaskCategory } from "@shared/schema";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface Column {
  id: string;
  label: string;
  width?: string;
}

type SortField = 'title' | 'assignedTo' | 'dueDate' | 'status' | 'priority' | 'clientId' | 'projectId' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'kanban';

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [columns, setColumns] = useState<Column[]>([
    { id: "name", label: "Task Name", width: "w-1/6" },
    { id: "assignee", label: "Assignee", width: "w-1/8" },
    { id: "dueDate", label: "Due Date", width: "w-1/8" },
    { id: "status", label: "Status", width: "w-1/10" },
    { id: "priority", label: "Priority", width: "w-1/10" },
    { id: "category", label: "Category", width: "w-1/10" },
    { id: "client", label: "Client", width: "w-1/8" },
    { id: "project", label: "Project", width: "w-1/8" },
  ]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: clientsData } = useQuery<{ clients: Client[] }>({
    queryKey: ["/api/clients"],
  });
  
  const clients = clientsData?.clients || [];

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
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

  // Auto-select first workflow if none selected and workflows are available
  React.useEffect(() => {
    if (workflows.length > 0 && !selectedWorkflowId) {
      setSelectedWorkflowId(workflows[0].id);
    }
  }, [workflows, selectedWorkflowId]);

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

  // Helper functions - moved above sorting logic
  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = clients.find((c: Client) => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = (
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getStaffName(task.assignedTo)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(task.clientId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProjectName(task.projectId)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesAssignee = assigneeFilter === "all" || 
        (assigneeFilter === "unassigned" && !task.assignedTo) ||
        task.assignedTo === assigneeFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesClient = clientFilter === "all" || 
        (clientFilter === "none" && !task.clientId) ||
        task.clientId === clientFilter;
      const matchesProject = projectFilter === "all" || 
        (projectFilter === "none" && !task.projectId) ||
        task.projectId === projectFilter;
      const matchesCategory = categoryFilter === "all" || 
        (categoryFilter === "none" && !task.categoryId) ||
        task.categoryId === categoryFilter;

      // Show/hide completed and cancelled tasks based on toggle settings
      const shouldShowCompleted = showCompleted || task.status !== "completed";
      const shouldShowCancelled = showCancelled || task.status !== "cancelled";
      
      return matchesSearch && matchesStatus && matchesAssignee && matchesPriority && matchesClient && matchesProject && matchesCategory && shouldShowCompleted && shouldShowCancelled;
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
          aValue = (getProjectName(a.projectId) || 'No project').toLowerCase();
          bValue = (getProjectName(b.projectId) || 'No project').toLowerCase();
          break;
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

  // Handle column reordering (excluding name column)
  const handleColumnDragEnd = (result: any) => {
    if (!result.destination) return;

    // Don't allow reordering if trying to move the name column
    const reorderableColumns = columns.slice(1); // Exclude first column (name)
    const items = Array.from(reorderableColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Reconstruct the full columns array with name always first
    setColumns([columns[0], ...items]);
  };

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

  // SortableHeader component matching leads.tsx style
  const SortableHeader = ({ column, children, sortField: columnSortField }: { 
    column: Column; 
    children: React.ReactNode; 
    sortField?: SortField;
  }) => {
    const isActive = sortField === columnSortField;
    const canSort = columnSortField && column.id !== "name"; // Don't allow sorting the name column
    
    if (!canSort) {
      return (
        <TableHead className={column.width}>
          <span className="font-medium">{children}</span>
        </TableHead>
      );
    }
    
    return (
      <TableHead 
        className={`${column.width} cursor-pointer hover:bg-slate-50 select-none`}
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
          <div className="flex items-center gap-2" style={{ paddingLeft: `${indentLevel}px` }}>
            {hasSubTasks && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTaskExpansion(task.id);
                }}
                className="p-1 h-6 w-6"
              >
                {expandedTasks.has(task.id) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
            {!hasSubTasks && <div className="w-6" />}
            
            <Checkbox 
              checked={task.status === "completed"}
              onCheckedChange={(checked) => handleTaskToggle(task.id, !!checked)}
              className="flex-shrink-0"
            />
            <Link href={`/tasks/${task.id}`}>
              <span className={`font-medium hover:text-blue-600 cursor-pointer ${
                task.status === "completed" 
                  ? "text-slate-500 line-through" 
                  : "text-slate-900"
              }`}>
                {task.title}
              </span>
            </Link>
            <TaskDependencyIcons taskId={task.id} />
          </div>
        );
      
      case "assignee":
        return task.assignedTo ? (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm">{getStaffName(task.assignedTo)}</span>
          </div>
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
            {task.status.replace('_', ' ')}
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
        return task.clientId ? (
          <span className="text-sm">{getClientName(task.clientId)}</span>
        ) : (
          <span className="text-slate-400 text-sm">No client</span>
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
      status: completed ? "completed" : "pending"
    });
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(id);
    }
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      clearSelection();
      toast({
        title: "Tasks deleted",
        description: `${selectedTasks.size} tasks have been successfully deleted.`,
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      clearSelection();
      toast({
        title: "Tasks updated",
        description: `${selectedTasks.size} tasks have been successfully updated.`,
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

  // Bulk Actions Toolbar Component
  const BulkActionsToolbar = () => {
    const [bulkAssigneeDialogOpen, setBulkAssigneeDialogOpen] = useState(false);
    const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
    const [bulkDueDateDialogOpen, setBulkDueDateDialogOpen] = useState(false);
    const [bulkPriorityDialogOpen, setBulkPriorityDialogOpen] = useState(false);
    const [tempAssignee, setTempAssignee] = useState("");
    const [tempStatus, setTempStatus] = useState("");
    const [tempDueDate, setTempDueDate] = useState("");
    const [tempPriority, setTempPriority] = useState("");

    const handleBulkDelete = () => {
      if (confirm(`Are you sure you want to delete ${selectedTasks.size} selected tasks?`)) {
        bulkDeleteMutation.mutate(Array.from(selectedTasks));
      }
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

  // Dynamic task stats based on selected workflow
  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId) || workflows[0];
  const workflowStatuses = selectedWorkflow?.statuses || [];
  
  const taskStats = {
    total: tasks.filter(t => t.workflowId === selectedWorkflow?.id).length,
    byStatus: workflowStatuses.reduce((acc: any, workflowStatus: any) => {
      acc[workflowStatus.status.value] = tasks.filter(t => 
        t.status === workflowStatus.status.value && 
        t.workflowId === selectedWorkflow?.id
      ).length;
      return acc;
    }, {}),
    overdue: tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < new Date() && 
      t.workflowId === selectedWorkflow?.id &&
      !workflowStatuses.find((s: any) => s.status.value === t.status && (s.status.value === "completed" || s.status.value === "cancelled"))
    ).length,
  };

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
  const KanbanView = ({ tasks, staff, clients, projects, onDragEnd, onDeleteTask, deleteTaskMutation }: {
    tasks: Task[];
    staff: Staff[];
    clients: Client[];
    projects: Project[];
    onDragEnd: (result: any) => void;
    onDeleteTask: (id: string) => void;
    deleteTaskMutation: any;
  }) => {
    // Get the selected workflow or default to the first one
    const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId) || workflows[0];
    
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
      return tasks.filter(task => 
        task.status === status && 
        task.workflowId === selectedWorkflow?.id
      );
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
                <TaskDependencyIcons taskId={task.id} />
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
              <p className="text-xs text-slate-600 mb-2 line-clamp-2">{task.description}</p>
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

    // Show workflow selector and empty state if no workflow or columns
    if (!selectedWorkflow || columns.length === 0) {
      return (
        <div className="space-y-4">
          {/* Workflow Selector */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <label className="text-sm font-medium text-slate-700">Workflow:</label>
            <Select 
              value={selectedWorkflowId} 
              onValueChange={setSelectedWorkflowId}
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
        {/* Workflow Selector */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
          <label className="text-sm font-medium text-slate-700">Workflow:</label>
          <Select 
            value={selectedWorkflowId} 
            onValueChange={setSelectedWorkflowId}
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
          <CheckCircle className="h-8 w-8 text-[#46a1a0]" />
          Tasks
        </h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <TaskForm
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
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
            <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === "table"
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={viewMode === "table" ? { backgroundColor: "#44a1a0" } : {}}
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
                style={viewMode === "kanban" ? { backgroundColor: "#44a1a0" } : {}}
              >
                <Columns className="h-4 w-4" />
                Kanban
              </button>
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {taskStatuses.filter(status => status.isActive).map((status) => (
                    <SelectItem key={status.id} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                        <span>{status.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Assignee Filter */}
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {taskPriorities.filter(priority => priority.isActive).map((priority) => (
                    <SelectItem key={priority.id} value={priority.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: priority.color }}
                        />
                        <span>{priority.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Client Filter */}
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="none">No Client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Project Filter */}
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="none">No Category</SelectItem>
                  {taskCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Bulk Actions Toolbar */}
          {viewMode === "table" && filteredAndSortedTasks.length > 0 && (
            <div className="p-4 pb-0">
              <BulkActionsToolbar />
            </div>
          )}
          
          {viewMode === "table" && filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">
                {searchTerm || statusFilter !== "all" || assigneeFilter !== "all" || priorityFilter !== "all" || clientFilter !== "all" || projectFilter !== "all" || categoryFilter !== "all"
                  ? "No tasks found matching your criteria." 
                  : "No tasks found."
                }
              </p>
              {!searchTerm && statusFilter === "all" && assigneeFilter === "all" && priorityFilter === "all" && clientFilter === "all" && projectFilter === "all" && categoryFilter === "all" && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Create Your First Task</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Task</DialogTitle>
                    </DialogHeader>
                    <TaskForm
                      onSuccess={() => setIsCreateDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ) : viewMode === "table" ? (
            <DragDropContext onDragEnd={handleColumnDragEnd}>
              <Table>
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
                          column={columns[0]}
                          sortField="title"
                        >
                          {columns[0].label}
                        </SortableHeader>
                        
                        {/* Draggable columns (all except Task Name) */}
                        {columns.slice(1).map((column, index) => {
                          // Map column IDs to their corresponding sort fields
                          const sortFieldMap: Record<string, SortField> = {
                            name: 'title',
                            assignee: 'assignedTo', 
                            dueDate: 'dueDate',
                            status: 'status',
                            priority: 'priority',
                            client: 'clientId',
                            project: 'projectId'
                          };
                          
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
                                  className={`${column.width} ${
                                    snapshot.isDragging ? 'bg-blue-50 shadow-lg z-50' : ''
                                  }`}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="flex items-center gap-1 cursor-pointer hover:bg-slate-50 select-none p-1 rounded"
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
                    <TableRow key={task.id} className="hover:bg-slate-50/50">
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
                      
                      {columns.map((column) => (
                        <TableCell key={column.id} className="py-3">
                          {renderCellContent(column, task)}
                        </TableCell>
                      ))}
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
            </DragDropContext>
          ) : (
            <KanbanView 
              tasks={filteredAndSortedTasks}
              staff={staff}
              clients={clients}
              projects={projects}
              onDragEnd={handleKanbanDragEnd}
              onDeleteTask={handleDeleteTask}
              deleteTaskMutation={deleteTaskMutation}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
