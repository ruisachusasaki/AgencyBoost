import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Flag, Repeat, FileText, Users, CalendarDays, CalendarIcon, Tag as TagIcon } from "lucide-react";
import { TagSelector } from "@/components/ui/tag-selector";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { insertTaskSchema, type Task, type InsertTask, type Client, type Staff, type TaskPriority, type TaskCategory, type TaskTemplate } from "@shared/schema";
import { z } from "zod";

// TeamWorkflow type with statuses included
type TeamWorkflowWithStatuses = {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  statuses?: {
    id: string;
    workflowId: string;
    order: number;
    isRequired: boolean;
    status: {
      id: string;
      name: string;
      value: string;
      color: string;
      isDefault: boolean;
    };
  }[];
};
import { useState, useEffect } from "react";

// Create extended form schema that includes template fields
const taskFormSchema = insertTaskSchema.extend({
  templateId: z.string().optional(),
}).refine((data) => {
  // If client approval is required, task must be visible to client and have a client assigned
  if (data.requiresClientApproval) {
    if (!data.visibleToClient) {
      return false;
    }
    if (!data.clientId || data.clientId === "" || data.clientId === "none") {
      return false;
    }
  }
  return true;
}, {
  message: "Tasks requiring client approval must be visible to the client and have a client assigned",
  path: ["requiresClientApproval"],
});

type TaskFormData = z.infer<typeof taskFormSchema>;

// Additional form data for template selection and overrides
type TemplateFormData = {
  templateId?: string;
  assigneeStrategy?: 'keep' | 'clear' | 'assignToMe';
  dateStrategy?: 'clear' | 'keep';
};

interface TaskFormProps {
  task?: Task | null;
  onSuccess?: () => void;
  defaultLeadId?: string;
}

