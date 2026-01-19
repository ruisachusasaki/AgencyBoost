import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Edit
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

interface PxMeeting {
  id: string;
  title: string;
  meetingDate: string;
  meetingTime: string;
  meetingDuration: number;
  recordingLink?: string;
  whatsWorkingKpis?: string;
  salesOpportunities?: string;
  areasOfOpportunities?: string;
  actionPlan?: string;
  actionItems?: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  attendees: Array<{ id: string; name: string }>;
}

const SEGMENT_LABELS = {
  whatsWorkingKpis: { label: "What's Working / KPI's", icon: ChartBar, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  salesOpportunities: { label: "Sales Opportunities", icon: TrendingUp, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  areasOfOpportunities: { label: "Areas of Opportunities", icon: Lightbulb, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  actionPlan: { label: "Action Plan", icon: Target, color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  actionItems: { label: "Action Items", icon: ListTodo, color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
};

interface PxMeetingsProps {
  meetingId?: string;
}

export default function PxMeetings({ meetingId }: PxMeetingsProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    meetingDate: new Date(),
    meetingTime: "10:00",
    meetingDuration: 60,
    recordingLink: "",
    attendeeIds: [] as string[],
  });
  
  const [editFormData, setEditFormData] = useState({
    whatsWorkingKpis: "",
    salesOpportunities: "",
    areasOfOpportunities: "",
    actionPlan: "",
    actionItems: "",
    recordingLink: "",
  });
  
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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

  useEffect(() => {
    if (selectedMeeting) {
      setEditFormData({
        whatsWorkingKpis: selectedMeeting.whatsWorkingKpis || "",
        salesOpportunities: selectedMeeting.salesOpportunities || "",
        areasOfOpportunities: selectedMeeting.areasOfOpportunities || "",
        actionPlan: selectedMeeting.actionPlan || "",
        actionItems: selectedMeeting.actionItems || "",
        recordingLink: selectedMeeting.recordingLink || "",
      });
      setIsEditMode(false);
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
      setIsEditMode(false);
      toast({ title: "Meeting updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update meeting", description: error.message, variant: "destructive" });
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

  const resetForm = () => {
    setFormData({
      title: "",
      meetingDate: new Date(),
      meetingTime: "10:00",
      meetingDuration: 60,
      recordingLink: "",
      attendeeIds: [],
    });
  };

  const handleCreate = () => {
    if (!formData.title.trim()) {
      toast({ title: "Please enter a meeting title", variant: "destructive" });
      return;
    }
    
    createMutation.mutate({
      title: formData.title,
      meetingDate: format(formData.meetingDate, "yyyy-MM-dd"),
      meetingTime: formData.meetingTime,
      meetingDuration: formData.meetingDuration,
      recordingLink: formData.recordingLink || null,
      attendeeIds: formData.attendeeIds,
    });
  };

  const handleUpdate = () => {
    if (!selectedMeeting || !meetingId) return;
    
    updateMutation.mutate({
      id: meetingId,
      data: editFormData,
    });
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

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.attendees.some(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    const meetingDateStr = typeof selectedMeeting.meetingDate === 'string' 
      ? selectedMeeting.meetingDate 
      : selectedMeeting.meetingDate?.toString?.() || '';
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={navigateToList}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Meetings
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{selectedMeeting.title}</CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {meetingDateStr ? format(parseISO(meetingDateStr), "MMMM d, yyyy") : "No date"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedMeeting.meetingTime || "No time"}
                  </span>
                  <span>{selectedMeeting.meetingDuration || 0} min</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {isEditMode ? "Cancel" : "Edit"}
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
          </CardHeader>

          <CardContent>
            <Separator className="mb-6" />

            {selectedMeeting.attendees.length > 0 && (
              <div className="mb-6">
                <Label className="text-sm text-muted-foreground">Attendees</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMeeting.attendees.map((attendee) => (
                    <Badge key={attendee.id} variant="secondary">
                      {attendee.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedMeeting.recordingLink && (
              <div className="mb-6">
                <Label className="text-sm text-muted-foreground">Recording Link</Label>
                <a 
                  href={selectedMeeting.recordingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline block mt-1"
                >
                  {selectedMeeting.recordingLink}
                </a>
              </div>
            )}

            <div className="space-y-6">
              {Object.entries(SEGMENT_LABELS).map(([key, { label, icon: Icon, color }]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("font-normal", color)}>
                      <Icon className="h-3.5 w-3.5 mr-1" />
                      {label}
                    </Badge>
                  </div>
                  {isEditMode ? (
                    <Textarea
                      value={editFormData[key as keyof typeof editFormData]}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Enter ${label.toLowerCase()}...`}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md min-h-[60px]">
                      {(selectedMeeting as any)[key] ? (
                        <p className="whitespace-pre-wrap">{(selectedMeeting as any)[key]}</p>
                      ) : (
                        <p className="text-muted-foreground italic">No content yet</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {isEditMode && (
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
                      <h4 className="font-medium">{meeting.title}</h4>
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Meeting</DialogTitle>
            <DialogDescription>Schedule a new PX team meeting</DialogDescription>
          </DialogHeader>
          
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

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
