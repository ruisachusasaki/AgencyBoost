import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Task } from "@shared/schema";

export default function TaskDetailDebug() {
  const { taskId } = useParams();
  const [location, setLocation] = useLocation();

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ["/api/tasks", taskId],
  });

  if (isLoading) {
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
            <p className="text-slate-600">Loading task...</p>
          </CardContent>
        </Card>
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
            <h1 className="text-2xl font-bold text-slate-900">
              {task.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">
                {task.priority} priority
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Content for Debugging */}
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Title:</strong> {task.title}
            </div>
            <div>
              <strong>Status:</strong> {task.status}
            </div>
            <div>
              <strong>Priority:</strong> {task.priority}
            </div>
            <div>
              <strong>ID:</strong> {task.id}
            </div>
            <div>
              <strong>Description:</strong> {task.description || "No description"}
            </div>
            <div>
              <strong>Assigned To:</strong> {task.assignedTo || "Unassigned"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}