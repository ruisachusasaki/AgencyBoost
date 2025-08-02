import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import type { Campaign, Client } from "@shared/schema";

export default function ActiveCampaigns() {
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const activeCampaigns = campaigns
    .filter(c => c.status === "active")
    .slice(0, 2);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
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

  const getDaysRemaining = (endDate: Date | null) => {
    if (!endDate) return "No end date";
    
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Ended";
    if (diffDays === 0) return "Ends today";
    if (diffDays === 1) return "1 day left";
    return `${diffDays} days left`;
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Active Campaigns</h3>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="space-y-1">
                        <div className="h-3 bg-slate-200 rounded" />
                        <div className="h-4 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Active Campaigns</h3>
          <Link href="/campaigns">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {activeCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-4">No active campaigns found</p>
            <Link href="/campaigns">
              <Button>Create Your First Campaign</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeCampaigns.map((campaign) => (
              <div key={campaign.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{campaign.name}</h4>
                    <p className="text-sm text-slate-600">{getClientName(campaign.clientId)}</p>
                  </div>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
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
                    <p className="font-semibold text-slate-900">
                      {calculateCTR(campaign)}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Progress 
                    value={calculateProgress(campaign)} 
                    className="flex-1 h-2"
                  />
                  <span className="text-sm text-slate-600">
                    {getDaysRemaining(campaign.endDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
