import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Play, Settings } from "lucide-react";
import type { Workflow } from "@shared/schema";

export default function WorkflowBuilderPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Parse URL parameters to see if we're editing an existing workflow
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const editingWorkflowId = searchParams.get('edit');
  
  const [workflowData, setWorkflowData] = useState<{
    name: string;
    description: string;
    status: "draft" | "active" | "paused";
    trigger: {
      type: string;
      conditions: any;
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

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingWorkflowId) {
        return await apiRequest("PATCH", `/api/workflows/${editingWorkflowId}`, data);
      } else {
        return await apiRequest("POST", "/api/workflows", data);
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
      createdBy: "user-1" // This would come from auth context in real app
    });
  };

  const handleBack = () => {
    navigate("/workflows");
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  placeholder="Enter workflow name..."
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
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Workflow Designer</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <div className="h-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 mb-4">
                    <Settings className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Workflow Canvas
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Drag and drop components to build your workflow
                  </p>
                  <Button variant="outline">
                    Add Trigger
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}