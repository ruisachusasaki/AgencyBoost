import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Trash2, GripVertical } from "lucide-react";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function MRRTrackerWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Card data-testid="widget-mrr-tracker" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LineChart className="h-4 w-4 text-primary" />
              MRR Tracker
            </CardTitle>
            <CardDescription className="text-xs">
              Monthly Recurring Revenue trends
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
          <div className="space-y-2">
            {data?.map((item: any, index: number) => (
              <div key={item.month} className="flex items-center justify-between" data-testid={`mrr-month-${item.month}`}>
                <span className="text-sm text-muted-foreground">{formatMonth(item.month)}</span>
                <span className="font-semibold">${(item.mrr || 0).toLocaleString()}</span>
              </div>
            ))}
            {(!data || data.length === 0) && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No MRR data available
              </div>
            )}
            {data && data.length > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-sm">Latest MRR</span>
                  <span className="text-primary" data-testid="latest-mrr">
                    ${(data[data.length - 1]?.mrr || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
