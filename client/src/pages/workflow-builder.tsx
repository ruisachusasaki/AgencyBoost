import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Play, Settings, Users, Briefcase, DollarSign, Mail, Calendar, FileText, Zap, Target, Search, X } from "lucide-react";
import type { Workflow } from "@shared/schema";
import WorkflowCanvas from "@/components/workflow-canvas";
import TriggerConfigPanel from "@/components/trigger-config-panel";

export default function WorkflowBuilderPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Parse URL parameters to see if we're editing an existing workflow
  const searchParams = new URLSearchParams(window.location.search);
  const editingWorkflowId = searchParams.get('edit');
  const [showTriggerPane, setShowTriggerPane] = useState(false);
  const [showActionPane, setShowActionPane] = useState(false);
  const [triggerSearch, setTriggerSearch] = useState("");
  const [actionSearch, setActionSearch] = useState("");
  const [showTriggerConfigPane, setShowTriggerConfigPane] = useState(false);
  const [configuringTrigger, setConfiguringTrigger] = useState<{
    trigger: any;
    definition: any;
    index: number;
  } | null>(null);
  
  const [workflowData, setWorkflowData] = useState<{
    name: string;
    description: string;
    status: "draft" | "active" | "paused";
    triggers: Array<{
      type: string;
      conditions: any;
      name?: string;
    }>;
    actions: any[];
  }>({
    name: "",
    description: "",
    status: "draft",
    triggers: [],
    actions: []
  });

  // Fetch existing workflow data when editing
  const { data: existingWorkflow, isLoading: isLoadingWorkflow } = useQuery({
    queryKey: ["/api/workflows", editingWorkflowId],
    enabled: !!editingWorkflowId,
  });

  // Fetch available triggers and actions
  const { data: availableTriggers } = useQuery({
    queryKey: ["/api/automation-triggers"]
  });

  const { data: availableActions } = useQuery({
    queryKey: ["/api/automation-actions"]
  });

  // Fetch pipeline stages for trigger configuration
  const { data: pipelineStages } = useQuery({
    queryKey: ["/api/lead-pipeline-stages"]
  });

  // Populate form with existing data when editing
  useEffect(() => {
    if (existingWorkflow && editingWorkflowId) {
      const workflow = existingWorkflow as any;
      setWorkflowData({
        name: workflow.name || "",
        description: workflow.description || "",
        status: workflow.status || "draft",
        triggers: workflow.triggers || (workflow.trigger ? [workflow.trigger] : []), // Handle backward compatibility properly
        actions: workflow.actions || []
      });
    }
  }, [existingWorkflow, editingWorkflowId]);

  // Auto-save mutation (separate from manual save)
  const autoSaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/workflows/${editingWorkflowId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      // No navigation or toast for auto-save
    },
    onError: () => {
      // Silent auto-save errors
    }
  });

  // Auto-save when triggers or actions change (debounced)
  useEffect(() => {
    if (!editingWorkflowId) return; // Only auto-save when editing existing workflows
    
    const timeoutId = setTimeout(() => {
      if (workflowData.name.trim()) {
        autoSaveMutation.mutate({
          ...workflowData,
          createdBy: "9788c16a-ba2a-40cb-af7b-26d2816d6390"
        });
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [workflowData.triggers, workflowData.actions]); // Only trigger on triggers/actions changes

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
      // Stay in workflow builder instead of navigating away
      // navigate("/workflows"); // Removed auto-navigation
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
    setShowTriggerPane(true);
  };

  const handleSelectTrigger = (trigger: { type: string; name: string; category: string }) => {
    const newTrigger = {
      id: Date.now().toString(), // Add unique ID
      type: trigger.type,
      conditions: {},
      name: trigger.name
    };
    
    setWorkflowData(prev => ({
      ...prev,
      triggers: [...prev.triggers, newTrigger]
    }));
    
    setShowTriggerPane(false);
    toast({ 
      title: "Trigger Added", 
      description: `${trigger.name} trigger has been added to your workflow` 
    });
  };

  const handleAddAction = () => {
    setShowActionPane(true);
  };

  const handleSelectAction = (action: { type: string; name: string; category: string }) => {
    const newAction = {
      id: Date.now().toString(),
      type: action.type,
      name: action.name,
      settings: {}
    };
    
    setWorkflowData((prev: any) => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
    
    setShowActionPane(false);
    toast({ 
      title: "Action Added", 
      description: `${action.name} has been added to your workflow` 
    });
  };

  // Handler for configuring triggers
  const handleConfigureTrigger = (triggerIndex: number) => {
    const trigger = workflowData.triggers[triggerIndex];
    if (!trigger) return;

    // Find the trigger definition to get the config schema
    const triggerDefinition = (availableTriggers as any[])?.find((t: any) => t.type === trigger.type);
    if (!triggerDefinition) return;

    setConfiguringTrigger({
      trigger,
      definition: triggerDefinition,
      index: triggerIndex
    });
    setShowTriggerConfigPane(true);
  };

  // Handler for saving trigger configuration
  const handleSaveTriggerConfig = (updatedTrigger: any) => {
    if (configuringTrigger === null) return;

    setWorkflowData((prev: any) => {
      const newTriggers = [...prev.triggers];
      newTriggers[configuringTrigger.index] = updatedTrigger;
      return {
        ...prev,
        triggers: newTriggers
      };
    });

    setConfiguringTrigger(null);
    setShowTriggerConfigPane(false);
    toast({
      title: "Configuration Saved",
      description: "Trigger conditions have been updated"
    });
  };

  // Filter triggers and actions based on search
  const filterItems = (items: { type: string; name: string }[], searchTerm: string) => {
    if (!searchTerm.trim()) return items;
    const search = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(search) || 
      item.type.toLowerCase().includes(search)
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <div>
        <Button 
          variant="outline" 
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workflows
        </Button>
      </div>
      
      {/* Header with inline editable title */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Input
            value={workflowData.name}
            onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={isLoadingWorkflow ? "Loading..." : "Enter workflow name..."}
            disabled={isLoadingWorkflow}
            className="text-3xl font-bold tracking-tight border border-transparent hover:border-gray-300 p-2 h-auto bg-transparent hover:bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
            style={{ fontSize: '1.875rem', lineHeight: '2.25rem' }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={workflowData.status}
            onValueChange={(value: "draft" | "active" | "paused") => 
              setWorkflowData(prev => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Workflow Builder Content - Full Width */}
      <div>
        {/* Workflow Canvas - Full Width */}
        <Card className="h-[700px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Workflow Designer</CardTitle>
          </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
              <WorkflowCanvas
                workflowData={workflowData}
                onAddTrigger={handleAddTrigger}
                onAddAction={handleAddAction}
                onConfigureTrigger={handleConfigureTrigger}
                onAddCondition={() => {
                  // TODO: Implement condition adding
                  console.log('Add condition');
                }}
              />
            </CardContent>
          </Card>
      </div>

      {/* Trigger Selection Pane */}
      <Sheet open={showTriggerPane} onOpenChange={setShowTriggerPane}>
        <SheetContent side="right" className="w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Select a Trigger for Your Workflow</SheetTitle>
            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search triggers..."
                value={triggerSearch}
                onChange={(e) => setTriggerSearch(e.target.value)}
                className="pl-10 pr-10"
              />
              {triggerSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setTriggerSearch("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetHeader>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Client & Lead Management */}
            {(() => {
              const triggers = [
                { type: "client_created", name: "New client created" },
                { type: "client_status_changed", name: "Client status changed" },
                { type: "client_team_assigned", name: "Client team member assigned" },
                { type: "lead_created", name: "New lead created" },
                { type: "lead_status_changed", name: "Lead status changed" },
                { type: "lead_assigned", name: "Lead assigned to staff" },
                { type: "lead_converted", name: "Lead converted to client" },
                { type: "appointment_booked", name: "Appointment booked by lead" }
              ];
              const filteredTriggers = filterItems(triggers, triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Client & Lead Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "Client & Lead" })}
                      >
                        <div>
                          <div className="font-medium">{trigger.name}</div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              );
            })()}

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
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {/* Action Selection Pane */}
      <Sheet open={showActionPane} onOpenChange={setShowActionPane}>
        <SheetContent side="right" className="w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Select an Action for Your Workflow</SheetTitle>
            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search actions..."
                value={actionSearch}
                onChange={(e) => setActionSearch(e.target.value)}
                className="pl-10 pr-10"
              />
              {actionSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setActionSearch("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetHeader>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Communication Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "send_email", name: "Send Email" },
                  { type: "send_sms", name: "Send SMS" },
                  { type: "send_internal_notification", name: "Send Internal Notification" },
                  { type: "send_slack_message", name: "Send Slack Message" },
                  { type: "log_communication", name: "Log Communication Activity" }
                ].map((action) => (
                  <Button
                    key={action.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectAction({ ...action, category: "Communication" })}
                  >
                    <div>
                      <div className="font-medium">{action.name}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Data Management Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "create_lead", name: "Create Lead" },
                  { type: "create_task", name: "Create Task" },
                  { type: "create_project", name: "Create Project" },
                  { type: "update_client_fields", name: "Update Client Fields" },
                  { type: "update_lead_stage", name: "Update Lead Stage" },
                  { type: "update_project_status", name: "Update Project Status" },
                  { type: "add_tags", name: "Add Tags" },
                  { type: "update_custom_fields", name: "Update Custom Fields" }
                ].map((action) => (
                  <Button
                    key={action.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectAction({ ...action, category: "Data Management" })}
                  >
                    <div>
                      <div className="font-medium">{action.name}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Assignment Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "assign_contact_owner", name: "Assign Contact Owner" },
                  { type: "assign_task", name: "Assign Task" },
                  { type: "assign_lead", name: "Assign Lead" },
                  { type: "assign_team_role", name: "Assign Team Role" },
                  { type: "assign_project_manager", name: "Assign Project Manager" },
                  { type: "remove_assignment", name: "Remove Assignment" }
                ].map((action) => (
                  <Button
                    key={action.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectAction({ ...action, category: "Assignment" })}
                  >
                    <div>
                      <div className="font-medium">{action.name}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Status & Progress Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Status & Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "mark_task_complete", name: "Mark Task Complete" },
                  { type: "update_lead_score", name: "Update Lead Score" },
                  { type: "change_client_status", name: "Change Client Status" },
                  { type: "update_campaign_metrics", name: "Update Campaign Metrics" },
                  { type: "set_project_priority", name: "Set Project Priority" },
                  { type: "update_task_priority", name: "Update Task Priority" }
                ].map((action) => (
                  <Button
                    key={action.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectAction({ ...action, category: "Status & Progress" })}
                  >
                    <div>
                      <div className="font-medium">{action.name}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Calendar & Time Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-600" />
                  Calendar & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "create_appointment", name: "Create Appointment" },
                  { type: "start_timer", name: "Start Timer" },
                  { type: "stop_timer", name: "Stop Timer" },
                  { type: "create_calendar_block", name: "Create Calendar Block" },
                  { type: "send_meeting_reminder", name: "Send Meeting Reminder" },
                  { type: "reschedule_appointment", name: "Reschedule Appointment" }
                ].map((action) => (
                  <Button
                    key={action.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectAction({ ...action, category: "Calendar & Time" })}
                  >
                    <div>
                      <div className="font-medium">{action.name}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* File & Document Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  File & Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "upload_document", name: "Upload Document" },
                  { type: "generate_invoice", name: "Generate Invoice" },
                  { type: "create_folder", name: "Create Folder" },
                  { type: "send_document", name: "Send Document" },
                  { type: "archive_files", name: "Archive Files" }
                ].map((action) => (
                  <Button
                    key={action.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectAction({ ...action, category: "File & Document" })}
                  >
                    <div>
                      <div className="font-medium">{action.name}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Notification & Alert Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Notification & Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "send_followup_reminder", name: "Send Follow-up Reminder" },
                  { type: "alert_manager", name: "Alert Manager" },
                  { type: "log_activity", name: "Log Activity" },
                  { type: "send_system_alert", name: "Send System Alert" },
                  { type: "send_birthday_reminder", name: "Send Birthday Reminder" },
                  { type: "overdue_task_alert", name: "Overdue Task Alert" }
                ].map((action) => (
                  <Button
                    key={action.type}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectAction({ ...action, category: "Notification & Alert" })}
                  >
                    <div>
                      <div className="font-medium">{action.name}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {/* Trigger Configuration Sidebar */}
      <Sheet open={showTriggerConfigPane} onOpenChange={setShowTriggerConfigPane}>
        <SheetContent className="w-96 sm:max-w-96">
          <SheetHeader>
            <SheetTitle>Configure Trigger</SheetTitle>
          </SheetHeader>
          {configuringTrigger && (
            <TriggerConfigPanel
              trigger={configuringTrigger.trigger}
              triggerDefinition={configuringTrigger.definition}
              pipelineStages={pipelineStages || []}
              onSave={handleSaveTriggerConfig}
              onClose={() => setShowTriggerConfigPane(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}