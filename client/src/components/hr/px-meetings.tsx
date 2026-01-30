import { useState, useEffect } from "react";
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
import { format, parseISO } from "date-fns";
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
  UserPlus
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
  notes?: string;
  isPrivate?: boolean;
  enabledElements?: string[];
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Define available meeting elements
  const meetingElements = [
    { id: "whatsWorkingKpis", label: "What's Working / KPI's", icon: ChartBar },
    { id: "salesOpportunities", label: "Sales Opportunities", icon: TrendingUp },
    { id: "areasOfOpportunities", label: "Areas of Opportunities", icon: AlertCircle },
    { id: "actionPlan", label: "Action Plan", icon: Target },
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
    enabledElements: ["whatsWorkingKpis", "salesOpportunities", "areasOfOpportunities", "actionPlan", "actionItems"] as string[],
  });
  
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
  }
  
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
          createdAt: item.createdAt
        };
      });
    } catch {
      return value ? [{ id: `item-0-${Date.now()}`, content: value, isCompleted: false }] : [];
    }
  };

  // Helper to check if a meeting element is enabled
  const isElementEnabled = (elementId: string): boolean => {
    // If no enabledElements set, default to all enabled
    if (!selectedMeeting?.enabledElements || selectedMeeting.enabledElements.length === 0) {
      return true;
    }
    return selectedMeeting.enabledElements.includes(elementId);
  };

  useEffect(() => {
    if (selectedMeeting) {
      const meetingDateStr = typeof selectedMeeting.meetingDate === 'string' 
        ? selectedMeeting.meetingDate 
        : selectedMeeting.meetingDate?.toString?.() || '';
      
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
      setSalesOpportunities(parseJsonArray(selectedMeeting.salesOpportunities));
      setAreasOfOpportunities(parseJsonArray(selectedMeeting.areasOfOpportunities));
      setActionItems(parseJsonArray(selectedMeeting.actionItems));
      setHasUnsavedChanges(false);
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
        description: `Converted from PX meeting action item`,
      });
      const task = await taskResponse.json();
      return task;
    },
    onSuccess: (task) => {
      // Update the action item with the task ID locally
      setActionItems(prevItems => 
        prevItems.map(item => 
          item.id === actionItemToConvert?.id 
            ? { ...item, taskId: task.id }
            : item
        )
      );
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
      enabledElements: ["whatsWorkingKpis", "salesOpportunities", "areasOfOpportunities", "actionPlan", "actionItems"],
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
    createMutation.mutate({
      title: formData.title,
      meetingDate: format(formData.meetingDate, "yyyy-MM-dd"),
      meetingTime: formData.meetingTime,
      meetingDuration: formData.meetingDuration,
      recordingLink: formData.recordingLink || null,
      attendeeIds: formData.attendeeIds,
      facilitatorId: formData.facilitatorId || null,
      noteTakerId: formData.noteTakerId || null,
      enabledElements: formData.enabledElements,
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
      // Reset form data
      setFormData({
        title: "",
        meetingDate: new Date(),
        meetingTime: "10:00",
        meetingDuration: 60,
        recordingLink: "",
        attendeeIds: [],
        facilitatorId: "",
        noteTakerId: "",
        enabledElements: ["whatsWorkingKpis", "salesOpportunities", "areasOfOpportunities", "actionPlan", "actionItems"],
      });
    }
  };

  const handleUpdate = () => {
    if (!selectedMeeting || !meetingId) return;
    
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
        salesOpportunities: JSON.stringify(salesOpportunities),
        areasOfOpportunities: JSON.stringify(areasOfOpportunities),
        actionPlan: editFormData.actionPlan,
        actionItems: JSON.stringify(actionItems),
        notes: editFormData.notes,
        isPrivate: editFormData.isPrivate,
        attendeeIds: editFormData.attendeeIds,
      },
    });
  };

  const handleFormChange = (updates: Partial<typeof editFormData>) => {
    setEditFormData(prev => ({ ...prev, ...updates }));
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
      setSalesOpportunities([...salesOpportunities, { 
        id: newId, 
        content: newSalesOpp.trim(), 
        isCompleted: false,
        notes: newSalesOppNotes.trim() || undefined,
        createdById: currentUserId,
        createdAt: new Date().toISOString()
      }]);
      setHasUnsavedChanges(true);
      setNewSalesOpp("");
      setNewSalesOppNotes("");
    }
  };

  const handleRemoveSalesOpp = (id: string) => {
    setSalesOpportunities(salesOpportunities.filter(item => item.id !== id));
    if (expandedSalesOppId === id) {
      setExpandedSalesOppId(null);
    }
    setHasUnsavedChanges(true);
  };

  const handleToggleSalesOpp = (id: string) => {
    setSalesOpportunities(salesOpportunities.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
    setHasUnsavedChanges(true);
  };

  const handleUpdateSalesOppNotes = (id: string, notes: string) => {
    setSalesOpportunities(salesOpportunities.map(item => 
      item.id === id ? { ...item, notes: notes || undefined } : item
    ));
    setHasUnsavedChanges(true);
  };

  const handleAddAreaOpp = () => {
    if (newAreaOpp.trim()) {
      const newId = `area-${Date.now()}`;
      const currentUserId = currentUser?.staffId || currentUser?.id;
      setAreasOfOpportunities([...areasOfOpportunities, { 
        id: newId, 
        content: newAreaOpp.trim(), 
        isCompleted: false,
        notes: newAreaOppNotes.trim() || undefined,
        createdById: currentUserId,
        createdAt: new Date().toISOString()
      }]);
      setHasUnsavedChanges(true);
      setNewAreaOpp("");
      setNewAreaOppNotes("");
    }
  };

  const handleRemoveAreaOpp = (id: string) => {
    setAreasOfOpportunities(areasOfOpportunities.filter(item => item.id !== id));
    if (expandedAreaOppId === id) {
      setExpandedAreaOppId(null);
    }
    setHasUnsavedChanges(true);
  };

  const handleToggleAreaOpp = (id: string) => {
    setAreasOfOpportunities(areasOfOpportunities.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
    setHasUnsavedChanges(true);
  };

  const handleUpdateAreaOppNotes = (id: string, notes: string) => {
    setAreasOfOpportunities(areasOfOpportunities.map(item => 
      item.id === id ? { ...item, notes: notes || undefined } : item
    ));
    setHasUnsavedChanges(true);
  };

  const handleAddActionItem = () => {
    if (newActionItem.trim()) {
      const currentUserId = currentUser?.staffId || currentUser?.id;
      setActionItems([...actionItems, { 
        id: `action-${Date.now()}`, 
        content: newActionItem.trim(), 
        isCompleted: false,
        createdById: currentUserId,
        createdAt: new Date().toISOString()
      }]);
      setHasUnsavedChanges(true);
      setNewActionItem("");
    }
  };

  const handleRemoveActionItem = (id: string) => {
    setActionItems(actionItems.filter(item => item.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleToggleActionItem = (id: string) => {
    setActionItems(actionItems.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
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
    setSalesOpportunities(salesOpportunities.map(item => 
      item.id === id ? { ...item, assignedToId } : item
    ));
    setHasUnsavedChanges(true);
  };

  // Update assignment for area of opportunity
  const handleUpdateAreaOppAssignment = (id: string, assignedToId: string | undefined) => {
    setAreasOfOpportunities(areasOfOpportunities.map(item => 
      item.id === id ? { ...item, assignedToId } : item
    ));
    setHasUnsavedChanges(true);
  };

  // Update assignment for action item
  const handleUpdateActionItemAssignment = (id: string, assignedToId: string | undefined) => {
    setActionItems(actionItems.map(item => 
      item.id === id ? { ...item, assignedToId } : item
    ));
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
    
    return matchesSearch && matchesTag && matchesClient && canSeePrivate;
  });

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
            {hasUnsavedChanges && (
              <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="bg-primary hover:bg-primary/90">
                {updateMutation.isPending ? "Saving..." : "Save Meeting"}
              </Button>
            )}
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
              <Popover open={isEditAttendeesOpen} onOpenChange={setIsEditAttendeesOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {editFormData.attendeeIds.length === 0
                      ? "Add attendees..."
                      : `${editFormData.attendeeIds.length} attendee${editFormData.attendeeIds.length !== 1 ? 's' : ''}`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search staff..." />
                    <CommandList>
                      <CommandEmpty>No staff found.</CommandEmpty>
                      <CommandGroup>
                        {allStaff.map((member) => {
                          const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
                          const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || '??';
                          return (
                            <CommandItem
                              key={member.id}
                              onSelect={() => toggleEditAttendee(member.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  editFormData.attendeeIds.includes(member.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={member.profileImagePath || undefined} />
                                <AvatarFallback className="text-xs">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              {fullName}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
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
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Meeting
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {clients.length > 0 && (
              <Select value={clientFilter} onValueChange={setClientFilter}>
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
              <Select value={tagFilter} onValueChange={setTagFilter}>
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

          {filteredMeetings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Presentation className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No meetings yet</p>
              <p className="text-sm">Create your first meeting to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMeetings.map((meeting) => (
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
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={handleCloseCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {createDialogStep === 1 ? "Create New Meeting" : "Select Meeting Elements"}
            </DialogTitle>
            <DialogDescription>
              {createDialogStep === 1 
                ? "Schedule a new PX team meeting" 
                : "Choose which segments to include in this meeting"}
            </DialogDescription>
          </DialogHeader>
          
          {createDialogStep === 1 ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Weekly PX Sync"
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
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Attendees</Label>
              <Popover open={isAttendeesOpen} onOpenChange={setIsAttendeesOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {formData.attendeeIds.length === 0
                      ? "Select attendees..."
                      : `${formData.attendeeIds.length} selected`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search staff..." />
                    <CommandList>
                      <CommandEmpty>No staff found.</CommandEmpty>
                      <CommandGroup>
                        {allStaff.map((member) => {
                          const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
                          const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || '??';
                          return (
                            <CommandItem
                              key={member.id}
                              onSelect={() => toggleAttendee(member.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.attendeeIds.includes(member.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={member.profileImagePath || undefined} />
                                <AvatarFallback className="text-xs">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              {fullName}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
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
                <Popover open={isFacilitatorOpen} onOpenChange={setIsFacilitatorOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {formData.facilitatorId
                        ? (() => {
                            const member = activeStaff.find(s => s.id === formData.facilitatorId);
                            return member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : "Select...";
                          })()
                        : "Select facilitator..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search staff..." />
                      <CommandList>
                        <CommandEmpty>No staff found.</CommandEmpty>
                        <CommandGroup>
                          {activeStaff.map((member) => {
                            const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
                            const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || '??';
                            return (
                              <CommandItem
                                key={member.id}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, facilitatorId: member.id }));
                                  setIsFacilitatorOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.facilitatorId === member.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage src={member.profileImagePath || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                {fullName}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Note Taker</Label>
                <Popover open={isNoteTakerOpen} onOpenChange={setIsNoteTakerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {formData.noteTakerId
                        ? (() => {
                            const member = activeStaff.find(s => s.id === formData.noteTakerId);
                            return member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : "Select...";
                          })()
                        : "Select note taker..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search staff..." />
                      <CommandList>
                        <CommandEmpty>No staff found.</CommandEmpty>
                        <CommandGroup>
                          {activeStaff.map((member) => {
                            const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
                            const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || '??';
                            return (
                              <CommandItem
                                key={member.id}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, noteTakerId: member.id }));
                                  setIsNoteTakerOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.noteTakerId === member.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage src={member.profileImagePath || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                {fullName}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
