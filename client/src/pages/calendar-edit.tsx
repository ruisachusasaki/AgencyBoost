import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Calendar, 
  Settings, 
  ArrowLeft,
  Save,
  Trash2,
  Copy,
  ExternalLink,
  Info,
  Clock,
  Share2,
  Check
} from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Validation schema for calendar editing
const calendarEditSchema = z.object({
  name: z.string().min(1, "Calendar name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  color: z.string().min(1, "Color is required"),
  customUrl: z.string().min(1, "Custom URL is required"),
  duration: z.number().min(5).max(480), // 5 minutes to 8 hours
  location: z.enum(["google_meet", "zoom", "custom"]),
  locationDetails: z.string().optional(),
  bufferTime: z.number().min(0).max(120),
  scheduleWindowStart: z.number().min(1).max(8760), // 1 hour to 1 year in hours
  scheduleWindowEnd: z.number().min(24).max(8760), // 24 hours to 1 year in hours
  timezone: z.string().min(1, "Timezone is required"),
  meetingInviteTitle: z.string().optional(),
  slotInterval: z.number().min(5).max(240), // 5 minutes to 4 hours
  maxBookingsPerDay: z.number().min(1).max(50),
  maxBookersPerSlot: z.number().min(1).max(20),
});

type CalendarEditForm = z.infer<typeof calendarEditSchema>;

interface CalendarData {
  id: string;
  name: string;
  description?: string;
  type: string;
  customUrl: string;
  duration: number;
  durationUnit: string;
  location?: string;
  locationDetails?: string;
  bufferTime: number;
  scheduleWindowStart: number;
  scheduleWindowEnd: number;
  isActive: boolean;
  color: string;
  publicUrl: string;
  createdAt: string;
  // Additional fields not in schema but used for form
  meetingInviteTitle?: string;
  slotInterval?: number;
  maxBookingsPerDay?: number;
  maxBookersPerSlot?: number;
}

export default function CalendarEdit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/settings/calendar/:id/edit");
  const [activeTab, setActiveTab] = useState("details");
  const [embedCopied, setEmbedCopied] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<{[key: string]: {enabled: boolean, startTime: string, endTime: string}}>({
    monday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    tuesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    wednesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    thursday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    friday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    saturday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    sunday: { enabled: false, startTime: "09:00", endTime: "17:00" }
  });
  
  const calendarId = params?.id;

  // Fetch calendar data
  const { data: calendar, isLoading, error } = useQuery<CalendarData>({
    queryKey: ["/api/calendars", calendarId],
    queryFn: async () => {
      const response = await fetch(`/api/calendars/${calendarId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar');
      }
      return response.json();
    },
    enabled: !!calendarId,
  });

  const form = useForm<CalendarEditForm>({
    resolver: zodResolver(calendarEditSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      color: "#46a1a0",
      customUrl: "",
      duration: 30,
      location: "google_meet",
      locationDetails: "",
      bufferTime: 15,
      scheduleWindowStart: 24,
      scheduleWindowEnd: 1440,
      timezone: "America/New_York",
      meetingInviteTitle: "",
      slotInterval: 30,
      maxBookingsPerDay: 8,
      maxBookersPerSlot: 1,
    },
  });

  // Update form when calendar data is loaded
  useEffect(() => {
    if (calendar) {
      form.reset({
        name: calendar.name,
        description: calendar.description || "",
        isActive: calendar.isActive,
        color: calendar.color || "#46a1a0",
        customUrl: calendar.customUrl,
        duration: calendar.duration,
        location: (calendar.location as "google_meet" | "zoom" | "custom") || "google_meet",
        locationDetails: calendar.locationDetails || "",
        bufferTime: calendar.bufferTime,
        scheduleWindowStart: calendar.scheduleWindowStart,
        scheduleWindowEnd: calendar.scheduleWindowEnd,
        timezone: "America/New_York", // Default timezone as not stored in schema
        meetingInviteTitle: calendar.meetingInviteTitle || "",
        slotInterval: calendar.slotInterval || 30,
        maxBookingsPerDay: calendar.maxBookingsPerDay || 8,
        maxBookersPerSlot: calendar.maxBookersPerSlot || 1,
      });
    }
  }, [calendar, form]);

  // Update calendar mutation
  const updateCalendarMutation = useMutation({
    mutationFn: async (data: CalendarEditForm) => {
      return await apiRequest("PUT", `/api/calendars/${calendarId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Calendar Updated",
        description: "Calendar has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendars", calendarId] });
      navigate("/settings/calendar-settings");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete calendar mutation
  const deleteCalendarMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/calendars/${calendarId}`);
    },
    onSuccess: () => {
      toast({
        title: "Calendar Deleted",
        description: "Calendar has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendars"] });
      navigate("/settings/calendar-settings");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CalendarEditForm) => {
    updateCalendarMutation.mutate(data);
  };

  const copyPublicUrl = () => {
    if (calendar?.publicUrl) {
      navigator.clipboard.writeText(calendar.publicUrl);
      toast({
        title: "Copied",
        description: "Public booking URL copied to clipboard.",
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this calendar? This action cannot be undone.")) {
      deleteCalendarMutation.mutate();
    }
  };

  const copyEmbedCode = () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/${calendar?.customUrl}" width="100%" height="600" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Embed code copied to clipboard.",
    });
  };

  if (!match) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !calendar) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Link href="/settings/calendar-settings">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Calendar Settings</span>
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600 dark:text-red-400">
              Calendar not found or failed to load.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="calendar-edit-page">
      {/* Back Button */}
      <div className="flex items-center space-x-2">
        <Link href="/settings/calendar-settings">
          <Button variant="outline" size="sm" className="flex items-center space-x-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Calendar Settings</span>
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-[#46a1a0]" />
            <span>Edit Calendar</span>
          </h1>
          <p className="text-muted-foreground">
            Configure calendar settings and booking options
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={calendar.isActive ? "default" : "secondary"} data-testid="badge-status">
            {calendar.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main Form with Tabs */}
        <div>
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "details", name: "Calendar Details", icon: Info },
                { id: "availability", name: "Availability & Booking Settings", icon: Clock },
                { id: "sharing", name: "Sharing", icon: Share2 }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Details Tab */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Calendar Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                  {/* Calendar Type (Read-Only) */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-semibold">Calendar Type</h4>
                        <p className="text-sm text-muted-foreground">
                          {calendar?.type === "personal" ? "Personal Booking Calendar" : "Round Robin Calendar"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calendar Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter calendar name" 
                              {...field} 
                              data-testid="input-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="color" 
                                {...field} 
                                className="w-16 h-10 p-1"
                                data-testid="input-color"
                              />
                              <Input 
                                {...field} 
                                placeholder="#46a1a0"
                                className="flex-1"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Calendar description..."
                            className="resize-none"
                            rows={3}
                            {...field}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="meetingInviteTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Invite Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Meeting with {CONTACT_FIRST_NAME}"
                            {...field}
                            data-testid="input-meeting-title"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Supports merge tags like {"{CONTACT_FIRST_NAME}"}, {"{CONTACT_EMAIL}"}
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* URL Settings */}
                  <FormField
                    control={form.control}
                    name="customUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom URL</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md">
                              /book/
                            </span>
                            <Input
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                              placeholder="my-calendar"
                              className="rounded-l-none"
                              data-testid="input-custom-url"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location Settings */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meeting Location</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-location">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="google_meet">Google Meet</SelectItem>
                              <SelectItem value="zoom">Zoom</SelectItem>
                              <SelectItem value="custom">Custom Location</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("location") === "custom" && (
                      <FormField
                        control={form.control}
                        name="locationDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location Details</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter custom location details"
                                {...field}
                                data-testid="input-location-details"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Calendar</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enable this calendar for booking
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                    </CardContent>
                  </Card>

                  {/* Calendar Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Calendar Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-sm" data-testid="text-created-date">
                          {new Date(calendar.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Calendar ID</Label>
                        <p className="text-sm font-mono text-muted-foreground" data-testid="text-calendar-id">
                          {calendar.id}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Availability & Booking Settings Tab */}
              {activeTab === "availability" && (
                <div className="space-y-6">
                  {/* Weekly Availability */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Weekly Availability</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Available Hours</Label>
                        <div className="grid gap-3">
                          {Object.entries(weeklyAvailability).map(([day, hours]) => (
                            <div key={day} className="flex items-center gap-3 p-3 border rounded-lg">
                              <Checkbox
                                checked={hours.enabled}
                                onCheckedChange={(checked) => 
                                  setWeeklyAvailability(prev => ({
                                    ...prev,
                                    [day]: { ...hours, enabled: !!checked }
                                  }))
                                }
                                data-testid={`checkbox-${day}`}
                              />
                              <div className="w-20 text-sm capitalize font-medium">{day}</div>
                              {hours.enabled && (
                                <div className="flex gap-3 items-center flex-1">
                                  <Input
                                    type="time"
                                    value={hours.startTime}
                                    onChange={(e) => 
                                      setWeeklyAvailability(prev => ({
                                        ...prev,
                                        [day]: { ...hours, startTime: e.target.value }
                                      }))
                                    }
                                    className="w-28 text-sm"
                                    data-testid={`input-${day}-start`}
                                  />
                                  <span className="text-xs text-gray-500 px-1">to</span>
                                  <Input
                                    type="time"
                                    value={hours.endTime}
                                    onChange={(e) => 
                                      setWeeklyAvailability(prev => ({
                                        ...prev,
                                        [day]: { ...hours, endTime: e.target.value }
                                      }))
                                    }
                                    className="w-28 text-sm"
                                    data-testid={`input-${day}-end`}
                                  />
                                </div>
                              )}
                              {!hours.enabled && (
                                <div className="flex-1 text-sm text-gray-400">Unavailable</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Booking Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Booking Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Duration and Interval */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meeting Duration (minutes)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="5" 
                                  max="480"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-duration"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="slotInterval"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Slot Interval (minutes)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="5" 
                                  max="240"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-slot-interval"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Buffer Times */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="bufferTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Buffer Time (minutes)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="120"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-buffer-time"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="scheduleWindowStart"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Notice (hours)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="8760"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-schedule-start"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="scheduleWindowEnd"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Advance Booking (hours)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="24" 
                                  max="8760"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-schedule-end"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Booking Limits */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="maxBookingsPerDay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Bookings Per Day</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="50"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-max-bookings-day"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxBookersPerSlot"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Bookers Per Slot</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="20"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-max-bookers-slot"
                                  disabled={calendar?.type === "personal"}
                                />
                              </FormControl>
                              <FormMessage />
                              {calendar?.type === "personal" && (
                                <p className="text-xs text-muted-foreground">Fixed at 1 for personal bookings</p>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger data-testid="select-timezone">
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                <SelectItem value="America/Chicago">Central Time</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                <SelectItem value="UTC">UTC</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Sharing Tab */}
              {activeTab === "sharing" && (
                <div className="space-y-6">
                  {/* Public Booking URL */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Public Booking URL</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Input 
                          value={calendar.publicUrl} 
                          readOnly 
                          className="flex-1 bg-gray-50 dark:bg-gray-800"
                          data-testid="input-public-url"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={copyPublicUrl}
                          data-testid="button-copy-url"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(`/book/${calendar.customUrl}`, '_blank')}
                          data-testid="button-open-url"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Share this URL with clients to allow them to book appointments directly. This opens a clean, standalone booking page perfect for emails and direct sharing.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Embed Code */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Embed Code</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input 
                            value={`<iframe src="${window.location.origin}/embed/${calendar?.customUrl}" width="100%" height="600" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`}
                            readOnly 
                            className="flex-1 bg-gray-50 dark:bg-gray-800 font-mono text-xs"
                            data-testid="input-embed-code"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={copyEmbedCode}
                            data-testid="button-copy-embed"
                          >
                            {embedCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(`/embed/${calendar.customUrl}`, '_blank')}
                            data-testid="button-preview-embed"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Embed this calendar directly into your website. The embed shows only the booking widget without the CRM interface.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteCalendarMutation.isPending}
                  data-testid="button-delete"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Calendar
                </Button>
                
                <Button 
                  type="submit"
                  disabled={updateCalendarMutation.isPending}
                  data-testid="button-save"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateCalendarMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}