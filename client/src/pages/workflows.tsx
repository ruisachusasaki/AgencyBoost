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

  const filteredWorkflows = workflows as Workflow[];

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
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsBuilderOpen(true)}
            className="bg-[#46a1a0] hover:bg-[#3a8a89]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Build Workflow
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="workflows-tabslist">
          <TabsTrigger value="templates" className="workflows-tab">Templates</TabsTrigger>
          <TabsTrigger value="analytics" className="workflows-tab">Analytics</TabsTrigger>
        </TabsList>


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