import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, X, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TaskDependency {
  id: string;
  dependsOnTaskId: string;
  dependencyType: "finish_to_start" | "start_to_start" | "finish_to_finish" | "start_to_finish";
  createdAt: string;
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignedTo: string | null;
    dueDate: string | null;
    completedAt: string | null;
  };
}

interface DependentTask {
  id: string;
  taskId: string;
  dependencyType: "finish_to_start" | "start_to_start" | "finish_to_finish" | "start_to_finish";
  createdAt: string;
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignedTo: string | null;
    dueDate: string | null;
    completedAt: string | null;
  };
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  dueDate: string | null;
  completedAt: string | null;
}

interface TaskDependenciesProps {
  taskId: string;
}

const dependencyTypeLabels = {
  finish_to_start: "Finish to Start",
  start_to_start: "Start to Start", 
  finish_to_finish: "Finish to Finish",
  start_to_finish: "Start to Finish"
};

const getStatusIcon = (status: string, completedAt: string | null) => {
  if (completedAt) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  
  switch (status) {
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "blocked":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "high":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "normal":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "low":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export function TaskDependencies({ taskId }: TaskDependenciesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedDependencyType, setSelectedDependencyType] = useState<string>("finish_to_start");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch task dependencies
  const { data: dependencyData } = useQuery({
    queryKey: ["/api/tasks", taskId, "dependencies"],
    enabled: !!taskId,
  });

  const dependencies = ((dependencyData as any)?.dependencies || []) as TaskDependency[];
  const dependentTasks = ((dependencyData as any)?.dependentTasks || []) as DependentTask[];

  // Fetch all tasks for the dependency selector
  const { data: allTasks } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: showAddForm,
  });

  // Available tasks (exclude current task and existing dependencies)
  const availableTasks = ((allTasks as any) || []).filter((task: Task) => 
    task.id !== taskId && 
    !dependencies.some(dep => dep.dependsOnTaskId === task.id)
  );

  // Add dependency mutation
  const addDependencyMutation = useMutation({
    mutationFn: (data: { dependsOnTaskId: string; dependencyType: string }) =>
      fetch(`/api/tasks/${taskId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowAddForm(false);
      setSelectedTaskId("");
      setSelectedDependencyType("finish_to_start");
      toast({
        title: "Success",
        description: "Task dependency added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add task dependency",
        variant: "destructive",
      });
    },
  });

  // Remove dependency mutation
  const removeDependencyMutation = useMutation({
    mutationFn: (dependencyId: string) =>
      fetch(`/api/dependencies/${dependencyId}`, {
        method: "DELETE",
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task dependency removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove task dependency",
        variant: "destructive",
      });
    },
  });

  const handleAddDependency = () => {
    if (!selectedTaskId) {
      toast({
        title: "Error",
        description: "Please select a task",
        variant: "destructive",
      });
      return;
    }

    addDependencyMutation.mutate({
      dependsOnTaskId: selectedTaskId,
      dependencyType: selectedDependencyType,
    });
  };

  const handleRemoveDependency = (dependencyId: string) => {
    removeDependencyMutation.mutate(dependencyId);
  };

  return (
    <div className="space-y-6">
      {/* Dependencies Section - Tasks this task depends on */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Dependencies ({dependencies.length})
          </CardTitle>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)} 
            size="sm"
            variant="outline"
            data-testid="button-add-dependency"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Dependency
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Dependency Form */}
          {showAddForm && (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Task</label>
                  <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                    <SelectTrigger data-testid="select-dependency-task">
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks.map((task: Task) => (
                        <SelectItem key={task.id} value={task.id}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status, task.completedAt)}
                            <span className="truncate">{task.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Dependency Type</label>
                  <Select value={selectedDependencyType} onValueChange={setSelectedDependencyType}>
                    <SelectTrigger data-testid="select-dependency-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dependencyTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddDependency}
                  disabled={addDependencyMutation.isPending}
                  data-testid="button-save-dependency"
                >
                  {addDependencyMutation.isPending ? "Adding..." : "Add Dependency"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  data-testid="button-cancel-dependency"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Dependencies List */}
          {dependencies.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              This task has no dependencies
            </p>
          ) : (
            <div className="space-y-3">
              {dependencies.map((dependency) => (
                <div 
                  key={dependency.id} 
                  className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-900"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(dependency.task.status, dependency.task.completedAt)}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{dependency.task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {dependencyTypeLabels[dependency.dependencyType]}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getPriorityColor(dependency.task.priority)}`}
                        >
                          {dependency.task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDependency(dependency.id)}
                    disabled={removeDependencyMutation.isPending}
                    data-testid={`button-remove-dependency-${dependency.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dependent Tasks Section - Tasks that depend on this task */}
      {dependentTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 rotate-180" />
              Dependent Tasks ({dependentTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dependentTasks.map((dependentTask) => (
                <div 
                  key={dependentTask.id} 
                  className="flex items-center gap-3 p-3 border rounded-lg bg-white dark:bg-gray-900"
                >
                  {getStatusIcon(dependentTask.task.status, dependentTask.task.completedAt)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{dependentTask.task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {dependencyTypeLabels[dependentTask.dependencyType]}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getPriorityColor(dependentTask.task.priority)}`}
                      >
                        {dependentTask.task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}