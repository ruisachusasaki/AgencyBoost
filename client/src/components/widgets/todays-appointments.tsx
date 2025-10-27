import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, GripVertical, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface WidgetProps {
  userWidget: any;
  onRemove: () => void;
}

export default function TodaysAppointmentsWidget({ userWidget, onRemove }: WidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/dashboard-widgets/${userWidget.widgetType}/data`],
  });

  return (
    <Card data-testid="widget-todays-appointments" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move widget-drag-handle flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Today's Appointments
            </CardTitle>
            <CardDescription className="text-xs">
              Scheduled for today
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
                  className="p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" data-testid={`appointment-title-${appointment.id}`}>
                        {appointment.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.bookerName || appointment.clientName || 'External Booking'}
                      </p>
                      <p className="text-xs font-medium text-primary mt-1">
                        {format(new Date(appointment.startTime), 'h:mm a')} - {format(new Date(appointment.endTime), 'h:mm a')}
                      </p>
                      {appointment.location && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📍 {appointment.location}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'showed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'no_show' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status === 'no_show' ? 'No Show' : 
                       appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No appointments today</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
