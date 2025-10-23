import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trash2, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function RecentDealsWonWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-recent-deals-won" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Recent Deals Won
            </CardTitle>
            <CardDescription className="text-xs">
              Latest closed deals
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
            {data?.map((deal: any) => (
              <div key={deal.id} className="space-y-1 border-b pb-2 last:border-0 last:pb-0" data-testid={`deal-${deal.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{deal.companyName}</div>
                    <div className="text-xs text-muted-foreground">
                      {deal.contactName} • {deal.staffName}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    ${(deal.estimatedValue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(deal.wonDate), { addSuffix: true })}
                </div>
              </div>
            ))}
            {(!data || data.length === 0) && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No recent deals
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
