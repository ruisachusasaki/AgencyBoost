import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Settings, Trash2, Search, MoreVertical, Star, Edit, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GridLayout, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(GridLayout);

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

interface Dashboard {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
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
  const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);
  const [widgetSearchTerm, setWidgetSearchTerm] = useState("");
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
  const availableToAdd = availableWidgets
    .filter(w => !alreadyAddedTypes.includes(w.type))
    .filter(w => {
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
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2 pr-4">
                      {dashboards.map((dashboard) => (
                        <Card key={dashboard.id} data-testid={`card-dashboard-${dashboard.id}`}>
                          <CardHeader className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {dashboard.isDefault && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" data-testid={`icon-default-${dashboard.id}`} />
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
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={addWidgetDialogOpen} onOpenChange={(open) => {
            setAddWidgetDialogOpen(open);
            if (!open) setWidgetSearchTerm("");
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
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search widgets..."
                  value={widgetSearchTerm}
                  onChange={(e) => setWidgetSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-widgets"
                />
              </div>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-2 pr-4">
                  {availableToAdd.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {widgetSearchTerm ? "No widgets match your search" : "All available widgets have been added to your dashboard"}
                    </p>
                  ) : (
                    availableToAdd.map((widget) => (
                      <Card
                        key={widget.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => addWidgetMutation.mutate(widget.type)}
                        data-testid={`card-available-widget-${widget.type}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{widget.name}</CardTitle>
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
                    ))
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {dashboards.length > 1 && (
        <Tabs value={selectedDashboardId || ""} onValueChange={handleDashboardSwitch}>
          <TabsList data-testid="tabs-dashboards">
            {dashboards.map((dashboard) => (
              <TabsTrigger
                key={dashboard.id}
                value={dashboard.id}
                data-testid={`tab-dashboard-${dashboard.id}`}
              >
                {dashboard.isDefault && <Home className="h-3 w-3 mr-1" />}
                {dashboard.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
