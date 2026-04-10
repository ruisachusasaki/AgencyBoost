import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LinkifyText } from "@/components/ui/linkify-text";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addWeeks, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { PositionKpisSection } from "@/components/hr/position-kpis-section";
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  MessageSquare,
  CheckSquare,
  Target,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Star,
  Heart,
  Cake,
  Briefcase,
  StickyNote,
  ChevronLeft,
  Trash2,
  BarChart3,
  ChevronRight,
  Trophy,
  X,
  ExternalLink,
  Timer,
  RotateCcw,
  Play,
  Square,
  Repeat,
  Shield,
  Edit,
  ChevronDown,
  ChevronUp,
  Check,
  HelpCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectGroup, SelectLabel } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";

interface DirectReport {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImagePath?: string;
  position?: string;
  department?: string;
  hireDate?: string;
  birthdate?: string;
}

interface Meeting {
  id: string;
  managerId: string;
  directReportId: string;
  meetingDate: string;
  meetingTime: string;
  meetingDuration: number;
  weekOf: string;
  feeling?: string;
  performanceFeedback?: string;
  performancePoints?: number;
  bonusPoints?: number;
  progressionStatus?: string;
  hobbies?: string;
  family?: string;
  privateNotes?: string;
  recordingLink?: string;
  calendarEventId?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  recurringEndType?: string;
  recurringEndDate?: string;
  recurringOccurrences?: number;
  recurringParentId?: string;
  meetingStartedAt?: string;
  meetingEndedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TalkingPoint {
  id: string;
  meetingId: string;
  content: string;
  addedBy: string;
  orderIndex: number;
  isCompleted: boolean;
  notes?: string;
}

interface Win {
  id: string;
  meetingId: string;
  content: string;
  addedBy: string;
  orderIndex: number;
}

interface Objective {
  id: string;
  meetingId: string;
  content: string;
  addedBy: string;
  orderIndex: number;
}

interface ActionItem {
  id: string;
  meetingId: string;
  content: string;
  assignedTo?: string;
  dueDate?: string;
  isCompleted: boolean;
  taskId?: string;
}

interface Goal {
  id: string;
  meetingId?: string;
  directReportId: string;
  content: string;
  status: string;
}

interface Comment {
  id: string;
  meetingId: string;
  authorId: string;
  content: string;
  createdAt: string;
  authorFirstName?: string;
  authorLastName?: string;
  authorProfileImagePath?: string;
}

const FEELING_OPTIONS = [
  { value: "excellent", label: "Excellent", emoji: "😄", color: "text-green-600" },
  { value: "good", label: "Good", emoji: "🙂", color: "text-blue-600" },
  { value: "okay", label: "Okay", emoji: "😐", color: "text-yellow-600" },
  { value: "bad", label: "Bad", emoji: "☹️", color: "text-orange-600" },
  { value: "terrible", label: "Terrible", emoji: "😢", color: "text-red-600" },
];

const PERFORMANCE_OPTIONS = [
  { value: "on_target", label: "On Target", points: 3, color: "bg-green-100 text-green-800" },
  { value: "below_expectations", label: "Below Expectations", points: 2, color: "bg-yellow-100 text-yellow-800" },
  { value: "far_below_expectations", label: "Far Below Expectations", points: 1, color: "bg-red-100 text-red-800" },
];

const BONUS_OPTIONS = [
  { value: 0, label: "No Bonus", points: 0 },
  { value: 1, label: "Add Bonus (+1)", points: 1 },
  { value: 2, label: "Add Bonus (+2)", points: 2 },
];

// Progression options are now fetched from the API instead of being hard-coded

const GOAL_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "on_track", label: "On-Track", color: "bg-green-100 text-green-800" },
  { value: "off_track", label: "Off-Track", color: "bg-red-100 text-red-800" },
  { value: "complete", label: "Complete", color: "bg-green-700 text-white" },
];

