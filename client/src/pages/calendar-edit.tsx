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
  ExternalLink
} from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Validation schema for calendar editing
const calendarEditSchema = z.object({
  name: z.string().min(1, "Calendar name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  color: z.string().min(1, "Color is required"),
  bufferTime: z.number().min(0).max(120),
  maxAdvanceBooking: z.number().min(1).max(365),
  timezone: z.string().min(1, "Timezone is required"),
});

type CalendarEditForm = z.infer<typeof calendarEditSchema>;

interface CalendarData {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  color: string;
  bufferTime: number;
  maxAdvanceBooking: number;
  timezone: string;
  publicUrl: string;
  createdAt: string;
}

export default function CalendarEdit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/settings/calendar/:id/edit");
  
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
      bufferTime: 15,
      maxAdvanceBooking: 30,
      timezone: "America/New_York",
    },
  });

  // Update form when calendar data is loaded
  useEffect(() => {
    if (calendar) {
      form.reset({
        name: calendar.name,
        description: calendar.description || "",
        isActive: calendar.isActive,
        color: calendar.color,
        bufferTime: calendar.bufferTime,
        maxAdvanceBooking: calendar.maxAdvanceBooking,
        timezone: calendar.timezone,
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <FormLabel>Description (Optional)</FormLabel>
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
                      name="maxAdvanceBooking"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Advance Booking (days)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="365"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-max-advance"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                  <div className="flex justify-between">
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
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Public URL Card */}
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
                <Button variant="outline" size="sm" data-testid="button-open-url">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this URL with clients to allow them to book appointments directly.
              </p>
            </CardContent>
          </Card>

          {/* Calendar Stats */}
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
      </div>
    </div>
  );
}