import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function LeadSourceBreakdownWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'website': 'bg-blue-500',
      'referral': 'bg-green-500',
      'social_media': 'bg-purple-500',
      'advertising': 'bg-orange-500',
      'cold_outreach': 'bg-red-500',
      'Unknown': 'bg-gray-500',
    };
    return colors[source] || 'bg-gray-500';
  };

  const formatSource = (source: string) => {
    return source.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card data-testid="widget-lead-source-breakdown" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Lead Source Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Leads by acquisition channel
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
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {data && data.length > 0 ? (
              data.map((item: any, index: number) => (
                <div
                  key={index}
                  data-testid={`source-${item.source}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getSourceColor(item.source)}`} />
                    <p className="font-medium text-sm" data-testid={`source-name-${item.source}`}>
                      {formatSource(item.source)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold" data-testid={`source-count-${item.source}`}>
                    {item.count}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No lead sources</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
