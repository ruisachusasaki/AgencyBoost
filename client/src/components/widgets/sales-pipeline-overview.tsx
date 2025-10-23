import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Trash2, GripVertical } from "lucide-react";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function SalesPipelineOverviewWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-sales-pipeline-overview" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Sales Pipeline Overview
            </CardTitle>
            <CardDescription className="text-xs">
              Leads by stage with conversion metrics
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
            <div className="grid grid-cols-2 gap-4 pb-3 border-b">
              <div>
                <div className="text-xs text-muted-foreground">Total Leads</div>
                <div className="text-2xl font-bold" data-testid="total-leads">{data?.totalLeads || 0}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Conversion Rate</div>
                <div className="text-2xl font-bold text-primary" data-testid="conversion-rate">{data?.conversionRate || '0.0'}%</div>
              </div>
            </div>
            <div className="space-y-2">
              {data?.stages?.map((stage: any) => (
                <div key={stage.stage} className="flex items-center justify-between" data-testid={`stage-${stage.stage}`}>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{stage.stage}</div>
                    <div className="text-xs text-muted-foreground">
                      ${(stage.totalValue || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{stage.count}</div>
                </div>
              ))}
              {(!data?.stages || data.stages.length === 0) && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No pipeline data available
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
