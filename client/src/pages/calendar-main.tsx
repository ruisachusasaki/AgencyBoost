import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { AppointmentModal } from "@/components/AppointmentModal";
import { EventDetailModal } from "@/components/EventDetailModal";
import { EventCreateModal } from "@/components/EventCreateModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  List,
  Eye,
  Clock,
  User,
  Mail,
  MapPin,
  Filter,
  ChevronUp,
  Edit2,
  Trash2,
  ChevronDown
} from "lucide-react";

// Types
interface CalendarData {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  color: string;
  timezone: string;
  createdBy?: string;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Appointment {
  id: string;
  calendarId: string;
  clientId?: string;
  assignedTo: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  location?: string | null;
  locationDetails?: string | null;
  meetingLink?: string | null;
  timezone: string;
  bookerName?: string | null;
  bookerEmail: string;
  bookerPhone?: string | null;
  customFieldData?: any;
  externalEventId?: string | null;
  bookingSource: string;
  bookingIp?: string | null;
  bookingUserAgent?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for compatibility
  attendeeEmail?: string;
  attendeeName?: string;
  // Lead appointment fields
  type?: 'calendar' | 'lead';
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
}

// Calendar view types
type CalendarViewType = "day" | "week" | "month";

// Event layout interface for positioning overlapping events
interface EventLayout {
  apt: Appointment;
  segmentStart: Date;  // The segment's display start time (clamped to day)
  segmentEnd: Date;    // The segment's display end time (clamped to day)
  isStartSegment: boolean;  // Is this the first segment of a multi-day event?
  isEndSegment: boolean;    // Is this the last segment of a multi-day event?
  top: number;
  height: number;
  column: number;
  totalColumns: number;
}

// Event segment interface for splitting multi-day events
interface EventSegment {
  apt: Appointment;
  segmentStart: Date;
  segmentEnd: Date;
  isStartSegment: boolean;
  isEndSegment: boolean;
}

// User color palette for multi-user calendar view
// Each user gets a unique color for their checkbox and events
const USER_COLOR_PALETTE = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', dark: { bg: 'rgba(59, 130, 246, 0.2)', text: '#93c5fd' } }, // Light blue
  { bg: '#d1fae5', border: '#10b981', text: '#065f46', dark: { bg: 'rgba(16, 185, 129, 0.2)', text: '#6ee7b7' } }, // Green
  { bg: '#fce7f3', border: '#ec4899', text: '#9d174d', dark: { bg: 'rgba(236, 72, 153, 0.2)', text: '#f9a8d4' } }, // Pink
  { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', dark: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fcd34d' } }, // Amber
  { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3', dark: { bg: 'rgba(99, 102, 241, 0.2)', text: '#a5b4fc' } }, // Indigo
  { bg: '#ccfbf1', border: '#14b8a6', text: '#115e59', dark: { bg: 'rgba(20, 184, 166, 0.2)', text: '#5eead4' } }, // Teal
  { bg: '#fed7aa', border: '#f97316', text: '#9a3412', dark: { bg: 'rgba(249, 115, 22, 0.2)', text: '#fdba74' } }, // Orange
  { bg: '#ddd6fe', border: '#8b5cf6', text: '#5b21b6', dark: { bg: 'rgba(139, 92, 246, 0.2)', text: '#c4b5fd' } }, // Violet
  { bg: '#fecaca', border: '#ef4444', text: '#991b1b', dark: { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' } }, // Red
  { bg: '#cffafe', border: '#06b6d4', text: '#155e75', dark: { bg: 'rgba(6, 182, 212, 0.2)', text: '#67e8f9' } }, // Cyan
];

// Helper function to check if an event is an all-day event (24+ hours or spans full day)
function isAllDayEvent(apt: Appointment): boolean {
  const start = new Date(apt.startTime);
  const end = new Date(apt.endTime);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  
  // Consider it all-day if:
  // 1. Duration is 24 hours or more
  // 2. OR starts at midnight and ends at midnight (or near midnight)
  if (durationHours >= 23) return true;
  
  // Check if it's a midnight-to-midnight event
  const startsAtMidnight = start.getHours() === 0 && start.getMinutes() === 0;
  const endsAtMidnight = end.getHours() === 0 && end.getMinutes() === 0;
  const endsAtEndOfDay = end.getHours() === 23 && end.getMinutes() >= 59;
  
  return startsAtMidnight && (endsAtMidnight || endsAtEndOfDay);
}

// Helper function to split an event into day segments at midnight boundaries
function splitEventIntoSegments(apt: Appointment, dayDate: Date): EventSegment | null {
  if (isAllDayEvent(apt)) return null;
  
  const aptStart = new Date(apt.startTime);
  const aptEnd = new Date(apt.endTime);
  
  // Day boundaries
  const dayStart = new Date(dayDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayDate);
  dayEnd.setHours(23, 59, 59, 999);
  const nextDayStart = new Date(dayDate);
  nextDayStart.setDate(nextDayStart.getDate() + 1);
  nextDayStart.setHours(0, 0, 0, 0);
  
  // Check if event overlaps with this day
  if (aptEnd <= dayStart || aptStart >= nextDayStart) {
    return null; // Event doesn't touch this day
  }
  
  // Clamp segment times to day boundaries
  const segmentStart = aptStart < dayStart ? dayStart : aptStart;
  const segmentEnd = aptEnd > nextDayStart ? nextDayStart : aptEnd;
  
  // Determine if this is the start/end segment
  const isStartSegment = aptStart.toDateString() === dayDate.toDateString();
  const isEndSegment = aptEnd.toDateString() === dayDate.toDateString() || 
                       (aptEnd.getHours() === 0 && aptEnd.getMinutes() === 0 && 
                        new Date(aptEnd.getTime() - 1).toDateString() === dayDate.toDateString());
  
  return {
    apt,
    segmentStart,
    segmentEnd,
    isStartSegment,
    isEndSegment
  };
}

// Helper function to get all event segments for a specific day (including multi-day event portions)
function getEventSegmentsForDay(appointments: Appointment[], dayDate: Date): EventSegment[] {
  const segments: EventSegment[] = [];
  
  for (const apt of appointments) {
    const segment = splitEventIntoSegments(apt, dayDate);
    if (segment) {
      segments.push(segment);
    }
  }
  
  return segments;
}

// Helper function to get all-day events for a specific day
function getAllDayEventsForDay(appointments: Appointment[], dayDate: Date): Appointment[] {
  const dayStart = new Date(dayDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayDate);
  dayEnd.setHours(23, 59, 59, 999);
  
  return appointments.filter(apt => {
    if (!isAllDayEvent(apt)) return false;
    
    const aptStart = new Date(apt.startTime);
    const aptEnd = new Date(apt.endTime);
    
    // Check if the all-day event spans this day
    return aptStart <= dayEnd && aptEnd >= dayStart;
  });
}

// Helper function to filter out all-day events from regular events
function getTimedEvents(appointments: Appointment[]): Appointment[] {
  return appointments.filter(apt => !isAllDayEvent(apt));
}

// Helper function to compute event layouts with overlap detection and midnight splitting
function computeEventLayouts(appointments: Appointment[], dayDate: Date, pixelsPerHour: number): EventLayout[] {
  if (appointments.length === 0) return [];
  
  // Get all event segments for this day (handles multi-day events split at midnight)
  const segments = getEventSegmentsForDay(appointments, dayDate);
  
  if (segments.length === 0) return [];
  
  // Sort segments by start time
  const sortedSegments = segments.sort((a, b) => a.segmentStart.getTime() - b.segmentStart.getTime());
  
  // Day start at midnight
  const dayStart = new Date(dayDate);
  dayStart.setHours(0, 0, 0, 0);
  
  // Group overlapping segments into clusters
  type SegmentWithTimes = EventSegment & { start: Date; end: Date };
  const segmentsWithTimes: SegmentWithTimes[] = sortedSegments.map(seg => ({
    ...seg,
    start: seg.segmentStart,
    end: seg.segmentEnd
  }));
  
  const clusters: SegmentWithTimes[][] = [];
  let currentCluster: SegmentWithTimes[] = [];
  let clusterEnd = 0;
  
  for (const segment of segmentsWithTimes) {
    if (currentCluster.length === 0 || segment.start.getTime() < clusterEnd) {
      // Add to current cluster
      currentCluster.push(segment);
      clusterEnd = Math.max(clusterEnd, segment.end.getTime());
    } else {
      // Start new cluster
      if (currentCluster.length > 0) clusters.push(currentCluster);
      currentCluster = [segment];
      clusterEnd = segment.end.getTime();
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);
  
  // Assign columns within each cluster
  const layouts: EventLayout[] = [];
  
  for (const cluster of clusters) {
    // Assign columns using a greedy algorithm
    const columns: { end: number }[] = [];
    
    for (const segment of cluster) {
      // Find first available column
      let columnIndex = 0;
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].end <= segment.start.getTime()) {
          columnIndex = i;
          break;
        }
        columnIndex = i + 1;
      }
      
      // Assign or create column
      if (columnIndex >= columns.length) {
        columns.push({ end: segment.end.getTime() });
      } else {
        columns[columnIndex].end = segment.end.getTime();
      }
      
      // Calculate position based on segment times (clamped to day)
      const minutesFromDayStart = (segment.segmentStart.getTime() - dayStart.getTime()) / (1000 * 60);
      const durationMinutes = (segment.segmentEnd.getTime() - segment.segmentStart.getTime()) / (1000 * 60);
      
      layouts.push({
        apt: segment.apt,
        segmentStart: segment.segmentStart,
        segmentEnd: segment.segmentEnd,
        isStartSegment: segment.isStartSegment,
        isEndSegment: segment.isEndSegment,
        top: (minutesFromDayStart / 60) * pixelsPerHour,
        height: Math.max(20, (durationMinutes / 60) * pixelsPerHour), // Minimum 20px
        column: columnIndex,
        totalColumns: 0 // Will be set after cluster is processed
      });
    }
    
    // Set total columns for all segments in this cluster
    const totalCols = columns.length;
    for (let i = layouts.length - cluster.length; i < layouts.length; i++) {
      layouts[i].totalColumns = totalCols;
    }
  }
  
  return layouts;
}

