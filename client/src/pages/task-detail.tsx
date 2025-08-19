import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, User, Building, FolderOpen, Target, Clock, MessageSquare, Edit, Trash2, Flag, Play, Pause, Timer, ChevronRight, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Task, Client, Project, Campaign, Staff } from "@shared/schema";
import TaskForm from "@/components/forms/task-form";
import TaskComments from "@/components/task-comments";
import TaskActivities from "@/components/task-activities";
import TaskDescriptionCard from "@/components/task-description-card";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function TaskDetail() {
  const { taskId } = useParams();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTimeEntry, setCurrentTimeEntry] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("comments");

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ["/api/tasks", taskId],
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

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: userPermissions } = useQuery({
    queryKey: ["/api/auth/permissions"],
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Only administrators can delete tasks.');
        }
        throw new Error('Failed to delete task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      setLocation("/tasks");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
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

  const formatDate = (date: Date | null, type: 'start' | 'due') => {
    if (!date) return type === 'start' ? "No start date" : "No due date";
    
    const taskDate = new Date(date);
    const today = new Date();
    const isToday = taskDate.toDateString() === today.toDateString();
    const isTomorrow = taskDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
    const isPast = taskDate < today && !isToday;
    
    if (type === 'start') {
      if (isToday) return "Starting today";
      if (isTomorrow) return "Starting tomorrow";
      if (isPast) return `Started ${taskDate.toLocaleDateString()}`;
      return `Starts ${taskDate.toLocaleDateString()}`;
    } else {
      if (isToday) return "Due today";
      if (isTomorrow) return "Due tomorrow";
      if (isPast) return `Overdue (${taskDate.toLocaleDateString()})`;
      return `Due ${taskDate.toLocaleDateString()}`;
    }
  };

  const handleDeleteTask = () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteTaskMutation.mutate();
    }
  };

  const updateTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      await apiRequest(`/api/tasks/${taskId}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const updateTask = async (updates: Partial<Task>) => {
    return updateTaskMutation.mutateAsync(updates);
  };

  const startTimeTracking = () => {
    const now = new Date().toISOString();
    const timeEntry = {
      id: Date.now().toString(),
      startTime: now,
      userId: 'current-user', // Replace with actual current user ID
      isRunning: true
    };
    setCurrentTimeEntry(timeEntry);
    setIsTimerRunning(true);
    
    // Update task with new time entry
    const currentEntries = task?.timeEntries || [];
    updateTaskMutation.mutate({
      timeEntries: [...currentEntries, timeEntry]
    });
  };

  const stopTimeTracking = () => {
    if (currentTimeEntry) {
      const now = new Date().toISOString();
      const updatedEntry = {
        ...currentTimeEntry,
        endTime: now,
        isRunning: false,
        duration: Math.floor((new Date(now).getTime() - new Date(currentTimeEntry.startTime).getTime()) / 1000 / 60) // minutes
      };
      
      const currentEntries = task?.timeEntries || [];
      const updatedEntries = currentEntries.map((entry: any) => 
        entry.id === currentTimeEntry.id ? updatedEntry : entry
      );
      
      const totalTracked = updatedEntries.reduce((total: number, entry: any) => 
        total + (entry.duration || 0), 0
      );
      
      updateTaskMutation.mutate({
        timeEntries: updatedEntries,
        timeTracked: totalTracked
      });
      
      setCurrentTimeEntry(null);
      setIsTimerRunning(false);
    }
  };

  const getStaffName = (staffId: string | null) => {
    if (!staffId || staffId === 'unassigned') return 'Unassigned';
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown User';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/tasks")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">Task not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/tasks")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={getStatusColor(task.status)}>
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority} priority
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? "Cancel Edit" : "Edit Task"}
          </Button>
          
          {userPermissions?.tasks?.canDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDeleteTask}
              disabled={deleteTaskMutation.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details or Edit Form */}
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskForm
                  task={task}
                  onSuccess={() => {
                    setIsEditing(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Task Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Row 1: Status and Assignees */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status - Left Side */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Status</span>
                    </div>
                    <Select
                      value={task.status}
                      onValueChange={(value) => updateTaskMutation.mutate({ status: value })}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Assignees - Right Side */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Assignee</span>
                    </div>
                    <Select
                      value={task.assignedTo || "unassigned"}
                      onValueChange={(value) => updateTaskMutation.mutate({ assignedTo: value === "unassigned" ? null : value })}
                    >
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Select assignee">
                          {getStaffName(task.assignedTo)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                            {member.department && ` (${member.department})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Dates and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dates - Left Side */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Dates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Start Date */}
                      <div className="flex items-center gap-1">
                        {task.startDate ? (
                          <Input
                            type="date"
                            value={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ""}
                            onChange={(e) => updateTaskMutation.mutate({ 
                              startDate: e.target.value ? new Date(e.target.value) : null 
                            })}
                            className="w-32 h-7 text-xs border-0 bg-transparent p-1 hover:bg-slate-50 focus:bg-white focus:border-slate-200"
                          />
                        ) : (
                          <Input
                            type="date"
                            placeholder="Start date"
                            onChange={(e) => updateTaskMutation.mutate({ 
                              startDate: e.target.value ? new Date(e.target.value) : null 
                            })}
                            className="w-32 h-7 text-xs border-dashed border-slate-300 p-1 hover:bg-slate-50 focus:bg-white focus:border-slate-400"
                          />
                        )}
                      </div>
                      
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                      
                      {/* Due Date */}
                      <div className="flex items-center gap-1">
                        {task.dueDate ? (
                          <Input
                            type="date"
                            value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                            onChange={(e) => updateTaskMutation.mutate({ 
                              dueDate: e.target.value ? new Date(e.target.value) : null 
                            })}
                            className={`w-32 h-7 text-xs border-0 bg-transparent p-1 hover:bg-slate-50 focus:bg-white focus:border-slate-200 ${
                              new Date(task.dueDate) < new Date() && new Date(task.dueDate).toDateString() !== new Date().toDateString() 
                                ? 'text-red-600 font-medium' : ''
                            }`}
                          />
                        ) : (
                          <Input
                            type="date"
                            placeholder="Due date"
                            onChange={(e) => updateTaskMutation.mutate({ 
                              dueDate: e.target.value ? new Date(e.target.value) : null 
                            })}
                            className="w-32 h-7 text-xs border-dashed border-slate-300 p-1 hover:bg-slate-50 focus:bg-white focus:border-slate-400"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Priority - Right Side */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Priority</span>
                    </div>
                    <Select
                      value={task.priority}
                      onValueChange={(value) => updateTaskMutation.mutate({ priority: value })}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-red-500" />
                            <span>Urgent</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-yellow-500" />
                            <span>High</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="normal">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-blue-500" />
                            <span>Normal</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-gray-500" />
                            <span>Low</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Time Estimate and Time Tracking */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Time Estimate - Left Side */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Time Estimate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={task.timeEstimate || ""}
                        onChange={(e) => updateTaskMutation.mutate({ timeEstimate: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-16 h-8 text-sm"
                        min="0"
                      />
                      <span className="text-sm text-slate-500">minutes</span>
                    </div>
                  </div>
                  
                  {/* Time Tracking - Right Side */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Track Time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isTimerRunning ? "destructive" : "default"}
                        onClick={isTimerRunning ? stopTimeTracking : startTimeTracking}
                        className="h-8 px-3"
                      >
                        {isTimerRunning ? (
                          <><Pause className="h-3 w-3 mr-1" />Stop</>
                        ) : (
                          <><Play className="h-3 w-3 mr-1" />Start</>
                        )}
                      </Button>
                      <span className="text-sm text-slate-600">
                        {task.timeTracked ? `${Math.floor(task.timeTracked / 60)}h ${task.timeTracked % 60}m` : '0m'} tracked
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 4: Client and Project */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client - Left Side */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Client</span>
                    </div>
                    <span className="text-sm text-slate-600">
                      {getClientName(task.clientId) || "No client assigned"}
                    </span>
                  </div>
                  
                  {/* Project - Right Side */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Project</span>
                    </div>
                    <span className="text-sm text-slate-600">
                      {getProjectName(task.projectId) || "No project assigned"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Description */}
          {!isEditing && (
            <TaskDescriptionCard 
              task={task} 
              onUpdate={updateTask} 
            />
          )}


        </div>

        {/* Sidebar - Tabbed Interface */}
        <Card className="w-full">
          <CardHeader className="pb-0">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: "comments", name: "Comments", icon: MessageSquare },
                  { id: "activity", name: "Activity", icon: Activity }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                        activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Tab Content */}
            {activeTab === "comments" && (
              <TaskComments taskId={task.id} />
            )}
            
            {activeTab === "activity" && (
              <TaskActivities taskId={task.id} showCard={false} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}