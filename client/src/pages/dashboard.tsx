import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Settings, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import ClientHealthOverviewWidget from "@/components/widgets/client-health-overview";
import RecentClientsWidget from "@/components/widgets/recent-clients";
import ClientApprovalQueueWidget from "@/components/widgets/client-approval-queue";
import ClientDistributionByVerticalWidget from "@/components/widgets/client-distribution-by-vertical";
import ClientPortalActivityWidget from "@/components/widgets/client-portal-activity";
import ClientTeamAssignmentsWidget from "@/components/widgets/client-team-assignments";

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

  const { data: availableWidgets = [], isLoading: loadingAvailableWidgets } = useQuery<DashboardWidget[]>({
    queryKey: ["/api/dashboard-widgets"],
  });

  const { data: userWidgets = [], isLoading: loadingUserWidgets } = useQuery<UserDashboardWidget[]>({
    queryKey: ["/api/user-dashboard-widgets"],
  });

  const addWidgetMutation = useMutation({
    mutationFn: async (widgetType: string) => {
      const widget = availableWidgets.find(w => w.type === widgetType);
      if (!widget) throw new Error("Widget not found");

      const maxOrder = userWidgets.length > 0 ? Math.max(...userWidgets.map(w => w.order)) : -1;

      return await apiRequest("POST", "/api/user-dashboard-widgets", {
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
      queryClient.invalidateQueries({ queryKey: ["/api/user-dashboard-widgets"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/user-dashboard-widgets"] });
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
  const availableToAdd = availableWidgets.filter(w => !alreadyAddedTypes.includes(w.type));

  if (loadingAvailableWidgets || loadingUserWidgets) {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" data-testid="heading-dashboard">Dashboard</h1>
        <Dialog open={addWidgetDialogOpen} onOpenChange={setAddWidgetDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-widget">
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
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2 pr-4">
                {availableToAdd.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    All available widgets have been added to your dashboard
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

      {userWidgets.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your Dashboard</CardTitle>
            <CardDescription>
              Click "Add Widget" to start customizing your dashboard with widgets
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {userWidgets.map((userWidget) => (
            <div key={userWidget.id} data-testid={`widget-${userWidget.widgetType}`}>
              {renderWidget(userWidget)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
