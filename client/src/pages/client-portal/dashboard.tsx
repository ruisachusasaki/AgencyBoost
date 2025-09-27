import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2, Clock, Users, LogOut, BarChart3 } from "lucide-react";
import { format } from "date-fns";

// Mock client portal user interface
interface ClientPortalUser {
  id: string;
  email: string;
  name: string;
  clientId: string;
  clientName: string;
}

// Task interface for client portal
interface ClientTask {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  projectName: string | null;
  assigneeName: string | null;
  completedAt: string | null;
  createdAt: string;
}

// Status color mapping
const statusColors = {
  not_started: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
};

// Priority color mapping
const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

function TaskCard({ task }: { task: ClientTask }) {
  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-task-${task.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium truncate" data-testid={`text-task-title-${task.id}`}>
              {task.title}
            </CardTitle>
            {task.projectName && (
              <CardDescription className="text-sm" data-testid={`text-project-name-${task.id}`}>
                {task.projectName}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge variant="outline" className={priorityColors[task.priority]} data-testid={`badge-priority-${task.id}`}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className={statusColors[task.status]} data-testid={`badge-status-${task.id}`}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-description-${task.id}`}>
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {task.assigneeName && (
              <div className="flex items-center gap-1" data-testid={`text-assignee-${task.id}`}>
                <Users className="h-4 w-4" />
                {task.assigneeName}
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1" data-testid={`text-due-date-${task.id}`}>
                <Calendar className="h-4 w-4" />
                {format(new Date(task.dueDate), "MMM d, yyyy")}
              </div>
            )}
          </div>
          {task.status === 'completed' && task.completedAt && (
            <div className="flex items-center gap-1 text-green-600" data-testid={`text-completed-date-${task.id}`}>
              <CheckCircle2 className="h-4 w-4" />
              {format(new Date(task.completedAt), "MMM d")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientPortalDashboard() {
  const [currentUser, setCurrentUser] = useState<ClientPortalUser | null>(() => {
    const stored = sessionStorage.getItem("clientPortalUser");
    return stored ? JSON.parse(stored) : null;
  });

  // Fetch current user details
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/client-portal/me"],
    enabled: !currentUser,
  });

  // Fetch client tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<ClientTask[]>({
    queryKey: ["/api/client-portal/tasks"],
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/client-portal/logout", {
        method: "POST",
        credentials: "include",
      });
      sessionStorage.removeItem("clientPortalUser");
      window.location.href = "/client-portal/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      sessionStorage.removeItem("clientPortalUser");
      window.location.href = "/client-portal/login";
    }
  };

  // Calculate task statistics
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const upcomingTasks = tasks.filter(task => task.status === 'not_started');
  const overdueTasks = tasks.filter(task => 
    task.dueDate && 
    new Date(task.dueDate) < new Date() && 
    task.status !== 'completed'
  );

  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const displayUser = currentUser || user;

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                <div className="w-5 h-5 bg-primary rounded"></div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground" data-testid="text-app-title">
                  AgencyFlow Portal
                </h1>
                <p className="text-sm text-muted-foreground" data-testid="text-client-name">
                  {displayUser?.clientName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right" data-testid="text-user-info">
                <p className="text-sm font-medium text-foreground">{displayUser?.name}</p>
                <p className="text-xs text-muted-foreground">{displayUser?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-stats-total">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{totalTasks}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-progress">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-completed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-completion">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{completionRate}%</div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="all" data-testid="tab-all">All Tasks</TabsTrigger>
            <TabsTrigger value="in_progress" data-testid="tab-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4" data-testid="content-all-tasks">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your tasks...</p>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                  <p className="text-muted-foreground">
                    Your agency will add tasks to this portal as they work on your projects.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4" data-testid="content-progress-tasks">
            {inProgressTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tasks in progress</h3>
                  <p className="text-muted-foreground">
                    Tasks that your agency is actively working on will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4" data-testid="content-completed-tasks">
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No completed tasks</h3>
                  <p className="text-muted-foreground">
                    Completed tasks will appear here once your agency finishes working on them.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4" data-testid="content-upcoming-tasks">
            {upcomingTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No upcoming tasks</h3>
                  <p className="text-muted-foreground">
                    Future tasks scheduled by your agency will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}