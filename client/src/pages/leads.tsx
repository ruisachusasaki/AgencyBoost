import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Plus, Search, Edit, Trash2, Calendar, DollarSign, Percent, Settings, Users, Kanban } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import CustomFieldsLeadForm from "@/components/forms/custom-fields-lead-form";
import PipelineStageManager from "@/components/pipeline-stage-manager";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead, LeadPipelineStage } from "@shared/schema";

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [showStageManager, setShowStageManager] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: pipelineStages = [] } = useQuery<LeadPipelineStage[]>({
    queryKey: ["/api/lead-pipeline-stages"],
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/leads/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead deleted",
        description: "The lead has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const moveLeadStageMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) => 
      apiRequest(`/api/leads/${leadId}/stage`, "PUT", { stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead moved",
        description: "Lead has been moved to the new stage.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to move lead",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads.filter(lead =>
    !searchTerm ||
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Never";
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    return date.toLocaleDateString();
  };

  const getLeadInitials = (lead: Lead) => {
    return lead.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDeleteLead = (id: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteLeadMutation.mutate(id);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStageId = result.source.droppableId;
    const destinationStageId = result.destination.droppableId;
    const leadId = result.draggableId;

    // Only move if the stage actually changed
    if (sourceStageId !== destinationStageId) {
      moveLeadStageMutation.mutate({
        leadId,
        stageId: destinationStageId
      });
    }
  };

  // Group leads by stage for pipeline view
  const leadsByStage = pipelineStages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(lead => 
      lead.stageId === stage.id || (!lead.stageId && stage.isDefault)
    );
    return acc;
  }, {} as Record<string, Lead[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-yellow-100 text-yellow-800 border-l-yellow-500";
      case "qualified":
        return "bg-teal-100 text-teal-800 border-l-teal-500";
      case "proposal":
        return "bg-purple-100 text-purple-800 border-l-purple-500";
      case "negotiation":
        return "bg-green-100 text-green-800 border-l-green-500";
      case "won":
        return "bg-emerald-100 text-emerald-800 border-l-emerald-500";
      case "lost":
        return "bg-red-100 text-red-800 border-l-red-500";
      default:
        return "bg-gray-100 text-gray-800 border-l-gray-500";
    }
  };

  const totalPipelineValue = leads
    .filter(l => !["won", "lost"].includes(l.status))
    .reduce((sum, lead) => sum + Number(lead.value || 0), 0);

  if (showStageManager) {
    return <PipelineStageManager onClose={() => setShowStageManager(false)} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-6 bg-white border-b">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
            <p className="text-slate-600">Total Pipeline Value: ${totalPipelineValue.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowStageManager(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Pipeline
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <CustomFieldsLeadForm onSuccess={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Custom Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "pipeline", name: "Pipeline View", icon: Kanban, count: leads.length },
                { id: "list", name: "List View", icon: Users, count: leads.length }
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
                    {tab.name} {tab.count > 0 && `(${tab.count})`}
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === "pipeline" && (
          pipelineStages.length === 0 ? (
            <div className="flex items-center justify-center h-full p-6">
              <Card className="p-8">
                <div className="text-center">
                  <Kanban className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pipeline Stages</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first pipeline stage to start organizing your leads.
                  </p>
                  <Button onClick={() => setShowStageManager(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Pipeline Stage
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="p-6">
              <div className="border border-gray-200 rounded-lg bg-gray-50">
                <div className="overflow-x-auto p-4">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-6 min-w-max">
                      {pipelineStages.map((stage) => {
                        const stageLeads = leadsByStage[stage.id] || [];
                        const totalValue = stageLeads.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);
                        
                        return (
                          <Card key={stage.id} className="bg-white flex-shrink-0 w-80">
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: stage.color }}
                                />
                                {stage.name}
                                <Badge variant="secondary" className="ml-auto">
                                  {stageLeads.length}
                                </Badge>
                              </CardTitle>
                              {totalValue > 0 && (
                                <div className="flex items-center gap-1 mt-2 text-green-600 font-semibold">
                                  <DollarSign className="w-4 h-4" />
                                  <span>${totalValue.toLocaleString()}</span>
                                </div>
                              )}
                            </CardHeader>
                            <CardContent>
                              <Droppable droppableId={stage.id}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`space-y-3 min-h-[400px] ${
                                      snapshot.isDraggingOver ? "bg-blue-50 rounded-lg p-2" : ""
                                    }`}
                                  >
                                    {(leadsByStage[stage.id] || [])
                                      .filter(lead => 
                                        !searchTerm || 
                                        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
                                      )
                                      .map((lead, index) => (
                                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                          {(provided, snapshot) => (
                                            <Card
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className={`cursor-move transition-shadow ${
                                                snapshot.isDragging ? "shadow-lg rotate-1" : "hover:shadow-md"
                                              }`}
                                            >
                                              <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                  <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                      {getLeadInitials(lead)}
                                                    </div>
                                                    <div>
                                                      <h3 className="font-medium text-sm">{lead.name}</h3>
                                                      {lead.company && (
                                                        <p className="text-xs text-gray-600">{lead.company}</p>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => setEditingLead(lead)}
                                                    >
                                                      <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => handleDeleteLead(lead.id)}
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                                
                                                <div className="space-y-2 text-xs">
                                                  <div className="flex items-center gap-1 text-gray-600">
                                                    <Calendar className="w-3 h-3" />
                                                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
                                                  </div>
                                                  {lead.value && (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                      <DollarSign className="w-3 h-3" />
                                                      ${Number(lead.value).toLocaleString()}
                                                    </div>
                                                  )}
                                                  {lead.probability && (
                                                    <div className="flex items-center gap-1 text-blue-600">
                                                      <Percent className="w-3 h-3" />
                                                      {lead.probability}%
                                                    </div>
                                                  )}
                                                </div>
                                              </CardContent>
                                            </Card>
                                          )}
                                        </Draggable>
                                      ))}
                                    {provided.placeholder}
                                    {(!leadsByStage[stage.id] || leadsByStage[stage.id].length === 0) && (
                                      <div className="text-center py-8 text-gray-400">
                                        <div className="text-sm">No leads in this stage</div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Droppable>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </DragDropContext>
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === "list" && (
          <div className="space-y-4 p-6">
            <Card>
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">All Leads</h3>
                  <div className="text-sm text-slate-600">
                    {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 mb-4">
                      {searchTerm ? "No leads found matching your search." : "No leads found."}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        Add Your First Lead
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredLeads.map((lead) => (
                      <div key={lead.id} className="p-6 hover:bg-slate-50">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-slate-600">
                                {getLeadInitials(lead)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{lead.name}</h3>
                                  <p className="text-slate-600 mb-2">{lead.email}</p>
                                  {lead.company && (
                                    <p className="text-sm text-slate-500 mb-2">{lead.company}</p>
                                  )}
                                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border-l-4 ${getStatusColor(lead.status)}`}>
                                    {lead.status}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingLead(lead)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLead(lead.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {lead.value && (
                            <div>
                              <p className="text-xs text-slate-500">Potential Value</p>
                              <p className="font-semibold text-slate-900 flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${Number(lead.value).toLocaleString()}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-xs text-slate-500">Probability</p>
                            <p className="font-semibold text-slate-900 flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              {lead.probability || 0}%
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-slate-500">Last Contact</p>
                            <p className="font-semibold text-slate-900 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(lead.lastContactDate)}
                            </p>
                          </div>
                        </div>

                        {lead.notes && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-sm text-slate-600">{lead.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Lead Dialog */}
      {editingLead && (
        <Dialog open={!!editingLead} onOpenChange={() => setEditingLead(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
            </DialogHeader>
            <CustomFieldsLeadForm
              lead={editingLead}
              onSuccess={() => setEditingLead(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}