import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Trash2, GripVertical } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function LeadConversionRateWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-lead-conversion-rate" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Lead Conversion Rate
            </CardTitle>
            <CardDescription className="text-xs">
              Lead-to-client conversion
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
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold" data-testid="conversion-rate">
                  {data?.rate || '0.0'}%
                </span>
                <span className="text-sm text-muted-foreground">
                  conversion rate
                </span>
              </div>
              <Progress value={parseFloat(data?.rate || '0')} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold text-primary" data-testid="converted-count">
                  {data?.converted || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold" data-testid="total-leads-count">
                  {data?.total || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
