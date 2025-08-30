import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Play, Pause, Layout, GitBranch, Zap, Calendar, Users, Target, ChevronRight, Activity, Settings, FolderPlus, FolderOpen, ArrowLeft, Folder, Edit, Trash2, ChevronUp, ChevronDown, Grid, List } from "lucide-react";
import type { Workflow, EnhancedTask, WorkflowTemplate, TemplateFolder } from "@shared/schema";
import { useLocation } from "wouter";
import WorkflowDetail from "@/components/workflow-detail";

export default function WorkflowsPage() {
  const [location, navigate] = useLocation();
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState<string>("workflows");
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [sortField, setSortField] = useState<"name" | "updatedAt">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<TemplateFolder | null>(null);
  const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<TemplateFolder | null>(null);
  const [workflowToMove, setWorkflowToMove] = useState<Workflow | null>(null);
  const [isMoveToFolderDialogOpen, setIsMoveToFolderDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/workflows"],
  });

  // Fetch workflow templates
  const { data: workflowTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/workflow-templates"],
  });

  // Fetch enhanced tasks related to workflows
  const { data: workflowTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/enhanced-tasks"],
  });

  // Fetch template folders for workflow organization
  const { data: templateFolders = [], isLoading: loadingFolders } = useQuery<TemplateFolder[]>({
    queryKey: ["/api/template-folders"],
  });

  // Fetch automation triggers and actions
  const { data: triggers = [] } = useQuery({
    queryKey: ["/api/automation-triggers"],
  });

  const { data: actions = [] } = useQuery({
    queryKey: ["/api/automation-actions"],
  });

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (workflowData: any) => {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowData),
      });
      if (!response.ok) throw new Error("Failed to create workflow");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Workflow created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create workflow", variant: "destructive" });
    },
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      return await apiRequest("DELETE", `/api/workflows/${workflowId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Success", description: "Workflow deleted successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete workflow" });
    }
  });

  // Update workflow status mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update workflow");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Workflow updated successfully" });
    },
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/template-folders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/template-folders"] });
      toast({ title: "Success", description: "Folder created successfully" });
      setIsCreateFolderDialogOpen(false);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to create folder" });
    }
  });

  // Edit folder mutation
  const editFolderMutation = useMutation({
    mutationFn: async ({ folderId, name, description }: { folderId: string; name: string; description?: string }) => {
      return await apiRequest("PATCH", `/api/template-folders/${folderId}`, {
        name,
        description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/template-folders"] });
      toast({ title: "Success", description: "Folder updated successfully" });
      setIsEditFolderDialogOpen(false);
      setFolderToEdit(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update folder" });
    }
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      return await apiRequest("DELETE", `/api/template-folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/template-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Success", description: "Folder deleted successfully" });
      setIsDeleteFolderDialogOpen(false);
      setFolderToDelete(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete folder" });
    }
  });

  // Move workflow to folder mutation
  const moveWorkflowMutation = useMutation({
    mutationFn: async ({ workflowId, folderId }: { workflowId: string; folderId: string | null }) => {
      return await apiRequest("PUT", `/api/workflows/${workflowId}`, {
        folderId: folderId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Success", description: "Workflow moved successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to move workflow" });
    }
  });

  // Filter folders for workflow type
  const workflowFolders = templateFolders.filter(folder => folder.type === "workflow" || folder.type === "both");

  // Filter workflows based on selected folder
  const filteredWorkflows = (workflows as Workflow[]).filter(workflow => {
    const matchesFolder = selectedFolder ? workflow.folderId === selectedFolder : !workflow.folderId;
    return matchesFolder;
  });

  // Sorting handlers
  const handleSort = (field: "name" | "updatedAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Prepare table data for folders view
  const getTableData = () => {
    const items: any[] = [];
    
    if (selectedFolder) {
      // If a folder is selected, show workflows from that folder
      filteredWorkflows.forEach((workflow: Workflow) => {
        items.push({
          type: 'workflow',
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          lastUpdated: workflow.updatedAt || workflow.createdAt,
          originalWorkflow: workflow
        });
      });
    } else {
      // Show folders
      workflowFolders.forEach((folder: TemplateFolder) => {
        const folderWorkflows = (workflows as Workflow[]).filter(w => w.folderId === folder.id);
        items.push({
          type: 'folder',
          id: folder.id,
          name: folder.name,
          description: folder.description,
          itemCount: folderWorkflows.length,
          lastUpdated: folder.updatedAt || folder.createdAt,
          updatedBy: 'System'
        });
      });
      
      // Show workflows without folders
      filteredWorkflows.forEach((workflow: Workflow) => {
        if (!workflow.folderId) {
          items.push({
            type: 'workflow',
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            status: workflow.status,
            lastUpdated: workflow.updatedAt || workflow.createdAt,
            originalWorkflow: workflow
          });
        }
      });
    }
    
    // Sort items - folders first, then workflows
    return items.sort((a, b) => {
      // First priority: type (folders before workflows)
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      
      // Second priority: chosen sort field within same type
      const aValue = sortField === "name" ? a.name : a.lastUpdated;
      const bValue = sortField === "name" ? b.name : b.lastUpdated;
      
      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  // Sortable header component
  const SortableHeader = ({ field, children }: { field: "name" | "updatedAt"; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col ml-1">
          <ChevronUp 
            className={`h-3 w-3 ${
              sortField === field && sortDirection === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              sortField === field && sortDirection === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "paused": return "bg-yellow-500";
      case "draft": return "bg-gray-500";
      case "archived": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="h-3 w-3" />;
      case "paused": return <Pause className="h-3 w-3" />;
      case "draft": return <Settings className="h-3 w-3" />;
      default: return <Settings className="h-3 w-3" />;
    }
  };

  const handleViewDetails = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsDetailOpen(true);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    navigate(`/workflows/build?edit=${workflow.id}`);
  };

  const createSampleWorkflow = () => {
    createWorkflowMutation.mutate({
      name: "New Lead Welcome Sequence",
      description: "Automated welcome email sequence for new leads with follow-up tasks",
      category: "lead_management",
      status: "draft",
      trigger: {
        type: "contact_created",
        conditions: {
          source: "website_form",
          tags: ["new_lead"]
        }
      },
      actions: [
        {
          type: "send_email",
          config: {
            template: "welcome_email",
            delay: 0
          }
        },
        {
          type: "wait",
          config: {
            duration: 24,
            unit: "hours"
          }
        },
        {
          type: "create_task",
          config: {
            title: "Follow up with new lead",
            priority: "high",
            assignee: "sales_team"
          }
        }
      ],
      createdBy: "user-1"
    });
  };

  // Handle edit folder form submission
  const handleEditFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderToEdit) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    
    editFolderMutation.mutate({
      folderId: folderToEdit.id,
      name,
      description: description || undefined
    });
  };

  // Handle delete folder confirmation
  const handleDeleteFolder = () => {
    if (!folderToDelete) return;
    deleteFolderMutation.mutate(folderToDelete.id);
  };

  if (workflowsLoading || templatesLoading) {
    return <div className="p-6">Loading workflows...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6 workflows-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <GitBranch className="h-8 w-8 text-[#46a1a0]" />
            <h1 className="text-3xl font-bold tracking-tight text-black">Workflow Automation</h1>
          </div>
          <p className="text-muted-foreground">
            Create and manage automated workflows to streamline your business processes
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsCreateFolderDialogOpen(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button 
              onClick={() => navigate("/workflows/build")}
              className="bg-[#46a1a0] hover:bg-[#3a8a89]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Build Workflow
            </Button>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "workflows", name: "Active Workflows", icon: GitBranch },
              { id: "templates", name: "Templates", icon: Layout },
              { id: "analytics", name: "Analytics", icon: Activity }
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
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "workflows" && (<div className="space-y-4">
          {/* Breadcrumb navigation when viewing a specific folder */}
          {selectedFolder && (
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedFolder(null)}
                className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                All Workflows
              </Button>
            </div>
          )}

          {filteredWorkflows.length === 0 && workflowFolders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first automated workflow to streamline your business processes
                </p>
                <Button 
                  onClick={createSampleWorkflow}
                  className="bg-[#46a1a0] hover:bg-[#3a8a89]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Conditional View: Table or Grid */
            viewMode === "table" ? (
              <div className="border rounded-lg overflow-hidden bg-white">
                <Table className="bg-white">
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="name">Name</SortableHeader>
                      <TableHead className="w-[25%]">Description</TableHead>
                      <SortableHeader field="updatedAt">Last Updated</SortableHeader>
                      <TableHead className="w-[15%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getTableData().map((item) => (
                      <TableRow key={`${item.type}-${item.id}`} className="group hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.type === 'folder' ? (
                              <div 
                                className="flex items-center gap-2 cursor-pointer hover:text-[#46a1a0]"
                                onClick={() => setSelectedFolder(item.id)}
                                data-testid={`folder-${item.id}`}
                              >
                                <Folder className="h-4 w-4 text-[#46a1a0]" />
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {item.itemCount} {item.itemCount === 1 ? 'workflow' : 'workflows'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="flex items-center gap-2 cursor-pointer hover:text-[#46a1a0]"
                                onClick={() => handleEditWorkflow(item.originalWorkflow)}
                                data-testid={`workflow-${item.id}`}
                              >
                                <GitBranch className="h-4 w-4 text-[#46a1a0]" />
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  {item.status && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`}></div>
                                      <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs">
                                        {item.status}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.description || <span className="text-gray-400">No description</span>}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(item.lastUpdated).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.type === 'folder' ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    const folder = workflowFolders.find(f => f.id === item.id);
                                    if (folder) {
                                      setFolderToEdit(folder);
                                      setIsEditFolderDialogOpen(true);
                                    }
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    const folder = workflowFolders.find(f => f.id === item.id);
                                    if (folder) {
                                      setFolderToDelete(folder);
                                      setIsDeleteFolderDialogOpen(true);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(item.originalWorkflow)}
                                >
                                  <Activity className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditWorkflow(item.originalWorkflow)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                {item.status === "active" ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateWorkflowMutation.mutate({
                                      id: item.id,
                                      status: "paused"
                                    })}
                                  >
                                    <Pause className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateWorkflowMutation.mutate({
                                      id: item.id,
                                      status: "active"
                                    })}
                                  >
                                    <Play className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setWorkflowToMove(item.originalWorkflow);
                                    setIsMoveToFolderDialogOpen(true);
                                  }}
                                >
                                  <Folder className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setWorkflowToDelete(item.originalWorkflow);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Grid View */
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Show folders only when no folder is selected */}
                {!selectedFolder && workflowFolders.map((folder: TemplateFolder) => (
                  <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedFolder(folder.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <Badge variant="outline" className="text-xs">
                          Folder
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{folder.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {folder.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
                
                {/* Show workflows */}
                {filteredWorkflows.map((workflow: Workflow) => (
                  <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(workflow.status)} text-white border-none`}
                          >
                            {getStatusIcon(workflow.status)}
                            <span className="ml-1 capitalize">{workflow.status}</span>
                          </Badge>
                          {workflow.category && (
                            <Badge variant="secondary" className="text-xs">
                              {workflow.category.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            const newStatus = workflow.status === "active" ? "paused" : "active";
                            updateWorkflowMutation.mutate({ id: workflow.id, status: newStatus });
                          }}
                        >
                          {workflow.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </div>
                      <CardTitle 
                        className="text-lg cursor-pointer hover:text-[#46a1a0] transition-colors"
                        onClick={() => handleEditWorkflow(workflow)}
                      >
                        {workflow.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {workflow.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total Runs:</span>
                          <span className="font-medium">{workflow.totalRuns ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Success Rate:</span>
                          <span className="font-medium">
                            {(workflow.totalRuns ?? 0) > 0 
                              ? `${Math.round(((workflow.successfulRuns ?? 0) / (workflow.totalRuns ?? 1)) * 100)}%`
                              : "N/A"
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Last Run:</span>
                          <span className="font-medium">
                            {workflow.lastRun 
                              ? new Date(workflow.lastRun).toLocaleDateString()
                              : "Never"
                            }
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4"
                        onClick={() => handleViewDetails(workflow)}
                      >
                        View Details
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>)}

        {activeTab === "templates" && <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(workflowTemplates as WorkflowTemplate[]).map((template: WorkflowTemplate) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{template.category}</Badge>
                    {template.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm">⭐</span>
                        <span className="text-sm font-medium">{template.rating}</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {template.industry && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Industry:</span>
                        <span className="font-medium">{template.industry}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Used:</span>
                      <span className="font-medium">{template.usageCount} times</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>}

        {activeTab === "analytics" && <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#46a1a0]">
                  {(workflows as Workflow[]).filter((w: Workflow) => w.status === "active").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently running workflows
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#46a1a0]">
                  {(workflows as Workflow[]).reduce((acc: number, w: Workflow) => acc + (w.totalRuns ?? 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time workflow runs
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#46a1a0]">
                  {(workflows as Workflow[]).length > 0 
                    ? Math.round(
                        ((workflows as Workflow[]).reduce((acc: number, w: Workflow) => acc + (w.successfulRuns ?? 0), 0) /
                         Math.max((workflows as Workflow[]).reduce((acc: number, w: Workflow) => acc + (w.totalRuns ?? 0), 0), 1)) * 100
                      )
                    : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average success rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Automated Tasks</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#46a1a0]">
                  {(workflowTasks as EnhancedTask[]).filter((t: EnhancedTask) => t.workflowId).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tasks created by workflows
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Available Triggers
                </CardTitle>
                <CardDescription>
                  Events that can start your workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(triggers as any[]).length > 0 ? (
                    (triggers as any[]).slice(0, 5).map((trigger: any) => (
                      <div key={trigger.id} className="p-2 border rounded">
                        <div className="font-medium">{trigger.name}</div>
                        <div className="text-sm text-muted-foreground">{trigger.description}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No triggers configured yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Available Actions
                </CardTitle>
                <CardDescription>
                  Actions your workflows can perform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(actions as any[]).length > 0 ? (
                    (actions as any[]).slice(0, 5).map((action: any) => (
                      <div key={action.id} className="p-2 border rounded">
                        <div className="font-medium">{action.name}</div>
                        <div className="text-sm text-muted-foreground">{action.description}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No actions configured yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>}

        {activeTab === "templates" && <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(workflowTemplates as WorkflowTemplate[]).map((template: WorkflowTemplate) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{template.category}</Badge>
                    {template.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm">⭐</span>
                        <span className="text-sm font-medium">{template.rating}</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {template.industry && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Industry:</span>
                        <span className="font-medium">{template.industry}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Used:</span>
                      <span className="font-medium">{template.usageCount} times</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>}
      </div>

      {/* Workflow Detail */}
      {selectedWorkflow && (
        <WorkflowDetail 
          workflow={selectedWorkflow}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedWorkflow(null);
          }}
          onEdit={handleEditWorkflow}
        />
      )}

      {/* Folder Creation Dialog */}
      <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workflow Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your workflows
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const folderData = {
              name: formData.get('name'),
              description: formData.get('description'),
              type: 'workflow'
            };
            
            if (!folderData.name) {
              return;
            }
            
            createFolderMutation.mutate(folderData);
          }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input 
                  id="folder-name"
                  name="name"
                  placeholder="Enter folder name..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder-description">Description (Optional)</Label>
                <Textarea 
                  id="folder-description"
                  name="description"
                  placeholder="Enter folder description..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateFolderDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createFolderMutation.isPending}
              >
                {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditFolderDialogOpen} onOpenChange={setIsEditFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update the folder name and description
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditFolder} className="space-y-4">
            <div>
              <Label htmlFor="edit-folder-name">Folder Name</Label>
              <Input 
                id="edit-folder-name"
                name="name" 
                defaultValue={folderToEdit?.name || ""} 
                placeholder="Enter folder name" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="edit-folder-description">Description</Label>
              <Textarea 
                id="edit-folder-description"
                name="description" 
                defaultValue={folderToEdit?.description || ""} 
                placeholder="Optional description" 
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditFolderDialogOpen(false);
                  setFolderToEdit(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={editFolderMutation.isPending}
              >
                {editFolderMutation.isPending ? "Updating..." : "Update Folder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <Dialog open={isDeleteFolderDialogOpen} onOpenChange={setIsDeleteFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{folderToDelete?.name}"? This action cannot be undone.
              All workflows in this folder will be moved to the root level.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteFolderDialogOpen(false);
                setFolderToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteFolder}
              disabled={deleteFolderMutation.isPending}
            >
              {deleteFolderMutation.isPending ? "Deleting..." : "Delete Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={isMoveToFolderDialogOpen} onOpenChange={setIsMoveToFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Workflow to Folder</DialogTitle>
            <DialogDescription>
              Select a folder to move "{workflowToMove?.name}" to, or choose "No Folder" to move it to the root level.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-select">Choose Folder</Label>
              <Select
                value={workflowToMove?.folderId || "no-folder"}
                onValueChange={(value) => {
                  if (workflowToMove) {
                    const folderId = value === "no-folder" ? null : value;
                    moveWorkflowMutation.mutate({
                      workflowId: workflowToMove.id,
                      folderId: folderId
                    });
                    setIsMoveToFolderDialogOpen(false);
                    setWorkflowToMove(null);
                  }
                }}
              >
                <SelectTrigger id="folder-select">
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-folder">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      No Folder
                    </div>
                  </SelectItem>
                  {workflowFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <FolderPlus className="h-4 w-4" />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsMoveToFolderDialogOpen(false);
                setWorkflowToMove(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workflow Confirmation Modal */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workflowToDelete?.name}"? This action cannot be undone and will permanently remove this workflow and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setWorkflowToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (workflowToDelete) {
                  deleteWorkflowMutation.mutate(workflowToDelete.id);
                  setIsDeleteDialogOpen(false);
                  setWorkflowToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Workflow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}