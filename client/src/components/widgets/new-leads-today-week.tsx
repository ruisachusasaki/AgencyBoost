import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Trash2, GripVertical } from "lucide-react";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function NewLeadsTodayWeekWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-new-leads-today-week" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              New Leads Today/This Week
            </CardTitle>
            <CardDescription className="text-xs">
              Recent lead captures
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
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary" data-testid="leads-today">
                {data?.today || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Today</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary" data-testid="leads-this-week">
                {data?.thisWeek || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">This Week</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
