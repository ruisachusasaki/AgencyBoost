import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
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
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  Timer,
  PieChart,
  BarChart,
  LineChart,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { 
  exportTimeTrackingData,
  type TimeTrackingReportData,
  type ExportFilters 
} from "@shared/utils/csvExport";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import type { Client, Campaign, Lead, Task, Invoice, ClientHealthScore } from "@shared/schema";

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
  const [healthSortField, setHealthSortField] = useState<string>("weekStartDate");
  const [healthSortOrder, setHealthSortOrder] = useState<"asc" | "desc">("desc");

  // Tasks-specific state
  const [taskReportType, setTaskReportType] = useState("time-tracking");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string[]>([]);
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const [taskPageSize, setTaskPageSize] = useState(20);
  const [taskSortField, setTaskSortField] = useState<string>("createdAt");
  const [taskSortOrder, setTaskSortOrder] = useState<"asc" | "desc">("desc");
  
  // Client breakdown specific state
  const [clientBreakdownView, setClientBreakdownView] = useState("by-user-client");
  const [userIdFilter, setUserIdFilter] = useState("all");
  
  // User authentication and role data
  const { data: currentUser } = useQuery<{ id: string; name: string; email: string; role: string }>({
    queryKey: ["/api/auth/current-user"],
  });
  
  const { data: userPermissions } = useQuery<Record<string, { canView: boolean; canEdit: boolean; canDelete: boolean; canCreate: boolean }>>(
    {
      queryKey: ["/api/user-permissions"],
    }
  );
  
  // Check if current user is admin - use server-provided role only
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'Admin';
  
  // Task-specific time period controls
  const [taskDateRange, setTaskDateRange] = useState("this-week");
  const [customTaskDateFrom, setCustomTaskDateFrom] = useState("");
  const [customTaskDateTo, setCustomTaskDateTo] = useState("");

  // Chart visualization state
  const [chartsVisible, setChartsVisible] = useState<Record<string, boolean>>({
    timeDistribution: true,
    dailyTrend: true,
    userPerformance: true,
    clientWorkload: true,
  });
  const [chartView, setChartView] = useState<"grid" | "tabs">("tabs");
  const [activeChart, setActiveChart] = useState("timeDistribution");

  // CSV Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"detailed" | "user-summary" | "client-breakdown" | "admin-summary">("detailed");
  const { toast } = useToast();

  // CSV Export Handler
  const handleCsvExport = async () => {
    if (!timeTrackingData || isExporting) return;

    // Check permissions for admin-only export formats
    if (exportFormat === 'admin-summary' && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Admin summary export is only available to administrators.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Prepare export data and filters
      const exportData: TimeTrackingReportData = {
        tasks: timeTrackingData.tasks || [],
        userSummaries: timeTrackingData.userSummaries || [],
        clientBreakdowns: timeTrackingData.clientBreakdowns || [],
        grandTotal: timeTrackingData.grandTotal || 0
      };

      const exportFilters: ExportFilters = {
        dateFrom: timeTrackingFilters.dateFrom,
        dateTo: timeTrackingFilters.dateTo,
        userId: timeTrackingFilters.userId,
        clientId: timeTrackingFilters.clientId,
        reportType: taskReportType
      };

      // Prepare clients list for detailed exports
      const clientsList = clients.map(client => ({
        id: client.id,
        name: client.name
      }));

      // Perform the export
      exportTimeTrackingData(
        exportFormat,
        exportData,
        exportFilters,
        clientsList
      );

      // Show success message
      const formatName = {
        'detailed': 'Detailed Timesheet',
        'user-summary': 'User Summary',
        'client-breakdown': 'Client Breakdown',
        'admin-summary': 'Admin Summary'
      }[exportFormat];

      toast({
        title: "Export Successful",
        description: `${formatName} has been downloaded successfully.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('CSV Export Error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An error occurred while exporting the data.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const { data: clientsData, isLoading: clientsLoading } = useQuery<{clients: Client[]}>({
    queryKey: ["/api/clients"],
  });

  const clients = clientsData?.clients || [];

  // Projects have been removed from the system
  const projects: never[] = [];
  const projectsLoading = false;

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
  
  // Time tracking data query for client breakdowns - fixed filter logic
  const timeTrackingFilters = {
    dateFrom: taskDateRange === "today" ? new Date().toISOString().split('T')[0] :
              taskDateRange === "this-week" ? (() => {
                const startOfWeek = new Date();
                const dayOfWeek = startOfWeek.getDay();
                const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                startOfWeek.setDate(startOfWeek.getDate() + diff);
                return startOfWeek.toISOString().split('T')[0];
              })() :
              taskDateRange === "this-month" ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] :
              taskDateRange === "custom" && customTaskDateFrom ? customTaskDateFrom :
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: taskDateRange === "today" ? new Date().toISOString().split('T')[0] :
            taskDateRange === "this-week" ? (() => {
              const endOfWeek = new Date();
              const dayOfWeek = endOfWeek.getDay();
              const diff = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
              endOfWeek.setDate(endOfWeek.getDate() + diff);
              return endOfWeek.toISOString().split('T')[0];
            })() :
            taskDateRange === "this-month" ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] :
            taskDateRange === "custom" && customTaskDateTo ? customTaskDateTo :
            new Date().toISOString().split('T')[0],
    userId: userIdFilter !== "all" ? userIdFilter : undefined,
    clientId: clientFilter !== "all" ? clientFilter : undefined,
    reportType: taskReportType
  };
  
  const { data: timeTrackingData, isLoading: timeTrackingLoading } = useQuery<{
    tasks: any[];
    userSummaries: Array<{
      userId: string;
      userName: string;
      userRole: string;
      totalTime: number;
      tasksWorked: number;
      dailyTotals: Record<string, number>;
    }>;
    clientBreakdowns: Array<{
      clientId: string;
      clientName: string;
      totalTime: number;
      tasksCount: number;
      users: Array<{
        userId: string;
        userName: string;
        userRole: string;
        totalTime: number;
        tasksWorked: number;
        dailyTotals: Record<string, number>;
      }>;
    }>;
    grandTotal: number;
  }>(
    {
      queryKey: ["/api/reports/time-tracking", timeTrackingFilters],
      queryFn: async ({ queryKey }) => {
        const [, filters] = queryKey;
        const response = await fetch("/api/reports/time-tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(filters)
        });
        if (!response.ok) {
          throw new Error('Failed to fetch time tracking data');
        }
        return response.json();
      },
      enabled: activeTab === "tasks" && 
               ((taskReportType === "by-user-client") || 
                (taskReportType === "admin-by-client" && isAdmin) ||
                (taskReportType === "time-tracking"))
    }
  );

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
    sort: healthSortField,
    sortOrder: healthSortOrder
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

  const isLoading = clientsLoading || campaignsLoading || leadsLoading || tasksLoading || invoicesLoading;

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
  // Projects have been removed from the system
  const filteredProjects: never[] = [];
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

  // Get task date filter based on task-specific controls
  const getTaskDateFilter = () => {
    const now = new Date();
    switch (taskDateRange) {
      case "today": {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { from: today, to: new Date() };
      }
      case "this-week": {
        const startOfWeek = new Date(now);
        const dayOfWeek = startOfWeek.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1, Sunday = 0
        startOfWeek.setDate(startOfWeek.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { from: startOfWeek, to: endOfWeek };
      }
      case "this-month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { from: startOfMonth, to: endOfMonth };
      }
      case "custom": {
        const from = customTaskDateFrom ? new Date(customTaskDateFrom) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const to = customTaskDateTo ? new Date(customTaskDateTo) : now;
        return { from, to };
      }
      default:
        return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: now };
    }
  };

  // Filter tasks by task-specific date range
  const filteredTasksByTimeRange = tasks.filter(task => {
    if (activeTab !== "tasks") return true;
    
    const { from, to } = getTaskDateFilter();
    const dateMatch = !task.createdAt || (new Date(task.createdAt) >= from && new Date(task.createdAt) <= to);
    const clientMatch = clientFilter === "all" || task.clientId === clientFilter;
    return dateMatch && clientMatch;
  });

  // Task analytics calculations - Fixed data model
  const tasksWithTimeData = filteredTasksByTimeRange.filter(task => 
    (task.timeEstimate && task.timeEstimate > 0) || (task.timeTracked && task.timeTracked > 0)
  );

  const taskAnalytics = {
    totalTasks: filteredTasksByTimeRange.length,
    tasksWithTimeTracking: tasksWithTimeData.length,
    totalEstimatedHours: tasksWithTimeData.reduce((sum, task) => sum + (task.timeEstimate || 0), 0) / 60,
    totalSpentHours: tasksWithTimeData.reduce((sum, task) => sum + (task.timeTracked || 0), 0) / 60,
    avgTimePerTask: tasksWithTimeData.length > 0 ? 
      (tasksWithTimeData.reduce((sum, task) => sum + (task.timeTracked || 0), 0) / tasksWithTimeData.length / 60).toFixed(2) : "0.00",
    tasksOverEstimate: tasksWithTimeData.filter(task => 
      task.timeTracked && task.timeEstimate && task.timeTracked > task.timeEstimate
    ).length,
    tasksUnderEstimate: tasksWithTimeData.filter(task => 
      task.timeTracked && task.timeEstimate && task.timeTracked < task.timeEstimate
    ).length,
    statusBreakdown: {
      pending: filteredTasksByTimeRange.filter(t => t.status === 'pending').length,
      in_progress: filteredTasksByTimeRange.filter(t => t.status === 'in_progress').length,
      completed: filteredTasksByTimeRange.filter(t => t.status === 'completed').length,
      blocked: filteredTasksByTimeRange.filter(t => t.status === 'blocked').length,
      cancelled: filteredTasksByTimeRange.filter(t => t.status === 'cancelled').length,
    },
    timeAccuracy: tasksWithTimeData.length > 0 ? 
      (tasksWithTimeData.filter(task => 
        task.timeTracked && task.timeEstimate && 
        Math.abs(task.timeTracked - task.timeEstimate) <= (task.timeEstimate * 0.2)
      ).length / tasksWithTimeData.length * 100).toFixed(1) : "0.0",
    topTimeConsumers: [...tasksWithTimeData]
      .sort((a, b) => (b.timeTracked || 0) - (a.timeTracked || 0))
      .slice(0, 5)
      .map(task => ({
        ...task,
        clientName: clients.find(c => c.id === task.clientId)?.name || 'Unknown Client'
      }))
  };

  // Health table sorting functions
  const handleHealthSort = (field: string) => {
    if (healthSortField === field) {
      // Toggle sort order if clicking same field
      setHealthSortOrder(healthSortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new field with default desc order
      setHealthSortField(field);
      setHealthSortOrder("desc");
    }
    // Reset to first page when sorting
    setHealthPage(1);
  };


  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors" 
      onClick={() => handleHealthSort(field)}
    >
      <div className="flex items-center justify-between">
        {children}
        <div className="flex flex-col ml-2">
          <ChevronUp 
            className={`h-3 w-3 ${
              healthSortField === field && healthSortOrder === 'asc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              healthSortField === field && healthSortOrder === 'desc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  // Helper functions for health analytics
  function calculateHealthTrend(scores: Array<ClientHealthScore & { clientName: string; clientEmail: string }>) {
    if (scores.length === 0) return { direction: 'stable', percentage: 0 };
    
    const sortedScores = [...scores].sort((a, b) => 
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

  // Chart data processing functions
  const processTimeDistributionData = (data: typeof timeTrackingData, type: 'users' | 'clients') => {
    if (!data) return [];
    
    const items = (type === 'users' ? data.userSummaries : data.clientBreakdowns) || [];
    const totalTime = data.grandTotal || 0;
    
    if (totalTime === 0) return [];
    
    // Convert to chart format
    const chartData = items.map(item => ({
      name: type === 'users' ? item.userName || 'Unknown User' : (item as any).clientName || 'Unknown Client',
      value: (item.totalTime || 0) / 3600, // Convert seconds to hours
      percentage: totalTime > 0 ? ((item.totalTime || 0) / totalTime * 100).toFixed(1) : '0.0'
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);
    
    // Group smaller items under "Other" if more than 6 items
    if (chartData.length > 6) {
      const top5 = chartData.slice(0, 5);
      const others = chartData.slice(5);
      const othersTotal = others.reduce((sum, item) => sum + item.value, 0);
      const othersPercentage = others.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
      
      return [
        ...top5,
        {
          name: 'Other',
          value: othersTotal,
          percentage: othersPercentage.toFixed(1)
        }
      ];
    }
    
    return chartData;
  };

  const processDailyTrendData = (data: typeof timeTrackingData) => {
    if (!data) return [];
    
    const dailyTotals: Record<string, number> = {};
    
    // Aggregate daily totals from all users
    data.userSummaries?.forEach(user => {
      if (user.dailyTotals) {
        Object.entries(user.dailyTotals).forEach(([date, seconds]) => {
          if (!dailyTotals[date]) dailyTotals[date] = 0;
          dailyTotals[date] += seconds || 0;
        });
      }
    });
    
    // Convert to chart format
    return Object.entries(dailyTotals)
      .map(([date, seconds]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString(),
        hours: (seconds / 3600).toFixed(2),
        value: Number((seconds / 3600).toFixed(2))
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processUserPerformanceData = (data: typeof timeTrackingData) => {
    if (!data?.userSummaries) return [];
    
    return data.userSummaries
      .filter(user => user.totalTime > 0)
      .map(user => ({
        name: user.userName || 'Unknown User',
        hours: Number((user.totalTime / 3600).toFixed(2)),
        tasks: user.tasksWorked || 0,
        role: user.userRole || 'Unknown'
      }))
      .sort((a, b) => b.hours - a.hours);
  };

  const processClientWorkloadData = (data: typeof timeTrackingData) => {
    if (!data?.clientBreakdowns) return [];
    
    return data.clientBreakdowns
      .filter(client => client.totalTime > 0)
      .map(client => ({
        name: client.clientName || 'Unknown Client',
        hours: Number((client.totalTime / 3600).toFixed(2)),
        tasks: client.tasksCount || 0,
        users: client.users?.length || 0
      }))
      .sort((a, b) => b.hours - a.hours);
  };

  // Helper function to toggle chart visibility
  const toggleChart = (chartKey: string) => {
    setChartsVisible(prev => ({
      ...prev,
      [chartKey]: !prev[chartKey]
    }));
  };

  // Chart color palettes
  const CHART_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  // Custom chart components
  const TimeDistributionChart = ({ data, title, type }: { 
    data: ReturnType<typeof processTimeDistributionData>, 
    title: string,
    type: 'users' | 'clients' 
  }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-slate-500">
          <div className="text-center">
            <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No time tracking data available</p>
          </div>
        </div>
      );
    }

    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
            <p className="font-medium text-slate-900">{data.name}</p>
            <p className="text-sm text-slate-600">{data.value.toFixed(2)}h ({data.percentage}%)</p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-slate-700 text-center">{title}</h4>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percentage }) => `${name}: ${percentage}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const DailyTrendChart = ({ data }: { data: ReturnType<typeof processDailyTrendData> }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-slate-500">
          <div className="text-center">
            <LineChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No daily time tracking data available</p>
          </div>
        </div>
      );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
            <p className="font-medium text-slate-900">{data.displayDate}</p>
            <p className="text-sm text-slate-600">{data.hours} hours logged</p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-slate-700">Daily Time Trend</h4>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const UserPerformanceChart = ({ data }: { data: ReturnType<typeof processUserPerformanceData> }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-slate-500">
          <div className="text-center">
            <BarChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No user performance data available</p>
          </div>
        </div>
      );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
            <p className="font-medium text-slate-900">{data.name}</p>
            <p className="text-sm text-slate-600">{data.hours} hours logged</p>
            <p className="text-sm text-slate-600">{data.tasks} tasks worked</p>
            <p className="text-xs text-slate-500 capitalize">{data.role} role</p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-slate-700">User Performance Comparison</h4>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="hours" fill="#10B981" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const ClientWorkloadChart = ({ data }: { data: ReturnType<typeof processClientWorkloadData> }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-slate-500">
          <div className="text-center">
            <BarChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No client workload data available</p>
          </div>
        </div>
      );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
            <p className="font-medium text-slate-900">{data.name}</p>
            <p className="text-sm text-slate-600">{data.hours} hours logged</p>
            <p className="text-sm text-slate-600">{data.tasks} tasks worked</p>
            <p className="text-sm text-slate-600">{data.users} team members</p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-slate-700">Client Workload Distribution</h4>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="hours" fill="#3B82F6" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  };


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
      // Include task analytics data
      taskAnalytics: activeTab === "tasks" ? {
        ...taskAnalytics,
        reportType: taskReportType,
        tasksWithTimeTracking: tasksWithTimeData.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          timeEstimate: task.timeEstimate,
          timeTracked: task.timeTracked,
          estimatedHours: task.timeEstimate ? (task.timeEstimate / 60).toFixed(2) : null,
          actualHours: task.timeTracked ? (task.timeTracked / 60).toFixed(2) : null,
          variance: task.timeEstimate && task.timeTracked ? 
            ((task.timeTracked - task.timeEstimate) / task.timeEstimate * 100).toFixed(1) : null,
          clientName: clients.find(c => c.id === task.clientId)?.name || 'Unknown Client',
          assignedTo: task.assignedTo,
          createdAt: task.createdAt,
          dueDate: task.dueDate
        })),
        allFilteredTasks: filteredTasksByTimeRange.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          clientName: clients.find(c => c.id === task.clientId)?.name || 'Unknown Client',
          createdAt: task.createdAt,
          dueDate: task.dueDate
        }))
      } : null,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const reportTypePrefix = activeTab === "health" ? "health" : activeTab === "tasks" ? `tasks-${taskReportType}` : "business";
    a.download = `crm-${reportTypePrefix}-report-${new Date().toISOString().split('T')[0]}.json`;
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
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", name: "Business Overview", icon: BarChart3, count: null },
            { id: "health", name: "Client Health", icon: Heart, count: null },
            { id: "tasks", name: "Tasks", icon: Clock, count: null }
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
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="h-4 w-4" />
                {tab.name} {tab.count !== null ? `(${tab.count})` : ''}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
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
        </div>
      )}

      {/* Client Health Tab */}
      {activeTab === "health" && (
        <div className="space-y-6">
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
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search clients..."
                        value={healthSearchTerm}
                        onChange={(e) => setHealthSearchTerm(e.target.value)}
                        className="w-48 pl-10"
                        data-testid="input-health-search"
                      />
                    </div>
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
                      <SortableHeader field="clientName">Client</SortableHeader>
                      <SortableHeader field="weekStartDate">Week</SortableHeader>
                      <SortableHeader field="healthIndicator">Health Status</SortableHeader>
                      <SortableHeader field="averageScore">Score</SortableHeader>
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
        </div>
      )}

      {/* Tasks Tab Content */}
      {activeTab === "tasks" && (
        <div className="space-y-6">
          {/* Task Report Type Selection */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Report Type:</span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Type:</label>
                    <Select value={taskReportType} onValueChange={setTaskReportType}>
                      <SelectTrigger className="w-48" data-testid="select-task-report-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time-tracking">Time Tracking Report</SelectItem>
                        <SelectItem value="timesheet">Timesheet View</SelectItem>
                        <SelectItem value="by-user-client">By User & Client</SelectItem>
                        {isAdmin && <SelectItem value="admin-by-client">Total by Client (Admin)</SelectItem>}
                        <SelectItem value="productivity">Productivity Analysis</SelectItem>
                        <SelectItem value="workload">Workload Distribution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Time Period:</label>
                    <Select value={taskDateRange} onValueChange={setTaskDateRange}>
                      <SelectTrigger className="w-36" data-testid="select-task-date-range">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="this-week">This Week</SelectItem>
                        <SelectItem value="this-month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {taskDateRange === "custom" && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={customTaskDateFrom}
                        onChange={(e) => setCustomTaskDateFrom(e.target.value)}
                        className="w-32"
                        data-testid="input-custom-date-from"
                      />
                      <span className="text-sm text-slate-500">to</span>
                      <Input
                        type="date"
                        value={customTaskDateTo}
                        onChange={(e) => setCustomTaskDateTo(e.target.value)}
                        className="w-32"
                        data-testid="input-custom-date-to"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Client:</label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger className="w-48" data-testid="select-client-filter">
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
                  {(taskReportType === "by-user-client" || taskReportType === "admin-by-client") && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-600">User:</label>
                      <Select value={userIdFilter} onValueChange={setUserIdFilter}>
                        <SelectTrigger className="w-48" data-testid="select-user-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          {/* Note: Would need staff/users query here, using sample for now */}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* CSV Export Controls */}
                  {(taskReportType === "by-user-client" || taskReportType === "admin-by-client" || taskReportType === "time-tracking") && (
                    <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Export Format:</label>
                        <Select value={exportFormat} onValueChange={(value: "detailed" | "user-summary" | "client-breakdown" | "admin-summary") => setExportFormat(value)}>
                          <SelectTrigger className="w-44" data-testid="select-export-format">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="detailed">Detailed Timesheet</SelectItem>
                            <SelectItem value="user-summary">User Summary</SelectItem>
                            <SelectItem value="client-breakdown">Client Breakdown</SelectItem>
                            {isAdmin && <SelectItem value="admin-summary">Admin Summary</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleCsvExport}
                        disabled={isExporting || !timeTrackingData}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                        data-testid="button-export-csv"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Export CSV
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Chart Visualization Interface */}
          {(taskReportType === "by-user-client" || taskReportType === "admin-by-client") && timeTrackingData && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Visual Analytics</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Chart View Toggle */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-600">Layout:</label>
                      <Select value={chartView} onValueChange={(value: "grid" | "tabs") => setChartView(value)}>
                        <SelectTrigger className="w-28" data-testid="select-chart-view">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tabs">Tabs</SelectItem>
                          <SelectItem value="grid">Grid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Chart Visibility Controls */}
                    <div className="flex items-center gap-2">
                      {Object.entries(chartsVisible).map(([key, visible]) => (
                        <Button
                          key={key}
                          variant={visible ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleChart(key)}
                          className="text-xs"
                          data-testid={`button-toggle-${key}-chart`}
                        >
                          {visible ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                          {key === 'timeDistribution' ? 'Distribution' :
                           key === 'dailyTrend' ? 'Daily Trend' :
                           key === 'userPerformance' ? 'Users' : 'Clients'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {timeTrackingLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
                        <div className="h-64 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {chartView === "tabs" ? (
                      /* Tab-based Chart Layout */
                      <div className="space-y-6">
                        {/* Chart Navigation */}
                        <div className="border-b border-slate-200">
                          <nav className="-mb-px flex space-x-8">
                            {[
                              { id: "timeDistribution", name: "Time Distribution", icon: PieChart },
                              { id: "dailyTrend", name: "Daily Trend", icon: LineChart },
                              { id: "userPerformance", name: "User Performance", icon: BarChart },
                              { id: "clientWorkload", name: "Client Workload", icon: BarChart3 }
                            ].filter(chart => chartsVisible[chart.id]).map((chart) => {
                              const Icon = chart.icon;
                              return (
                                <button
                                  key={chart.id}
                                  onClick={() => setActiveChart(chart.id)}
                                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                    activeChart === chart.id
                                      ? "border-primary text-primary"
                                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                  }`}
                                  data-testid={`tab-chart-${chart.id}`}
                                >
                                  <Icon className="h-4 w-4" />
                                  {chart.name}
                                </button>
                              );
                            })}
                          </nav>
                        </div>

                        {/* Active Chart Content */}
                        <div className="min-h-[400px]">
                          {activeChart === "timeDistribution" && chartsVisible.timeDistribution && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <TimeDistributionChart 
                                data={processTimeDistributionData(timeTrackingData, 'users')}
                                title="Time Distribution by User"
                                type="users"
                              />
                              <TimeDistributionChart 
                                data={processTimeDistributionData(timeTrackingData, 'clients')}
                                title="Time Distribution by Client"
                                type="clients"
                              />
                            </div>
                          )}

                          {activeChart === "dailyTrend" && chartsVisible.dailyTrend && (
                            <DailyTrendChart data={processDailyTrendData(timeTrackingData)} />
                          )}

                          {activeChart === "userPerformance" && chartsVisible.userPerformance && (
                            <UserPerformanceChart data={processUserPerformanceData(timeTrackingData)} />
                          )}

                          {activeChart === "clientWorkload" && chartsVisible.clientWorkload && (
                            <ClientWorkloadChart data={processClientWorkloadData(timeTrackingData)} />
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Grid-based Chart Layout */
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {chartsVisible.timeDistribution && (
                          <Card className="p-4">
                            <TimeDistributionChart 
                              data={processTimeDistributionData(timeTrackingData, 'users')}
                              title="Time Distribution by User"
                              type="users"
                            />
                          </Card>
                        )}
                        
                        {chartsVisible.timeDistribution && (
                          <Card className="p-4">
                            <TimeDistributionChart 
                              data={processTimeDistributionData(timeTrackingData, 'clients')}
                              title="Time Distribution by Client"
                              type="clients"
                            />
                          </Card>
                        )}

                        {chartsVisible.dailyTrend && (
                          <Card className="p-4 lg:col-span-2">
                            <DailyTrendChart data={processDailyTrendData(timeTrackingData)} />
                          </Card>
                        )}

                        {chartsVisible.userPerformance && (
                          <Card className="p-4">
                            <UserPerformanceChart data={processUserPerformanceData(timeTrackingData)} />
                          </Card>
                        )}

                        {chartsVisible.clientWorkload && (
                          <Card className="p-4">
                            <ClientWorkloadChart data={processClientWorkloadData(timeTrackingData)} />
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* By User & Client View */}
          {taskReportType === "by-user-client" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Time by User & Client</h3>
                  <div className="text-sm text-slate-500">
                    Total: {timeTrackingData ? (timeTrackingData.grandTotal / 3600).toFixed(2) : '0.00'} hours
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {timeTrackingLoading ? (
                  <div className="p-8 text-center text-slate-500">
                    <div className="animate-pulse">
                      <p>Loading time tracking data...</p>
                    </div>
                  </div>
                ) : !timeTrackingData || !timeTrackingData.clientBreakdowns || timeTrackingData.clientBreakdowns.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium mb-2">No Time Data</p>
                    <p className="text-sm">No time entries found for the selected period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[180px]">Client</TableHead>
                          <TableHead className="min-w-[150px]">User</TableHead>
                          <TableHead className="min-w-[100px]">Role</TableHead>
                          <TableHead className="text-right min-w-[100px]">Hours</TableHead>
                          <TableHead className="text-right min-w-[80px]">Tasks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(timeTrackingData?.clientBreakdowns || []).map((clientData, clientIndex) => 
                          (clientData?.users || []).map((user, userIndex) => (
                            <TableRow key={`${clientData.clientId}-${user.userId}`} data-testid={`row-user-client-${clientIndex}-${userIndex}`}>
                              <TableCell>
                                <div className="font-medium text-slate-900" data-testid={`text-client-${clientIndex}-${userIndex}`}>
                                  {clientData.clientName}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-slate-900" data-testid={`text-user-${clientIndex}-${userIndex}`}>
                                  {user.userName}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {user.userRole}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono" data-testid={`text-hours-${clientIndex}-${userIndex}`}>
                                {(user.totalTime / 3600).toFixed(2)}h
                              </TableCell>
                              <TableCell className="text-right" data-testid={`text-tasks-${clientIndex}-${userIndex}`}>
                                {user.tasksWorked}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                        {/* Client Totals */}
                        {(timeTrackingData?.clientBreakdowns || []).map((clientData, index) => (
                          <TableRow key={`total-${clientData.clientId}`} className="border-t-2 border-slate-200 bg-slate-50">
                            <TableCell className="font-semibold" data-testid={`text-client-total-${index}`}>
                              {clientData.clientName} Total
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">
                              {clientData.users.length} user{clientData.users.length !== 1 ? 's' : ''}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-mono font-semibold" data-testid={`text-client-hours-${index}`}>
                              {(clientData.totalTime / 3600).toFixed(2)}h
                            </TableCell>
                            <TableCell className="text-right font-semibold" data-testid={`text-client-tasks-${index}`}>
                              {clientData.tasksCount}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Grand Total */}
                        <TableRow className="border-t-2 border-slate-300 bg-slate-100">
                          <TableCell className="font-bold" data-testid="text-grand-total-label">
                            Grand Total
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {timeTrackingData?.userSummaries?.length || 0} user{(timeTrackingData?.userSummaries?.length || 0) !== 1 ? 's' : ''}
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right font-mono font-bold" data-testid="text-grand-total-hours">
                            {((timeTrackingData?.grandTotal || 0) / 3600).toFixed(2)}h
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {(timeTrackingData?.clientBreakdowns || []).reduce((sum, client) => sum + (client?.tasksCount || 0), 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Admin-Only Total by Client View - Proper Access Control */}
          {taskReportType === "admin-by-client" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">Total by Client (Admin)</h3>
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      Admin Only
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-500">
                    Total: {timeTrackingData ? (timeTrackingData.grandTotal / 3600).toFixed(2) : '0.00'} hours
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!isAdmin ? (
                  <div className="p-8 text-center text-slate-500" data-testid="admin-access-denied">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="text-2xl">🔒</div>
                    </div>
                    <p className="text-lg font-medium mb-2">Access Restricted</p>
                    <p className="text-sm">This view is only available to administrators</p>
                  </div>
                ) : timeTrackingLoading ? (
                  <div className="p-8 text-center text-slate-500">
                    <div className="animate-pulse">
                      <p>Loading client totals...</p>
                    </div>
                  </div>
                ) : !timeTrackingData || !timeTrackingData.clientBreakdowns || timeTrackingData.clientBreakdowns.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium mb-2">No Time Data</p>
                    <p className="text-sm">No time entries found for the selected period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Client</TableHead>
                          <TableHead className="text-right min-w-[120px]">Total Hours</TableHead>
                          <TableHead className="text-right min-w-[100px]">Total Tasks</TableHead>
                          <TableHead className="text-right min-w-[100px]">Users</TableHead>
                          <TableHead className="text-right min-w-[120px]">Avg Hours/Task</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(timeTrackingData?.clientBreakdowns || [])
                          .sort((a, b) => (b?.totalTime || 0) - (a?.totalTime || 0))
                          .map((clientData, index) => {
                            const avgHoursPerTask = (clientData?.tasksCount || 0) > 0 ? ((clientData?.totalTime || 0) / 3600) / (clientData?.tasksCount || 1) : 0;
                            return (
                              <TableRow key={clientData.clientId} data-testid={`row-admin-client-${index}`}>
                                <TableCell>
                                  <div className="font-medium text-slate-900" data-testid={`text-admin-client-${index}`}>
                                    {clientData?.clientName || 'Unknown Client'}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {(clientData?.users || []).map(u => u?.userName || 'Unknown User').join(', ')}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono font-semibold" data-testid={`text-admin-hours-${index}`}>
                                  {((clientData?.totalTime || 0) / 3600).toFixed(2)}h
                                </TableCell>
                                <TableCell className="text-right font-semibold" data-testid={`text-admin-tasks-${index}`}>
                                  {clientData?.tasksCount || 0}
                                </TableCell>
                                <TableCell className="text-right" data-testid={`text-admin-users-${index}`}>
                                  {clientData?.users?.length || 0}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm" data-testid={`text-admin-avg-${index}`}>
                                  {avgHoursPerTask.toFixed(2)}h
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        {/* Grand Total Row */}
                        <TableRow className="border-t-2 border-slate-300 bg-slate-100">
                          <TableCell className="font-bold" data-testid="text-admin-grand-total-label">
                            Grand Total
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold" data-testid="text-admin-grand-total-hours">
                            {((timeTrackingData?.grandTotal || 0) / 3600).toFixed(2)}h
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {(timeTrackingData?.clientBreakdowns || []).reduce((sum, client) => sum + (client?.tasksCount || 0), 0)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {timeTrackingData?.userSummaries?.length || 0}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {(timeTrackingData?.clientBreakdowns?.length || 0) > 0 ? 
                              ((timeTrackingData?.grandTotal || 0) / 3600 / Math.max(1, (timeTrackingData?.clientBreakdowns || []).reduce((sum, client) => sum + (client?.tasksCount || 0), 0))).toFixed(2) 
                              : '0.00'}h
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ClickUp-style Timesheet View */}
          {taskReportType === "timesheet" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Timesheet View</h3>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="by-user-client">
                      <SelectTrigger className="w-48" data-testid="select-timesheet-view">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="by-user-client">By User & Client</SelectItem>
                        <SelectItem value="admin-by-client">Admin - Total by Client</SelectItem>
                        <SelectItem value="detailed-entries">Detailed Time Entries</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {(() => {
                  // Generate date range for columns
                  const { from, to } = getTaskDateFilter();
                  const dateRange = [];
                  const currentDate = new Date(from);
                  
                  while (currentDate <= to) {
                    dateRange.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                  }
                  
                  // Filter tasks for the timesheet - include tasks with timeEntries or timeTracked
                  const timesheetTasks = filteredTasksByTimeRange.filter(task => {
                    const hasTimeTracked = task.timeTracked && task.timeTracked > 0;
                    const hasTimeEntries = Array.isArray(task.timeEntries) && task.timeEntries.length > 0;
                    return hasTimeTracked || hasTimeEntries;
                  });
                  
                  if (timesheetTasks.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-500">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-lg font-medium mb-2">No Time Entries</p>
                        <p className="text-sm">No tasks with time tracking found for the selected period</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px] sticky left-0 bg-white border-r border-slate-200 z-10">
                              Task
                            </TableHead>
                            {dateRange.map((date) => (
                              <TableHead key={date.toISOString()} className="text-center min-w-[100px] border-r border-slate-200">
                                <div className="text-xs font-medium">
                                  {date.toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric' 
                                  })}
                                </div>
                              </TableHead>
                            ))}
                            <TableHead className="text-center min-w-[80px] bg-slate-50 font-semibold">
                              Total
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {timesheetTasks.map((task, taskIndex) => {
                            const taskTotalMinutes = task.timeTracked || 0;
                            const taskTotalHours = (taskTotalMinutes / 60).toFixed(2);
                            const clientName = clients.find(c => c.id === task.clientId)?.name || 'Unknown Client';
                            
                            return (
                              <TableRow key={task.id} data-testid={`timesheet-row-${taskIndex}`}>
                                <TableCell className="sticky left-0 bg-white border-r border-slate-200 z-10">
                                  <div className="space-y-1">
                                    <p className="font-medium text-slate-900 text-sm" data-testid={`task-title-${taskIndex}`}>
                                      {task.title}
                                    </p>
                                    <p className="text-xs text-slate-500">{clientName}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Badge variant="outline" className={`
                                        ${task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                          task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          task.status === 'pending' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                          'bg-red-50 text-red-700 border-red-200'}
                                      `}>
                                        {task.status}
                                      </Badge>
                                      {task.priority && (
                                        <Badge variant="outline" className={`
                                          ${task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                            task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            'bg-green-50 text-green-700 border-green-200'}
                                        `}>
                                          {task.priority}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                {dateRange.map((date) => {
                                  // Use actual timeEntries to get per-day values
                                  const timeEntries = Array.isArray(task.timeEntries) ? task.timeEntries : [];
                                  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                                  
                                  // Find time entries for this specific date
                                  const dayEntries = timeEntries.filter((entry: any) => {
                                    if (entry.date) {
                                      const entryDate = new Date(entry.date).toISOString().split('T')[0];
                                      return entryDate === dateString;
                                    }
                                    return false;
                                  });
                                  
                                  // Sum up time for this day
                                  const dailyTimeMinutes = dayEntries.reduce((sum: number, entry: any) => {
                                    return sum + (entry.duration || entry.minutes || 0);
                                  }, 0);
                                  
                                  return (
                                    <TableCell key={`${task.id}-${date.toISOString()}`} className="text-center border-r border-slate-200">
                                      {dailyTimeMinutes > 0 && (
                                        <div className="space-y-1">
                                          <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                            {(dailyTimeMinutes / 60).toFixed(1)}h
                                          </div>
                                          <div className="text-xs text-slate-400">
                                            {dailyTimeMinutes}m
                                          </div>
                                          {dayEntries.length > 1 && (
                                            <div className="text-xs text-slate-400">
                                              {dayEntries.length} entries
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center bg-slate-50 font-semibold" data-testid={`task-total-${taskIndex}`}>
                                  <div className="space-y-1">
                                    <div className="text-sm font-semibold text-slate-900">
                                      {taskTotalHours}h
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {taskTotalMinutes}m
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {/* Totals Row */}
                          <TableRow className="border-t-2 border-slate-300 bg-slate-50">
                            <TableCell className="sticky left-0 bg-slate-100 border-r border-slate-200 z-10 font-semibold">
                              Daily Totals
                            </TableCell>
                            {dateRange.map((date) => {
                              const dateString = date.toISOString().split('T')[0];
                              
                              const dailyTotal = timesheetTasks.reduce((sum, task) => {
                                const timeEntries = Array.isArray(task.timeEntries) ? task.timeEntries : [];
                                const dayEntries = timeEntries.filter((entry: any) => {
                                  if (entry.date) {
                                    const entryDate = new Date(entry.date).toISOString().split('T')[0];
                                    return entryDate === dateString;
                                  }
                                  return false;
                                });
                                
                                const dailyTimeMinutes = dayEntries.reduce((entrySum: number, entry: any) => {
                                  return entrySum + (entry.duration || entry.minutes || 0);
                                }, 0);
                                
                                return sum + dailyTimeMinutes;
                              }, 0);
                              
                              return (
                                <TableCell key={`total-${date.toISOString()}`} className="text-center border-r border-slate-200 font-semibold bg-slate-100">
                                  {dailyTotal > 0 && (
                                    <div className="space-y-1">
                                      <div className="text-sm font-semibold text-slate-700">
                                        {(dailyTotal / 60).toFixed(1)}h
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {dailyTotal.toFixed(0)}m
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center bg-slate-200 font-bold">
                              <div className="space-y-1">
                                <div className="text-sm font-bold text-slate-900">
                                  {(timesheetTasks.reduce((sum, task) => sum + (task.timeTracked || 0), 0) / 60).toFixed(2)}h
                                </div>
                                <div className="text-xs text-slate-600">
                                  Grand Total
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
          
          {/* Time Tracking Report Content */}
          {taskReportType === "time-tracking" && (
            <div className="space-y-6">
              {timeTrackingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-slate-500">Loading time tracking data...</div>
                </div>
              ) : (
                <>
                  {/* Time Tracking Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="shadow-sm border border-slate-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-600">Total Tasks</p>
                            <p className="text-3xl font-bold text-slate-900">{timeTrackingData?.data?.tasks?.length || 0}</p>
                            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {timeTrackingData?.data?.tasks?.filter(t => t.timeTracked > 0)?.length || 0} with time data
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Target className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                <Card className="shadow-sm border border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Estimated Hours</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {taskAnalytics.totalEstimatedHours.toFixed(1)}h
                        </p>
                        <p className="text-sm text-indigo-600 mt-1 flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          Planned time
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Timer className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Actual Hours</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {timeTrackingData?.data?.grandTotal ? (timeTrackingData.data.grandTotal / 60).toFixed(1) : '0.0'}h
                        </p>
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Time logged
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Time Accuracy</p>
                        <p className="text-3xl font-bold text-slate-900">{taskAnalytics.timeAccuracy}%</p>
                        <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Within 20% estimate
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Time Tracking Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm border border-slate-200">
                  <CardHeader className="border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Estimation Accuracy</h3>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Over Estimate</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            {taskAnalytics.tasksOverEstimate}
                          </Badge>
                          <span className="text-sm text-slate-500">tasks</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Under Estimate</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            {taskAnalytics.tasksUnderEstimate}
                          </Badge>
                          <span className="text-sm text-slate-500">tasks</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Average Time per Task</span>
                        <span className="text-sm font-medium text-slate-900">
                          {taskAnalytics.avgTimePerTask}h
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-slate-200">
                  <CardHeader className="border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Task Status Breakdown</h3>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {Object.entries(taskAnalytics.statusBreakdown).map(([status, count]) => (
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
              </div>

              {/* Top Time Consuming Tasks */}
              <Card className="shadow-sm border border-slate-200">
                <CardHeader className="border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Top Time Consuming Tasks</h3>
                </CardHeader>
                <CardContent className="p-0">
                  {taskAnalytics.topTimeConsumers.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-slate-500">No time tracking data available</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Estimated</TableHead>
                          <TableHead>Actual</TableHead>
                          <TableHead>Variance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taskAnalytics.topTimeConsumers.map((task, index) => {
                          const variance = task.timeEstimate && task.timeTracked ? 
                            ((task.timeTracked - task.timeEstimate) / task.timeEstimate * 100).toFixed(1) : null;
                          return (
                            <TableRow key={task.id} data-testid={`row-top-task-${index}`}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-slate-900" data-testid={`text-task-title-${index}`}>
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-xs text-slate-500 truncate max-w-xs">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-900">{task.clientName}</span>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                    task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    task.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}
                                  data-testid={`badge-task-status-${index}`}
                                >
                                  {task.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-900">
                                  {task.timeEstimate ? `${(task.timeEstimate / 60).toFixed(1)}h` : 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-900">
                                  {task.timeTracked ? `${(task.timeTracked / 60).toFixed(1)}h` : 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell>
                                {variance ? (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    parseFloat(variance) > 20 ? 'bg-red-100 text-red-700' :
                                    parseFloat(variance) < -20 ? 'bg-orange-100 text-orange-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {parseFloat(variance) > 0 ? '+' : ''}{variance}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">N/A</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              </>
            )}
            </div>
          )}

          {/* Placeholder for other report types */}
          {taskReportType === "productivity" && (
            <Card className="shadow-sm border border-slate-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Productivity Analysis</h3>
                <p className="text-slate-500">Coming soon - Detailed productivity metrics and analysis</p>
              </CardContent>
            </Card>
          )}

          {taskReportType === "workload" && (
            <Card className="shadow-sm border border-slate-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Workload Distribution</h3>
                <p className="text-slate-500">Coming soon - Team workload distribution and capacity planning</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
