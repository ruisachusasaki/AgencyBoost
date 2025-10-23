import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Trash2, GripVertical } from "lucide-react";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function WinRateWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-win-rate" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Win Rate
            </CardTitle>
            <CardDescription className="text-xs">
              Deal close rate percentage
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
            <div className="text-center">
              <div className="text-5xl font-bold text-primary" data-testid="win-rate-percentage">
                {data?.winRate || '0.0'}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Win Rate
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Won</div>
                <div className="text-lg font-semibold text-green-600" data-testid="deals-won">{data?.won || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Lost</div>
                <div className="text-lg font-semibold text-red-600" data-testid="deals-lost">{data?.lost || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-lg font-semibold" data-testid="deals-total">{data?.total || 0}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
