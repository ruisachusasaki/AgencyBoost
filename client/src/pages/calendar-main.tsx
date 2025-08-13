import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  List,
  Eye
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
  title: string;
  startTime: string;
  endTime: string;
  attendeeEmail: string;
  attendeeName: string;
  status: string;
  createdAt: string;
}

// Calendar view types
type CalendarViewType = "day" | "week" | "month";

export default function CalendarMain() {
  const [activeTab, setActiveTab] = useState("calendar-view");
  const [calendarView, setCalendarView] = useState<CalendarViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [calendarSearch, setCalendarSearch] = useState("");
  const [sidebarTab, setSidebarTab] = useState("users");

  // Fetch data
  const { data: calendars = [], isLoading: calendarsLoading } = useQuery<CalendarData[]>({
    queryKey: ["/api/calendars"],
  });

  const { data: staff = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/calendar-appointments"],
  });

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

  // Check if user has admin role (placeholder logic)
  const isAdmin = true; // Replace with actual role check

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

  return (
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
                    // Navigate to calendar settings
                    window.location.href = "/settings/calendar";
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
                          const dayAppointments = appointments.filter(apt => 
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
                                  <div
                                    key={apt.id}
                                    className="text-xs p-1 bg-primary/10 text-primary rounded truncate"
                                    title={`${apt.title} - ${apt.attendeeName}`}
                                  >
                                    {apt.title}
                                  </div>
                                ))}
                                {dayAppointments.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{dayAppointments.length - 2} more
                                  </div>
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
                      <div className="grid grid-cols-8 gap-1 mb-4">
                        <div className="p-2"></div> {/* Empty cell for time column */}
                        {(() => {
                          const startOfWeek = new Date(currentDate);
                          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                          return Array.from({ length: 7 }, (_, i) => {
                            const day = new Date(startOfWeek);
                            day.setDate(startOfWeek.getDate() + i);
                            const isToday = day.toDateString() === new Date().toDateString();
                            
                            return (
                              <div key={i} className={`p-2 text-center border-b border-gray-200 ${
                                isToday ? "bg-primary/10 text-primary font-semibold" : ""
                              }`}>
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
                          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                          const startOfWeek = new Date(currentDate);
                          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                          
                          return (
                            <div key={hour} className="grid grid-cols-8 gap-1 border-b border-gray-100 dark:border-gray-800">
                              <div className="p-2 text-xs text-gray-500 dark:text-gray-400 text-right">
                                {timeSlot}
                              </div>
                              {Array.from({ length: 7 }, (_, dayIndex) => {
                                const day = new Date(startOfWeek);
                                day.setDate(startOfWeek.getDate() + dayIndex);
                                day.setHours(hour, 0, 0, 0);
                                
                                const dayAppointments = appointments.filter(apt => {
                                  const aptStart = new Date(apt.startTime);
                                  return aptStart.toDateString() === day.toDateString() && 
                                         aptStart.getHours() === hour;
                                });
                                
                                return (
                                  <div key={dayIndex} className="min-h-[60px] p-1 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    {dayAppointments.map((apt) => (
                                      <div
                                        key={apt.id}
                                        className="text-xs p-2 bg-primary/20 text-primary rounded mb-1 cursor-pointer hover:bg-primary/30"
                                        title={`${apt.title} - ${apt.attendeeName}`}
                                      >
                                        <div className="font-medium truncate">{apt.title}</div>
                                        <div className="text-xs opacity-75">{apt.attendeeName}</div>
                                      </div>
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
                          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                          const currentHour = new Date(currentDate);
                          currentHour.setHours(hour, 0, 0, 0);
                          
                          const hourAppointments = appointments.filter(apt => {
                            const aptStart = new Date(apt.startTime);
                            return aptStart.toDateString() === currentDate.toDateString() && 
                                   aptStart.getHours() === hour;
                          });
                          
                          return (
                            <div key={hour} className="flex border-b border-gray-100 dark:border-gray-800">
                              <div className="w-20 p-3 text-sm text-gray-500 dark:text-gray-400 text-right border-r border-gray-100 dark:border-gray-800">
                                {timeSlot}
                              </div>
                              <div className="flex-1 min-h-[80px] p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <div className="space-y-2">
                                  {hourAppointments.map((apt) => {
                                    const startTime = new Date(apt.startTime);
                                    const endTime = new Date(apt.endTime);
                                    
                                    return (
                                      <div
                                        key={apt.id}
                                        className="p-3 bg-primary/10 text-primary rounded-lg border-l-4 border-primary cursor-pointer hover:bg-primary/20"
                                      >
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <div className="font-semibold">{apt.title}</div>
                                            <div className="text-sm opacity-75 mt-1">
                                              {apt.attendeeName} ({apt.attendeeEmail})
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
                  <CardContent className="p-0">
                    <Tabs value={sidebarTab} onValueChange={setSidebarTab}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
                        <TabsTrigger value="calendars" data-testid="tab-calendars">Calendars</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="users" className="p-4">
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
                      </TabsContent>
                      
                      <TabsContent value="calendars" className="p-4">
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
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "appointment-list" && (
        <div className="space-y-6">
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Appointment List View
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This view will be implemented after completing the Calendar View.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}