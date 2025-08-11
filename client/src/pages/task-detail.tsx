import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Building, FolderOpen, Target, Clock, MessageSquare, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Task, Client, Project, Campaign } from "@shared/schema";
import TaskForm from "@/components/forms/task-form";
// TaskComments component will be added later
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

export default function TaskDetail() {
  const { taskId } = useParams();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  const { data: userPermissions } = useQuery({
    queryKey: ["/api/auth/permissions"],
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Only administrators can delete tasks.');
        }
        throw new Error('Failed to delete task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      setLocation("/tasks");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = clients.find((c: Client) => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const getCampaignName = (campaignId: string | null) => {
    if (!campaignId) return null;
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.name || "Unknown Campaign";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-teal-100 text-teal-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  const formatDate = (date: Date | null) => {
    if (!date) return "No due date";
    
    const taskDate = new Date(date);
    const today = new Date();
    const isToday = taskDate.toDateString() === today.toDateString();
    const isTomorrow = taskDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
    const isPast = taskDate < today && !isToday;
    
    if (isToday) return "Due today";
    if (isTomorrow) return "Due tomorrow";
    if (isPast) return `Overdue (${taskDate.toLocaleDateString()})`;
    
    return `Due ${taskDate.toLocaleDateString()}`;
  };

  const handleDeleteTask = () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteTaskMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
            <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={getStatusColor(task.status)}>
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority} priority
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              <TaskForm
                task={task}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
                }}
              />
            </DialogContent>
          </Dialog>
          
          {userPermissions?.tasks?.canDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDeleteTask}
              disabled={deleteTaskMutation.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Task Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {task.dueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{formatDate(task.dueDate)}</span>
                  </div>
                )}
                
                {task.assignedTo && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{task.assignedTo}</span>
                  </div>
                )}
                
                {getClientName(task.clientId) && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{getClientName(task.clientId)}</span>
                  </div>
                )}
                
                {getProjectName(task.projectId) && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{getProjectName(task.projectId)}</span>
                  </div>
                )}
                
                {getCampaignName(task.campaignId) && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{getCampaignName(task.campaignId)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">Created {new Date(task.createdAt || '').toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                <p>Comments functionality coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Set Reminder
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Reassign Task
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Change Priority
              </Button>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Task created</p>
                    <p className="text-slate-500">{new Date(task.createdAt || '').toLocaleDateString()}</p>
                  </div>
                </div>
                {task.updatedAt && task.updatedAt !== task.createdAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Task updated</p>
                      <p className="text-slate-500">{new Date(task.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}