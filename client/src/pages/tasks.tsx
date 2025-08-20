import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Calendar, CheckCircle, GripVertical, Flag, User, ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import TaskForm from "@/components/forms/task-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, Client, Project, Campaign, Staff } from "@shared/schema";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Column {
  id: string;
  label: string;
  width?: string;
}

type SortField = 'title' | 'assignedTo' | 'dueDate' | 'priority' | 'clientId' | 'projectId' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [columns, setColumns] = useState<Column[]>([
    { id: "name", label: "Task Name", width: "w-1/4" },
    { id: "assignee", label: "Assignee", width: "w-1/6" },
    { id: "dueDate", label: "Due Date", width: "w-1/6" },
    { id: "priority", label: "Priority", width: "w-1/8" },
    { id: "client", label: "Client", width: "w-1/6" },
    { id: "project", label: "Project", width: "w-1/6" },
  ]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
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

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/tasks/${id}`, "DELETE");
      // Don't try to parse JSON from 204 No Content response
      return response.status === 204 ? null : response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest(`/api/tasks/${id}`, "PUT", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

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
        task.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
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
          aValue = getStaffName(a.assignedTo) || '';
          bValue = getStaffName(b.assignedTo) || '';
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'clientId':
          aValue = getClientName(a.clientId) || '';
          bValue = getClientName(b.clientId) || '';
          break;
        case 'projectId':
          aValue = getProjectName(a.projectId) || '';
          bValue = getProjectName(b.projectId) || '';
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
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

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
    overdue: tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < new Date() && 
      t.status !== "completed"
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
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

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{taskStats.pending}</p>
              <p className="text-sm text-slate-600">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
              <p className="text-sm text-slate-600">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
          </CardContent>
        </Card>
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
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="text-sm text-slate-600">
                {filteredAndSortedTasks.length} task{filteredAndSortedTasks.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "No tasks found matching your criteria." 
                  : "No tasks found."
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
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
          ) : (
            <DragDropContext onDragEnd={handleColumnDragEnd}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => {
                      // Map column IDs to their corresponding sort fields
                      const sortFieldMap: Record<string, SortField> = {
                        name: 'title',
                        assignee: 'assignedTo', 
                        dueDate: 'dueDate',
                        priority: 'priority',
                        client: 'clientId',
                        project: 'projectId'
                      };
                      
                      return (
                        <SortableHeader 
                          key={column.id} 
                          column={column}
                          sortField={sortFieldMap[column.id]}
                        >
                          {column.label}
                        </SortableHeader>
                      );
                    })}
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                  {getHierarchicalTasks().map((task) => (
                    <TableRow key={task.id} className="hover:bg-slate-50/50">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
