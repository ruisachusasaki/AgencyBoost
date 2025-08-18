import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  CalendarDays,
  Clock,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  Phone,
  Mail,
  Settings
} from "lucide-react";
import { Link } from "wouter";
import { AppointmentModal } from "@/components/AppointmentModal";

interface AppointmentData {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show' | 'showed';
  location?: string;
  bookerName?: string;
  bookerEmail?: string;
  bookerPhone?: string;
  type?: 'calendar' | 'lead';
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
  assignedTo?: string;
  calendarId?: string;
}



const statusColors = {
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  showed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

export default function Calendar() {
  const [activeTab, setActiveTab] = useState("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendar, setSelectedCalendar] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  // Fetch calendars for filter dropdown
  const { data: calendars = [] } = useQuery<any[]>({
    queryKey: ["/api/calendars"],
  });

  // Fetch staff for filter dropdown
  const { data: staff = [] } = useQuery<any[]>({
    queryKey: ["/api/staff"],
  });

  // Fetch appointments including lead appointments
  const { data: appointments = [], refetch: refetchAppointments } = useQuery<AppointmentData[]>({
    queryKey: ["/api/calendar-appointments-with-leads", "v2"],
    queryFn: async () => {
      console.log("Fetching appointments with lead appointments included");
      const response = await fetch("/api/calendar-appointments?includeLeadAppointments=true");
      const data = await response.json();
      console.log("Fetched appointments count:", data.length);
      return data;
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.pending;
  };

  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentDate);
    prevWeek.setDate(currentDate.getDate() - 7);
    setCurrentDate(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(currentDate.getDate() + 7);
    setCurrentDate(nextWeek);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
                Calendar
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage appointments and bookings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/calendar/settings">
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Button 
                className="flex items-center gap-2"
                onClick={() => setIsAppointmentModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                New Appointment
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
              </div>
              
              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Calendars" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calendars</SelectItem>
                  {calendars.map((calendar: any) => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      {calendar.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={goToToday} className="text-sm">
                Today
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-fit grid-cols-3">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="week" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Week View
              </TabsTrigger>
              <TabsTrigger value="month" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Month View
              </TabsTrigger>
            </TabsList>

            {activeTab !== "list" && (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[180px] text-center">
                  {currentDate.toLocaleDateString([], { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="list" className="space-y-4">
            <div className="grid gap-4">
              {appointments.map((appointment: AppointmentData) => (
                <Card key={appointment.id} className="border-l-4 hover:shadow-md transition-shadow">
                  <div 
                    className="border-l-4 rounded-l-lg"
                    style={{ 
                      borderLeftColor: appointment.type === 'lead' ? '#8b5cf6' : '#3b82f6'
                    }}
                  />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {appointment.title}
                          </h3>
                          <Badge className={getStatusBadgeClass(appointment.status)}>
                            {appointment.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>
                                {appointment.type === 'lead' 
                                  ? (appointment.leadName || appointment.bookerName || 'Unknown Lead')
                                  : (appointment.bookerName || 'Unknown Client')
                                }
                                {appointment.type === 'lead' && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Lead
                                  </Badge>
                                )}
                              </span>
                            </div>
                            {(appointment.bookerEmail || appointment.leadEmail) && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{appointment.bookerEmail || appointment.leadEmail}</span>
                              </div>
                            )}
                            {appointment.bookerPhone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{appointment.bookerPhone}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {formatDate(appointment.startTime)} • {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                              </span>
                            </div>
                            {appointment.assignedTo && (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>
                                  {staff.find((s: any) => s.id === appointment.assignedTo)?.firstName} {staff.find((s: any) => s.id === appointment.assignedTo)?.lastName}
                                </span>
                              </div>
                            )}
                            {appointment.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{appointment.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-600 dark:text-gray-400 py-12">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Week View</h3>
                  <p>Week view calendar interface will be implemented here.</p>
                  <p className="text-sm mt-2">This will show a 7-day calendar grid with time slots and appointments.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-600 dark:text-gray-400 py-12">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Month View</h3>
                  <p>Month view calendar interface will be implemented here.</p>
                  <p className="text-sm mt-2">This will show a traditional monthly calendar with appointments displayed on each day.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Appointment Modal */}
        <AppointmentModal
          open={isAppointmentModalOpen}
          onOpenChange={setIsAppointmentModalOpen}
          onSuccess={() => {
            // Refetch appointments data when appointment is created
            refetchAppointments();
            setIsAppointmentModalOpen(false);
          }}
        />
      </div>
    </div>
  );
}