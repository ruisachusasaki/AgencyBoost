import { useState, useEffect, useRef, useCallback } from "react";
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
import { useRolePermissions } from "@/hooks/use-has-permission";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Play, Settings, Users, Briefcase, DollarSign, Mail, Calendar, FileText, Zap, Target, Search, X, Trash2, Globe, UserCircle, GraduationCap, GitBranch, ArrowRight, Hash, MessageSquare, CheckSquare, Tag, Clock, Phone, BellRing, Plus, TrendingUp, AlertCircle, BookOpen, Trophy, BarChart3, UserCheck } from "lucide-react";
import type { Workflow } from "@shared/schema";
import WorkflowCanvas from "@/components/workflow-canvas";
import TriggerConfigPanel from "@/components/trigger-config-panel";
import ActionConfigPanel from "@/components/action-config-panel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function WorkflowBuilderPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user for permission check
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/current-user'],
  });
  
  // Use role-based permission hook for consistent permission checks
  const { canManageWorkflowTemplates } = useRolePermissions();
  
  // Parse URL parameters to see if we're editing an existing workflow
  const searchParams = new URLSearchParams(window.location.search);
  const editingWorkflowId = searchParams.get('edit');
  const folderIdFromUrl = searchParams.get('folder');
  const [showTriggerPane, setShowTriggerPane] = useState(false);
  const [showActionPane, setShowActionPane] = useState(false);
  const [triggerSearch, setTriggerSearch] = useState("");
  const [actionSearch, setActionSearch] = useState("");
  const [configuringTrigger, setConfiguringTrigger] = useState<{
    trigger: any;
    definition: any;
    index: number;
  } | null>(null);
  
  const [configuringAction, setConfiguringAction] = useState<{
    action: any;
    definition: any;
    index: number;
  } | null>(null);

  // State for delete confirmation modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'trigger' | 'action';
    index: number;
    name: string;
  } | null>(null);

  // Local saving state to prevent race conditions
  const [isSaving, setIsSaving] = useState(false);

  
  const [workflowData, setWorkflowData] = useState<{
    name: string;
    description: string;
    status: "draft" | "active" | "paused";
    triggers: Array<{
      type: string;
      conditions: any;
      name?: string;
      customName?: string;
    }>;
    actions: Array<{
      type: string;
      settings: any;
      name?: string;
      customName?: string;
    }>;
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
    queryFn: async () => {
      const response = await fetch(`/api/workflows/${editingWorkflowId}`);
      if (!response.ok) throw new Error('Failed to fetch workflow');
      return response.json();
    },
    enabled: !!editingWorkflowId,
  });

  // Fetch available triggers and actions
  const { data: availableTriggers } = useQuery({
    queryKey: ["/api/automation-triggers"]
  });


  const { data: availableActions } = useQuery({
    queryKey: ["/api/automation-actions"]
  });

  // Group actions by category
  const getIconForCategory = (category: string) => {
    const iconMap: { [key: string]: any } = {
      communication: Mail,
      data_management: FileText,
      assignment: Users,
      status_progress: Target,
      financial_billing: DollarSign,
      calendar_scheduling: Calendar,
      knowledge_training: GraduationCap,
      notification_alert: Zap,
      internal: Settings,
      integration: Globe,
      hr_management: UserCircle
    };
    return iconMap[category] || FileText;
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryNames: { [key: string]: string } = {
      communication: 'Communication',
      data_management: 'Data Management',
      assignment: 'Assignment',
      status_progress: 'Status & Progress',
      financial_billing: 'Financial & Billing',
      calendar_scheduling: 'Calendar & Scheduling',
      knowledge_training: 'Knowledge & Training',
      notification_alert: 'Notification & Alert',
      internal: 'Internal Control',
      calendar_time: 'Calendar & Time',
      file_document: 'File & Document',
      integration: 'Integration',
      hr_management: 'HR Management'
    };
    return categoryNames[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      communication: 'text-blue-600',
      data_management: 'text-green-600',
      assignment: 'text-purple-600',
      status_progress: 'text-orange-600',
      financial_billing: 'text-emerald-600',
      calendar_scheduling: 'text-red-600',
      knowledge_training: 'text-indigo-600',
      notification_alert: 'text-yellow-600',
      internal: 'text-gray-600',
      calendar_time: 'text-red-600',
      file_document: 'text-indigo-600',
      integration: 'text-teal-600',
      hr_management: 'text-rose-600'
    };
    return colorMap[category] || 'text-gray-600';
  };

  // Group available actions by category
  const groupedActions = (availableActions as any[])?.reduce((groups: any, action: any) => {
    const category = action.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(action);
    return groups;
  }, {}) || {};

  // Filter actions based on search
  const filteredGroupedActions = Object.entries(groupedActions).reduce((filtered: any, [category, actions]: [string, any[]]) => {
    const filteredActions = actions.filter((action: any) => 
      action.name.toLowerCase().includes(actionSearch.toLowerCase()) ||
      action.description?.toLowerCase().includes(actionSearch.toLowerCase())
    );
    if (filteredActions.length > 0) {
      filtered[category] = filteredActions;
    }
    return filtered;
  }, {});

  // Track whether we've done the initial population from server data
  const initialPopulationDone = useRef(false);
  const lastAutoSaveJson = useRef<string>("");

  // Populate form with existing data when editing (only on first load)
  useEffect(() => {
    if (existingWorkflow && editingWorkflowId && !initialPopulationDone.current) {
      const workflow = existingWorkflow as any;
      const newData = {
        name: workflow.name || "",
        description: workflow.description || "",
        status: workflow.status || "draft",
        triggers: workflow.triggers || (workflow.trigger ? [workflow.trigger] : []),
        actions: workflow.actions || []
      };
      setWorkflowData(newData);
      lastAutoSaveJson.current = JSON.stringify({ triggers: newData.triggers, actions: newData.actions });
      initialPopulationDone.current = true;
    }
  }, [existingWorkflow, editingWorkflowId]);

  // Auto-save mutation (separate from manual save)
  const autoSaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/workflows/${editingWorkflowId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      // Don't invalidate queries here - it causes an infinite loop:
      // invalidate → refetch → setWorkflowData (new refs) → auto-save → repeat
    },
    onError: () => {
      // Silent auto-save errors
    }
  });

  // Auto-save when triggers or actions change (debounced, with value comparison)
  useEffect(() => {
    if (!editingWorkflowId) return;
    if (!initialPopulationDone.current) return;

    const currentJson = JSON.stringify({ triggers: workflowData.triggers, actions: workflowData.actions });
    if (currentJson === lastAutoSaveJson.current) return;

    const timeoutId = setTimeout(() => {
      if (workflowData.name.trim()) {
        lastAutoSaveJson.current = currentJson;
        autoSaveMutation.mutate({
          ...workflowData
        });
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [workflowData.triggers, workflowData.actions]);

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
    onSuccess: (data) => {
      setIsSaving(false); // Reset local saving state
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        variant: "default", 
        description: editingWorkflowId ? "Workflow updated successfully" : "Workflow created successfully" 
      });
      
      // If this was a creation (no editingWorkflowId), update URL to edit mode
      if (!editingWorkflowId && data?.id) {
        const newUrl = `/workflows/build?edit=${data.id}`;
        window.history.replaceState(null, '', newUrl);
      }
      
      // Stay in workflow builder instead of navigating away
      // navigate("/workflows"); // Removed auto-navigation
    },
    onError: () => {
      setIsSaving(false); // Reset local saving state
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: editingWorkflowId ? "Failed to update workflow" : "Failed to create workflow" 
      });
    }
  });

  const handleSave = () => {
    // Prevent double submissions with immediate local state check
    if (isSaving || createWorkflowMutation.isPending) {
      return;
    }

    if (!workflowData.name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Workflow name is required" });
      return;
    }
    
    // Set local saving state immediately to prevent race condition
    setIsSaving(true);
    
    createWorkflowMutation.mutate({
      ...workflowData,
      ...(folderIdFromUrl && !editingWorkflowId ? { folderId: folderIdFromUrl } : {})
    });
  };

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/workflows/${editingWorkflowId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        variant: "default", 
        description: "Workflow deleted successfully" 
      });
      navigate("/workflows");
    },
    onError: () => {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to delete workflow" 
      });
    }
  });

  // Save as template mutation
  const saveAsTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/workflows/${editingWorkflowId}/save-as-template`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-templates"] });
      toast({
        title: "Success",
        variant: "default", 
        description: `"${workflowData.name}" has been saved as a template` 
      });
    },
    onError: () => {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to save workflow as template" 
      });
    }
  });

  const handleBack = () => {
    navigate("/workflows");
  };

  // Check if user can save workflows as templates
  const canSaveAsTemplate = () => canManageWorkflowTemplates;

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
      variant: "default", 
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
    
    // Check if this action type needs configuration
    const needsConfiguration = [
      'send_email', 'send_sms', 'assign_contact_owner', 'assign_lead', 
      'assign_task', 'update_lead_stage', 'create_task', 'add_tags',
      'send_internal_notification'
    ].includes(action.type);
    
    if (needsConfiguration) {
      // Open configuration immediately after adding
      const actionIndex = workflowData.actions.length; // New action will be at this index
      const actionDefinition = (availableActions as any[])?.find((a: any) => a.type === action.type);
      
      setTimeout(() => {
        setConfiguringAction({
          action: newAction,
          definition: actionDefinition,
          index: actionIndex
        });
      }, 100); // Small delay to allow state update
      
      toast({
        title: "Action Added",
        variant: "default", 
        description: `${action.name} has been added. Please configure its settings.` 
      });
    } else {
      toast({
        title: "Action Added",
        variant: "default", 
        description: `${action.name} has been added to your workflow` 
      });
    }
  };

  // Handler for configuring triggers
  const handleConfigureTrigger = (triggerIndex: number) => {
    const trigger = workflowData.triggers[triggerIndex];
    if (!trigger) {
      console.error('No trigger found at index:', triggerIndex);
      return;
    }

    // Find the trigger definition to get the config schema
    const triggerDefinition = (availableTriggers as any[])?.find((t: any) => t.type === trigger.type);
    if (!triggerDefinition) {
      console.error('No trigger definition found for type:', trigger.type);
      console.log('Available trigger types:', Array.isArray(availableTriggers) ? availableTriggers.map((t: any) => t.type) : []);
      toast({
        title: "Configuration Error",
        description: `Trigger type "${trigger.type}" is not supported for configuration.`,
        variant: "destructive"
      });
      return;
    }
    
    console.log('Setting up trigger config for:', trigger.type);
    setConfiguringTrigger({
      trigger,
      definition: triggerDefinition,
      index: triggerIndex
    });
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
    toast({
      title: "Configuration Saved",
      variant: "default",
      description: "Trigger conditions have been updated"
    });
  };

  // Handler for configuring actions
  const handleConfigureAction = (actionIndex: number) => {
    const action = workflowData.actions[actionIndex];
    if (!action) {
      console.error('No action found at index:', actionIndex);
      return;
    }

    // Find the action definition to get the config schema
    const actionDefinition = (availableActions as any[])?.find((a: any) => a.type === action.type);
    
    setConfiguringAction({
      action,
      definition: actionDefinition,
      index: actionIndex
    });
  };

  // Handler for saving action configuration
  const handleSaveActionConfig = (updatedAction: any) => {
    if (configuringAction === null) return;

    setWorkflowData((prev: any) => {
      const newActions = [...prev.actions];
      newActions[configuringAction.index] = updatedAction;
      return {
        ...prev,
        actions: newActions
      };
    });

    setConfiguringAction(null);
    toast({
      title: "Configuration Saved",
      variant: "default",
      description: "Action settings have been updated"
    });
  };

  // Handler for deleting triggers
  const handleDeleteTrigger = (triggerIndex: number) => {
    const trigger = workflowData.triggers[triggerIndex];
    if (!trigger) return;

    setDeleteConfirmation({
      type: 'trigger',
      index: triggerIndex,
      name: trigger.name || 'Unnamed Trigger'
    });
  };

  // Handler for deleting actions
  const handleDeleteAction = (actionIndex: number) => {
    const action = workflowData.actions[actionIndex];
    if (!action) return;

    setDeleteConfirmation({
      type: 'action',
      index: actionIndex,
      name: action.name || 'Unnamed Action'
    });
  };

  // Handler for confirming deletion
  const handleConfirmDelete = () => {
    if (!deleteConfirmation) return;

    if (deleteConfirmation.type === 'trigger') {
      const updatedTriggers = workflowData.triggers.filter((_, index) => index !== deleteConfirmation.index);
      setWorkflowData(prev => ({
        ...prev,
        triggers: updatedTriggers
      }));
      
      toast({
        title: "Trigger Deleted",
        variant: "default",
        description: `"${deleteConfirmation.name}" has been removed from the workflow`
      });
    } else {
      const updatedActions = workflowData.actions.filter((_, index) => index !== deleteConfirmation.index);
      setWorkflowData(prev => ({
        ...prev,
        actions: updatedActions
      }));
      
      toast({
        title: "Action Deleted",
        variant: "default", 
        description: `"${deleteConfirmation.name}" has been removed from the workflow`
      });
    }

    setDeleteConfirmation(null);
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
          {editingWorkflowId && canSaveAsTemplate() && (
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
            variant="outline"
            onClick={() => setWorkflowData(prev => ({ ...prev, status: "active" }))}
          >
            <Play className="h-4 w-4 mr-2" />
            Activate
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || createWorkflowMutation.isPending}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-save-workflow"
          >
            <Save className="h-4 w-4 mr-2" />
            {(isSaving || createWorkflowMutation.isPending) ? "Saving..." : "Save Workflow"}
          </Button>
          {editingWorkflowId && (
            <Button 
              variant="destructive"
              onClick={() => deleteWorkflowMutation.mutate()}
              disabled={deleteWorkflowMutation.isPending}
              data-testid="button-delete-workflow"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteWorkflowMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          )}
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
                onConfigureAction={handleConfigureAction}
                onDeleteTrigger={handleDeleteTrigger}
                onDeleteAction={handleDeleteAction}
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
        <SheetContent side="right" className="w-[800px] overflow-y-auto">
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
          
          <div className="grid grid-cols-1 gap-6 mt-4">
            {/* Contact Management */}
            {(() => {
              const contactTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "contact_management") || [];
              const filteredTriggers = filterItems(contactTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Contact Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "contact_management" })}
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

            {/* Form Management */}
            {(() => {
              const formTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "form_management") || [];
              const filteredTriggers = filterItems(formTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Form Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "form_management" })}
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

            {/* Project Management */}
            {(() => {
              const projectTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "project_management") || [];
              const filteredTriggers = filterItems(projectTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                      Project Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "project_management" })}
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

            {/* Task Management */}
            {(() => {
              const taskTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "task_management") || [];
              const filteredTriggers = filterItems(taskTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Task Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "task_management" })}
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

            {/* Training Management */}
            {(() => {
              const trainingTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "training_management") || [];
              const filteredTriggers = filterItems(trainingTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      Training Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "training_management" })}
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

            {/* Knowledge Management */}
            {(() => {
              const knowledgeTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "knowledge_management") || [];
              const filteredTriggers = filterItems(knowledgeTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Knowledge Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "knowledge_management" })}
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

            {/* Lead Management */}
            {(() => {
              const leadTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "lead_management") || [];
              const filteredTriggers = filterItems(leadTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-teal-600" />
                      Lead Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "lead_management" })}
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

            {/* Campaign Management */}
            {(() => {
              const campaignTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "campaign_management") || [];
              const filteredTriggers = filterItems(campaignTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      Campaign Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "campaign_management" })}
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

            {/* Financial Management */}
            {(() => {
              const financialTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "financial_management") || [];
              const filteredTriggers = filterItems(financialTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Financial Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "financial_management" })}
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

            {/* Sales */}
            {(() => {
              const salesTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "Sales") || [];
              const filteredTriggers = filterItems(salesTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "Sales" })}
                        data-testid={`button-select-trigger-${trigger.type}`}
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

            {/* Integration */}
            {(() => {
              const integrationTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "integration") || [];
              const filteredTriggers = filterItems(integrationTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-indigo-600" />
                      Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "integration" })}
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

            {/* Client Management */}
            {(() => {
              const clientMgmtTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "Client Management") || [];
              const filteredTriggers = filterItems(clientMgmtTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-teal-600" />
                      Client Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "Client Management" })}
                        data-testid={`button-select-trigger-${trigger.type}`}
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

            {/* Calendar Management */}
            {(() => {
              const calendarTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "calendar_management") || [];
              const filteredTriggers = filterItems(calendarTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-sky-600" />
                      Calendar Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "calendar_management" })}
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

            {/* HR Management */}
            {(() => {
              const hrTriggers = (availableTriggers as any[])?.filter((t: any) => t.category === "hr_management") || [];
              const filteredTriggers = filterItems(hrTriggers.map((t: any) => ({ type: t.type, name: t.name })), triggerSearch);
              if (filteredTriggers.length === 0) return null;
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-rose-600" />
                      HR Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <Button
                        key={trigger.type}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectTrigger({ ...trigger, category: "hr_management" })}
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

          </div>
        </SheetContent>
      </Sheet>

      {/* Action Selection Pane */}
      <Sheet open={showActionPane} onOpenChange={setShowActionPane}>
        <SheetContent side="right" className="w-[800px] overflow-y-auto">
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
          
          <div className="grid grid-cols-1 gap-6 mt-4">
            {Object.entries(filteredGroupedActions).map(([category, actions]: [string, any[]]) => {
              const CategoryIcon = getIconForCategory(category);
              const categoryColor = getCategoryColor(category);
              const categoryName = getCategoryDisplayName(category);
              
              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CategoryIcon className={`h-5 w-5 ${categoryColor}`} />
                      {categoryName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {actions.map((action: any) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSelectAction({ 
                          type: action.type, 
                          name: action.name, 
                          category: categoryName 
                        })}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{action.name}</div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Show message if no actions match search or no actions available */}
            {Object.keys(filteredGroupedActions).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No actions found</p>
                <p>{actionSearch ? "Try adjusting your search terms" : "Actions are loading or not available"}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Trigger Configuration Side Panel */}
      <Sheet open={!!configuringTrigger} onOpenChange={() => setConfiguringTrigger(null)}>
        <SheetContent side="right" className="w-[800px] sm:w-[800px] sm:max-w-none overflow-y-auto">
          {configuringTrigger && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configure {configuringTrigger.definition?.name || 'Trigger'}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <TriggerConfigPanel
                  trigger={configuringTrigger.trigger}
                  triggerDefinition={configuringTrigger.definition}
                  onSave={handleSaveTriggerConfig}
                  onClose={() => setConfiguringTrigger(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Action Configuration Side Panel */}
      <Sheet open={!!configuringAction} onOpenChange={() => setConfiguringAction(null)}>
        <SheetContent side="right" className="w-[800px] sm:w-[800px] sm:max-w-none overflow-y-auto p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Configure Action</SheetTitle>
          </SheetHeader>
          {configuringAction && (
            <ActionConfigPanel
              action={configuringAction.action}
              actionDefinition={configuringAction.definition}
              workflowTriggers={workflowData.triggers}
              onSave={handleSaveActionConfig}
              onClose={() => setConfiguringAction(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete {deleteConfirmation?.type === 'trigger' ? 'Trigger' : 'Action'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmation?.name}"? This action cannot be undone and will permanently remove this {deleteConfirmation?.type} from your workflow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
