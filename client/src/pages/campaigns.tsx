import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Calendar, TrendingUp } from "lucide-react";
import CampaignForm from "@/components/forms/campaign-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Campaign, Client, Project } from "@shared/schema";

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign deleted",
        description: "The campaign has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredCampaigns = campaigns.filter(campaign => {
    const client = clients.find(c => c.id === campaign.clientId);
    return (
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-teal-100 text-teal-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "social_media":
        return "bg-purple-100 text-purple-800";
      case "ppc":
        return "bg-orange-100 text-orange-800";
      case "seo":
        return "bg-teal-100 text-teal-800";
      case "email":
        return "bg-green-100 text-green-800";
      case "content":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateProgress = (campaign: Campaign) => {
    if (!campaign.budget || !campaign.spent) return 0;
    return Math.min((Number(campaign.spent) / Number(campaign.budget)) * 100, 100);
  };

  const calculateCTR = (campaign: Campaign) => {
    if (!campaign.clicks || !campaign.impressions) return "0.0";
    return ((campaign.clicks / campaign.impressions) * 100).toFixed(1);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      deleteCampaignMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Campaign
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="space-y-1">
                          <div className="h-3 bg-slate-200 rounded" />
                          <div className="h-4 bg-slate-200 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="h-2 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Campaign</DialogTitle>
            </DialogHeader>
            <CampaignForm
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-slate-600">
              {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">
                {searchTerm ? "No campaigns found matching your search." : "No campaigns found."}
              </p>
              {!searchTerm && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Create Your First Campaign</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Campaign</DialogTitle>
                    </DialogHeader>
                    <CampaignForm
                      onSuccess={() => setIsCreateDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="p-6 hover:bg-slate-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 truncate">{campaign.name}</h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <Badge className={getTypeColor(campaign.type)}>
                          {campaign.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        Client: {getClientName(campaign.clientId)}
                      </p>
                      {campaign.projectId && (
                        <p className="text-sm text-slate-500 mb-1">
                          Project: {getProjectName(campaign.projectId)}
                        </p>
                      )}
                      {campaign.description && (
                        <p className="text-sm text-slate-500 line-clamp-2">{campaign.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Dialog 
                        open={editingCampaign?.id === campaign.id} 
                        onOpenChange={(open) => setEditingCampaign(open ? campaign : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Campaign</DialogTitle>
                          </DialogHeader>
                          <CampaignForm
                            campaign={editingCampaign}
                            onSuccess={() => setEditingCampaign(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        disabled={deleteCampaignMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Budget</p>
                      <p className="font-semibold text-slate-900">
                        ${Number(campaign.budget || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Spent</p>
                      <p className="font-semibold text-slate-900">
                        ${Number(campaign.spent || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Impressions</p>
                      <p className="font-semibold text-slate-900">
                        {(campaign.impressions || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">CTR</p>
                      <p className="font-semibold text-slate-900 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {calculateCTR(campaign)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Start Date</p>
                      <p className="font-semibold text-slate-900 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(campaign.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">End Date</p>
                      <p className="font-semibold text-slate-900 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(campaign.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Budget Progress</span>
                      <span className="text-sm font-medium text-slate-900">
                        {calculateProgress(campaign).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={calculateProgress(campaign)} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
