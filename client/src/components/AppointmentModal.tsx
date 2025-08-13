import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, X, Clock, MapPin, Repeat, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName?: string;
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

export function AppointmentModal({ open, onOpenChange, clientId, clientName, onSuccess }: AppointmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
    bookerEmail: '',
    bookerPhone: '',
    isRecurring: false,
    recurringType: 'daily',
    recurringEnds: 'never',
    recurringEndDate: '',
    recurringOccurrences: 1
  });

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
  const { data: staff = [] } = useQuery({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    }
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create appointment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Created",
        description: "The appointment has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments'] });
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
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
      bookerEmail: '',
      bookerPhone: '',
      isRecurring: false,
      recurringType: 'daily',
      recurringEnds: 'never',
      recurringEndDate: '',
      recurringOccurrences: 1
    });
  };

  const handleSubmit = () => {
    if (!appointmentData.calendarId || !appointmentData.title || !appointmentData.assignedTo || !appointmentData.date || !appointmentData.time || !appointmentData.bookerEmail) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Calendar, Title, Team Member, Date, Time, and Email).",
        variant: "destructive",
      });
      return;
    }

    // Convert date and time to start/end timestamps
    const startDateTime = new Date(`${appointmentData.date}T${appointmentData.time}`);
    const endDateTime = new Date(startDateTime.getTime() + appointmentData.duration * 60000);

    const appointmentPayload = {
      calendarId: appointmentData.calendarId,
      clientId: clientId,
      assignedTo: appointmentData.assignedTo,
      title: appointmentData.title,
      description: appointmentData.description,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      status: appointmentData.status,
      timezone: appointmentData.timezone,
      location: appointmentData.location,
      locationDetails: appointmentData.locationDetails,
      meetingLink: appointmentData.meetingLink,
      bookerName: appointmentData.bookerName,
      bookerEmail: appointmentData.bookerEmail,
      bookerPhone: appointmentData.bookerPhone,
      bookingSource: 'admin'
    };

    createAppointmentMutation.mutate(appointmentPayload);
  };

  const timeSlots = generateTimeSlots();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Appointment
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
            <Input
              id="title"
              value={appointmentData.title}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter appointment title..."
            />
          </div>

          {/* Team Member */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo" className="text-sm font-medium">Team Member *</Label>
            <Select
              value={appointmentData.assignedTo}
              onValueChange={(value) => setAppointmentData(prev => ({ ...prev, assignedTo: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member: any) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select
              value={appointmentData.status}
              onValueChange={(value) => setAppointmentData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
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
                <Input
                  id="date"
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                />
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
                    <Input
                      type="date"
                      value={appointmentData.recurringEndDate}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                    />
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

          {/* Contact Information */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Contact Information</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bookerName" className="text-xs text-gray-600">Name</Label>
                <Input
                  id="bookerName"
                  value={appointmentData.bookerName}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, bookerName: e.target.value }))}
                  placeholder="Client name..."
                />
              </div>
              <div>
                <Label htmlFor="bookerEmail" className="text-xs text-gray-600">Email *</Label>
                <Input
                  id="bookerEmail"
                  type="email"
                  value={appointmentData.bookerEmail}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, bookerEmail: e.target.value }))}
                  placeholder="Email address..."
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="bookerPhone" className="text-xs text-gray-600">Phone</Label>
              <Input
                id="bookerPhone"
                value={appointmentData.bookerPhone}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, bookerPhone: e.target.value }))}
                placeholder="Phone number..."
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={appointmentData.description}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add any additional notes or agenda items..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
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
            >
              {createAppointmentMutation.isPending ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}