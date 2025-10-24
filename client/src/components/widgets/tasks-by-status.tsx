import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Trash2, GripVertical } from "lucide-react";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function TasksByStatusWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  const statusConfig = {
    todo: { label: 'To Do', color: 'bg-slate-500' },
    in_progress: { label: 'In Progress', color: 'bg-primary' },
    completed: { label: 'Completed', color: 'bg-green-500' },
    cancelled: { label: 'Cancelled', color: 'bg-gray-400' },
  };

  const total = data ? (data.todo || 0) + (data.in_progress || 0) + (data.completed || 0) + (data.cancelled || 0) : 0;

  const getPercentage = (value: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(0) : '0';
  };

  return (
    <Card data-testid="widget-tasks-by-status" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Tasks by Status
            </CardTitle>
            <CardDescription className="text-xs">
              Task distribution overview
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
        ) : (
          <div className="space-y-4">
            <div className="text-center pb-4 border-b">
              <div className="text-3xl font-bold" data-testid="total-tasks">{total}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="space-y-3">
              {Object.entries(statusConfig).map(([status, config]) => {
                const count = data?.[status as keyof typeof data] || 0;
                const percentage = getPercentage(count);
                return (
                  <div key={status} data-testid={`status-${status}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{config.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${config.color} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                        data-testid={`bar-${status}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
