import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Play, Settings, Users, Briefcase, DollarSign, Mail, Calendar, FileText, Zap, Target } from "lucide-react";
import type { Workflow } from "@shared/schema";

export default function WorkflowBuilderPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Parse URL parameters to see if we're editing an existing workflow
  const searchParams = new URLSearchParams(window.location.search);
  const editingWorkflowId = searchParams.get('edit');
  const [showTriggerDialog, setShowTriggerDialog] = useState(false);
  
  const [workflowData, setWorkflowData] = useState<{
    name: string;
    description: string;
    status: "draft" | "active" | "paused";
    trigger: {
      type: string;
      conditions: any;
      name?: string;
    };
    actions: any[];
  }>({
    name: "",
    description: "",
    status: "draft",
    trigger: {
      type: "manual",
      conditions: {}
    },
    actions: []
  });

  // Fetch existing workflow data when editing
  const { data: existingWorkflow, isLoading: isLoadingWorkflow } = useQuery({
    queryKey: ["/api/workflows", editingWorkflowId],
    enabled: !!editingWorkflowId,
  });

  // Populate form with existing data when editing
  useEffect(() => {
    if (existingWorkflow && editingWorkflowId) {
      setWorkflowData({
        name: (existingWorkflow as any).name || "",
        description: (existingWorkflow as any).description || "",
        status: (existingWorkflow as any).status || "draft",
        trigger: (existingWorkflow as any).trigger || {
          type: "manual",
          conditions: {}
        },
        actions: (existingWorkflow as any).actions || []
      });
    }
  }, [existingWorkflow, editingWorkflowId]);

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingWorkflowId) {
        const response = await apiRequest("PUT", `/api/workflows/${editingWorkflowId}`, data);
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/workflows", data);
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ 
        title: "Success", 
        description: editingWorkflowId ? "Workflow updated successfully" : "Workflow created successfully" 
      });
      navigate("/workflows");
    },
    onError: () => {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: editingWorkflowId ? "Failed to update workflow" : "Failed to create workflow" 
      });
    }
  });

  const handleSave = () => {
    if (!workflowData.name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Workflow name is required" });
      return;
    }
    
    createWorkflowMutation.mutate({
      ...workflowData,
      createdBy: "9788c16a-ba2a-40cb-af7b-26d2816d6390" // Using existing user ID (John Doe)
    });
  };

  const handleBack = () => {
    navigate("/workflows");
  };

  const handleAddTrigger = () => {
    setShowTriggerDialog(true);
  };

  const handleSelectTrigger = (trigger: { type: string; name: string; category: string }) => {
    const newTrigger = {
      type: trigger.type,
      conditions: {},
      name: trigger.name
    };
    
    setWorkflowData(prev => ({
      ...prev,
      trigger: newTrigger
    }));
    
    setShowTriggerDialog(false);
    toast({ 
      title: "Trigger Added", 
      description: `${trigger.name} trigger has been added to your workflow` 
    });
  };

  const handleAddAction = () => {
    const newAction = {
      id: Date.now().toString(),
      type: "send_email",
      name: "Send Email",
      settings: {}
    };
    
    setWorkflowData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
    
    toast({ 
      title: "Action Added", 
      description: "Email action has been added to your workflow" 
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {editingWorkflowId ? 'Edit Workflow' : 'Build New Workflow'}
            </h1>
            <p className="text-muted-foreground">
              {editingWorkflowId ? 'Modify your existing workflow' : 'Create an automated workflow for your business processes'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setWorkflowData(prev => ({ ...prev, status: "active" }))}
          >
            <Play className="h-4 w-4 mr-2" />
            Activate
          </Button>
          <Button 
            onClick={handleSave}
            disabled={createWorkflowMutation.isPending}
            className="bg-[#46a1a0] hover:bg-[#3a8a89]"
          >
            <Save className="h-4 w-4 mr-2" />
            {createWorkflowMutation.isPending ? "Saving..." : "Save Workflow"}
          </Button>
        </div>
      </div>

      {/* Workflow Builder Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Workflow Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  value={workflowData.name}
                  onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={isLoadingWorkflow ? "Loading..." : "Enter workflow name..."}
                  disabled={isLoadingWorkflow}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  value={workflowData.description}
                  onChange={(e) => setWorkflowData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this workflow does..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="workflow-status">Status</Label>
                <Select
                  value={workflowData.status}
                  onValueChange={(value: "draft" | "active" | "paused") => 
                    setWorkflowData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Canvas */}
        <div className="lg:col-span-3">
          <Card className="h-[700px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Workflow Designer</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg p-6 overflow-y-auto">
                {/* Workflow Visual Display */}
                {workflowData.trigger.name || workflowData.actions.length > 0 ? (
                  <div className="space-y-6">
                    {/* Trigger Section */}
                    {workflowData.trigger.name && (
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="font-medium text-blue-900">TRIGGER</span>
                          </div>
                          <div className="text-sm text-blue-800">{workflowData.trigger.name}</div>
                          <div className="text-xs text-blue-600 mt-1">Type: {workflowData.trigger.type}</div>
                        </div>
                        {workflowData.actions.length > 0 && (
                          <div className="text-gray-400">→</div>
                        )}
                      </div>
                    )}

                    {/* Actions Section */}
                    {workflowData.actions.length > 0 && (
                      <div className="space-y-4">
                        {workflowData.actions.map((action: any, index: number) => (
                          <div key={action.id} className="flex items-center gap-4">
                            {index > 0 && <div className="text-gray-400">→</div>}
                            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 min-w-[200px]">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="font-medium text-green-900">ACTION</span>
                              </div>
                              <div className="text-sm text-green-800">{action.name}</div>
                              <div className="text-xs text-green-600 mt-1">Type: {action.type}</div>
                            </div>
                            {index < workflowData.actions.length - 1 && (
                              <div className="text-gray-400">→</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add More Components */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <Button variant="outline" onClick={handleAddTrigger} disabled={!!workflowData.trigger.name}>
                        {workflowData.trigger.name ? "Trigger Added" : "Add Trigger"}
                      </Button>
                      <Button variant="outline" onClick={handleAddAction}>
                        Add Action
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-400 mb-4">
                        <Settings className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Workflow Canvas
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Start building your workflow by adding a trigger
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={handleAddTrigger}>
                          Add Trigger
                        </Button>
                        <Button variant="outline" onClick={handleAddAction}>
                          Add Action
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trigger Selection Dialog */}
      <Dialog open={showTriggerDialog} onOpenChange={setShowTriggerDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Trigger for Your Workflow</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client & Lead Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Client & Lead Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "client_created", name: "New client created" },
                  { type: "client_status_changed", name: "Client status changed" },
                  { type: "client_team_assigned", name: "Client team member assigned" },
                  { type: "lead_created", name: "New lead created" },
                  { type: "lead_status_changed", name: "Lead status changed" },
                  { type: "lead_assigned", name: "Lead assigned to staff" },
                  { type: "lead_converted", name: "Lead converted to client" },
                  { type: "appointment_booked", name: "Appointment booked by lead" }
                ].map((trigger) => (
                  <Button
                    key={trigger.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectTrigger({ ...trigger, category: "Client & Lead" })}
                  >
                    <div>
                      <div className="font-medium">{trigger.name}</div>
                      <div className="text-xs text-muted-foreground">{trigger.type}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Project & Task Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-green-600" />
                  Project & Task Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "project_created", name: "New project created" },
                  { type: "project_status_changed", name: "Project status changed" },
                  { type: "project_completion_reached", name: "Project completion % reached" },
                  { type: "task_created", name: "Task created/assigned" },
                  { type: "task_completed", name: "Task completed" },
                  { type: "task_overdue", name: "Task overdue" },
                  { type: "task_priority_changed", name: "Task priority changed" },
                  { type: "recurring_task_generated", name: "Recurring task generated" }
                ].map((trigger) => (
                  <Button
                    key={trigger.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectTrigger({ ...trigger, category: "Project & Task" })}
                  >
                    <div>
                      <div className="font-medium">{trigger.name}</div>
                      <div className="text-xs text-muted-foreground">{trigger.type}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Financial & Invoice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  Financial & Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "invoice_created", name: "New invoice created" },
                  { type: "payment_received", name: "Invoice payment received" },
                  { type: "invoice_overdue", name: "Invoice overdue (X days)" },
                  { type: "payment_threshold_reached", name: "Payment threshold reached" },
                  { type: "campaign_budget_exceeded", name: "Campaign budget exceeded" }
                ].map((trigger) => (
                  <Button
                    key={trigger.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectTrigger({ ...trigger, category: "Financial" })}
                  >
                    <div>
                      <div className="font-medium">{trigger.name}</div>
                      <div className="text-xs text-muted-foreground">{trigger.type}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Communication & Marketing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                  Communication & Marketing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "email_campaign_sent", name: "Email campaign sent" },
                  { type: "email_opened", name: "Email opened by recipient" },
                  { type: "email_link_clicked", name: "Email link clicked" },
                  { type: "sms_campaign_sent", name: "SMS campaign sent" },
                  { type: "form_submission", name: "Form submission received" },
                  { type: "contact_form_filled", name: "Contact form filled" }
                ].map((trigger) => (
                  <Button
                    key={trigger.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectTrigger({ ...trigger, category: "Communication" })}
                  >
                    <div>
                      <div className="font-medium">{trigger.name}</div>
                      <div className="text-xs text-muted-foreground">{trigger.type}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Calendar & Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-600" />
                  Calendar & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "appointment_scheduled", name: "Appointment scheduled" },
                  { type: "appointment_completed", name: "Appointment completed/missed" },
                  { type: "daily_schedule", name: "Daily schedule trigger" },
                  { type: "weekly_schedule", name: "Weekly schedule trigger" },
                  { type: "monthly_schedule", name: "Monthly schedule trigger" },
                  { type: "date_based", name: "Date-based trigger (X days before/after)" },
                  { type: "time_off_requested", name: "Time off request submitted" }
                ].map((trigger) => (
                  <Button
                    key={trigger.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectTrigger({ ...trigger, category: "Calendar & Time" })}
                  >
                    <div>
                      <div className="font-medium">{trigger.name}</div>
                      <div className="text-xs text-muted-foreground">{trigger.type}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Document & Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Document & Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "file_uploaded", name: "File uploaded to client/project" },
                  { type: "comment_added", name: "Comment added with @mention" },
                  { type: "knowledge_base_viewed", name: "Knowledge base article viewed" },
                  { type: "hr_application_submitted", name: "HR application submitted" },
                  { type: "data_field_changed", name: "Data field value changes" },
                  { type: "custom_field_condition", name: "Custom field conditions met" }
                ].map((trigger) => (
                  <Button
                    key={trigger.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectTrigger({ ...trigger, category: "Document & Data" })}
                  >
                    <div>
                      <div className="font-medium">{trigger.name}</div>
                      <div className="text-xs text-muted-foreground">{trigger.type}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* System & Manual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  System & Manual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "manual", name: "Manual trigger (start now)" },
                  { type: "user_login", name: "User login/activity" },
                  { type: "webhook", name: "Webhook received" },
                  { type: "api_call", name: "API call trigger" }
                ].map((trigger) => (
                  <Button
                    key={trigger.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectTrigger({ ...trigger, category: "System & Manual" })}
                  >
                    <div>
                      <div className="font-medium">{trigger.name}</div>
                      <div className="text-xs text-muted-foreground">{trigger.type}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}