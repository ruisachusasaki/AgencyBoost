import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Calendar, User, Building, FolderOpen, Target, Clock, MessageSquare, Edit, Trash2, Flag, Play, Pause, Timer, ChevronRight, Activity, Link2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Task, Client, Campaign, Staff } from "@shared/schema";
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

// Template form schema
const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

export default function TaskDetail() {
  const { taskId } = useParams();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("comments");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [timeEstimateUnit, setTimeEstimateUnit] = useState<"minutes" | "hours">("minutes");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const { startTimer, stopTimer, isTimerRunning, currentTimer } = useTimer();
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [highlightedAnnotationId, setHighlightedAnnotationId] = useState<string | null>(null);
  
  // Get URL search parameters
  const searchParams = new URLSearchParams(window.location.search);
  const commentIdParam = searchParams.get('commentId');
  const annotationIdParam = searchParams.get('annotationId');
  
  // Switch to comments tab if navigating from a mention and set highlighted ID
  useEffect(() => {
    if (commentIdParam || annotationIdParam) {
      setActiveTab("comments");
      if (commentIdParam) {
        setHighlightedCommentId(commentIdParam);
      }
      if (annotationIdParam) {
        setHighlightedAnnotationId(annotationIdParam);
      }
    }
  }, [commentIdParam, annotationIdParam]);

  // Template form
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return await apiRequest("POST", `/api/task-templates/from-task/${taskId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-templates"] });
      toast({
        title: "Template Created",
        description: "Task template has been created successfully.",
      });
      templateForm.reset();
      setShowTemplateModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: !!taskId,
  });

  const { data: clientsData } = useQuery<{ clients: Client[] }>({
    queryKey: ["/api/clients"],
  });
  
  const clients = clientsData?.clients || [];


  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // TeamWorkflow type with statuses included
  type TeamWorkflowWithStatuses = {
    id: string;
    name: string;
    statuses?: {
      id: string;
      status: {
        id: string;
        name: string;
        value: string;
        color: string;
        isDefault: boolean;
      };
      isRequired: boolean;
      order: number;
    }[];
  };

  const { data: teamWorkflows = [] } = useQuery<TeamWorkflowWithStatuses[]>({
    queryKey: ["/api/team-workflows"],
  });

  // Task priorities for dynamic priority dropdown
  type TaskPriority = {
    id: string;
    name: string;
    value: string;
    color: string;
    icon: string;
    isDefault: boolean;
    isActive: boolean;
  };

  const { data: taskPriorities = [] } = useQuery<TaskPriority[]>({
    queryKey: ["/api/task-priorities"],
  });

  const { data: userPermissions } = useQuery({
    queryKey: ["/api/auth/permissions"],
  });

  // Get workflow-specific statuses for this task
  const selectedWorkflow = teamWorkflows.find(w => w.id === task?.workflowId);
  const workflowStatuses = selectedWorkflow?.statuses || [];

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
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/activities`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); // Invalidate tasks list
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
                {task.status?.replace('_', ' ') || 'Unknown'}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority} priority
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(userPermissions as any)?.tasks?.canDelete && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowTemplateModal(true)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                data-testid="save-task-template"
              >
                <Copy className="h-4 w-4 mr-2" />
                Save as Template
              </Button>
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
            </>
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
                        {task.workflowId && task.workflowId !== "none" ? (
                          // Show workflow-specific statuses
                          workflowStatuses
                            .sort((a: any, b: any) => a.order - b.order)
                            .map((workflowStatus: any) => (
                              <SelectItem key={workflowStatus.status.id} value={workflowStatus.status.value}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: workflowStatus.status.color }}
                                  />
                                  <span>{workflowStatus.status.name}</span>
                                </div>
                              </SelectItem>
                            ))
                        ) : (
                          // Show default statuses when no workflow selected
                          <>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span>Pending</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="in_progress">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span>In Progress</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="completed">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span>Completed</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="cancelled">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span>Cancelled</span>
                              </div>
                            </SelectItem>
                          </>
                        )}
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
                        {taskPriorities.filter(priority => priority.isActive).map((priority) => {
                          const IconComponent = priority.icon === 'flag' ? Flag : Flag; // For now using Flag, can be expanded
                          return (
                            <SelectItem key={priority.id} value={priority.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent 
                                  className="h-3 w-3" 
                                  style={{ color: priority.color }}
                                />
                                <span>{priority.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
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

                {/* Row 4: Client and Portal Visibility */}
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

                  {/* Client Portal Visibility - Right Side */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Client Portal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={task.visibleToClient || false}
                        onCheckedChange={(checked) => updateTaskMutation.mutate({ visibleToClient: !!checked })}
                        data-testid="switch-task-visible-to-client"
                      />
                      <span className="text-sm text-slate-600">
                        {task.visibleToClient ? "Visible to client" : "Hidden from client"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 5: Client Approval */}
                {task.visibleToClient && task.clientId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Approval - Left Side */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">Client Approval</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={task.requiresClientApproval || false}
                          onCheckedChange={(checked) => updateTaskMutation.mutate({ requiresClientApproval: !!checked })}
                          data-testid="switch-requires-client-approval"
                        />
                        <span className="text-sm text-slate-600">
                          {task.requiresClientApproval ? "Required" : "Not required"}
                        </span>
                      </div>
                    </div>

                    {/* Approval Status - Right Side */}
                    {task.requiresClientApproval && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">Status:</span>
                        </div>
                        <Badge 
                          variant={
                            task.clientApprovalStatus === 'approved' ? 'default' : 
                            task.clientApprovalStatus === 'changes_requested' ? 'destructive' : 
                            'secondary'
                          }
                          className={
                            task.clientApprovalStatus === 'approved' ? 'bg-green-500' : 
                            task.clientApprovalStatus === 'changes_requested' ? 'bg-orange-500' : 
                            'bg-yellow-500'
                          }
                        >
                          {task.clientApprovalStatus === 'approved' ? 'Approved' : 
                           task.clientApprovalStatus === 'changes_requested' ? 'Changes Requested' : 
                           'Pending Approval'}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
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
                    parentTaskId={taskId!}
                    level={0}
                    maxLevel={5}
                  />
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Task Attachments */}
          <TaskAttachments taskId={taskId!} />

        </div>

        {/* Sidebar - Tabbed Interface with Dynamic Height */}
        <Card className="w-full sticky top-4 flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          <CardHeader className="pb-0 flex-shrink-0">
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

          <CardContent className="pt-6 flex-1 overflow-y-auto">
            {/* Tab Content */}
            {activeTab === "comments" && (
              <TaskComments taskId={taskId!} highlightedCommentId={highlightedCommentId} />
            )}
            
            {activeTab === "activity" && (
              <TaskActivities taskId={taskId!} showCard={false} />
            )}
            
            {activeTab === "dependencies" && (
              <TaskDependencies taskId={taskId!} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save as Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Task as Template</DialogTitle>
          </DialogHeader>
          
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(data => createTemplateMutation.mutate(data))}>
              <div className="space-y-4 py-4">
                <FormField
                  control={templateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`${task?.title} Template`}
                          {...field}
                          data-testid="template-name-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={templateForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this template is for..."
                          rows={3}
                          {...field}
                          data-testid="template-description-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTemplateModal(false)}
                  disabled={createTemplateMutation.isPending}
                  data-testid="template-cancel-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTemplateMutation.isPending}
                  data-testid="template-save-button"
                >
                  {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}