import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FolderOpen, DollarSign, UserPlus, TrendingUp, TrendingDown } from "lucide-react";
import type { Client, Project, Lead, Invoice } from "@shared/schema";

export default function MetricsCards() {
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const activeProjects = projects.filter(p => p.status === "active").length;
  const newLeads = leads.filter(l => l.status === "new").length;
  
  const currentMonth = new Date().getMonth();
  const monthlyRevenue = invoices
    .filter(i => i.paidDate && new Date(i.paidDate).getMonth() === currentMonth)
    .reduce((sum, i) => sum + Number(i.total || 0), 0);

  const metrics = [
    {
      title: "Total Clients",
      value: clients.length.toString(),
      change: "+12% from last month",
      changeType: "positive" as const,
      icon: Users,
      bgColor: "bg-teal-100",
      iconColor: "text-teal-600"
    },
    {
      title: "Active Projects", 
      value: activeProjects.toString(),
      change: "+3 this week",
      changeType: "positive" as const,
      icon: FolderOpen,
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Monthly Revenue",
      value: `$${monthlyRevenue.toLocaleString()}`,
      change: "-2% from last month",
      changeType: "negative" as const,
      icon: DollarSign,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600"
    },
    {
      title: "New Leads",
      value: newLeads.toString(),
      change: "+8 this week",
      changeType: "positive" as const,
      icon: UserPlus,
      bgColor: "bg-purple-100", 
      iconColor: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const ChangeIcon = metric.changeType === "positive" ? TrendingUp : TrendingDown;
        
        return (
          <Card key={metric.title} className="shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                  <p className={`text-sm mt-1 flex items-center gap-1 ${
                    metric.changeType === "positive" ? "text-green-600" : "text-red-600"
                  }`}>
                    <ChangeIcon className="h-3 w-3" />
                    {metric.change}
                  </p>
                </div>
                <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${metric.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
