import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserX, Trash2, GripVertical, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function AppointmentNoShowsWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-appointment-no-shows" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              Appointment No-Shows
            </CardTitle>
            <CardDescription className="text-xs">
              Recent missed appointments
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/calendar">
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-view-calendar"
              className="h-8 w-8 p-0 flex-shrink-0"
              title="View Calendar"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            data-testid="button-remove-widget"
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {data && data.length > 0 ? (
              data.map((appointment: any) => (
                <div
                  key={appointment.id}
                  data-testid={`appointment-${appointment.id}`}
                  className="p-3 border border-red-200 rounded-lg bg-red-50/50 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" data-testid={`appointment-title-${appointment.id}`}>
                        {appointment.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.bookerName || appointment.clientName || 'External Booking'}
                      </p>
                      <p className="text-xs font-medium text-red-600 mt-1">
                        {format(new Date(appointment.startTime), 'MMM d, h:mm a')}
                      </p>
                      {appointment.assignedToName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          👤 {appointment.assignedToName}
                        </p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                      No Show
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No missed appointments</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
