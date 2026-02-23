import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Settings, Trash2, Search, MoreVertical, Star, Edit, LayoutDashboard, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GridLayout, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { canAccessWidget } from "@shared/widget-permissions";

const ResponsiveGridLayout = WidthProvider(GridLayout);

interface UserGranularPermissions {
  isAdmin: boolean;
  roles: string[];
  permissions: string[];
}

import ClientHealthOverviewWidget from "@/components/widgets/client-health-overview";
import RecentClientsWidget from "@/components/widgets/recent-clients";
import ClientApprovalQueueWidget from "@/components/widgets/client-approval-queue";
import ClientDistributionByVerticalWidget from "@/components/widgets/client-distribution-by-vertical";
import ClientPortalActivityWidget from "@/components/widgets/client-portal-activity";
import ClientTeamAssignmentsWidget from "@/components/widgets/client-team-assignments";
import SalesPipelineOverviewWidget from "@/components/widgets/sales-pipeline-overview";
import QuoteStatusSummaryWidget from "@/components/widgets/quote-status-summary";
import RevenueThisMonthWidget from "@/components/widgets/revenue-this-month";
import MRRTrackerWidget from "@/components/widgets/mrr-tracker";
import WinRateWidget from "@/components/widgets/win-rate";
import TopPerformingSalesRepsWidget from "@/components/widgets/top-performing-sales-reps";
import RecentDealsWonWidget from "@/components/widgets/recent-deals-won";
import MyTasksWidget from "@/components/widgets/my-tasks";
import OverdueTasksWidget from "@/components/widgets/overdue-tasks";
import TasksDueThisWeekWidget from "@/components/widgets/tasks-due-this-week";
import TaskCompletionRateWidget from "@/components/widgets/task-completion-rate";
import TasksRequiringApprovalWidget from "@/components/widgets/tasks-requiring-approval";
import TasksByStatusWidget from "@/components/widgets/tasks-by-status";
import TimeTrackedThisWeekWidget from "@/components/widgets/time-tracked-this-week";
import TeamWorkloadWidget from "@/components/widgets/team-workload";
import NewLeadsTodayWeekWidget from "@/components/widgets/new-leads-today-week";
import LeadsByPipelineStageWidget from "@/components/widgets/leads-by-pipeline-stage";
import MyAssignedLeadsWidget from "@/components/widgets/my-assigned-leads";
import StaleLeadsWidget from "@/components/widgets/stale-leads";
import LeadConversionRateWidget from "@/components/widgets/lead-conversion-rate";
import LeadSourceBreakdownWidget from "@/components/widgets/lead-source-breakdown";
import PendingTimeOffWidget from "@/components/widgets/pending-time-off";
import WhosOffTodayWeekWidget from "@/components/widgets/whos-off-today-week";
import NewJobApplicationsWidget from "@/components/widgets/new-job-applications";
import OnboardingQueueWidget from "@/components/widgets/onboarding-queue";
import PendingExpenseReportsWidget from "@/components/widgets/pending-expense-reports";
import TeamCapacityAlertsWidget from "@/components/widgets/team-capacity-alerts";
import TeamBirthdayAnniversaryWidget from "@/components/widgets/team-birthday-anniversary";
import TrainingCompletionWidget from "@/components/widgets/training-completion";
import TodaysAppointmentsWidget from "@/components/widgets/todays-appointments";
import UpcomingAppointmentsWidget from "@/components/widgets/upcoming-appointments";
import AppointmentNoShowsWidget from "@/components/widgets/appointment-no-shows";
import OverdueAppointmentsWidget from "@/components/widgets/overdue-appointments";
import MyMentionsWidget from "@/components/widgets/my-mentions";
import SystemAlertsWidget from "@/components/widgets/system-alerts";

interface Dashboard {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface DashboardWidget {
  id: string;
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  isActive: boolean;
}

interface UserDashboardWidget {
  id: string;
  userId: string;
  dashboardId: string;
  widgetType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  order: number;
  settings: any;
  isVisible: boolean;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: currentUserData } = useQuery<any>({
    queryKey: ["/api/auth/current-user"],
  });

