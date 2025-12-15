import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { 
  Calendar, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  ArrowLeft,
  Filter
} from "lucide-react";
import { CalendarCreationModal } from "@/components/CalendarCreationModal";

// Types for calendar data
interface CalendarData {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  color: string;
  bufferTime: number;
  maxAdvanceBooking: number;
  timezone: string;
  publicUrl: string;
  createdAt: string;
  createdBy: string;
}

// Types for Google Calendar integration
interface ConnectedCalendar {
  id: string;
  name: string;
  email: string;
  twoWaySync: boolean;
  createContacts: boolean;
  triggerWorkflows: boolean;
  lastSync?: string;
}

export default function CalendarSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("calendars");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  
  // Google Calendar integration states
  const [googleCalendarStatus, setGoogleCalendarStatus] = useState<"loading" | "connected" | "disconnected">("loading");
  const [connectedCalendars, setConnectedCalendars] = useState<ConnectedCalendar[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [syncPreferences, setSyncPreferences] = useState({
    blockAsAppointments: false,
    createContacts: false,
    triggerWorkflows: false
  });

  // Fetch calendars
  const { data: calendars = [], isLoading: calendarsLoading } = useQuery<CalendarData[]>({
    queryKey: ["/api/calendars"],
  });

  // Fetch staff for assignment
  const { data: staff = [] } = useQuery<Array<{ id: string; firstName: string; lastName: string; email: string }>>({
    queryKey: ["/api/staff"],
  });

  // Filtered calendars based on filters
  const filteredCalendars = useMemo(() => {
    return calendars.filter(calendar => {
      // Status filter
      if (statusFilter === "active" && !calendar.isActive) return false;
      if (statusFilter === "inactive" && calendar.isActive) return false;
      
      // Type filter
      if (typeFilter === "personal" && calendar.type !== "personal") return false;
      if (typeFilter === "round_robin" && calendar.type !== "round_robin") return false;
      
      // Owner filter
      if (ownerFilter !== "all" && calendar.createdBy !== ownerFilter) return false;
      
      return true;
    });
  }, [calendars, statusFilter, typeFilter, ownerFilter]);

  // Get unique owners for filter dropdown
  const calendarOwners = useMemo(() => {
    const ownerMap = new Map();
    calendars.forEach(calendar => {
      if (calendar.createdBy) {
        const staffMember = staff.find(s => s.id === calendar.createdBy);
        if (staffMember) {
          ownerMap.set(calendar.createdBy, `${staffMember.firstName} ${staffMember.lastName}`);
        }
      }
    });
    return Array.from(ownerMap.entries()).map(([id, name]) => ({ id, name }));
  }, [calendars, staff]);

  // Create calendar mutation
  const createCalendarMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/calendars", data);
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
  
  // Check Google Calendar connection status on mount
  useEffect(() => {
    if (activeTab === "integrations") {
      checkGoogleCalendarStatus();
    }
  }, [activeTab]);
  
  // Check Google Calendar connection status
  const checkGoogleCalendarStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/google-calendar/status');
      const data = await response.json();
      
      if (data.connections && data.connections.length > 0) {
        setGoogleCalendarStatus("connected");
        setConnectedCalendars(data.connections.map((conn: any) => ({
          id: conn.id,
          name: conn.calendarName || 'Primary Calendar',
          email: conn.email,
          twoWaySync: conn.twoWaySync,
          createContacts: conn.createContacts || false,
          triggerWorkflows: conn.triggerWorkflows || false,
          lastSync: conn.lastSyncedAt
        })));
      } else {
        setGoogleCalendarStatus("disconnected");
        setConnectedCalendars([]);
      }
    } catch (error) {
      console.error('Failed to check Google Calendar status:', error);
      setGoogleCalendarStatus("disconnected");
    }
  };
  
  // Handle Google Calendar connection
  const handleGoogleCalendarConnect = async () => {
    setIsConnecting(true);
    try {
      // Get the OAuth authorization URL from the new endpoint
      const response = await apiRequest('GET', '/api/google-calendar/auth');
      const data = await response.json();
      
      if (data.authUrl) {
        // Open Google OAuth in a popup window
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.authUrl, 
          'google-calendar-auth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
        );
        
        // Poll for connection status
        const checkInterval = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(checkInterval);
            setIsConnecting(false);
            await checkGoogleCalendarStatus();
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Failed to connect Google Calendar:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };
  
  // Handle sync
  const handleSync = async (calendarId: string) => {
    setIsSyncing(calendarId);
    try {
      // Use the sync endpoint
      const response = await apiRequest('POST', '/api/google-calendar/sync');
      const result = await response.json();
      
      // Check if sync started successfully
      if (result.success) {
        if (result.status === 'in_progress') {
          toast({
            title: "Sync In Progress",
            description: result.message || "The sync is already running. Please wait.",
          });
        } else {
          toast({
            title: "Sync Started",
            description: result.message || "Syncing your Google Calendar. This may take a few moments for large calendars.",
          });
          
          // Poll for sync status every 3 seconds
          let pollCount = 0;
          const maxPolls = 20; // Max 1 minute of polling
          
          const pollInterval = setInterval(async () => {
            pollCount++;
            
            try {
              const statusResponse = await apiRequest('GET', '/api/google-calendar/status');
              const statusData = await statusResponse.json();
              
              if (statusData.connections && statusData.connections[0]) {
                const conn = statusData.connections[0];
                
                // Check if sync completed
                if (conn.syncStatus !== 'in_progress') {
                  clearInterval(pollInterval);
                  
                  if (conn.syncStatus === 'success') {
                    toast({
                      title: "Sync Complete",
                      description: "Your Google Calendar has been synced successfully!",
                    });
                  } else if (conn.lastSyncError) {
                    toast({
                      title: "Sync Error",
                      description: conn.lastSyncError,
                      variant: "destructive",
                    });
                  }
                  
                  // Update last sync time
                  setConnectedCalendars(prev => prev.map(cal => 
                    cal.id === calendarId 
                      ? { ...cal, lastSync: conn.lastSyncedAt || new Date().toISOString() }
                      : cal
                  ));
                  
                  setIsSyncing(null);
                }
              }
              
              // Stop polling after max attempts
              if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                setIsSyncing(null);
                toast({
                  title: "Sync Status Unknown",
                  description: "The sync is taking longer than expected. Please check back later.",
                });
              }
            } catch (error) {
              // Continue polling even if one check fails
              console.error('Status check error:', error);
            }
          }, 3000);
        }
      } else {
        // Sync failed to start
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to start sync. Please try again.",
          variant: "destructive",
        });
        setIsSyncing(null);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Google Calendar. Please try again.",
        variant: "destructive",
      });
      setIsSyncing(null);
    }
  };
  
  // Handle disconnect
  const handleDisconnect = async (calendarId: string) => {
    try {
      // The disconnect endpoint doesn't need a calendarId parameter
      await apiRequest('POST', '/api/google-calendar/disconnect');
      
      toast({
        title: "Disconnected",
        description: "Google Calendar has been disconnected.",
      });
      
      await checkGoogleCalendarStatus();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Google Calendar.",
        variant: "destructive",
      });
    }
  };
  
  // Handle updating sync settings (client-side only for now)
  const handleUpdateSyncSettings = async (calendarId: string, settings: Partial<ConnectedCalendar>) => {
    try {
      // For now, just update the local state since backend doesn't have a settings endpoint
      // In production, this would save to the backend
      setConnectedCalendars(prev => prev.map(cal => 
        cal.id === calendarId 
          ? { ...cal, ...settings }
          : cal
      ));
      
      toast({
        title: "Settings Updated",
        description: "Google Calendar sync settings have been updated.",
      });
    } catch (error) {
      console.error('Update settings error:', error);
      toast({
        title: "Error",
        description: "Failed to update sync settings.",
        variant: "destructive",
      });
    }
  };

  if (calendarsLoading) {
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

  return (
    <div className="space-y-6">
      {/* Back to Settings Button */}
      <div className="flex items-center space-x-2">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Settings</span>
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-primary" />
          <span>Calendar Settings</span>
        </h1>
        <p className="text-muted-foreground">
          Manage calendars and calendar integrations
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "calendars", name: "Calendars", icon: Calendar, count: filteredCalendars.length },
            { id: "integrations", name: "Integrations", icon: Settings, count: 0 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name} {tab.count > 0 && `(${tab.count})`}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "calendars" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Calendar Management
            </h2>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Calendar
            </Button>
          </div>

          {/* Filter Controls */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label htmlFor="status-filter" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" data-testid="filter-status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <Label htmlFor="type-filter" className="text-sm font-medium">
                    Type
                  </Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="type-filter" data-testid="filter-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="personal">Personal Booking</SelectItem>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Owner Filter */}
                <div className="space-y-2">
                  <Label htmlFor="owner-filter" className="text-sm font-medium">
                    Owner
                  </Label>
                  <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                    <SelectTrigger id="owner-filter" data-testid="filter-owner">
                      <SelectValue placeholder="All Owners" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Owners</SelectItem>
                      {calendarOwners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Showing {filteredCalendars.length} of {calendars.length} calendars
                  </span>
                  {(statusFilter !== "all" || typeFilter !== "all" || ownerFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("all");
                        setTypeFilter("all");
                        setOwnerFilter("all");
                      }}
                      className="text-primary hover:text-primary-dark"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {filteredCalendars.length === 0 ? (
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No calendars found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {calendars.length === 0 
                      ? "You haven't created any calendars yet." 
                      : "No calendars match the current filters."}
                  </p>
                  {calendars.length === 0 && (
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Your First Calendar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredCalendars.map((calendar: CalendarData) => (
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
                      <Badge variant="outline">
                        {calendar.type === "round_robin" ? "Round Robin" : "Personal"}
                      </Badge>
                      <Link href={`/settings/calendar/${calendar.id}/edit`}>
                        <Button variant="ghost" size="sm" data-testid={`button-edit-${calendar.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
                      <Label className="text-gray-500 dark:text-gray-400">Owner</Label>
                      <p className="font-medium">
                        {(() => {
                          const owner = staff.find(s => s.id === calendar.createdBy);
                          return owner ? `${owner.firstName} ${owner.lastName}` : "Unknown";
                        })()}
                      </p>
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
                      value={calendar.publicUrl || ''} 
                      readOnly 
                      className="flex-1 bg-white dark:bg-gray-700"
                      data-testid={`input-public-url-${calendar.id}`}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyPublicUrl(calendar.publicUrl)}
                      data-testid={`button-copy-url-${calendar.id}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(calendar.publicUrl, '_blank')}
                      data-testid={`button-open-url-${calendar.id}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Calendar Integrations
          </h2>
          
          {/* Google Calendar Integration Section */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Connected Calendars</CardTitle>
                <Button 
                  onClick={() => handleGoogleCalendarConnect()}
                  className="flex items-center gap-2"
                  disabled={isConnecting}
                >
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {googleCalendarStatus === "loading" ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Checking connection status...</p>
                </div>
              ) : connectedCalendars.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No calendars connected
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Connect your Google Calendar to sync appointments and availability
                  </p>
                </div>
              ) : (
                connectedCalendars.map((calendar) => (
                  <div key={calendar.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{calendar.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{calendar.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Connected</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(calendar.id)}
                          disabled={isSyncing === calendar.id}
                        >
                          {isSyncing === calendar.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                              Syncing...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-3 w-3 mr-2" />
                              Sync Now
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(calendar.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Sync Settings */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Two-Way Sync</Label>
                            <p className="text-xs text-gray-500">
                              Events created in either system will sync automatically
                            </p>
                          </div>
                          <Switch 
                            checked={calendar.twoWaySync || false}
                            onCheckedChange={(checked) => handleUpdateSyncSettings(calendar.id, { twoWaySync: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Create Contacts from Events</Label>
                            <p className="text-xs text-gray-500">
                              Automatically create contacts for guests in Google events
                            </p>
                          </div>
                          <Switch 
                            checked={calendar.createContacts || false}
                            onCheckedChange={(checked) => handleUpdateSyncSettings(calendar.id, { createContacts: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Trigger Workflows</Label>
                            <p className="text-xs text-gray-500">
                              Run automation workflows for synced appointments
                            </p>
                          </div>
                          <Switch 
                            checked={calendar.triggerWorkflows || false}
                            onCheckedChange={(checked) => handleUpdateSyncSettings(calendar.id, { triggerWorkflows: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Block as Appointments</Label>
                            <p className="text-xs text-gray-500">
                              External events create full appointments (vs just blocking time)
                            </p>
                          </div>
                          <Switch 
                            checked={syncPreferences.blockAsAppointments || false}
                            onCheckedChange={(checked) => handleUpdateSyncSettings(calendar.id, { blockAsAppointments: checked })}
                          />
                        </div>
                      </div>
                      
                      {calendar.lastSync && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500">
                            Last synced: {new Date(calendar.lastSync).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              
              {/* Integration Info */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  How Google Calendar Integration Works
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Bookings made in AgencyBoost appear automatically in your Google Calendar</li>
                  <li>• Events in Google Calendar block availability to prevent double-bookings</li>
                  <li>• Each team member connects their own Google account</li>
                  <li>• Choose which calendars are used for booking and conflict checking</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar Creation Modal */}
      <CalendarCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCalendar={(calendarData) => createCalendarMutation.mutate(calendarData)}
        staff={staff}
      />
    </div>
  );
}