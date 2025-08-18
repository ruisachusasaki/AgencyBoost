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
}

const appointmentFormSchema = insertLeadAppointmentSchema.extend({
  date: z.date(),
  time: z.string().min(1, "Time is required"),
  assignedTo: z.string().min(1, "Team member assignment is required"),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

export default function LeadAppointmentBooking({ leadId, onSuccess }: LeadAppointmentBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  console.log("LeadAppointmentBooking component loaded with leadId:", leadId);
  
  // Add a simple test button to verify the component is working
  const handleTestClick = () => {
    console.log("Test button clicked in LeadAppointmentBooking");
    alert("LeadAppointmentBooking component is working!");
  };

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
    },
  });

  // Update form date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      form.setValue('date', selectedDate);
    }
  }, [selectedDate, form]);

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      console.log("Mutation started with data:", data);
      
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
      
      console.log("Calculated times - Start:", startTime, "End:", endTime);

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

      return await fetch("/api/lead-appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      });
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
    console.log("Form submitted with data:", data);
    console.log("Selected date:", selectedDate);
    console.log("Form errors:", form.formState.errors);
    
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
    
    console.log("Submitting appointment data:", submissionData);
    createAppointmentMutation.mutate(submissionData);
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
        <div className="mb-4 p-2 bg-gray-100 rounded">
          <p className="text-sm">Debug Info:</p>
          <p className="text-xs">Lead ID: {leadId}</p>
          <p className="text-xs">Staff count: {(staff as any[]).length} | Loading: No</p>
          <Button onClick={handleTestClick} variant="outline" size="sm">
            Test Button
          </Button>
        </div>
        <Form {...form}>
          <form 
            onSubmit={(e) => {
              console.log("Form onSubmit triggered");
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }} 
            className="space-y-4"
          >
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
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
              <Button type="button" variant="outline" onClick={onSuccess}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAppointmentMutation.isPending}
                onClick={(e) => {
                  console.log("Book Appointment button clicked");
                  console.log("Current form values:", form.getValues());
                  console.log("Form errors:", form.formState.errors);
                  // Form submission will be handled by onSubmit
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