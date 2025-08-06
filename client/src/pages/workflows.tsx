import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play, Pause, Settings, GitBranch, Zap, Calendar, Users, Target, ChevronRight, Activity } from "lucide-react";
import type { Workflow, EnhancedTask, WorkflowTemplate } from "@shared/schema";
import WorkflowBuilder from "@/components/workflow-builder";
import WorkflowDetail from "@/components/workflow-detail";

export default function WorkflowsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
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
      setIsBuilderOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create workflow", variant: "destructive" });
    },
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

  const filteredWorkflows = (workflows as Workflow[]).filter((workflow: Workflow) => 
    selectedCategory === "all" || workflow.category === selectedCategory
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
    setEditingWorkflow(workflow);
    setIsBuilderOpen(true);
    setIsDetailOpen(false);
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

  if (workflowsLoading || templatesLoading) {
    return <div className="p-6">Loading workflows...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#46a1a0]">Workflow Automation</h1>
          <p className="text-muted-foreground">
            Create and manage automated workflows to streamline your business processes
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={createSampleWorkflow}
            className="bg-[#46a1a0] hover:bg-[#3a8a89]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Sample Workflow
          </Button>
          <Button 
            onClick={() => setIsBuilderOpen(true)}
            className="bg-[#46a1a0] hover:bg-[#3a8a89]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Build Workflow
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="automation">Automation Builder</TabsTrigger>
          </TabsList>
          
          {/* Category Filter - Only show on workflows tab */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Filter:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="lead_management">Lead Management</SelectItem>
                <SelectItem value="email_marketing">Email Marketing</SelectItem>
                <SelectItem value="task_automation">Task Automation</SelectItem>
                <SelectItem value="customer_onboarding">Customer Onboarding</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="workflows" className="space-y-4">

          {filteredWorkflows.length === 0 ? (
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
                  Create Sample Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
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
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
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
        </TabsContent>
      </Tabs>

      {/* Workflow Builder */}
      <WorkflowBuilder 
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingWorkflow(null);
        }}
        onSave={createWorkflowMutation.mutate}
        editingWorkflow={editingWorkflow}
      />

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
    </div>
  );
}