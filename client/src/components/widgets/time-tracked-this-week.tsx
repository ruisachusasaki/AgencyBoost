import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, GripVertical, BarChart3 } from "lucide-react";
import { Link } from "wouter";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function TimeTrackedThisWeekWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-time-tracked-this-week" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Time Tracked This Week
            </CardTitle>
            <CardDescription className="text-xs">
              Your weekly time tracking
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link href="/reports">
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-view-reports"
              className="h-8 w-8 p-0"
              title="View detailed task reports"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            data-testid="button-remove-widget"
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary" data-testid="time-formatted">
                {data?.formatted || '0h 0m'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total time tracked
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold" data-testid="hours">
                  {data?.hours || 0}
                </div>
                <div className="text-xs text-muted-foreground">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" data-testid="minutes">
                  {data?.minutes || 0}
                </div>
                <div className="text-xs text-muted-foreground">Minutes</div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Minutes</span>
                <span className="font-semibold" data-testid="total-minutes">
                  {data?.totalMinutes || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
