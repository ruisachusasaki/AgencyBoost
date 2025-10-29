import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addWeeks } from "date-fns";
import {
  Users,
  Calendar,
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
  ChevronRight
} from "lucide-react";

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
  weekOf: string;
  feeling?: string;
  performanceFeedback?: string;
  performancePoints?: number;
  bonusPoints?: number;
  progressionStatus?: string;
  hobbies?: string;
  family?: string;
  privateNotes?: string;
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
}

interface ActionItem {
  id: string;
  meetingId: string;
  content: string;
  assignedTo?: string;
  dueDate?: string;
  isCompleted: boolean;
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
  { value: "pending", label: "Pending", color: "bg-gray-100 text-gray-800" },
  { value: "on_track", label: "On-Track", color: "bg-blue-100 text-blue-800" },
  { value: "off_track", label: "Off-Track", color: "bg-yellow-100 text-yellow-800" },
  { value: "complete", label: "Complete", color: "bg-green-100 text-green-800" },
];

export default function OneOnOneMeetings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<DirectReport | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const meetingsPerPage = 10;

  // Fetch progression statuses
  const { data: progressionStatuses = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/one-on-one/progression-statuses"],
  });

  // Fetch direct reports
  const { data: directReports = [], isLoading: loadingReports } = useQuery<DirectReport[]>({
    queryKey: ["/api/hr/one-on-one/direct-reports"],
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
    setIsCreatingMeeting(true);
    setSelectedMeeting(null);
  };

  const handleSelectMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsCreatingMeeting(false);
  };

  if (loadingReports) {
    return <div className="flex items-center justify-center p-12">Loading...</div>;
  }

  if (directReports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            1-on-1 Meetings
          </CardTitle>
          <CardDescription>
            Track weekly meetings and development progress with your direct reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You don't have any direct reports assigned.</p>
            <p className="text-sm mt-2">Contact your HR administrator to set up reporting structure.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View: Direct Reports List
  if (!selectedReport) {
    return (
      <div className="space-y-6">
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
                        <AvatarImage src={report.profileImagePath} />
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
                  <AvatarImage src={selectedReport.profileImagePath} />
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
              >
                <Plus className="h-4 w-4 mr-2" />
                New 1-on-1 Meeting
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingMeetings ? (
              <div className="text-center py-8">Loading meetings...</div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                              <Calendar className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">
                                  Week of {format(new Date(meeting.weekOf), "MMM d, yyyy")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Meeting date: {format(new Date(meeting.meetingDate), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
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
}: {
  directReport: DirectReport;
  meeting: Meeting | null;
  meetingDetails?: {
    meeting: Meeting;
    talkingPoints: TalkingPoint[];
    actionItems: ActionItem[];
    goals: Goal[];
    comments: Comment[];
  };
  onBack: () => void;
  onSave: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch progression statuses
  const { data: progressionStatuses = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/one-on-one/progression-statuses"],
  });

  // Form states
  const [meetingDate, setMeetingDate] = useState(
    meeting?.meetingDate || format(new Date(), "yyyy-MM-dd")
  );
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
  
  // Lists
  const [talkingPoints, setTalkingPoints] = useState<TalkingPoint[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Update lists when meetingDetails loads
  useEffect(() => {
    if (meetingDetails) {
      setTalkingPoints(meetingDetails.talkingPoints || []);
      setActionItems(meetingDetails.actionItems || []);
      setGoals(meetingDetails.goals || []);
      setComments(meetingDetails.comments || []);
    }
  }, [meetingDetails]);
  
  // New item inputs
  const [newTalkingPoint, setNewTalkingPoint] = useState("");
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
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      return await apiRequest("PUT", `/api/hr/one-on-one/talking-points/${id}`, { isCompleted });
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
            directReportId: directReport.id,
            content: goal.content,
            status: goal.status,
          });
        }
      }
      
      toast({
        title: "Success",
        description: meeting ? "Meeting updated successfully" : "Meeting created successfully",
      });
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

  const handleSave = () => {
    const performancePoints = PERFORMANCE_OPTIONS.find(
      p => p.value === performanceFeedback
    )?.points || 0;

    saveMeetingMutation.mutate({
      directReportId: directReport.id,
      meetingDate,
      weekOf,
      feeling: feeling || null,
      performanceFeedback: performanceFeedback || null,
      performancePoints,
      bonusPoints,
      progressionStatus: progressionStatus === "none" ? null : progressionStatus,
      hobbies: hobbies || null,
      family: family || null,
      privateNotes: privateNotes || null,
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
      });
      setNewTalkingPoint("");
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
      }]);
      setNewTalkingPoint("");
    }
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
        directReportId: directReport.id,
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
        directReportId: directReport.id,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          data-testid="button-back-to-meetings"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Meetings
        </Button>
        <Button
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90"
          disabled={saveMeetingMutation.isPending}
          data-testid="button-save-meeting"
        >
          {saveMeetingMutation.isPending ? "Saving..." : meeting ? "Update Meeting" : "Create Meeting"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Meeting Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={directReport.profileImagePath} />
                  <AvatarFallback>
                    {directReport.firstName[0]}{directReport.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>1-on-1 Meeting</CardTitle>
                  <CardDescription>{directReport.firstName} {directReport.lastName}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Meeting Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meeting-date">Meeting Date</Label>
                  <Input
                    id="meeting-date"
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    data-testid="input-meeting-date"
                  />
                </div>
                <div>
                  <Label htmlFor="week-of">Week Of</Label>
                  <Input
                    id="week-of"
                    type="date"
                    value={weekOf}
                    onChange={(e) => setWeekOf(e.target.value)}
                    data-testid="input-week-of"
                  />
                </div>
              </div>

              <Separator />

              {/* Feeling Rating */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  How is {directReport.firstName} feeling today?
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {FEELING_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFeeling(option.value)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        feeling === option.value
                          ? "border-primary bg-primary/10"
                          : "border-gray-200 hover:border-primary/50"
                      }`}
                      data-testid={`button-feeling-${option.value}`}
                    >
                      <div className="text-2xl mb-1">{option.emoji}</div>
                      <div className={`text-sm font-medium ${option.color}`}>{option.label}</div>
                    </button>
                  ))}
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
                    <div key={point.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={point.isCompleted}
                        onChange={() => handleToggleTalkingPoint(point.id)}
                        className="h-4 w-4 cursor-pointer"
                        data-testid={`checkbox-talking-point-${point.id}`}
                      />
                      <span className={point.isCompleted ? "line-through text-muted-foreground" : ""}>
                        {point.content}
                      </span>
                    </div>
                  ))}
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
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
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
                    Did {directReport.firstName} exceed expectations? Add bonus points (optional)
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
                          <AvatarImage src={comment.authorProfileImagePath} />
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
                      <p className="text-sm">{comment.content}</p>
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

          {/* Know Better Section */}
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

          {/* Private Notes */}
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
        </div>
      </div>
    </div>
  );
}
