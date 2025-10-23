import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Trash2 } from "lucide-react";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function ClientDistributionByVerticalWidget({ userWidget, onRemove }: WidgetProps) {
  const { data: distribution = [], isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  const total = distribution.reduce((sum: number, item: any) => sum + item.count, 0);

  return (
    <Card data-testid="widget-client-distribution-by-vertical">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            Client Distribution
          </CardTitle>
          <CardDescription className="text-xs">
            Breakdown by vertical
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          data-testid="button-remove-widget"
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : distribution.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No clients yet
          </p>
        ) : (
          <div className="space-y-2">
            {distribution.slice(0, 5).map((item: any, index: number) => {
              const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
              return (
                <div key={index} className="space-y-1" data-testid={`vertical-item-${index}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.vertical}</span>
                    <span className="text-muted-foreground">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {distribution.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{distribution.length - 5} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
