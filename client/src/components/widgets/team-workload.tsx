import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function TeamWorkloadWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  const getCapacityColor = (capacity: string) => {
    switch (capacity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getCapacityLabel = (capacity: string) => {
    switch (capacity) {
      case 'high': return 'High Load';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return capacity;
    }
  };

  return (
    <Card data-testid="widget-team-workload" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Team Workload
            </CardTitle>
            <CardDescription className="text-xs">
              Active tasks by team member
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
              data.map((member: any) => (
                <div
                  key={member.staffId}
                  data-testid={`team-member-${member.staffId}`}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" data-testid={`staff-name-${member.staffId}`}>
                        {member.staffName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.taskCount} active {member.taskCount === 1 ? 'task' : 'tasks'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-lg font-bold" data-testid={`task-count-${member.staffId}`}>
                        {member.taskCount}
                      </span>
                      <Badge 
                        variant={getCapacityColor(member.capacity)} 
                        className="text-xs"
                        data-testid={`capacity-${member.staffId}`}
                      >
                        {getCapacityLabel(member.capacity)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No team members found</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
