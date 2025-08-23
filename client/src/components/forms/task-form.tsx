import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Flag, Repeat } from "lucide-react";
import { insertTaskSchema, type Task, type InsertTask, type Client, type Project, type Staff, type TaskPriority, type TaskCategory } from "@shared/schema";

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
import { useState } from "react";

interface TaskFormProps {
  task?: Task | null;
  onSuccess?: () => void;
}

export default function TaskForm({ task, onSuccess }: TaskFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clientsData } = useQuery<{ clients: Client[] }>({
    queryKey: ["/api/clients"],
  });
  
  const clients = clientsData?.clients || [];

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: taskPriorities = [] } = useQuery<TaskPriority[]>({
    queryKey: ["/api/task-priorities"],
  });

  const { data: taskCategories = [] } = useQuery<TaskCategory[]>({
    queryKey: ["/api/task-categories"],
  });

  const { data: teamWorkflows = [] } = useQuery<TeamWorkflowWithStatuses[]>({
    queryKey: ["/api/team-workflows"],
  });

  // Get default values from settings
  const defaultPriority = taskPriorities.find((p: TaskPriority) => p.isDefault)?.value || taskPriorities[0]?.value || "normal";
  const defaultCategory = taskCategories.find((c: TaskCategory) => c.isDefault)?.id || "";

  const [isRecurringEnabled, setIsRecurringEnabled] = useState(task?.isRecurring || false);

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      categoryId: task?.categoryId || defaultCategory,
      workflowId: task?.workflowId || "",
      status: task?.status || "pending",
      priority: task?.priority || defaultPriority,
      assignedTo: task?.assignedTo || null,
      startDate: task?.startDate ? new Date(task.startDate) : null,
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      clientId: task?.clientId || "",
      projectId: task?.projectId || "",
      // Recurring task defaults
      isRecurring: task?.isRecurring || false,
      recurringInterval: task?.recurringInterval || 1,
      recurringUnit: (task?.recurringUnit as "hours" | "days" | "weeks" | "months" | "years") || "days",
      recurringEndType: (task?.recurringEndType as "never" | "on_date" | "after_occurrences") || "never",
      recurringEndDate: task?.recurringEndDate ? new Date(task.recurringEndDate) : null,
      recurringEndOccurrences: task?.recurringEndOccurrences || 10,
      createIfOverdue: task?.createIfOverdue || false,
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
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
        description: "The task has been successfully updated.",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const selectedClientId = form.watch("clientId");
  const clientProjects = projects.filter(p => p.clientId === selectedClientId);
  
  const selectedWorkflowId = form.watch("workflowId");
  const selectedWorkflow = teamWorkflows.find(w => w.id === selectedWorkflowId);
  const workflowStatuses = selectedWorkflow?.statuses || [];

  const onSubmit = (data: any) => {
    // Clean up empty string IDs and "none" values
    const cleanData = {
      ...data,
      clientId: data.clientId && data.clientId !== "none" && data.clientId !== "" ? data.clientId : null,
      projectId: data.projectId && data.projectId !== "none" && data.projectId !== "" ? data.projectId : null,
      assignedTo: data.assignedTo && data.assignedTo !== "unassigned" && data.assignedTo !== "" ? data.assignedTo : null,
      categoryId: data.categoryId && data.categoryId !== "" ? data.categoryId : null,
      workflowId: data.workflowId && data.workflowId !== "" ? data.workflowId : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    };

    if (task) {
      updateTaskMutation.mutate(cleanData);
    } else {
      createTaskMutation.mutate(cleanData);
    }
  };

  const isLoading = createTaskMutation.isPending || updateTaskMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto">
        {/* 1. Task Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Task title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
                              {workflowStatus.isRequired && (
                                <span className="text-xs text-blue-600">*</span>
                              )}
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
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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

          {/* 8. Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="date"
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 9. Due Date */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="date"
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 10. Client */}
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Client</SelectItem>
                    {clients.map((client: Client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 11. Project */}
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {clientProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Recurring Task Settings */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-blue-500" />
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
            <div className="space-y-4 pl-6 border-l-2 border-blue-100">
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
            {isLoading ? "Saving..." : task ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    </Form>
  );
}