export default function OneOnOneMeetings({ meetingId }: { meetingId?: string } = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"my-direct-reports" | "my-meetings">("my-direct-reports");
  const [selectedReport, setSelectedReport] = useState<DirectReport | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [deepLinkProcessed, setDeepLinkProcessed] = useState(false);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const meetingsPerPage = 10;
  
  // New meeting dialog state
  const [showNewMeetingDialog, setShowNewMeetingDialog] = useState(false);
  const [newMeetingDate, setNewMeetingDate] = useState<Date | undefined>(undefined);
  const [newMeetingTime, setNewMeetingTime] = useState("10:00");
  const [newMeetingDuration, setNewMeetingDuration] = useState(60);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("weekly");
  const [recurringEndType, setRecurringEndType] = useState("never");
  const [recurringEndDate, setRecurringEndDate] = useState<Date | null>(null);
  const [recurringOccurrences, setRecurringOccurrences] = useState(10);
  const [isRecurringEndDateOpen, setIsRecurringEndDateOpen] = useState(false);

  // Fetch progression statuses
  const { data: progressionStatuses = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/one-on-one/progression-statuses"],
  });

  // Fetch direct reports
  const { data: directReports = [], isLoading: loadingReports } = useQuery<DirectReport[]>({
    queryKey: ["/api/hr/one-on-one/direct-reports"],
  });

  // Fetch current user's own 1v1 meetings (where they are the direct report)
  const { data: myMeetings = [], isLoading: loadingMyMeetings } = useQuery<Meeting[]>({
    queryKey: ["/api/hr/one-on-one/my-meetings"],
    enabled: viewMode === "my-meetings",
  });

  // Fetch meetings for selected report
  const { data: meetings = [], isLoading: loadingMeetings } = useQuery<Meeting[]>({
    queryKey: ["/api/hr/one-on-one/meetings", selectedReport?.id],
    queryFn: async () => {
      if (!selectedReport?.id) return [];
      const response = await fetch(`/api/hr/one-on-one/meetings/${selectedReport.id}`);
      if (!response.ok) throw new Error("Failed to fetch meetings");
      return response.json();
    },
    enabled: !!selectedReport,
  });

  // Fetch meeting details
  const { data: meetingDetails, isLoading: loadingDetails } = useQuery<{
    meeting: Meeting;
    talkingPoints: TalkingPoint[];
    wins: Win[];
    objectives: Objective[];
    actionItems: ActionItem[];
    goals: Goal[];
    comments: Comment[];
  }>({
    queryKey: ["/api/hr/one-on-one/meetings", selectedMeeting?.id, "details"],
    queryFn: async () => {
      if (!selectedMeeting?.id) return null;
      const response = await fetch(`/api/hr/one-on-one/meetings/${selectedMeeting.id}/details`);
      if (!response.ok) throw new Error("Failed to fetch meeting details");
      return response.json();
    },
    enabled: !!selectedMeeting,
  });

  useEffect(() => {
    if (meetingId && !deepLinkProcessed) {
      fetch(`/api/hr/one-on-one/meetings/${meetingId}/details`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.meeting) {
            setSelectedMeeting(data.meeting);
            setDeepLinkProcessed(true);
          }
        })
        .catch(() => {});
    }
  }, [meetingId, deepLinkProcessed]);

  // Mutation to create a new meeting with mandatory date/time
  const createMeetingMutation = useMutation({
    mutationFn: async (data: { directReportId: string; meetingDate: Date; meetingTime: string; meetingDuration: number; isRecurring?: boolean; recurringFrequency?: string; recurringEndType?: string; recurringEndDate?: string | null; recurringOccurrences?: number }) => {
      const newMeetingData: any = {
        directReportId: data.directReportId,
        meetingDate: format(data.meetingDate, "yyyy-MM-dd"),
        meetingTime: data.meetingTime,
        meetingDuration: data.meetingDuration,
        weekOf: format(startOfWeek(data.meetingDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
      
      if (data.isRecurring) {
        newMeetingData.isRecurring = true;
        newMeetingData.recurringFrequency = data.recurringFrequency;
        newMeetingData.recurringEndType = data.recurringEndType;
        if (data.recurringEndType === "on_date" && data.recurringEndDate) {
          newMeetingData.recurringEndDate = data.recurringEndDate;
        }
        if (data.recurringEndType === "after_occurrences" && data.recurringOccurrences) {
          newMeetingData.recurringOccurrences = data.recurringOccurrences;
        }
      }
      
      const response = await apiRequest("POST", "/api/hr/one-on-one/meetings", newMeetingData);
      return await response.json();
    },
    onSuccess: async (createdMeeting: Meeting) => {
      setSelectedMeeting(createdMeeting);
      setIsCreatingMeeting(false);
      setShowNewMeetingDialog(false);
      
      setNewMeetingDate(undefined);
      setNewMeetingTime("10:00");
      setNewMeetingDuration(60);
      setIsRecurring(false);
      setRecurringFrequency("weekly");
      setRecurringEndType("never");
      setRecurringEndDate(null);
      setRecurringOccurrences(10);
      
      // Invalidate and refetch queries to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ["/api/hr/one-on-one/meetings", selectedReport?.id] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ["/api/hr/one-on-one/meetings", createdMeeting.id, "details"] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: [`/api/hr/one-on-one/meetings/${createdMeeting.id}/kpi-statuses`] 
        }),
      ]);
      
      // Show appropriate toast based on calendar event result
      let toastDescription = "Meeting created successfully";
      if (createdMeeting.calendarEventId) {
        toastDescription = "Meeting created and added to your Google Calendar";
      } else if ((createdMeeting as any).calendarEventError) {
        const errorMsg = (createdMeeting as any).calendarEventError;
        if (errorMsg.includes("two-way sync")) {
          toastDescription = "Meeting created. To sync with Google Calendar, enable two-way sync in Settings > Calendar.";
        } else if (errorMsg.includes("No Google Calendar connection")) {
          toastDescription = "Meeting created. Connect your Google Calendar in Settings to sync events.";
        } else {
          toastDescription = "Meeting created. Calendar sync was unavailable.";
        }
      }
      
      toast({
        title: "Meeting Created",
        variant: "default",
        description: toastDescription,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create meeting",
        variant: "destructive",
      });
      setIsCreatingMeeting(false);
    },
  });

  const handleSelectReport = (report: DirectReport) => {
    setSelectedReport(report);
    setSelectedMeeting(null);
    setIsCreatingMeeting(false);
    setCurrentPage(1); // Reset to first page
  };

  const handleBackToReports = () => {
    setSelectedReport(null);
    setSelectedMeeting(null);
    setIsCreatingMeeting(false);
  };

  const handleBackToMeetings = () => {
    setSelectedMeeting(null);
    setIsCreatingMeeting(false);
  };

  const handleCreateNewMeeting = () => {
    if (!selectedReport?.id) return;
    // Open the dialog to let user select date/time
    setShowNewMeetingDialog(true);
  };
  
  const handleConfirmCreateMeeting = () => {
    if (!selectedReport?.id || !newMeetingDate) {
      toast({
        title: "Required Fields",
        description: "Please select a date and time for the meeting",
        variant: "destructive",
      });
      return;
    }
    
    if (isRecurring && recurringEndType === "on_date" && !recurringEndDate) {
      toast({ title: "Please select an end date for recurring meetings", variant: "destructive" });
      return;
    }
    if (isRecurring && recurringEndType === "after_occurrences" && (!recurringOccurrences || recurringOccurrences < 1)) {
      toast({ title: "Number of occurrences must be at least 1", variant: "destructive" });
      return;
    }
    
    setIsCreatingMeeting(true);
    createMeetingMutation.mutate({
      directReportId: selectedReport.id,
      meetingDate: newMeetingDate,
      meetingTime: newMeetingTime,
      meetingDuration: newMeetingDuration,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      recurringEndType: isRecurring ? recurringEndType : undefined,
      recurringEndDate: isRecurring && recurringEndType === "on_date" && recurringEndDate
        ? format(recurringEndDate, "yyyy-MM-dd")
        : null,
      recurringOccurrences: isRecurring && recurringEndType === "after_occurrences"
        ? recurringOccurrences
        : undefined,
    });
  };
  
  const handleCancelNewMeetingDialog = () => {
    setShowNewMeetingDialog(false);
    setNewMeetingDate(undefined);
    setNewMeetingTime("10:00");
    setNewMeetingDuration(60);
    setIsRecurring(false);
    setRecurringFrequency("weekly");
    setRecurringEndType("never");
    setRecurringEndDate(null);
    setRecurringOccurrences(10);
  };

  const handleSelectMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsCreatingMeeting(false);
  };

  // Tab Navigation Component
  const TabNavigation = () => (
    <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6" style={{ width: 'fit-content' }}>
      {directReports.length > 0 && (
        <button
          onClick={() => {
            setViewMode("my-direct-reports");
            setSelectedReport(null);
            setSelectedMeeting(null);
            setIsCreatingMeeting(false);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            viewMode === "my-direct-reports"
              ? "text-white shadow-sm"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
          style={viewMode === "my-direct-reports" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
          data-testid="tab-my-direct-reports"
        >
          <Users className="h-4 w-4" />
          My Direct Reports
        </button>
      )}
      <button
        onClick={() => {
          setViewMode("my-meetings");
          setSelectedReport(null);
          setSelectedMeeting(null);
          setIsCreatingMeeting(false);
        }}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          viewMode === "my-meetings"
            ? "text-white shadow-sm"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        }`}
        style={viewMode === "my-meetings" ? { backgroundColor: "hsl(179, 100%, 39%)" } : {}}
        data-testid="tab-my-meetings"
      >
        <CalendarIcon className="h-4 w-4" />
        My 1v1 Meetings
      </button>
    </div>
  );

  if (loadingReports) {
    return <div className="flex items-center justify-center p-12">Loading...</div>;
  }

  // MY MEETINGS VIEW
  if (viewMode === "my-meetings") {
    if (loadingMyMeetings) {
      return (
        <div className="space-y-6">
          <TabNavigation />
          <div className="flex items-center justify-center p-12">Loading meetings...</div>
        </div>
      );
    }

    // If a specific meeting is selected, show the detail view
    if (selectedMeeting) {
      return (
        <MeetingEditor
          directReport={null}
          meeting={selectedMeeting}
          meetingDetails={meetingDetails}
          onBack={handleBackToMeetings}
          onSave={handleBackToMeetings}
          viewMode="my-meetings"
        />
      );
    }

    // Show list of user's own 1v1 meetings
    const totalPages = Math.ceil(myMeetings.length / meetingsPerPage);
    const startIndex = (currentPage - 1) * meetingsPerPage;
    const paginatedMeetings = myMeetings.slice(startIndex, startIndex + meetingsPerPage);

    return (
      <div className="space-y-6">
        <TabNavigation />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              My 1v1 Meetings
            </CardTitle>
            <CardDescription>
              View your 1v1 meeting history and progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myMeetings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No 1v1 meetings yet.</p>
                <p className="text-sm mt-2">Your manager will create meetings for you.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paginatedMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      onClick={() => handleSelectMeeting(meeting)}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      data-testid={`meeting-card-${meeting.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-semibold">
                                {format(parseISO(meeting.meetingDate), "MMMM d, yyyy")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Week of {format(parseISO(meeting.weekOf), "MMM d, yyyy")}
                              </p>
                            </div>
                            {meeting.isRecurring && (
                              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                <Repeat className="h-3 w-3" />
                                {meeting.recurringFrequency === "weekly" ? "Weekly" : meeting.recurringFrequency === "biweekly" ? "Biweekly" : "Monthly"}
                              </Badge>
                            )}
                            {meeting.feeling && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <span>{FEELING_OPTIONS.find(f => f.value === meeting.feeling)?.emoji}</span>
                                <span>{FEELING_OPTIONS.find(f => f.value === meeting.feeling)?.label}</span>
                              </Badge>
                            )}
                            {meeting.performancePoints !== null && (
                              <Badge variant="outline">
                                <Star className="h-3 w-3 mr-1" />
                                {meeting.performancePoints}/5
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(startIndex + meetingsPerPage, myMeetings.length)} of {myMeetings.length} meetings
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // MY DIRECT REPORTS VIEW - Show empty state if no direct reports AND in direct-reports mode
  if (viewMode === "my-direct-reports" && directReports.length === 0) {
    return (
      <div className="space-y-6">
        <TabNavigation />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Direct Reports
            </CardTitle>
            <CardDescription>
              Track weekly meetings and development progress with your direct reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You don't have any direct reports assigned.</p>
              <p className="text-sm mt-2">Switch to "My 1v1 Meetings" to view your own meeting history.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View: Direct Reports List
  if (!selectedReport) {
    return (
      <div className="space-y-6">
        <TabNavigation />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Direct Reports
            </CardTitle>
            <CardDescription>
              Select a team member to view and manage their 1v1 meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {directReports.map((report) => (
                <Card
                  key={report.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectReport(report)}
                  data-testid={`card-direct-report-${report.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={report.profileImagePath ? `/objects${report.profileImagePath}` : undefined} />
                        <AvatarFallback>
                          {report.firstName[0]}{report.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{report.firstName} {report.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{report.position || "Staff"}</p>
                        {report.department && (
                          <p className="text-xs text-muted-foreground mt-1">{report.department}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View: Meetings List for Selected Report
  if (selectedReport && !selectedMeeting && !isCreatingMeeting) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={handleBackToReports}
          className="mb-4"
          data-testid="button-back-to-reports"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Direct Reports
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedReport.profileImagePath ? `/objects${selectedReport.profileImagePath}` : undefined} />
                  <AvatarFallback>
                    {selectedReport.firstName[0]}{selectedReport.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedReport.firstName} {selectedReport.lastName}</CardTitle>
                  <CardDescription>{selectedReport.position || "Staff"}</CardDescription>
                </div>
              </div>
              <Button
                onClick={handleCreateNewMeeting}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-create-meeting"
                disabled={createMeetingMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createMeetingMutation.isPending ? "Creating..." : "New 1v1 Meeting"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingMeetings ? (
              <div className="text-center py-8">Loading meetings...</div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No meetings yet.</p>
                <p className="text-sm mt-2">Create your first 1-on-1 meeting to get started.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {meetings
                    .slice((currentPage - 1) * meetingsPerPage, currentPage * meetingsPerPage)
                    .map((meeting) => (
                      <Card
                        key={meeting.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleSelectMeeting(meeting)}
                        data-testid={`card-meeting-${meeting.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <CalendarIcon className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">
                                  Week of {format(parseISO(meeting.weekOf), "MMM d, yyyy")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Meeting date: {format(parseISO(meeting.meetingDate), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {meeting.isRecurring && (
                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                  <Repeat className="h-3 w-3" />
                                  {meeting.recurringFrequency === "weekly" ? "Weekly" : meeting.recurringFrequency === "biweekly" ? "Biweekly" : "Monthly"}
                                </Badge>
                              )}
                              {meeting.feeling && (
                                <Badge variant="outline" className="text-lg">
                                  {FEELING_OPTIONS.find(f => f.value === meeting.feeling)?.emoji}
                                </Badge>
                              )}
                              {meeting.performancePoints && (
                                <Badge variant="secondary">
                                  {meeting.performancePoints + (meeting.bonusPoints || 0)} pts
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Pagination Controls */}
                {meetings.length > meetingsPerPage && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * meetingsPerPage) + 1} to {Math.min(currentPage * meetingsPerPage, meetings.length)} of {meetings.length} meetings
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.ceil(meetings.length / meetingsPerPage) }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first page, last page, current page, and pages around current
                            const totalPages = Math.ceil(meetings.length / meetingsPerPage);
                            return page === 1 || 
                                   page === totalPages || 
                                   Math.abs(page - currentPage) <= 1;
                          })
                          .map((page, index, array) => (
                            <>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span key={`ellipsis-${page}`} className="px-2">...</span>
                              )}
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-8 h-8 p-0"
                                data-testid={`button-page-${page}`}
                              >
                                {page}
                              </Button>
                            </>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(meetings.length / meetingsPerPage), prev + 1))}
                        disabled={currentPage >= Math.ceil(meetings.length / meetingsPerPage)}
                        data-testid="button-next-page"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        {/* New Meeting Dialog with mandatory date/time */}
        <Dialog open={showNewMeetingDialog} onOpenChange={setShowNewMeetingDialog}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Schedule 1v1 Meeting
              </DialogTitle>
              <DialogDescription>
                Select a date and time for your meeting with {selectedReport?.firstName} {selectedReport?.lastName}. 
                A calendar event will be created automatically.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Date Picker */}
              <div className="grid gap-2">
                <Label htmlFor="meeting-date" className="text-sm font-medium">
                  Meeting Date <span className="text-red-500">*</span>
                </Label>
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      id="meeting-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newMeetingDate && "text-muted-foreground"
                      )}
                      data-testid="button-select-meeting-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newMeetingDate ? format(newMeetingDate, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999] pointer-events-auto" align="start">
                    <Calendar
                      mode="single"
                      selected={newMeetingDate}
                      onSelect={setNewMeetingDate}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Time Picker */}
              <div className="grid gap-2">
                <Label htmlFor="meeting-time" className="text-sm font-medium">
                  Meeting Time <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="meeting-time"
                    type="time"
                    value={newMeetingTime}
                    onChange={(e) => setNewMeetingTime(e.target.value)}
                    className="flex-1"
                    data-testid="input-meeting-time"
                  />
                </div>
              </div>
              
              {/* Duration Picker */}
              <div className="grid gap-2">
                <Label htmlFor="meeting-duration" className="text-sm font-medium">
                  Duration
                </Label>
                <Select
                  value={newMeetingDuration.toString()}
                  onValueChange={(value) => setNewMeetingDuration(parseInt(value))}
                >
                  <SelectTrigger id="meeting-duration" data-testid="select-meeting-duration">
                    <SelectValue placeholder="Select duration" />
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
              
              {/* Recurring Meeting Options */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="recurring-toggle-1on1" className="cursor-pointer font-medium">Recurring Meeting</Label>
                  </div>
                  <Switch
                    id="recurring-toggle-1on1"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>
                {isRecurring && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Frequency</Label>
                        <Select
                          value={recurringFrequency}
                          onValueChange={setRecurringFrequency}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Ends</Label>
                        <Select
                          value={recurringEndType}
                          onValueChange={setRecurringEndType}
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
                    {recurringEndType === "after_occurrences" && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Number of Occurrences</Label>
                        <Input
                          type="number"
                          min={1}
                          max={520}
                          value={recurringOccurrences}
                          onChange={(e) => setRecurringOccurrences(parseInt(e.target.value) || 1)}
                          placeholder="e.g. 10"
                        />
                      </div>
                    )}
                    {recurringEndType === "on_date" && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">End Date</Label>
                        <Popover modal={false} open={isRecurringEndDateOpen} onOpenChange={setIsRecurringEndDateOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal text-sm">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {recurringEndDate ? format(recurringEndDate, "MMM d, yyyy") : "Select end date..."}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[9999] pointer-events-auto" align="start">
                            <Calendar
                              mode="single"
                              selected={recurringEndDate || undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setRecurringEndDate(date);
                                  setIsRecurringEndDateOpen(false);
                                }
                              }}
                              disabled={(date) => !newMeetingDate || date <= newMeetingDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelNewMeetingDialog}
                data-testid="button-cancel-meeting"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCreateMeeting}
                disabled={!newMeetingDate || createMeetingMutation.isPending}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-confirm-create-meeting"
              >
                {createMeetingMutation.isPending ? "Creating..." : "Create Meeting"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // View: Meeting Details or Create New Meeting
  if (isCreatingMeeting || selectedMeeting) {
    return (
      <MeetingEditor
        directReport={selectedReport!}
        meeting={selectedMeeting}
        meetingDetails={meetingDetails}
        onBack={handleBackToMeetings}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings"] });
          handleBackToMeetings();
        }}
      />
    );
  }

  return null;
}

// Meeting Editor Component
function MeetingEditor({
  directReport,
  meeting,
  meetingDetails,
  onBack,
  onSave,
  viewMode = "my-direct-reports",
}: {
  directReport: DirectReport | null;
  meeting: Meeting | null;
  meetingDetails?: {
    meeting: Meeting;
    talkingPoints: TalkingPoint[];
    wins: Win[];
    objectives: Objective[];
    actionItems: ActionItem[];
    goals: Goal[];
    comments: Comment[];
  };
  onBack: () => void;
  onSave: () => void;
  viewMode?: "my-direct-reports" | "my-meetings";
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const liveMeeting = meetingDetails?.meeting ?? meeting;

  // Fetch current authenticated user (for "My 1v1 Meetings" view)
  const { data: authUser, isLoading: loadingAuthUser } = useQuery<{ id: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/current-user'],
    enabled: viewMode === "my-meetings" && !directReport,
  });

  // Fetch current user's staff profile (for getting position in "My 1v1 Meetings" view)
  const { data: currentUserStaffProfile, isLoading: loadingStaffProfile } = useQuery<DirectReport>({
    queryKey: ["/api/staff", authUser?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/staff/${authUser?.id}`);
      return await response.json();
    },
    enabled: viewMode === "my-meetings" && !directReport && !!authUser?.id,
  });

  // In "My 1v1 Meetings" view without directReport, wait for user data to load before proceeding
  const isLoadingUserData = viewMode === "my-meetings" && !directReport && (loadingAuthUser || (authUser && loadingStaffProfile));

  // Compute staff position safely: use directReport if available, otherwise use current user's position
  const staffPosition = directReport?.position ?? currentUserStaffProfile?.position ?? null;

  // Compute directReportId safely for mutations: use directReport if available, otherwise use meeting data or current user
  const directReportId = directReport?.id ?? meeting?.directReportId ?? authUser?.id ?? "";

  // Fetch progression statuses
  const { data: progressionStatuses = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/one-on-one/progression-statuses"],
  });

  // Form states
  const [meetingDate, setMeetingDate] = useState(
    meeting?.meetingDate || format(new Date(), "yyyy-MM-dd")
  );
  const [meetingTime, setMeetingTime] = useState(meeting?.meetingTime || "09:00");
  const [meetingDuration, setMeetingDuration] = useState(meeting?.meetingDuration || 30);
  const [weekOf, setWeekOf] = useState(
    meeting?.weekOf || format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [feeling, setFeeling] = useState(meeting?.feeling || "");
  const [performanceFeedback, setPerformanceFeedback] = useState(meeting?.performanceFeedback || "");
  const [bonusPoints, setBonusPoints] = useState(meeting?.bonusPoints || 0);
  const [progressionStatus, setProgressionStatus] = useState(meeting?.progressionStatus || "none");
  const [hobbies, setHobbies] = useState(meeting?.hobbies || "");
  const [family, setFamily] = useState(meeting?.family || "");
  const [privateNotes, setPrivateNotes] = useState(meeting?.privateNotes || "");
  const [recordingLink, setRecordingLink] = useState(meeting?.recordingLink || "");
  
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Convert to Task dialog state
  const [showConvertToTaskDialog, setShowConvertToTaskDialog] = useState(false);
  const [actionItemToConvert, setActionItemToConvert] = useState<ActionItem | null>(null);
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>("");
  
  // Fetch all active staff for task assignment
  const { data: allStaff = [] } = useQuery<DirectReport[]>({
    queryKey: ["/api/staff"],
  });
  
  // Filter to only active staff (those without a termination date or similar indicator)
  const activeStaff = allStaff.filter((s: any) => s.isActive !== false);
  
  // Lists
  const [talkingPoints, setTalkingPoints] = useState<TalkingPoint[]>([]);
  const [wins, setWins] = useState<Win[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Update lists when meetingDetails loads
  useEffect(() => {
    if (meetingDetails) {
      setTalkingPoints(meetingDetails.talkingPoints || []);
      setWins(meetingDetails.wins || []);
      setObjectives(meetingDetails.objectives || []);
      setActionItems(meetingDetails.actionItems || []);
      setGoals(meetingDetails.goals || []);
      setComments(meetingDetails.comments || []);
      
      // Also update the meeting fields when data loads
      if (meetingDetails.meeting) {
        setPrivateNotes(meetingDetails.meeting.privateNotes || "");
        setHobbies(meetingDetails.meeting.hobbies || "");
        setFamily(meetingDetails.meeting.family || "");
        setRecordingLink(meetingDetails.meeting.recordingLink || "");
        setFeeling(meetingDetails.meeting.feeling || "");
        setPerformanceFeedback(meetingDetails.meeting.performanceFeedback || "");
        setBonusPoints(meetingDetails.meeting.bonusPoints || 0);
        setProgressionStatus(meetingDetails.meeting.progressionStatus || "none");
      }
    }
  }, [meetingDetails]);
  
  // New item inputs
  const [newTalkingPoint, setNewTalkingPoint] = useState("");
  const [newTalkingPointNotes, setNewTalkingPointNotes] = useState("");
  const [expandedTalkingPointId, setExpandedTalkingPointId] = useState<string | null>(null);
  const [newWin, setNewWin] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [newActionItem, setNewActionItem] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newComment, setNewComment] = useState("");

  // Mutations for individual items
  const createTalkingPointMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/hr/one-on-one/talking-points", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
    },
  });

  const createWinMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/hr/one-on-one/wins", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
    },
  });

  const deleteWinMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/hr/one-on-one/wins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
    },
  });

  const createObjectiveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/hr/one-on-one/objectives", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
    },
  });

  const deleteObjectiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/hr/one-on-one/objectives/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
    },
  });

  const createActionItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/hr/one-on-one/action-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/hr/one-on-one/goals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/hr/one-on-one/comments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
      toast({ title: "Comment added successfully" });
    },
  });

  const updateGoalStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PUT", `/api/hr/one-on-one/goals/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
    },
  });

  const updateTalkingPointMutation = useMutation({
    mutationFn: async ({ id, isCompleted, notes }: { id: string; isCompleted?: boolean; notes?: string }) => {
      const updates: any = {};
      if (isCompleted !== undefined) updates.isCompleted = isCompleted;
      if (notes !== undefined) updates.notes = notes;
      return await apiRequest("PUT", `/api/hr/one-on-one/talking-points/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
    },
  });

  const updateActionItemMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      return await apiRequest("PUT", `/api/hr/one-on-one/action-items/${id}`, { isCompleted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
    },
  });

  // Convert action item to task mutation
  const convertToTaskMutation = useMutation({
    mutationFn: async ({ actionItemId, title, assignedTo }: { actionItemId: string; title: string; assignedTo: string }) => {
      // Create the task
      const taskResponse = await apiRequest("POST", "/api/tasks", {
        title,
        assignedTo,
        status: "todo",
        priority: "medium",
        description: `Converted from 1v1 meeting action item`,
      });
      const task = await taskResponse.json();
      
      // Update the action item with the task ID
      await apiRequest("PUT", `/api/hr/one-on-one/action-items/${actionItemId}`, {
        taskId: task.id,
      });
      
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", meeting?.id, "details"] });
      toast({
        title: "Task Created",
        description: "Action item has been converted to a task successfully.",
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
  const handleOpenConvertToTask = (item: ActionItem) => {
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

  // Save meeting mutation
  const saveMeetingMutation = useMutation({
    mutationFn: async (data: any) => {
      if (meeting) {
        const response = await apiRequest("PUT", `/api/hr/one-on-one/meetings/${meeting.id}`, data);
        return { isNew: false, meeting: await response.json() };
      } else {
        const response = await apiRequest("POST", "/api/hr/one-on-one/meetings", data);
        return { isNew: true, meeting: await response.json() };
      }
    },
    onSuccess: async (result: any) => {
      const { isNew, meeting: savedMeeting } = result;
      
      // If this was a new meeting and we have items to save, save them now
      if (isNew && savedMeeting.id) {
        // Save all talking points
        for (const point of talkingPoints) {
          await apiRequest("POST", "/api/hr/one-on-one/talking-points", {
            meetingId: savedMeeting.id,
            content: point.content,
            orderIndex: point.orderIndex,
            isCompleted: point.isCompleted || false,
          });
        }
        
        // Save all wins
        for (const win of wins) {
          await apiRequest("POST", "/api/hr/one-on-one/wins", {
            meetingId: savedMeeting.id,
            content: win.content,
            orderIndex: win.orderIndex,
          });
        }
        
        // Save all objectives
        for (const objective of objectives) {
          await apiRequest("POST", "/api/hr/one-on-one/objectives", {
            meetingId: savedMeeting.id,
            content: objective.content,
            orderIndex: objective.orderIndex,
          });
        }
        
        // Save all action items
        for (const item of actionItems) {
          await apiRequest("POST", "/api/hr/one-on-one/action-items", {
            meetingId: savedMeeting.id,
            content: item.content,
            assignedTo: item.assignedTo,
            dueDate: item.dueDate,
            isCompleted: item.isCompleted || false,
          });
        }
        
        // Save all goals
        for (const goal of goals) {
          await apiRequest("POST", "/api/hr/one-on-one/goals", {
            meetingId: savedMeeting.id,
            directReportId: directReportId,
            content: goal.content,
            status: goal.status,
          });
        }
      }
      
      // Check for calendar sync errors
      if (result.meeting?.calendarSyncError) {
        toast({
          title: meeting ? "Meeting Updated" : "Meeting Created",
          description: `${meeting ? "Meeting updated" : "Meeting created"}, but there was an issue syncing with Google Calendar.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          variant: "default",
          description: meeting ? "Meeting updated successfully" : "Meeting created successfully",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings"] });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save meeting",
        variant: "destructive",
      });
    },
  });

  // Delete meeting mutation
  const deleteMeetingMutation = useMutation({
    mutationFn: async () => {
      if (!meeting) throw new Error("No meeting to delete");
      const response = await apiRequest("DELETE", `/api/hr/one-on-one/meetings/${meeting.id}`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings"] });
      setShowDeleteDialog(false);
      
      if (data.googleDeleteError) {
        toast({
          title: "Meeting Deleted",
          description: "The meeting was deleted, but there was an issue removing the Google Calendar event. You may need to manually remove it from your calendar.",
          variant: "default",
        });
      } else if (data.calendarDeleted === false) {
        toast({
          title: "Meeting Deleted",
          description: "The meeting was deleted, but some calendar events may not have been removed.",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          variant: "default",
          description: "Meeting and calendar events deleted successfully.",
        });
      }
      onBack();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meeting",
        variant: "destructive",
      });
    },
  });

  const startMeetingMutation = useMutation({
    mutationFn: async () => {
      if (!liveMeeting) throw new Error("No meeting");
      const res = await apiRequest("POST", `/api/hr/one-on-one/meetings/${liveMeeting.id}/start`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/active-timer"] });
      if (liveMeeting) {
        queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", liveMeeting.id, "details"] });
      }
      try { new BroadcastChannel('agencyboost-meeting-timer').postMessage({ type: 'MEETING_STARTED' }); } catch {}
      toast({ title: "Meeting started", description: "Timer is now running for both participants." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to start meeting", description: error.message, variant: "destructive" });
    },
  });

  const finishMeetingMutation = useMutation({
    mutationFn: async () => {
      if (!liveMeeting) throw new Error("No meeting");
      const res = await apiRequest("POST", `/api/hr/one-on-one/meetings/${liveMeeting.id}/finish`);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/active-timer"] });
      if (liveMeeting) {
        queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", liveMeeting.id, "details"] });
      }
      const mins = Math.floor((data.durationSeconds || 0) / 60);
      const secs = (data.durationSeconds || 0) % 60;
      let desc = `Duration: ${mins}m ${secs}s. Time entries created for ${data.timeEntriesCreated} participant(s).`;
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
    mutationFn: async () => {
      if (!liveMeeting) throw new Error("No meeting");
      const res = await apiRequest("POST", `/api/hr/one-on-one/meetings/${liveMeeting.id}/reset-timer`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/active-timer"] });
      if (liveMeeting) {
        queryClient.invalidateQueries({ queryKey: ["/api/hr/one-on-one/meetings", liveMeeting.id, "details"] });
      }
      toast({ title: "Timer reset" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to reset timer", description: error.message, variant: "destructive" });
    },
  });

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!liveMeeting?.meetingStartedAt || liveMeeting?.meetingEndedAt) {
      setElapsed(0);
      return;
    }
    const startTime = new Date(liveMeeting.meetingStartedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [liveMeeting?.meetingStartedAt, liveMeeting?.meetingEndedAt]);

  const formatElapsed = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleDelete = () => {
    deleteMeetingMutation.mutate();
  };

  const handleSave = () => {
    const performancePoints = PERFORMANCE_OPTIONS.find(
      p => p.value === performanceFeedback
    )?.points || 0;

    saveMeetingMutation.mutate({
      directReportId: directReportId,
      meetingDate,
      meetingTime,
      meetingDuration,
      weekOf,
      feeling: feeling || null,
      performanceFeedback: performanceFeedback || null,
      performancePoints,
      bonusPoints,
      progressionStatus: progressionStatus === "none" ? null : progressionStatus,
      hobbies: hobbies || null,
      family: family || null,
      privateNotes: privateNotes || null,
      recordingLink: recordingLink || null,
    });
  };

  // Handlers for adding items
  const handleAddTalkingPoint = () => {
    if (!newTalkingPoint.trim()) return;
    
    if (meeting) {
      // Existing meeting - save to API
      createTalkingPointMutation.mutate({
        meetingId: meeting.id,
        content: newTalkingPoint.trim(),
        orderIndex: talkingPoints.length,
        notes: newTalkingPointNotes.trim() || undefined,
      });
      setNewTalkingPoint("");
      setNewTalkingPointNotes("");
    } else {
      // New meeting - add to local state
      const tempId = `temp-${Date.now()}`;
      setTalkingPoints([...talkingPoints, {
        id: tempId,
        meetingId: "",
        content: newTalkingPoint.trim(),
        addedBy: "",
        orderIndex: talkingPoints.length,
        isCompleted: false,
        notes: newTalkingPointNotes.trim() || undefined,
      }]);
      setNewTalkingPoint("");
      setNewTalkingPointNotes("");
    }
  };
  
  const handleUpdateTalkingPointNotes = (pointId: string, notes: string) => {
    // Update local state
    setTalkingPoints(talkingPoints.map(p => 
      p.id === pointId ? { ...p, notes: notes || undefined } : p
    ));
    
    // Update in database if meeting is saved
    if (meeting && !pointId.startsWith('temp-')) {
      updateTalkingPointMutation.mutate({ id: pointId, notes: notes || undefined });
    }
  };

  const handleAddWin = () => {
    if (!newWin.trim()) return;
    
    if (meeting) {
      createWinMutation.mutate({
        meetingId: meeting.id,
        content: newWin.trim(),
        orderIndex: wins.length,
      });
      setNewWin("");
    } else {
      const tempId = `temp-${Date.now()}`;
      setWins([...wins, {
        id: tempId,
        meetingId: "",
        content: newWin.trim(),
        addedBy: "",
        orderIndex: wins.length,
      }]);
      setNewWin("");
    }
  };

  const handleDeleteWin = (winId: string) => {
    if (meeting) {
      deleteWinMutation.mutate(winId);
    }
    setWins(wins.filter(w => w.id !== winId));
  };

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    
    if (meeting) {
      createObjectiveMutation.mutate({
        meetingId: meeting.id,
        content: newObjective.trim(),
        orderIndex: objectives.length,
      });
      setNewObjective("");
    } else {
      const tempId = `temp-${Date.now()}`;
      setObjectives([...objectives, {
        id: tempId,
        meetingId: "",
        content: newObjective.trim(),
        addedBy: "",
        orderIndex: objectives.length,
      }]);
      setNewObjective("");
    }
  };

  const handleDeleteObjective = (objectiveId: string) => {
    if (meeting) {
      deleteObjectiveMutation.mutate(objectiveId);
    }
    setObjectives(objectives.filter(o => o.id !== objectiveId));
  };

  const handleAddActionItem = () => {
    if (!newActionItem.trim()) return;
    
    if (meeting) {
      // Existing meeting - save to API
      createActionItemMutation.mutate({
        meetingId: meeting.id,
        content: newActionItem.trim(),
      });
      setNewActionItem("");
    } else {
      // New meeting - add to local state
      const tempId = `temp-${Date.now()}`;
      setActionItems([...actionItems, {
        id: tempId,
        meetingId: "",
        content: newActionItem.trim(),
        isCompleted: false,
      }]);
      setNewActionItem("");
    }
  };

  const handleAddGoal = () => {
    if (!newGoal.trim()) return;
    
    if (meeting) {
      // Existing meeting - save to API
      createGoalMutation.mutate({
        meetingId: meeting.id,
        directReportId: directReportId,
        content: newGoal.trim(),
        status: "pending",
      });
      setNewGoal("");
    } else {
      // New meeting - add to local state
      const tempId = `temp-${Date.now()}`;
      setGoals([...goals, {
        id: tempId,
        meetingId: "",
        directReportId: directReportId,
        content: newGoal.trim(),
        status: "pending",
      }]);
      setNewGoal("");
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !meeting) return;
    
    createCommentMutation.mutate({
      meetingId: meeting.id,
      content: newComment.trim(),
    });
    setNewComment("");
  };

  const handleUpdateGoalStatus = (goalId: string, newStatus: string) => {
    if (meeting) {
      updateGoalStatusMutation.mutate({ id: goalId, status: newStatus });
    }
    // Update local state
    setGoals(goals.map(g => g.id === goalId ? { ...g, status: newStatus } : g));
  };

  const handleToggleTalkingPoint = (pointId: string) => {
    const point = talkingPoints.find(p => p.id === pointId);
    if (!point) return;
    
    const newStatus = !point.isCompleted;
    
    // Update local state
    setTalkingPoints(talkingPoints.map(p => 
      p.id === pointId ? { ...p, isCompleted: newStatus } : p
    ));
    
    // Update in database if meeting is saved
    if (meeting) {
      updateTalkingPointMutation.mutate({ id: pointId, isCompleted: newStatus });
    }
  };

  const handleToggleActionItem = (itemId: string) => {
    const item = actionItems.find(i => i.id === itemId);
    if (!item) return;
    
    const newStatus = !item.isCompleted;
    
    // Update local state
    setActionItems(actionItems.map(i => 
      i.id === itemId ? { ...i, isCompleted: newStatus } : i
    ));
    
    // Update in database if meeting is saved
    if (meeting) {
      updateActionItemMutation.mutate({ id: itemId, isCompleted: newStatus });
    }
  };

  const isReadOnly = false;

  // Show loading state while fetching user data in "My 1v1 Meetings" view
  if (isLoadingUserData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            data-testid="button-back-to-meetings"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to My Meetings
          </Button>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading meeting details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Validate directReportId before allowing mutations
  if (!directReportId && viewMode === "my-meetings") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            data-testid="button-back-to-meetings"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to My Meetings
          </Button>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="text-center text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-4" />
            <p>Unable to load user profile. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          data-testid="button-back-to-meetings"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {viewMode === "my-meetings" ? "Back to My Meetings" : "Back to Meetings"}
        </Button>
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            {meeting && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                disabled={deleteMeetingMutation.isPending}
                data-testid="button-delete-meeting"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90"
              disabled={saveMeetingMutation.isPending}
              data-testid="button-save-meeting"
            >
              {saveMeetingMutation.isPending ? "Saving..." : meeting ? "Update Meeting" : "Create Meeting"}
            </Button>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete 1-on-1 Meeting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this meeting? This will also remove the associated calendar events. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMeetingMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMeetingMutation.isPending ? "Deleting..." : "Delete Meeting"}
            </Button>
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
              <Label htmlFor="assignee">Assign To</Label>
              <Select value={taskAssigneeId} onValueChange={setTaskAssigneeId}>
                <SelectTrigger id="assignee" data-testid="select-task-assignee">
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
                        <span>{staff.firstName} {staff.lastName}</span>
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
              data-testid="button-cancel-convert"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertToTask}
              disabled={!taskAssigneeId || convertToTaskMutation.isPending}
              className="bg-[#00C9C6] hover:bg-[#00a8a6] text-white"
              data-testid="button-confirm-convert"
            >
              {convertToTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Meeting Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                {directReport && (
                  <>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={directReport.profileImagePath ? `/objects${directReport.profileImagePath}` : undefined} />
                      <AvatarFallback>
                        {directReport.firstName[0]}{directReport.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>1-on-1 Meeting</CardTitle>
                      <CardDescription>{directReport.firstName} {directReport.lastName}</CardDescription>
                    </div>
                  </>
                )}
                {!directReport && (
                  <div>
                    <CardTitle>My 1-on-1 Meeting</CardTitle>
                    <CardDescription>{format(new Date(meetingDate), "MMMM d, yyyy")}</CardDescription>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Meeting Timer Controls */}
              {liveMeeting && (
                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Timer className="h-5 w-5 text-muted-foreground" />
                    {liveMeeting.meetingEndedAt ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                          Completed
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Duration: {formatElapsed(Math.floor((new Date(liveMeeting.meetingEndedAt).getTime() - new Date(liveMeeting.meetingStartedAt!).getTime()) / 1000))}
                        </span>
                      </div>
                    ) : liveMeeting.meetingStartedAt ? (
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
                        Start the meeting to track time for both participants
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!liveMeeting.meetingStartedAt && !liveMeeting.meetingEndedAt && (
                      <Button
                        onClick={() => startMeetingMutation.mutate()}
                        disabled={startMeetingMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {startMeetingMutation.isPending ? "Starting..." : "Start Meeting"}
                      </Button>
                    )}
                    {liveMeeting.meetingStartedAt && !liveMeeting.meetingEndedAt && (
                      <>
                        <Button
                          onClick={() => resetTimerMutation.mutate()}
                          disabled={resetTimerMutation.isPending}
                          variant="ghost"
                          size="sm"
                          title="Reset timer"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => finishMeetingMutation.mutate()}
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
              {/* Meeting Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="meeting-date">Meeting Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="meeting-date"
                        variant="outline"
                        disabled={isReadOnly}
                        data-testid="input-meeting-date"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !meetingDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {meetingDate ? format(parseISO(meetingDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={meetingDate ? parseISO(meetingDate) : undefined}
                        onSelect={(date) => date && setMeetingDate(format(date, "yyyy-MM-dd"))}
                        disabled={isReadOnly}
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
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    disabled={isReadOnly}
                    data-testid="input-meeting-time"
                  />
                </div>
                <div>
                  <Label htmlFor="meeting-duration">Duration</Label>
                  <Select
                    value={meetingDuration.toString()}
                    onValueChange={(value) => setMeetingDuration(parseInt(value))}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger id="meeting-duration" data-testid="select-meeting-duration">
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
                  <Label htmlFor="week-of">Week Of</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="week-of"
                        variant="outline"
                        disabled={isReadOnly}
                        data-testid="input-week-of"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !weekOf && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {weekOf ? format(parseISO(weekOf), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={weekOf ? parseISO(weekOf) : undefined}
                        onSelect={(date) => date && setWeekOf(format(date, "yyyy-MM-dd"))}
                        disabled={isReadOnly}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Separator />

              {/* Feeling Rating */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  {directReport ? `How is ${directReport.firstName} feeling today?` : "How are you feeling?"}
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {FEELING_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => !isReadOnly && setFeeling(option.value)}
                      disabled={isReadOnly}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        feeling === option.value
                          ? "border-primary bg-primary/10"
                          : "border-gray-200 hover:border-primary/50"
                      } ${isReadOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                      data-testid={`button-feeling-${option.value}`}
                    >
                      <div className="text-2xl mb-1">{option.emoji}</div>
                      <div className={`text-sm font-medium ${option.color}`}>{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Objectives */}
              <div>
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Objectives
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" title="Define the meeting's objective" />
                </Label>
                <div className="space-y-2">
                  {objectives.map((objective) => (
                    <div key={objective.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <span className="flex-1">{objective.content}</span>
                      {!isReadOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteObjective(objective.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isReadOnly && (
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
                      <Button
                        size="sm"
                        onClick={handleAddObjective}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Wins */}
              <div>
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Wins
                </Label>
                <div className="space-y-2">
                  {wins.map((win) => (
                    <div key={win.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <span className="flex-1">{win.content}</span>
                      {!isReadOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWin(win.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          data-testid={`button-delete-win-${win.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a win..."
                        value={newWin}
                        onChange={(e) => setNewWin(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddWin();
                          }
                        }}
                        data-testid="input-new-win"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddWin}
                        data-testid="button-add-win"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Talking Points */}
              <div>
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Talking Points
                </Label>
                <div className="space-y-2">
                  {talkingPoints.map((point) => (
                    <div key={point.id} className="bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 p-2">
                        <input
                          type="checkbox"
                          checked={point.isCompleted}
                          onChange={() => handleToggleTalkingPoint(point.id)}
                          className="h-4 w-4 cursor-pointer"
                          data-testid={`checkbox-talking-point-${point.id}`}
                        />
                        <span className={cn("flex-1", point.isCompleted ? "line-through text-muted-foreground" : "")}>
                          {point.content}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedTalkingPointId(expandedTalkingPointId === point.id ? null : point.id)}
                          className={cn(
                            "h-6 w-6 p-0",
                            point.notes ? "text-primary" : "text-muted-foreground hover:text-primary"
                          )}
                          title={point.notes ? "View/edit notes" : "Add notes"}
                          data-testid={`button-notes-talking-point-${point.id}`}
                        >
                          <StickyNote className="h-4 w-4" />
                        </Button>
                      </div>
                      {expandedTalkingPointId === point.id && (
                        <div className="px-2 pb-2">
                          <Textarea
                            placeholder="Add notes for this talking point..."
                            value={point.notes || ""}
                            onChange={(e) => handleUpdateTalkingPointNotes(point.id, e.target.value)}
                            className="min-h-[60px] text-sm bg-white dark:bg-gray-900"
                            data-testid={`textarea-notes-talking-point-${point.id}`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a talking point..."
                        value={newTalkingPoint}
                        onChange={(e) => setNewTalkingPoint(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTalkingPoint();
                          }
                        }}
                        data-testid="input-new-talking-point"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddTalkingPoint}
                        data-testid="button-add-talking-point"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {newTalkingPoint.trim() && (
                      <Textarea
                        placeholder="Add notes (optional)..."
                        value={newTalkingPointNotes}
                        onChange={(e) => setNewTalkingPointNotes(e.target.value)}
                        className="min-h-[60px] text-sm"
                        data-testid="textarea-new-talking-point-notes"
                      />
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Action Items */}
              <div>
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Action Items
                </Label>
                <div className="space-y-2">
                  {actionItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleToggleActionItem(item.id)}
                          className="h-4 w-4 rounded-full cursor-pointer"
                          data-testid={`checkbox-action-item-${item.id}`}
                        />
                        <span className={item.isCompleted ? "line-through text-muted-foreground" : ""}>
                          {item.content}
                        </span>
                      </div>
                      {item.taskId ? (
                        <Link href={`/tasks/${item.taskId}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-[#00C9C6] hover:text-[#00a8a6] hover:bg-[#00C9C6]/10"
                            title="View Task"
                            data-testid={`button-view-task-${item.id}`}
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
                          data-testid={`button-convert-task-${item.id}`}
                        >
                          <Briefcase className="h-3 w-3 mr-1" />
                          Task
                        </Button>
                      )}
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
                      data-testid="input-new-action-item"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddActionItem}
                      data-testid="button-add-action-item"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Position KPIs */}
              <PositionKpisSection 
                staffPosition={staffPosition} 
                meetingId={meeting?.id || null}
              />

              <Separator />

              {/* Goals */}
              <div>
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Goals
                </Label>
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>{goal.content}</span>
                      <Select
                        value={goal.status}
                        onValueChange={(value) => handleUpdateGoalStatus(goal.id, value)}
                      >
                        <SelectTrigger className="w-[140px]" data-testid={`select-goal-status-${goal.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GOAL_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <Badge className={status.color}>{status.label}</Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a goal..."
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddGoal();
                        }
                      }}
                      data-testid="input-new-goal"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddGoal}
                      data-testid="button-add-goal"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Performance Feedback */}
              <div>
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance Feedback
                </Label>
                <div className="space-y-3">
                  {PERFORMANCE_OPTIONS.map((option) => {
                    const descriptions: Record<string, string> = {
                      'on_target': 'Performance is on track and met all the expectations.',
                      'below_expectations': 'Performance has been below expectations since the last 1-on-1.',
                      'far_below_expectations': 'Performance has been significantly below expectations since the last 1-on-1.'
                    };
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => setPerformanceFeedback(option.value)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          performanceFeedback === option.value
                            ? "border-primary bg-primary/10"
                            : "border-gray-200 hover:border-primary/50"
                        }`}
                        data-testid={`button-performance-${option.value}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{option.label}</span>
                          <Badge className={option.color}>{option.points} points</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {descriptions[option.value]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bonus Points */}
              {performanceFeedback && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    {directReport ? `Did ${directReport.firstName} exceed expectations? Add bonus points (optional)` : "Did you exceed expectations? Add bonus points (optional)"}
                  </Label>
                  <Select
                    value={bonusPoints.toString()}
                    onValueChange={(value) => setBonusPoints(parseInt(value))}
                  >
                    <SelectTrigger data-testid="select-bonus-points">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BONUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Comments */}
              <div>
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </Label>
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.authorProfileImagePath ? `/objects${comment.authorProfileImagePath}` : undefined} />
                          <AvatarFallback className="text-xs">
                            {comment.authorFirstName?.[0]}{comment.authorLastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {comment.authorFirstName} {comment.authorLastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm"><LinkifyText text={comment.content} /></p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      rows={2}
                      data-testid="textarea-new-comment"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      data-testid="button-add-comment"
                      disabled={!meeting}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Manager/Admin Only */}
        <div className="space-y-6">
          {/* Progression Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progression Status</CardTitle>
              <CardDescription className="text-xs">Visible to managers and admins</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={progressionStatus}
                onValueChange={setProgressionStatus}
              >
                <SelectTrigger data-testid="select-progression-status">
                  <SelectValue placeholder="Set progression status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {progressionStatuses
                    .filter((status) => status.isActive)
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <Badge className={option.color}>{option.label}</Badge>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Know Better Section - Only show for managers viewing their direct reports */}
          {directReport && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Know {directReport.firstName} Better</CardTitle>
                <CardDescription className="text-xs">Visible to you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm flex items-center gap-2 mb-2">
                    <Briefcase className="h-3 w-3" />
                    Start Date
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {directReport.hireDate
                      ? format(new Date(directReport.hireDate), "MMM d, yyyy")
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm flex items-center gap-2 mb-2">
                    <Cake className="h-3 w-3" />
                    Birthday
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {directReport.birthdate
                      ? format(new Date(directReport.birthdate), "MMM d")
                      : "Not set"}
                  </p>
                </div>
              <div>
                <Label htmlFor="hobbies" className="text-sm flex items-center gap-2 mb-2">
                  <Heart className="h-3 w-3" />
                  Hobbies
                </Label>
                <Textarea
                  id="hobbies"
                  placeholder="Hobbies, personal interests, leisure activities..."
                  value={hobbies}
                  onChange={(e) => setHobbies(e.target.value)}
                  rows={3}
                  data-testid="textarea-hobbies"
                />
              </div>
              <div>
                <Label htmlFor="family" className="text-sm flex items-center gap-2 mb-2">
                  <Users className="h-3 w-3" />
                  Family
                </Label>
                <Textarea
                  id="family"
                  placeholder="Family members, pets..."
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  rows={3}
                  data-testid="textarea-family"
                />
              </div>
            </CardContent>
          </Card>
          )}

          {/* Meeting Recording Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Meeting Recording Link
              </CardTitle>
              <CardDescription className="text-xs">Link to Fathom, Google Meet, or other recording</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="https://..."
                value={recordingLink}
                onChange={(e) => setRecordingLink(e.target.value)}
                data-testid="input-recording-link"
              />
              {recordingLink && (
                <a
                  href={recordingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                >
                  Open recording →
                </a>
              )}
            </CardContent>
          </Card>

          {/* Private Notes - Only visible to managers */}
          {viewMode === "my-direct-reports" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Private Notes
                </CardTitle>
                <CardDescription className="text-xs">Only visible to you and admins</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Private notes about this team member..."
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  rows={8}
                  data-testid="textarea-private-notes"
                />
              </CardContent>
            </Card>
          )}

          {/* Incident Log - Only visible to managers/admins */}
          {viewMode === "my-direct-reports" && directReport && (
            <IncidentLogSection staffId={directReport.id} staffName={`${directReport.firstName} ${directReport.lastName}`} />
          )}
        </div>
      </div>
    </div>
  );
}

const INCIDENT_TYPES = [
  { group: "Progressive Discipline", items: [
    { value: "verbal_warning", label: "Verbal Warning" },
    { value: "written_warning", label: "Written Warning" },
    { value: "final_written_warning", label: "Final Written Warning" },
    { value: "pip_initiated", label: "PIP Initiated" },
    { value: "pip_checkin", label: "PIP Check-in" },
    { value: "pip_passed", label: "PIP Passed" },
    { value: "pip_failed", label: "PIP Failed" },
  ]},
  { group: "Attendance & Conduct", items: [
    { value: "attendance_concern", label: "Attendance Concern" },
    { value: "no_call_no_show", label: "No Call / No Show" },
    { value: "policy_violation", label: "Policy Violation" },
    { value: "code_of_conduct_violation", label: "Code of Conduct Violation" },
  ]},
  { group: "Recognition & Development", items: [
    { value: "commendation", label: "Commendation" },
    { value: "promotion_discussion", label: "Promotion Discussion" },
    { value: "compensation_review", label: "Compensation Review" },
    { value: "role_change", label: "Role Change" },
  ]},
  { group: "Separation", items: [
    { value: "suspension", label: "Suspension" },
    { value: "termination_voluntary", label: "Termination (Voluntary)" },
    { value: "termination_involuntary", label: "Termination (Involuntary)" },
  ]},
];

const INCIDENT_TYPE_MAP: Record<string, string> = {};
INCIDENT_TYPES.forEach(g => g.items.forEach(i => { INCIDENT_TYPE_MAP[i.value] = i.label; }));

function IncidentLogSection({ staffId, staffName }: { staffId: string; staffName: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState({
    incidentType: "",
    status: "open",
    description: "",
    witness: "",
    followUpDate: "",
    employeeAcknowledged: false,
  });

  const { data: incidents = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/staff', staffId, 'incidents'],
    queryFn: async () => {
      const res = await fetch(`/api/staff/${staffId}/incidents`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!staffId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const resp = await apiRequest("POST", `/api/staff/${staffId}/incidents`, data);
      return resp.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/staff', staffId, 'incidents'] });
      toast({ title: "Incident logged successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to create incident", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const resp = await apiRequest("PUT", `/api/staff/incidents/${id}`, data);
      return resp.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/staff', staffId, 'incidents'] });
      toast({ title: "Incident updated successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to update incident", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/staff/incidents/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/staff', staffId, 'incidents'] });
      toast({ title: "Incident deleted" });
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete incident", variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingIncident(null);
    setFormData({ incidentType: "", status: "open", description: "", witness: "", followUpDate: "", employeeAcknowledged: false });
  };

  const openEditDialog = (incident: any) => {
    setEditingIncident(incident);
    setFormData({
      incidentType: incident.incidentType,
      status: incident.status,
      description: incident.description || "",
      witness: incident.witness || "",
      followUpDate: incident.followUpDate || "",
      employeeAcknowledged: incident.employeeAcknowledged || false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.incidentType) {
      toast({ title: "Please select an incident type", variant: "destructive" });
      return;
    }
    const payload = {
      incidentType: formData.incidentType,
      status: formData.status,
      description: formData.description || null,
      witness: formData.witness || null,
      followUpDate: formData.followUpDate || null,
      employeeAcknowledged: formData.employeeAcknowledged,
    };
    if (editingIncident) {
      updateMutation.mutate({ id: editingIncident.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Open</Badge>;
      case "resolved": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
      case "escalated": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Escalated</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Incident Log
              </CardTitle>
              <CardDescription className="text-xs">Only visible to managers and admins</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => { setEditingIncident(null); setFormData({ incidentType: "", status: "open", description: "", witness: "", followUpDate: "", employeeAcknowledged: false }); setDialogOpen(true); }}
              className="bg-primary hover:bg-primary/90 text-white h-7 w-7 p-0"
              data-testid="btn-add-incident"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No incidents logged for {staffName}</p>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident: any) => {
                const isExpanded = expandedIds.has(incident.id);
                const desc = incident.description || "";
                const isLong = desc.length > 120;
                return (
                  <div key={incident.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{INCIDENT_TYPE_MAP[incident.incidentType] || incident.incidentType}</span>
                          {statusBadge(incident.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(incident.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          {incident.createdByFirstName && ` · by ${incident.createdByFirstName} ${incident.createdByLastName || ""}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditDialog(incident)} data-testid={`btn-edit-incident-${incident.id}`}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => setDeleteConfirmId(incident.id)} data-testid={`btn-delete-incident-${incident.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {desc && (
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <p className={!isExpanded && isLong ? "line-clamp-2" : ""}>
                          {desc}
                        </p>
                        {isLong && (
                          <button className="text-xs text-primary hover:underline mt-0.5" onClick={() => toggleExpand(incident.id)}>
                            {isExpanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {incident.witness && (
                        <span>Witness: {incident.witness}</span>
                      )}
                      {incident.followUpDate && (
                        <span>Follow-up: {format(new Date(incident.followUpDate), "MMM d, yyyy")}</span>
                      )}
                      {incident.employeeAcknowledged && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Check className="h-3 w-3" />
                          Acknowledged
                          {incident.employeeAcknowledgedAt && ` · ${format(new Date(incident.employeeAcknowledgedAt), "MMM d, yyyy")}`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Incident Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIncident ? "Edit Incident" : "Log Incident"}</DialogTitle>
            <DialogDescription>
              {editingIncident ? "Update the incident details" : `Log a new incident for ${staffName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Incident Type *</Label>
              <Select value={formData.incidentType} onValueChange={(val) => setFormData(p => ({ ...p, incidentType: val }))}>
                <SelectTrigger data-testid="select-incident-type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map(group => (
                    <SelectGroup key={group.group}>
                      <SelectLabel>{group.group}</SelectLabel>
                      {group.items.map(item => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData(p => ({ ...p, status: val }))}>
                <SelectTrigger data-testid="select-incident-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Notes about the incident..."
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={4}
                data-testid="textarea-incident-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Witness</Label>
              <Input
                placeholder="HR rep or witness name"
                value={formData.witness}
                onChange={(e) => setFormData(p => ({ ...p, witness: e.target.value }))}
                data-testid="input-incident-witness"
              />
            </div>

            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.followUpDate && "text-muted-foreground"
                    )}
                    data-testid="input-incident-followup"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.followUpDate
                      ? format(new Date(formData.followUpDate + "T00:00:00"), "MMM d, yyyy")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.followUpDate ? new Date(formData.followUpDate + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      setFormData(p => ({
                        ...p,
                        followUpDate: date ? format(date, "yyyy-MM-dd") : "",
                      }));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="employee-acknowledged"
                checked={formData.employeeAcknowledged}
                onCheckedChange={(checked) => setFormData(p => ({ ...p, employeeAcknowledged: !!checked }))}
                data-testid="checkbox-incident-acknowledged"
              />
              <Label htmlFor="employee-acknowledged" className="text-sm cursor-pointer">
                Employee Acknowledged
              </Label>
            </div>
            {formData.employeeAcknowledged && !editingIncident?.employeeAcknowledgedAt && (
              <p className="text-xs text-muted-foreground ml-6 -mt-2">Timestamp will be recorded automatically.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary hover:bg-primary/90"
              data-testid="btn-save-incident"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingIncident ? "Update" : "Log Incident"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Incident</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this incident? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteConfirmId !== null) deleteMutation.mutate(deleteConfirmId); }}
              disabled={deleteMutation.isPending}
              data-testid="btn-confirm-delete-incident"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
