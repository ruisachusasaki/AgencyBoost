import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trash2 } from "lucide-react";
import { Link } from "wouter";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function ClientTeamAssignmentsWidget({ userWidget, onRemove }: WidgetProps) {
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-client-team-assignments">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Team Assignments
          </CardTitle>
          <CardDescription className="text-xs">
            Client team members
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
        ) : assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No team assignments
          </p>
        ) : (
          <div className="space-y-3">
            {assignments.slice(0, 4).map((assignment: any) => (
              <Link key={assignment.clientId} href={`/clients/${assignment.clientId}`}>
                <div
                  className="p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                  data-testid={`assignment-item-${assignment.clientId}`}
                >
                  <p className="text-sm font-medium">{assignment.clientName}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {assignment.teamMembers.slice(0, 3).map((member: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                      >
                        {member.staffName}
                        {member.isPrimary && " ★"}
                      </span>
                    ))}
                    {assignment.teamMembers.length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                        +{assignment.teamMembers.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {assignments.length > 4 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{assignments.length - 4} more clients
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
