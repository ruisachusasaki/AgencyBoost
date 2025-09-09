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
import { ArrowLeft, Save, Play, Settings, Users, Briefcase, DollarSign, Mail, Calendar, FileText, Zap, Target, Search, X, Trash2, Globe, UserCircle, GraduationCap } from "lucide-react";
import type { Workflow } from "@shared/schema";
import WorkflowCanvas from "@/components/workflow-canvas";
import TriggerConfigPanel from "@/components/trigger-config-panel";
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
  
  // Parse URL parameters to see if we're editing an existing workflow
  const searchParams = new URLSearchParams(window.location.search);
  const editingWorkflowId = searchParams.get('edit');
  const [showTriggerPane, setShowTriggerPane] = useState(false);
  const [showActionPane, setShowActionPane] = useState(false);
  const [triggerSearch, setTriggerSearch] = useState("");
  const [actionSearch, setActionSearch] = useState("");
  const [configuringTrigger, setConfiguringTrigger] = useState<{
    trigger: any;
    definition: any;
    index: number;
  } | null>(null);

  // State for delete confirmation modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'trigger' | 'action';
    index: number;
    name: string;
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
      description: "Trigger conditions have been updated"
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
          
          <div className="grid grid-cols-1 gap-6">
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