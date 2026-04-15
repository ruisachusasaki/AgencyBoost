import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCustomFieldMergeTags } from "@/hooks/use-custom-field-merge-tags";
import { insertLeadAppointmentSchema, type LeadAppointment, type InsertLeadAppointment } from "@shared/schema";
import { Calendar as CalendarIcon, Clock, MapPin, FileText, Tag } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

interface LeadAppointmentBookingProps {
  leadId?: string;
  editingAppointment?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const appointmentFormSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  calendarId: z.string().min(1, "Calendar selection is required"),
  assignedTo: z.string().min(1, "Team member assignment is required"),
  activityType: z.string().min(1, "Activity type is required"),
  title: z.string().min(1, "Meeting title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  date: z.date(),
  time: z.string().min(1, "Time is required"),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

// Define available merge tags for leads
const leadMergeTagGroups = [
  {
    label: "Lead Information",
    tags: [
      { label: "Lead Name", value: "{{name}}" },
      { label: "Email Address", value: "{{email}}" },
      { label: "Phone Number", value: "{{phone}}" },
      { label: "Company Name", value: "{{company}}" },
      { label: "Lead Source", value: "{{source}}" },
      { label: "Lead Status", value: "{{status}}" },
      { label: "Potential Value", value: "{{value}}" },
      { label: "Assigned To (Staff)", value: "{{assignedTo}}" },
      { label: "Notes", value: "{{notes}}" },
      { label: "Last Contact Date", value: "{{lastContactDate}}" },
    ]
  },
  {
    label: "Appointment Details",
    tags: [
      { label: "Appointment Date", value: "{{appointmentDate}}" },
      { label: "Appointment Time", value: "{{appointmentTime}}" },
      { label: "Calendar Name", value: "{{calendarName}}" },
      { label: "Team Member Name", value: "{{teamMember}}" },
      { label: "Meeting Location", value: "{{location}}" },
    ]
  }
];

export default function LeadAppointmentBooking({ leadId, editingAppointment, onSuccess, onCancel }: LeadAppointmentBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { customFieldTagGroup } = useCustomFieldMergeTags();

  const allMergeTagGroups = useMemo(() => [
    ...leadMergeTagGroups,
    ...customFieldTagGroup,
  ], [customFieldTagGroup]);
  


  const { data: calendars = [] } = useQuery({
    queryKey: ["/api/calendars"],
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      leadId: leadId || "",
      calendarId: "",
      assignedTo: "",
      activityType: "appointment",
      title: "",
      description: "",
      location: "",
      time: "",
      date: undefined as any, // Will be set when date is selected
    },
    mode: "onChange", // Enable real-time validation
  });

  // Update form date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      form.setValue('date', selectedDate);
    }
  }, [selectedDate, form]);

  // Populate form when editing appointment
  useEffect(() => {
    if (editingAppointment) {
      const startTime = new Date(editingAppointment.startTime);
      const timeString = startTime.toTimeString().slice(0, 5); // Format as HH:mm
      
      form.reset({
        leadId: leadId || "",
        calendarId: editingAppointment.calendarId || "",
        assignedTo: editingAppointment.assignedTo || "",
        activityType: editingAppointment.activityType || "appointment",
        title: editingAppointment.title || "",
        description: editingAppointment.description || "",
        location: editingAppointment.location || "",
        time: timeString,
        date: startTime,
      });
      setSelectedDate(startTime);
    }
  }, [editingAppointment, leadId, form]);

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      // Validate time format
      if (!data.time || !data.time.includes(':')) {
        throw new Error("Invalid time format");
      }
      
      // Combine date and time
      const [hours, minutes] = data.time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error("Invalid time values");
      }
      
      const startTime = new Date(data.date);
      startTime.setHours(hours, minutes, 0, 0);
      
      // Set end time to 1 hour later
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);

      const appointmentData: InsertLeadAppointment = {
        leadId: data.leadId,
        calendarId: data.calendarId,
        assignedTo: data.assignedTo,
        activityType: data.activityType,
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        startTime,
        endTime,
        // createdBy will be set by backend from authenticated user session
      };

      const isEditing = !!editingAppointment;
      const url = isEditing ? `/api/lead-appointments/${editingAppointment.id}` : "/api/lead-appointments";
      const method = isEditing ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-appointments"] });
      toast({
        title: "Success",
        variant: "default",
        description: editingAppointment ? "Appointment updated successfully!" : "Appointment booked successfully!",
      });
      form.reset();
      setSelectedDate(undefined);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    // Validate all required fields
    if (!data.calendarId) {
      toast({
        title: "Error",
        description: "Please select a calendar",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.assignedTo) {
      toast({
        title: "Error",
        description: "Please select a team member",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.title?.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a meeting title",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.time || !data.time.includes(':')) {
      toast({
        title: "Error",
        description: "Please select a time",
        variant: "destructive", 
      });
      return;
    }
    
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    const submissionData = {
      ...data,
      date: selectedDate,
    };
    
    createAppointmentMutation.mutate(submissionData);
  };

  const handleCancel = () => {
    form.reset();
    setSelectedDate(undefined);
    setIsDatePickerOpen(false);
    onCancel?.();
  };

  // Generate time options (9 AM to 6 PM in 30-minute intervals)
  const timeOptions: { value: string; label: string }[] = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = new Date(0, 0, 0, hour, minute).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      timeOptions.push({ value: time, label: displayTime });
    }
  }

  // Merge tag handlers
  const insertMergeTagIntoTitle = (tag: string) => {
    const currentTitle = form.getValues('title');
    form.setValue('title', currentTitle + tag);
  };

  const insertMergeTagIntoDescription = (tag: string) => {
    const currentDescription = form.getValues('description') || '';
    form.setValue('description', currentDescription + tag);
  };

  // Small Merge Tags Dropdown Component with search
  const MergeTagsDropdown = ({ onInsert }: { onInsert: (tag: string) => void }) => {
    const [searchTerm, setSearchTerm] = useState("");
    
    const filteredGroups = allMergeTagGroups.map(group => ({
      ...group,
      tags: group.tags.filter(tag => 
        tag.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.tags.length > 0);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            type="button"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            data-testid="button-merge-tags"
          >
            <Tag className="h-4 w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end">
          <div className="p-2">
            <Input
              placeholder="Search merge tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm"
              data-testid="input-search-merge-tags"
            />
          </div>
          {filteredGroups.map((group, groupIndex) => (
            <div key={group.label}>
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                {group.label}
              </div>
              {group.tags.map((tag) => (
                <DropdownMenuItem 
                  key={tag.value} 
                  onClick={() => {
                    onInsert(tag.value);
                    setSearchTerm(""); // Clear search after insert
                  }}
                  className="cursor-pointer"
                  data-testid={`menu-item-${tag.value}`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{tag.label}</span>
                    <span className="text-xs text-gray-500">{tag.value}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              {groupIndex < filteredGroups.length - 1 && <DropdownMenuSeparator />}
            </div>
          ))}
          {filteredGroups.length === 0 && searchTerm && (
            <div className="px-2 py-4 text-sm text-gray-500 text-center">
              No merge tags found
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const isLoading = createAppointmentMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          {editingAppointment ? 'Edit Appointment' : 'Book Appointment'}
        </CardTitle>
      </CardHeader>
      <CardContent>


        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Select Calendar */}
            <FormField
              control={form.control}
              name="calendarId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Step 1: Select Calendar *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a calendar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(calendars as any[]).map((calendar: any) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          {calendar.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Step 1.5: Assign Team Member */}
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Team Member *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(staff as any[]).map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Activity Type */}
            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Activity Type *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-activity-type">
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="appointment">Appointment (General Meeting)</SelectItem>
                      <SelectItem value="pitch">Pitch (Sales Presentation)</SelectItem>
                      <SelectItem value="demo">Demo (Product Demonstration)</SelectItem>
                      <SelectItem value="follow_up">Follow-up Call/Meeting</SelectItem>
                      <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Step 2: Select Date & Time */}
            <div className="space-y-4">
              <FormLabel className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Step 2: Choose Date & Time *
              </FormLabel>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Date</label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
                        data-testid="button-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setIsDatePickerOpen(false); // Close the popover
                          if (date) {
                            form.setValue('date', date);
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Step 3: Meeting Details */}
            <div className="space-y-4">
              <FormLabel className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Step 3: Meeting Details *
              </FormLabel>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Appointment Title</FormLabel>
                      <MergeTagsDropdown onInsert={insertMergeTagIntoTitle} />
                    </div>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Initial consultation, Follow-up meeting" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Meeting Location
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Office address, Zoom link, or phone number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Description (Optional)</FormLabel>
                      <MergeTagsDropdown onInsert={insertMergeTagIntoDescription} />
                    </div>
                    <FormControl>
                      <Textarea 
                        {...field}
                        value={field.value || ""} 
                        placeholder="Meeting agenda, notes, or additional details..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                data-testid="button-cancel"
              >
                Cancel
              </Button>

              <Button 
                type="submit" 
                disabled={createAppointmentMutation.isPending}
                data-testid="button-book"
              >
                {createAppointmentMutation.isPending 
                  ? (editingAppointment ? "Updating..." : "Booking...") 
                  : (editingAppointment ? "Update Appointment" : "Book Appointment")
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}