  useEffect(() => {
    if (!currentUserData) return;
    if (currentUserData.role === 'Admin' || currentUserData.role === 'admin') return;
    const hasCallCenterAccess = currentUserData.granularPermissions?.some(
      (gp: any) => gp.module === 'call_center' && gp.enabled === true
    );
    const hasOtherModuleAccess = currentUserData.granularPermissions?.some(
      (gp: any) => gp.module !== 'call_center' && gp.enabled === true && 
      ['clients', 'tasks', 'sales', 'leads', 'campaigns', 'reports'].includes(gp.module)
    );
    if (hasCallCenterAccess && !hasOtherModuleAccess) {
      setLocation("/call-center");
    }
  }, [currentUserData, setLocation]);

  const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);
  const [widgetSearchTerm, setWidgetSearchTerm] = useState("");
  const [widgetCategoryFilter, setWidgetCategoryFilter] = useState<string>("all");
  const [manageDashboardsDialogOpen, setManageDashboardsDialogOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [editDashboardName, setEditDashboardName] = useState("");
  const hasInitializedDefaultDashboard = useRef(false);
  
  const { data: dashboards = [], isLoading: loadingDashboards } = useQuery<Dashboard[]>({
    queryKey: ["/api/dashboards"],
  });

  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);

  const initializeDefaultDashboardMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/dashboards", {
        name: "Main Dashboard",
        isDefault: true,
      });
    },
    onSuccess: (newDashboard) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
      setSelectedDashboardId(newDashboard.id);
      localStorage.setItem("selectedDashboardId", newDashboard.id);
    },
  });

  useEffect(() => {
    if (loadingDashboards) return;

    if (dashboards.length === 0) {
      localStorage.removeItem("selectedDashboardId");
      if (!hasInitializedDefaultDashboard.current && !initializeDefaultDashboardMutation.isPending) {
        hasInitializedDefaultDashboard.current = true;
        initializeDefaultDashboardMutation.mutate();
      }
      return;
    }

    const storedId = localStorage.getItem("selectedDashboardId");
    const isStoredIdValid = storedId && dashboards.some(d => d.id === storedId);

    if (!selectedDashboardId || !dashboards.some(d => d.id === selectedDashboardId)) {
      const targetDashboard = isStoredIdValid
        ? dashboards.find(d => d.id === storedId)!
        : (dashboards.find(d => d.isDefault) || dashboards[0]);
      
      setSelectedDashboardId(targetDashboard.id);
      localStorage.setItem("selectedDashboardId", targetDashboard.id);
    }
  }, [dashboards, selectedDashboardId, loadingDashboards, initializeDefaultDashboardMutation.isPending]);

  const { data: availableWidgets = [], isLoading: loadingAvailableWidgets } = useQuery<DashboardWidget[]>({
    queryKey: ["/api/dashboard-widgets"],
  });

  // Fetch user's granular permissions for widget filtering
  const { data: userPermissions } = useQuery<UserGranularPermissions>({
    queryKey: ["/api/user-granular-permissions"],
  });

  // Filter available widgets based on user permissions
  const permittedWidgets = useMemo(() => {
    if (!userPermissions) {
      // While loading, don't filter (or show nothing)
      return availableWidgets;
    }
    
    return availableWidgets.filter(widget => 
      canAccessWidget(widget.type, userPermissions.permissions, userPermissions.isAdmin)
    );
  }, [availableWidgets, userPermissions]);

  const { data: userWidgets = [], isLoading: loadingUserWidgets } = useQuery<UserDashboardWidget[]>({
    queryKey: ["/api/user-dashboard-widgets", selectedDashboardId],
    enabled: !!selectedDashboardId,
    queryFn: async () => {
      if (!selectedDashboardId) return [];
      const response = await fetch(`/api/user-dashboard-widgets?dashboardId=${selectedDashboardId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch widgets");
      return response.json();
    },
  });

  const createDashboardMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/dashboards", {
        name,
        isDefault: dashboards.length === 0,
      });
    },
    onSuccess: (newDashboard) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
      setNewDashboardName("");
      setSelectedDashboardId(newDashboard.id);
      localStorage.setItem("selectedDashboardId", newDashboard.id);
      toast({
        title: "Dashboard created",
        variant: "success",
        description: `Dashboard "${newDashboard.name}" has been created`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create dashboard",
        variant: "destructive",
      });
    },
  });

  const updateDashboardMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return await apiRequest("PUT", `/api/dashboards/${id}`, { name });
    },
    onSuccess: (updatedDashboard) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
      setEditingDashboard(null);
      setEditDashboardName("");
      toast({
        title: "Dashboard renamed",
        variant: "success",
        description: `Dashboard renamed to "${updatedDashboard.name}"`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to rename dashboard",
        variant: "destructive",
      });
    },
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/dashboards/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
      if (selectedDashboardId === deletedId) {
        const remaining = dashboards.filter(d => d.id !== deletedId);
        if (remaining.length > 0) {
          setSelectedDashboardId(remaining[0].id);
          localStorage.setItem("selectedDashboardId", remaining[0].id);
        }
      }
      toast({
        title: "Dashboard deleted",
        variant: "success",
        description: "Dashboard has been deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete dashboard",
        variant: "destructive",
      });
    },
  });

  const setDefaultDashboardMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/dashboards/${id}/set-default`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
      toast({
        title: "Default dashboard set",
        variant: "success",
        description: "This dashboard is now your default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set default dashboard",
        variant: "destructive",
      });
    },
  });

  const reorderDashboardsMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; displayOrder: number }>) => {
      return await apiRequest("POST", "/api/dashboards/reorder", { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reorder dashboards",
        variant: "destructive",
      });
    },
  });

  const addWidgetMutation = useMutation({
    mutationFn: async (widgetType: string) => {
      if (!selectedDashboardId) throw new Error("No dashboard selected");
      const widget = availableWidgets.find(w => w.type === widgetType);
      if (!widget) throw new Error("Widget not found");

      const maxOrder = userWidgets.length > 0 ? Math.max(...userWidgets.map(w => w.order)) : -1;

      return await apiRequest("POST", "/api/user-dashboard-widgets", {
        dashboardId: selectedDashboardId,
        widgetType: widget.type,
        x: 0,
        y: 0,
        width: widget.defaultWidth,
        height: widget.defaultHeight,
        order: maxOrder + 1,
        settings: {},
        isVisible: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-dashboard-widgets", selectedDashboardId] });
      setAddWidgetDialogOpen(false);
      toast({
        title: "Widget added",
        variant: "success",
        description: "Widget has been added to your dashboard",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add widget",
        variant: "destructive",
      });
    },
  });

  const removeWidgetMutation = useMutation({
    mutationFn: async (widgetId: string) => {
      return await apiRequest("DELETE", `/api/user-dashboard-widgets/${widgetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-dashboard-widgets", selectedDashboardId] });
      toast({
        title: "Widget removed",
        variant: "success",
        description: "Widget has been removed from your dashboard",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove widget",
        variant: "destructive",
      });
    },
  });

  const updateLayoutMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; x: number; y: number; width: number; height: number }>) => {
      return await apiRequest("POST", "/api/user-dashboard-widgets/bulk-update", { widgets: updates });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/user-dashboard-widgets", selectedDashboardId] });
      const previousWidgets = queryClient.getQueryData(["/api/user-dashboard-widgets", selectedDashboardId]);
      return { previousWidgets };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousWidgets) {
        queryClient.setQueryData(["/api/user-dashboard-widgets", selectedDashboardId], context.previousWidgets);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update widget layout",
        variant: "destructive",
      });
    },
  });

  const renderWidget = (userWidget: UserDashboardWidget) => {
    const props = {
      userWidget,
      onRemove: () => removeWidgetMutation.mutate(userWidget.id),
    };

    switch (userWidget.widgetType) {
      case "client_health_overview":
        return <ClientHealthOverviewWidget {...props} />;
      case "recent_clients":
        return <RecentClientsWidget {...props} />;
      case "client_approval_queue":
        return <ClientApprovalQueueWidget {...props} />;
      case "client_distribution_by_vertical":
        return <ClientDistributionByVerticalWidget {...props} />;
      case "client_portal_activity":
        return <ClientPortalActivityWidget {...props} />;
      case "client_team_assignments":
        return <ClientTeamAssignmentsWidget {...props} />;
      case "sales_pipeline_overview":
        return <SalesPipelineOverviewWidget {...props} />;
      case "quote_status_summary":
        return <QuoteStatusSummaryWidget {...props} />;
      case "revenue_this_month":
        return <RevenueThisMonthWidget {...props} />;
      case "mrr_tracker":
        return <MRRTrackerWidget {...props} />;
      case "win_rate":
        return <WinRateWidget {...props} />;
      case "top_performing_sales_reps":
        return <TopPerformingSalesRepsWidget {...props} />;
      case "recent_deals_won":
        return <RecentDealsWonWidget {...props} />;
      case "my_tasks":
        return <MyTasksWidget {...props} />;
      case "overdue_tasks":
        return <OverdueTasksWidget {...props} />;
      case "tasks_due_this_week":
        return <TasksDueThisWeekWidget {...props} />;
      case "task_completion_rate":
        return <TaskCompletionRateWidget {...props} />;
      case "tasks_requiring_approval":
        return <TasksRequiringApprovalWidget {...props} />;
      case "tasks_by_status":
        return <TasksByStatusWidget {...props} />;
      case "time_tracked_this_week":
        return <TimeTrackedThisWeekWidget {...props} />;
      case "team_workload":
        return <TeamWorkloadWidget {...props} />;
      case "new_leads_today_week":
        return <NewLeadsTodayWeekWidget {...props} />;
      case "leads_by_pipeline_stage":
        return <LeadsByPipelineStageWidget {...props} />;
      case "my_assigned_leads":
        return <MyAssignedLeadsWidget {...props} />;
      case "stale_leads":
        return <StaleLeadsWidget {...props} />;
      case "lead_conversion_rate":
        return <LeadConversionRateWidget {...props} />;
      case "lead_source_breakdown":
        return <LeadSourceBreakdownWidget {...props} />;
      case "pending_time_off_requests":
        return <PendingTimeOffWidget {...props} />;
      case "whos_off_today_week":
        return <WhosOffTodayWeekWidget {...props} />;
      case "new_job_applications":
        return <NewJobApplicationsWidget {...props} />;
      case "onboarding_queue":
        return <OnboardingQueueWidget {...props} />;
      case "pending_expense_reports":
        return <PendingExpenseReportsWidget {...props} />;
      case "team_capacity_alerts":
        return <TeamCapacityAlertsWidget {...props} />;
      case "team_birthday_anniversary":
        return <TeamBirthdayAnniversaryWidget {...props} />;
      case "training_completion_status":
        return <TrainingCompletionWidget {...props} />;
      case "todays_appointments":
        return <TodaysAppointmentsWidget {...props} />;
      case "upcoming_appointments":
        return <UpcomingAppointmentsWidget {...props} />;
      case "appointment_no_shows":
        return <AppointmentNoShowsWidget {...props} />;
      case "overdue_appointments":
        return <OverdueAppointmentsWidget {...props} />;
      case "my_mentions":
        return <MyMentionsWidget {...props} />;
      case "system_alerts":
        return <SystemAlertsWidget {...props} />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Unknown Widget</CardTitle>
              <CardDescription>Widget type: {userWidget.widgetType}</CardDescription>
            </CardHeader>
          </Card>
        );
    }
  };

  const alreadyAddedTypes = userWidgets.map(w => w.widgetType);
  // Use permittedWidgets to only show widgets user has permission to access
  const availableToAdd = permittedWidgets
    .filter(w => !alreadyAddedTypes.includes(w.type))
    .filter(w => {
      // Filter by category
      if (widgetCategoryFilter !== "all" && w.category !== widgetCategoryFilter) {
        return false;
      }
      // Filter by search term
      if (!widgetSearchTerm) return true;
      const searchLower = widgetSearchTerm.toLowerCase();
      return (
        w.name.toLowerCase().includes(searchLower) ||
        w.description.toLowerCase().includes(searchLower) ||
        w.category.toLowerCase().includes(searchLower)
      );
    });

  const layout = useMemo(() => {
    return userWidgets.map(widget => ({
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.width,
      h: widget.height,
      minW: 1,
      minH: 1,
    }));
  }, [userWidgets]);

  const handleLayoutSave = (newLayout: any[]) => {
    const updates = newLayout.map(item => {
      const widget = userWidgets.find(w => w.id === item.i);
      if (!widget) return null;
      
      if (widget.x !== item.x || widget.y !== item.y || widget.width !== item.w || widget.height !== item.h) {
        return {
          id: item.i,
          x: item.x,
          y: item.y,
          width: item.w,
          height: item.h,
        };
      }
      return null;
    }).filter(Boolean);

    if (updates.length > 0) {
      queryClient.setQueryData(["/api/user-dashboard-widgets", selectedDashboardId], (oldData: UserDashboardWidget[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(widget => {
          const update = updates.find(u => u && u.id === widget.id);
          if (update) {
            return { ...widget, x: update.x, y: update.y, width: update.width, height: update.height };
          }
          return widget;
        });
      });
      
      updateLayoutMutation.mutate(updates as any);
    }
  };

  const handleDashboardSwitch = (dashboardId: string) => {
    setSelectedDashboardId(dashboardId);
    localStorage.setItem("selectedDashboardId", dashboardId);
  };

  const handleCreateDashboard = () => {
    if (!newDashboardName.trim()) {
      toast({
        title: "Error",
        description: "Dashboard name is required",
        variant: "destructive",
      });
      return;
    }
    createDashboardMutation.mutate(newDashboardName.trim());
  };

  const handleUpdateDashboard = () => {
    if (!editingDashboard || !editDashboardName.trim()) return;
    updateDashboardMutation.mutate({
      id: editingDashboard.id,
      name: editDashboardName.trim(),
    });
  };

  const handleMoveDashboard = (dashboardId: string, direction: "up" | "down") => {
    const currentIndex = dashboards.findIndex(d => d.id === dashboardId);
    if (currentIndex === -1) return;
    
    const dashboard = dashboards[currentIndex];
    
    // Prevent moving the default dashboard
    if (dashboard.isDefault) {
      toast({
        title: "Cannot move default dashboard",
        variant: "success",
        description: "The default dashboard must remain in the first position",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate new index
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    // Prevent moving before the default dashboard (position 0)
    if (newIndex === 0) {
      toast({
        title: "Cannot move before default dashboard",
        variant: "success",
        description: "The default dashboard must remain in the first position",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent moving out of bounds
    if (newIndex < 0 || newIndex >= dashboards.length) return;
    
    // Reorder dashboards
    const reorderedDashboards = Array.from(dashboards);
    const [removed] = reorderedDashboards.splice(currentIndex, 1);
    reorderedDashboards.splice(newIndex, 0, removed);
    
    // Create updates with new display orders
    const updates = reorderedDashboards.map((dashboard, index) => ({
      id: dashboard.id,
      displayOrder: index,
    }));
    
    // Optimistically update the UI
    queryClient.setQueryData(["/api/dashboards"], reorderedDashboards.map((d, i) => ({
      ...d,
      displayOrder: i,
    })));
    
    // Save to backend
    reorderDashboardsMutation.mutate(updates);
  };

  if (loadingDashboards || loadingAvailableWidgets || (loadingUserWidgets && selectedDashboardId)) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const selectedDashboard = dashboards.find(d => d.id === selectedDashboardId);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" data-testid="heading-dashboard">Dashboard</h1>
        <div className="flex gap-2">
          <Dialog open={manageDashboardsDialogOpen} onOpenChange={setManageDashboardsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-manage-dashboards">
                <Settings className="h-4 w-4 mr-2" />
                Manage Dashboards
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Manage Dashboards</DialogTitle>
                <DialogDescription>
                  Create, rename, and organize your dashboards
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Create New Dashboard</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Dashboard name"
                      value={newDashboardName}
                      onChange={(e) => setNewDashboardName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateDashboard()}
                      data-testid="input-new-dashboard-name"
                    />
                    <Button
                      onClick={handleCreateDashboard}
                      disabled={!newDashboardName.trim()}
                      data-testid="button-create-dashboard"
                    >
                      Create
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Your Dashboards</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-4">
                    {dashboards.map((dashboard, index) => (
                      <Card key={dashboard.id} data-testid={`card-dashboard-${dashboard.id}`}>
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              {dashboard.isDefault ? (
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" data-testid={`icon-default-${dashboard.id}`} />
                              ) : (
                                <LayoutDashboard className="h-4 w-4 text-muted-foreground" data-testid={`icon-dashboard-${dashboard.id}`} />
                              )}
                              {editingDashboard?.id === dashboard.id ? (
                                <Input
                                  value={editDashboardName}
                                  onChange={(e) => setEditDashboardName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdateDashboard();
                                    if (e.key === "Escape") {
                                      setEditingDashboard(null);
                                      setEditDashboardName("");
                                    }
                                  }}
                                  className="h-8"
                                  autoFocus
                                  data-testid={`input-edit-dashboard-${dashboard.id}`}
                                />
                              ) : (
                                <CardTitle className="text-base">{dashboard.name}</CardTitle>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {!dashboard.isDefault && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMoveDashboard(dashboard.id, "up")}
                                    disabled={index === 1}
                                    data-testid={`button-move-up-${dashboard.id}`}
                                    title="Move up"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMoveDashboard(dashboard.id, "down")}
                                    disabled={index === dashboards.length - 1}
                                    data-testid={`button-move-down-${dashboard.id}`}
                                    title="Move down"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" data-testid={`button-dashboard-menu-${dashboard.id}`}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {editingDashboard?.id === dashboard.id ? (
                                    <DropdownMenuItem onClick={handleUpdateDashboard} data-testid={`button-save-rename-${dashboard.id}`}>
                                      Save
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingDashboard(dashboard);
                                        setEditDashboardName(dashboard.name);
                                      }}
                                      data-testid={`button-rename-${dashboard.id}`}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Rename
                                    </DropdownMenuItem>
                                  )}
                                  {!dashboard.isDefault && (
                                    <DropdownMenuItem
                                      onClick={() => setDefaultDashboardMutation.mutate(dashboard.id)}
                                      data-testid={`button-set-default-${dashboard.id}`}
                                    >
                                      <Star className="h-4 w-4 mr-2" />
                                      Set as Default
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => deleteDashboardMutation.mutate(dashboard.id)}
                                    className="text-destructive"
                                    disabled={dashboards.length === 1}
                                    data-testid={`button-delete-${dashboard.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={addWidgetDialogOpen} onOpenChange={(open) => {
            setAddWidgetDialogOpen(open);
            if (!open) {
              setWidgetSearchTerm("");
              setWidgetCategoryFilter("all");
            }
          }}>
            <DialogTrigger asChild>
              <Button disabled={!selectedDashboardId} data-testid="button-add-widget">
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Widget</DialogTitle>
                <DialogDescription>
                  Choose a widget to add to your dashboard
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mb-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={widgetCategoryFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWidgetCategoryFilter("all")}
                    data-testid="filter-category-all"
                  >
                    All
                  </Button>
                  <Button
                    variant={widgetCategoryFilter === "client_management" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWidgetCategoryFilter("client_management")}
                    data-testid="filter-category-client-management"
                    className={widgetCategoryFilter === "client_management" ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    Client Management
                  </Button>
                  <Button
                    variant={widgetCategoryFilter === "sales" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWidgetCategoryFilter("sales")}
                    data-testid="filter-category-sales"
                    className={widgetCategoryFilter === "sales" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    Sales & Revenue
                  </Button>
                  <Button
                    variant={widgetCategoryFilter === "tasks" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWidgetCategoryFilter("tasks")}
                    data-testid="filter-category-tasks"
                    className={widgetCategoryFilter === "tasks" ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    Tasks
                  </Button>
                  <Button
                    variant={widgetCategoryFilter === "lead_management" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWidgetCategoryFilter("lead_management")}
                    data-testid="filter-category-leads"
                    className={widgetCategoryFilter === "lead_management" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                  >
                    Leads
                  </Button>
                  <Button
                    variant={widgetCategoryFilter === "hr_team" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWidgetCategoryFilter("hr_team")}
                    data-testid="filter-category-hr-team"
                    className={widgetCategoryFilter === "hr_team" ? "bg-orange-600 hover:bg-orange-700" : ""}
                  >
                    HR & Team
                  </Button>
                  <Button
                    variant={widgetCategoryFilter === "calendar_appointments" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWidgetCategoryFilter("calendar_appointments")}
                    data-testid="filter-category-calendar"
                    className={widgetCategoryFilter === "calendar_appointments" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                  >
                    Calendar & Appointments
                  </Button>
                  <Button
                    variant={widgetCategoryFilter === "activity_alerts" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWidgetCategoryFilter("activity_alerts")}
                    data-testid="filter-category-activity-alerts"
                    className={widgetCategoryFilter === "activity_alerts" ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    Activity & Alerts
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search widgets..."
                    value={widgetSearchTerm}
                    onChange={(e) => setWidgetSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-widgets"
                  />
                </div>
              </div>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-2 pr-4">
                  {availableToAdd.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {widgetSearchTerm ? "No widgets match your search" : "All available widgets have been added to your dashboard"}
                    </p>
                  ) : (
                    availableToAdd.map((widget) => {
                      // Format category for display
                      const categoryDisplay = widget.category
                        ?.split('_')
                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ') || 'General';
                      
                      // Color mapping for categories
                      const categoryColors: Record<string, string> = {
                        'client_management': 'bg-blue-100 text-blue-800 border-blue-200',
                        'sales_revenue': 'bg-green-100 text-green-800 border-green-200',
                        'sales': 'bg-green-100 text-green-800 border-green-200',
                        'tasks': 'bg-purple-100 text-purple-800 border-purple-200',
                        'lead_management': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        'hr_team': 'bg-orange-100 text-orange-800 border-orange-200',
                        'analytics': 'bg-orange-100 text-orange-800 border-orange-200',
                        'calendar_appointments': 'bg-cyan-100 text-cyan-800 border-cyan-200',
                        'activity_alerts': 'bg-red-100 text-red-800 border-red-200',
                      };
                      
                      const categoryColor = categoryColors[widget.category] || 'bg-gray-100 text-gray-800 border-gray-200';
                      
                      return (
                        <Card
                          key={widget.id}
                          className="cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => addWidgetMutation.mutate(widget.type)}
                          data-testid={`card-available-widget-${widget.type}`}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="text-base">{widget.name}</CardTitle>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${categoryColor}`}
                                    data-testid={`badge-category-${widget.type}`}
                                  >
                                    {categoryDisplay}
                                  </Badge>
                                </div>
                                <CardDescription className="text-sm mt-1">
                                  {widget.description}
                                </CardDescription>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addWidgetMutation.mutate(widget.type);
                                }}
                                data-testid={`button-add-${widget.type}`}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {dashboards.length > 1 && (
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" data-testid="tabs-dashboards">
            {dashboards.map((dashboard) => (
              <button
                key={dashboard.id}
                onClick={() => handleDashboardSwitch(dashboard.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  selectedDashboardId === dashboard.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                data-testid={`tab-dashboard-${dashboard.id}`}
              >
                {dashboard.isDefault ? (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ) : (
                  <LayoutDashboard className="h-4 w-4" />
                )}
                {dashboard.name}
              </button>
            ))}
          </nav>
        </div>
      )}

      {!selectedDashboardId ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your Dashboard</CardTitle>
            <CardDescription>
              Create your first dashboard to get started
            </CardDescription>
          </CardHeader>
        </Card>
      ) : userWidgets.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to {selectedDashboard?.name}</CardTitle>
            <CardDescription>
              Click "Add Widget" to start customizing this dashboard with widgets
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={60}
          onDragStop={handleLayoutSave}
          onResizeStop={handleLayoutSave}
          draggableHandle=".widget-drag-handle"
          isDraggable={true}
          isResizable={true}
          compactType="vertical"
          preventCollision={false}
        >
          {userWidgets.map((userWidget) => (
            <div key={userWidget.id} data-testid={`widget-${userWidget.widgetType}`}>
              {renderWidget(userWidget)}
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
