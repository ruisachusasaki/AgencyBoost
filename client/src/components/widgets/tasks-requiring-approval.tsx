import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function TasksRequiringApprovalWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card data-testid="widget-tasks-requiring-approval" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Tasks Requiring Client Approval
            </CardTitle>
            <CardDescription className="text-xs">
              Client approval workflow queue
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
              data.map((task: any) => (
                <div
                  key={task.id}
                  data-testid={`approval-task-item-${task.id}`}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" data-testid={`task-title-${task.id}`}>
                        {task.title}
                      </p>
                      {task.clientName && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.clientName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        Assigned to: {task.assignedToName}
                      </p>
                    </div>
                    <Badge variant={getPriorityColor(task.priority)} className="text-xs flex-shrink-0">
                      {task.priority}
                    </Badge>
                  </div>
                  {task.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks requiring approval</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
