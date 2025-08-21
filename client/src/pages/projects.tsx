import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Calendar, Layout } from "lucide-react";
import ProjectForm from "@/components/forms/project-form";
import ProjectTemplateForm from "@/components/forms/project-template-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateProjectProgress, getProjectTasks } from "@/lib/project-utils";
import type { Project, Client, Task, ProjectTemplate } from "@shared/schema";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [templatesSearchTerm, setTemplatesSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("projects");
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: clientsData } = useQuery<{ clients: Client[] }>({
    queryKey: ["/api/clients"],
  });
  const clients = clientsData?.clients || [];

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // For templates - use sample data since API not working yet
  const sampleTemplates: ProjectTemplate[] = [
    {
      id: "template-1",
      name: "SEO Audit & Optimization",
      description: "Complete SEO analysis and optimization for client websites including technical audit, keyword research, and on-page optimization.",
      category: "SEO Audit",
      priority: "high",
      estimatedDuration: 21,
      estimatedBudget: "5000.00",
      isActive: true,
      usageCount: 12,
      createdBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-2", 
      name: "Social Media Campaign Setup",
      description: "Complete social media marketing campaign including content strategy, asset creation, and campaign launch across multiple platforms.",
      category: "Social Media Management",
      priority: "medium",
      estimatedDuration: 14,
      estimatedBudget: "3500.00",
      isActive: true,
      usageCount: 8,
      createdBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-3",
      name: "Website Development",
      description: "Full website development project including design, development, testing, and deployment with responsive design and SEO optimization.",
      category: "Website Development",
      priority: "high", 
      estimatedDuration: 45,
      estimatedBudget: "15000.00",
      isActive: true,
      usageCount: 5,
      createdBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-4",
      name: "PPC Campaign Launch", 
      description: "Google Ads and social media advertising campaign setup including keyword research, ad creation, landing page optimization, and campaign monitoring.",
      category: "PPC Campaign",
      priority: "medium",
      estimatedDuration: 10,
      estimatedBudget: "2500.00",
      isActive: true,
      usageCount: 15,
      createdBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredProjects = projects.filter(project => {
    const client = clients.find(c => c.id === project.clientId);
    return (
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredTemplates = sampleTemplates.filter(template =>
    template.name.toLowerCase().includes(templatesSearchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(templatesSearchTerm.toLowerCase()) ||
    template.category?.toLowerCase().includes(templatesSearchTerm.toLowerCase())
  );

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-teal-100 text-teal-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "planning":
        return "bg-purple-100 text-purple-800";
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
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate(id);
    }
  };

  const handleEditTemplate = (template: ProjectTemplate) => {
    setEditingTemplate(template);
  };

  const handleCloseTemplateDialog = () => {
    setEditingTemplate(null);
    setIsCreateTemplateDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-2 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "projects", name: "Projects", icon: Calendar, count: filteredProjects.length },
            { id: "templates", name: "Templates", icon: Layout, count: filteredTemplates.length }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name} ({tab.count})
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                </DialogHeader>
                <ProjectForm
                  onSuccess={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-slate-600">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">
                {searchTerm ? "No projects found matching your search." : "No projects found."}
              </p>
              {!searchTerm && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Create Your First Project</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Project</DialogTitle>
                    </DialogHeader>
                    <ProjectForm
                      onSuccess={() => setIsCreateDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredProjects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-slate-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        Client: {getClientName(project.clientId)}
                      </p>
                      {project.description && (
                        <p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}/edit`)}
                        data-testid={`button-edit-${project.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={deleteProjectMutation.isPending}
                        data-testid={`button-delete-${project.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {project.budget && (
                      <div>
                        <p className="text-xs text-slate-500">Budget</p>
                        <p className="font-semibold text-slate-900">
                          ${Number(project.budget).toLocaleString()}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs text-slate-500">Start Date</p>
                      <p className="font-semibold text-slate-900 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.startDate)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-slate-500">End Date</p>
                      <p className="font-semibold text-slate-900 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(() => {
                      const projectTasks = getProjectTasks(tasks, project.id);
                      const progress = calculateProjectProgress(projectTasks);
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Progress</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                {progress.completedTasks} of {progress.totalTasks} tasks
                              </span>
                              <span className="text-sm font-medium text-slate-900">
                                {progress.progressPercentage}%
                              </span>
                            </div>
                          </div>
                          <Progress value={progress.progressPercentage} className="h-2" />
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      )}

      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Dialog open={isCreateTemplateDialogOpen} onOpenChange={setIsCreateTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                </DialogHeader>
                <ProjectTemplateForm
                  onSuccess={handleCloseTemplateDialog}
                />
              </DialogContent>
            </Dialog>
          </div>

      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search templates..."
                value={templatesSearchTerm}
                onChange={(e) => setTemplatesSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-slate-600">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Layout className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {templatesSearchTerm ? 'No templates found' : 'No templates yet'}
              </h3>
              <p className="text-slate-600 mb-4 max-w-sm mx-auto">
                {templatesSearchTerm 
                  ? `No templates match "${templatesSearchTerm}". Try adjusting your search.`
                  : 'Create your first project template to speed up future project setup.'
                }
              </p>
              {!templatesSearchTerm && (
                <Button>Create Your First Template</Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="p-6 hover:bg-slate-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 truncate">{template.name}</h3>
                        <Badge className={getPriorityColor(template.priority)}>
                          {template.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">{template.description}</p>
                      <div className="text-xs text-slate-500">
                        Used {template.usageCount} times • Est. {template.estimatedDuration} days • ${Number(template.estimatedBudget).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        data-testid={`button-edit-template-${template.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-delete-template-${template.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      )}

      {/* Template Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <ProjectTemplateForm
              template={editingTemplate}
              onSuccess={handleCloseTemplateDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
