import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  TrendingUp,
  AlertCircle,
  Trash2,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  ChevronsUpDown,
  Search,
  Presentation,
  Lightbulb,
  Target,
  ListTodo,
  ChartBar,
  StickyNote,
  Tag,
  Building2,
  Lock,
  Briefcase,
  ExternalLink,
  User,
  UserPlus,
  Repeat,
  Play,
  Square,
  Timer,
  RotateCcw,
  ArrowRightToLine,
  LayoutList,
  CalendarDays
} from "lucide-react";

interface Staff {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImagePath?: string;
  position?: string;
  department?: string;
}

interface Client {
  id: string;
  name: string;
}

interface PxMeeting {
  id: string;
  title: string;
  meetingDate: string;
  meetingTime: string;
  meetingDuration: number;
  recordingLink?: string;
  clientId?: string;
  tags?: string[];
  whatsWorkingKpis?: string;
  salesOpportunities?: string;
  areasOfOpportunities?: string;
  actionPlan?: string;
  actionItems?: string;
  objectives?: string;
  notes?: string;
  isPrivate?: boolean;
  enabledElements?: string[];
  isRecurring?: boolean;
  recurringFrequency?: string;
  recurringEndType?: string;
  recurringEndDate?: string;
  recurringOccurrences?: number;
  recurringParentId?: string;
  meetingStartedAt?: string;
  meetingEndedAt?: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  attendees: Array<{ id: string; name: string }>;
}


interface PxMeetingsProps {
  meetingId?: string;
}

