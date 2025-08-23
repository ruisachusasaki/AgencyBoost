import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Task, Client, Project, Campaign, Staff } from "@shared/schema";

export default function TaskDetailMinimal() {
  const { taskId } = useParams();
  const [location, setLocation] = useLocation();

  // Only the essential queries first
  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ["/api/tasks", taskId],
  });

  const { data: clientsData } = useQuery<{ clients: Client[] }>({
    queryKey: ["/api/clients"],
  });
  
  const clients = clientsData?.clients || [];

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
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
      {/* Simple Header */}
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

      {/* Minimal Content */}
      <Card>
        <CardHeader>
          <CardTitle>Task Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>ID:</strong> {task.id}
            </div>
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
              <strong>Description:</strong> {task.description || "No description"}
            </div>
            <div>
              <strong>Client Count:</strong> {clients.length}
            </div>
            <div>
              <strong>Project Count:</strong> {projects.length}
            </div>
            <div>
              <strong>Staff Count:</strong> {staff.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}