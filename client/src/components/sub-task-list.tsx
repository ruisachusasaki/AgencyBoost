import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, Plus, Calendar, User, Clock, Flag, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { apiRequest } from "../lib/queryClient";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  assignedTo?: string | null;
  dueDate?: Date | null;
  level?: number;
  hasSubTasks?: boolean;
  createdAt?: Date;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
}

interface SubTaskListProps {
  parentTaskId: string;
  level?: number;
  maxLevel?: number;
}

interface SubTaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
}

export function SubTaskList({ parentTaskId, level = 0, maxLevel = 5 }: SubTaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch parent task to inherit client and project information
  const { data: parentTask } = useQuery<Task & { clientId?: string; projectId?: string }>({
    queryKey: [`/api/tasks/${parentTaskId}`],
    enabled: !!parentTaskId
  });

  // Fetch sub-tasks for the parent task
  const { data: subTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks/${parentTaskId}/subtasks`],
    enabled: !!parentTaskId
  });

  // Fetch staff for assignee dropdown
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"]
  });

  // Create sub-task mutation
  const createSubTaskMutation = useMutation({
    mutationFn: (data: SubTaskFormData) => {
      console.log("Creating sub-task with data:", data);
      const requestData = {
        ...data,
        parentTaskId,
        level: (level || 0) + 1,
        // Inherit client and project from parent task
        clientId: parentTask?.clientId || null,
        projectId: parentTask?.projectId || null,
      };
      console.log("Sending API request with:", requestData);
      return apiRequest(`/api/tasks`, "POST", requestData);
    },
    onSuccess: (data) => {
      console.log("Sub-task created successfully:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${parentTaskId}/subtasks`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${parentTaskId}`] });
      setShowAddForm(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Failed to create sub-task:", error);
      // You can add toast notification here later
    }
  });

  const form = useForm<SubTaskFormData>({
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "normal",
      assignedTo: "",
    }
  });

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

  const onSubmit = (data: SubTaskFormData) => {
    createSubTaskMutation.mutate(data);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-yellow-600 dark:text-yellow-400';
      case 'normal': return 'text-blue-600 dark:text-blue-400';
      case 'low': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="ml-6 space-y-2">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-12 rounded"></div>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-12 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`ml-${level * 4} space-y-2`}>
      {subTasks.map((task: Task) => (
        <Card key={task.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <Link href={`/tasks/${task.id}`} className="block">
            <CardContent className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  {task.hasSubTasks && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleTaskExpansion(task.id);
                      }}
                      className="p-1"
                      data-testid={`toggle-subtasks-${task.id}`}
                    >
                      {expandedTasks.has(task.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  <div className="flex-1">
                    <div className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2" 
                         data-testid={`subtask-title-${task.id}`}>
                      {task.title}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <Badge className={getStatusColor(task.status)} data-testid={`subtask-status-${task.id}`}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    
                    <div className="flex items-center space-x-1">
                      <Flag className={`h-3 w-3 ${getPriorityColor(task.priority)}`} />
                      <span className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </span>
                    </div>
                    
                    {task.assignedTo && (
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                        <User className="h-3 w-3" />
                        <span>
                          {staff.find(s => s.id === task.assignedTo)?.firstName || 'Assigned'}
                        </span>
                      </div>
                    )}
                    
                    {task.dueDate && (
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(task.dueDate), 'MMM dd')}</span>
                      </div>
                    )}
                    
                    <div className="text-gray-500 dark:text-gray-500 text-xs">
                      Level {task.level! + 1}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Nested sub-tasks */}
            {task.hasSubTasks && expandedTasks.has(task.id) && task.level! < maxLevel - 1 && (
              <div className="mt-4">
                <SubTaskList 
                  parentTaskId={task.id} 
                  level={level + 1}
                  maxLevel={maxLevel}
                />
              </div>
            )}
          </CardContent>
          </Link>
        </Card>
      ))}

      {/* Add Sub-task Button */}
      {level < maxLevel - 1 && (
        <div className="mt-4">
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                data-testid={`add-subtask-${parentTaskId}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sub-task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Sub-task</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter sub-task title..." 
                            {...field} 
                            data-testid="subtask-title-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter sub-task description..."
                            {...field}
                            value={field.value || ""}
                            data-testid="subtask-description-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="subtask-priority-select">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assignee</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="subtask-assignee-select">
                                <SelectValue placeholder="Select assignee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                      data-testid="cancel-subtask-button"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createSubTaskMutation.isPending}
                      data-testid="create-subtask-button"
                    >
                      {createSubTaskMutation.isPending ? "Creating..." : "Create Sub-task"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}