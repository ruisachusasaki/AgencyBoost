import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit2,
  Trash2,
  Clock,
  User,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Video,
  ExternalLink,
  Building,
} from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  calendarId: string;
  clientId?: string;
  assignedTo: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  location?: string | null;
  locationDetails?: string | null;
  meetingLink?: string | null;
  timezone: string;
  bookerName?: string | null;
  bookerEmail: string;
  bookerPhone?: string | null;
  customFieldData?: any;
  externalEventId?: string | null;
  bookingSource: string;
  bookingIp?: string | null;
  bookingUserAgent?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  attendeeEmail?: string;
  attendeeName?: string;
  type?: 'calendar' | 'lead' | 'google';
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
  appointmentStatus?: string;
  timeEntryCreated?: boolean;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
}

interface EventDetailModalProps {
  event: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  staffMembers?: StaffMember[];
}

export function EventDetailModal({
  event,
  isOpen,
  onClose,
  currentUserId,
  staffMembers = [],
}: EventDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    meetingLink: "",
    status: "",
  });

  const eventId = event?.id || '';
  const isGoogleEvent = event?.type === 'google' || event?.bookingSource === 'google-calendar';
  const isOwnEvent = event ? (event.assignedTo === currentUserId || (event as any).userId === currentUserId) : false;

  // Fetch client data if clientId exists
  const { data: clientData } = useQuery<Client>({
    queryKey: ['/api/clients', event?.clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${event?.clientId}`);
      if (!response.ok) throw new Error('Failed to fetch client');
      return response.json();
    },
    enabled: !!event?.clientId && isOpen,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      if (isGoogleEvent) {
        return apiRequest(`/api/google-calendar/events/${eventId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        return apiRequest(`/api/appointments/${eventId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Event updated",
        description: "Your changes have been saved.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments-with-leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update event",
        description: error.message || "An error occurred while updating the event.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (isGoogleEvent) {
        return apiRequest(`/api/google-calendar/events/${eventId}`, {
          method: 'DELETE',
        });
      } else {
        return apiRequest(`/api/appointments/${eventId}`, {
          method: 'DELETE',
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "The event has been removed from your calendar.",
      });
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments-with-leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete event",
        description: error.message || "An error occurred while deleting the event.",
        variant: "destructive",
      });
    },
  });

  // Appointment status update mutation for Google events (auto-creates time entry when "Showed")
  const appointmentStatusMutation = useMutation({
    mutationFn: async (appointmentStatus: string) => {
      const response = await apiRequest('PATCH', `/api/calendar/events/${eventId}/status`, { appointmentStatus });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.task || data.timeEntry) {
        toast({
          title: "Appointment marked as Showed",
          description: data.message || "Time has been automatically tracked for this meeting.",
        });
      } else {
        toast({
          title: "Status updated",
          description: "Appointment status has been updated.",
        });
      }
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments-with-leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update status",
        description: error.message || "An error occurred while updating the appointment status.",
        variant: "destructive",
      });
    },
  });

  const ownerName = useMemo(() => {
    if (!event) return 'Unknown';
    if (staffMembers.length > 0) {
      const owner = staffMembers.find(s => s.id === event.assignedTo || s.id === (event as any).userId);
      if (owner) return `${owner.firstName} ${owner.lastName}`;
    }
    return event.bookerName || event.attendeeName || 'Unknown';
  }, [event, staffMembers]);

  if (!event) return null;

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);

  const handleStartEdit = () => {
    setEditForm({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      meetingLink: event.meetingLink || "",
      status: event.status || "confirmed",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editForm);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const formatTimeRange = () => {
    const dateStr = format(startTime, "EEE, MMM d, yyyy");
    const startTimeStr = format(startTime, "h:mm a");
    const endTimeStr = format(endTime, "h:mm a");
    const timezone = event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${dateStr}, ${startTimeStr} - ${endTimeStr} (${timezone})`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'showed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'no_show': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md overflow-y-auto"
          data-testid="event-detail-modal"
        >
          <SheetHeader className="border-b pb-4 mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold">View Details</SheetTitle>
              <div className="flex items-center gap-2">
                {isOwnEvent && !isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStartEdit}
                      data-testid="button-edit-event"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      data-testid="button-delete-event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {isGoogleEvent && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                Google Event
              </Badge>
            )}

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    data-testid="input-event-title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    data-testid="input-event-description"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    data-testid="input-event-location"
                  />
                </div>

                <div>
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <Input
                    id="meetingLink"
                    value={editForm.meetingLink}
                    onChange={(e) => setEditForm({ ...editForm, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    data-testid="input-event-meeting-link"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger data-testid="select-event-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="showed">Showed</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    data-testid="button-save-event"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white" data-testid="text-event-title">
                    {event.title}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Appointment Time</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-event-time">
                        {formatTimeRange()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Appointment Owner</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-event-owner">
                        {ownerName}
                      </div>
                    </div>
                  </div>

                  {/* Only show meeting link for own events (privacy/security) */}
                  {isOwnEvent && event.meetingLink && (
                    <div className="flex items-start gap-3">
                      <Video className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Google Meet Link</div>
                        <Button
                          variant="outline"
                          className="w-full justify-center bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                          onClick={() => window.open(event.meetingLink!, '_blank')}
                          data-testid="button-join-meeting"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join Meeting
                        </Button>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-all flex items-center gap-1">
                          <LinkIcon className="h-3 w-3 flex-shrink-0" />
                          {event.meetingLink}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Calendar</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {isGoogleEvent ? "Google Calendar" : "AgencyFlow Calendar"}
                      </div>
                    </div>
                  </div>

                  {/* Client info */}
                  {(event.clientId && clientData) && (
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Associated Client</div>
                        <Link href={`/clients/${event.clientId}`}>
                          <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-event-client">
                            {clientData.company || clientData.name}
                          </span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {(event.bookerName || event.attendeeName) && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Booked By</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-event-booker">
                          {event.bookerName || event.attendeeName || '-'}
                        </div>
                      </div>
                    </div>
                  )}

                  {(event.bookerEmail || event.attendeeEmail) && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {event.bookerEmail || event.attendeeEmail}
                        </div>
                      </div>
                    </div>
                  )}

                  {event.bookerPhone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {event.bookerPhone}
                        </div>
                      </div>
                    </div>
                  )}

                  {event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {event.location}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Source</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {isGoogleEvent ? "Google Calendar" : event.bookingSource || "Manual"}
                      </div>
                    </div>
                  </div>

                  {event.description && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Appointment Description</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap" data-testid="text-event-description">
                          {event.description}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Appointment Status section with dropdown for Google events */}
                  <div className="flex items-start gap-3 pt-2 border-t">
                    <CheckCircle2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Appointment Status</div>
                      {isGoogleEvent && isOwnEvent ? (
                        <div className="space-y-2">
                          <Select
                            value={event.appointmentStatus || event.status || "confirmed"}
                            onValueChange={(value) => appointmentStatusMutation.mutate(value)}
                            disabled={appointmentStatusMutation.isPending}
                          >
                            <SelectTrigger 
                              className="w-full" 
                              data-testid="select-appointment-status"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confirmed">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500" />
                                  Confirmed
                                </span>
                              </SelectItem>
                              <SelectItem value="showed">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                                  Showed (Auto-logs time)
                                </span>
                              </SelectItem>
                              <SelectItem value="no_show">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                                  No Show
                                </span>
                              </SelectItem>
                              <SelectItem value="cancelled">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  Cancelled
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {event.timeEntryCreated && (
                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <Clock className="h-3 w-3" />
                              Time entry has been logged for this meeting
                            </div>
                          )}
                          {appointmentStatusMutation.isPending && (
                            <div className="text-xs text-gray-500">Updating status...</div>
                          )}
                        </div>
                      ) : (
                        <Badge className={getStatusColor(event.appointmentStatus || event.status)} data-testid="badge-event-status">
                          {(event.appointmentStatus || event.status).charAt(0).toUpperCase() + (event.appointmentStatus || event.status).slice(1).replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
