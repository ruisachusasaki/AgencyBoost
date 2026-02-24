import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, X, Clock, MapPin, Repeat, Users, Tag } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  appointmentId?: string;
  existingAppointment?: any;
  onSuccess?: () => void;
}

interface AppointmentData {
  calendarId: string;
  title: string;
  description: string;
  assignedTo: string;
  status: string;
  date: string;
  time: string;
  duration: number; // in minutes
  timezone: string;
  location: string;
  locationDetails: string;
  meetingLink: string;
  bookerName: string;
  bookerEmail: string;
  bookerPhone: string;
  isRecurring: boolean;
  recurringType: string;
  recurringEnds: string;
  recurringEndDate: string;
  recurringOccurrences: number;
}

// Common timezone options
const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'UTC', label: 'UTC' },
];

// Merge tags for Client Hub Calendar
const clientHubMergeTagGroups = [
  {
    label: "Client Information",
    tags: [
      { label: "First Name", value: "{{first_name}}" },
      { label: "Last Name", value: "{{last_name}}" },
      { label: "Full Name", value: "{{full_name}}" },
      { label: "Email", value: "{{email}}" },
      { label: "Phone", value: "{{phone}}" },
      { label: "Company", value: "{{company}}" },
    ]
  },
  {
    label: "Staff/Team Information",
    tags: [
      { label: "Staff First Name", value: "{{user_first_name}}" },
      { label: "Staff Last Name", value: "{{user_last_name}}" },
      { label: "Staff Full Name", value: "{{user_full_name}}" },
      { label: "Staff Email", value: "{{user_email}}" },
      { label: "Staff Phone", value: "{{user_phone}}" },
    ]
  },
  {
    label: "Appointment Details",
    tags: [
      { label: "Appointment Date", value: "{{appointment_date}}" },
      { label: "Appointment Time", value: "{{appointment_time}}" },
      { label: "Calendar Name", value: "{{calendar_name}}" },
      { label: "Meeting Location", value: "{{location}}" },
      { label: "Meeting Link", value: "{{meeting_link}}" },
    ]
  },
  {
    label: "System",
    tags: [
      { label: "Today's Date", value: "{{today_date}}" },
      { label: "Current Time", value: "{{current_time}}" },
    ]
  }
];

// Generate time slots (15-minute increments)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const display = format(new Date(`2024-01-01T${time}`), 'h:mm a');
      slots.push({ value: time, label: display });
    }
  }
  return slots;
};