export default function CalendarMain() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch current user to auto-select their calendar
  const { data: currentUser } = useQuery<{ id: string; firstName: string; lastName: string; email: string }>({
    queryKey: ['/api/auth/current-user'],
  });
  
  const [activeTab, setActiveTab] = useState("calendar-view");
  const [calendarView, setCalendarView] = useState<CalendarViewType>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [calendarSearch, setCalendarSearch] = useState("");
  const [sidebarTab, setSidebarTab] = useState("users");
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState<'all' | 'lead' | 'client'>('all');
  const [hasAutoSelectedUser, setHasAutoSelectedUser] = useState(false);
  
  // Appointments table state
  const [appointmentsTab, setAppointmentsTab] = useState<"upcoming" | "cancelled" | "all">("upcoming");
  
  // State for appointment modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  
  // State for event detail modal (view/edit own events)
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<Appointment | null>(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  // State for event create modal (quick create by clicking grid)
  const [showEventCreateModal, setShowEventCreateModal] = useState(false);
  const [createEventInitialDate, setCreateEventInitialDate] = useState<Date>(new Date());
  const [createEventInitialTime, setCreateEventInitialTime] = useState<string>("09:00");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [calendarFilter, setCalendarFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  
  // Live line (current time indicator) state
  const [currentTime, setCurrentTime] = useState(new Date());
  const weekScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledToCurrentTime = useRef(false);
  
  // Dark mode detection for event colors
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Update current time every minute for live line
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  // Detect dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Initial check
    checkDarkMode();
    
    // Watch for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);
  
  // Calculate live line position based on current time
  const getLiveLinePosition = useCallback((pixelsPerHour: number) => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (hours * pixelsPerHour) + (minutes / 60) * pixelsPerHour;
  }, [currentTime]);
  
  // Check if today is visible in current view
  const isTodayVisible = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (calendarView === "day") {
      const viewDate = new Date(currentDate);
      viewDate.setHours(0, 0, 0, 0);
      return viewDate.getTime() === today.getTime();
    } else if (calendarView === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return today >= startOfWeek && today <= endOfWeek;
    }
    return false;
  }, [currentDate, calendarView]);
  
  // Get the day index of today in the week view (0 = Sunday, 6 = Saturday)
  const getTodayDayIndex = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      if (day.toDateString() === today.toDateString()) {
        return i;
      }
    }
    return -1;
  }, [currentDate]);

  // Fetch data
  const { data: calendars = [], isLoading: calendarsLoading, error: calendarsError } = useQuery<CalendarData[]>({
    queryKey: ["/api/calendars"],
  });

  const { data: staff = [], error: staffError } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const { data: appointments = [], error: appointmentsError, refetch: refetchAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/calendar-appointments-with-leads", selectedUsers], // Include selectedUsers for refetching
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
    refetchIntervalInBackground: false, // Don't poll when tab is not visible
    queryFn: async () => {
      console.log("CalendarMain: Fetching appointments with lead appointments included");
      
      // Fetch regular appointments (including lead appointments)
      const appointmentsResponse = await fetch("/api/calendar-appointments?includeLeadAppointments=true", {
        credentials: 'include'  // Include cookies for authentication
      });
      const regularAppointments = await appointmentsResponse.json();
      
      // Fetch Google Calendar synced events
      let googleEvents = [];
      try {
        // Build URL with selected user IDs if any
        const googleUrl = selectedUsers.length > 0 
          ? `/api/google-calendar/events?userIds=${selectedUsers.join(',')}`
          : "/api/google-calendar/events";
          
        const googleResponse = await fetch(googleUrl, {
          credentials: 'include',  // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const googleData = await googleResponse.json();
        if (googleData.events && Array.isArray(googleData.events)) {
          // Transform Google events to match appointment structure
          googleEvents = googleData.events.map(event => ({
            ...event,
            // Map Google event fields to appointment fields
            assignedTo: event.assignedTo || event.userId || '', // Use the assignedTo field from the API
            bookerName: event.bookerName || event.organizerName || '',
            bookerEmail: event.bookerEmail || event.organizerEmail || '',
            bookerPhone: event.bookerPhone || null,
            clientId: event.clientId || null,
            status: event.status || 'confirmed',
            timezone: event.timezone || 'UTC',
            customFieldData: event.customFieldData || null,
            externalEventId: event.externalEventId || event.googleEventId,
            bookingSource: event.bookingSource || 'google-calendar',
            cancelledAt: event.cancelledAt || null,
            cancelledBy: event.cancelledBy || null,
            cancellationReason: event.cancellationReason || null,
            type: 'google'
          }));
        }
      } catch (error) {
        console.log("CalendarMain: Could not fetch Google Calendar events:", error);
      }
      
      // Combine all appointments
      const allAppointments = [...regularAppointments, ...googleEvents];
      
      console.log("CalendarMain: Fetched appointments count:", regularAppointments.length);
      console.log("CalendarMain: Fetched Google events count:", googleEvents.length);
      console.log("CalendarMain: Total combined count:", allAppointments.length);
      
      return allAppointments;
    },
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch clients for linking invitees to their profiles  
  const { data: clientsResponse, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
  });
  
  // Extract clients array from response
  const clients = (clientsResponse as any)?.clients || [];

  // Auto-sync Google Calendar on page load (triggers background sync if data is stale)
  useEffect(() => {
    const triggerAutoSync = async () => {
      try {
        const response = await fetch('/api/google-calendar/auto-sync', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        console.log('[Calendar] Auto-sync result:', data);
        
        // If sync was triggered, refetch appointments after a short delay
        if (data.synced) {
          setTimeout(() => {
            refetchAppointments();
          }, 3000); // Wait 3 seconds for sync to complete
        }
      } catch (error) {
        console.log('[Calendar] Auto-sync failed:', error);
      }
    };
    
    triggerAutoSync();
  }, [refetchAppointments]); // Include refetchAppointments in deps

  // Auto-select current user's calendar by default when page loads
  useEffect(() => {
    if (currentUser?.id && !hasAutoSelectedUser) {
      console.log("CalendarMain: Auto-selecting current user:", currentUser.id);
      setSelectedUsers([currentUser.id]);
      setHasAutoSelectedUser(true);
    }
  }, [currentUser?.id, hasAutoSelectedUser]);
  
  // Auto-scroll to current time when the calendar view loads
  useEffect(() => {
    if (hasScrolledToCurrentTime.current) return;
    
    const scrollToCurrentTime = () => {
      const containerHeight = 560; // maxHeight of the scroll container
      const pixelsPerHour = calendarView === "day" ? 80 : 60;
      const liveLinePosition = getLiveLinePosition(pixelsPerHour);
      
      // Scroll so that current time is visible (positioned about 1/3 from top)
      const scrollPosition = Math.max(0, liveLinePosition - containerHeight / 3);
      
      if (calendarView === "week" && weekScrollRef.current) {
        weekScrollRef.current.scrollTop = scrollPosition;
        hasScrolledToCurrentTime.current = true;
      } else if (calendarView === "day" && dayScrollRef.current) {
        dayScrollRef.current.scrollTop = scrollPosition;
        hasScrolledToCurrentTime.current = true;
      }
    };
    
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(scrollToCurrentTime, 100);
    return () => clearTimeout(timeoutId);
  }, [calendarView, getLiveLinePosition]);

  // Filter staff based on search and sort (selected users first, then alphabetically)
  const filteredStaff = useMemo(() => {
    return staff
      .filter(member => 
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
        member.email.toLowerCase().includes(userSearch.toLowerCase())
      )
      .sort((a, b) => {
        const aSelected = selectedUsers.includes(a.id);
        const bSelected = selectedUsers.includes(b.id);
        
        // Selected users come first
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        
        // Within same group, sort alphabetically by name
        const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
        const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
        return aName.localeCompare(bName);
      });
  }, [staff, userSearch, selectedUsers]);

  // Filter calendars based on search
  const filteredCalendars = useMemo(() => {
    return calendars.filter(calendar => 
      calendar.name.toLowerCase().includes(calendarSearch.toLowerCase())
    );
  }, [calendars, calendarSearch]);

  // Navigation functions
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    switch (calendarView) {
      case "day":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "month":
        newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format date display based on view
  const getDateDisplayText = () => {
    const options: Intl.DateTimeFormatOptions = {};
    switch (calendarView) {
      case "day":
        options.weekday = "long";
        options.year = "numeric";
        options.month = "long";
        options.day = "numeric";
        break;
      case "week":
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case "month":
        options.year = "numeric";
        options.month = "long";
        break;
    }
    return currentDate.toLocaleDateString('en-US', options);
  };

  // Generate calendar days for month view
  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Fetch user permissions to check admin status
  const { data: userPermissions } = useQuery<any>({
    queryKey: ["/api/user-permissions"],
  });

  // Check if user has admin role or settings access
  const isAdmin = userPermissions?.settings?.canAccess || false;

  // Mutation for updating appointment status
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: string }) => {
      return await apiRequest('PUT', `/api/calendar-appointments/${appointmentId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments-with-leads'] });
      refetchAppointments();
      toast({
        title: "Appointment updated",
        variant: "default",
        description: "Status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating appointment",
        description: error.message || "Failed to update appointment status",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting appointment
  const deleteAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, appointmentType }: { appointmentId: string; appointmentType: 'calendar' | 'lead' }) => {
      // Route to correct endpoint based on appointment type
      const endpoint = appointmentType === 'lead' 
        ? `/api/lead-appointments/${appointmentId}`
        : `/api/calendar-appointments/${appointmentId}`;
      console.log('CalendarMain: Deleting appointment', { appointmentId, appointmentType, endpoint });
      const response = await fetch(endpoint, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Failed to delete appointment: ${response.statusText}`);
      return response.status === 204 ? null : await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments-with-leads'] });
      refetchAppointments();
      toast({
        title: "Appointment deleted",
        variant: "default",
        description: "Appointment has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting appointment",
        description: error.message || "Failed to delete appointment",
        variant: "destructive",
      });
    },
  });

  // Handler for status change
  const handleStatusChange = (appointmentId: string, newStatus: string) => {
    updateAppointmentMutation.mutate({ appointmentId, status: newStatus });
  };

  // Handler for appointment deletion
  const handleDeleteAppointment = (appointmentId: string, appointmentTitle: string, appointmentType: 'calendar' | 'lead' = 'calendar') => {
    console.log('CalendarMain: Delete button clicked', { appointmentId, appointmentTitle, appointmentType });
    if (window.confirm(`Are you sure you want to delete the appointment "${appointmentTitle}"?`)) {
      console.log('CalendarMain: Delete confirmed, sending mutation');
      deleteAppointmentMutation.mutate({ appointmentId, appointmentType });
    }
  };

  // Handle edit appointment
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowEditModal(true);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingAppointment(null);
  };

  // Find client by email
  const findClientByEmail = (email: string) => {
    if (!clients || !Array.isArray(clients)) return null;
    return clients.find((client: any) => client.email === email);
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCalendarToggle = (calendarId: string) => {
    setSelectedCalendars(prev => 
      prev.includes(calendarId) 
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  // Handler for clicking on an event to view details (only for own events)
  const handleEventClick = (event: Appointment, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tooltip from interfering
    
    // Check if this is the current user's event
    const eventUserId = event.assignedTo || (event as any).userId;
    const isOwnEvent = eventUserId === currentUser?.id;
    
    if (isOwnEvent) {
      setSelectedEventForDetail(event);
      setShowEventDetailModal(true);
    }
    // For other users' events, do nothing (tooltip will still show on hover)
  };

  // Handler for clicking on empty calendar grid to create a new event
  const handleGridClick = (date: Date, hour?: number) => {
    const clickedDate = new Date(date);
    let timeString = "09:00";
    
    if (hour !== undefined) {
      clickedDate.setHours(hour, 0, 0, 0);
      timeString = `${hour.toString().padStart(2, "0")}:00`;
    }
    
    setCreateEventInitialDate(clickedDate);
    setCreateEventInitialTime(timeString);
    setShowEventCreateModal(true);
  
  };

  // Helper function to get user color for an event based on assignedTo
  // Returns appropriate colors based on current dark/light mode
  const getUserColorForEvent = (apt: Appointment) => {
    const userId = apt.assignedTo || (apt as any).userId;
    if (!userId) return null;
    
    const userIndex = selectedUsers.indexOf(userId);
    if (userIndex === -1) return null;
    
    const palette = USER_COLOR_PALETTE[userIndex % USER_COLOR_PALETTE.length];
    
    // Return dark mode colors if in dark mode
    if (isDarkMode && palette.dark) {
      return {
        bg: palette.dark.bg,
        text: palette.dark.text,
        border: palette.border // Keep border consistent
      };
    }
    
    return palette;
  };
  
  // Get default event colors based on dark mode
  const getDefaultEventColors = (type?: string) => {
    if (isDarkMode) {
      return type === 'google' 
        ? { bg: 'rgba(59, 130, 246, 0.25)', text: '#93c5fd', border: '#3b82f6' }
        : { bg: 'rgba(0, 201, 198, 0.2)', text: '#5eead4', border: 'hsl(179, 100%, 39%)' };
    }
    return type === 'google'
      ? { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }
      : { bg: 'hsl(179, 100%, 39%, 0.1)', text: 'hsl(179, 100%, 39%)', border: 'hsl(179, 100%, 39%, 0.3)' };
  };

  // Helper component for appointment tooltip content
  const AppointmentTooltip = ({ appointment }: { appointment: Appointment }) => {
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    
    return (
      <div className="space-y-2 p-1">
        <div className="font-semibold text-sm">{appointment.title}</div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3 w-3" />
          <span>
            {startTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })} - {endTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <User className="h-3 w-3" />
          <span>{appointment.bookerName || appointment.attendeeName || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Mail className="h-3 w-3" />
          <span>{appointment.bookerEmail || appointment.attendeeEmail || 'No email'}</span>
        </div>
        {appointment.description && (
          <div className="text-xs">
            <div className="font-medium">Description:</div>
            <div className="text-gray-600 dark:text-gray-400">{appointment.description}</div>
          </div>
        )}
        {appointment.location && (
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="h-3 w-3" />
            <span>{appointment.location}</span>
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-1">
          Status: <span className="capitalize">{appointment.status}</span>
        </div>
      </div>
    );
  };

  // Filter appointments by selected calendars and users for calendar view
  const calendarViewFilteredAppointments = useMemo(() => {
    let filtered = appointments;
    
    console.log("CalendarMain: Filtering appointments:", {
      totalAppointments: appointments.length,
      selectedUsers,
      sampleAssignedTo: appointments.slice(0, 3).map(a => ({ title: a.title, assignedTo: a.assignedTo, type: a.type }))
    });
    
    const systemCalendarIds = calendars
      .filter(c => c.type === 'system')
      .map(c => c.id);

    // Filter by selected calendars if any are selected
    if (selectedCalendars.length > 0) {
      filtered = filtered.filter(apt => selectedCalendars.includes(apt.calendarId));
    }
    
    // Filter by selected users if any are selected
    // For Google events, use assignedTo or userId field
    // System calendars (Birthdays, Anniversaries) bypass user filter — everyone sees them
    if (selectedUsers.length > 0) {
      filtered = filtered.filter(apt => {
        if (systemCalendarIds.includes(apt.calendarId)) return true;
        const userMatch = selectedUsers.includes(apt.assignedTo) || 
                         selectedUsers.includes((apt as any).userId);
        return userMatch;
      });
    }
    
    console.log("CalendarMain: After filtering:", { filteredCount: filtered.length });
    
    return filtered;
  }, [appointments, selectedCalendars, selectedUsers, calendars]);

  // Appointments filtering and sorting logic
  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = appointments;
    const now = new Date();

    // Filter by tab
    switch (appointmentsTab) {
      case "upcoming":
        filtered = filtered.filter(apt => new Date(apt.startTime) >= now && apt.status !== "cancelled");
        break;
      case "cancelled":
        filtered = filtered.filter(apt => apt.status === "cancelled");
        break;
      case "all":
        // Show all appointments
        break;
    }

    // Apply filters
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    if (calendarFilter !== "all") {
      filtered = filtered.filter(apt => apt.calendarId === calendarFilter);
    }
    if (userFilter !== "all") {
      // Find calendar owner from calendars data
      filtered = filtered.filter(apt => {
        try {
          const calendar = calendars.find(cal => cal.id === apt.calendarId);
          return calendar && calendar.createdBy === userFilter;
        } catch (error) {
          console.error('Error filtering by user:', error);
          return true; // Show appointment if filtering fails
        }
      });
    }
    if (clientFilter !== "all") {
      filtered = filtered.filter(apt => 
        (apt.bookerName || apt.attendeeName || '').toLowerCase().includes(clientFilter.toLowerCase()) ||
        (apt.bookerEmail || apt.attendeeEmail || '').toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortField) {
          case "title":
            aValue = a.title;
            bValue = b.title;
            break;
          case "attendee":
            aValue = a.bookerName || a.attendeeName || '';
            bValue = b.bookerName || b.attendeeName || '';
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          case "startTime":
            aValue = new Date(a.startTime);
            bValue = new Date(b.startTime);
            break;
          case "calendar":
            aValue = calendars.find(cal => cal.id === a.calendarId)?.name || "";
            bValue = calendars.find(cal => cal.id === b.calendarId)?.name || "";
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Filter by appointment type (Lead vs Client)
    if (appointmentTypeFilter !== 'all') {
      if (appointmentTypeFilter === 'lead') {
        filtered = filtered.filter(apt => apt.type === 'lead');
      } else if (appointmentTypeFilter === 'client') {
        filtered = filtered.filter(apt => apt.type === 'calendar');
      }
    }

    return filtered;
  }, [appointments, appointmentsTab, statusFilter, calendarFilter, userFilter, clientFilter, appointmentTypeFilter, sortField, sortDirection, calendars]);

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icons (matching app design pattern)
  const getSortIcons = (field: string) => (
    <div className="flex flex-col ml-2">
      <ChevronUp 
        className={`h-3 w-3 ${
          sortField === field && sortDirection === 'asc' 
            ? 'text-primary' 
            : 'text-muted-foreground/40'
        }`} 
      />
      <ChevronDown 
        className={`h-3 w-3 -mt-1 ${
          sortField === field && sortDirection === 'desc' 
            ? 'text-primary' 
            : 'text-muted-foreground/40'
        }`} 
      />
    </div>
  );

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "showed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "no show":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Add error handling after all hooks are defined
  if (calendarsError || staffError || appointmentsError) {
    return (
      <div className="flex-1 p-6">
        <div className="text-red-500">
          Error loading calendar data: {calendarsError?.message || staffError?.message || appointmentsError?.message}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendars
          </h1>
        </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "calendar-view", name: "Calendar View", icon: CalendarIcon },
            { id: "appointment-list", name: "Appointment List View", icon: List },
            ...(isAdmin ? [{ id: "calendar-settings", name: "Calendar Settings", icon: Settings }] : [])
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "calendar-settings") {
                    // Navigate to calendar settings page
                    window.location.href = "/calendar-settings";
                    return;
                  }
                  setActiveTab(tab.id);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "calendar-view" && (
        <div className="space-y-6">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate("prev")}
                  data-testid="button-prev-date"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate("next")}
                  data-testid="button-next-date"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  data-testid="button-today"
                >
                  Today
                </Button>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {getDateDisplayText()}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={calendarView === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setCalendarView("day")}
                data-testid="button-day-view"
              >
                Day
              </Button>
              <Button
                variant={calendarView === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setCalendarView("week")}
                data-testid="button-week-view"
              >
                Week
              </Button>
              <Button
                variant={calendarView === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setCalendarView("month")}
                data-testid="button-month-view"
              >
                Month
              </Button>
            </div>
          </div>

          {/* Calendar Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Calendar Pane */}
            <div className="lg:col-span-3">
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-0">
                  {/* Month View */}
                  {calendarView === "month" && (
                    <div className="p-4">
                      {/* Days of week header */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                          <div key={day} className="p-2 text-center font-medium text-gray-500 dark:text-gray-400 text-sm">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar days */}
                      <div className="grid grid-cols-7 gap-1">
                        {generateMonthDays().map((day, index) => {
                          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                          const isToday = day.toDateString() === new Date().toDateString();
                          const dayAppointments = calendarViewFilteredAppointments.filter(apt => 
                            new Date(apt.startTime).toDateString() === day.toDateString()
                          );
                          
                          return (
                            <div
                              key={index}
                              onClick={() => handleGridClick(day)}
                              className={`min-h-[100px] p-2 border border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                                !isCurrentMonth ? "bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500" : ""
                              } ${isToday ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600" : ""}`}
                            >
                              <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600 dark:text-blue-400" : ""}`}>
                                {day.getDate()}
                              </div>
                              <div className="space-y-1">
                                {dayAppointments.slice(0, 2).map((apt) => {
                                  const userColor = getUserColorForEvent(apt);
                                  return (
                                    <Tooltip key={apt.id}>
                                      <TooltipTrigger asChild>
                                        <div
                                          className="text-xs p-1 rounded truncate cursor-pointer"
                                          style={{
                                            backgroundColor: userColor?.bg || getDefaultEventColors(apt.type).bg,
                                            color: userColor?.text || getDefaultEventColors(apt.type).text
                                          }}
                                          onClick={(e) => handleEventClick(apt, e)}
                                          data-testid={`event-month-${apt.id}`}
                                        >
                                          {apt.title}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-80">
                                        <AppointmentTooltip appointment={apt} />
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                                {dayAppointments.length > 2 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-xs text-gray-500 cursor-pointer">
                                        +{dayAppointments.length - 2} more
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-80">
                                      <div className="space-y-2">
                                        {dayAppointments.slice(2).map((apt) => (
                                          <AppointmentTooltip key={apt.id} appointment={apt} />
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Week View */}
                  {calendarView === "week" && (
                    <div className="relative h-full flex flex-col">
                      {/* Week header with days - sticky */}
                      <div className="sticky top-0 z-20 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex">
                          <div className="w-12 flex-shrink-0 p-2 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950"></div>
                          <div className="flex-1 flex">
                          {(() => {
                            const startOfWeek = new Date(currentDate);
                            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                            return Array.from({ length: 7 }, (_, i) => {
                              const day = new Date(startOfWeek);
                              day.setDate(startOfWeek.getDate() + i);
                              const isToday = day.toDateString() === new Date().toDateString();
                              
                              return (
                                <div key={i} className={`flex-1 p-2 text-center bg-white dark:bg-gray-950 ${
                                  i < 6 ? "border-r border-gray-200 dark:border-gray-700" : ""
                                } ${isToday ? "bg-primary/10 dark:bg-primary/20 text-primary font-semibold" : ""}`}>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                  </div>
                                  <div className={`text-lg ${isToday ? "text-primary" : ""}`}>
                                    {day.getDate()}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                          </div>
                        </div>
                      </div>

                      {/* All-Day Events Section - frozen header */}
                      {(() => {
                        const startOfWeek = new Date(currentDate);
                        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                        
                        // Check if there are any all-day events this week
                        const hasAllDayEvents = Array.from({ length: 7 }).some((_, i) => {
                          const day = new Date(startOfWeek);
                          day.setDate(startOfWeek.getDate() + i);
                          return getAllDayEventsForDay(calendarViewFilteredAppointments, day).length > 0;
                        });
                        
                        if (!hasAllDayEvents) return null;
                        
                        return (
                          <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex">
                              <div className="w-12 flex-shrink-0 p-1 text-[10px] text-gray-500 dark:text-gray-400 text-right border-r border-gray-200 dark:border-gray-700 flex items-center justify-end pr-2">
                                All Day
                              </div>
                              <div className="flex-1 flex">
                              {Array.from({ length: 7 }, (_, dayIndex) => {
                                const day = new Date(startOfWeek);
                                day.setDate(startOfWeek.getDate() + dayIndex);
                                const allDayEvents = getAllDayEventsForDay(calendarViewFilteredAppointments, day);
                                
                                return (
                                  <div 
                                    key={dayIndex} 
                                    className={`flex-1 min-h-[28px] p-1 ${dayIndex < 6 ? "border-r border-gray-200 dark:border-gray-700" : ""}`}
                                  >
                                    <div className="space-y-1">
                                      {allDayEvents.slice(0, 2).map((apt) => {
                                        const userColor = getUserColorForEvent(apt);
                                        return (
                                          <Tooltip key={apt.id}>
                                            <TooltipTrigger asChild>
                                              <div 
                                                className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer"
                                                style={{
                                                  backgroundColor: userColor?.bg || getDefaultEventColors(apt.type).bg,
                                                  color: userColor?.text || getDefaultEventColors(apt.type).text
                                                }}
                                                onClick={(e) => handleEventClick(apt, e)}
                                                data-testid={`event-allday-week-${apt.id}`}
                                              >
                                                {apt.title}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" className="max-w-80">
                                              <AppointmentTooltip appointment={apt} />
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      })}
                                      {allDayEvents.length > 2 && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="text-[10px] text-gray-500 cursor-pointer px-1">
                                              +{allDayEvents.length - 2} more
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" className="max-w-80">
                                            <div className="space-y-2">
                                              {allDayEvents.slice(2).map((apt) => (
                                                <AppointmentTooltip key={apt.id} appointment={apt} />
                                              ))}
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Week time grid with events - scrollable */}
                      <div ref={weekScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden" style={{ maxHeight: '560px' }}>
                        <div className="flex relative">
                          {/* Time column */}
                          <div className="w-12 flex-shrink-0">
                            {Array.from({ length: 24 }, (_, hour) => {
                              const timeSlot = new Date().setHours(hour, 0, 0, 0);
                              const timeDisplay = new Date(timeSlot).toLocaleTimeString('en-US', { 
                                hour: 'numeric',
                                hour12: true 
                              });
                              return (
                                <div key={hour} className="h-[60px] px-1 py-2 text-xs text-gray-500 dark:text-gray-400 text-right border-r border-gray-200 dark:border-gray-600 border-b border-gray-100 dark:border-gray-700/50">
                                  {timeDisplay}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Day columns container - fills remaining space */}
                          <div className="flex-1 flex">
                          {/* Day columns with events */}
                          {(() => {
                            const startOfWeek = new Date(currentDate);
                            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                            const PIXELS_PER_HOUR = 60;
                            
                            return Array.from({ length: 7 }, (_, dayIndex) => {
                              const day = new Date(startOfWeek);
                              day.setDate(startOfWeek.getDate() + dayIndex);
                              
                              // Compute layouts for this day's timed events (excludes all-day events)
                              const dayLayouts = computeEventLayouts(calendarViewFilteredAppointments, day, PIXELS_PER_HOUR);
                              
                              return (
                                <div 
                                  key={dayIndex} 
                                  className={`relative flex-1 ${dayIndex < 6 ? "border-r border-gray-200 dark:border-gray-700" : ""}`}
                                  style={{ height: `${24 * PIXELS_PER_HOUR}px` }}
                                >
                                  {/* Hour grid lines */}
                                  {Array.from({ length: 24 }, (_, hour) => (
                                    <div 
                                      key={hour} 
                                      className="absolute left-0 right-0 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" onClick={() => handleGridClick(day, hour)}
                                      style={{ top: `${hour * PIXELS_PER_HOUR}px`, height: `${PIXELS_PER_HOUR}px` }}
                                    />
                                  ))}
                                  
                                  {/* Live Line - Current Time Indicator - only on today's column */}
                                  {day.toDateString() === new Date().toDateString() && isTodayVisible && (
                                    <div 
                                      className="absolute left-0 right-0 pointer-events-none z-30"
                                      style={{ top: `${getLiveLinePosition(PIXELS_PER_HOUR)}px` }}
                                    >
                                      <div className="h-0.5 bg-red-500 w-full" />
                                    </div>
                                  )}
                                  
                                  {/* Timed Events (non all-day) - with midnight splitting */}
                                  {dayLayouts.map((layout, layoutIndex) => {
                                    const { apt, segmentStart, segmentEnd, isStartSegment, isEndSegment, top, height, column, totalColumns } = layout;
                                    const widthPercent = totalColumns > 1 ? (100 / totalColumns) - 1 : 100;
                                    const leftPercent = column * (100 / totalColumns);
                                    
                                    // Unique key for segment (handles same event appearing on multiple days)
                                    const segmentKey = `${apt.id}-${day.toDateString()}-${layoutIndex}`;
                                    
                                    // Visual indicator for continuation segments
                                    const isContinuation = !isStartSegment;
                                    const continuesNextDay = !isEndSegment;
                                    
                                    // Get user-specific color for event
                                    const userColor = getUserColorForEvent(apt);
                                    
                                    return (
                                      <Tooltip key={segmentKey}>
                                        <TooltipTrigger asChild>
                                          <div 
                                            className={`absolute text-xs p-1 cursor-pointer border overflow-hidden ${isContinuation ? 'rounded-t-none border-t-0' : 'rounded-t'} ${continuesNextDay ? 'rounded-b-none border-b-0' : 'rounded-b'}`}
                                            style={{
                                              top: `${top}px`,
                                              height: `${height}px`,
                                              left: `${leftPercent + 1}%`,
                                              width: `${widthPercent - 1}%`,
                                              zIndex: 10 + column,
                                              backgroundColor: userColor?.bg || getDefaultEventColors(apt.type).bg,
                                              borderColor: userColor?.border || getDefaultEventColors(apt.type).border,
                                              color: userColor?.text || getDefaultEventColors(apt.type).text
                                            }}
                                            onClick={(e) => handleEventClick(apt, e)}
                                            data-testid={`event-week-${apt.id}`}
                                          >
                                            <div className="font-medium truncate text-[10px]">
                                              {isContinuation && '↓ '}{apt.title}
                                            </div>
                                            {height > 25 && (
                                              <div className="text-[9px] opacity-75 truncate">
                                                {segmentStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                {continuesNextDay && ' →'}
                                              </div>
                                            )}
                                            {height > 40 && (apt.bookerName || apt.attendeeName) && (
                                              <div className="text-[9px] opacity-75 truncate">{apt.bookerName || apt.attendeeName}</div>
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-80">
                                          <AppointmentTooltip appointment={apt} />
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                              );
                            });
                          })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Day View */}
                  {calendarView === "day" && (
                    <div className="relative h-full flex flex-col">
                      {/* Day header - sticky */}
                      <div className="sticky top-0 z-20 bg-white dark:bg-gray-950 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-center pt-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                          </div>
                          <div className="text-2xl font-semibold">
                            {currentDate.getDate()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* All-Day Events Section - frozen header */}
                      {(() => {
                        const allDayEvents = getAllDayEventsForDay(calendarViewFilteredAppointments, currentDate);
                        
                        if (allDayEvents.length === 0) return null;
                        
                        return (
                          <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                            <div className="flex items-start gap-3">
                              <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 flex-shrink-0">
                                All Day
                              </div>
                              <div className="flex-1 flex flex-wrap gap-2">
                                {allDayEvents.slice(0, 3).map((apt) => {
                                  const userColor = getUserColorForEvent(apt);
                                  return (
                                    <Tooltip key={apt.id}>
                                      <TooltipTrigger asChild>
                                        <div 
                                          className="text-xs px-2 py-1 rounded cursor-pointer"
                                          style={{
                                            backgroundColor: userColor?.bg || getDefaultEventColors(apt.type).bg,
                                            color: userColor?.text || getDefaultEventColors(apt.type).text
                                          }}
                                          onClick={(e) => handleEventClick(apt, e)}
                                          data-testid={`event-allday-day-${apt.id}`}
                                        >
                                          {apt.title}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="max-w-80">
                                        <AppointmentTooltip appointment={apt} />
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                                {allDayEvents.length > 3 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-xs text-gray-500 cursor-pointer px-2 py-1">
                                        +{allDayEvents.length - 3} more
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-80">
                                      <div className="space-y-2">
                                        {allDayEvents.slice(3).map((apt) => (
                                          <AppointmentTooltip key={apt.id} appointment={apt} />
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Day time grid with events - scrollable */}
                      <div ref={dayScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden" style={{ maxHeight: '560px' }}>
                        {(() => {
                          const PIXELS_PER_HOUR = 80;
                          const dayLayouts = computeEventLayouts(calendarViewFilteredAppointments, currentDate, PIXELS_PER_HOUR);
                          
                          return (
                            <div className="flex relative">
                              {/* Live Line - Current Time Indicator for Day View */}
                              {isTodayVisible && (() => {
                                const liveLineTop = getLiveLinePosition(PIXELS_PER_HOUR);
                                
                                return (
                                  <div 
                                    className="absolute pointer-events-none z-30"
                                    style={{ 
                                      top: `${liveLineTop}px`,
                                      left: '80px', // After time column (w-20 = 80px)
                                      right: 0
                                    }}
                                  >
                                    {/* Full-width red line */}
                                    <div className="h-0.5 bg-red-500 w-full" />
                                  </div>
                                );
                              })()}
                              
                              {/* Time column */}
                              <div className="w-20 flex-shrink-0">
                                {Array.from({ length: 24 }, (_, hour) => {
                                  const timeSlot = new Date().setHours(hour, 0, 0, 0);
                                  const timeDisplay = new Date(timeSlot).toLocaleTimeString('en-US', { 
                                    hour: 'numeric',
                                    hour12: true 
                                  });
                                  return (
                                    <div key={hour} className="h-[80px] p-3 text-sm text-gray-500 dark:text-gray-400 text-right border-r border-gray-100 dark:border-gray-600 border-b border-gray-100 dark:border-gray-700/50">
                                      {timeDisplay}
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {/* Events column */}
                              <div 
                                className="flex-1 relative"
                                style={{ height: `${24 * PIXELS_PER_HOUR}px` }}
                              >
                                {/* Hour grid lines */}
                                {Array.from({ length: 24 }, (_, hour) => (
                                  <div 
                                    key={hour} 
                                    className="absolute left-0 right-0 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" onClick={() => handleGridClick(currentDate, hour)}
                                    style={{ top: `${hour * PIXELS_PER_HOUR}px`, height: `${PIXELS_PER_HOUR}px` }}
                                  />
                                ))}
                                
                                {/* Timed Events (non all-day) - with midnight splitting */}
                                {dayLayouts.map((layout, layoutIndex) => {
                                  const { apt, segmentStart, segmentEnd, isStartSegment, isEndSegment, top, height, column, totalColumns } = layout;
                                  const widthPercent = totalColumns > 1 ? (100 / totalColumns) - 2 : 96;
                                  const leftPercent = totalColumns > 1 ? column * (100 / totalColumns) + 2 : 2;
                                  
                                  // Unique key for segment
                                  const segmentKey = `${apt.id}-${currentDate.toDateString()}-${layoutIndex}`;
                                  
                                  // Visual indicator for continuation segments
                                  const isContinuation = !isStartSegment;
                                  const continuesNextDay = !isEndSegment;
                                  
                                  // Get user-specific color for event
                                  const userColor = getUserColorForEvent(apt);
                                  
                                  return (
                                    <Tooltip key={segmentKey}>
                                      <TooltipTrigger asChild>
                                        <div 
                                          className={`absolute p-2 border-l-4 cursor-pointer overflow-hidden ${isContinuation ? 'rounded-t-none' : 'rounded-t-lg'} ${continuesNextDay ? 'rounded-b-none' : 'rounded-b-lg'}`}
                                          style={{
                                            top: `${top}px`,
                                            height: `${height}px`,
                                            left: `${leftPercent}%`,
                                            width: `${widthPercent}%`,
                                            zIndex: 10 + column,
                                            backgroundColor: userColor?.bg || getDefaultEventColors(apt.type).bg,
                                            borderLeftColor: userColor?.border || getDefaultEventColors(apt.type).border,
                                            color: userColor?.text || getDefaultEventColors(apt.type).text
                                          }}
                                          onClick={(e) => handleEventClick(apt, e)}
                                          data-testid={`event-day-${apt.id}`}
                                        >
                                          <div className="flex justify-between items-start h-full">
                                            <div className="flex-1 min-w-0">
                                              <div className="font-semibold text-sm truncate">
                                                {isContinuation && '↓ '}{apt.title}
                                              </div>
                                              {height > 35 && (
                                                <>
                                                  <div className="text-xs opacity-75">
                                                    {segmentStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {segmentEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                    {continuesNextDay && ' →'}
                                                  </div>
                                                  {(apt.bookerName || apt.attendeeName) && (
                                                    <div className="text-xs opacity-75 truncate">
                                                      {apt.bookerName || apt.attendeeName}
                                                    </div>
                                                  )}
                                                </>
                                              )}
                                              {height > 80 && apt.location && (
                                                <div className="text-xs opacity-75 truncate mt-1">
                                                  📍 {apt.location}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-80">
                                        <AppointmentTooltip appointment={apt} />
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Pane */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Mini Calendar */}
                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          newDate.setMonth(currentDate.getMonth() - 1);
                          setCurrentDate(newDate);
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <CardTitle className="text-sm font-semibold">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          newDate.setMonth(currentDate.getMonth() + 1);
                          setCurrentDate(newDate);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {/* Mini calendar grid */}
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                        <div key={`day-${index}`} className="p-1 text-center font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                      {generateMonthDays().map((day, index) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = day.toDateString() === new Date().toDateString();
                        
                        return (
                          <button
                            key={index}
                            className={`p-1 text-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                              !isCurrentMonth ? "text-gray-300 dark:text-gray-600" : ""
                            } ${isToday ? "bg-primary text-primary-foreground" : ""}`}
                            onClick={() => setCurrentDate(day)}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Filters */}
                <Card className="border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    {/* Tab Buttons */}
                    <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
                      <button
                        onClick={() => setSidebarTab("users")}
                        className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          sidebarTab === "users"
                            ? "text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                        style={sidebarTab === "users" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                        data-testid="tab-users"
                      >
                        Users
                      </button>
                      <button
                        onClick={() => setSidebarTab("calendars")}
                        className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          sidebarTab === "calendars"
                            ? "text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                        style={sidebarTab === "calendars" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
                        data-testid="tab-calendars"
                      >
                        Calendars
                      </button>
                    </div>
                    
                    {/* Users Tab Content */}
                    {sidebarTab === "users" && (
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search users..."
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              className="pl-9"
                              data-testid="input-user-search"
                            />
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {filteredStaff.map((member) => {
                              const isChecked = selectedUsers.includes(member.id);
                              const userColorIndex = selectedUsers.indexOf(member.id);
                              const userColor = userColorIndex >= 0 ? USER_COLOR_PALETTE[userColorIndex % USER_COLOR_PALETTE.length] : null;
                              
                              return (
                                <div key={member.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`user-${member.id}`}
                                    checked={isChecked}
                                    onCheckedChange={() => handleUserToggle(member.id)}
                                    className="rounded-none"
                                    checkedColor={userColor?.border}
                                    data-testid={`checkbox-user-${member.id}`}
                                  />
                                  {isChecked && userColor && (
                                    <div 
                                      className="w-3 h-3 rounded-sm flex-shrink-0" 
                                      style={{ backgroundColor: userColor.bg, border: `1px solid ${userColor.border}` }}
                                    />
                                  )}
                                  <Label htmlFor={`user-${member.id}`} className="flex-1 text-sm cursor-pointer">
                                    {member.firstName} {member.lastName}
                                    <div className="text-xs text-gray-500">{member.email}</div>
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                    )}
                    
                    {/* Calendars Tab Content */}
                    {sidebarTab === "calendars" && (
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search calendars..."
                              value={calendarSearch}
                              onChange={(e) => setCalendarSearch(e.target.value)}
                              className="pl-9"
                              data-testid="input-calendar-search"
                            />
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {filteredCalendars.map((calendar) => (
                              <div key={calendar.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`calendar-${calendar.id}`}
                                  checked={selectedCalendars.includes(calendar.id)}
                                  onCheckedChange={() => handleCalendarToggle(calendar.id)}
                                  className="rounded-none"
                                  data-testid={`checkbox-calendar-${calendar.id}`}
                                />
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: calendar.color }}
                                ></div>
                                <Label htmlFor={`calendar-${calendar.id}`} className="flex-1 text-sm cursor-pointer">
                                  {calendar.name}
                                  <div className="text-xs text-gray-500">
                                    {calendar.type === "round_robin" ? "Round Robin" : "Personal"}
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "appointment-list" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Appointments</CardTitle>
              
              {/* Sub-tabs for appointments */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setAppointmentsTab("upcoming")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    appointmentsTab === "upcoming"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Upcoming ({appointments.filter(apt => 
                    new Date(apt.startTime) >= new Date() && apt.status !== "cancelled"
                  ).length})
                </button>
                <button
                  onClick={() => setAppointmentsTab("cancelled")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    appointmentsTab === "cancelled"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Cancelled ({appointments.filter(apt => apt.status === "cancelled").length})
                </button>
                <button
                  onClick={() => setAppointmentsTab("all")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    appointmentsTab === "all"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  All ({appointments.length})
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="showed">Showed</SelectItem>
                    <SelectItem value="no show">No Show</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={appointmentTypeFilter} onValueChange={(value) => setAppointmentTypeFilter(value as 'all' | 'lead' | 'client')}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={calendarFilter} onValueChange={setCalendarFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Calendars</SelectItem>
                    {calendars.map((calendar) => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        {calendar.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filter by client..."
                  value={clientFilter === "all" ? "" : clientFilter}
                  onChange={(e) => setClientFilter(e.target.value || "all")}
                  className="w-48"
                />

                {(statusFilter !== "all" || calendarFilter !== "all" || userFilter !== "all" || clientFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setCalendarFilter("all");
                      setUserFilter("all");
                      setClientFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none" 
                        onClick={() => handleSort("title")}
                      >
                        <div className="flex items-center justify-between">
                          Title
                          {getSortIcons("title")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none" 
                        onClick={() => handleSort("attendee")}
                      >
                        <div className="flex items-center justify-between">
                          Invitees
                          {getSortIcons("attendee")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none" 
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center justify-between">
                          Status
                          {getSortIcons("status")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none" 
                        onClick={() => handleSort("startTime")}
                      >
                        <div className="flex items-center justify-between">
                          Appointment Time
                          {getSortIcons("startTime")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none" 
                        onClick={() => handleSort("calendar")}
                      >
                        <div className="flex items-center justify-between">
                          Calendar
                          {getSortIcons("calendar")}
                        </div>
                      </TableHead>
                      <TableHead>Appointment Owner</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedAppointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No appointments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedAppointments.map((appointment) => {
                        const calendar = calendars.find(cal => cal.id === appointment.calendarId);
                        const owner = calendar?.createdBy ? staff.find(member => member.id === calendar.createdBy) : null;
                        const startTime = new Date(appointment.startTime);
                        const endTime = new Date(appointment.endTime);
                        
                        return (
                          <TableRow key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <TableCell className="font-medium">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="font-semibold">{appointment.title}</div>
                                  {appointment.type === 'lead' && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                                      Lead
                                    </Badge>
                                  )}
                                  {appointment.type === 'calendar' && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                      Client
                                    </Badge>
                                  )}
                                </div>
                                {appointment.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                    {appointment.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                {(() => {
                                  const email = appointment.bookerEmail || appointment.attendeeEmail || '';
                                  const client = findClientByEmail(email);
                                  
                                  if (client) {
                                    return (
                                      <Link href={`/clients/${client.id}`}>
                                        <div className="font-medium text-primary hover:underline cursor-pointer">
                                          {appointment.bookerName || appointment.attendeeName || 'Unknown'}
                                        </div>
                                      </Link>
                                    );
                                  } else if (appointment.type === 'lead' && appointment.leadId) {
                                    return (
                                      <div className="font-medium text-purple-600 dark:text-purple-400">
                                        {appointment.leadName || appointment.bookerName || appointment.attendeeName || 'Unknown'}
                                        <span className="ml-2 text-xs text-gray-500">(Lead)</span>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="font-medium">
                                        {appointment.bookerName || appointment.attendeeName || 'Unknown'}
                                      </div>
                                    );
                                  }
                                })()}
                                <div className="text-sm text-gray-500 dark:text-gray-400">{appointment.bookerEmail || appointment.attendeeEmail || 'No email'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={appointment.status}
                                onValueChange={(newStatus) => handleStatusChange(appointment.id, newStatus)}
                                disabled={updateAppointmentMutation.isPending}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue>
                                    <Badge className={`${getStatusBadgeColor(appointment.status)} border-0 capitalize text-xs`}>
                                      {appointment.status}
                                    </Badge>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="confirmed">
                                    <Badge className="bg-blue-100 text-blue-800 border-0 capitalize text-xs">
                                      Confirmed
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="showed">
                                    <Badge className="bg-green-100 text-green-800 border-0 capitalize text-xs">
                                      Showed
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="no_show">
                                    <Badge className="bg-yellow-100 text-yellow-800 border-0 capitalize text-xs">
                                      No Show
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    <Badge className="bg-red-100 text-red-800 border-0 capitalize text-xs">
                                      Cancelled
                                    </Badge>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {startTime.toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {startTime.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })} - {endTime.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {appointment.type === 'google' ? (
                                  <>
                                    <div 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: '#4285f4' }}
                                    ></div>
                                    <span>Google Calendar</span>
                                  </>
                                ) : (
                                  <>
                                    <div 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: calendar?.color || '#6366f1' }}
                                    ></div>
                                    <span>{calendar?.name || "Unknown Calendar"}</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                // For Google events, find owner from assignedTo field
                                const eventOwner = appointment.type === 'google' && appointment.assignedTo
                                  ? staff.find(member => member.id === appointment.assignedTo)
                                  : owner;
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                      {eventOwner ? `${eventOwner.firstName.charAt(0)}${eventOwner.lastName.charAt(0)}` : "?"}
                                    </div>
                                    <span>{eventOwner ? `${eventOwner.firstName} ${eventOwner.lastName}` : "Unknown User"}</span>
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditAppointment(appointment)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteAppointment(appointment.id, appointment.title, appointment.type || 'calendar')}
                                  disabled={deleteAppointmentMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {filteredAndSortedAppointments.length > 0 && (
                <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredAndSortedAppointments.length} appointment{filteredAndSortedAppointments.length !== 1 ? 's' : ''} 
                  {appointmentsTab !== "all" && ` in ${appointmentsTab}`}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>

      {/* Edit Appointment Modal */}
      <AppointmentModal
        open={showEditModal}
        onOpenChange={handleEditModalClose}
        appointmentId={editingAppointment?.id}
        existingAppointment={editingAppointment}
        clientId={editingAppointment?.clientId}
        clientName={editingAppointment?.bookerName || editingAppointment?.attendeeName}
        clientEmail={editingAppointment?.bookerEmail || editingAppointment?.attendeeEmail}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/calendar-appointments-with-leads'] });
          refetchAppointments();
        }}
      />

      {/* Event Detail Modal - for viewing/editing own events */}
      <EventDetailModal
        event={selectedEventForDetail}
        isOpen={showEventDetailModal}
        onClose={() => {
          setShowEventDetailModal(false);
          setSelectedEventForDetail(null);
        }}
        currentUserId={currentUser?.id || ''}
        staffMembers={staff}
      />

      {/* Event Create Modal - quick create by clicking calendar grid */}
      <EventCreateModal
        isOpen={showEventCreateModal}
        onClose={() => setShowEventCreateModal(false)}
        initialDate={createEventInitialDate}
        initialTime={createEventInitialTime}
        currentUserId={currentUser?.id || ''}
      />
    </TooltipProvider>
  );
}