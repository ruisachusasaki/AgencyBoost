import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  Users, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Copy
} from "lucide-react";

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

interface CalendarStaffData {
  id: string;
  calendarId: string;
  staffId: string;
  staffName: string;
  assignmentType: 'fixed' | 'round_robin';
  isActive: boolean;
}

interface AvailabilityData {
  id: string;
  calendarId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default function CalendarSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("calendars");

  // Fetch calendars
  const { data: calendars = [], isLoading: calendarsLoading } = useQuery({
    queryKey: ["/api/calendars"],
  });

  // Fetch staff
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  // Create calendar mutation
  const createCalendarMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/calendars", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Calendar Created",
        description: "New calendar has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendars"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyPublicUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "Public booking URL copied to clipboard.",
    });
  };

  if (calendarsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            Calendar Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage calendars, staff assignments, and booking availability
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendars" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendars
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff Assignment
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendars" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Calendar Management
              </h2>
              <Button 
                onClick={() => {
                  const newCalendar = {
                    name: "New Calendar",
                    description: "",
                    isActive: true,
                    color: "#3b82f6",
                    bufferTime: 15,
                    maxAdvanceBooking: 30,
                    timezone: "America/New_York"
                  };
                  createCalendarMutation.mutate(newCalendar);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Calendar
              </Button>
            </div>

            <div className="grid gap-6">
              {calendars.map((calendar: CalendarData) => (
                <Card key={calendar.id} className="border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: calendar.color }}
                        ></div>
                        <div>
                          <CardTitle className="text-lg">{calendar.name}</CardTitle>
                          {calendar.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {calendar.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={calendar.isActive ? "default" : "secondary"}>
                          {calendar.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-500 dark:text-gray-400">Buffer Time</Label>
                        <p className="font-medium">{calendar.bufferTime} minutes</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 dark:text-gray-400">Max Advance</Label>
                        <p className="font-medium">{calendar.maxAdvanceBooking} days</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 dark:text-gray-400">Timezone</Label>
                        <p className="font-medium">{calendar.timezone}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 dark:text-gray-400">Created</Label>
                        <p className="font-medium">
                          {new Date(calendar.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Label className="text-sm font-medium">Public Booking URL:</Label>
                      <Input 
                        value={calendar.publicUrl} 
                        readOnly 
                        className="flex-1 bg-white dark:bg-gray-700"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyPublicUrl(calendar.publicUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Staff Assignment
            </h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Staff assignment functionality will be implemented here.
                  This will allow assigning staff members to calendars with different assignment types.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Availability Management
            </h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Availability management functionality will be implemented here.
                  This will allow setting up working hours, breaks, and date overrides.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Calendar Integrations
            </h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Calendar integrations (Google Calendar, Outlook, etc.) will be implemented here.
                  This will allow syncing appointments with external calendar systems.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}