export function AppointmentModal({ open, onOpenChange, clientId, clientName, clientEmail, appointmentId, existingAppointment, onSuccess }: AppointmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Additional attendees state
  const [additionalAttendees, setAdditionalAttendees] = useState<Array<{
    id: string;
    name: string;
    email: string;
    type: 'staff' | 'custom';
  }>>([]);
  const [customEmailInput, setCustomEmailInput] = useState('');
  
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    calendarId: '',
    title: '',
    description: '',
    assignedTo: '',
    status: 'confirmed',
    date: '',
    time: '',
    duration: 60,
    timezone: 'America/New_York',
    location: '',
    locationDetails: '',
    meetingLink: '',
    bookerName: clientName || '',
    bookerEmail: clientEmail || '',
    bookerPhone: '',
    isRecurring: false,
    recurringType: 'daily',
    recurringEnds: 'never',
    recurringEndDate: '',
    recurringOccurrences: 1
  });

  const isEditMode = !!(appointmentId && existingAppointment);

  // Search state for merge tags
  const [titleMergeTagSearch, setTitleMergeTagSearch] = useState("");
  const [descriptionMergeTagSearch, setDescriptionMergeTagSearch] = useState("");
  
  // Controlled state for date pickers (prevents auto-opening in dialog)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  // Merge tag insert functions
  const insertMergeTagInTitle = (tag: string) => {
    const currentTitle = appointmentData.title;
    const cursorPos = currentTitle.length;
    const newTitle = currentTitle.slice(0, cursorPos) + tag + currentTitle.slice(cursorPos);
    setAppointmentData(prev => ({ ...prev, title: newTitle }));
    setTitleMergeTagSearch(""); // Reset search after insertion
  };

  const insertMergeTagInDescription = (tag: string) => {
    const currentDescription = appointmentData.description;
    const cursorPos = currentDescription.length;
    const newDescription = currentDescription.slice(0, cursorPos) + tag + currentDescription.slice(cursorPos);
    setAppointmentData(prev => ({ ...prev, description: newDescription }));
    setDescriptionMergeTagSearch(""); // Reset search after insertion
  };

  // Filter merge tag groups based on search
  const filterMergeTags = (searchTerm: string) => {
    if (!searchTerm) return clientHubMergeTagGroups;
    
    return clientHubMergeTagGroups.map(group => ({
      ...group,
      tags: group.tags.filter(tag => 
        tag.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.tags.length > 0);
  };

  // Fetch calendars
  const { data: calendars = [] } = useQuery({
    queryKey: ['/api/calendars'],
    queryFn: async () => {
      const response = await fetch('/api/calendars');
      if (!response.ok) throw new Error('Failed to fetch calendars');
      return response.json();
    }
  });

  // Fetch staff members
  const { data: staff = [], isLoading: isStaffLoading } = useQuery({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    }
  });

  // Staff query is now properly managed without infinite loops

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Sending appointment payload:', data);
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server validation errors:', errorData);
        throw new Error(errorData.message || 'Failed to create appointment');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Created",
        variant: "default",
        description: "The appointment has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments'] });
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Full appointment creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    }
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Updating appointment:', appointmentId, data);
      const response = await fetch(`/api/calendar-appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update appointment');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Updated",
        variant: "default",
        description: "The appointment has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments'] });
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Full appointment update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setAppointmentData({
      calendarId: '',
      title: '',
      description: '',
      assignedTo: '',
      status: 'confirmed',
      date: '',
      time: '',
      duration: 60,
      timezone: 'America/New_York',
      location: '',
      locationDetails: '',
      meetingLink: '',
      bookerName: clientName || '',
      bookerEmail: clientEmail || '',
      bookerPhone: '',
      isRecurring: false,
      recurringType: 'daily',
      recurringEnds: 'never',
      recurringEndDate: '',
      recurringOccurrences: 1
    });
  };

  // Load existing appointment data when editing
  useEffect(() => {
    if (isEditMode && existingAppointment && open) {
      const startTime = new Date(existingAppointment.startTime);
      const endTime = new Date(existingAppointment.endTime);
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      setAppointmentData({
        calendarId: existingAppointment.calendarId || '',
        title: existingAppointment.title || '',
        description: existingAppointment.description || '',
        assignedTo: existingAppointment.assignedTo || '',
        status: existingAppointment.status || 'confirmed',
        date: format(startTime, 'yyyy-MM-dd'),
        time: format(startTime, 'HH:mm'),
        duration,
        timezone: existingAppointment.timezone || 'America/New_York',
        location: existingAppointment.location || '',
        locationDetails: existingAppointment.locationDetails || '',
        meetingLink: existingAppointment.meetingLink || '',
        bookerName: existingAppointment.bookerName || existingAppointment.attendeeName || '',
        bookerEmail: existingAppointment.bookerEmail || existingAppointment.attendeeEmail || '',
        bookerPhone: existingAppointment.bookerPhone || existingAppointment.attendeePhone || '',
        isRecurring: false,
        recurringType: 'daily',
        recurringEnds: 'never',
        recurringEndDate: '',
        recurringOccurrences: 1
      });
    } else if (!isEditMode && open) {
      resetForm();
    }
  }, [isEditMode, existingAppointment, open]);

  const handleSubmit = () => {
    console.log('AppointmentModal handleSubmit called');
    console.log('Current appointmentData:', appointmentData);
    
    if (!appointmentData.calendarId || !appointmentData.title || !appointmentData.assignedTo || !appointmentData.date || !appointmentData.time) {
      console.log('Validation failed:', {
        calendarId: appointmentData.calendarId,
        title: appointmentData.title,
        assignedTo: appointmentData.assignedTo,
        date: appointmentData.date,
        time: appointmentData.time
      });
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Calendar, Title, Team Member, Date, and Time).",
        variant: "destructive",
      });
      return;
    }

    // Ensure booker email is provided (required field)
    const finalBookerEmail = appointmentData.bookerEmail || clientEmail || 'noemail@example.com';
    if (!finalBookerEmail || finalBookerEmail === 'noemail@example.com') {
      toast({
        title: "Email Required",
        description: "A valid email address is required for the appointment.",
        variant: "destructive",
      });
      return;
    }

    // Convert date and time to start/end timestamps
    const startDateTime = new Date(`${appointmentData.date}T${appointmentData.time}`);
    const endDateTime = new Date(startDateTime.getTime() + appointmentData.duration * 60000);

    const appointmentPayload = {
      calendarId: appointmentData.calendarId,
      clientId: clientId || null,
      assignedTo: appointmentData.assignedTo,
      title: appointmentData.title,
      description: appointmentData.description || null,
      startTime: startDateTime.toISOString(), // Send ISO string, server will convert
      endTime: endDateTime.toISOString(), // Send ISO string, server will convert
      status: appointmentData.status,
      timezone: appointmentData.timezone,
      location: appointmentData.location || null,
      locationDetails: appointmentData.locationDetails || null,
      meetingLink: appointmentData.meetingLink || null,
      bookerName: appointmentData.bookerName || clientName || null,
      bookerEmail: finalBookerEmail,
      bookerPhone: appointmentData.bookerPhone || null,
      bookingSource: 'admin'
    };

    if (isEditMode) {
      updateAppointmentMutation.mutate(appointmentPayload);
    } else {
      createAppointmentMutation.mutate(appointmentPayload);
    }
  };

  const timeSlots = generateTimeSlots();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isEditMode ? 'Edit Appointment' : 'Create New Appointment'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Calendar Selection */}
          <div className="space-y-2">
            <Label htmlFor="calendar" className="text-sm font-medium">Calendar *</Label>
            <Select
              value={appointmentData.calendarId}
              onValueChange={(value) => setAppointmentData(prev => ({ ...prev, calendarId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a calendar..." />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((calendar: any) => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Appointment Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Appointment Title *</Label>
            <div className="relative">
              <Input
                id="title"
                value={appointmentData.title}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter appointment title..."
                className="pr-10"
                data-testid="input-appointment-title"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                    data-testid="button-merge-tags-title"
                  >
                    <Tag className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <div className="p-2">
                    <Input
                      placeholder="Search merge tags..."
                      value={titleMergeTagSearch}
                      onChange={(e) => setTitleMergeTagSearch(e.target.value)}
                      className="h-8 text-sm"
                      data-testid="input-search-merge-tags-title"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filterMergeTags(titleMergeTagSearch).map((group, groupIndex) => (
                      <div key={groupIndex}>
                        {groupIndex > 0 && <DropdownMenuSeparator />}
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                          {group.label}
                        </div>
                        {group.tags.map((tag, tagIndex) => (
                          <DropdownMenuItem
                            key={`${groupIndex}-${tagIndex}`}
                            onClick={() => insertMergeTagInTitle(tag.value)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col items-start">
                              <span className="text-sm">{tag.label}</span>
                              <span className="text-xs text-gray-500">{tag.value}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Team Member */}
          <div className="space-y-2" data-testid="team-member-section">
            <Label htmlFor="assignedTo" className="text-sm font-medium">Team Member *</Label>
            <div data-testid="team-member-content">
              {isStaffLoading ? (
                <div className="p-2 border rounded">Loading team members...</div>
              ) : (
                <Select
                  value={appointmentData.assignedTo}
                  onValueChange={(value) => setAppointmentData(prev => ({ ...prev, assignedTo: value }))}
                  data-testid="select-team-member"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.length === 0 ? (
                      <SelectItem value="none" disabled>No team members found</SelectItem>
                    ) : (
                      staff.map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Staff count: {staff.length} | Loading: {isStaffLoading ? 'Yes' : 'No'}
              </div>
            </div>
          </div>



          {/* Date & Time Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Date & Time *</Label>
            
            {/* Timezone */}
            <div>
              <Label htmlFor="timezone" className="text-xs text-gray-600">Timezone</Label>
              <Select
                value={appointmentData.timezone}
                onValueChange={(value) => setAppointmentData(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-xs text-gray-600">Date</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !appointmentData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {appointmentData.date ? format(new Date(appointmentData.date), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                    <Calendar
                      mode="single"
                      selected={appointmentData.date ? new Date(appointmentData.date) : undefined}
                      onSelect={(date) => {
                        setAppointmentData(prev => ({ 
                          ...prev, 
                          date: date ? format(date, 'yyyy-MM-dd') : '' 
                        }));
                        setIsDatePickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="time" className="text-xs text-gray-600">Time</Label>
                <Select
                  value={appointmentData.time}
                  onValueChange={(value) => setAppointmentData(prev => ({ ...prev, time: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration" className="text-xs text-gray-600">Duration (minutes)</Label>
              <Select
                value={appointmentData.duration.toString()}
                onValueChange={(value) => setAppointmentData(prev => ({ ...prev, duration: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recurring Option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={appointmentData.isRecurring}
                onCheckedChange={(checked) => setAppointmentData(prev => ({ ...prev, isRecurring: !!checked }))}
              />
              <Label htmlFor="recurring" className="text-sm font-medium cursor-pointer">
                Recurring
              </Label>
            </div>

            {appointmentData.isRecurring && (
              <div className="ml-6 space-y-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs text-gray-600">Occurrences</Label>
                  <Select
                    value={appointmentData.recurringType}
                    onValueChange={(value) => setAppointmentData(prev => ({ ...prev, recurringType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly on {appointmentData.date ? format(new Date(appointmentData.date), 'EEEE') : 'Selected Day'}</SelectItem>
                      <SelectItem value="monthly">Monthly on {appointmentData.date ? format(new Date(appointmentData.date), 'do') : 'Selected Date'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Ends</Label>
                  <Select
                    value={appointmentData.recurringEnds}
                    onValueChange={(value) => setAppointmentData(prev => ({ ...prev, recurringEnds: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="on">On specific date</SelectItem>
                      <SelectItem value="after">After number of occurrences</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {appointmentData.recurringEnds === 'on' && (
                  <div>
                    <Label className="text-xs text-gray-600">End Date</Label>
                    <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !appointmentData.recurringEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {appointmentData.recurringEndDate ? format(new Date(appointmentData.recurringEndDate), "PPP") : "Pick end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                        <Calendar
                          mode="single"
                          selected={appointmentData.recurringEndDate ? new Date(appointmentData.recurringEndDate) : undefined}
                          onSelect={(date) => {
                            setAppointmentData(prev => ({ 
                              ...prev, 
                              recurringEndDate: date ? format(date, 'yyyy-MM-dd') : '' 
                            }));
                            setIsEndDatePickerOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {appointmentData.recurringEnds === 'after' && (
                  <div>
                    <Label className="text-xs text-gray-600">Number of Occurrences</Label>
                    <Input
                      type="number"
                      min="1"
                      value={appointmentData.recurringOccurrences}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, recurringOccurrences: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Meeting Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">Meeting Location</Label>
            <Select
              value={appointmentData.location}
              onValueChange={(value) => setAppointmentData(prev => ({ ...prev, location: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google_meet">Google Meet</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Details */}
          {appointmentData.location && (
            <div className="space-y-2">
              <Label htmlFor="locationDetails" className="text-sm font-medium">
                {appointmentData.location === 'in_person' ? 'Address/Room' :
                 appointmentData.location === 'phone' ? 'Phone Number' :
                 appointmentData.location === 'google_meet' ? 'Meeting Details' :
                 appointmentData.location === 'zoom' ? 'Zoom Link' :
                 appointmentData.location === 'custom' ? 'Meeting Link/Details' : 'Location Details'}
              </Label>
              <Input
                id="locationDetails"
                value={appointmentData.locationDetails}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, locationDetails: e.target.value }))}
                placeholder={
                  appointmentData.location === 'in_person' ? 'Enter address or room number...' :
                  appointmentData.location === 'phone' ? 'Enter phone number...' :
                  appointmentData.location === 'google_meet' ? 'Google Meet will auto-generate link' :
                  appointmentData.location === 'zoom' ? 'Enter Zoom meeting link...' :
                  appointmentData.location === 'custom' ? 'Enter meeting link or details...' : 'Enter location details...'
                }
              />
            </div>
          )}

          {/* Attendees */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Attendees</Label>
            
            {/* Primary Attendee (Client) */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{clientName}</p>
                  <p className="text-xs text-gray-600">Primary Client</p>
                </div>
                <div className="text-xs text-gray-500">Confirmed</div>
              </div>
            </div>
            
            {/* Additional Attendees */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Additional Attendees (Optional)</Label>
              
              {/* Staff Member Selection */}
              <div className="space-y-2">
                <Select
                  onValueChange={(value) => {
                    const selectedStaff = staff.find((member: any) => member.id === value);
                    if (selectedStaff && !additionalAttendees.some(a => a.id === value)) {
                      setAdditionalAttendees(prev => [...prev, {
                        id: value,
                        name: `${selectedStaff.firstName} ${selectedStaff.lastName}`,
                        email: selectedStaff.email,
                        type: 'staff'
                      }]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add staff member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.filter((member: any) => 
                      !additionalAttendees.some(a => a.id === member.id)
                    ).map((member: any) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom Email Input */}
              <div className="flex gap-2">
                <Input
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  placeholder="Add custom email..."
                  type="email"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (customEmailInput && !additionalAttendees.some(a => a.email === customEmailInput)) {
                      setAdditionalAttendees(prev => [...prev, {
                        id: customEmailInput,
                        name: customEmailInput,
                        email: customEmailInput,
                        type: 'custom'
                      }]);
                      setCustomEmailInput('');
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              
              {/* List of Additional Attendees */}
              {additionalAttendees.length > 0 && (
                <div className="space-y-2 mt-3">
                  {additionalAttendees.map((attendee, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{attendee.name}</p>
                        <p className="text-xs text-gray-600">{attendee.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAdditionalAttendees(prev => prev.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 hover:bg-gray-100"
                    data-testid="button-merge-tags-description"
                  >
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-xs">Merge Tags</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <div className="p-2">
                    <Input
                      placeholder="Search merge tags..."
                      value={descriptionMergeTagSearch}
                      onChange={(e) => setDescriptionMergeTagSearch(e.target.value)}
                      className="h-8 text-sm"
                      data-testid="input-search-merge-tags-description"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filterMergeTags(descriptionMergeTagSearch).map((group, groupIndex) => (
                      <div key={groupIndex}>
                        {groupIndex > 0 && <DropdownMenuSeparator />}
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                          {group.label}
                        </div>
                        {group.tags.map((tag, tagIndex) => (
                          <DropdownMenuItem
                            key={`${groupIndex}-${tagIndex}`}
                            onClick={() => insertMergeTagInDescription(tag.value)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col items-start">
                              <span className="text-sm">{tag.label}</span>
                              <span className="text-xs text-gray-500">{tag.value}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Textarea
              id="description"
              value={appointmentData.description}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add any additional notes or agenda items..."
              rows={3}
              data-testid="textarea-appointment-description"
            />
          </div>

          {/* Action Buttons with Status */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
              <Label htmlFor="status" className="text-sm font-medium">Status:</Label>
              <Select
                value={appointmentData.status}
                onValueChange={(value) => setAppointmentData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-32">
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
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createAppointmentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createAppointmentMutation.isPending}
                data-testid="button-create-appointment"
              >
                {createAppointmentMutation.isPending ? "Creating..." : "Create Appointment"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