export default function PxMeetings({ meetingId }: PxMeetingsProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createDialogStep, setCreateDialogStep] = useState<1 | 2>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("__all__");
  const [clientFilter, setClientFilter] = useState<string>("__all__");
  const [timeFilter, setTimeFilter] = useState<string>("current");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [listPage, setListPage] = useState(1);
  const MEETINGS_PER_PAGE = 10;
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // Define available meeting elements
  const meetingElements = [
    { id: "objectives", label: "Objectives", icon: Target },
    { id: "whatsWorkingKpis", label: "What's Working / KPI's", icon: ChartBar },
    { id: "salesOpportunities", label: "Sales Opportunities", icon: TrendingUp },
    { id: "areasOfOpportunities", label: "Areas of Opportunities", icon: AlertCircle },
    { id: "actionPlan", label: "Action Plan", icon: Lightbulb },
    { id: "actionItems", label: "Action Items", icon: ListTodo },
  ];

  const [formData, setFormData] = useState({
    title: "",
    meetingDate: new Date(),
    meetingTime: "10:00",
    meetingDuration: 60,
    recordingLink: "",
    attendeeIds: [] as string[],
    facilitatorId: "",
    noteTakerId: "",
    enabledElements: ["objectives", "whatsWorkingKpis", "salesOpportunities", "areasOfOpportunities", "actionPlan", "actionItems"] as string[],
    isRecurring: false,
    recurringFrequency: "weekly" as string,
    recurringEndType: "never" as string,
    recurringEndDate: null as Date | null,
    recurringOccurrences: 10,
  });
  const [isRecurringEndDateOpen, setIsRecurringEndDateOpen] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    meetingDate: "",
    meetingTime: "",
    meetingDuration: 60,
    recordingLink: "",
    clientId: "" as string,
    tags: [] as string[],
    whatsWorkingKpis: "",
    actionPlan: "",
    notes: "",
    isPrivate: false,
    attendeeIds: [] as string[],
  });
  
  const [isEditAttendeesOpen, setIsEditAttendeesOpen] = useState(false);
  const editAttendeesDropdownRef = useRef<HTMLDivElement>(null);
  
  const [newTag, setNewTag] = useState("");
  
  interface CheckableItem {
    id: string;
    content: string;
    isCompleted: boolean;
    taskId?: string;
    notes?: string;
    createdById?: string;
    assignedToId?: string;
    createdAt?: string;
    pushedToNextMeeting?: boolean;
    pushedFromMeetingId?: string;
  }
  
  const [objectives, setObjectives] = useState<CheckableItem[]>([]);
  const [newObjective, setNewObjective] = useState("");
  const [salesOpportunities, setSalesOpportunities] = useState<CheckableItem[]>([]);
  const [areasOfOpportunities, setAreasOfOpportunities] = useState<CheckableItem[]>([]);
  const [actionItems, setActionItems] = useState<CheckableItem[]>([]);
  const [newSalesOpp, setNewSalesOpp] = useState("");
  const [newSalesOppNotes, setNewSalesOppNotes] = useState("");
  const [expandedSalesOppId, setExpandedSalesOppId] = useState<string | null>(null);
  const [newAreaOpp, setNewAreaOpp] = useState("");
  const [newAreaOppNotes, setNewAreaOppNotes] = useState("");
  const [expandedAreaOppId, setExpandedAreaOppId] = useState<string | null>(null);
  const [newActionItem, setNewActionItem] = useState("");
  
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isFacilitatorOpen, setIsFacilitatorOpen] = useState(false);
  const [isNoteTakerOpen, setIsNoteTakerOpen] = useState(false);
  const attendeesDropdownRef = useRef<HTMLDivElement>(null);
  const facilitatorDropdownRef = useRef<HTMLDivElement>(null);
  const noteTakerDropdownRef = useRef<HTMLDivElement>(null);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [facilitatorSearch, setFacilitatorSearch] = useState("");
  const [noteTakerSearch, setNoteTakerSearch] = useState("");
  const [editAttendeeSearch, setEditAttendeeSearch] = useState("");
  
  // Convert to Task dialog state
  const [showConvertToTaskDialog, setShowConvertToTaskDialog] = useState(false);
  const [actionItemToConvert, setActionItemToConvert] = useState<CheckableItem | null>(null);
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>("");

  const { data: meetings = [], isLoading } = useQuery<PxMeeting[]>({
    queryKey: ["/api/px-meetings"],
  });

  const { data: selectedMeeting, isLoading: isLoadingMeeting, isError: isMeetingError } = useQuery<PxMeeting>({
    queryKey: [`/api/px-meetings/${meetingId}`],
    enabled: !!meetingId,
    retry: 1,
    refetchInterval: 5000,
    staleTime: 0,
  });

  const { data: allStaff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });
  
  const { data: clientsData } = useQuery<Client[] | { clients: Client[] }>({
    queryKey: ["/api/clients"],
  });
  
  const { data: currentUser } = useQuery<{ id: string; staffId?: string }>({
    queryKey: ["/api/auth/me"],
  });
  
  const clients = Array.isArray(clientsData) ? clientsData : (clientsData?.clients || []);
  
  const allTags = [...new Set((meetings || []).flatMap(m => m.tags || []))];

  const parseJsonArray = (value: string | undefined): CheckableItem[] => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item: any, index: number) => {
        if (typeof item === 'string') {
          return { id: `item-${index}-${Date.now()}`, content: item, isCompleted: false };
        }
        return { 
          id: item.id || `item-${index}-${Date.now()}`, 
          content: item.content || '', 
          isCompleted: item.isCompleted || false,
          taskId: item.taskId,
          notes: item.notes,
          createdById: item.createdById,
          assignedToId: item.assignedToId,
          createdAt: item.createdAt,
          pushedToNextMeeting: item.pushedToNextMeeting,
          pushedFromMeetingId: item.pushedFromMeetingId,
        };
      });
    } catch {
      return value ? [{ id: `item-0-${Date.now()}`, content: value, isCompleted: false }] : [];
    }
  };

  const isElementEnabled = (elementId: string): boolean => {
    if (!selectedMeeting?.enabledElements || selectedMeeting.enabledElements.length === 0) {
      return true;
    }
    if (elementId === "objectives" && !selectedMeeting.enabledElements.includes("objectives")) {
      return true;
    }
    return selectedMeeting.enabledElements.includes(elementId);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (attendeesDropdownRef.current && !attendeesDropdownRef.current.contains(e.target as Node)) {
        setIsAttendeesOpen(false);
      }
      if (facilitatorDropdownRef.current && !facilitatorDropdownRef.current.contains(e.target as Node)) {
        setIsFacilitatorOpen(false);
      }
      if (noteTakerDropdownRef.current && !noteTakerDropdownRef.current.contains(e.target as Node)) {
        setIsNoteTakerOpen(false);
      }
      if (editAttendeesDropdownRef.current && !editAttendeesDropdownRef.current.contains(e.target as Node)) {
        setIsEditAttendeesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    hasInitializedRef.current = false;
  }, [meetingId]);

  useEffect(() => {
    if (selectedMeeting) {
      const meetingDateStr = typeof selectedMeeting.meetingDate === 'string' 
        ? selectedMeeting.meetingDate 
        : selectedMeeting.meetingDate?.toString?.() || '';
      
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        setEditFormData({
          meetingDate: meetingDateStr,
          meetingTime: selectedMeeting.meetingTime || "",
          meetingDuration: selectedMeeting.meetingDuration || 60,
          recordingLink: selectedMeeting.recordingLink || "",
          clientId: selectedMeeting.clientId || "",
          tags: selectedMeeting.tags || [],
          whatsWorkingKpis: selectedMeeting.whatsWorkingKpis || "",
          actionPlan: selectedMeeting.actionPlan || "",
          notes: selectedMeeting.notes || "",
          isPrivate: selectedMeeting.isPrivate || false,
          attendeeIds: selectedMeeting.attendees?.map(a => a.id) || [],
        });
        setObjectives(parseJsonArray(selectedMeeting.objectives));
        setSalesOpportunities(parseJsonArray(selectedMeeting.salesOpportunities));
        setAreasOfOpportunities(parseJsonArray(selectedMeeting.areasOfOpportunities));
        setActionItems(parseJsonArray(selectedMeeting.actionItems));
        setHasUnsavedChanges(false);
      } else {
        setEditFormData(prev => ({
          ...prev,
          meetingDate: meetingDateStr,
          meetingTime: selectedMeeting.meetingTime || "",
          meetingDuration: selectedMeeting.meetingDuration || 60,
          recordingLink: selectedMeeting.recordingLink || "",
          clientId: selectedMeeting.clientId || "",
          tags: selectedMeeting.tags || [],
          attendeeIds: selectedMeeting.attendees?.map(a => a.id) || [],
          isPrivate: selectedMeeting.isPrivate || false,
          ...(editingFieldsRef.current.has("whatsWorkingKpis") ? {} : { whatsWorkingKpis: selectedMeeting.whatsWorkingKpis || "" }),
          ...(editingFieldsRef.current.has("actionPlan") ? {} : { actionPlan: selectedMeeting.actionPlan || "" }),
          ...(editingFieldsRef.current.has("notes") ? {} : { notes: selectedMeeting.notes || "" }),
        }));
        if (!editingFieldsRef.current.has("objectives")) {
          setObjectives(parseJsonArray(selectedMeeting.objectives));
        }
        if (!editingFieldsRef.current.has("salesOpportunities")) {
          setSalesOpportunities(parseJsonArray(selectedMeeting.salesOpportunities));
        }
        if (!editingFieldsRef.current.has("areasOfOpportunities")) {
          setAreasOfOpportunities(parseJsonArray(selectedMeeting.areasOfOpportunities));
        }
        if (!editingFieldsRef.current.has("actionItems")) {
          setActionItems(parseJsonArray(selectedMeeting.actionItems));
        }
      }
    }
  }, [selectedMeeting]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/px-meetings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/px-meetings"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Meeting created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create meeting", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/px-meetings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/px-meetings"] });
      if (meetingId) {
        queryClient.invalidateQueries({ queryKey: [`/api/px-meetings/${meetingId}`] });
      }
      setHasUnsavedChanges(false);
      toast({ title: "Meeting saved successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to save meeting", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/px-meetings/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: [`/api/px-meetings/${deletedId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/px-meetings"] });
      if (meetingId) {
        setLocation("/hr/px-meetings");
      }
      toast({ title: "Meeting deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete meeting", description: error.message, variant: "destructive" });
    },
  });

  const startMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/px-meetings/${id}/start`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/px-meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/active-timer"] });
      if (meetingId) {
        queryClient.invalidateQueries({ queryKey: [`/api/px-meetings/${meetingId}`] });
      }
      toast({ title: "Meeting started", description: "Timer is now running for all attendees." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to start meeting", description: error.message, variant: "destructive" });
    },
  });

  const finishMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/px-meetings/${id}/finish`);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/px-meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/active-timer"] });
      if (meetingId) {
        queryClient.invalidateQueries({ queryKey: [`/api/px-meetings/${meetingId}`] });
      }
      const mins = Math.floor((data.durationSeconds || 0) / 60);
      const secs = (data.durationSeconds || 0) % 60;
      let desc = `Duration: ${mins}m ${secs}s. Time entries created for ${data.timeEntriesCreated} attendee(s).`;
      if (data.nextMeeting) {
        const nextDate = new Date(data.nextMeeting.meetingDate).toLocaleDateString();
        desc += ` Next meeting scheduled for ${nextDate}.`;
      }
      toast({
        title: "Meeting finished",
        description: desc,
      });
    },
    onError: (error: any) => {
      toast({ title: "Failed to finish meeting", description: error.message, variant: "destructive" });
    },
  });

  const resetTimerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/px-meetings/${id}/reset-timer`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/px-meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/active-timer"] });
      if (meetingId) {
        queryClient.invalidateQueries({ queryKey: [`/api/px-meetings/${meetingId}`] });
      }
      toast({ title: "Timer reset" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to reset timer", description: error.message, variant: "destructive" });
    },
  });

  const segmentSaveMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: string }) => {
      return await apiRequest("PATCH", `/api/px-meetings/${meetingId}/segments`, { field, value });
    },
    onError: (error: any) => {
      toast({ title: "Auto-save failed", description: error.message, variant: "destructive" });
    },
  });

  const editingFieldsRef = useRef<Set<string>>(new Set());
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastSavedRef = useRef<Map<string, string>>(new Map());

  const CHECKLIST_FIELDS = new Set(["salesOpportunities", "areasOfOpportunities", "actionItems", "objectives"]);

  const autoSaveSegment = useCallback((field: string, value: string) => {
    if (!meetingId) return;
    const existing = debounceTimersRef.current.get(field);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      if (lastSavedRef.current.get(field) !== value) {
        lastSavedRef.current.set(field, value);
        segmentSaveMutation.mutate({ field, value }, {
          onSuccess: () => {
            if (CHECKLIST_FIELDS.has(field)) {
              setTimeout(() => {
                editingFieldsRef.current.delete(field);
              }, 2000);
            }
          },
        });
      } else if (CHECKLIST_FIELDS.has(field)) {
        setTimeout(() => {
          editingFieldsRef.current.delete(field);
        }, 2000);
      }
      debounceTimersRef.current.delete(field);
    }, 1500);
    debounceTimersRef.current.set(field, timer);
  }, [meetingId]);

  const markFieldEditing = useCallback((field: string) => {
    editingFieldsRef.current.add(field);
  }, []);

  const markFieldDone = useCallback((field: string) => {
    setTimeout(() => {
      editingFieldsRef.current.delete(field);
    }, 2000);
  }, []);

  const { data: presenceData } = useQuery<{ activeUsers: Array<{ userId: string; name: string; avatar?: string }> }>({
    queryKey: [`/api/px-meetings/${meetingId}/presence`],
    enabled: !!meetingId,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!meetingId) return;
    const sendHeartbeat = () => {
      apiRequest("POST", `/api/px-meetings/${meetingId}/presence`, {}).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 15000);
    return () => {
      clearInterval(interval);
      apiRequest("DELETE", `/api/px-meetings/${meetingId}/presence`, {}).catch(() => {});
    };
  }, [meetingId]);

  const pushToNextMutation = useMutation({
    mutationFn: async ({ meetingId: mId, segment, itemId }: { meetingId: string; segment: string; itemId: string }) => {
      const res = await apiRequest("POST", `/api/px-meetings/${mId}/push-item`, { segment, itemId });
      return await res.json();
    },
    onSuccess: (data, variables) => {
      if (variables.segment === "salesOpportunities") {
        setSalesOpportunities(prev => {
          const newArr = prev.map(item =>
            item.id === variables.itemId ? { ...item, pushedToNextMeeting: true } : item
          );
          markFieldEditing("salesOpportunities");
          autoSaveSegment("salesOpportunities", JSON.stringify(newArr));
          return newArr;
        });
      } else {
        setAreasOfOpportunities(prev => {
          const newArr = prev.map(item =>
            item.id === variables.itemId ? { ...item, pushedToNextMeeting: true } : item
          );
          markFieldEditing("areasOfOpportunities");
          autoSaveSegment("areasOfOpportunities", JSON.stringify(newArr));
          return newArr;
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/px-meetings"] });
      if (meetingId) {
        queryClient.invalidateQueries({ queryKey: [`/api/px-meetings/${meetingId}`] });
      }
      toast({
        title: "Pushed to next meeting",
        description: `Item will appear in the ${format(parseISO(data.pushedToMeetingDate), "MMM d, yyyy")} meeting`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Failed to push item", description: error.message, variant: "destructive" });
    },
  });

  // Live elapsed time for in-progress meetings
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!selectedMeeting?.meetingStartedAt || selectedMeeting?.meetingEndedAt) {
      setElapsed(0);
      return;
    }
    const startTime = new Date(selectedMeeting.meetingStartedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [selectedMeeting?.meetingStartedAt, selectedMeeting?.meetingEndedAt]);

  const formatElapsed = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Filter to only active staff
  const activeStaff = allStaff.filter((s: any) => s.isActive !== false);

  // Convert action item to task mutation
  const convertToTaskMutation = useMutation({
    mutationFn: async ({ actionItemId, title, assignedTo }: { actionItemId: string; title: string; assignedTo: string }) => {
      // Create the task
      const taskResponse = await apiRequest("POST", "/api/tasks", {
        title,
        assignedTo,
        status: "todo",
        priority: "medium",
        description: `Converted from meeting action item`,
      });
      const task = await taskResponse.json();
      return task;
    },
    onSuccess: (task) => {
      setActionItems(prevItems => {
        const newArr = prevItems.map(item => 
          item.id === actionItemToConvert?.id 
            ? { ...item, taskId: task.id }
            : item
        );
        markFieldEditing("actionItems");
        autoSaveSegment("actionItems", JSON.stringify(newArr));
        return newArr;
      });
      setHasUnsavedChanges(true);
      
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task Created",
        description: "Action item has been converted to a task. Don't forget to save the meeting!",
      });
      setShowConvertToTaskDialog(false);
      setActionItemToConvert(null);
      setTaskAssigneeId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  // Handler to open convert to task dialog
  const handleOpenConvertToTask = (item: CheckableItem) => {
    setActionItemToConvert(item);
    setTaskAssigneeId("");
    setShowConvertToTaskDialog(true);
  };

  // Handler to submit convert to task
  const handleConvertToTask = () => {
    if (!actionItemToConvert || !taskAssigneeId) return;
    convertToTaskMutation.mutate({
      actionItemId: actionItemToConvert.id,
      title: actionItemToConvert.content,
      assignedTo: taskAssigneeId,
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      meetingDate: new Date(),
      meetingTime: "10:00",
      meetingDuration: 60,
      recordingLink: "",
      attendeeIds: [],
      facilitatorId: "",
      noteTakerId: "",
      enabledElements: ["objectives", "whatsWorkingKpis", "salesOpportunities", "areasOfOpportunities", "actionPlan", "actionItems"],
      isRecurring: false,
      recurringFrequency: "weekly",
      recurringEndType: "never",
      recurringEndDate: null,
      recurringOccurrences: 10,
    });
  };

  const handleNextStep = () => {
    if (!formData.title.trim()) {
      toast({ title: "Please enter a meeting title", variant: "destructive" });
      return;
    }
    setCreateDialogStep(2);
  };

  const handleCreate = () => {
    if (formData.isRecurring && formData.recurringEndType === "on_date" && !formData.recurringEndDate) {
      toast({ title: "Please select an end date for recurring meetings", variant: "destructive" });
      return;
    }
    if (formData.isRecurring && formData.recurringEndType === "after_occurrences" && (!formData.recurringOccurrences || formData.recurringOccurrences < 1)) {
      toast({ title: "Please enter a valid number of occurrences", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title: formData.title,
      meetingDate: format(formData.meetingDate, "yyyy-MM-dd"),
      meetingTime: formData.meetingTime,
      meetingDuration: formData.meetingDuration,
      recordingLink: formData.recordingLink || null,
      clientId: formData.clientId || null,
      attendeeIds: formData.attendeeIds,
      facilitatorId: formData.facilitatorId || null,
      noteTakerId: formData.noteTakerId || null,
      enabledElements: formData.enabledElements,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : null,
      recurringEndType: formData.isRecurring ? formData.recurringEndType : null,
      recurringEndDate: formData.isRecurring && formData.recurringEndType === "on_date" && formData.recurringEndDate 
        ? format(formData.recurringEndDate, "yyyy-MM-dd") 
        : null,
      recurringOccurrences: formData.isRecurring && formData.recurringEndType === "after_occurrences"
        ? formData.recurringOccurrences
        : null,
    });
  };

  const toggleMeetingElement = (elementId: string) => {
    setFormData(prev => ({
      ...prev,
      enabledElements: prev.enabledElements.includes(elementId)
        ? prev.enabledElements.filter(e => e !== elementId)
        : [...prev.enabledElements, elementId],
    }));
  };

  const handleCloseCreateDialog = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setCreateDialogStep(1);
      resetForm();
    }
  };

  const handleUpdate = () => {
    if (!selectedMeeting || !meetingId) return;
    
    const salesOppData = JSON.stringify(salesOpportunities);
    const areasOppData = JSON.stringify(areasOfOpportunities);
    console.log('[PX Debug] Saving salesOpportunities:', salesOppData);
    console.log('[PX Debug] Saving areasOfOpportunities:', areasOppData);
    
    updateMutation.mutate({
      id: meetingId,
      data: {
        meetingDate: editFormData.meetingDate,
        meetingTime: editFormData.meetingTime,
        meetingDuration: editFormData.meetingDuration,
        recordingLink: editFormData.recordingLink,
        clientId: editFormData.clientId || null,
        tags: editFormData.tags,
        whatsWorkingKpis: editFormData.whatsWorkingKpis,
        salesOpportunities: salesOppData,
        areasOfOpportunities: areasOppData,
        actionPlan: editFormData.actionPlan,
        actionItems: JSON.stringify(actionItems),
        objectives: JSON.stringify(objectives),
        notes: editFormData.notes,
        isPrivate: editFormData.isPrivate,
        attendeeIds: editFormData.attendeeIds,
      },
    });
  };

  const handleFormChange = (updates: Partial<typeof editFormData>) => {
    setEditFormData(prev => ({ ...prev, ...updates }));
    for (const [key, value] of Object.entries(updates)) {
      if (["whatsWorkingKpis", "actionPlan", "notes"].includes(key)) {
        markFieldEditing(key);
        autoSaveSegment(key, value as string);
      }
    }
    setHasUnsavedChanges(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editFormData.tags.includes(newTag.trim())) {
      handleFormChange({ tags: [...editFormData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleFormChange({ tags: editFormData.tags.filter(t => t !== tag) });
  };

  const handleAddSalesOpp = () => {
    if (newSalesOpp.trim()) {
      const newId = `sales-${Date.now()}`;
      const currentUserId = currentUser?.staffId || currentUser?.id;
      const newArr = [...salesOpportunities, { 
        id: newId, 
        content: newSalesOpp.trim(), 
        isCompleted: false,
        notes: newSalesOppNotes.trim() || undefined,
        createdById: currentUserId,
        createdAt: new Date().toISOString()
      }];
      setSalesOpportunities(newArr);
      markFieldEditing("salesOpportunities");
      autoSaveSegment("salesOpportunities", JSON.stringify(newArr));
      setHasUnsavedChanges(true);
      setNewSalesOpp("");
      setNewSalesOppNotes("");
    }
  };

  const handleRemoveSalesOpp = (id: string) => {
    const newArr = salesOpportunities.filter(item => item.id !== id);
    setSalesOpportunities(newArr);
    markFieldEditing("salesOpportunities");
    autoSaveSegment("salesOpportunities", JSON.stringify(newArr));
    if (expandedSalesOppId === id) {
      setExpandedSalesOppId(null);
    }
    setHasUnsavedChanges(true);
  };

  const handleToggleSalesOpp = (id: string) => {
    const newArr = salesOpportunities.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setSalesOpportunities(newArr);
    markFieldEditing("salesOpportunities");
    autoSaveSegment("salesOpportunities", JSON.stringify(newArr));
    setHasUnsavedChanges(true);
  };

  const handleUpdateSalesOppNotes = (id: string, notes: string) => {
    const newArr = salesOpportunities.map(item => 
      item.id === id ? { ...item, notes: notes || undefined } : item
    );
    setSalesOpportunities(newArr);
    markFieldEditing("salesOpportunities");
    autoSaveSegment("salesOpportunities", JSON.stringify(newArr));
    setHasUnsavedChanges(true);
  };

  const handleAddAreaOpp = () => {
    if (newAreaOpp.trim()) {
      const newId = `area-${Date.now()}`;
      const currentUserId = currentUser?.staffId || currentUser?.id;
      const newArr = [...areasOfOpportunities, { 
        id: newId, 
        content: newAreaOpp.trim(), 
        isCompleted: false,
        notes: newAreaOppNotes.trim() || undefined,
        createdById: currentUserId,
        createdAt: new Date().toISOString()
      }];
      setAreasOfOpportunities(newArr);
      markFieldEditing("areasOfOpportunities");
      autoSaveSegment("areasOfOpportunities", JSON.stringify(newArr));
      setHasUnsavedChanges(true);
      setNewAreaOpp("");
      setNewAreaOppNotes("");
    }
  };

  const handleRemoveAreaOpp = (id: string) => {
    const newArr = areasOfOpportunities.filter(item => item.id !== id);
    setAreasOfOpportunities(newArr);
    markFieldEditing("areasOfOpportunities");
    autoSaveSegment("areasOfOpportunities", JSON.stringify(newArr));
    if (expandedAreaOppId === id) {
      setExpandedAreaOppId(null);
    }
    setHasUnsavedChanges(true);
  };

  const handleToggleAreaOpp = (id: string) => {
    const newArr = areasOfOpportunities.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setAreasOfOpportunities(newArr);
    markFieldEditing("areasOfOpportunities");
    autoSaveSegment("areasOfOpportunities", JSON.stringify(newArr));
    setHasUnsavedChanges(true);
  };

  const handleUpdateAreaOppNotes = (id: string, notes: string) => {
    const newArr = areasOfOpportunities.map(item => 
      item.id === id ? { ...item, notes: notes || undefined } : item
    );
    setAreasOfOpportunities(newArr);
    markFieldEditing("areasOfOpportunities");
    autoSaveSegment("areasOfOpportunities", JSON.stringify(newArr));
    setHasUnsavedChanges(true);
  };

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      const currentUserId = currentUser?.staffId || currentUser?.id;
      const newArr = [...objectives, { 
        id: `obj-${Date.now()}`, 
        content: newObjective.trim(), 
        isCompleted: false,
        createdById: currentUserId,
        createdAt: new Date().toISOString()
      }];
      setObjectives(newArr);
      markFieldEditing("objectives");
      autoSaveSegment("objectives", JSON.stringify(newArr));
      setHasUnsavedChanges(true);
      setNewObjective("");
    }
  };

  const handleRemoveObjective = (id: string) => {
    const newArr = objectives.filter(item => item.id !== id);
    setObjectives(newArr);
    markFieldEditing("objectives");
    autoSaveSegment("objectives", JSON.stringify(newArr));
    setHasUnsavedChanges(true);
  };

  const handleToggleObjective = (id: string) => {
    const newArr = objectives.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setObjectives(newArr);
    markFieldEditing("objectives");
    autoSaveSegment("objectives", JSON.stringify(newArr));
    setHasUnsavedChanges(true);
  };

  const handleAddActionItem = () => {
    if (newActionItem.trim()) {
      const currentUserId = currentUser?.staffId || currentUser?.id;
      const newArr = [...actionItems, { 
        id: `action-${Date.now()}`, 
        content: newActionItem.trim(), 
        isCompleted: false,
        createdById: currentUserId,
        createdAt: new Date().toISOString()
      }];
      setActionItems(newArr);
      markFieldEditing("actionItems");
      autoSaveSegment("actionItems", JSON.stringify(newArr));
      setHasUnsavedChanges(true);
      setNewActionItem("");
    }
  };

  const handleRemoveActionItem = (id: string) => {
    const newArr = actionItems.filter(item => item.id !== id);
    setActionItems(newArr);
    markFieldEditing("actionItems");
    autoSaveSegment("actionItems", JSON.stringify(newArr));
    setHasUnsavedChanges(true);
  };

  const handleToggleActionItem = (id: string) => {
    const newArr = actionItems.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setActionItems(newArr);
    markFieldEditing("actionItems");
    autoSaveSegment("actionItems", JSON.stringify(newArr));
    setHasUnsavedChanges(true);
  };

  // Helper to get staff name by ID
  const getStaffName = (staffId: string | undefined): string => {
    if (!staffId) return "";
    const staffMember = allStaff.find(s => s.id === staffId);
    if (staffMember) {
      return staffMember.firstName && staffMember.lastName 
        ? `${staffMember.firstName} ${staffMember.lastName}`
        : staffMember.name || "Unknown";
    }
    return "";
  };

  // Update assignment for sales opportunity
  const handleUpdateSalesOppAssignment = (id: string, assignedToId: string | undefined) => {
    const newArr = salesOpportunities.map(item => 
      item.id === id ? { ...item, assignedToId } : item
    );
    setSalesOpportunities(newArr);
    markFieldEditing("salesOpportunities");
    autoSaveSegment("salesOpportunities", JSON.stringify(newArr));
    setHasUnsavedChanges(true);
  };

  // Update assignment for area of opportunity
  const handleUpdateAreaOppAssignment = (id: string, assignedToId: string | undefined) => {
    const newArr = areasOfOpportunities.map(item => 
      item.id === id ? { ...item, assignedToId } : item
    );
    setAreasOfOpportunities(newArr);
    markFieldEditing("areasOfOpportunities");
    autoSaveSegment("areasOfOpportunities", JSON.stringify(newArr));
    setHasUnsavedChanges(true);
  };

  // Update assignment for action item
  const handleUpdateActionItemAssignment = (id: string, assignedToId: string | undefined) => {
    const newArr = actionItems.map(item => 
      item.id === id ? { ...item, assignedToId } : item
    );
    setActionItems(newArr);
    markFieldEditing("actionItems");
    autoSaveSegment("actionItems", JSON.stringify(newArr));
    setHasUnsavedChanges(true);
  };

  const navigateToMeeting = (meeting: PxMeeting) => {
    setLocation(`/hr/px-meetings/${meeting.id}`);
  };

  const navigateToList = () => {
    setLocation("/hr/px-meetings");
  };

  const toggleAttendee = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(staffId)
        ? prev.attendeeIds.filter(id => id !== staffId)
        : [...prev.attendeeIds, staffId],
    }));
  };

  const toggleEditAttendee = (staffId: string) => {
    setEditFormData(prev => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(staffId)
        ? prev.attendeeIds.filter(id => id !== staffId)
        : [...prev.attendeeIds, staffId],
    }));
    setHasUnsavedChanges(true);
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.attendees.some(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = tagFilter === "__all__" || (meeting.tags && meeting.tags.includes(tagFilter));
    const matchesClient = clientFilter === "__all__" || meeting.clientId === clientFilter;
    
    const currentUserStaffId = currentUser?.staffId || currentUser?.id;
    const isAttendee = meeting.attendees.some(a => a.id === currentUserStaffId);
    const isCreator = meeting.createdById === currentUserStaffId;
    const canSeePrivate = !meeting.isPrivate || isAttendee || isCreator;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const meetingDate = meeting.meetingDate ? parseISO(meeting.meetingDate) : null;
    let matchesTime = true;
    if (timeFilter === "current" && meetingDate) {
      matchesTime = meetingDate >= today;
    } else if (timeFilter === "past" && meetingDate) {
      matchesTime = meetingDate < today;
    }

    const matchesOwner = ownerFilter === "all" || isAttendee || isCreator;
    
    return matchesSearch && matchesTag && matchesClient && canSeePrivate && matchesTime && matchesOwner;
  }).sort((a, b) => {
    const dateA = a.meetingDate ? parseISO(a.meetingDate).getTime() : 0;
    const dateB = b.meetingDate ? parseISO(b.meetingDate).getTime() : 0;
    return timeFilter === "past" ? dateB - dateA : dateA - dateB;
  });

  const totalListPages = Math.ceil(filteredMeetings.length / MEETINGS_PER_PAGE);
  const paginatedMeetings = filteredMeetings.slice((listPage - 1) * MEETINGS_PER_PAGE, listPage * MEETINGS_PER_PAGE);

  if (isLoading || (meetingId && isLoadingMeeting)) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (meetingId && !isLoadingMeeting && (isMeetingError || !selectedMeeting)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={navigateToList}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Meetings
          </Button>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Meeting not found</p>
              <p className="text-sm">This meeting may have been deleted or doesn't exist.</p>
              <Button onClick={navigateToList} className="mt-4">
                Return to Meetings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (meetingId && selectedMeeting) {
    const selectedClient = clients.find(c => c.id === editFormData.clientId);
    const meetingDateValue = editFormData.meetingDate ? parseISO(editFormData.meetingDate) : new Date();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={navigateToList}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Meetings
          </Button>
          <div className="flex items-center gap-2">
            {segmentSaveMutation.isPending && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Auto-saving...
              </span>
            )}
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="bg-primary hover:bg-primary/90">
              {updateMutation.isPending ? "Saving..." : "Save Meeting"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this meeting? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(selectedMeeting.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Presentation className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle>{selectedMeeting.title}</CardTitle>
                  {editFormData.isPrivate && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Private
                    </Badge>
                  )}
                  {presenceData?.activeUsers && presenceData.activeUsers.length > 0 && (
                    <div className="flex items-center gap-1 ml-3">
                      <Users className="h-4 w-4 text-slate-400" />
                      <div className="flex -space-x-2">
                        {presenceData.activeUsers.slice(0, 8).map((user) => (
                          <div
                            key={user.userId}
                            className="h-7 w-7 rounded-full bg-primary/20 border-2 border-white flex items-center justify-center text-xs font-medium text-primary"
                            title={user.name}
                          >
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 ml-1">
                        {presenceData.activeUsers.length} editing
                      </span>
                    </div>
                  )}
                </div>
                {selectedMeeting.attendees.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedMeeting.attendees.map(a => a.name).join(", ")}
                  </p>
                )}
                {(selectedMeeting.facilitatorId || selectedMeeting.noteTakerId) && (
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    {selectedMeeting.facilitatorId && (() => {
                      const facilitator = activeStaff.find(s => s.id === selectedMeeting.facilitatorId);
                      if (!facilitator) return null;
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Facilitator:</span>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={facilitator.profileImagePath || undefined} />
                              <AvatarFallback className="text-xs">
                                {facilitator.firstName?.[0]}{facilitator.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{facilitator.firstName} {facilitator.lastName}</span>
                          </div>
                        </div>
                      );
                    })()}
                    {selectedMeeting.noteTakerId && (() => {
                      const noteTaker = activeStaff.find(s => s.id === selectedMeeting.noteTakerId);
                      if (!noteTaker) return null;
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Note Taker:</span>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={noteTaker.profileImagePath || undefined} />
                              <AvatarFallback className="text-xs">
                                {noteTaker.firstName?.[0]}{noteTaker.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{noteTaker.firstName} {noteTaker.lastName}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  Unsaved changes
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Meeting Timer Controls */}
            {selectedMeeting && (
              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-muted-foreground" />
                  {selectedMeeting.meetingEndedAt ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                        Completed
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Duration: {formatElapsed(Math.floor((new Date(selectedMeeting.meetingEndedAt).getTime() - new Date(selectedMeeting.meetingStartedAt!).getTime()) / 1000))}
                      </span>
                    </div>
                  ) : selectedMeeting.meetingStartedAt ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30 animate-pulse">
                        In Progress
                      </Badge>
                      <span className="text-sm font-mono font-semibold tabular-nums">
                        {formatElapsed(elapsed)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Start the meeting to track time for all attendees
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!selectedMeeting.meetingStartedAt && !selectedMeeting.meetingEndedAt && (
                    <Button
                      onClick={() => startMeetingMutation.mutate(selectedMeeting.id)}
                      disabled={startMeetingMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {startMeetingMutation.isPending ? "Starting..." : "Start Meeting"}
                    </Button>
                  )}
                  {selectedMeeting.meetingStartedAt && !selectedMeeting.meetingEndedAt && (
                    <>
                      <Button
                        onClick={() => resetTimerMutation.mutate(selectedMeeting.id)}
                        disabled={resetTimerMutation.isPending}
                        variant="ghost"
                        size="sm"
                        title="Reset timer"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => finishMeetingMutation.mutate(selectedMeeting.id)}
                        disabled={finishMeetingMutation.isPending}
                        variant="destructive"
                        size="sm"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        {finishMeetingMutation.isPending ? "Finishing..." : "Finish Meeting"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Meeting Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editFormData.meetingDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editFormData.meetingDate ? format(meetingDateValue, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={meetingDateValue}
                      onSelect={(date) => {
                        if (date) {
                          handleFormChange({ meetingDate: format(date, "yyyy-MM-dd") });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="meeting-time">Time</Label>
                <Input
                  id="meeting-time"
                  type="time"
                  value={editFormData.meetingTime}
                  onChange={(e) => handleFormChange({ meetingTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="meeting-duration">Duration</Label>
                <Select
                  value={editFormData.meetingDuration.toString()}
                  onValueChange={(value) => handleFormChange({ meetingDuration: parseInt(value) })}
                >
                  <SelectTrigger id="meeting-duration">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="recording-link">Recording Link</Label>
                <Input
                  id="recording-link"
                  type="url"
                  placeholder="https://..."
                  value={editFormData.recordingLink}
                  onChange={(e) => handleFormChange({ recordingLink: e.target.value })}
                />
              </div>
            </div>

            {/* Attendees Section */}
            <div className="space-y-2">
              <Label>Attendees</Label>
              <div className="relative" ref={editAttendeesDropdownRef}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => { setIsEditAttendeesOpen(!isEditAttendeesOpen); setEditAttendeeSearch(""); }}
                >
                  {editFormData.attendeeIds.length === 0
                    ? "Add attendees..."
                    : `${editFormData.attendeeIds.length} attendee${editFormData.attendeeIds.length !== 1 ? 's' : ''}`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {isEditAttendeesOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-[9999] max-h-[200px] overflow-hidden flex flex-col">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search staff..."
                        value={editAttendeeSearch}
                        onChange={(e) => setEditAttendeeSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto max-h-[160px]">
                      {allStaff
                        .filter(m => {
                          const name = `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase();
                          return name.includes(editAttendeeSearch.toLowerCase());
                        })
                        .map((member) => {
                          const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
                          const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || '??';
                          return (
                            <div
                              key={member.id}
                              className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                              onClick={() => toggleEditAttendee(member.id)}
                            >
                              <Check className={cn("mr-2 h-4 w-4", editFormData.attendeeIds.includes(member.id) ? "opacity-100" : "opacity-0")} />
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={member.profileImagePath || undefined} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              {fullName}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
              
              {editFormData.attendeeIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editFormData.attendeeIds.map(id => {
                    const member = allStaff.find(s => s.id === id);
                    if (!member) return null;
                    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
                    return (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={member.profileImagePath || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {fullName}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => toggleEditAttendee(id)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="private-toggle" className="font-medium cursor-pointer">Private Meeting</Label>
                  <p className="text-sm text-muted-foreground">Only attendees can see this meeting</p>
                </div>
              </div>
              <Switch
                id="private-toggle"
                checked={editFormData.isPrivate}
                onCheckedChange={(checked) => handleFormChange({ isPrivate: checked })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <Label>Related Client</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedClient ? (selectedClient.company || selectedClient.name) : "Select client..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search clients..." />
                      <CommandList>
                        <CommandEmpty>No client found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => handleFormChange({ clientId: "" })}
                          >
                            <Check className={cn("mr-2 h-4 w-4", !editFormData.clientId ? "opacity-100" : "opacity-0")} />
                            None
                          </CommandItem>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.company || client.name}
                              onSelect={() => handleFormChange({ clientId: client.id })}
                            >
                              <Check className={cn("mr-2 h-4 w-4", editFormData.clientId === client.id ? "opacity-100" : "opacity-0")} />
                              {client.company || client.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleAddTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {editFormData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editFormData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {isElementEnabled("objectives") && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <Target className="h-4 w-4 text-indigo-500" />
                    Objectives
                  </Label>
                  <div className="space-y-2">
                    {objectives.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={() => handleToggleObjective(item.id)}
                            className="h-4 w-4 rounded-full cursor-pointer accent-primary"
                          />
                          <span className={`flex-1 ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                            {item.content}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveObjective(item.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add an objective..."
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddObjective();
                          }
                        }}
                      />
                      <Button size="sm" onClick={handleAddObjective}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {isElementEnabled("whatsWorkingKpis") && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <ChartBar className="h-4 w-4 text-green-500" />
                    What's Working / KPI's
                  </Label>
                  <Textarea
                    value={editFormData.whatsWorkingKpis}
                    onChange={(e) => handleFormChange({ whatsWorkingKpis: e.target.value })}
                    onFocus={() => markFieldEditing("whatsWorkingKpis")}
                    onBlur={() => markFieldDone("whatsWorkingKpis")}
                    placeholder="Enter what's working and KPI highlights..."
                    className="min-h-[100px]"
                  />
                </div>
                <Separator />
              </>
            )}

            {isElementEnabled("salesOpportunities") && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Sales Opportunities
                  </Label>
                  <div className="space-y-2">
                    {salesOpportunities.map((opp) => (
                      <div key={opp.id} className="bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 p-2">
                          <input
                            type="checkbox"
                            checked={opp.isCompleted}
                            onChange={() => handleToggleSalesOpp(opp.id)}
                            className="h-4 w-4 rounded-full cursor-pointer accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`block ${opp.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                              {opp.content}
                            </span>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {opp.pushedFromMeetingId && (
                                <span className="flex items-center gap-1 text-primary">
                                  <ArrowRightToLine className="h-3 w-3" />
                                  Carried over
                                </span>
                              )}
                              {opp.createdById && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Added by {getStaffName(opp.createdById)}
                                </span>
                              )}
                              {opp.assignedToId && (
                                <span className="flex items-center gap-1">
                                  <UserPlus className="h-3 w-3" />
                                  Assigned to {getStaffName(opp.assignedToId)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Select
                            value={opp.assignedToId || "__unassigned__"}
                            onValueChange={(value) => handleUpdateSalesOppAssignment(opp.id, value === "__unassigned__" ? undefined : value)}
                          >
                            <SelectTrigger className="w-[140px] h-7 text-xs">
                              <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__unassigned__">Unassigned</SelectItem>
                              {allStaff.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedSalesOppId(expandedSalesOppId === opp.id ? null : opp.id)}
                            className={cn(
                              "h-6 w-6 p-0",
                              opp.notes ? "text-blue-600" : "text-muted-foreground hover:text-blue-600"
                            )}
                            title={opp.notes ? "View/edit notes" : "Add notes"}
                          >
                            <StickyNote className="h-4 w-4" />
                          </Button>
                          {selectedMeeting?.isRecurring && !opp.pushedToNextMeeting && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (selectedMeeting?.id) {
                                  pushToNextMutation.mutate({ meetingId: selectedMeeting.id, segment: "salesOpportunities", itemId: opp.id });
                                }
                              }}
                              disabled={pushToNextMutation.isPending}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                              title="Push to next meeting"
                            >
                              <ArrowRightToLine className="h-4 w-4" />
                            </Button>
                          )}
                          {opp.pushedToNextMeeting && (
                            <Badge variant="outline" className="text-xs text-primary border-primary/30 px-1.5 py-0">
                              Pushed
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSalesOpp(opp.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {expandedSalesOppId === opp.id && (
                          <div className="px-2 pb-2">
                            <Textarea
                              placeholder="Add notes for this sales opportunity..."
                              value={opp.notes || ""}
                              onChange={(e) => handleUpdateSalesOppNotes(opp.id, e.target.value)}
                              className="min-h-[60px] text-sm bg-white dark:bg-gray-800"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a sales opportunity..."
                          value={newSalesOpp}
                          onChange={(e) => setNewSalesOpp(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSalesOpp();
                            }
                          }}
                        />
                        <Button size="sm" onClick={handleAddSalesOpp}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {newSalesOpp.trim() && (
                        <Textarea
                          placeholder="Add notes (optional)..."
                          value={newSalesOppNotes}
                          onChange={(e) => setNewSalesOppNotes(e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {isElementEnabled("areasOfOpportunities") && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Areas of Opportunities
                  </Label>
                  <div className="space-y-2">
                    {areasOfOpportunities.map((opp) => (
                      <div key={opp.id} className="bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2 p-2">
                          <input
                            type="checkbox"
                            checked={opp.isCompleted}
                            onChange={() => handleToggleAreaOpp(opp.id)}
                            className="h-4 w-4 rounded-full cursor-pointer accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`block ${opp.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                              {opp.content}
                            </span>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {opp.pushedFromMeetingId && (
                                <span className="flex items-center gap-1 text-primary">
                                  <ArrowRightToLine className="h-3 w-3" />
                                  Carried over
                                </span>
                              )}
                              {opp.createdById && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Added by {getStaffName(opp.createdById)}
                                </span>
                              )}
                              {opp.assignedToId && (
                                <span className="flex items-center gap-1">
                                  <UserPlus className="h-3 w-3" />
                                  Assigned to {getStaffName(opp.assignedToId)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Select
                            value={opp.assignedToId || "__unassigned__"}
                            onValueChange={(value) => handleUpdateAreaOppAssignment(opp.id, value === "__unassigned__" ? undefined : value)}
                          >
                            <SelectTrigger className="w-[140px] h-7 text-xs">
                              <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__unassigned__">Unassigned</SelectItem>
                              {allStaff.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedAreaOppId(expandedAreaOppId === opp.id ? null : opp.id)}
                            className={cn(
                              "h-6 w-6 p-0",
                              opp.notes ? "text-yellow-600" : "text-muted-foreground hover:text-yellow-600"
                            )}
                            title={opp.notes ? "View/edit notes" : "Add notes"}
                          >
                            <StickyNote className="h-4 w-4" />
                          </Button>
                          {selectedMeeting?.isRecurring && !opp.pushedToNextMeeting && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (selectedMeeting?.id) {
                                  pushToNextMutation.mutate({ meetingId: selectedMeeting.id, segment: "areasOfOpportunities", itemId: opp.id });
                                }
                              }}
                              disabled={pushToNextMutation.isPending}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                              title="Push to next meeting"
                            >
                              <ArrowRightToLine className="h-4 w-4" />
                            </Button>
                          )}
                          {opp.pushedToNextMeeting && (
                            <Badge variant="outline" className="text-xs text-primary border-primary/30 px-1.5 py-0">
                              Pushed
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAreaOpp(opp.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {expandedAreaOppId === opp.id && (
                          <div className="px-2 pb-2">
                            <Textarea
                              placeholder="Add notes for this area of opportunity..."
                              value={opp.notes || ""}
                              onChange={(e) => handleUpdateAreaOppNotes(opp.id, e.target.value)}
                              className="min-h-[60px] text-sm bg-white dark:bg-gray-800"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add an area of opportunity..."
                          value={newAreaOpp}
                          onChange={(e) => setNewAreaOpp(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddAreaOpp();
                            }
                          }}
                        />
                        <Button size="sm" onClick={handleAddAreaOpp}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {newAreaOpp.trim() && (
                        <Textarea
                          placeholder="Add notes (optional)..."
                          value={newAreaOppNotes}
                          onChange={(e) => setNewAreaOppNotes(e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {isElementEnabled("actionPlan") && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    Action Plan
                  </Label>
                  <Textarea
                    value={editFormData.actionPlan}
                    onChange={(e) => handleFormChange({ actionPlan: e.target.value })}
                    onFocus={() => markFieldEditing("actionPlan")}
                    onBlur={() => markFieldDone("actionPlan")}
                    placeholder="Enter the action plan..."
                    className="min-h-[100px]"
                  />
                </div>
                <Separator />
              </>
            )}

            {isElementEnabled("actionItems") && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-orange-500" />
                    Action Items
                  </Label>
                  <div className="space-y-2">
                    {actionItems.map((item) => (
                      <div key={item.id} className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={() => handleToggleActionItem(item.id)}
                            className="h-4 w-4 rounded-full cursor-pointer accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`block ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                              {item.content}
                            </span>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {item.createdById && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Added by {getStaffName(item.createdById)}
                                </span>
                              )}
                              {item.assignedToId && (
                                <span className="flex items-center gap-1">
                                  <UserPlus className="h-3 w-3" />
                                  Assigned to {getStaffName(item.assignedToId)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Select
                            value={item.assignedToId || "__unassigned__"}
                            onValueChange={(value) => handleUpdateActionItemAssignment(item.id, value === "__unassigned__" ? undefined : value)}
                          >
                            <SelectTrigger className="w-[140px] h-7 text-xs">
                              <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__unassigned__">Unassigned</SelectItem>
                              {allStaff.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {item.taskId ? (
                            <Link href={`/tasks/${item.taskId}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-[#00C9C6] hover:text-[#00a8a6] hover:bg-[#00C9C6]/10"
                                title="View Task"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Task
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenConvertToTask(item)}
                              className="h-7 px-2 text-xs text-[#00C9C6] hover:text-[#00a8a6] hover:bg-[#00C9C6]/10"
                              title="Convert to Task"
                            >
                              <Briefcase className="h-3 w-3 mr-1" />
                              Task
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveActionItem(item.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add an action item..."
                        value={newActionItem}
                        onChange={(e) => setNewActionItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddActionItem();
                          }
                        }}
                      />
                      <Button size="sm" onClick={handleAddActionItem}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            <div>
              <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-gray-500" />
                Notes
              </Label>
              <Textarea
                value={editFormData.notes}
                onChange={(e) => handleFormChange({ notes: e.target.value })}
                onFocus={() => markFieldEditing("notes")}
                onBlur={() => markFieldDone("notes")}
                placeholder="Add meeting notes..."
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Convert to Task Dialog */}
        <Dialog open={showConvertToTaskDialog} onOpenChange={setShowConvertToTaskDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convert to Task</DialogTitle>
              <DialogDescription>
                Create a task from this action item and assign it to a team member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Action Item</Label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                  {actionItemToConvert?.content}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="px-detail-assignee">Assign To</Label>
                <Select value={taskAssigneeId} onValueChange={setTaskAssigneeId}>
                  <SelectTrigger id="px-detail-assignee">
                    <SelectValue placeholder="Select a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={staff.profileImagePath} />
                            <AvatarFallback className="text-xs">
                              {staff.firstName?.[0]}{staff.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{staff.firstName || staff.name} {staff.lastName || ""}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConvertToTaskDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConvertToTask}
                disabled={!taskAssigneeId || convertToTaskMutation.isPending}
                className="bg-[#00C9C6] hover:bg-[#00a8a6] text-white"
              >
                {convertToTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            Meetings
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-0.5">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={cn("h-8 px-3", viewMode === "list" && "bg-primary hover:bg-primary/90")}
              >
                <LayoutList className="h-4 w-4 mr-1.5" />
                List
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className={cn("h-8 px-3", viewMode === "calendar" && "bg-primary hover:bg-primary/90")}
              >
                <CalendarDays className="h-4 w-4 mr-1.5" />
                Calendar
              </Button>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Meeting
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setListPage(1); }}
                  className="pl-10"
                />
              </div>
              <Select value={timeFilter} onValueChange={(v) => { setTimeFilter(v); setListPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Time filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ownerFilter} onValueChange={(v) => { setOwnerFilter(v); setListPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Meeting scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meetings</SelectItem>
                  <SelectItem value="mine">My Meetings</SelectItem>
                </SelectContent>
              </Select>
              {clients.length > 0 && (
                <Select value={clientFilter} onValueChange={(v) => { setClientFilter(v); setListPage(1); }}>
                  <SelectTrigger className="w-[200px]">
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All clients</SelectItem>
                    {clients.filter(client => client.id).map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.company || client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {allTags.length > 0 && (
                <Select value={tagFilter} onValueChange={(v) => { setTagFilter(v); setListPage(1); }}>
                  <SelectTrigger className="w-[200px]">
                    <Tag className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {viewMode === "list" ? (
            <>
              {filteredMeetings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Presentation className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No meetings yet</p>
                  <p className="text-sm">Create your first meeting to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      onClick={() => navigateToMeeting(meeting)}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Presentation className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{meeting.title}</h4>
                            {meeting.isRecurring && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1 text-primary border-primary/30">
                                <Repeat className="h-3 w-3" />
                                {meeting.recurringFrequency === "daily" ? "Daily" : meeting.recurringFrequency === "weekly" ? "Weekly" : meeting.recurringFrequency === "biweekly" ? "Biweekly" : "Monthly"}
                              </Badge>
                            )}
                            {meeting.isPrivate && (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Private
                              </Badge>
                            )}
                            {meeting.tags && meeting.tags.length > 0 && (
                              <div className="flex gap-1">
                                {meeting.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {meeting.tags.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{meeting.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              {format(parseISO(meeting.meetingDate), "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {meeting.meetingTime}
                            </span>
                            {meeting.attendees.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {meeting.attendees.slice(0, 3).map((attendee, idx) => (
                            <Avatar key={attendee.id} className="h-8 w-8 border-2 border-background">
                              <AvatarFallback className="text-xs">
                                {attendee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {meeting.attendees.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background text-xs font-medium">
                              +{meeting.attendees.length - 3}
                            </div>
                          )}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{meeting.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMutation.mutate(meeting.id);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredMeetings.length > 0 && totalListPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((listPage - 1) * MEETINGS_PER_PAGE) + 1}–{Math.min(listPage * MEETINGS_PER_PAGE, filteredMeetings.length)} of {filteredMeetings.length} meetings
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setListPage(p => Math.max(1, p - 1))}
                      disabled={listPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {listPage} of {totalListPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setListPage(p => Math.min(totalListPages, p + 1))}
                      disabled={listPage === totalListPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={() => setCalendarMonth(prev => subMonths(prev, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">{format(calendarMonth, "MMMM yyyy")}</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCalendarMonth(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCalendarMonth(prev => addMonths(prev, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {(() => {
                const monthStart = startOfMonth(calendarMonth);
                const monthEnd = endOfMonth(calendarMonth);
                const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
                const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
                const days = eachDayOfInterval({ start: calStart, end: calEnd });

                const meetingsByDate = new Map<string, PxMeeting[]>();
                filteredMeetings.forEach(meeting => {
                  if (meeting.meetingDate) {
                    const dateKey = meeting.meetingDate.split('T')[0];
                    if (!meetingsByDate.has(dateKey)) meetingsByDate.set(dateKey, []);
                    meetingsByDate.get(dateKey)!.push(meeting);
                  }
                });

                return (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-7 bg-muted/50">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2 border-b">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {days.map((day, idx) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const dayMeetings = meetingsByDate.get(dateKey) || [];
                        const inMonth = isSameMonth(day, calendarMonth);
                        const today = isToday(day);

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "min-h-[100px] border-b border-r p-1 transition-colors",
                              !inMonth && "bg-muted/30",
                              today && "bg-primary/5"
                            )}
                          >
                            <div className={cn(
                              "text-xs font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full",
                              !inMonth && "text-muted-foreground/50",
                              today && "bg-primary text-primary-foreground"
                            )}>
                              {format(day, "d")}
                            </div>
                            <div className="space-y-0.5">
                              {dayMeetings.slice(0, 3).map(meeting => (
                                <div
                                  key={meeting.id}
                                  onClick={() => navigateToMeeting(meeting)}
                                  className={cn(
                                    "text-[11px] leading-tight px-1.5 py-0.5 rounded cursor-pointer truncate",
                                    "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
                                    meeting.isPrivate && "bg-muted text-muted-foreground hover:bg-muted/80"
                                  )}
                                  title={`${meeting.title} - ${meeting.meetingTime}`}
                                >
                                  <span className="font-medium">{meeting.meetingTime}</span>{" "}
                                  {meeting.title}
                                </div>
                              ))}
                              {dayMeetings.length > 3 && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="text-[10px] text-primary px-1.5 font-medium hover:underline cursor-pointer w-full text-left">
                                      +{dayMeetings.length - 3} more
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-2" align="start">
                                    <div className="text-xs font-semibold mb-2">{format(day, "EEEE, MMM d")}</div>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                      {dayMeetings.map(meeting => (
                                        <div
                                          key={meeting.id}
                                          onClick={() => navigateToMeeting(meeting)}
                                          className={cn(
                                            "text-xs px-2 py-1.5 rounded cursor-pointer",
                                            "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
                                            meeting.isPrivate && "bg-muted text-muted-foreground hover:bg-muted/80"
                                          )}
                                        >
                                          <span className="font-medium">{meeting.meetingTime}</span>{" "}
                                          {meeting.title}
                                        </div>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={handleCloseCreateDialog}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              {createDialogStep === 1 ? "Create New Meeting" : "Select Meeting Elements"}
            </DialogTitle>
            <DialogDescription>
              {createDialogStep === 1 
                ? "Schedule a new team meeting" 
                : "Choose which segments to include in this meeting"}
            </DialogDescription>
          </DialogHeader>
          
          {createDialogStep === 1 ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Weekly Sync"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.meetingDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.meetingDate}
                      onSelect={(date) => {
                        if (date) {
                          setFormData(prev => ({ ...prev, meetingDate: date }));
                          setIsDatePickerOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.meetingTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, meetingTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={formData.meetingDuration.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, meetingDuration: parseInt(value) }))}
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

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="recurring-toggle" className="cursor-pointer font-medium">Recurring Meeting</Label>
                </div>
                <Switch
                  id="recurring-toggle"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
                />
              </div>
              {formData.isRecurring && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Frequency</Label>
                      <Select
                        value={formData.recurringFrequency}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, recurringFrequency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Ends</Label>
                      <Select
                        value={formData.recurringEndType}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, recurringEndType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">No End Date</SelectItem>
                          <SelectItem value="after_occurrences">After No. of Occurrences</SelectItem>
                          <SelectItem value="on_date">On Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {formData.recurringEndType === "after_occurrences" && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Number of Occurrences</Label>
                      <Input
                        type="number"
                        min={1}
                        max={520}
                        value={formData.recurringOccurrences}
                        onChange={(e) => setFormData(prev => ({ ...prev, recurringOccurrences: parseInt(e.target.value) || 1 }))}
                        placeholder="e.g. 10"
                      />
                    </div>
                  )}
                  {formData.recurringEndType === "on_date" && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">End Date</Label>
                      <Popover open={isRecurringEndDateOpen} onOpenChange={setIsRecurringEndDateOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal text-sm">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.recurringEndDate ? format(formData.recurringEndDate, "MMM d, yyyy") : "Select end date..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.recurringEndDate || undefined}
                            onSelect={(date) => {
                              if (date) {
                                setFormData(prev => ({ ...prev, recurringEndDate: date }));
                                setIsRecurringEndDateOpen(false);
                              }
                            }}
                            disabled={(date) => date <= formData.meetingDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Client</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => { setIsCreateClientOpen(!isCreateClientOpen); setClientSearch(""); }}
                >
                  {formData.clientId
                    ? (clients.find(c => c.id === formData.clientId)?.company || clients.find(c => c.id === formData.clientId)?.name || "Select client...")
                    : "Select client..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {isCreateClientOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-[9999] max-h-[200px] overflow-hidden flex flex-col">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search clients..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto max-h-[160px]">
                      <div
                        className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => { setFormData(prev => ({ ...prev, clientId: "" })); setIsCreateClientOpen(false); }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", !formData.clientId ? "opacity-100" : "opacity-0")} />
                        None
                      </div>
                      {clients
                        .filter(c => {
                          const label = c.company || c.name || "";
                          return label.toLowerCase().includes(clientSearch.toLowerCase());
                        })
                        .map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => { setFormData(prev => ({ ...prev, clientId: client.id })); setIsCreateClientOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", formData.clientId === client.id ? "opacity-100" : "opacity-0")} />
                          {client.company || client.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attendees</Label>
              <div className="relative" ref={attendeesDropdownRef}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => { setIsAttendeesOpen(!isAttendeesOpen); setAttendeeSearch(""); }}
                >
                  {formData.attendeeIds.length === 0
                    ? "Select attendees..."
                    : `${formData.attendeeIds.length} selected`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {isAttendeesOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-[9999] max-h-[200px] overflow-hidden flex flex-col">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search staff..."
                        value={attendeeSearch}
                        onChange={(e) => setAttendeeSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto max-h-[160px]">
                      {allStaff
                        .filter(m => {
                          const name = `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase();
                          return name.includes(attendeeSearch.toLowerCase());
                        })
                        .map((member) => {
                          const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
                          const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || '??';
                          return (
                            <div
                              key={member.id}
                              className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                              onClick={() => toggleAttendee(member.id)}
                            >
                              <Check className={cn("mr-2 h-4 w-4", formData.attendeeIds.includes(member.id) ? "opacity-100" : "opacity-0")} />
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={member.profileImagePath || undefined} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              {fullName}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
              
              {formData.attendeeIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.attendeeIds.map(id => {
                    const member = allStaff.find(s => s.id === id);
                    if (!member) return null;
                    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
                    return (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                        {fullName}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => toggleAttendee(id)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Facilitator</Label>
                <div className="relative" ref={facilitatorDropdownRef}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => { setIsFacilitatorOpen(!isFacilitatorOpen); setFacilitatorSearch(""); }}
                  >
                    {formData.facilitatorId
                      ? (() => {
                          const member = activeStaff.find(s => s.id === formData.facilitatorId);
                          return member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : "Select...";
                        })()
                      : "Select facilitator..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                  {isFacilitatorOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-[9999] max-h-[200px] overflow-hidden flex flex-col">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search staff..."
                          value={facilitatorSearch}
                          onChange={(e) => setFacilitatorSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto max-h-[160px]">
                        {activeStaff
                          .filter(m => {
                            const name = `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase();
                            return name.includes(facilitatorSearch.toLowerCase());
                          })
                          .map((member) => {
                            const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
                            const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || '??';
                            return (
                              <div
                                key={member.id}
                                className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                                onClick={() => { setFormData(prev => ({ ...prev, facilitatorId: member.id })); setIsFacilitatorOpen(false); }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", formData.facilitatorId === member.id ? "opacity-100" : "opacity-0")} />
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage src={member.profileImagePath || undefined} />
                                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                </Avatar>
                                {fullName}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Note Taker</Label>
                <div className="relative" ref={noteTakerDropdownRef}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => { setIsNoteTakerOpen(!isNoteTakerOpen); setNoteTakerSearch(""); }}
                  >
                    {formData.noteTakerId
                      ? (() => {
                          const member = activeStaff.find(s => s.id === formData.noteTakerId);
                          return member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : "Select...";
                        })()
                      : "Select note taker..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                  {isNoteTakerOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-[9999] max-h-[200px] overflow-hidden flex flex-col">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search staff..."
                          value={noteTakerSearch}
                          onChange={(e) => setNoteTakerSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto max-h-[160px]">
                        {activeStaff
                          .filter(m => {
                            const name = `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase();
                            return name.includes(noteTakerSearch.toLowerCase());
                          })
                          .map((member) => {
                            const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
                            const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || '??';
                            return (
                              <div
                                key={member.id}
                                className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                                onClick={() => { setFormData(prev => ({ ...prev, noteTakerId: member.id })); setIsNoteTakerOpen(false); }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", formData.noteTakerId === member.id ? "opacity-100" : "opacity-0")} />
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage src={member.profileImagePath || undefined} />
                                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                </Avatar>
                                {fullName}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recordingLink">Recording Link (optional)</Label>
              <Input
                id="recordingLink"
                placeholder="https://..."
                value={formData.recordingLink}
                onChange={(e) => setFormData(prev => ({ ...prev, recordingLink: e.target.value }))}
              />
            </div>
          </div>
          ) : (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select which meeting elements you want to include. Unchecked elements will not appear in the meeting details.
            </p>
            <div className="space-y-3">
              {meetingElements.map((element) => {
                const Icon = element.icon;
                const isChecked = formData.enabledElements?.includes(element.id) ?? true;
                return (
                  <div
                    key={element.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      isChecked 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-muted-foreground/50"
                    )}
                    onClick={() => toggleMeetingElement(element.id)}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded border flex items-center justify-center",
                      isChecked ? "bg-primary border-primary" : "border-muted-foreground"
                    )}>
                      {isChecked && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{element.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          <DialogFooter>
            {createDialogStep === 1 ? (
              <>
                <Button variant="outline" onClick={() => handleCloseCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleNextStep}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setCreateDialogStep(1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Meeting"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Task Dialog */}
      <Dialog open={showConvertToTaskDialog} onOpenChange={setShowConvertToTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Task</DialogTitle>
            <DialogDescription>
              Create a task from this action item and assign it to a team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Action Item</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                {actionItemToConvert?.content}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="px-assignee">Assign To</Label>
              <Select value={taskAssigneeId} onValueChange={setTaskAssigneeId}>
                <SelectTrigger id="px-assignee">
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {activeStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={staff.profileImagePath} />
                          <AvatarFallback className="text-xs">
                            {staff.firstName?.[0]}{staff.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{staff.firstName || staff.name} {staff.lastName || ""}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConvertToTaskDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertToTask}
              disabled={!taskAssigneeId || convertToTaskMutation.isPending}
              className="bg-[#00C9C6] hover:bg-[#00a8a6] text-white"
            >
              {convertToTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
