import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, X, AlertTriangle, AlertCircle, Info, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface UserDashboardWidget {
  id: string;
  widgetType: string;
}

interface SystemAlertsWidgetProps {
  userWidget: UserDashboardWidget;
  onRemove: () => void;
}

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
}

export default function SystemAlertsWidget({ userWidget, onRemove }: SystemAlertsWidgetProps) {
  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'normal':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      normal: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      <Badge variant="outline" className={`${styles[priority as keyof typeof styles] || styles.normal} text-xs`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <Card className="h-full flex flex-col" data-testid={`widget-${userWidget.widgetType}`}>
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold truncate">System Alerts</CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs" data-testid="badge-unread-count">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs truncate">Important notifications and warnings</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 flex-shrink-0"
            data-testid="button-remove-widget"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No alerts</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto pr-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border transition-colors ${
                  !alert.isRead ? 'bg-accent/50 border-primary/20' : 'bg-card'
                }`}
                data-testid={`alert-${alert.id}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    {getPriorityIcon(alert.priority)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold truncate">{alert.title}</p>
                          {!alert.isRead && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {getPriorityBadge(alert.priority)}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {alert.actionUrl && alert.actionText && (
                      <Link href={alert.actionUrl}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          data-testid={`button-alert-action-${alert.id}`}
                        >
                          {alert.actionText}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {alerts.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <Link href="/settings/notifications" className="block">
              <Button variant="ghost" size="sm" className="w-full" data-testid="button-view-all-alerts">
                View All Notifications
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
