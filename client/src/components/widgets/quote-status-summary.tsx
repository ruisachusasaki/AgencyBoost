import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, GripVertical } from "lucide-react";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
};

export default function QuoteStatusSummaryWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-quote-status-summary" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Quote Status Summary
            </CardTitle>
            <CardDescription className="text-xs">
              Pending/sent/accepted/rejected quotes
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
          <div className="space-y-3">
            {data?.map((item: any) => (
              <div key={item.status} className="flex items-center justify-between" data-testid={`status-${item.status}`}>
                <div className="flex items-center gap-2 flex-1">
                  <div className={`h-3 w-3 rounded-full ${statusColors[item.status] || 'bg-gray-400'}`} />
                  <div>
                    <div className="text-sm font-medium capitalize">{item.status}</div>
                    <div className="text-xs text-muted-foreground">
                      ${(item.totalValue || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
            {(!data || data.length === 0) && (
              <div className="text-center text-sm text-muted-foreground py-4">
                No quotes available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
