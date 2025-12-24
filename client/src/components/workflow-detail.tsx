import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, Pause, Edit, Trash2, BarChart3, Clock, CheckSquare, 
  Mail, MessageSquare, Tag, Phone, Zap, ArrowRight, Calendar,
  Users, Activity, TrendingUp, Save
} from "lucide-react";
import type { Workflow, WorkflowExecution, EnhancedTask } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface WorkflowDetailProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (workflow: Workflow) => void;
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "send_email": return Mail;
    case "send_sms": return MessageSquare;
    case "create_task": return CheckSquare;
    case "add_tag": return Tag;
    case "wait": return Clock;
    case "make_call": return Phone;
    default: return Zap;
  }
};

export default function WorkflowDetail({ workflow, isOpen, onClose, onEdit }: WorkflowDetailProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user for permission check
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/current-user'],
    enabled: isOpen,
  });

  // Fetch workflow executions
  const { data: executions = [] } = useQuery({
    queryKey: ["/api/workflow-executions", { workflowId: workflow.id }],
    enabled: isOpen,
  });

  // Fetch tasks created by this workflow
  const { data: workflowTasks = [] } = useQuery({
    queryKey: ["/api/enhanced-tasks", { workflowId: workflow.id }],
    enabled: isOpen,
  });

  // Fetch workflow action analytics
  const { data: actionAnalytics = [] } = useQuery({
    queryKey: ["/api/workflows", workflow.id, "action-analytics"],
    queryFn: async () => {
      const response = await fetch(`/api/workflows/${workflow.id}/action-analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: isOpen,
  });

  // Update workflow status mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
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

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete workflow");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Workflow deleted successfully" });
      onClose();
    },
  });

  // Save as template mutation
  const saveAsTemplateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/workflows/${workflow.id}/save-as-template`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-templates"] });
      toast({
        title: "Success",
        variant: "success", 
        description: `"${workflow.name}" has been saved as a template` 
      });
    },
    onError: (error: any) => {
      // Handle duplicate template error specifically
      const isDuplicate = error.message?.includes("already exists");
      toast({ 
        variant: "destructive",
        title: "Error", 
        description: isDuplicate 
          ? "A template already exists for this workflow. Please delete the existing template first if you want to create a new one."
          : error.message || "Failed to save workflow as template" 
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "paused": return "bg-yellow-500";
      case "draft": return "bg-gray-500";
      case "archived": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  const actions = Array.isArray(workflow.actions) ? workflow.actions : [];

  // Check if user can save workflows as templates (Admins and Managers only)
  const canSaveAsTemplate = () => {
    if (!currentUser) return false;
    return currentUser.role === 'Admin' || currentUser.role === 'Manager';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{workflow.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {workflow.description || "No description provided"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(workflow.status)} text-white border-none`}
              >
                {workflow.status}
              </Badge>
              {workflow.category && (
                <Badge variant="secondary">
                  {workflow.category.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {canSaveAsTemplate() && (
            <Button 
              variant="outline"
              onClick={() => saveAsTemplateMutation.mutate()}
              disabled={saveAsTemplateMutation.isPending}
              data-testid="button-save-as-template"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveAsTemplateMutation.isPending ? "Saving..." : "Save As Template"}
            </Button>
          )}
          <Button 
            onClick={() => updateWorkflowMutation.mutate({ 
              status: workflow.status === "active" ? "paused" : "active" 
            })}
            className="bg-[#00C9C6] hover:bg-[#00b0ad]"
            data-testid="button-activate-workflow"
          >
            {workflow.status === "active" ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Workflow
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Activate Workflow
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => onEdit(workflow)} data-testid="button-edit-workflow">
            <Edit className="h-4 w-4 mr-2" />
            Edit Workflow
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => deleteWorkflowMutation.mutate()}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="flow">Workflow Flow</TabsTrigger>
            <TabsTrigger value="executions">Executions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#46a1a0]">
                    {workflow.totalRuns ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#46a1a0]">
                    {(workflow.totalRuns ?? 0) > 0 
                      ? `${Math.round(((workflow.successfulRuns ?? 0) / (workflow.totalRuns ?? 1)) * 100)}%`
                      : "0%"
                    }
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Run</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#46a1a0]">
                    {formatDate(workflow.lastRun)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasks Created</CardTitle>
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#46a1a0]">
                    {(workflowTasks as EnhancedTask[]).length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="flow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Workflow Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Trigger */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#46a1a0] text-white font-semibold">
                      T
                    </div>
                    <Card className="flex-1 border-l-4 border-l-[#46a1a0]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Trigger: {(workflow.trigger as any)?.type || "Unknown"}</CardTitle>
                        <CardDescription>
                          This workflow starts when the trigger condition is met
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Actions */}
                  {actions.map((action: any, index: number) => {
                    const ActionIcon = getActionIcon(action.type);
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-center w-8 h-8 mx-1 my-2">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-semibold">
                            {index + 1}
                          </div>
                          <Card className="flex-1">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <ActionIcon className="h-5 w-5 text-[#46a1a0]" />
                                <CardTitle className="text-lg capitalize">
                                  {action.type.replace('_', ' ')}
                                </CardTitle>
                              </div>
                              <CardDescription>
                                {action.config ? JSON.stringify(action.config) : "No configuration"}
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Executions</CardTitle>
                <CardDescription>
                  History of workflow runs and their outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(executions as WorkflowExecution[]).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No executions yet. This workflow hasn't been triggered.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(executions as WorkflowExecution[]).slice(0, 10).map((execution: WorkflowExecution) => (
                      <div key={execution.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">
                            Execution {execution.id.slice(0, 8)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(execution.startedAt)}
                          </div>
                        </div>
                        <Badge 
                          variant={execution.status === "completed" ? "default" : 
                                   execution.status === "failed" ? "destructive" : "secondary"}
                        >
                          {execution.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Executions:</span>
                      <span className="font-semibold">{workflow.totalRuns ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successful:</span>
                      <span className="font-semibold text-green-600">{workflow.successfulRuns ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="font-semibold text-red-600">{workflow.failedRuns ?? 0}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-semibold">
                        {(workflow.totalRuns ?? 0) > 0 
                          ? `${Math.round(((workflow.successfulRuns ?? 0) / (workflow.totalRuns ?? 1)) * 100)}%`
                          : "0%"
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Created Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {(workflowTasks as EnhancedTask[]).length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No tasks created yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(workflowTasks as EnhancedTask[]).slice(0, 5).map((task: EnhancedTask) => (
                        <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="truncate">
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(task.createdAt)}
                            </div>
                          </div>
                          <Badge variant="outline">{task.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {actionAnalytics && actionAnalytics.length > 0 && (
              <div className="space-y-4">
                {actionAnalytics.map((analytics: any) => {
                  if (analytics.actionType === 'send_email') {
                    const totalSent = analytics.emailsSent || 0;
                    const delivered = analytics.emailsDelivered || 0;
                    const opened = analytics.emailsOpened || 0;
                    const clicked = analytics.emailsClicked || 0;
                    const replied = analytics.emailsReplied || 0;
                    const bounced = analytics.emailsBounced || 0;
                    const unsubscribed = analytics.emailsUnsubscribed || 0;
                    const accepted = analytics.emailsAccepted || 0;
                    const rejected = analytics.emailsRejected || 0;
                    const complained = analytics.emailsComplained || 0;

                    return (
                      <Card key={analytics.id}>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-[#00C9C6]" />
                            <CardTitle>Email Analytics</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Total Sent:</span>
                              <span className="font-semibold">{totalSent}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Delivered %:</span>
                              <span className="font-semibold text-green-600">
                                {totalSent > 0 ? `${Math.round((delivered / totalSent) * 100)}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Open %:</span>
                              <span className="font-semibold text-blue-600">
                                {delivered > 0 ? `${Math.round((opened / delivered) * 100)}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Clicked:</span>
                              <span className="font-semibold">{clicked}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Replied %:</span>
                              <span className="font-semibold text-purple-600">
                                {delivered > 0 ? `${Math.round((replied / delivered) * 100)}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Bounced %:</span>
                              <span className="font-semibold text-orange-600">
                                {totalSent > 0 ? `${Math.round((bounced / totalSent) * 100)}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Unsubscribed %:</span>
                              <span className="font-semibold text-red-600">
                                {delivered > 0 ? `${Math.round((unsubscribed / delivered) * 100)}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Accepted %:</span>
                              <span className="font-semibold text-green-600">
                                {totalSent > 0 ? `${Math.round((accepted / totalSent) * 100)}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Rejected %:</span>
                              <span className="font-semibold text-red-600">
                                {totalSent > 0 ? `${Math.round((rejected / totalSent) * 100)}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Complained %:</span>
                              <span className="font-semibold text-red-600">
                                {delivered > 0 ? `${Math.round((complained / delivered) * 100)}%` : '0%'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  if (analytics.actionType === 'send_sms') {
                    const totalSent = analytics.smsSent || 0;
                    const delivered = analytics.smsDelivered || 0;
                    const clicked = analytics.smsClicked || 0;
                    const failed = analytics.smsFailed || 0;
                    const optedOut = analytics.smsOptedOut || 0;

                    return (
                      <Card key={analytics.id}>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-[#00C9C6]" />
                            <CardTitle>SMS Analytics</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Total Sent:</span>
                              <span className="font-semibold">{totalSent}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Delivered %:</span>
                              <span className="font-semibold text-green-600">
                                {totalSent > 0 ? `${Math.round((delivered / totalSent) * 100)}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Clicked %:</span>
                              <span className="font-semibold text-blue-600">
                                {delivered > 0 ? `${Math.round((clicked / delivered) * 100)}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Failed %:</span>
                              <span className="font-semibold text-red-600">
                                {totalSent > 0 ? `${Math.round((failed / totalSent) * 100)}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Opted Out %:</span>
                              <span className="font-semibold text-orange-600">
                                {delivered > 0 ? `${Math.round((optedOut / delivered) * 100)}%` : '0%'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}