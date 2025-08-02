import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Lead } from "@shared/schema";

export default function LeadsPipeline() {
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const leadStages = [
    { 
      name: "New Leads", 
      status: "new", 
      color: "border-yellow-500",
      leads: leads.filter(l => l.status === "new")
    },
    { 
      name: "Qualified", 
      status: "qualified", 
      color: "border-blue-500",
      leads: leads.filter(l => l.status === "qualified")
    },
    { 
      name: "Proposal", 
      status: "proposal", 
      color: "border-purple-500",
      leads: leads.filter(l => l.status === "proposal")
    },
    { 
      name: "Negotiation", 
      status: "negotiation", 
      color: "border-green-500",
      leads: leads.filter(l => l.status === "negotiation")
    }
  ];

  const totalPipelineValue = leads.reduce((sum, lead) => {
    return sum + Number(lead.value || 0);
  }, 0);

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Leads Pipeline</h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="border-l-4 border-slate-200 pl-4">
                  <div className="h-5 bg-slate-200 rounded mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
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
        <h3 className="text-lg font-semibold text-slate-900">Leads Pipeline</h3>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {leadStages.map((stage) => {
            const stageValue = stage.leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
            
            return (
              <div key={stage.status} className={`border-l-4 ${stage.color} pl-4`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900">{stage.name}</h4>
                  <span className="text-sm font-medium text-slate-600">
                    {stage.leads.length}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  ${stageValue.toLocaleString()} potential
                </p>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">Total Pipeline</span>
            <span className="font-bold text-primary">
              ${totalPipelineValue.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
