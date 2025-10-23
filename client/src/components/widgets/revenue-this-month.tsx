import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Trash2, GripVertical } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function RevenueThisMonthWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-revenue-this-month" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Revenue This Month
            </CardTitle>
            <CardDescription className="text-xs">
              Total revenue vs. target
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
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold" data-testid="revenue-actual">
                  ${(data?.actual || 0).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  of ${(data?.target || 0).toLocaleString()}
                </span>
              </div>
              <Progress value={parseFloat(data?.percentage || '0')} className="h-2" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Deals Closed</span>
              <span className="font-semibold" data-testid="deals-count">{data?.deals || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="font-semibold text-primary" data-testid="revenue-percentage">
                {data?.percentage || '0.0'}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
