import { useState, useEffect } from "react";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertLeadAppointmentSchema, type LeadAppointment, type InsertLeadAppointment } from "@shared/schema";
import { Calendar as CalendarIcon, Clock, MapPin, FileText } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

interface LeadAppointmentBookingProps {
  leadId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const appointmentFormSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  calendarId: z.string().min(1, "Calendar selection is required"),
  assignedTo: z.string().min(1, "Team member assignment is required"),
  title: z.string().min(1, "Meeting title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  date: z.date(),
  time: z.string().min(1, "Time is required"),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

export default function LeadAppointmentBooking({ leadId, onSuccess, onCancel }: LeadAppointmentBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  


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

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      console.log("=== Mutation function called ===");
      console.log("Received data:", data);
      
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
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        startTime,
        endTime,
        createdBy: "e56be30d-c086-446c-ada4-7ccef37ad7fb", // Default user, should come from auth
      };

      console.log("Prepared appointment data:", appointmentData);
      console.log("Making API request to /api/lead-appointments");

      const response = await fetch("/api/lead-appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log("API success response:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-appointments"] });
      toast({
        title: "Success",
        description: "Appointment booked successfully!",
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
    console.log("=== Form submission started ===");
    console.log("Form data:", data);
    console.log("Selected date:", selectedDate);
    
    // Validate all required fields
    if (!data.calendarId) {
      console.log("Validation failed: No calendar selected");
      toast({
        title: "Error",
        description: "Please select a calendar",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.assignedTo) {
      console.log("Validation failed: No team member selected");
      toast({
        title: "Error",
        description: "Please select a team member",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.title?.trim()) {
      console.log("Validation failed: No title entered");
      toast({
        title: "Error", 
        description: "Please enter a meeting title",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.time || !data.time.includes(':')) {
      console.log("Validation failed: No time selected");
      toast({
        title: "Error",
        description: "Please select a time",
        variant: "destructive", 
      });
      return;
    }
    
    if (!selectedDate) {
      console.log("Validation failed: No date selected");
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    console.log("All validations passed, submitting...");
    const submissionData = {
      ...data,
      date: selectedDate,
    };
    
    console.log("Final submission data:", submissionData);
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

  const isLoading = createAppointmentMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Book Appointment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Debug Panel */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <div>Selected Date: {selectedDate ? selectedDate.toDateString() : "None"}</div>
          <div>Form Valid: {form.formState.isValid ? "Yes" : "No"}</div>
          <div>Form Values: {JSON.stringify(form.getValues(), null, 2)}</div>
          <div>Form Errors: {JSON.stringify(form.formState.errors, null, 2)}</div>
        </div>

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
                          console.log("Date selected:", date);
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
                    <FormLabel>Appointment Title</FormLabel>
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
                    <FormLabel>Description (Optional)</FormLabel>
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
                type="button" 
                variant="secondary"
                onClick={() => {
                  console.log("=== Manual submit test ===");
                  const formData = form.getValues();
                  const testData = {
                    ...formData,
                    date: selectedDate,
                  };
                  console.log("Test data:", testData);
                  if (selectedDate && formData.calendarId && formData.assignedTo && formData.title && formData.time) {
                    console.log("All required fields present, calling mutation...");
                    createAppointmentMutation.mutate(testData as AppointmentFormData);
                  } else {
                    console.log("Missing required fields");
                  }
                }}
                data-testid="button-test"
              >
                Test Submit
              </Button>
              <Button 
                type="submit" 
                disabled={createAppointmentMutation.isPending}
                data-testid="button-book"
                onClick={(e) => {
                  console.log("=== Book button clicked ===");
                  console.log("Form values:", form.getValues());
                  console.log("Selected date:", selectedDate);
                  console.log("Form valid:", form.formState.isValid);
                  console.log("Form errors:", form.formState.errors);
                }}
              >
                {createAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}