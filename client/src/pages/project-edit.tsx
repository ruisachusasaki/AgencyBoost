import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, Circle } from "lucide-react";
import ProjectForm from "@/components/forms/project-form";
import { calculateProjectProgress, getProjectTasks } from "@/lib/project-utils";
import type { Project, Task } from "@shared/schema";

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const project = projects.find(p => p.id === id);

  const handleSuccess = () => {
    navigate("/projects");
  };

  const handleBackClick = () => {
    navigate("/projects");
  };

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
        <div className="md:col-span-2">
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
                const projectTasks = getProjectTasks(tasks, project.id);
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