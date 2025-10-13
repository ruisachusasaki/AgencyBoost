import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { AppointmentModal } from "@/components/AppointmentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  List,
  Eye,
  Clock,
  User,
  Mail,
  MapPin,
  Filter,
  ChevronUp,
  Edit2,
  Trash2,
  ChevronDown
} from "lucide-react";

// Types
interface CalendarData {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  color: string;
  timezone: string;
  createdBy?: string;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

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
  // Legacy fields for compatibility
  attendeeEmail?: string;
  attendeeName?: string;
  // Lead appointment fields
  type?: 'calendar' | 'lead';
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
}

// Calendar view types
type CalendarViewType = "day" | "week" | "month";

export default function CalendarMain() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("calendar-view");
  const [calendarView, setCalendarView] = useState<CalendarViewType>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [calendarSearch, setCalendarSearch] = useState("");
  const [sidebarTab, setSidebarTab] = useState("users");
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState<'all' | 'lead' | 'client'>('all');
  
  // Appointments table state
  const [appointmentsTab, setAppointmentsTab] = useState<"upcoming" | "cancelled" | "all">("upcoming");
  
  // State for appointment modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [calendarFilter, setCalendarFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  // Fetch data
  const { data: calendars = [], isLoading: calendarsLoading, error: calendarsError } = useQuery<CalendarData[]>({
    queryKey: ["/api/calendars"],
  });

  const { data: staff = [], error: staffError } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const { data: appointments = [], error: appointmentsError, refetch: refetchAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/calendar-appointments-with-leads"],
    queryFn: async () => {
      console.log("CalendarMain: Fetching appointments with lead appointments included");
      const response = await fetch("/api/calendar-appointments?includeLeadAppointments=true");
      const data = await response.json();
      console.log("CalendarMain: Fetched appointments count:", data.length);
      console.log("CalendarMain: First 3 appointments:", data.slice(0, 3).map(apt => ({ 
        id: apt.id, 
        title: apt.title, 
        type: apt.type, 
        leadId: apt.leadId 
      })));
      return data;
    },
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch clients for linking invitees to their profiles  
  const { data: clientsResponse, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
  });
  
  // Extract clients array from response
  const clients = (clientsResponse as any)?.clients || [];

  // Filter staff based on search
  const filteredStaff = useMemo(() => {
    return staff.filter(member => 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
      member.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [staff, userSearch]);

  // Filter calendars based on search
  const filteredCalendars = useMemo(() => {
    return calendars.filter(calendar => 
      calendar.name.toLowerCase().includes(calendarSearch.toLowerCase())
    );
  }, [calendars, calendarSearch]);

  // Navigation functions
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    switch (calendarView) {
      case "day":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "month":
        newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format date display based on view
  const getDateDisplayText = () => {
    const options: Intl.DateTimeFormatOptions = {};
    switch (calendarView) {
      case "day":
        options.weekday = "long";
        options.year = "numeric";
        options.month = "long";
        options.day = "numeric";
        break;
      case "week":
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case "month":
        options.year = "numeric";
        options.month = "long";
        break;
    }
    return currentDate.toLocaleDateString('en-US', options);
  };

  // Generate calendar days for month view
  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Fetch user permissions to check admin status
  const { data: userPermissions } = useQuery<any>({
    queryKey: ["/api/user-permissions"],
  });

  // Check if user has admin role or settings access
  const isAdmin = userPermissions?.settings?.canAccess || false;

  // Mutation for updating appointment status
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: string }) => {
      return await apiRequest('PUT', `/api/calendar-appointments/${appointmentId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments-with-leads'] });
      refetchAppointments();
      toast({
        title: "Appointment updated",
        description: "Status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating appointment",
        description: error.message || "Failed to update appointment status",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting appointment
  const deleteAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, appointmentType }: { appointmentId: string; appointmentType: 'calendar' | 'lead' }) => {
      // Route to correct endpoint based on appointment type
      const endpoint = appointmentType === 'lead' 
        ? `/api/lead-appointments/${appointmentId}`
        : `/api/calendar-appointments/${appointmentId}`;
      console.log('CalendarMain: Deleting appointment', { appointmentId, appointmentType, endpoint });
      const response = await fetch(endpoint, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Failed to delete appointment: ${response.statusText}`);
      return response.status === 204 ? null : await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments-with-leads'] });
      refetchAppointments();
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

  // Handler for status change
  const handleStatusChange = (appointmentId: string, newStatus: string) => {
    updateAppointmentMutation.mutate({ appointmentId, status: newStatus });
  };

  // Handler for appointment deletion
  const handleDeleteAppointment = (appointmentId: string, appointmentTitle: string, appointmentType: 'calendar' | 'lead' = 'calendar') => {
    console.log('CalendarMain: Delete button clicked', { appointmentId, appointmentTitle, appointmentType });
    if (window.confirm(`Are you sure you want to delete the appointment "${appointmentTitle}"?`)) {
      console.log('CalendarMain: Delete confirmed, sending mutation');
      deleteAppointmentMutation.mutate({ appointmentId, appointmentType });
    }
  };

  // Handle edit appointment
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowEditModal(true);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingAppointment(null);
  };

  // Find client by email
  const findClientByEmail = (email: string) => {
    if (!clients || !Array.isArray(clients)) return null;
    return clients.find((client: any) => client.email === email);
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCalendarToggle = (calendarId: string) => {
    setSelectedCalendars(prev => 
      prev.includes(calendarId) 
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  // Helper component for appointment tooltip content
  const AppointmentTooltip = ({ appointment }: { appointment: Appointment }) => {
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    
    return (
      <div className="space-y-2 p-1">
        <div className="font-semibold text-sm">{appointment.title}</div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3 w-3" />
          <span>
            {startTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })} - {endTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <User className="h-3 w-3" />
          <span>{appointment.bookerName || appointment.attendeeName || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Mail className="h-3 w-3" />
          <span>{appointment.bookerEmail || appointment.attendeeEmail || 'No email'}</span>
        </div>
        {appointment.description && (
          <div className="text-xs">
            <div className="font-medium">Description:</div>
            <div className="text-gray-600 dark:text-gray-400">{appointment.description}</div>
          </div>
        )}
        {appointment.location && (
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="h-3 w-3" />
            <span>{appointment.location}</span>
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-1">
          Status: <span className="capitalize">{appointment.status}</span>
        </div>
      </div>
    );
  };

  // Filter appointments by selected calendars for calendar view
  const calendarViewFilteredAppointments = useMemo(() => {
    // If no calendars are selected, show all appointments
    if (selectedCalendars.length === 0) {
      return appointments;
    }
    
    // Otherwise, only show appointments from selected calendars
    return appointments.filter(apt => selectedCalendars.includes(apt.calendarId));
  }, [appointments, selectedCalendars]);

  // Appointments filtering and sorting logic
  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = appointments;
    const now = new Date();

    // Filter by tab
    switch (appointmentsTab) {
      case "upcoming":
        filtered = filtered.filter(apt => new Date(apt.startTime) >= now && apt.status !== "cancelled");
        break;
      case "cancelled":
        filtered = filtered.filter(apt => apt.status === "cancelled");
        break;
      case "all":
        // Show all appointments
        break;
    }

    // Apply filters
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    if (calendarFilter !== "all") {
      filtered = filtered.filter(apt => apt.calendarId === calendarFilter);
    }
    if (userFilter !== "all") {
      // Find calendar owner from calendars data
      filtered = filtered.filter(apt => {
        try {
          const calendar = calendars.find(cal => cal.id === apt.calendarId);
          return calendar && calendar.createdBy === userFilter;
        } catch (error) {
          console.error('Error filtering by user:', error);
          return true; // Show appointment if filtering fails
        }
      });
    }
    if (clientFilter !== "all") {
      filtered = filtered.filter(apt => 
        (apt.bookerName || apt.attendeeName || '').toLowerCase().includes(clientFilter.toLowerCase()) ||
        (apt.bookerEmail || apt.attendeeEmail || '').toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortField) {
          case "title":
            aValue = a.title;
            bValue = b.title;
            break;
          case "attendee":
            aValue = a.bookerName || a.attendeeName || '';
            bValue = b.bookerName || b.attendeeName || '';
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          case "startTime":
            aValue = new Date(a.startTime);
            bValue = new Date(b.startTime);
            break;
          case "calendar":
            aValue = calendars.find(cal => cal.id === a.calendarId)?.name || "";
            bValue = calendars.find(cal => cal.id === b.calendarId)?.name || "";
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Filter by appointment type (Lead vs Client)
    if (appointmentTypeFilter !== 'all') {
      if (appointmentTypeFilter === 'lead') {
        filtered = filtered.filter(apt => apt.type === 'lead');
      } else if (appointmentTypeFilter === 'client') {
        filtered = filtered.filter(apt => apt.type === 'calendar');
      }
    }

    return filtered;
  }, [appointments, appointmentsTab, statusFilter, calendarFilter, userFilter, clientFilter, appointmentTypeFilter, sortField, sortDirection, calendars]);

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icons (matching app design pattern)
  const getSortIcons = (field: string) => (
    <div className="flex flex-col ml-2">
      <ChevronUp 
        className={`h-3 w-3 ${
          sortField === field && sortDirection === 'asc' 
            ? 'text-primary' 
            : 'text-muted-foreground/40'
        }`} 
      />
      <ChevronDown 
        className={`h-3 w-3 -mt-1 ${
          sortField === field && sortDirection === 'desc' 
            ? 'text-primary' 
            : 'text-muted-foreground/40'
        }`} 
      />
    </div>
  );

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "showed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "no show":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Add error handling after all hooks are defined
  if (calendarsError || staffError || appointmentsError) {
    return (
      <div className="flex-1 p-6">
        <div className="text-red-500">
          Error loading calendar data: {calendarsError?.message || staffError?.message || appointmentsError?.message}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendars
          </h1>
        </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "calendar-view", name: "Calendar View", icon: CalendarIcon },
            { id: "appointment-list", name: "Appointment List View", icon: List },
            ...(isAdmin ? [{ id: "calendar-settings", name: "Calendar Settings", icon: Settings }] : [])
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "calendar-settings") {
                    // Navigate to calendar settings page
                    window.location.href = "/calendar-settings";
                    return;
                  }
                  setActiveTab(tab.id);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "calendar-view" && (
        <div className="space-y-6">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate("prev")}
                  data-testid="button-prev-date"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate("next")}
                  data-testid="button-next-date"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  data-testid="button-today"
                >
                  Today
                </Button>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {getDateDisplayText()}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={calendarView === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setCalendarView("day")}
                data-testid="button-day-view"
              >
                Day
              </Button>
              <Button
                variant={calendarView === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setCalendarView("week")}
                data-testid="button-week-view"
              >
                Week
              </Button>
              <Button
                variant={calendarView === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setCalendarView("month")}
                data-testid="button-month-view"
              >
                Month
              </Button>
            </div>
          </div>

          {/* Calendar Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Calendar Pane */}
            <div className="lg:col-span-3">
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-0">
                  {/* Month View */}
                  {calendarView === "month" && (
                    <div className="p-4">
                      {/* Days of week header */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                          <div key={day} className="p-2 text-center font-medium text-gray-500 dark:text-gray-400 text-sm">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar days */}
                      <div className="grid grid-cols-7 gap-1">
                        {generateMonthDays().map((day, index) => {
                          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                          const isToday = day.toDateString() === new Date().toDateString();
                          const dayAppointments = calendarViewFilteredAppointments.filter(apt => 
                            new Date(apt.startTime).toDateString() === day.toDateString()
                          );
                          
                          return (
                            <div
                              key={index}
                              className={`min-h-[100px] p-2 border border-gray-100 dark:border-gray-800 ${
                                !isCurrentMonth ? "bg-gray-50 dark:bg-gray-900 text-gray-400" : ""
                              } ${isToday ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200" : ""}`}
                            >
                              <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600 dark:text-blue-400" : ""}`}>
                                {day.getDate()}
                              </div>
                              <div className="space-y-1">
                                {dayAppointments.slice(0, 2).map((apt) => (
                                  <Tooltip key={apt.id}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className="text-xs p-1 bg-primary/10 text-primary rounded truncate cursor-pointer hover:bg-primary/20"
                                      >
                                        {apt.title}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-80">
                                      <AppointmentTooltip appointment={apt} />
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                {dayAppointments.length > 2 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-xs text-gray-500 cursor-pointer">
                                        +{dayAppointments.length - 2} more
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-80">
                                      <div className="space-y-2">
                                        {dayAppointments.slice(2).map((apt) => (
                                          <AppointmentTooltip key={apt.id} appointment={apt} />
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Week View */}
                  {calendarView === "week" && (
                    <div className="p-4">
                      {/* Week header with days */}
                      <div className="grid grid-cols-8 gap-0 mb-4">
                        <div className="p-2 border-r border-gray-200 dark:border-gray-700"></div> {/* Empty cell for time column */}
                        {(() => {
                          const startOfWeek = new Date(currentDate);
                          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                          return Array.from({ length: 7 }, (_, i) => {
                            const day = new Date(startOfWeek);
                            day.setDate(startOfWeek.getDate() + i);
                            const isToday = day.toDateString() === new Date().toDateString();
                            
                            return (
                              <div key={i} className={`p-2 text-center border-b border-gray-200 dark:border-gray-700 ${
                                i < 6 ? "border-r border-gray-200 dark:border-gray-700" : ""
                              } ${isToday ? "bg-primary/10 text-primary font-semibold" : ""}`}>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className={`text-lg ${isToday ? "text-primary" : ""}`}>
                                  {day.getDate()}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Week time slots */}
                      <div className="space-y-0">
                        {Array.from({ length: 24 }, (_, hour) => {
                          const timeSlot = new Date().setHours(hour, 0, 0, 0);
                          const timeDisplay = new Date(timeSlot).toLocaleTimeString('en-US', { 
                            hour: 'numeric',
                            hour12: true 
                          });
                          const startOfWeek = new Date(currentDate);
                          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                          
                          return (
                            <div key={hour} className="grid grid-cols-8 gap-0 border-b border-gray-100 dark:border-gray-800">
                              <div className="p-2 text-xs text-gray-500 dark:text-gray-400 text-right border-r border-gray-200 dark:border-gray-700">
                                {timeDisplay}
                              </div>
                              {Array.from({ length: 7 }, (_, dayIndex) => {
                                const day = new Date(startOfWeek);
                                day.setDate(startOfWeek.getDate() + dayIndex);
                                day.setHours(hour, 0, 0, 0);
                                
                                const dayAppointments = calendarViewFilteredAppointments.filter(apt => {
                                  const aptStart = new Date(apt.startTime);
                                  return aptStart.toDateString() === day.toDateString() && 
                                         aptStart.getHours() === hour;
                                });
                                
                                return (
                                  <div key={dayIndex} className={`min-h-[60px] p-1 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                    dayIndex < 6 ? "border-r border-gray-200 dark:border-gray-700" : ""
                                  }`}>
                                    {dayAppointments.map((apt) => (
                                      <Tooltip key={apt.id}>
                                        <TooltipTrigger asChild>
                                          <div className="text-xs p-2 bg-primary/20 text-primary rounded mb-1 cursor-pointer hover:bg-primary/30">
                                            <div className="font-medium truncate">{apt.title}</div>
                                            <div className="text-xs opacity-75">{apt.bookerName || apt.attendeeName || 'Unknown'}</div>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-80">
                                          <AppointmentTooltip appointment={apt} />
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Day View */}
                  {calendarView === "day" && (
                    <div className="p-4">
                      {/* Day header */}
                      <div className="mb-4 pb-2 border-b border-gray-200">
                        <div className="text-center">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                          </div>
                          <div className="text-2xl font-semibold">
                            {currentDate.getDate()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* Day time slots */}
                      <div className="space-y-0">
                        {Array.from({ length: 24 }, (_, hour) => {
                          const timeSlot = new Date().setHours(hour, 0, 0, 0);
                          const timeDisplay = new Date(timeSlot).toLocaleTimeString('en-US', { 
                            hour: 'numeric',
                            hour12: true 
                          });
                          const currentHour = new Date(currentDate);
                          currentHour.setHours(hour, 0, 0, 0);
                          
                          const hourAppointments = calendarViewFilteredAppointments.filter(apt => {
                            const aptStart = new Date(apt.startTime);
                            return aptStart.toDateString() === currentDate.toDateString() && 
                                   aptStart.getHours() === hour;
                          });
                          
                          return (
                            <div key={hour} className="flex border-b border-gray-100 dark:border-gray-800">
                              <div className="w-20 p-3 text-sm text-gray-500 dark:text-gray-400 text-right border-r border-gray-100 dark:border-gray-800">
                                {timeDisplay}
                              </div>
                              <div className="flex-1 min-h-[80px] p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <div className="space-y-2">
                                  {hourAppointments.map((apt) => {
                                    const startTime = new Date(apt.startTime);
                                    const endTime = new Date(apt.endTime);
                                    
                                    return (
                                      <Tooltip key={apt.id}>
                                        <TooltipTrigger asChild>
                                          <div className="p-3 bg-primary/10 text-primary rounded-lg border-l-4 border-primary cursor-pointer hover:bg-primary/20">
                                            <div className="flex justify-between items-start">
                                              <div className="flex-1">
                                                <div className="font-semibold">{apt.title}</div>
                                                <div className="text-sm opacity-75 mt-1">
                                                  {apt.bookerName || apt.attendeeName || 'Unknown'} ({apt.bookerEmail || apt.attendeeEmail || 'No email'})
                                                </div>
                                                {apt.description && (
                                                  <div className="text-sm opacity-75 mt-1">
                                                    {apt.description}
                                                  </div>
                                                )}
                                                {apt.location && (
                                                  <div className="text-sm opacity-75 mt-1">
                                                    📍 {apt.location}
                                                  </div>
                                                )}
                                              </div>
                                              <div className="text-sm opacity-75 ml-4">
                                                {startTime.toLocaleTimeString('en-US', { 
                                                  hour: 'numeric', 
                                                  minute: '2-digit',
                                                  hour12: true 
                                                })} - {endTime.toLocaleTimeString('en-US', { 
                                                  hour: 'numeric', 
                                                  minute: '2-digit',
                                                  hour12: true 
                                                })}
                                              </div>
                                            </div>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="max-w-80">
                                          <AppointmentTooltip appointment={apt} />
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Pane */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Mini Calendar */}
                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          newDate.setMonth(currentDate.getMonth() - 1);
                          setCurrentDate(newDate);
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <CardTitle className="text-sm font-semibold">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          newDate.setMonth(currentDate.getMonth() + 1);
                          setCurrentDate(newDate);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {/* Mini calendar grid */}
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                        <div key={day} className="p-1 text-center font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                      {generateMonthDays().map((day, index) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = day.toDateString() === new Date().toDateString();
                        
                        return (
                          <button
                            key={index}
                            className={`p-1 text-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                              !isCurrentMonth ? "text-gray-300 dark:text-gray-600" : ""
                            } ${isToday ? "bg-primary text-primary-foreground" : ""}`}
                            onClick={() => setCurrentDate(day)}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Filters */}
                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    {/* Tab Buttons */}
                    <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
                      <button
                        onClick={() => setSidebarTab("users")}
                        className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          sidebarTab === "users"
                            ? "text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                        style={sidebarTab === "users" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                        data-testid="tab-users"
                      >
                        Users
                      </button>
                      <button
                        onClick={() => setSidebarTab("calendars")}
                        className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          sidebarTab === "calendars"
                            ? "text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                        style={sidebarTab === "calendars" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                        data-testid="tab-calendars"
                      >
                        Calendars
                      </button>
                    </div>
                    
                    {/* Users Tab Content */}
                    {sidebarTab === "users" && (
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search users..."
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              className="pl-9"
                              data-testid="input-user-search"
                            />
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {filteredStaff.map((member) => (
                              <div key={member.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`user-${member.id}`}
                                  checked={selectedUsers.includes(member.id)}
                                  onCheckedChange={() => handleUserToggle(member.id)}
                                  data-testid={`checkbox-user-${member.id}`}
                                />
                                <Label htmlFor={`user-${member.id}`} className="flex-1 text-sm cursor-pointer">
                                  {member.firstName} {member.lastName}
                                  <div className="text-xs text-gray-500">{member.email}</div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                    )}
                    
                    {/* Calendars Tab Content */}
                    {sidebarTab === "calendars" && (
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search calendars..."
                              value={calendarSearch}
                              onChange={(e) => setCalendarSearch(e.target.value)}
                              className="pl-9"
                              data-testid="input-calendar-search"
                            />
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {filteredCalendars.map((calendar) => (
                              <div key={calendar.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`calendar-${calendar.id}`}
                                  checked={selectedCalendars.includes(calendar.id)}
                                  onCheckedChange={() => handleCalendarToggle(calendar.id)}
                                  data-testid={`checkbox-calendar-${calendar.id}`}
                                />
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: calendar.color }}
                                ></div>
                                <Label htmlFor={`calendar-${calendar.id}`} className="flex-1 text-sm cursor-pointer">
                                  {calendar.name}
                                  <div className="text-xs text-gray-500">
                                    {calendar.type === "round_robin" ? "Round Robin" : "Personal"}
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "appointment-list" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Appointments</CardTitle>
              
              {/* Sub-tabs for appointments */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setAppointmentsTab("upcoming")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    appointmentsTab === "upcoming"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Upcoming ({appointments.filter(apt => 
                    new Date(apt.startTime) >= new Date() && apt.status !== "cancelled"
                  ).length})
                </button>
                <button
                  onClick={() => setAppointmentsTab("cancelled")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    appointmentsTab === "cancelled"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Cancelled ({appointments.filter(apt => apt.status === "cancelled").length})
                </button>
                <button
                  onClick={() => setAppointmentsTab("all")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    appointmentsTab === "all"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  All ({appointments.length})
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="showed">Showed</SelectItem>
                    <SelectItem value="no show">No Show</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={appointmentTypeFilter} onValueChange={(value) => setAppointmentTypeFilter(value as 'all' | 'lead' | 'client')}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={calendarFilter} onValueChange={setCalendarFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Calendars</SelectItem>
                    {calendars.map((calendar) => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        {calendar.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filter by client..."
                  value={clientFilter === "all" ? "" : clientFilter}
                  onChange={(e) => setClientFilter(e.target.value || "all")}
                  className="w-48"
                />

                {(statusFilter !== "all" || calendarFilter !== "all" || userFilter !== "all" || clientFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setCalendarFilter("all");
                      setUserFilter("all");
                      setClientFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none" 
                        onClick={() => handleSort("title")}
                      >
                        <div className="flex items-center justify-between">
                          Title
                          {getSortIcons("title")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none" 
                        onClick={() => handleSort("attendee")}
                      >
                        <div className="flex items-center justify-between">
                          Invitees
                          {getSortIcons("attendee")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none" 
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center justify-between">
                          Status
                          {getSortIcons("status")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none" 
                        onClick={() => handleSort("startTime")}
                      >
                        <div className="flex items-center justify-between">
                          Appointment Time
                          {getSortIcons("startTime")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none" 
                        onClick={() => handleSort("calendar")}
                      >
                        <div className="flex items-center justify-between">
                          Calendar
                          {getSortIcons("calendar")}
                        </div>
                      </TableHead>
                      <TableHead>Appointment Owner</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedAppointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No appointments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedAppointments.map((appointment) => {
                        const calendar = calendars.find(cal => cal.id === appointment.calendarId);
                        const owner = calendar?.createdBy ? staff.find(member => member.id === calendar.createdBy) : null;
                        const startTime = new Date(appointment.startTime);
                        const endTime = new Date(appointment.endTime);
                        
                        return (
                          <TableRow key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <TableCell className="font-medium">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="font-semibold">{appointment.title}</div>
                                  {appointment.type === 'lead' && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                                      Lead
                                    </Badge>
                                  )}
                                  {appointment.type === 'calendar' && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                      Client
                                    </Badge>
                                  )}
                                </div>
                                {appointment.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                    {appointment.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                {(() => {
                                  const email = appointment.bookerEmail || appointment.attendeeEmail || '';
                                  const client = findClientByEmail(email);
                                  
                                  if (client) {
                                    return (
                                      <Link href={`/clients/${client.id}`}>
                                        <div className="font-medium text-primary hover:underline cursor-pointer">
                                          {appointment.bookerName || appointment.attendeeName || 'Unknown'}
                                        </div>
                                      </Link>
                                    );
                                  } else if (appointment.type === 'lead' && appointment.leadId) {
                                    return (
                                      <div className="font-medium text-purple-600 dark:text-purple-400">
                                        {appointment.leadName || appointment.bookerName || appointment.attendeeName || 'Unknown'}
                                        <span className="ml-2 text-xs text-gray-500">(Lead)</span>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="font-medium">
                                        {appointment.bookerName || appointment.attendeeName || 'Unknown'}
                                      </div>
                                    );
                                  }
                                })()}
                                <div className="text-sm text-gray-500 dark:text-gray-400">{appointment.bookerEmail || appointment.attendeeEmail || 'No email'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={appointment.status}
                                onValueChange={(newStatus) => handleStatusChange(appointment.id, newStatus)}
                                disabled={updateAppointmentMutation.isPending}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue>
                                    <Badge className={`${getStatusBadgeColor(appointment.status)} border-0 capitalize text-xs`}>
                                      {appointment.status}
                                    </Badge>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="confirmed">
                                    <Badge className="bg-blue-100 text-blue-800 border-0 capitalize text-xs">
                                      Confirmed
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="showed">
                                    <Badge className="bg-green-100 text-green-800 border-0 capitalize text-xs">
                                      Showed
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="no_show">
                                    <Badge className="bg-yellow-100 text-yellow-800 border-0 capitalize text-xs">
                                      No Show
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    <Badge className="bg-red-100 text-red-800 border-0 capitalize text-xs">
                                      Cancelled
                                    </Badge>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {startTime.toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {startTime.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })} - {endTime.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: calendar?.color || '#6366f1' }}
                                ></div>
                                <span>{calendar?.name || "Unknown Calendar"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                  {owner ? `${owner.firstName.charAt(0)}${owner.lastName.charAt(0)}` : "?"}
                                </div>
                                <span>{owner ? `${owner.firstName} ${owner.lastName}` : "Unknown User"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditAppointment(appointment)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteAppointment(appointment.id, appointment.title, appointment.type || 'calendar')}
                                  disabled={deleteAppointmentMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {filteredAndSortedAppointments.length > 0 && (
                <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredAndSortedAppointments.length} appointment{filteredAndSortedAppointments.length !== 1 ? 's' : ''} 
                  {appointmentsTab !== "all" && ` in ${appointmentsTab}`}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>

      {/* Edit Appointment Modal */}
      <AppointmentModal
        open={showEditModal}
        onOpenChange={handleEditModalClose}
        appointmentId={editingAppointment?.id}
        existingAppointment={editingAppointment}
        clientId={editingAppointment?.clientId}
        clientName={editingAppointment?.bookerName || editingAppointment?.attendeeName}
        clientEmail={editingAppointment?.bookerEmail || editingAppointment?.attendeeEmail}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments-with-leads'] });
          refetchAppointments();
        }}
      />
    </TooltipProvider>
  );
}