export default function TaskForm({ task, onSuccess, defaultLeadId }: TaskFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const { data: clientsData } = useQuery<{ clients: Client[] }>({
    queryKey: ["/api/clients"],
  });
  
  const clients = clientsData?.clients || [];

  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  // Projects removed from system

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Get current logged-in user to default assignee
  const { data: currentUser } = useQuery<{ id: string }>({
    queryKey: ["/api/auth/current-user"],
  });

  const { data: taskPriorities = [] } = useQuery<TaskPriority[]>({
    queryKey: ["/api/task-priorities"],
  });

  const { data: taskCategories = [] } = useQuery<TaskCategory[]>({
    queryKey: ["/api/task-categories"],
  });

  const { data: taskStatuses = [] } = useQuery<any[]>({
    queryKey: ["/api/task-statuses"],
  });

  const { data: teamWorkflows = [] } = useQuery<TeamWorkflowWithStatuses[]>({
    queryKey: ["/api/team-workflows"],
  });

  // Fetch task templates
  const { data: taskTemplates = [] } = useQuery<TaskTemplate[]>({
    queryKey: ["/api/task-templates"],
  });

  // Get default values from settings
  const defaultPriority = taskPriorities.find((p: TaskPriority) => p.isDefault)?.value || taskPriorities[0]?.value || "normal";
  const defaultCategory = taskCategories.find((c: TaskCategory) => c.isDefault)?.id || "";
  const defaultStatus = taskStatuses.find((s: any) => s.isDefault)?.value || "todo";

  const [isRecurringEnabled, setIsRecurringEnabled] = useState(task?.isRecurring || false);
  const [assigneeStrategy, setAssigneeStrategy] = useState<'keep' | 'clear' | 'assignToMe'>('clear');
  const [dateStrategy, setDateStrategy] = useState<'clear' | 'keep'>('clear');

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      categoryId: task?.categoryId || defaultCategory,
      workflowId: task?.workflowId || "",
      status: task?.status || defaultStatus,
      priority: task?.priority || defaultPriority,
      assignedTo: task?.assignedTo || (task ? null : currentUser?.id) || null,
      startDate: task?.startDate ? new Date(task.startDate) : null,
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      clientId: task?.clientId || "",
      leadId: task?.leadId || defaultLeadId || "",
      // projectId removed
      // Client portal visibility
      visibleToClient: task?.visibleToClient || false,
      requiresClientApproval: task?.requiresClientApproval || false,
      // Recurring task defaults
      isRecurring: task?.isRecurring || false,
      recurringInterval: task?.recurringInterval || 1,
      recurringUnit: (task?.recurringUnit as "hours" | "days" | "weeks" | "months" | "years") || "days",
      recurringEndType: (task?.recurringEndType as "never" | "on_date" | "after_occurrences") || "never",
      recurringEndDate: task?.recurringEndDate ? new Date(task.recurringEndDate) : null,
      recurringEndOccurrences: task?.recurringEndOccurrences || 10,
      createIfOverdue: task?.createIfOverdue || false,
      // Tags
      tags: task?.tags || [],
      // Template-related fields (only for create mode)
      templateId: "",
    },
  });

  // Watch template selection to show/hide override options (AFTER form is defined)
  const watchedTemplateId = form.watch('templateId');

  // Reset form when task or teamWorkflows data changes (important for edit mode)
  useEffect(() => {
    if (task && teamWorkflows.length > 0) {
      form.reset({
        title: task.title || "",
        description: task.description || "",
        categoryId: task.categoryId || defaultCategory,
        workflowId: task.workflowId || "",
        status: task.status || defaultStatus,
        priority: task.priority || defaultPriority,
        assignedTo: task.assignedTo || null,
        startDate: task.startDate ? new Date(task.startDate) : null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        clientId: task.clientId || "",
        leadId: task.leadId || "",
        // projectId removed
        // Client portal visibility
        visibleToClient: task.visibleToClient || false,
        requiresClientApproval: task.requiresClientApproval || false,
        isRecurring: task.isRecurring || false,
        recurringInterval: task.recurringInterval || 1,
        recurringUnit: (task.recurringUnit as "hours" | "days" | "weeks" | "months" | "years") || "days",
        recurringEndType: (task.recurringEndType as "never" | "on_date" | "after_occurrences") || "never",
        recurringEndDate: task.recurringEndDate ? new Date(task.recurringEndDate) : null,
        recurringEndOccurrences: task.recurringEndOccurrences || 10,
        createIfOverdue: task.createIfOverdue || false,
        tags: task.tags || [],
      });
    }
  }, [task, teamWorkflows, defaultPriority, defaultCategory, form]);

  // Set default assignee to current user when creating new task
  useEffect(() => {
    if (!task && currentUser?.id && !form.getValues('assignedTo')) {
      form.setValue('assignedTo', currentUser.id);
    }
  }, [task, currentUser, form]);

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        variant: "default",
        description: "The task has been successfully created.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Task creation error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      await apiRequest("PUT", `/api/tasks/${task!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task updated",
        variant: "default",
        description: "The task has been successfully updated.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Task update error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Template instantiation mutation
  const instantiateTemplateMutation = useMutation({
    mutationFn: async (data: {
      templateId: string;
      title?: string;
      clientId?: string;
      leadId?: string;
      workflowId?: string;
      visibleToClient?: boolean;
      requiresClientApproval?: boolean;
      assigneeStrategy: string;
      dateStrategy: string;
      isRecurring?: boolean;
      recurringInterval?: number | null;
      recurringUnit?: string | null;
      recurringEndType?: string | null;
      recurringEndDate?: Date | null;
      recurringEndOccurrences?: number | null;
      createIfOverdue?: boolean;
    }) => {
      const response = await apiRequest("POST", `/api/task-templates/${data.templateId}/instantiate`, {
        title: data.title,
        clientId: data.clientId && data.clientId !== "none" ? data.clientId : null,
        leadId: data.leadId && data.leadId !== "none" ? data.leadId : null,
        workflowId: data.workflowId && data.workflowId !== "none" ? data.workflowId : null,
        visibleToClient: data.visibleToClient || false,
        requiresClientApproval: data.requiresClientApproval || false,
        assigneeStrategy: data.assigneeStrategy,
        dateStrategy: data.dateStrategy,
        isRecurring: data.isRecurring || false,
        recurringInterval: data.isRecurring ? (data.recurringInterval || 1) : null,
        recurringUnit: data.isRecurring ? (data.recurringUnit || "days") : null,
        recurringEndType: data.isRecurring ? (data.recurringEndType || "never") : null,
        recurringEndDate: data.isRecurring && data.recurringEndDate ? data.recurringEndDate : null,
        recurringEndOccurrences: data.isRecurring ? (data.recurringEndOccurrences || null) : null,
        createIfOverdue: data.isRecurring ? !!data.createIfOverdue : false,
      });
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      // Provide better feedback about created tasks
      const taskCount = response?.tasks?.length || response?.createdTasks?.length || 1;
      toast({
        title: "Tasks created from template",
        variant: "default",
        description: `Successfully created ${taskCount} task${taskCount > 1 ? 's' : ''} from the template.`,
      });
      
      // Clear the form after successful template instantiation
      form.reset({
        title: "",
        description: "",
        categoryId: form.getValues("categoryId") || "",
        workflowId: "",
        status: form.getValues("status") || "todo",
        priority: form.getValues("priority") || "normal",
        assignedTo: null,
        startDate: null,
        dueDate: null,
        clientId: "",
        leadId: "",
        visibleToClient: false,
        requiresClientApproval: false,
        isRecurring: false,
        recurringInterval: 1,
        recurringUnit: "days",
        recurringEndType: "never",
        recurringEndDate: null,
        recurringEndOccurrences: 10,
        createIfOverdue: false,
        templateId: "",
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Template instantiation error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create tasks from template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const selectedClientId = form.watch("clientId");
  // Projects removed - no longer filter by client
  
  const selectedWorkflowId = form.watch("workflowId");
  const selectedWorkflow = teamWorkflows.find(w => w.id === selectedWorkflowId);
  const workflowStatuses = selectedWorkflow?.statuses || [];


  const onSubmit = (data: any) => {
    // If editing an existing task, don't allow template selection - exclude templateId
    if (task) {
      const { templateId, ...taskData } = data;
      const cleanData = {
        ...taskData,
        clientId: taskData.clientId && taskData.clientId !== "none" && taskData.clientId !== "" ? taskData.clientId : null,
        leadId: taskData.leadId && taskData.leadId !== "none" && taskData.leadId !== "" ? taskData.leadId : null,
        assignedTo: taskData.assignedTo && taskData.assignedTo !== "unassigned" && taskData.assignedTo !== "" ? taskData.assignedTo : null,
        categoryId: taskData.categoryId && taskData.categoryId !== "" ? taskData.categoryId : null,
        workflowId: taskData.workflowId && taskData.workflowId !== "" ? taskData.workflowId : null,
        startDate: taskData.startDate ? new Date(taskData.startDate) : null,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        isRecurring: !!taskData.isRecurring,
        recurringInterval: taskData.isRecurring ? (taskData.recurringInterval || 1) : null,
        recurringUnit: taskData.isRecurring ? (taskData.recurringUnit || "days") : null,
        recurringEndType: taskData.isRecurring ? (taskData.recurringEndType || "never") : null,
        recurringEndDate: taskData.isRecurring && taskData.recurringEndDate ? new Date(taskData.recurringEndDate) : null,
        recurringEndOccurrences: taskData.isRecurring ? (taskData.recurringEndOccurrences || null) : null,
        createIfOverdue: taskData.isRecurring ? !!taskData.createIfOverdue : false,
      };
      updateTaskMutation.mutate(cleanData);
      return;
    }

    // For new tasks, check if template is selected
    if (data.templateId && data.templateId !== "" && data.templateId !== "none") {
      // Use template instantiation
      instantiateTemplateMutation.mutate({
        templateId: data.templateId,
        title: data.title || undefined,
        clientId: data.clientId || undefined,
        leadId: data.leadId || undefined,
        workflowId: data.workflowId || undefined,
        visibleToClient: data.visibleToClient || false,
        requiresClientApproval: data.requiresClientApproval || false,
        assigneeStrategy,
        dateStrategy,
        isRecurring: !!data.isRecurring,
        recurringInterval: data.isRecurring ? (data.recurringInterval || 1) : null,
        recurringUnit: data.isRecurring ? (data.recurringUnit || "days") : null,
        recurringEndType: data.isRecurring ? (data.recurringEndType || "never") : null,
        recurringEndDate: data.isRecurring && data.recurringEndDate ? new Date(data.recurringEndDate) : null,
        recurringEndOccurrences: data.isRecurring ? (data.recurringEndOccurrences || null) : null,
        createIfOverdue: data.isRecurring ? !!data.createIfOverdue : false,
      });
    } else {
      // Regular task creation - exclude templateId from data sent to API
      const { templateId, ...taskData } = data;
      const cleanData = {
        ...taskData,
        clientId: taskData.clientId && taskData.clientId !== "none" && taskData.clientId !== "" ? taskData.clientId : null,
        leadId: taskData.leadId && taskData.leadId !== "none" && taskData.leadId !== "" ? taskData.leadId : null,
        assignedTo: taskData.assignedTo && taskData.assignedTo !== "unassigned" && taskData.assignedTo !== "" ? taskData.assignedTo : null,
        categoryId: taskData.categoryId && taskData.categoryId !== "" ? taskData.categoryId : null,
        workflowId: taskData.workflowId && taskData.workflowId !== "" ? taskData.workflowId : null,
        startDate: taskData.startDate ? new Date(taskData.startDate) : null,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        isRecurring: !!taskData.isRecurring,
        recurringInterval: taskData.isRecurring ? (taskData.recurringInterval || 1) : null,
        recurringUnit: taskData.isRecurring ? (taskData.recurringUnit || "days") : null,
        recurringEndType: taskData.isRecurring ? (taskData.recurringEndType || "never") : null,
        recurringEndDate: taskData.isRecurring && taskData.recurringEndDate ? new Date(taskData.recurringEndDate) : null,
        recurringEndOccurrences: taskData.isRecurring ? (taskData.recurringEndOccurrences || null) : null,
        createIfOverdue: taskData.isRecurring ? !!taskData.createIfOverdue : false,
      };
      createTaskMutation.mutate(cleanData);
    }
  };

  const isLoading = createTaskMutation.isPending || updateTaskMutation.isPending || instantiateTemplateMutation.isPending;
  
  // Handle template selection changes
  const handleTemplateChange = (templateId: string) => {
    form.setValue('templateId', templateId);
    
    // If a template is selected, populate form with template data for preview
    if (templateId && templateId !== "none" && templateId !== "") {
      const selectedTemplate = taskTemplates.find(t => t.id === templateId);
      if (selectedTemplate) {
        // Optionally pre-fill some fields from template for preview
        if (selectedTemplate.priority) {
          form.setValue('priority', selectedTemplate.priority);
        }
        if (selectedTemplate.categoryId) {
          form.setValue('categoryId', selectedTemplate.categoryId);
        }
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pr-4">
        {/* 1. Task Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Task title" data-testid="input-task-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Template Selection - Only show for new tasks */}
        {!task && (
          <div className="space-y-4 border-l-4 border-blue-200 pl-4 bg-blue-50 dark:bg-blue-950 p-4 rounded">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <h3 className="font-medium text-blue-800 dark:text-blue-200">Create from Template</h3>
            </div>
            
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Template</FormLabel>
                  <Select onValueChange={handleTemplateChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="template-select">
                        <SelectValue placeholder="Create from scratch or select a template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Create from scratch</SelectItem>
                      {taskTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{template.name}</span>
                            {template.description && (
                              <span className="text-xs text-muted-foreground">{template.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template Override Options */}
            {watchedTemplateId && watchedTemplateId !== "none" && watchedTemplateId !== "" && (
              <div className="space-y-4 mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Template Override Options</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Assignee Strategy */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-blue-600" />
                      <label className="text-sm font-medium">Assignee Strategy</label>
                    </div>
                    <Select value={assigneeStrategy} onValueChange={(value: 'keep' | 'clear' | 'assignToMe') => setAssigneeStrategy(value)}>
                      <SelectTrigger data-testid="assignee-strategy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clear">Clear assignees</SelectItem>
                        <SelectItem value="keep">Keep template assignees</SelectItem>
                        <SelectItem value="assignToMe">Assign to me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Strategy */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3 w-3 text-blue-600" />
                      <label className="text-sm font-medium">Date Strategy</label>
                    </div>
                    <Select value={dateStrategy} onValueChange={(value: 'clear' | 'keep') => setDateStrategy(value)}>
                      <SelectTrigger data-testid="date-strategy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clear">Clear dates</SelectItem>
                        <SelectItem value="keep">Keep template dates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} placeholder="Task description" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 3. Category */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 4. Workflow */}
          <FormField
            control={form.control}
            name="workflowId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workflow</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Workflow</SelectItem>
                    {teamWorkflows.map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 5. Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedWorkflowId && selectedWorkflowId !== "none" ? (
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 6. Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 7. Assigned To */}
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 8. Client/Lead Combined */}
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => {
              // Determine current value - check both clientId and leadId
              const clientId = form.watch("clientId");
              const leadId = form.watch("leadId");
              const currentValue = clientId ? `client:${clientId}` : leadId ? `lead:${leadId}` : "";
              
              return (
                <FormItem>
                  <FormLabel>Client/Lead (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      if (value === "none" || !value) {
                        form.setValue("clientId", "");
                        form.setValue("leadId", "");
                      } else if (value.startsWith("client:")) {
                        form.setValue("clientId", value.replace("client:", ""));
                        form.setValue("leadId", "");
                      } else if (value.startsWith("lead:")) {
                        form.setValue("leadId", value.replace("lead:", ""));
                        form.setValue("clientId", "");
                      }
                    }} 
                    value={currentValue}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-client-lead">
                        <SelectValue placeholder="Select client or lead" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      
                      {/* Clients Section */}
                      {clients.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Clients
                          </div>
                          {clients.map((client: Client) => (
                            <SelectItem key={`client-${client.id}`} value={`client:${client.id}`}>
                              {client.company || client.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {/* Leads Section */}
                      {leads.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                            Leads
                          </div>
                          {leads.map((lead: any) => (
                            <SelectItem key={`lead-${lead.id}`} value={`lead:${lead.id}`}>
                              {lead.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* 9. Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-start-date"
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        field.onChange(date || null);
                        setStartDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 10. Due Date */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-due-date"
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        field.onChange(date || null);
                        setDueDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 11. Tags */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <TagIcon className="h-4 w-4" />
                  Tags
                </FormLabel>
                <FormControl>
                  <TagSelector
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Add tags..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 12. Project */}
          {/* Project field removed - projects no longer exist */}
        </div>


        {/* Client Portal Visibility */}
        <div className="space-y-4 border-l-4 border-primary/20 pl-4 bg-primary/5 p-4 rounded">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-primary">Client Portal Visibility</h3>
          </div>
          
          <FormField
            control={form.control}
            name="visibleToClient"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Switch 
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    data-testid="switch-visible-to-client"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    Make this task visible to client in their portal
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    When enabled, clients can see this task's progress and details in their client portal dashboard.
                  </p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requiresClientApproval"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Switch 
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    data-testid="switch-requires-client-approval"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    Require client approval before completion
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    When enabled, clients must approve or request changes to task attachments before the task can be marked complete.
                  </p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Recurring Task Settings */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Recurring Task Settings</h3>
          </div>
          
          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      setIsRecurringEnabled(!!checked);
                    }}
                    data-testid="checkbox-recurring"
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  Make this task recurring
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          {isRecurringEnabled && (
            <div className="space-y-4 pl-6 border-l-2 border-primary/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recurringInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repeat Every</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1" 
                          placeholder="1"
                          value={field.value || 1}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-recurring-interval"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurringUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || "days"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-recurring-unit">
                            <SelectValue placeholder="Select time unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="recurringEndType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "never"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-recurring-end-type">
                          <SelectValue placeholder="Select when to end" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="never">Never end</SelectItem>
                        <SelectItem value="on_date">End on specific date</SelectItem>
                        <SelectItem value="after_occurrences">End after number of occurrences</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("recurringEndType") === "on_date" && (
                <FormField
                  control={form.control}
                  name="recurringEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          data-testid="input-recurring-end-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("recurringEndType") === "after_occurrences" && (
                <FormField
                  control={form.control}
                  name="recurringEndOccurrences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Occurrences</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1" 
                          placeholder="10"
                          value={field.value || 10}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                          data-testid="input-recurring-occurrences"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="createIfOverdue"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-create-if-overdue"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Create new instance even if previous is overdue
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading} data-testid="button-submit">
            {isLoading ? (watchedTemplateId && watchedTemplateId !== "none" && watchedTemplateId !== "" ? "Creating from template..." : "Saving...") : task ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    </Form>
  );
}