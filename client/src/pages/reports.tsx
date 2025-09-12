import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FolderOpen, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  Heart,
  Activity,
  Target,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { Client, Project, Campaign, Lead, Task, Invoice, ClientHealthScore } from "@shared/schema";

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [clientFilter, setClientFilter] = useState("all");
  
  // Health-specific state
  const [activeTab, setActiveTab] = useState("overview");
  const [healthStatusFilter, setHealthStatusFilter] = useState<string[]>([]);
  const [healthSearchTerm, setHealthSearchTerm] = useState("");
  const [healthPage, setHealthPage] = useState(1);
  const [healthPageSize, setHealthPageSize] = useState(20);
  const [showLatestOnly, setShowLatestOnly] = useState(false);

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

  // Health scores data fetching
  const healthFilters = {
    from: dateRange === "7" ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
          dateRange === "30" ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
          dateRange === "90" ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
          dateRange === "365" ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
    to: new Date().toISOString().split('T')[0],
    statuses: healthStatusFilter.length > 0 ? healthStatusFilter : [],
    search: healthSearchTerm || undefined,
    clientId: clientFilter !== "all" ? clientFilter : undefined,
    latestPerClient: showLatestOnly,
    page: healthPage,
    limit: healthPageSize,
    sort: "weekStartDate",
    sortOrder: "desc" as const
  };

  const { data: healthScoresData, isLoading: healthScoresLoading } = useQuery<{
    items: Array<ClientHealthScore & { clientName: string; clientEmail: string }>;
    total: number;
    page: number;
    limit: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }>({
    queryKey: ["/api/health-scores", healthFilters],
    enabled: activeTab === "health", // Only fetch when health tab is active
  });

  const healthScores = healthScoresData?.items || [];
  const healthPagination = healthScoresData?.pagination;

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

  // Health analytics calculations
  const healthAnalytics = {
    totalScores: healthScores.length,
    avgHealthScore: healthScores.length > 0 ? 
      (healthScores.reduce((sum, score) => sum + Number(score.averageScore || 0), 0) / healthScores.length).toFixed(2) : "0.00",
    healthDistribution: {
      Green: healthScores.filter(h => h.healthIndicator === 'Green').length,
      Yellow: healthScores.filter(h => h.healthIndicator === 'Yellow').length,  
      Red: healthScores.filter(h => h.healthIndicator === 'Red').length,
    },
    uniqueClients: new Set(healthScores.map(h => h.clientId)).size,
    recentTrend: calculateHealthTrend(healthScores),
    topPerformingClients: calculateTopHealthClients(healthScores, clients),
    atRiskClients: healthScores.filter(h => h.healthIndicator === 'Red').slice(0, 5)
  };

  // Helper functions for health analytics
  function calculateHealthTrend(scores: Array<ClientHealthScore & { clientName: string; clientEmail: string }>) {
    if (scores.length === 0) return { direction: 'stable', percentage: 0 };
    
    const sortedScores = scores.sort((a, b) => 
      new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
    );
    
    const recent = sortedScores.slice(0, Math.floor(scores.length / 2));
    const older = sortedScores.slice(Math.floor(scores.length / 2));
    
    if (recent.length === 0 || older.length === 0) return { direction: 'stable', percentage: 0 };
    
    const recentAvg = recent.reduce((sum, score) => sum + Number(score.averageScore || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, score) => sum + Number(score.averageScore || 0), 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    const direction = change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable';
    
    return { direction, percentage: Math.abs(change).toFixed(1) };
  }

  function calculateTopHealthClients(scores: Array<ClientHealthScore & { clientName: string; clientEmail: string }>, clientsList: Client[]) {
    const clientScores = scores.reduce((acc, score) => {
      if (!acc[score.clientId]) {
        acc[score.clientId] = {
          clientName: score.clientName,
          scores: [],
          avgScore: 0
        };
      }
      acc[score.clientId].scores.push(Number(score.averageScore || 0));
      return acc;
    }, {} as Record<string, { clientName: string; scores: number[]; avgScore: number }>);

    return Object.entries(clientScores)
      .map(([clientId, data]) => ({
        clientId,
        clientName: data.clientName,
        avgScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
        scoreCount: data.scores.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);
  }

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
      // Include health analytics data
      healthAnalytics: activeTab === "health" ? {
        ...healthAnalytics,
        healthScores: healthScores.map(score => ({
          clientName: score.clientName,
          clientEmail: score.clientEmail,
          weekStartDate: score.weekStartDate,
          weekEndDate: score.weekEndDate,
          healthIndicator: score.healthIndicator,
          averageScore: score.averageScore,
          totalScore: score.totalScore,
          goals: score.goals,
          fulfillment: score.fulfillment,
          relationship: score.relationship,
          clientActions: score.clientActions,
          weeklyRecap: score.weeklyRecap,
          opportunities: score.opportunities,
          solutions: score.solutions
        }))
      } : null,
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
        <Button onClick={handleExportReport} className="flex items-center gap-2" data-testid="button-export-report">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2" data-testid="tabs-main">
          <TabsTrigger value="overview" data-testid="tab-overview">Business Overview</TabsTrigger>
          <TabsTrigger value="health" data-testid="tab-health">Client Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
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
                      <SelectTrigger className="w-32" data-testid="select-date-range">
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
        </TabsContent>

        {/* Client Health Tab */}
        <TabsContent value="health" className="space-y-6 mt-6">
          {/* Health Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Health Filters:</span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Date Range:</label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-32" data-testid="select-health-date-range">
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
                      <SelectTrigger className="w-48" data-testid="select-health-client">
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
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Health Status:</label>
                    <Select 
                      value={healthStatusFilter.length === 1 ? healthStatusFilter[0] : healthStatusFilter.length > 1 ? "multiple" : "all"} 
                      onValueChange={(value) => {
                        if (value === "all") {
                          setHealthStatusFilter([]);
                        } else if (value === "multiple") {
                          // Handle multiple selection UI if needed
                        } else {
                          setHealthStatusFilter([value]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-32" data-testid="select-health-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Green">Green</SelectItem>
                        <SelectItem value="Yellow">Yellow</SelectItem>
                        <SelectItem value="Red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search clients..."
                      value={healthSearchTerm}
                      onChange={(e) => setHealthSearchTerm(e.target.value)}
                      className="w-48"
                      data-testid="input-health-search"
                    />
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Latest Only:</label>
                    <Button
                      variant={showLatestOnly ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowLatestOnly(!showLatestOnly)}
                      data-testid="button-latest-only"
                    >
                      {showLatestOnly ? "Yes" : "No"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Health Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Scores</p>
                    <p className="text-3xl font-bold text-slate-900" data-testid="text-total-scores">
                      {healthAnalytics.totalScores}
                    </p>
                    <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Health entries
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Avg Health Score</p>
                    <p className="text-3xl font-bold text-slate-900" data-testid="text-avg-health">
                      {healthAnalytics.avgHealthScore}
                    </p>
                    <p className={`text-sm mt-1 flex items-center gap-1 ${
                      healthAnalytics.recentTrend.direction === 'improving' ? 'text-green-600' : 
                      healthAnalytics.recentTrend.direction === 'declining' ? 'text-red-600' : 'text-slate-600'
                    }`}>
                      {healthAnalytics.recentTrend.direction === 'improving' ? <TrendingUp className="h-3 w-3" /> : 
                       healthAnalytics.recentTrend.direction === 'declining' ? <TrendingDown className="h-3 w-3" /> : 
                       <Target className="h-3 w-3" />}
                      {healthAnalytics.recentTrend.direction === 'stable' ? 'Stable' : 
                       `${healthAnalytics.recentTrend.direction === 'improving' ? '+' : '-'}${healthAnalytics.recentTrend.percentage}%`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Unique Clients</p>
                    <p className="text-3xl font-bold text-slate-900" data-testid="text-unique-clients">
                      {healthAnalytics.uniqueClients}
                    </p>
                    <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      With health data
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">At Risk Clients</p>
                    <p className="text-3xl font-bold text-slate-900" data-testid="text-at-risk">
                      {healthAnalytics.healthDistribution.Red}
                    </p>
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Need attention
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Distribution & Top Performing Clients */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border border-slate-200">
              <CardHeader className="border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Health Distribution</h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">Green (Healthy)</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200" data-testid="badge-green-count">
                      {healthAnalytics.healthDistribution.Green}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">Yellow (Warning)</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200" data-testid="badge-yellow-count">
                      {healthAnalytics.healthDistribution.Yellow}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">Red (At Risk)</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200" data-testid="badge-red-count">
                      {healthAnalytics.healthDistribution.Red}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-slate-200">
              <CardHeader className="border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Top Performing Clients</h3>
              </CardHeader>
              <CardContent className="p-6">
                {healthAnalytics.topPerformingClients.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No health data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {healthAnalytics.topPerformingClients.map((item, index) => (
                      <div key={item.clientId} className="flex items-center justify-between" data-testid={`row-top-client-${index}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">
                              {item.clientName}
                            </span>
                            <p className="text-xs text-slate-500">{item.scoreCount} scores</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-900">
                            {item.avgScore.toFixed(2)}
                          </span>
                          <p className="text-xs text-slate-500">avg score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Health Scores Table */}
          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Health Score Details</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">
                    Page {healthPagination?.page || 1} of {healthPagination?.totalPages || 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setHealthPage(Math.max(1, healthPage - 1))}
                      disabled={!healthPagination?.hasPrevious}
                      data-testid="button-health-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setHealthPage(healthPage + 1)}
                      disabled={!healthPagination?.hasNext}
                      data-testid="button-health-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {healthScoresLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-pulse">
                    <p className="text-slate-500">Loading health scores...</p>
                  </div>
                </div>
              ) : healthScores.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-500">No health scores found for the selected filters</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Week</TableHead>
                      <TableHead>Health Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Goals</TableHead>
                      <TableHead>Fulfillment</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {healthScores.map((score, index) => (
                      <TableRow key={score.id} data-testid={`row-health-score-${index}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900" data-testid={`text-client-name-${index}`}>
                              {score.clientName}
                            </p>
                            <p className="text-xs text-slate-500">{score.clientEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{new Date(score.weekStartDate).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-500">
                              to {new Date(score.weekEndDate).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              score.healthIndicator === 'Green' ? 'bg-green-50 text-green-700 border-green-200' :
                              score.healthIndicator === 'Yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}
                            data-testid={`badge-health-${index}`}
                          >
                            {score.healthIndicator}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{Number(score.averageScore || 0).toFixed(2)}</p>
                            <p className="text-xs text-slate-500">{score.totalScore}/12 total</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            score.goals === 'Above' || score.goals === 'On Track' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {score.goals}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            score.fulfillment === 'Early' || score.fulfillment === 'On Time' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {score.fulfillment}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            score.relationship === 'Engaged' ? 'bg-green-100 text-green-700' : 
                            score.relationship === 'Passive' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {score.relationship}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            score.clientActions === 'Early' || score.clientActions === 'Up to Date' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {score.clientActions}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
