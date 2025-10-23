import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Trash2, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function ClientPortalActivityWidget({ userWidget, onRemove }: WidgetProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-client-portal-activity" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Portal Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Recent client portal logins
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          data-testid="button-remove-widget"
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent portal activity
          </p>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 5).map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-start justify-between p-2 rounded hover:bg-accent transition-colors"
                data-testid={`activity-item-${activity.id}`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {activity.firstName} {activity.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.clientName} • {activity.lastLogin ? formatDistanceToNow(new Date(activity.lastLogin), { addSuffix: true }) : 'Never'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
