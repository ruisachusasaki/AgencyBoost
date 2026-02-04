import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, Plus, User, Clock, Flag, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Link } from "wouter";
import { format } from "date-fns";
import { TaskIntakeDialog } from "./task-intake-dialog";

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

interface SubTaskListProps {
  parentTaskId: string;
  level?: number;
  maxLevel?: number;
}

export function SubTaskList({ parentTaskId, level = 0, maxLevel = 5 }: SubTaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch sub-tasks for the parent task
  const { data: subTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks/${parentTaskId}/subtasks`],
    enabled: !!parentTaskId
  });

  // Fetch staff for displaying assignee names
  const { data: staff = [] } = useQuery<{ id: string; firstName: string; lastName: string }[]>({
    queryKey: ["/api/staff"]
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
                {level < maxLevel - 1 && (
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
                {level >= maxLevel - 1 && (
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
          {expandedTasks.has(task.id) && level < maxLevel - 1 && (
            <SubTaskList 
              parentTaskId={task.id} 
              level={level + 1}
              maxLevel={maxLevel}
            />
          )}
        </React.Fragment>
      ))}
      
      {/* Add Sub-task Button - Only show when there are no sub-tasks OR at top level */}
      {level < maxLevel - 1 && (subTasks.length === 0 || level === 0) && (
        <TableRow>
          <TableCell colSpan={4} className="py-3">
            <div style={{ paddingLeft: `${level * 24}px` }}>
              <TaskIntakeDialog
                parentTaskId={parentTaskId}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-primary hover:text-primary/80 hover:bg-primary/10"
                    data-testid="add-subtask-button"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Sub-task
                  </Button>
                }
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/tasks/${parentTaskId}/subtasks`] });
                  queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
                  queryClient.invalidateQueries({ queryKey: [`/api/tasks/${parentTaskId}`] });
                }}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}