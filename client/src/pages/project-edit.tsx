import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Circle, Plus, Calendar, User, Flag, ChevronUp, ChevronDown } from "lucide-react";
import ProjectForm from "@/components/forms/project-form";
import { calculateProjectProgress, getProjectTasks } from "@/lib/project-utils";
import type { Project, Task, Staff } from "@shared/schema";

type SortField = 'title' | 'status' | 'assignedTo' | 'priority' | 'dueDate';
type SortDirection = 'asc' | 'desc';

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const project = projects.find(p => p.id === id);
  const projectTasks = project ? getProjectTasks(tasks, project.id) : [];

  // Helper function to get staff name - defined before sorting logic
  const getStaffName = (staffId: string | null) => {
    if (!staffId) return "Unassigned";
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Unknown";
  };

  // Sort tasks based on current sort field and direction
  const sortedTasks = useMemo(() => {
    const tasksToSort = [...projectTasks];
    
    return tasksToSort.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          // Define status priority: pending < in_progress < completed < cancelled
          const statusOrder = { pending: 1, in_progress: 2, completed: 3, cancelled: 4 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
          break;
        case 'assignedTo':
          aValue = getStaffName(a.assignedTo).toLowerCase();
          bValue = getStaffName(b.assignedTo).toLowerCase();
          break;
        case 'priority':
          // Define priority order: urgent > high > normal > low
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          // Handle null dates - put them at the end
          if (!a.dueDate && b.dueDate) return 1;
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && !b.dueDate) return 0;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [projectTasks, sortField, sortDirection, staff]);

  const handleSuccess = () => {
    navigate("/projects");
  };

  const handleBackClick = () => {
    navigate("/projects");
  };

  const handleAddTask = () => {
    navigate(`/tasks?projectId=${project?.id}`);
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600";
      case "high":
        return "text-yellow-600";
      case "normal":
        return "text-blue-600";
      case "low":
        return "text-gray-600";
      default:
        return "text-gray-400";
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-slate-50"
      onClick={() => handleSort(field)}
      data-testid={`header-${field}`}
    >
      <div className="flex items-center gap-1">
        {children}
        <div className="flex flex-col">
          <ChevronUp 
            className={`h-3 w-3 ${sortField === field && sortDirection === 'asc' ? 'text-slate-900' : 'text-slate-300'}`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${sortField === field && sortDirection === 'desc' ? 'text-slate-900' : 'text-slate-300'}`} 
          />
        </div>
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Edit Project</h1>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-20 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Edit Project</h1>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">
                {error ? "Error loading project" : "Project not found"}
              </p>
              <Button onClick={handleBackClick}>
                Back to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBackClick} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Edit Project</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectForm
                project={project}
                onSuccess={handleSuccess}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Tasks ({projectTasks.length})</CardTitle>
                <Button onClick={handleAddTask} size="sm" data-testid="button-add-task">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {projectTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Circle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks yet</h3>
                  <p className="text-slate-500 mb-4">
                    Create tasks to break down this project into manageable work items.
                  </p>
                  <Button onClick={handleAddTask} data-testid="button-create-first-task">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Task
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="title">Task</SortableHeader>
                      <SortableHeader field="status">Status</SortableHeader>
                      <SortableHeader field="assignedTo">Assigned To</SortableHeader>
                      <SortableHeader field="priority">Priority</SortableHeader>
                      <SortableHeader field="dueDate">Due Date</SortableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTasks.map((task) => (
                      <TableRow 
                        key={task.id} 
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleTaskClick(task.id)}
                        data-testid={`row-task-${task.id}`}
                      >
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium text-slate-900">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-slate-500 truncate max-w-xs">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">{getStaffName(task.assignedTo)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Flag className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
                            <span className="text-sm capitalize">{task.priority}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">{formatDate(task.dueDate)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const progress = calculateProjectProgress(projectTasks);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Completion</span>
                      <span className="text-lg font-semibold text-slate-900">
                        {progress.progressPercentage}%
                      </span>
                    </div>
                    <Progress value={progress.progressPercentage} className="h-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tasks completed</span>
                      <span className="font-medium">
                        {progress.completedTasks} of {progress.totalTasks}
                      </span>
                    </div>
                    {progress.totalTasks === 0 && (
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <Circle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">
                          No tasks created yet. Add tasks to track progress automatically.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}