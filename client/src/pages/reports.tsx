import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useBusinessTimezone, getLocalDateString, getTodayInTimezone, getStartOfWeekInTimezone, getEndOfWeekInTimezone } from "@/hooks/use-business-timezone";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FolderOpen, 
  DollarSign, 
  Calendar,
  Calendar as CalendarIcon,
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
  Bell,
  Building2,
  AlertTriangle,
  X,
  Pencil,
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
  Tooltip as RechartsTooltip,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import type { Client, Campaign, Lead, Task, ClientHealthScore } from "@shared/schema";

// Helper function to format date in local time (not UTC)
// This prevents timezone shift issues where toISOString() converts to UTC
const formatLocalDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Utility function for user-friendly time formatting
const formatDuration = (minutes: number, mode: 'friendly' | 'decimal' = 'friendly'): string => {
  if (mode === 'decimal') {
    return `${(minutes / 60).toFixed(2)}h`;
  }
  
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [clientFilter, setClientFilter] = useState("all");
  
  // Business timezone for consistent date handling across the team
  const { timezone: businessTimezone } = useBusinessTimezone();
  
  // Time display mode state
  const [timeDisplayMode, setTimeDisplayMode] = useState<'friendly' | 'decimal'>('friendly');
  
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
  
  // Detailed Staff Workload specific state
  const [workloadSearchTerm, setWorkloadSearchTerm] = useState("");
  const [workloadDepartmentFilter, setWorkloadDepartmentFilter] = useState("all");
  const [workloadRoleFilter, setWorkloadRoleFilter] = useState("all");
  const [workloadPage, setWorkloadPage] = useState(1);
  const [workloadPageSize, setWorkloadPageSize] = useState(20);
  
  // MRR Report specific state
  const [mrrSearchTerm, setMrrSearchTerm] = useState("");
  const [mrrPage, setMrrPage] = useState(1);
  const [mrrPageSize, setMrrPageSize] = useState(20);
  const [mrrSortField, setMrrSortField] = useState("mrr");
  const [mrrSortOrder, setMrrSortOrder] = useState<"asc" | "desc">("desc");
  
  // User authentication and role data
  const { data: currentUser } = useQuery<{ id: string; name: string; email: string; role: string }>({
    queryKey: ["/api/auth/current-user"],
  });
  
  const { data: userPermissions } = useQuery<Record<string, { canView: boolean; canEdit: boolean; canDelete: boolean; canCreate: boolean }>>(
    {
      queryKey: ["/api/user-permissions"],
    }
  );
  
  // Check if current user is admin or manager - use server-provided role only
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'Admin';
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'Manager';
  const canEditTimeEntries = isAdmin || isManager;
  
  // Task-specific time period controls
  const [taskDateRange, setTaskDateRange] = useState("this-week");
  const [customTaskDateFrom, setCustomTaskDateFrom] = useState("");
  const [customTaskDateTo, setCustomTaskDateTo] = useState("");
  const [customFromDate, setCustomFromDate] = useState<Date | undefined>(undefined);
  const [customToDate, setCustomToDate] = useState<Date | undefined>(undefined);
  const [fromDateOpen, setFromDateOpen] = useState(false);
  const [toDateOpen, setToDateOpen] = useState(false);

  // Time entry edit modal state
  const [editTimeModalOpen, setEditTimeModalOpen] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState<{
    userId: string;
    userName: string;
    date: string;
    entries: Array<{ id: string; taskId: string; taskTitle: string; duration: number; startTime: string; endTime?: string }>;
  } | null>(null);
  const [editedDurations, setEditedDurations] = useState<Record<string, number>>({});

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

  // Auto-filter timesheet to current user for non-admins
  useEffect(() => {
    if (currentUser && !isAdmin && taskReportType === "timesheet") {
      // Only set if not already set to a specific user
      if (userIdFilter === "all") {
        setUserIdFilter(currentUser.id);
      }
    }
  }, [currentUser, isAdmin, taskReportType, userIdFilter]);

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
        tasks: timeTrackingData?.tasks || [],
        userSummaries: timeTrackingData?.userSummaries || [],
        clientBreakdowns: timeTrackingData?.clientBreakdowns || [],
        grandTotal: timeTrackingData?.grandTotal || 0
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
        name: client.company || client.name
      }));

      // Perform the export
      exportTimeTrackingData(
        exportFormat,
        exportData,
        exportFilters,
        clientsList,
        timeDisplayMode
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
  
  // Time tracking data query for client breakdowns - fixed filter logic with memoization
  // Note: Using business timezone helpers to ensure consistent date handling across the team
  const timeTrackingFilters = useMemo(() => {
    const getLastWeekStart = () => {
      const today = new Date();
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      return getLocalDateString(lastWeekStart, businessTimezone);
    };
    const getLastWeekEnd = () => {
      const today = new Date();
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
      return getLocalDateString(lastWeekEnd, businessTimezone);
    };
    return {
    dateFrom: taskDateRange === "today" ? getTodayInTimezone(businessTimezone) :
              taskDateRange === "this-week" ? getStartOfWeekInTimezone(businessTimezone) :
              taskDateRange === "last-week" ? getLastWeekStart() :
              taskDateRange === "this-month" ? getLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1), businessTimezone) :
              (taskDateRange === "custom" || taskDateRange === "Custom Range" || taskDateRange.toLowerCase().includes("custom")) && customTaskDateFrom ? customTaskDateFrom :
              getLocalDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), businessTimezone),
    dateTo: taskDateRange === "today" ? getTodayInTimezone(businessTimezone) :
            taskDateRange === "this-week" ? getEndOfWeekInTimezone(businessTimezone) :
            taskDateRange === "last-week" ? getLastWeekEnd() :
            taskDateRange === "this-month" ? getLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), businessTimezone) :
            (taskDateRange === "custom" || taskDateRange === "Custom Range" || taskDateRange.toLowerCase().includes("custom")) && customTaskDateTo ? customTaskDateTo :
            getTodayInTimezone(businessTimezone),
    userId: userIdFilter !== "all" ? userIdFilter : undefined,
    clientId: clientFilter !== "all" ? clientFilter : undefined,
    reportType: taskReportType
  };
  }, [taskDateRange, customTaskDateFrom, customTaskDateTo, userIdFilter, clientFilter, taskReportType, businessTimezone]);
  
  // Time entry update mutation
  const updateTimeEntryMutation = useMutation({
    mutationFn: async ({ taskId, entryId, duration }: { taskId: string; entryId: string; duration: number }) => {
      const response = await fetch(`/api/reports/time-entries/${taskId}/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration }),
      });
      if (!response.ok) throw new Error("Failed to update time entry");
      return response.json();
    },
  });

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
        const result = await response.json();
        // Return the data directly, not the wrapped response
        return result.data || result;
      },
      enabled: activeTab === "tasks"
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

  // Team Workload data fetching
  const { data: teamWorkloadData, isLoading: teamWorkloadLoading } = useQuery<{
    data: {
      staffWorkload: Array<{
        staffId: string;
        staffName: string;
        staffRole: string;
        department: string;
        clientCount: number;
        clients: Array<{
          clientId: string;
          clientName: string;
          positions: Array<{
            positionId: string;
            positionLabel: string;
            assignedAt: Date;
          }>;
        }>;
      }>;
      summary: {
        totalStaff: number;
        staffWithAssignments: number;
        staffWithoutAssignments: number;
        totalAssignments: number;
        uniqueClientsWithAssignments: number;
        averageClientsPerStaff: number;
        maxClientsPerStaff: number;
        workloadDistribution: {
          '0_clients': number;
          '1_client': number;
          '2-3_clients': number;
          '4-5_clients': number;
          '6_plus_clients': number;
        };
      };
    };
  }>({
    queryKey: ["/api/reports/team-workload"],
    enabled: activeTab === "team", // Only fetch when team tab is active
  });

  // Team Workload filtering and pagination logic (at component top level to follow Hook rules)
  const filteredStaffWorkload = useMemo(() => {
    if (activeTab !== "team") return [];
    const staffData = teamWorkloadData?.data?.staffWorkload || [];
    
    return staffData.filter((staff) => {
      // Search filter
      if (workloadSearchTerm && !staff.staffName.toLowerCase().includes(workloadSearchTerm.toLowerCase())) {
        return false;
      }
      
      // Department filter
      if (workloadDepartmentFilter !== "all" && staff.department !== workloadDepartmentFilter) {
        return false;
      }
      
      // Role filter
      if (workloadRoleFilter !== "all" && staff.staffRole !== workloadRoleFilter) {
        return false;
      }
      
      return true;
    });
  }, [activeTab, teamWorkloadData?.data?.staffWorkload, workloadSearchTerm, workloadDepartmentFilter, workloadRoleFilter]);

  const workloadTotalPages = Math.ceil(filteredStaffWorkload.length / workloadPageSize);

  // Auto-adjust page when filters change (prevents showing empty page)
  useEffect(() => {
    if (workloadTotalPages === 0 && workloadPage !== 1) {
      setWorkloadPage(1);
    } else if (workloadPage > workloadTotalPages && workloadTotalPages > 0) {
      setWorkloadPage(workloadTotalPages);
    }
  }, [workloadPage, workloadTotalPages]);

  const paginatedStaffWorkload = useMemo(() => {
    if (activeTab !== "team") return [];
    const startIndex = (workloadPage - 1) * workloadPageSize;
    const endIndex = startIndex + workloadPageSize;
    return filteredStaffWorkload.slice(startIndex, endIndex);
  }, [activeTab, filteredStaffWorkload, workloadPage, workloadPageSize]);

  const isLoading = clientsLoading || campaignsLoading || leadsLoading || tasksLoading;

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

  // Calculate metrics
  const metrics = {
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

  // Top clients by revenue - removed (invoices system removed)
  const topClients: { client: Client | undefined, revenue: number }[] = [];

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
    totalEstimatedMinutes: tasksWithTimeData.reduce((sum, task) => sum + (task.timeEstimate || 0), 0),
    totalSpentMinutes: tasksWithTimeData.reduce((sum, task) => sum + (task.timeTracked || 0), 0),
    avgTimePerTask: tasksWithTimeData.length > 0 ? 
      (tasksWithTimeData.reduce((sum, task) => sum + (task.timeTracked || 0), 0) / tasksWithTimeData.length) : 0,
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
        clientName: (() => { const c = clients.find(c => c.id === task.clientId); return c?.company || c?.name || 'Unknown Client'; })()
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

  // Task table sorting functions
  const handleTaskSort = (field: string) => {
    if (taskSortField === field) {
      // Toggle sort order if clicking same field
      setTaskSortOrder(taskSortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new field with default desc order
      setTaskSortField(field);
      setTaskSortOrder("desc");
    }
  };


  // Generic sortable header component
  const SortableHeader = ({ 
    field, 
    children, 
    sortField, 
    sortOrder, 
    onSort,
    className = ""
  }: { 
    field: string; 
    children: React.ReactNode; 
    sortField: string;
    sortOrder: "asc" | "desc";
    onSort: (field: string) => void;
    className?: string;
  }) => (
    <TableHead 
      className={`cursor-pointer hover:bg-muted/50 transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center justify-between">
        {children}
        <div className="flex flex-col ml-2">
          <ChevronUp 
            className={`h-3 w-3 ${
              sortField === field && sortOrder === 'asc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              sortField === field && sortOrder === 'desc' 
                ? 'text-primary'
                : 'text-muted-foreground/40'
            }`}
          />
        </div>
      </div>
    </TableHead>
  );

  // Health-specific sortable header
  const HealthSortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <SortableHeader
      field={field}
      sortField={healthSortField}
      sortOrder={healthSortOrder}
      onSort={handleHealthSort}
    >
      {children}
    </SortableHeader>
  );

  // Task-specific sortable header  
  const TaskSortableHeader = ({ field, children, className = "" }: { field: string; children: React.ReactNode; className?: string }) => (
    <SortableHeader
      field={field}
      sortField={taskSortField}
      sortOrder={taskSortOrder}
      onSort={handleTaskSort}
      className={className}
    >
      {children}
    </SortableHeader>
  );

  // MRR table sorting functions
  const handleMrrSort = (field: string) => {
    if (mrrSortField === field) {
      // Toggle sort order if clicking same field
      setMrrSortOrder(mrrSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc order
      setMrrSortField(field);
      setMrrSortOrder('desc');
    }
    // Reset to first page when sorting
    setMrrPage(1);
  };

  // MRR-specific sortable header
  const MrrSortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <SortableHeader
      field={field}
      sortField={mrrSortField}
      sortOrder={mrrSortOrder}
      onSort={handleMrrSort}
    >
      {children}
    </SortableHeader>
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
    
    // Convert to chart format - API already returns minutes
    const chartData = items.map(item => ({
      name: type === 'users' ? item.userName || 'Unknown User' : (item as any).clientName || 'Unknown Client',
      value: item.totalTime || 0, // API returns minutes directly
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
        Object.entries(user.dailyTotals).forEach(([date, minutes]) => {
          if (!dailyTotals[date]) dailyTotals[date] = 0;
          dailyTotals[date] += minutes || 0;
        });
      }
    });
    
    // Convert to chart format - API already returns minutes
    return Object.entries(dailyTotals)
      .map(([date, minutes]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString(),
        hours: formatDuration(minutes, timeDisplayMode),
        value: minutes // API returns minutes directly
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processUserPerformanceData = (data: typeof timeTrackingData) => {
    if (!data?.userSummaries) return [];
    
    return data.userSummaries
      .filter(user => user.totalTime > 0)
      .map(user => ({
        name: user.userName || 'Unknown User',
        minutes: user.totalTime || 0, // API returns minutes directly
        tasks: user.tasksWorked || 0,
        role: user.userRole || 'Unknown'
      }))
      .sort((a, b) => b.minutes - a.minutes);
  };

  const processClientWorkloadData = (data: typeof timeTrackingData) => {
    if (!data?.clientBreakdowns) return [];
    
    return data.clientBreakdowns
      .filter(client => client.totalTime > 0)
      .map(client => ({
        name: client.clientName || 'Unknown Client',
        minutes: client.totalTime || 0, // API returns minutes directly
        tasks: client.tasksCount || 0,
        users: client.users?.length || 0
      }))
      .sort((a, b) => b.minutes - a.minutes);
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
            <p className="text-sm text-slate-600">{formatDuration(data.value, timeDisplayMode)} ({data.percentage}%)</p>
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
            <RechartsTooltip content={<CustomTooltip />} />
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
            <RechartsTooltip content={<CustomTooltip />} />
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
            <p className="text-sm text-slate-600">{formatDuration(data.minutes, timeDisplayMode)} logged</p>
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
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar dataKey="minutes" fill="#10B981" radius={[4, 4, 0, 0]}>
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
            <p className="text-sm text-slate-600">{formatDuration(data.minutes, timeDisplayMode)} logged</p>
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
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar dataKey="minutes" fill="#3B82F6" radius={[4, 4, 0, 0]}>
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
          estimatedTime: task.timeEstimate ? formatDuration(task.timeEstimate, timeDisplayMode) : null,
          actualTime: task.timeTracked ? formatDuration(task.timeTracked, timeDisplayMode) : null,
          variance: task.timeEstimate && task.timeTracked ? 
            ((task.timeTracked - task.timeEstimate) / task.timeEstimate * 100).toFixed(1) : null,
          clientName: (() => { const c = clients.find(c => c.id === task.clientId); return c?.company || c?.name || 'Unknown Client'; })(),
          assignedTo: task.assignedTo,
          createdAt: task.createdAt,
          dueDate: task.dueDate
        })),
        allFilteredTasks: filteredTasksByTimeRange.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          clientName: (() => { const c = clients.find(c => c.id === task.clientId); return c?.company || c?.name || 'Unknown Client'; })(),
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
        <div className="flex items-center gap-4">
          {/* Time Display Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <Clock className="h-4 w-4 text-slate-600" />
            <Label htmlFor="time-display-toggle" className="text-sm font-medium text-slate-700 cursor-pointer">
              Display:
            </Label>
            <span className={`text-sm ${timeDisplayMode === 'friendly' ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
              Friendly
            </span>
            <Switch
              id="time-display-toggle"
              checked={timeDisplayMode === 'decimal'}
              onCheckedChange={(checked) => setTimeDisplayMode(checked ? 'decimal' : 'friendly')}
              data-testid="switch-time-display"
            />
            <span className={`text-sm ${timeDisplayMode === 'decimal' ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
              Decimal
            </span>
          </div>
          <Button onClick={handleExportReport} className="flex items-center gap-2" data-testid="button-export-report">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <TooltipProvider delayDuration={300}>
            {[
              { id: "overview", name: "Business Overview", icon: BarChart3, count: null, description: "High-level metrics including active projects, campaigns, leads, and task completion rates across your agency" },
              { id: "health", name: "Client Health", icon: Heart, count: null, description: "Weekly health scores tracking client engagement, response times, and satisfaction indicators" },
              { id: "tasks", name: "Tasks", icon: Clock, count: null, description: "Time tracking reports showing hours logged by team members, clients, and projects with detailed breakdowns" },
              { id: "team", name: "Team Workload", icon: Users, count: null, description: "Staff assignment distribution showing how many clients each team member is managing" },
              { id: "mrr", name: "MRR Report", icon: DollarSign, count: null, description: "Monthly Recurring Revenue breakdown by client, showing retainer values and revenue distribution" },
              { id: "one-on-one", name: "1v1 Performance", icon: Target, count: null, description: "Individual performance metrics from 1-on-1 meetings, tracking KPIs and progress over time" }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
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
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{tab.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
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
                        {client.company || client.name}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            {client.company || client.name}
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
              <h3 className="text-lg font-semibold text-slate-900">Health Score Details</h3>
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
                      <HealthSortableHeader field="clientName">Client</HealthSortableHeader>
                      <HealthSortableHeader field="weekStartDate">Week</HealthSortableHeader>
                      <HealthSortableHeader field="healthIndicator">Health Status</HealthSortableHeader>
                      <HealthSortableHeader field="averageScore">Score</HealthSortableHeader>
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

          {/* Health Scores Rich Pagination */}
          {healthPagination && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Items per page:</span>
                  <Select value={healthPageSize.toString()} onValueChange={(value) => {
                    setHealthPageSize(Number(value));
                    setHealthPage(1); // Reset to first page when changing page size
                  }}>
                    <SelectTrigger className="w-20" data-testid="select-health-page-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-gray-600" data-testid="text-health-showing">
                  Showing {((healthPagination.page - 1) * healthPagination.limit) + 1} to {Math.min(healthPagination.page * healthPagination.limit, healthPagination.total)} of {healthPagination.total} health scores
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHealthPage(Math.max(1, healthPage - 1))}
                  disabled={!healthPagination.hasPrevious}
                  data-testid="button-health-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, healthPagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (healthPagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (healthPagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (healthPagination.page >= healthPagination.totalPages - 2) {
                      pageNum = healthPagination.totalPages - 4 + i;
                    } else {
                      pageNum = healthPagination.page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === healthPagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHealthPage(pageNum)}
                        className="w-8 h-8 p-0"
                        data-testid={`button-health-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHealthPage(Math.min(healthPagination.totalPages, healthPage + 1))}
                  disabled={!healthPagination.hasNext}
                  data-testid="button-health-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
                        <SelectItem value="last-week">Last Week</SelectItem>
                        <SelectItem value="this-month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {taskDateRange === "custom" && (
                    <div className="flex items-center gap-2">
                      <Popover open={fromDateOpen} onOpenChange={setFromDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[140px] justify-start text-left font-normal",
                              !customFromDate && "text-muted-foreground"
                            )}
                            data-testid="input-custom-date-from"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customFromDate ? format(customFromDate, "MMM d, yyyy") : "From date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={customFromDate}
                            onSelect={(date) => {
                              setCustomFromDate(date);
                              setCustomTaskDateFrom(date ? format(date, "yyyy-MM-dd") : "");
                              setFromDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <span className="text-sm text-slate-500">to</span>
                      <Popover open={toDateOpen} onOpenChange={setToDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[140px] justify-start text-left font-normal",
                              !customToDate && "text-muted-foreground"
                            )}
                            data-testid="input-custom-date-to"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customToDate ? format(customToDate, "MMM d, yyyy") : "To date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={customToDate}
                            onSelect={(date) => {
                              setCustomToDate(date);
                              setCustomTaskDateTo(date ? format(date, "yyyy-MM-dd") : "");
                              setToDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                            {client.company || client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Filter by User - show for timesheet view, disabled for non-admins */}
                  {taskReportType === "timesheet" && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-600">
                        {isAdmin ? 'Filter by User:' : 'Your Timesheet:'}
                      </label>
                      <Select value={userIdFilter} onValueChange={setUserIdFilter} disabled={!isAdmin}>
                        <SelectTrigger className="w-48" data-testid="select-user-filter">
                          <SelectValue placeholder="All Users" />
                        </SelectTrigger>
                        <SelectContent>
                          {isAdmin && <SelectItem value="all">All Users</SelectItem>}
                          {(timeTrackingData?.userSummaries || []).map((user) => (
                            <SelectItem key={user.userId} value={user.userId}>
                              {user.userName || 'Unknown User'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                    Total: {timeTrackingData ? formatDuration(timeTrackingData.grandTotal, timeDisplayMode) : formatDuration(0, timeDisplayMode)}
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
                                {formatDuration(user.totalTime, timeDisplayMode)}
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
                              {formatDuration(clientData.totalTime, timeDisplayMode)}
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
                            {formatDuration(timeTrackingData?.grandTotal || 0, timeDisplayMode)}
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
                    Total: {timeTrackingData ? formatDuration(timeTrackingData.grandTotal, timeDisplayMode) : formatDuration(0, timeDisplayMode)}
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
                            const avgMinutesPerTask = (clientData?.tasksCount || 0) > 0 ? (clientData?.totalTime || 0) / (clientData?.tasksCount || 1) : 0;
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
                                  {formatDuration(clientData?.totalTime || 0, timeDisplayMode)}
                                </TableCell>
                                <TableCell className="text-right font-semibold" data-testid={`text-admin-tasks-${index}`}>
                                  {clientData?.tasksCount || 0}
                                </TableCell>
                                <TableCell className="text-right" data-testid={`text-admin-users-${index}`}>
                                  {clientData?.users?.length || 0}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm" data-testid={`text-admin-avg-${index}`}>
                                  {formatDuration(avgMinutesPerTask, timeDisplayMode)}
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
                            {formatDuration(timeTrackingData?.grandTotal || 0, timeDisplayMode)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {(timeTrackingData?.clientBreakdowns || []).reduce((sum, client) => sum + (client?.tasksCount || 0), 0)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {timeTrackingData?.userSummaries?.length || 0}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {(timeTrackingData?.clientBreakdowns?.length || 0) > 0 ? 
                              formatDuration((timeTrackingData?.grandTotal || 0) / Math.max(1, (timeTrackingData?.clientBreakdowns || []).reduce((sum, client) => sum + (client?.tasksCount || 0), 0)), timeDisplayMode) 
                              : formatDuration(0, timeDisplayMode)}
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
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-slate-900">Timesheet View</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600" data-testid="text-timesheet-date-range">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {(() => {
                          // Fix timezone issue by parsing dates as local dates
                          const startParts = timeTrackingFilters.dateFrom.split('-');
                          const endParts = timeTrackingFilters.dateTo.split('-');
                          const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
                          const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
                          const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          return `${startStr}–${endStr}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {(() => {
                  // Helper function to format date in local time (not UTC)
                  const formatLocalDate = (d: Date): string => {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  };
                  
                  // Parse date string as local date (not UTC)
                  const parseLocalDate = (dateStr: string): Date => {
                    const [year, month, day] = dateStr.split('-').map(Number);
                    return new Date(year, month - 1, day);
                  };
                  
                  // Generate date range for columns from timeTrackingFilters
                  const dateRange: Date[] = [];
                  const startDate = parseLocalDate(timeTrackingFilters.dateFrom);
                  const endDate = parseLocalDate(timeTrackingFilters.dateTo);
                  const currentDate = new Date(startDate);
                  
                  while (currentDate <= endDate) {
                    dateRange.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                  }
                  
                  // Dynamic left column logic: Users vs Tasks
                  const isAllUsers = userIdFilter === "all";
                  const allUsers = timeTrackingData?.userSummaries || [];
                  const allTasks = timeTrackingData?.tasks || [];
                  
                  let rows: Array<{
                    id: string;
                    name: string;
                    subtitle?: string;
                    detail?: string;
                    dailyTotals: Record<string, number>;
                    total: number;
                  }> = [];
                  
                  if (isAllUsers) {
                    // Show users (current behavior)
                    const filteredUsers = allUsers;
                    rows = filteredUsers.map(user => ({
                      id: user.userId,
                      name: user.userName || 'Unknown User',
                      subtitle: user.userRole || 'Unknown Role', 
                      detail: `${user.tasksWorked || 0} tasks`,
                      dailyTotals: user.dailyTotals || {},
                      total: user.totalTime || 0
                    }));
                  } else {
                    // Show tasks for the selected user
                    const selectedUser = allUsers.find(user => user.userId === userIdFilter);
                    const userTasks = allTasks.filter(task => {
                      // Filter tasks that have time entries for this user
                      return task.timeEntries?.some((entry: any) => entry.userId === userIdFilter);
                    });
                    
                    rows = userTasks.map(task => {
                      // Calculate daily totals for this task by this user
                      const taskDailyTotals: Record<string, number> = {};
                      let taskTotal = 0;
                      
                      if (task.timeEntries) {
                        task.timeEntries.forEach((entry: any) => {
                          if (entry.userId === userIdFilter) {
                            const entryDate = formatLocalDate(new Date(entry.startTime));
                            const minutes = entry.duration || 0; // Assuming duration in minutes
                            taskDailyTotals[entryDate] = (taskDailyTotals[entryDate] || 0) + minutes;
                            taskTotal += minutes;
                          }
                        });
                      }
                      
                      return {
                        id: task.id,
                        name: task.title,
                        subtitle: task.status || 'No Status',
                        detail: task.clientName || 'No Client',
                        dailyTotals: taskDailyTotals,
                        total: taskTotal
                      };
                    });
                  }
                  
                  if (rows.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-500">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-lg font-medium mb-2">No Time Data</p>
                        <p className="text-sm">
                          {isAllUsers 
                            ? "No users with time tracking found for the selected period" 
                            : "No tasks with time tracking found for the selected user"}
                        </p>
                      </div>
                    );
                  }
                  
                  // Calculate column totals based on rows
                  const columnTotals: Record<string, number> = {};
                  dateRange.forEach(date => {
                    const dateString = formatLocalDate(date);
                    columnTotals[dateString] = rows.reduce((sum, row) => {
                      const dailyTime = row.dailyTotals?.[dateString] || 0;
                      return sum + dailyTime;
                    }, 0);
                  });
                  
                  // Calculate grand total
                  const grandTotal = Object.values(columnTotals).reduce((sum, dayTotal) => sum + dayTotal, 0);
                  
                  // Get current date for highlighting
                  const today = formatLocalDate(new Date());
                  
                  return (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px] sticky left-0 bg-white border-r-2 border-slate-300 z-10 font-semibold" data-testid="header-left-col-label">
                              {isAllUsers ? "User" : "Task"}
                            </TableHead>
                            {dateRange.map((date) => {
                              const dateString = formatLocalDate(date);
                              const isToday = dateString === today;
                              
                              return (
                                <TableHead 
                                  key={formatLocalDate(date)} 
                                  className={`text-center min-w-[100px] border-r border-slate-200 font-medium ${
                                    isToday ? 'bg-blue-50 border-blue-200' : ''
                                  }`}
                                >
                                  <div className="text-xs">
                                    {date.toLocaleDateString('en-US', { 
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric' 
                                    })}
                                  </div>
                                </TableHead>
                              );
                            })}
                            <TableHead className="text-center min-w-[100px] bg-slate-100 font-semibold border-l-2 border-slate-300">
                              Total
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row, rowIndex) => {
                            return (
                              <TableRow key={row.id} data-testid={`timesheet-row-${rowIndex}`}>
                                <TableCell className="sticky left-0 bg-white border-r-2 border-slate-300 z-10">
                                  <div className="space-y-1">
                                    {isAllUsers ? (
                                      <p className="font-medium text-slate-900 text-sm" data-testid={`row-name-${rowIndex}`}>
                                        {row.name}
                                      </p>
                                    ) : (
                                      <Link 
                                        href={`/tasks/${row.id}`}
                                        className="font-medium text-sm text-primary hover:underline cursor-pointer"
                                        data-testid={`link-task-${row.id}`}
                                      >
                                        {row.name}
                                      </Link>
                                    )}
                                    <p className="text-xs text-slate-500 capitalize">
                                      {row.subtitle}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {row.detail}
                                    </p>
                                  </div>
                                </TableCell>
                                {dateRange.map((date) => {
                                  const dateString = formatLocalDate(date);
                                  const isToday = dateString === today;
                                  const dailyTimeMinutes = row.dailyTotals?.[dateString] || 0;
                                  
                                  return (
                                    <TableCell 
                                      key={`${row.id}-${formatLocalDate(date)}`} 
                                      className={`text-center border-r border-slate-200 py-3 ${
                                        isToday ? 'bg-blue-50' : ''
                                      }`}
                                      data-testid={`time-cell-${rowIndex}-${dateString}`}
                                    >
                                      {dailyTimeMinutes > 0 ? (
                                        <div className="inline-flex items-center justify-center group">
                                          {canEditTimeEntries && isAllUsers ? (
                                            <button
                                              onClick={async () => {
                                                try {
                                                  const response = await fetch(`/api/reports/time-entries/${row.id}/${dateString}`);
                                                  if (!response.ok) {
                                                    const errorText = await response.text();
                                                    toast({
                                                      title: "Error loading time entries",
                                                      description: response.status === 403 ? "You don't have permission to edit time entries" : "Failed to load time entries",
                                                      variant: "destructive"
                                                    });
                                                    return;
                                                  }
                                                  const data = await response.json();
                                                  setEditingTimeEntry({
                                                    userId: row.id,
                                                    userName: row.name,
                                                    date: dateString,
                                                    entries: data.entries.flatMap((e: any) => e.entries.map((entry: any) => ({
                                                      ...entry,
                                                      taskId: e.taskId,
                                                      taskTitle: e.taskTitle
                                                    })))
                                                  });
                                                  setEditedDurations({});
                                                  setEditTimeModalOpen(true);
                                                } catch (error) {
                                                  console.error('Failed to fetch time entries:', error);
                                                  toast({
                                                    title: "Error",
                                                    description: "Failed to load time entries. Please try again.",
                                                    variant: "destructive"
                                                  });
                                                }
                                              }}
                                              className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium hover:bg-green-200 hover:ring-2 hover:ring-green-300 transition-all cursor-pointer inline-flex items-center gap-1"
                                            >
                                              {formatDuration(dailyTimeMinutes, timeDisplayMode)}
                                              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                          ) : (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                                              {formatDuration(dailyTimeMinutes, timeDisplayMode)}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-slate-300 text-xs">-</span>
                                      )}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center bg-slate-100 border-l-2 border-slate-300 font-semibold" data-testid={`row-total-${rowIndex}`}>
                                  <div className="space-y-1">
                                    <div className="text-sm font-semibold text-slate-900">
                                      {formatDuration(row.total, timeDisplayMode)}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {isAllUsers ? `${Object.keys(row.dailyTotals).length} days` : `${Object.keys(row.dailyTotals).length} days`}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {/* Column Totals Row */}
                          <TableRow className="border-t-2 border-slate-400 bg-slate-100">
                            <TableCell className="sticky left-0 bg-slate-200 border-r-2 border-slate-300 z-10 font-bold">
                              <div className="text-sm font-bold text-slate-900">
                                Daily Totals
                              </div>
                            </TableCell>
                            {dateRange.map((date) => {
                              const dateString = formatLocalDate(date);
                              const isToday = dateString === today;
                              const dailyTotal = columnTotals[dateString] || 0;
                              
                              return (
                                <TableCell 
                                  key={`total-${formatLocalDate(date)}`} 
                                  className={`text-center border-r border-slate-200 font-semibold ${
                                    isToday ? 'bg-blue-100' : 'bg-slate-100'
                                  }`}
                                  data-testid={`daily-total-${dateString}`}
                                >
                                  {dailyTotal > 0 ? (
                                    <div className="text-sm font-semibold text-slate-800">
                                      {formatDuration(dailyTotal, timeDisplayMode)}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center bg-slate-200 border-l-2 border-slate-300 font-bold" data-testid="timesheet-grand-total">
                              <div className="space-y-1">
                                <div className="text-sm font-bold text-slate-900">
                                  {formatDuration(grandTotal, timeDisplayMode)}
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
                            <p className="text-3xl font-bold text-slate-900">{timeTrackingData?.tasks?.length || 0}</p>
                            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {timeTrackingData?.tasks?.filter(t => t.timeTracked > 0)?.length || 0} with time data
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
                        <p className="text-sm font-medium text-slate-600">Estimated Time</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {formatDuration(taskAnalytics.totalEstimatedMinutes, timeDisplayMode)}
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
                        <p className="text-sm font-medium text-slate-600">Actual Time</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {timeTrackingData?.grandTotal ? formatDuration(timeTrackingData.grandTotal, timeDisplayMode) : formatDuration(0, timeDisplayMode)}
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
                          <TaskSortableHeader field="title">Task</TaskSortableHeader>
                          <TaskSortableHeader field="clientName">Client</TaskSortableHeader>
                          <TaskSortableHeader field="status">Status</TaskSortableHeader>
                          <TaskSortableHeader field="timeEstimate">Estimated</TaskSortableHeader>
                          <TaskSortableHeader field="timeTracked">Actual</TaskSortableHeader>
                          <TaskSortableHeader field="variance">Variance</TaskSortableHeader>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...taskAnalytics.topTimeConsumers]
                          .sort((a, b) => {
                            // Apply sorting based on current sort field and order
                            const getValue = (task: any, field: string) => {
                              switch (field) {
                                case 'title': return task.title || '';
                                case 'clientName': return task.clientName || '';
                                case 'status': return task.status || '';
                                case 'timeEstimate': return task.timeEstimate || 0;
                                case 'timeTracked': return task.timeTracked || 0;
                                case 'variance': 
                                  if (!task.timeEstimate || !task.timeTracked) return 0;
                                  return ((task.timeTracked - task.timeEstimate) / task.timeEstimate * 100);
                                default: return '';
                              }
                            };
                            
                            const aValue = getValue(a, taskSortField);
                            const bValue = getValue(b, taskSortField);
                            
                            if (typeof aValue === 'string' && typeof bValue === 'string') {
                              const comparison = aValue.localeCompare(bValue);
                              return taskSortOrder === 'asc' ? comparison : -comparison;
                            } else {
                              const comparison = Number(aValue) - Number(bValue);
                              return taskSortOrder === 'asc' ? comparison : -comparison;
                            }
                          })
                          .map((task, index) => {
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
                                  {task.timeEstimate ? formatDuration(task.timeEstimate, timeDisplayMode) : 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-900">
                                  {task.timeTracked ? formatDuration(task.timeTracked, timeDisplayMode) : 'N/A'}
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

          {/* Productivity Analysis */}
          {taskReportType === "productivity" && (
            <div className="space-y-6">
              {timeTrackingLoading ? (
                <Card>
                  <CardContent className="p-8 text-center text-slate-500">
                    <div className="animate-pulse">
                      <p>Loading productivity data...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : !timeTrackingData || (!timeTrackingData.userSummaries?.length && !timeTrackingData.clientBreakdowns?.length) ? (
                <Card>
                  <CardContent className="p-8 text-center text-slate-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium mb-2">No Productivity Data</p>
                    <p className="text-sm">No time entries found for the selected period to analyze productivity</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Productivity Metrics Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900" data-testid="text-total-users">
                            {timeTrackingData.userSummaries?.length || 0}
                          </div>
                          <div className="text-sm text-slate-600">Active Users</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900" data-testid="text-avg-time-per-user">
                            {timeTrackingData.userSummaries?.length > 0 ? 
                              formatDuration((timeTrackingData.grandTotal || 0) / timeTrackingData.userSummaries.length, timeDisplayMode) : 
                              formatDuration(0, timeDisplayMode)
                            }
                          </div>
                          <div className="text-sm text-slate-600">Avg Time/User</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900" data-testid="text-total-tasks">
                            {(timeTrackingData.userSummaries || []).reduce((sum, user) => sum + (user.tasksWorked || 0), 0)}
                          </div>
                          <div className="text-sm text-slate-600">Total Tasks</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900" data-testid="text-avg-time-per-task">
                            {(() => {
                              const totalTasks = (timeTrackingData.userSummaries || []).reduce((sum, user) => sum + (user.tasksWorked || 0), 0);
                              const avgMinutesPerTask = totalTasks > 0 ? (timeTrackingData.grandTotal || 0) / totalTasks : 0;
                              return formatDuration(avgMinutesPerTask, timeDisplayMode);
                            })()}
                          </div>
                          <div className="text-sm text-slate-600">Avg Time/Task</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* User Performance Analysis */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-slate-900">User Performance Analysis</h3>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[150px]">User</TableHead>
                              <TableHead className="min-w-[100px]">Role</TableHead>
                              <TableHead className="text-right min-w-[100px]">Total Hours</TableHead>
                              <TableHead className="text-right min-w-[80px]">Tasks</TableHead>
                              <TableHead className="text-right min-w-[100px]">Avg/Task</TableHead>
                              <TableHead className="text-right min-w-[100px]">Productivity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(timeTrackingData.userSummaries || [])
                              .sort((a, b) => (b.totalTime || 0) - (a.totalTime || 0))
                              .map((user, index) => {
                                const avgMinutesPerTask = (user.tasksWorked || 0) > 0 ? (user.totalTime || 0) / (user.tasksWorked || 1) : 0;
                                const totalUsers = timeTrackingData.userSummaries?.length || 1;
                                const avgTimePerUser = (timeTrackingData.grandTotal || 0) / totalUsers;
                                const productivityScore = avgTimePerUser > 0 ? (user.totalTime || 0) / avgTimePerUser : 0;
                                const productivityPercentage = (productivityScore * 100).toFixed(0);
                                
                                return (
                                  <TableRow key={user.userId} data-testid={`row-user-performance-${index}`}>
                                    <TableCell>
                                      <div className="font-medium text-slate-900" data-testid={`text-user-name-${index}`}>
                                        {user.userName || 'Unknown User'}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
                                        {user.userRole || 'Unknown'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono" data-testid={`text-user-hours-${index}`}>
                                      {formatDuration(user.totalTime || 0, timeDisplayMode)}
                                    </TableCell>
                                    <TableCell className="text-right" data-testid={`text-user-tasks-${index}`}>
                                      {user.tasksWorked || 0}
                                    </TableCell>
                                    <TableCell className="text-right font-mono" data-testid={`text-user-avg-task-${index}`}>
                                      {formatDuration(avgMinutesPerTask, timeDisplayMode)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          productivityScore > 1.2 ? 'bg-green-100 text-green-700' :
                                          productivityScore > 0.8 ? 'bg-blue-100 text-blue-700' :
                                          'bg-orange-100 text-orange-700'
                                        }`} data-testid={`badge-productivity-${index}`}>
                                          {productivityPercentage}%
                                        </span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* User Performance Chart */}
                  {timeTrackingData.userSummaries && timeTrackingData.userSummaries.length > 0 && (
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold text-slate-900">Time Distribution by User</h3>
                      </CardHeader>
                      <CardContent>
                        <UserPerformanceChart data={processUserPerformanceData(timeTrackingData)} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Daily Productivity Trend */}
                  {timeTrackingData.userSummaries && timeTrackingData.userSummaries.some(user => user.dailyTotals && Object.keys(user.dailyTotals).length > 1) && (
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold text-slate-900">Daily Productivity Trend</h3>
                      </CardHeader>
                      <CardContent>
                        <DailyTrendChart data={processDailyTrendData(timeTrackingData)} />
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {taskReportType === "workload" && (
            <div className="space-y-6">
              {timeTrackingLoading ? (
                <Card>
                  <CardContent className="p-8 text-center text-slate-500">
                    <div className="animate-pulse">
                      <p>Loading workload data...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : !timeTrackingData || (!timeTrackingData.userSummaries?.length && !timeTrackingData.clientBreakdowns?.length) ? (
                <Card>
                  <CardContent className="p-8 text-center text-slate-500">
                    <BarChart className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium mb-2">No Workload Data</p>
                    <p className="text-sm">No time entries found for the selected period to analyze workload distribution</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Workload Overview Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900" data-testid="text-total-team-time">
                            {formatDuration(timeTrackingData.grandTotal || 0, timeDisplayMode)}
                          </div>
                          <div className="text-sm text-slate-600">Total Team Time</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900" data-testid="text-active-clients">
                            {timeTrackingData.clientBreakdowns?.length || 0}
                          </div>
                          <div className="text-sm text-slate-600">Active Clients</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900" data-testid="text-workload-balance">
                            {(() => {
                              const userTimes = (timeTrackingData.userSummaries || []).map(u => u.totalTime || 0);
                              if (userTimes.length === 0) return "N/A";
                              const avg = userTimes.reduce((sum, t) => sum + t, 0) / userTimes.length;
                              const variance = userTimes.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / userTimes.length;
                              const stdDev = Math.sqrt(variance);
                              const cv = avg > 0 ? (stdDev / avg) * 100 : 0;
                              return cv < 25 ? "Good" : cv < 50 ? "Fair" : "Poor";
                            })()}
                          </div>
                          <div className="text-sm text-slate-600">Balance Score</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* User Workload Distribution */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-slate-900">User Workload Distribution</h3>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[150px]">User</TableHead>
                              <TableHead className="min-w-[100px]">Role</TableHead>
                              <TableHead className="text-right min-w-[100px]">Total Hours</TableHead>
                              <TableHead className="text-right min-w-[100px]">% of Total</TableHead>
                              <TableHead className="text-right min-w-[80px]">Tasks</TableHead>
                              <TableHead className="min-w-[120px]">Workload Level</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(timeTrackingData.userSummaries || [])
                              .sort((a, b) => (b.totalTime || 0) - (a.totalTime || 0))
                              .map((user, index) => {
                                const userTimeMinutes = user.totalTime || 0;
                                const totalTimeMinutes = timeTrackingData.grandTotal || 0;
                                const percentage = totalTimeMinutes > 0 ? (userTimeMinutes / totalTimeMinutes * 100) : 0;
                                const avgTimePerUser = totalTimeMinutes / (timeTrackingData.userSummaries?.length || 1);
                                const workloadRatio = avgTimePerUser > 0 ? userTimeMinutes / avgTimePerUser : 0;
                                
                                let workloadLevel = "Normal";
                                let workloadColor = "bg-blue-100 text-blue-700";
                                if (workloadRatio > 1.3) {
                                  workloadLevel = "High";
                                  workloadColor = "bg-red-100 text-red-700";
                                } else if (workloadRatio < 0.7) {
                                  workloadLevel = "Low";
                                  workloadColor = "bg-orange-100 text-orange-700";
                                } else if (workloadRatio > 1.1) {
                                  workloadLevel = "Above Avg";
                                  workloadColor = "bg-yellow-100 text-yellow-700";
                                }
                                
                                return (
                                  <TableRow key={user.userId} data-testid={`row-user-workload-${index}`}>
                                    <TableCell>
                                      <div className="font-medium text-slate-900" data-testid={`text-workload-user-${index}`}>
                                        {user.userName || 'Unknown User'}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
                                        {user.userRole || 'Unknown'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono" data-testid={`text-workload-hours-${index}`}>
                                      {formatDuration(userTimeMinutes, timeDisplayMode)}
                                    </TableCell>
                                    <TableCell className="text-right" data-testid={`text-workload-percentage-${index}`}>
                                      {percentage.toFixed(1)}%
                                    </TableCell>
                                    <TableCell className="text-right" data-testid={`text-workload-tasks-${index}`}>
                                      {user.tasksWorked || 0}
                                    </TableCell>
                                    <TableCell>
                                      <span className={`text-xs px-2 py-1 rounded-full ${workloadColor}`} data-testid={`badge-workload-level-${index}`}>
                                        {workloadLevel}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Client Workload Distribution */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-slate-900">Client Workload Distribution</h3>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[180px]">Client</TableHead>
                              <TableHead className="text-right min-w-[100px]">Total Hours</TableHead>
                              <TableHead className="text-right min-w-[100px]">% of Total</TableHead>
                              <TableHead className="text-right min-w-[80px]">Tasks</TableHead>
                              <TableHead className="text-right min-w-[80px]">Users</TableHead>
                              <TableHead className="min-w-[120px]">Priority Level</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(timeTrackingData.clientBreakdowns || [])
                              .sort((a, b) => (b.totalTime || 0) - (a.totalTime || 0))
                              .map((client, index) => {
                                const clientTimeMinutes = client.totalTime || 0;
                                const totalTimeMinutes = timeTrackingData.grandTotal || 0;
                                const percentage = totalTimeMinutes > 0 ? (clientTimeMinutes / totalTimeMinutes * 100) : 0;
                                
                                let priorityLevel = "Normal";
                                let priorityColor = "bg-blue-100 text-blue-700";
                                if (percentage > 40) {
                                  priorityLevel = "High";
                                  priorityColor = "bg-red-100 text-red-700";
                                } else if (percentage > 20) {
                                  priorityLevel = "Medium";
                                  priorityColor = "bg-yellow-100 text-yellow-700";
                                } else if (percentage < 5) {
                                  priorityLevel = "Low";
                                  priorityColor = "bg-gray-100 text-gray-700";
                                }
                                
                                return (
                                  <TableRow key={client.clientId} data-testid={`row-client-workload-${index}`}>
                                    <TableCell>
                                      <div className="font-medium text-slate-900" data-testid={`text-client-name-${index}`}>
                                        {client.clientName || 'Unknown Client'}
                                      </div>
                                      <div className="text-xs text-slate-500 mt-1">
                                        {(client.users || []).map(u => u.userName || 'Unknown').slice(0, 3).join(', ')}
                                        {(client.users || []).length > 3 && ` +${(client.users || []).length - 3} more`}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono" data-testid={`text-client-workload-hours-${index}`}>
                                      {formatDuration(clientTimeMinutes, timeDisplayMode)}
                                    </TableCell>
                                    <TableCell className="text-right" data-testid={`text-client-workload-percentage-${index}`}>
                                      {percentage.toFixed(1)}%
                                    </TableCell>
                                    <TableCell className="text-right" data-testid={`text-client-workload-tasks-${index}`}>
                                      {client.tasksCount || 0}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {(client.users || []).length}
                                    </TableCell>
                                    <TableCell>
                                      <span className={`text-xs px-2 py-1 rounded-full ${priorityColor}`} data-testid={`badge-client-priority-${index}`}>
                                        {priorityLevel}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Workload Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Distribution Chart */}
                    {timeTrackingData.userSummaries && timeTrackingData.userSummaries.length > 0 && (
                      <Card>
                        <CardHeader>
                          <h3 className="text-lg font-semibold text-slate-900">Time Distribution by User</h3>
                        </CardHeader>
                        <CardContent>
                          <TimeDistributionChart 
                            data={processTimeDistributionData(timeTrackingData, 'users')}
                            title="User Time Distribution"
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Client Distribution Chart */}
                    {timeTrackingData.clientBreakdowns && timeTrackingData.clientBreakdowns.length > 0 && (
                      <Card>
                        <CardHeader>
                          <h3 className="text-lg font-semibold text-slate-900">Time Distribution by Client</h3>
                        </CardHeader>
                        <CardContent>
                          <TimeDistributionChart 
                            data={processTimeDistributionData(timeTrackingData, 'clients')}
                            title="Client Time Distribution"
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Team Workload Balance Analysis */}
                  {timeTrackingData.userSummaries && timeTrackingData.userSummaries.length > 1 && (
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold text-slate-900">Team Workload Balance Analysis</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold text-slate-900">
                                {(() => {
                                  const userTimes = (timeTrackingData.userSummaries || []).map(u => u.totalTime || 0);
                                  return userTimes.length > 0 ? formatDuration(Math.max(...userTimes), timeDisplayMode) : formatDuration(0, timeDisplayMode);
                                })()}
                              </div>
                              <div className="text-sm text-slate-600">Highest</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-slate-900">
                                {(() => {
                                  const userTimes = (timeTrackingData.userSummaries || []).map(u => u.totalTime || 0);
                                  return userTimes.length > 0 ? formatDuration(Math.min(...userTimes), timeDisplayMode) : formatDuration(0, timeDisplayMode);
                                })()}
                              </div>
                              <div className="text-sm text-slate-600">Lowest</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-slate-900">
                                {(() => {
                                  const userTimes = (timeTrackingData.userSummaries || []).map(u => u.totalTime || 0);
                                  const avg = userTimes.length > 0 ? userTimes.reduce((sum, t) => sum + t, 0) / userTimes.length : 0;
                                  return formatDuration(avg, timeDisplayMode);
                                })()}
                              </div>
                              <div className="text-sm text-slate-600">Average</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-slate-900">
                                {(() => {
                                  const userTimes = (timeTrackingData.userSummaries || []).map(u => u.totalTime || 0);
                                  if (userTimes.length === 0) return "0:00";
                                  const max = Math.max(...userTimes);
                                  const min = Math.min(...userTimes);
                                  return formatDuration(max - min, timeDisplayMode);
                                })()}
                              </div>
                              <div className="text-sm text-slate-600">Range</div>
                            </div>
                          </div>
                          
                          <div className="pt-4">
                            <UserPerformanceChart data={processUserPerformanceData(timeTrackingData)} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Team Workload Report */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Team Workload Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-primary" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Staff</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamWorkloadData?.data?.summary?.totalStaff || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Staff with Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamWorkloadData?.data?.summary?.staffWithAssignments || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamWorkloadData?.data?.summary?.totalAssignments || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Clients per Staff</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamWorkloadData?.data?.summary?.averageClientsPerStaff?.toFixed(1) || "0.0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workload Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Workload Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamWorkloadLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: "No clients", value: teamWorkloadData?.data?.summary?.workloadDistribution?.['0_clients'] || 0, fill: "#ef4444" },
                            { name: "1 client", value: teamWorkloadData?.data?.summary?.workloadDistribution?.['1_client'] || 0, fill: "#f97316" },
                            { name: "2-3 clients", value: teamWorkloadData?.data?.summary?.workloadDistribution?.['2-3_clients'] || 0, fill: "#eab308" },
                            { name: "4-5 clients", value: teamWorkloadData?.data?.summary?.workloadDistribution?.['4-5_clients'] || 0, fill: "#22c55e" },
                            { name: "6+ clients", value: teamWorkloadData?.data?.summary?.workloadDistribution?.['6_plus_clients'] || 0, fill: "#3b82f6" },
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          <RechartsTooltip />
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performers by Client Count */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Staff by Client Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamWorkloadLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(teamWorkloadData?.data?.staffWorkload || [])
                      .filter(staff => staff.clientCount > 0)
                      .slice(0, 5)
                      .map((staff, index) => (
                        <div key={staff.staffId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{staff.staffName}</p>
                              <p className="text-sm text-gray-500">{staff.staffRole} • {staff.department}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{staff.clientCount}</p>
                            <p className="text-sm text-gray-500">clients</p>
                          </div>
                        </div>
                      ))}
                    {(teamWorkloadData?.data?.staffWorkload || []).filter(staff => staff.clientCount > 0).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No staff assignments found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Staff Workload Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Detailed Staff Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamWorkloadLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Filter Controls */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by staff name..."
                          value={workloadSearchTerm}
                          onChange={(e) => {
                            setWorkloadSearchTerm(e.target.value);
                            setWorkloadPage(1);
                          }}
                          className="pl-10"
                          data-testid="input-workload-search"
                        />
                      </div>
                    </div>
                    <Select value={workloadDepartmentFilter} onValueChange={(value) => { setWorkloadDepartmentFilter(value); setWorkloadPage(1); }}>
                      <SelectTrigger className="w-[200px]" data-testid="select-workload-department">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {Array.from(new Set((teamWorkloadData?.data?.staffWorkload || []).map(s => s.department).filter(Boolean))).sort().map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={workloadRoleFilter} onValueChange={(value) => { setWorkloadRoleFilter(value); setWorkloadPage(1); }}>
                      <SelectTrigger className="w-[200px]" data-testid="select-workload-role">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {Array.from(new Set((teamWorkloadData?.data?.staffWorkload || []).map(s => s.staffRole).filter(Boolean))).sort().map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-center">Client Count</TableHead>
                        <TableHead>Assigned Clients</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStaffWorkload.length > 0 ? (
                        paginatedStaffWorkload.map((staff) => (
                          <TableRow key={staff.staffId} data-testid={`row-workload-${staff.staffId}`}>
                            <TableCell className="font-medium">{staff.staffName}</TableCell>
                            <TableCell>{staff.staffRole}</TableCell>
                            <TableCell>{staff.department}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={staff.clientCount === 0 ? "secondary" : staff.clientCount > 3 ? "destructive" : "default"}>
                                {staff.clientCount}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {staff.clients.length > 0 ? (
                                <div className="space-y-1">
                                  {staff.clients.map((client, index) => (
                                    <div key={client.clientId} className="text-sm">
                                      <span className="font-medium">{client.clientName}</span>
                                      <span className="text-gray-500 ml-2">
                                        ({client.positions.map(p => p.positionLabel).join(", ")})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">No assignments</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No staff members match your filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls */}
                  {workloadTotalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Show:</span>
                        <Select value={String(workloadPageSize)} onValueChange={(value) => { setWorkloadPageSize(Number(value)); setWorkloadPage(1); }}>
                          <SelectTrigger className="w-20" data-testid="select-workload-page-size">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">entries</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setWorkloadPage(Math.max(1, workloadPage - 1))}
                          disabled={workloadPage === 1}
                          data-testid="button-workload-prev-page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>

                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, workloadTotalPages) }, (_, i) => {
                            let pageNum;
                            if (workloadTotalPages <= 5) {
                              pageNum = i + 1;
                            } else if (workloadPage <= 3) {
                              pageNum = i + 1;
                            } else if (workloadPage >= workloadTotalPages - 2) {
                              pageNum = workloadTotalPages - 4 + i;
                            } else {
                              pageNum = workloadPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={workloadPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setWorkloadPage(pageNum)}
                                data-testid={`button-workload-page-${pageNum}`}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setWorkloadPage(Math.min(workloadTotalPages, workloadPage + 1))}
                          disabled={workloadPage === workloadTotalPages}
                          data-testid="button-workload-next-page"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Hiring Predictions Section */}
          <HiringPredictionsSection />
        </div>
      )}
      {/* MRR Report Tab */}
      {activeTab === "mrr" && (
        <div className="space-y-6">
          {/* MRR Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Monthly Recurring Revenue (MRR) Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">Total MRR</p>
                  <p className="text-3xl font-bold text-primary mt-1" data-testid="total-mrr-value">
                    ${((clientsData?.clients || []).filter((c: any) => c.status === 'active').reduce((sum: number, client: any) => sum + (parseFloat(client.mrr || 0)), 0)).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Active Clients with MRR</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1" data-testid="active-clients-mrr-count">
                    {(clientsData?.clients || []).filter((c: any) => c.status === 'active' && c.mrr && parseFloat(c.mrr) > 0).length}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Average MRR per Client</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1" data-testid="average-mrr-value">
                    ${(() => {
                      const activeWithMrr = (clientsData?.clients || []).filter((c: any) => c.status === 'active' && c.mrr && parseFloat(c.mrr) > 0);
                      if (activeWithMrr.length === 0) return '0';
                      const totalMrr = activeWithMrr.reduce((sum: number, client: any) => sum + parseFloat(client.mrr || 0), 0);
                      return (totalMrr / activeWithMrr.length).toLocaleString(undefined, { maximumFractionDigits: 0 });
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MRR Client Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle>Client MRR Breakdown</CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search clients..."
                      value={mrrSearchTerm}
                      onChange={(e) => {
                        setMrrSearchTerm(e.target.value);
                        setMrrPage(1);
                      }}
                      className="pl-10 w-full sm:w-64"
                      data-testid="input-mrr-search"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <MrrSortableHeader field="name">
                      Client Name
                    </MrrSortableHeader>
                    <MrrSortableHeader field="email">
                      Email
                    </MrrSortableHeader>
                    <MrrSortableHeader field="status">
                      Status
                    </MrrSortableHeader>
                    <MrrSortableHeader field="mrr">
                      MRR
                    </MrrSortableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    let filteredClients = (clientsData?.clients || [])
                      .filter((c: any) => c.status === 'active' && c.mrr && parseFloat(c.mrr) > 0);
                    
                    if (mrrSearchTerm) {
                      filteredClients = filteredClients.filter((c: any) => 
                        c.name?.toLowerCase().includes(mrrSearchTerm.toLowerCase()) ||
                        c.email?.toLowerCase().includes(mrrSearchTerm.toLowerCase())
                      );
                    }
                    
                    filteredClients.sort((a: any, b: any) => {
                      let aVal, bVal;
                      if (mrrSortField === 'mrr') {
                        aVal = parseFloat(a.mrr || 0);
                        bVal = parseFloat(b.mrr || 0);
                      } else {
                        aVal = a[mrrSortField] || '';
                        bVal = b[mrrSortField] || '';
                      }
                      
                      if (mrrSortOrder === 'asc') {
                        return aVal > bVal ? 1 : -1;
                      } else {
                        return aVal < bVal ? 1 : -1;
                      }
                    });
                    
                    const start = (mrrPage - 1) * mrrPageSize;
                    const paginatedClients = filteredClients.slice(start, start + mrrPageSize);
                    const totalPages = Math.ceil(filteredClients.length / mrrPageSize);
                    
                    if (paginatedClients.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            {mrrSearchTerm ? 'No clients found matching your search' : 'No active clients with MRR data'}
                          </TableCell>
                        </TableRow>
                      );
                    }
                    
                    return (
                      <>
                        {paginatedClients.map((client: any) => (
                          <TableRow key={client.id} data-testid={`mrr-client-${client.id}`}>
                            <TableCell className="font-medium">{client.company || client.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{client.email}</TableCell>
                            <TableCell>
                              <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                                {client.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-primary">
                              ${parseFloat(client.mrr || 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4}>
                            <div className="flex items-center justify-between py-2">
                              <div className="text-sm text-muted-foreground">
                                Showing {start + 1}-{Math.min(start + mrrPageSize, filteredClients.length)} of {filteredClients.length} clients
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setMrrPage(p => Math.max(1, p - 1))}
                                  disabled={mrrPage === 1}
                                  data-testid="button-mrr-prev-page"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">
                                  Page {mrrPage} of {totalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setMrrPage(p => Math.min(totalPages, p + 1))}
                                  disabled={mrrPage >= totalPages}
                                  data-testid="button-mrr-next-page"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 1-on-1 Performance Report Tab */}
      {activeTab === "one-on-one" && (
        <div className="space-y-6">
          <OneOnOnePerformanceReport />
        </div>
      )}

      {/* Edit Time Entry Modal - for admins/managers only */}
      <Dialog open={editTimeModalOpen} onOpenChange={setEditTimeModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Edit Time Entries
            </DialogTitle>
            <DialogDescription>
              {editingTimeEntry ? (
                <>Editing time for <strong>{editingTimeEntry.userName}</strong> on <strong>{editingTimeEntry.date}</strong></>
              ) : 'Loading...'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {editingTimeEntry?.entries?.length ? (
              editingTimeEntry.entries.map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-slate-900">{entry.taskTitle}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.startTime).toLocaleTimeString()} - {entry.endTime ? new Date(entry.endTime).toLocaleTimeString() : 'Running'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      className="w-20 text-center"
                      value={editedDurations[entry.id] !== undefined ? editedDurations[entry.id] : Math.round(entry.duration / 60)}
                      onChange={(e) => setEditedDurations(prev => ({
                        ...prev,
                        [entry.id]: parseInt(e.target.value) || 0
                      }))}
                    />
                    <span className="text-xs text-slate-500">min</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-4">No time entries found for this date.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTimeModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!editingTimeEntry) return;
                
                try {
                  for (const entry of editingTimeEntry.entries) {
                    const editedMinutes = editedDurations[entry.id];
                    if (editedMinutes !== undefined) {
                      const newDuration = editedMinutes * 60;
                      const response = await fetch(`/api/reports/time-entries/${entry.taskId}/${entry.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ duration: newDuration })
                      });
                      if (!response.ok) {
                        throw new Error('Failed to update time entry');
                      }
                    }
                  }
                  toast({
                    title: "Time entries updated",
                    description: "The time entries have been successfully updated.",
                  });
                  setEditTimeModalOpen(false);
                  setEditingTimeEntry(null);
                  setEditedDurations({});
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to update time entries. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
              disabled={Object.keys(editedDurations).length === 0}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Individual Analysis View Component
interface IndividualAnalysisViewProps {
  report: {
    userId: string;
    userName: string;
    totalMeetings: number;
    avgPerformancePoints: number | null;
    talkingPointsCompletionRate: number | null;
    actionItemsCompletionRate: number | null;
    goalsCompletionRate: number | null;
    mostCommonFeeling: string | null;
    mostCommonProgressionStatus: string | null;
    meetings: Array<{
      id: string;
      meetingDate: string;
      weekOf: string;
      feeling: string | null;
      performancePoints: number | null;
      progressionStatus: string | null;
    }>;
  };
  onBack: () => void;
}

function IndividualAnalysisView({ report, onBack }: IndividualAnalysisViewProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'history'>('analysis');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const getFeelingEmoji = (feeling: string | null) => {
    if (!feeling) return null;
    const emojiMap: Record<string, string> = {
      'excellent': '😊',
      'great': '😊',
      'good': '🙂',
      'okay': '😐',
      'stressed': '😰',
      'overwhelmed': '😫'
    };
    return emojiMap[feeling] || null;
  };

  const getFeelingLabel = (feeling: string | null) => {
    if (!feeling) return 'Unknown';
    const labelMap: Record<string, string> = {
      'excellent': 'Excellent',
      'great': 'Great',
      'good': 'Good',
      'okay': 'Okay',
      'stressed': 'Stressed',
      'overwhelmed': 'Overwhelmed'
    };
    return labelMap[feeling] || feeling;
  };

  // Map feeling to numeric value (1-5 scale)
  const getFeelingValue = (feeling: string | null): number | null => {
    if (!feeling) return null;
    const valueMap: Record<string, number> = {
      'excellent': 5,
      'great': 5,
      'good': 4,
      'okay': 3,
      'stressed': 2,
      'overwhelmed': 1
    };
    return valueMap[feeling] ?? null;
  };

  // Prepare chart data with date filtering
  const chartData = useMemo(() => {
    let filteredMeetings = report.meetings.filter(m => m.meetingDate && m.weekOf);
    
    // Apply date range filter if set
    if (dateFrom) {
      filteredMeetings = filteredMeetings.filter(m => new Date(m.meetingDate) >= dateFrom);
    }
    if (dateTo) {
      filteredMeetings = filteredMeetings.filter(m => new Date(m.meetingDate) <= dateTo);
    }
    
    return filteredMeetings
      .map(m => ({
        date: m.meetingDate,
        weekOf: m.weekOf,
        feeling: m.feeling,
        performancePoints: (m.performancePoints || 0) + (m.bonusPoints || 0), // Total score = base + bonus
        progressionStatus: m.progressionStatus,
        feelingValue: getFeelingValue(m.feeling)
      }))
      .sort((a, b) => (a.date || '').localeCompare(b.date || '')); // Safe null handling
  }, [report.meetings, dateFrom, dateTo]);

  // Calculate score distribution
  const scoreDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    report.meetings.forEach(m => {
      if (m.progressionStatus) {
        statusCounts[m.progressionStatus] = (statusCounts[m.progressionStatus] || 0) + 1;
      }
    });

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace(/-|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      percentage: ((count / total) * 100).toFixed(1)
    }));
  }, [report.meetings]);

  // Calculate feeling distribution
  const feelingDistribution = useMemo(() => {
    const feelingCounts: Record<string, number> = {};
    report.meetings.forEach(m => {
      if (m.feeling) {
        feelingCounts[m.feeling] = (feelingCounts[m.feeling] || 0) + 1;
      }
    });

    const total = Object.values(feelingCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(feelingCounts).map(([feeling, count]) => ({
      name: getFeelingLabel(feeling),
      emoji: getFeelingEmoji(feeling),
      value: count,
      percentage: ((count / total) * 100).toFixed(1)
    }));
  }, [report.meetings]);

  // Get color for score distribution
  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
    const colorMap: Record<string, string> = {
      'ready_for_promotion': 'hsl(142, 76%, 36%)', // green
      'excelling': 'hsl(142, 76%, 36%)', // green
      'on_track': 'hsl(179, 100%, 39%)', // teal/cyan
      'needs_support': 'hsl(32, 95%, 44%)', // orange
      'struggling': 'hsl(0, 72%, 51%)', // red
      'below_expectations': 'hsl(0, 72%, 51%)', // red
    };
    return colorMap[normalizedStatus] || 'hsl(215, 20%, 65%)';
  };

  // Get color for feeling distribution
  const getFeelingColor = (feeling: string) => {
    const normalizedFeeling = feeling.toLowerCase();
    const colorMap: Record<string, string> = {
      'excellent': 'hsl(142, 71%, 45%)', // vibrant green
      'great': 'hsl(142, 71%, 45%)', // vibrant green  
      'good': 'hsl(160, 60%, 45%)', // teal-green
      'okay': 'hsl(45, 93%, 47%)', // amber
      'stressed': 'hsl(25, 95%, 53%)', // orange
      'overwhelmed': 'hsl(0, 84%, 60%)', // coral red
    };
    return colorMap[normalizedFeeling] || 'hsl(215, 20%, 65%)';
  };

  // Calculate average score and trend
  const previousAverage = useMemo(() => {
    if (report.meetings.length < 2) return null;
    const sortedMeetings = [...report.meetings].sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
    const lastMeeting = sortedMeetings[sortedMeetings.length - 1];
    const previousMeetings = sortedMeetings.slice(0, -1).filter(m => m.performancePoints !== null);
    if (previousMeetings.length === 0) return null;
    const prevAvg = previousMeetings.reduce((sum, m) => sum + ((m.performancePoints || 0) + (m.bonusPoints || 0)), 0) / previousMeetings.length;
    return { lastScore: (lastMeeting.performancePoints || 0) + (lastMeeting.bonusPoints || 0), prevAvg };
  }, [report.meetings]);

  const scoreTrend = useMemo(() => {
    if (!previousAverage || !previousAverage.lastScore) return null;
    const diff = previousAverage.lastScore - previousAverage.prevAvg;
    const percentChange = (diff / previousAverage.prevAvg) * 100;
    return { diff, percentChange };
  }, [previousAverage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              data-testid="button-back-to-list"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex-1">
              <CardTitle className="text-2xl">{report.userName}</CardTitle>
              <CardDescription>{report.totalMeetings} 1-on-1 meetings</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs - Marketing Style */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'analysis'
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            data-testid="tab-analysis"
          >
            <BarChart className="h-4 w-4" />
            Analysis
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'history'
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            data-testid="tab-history"
          >
            <Clock className="h-4 w-4" />
            History
          </button>
        </nav>
      </div>

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Date Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">From:</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-date-from">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">To:</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-date-to">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {dateTo ? format(dateTo, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {(dateFrom || dateTo) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Line Chart - Mood and Performance Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mood & Score Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="weekOf" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      domain={[0, 5]}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="feelingValue" 
                      stroke="hsl(160, 84%, 39%)" 
                      strokeWidth={2.5}
                      name="Mood"
                      dot={{ fill: 'hsl(160, 84%, 39%)', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="performancePoints" 
                      stroke="hsl(271, 91%, 65%)" 
                      strokeWidth={2.5}
                      name="1-on-1 Score"
                      dot={{ fill: 'hsl(271, 91%, 65%)', r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Average Score Gauge */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-24 mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { value: (report.avgPerformancePoints || 0) },
                            { value: Math.max(0, 5 - (report.avgPerformancePoints || 0)) }
                          ]}
                          cx="50%"
                          cy="90%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius="60%"
                          outerRadius="90%"
                          paddingAngle={0}
                          dataKey="value"
                        >
                          <Cell fill={`hsl(${((report.avgPerformancePoints || 0) / 5) * 120}, 70%, 50%)`} />
                          <Cell fill="hsl(var(--muted))" />
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center -mt-2">
                    <div className="text-3xl font-bold">{report.avgPerformancePoints?.toFixed(2) || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">/5</div>
                  </div>
                  {scoreTrend && (
                    <div className={`text-sm mt-4 ${scoreTrend.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {scoreTrend.diff >= 0 ? '↑' : '↓'} {Math.abs(scoreTrend.percentChange).toFixed(0)}% since last event
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={scoreDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius="50%"
                          outerRadius="80%"
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {scoreDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          offset={25}
                          wrapperStyle={{ zIndex: 1000 }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2 text-xs w-full">
                    {scoreDistribution.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getStatusColor(entry.name) }}
                          />
                          <span>{entry.name}</span>
                        </div>
                        <span className="font-medium">{entry.percentage}%, {entry.value} events</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feeling Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feeling distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={feelingDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius="50%"
                          outerRadius="80%"
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {feelingDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getFeelingColor(entry.name)} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          offset={25}
                          wrapperStyle={{ zIndex: 1000 }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2 text-xs w-full">
                    {feelingDistribution.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getFeelingColor(entry.name) }}
                          />
                          <span>{entry.emoji} {entry.name}</span>
                        </div>
                        <span className="font-medium">{entry.percentage}%, {entry.value} events</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPI Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KPI Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {report.kpiSummary.total > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{report.kpiSummary.total}</div>
                      <div className="text-xs text-muted-foreground mt-1">Total KPIs</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{report.kpiSummary.complete}</div>
                      <div className="text-xs text-muted-foreground mt-1">Complete</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-2xl font-bold text-green-500">{report.kpiSummary.onTrack}</div>
                      <div className="text-xs text-muted-foreground mt-1">On-Track</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{report.kpiSummary.offTrack}</div>
                      <div className="text-xs text-muted-foreground mt-1">Off-Track</div>
                    </div>
                  </div>
                  {report.kpiSummary.percentageComplete !== null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Completion</span>
                        <span className="text-sm text-muted-foreground">
                          {report.kpiSummary.percentageComplete.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className="bg-green-600 h-3 rounded-full transition-all"
                          style={{ width: `${report.kpiSummary.percentageComplete}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No KPI data available for this team member
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Action Items</span>
                    <span className="text-sm text-muted-foreground">
                      {report.actionItemsCompletionRate !== null 
                        ? `${report.actionItemsCompletionRate.toFixed(0)}%` 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${report.actionItemsCompletionRate || 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Goals</span>
                    <span className="text-sm text-muted-foreground">
                      {report.goalsCompletionRate !== null 
                        ? `${report.goalsCompletionRate.toFixed(0)}%` 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${report.goalsCompletionRate || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Week Of</TableHead>
                    <TableHead>Feeling</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.reverse().map((meeting, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(new Date(meeting.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(meeting.weekOf), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {meeting.feeling && (
                          <span className="text-lg">{getFeelingEmoji(meeting.feeling)} {getFeelingLabel(meeting.feeling)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {meeting.performancePoints !== null ? (
                          <span className="font-semibold">{meeting.performancePoints}/5</span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {meeting.progressionStatus && (
                          <Badge variant="outline">
                            {meeting.progressionStatus.replace(/-|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// 1-on-1 Performance Report Component
function OneOnOnePerformanceReport() {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("totalMeetings");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [feelingFilter, setFeelingFilter] = useState<string>("all");
  const [progressionFilter, setProgressionFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom.toISOString().split('T')[0]);
    if (dateTo) params.append('dateTo', dateTo.toISOString().split('T')[0]);
    if (feelingFilter && feelingFilter !== 'all') params.append('feeling', feelingFilter);
    if (progressionFilter && progressionFilter !== 'all') params.append('progression', progressionFilter);
    if (departmentFilter && departmentFilter !== 'all') params.append('department', departmentFilter);
    return params.toString();
  };

  const queryParams = buildQueryParams();
  const queryKey = queryParams 
    ? `/api/reports/one-on-one-performance?${queryParams}`
    : '/api/reports/one-on-one-performance';

  const { data: performanceData, isLoading } = useQuery<Array<{
    userId: string;
    userName: string;
    totalMeetings: number;
    avgPerformancePoints: number | null;
    talkingPointsCompletionRate: number | null;
    actionItemsCompletionRate: number | null;
    goalsCompletionRate: number | null;
    kpiSummary: {
      total: number;
      onTrack: number;
      offTrack: number;
      complete: number;
      percentageComplete: number | null;
    };
    mostCommonFeeling: string | null;
    mostCommonProgressionStatus: string | null;
    meetings: Array<{
      id: string;
      meetingDate: string;
      weekOf: string;
      feeling: string | null;
      performancePoints: number | null;
      progressionStatus: string | null;
    }>;
  }>>({
    queryKey: [queryKey],
  });

  const filteredAndSortedData = useMemo(() => {
    if (!performanceData) return [];

    let filtered = performanceData.filter(report =>
      report.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof typeof a];
      let bVal: any = b[sortField as keyof typeof b];

      if (aVal === null) aVal = sortOrder === "asc" ? Infinity : -Infinity;
      if (bVal === null) bVal = sortOrder === "asc" ? Infinity : -Infinity;

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [performanceData, searchTerm, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortableHeader = ({ 
    field, 
    children, 
  }: { 
    field: string; 
    children: React.ReactNode; 
  }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-between">
        {children}
        <div className="flex items-center gap-1 ml-2">
          {sortField === field && sortOrder === "asc" && (
            <ChevronUp className="h-4 w-4 text-primary" />
          )}
          {sortField === field && sortOrder === "desc" && (
            <ChevronDown className="h-4 w-4 text-primary" />
          )}
          {sortField !== field && (
            <div className="flex flex-col -space-y-1">
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </TableHead>
  );

  const getFeelingEmoji = (feeling: string | null) => {
    if (!feeling) return null;
    const emojiMap: Record<string, string> = {
      'great': '😊',
      'good': '🙂',
      'okay': '😐',
      'stressed': '😰',
      'overwhelmed': '😫'
    };
    return emojiMap[feeling] || null;
  };

  const getProgressionBadgeColor = (status: string | null) => {
    if (!status) return 'secondary';
    const colorMap: Record<string, string> = {
      'excelling': 'default',
      'on-track': 'default',
      'needs-support': 'secondary',
      'struggling': 'destructive'
    };
    return colorMap[status] || 'secondary';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading performance reports...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performanceData || performanceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            1-on-1 Performance Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No performance data available. Start conducting 1-on-1 meetings to see reports here.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalMeetingsAll = performanceData.reduce((sum, r) => sum + r.totalMeetings, 0);
  const avgPerformanceAll = performanceData.filter(r => r.avgPerformancePoints !== null).length > 0
    ? performanceData.filter(r => r.avgPerformancePoints !== null).reduce((sum, r) => sum + (r.avgPerformancePoints || 0), 0) / performanceData.filter(r => r.avgPerformancePoints !== null).length
    : null;

  // Show individual detail view if a user is selected
  if (selectedUserId) {
    const selectedReport = performanceData.find(r => r.userId === selectedUserId);
    if (selectedReport) {
      return (
        <IndividualAnalysisView 
          report={selectedReport} 
          onBack={() => setSelectedUserId(null)}
        />
      );
    }
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Team Members</p>
                <p className="text-2xl font-bold" data-testid="total-team-members">
                  {performanceData.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Meetings</p>
                <p className="text-2xl font-bold" data-testid="total-meetings">
                  {totalMeetingsAll}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Performance</p>
                <p className="text-2xl font-bold" data-testid="avg-performance">
                  {avgPerformanceAll !== null ? avgPerformanceAll.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Individual Performance Metrics
          </CardTitle>
          
          {/* Filters Section */}
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-performance-search"
                />
              </div>
              
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                      data-testid="button-date-from"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : <span>From Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                      data-testid="button-date-to"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : <span>To Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={feelingFilter} onValueChange={setFeelingFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-feeling">
                  <SelectValue placeholder="Feeling" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Feelings</SelectItem>
                  <SelectItem value="great">😊 Great</SelectItem>
                  <SelectItem value="good">🙂 Good</SelectItem>
                  <SelectItem value="okay">😐 Okay</SelectItem>
                  <SelectItem value="stressed">😰 Stressed</SelectItem>
                  <SelectItem value="overwhelmed">😫 Overwhelmed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={progressionFilter} onValueChange={setProgressionFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-progression">
                  <SelectValue placeholder="Progression Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="excelling">Excelling</SelectItem>
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="needs-support">Needs Support</SelectItem>
                  <SelectItem value="struggling">Struggling</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-department">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                </SelectContent>
              </Select>

              {(dateFrom || dateTo || feelingFilter !== 'all' || progressionFilter !== 'all' || departmentFilter !== 'all') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                    setFeelingFilter('all');
                    setProgressionFilter('all');
                    setDepartmentFilter('all');
                  }}
                  className="w-full sm:w-auto"
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="userName">
                  Team Member
                </SortableHeader>
                <SortableHeader field="totalMeetings">
                  Meetings
                </SortableHeader>
                <SortableHeader field="avgPerformancePoints">
                  Avg Performance
                </SortableHeader>
                <TableHead>KPI Progress</TableHead>
                <TableHead>Completion Rates</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((report) => (
                <TableRow 
                  key={report.userId} 
                  data-testid={`performance-row-${report.userId}`}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedUserId(report.userId)}
                >
                  <TableCell className="font-medium">
                    {report.userName || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {report.totalMeetings}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.avgPerformancePoints !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">
                          {report.avgPerformancePoints.toFixed(1)}
                        </span>
                        {report.mostCommonFeeling && (
                          <span className="text-lg">
                            {getFeelingEmoji(report.mostCommonFeeling)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {report.kpiSummary.total > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Badge variant="default" className="bg-green-600 text-white text-xs px-1.5 py-0">
                            {report.kpiSummary.complete}
                          </Badge>
                          <Badge variant="default" className="bg-green-500 text-white text-xs px-1.5 py-0">
                            {report.kpiSummary.onTrack}
                          </Badge>
                          <Badge variant="default" className="bg-red-600 text-white text-xs px-1.5 py-0">
                            {report.kpiSummary.offTrack}
                          </Badge>
                        </div>
                        {report.kpiSummary.percentageComplete !== null && (
                          <div className="text-xs text-muted-foreground">
                            {report.kpiSummary.percentageComplete.toFixed(0)}% complete
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No KPIs</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      {report.actionItemsCompletionRate !== null && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-20">Actions:</span>
                          <span className="font-medium">{report.actionItemsCompletionRate.toFixed(0)}%</span>
                        </div>
                      )}
                      {report.goalsCompletionRate !== null && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-20">Goals:</span>
                          <span className="font-medium">{report.goalsCompletionRate.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.mostCommonProgressionStatus && (
                      <Badge variant={getProgressionBadgeColor(report.mostCommonProgressionStatus) as any}>
                        {report.mostCommonProgressionStatus.replace('-', ' ')}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
// Hiring Predictions Component
function HiringPredictionsSection() {
  const { toast } = useToast();
  
  const { data: predictionsData, isLoading } = useQuery<{
    predictions: Array<{
      department: string;
      role: string | null;
      currentStaff: number;
      currentClients: number;
      maxCapacity: number;
      currentCapacityPercent: number;
      leadsInPipeline: number;
      historicalCloseRate: number;
      averagePipelineTime: number;
      predictedNewClients: number;
      projectedClients: number;
      projectedCapacityPercent: number;
      needsHiring: boolean;
      alertThreshold: number;
      daysUntilCapacity: number | null;
    }>;
  }>({
    queryKey: ['/api/capacity-predictions'],
  });

  // Mutation to trigger capacity alerts
  const triggerAlertsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/capacity-alerts/check', undefined);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Alerts Sent",
        variant: "success",
        description: data.message || `Successfully notified managers about ${data.alertsCreated} capacity alerts.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send capacity alerts",
        variant: "destructive",
      });
    }
  });

  const predictions = predictionsData?.predictions || [];
  const alertPredictions = predictions.filter(p => p.needsHiring);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Hiring Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Hiring Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No capacity predictions available</p>
            <p className="text-sm text-gray-400">
              Configure capacity settings in Settings → Staff → Capacity Settings
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Hiring Predictions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Predictive capacity analysis based on pipeline data and historical close rates
            </p>
          </div>
          {alertPredictions.length > 0 && (
            <Button
              onClick={() => triggerAlertsMutation.mutate()}
              disabled={triggerAlertsMutation.isPending}
              variant="default"
              className="flex items-center gap-2"
              data-testid="button-notify-managers"
            >
              <Bell className="h-4 w-4" />
              {triggerAlertsMutation.isPending ? "Sending..." : "Notify Managers"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Alert Summary */}
        {alertPredictions.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">
                  {alertPredictions.length} Team{alertPredictions.length > 1 ? 's' : ''} Approaching Capacity
                </h4>
                <p className="text-sm text-red-800">
                  The following teams are predicted to exceed their alert threshold. Consider hiring additional staff.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Predictions Grid */}
        <div className="space-y-4">
          {predictions.map((pred, index) => {
            const capacityColor = 
              pred.projectedCapacityPercent >= pred.alertThreshold ? 'red' :
              pred.projectedCapacityPercent >= pred.alertThreshold * 0.8 ? 'yellow' :
              'green';
            
            const capacityBgColor = 
              capacityColor === 'red' ? 'bg-red-50 border-red-200' :
              capacityColor === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
              'bg-green-50 border-green-200';

            const capacityTextColor = 
              capacityColor === 'red' ? 'text-red-900' :
              capacityColor === 'yellow' ? 'text-yellow-900' :
              'text-green-900';

            return (
              <div 
                key={`${pred.department}-${pred.role || 'all'}-${index}`}
                className={`p-4 border rounded-lg ${capacityBgColor}`}
                data-testid={`prediction-${pred.department}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h4 className={`font-semibold ${capacityTextColor}`}>
                        {pred.department}
                        {pred.role && ` - ${pred.role}`}
                      </h4>
                      {pred.needsHiring && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Action Needed
                        </Badge>
                      )}
                    </div>
                    {pred.daysUntilCapacity !== null && pred.daysUntilCapacity > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Estimated {pred.daysUntilCapacity} days until capacity threshold reached
                      </p>
                    )}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500 mb-1">Current Staff</p>
                    <p className="text-lg font-bold text-gray-900">{pred.currentStaff}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500 mb-1">Current Clients</p>
                    <p className="text-lg font-bold text-gray-900">{pred.currentClients}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500 mb-1">Leads in Pipeline</p>
                    <p className="text-lg font-bold text-blue-600">{pred.leadsInPipeline}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500 mb-1">Predicted New Clients</p>
                    <p className="text-lg font-bold text-purple-600">
                      {pred.predictedNewClients}
                    </p>
                    <p className="text-xs text-gray-500">
                      ({(pred.historicalCloseRate * 100).toFixed(0)}% close rate)
                    </p>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Current Capacity</span>
                    <span className={`font-bold ${
                      pred.currentCapacityPercent >= pred.alertThreshold ? 'text-red-600' :
                      pred.currentCapacityPercent >= pred.alertThreshold * 0.8 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {pred.currentCapacityPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        pred.currentCapacityPercent >= pred.alertThreshold ? 'bg-red-500' :
                        pred.currentCapacityPercent >= pred.alertThreshold * 0.8 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(pred.currentCapacityPercent, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm mt-3">
                    <span className="font-medium">Projected Capacity</span>
                    <span className={`font-bold ${
                      pred.projectedCapacityPercent >= pred.alertThreshold ? 'text-red-600' :
                      pred.projectedCapacityPercent >= pred.alertThreshold * 0.8 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {pred.projectedCapacityPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
                    <div 
                      className={`h-full transition-all ${
                        pred.projectedCapacityPercent >= pred.alertThreshold ? 'bg-red-500' :
                        pred.projectedCapacityPercent >= pred.alertThreshold * 0.8 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(pred.projectedCapacityPercent, 100)}%` }}
                    />
                    {/* Alert threshold line */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-600 border-l-2 border-red-600"
                      style={{ left: `${pred.alertThreshold}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{pred.currentClients} → {pred.projectedClients} clients</span>
                    <span>Alert at {pred.alertThreshold}%</span>
                  </div>
                </div>

                {/* Additional Metrics */}
                {pred.averagePipelineTime > 0 && (
                  <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Avg. Pipeline Time:</span>{' '}
                      {pred.averagePipelineTime.toFixed(0)} days
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
