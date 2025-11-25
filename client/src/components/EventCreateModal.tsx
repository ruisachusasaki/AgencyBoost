import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: Date;
  initialTime?: string;
  currentUserId: string;
}

interface GoogleCalendarConnection {
  id: string;
  userId: string;
  email: string;
  syncEnabled: boolean;
  twoWaySyncEnabled: boolean;
}

export function EventCreateModal({
  isOpen,
  onClose,
  initialDate,
  initialTime,
  currentUserId,
}: EventCreateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(format(initialDate, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(initialTime || "09:00");
  const [duration, setDuration] = useState("30");
  const [addGoogleMeet, setAddGoogleMeet] = useState(false);

  const { data: googleCalendarStatus } = useQuery<{ connections: GoogleCalendarConnection[] }>({
    queryKey: ["/api/google-calendar/status"],
  });

  const hasGoogleCalendarSync = googleCalendarStatus?.connections?.some(
    (conn) => conn.userId === currentUserId && conn.syncEnabled && conn.twoWaySyncEnabled
  );

  const userConnection = googleCalendarStatus?.connections?.find(
    (conn) => conn.userId === currentUserId && conn.syncEnabled
  );

  useEffect(() => {
    if (isOpen) {
      setDate(format(initialDate, "yyyy-MM-dd"));
      setStartTime(initialTime || "09:00");
      setTitle("");
      setDescription("");
      setLocation("");
      setDuration("30");
      setAddGoogleMeet(false);
    }
  }, [isOpen, initialDate, initialTime]);

  const createEventMutation = useMutation({
    mutationFn: async (eventData: {
      title: string;
      description: string;
      location: string;
      startTime: string;
      endTime: string;
      addGoogleMeet: boolean;
      syncToGoogle: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/calendar/events", eventData);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Event created",
        description: data.syncedToGoogle 
          ? "Your event has been created and synced to Google Calendar."
          : "Your event has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/google-calendar/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-appointments-with-leads"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create event",
        description: error.message || "An error occurred while creating the event.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the event.",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = startTime.split(":").map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(duration));

    createEventMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      addGoogleMeet: addGoogleMeet && !!hasGoogleCalendarSync,
      syncToGoogle: !!userConnection,
    });
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const h = hour.toString().padStart(2, "0");
        const m = minute.toString().padStart(2, "0");
        const time24 = `${h}:${m}`;
        const time12 = new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        times.push({ value: time24, label: time12 });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Create New Event
          </SheetTitle>
          <SheetDescription>
            Create a new event on your calendar.
            {userConnection && (
              <span className="block mt-1 text-primary">
                This event will sync to Google Calendar ({userConnection.email})
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              data-testid="input-event-title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-event-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger data-testid="select-start-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duration
            </Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger data-testid="select-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location (optional)
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location or meeting room"
              data-testid="input-event-location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Description (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description or notes for this event"
              rows={3}
              data-testid="input-event-description"
            />
          </div>

          {userConnection && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  <Label htmlFor="addGoogleMeet" className="text-sm font-medium">
                    Add Google Meet
                  </Label>
                </div>
                <Switch
                  id="addGoogleMeet"
                  checked={addGoogleMeet}
                  onCheckedChange={setAddGoogleMeet}
                  disabled={!hasGoogleCalendarSync}
                  data-testid="switch-google-meet"
                />
              </div>
              {addGoogleMeet && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  A Google Meet video conference link will be automatically created and added to this event.
                </p>
              )}
              {!hasGoogleCalendarSync && userConnection && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Enable two-way sync in Google Calendar settings to add Google Meet links.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEventMutation.isPending}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-create-event"
            >
              {createEventMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
