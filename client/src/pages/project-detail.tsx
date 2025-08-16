import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  Target,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import type { Project, Client, Task, Staff } from "@shared/schema";

// Form validation schema
const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["planning", "active", "completed", "cancelled", "on_hold"]),
  priority: z.enum(["low", "medium", "high"]),
  budget: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", id],
    enabled: !!id,
  });

  // Fetch clients for dropdown
  const { data: clientsData } = useQuery<{ clients: Client[] }>({
    queryKey: ["/api/clients"],
  });

  // Fetch project tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    select: (data) => data.filter(task => task.projectId === id),
  });

  // Fetch staff members
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const clients = clientsData?.clients || [];

  // Form setup
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "planning",
      priority: "medium",
      budget: "",
      startDate: "",
      endDate: "",
    },
  });

  // Update form when project data loads
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description || "",
        status: project.status as any,
        priority: project.priority as any,
        budget: project.budget?.toString() || "",
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
      });
    }
  }, [project, form]);

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const updateData = {
        ...data,
        budget: data.budget ? parseFloat(data.budget) : null,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      };
      return await apiRequest("PUT", `/api/projects/${id}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate project progress
  const completedTasks = tasks.filter(task => task.status === "completed").length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get client name
  const clientName = clients.find(c => c.id === project?.clientId)?.name || "Unknown Client";

  const handleSubmit = (data: ProjectFormData) => {
    updateProjectMutation.mutate(data);
  };

  if (projectLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <Link href="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/projects">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Projects</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
              <Target className="h-8 w-8 text-[#46a1a0]" />
              <span>{project.name}</span>
            </h1>
            <p className="text-muted-foreground">
              {clientName} • {project.status}
            </p>
          </div>
        </div>
        
        {/* Status Badge */}
        <Badge variant={project.status === "active" ? "default" : "secondary"}>
          {project.status}
        </Badge>
      </div>

      {/* Project Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{progressPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Tasks</p>
                <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold">
                  {project.budget ? `$${Number(project.budget).toLocaleString()}` : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <p className="text-lg font-bold">
                  {project.endDate ? new Date(project.endDate).toLocaleDateString() : "No deadline"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Project Progress</h3>
            <span className="text-sm text-muted-foreground">{completedTasks} of {totalTasks} tasks completed</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({totalTasks})</TabsTrigger>
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <p className="text-lg">{clientName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{project.description || "No description provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <Badge variant={project.priority === "high" ? "destructive" : "secondary"}>
                    {project.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks created yet</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === "completed" ? "bg-green-500" : 
                            task.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"
                          }`} />
                          <span className="text-sm">{task.title}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Project Tasks</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
          
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No tasks created for this project yet</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          task.status === "completed" ? "bg-green-500" : 
                          task.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"
                        }`} />
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">{task.priority}</Badge>
                        <Badge variant="outline">{task.status}</Badge>
                        {task.dueDate && (
                          <span className="text-sm text-muted-foreground">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Project Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="planning">Planning</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
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
                            {...field} 
                            placeholder="Describe the project goals and requirements..."
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="submit"
                      disabled={updateProjectMutation.isPending}
                      data-testid="button-save-project"
                    >
                      {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Activity tracking coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}