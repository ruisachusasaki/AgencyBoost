import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import ProjectForm from "@/components/forms/project-form";
import type { Project } from "@shared/schema";

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
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
  );
}