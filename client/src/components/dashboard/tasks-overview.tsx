import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Task } from "@shared/schema";

export default function TasksOverview() {
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PUT", `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const todayCompleted = tasks.filter(t => 
    t.status === "completed" && 
    t.completedAt && 
    new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;

  const recentTasks = tasks
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 3);

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

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    updateTaskMutation.mutate({
      id: taskId,
      status: completed ? "completed" : "pending"
    });
  };

  const formatDueDate = (dueDate: Date | null) => {
    if (!dueDate) return "No due date";
    
    const date = new Date(dueDate);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) return "Due: Today";
    if (isTomorrow) return "Due: Tomorrow";
    
    return `Due: ${date.toLocaleDateString()}`;
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Tasks Overview</h3>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="h-8 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="h-4 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="text-center">
              <div className="h-8 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="h-4 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Tasks Overview</h3>
          <Link href="/tasks">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{pendingTasks}</p>
            <p className="text-sm text-slate-600">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{todayCompleted}</p>
            <p className="text-sm text-slate-600">Completed Today</p>
          </div>
        </div>
        
        {recentTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No tasks found</p>
            <Link href="/tasks">
              <Button className="mt-4">Create Your First Task</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <Checkbox 
                  checked={task.status === "completed"}
                  onCheckedChange={(checked) => handleTaskToggle(task.id, !!checked)}
                  className="border-slate-300"
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    task.status === "completed" 
                      ? "text-slate-500 line-through" 
                      : "text-slate-900"
                  }`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {task.status === "completed" && task.completedAt
                      ? `Completed: ${new Date(task.completedAt).toLocaleDateString()}`
                      : formatDueDate(task.dueDate)
                    }
                  </p>
                </div>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
