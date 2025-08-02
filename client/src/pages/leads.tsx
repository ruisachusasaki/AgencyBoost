import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Calendar, DollarSign, Percent } from "lucide-react";
import LeadForm from "@/components/forms/lead-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
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

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getSourceColor = (source: string | null) => {
    if (!source) return "bg-gray-100 text-gray-800";
    
    switch (source) {
      case "website":
        return "bg-teal-100 text-teal-800";
      case "referral":
        return "bg-green-100 text-green-800";
      case "social_media":
        return "bg-purple-100 text-purple-800";
      case "advertising":
        return "bg-orange-100 text-orange-800";
      case "cold_outreach":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
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

  // Group leads by status for pipeline view
  const leadsByStatus = {
    new: leads.filter(l => l.status === "new"),
    qualified: leads.filter(l => l.status === "qualified"),
    proposal: leads.filter(l => l.status === "proposal"),
    negotiation: leads.filter(l => l.status === "negotiation"),
    won: leads.filter(l => l.status === "won"),
    lost: leads.filter(l => l.status === "lost"),
  };

  const totalPipelineValue = leads
    .filter(l => !["won", "lost"].includes(l.status))
    .reduce((sum, lead) => sum + Number(lead.value || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-5 bg-slate-200 rounded" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-600">Total Pipeline Value: ${totalPipelineValue.toLocaleString()}</p>
        </div>
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
            <LeadForm
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(leadsByStatus).map(([status, statusLeads]) => {
          if (["won", "lost"].includes(status)) return null;
          
          const stageValue = statusLeads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
          
          return (
            <Card key={status} className="border-l-4 border-l-slate-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900 capitalize">
                    {status === "new" ? "New Leads" : status}
                  </h3>
                  <span className="text-sm font-medium text-slate-600">
                    {statusLeads.length}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  ${stageValue.toLocaleString()} potential
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Add Your First Lead</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Lead</DialogTitle>
                    </DialogHeader>
                    <LeadForm
                      onSuccess={() => setIsCreateDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
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
                          {getInitials(lead.name)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 truncate">{lead.name}</h3>
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                          {lead.source && (
                            <Badge className={getSourceColor(lead.source)}>
                              {lead.source.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{lead.email}</p>
                        {lead.company && (
                          <p className="text-sm text-slate-500 mb-1">{lead.company}</p>
                        )}
                        {lead.phone && (
                          <p className="text-sm text-slate-500">{lead.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Dialog 
                        open={editingLead?.id === lead.id} 
                        onOpenChange={(open) => setEditingLead(open ? lead : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Lead</DialogTitle>
                          </DialogHeader>
                          <LeadForm
                            lead={editingLead}
                            onSuccess={() => setEditingLead(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteLead(lead.id)}
                        disabled={deleteLeadMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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
  );
}
