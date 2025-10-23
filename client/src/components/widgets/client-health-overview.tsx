import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function ClientHealthOverviewWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/dashboard-widgets", userWidget.widgetType, "data"],
  });

  return (
    <Card data-testid="widget-client-health-overview">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Client Health Overview
          </CardTitle>
          <CardDescription className="text-xs">
            Distribution by health indicator
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
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Green</span>
              </div>
              <span className="font-semibold" data-testid="count-green">{data?.Green || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Yellow</span>
              </div>
              <span className="font-semibold" data-testid="count-yellow">{data?.Yellow || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">Red</span>
              </div>
              <span className="font-semibold" data-testid="count-red">{data?.Red || 0}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between font-medium">
                <span className="text-sm">Total Clients</span>
                <span data-testid="count-total">{data?.total || 0}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
