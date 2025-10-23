import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function ClientApprovalQueueWidget({ userWidget, onRemove }: WidgetProps) {
  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["/api/dashboard-widgets", userWidget.widgetType, "data"],
  });

  return (
    <Card data-testid="widget-client-approval-queue">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Client Approval Queue
          </CardTitle>
          <CardDescription className="text-xs">
            Tasks pending client approval
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
        ) : approvals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending approvals
          </p>
        ) : (
          <div className="space-y-2">
            {approvals.slice(0, 5).map((approval: any) => (
              <div
                key={approval.id}
                className="flex items-start justify-between p-2 rounded hover:bg-accent transition-colors"
                data-testid={`approval-item-${approval.id}`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{approval.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {approval.clientName} • {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
