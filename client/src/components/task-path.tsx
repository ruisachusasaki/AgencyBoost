import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "./ui/badge";

interface Task {
  id: string;
  title: string;
  level?: number;
  status: string;
}

interface TaskPathProps {
  taskId: string;
  className?: string;
}

export function TaskPath({ taskId, className = "" }: TaskPathProps) {
  const { data: taskPath = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks/${taskId}/path`],
    enabled: !!taskId
  });

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
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-32 rounded"></div>
      </div>
    );
  }

  if (taskPath.length <= 1) {
    return null; // Don't show path for root tasks
  }

  return (
    <div className={`flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 ${className}`} data-testid="task-path">
      <Home className="h-4 w-4" />
      
      {taskPath.map((task, index) => (
        <div key={task.id} className="flex items-center space-x-2">
          {index === 0 ? (
            <Link href="/tasks">
              <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" data-testid="tasks-home-link">
                All Tasks
              </span>
            </Link>
          ) : (
            <>
              <ChevronRight className="h-3 w-3" />
              <div className="flex items-center space-x-2">
                {index === taskPath.length - 1 ? (
                  // Current task - not a link
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100" data-testid={`current-task-${task.id}`}>
                      {task.title}
                    </span>
                    <Badge className={getStatusColor(task.status)} data-testid={`current-task-status-${task.id}`}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Level {task.level! + 1}
                    </span>
                  </div>
                ) : (
                  // Parent tasks - clickable links
                  <Link href={`/tasks/${task.id}`}>
                    <div className="flex items-center space-x-2">
                      <span 
                        className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" 
                        data-testid={`parent-task-${task.id}`}
                      >
                        {task.title}
                      </span>
                      <Badge className={getStatusColor(task.status)} data-testid={`parent-task-status-${task.id}`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        Level {task.level! + 1}
                      </span>
                    </div>
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}