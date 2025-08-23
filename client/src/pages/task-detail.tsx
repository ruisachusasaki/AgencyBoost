import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, User, Building, FolderOpen, Target, Clock, MessageSquare, Edit, Trash2, Flag, Play, Pause, Timer, ChevronRight, Activity, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Task, Client, Project, Campaign, Staff } from "@shared/schema";
import TaskForm from "@/components/forms/task-form";
import TaskComments from "@/components/task-comments";
import TaskActivities from "@/components/task-activities";
import TaskDescriptionCard from "@/components/task-description-card";
import TaskAttachments from "@/components/task-attachments";
import { SubTaskList } from "@/components/sub-task-list";
import { TaskPath } from "@/components/task-path";
import { TaskDependencies } from "@/components/task-dependencies";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useTimer } from "@/contexts/TimerContext";

export default function TaskDetail() {
  const { taskId } = useParams();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("comments");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [timeEstimateUnit, setTimeEstimateUnit] = useState<"minutes" | "hours">("minutes");
  const { startTimer, stopTimer, isTimerRunning, currentTimer } = useTimer();

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
      await apiRequest("PUT", `/api/tasks/${taskId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      });
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
          description: errorMessage || "Failed to update task",
          variant: "destructive",
        });
      }
    },
  });

  const updateTask = async (updates: Partial<Task>) => {
    return updateTaskMutation.mutateAsync(updates);
  };

  // Check if this task has the running timer
  const isThisTaskTimerRunning = isTimerRunning && currentTimer?.taskId === taskId;

  const startTimeTracking = () => {
    if (!task) return;
    startTimer(task.id, task.title);
  };

  const stopTimeTracking = () => {
    stopTimer();
  };

  const getStaffName = (staffId: string | null) => {
    if (!staffId || staffId === 'unassigned') return 'Unassigned';
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown User';
  };

  const startTitleEdit = () => {
    if (task) {
      setTitleValue(task.title);
      setEditingTitle(true);
    }
  };

  const saveTitleEdit = () => {
    if (titleValue.trim() && titleValue !== task?.title) {
      updateTaskMutation.mutate({ title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const cancelTitleEdit = () => {
    setEditingTitle(false);
    setTitleValue("");
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTitleEdit();
    } else if (e.key === 'Escape') {
      cancelTitleEdit();
    }
  };

  // Helper functions for time estimate conversion
  const getDisplayTimeValue = () => {
    if (!task?.timeEstimate) return "";
    if (timeEstimateUnit === "hours") {
      return (task.timeEstimate / 60).toString();
    }
    return task.timeEstimate.toString();
  };

  const convertToMinutes = (value: number, unit: "minutes" | "hours") => {
    return unit === "hours" ? value * 60 : value;
  };

  const handleTimeEstimateChange = (value: string) => {
    if (!value) {
      updateTaskMutation.mutate({ timeEstimate: null });
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    
    const minutesValue = convertToMinutes(numValue, timeEstimateUnit);
    updateTaskMutation.mutate({ timeEstimate: Math.round(minutesValue) });
  };

  // Update unit when task changes to show appropriate unit
  useEffect(() => {
    if (task?.timeEstimate) {
      // If the time is a multiple of 60 minutes and >= 60, default to hours
      if (task.timeEstimate >= 60 && task.timeEstimate % 60 === 0) {
        setTimeEstimateUnit("hours");
      } else {
        setTimeEstimateUnit("minutes");
      }
    }
  }, [task?.timeEstimate]);

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
            {editingTitle ? (
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitleEdit}
                onKeyDown={handleTitleKeyDown}
                className="text-2xl font-bold bg-transparent border-0 shadow-none p-0 h-auto focus-visible:ring-1 focus-visible:ring-primary"
                autoFocus
              />
            ) : (
              <h1 
                className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-slate-700 transition-colors hover:bg-slate-100 p-1 rounded"
                onClick={startTitleEdit}
                title="Click to edit task title"
                data-testid="task-title-edit"
              >
                {task.title}
              </h1>
            )}
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
          {(userPermissions as any)?.tasks?.canDelete && (
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

      {/* Task Path - Breadcrumb Navigation for Sub-tasks */}
      <TaskPath taskId={taskId!} className="mb-4" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
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
                        value={getDisplayTimeValue()}
                        onChange={(e) => handleTimeEstimateChange(e.target.value)}
                        className="w-20 h-8 text-sm"
                        min="0"
                        step={timeEstimateUnit === "hours" ? "0.25" : "1"}
                      />
                      <Select
                        value={timeEstimateUnit}
                        onValueChange={(value: "minutes" | "hours") => {
                          setTimeEstimateUnit(value);
                          // Convert existing value to new unit
                          if (task?.timeEstimate) {
                            const displayValue = value === "hours" ? task.timeEstimate / 60 : task.timeEstimate;
                            // Update the field with the same value but potentially different precision
                            if (value === "hours" && task.timeEstimate % 60 !== 0) {
                              // If switching to hours and not evenly divisible, keep as decimal
                              const hourValue = Math.round((task.timeEstimate / 60) * 100) / 100;
                              updateTaskMutation.mutate({ timeEstimate: Math.round(hourValue * 60) });
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-20 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">min</SelectItem>
                          <SelectItem value="hours">hrs</SelectItem>
                        </SelectContent>
                      </Select>
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
                        variant={isThisTaskTimerRunning ? "destructive" : "default"}
                        onClick={isThisTaskTimerRunning ? stopTimeTracking : startTimeTracking}
                        className="h-8 px-3"
                        disabled={isTimerRunning && !isThisTaskTimerRunning}
                      >
                        {isThisTaskTimerRunning ? (
                          <><Pause className="h-3 w-3 mr-1" />Stop</>
                        ) : (
                          <><Play className="h-3 w-3 mr-1" />{isTimerRunning ? "Switch" : "Start"}</>
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

          {/* Task Description */}
          <TaskDescriptionCard 
            task={task} 
            onUpdate={updateTask} 
          />

          {/* Sub-tasks - ClickUp-style hierarchical tasks (up to 5 levels deep) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Sub-tasks
                {task.hasSubTasks && (
                  <Badge variant="secondary" className="ml-2">
                    Has sub-tasks
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[40%]">Task Name</TableHead>
                    <TableHead className="w-[20%]">Assignee</TableHead>
                    <TableHead className="w-[20%]">Due Date</TableHead>
                    <TableHead className="w-[20%]">Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SubTaskList 
                    parentTaskId={task.id}
                    level={0}
                    maxLevel={5}
                  />
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Task Attachments */}
          <TaskAttachments taskId={task.id} />

        </div>

        {/* Sidebar - Tabbed Interface */}
        <Card className="w-full">
          <CardHeader className="pb-0">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: "comments", name: "Comments", icon: MessageSquare },
                  { id: "activity", name: "Activity", icon: Activity },
                  { id: "dependencies", name: "Dependencies", icon: Link2 }
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
            
            {activeTab === "dependencies" && (
              <TaskDependencies taskId={task.id} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}