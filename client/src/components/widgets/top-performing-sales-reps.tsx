import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Trash2, GripVertical } from "lucide-react";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function TopPerformingSalesRepsWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card data-testid="widget-top-performing-sales-reps" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Top Performing Sales Reps
            </CardTitle>
            <CardDescription className="text-xs">
              Leaderboard by deals closed/revenue
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
            {data?.map((rep: any, index: number) => (
              <div key={rep.staffId} className="flex items-center gap-3" data-testid={`rep-${rep.staffId}`}>
                <div className="text-xl w-6 text-center">
                  {index < 3 ? medals[index] : `#${index + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{rep.staffName}</div>
                  <div className="text-xs text-muted-foreground">
                    ${(rep.totalRevenue || 0).toLocaleString()} revenue
                  </div>
                </div>
                <div className="text-sm font-semibold">{rep.dealsWon} deals</div>
              </div>
            ))}
            {(!data || data.length === 0) && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No sales data available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
