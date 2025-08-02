import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FolderOpen, 
  DollarSign, 
  Calendar,
  Download,
  Filter
} from "lucide-react";
import type { Client, Project, Campaign, Lead, Task, Invoice } from "@shared/schema";

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [clientFilter, setClientFilter] = useState("all");

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const isLoading = clientsLoading || projectsLoading || campaignsLoading || leadsLoading || tasksLoading || invoicesLoading;

  // Calculate date filter
  const getDateFilter = () => {
    const now = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(now.getDate() - parseInt(dateRange));
    return daysAgo;
  };

  // Filter data by date range and client
  const filterData = <T extends { createdAt?: Date | null; clientId?: string | null }>(data: T[]) => {
    const dateFilter = getDateFilter();
    return data.filter(item => {
      const dateMatch = !item.createdAt || new Date(item.createdAt) >= dateFilter;
      const clientMatch = clientFilter === "all" || item.clientId === clientFilter;
      return dateMatch && clientMatch;
    });
  };

  const filteredClients = filterData(clients);
  const filteredProjects = filterData(projects);
  const filteredCampaigns = filterData(campaigns);
  const filteredLeads = filterData(leads);
  const filteredTasks = tasks.filter(task => {
    const dateFilter = getDateFilter();
    const dateMatch = !task.createdAt || new Date(task.createdAt) >= dateFilter;
    const clientMatch = clientFilter === "all" || task.clientId === clientFilter;
    return dateMatch && clientMatch;
  });
  const filteredInvoices = filterData(invoices);

  // Calculate metrics
  const metrics = {
    totalRevenue: filteredInvoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + Number(i.total || 0), 0),
    
    outstandingInvoices: filteredInvoices
      .filter(i => i.status === "sent" || i.status === "overdue")
      .reduce((sum, i) => sum + Number(i.total || 0), 0),
    
    activeProjects: filteredProjects.filter(p => p.status === "active").length,
    
    completedProjects: filteredProjects.filter(p => p.status === "completed").length,
    
    completedTasks: filteredTasks.filter(t => t.status === "completed").length,
    
    pendingTasks: filteredTasks.filter(t => t.status === "pending").length,
    
    newLeads: filteredLeads.filter(l => l.status === "new").length,
    
    wonLeads: filteredLeads.filter(l => l.status === "won").length,
    
    activeCampaigns: filteredCampaigns.filter(c => c.status === "active").length,
    
    campaignSpend: filteredCampaigns.reduce((sum, c) => sum + Number(c.spent || 0), 0),
    
    campaignImpressions: filteredCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0),
    
    campaignClicks: filteredCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0),
  };

  // Calculate conversion rates and trends
  const conversionRate = metrics.campaignImpressions > 0 
    ? ((metrics.campaignClicks / metrics.campaignImpressions) * 100).toFixed(2)
    : "0.00";

  const leadConversionRate = filteredLeads.length > 0
    ? ((metrics.wonLeads / filteredLeads.length) * 100).toFixed(1)
    : "0.0";

  const taskCompletionRate = filteredTasks.length > 0
    ? ((metrics.completedTasks / filteredTasks.length) * 100).toFixed(1)
    : "0.0";

  // Project status breakdown
  const projectStatusBreakdown = {
    planning: filteredProjects.filter(p => p.status === "planning").length,
    active: filteredProjects.filter(p => p.status === "active").length,
    completed: filteredProjects.filter(p => p.status === "completed").length,
    on_hold: filteredProjects.filter(p => p.status === "on_hold").length,
    cancelled: filteredProjects.filter(p => p.status === "cancelled").length,
  };

  // Lead status breakdown  
  const leadStatusBreakdown = {
    new: filteredLeads.filter(l => l.status === "new").length,
    qualified: filteredLeads.filter(l => l.status === "qualified").length,
    proposal: filteredLeads.filter(l => l.status === "proposal").length,
    negotiation: filteredLeads.filter(l => l.status === "negotiation").length,
    won: filteredLeads.filter(l => l.status === "won").length,
    lost: filteredLeads.filter(l => l.status === "lost").length,
  };

  // Top clients by revenue
  const clientRevenue = filteredInvoices
    .filter(i => i.status === "paid")
    .reduce((acc, invoice) => {
      const clientId = invoice.clientId;
      acc[clientId] = (acc[clientId] || 0) + Number(invoice.total || 0);
      return acc;
    }, {} as Record<string, number>);

  const topClients = Object.entries(clientRevenue)
    .map(([clientId, revenue]) => ({
      client: clients.find(c => c.id === clientId),
      revenue
    }))
    .filter(item => item.client)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const handleExportReport = () => {
    const reportData = {
      dateRange,
      clientFilter: clientFilter === "all" ? "All Clients" : clients.find(c => c.id === clientFilter)?.name,
      metrics,
      projectStatusBreakdown,
      leadStatusBreakdown,
      topClients: topClients.map(tc => ({
        client: tc.client?.name,
        revenue: tc.revenue
      })),
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-8 bg-slate-200 rounded" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
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
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <Button onClick={handleExportReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Filters:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Date Range:</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Client:</label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900">
                  ${metrics.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  From paid invoices
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Outstanding</p>
                <p className="text-3xl font-bold text-slate-900">
                  ${metrics.outstandingInvoices.toLocaleString()}
                </p>
                <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Pending payment
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Projects</p>
                <p className="text-3xl font-bold text-slate-900">{metrics.activeProjects}</p>
                <p className="text-sm text-teal-600 mt-1 flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />
                  In progress
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">New Leads</p>
                <p className="text-3xl font-bold text-slate-900">{metrics.newLeads}</p>
                <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  To be qualified
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Conversion Rates</h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Campaign CTR</span>
                  <span className="text-sm font-medium text-slate-900">{conversionRate}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-teal-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(parseFloat(conversionRate), 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Lead Conversion</span>
                  <span className="text-sm font-medium text-slate-900">{leadConversionRate}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(parseFloat(leadConversionRate), 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Task Completion</span>
                  <span className="text-sm font-medium text-slate-900">{taskCompletionRate}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(parseFloat(taskCompletionRate), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Project Status</h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Object.entries(projectStatusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 capitalize">
                    {status.replace('_', ' ')}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Lead Pipeline</h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Object.entries(leadStatusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 capitalize">{status}</span>
                  <Badge variant="outline" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Campaign Performance</h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{metrics.activeCampaigns}</p>
                <p className="text-sm text-slate-600">Active Campaigns</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  ${metrics.campaignSpend.toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">Total Spend</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">
                  {metrics.campaignImpressions.toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">Impressions</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">
                  {metrics.campaignClicks.toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Top Clients by Revenue</h3>
          </CardHeader>
          <CardContent className="p-6">
            {topClients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No revenue data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topClients.map((item, index) => (
                  <div key={item.client?.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-600">
                          {index + 1}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900">
                        {item.client?.name}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      ${item.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Summary Statistics</h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{filteredClients.length}</p>
              <p className="text-sm text-slate-600">Total Clients</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{filteredProjects.length}</p>
              <p className="text-sm text-slate-600">Total Projects</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{filteredCampaigns.length}</p>
              <p className="text-sm text-slate-600">Total Campaigns</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{filteredLeads.length}</p>
              <p className="text-sm text-slate-600">Total Leads</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{filteredTasks.length}</p>
              <p className="text-sm text-slate-600">Total Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{filteredInvoices.length}</p>
              <p className="text-sm text-slate-600">Total Invoices</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
