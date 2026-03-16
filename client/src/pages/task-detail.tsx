import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRolePermissions } from "@/hooks/use-has-permission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Calendar as CalendarIcon, User, Building, FolderOpen, Target, Clock, MessageSquare, Edit, Trash2, Flag, Play, Pause, Timer, ChevronRight, Activity, Link2, Copy, Video, ExternalLink, Plus, Tag as TagIcon, Repeat } from "lucide-react";
import { TagSelector, TagDisplay } from "@/components/ui/tag-selector";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Task, Client, Campaign, Staff } from "@shared/schema";
import TaskForm from "@/components/forms/task-form";
import TaskComments from "@/components/task-comments";
import TaskActivities from "@/components/task-activities";
import TaskDescriptionCard from "@/components/task-description-card";
import { TaskIntakeSubmissionViewer } from "@/components/task-intake-submission-viewer";
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

function RecurringSettingsCard({ task, onUpdate }: { task: Task; onUpdate: (data: Partial<Task>) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecurring, setIsRecurring] = useState(task.isRecurring || false);
  const [recurringInterval, setRecurringInterval] = useState(task.recurringInterval || 1);
  const [recurringUnit, setRecurringUnit] = useState(task.recurringUnit || "days");
  const [recurringEndType, setRecurringEndType] = useState(task.recurringEndType || "never");
  const [recurringEndOccurrences, setRecurringEndOccurrences] = useState(task.recurringEndOccurrences || 10);
  const [recurringEndDate, setRecurringEndDate] = useState<Date | null>(task.recurringEndDate ? new Date(task.recurringEndDate) : null);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const changed =
      isRecurring !== (task.isRecurring || false) ||
      recurringInterval !== (task.recurringInterval || 1) ||
      recurringUnit !== (task.recurringUnit || "days") ||
      recurringEndType !== (task.recurringEndType || "never") ||
      recurringEndOccurrences !== (task.recurringEndOccurrences || 10) ||
      (recurringEndDate?.toISOString() || null) !== (task.recurringEndDate ? new Date(task.recurringEndDate).toISOString() : null);
    setHasChanges(changed);
  }, [isRecurring, recurringInterval, recurringUnit, recurringEndType, recurringEndOccurrences, recurringEndDate, task]);

  const saveRecurringSettings = () => {
    onUpdate({
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : null,
      recurringUnit: isRecurring ? recurringUnit : null,
      recurringEndType: isRecurring ? recurringEndType : null,
      recurringEndDate: isRecurring && recurringEndType === "on_date" && recurringEndDate ? recurringEndDate.toISOString() : null,
      recurringEndOccurrences: isRecurring && recurringEndType === "after_occurrences" ? recurringEndOccurrences : null,
    } as any);
    toast({ title: isRecurring ? "Recurring settings updated" : "Recurring schedule removed" });
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Recurring Settings
            {task.isRecurring && (
              <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                Every {task.recurringInterval} {task.recurringUnit}
              </Badge>
            )}
          </div>
          <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Make this task recurring</Label>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          {isRecurring && (
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">Repeat every</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={recurringInterval}
                      onChange={(e) => setRecurringInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20"
                    />
                    <Select value={recurringUnit} onValueChange={setRecurringUnit}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">End condition</Label>
                <Select value={recurringEndType} onValueChange={setRecurringEndType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="on_date">On specific date</SelectItem>
                    <SelectItem value="after_occurrences">After number of occurrences</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurringEndType === "on_date" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">End date</Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !recurringEndDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recurringEndDate ? format(recurringEndDate, "PPP") : "Pick an end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={recurringEndDate || undefined} onSelect={(date) => { setRecurringEndDate(date || null); setEndDateOpen(false); }} />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {recurringEndType === "after_occurrences" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Number of occurrences</Label>
                  <Input
                    type="number"
                    min={1}
                    value={recurringEndOccurrences}
                    onChange={(e) => setRecurringEndOccurrences(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          )}

          {hasChanges && (
            <div className="flex justify-end pt-2 border-t">
              <Button onClick={saveRecurringSettings} size="sm" className="bg-primary hover:bg-primary/90">
                Save Recurring Settings
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

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
  const [showManualTimeDialog, setShowManualTimeDialog] = useState(false);
  const getLocalDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const [manualTimeDate, setManualTimeDate] = useState(getLocalDateString());
  const [manualTimeHours, setManualTimeHours] = useState("");
  const [manualTimeMinutes, setManualTimeMinutes] = useState("");
  const [manualTimeNotes, setManualTimeNotes] = useState("");
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [manualTimeDateOpen, setManualTimeDateOpen] = useState(false);
  const [fathomUrlValue, setFathomUrlValue] = useState("");
  
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
        variant: "default",
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

  type TaskCategory = {
    id: string;
    name: string;
    color: string;
    icon: string;
    workflowId: string | null;
  };

  const { data: taskCategories = [] } = useQuery<TaskCategory[]>({
    queryKey: ["/api/task-categories"],
  });

  const { data: userPermissions } = useQuery({
    queryKey: ["/api/auth/permissions"],
  });

  // Get current user for role-based features
  const { data: currentUser } = useQuery<{ id: string; role: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/current-user'],
  });

  // Use role-based permission hook for consistent permission checks
  const { canAddManualTime } = useRolePermissions();

  const selectedCategory = taskCategories.find(c => c.id === task?.categoryId);
  const effectiveWorkflowId = task?.workflowId || selectedCategory?.workflowId || null;
  const selectedWorkflow = teamWorkflows.find(w => w.id === effectiveWorkflowId);
  const workflowStatuses = selectedWorkflow?.statuses || [];

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        variant: "default",
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
    return client?.company || client?.name || "Unknown Client";
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
    setShowDeleteConfirm(true);
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
        variant: "default",
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

  // Add manual time entry mutation
  const addManualTimeMutation = useMutation({
    mutationFn: async (data: { date: string; hours: number; minutes: number; notes: string }) => {
      if (!task || !currentUser) return;
      
      const totalMinutes = (data.hours * 60) + data.minutes;
      if (totalMinutes <= 0) {
        throw new Error("Please enter a valid duration");
      }
      
      // Create the time entry with the selected date
      // Parse date as local time by appending T12:00:00 (noon) to avoid timezone issues
      // This ensures the date stays correct regardless of timezone when converted to ISO
      const entryDate = new Date(data.date + 'T12:00:00');
      
      const newEntry = {
        id: Date.now().toString(),
        taskId: task.id,
        taskTitle: task.title,
        startTime: entryDate.toISOString(),
        endTime: entryDate.toISOString(),
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        isRunning: false,
        duration: totalMinutes,
        source: 'manual',
        notes: data.notes || undefined
      };
      
      // Merge with existing entries
      const existingEntries = Array.isArray(task.timeEntries) ? task.timeEntries : [];
      const mergedEntries = [...existingEntries, newEntry];
      
      // Calculate new total
      const totalTracked = mergedEntries.reduce((total: number, entry: any) => 
        total + (entry.duration || 0), 0
      );
      
      await apiRequest("PUT", `/api/tasks/${task.id}`, {
        timeEntries: mergedEntries,
        timeTracked: totalTracked
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/activities`] });
      toast({
        title: "Time Added",
        variant: "default",
        description: "Manual time entry has been added successfully.",
      });
      // Reset form
      setShowManualTimeDialog(false);
      setManualTimeDate(getLocalDateString());
      setManualTimeHours("");
      setManualTimeMinutes("");
      setManualTimeNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add time entry.",
        variant: "destructive",
      });
    },
  });

  const handleAddManualTime = () => {
    const hours = parseInt(manualTimeHours) || 0;
    const minutes = parseInt(manualTimeMinutes) || 0;
    addManualTimeMutation.mutate({
      date: manualTimeDate,
      hours,
      minutes,
      notes: manualTimeNotes
    });
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

  // Sync fathom URL from task data
  useEffect(() => {
    setFathomUrlValue((task as any)?.fathomRecordingUrl || "");
  }, [(task as any)?.fathomRecordingUrl]);

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
              {task.isRecurring && (
                <Badge variant="outline" className="flex items-center gap-1 text-primary border-primary/30">
                  <Repeat className="h-3 w-3" />
                  Recurring
                </Badge>
              )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch" style={{ minHeight: 'calc(100vh - 12rem)' }}>
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
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
                        {effectiveWorkflowId && effectiveWorkflowId !== "none" && workflowStatuses.length > 0 ? (
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
                            <SelectItem value="todo">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span>Todo</span>
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
                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Dates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Start Date */}
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 px-3 text-left font-normal",
                              !task.startDate && "text-muted-foreground"
                            )}
                            data-testid="button-start-date"
                          >
                            {task.startDate ? (
                              format(new Date(task.startDate), "MMM d, yyyy")
                            ) : (
                              <span>Start date</span>
                            )}
                            <CalendarIcon className="ml-2 h-3 w-3 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={task.startDate ? new Date(task.startDate) : undefined}
                            onSelect={(date) => {
                              updateTaskMutation.mutate({ startDate: date || null });
                              setStartDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                      
                      {/* Due Date */}
                      <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 px-3 text-left font-normal",
                              !task.dueDate && "text-muted-foreground",
                              task.dueDate && new Date(task.dueDate) < new Date() && new Date(task.dueDate).toDateString() !== new Date().toDateString() && "text-red-600 border-red-300"
                            )}
                            data-testid="button-due-date"
                          >
                            {task.dueDate ? (
                              format(new Date(task.dueDate), "MMM d, yyyy")
                            ) : (
                              <span>Due date</span>
                            )}
                            <CalendarIcon className="ml-2 h-3 w-3 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={task.dueDate ? new Date(task.dueDate) : undefined}
                            onSelect={(date) => {
                              updateTaskMutation.mutate({ dueDate: date || null });
                              setDueDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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

                {/* Row 2.5: Category */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</span>
                  </div>
                  <Select
                    value={task.categoryId || "none"}
                    onValueChange={(value) => {
                      const newCategoryId = value === "none" ? null : value;
                      const newCategory = taskCategories.find(c => c.id === newCategoryId);
                      const newWorkflowId = newCategory?.workflowId || null;
                      const updates: any = { categoryId: newCategoryId, workflowId: newWorkflowId };
                      if (newWorkflowId) {
                        const newWorkflow = teamWorkflows.find(w => w.id === newWorkflowId);
                        const newStatuses = newWorkflow?.statuses || [];
                        const currentStatusExists = newStatuses.some((ws: any) => ws.status.value === task.status);
                        if (!currentStatusExists && newStatuses.length > 0) {
                          const sorted = [...newStatuses].sort((a: any, b: any) => a.order - b.order);
                          updates.status = sorted[0].status.value;
                        }
                      } else {
                        const defaultStatuses = ['todo', 'in_progress', 'completed', 'cancelled'];
                        if (!defaultStatuses.includes(task.status)) {
                          updates.status = 'todo';
                        }
                      }
                      updateTaskMutation.mutate(updates);
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-slate-500">No category</span>
                      </SelectItem>
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

                {/* Row 2.6: Tags */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags</span>
                  </div>
                  <TagSelector
                    value={task.tags || []}
                    onChange={(tags) => updateTaskMutation.mutate({ tags })}
                    placeholder="Add tags..."
                  />
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
                        data-testid="button-timer-toggle"
                      >
                        {isThisTaskTimerRunning ? (
                          <><Pause className="h-3 w-3 mr-1" />Stop</>
                        ) : (
                          <><Play className="h-3 w-3 mr-1" />{isTimerRunning ? "Switch" : "Start"}</>
                        )}
                      </Button>
                      {canAddManualTime && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowManualTimeDialog(true)}
                                className="h-8 w-8 p-0"
                                data-testid="button-add-manual-time"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add Time</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
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
                    <Select
                      value={task.clientId || "none"}
                      onValueChange={(value) => updateTaskMutation.mutate({ clientId: value === "none" ? null : value })}
                    >
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Select client">
                          {getClientName(task.clientId) || "No client"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No client</SelectItem>
                        {clients.map((client: Client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company || `${client.firstName} ${client.lastName}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                {/* Row 6: Fathom Recording URL */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-slate-700">Fathom Recording</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        placeholder="Paste Fathom recording URL..."
                        value={fathomUrlValue}
                        onChange={(e) => setFathomUrlValue(e.target.value)}
                        onBlur={() => {
                          const currentValue = (task as any).fathomRecordingUrl || "";
                          if (fathomUrlValue !== currentValue) {
                            updateTaskMutation.mutate({ fathomRecordingUrl: fathomUrlValue || null });
                          }
                        }}
                        className="flex-1 h-8 text-sm"
                        data-testid="input-fathom-url"
                      />
                      {fathomUrlValue && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-purple-300 text-purple-700 hover:bg-purple-100"
                          onClick={() => window.open(fathomUrlValue, '_blank')}
                          data-testid="view-fathom-recording"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Task Description */}
          <TaskDescriptionCard 
            task={task} 
            onUpdate={updateTask}
          />

          {/* Recurring Task Settings */}
          <RecurringSettingsCard task={task} onUpdate={updateTask} />

          {/* Intake Form Submission - shows if task was created via intake form */}
          <TaskIntakeSubmissionViewer taskId={taskId!} />


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

        {/* Sidebar - Tabbed Interface with Dynamic Height matching left pane */}
        <div className="flex flex-col h-full">
          <Card className="w-full flex flex-col flex-1">
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

      {/* Manual Time Entry Dialog */}
      <Dialog open={showManualTimeDialog} onOpenChange={setShowManualTimeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Time Manually</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={manualTimeDateOpen} onOpenChange={setManualTimeDateOpen} modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !manualTimeDate && "text-muted-foreground"
                    )}
                    data-testid="input-manual-time-date"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {manualTimeDate ? (
                      format(new Date(manualTimeDate + 'T12:00:00'), "MMM d, yyyy")
                    ) : (
                      "Select date"
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} style={{ zIndex: 9999 }}>
                  <Calendar
                    mode="single"
                    selected={manualTimeDate ? new Date(manualTimeDate + 'T12:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setManualTimeDate(date.toISOString().split('T')[0]);
                      }
                      setManualTimeDateOpen(false);
                    }}
                    disabled={(date) => {
                      const now = new Date();
                      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                      return date > todayMidnight;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    placeholder="0"
                    value={manualTimeHours}
                    onChange={(e) => setManualTimeHours(e.target.value)}
                    className="w-20"
                    data-testid="input-manual-time-hours"
                  />
                  <span className="text-sm text-slate-600">hours</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={manualTimeMinutes}
                    onChange={(e) => setManualTimeMinutes(e.target.value)}
                    className="w-20"
                    data-testid="input-manual-time-minutes"
                  />
                  <span className="text-sm text-slate-600">minutes</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manual-time-notes">Notes (Optional)</Label>
              <Textarea
                id="manual-time-notes"
                placeholder="What were you working on?"
                value={manualTimeNotes}
                onChange={(e) => setManualTimeNotes(e.target.value)}
                rows={3}
                data-testid="input-manual-time-notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowManualTimeDialog(false)}
              disabled={addManualTimeMutation.isPending}
              data-testid="button-manual-time-cancel"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddManualTime}
              disabled={addManualTimeMutation.isPending || (!manualTimeHours && !manualTimeMinutes)}
              data-testid="button-manual-time-save"
            >
              {addManualTimeMutation.isPending ? "Adding..." : "Add Time"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTaskMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
