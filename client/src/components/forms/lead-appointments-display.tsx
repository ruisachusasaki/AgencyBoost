import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, Plus, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import LeadAppointmentBooking from "./lead-appointment-booking";
import { useToast } from "@/hooks/use-toast";

interface LeadAppointmentsDisplayProps {
  leadId?: string;
}

interface LeadAppointmentData {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  location?: string;
  calendarName?: string;
  staffFirstName?: string;
  staffLastName?: string;
  description?: string;
}

export default function LeadAppointmentsDisplay({ leadId }: LeadAppointmentsDisplayProps) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<LeadAppointmentData | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: appointments = [], isLoading } = useQuery<LeadAppointmentData[]>({
    queryKey: ["/api/lead-appointments", leadId],
    queryFn: () => fetch(`/api/lead-appointments?leadId=${leadId}`).then(res => res.json()),
    enabled: !!leadId,
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch(`/api/lead-appointments/${appointmentId}`, { 
        method: 'DELETE' 
      });
      if (!response.ok) throw new Error(`Failed to delete appointment: ${response.statusText}`);
      return response.status === 204 ? null : await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-appointments-with-leads"] });
      toast({
        title: "Appointment deleted",
        description: "Appointment has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting appointment",
        description: error.message || "Failed to delete appointment",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleDeleteAppointment = (appointmentId: string, appointmentTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the appointment "${appointmentTitle}"?`)) {
      deleteAppointmentMutation.mutate(appointmentId);
    }
  };

  const handleEditAppointment = (appointment: LeadAppointmentData) => {
    setEditingAppointment(appointment);
    setShowBookingForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
      case 'showed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!leadId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Save the lead first to manage appointments</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Lead Appointments</h3>
        <Button
          onClick={() => setShowBookingForm(!showBookingForm)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showBookingForm ? 'Cancel' : 'Book Appointment'}
        </Button>
      </div>

      {showBookingForm && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">
              {editingAppointment ? 'Edit Appointment' : 'Book New Appointment'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeadAppointmentBooking 
              leadId={leadId}
              editingAppointment={editingAppointment}
              onSuccess={() => {
                setShowBookingForm(false);
                setEditingAppointment(null);
                // Invalidate both lead appointments and calendar appointments
                queryClient.invalidateQueries({ queryKey: ["/api/lead-appointments"] });
                queryClient.invalidateQueries({ queryKey: ["/api/calendar-appointments-with-leads"] });
              }}
              onCancel={() => {
                setShowBookingForm(false);
                setEditingAppointment(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {appointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-medium mb-2">No appointments yet</h3>
          <p className="text-sm">Book the first appointment with this lead</p>
          {!showBookingForm && (
            <Button
              onClick={() => setShowBookingForm(true)}
              className="mt-4"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {appointment.title}
                    </h4>
                    <Badge className={getStatusColor(appointment.status)} variant="secondary">
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditAppointment(appointment)}
                      data-testid={`button-edit-appointment-${appointment.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteAppointment(appointment.id, appointment.title)}
                      disabled={deleteAppointmentMutation.isPending}
                      data-testid={`button-delete-appointment-${appointment.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(appointment.startTime), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(appointment.startTime), 'h:mm a')} - 
                        {format(new Date(appointment.endTime), 'h:mm a')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {appointment.staffFirstName && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{appointment.staffFirstName} {appointment.staffLastName}</span>
                      </div>
                    )}
                    {appointment.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{appointment.location}</span>
                      </div>
                    )}
                    {appointment.calendarName && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{appointment.calendarName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {appointment.description && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                    {appointment.description}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}