import React, { useState } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
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
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const getStaffName = (staffId: string | null | undefined) => {
    if (!staffId) return 'Unassigned';
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown';
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
    <>
      {subTasks.map((task: Task) => (
        <React.Fragment key={task.id}>
          <TableRow className="hover:bg-slate-50">
            <TableCell className="py-3">
              <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
                {task.hasSubTasks && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTaskExpansion(task.id)}
                    className="h-6 w-6 p-0 shrink-0"
                    data-testid={`toggle-subtasks-${task.id}`}
                  >
                    {expandedTasks.has(task.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {!task.hasSubTasks && (
                  <div className="w-6 h-6 shrink-0"></div>
                )}
                <div>
                  <Link href={`/tasks/${task.id}`}>
                    <span className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1" 
                          data-testid={`subtask-title-${task.id}`}>
                      {task.title}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </span>
                  </Link>
                </div>
              </div>
            </TableCell>
            <TableCell className="py-3">
              <span className="text-sm text-gray-700">
                {getStaffName(task.assignedTo)}
              </span>
            </TableCell>
            <TableCell className="py-3">
              <span className={`text-sm ${
                task.dueDate && new Date(task.dueDate) < new Date() 
                  ? 'text-red-600 font-medium' 
                  : 'text-gray-700'
              }`}>
                {formatDate(task.dueDate)}
              </span>
            </TableCell>
            <TableCell className="py-3">
              <div className="flex items-center gap-1">
                <Flag className={`h-3 w-3 ${getPriorityColor(task.priority)}`} />
                <span className={`text-sm capitalize ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </TableCell>
          </TableRow>
          
          {/* Nested sub-tasks */}
          {task.hasSubTasks && expandedTasks.has(task.id) && task.level! < maxLevel - 1 && (
            <SubTaskList 
              parentTaskId={task.id} 
              level={level + 1}
              maxLevel={maxLevel}
            />
          )}
        </React.Fragment>
      ))}
      
      {/* Add Sub-task Button and Form */}
      {level < maxLevel - 1 && (
        <>
          {!showAddForm ? (
            <TableRow>
              <TableCell colSpan={4} className="py-3">
                <div style={{ paddingLeft: `${level * 24}px` }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                    className="h-8 px-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    data-testid="add-subtask-button"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Sub-task
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-3">
                <div style={{ paddingLeft: `${level * 24}px` }}>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Task Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter task title..." {...field} />
                              </FormControl>
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
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select assignee" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">Unassigned</SelectItem>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                </FormControl>
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter task description..." 
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-center gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={createSubTaskMutation.isPending}
                          data-testid="create-subtask-submit"
                        >
                          {createSubTaskMutation.isPending ? "Creating..." : "Create Sub-task"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddForm(false);
                            form.reset();
                          }}
                          data-testid="create-subtask-cancel"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </TableCell>
            </TableRow>
          )}
        </>
      )}
    </>
  );
}