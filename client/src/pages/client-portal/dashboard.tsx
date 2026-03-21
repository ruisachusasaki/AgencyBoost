import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, CheckCircle2, Clock, Users, LogOut, BarChart3, Filter, X, ChevronLeft, ChevronRight, ThumbsUp, MessageCircle, Send, ArrowLeft, Paperclip, User } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientPortalTaskAttachments from "@/components/ClientPortalTaskAttachments";

// Mock client portal user interface
interface ClientPortalUser {
  id: string;
  email: string;
  name: string;
  clientId: string;
  clientName: string;
}

// Task interface for client portal
interface ClientTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  projectName: string | null;
  assigneeName: string | null;
  completedAt: string | null;
  createdAt: string;
  requiresClientApproval?: boolean;
  clientApprovalStatus?: 'pending' | 'approved' | 'changes_requested';
  clientApprovalNotes?: string | null;
  clientApprovalDate?: string | null;
}

// Filter interfaces
interface TaskFilters {
  status: string[];
  priority: string[];
  dateRange: 'all' | 'last7' | 'last30' | 'last90' | 'custom';
  dateFrom?: Date;
  dateTo?: Date;
  dueDateRange: 'all' | 'overdue' | 'thisWeek' | 'thisMonth' | 'custom';
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

const statusLabels: Record<string, string> = {
  todo: "To Do",
  not_started: "Not Started",
  in_progress: "In Progress",
  review: "Review",
  blocked: "Blocked",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On Hold"
};

// Status color mapping
const statusColors: Record<string, string> = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  not_started: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  blocked: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
};

// Priority color mapping
const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

// Available filter options
const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const dateRangeOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last90', label: 'Last 3 Months' },
  { value: 'custom', label: 'Custom Range' }
];

const dueDateOptions = [
  { value: 'all', label: 'All Tasks' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'thisWeek', label: 'Due This Week' },
  { value: 'thisMonth', label: 'Due This Month' },
  { value: 'custom', label: 'Custom Due Date' }
];

function TaskCard({ task, onOpenDetail }: { task: ClientTask; onOpenDetail: (task: ClientTask) => void }) {
  const [approvalNotes, setApprovalNotes] = useState("");
  const [changesNotes, setChangesNotes] = useState("");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Approval mutation
  const approveMutation = useMutation({
    mutationFn: async (notes: string) => {
      return await apiRequest(`/api/client-portal/tasks/${task.id}/approve`, {
        method: 'PUT',
        body: { notes }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/tasks'] });
      setShowApprovalDialog(false);
      setApprovalNotes("");
      toast({
        title: "Task Approved",
        variant: "default",
        description: "Your approval has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve task",
        variant: "destructive",
      });
    },
  });

  // Request changes mutation
  const requestChangesMutation = useMutation({
    mutationFn: async (notes: string) => {
      return await apiRequest(`/api/client-portal/tasks/${task.id}/request-changes`, {
        method: 'PUT',
        body: { notes }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/tasks'] });
      setShowChangesDialog(false);
      setChangesNotes("");
      toast({
        title: "Changes Requested",
        variant: "default",
        description: "Your feedback has been sent to the team.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request changes",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (!approvalNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide notes for your approval.",
        variant: "destructive",
      });
      return;
    }
    approveMutation.mutate(approvalNotes);
  };

  const handleRequestChanges = () => {
    if (!changesNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide details about the requested changes.",
        variant: "destructive",
      });
      return;
    }
    requestChangesMutation.mutate(changesNotes);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-task-${task.id}`} onClick={() => onOpenDetail(task)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium truncate" data-testid={`text-task-title-${task.id}`}>
              {task.title}
            </CardTitle>
            {task.projectName && (
              <CardDescription className="text-sm" data-testid={`text-project-name-${task.id}`}>
                {task.projectName}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge variant="outline" className={priorityColors[task.priority]} data-testid={`badge-priority-${task.id}`}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className={statusColors[task.status] || "bg-gray-100 text-gray-800"} data-testid={`badge-status-${task.id}`}>
              {statusLabels[task.status] || task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {task.description && (
          <div 
            className="text-sm text-muted-foreground mb-3 line-clamp-2 [&_a]:text-blue-600 [&_a]:underline"
            data-testid={`text-description-${task.id}`}
            dangerouslySetInnerHTML={{ __html: task.description }}
            onClick={(e) => {
              if ((e.target as HTMLElement).tagName === 'A') {
                e.stopPropagation();
              }
            }}
          />
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {task.assigneeName && (
              <div className="flex items-center gap-1" data-testid={`text-assignee-${task.id}`}>
                <Users className="h-4 w-4" />
                {task.assigneeName}
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1" data-testid={`text-due-date-${task.id}`}>
                <CalendarIcon className="h-4 w-4" />
                {format(new Date(task.dueDate), "MMM d, yyyy")}
              </div>
            )}
          </div>
          {task.status === 'completed' && task.completedAt && (
            <div className="flex items-center gap-1 text-green-600" data-testid={`text-completed-date-${task.id}`}>
              <CheckCircle2 className="h-4 w-4" />
              {format(new Date(task.completedAt), "MMM d")}
            </div>
          )}
        </div>
        
        {/* Display attachments in compact mode */}
        <div className="mt-3 pt-3 border-t border-muted/50" onClick={(e) => e.stopPropagation()}>
          <ClientPortalTaskAttachments taskId={task.id} compact={true} />
        </div>

        {/* Client Approval Section */}
        {task.requiresClientApproval && (
          <div className="mt-3 pt-3 border-t border-muted/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">Client Approval</h4>
              <Badge 
                variant={
                  task.clientApprovalStatus === 'approved' ? 'default' : 
                  task.clientApprovalStatus === 'changes_requested' ? 'secondary' : 
                  'outline'
                }
                className={
                  task.clientApprovalStatus === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                  task.clientApprovalStatus === 'changes_requested' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }
                data-testid={`badge-approval-status-${task.id}`}
              >
                {task.clientApprovalStatus === 'approved' ? 'Approved' :
                 task.clientApprovalStatus === 'changes_requested' ? 'Changes Requested' :
                 'Pending Review'}
              </Badge>
            </div>

            {task.clientApprovalNotes && (
              <p className="text-sm text-muted-foreground mt-2" data-testid={`text-approval-notes-${task.id}`}>
                {task.clientApprovalNotes}
              </p>
            )}

            {task.clientApprovalDate && (
              <p className="text-xs text-muted-foreground mt-1" data-testid={`text-approval-date-${task.id}`}>
                {task.clientApprovalStatus === 'approved' ? 'Approved' : 'Changes requested'} on {format(new Date(task.clientApprovalDate), "MMM d, yyyy 'at' h:mm a")}
              </p>
            )}

            {/* Approval Action Buttons - only show if status is pending */}
            {task.clientApprovalStatus === 'pending' && (
              <div className="flex gap-2 mt-3">
                <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid={`button-approve-${task.id}`}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve Task</DialogTitle>
                      <DialogDescription>
                        Please provide your approval notes for "{task.title}". This will notify the team that you approve the work.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="approval-notes">Approval Notes</Label>
                        <Textarea
                          id="approval-notes"
                          placeholder="Enter your approval feedback..."
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          rows={4}
                          data-testid={`textarea-approval-notes-${task.id}`}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowApprovalDialog(false)}
                        data-testid={`button-cancel-approval-${task.id}`}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        data-testid={`button-confirm-approval-${task.id}`}
                      >
                        {approveMutation.isPending ? "Approving..." : "Approve Task"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-request-changes-${task.id}`}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Request Changes
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Changes</DialogTitle>
                      <DialogDescription>
                        Please provide detailed feedback for "{task.title}". Describe what changes you'd like the team to make.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="changes-notes">Change Requests</Label>
                        <Textarea
                          id="changes-notes"
                          placeholder="Describe the changes you'd like..."
                          value={changesNotes}
                          onChange={(e) => setChangesNotes(e.target.value)}
                          rows={4}
                          data-testid={`textarea-changes-notes-${task.id}`}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowChangesDialog(false)}
                        data-testid={`button-cancel-changes-${task.id}`}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRequestChanges}
                        disabled={requestChangesMutation.isPending}
                        data-testid={`button-confirm-changes-${task.id}`}
                      >
                        {requestChangesMutation.isPending ? "Sending..." : "Request Changes"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorType: 'staff' | 'client';
  clientPortalUserId: string | null;
}

function TaskDetailDialog({ task, open, onClose }: { task: ClientTask; open: boolean; onClose: () => void }) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [], isLoading: commentsLoading } = useQuery<TaskComment[]>({
    queryKey: ['/api/client-portal/tasks', task.id, 'comments'],
    queryFn: async () => {
      const res = await fetch(`/api/client-portal/tasks/${task.id}/comments`, { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: open,
  });

  const postCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/client-portal/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/tasks', task.id, 'comments'] });
      setNewComment("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post comment. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    postCommentMutation.mutate(newComment.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold">{task.title}</DialogTitle>
              {task.projectName && (
                <DialogDescription className="mt-1">{task.projectName}</DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
              <Badge variant="outline" className={statusColors[task.status] || "bg-gray-100 text-gray-800"}>
                {statusLabels[task.status] || task.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {/* Task Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {task.assigneeName && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assigned to:</span>
                  <span className="font-medium">{task.assigneeName}</span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Due:</span>
                  <span className="font-medium">{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                </div>
              )}
              {task.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-medium">{format(new Date(task.completedAt), "MMM d, yyyy")}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{format(new Date(task.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <div 
                  className="text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert [&_a]:text-blue-600 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              </div>
            )}

            {/* Attachments */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </h4>
              <ClientPortalTaskAttachments taskId={task.id} compact={false} />
            </div>

            <Separator />

            {/* Comments Section */}
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Comments ({comments.length})
              </h4>

              {commentsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No comments yet. Be the first to leave a comment!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className={`flex gap-3 ${comment.authorType === 'client' ? '' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium ${
                        comment.authorType === 'client' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {comment.authorName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{comment.authorName}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {comment.authorType === 'client' ? 'You' : 'Team'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Comment Input */}
        <div className="px-6 py-4 border-t shrink-0">
          <div className="flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="resize-none"
            />
            <Button 
              size="icon" 
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || postCommentMutation.isPending}
              className="shrink-0 self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PortalBranding {
  logoUrl?: string;
  companyName?: string;
  primaryColor?: string;
  accentColor?: string;
  welcomeMessage?: string;
  footerText?: string;
}

export default function ClientPortalDashboard() {
  const [currentUser, setCurrentUser] = useState<ClientPortalUser | null>(() => {
    const stored = sessionStorage.getItem("clientPortalUser");
    return stored ? JSON.parse(stored) : null;
  });

  const [branding, setBranding] = useState<PortalBranding>({});

  useEffect(() => {
    fetch("/api/public/client-portal-branding")
      .then(r => r.json())
      .then(data => setBranding(data || {}))
      .catch(() => {});
  }, []);

  // Task detail dialog state
  const [selectedTask, setSelectedTask] = useState<ClientTask | null>(null);

  // Filter state
  const [filters, setFilters] = useState<TaskFilters>({
    status: [],
    priority: [],
    dateRange: 'all',
    dueDateRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTaskTab, setActiveTaskTab] = useState<'all' | 'in_progress' | 'completed' | 'upcoming'>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20); // Tasks per page

  // Reset to first page when filters change
  const resetPagination = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // Handle filter changes and reset pagination
  const updateFilters = (newFilters: TaskFilters) => {
    setFilters(newFilters);
    resetPagination();
  };

  // Fetch current user details
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/client-portal/me"],
    enabled: !currentUser,
  });

  // Build structured query object for API calls
  const buildQueryObject = (filters: TaskFilters, page: number, pageSize: number) => {
    const queryObj: any = {
      limit: pageSize,
      offset: (page - 1) * pageSize
    };
    
    if (filters.status.length > 0) {
      queryObj.status = filters.status.join(',');
    }
    
    if (filters.priority.length > 0) {
      queryObj.priority = filters.priority.join(',');
    }
    
    // Handle created date ranges
    if (filters.dateRange !== 'all') {
      const today = new Date();
      let dateFrom: Date | undefined;
      
      switch (filters.dateRange) {
        case 'last7':
          dateFrom = subDays(today, 7);
          break;
        case 'last30':
          dateFrom = subDays(today, 30);
          break;
        case 'last90':
          dateFrom = subMonths(today, 3);
          break;
        case 'custom':
          dateFrom = filters.dateFrom;
          break;
      }
      
      if (dateFrom) {
        queryObj.dateFrom = format(startOfDay(dateFrom), 'yyyy-MM-dd');
      }
      
      if (filters.dateRange === 'custom' && filters.dateTo) {
        queryObj.dateTo = format(endOfDay(filters.dateTo), 'yyyy-MM-dd');
      }
    }
    
    // Handle due date ranges
    if (filters.dueDateRange !== 'all') {
      const today = new Date();
      let dueDateFrom: Date | undefined;
      let dueDateTo: Date | undefined;
      
      switch (filters.dueDateRange) {
        case 'overdue':
          dueDateTo = today;
          break;
        case 'thisWeek':
          dueDateFrom = today;
          dueDateTo = subDays(today, -7);
          break;
        case 'thisMonth':
          dueDateFrom = today;
          dueDateTo = subDays(today, -30);
          break;
        case 'custom':
          dueDateFrom = filters.dueDateFrom;
          dueDateTo = filters.dueDateTo;
          break;
      }
      
      if (dueDateFrom) {
        queryObj.dueDateFrom = format(startOfDay(dueDateFrom), 'yyyy-MM-dd');
      }
      
      if (dueDateTo) {
        queryObj.dueDateTo = format(endOfDay(dueDateTo), 'yyyy-MM-dd');
      }
    }
    
    return queryObj;
  };

  // Fetch client tasks with filters and pagination using structured query key
  const queryObject = buildQueryObject(filters, currentPage, pageSize);
  const { data: tasksResponse, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/client-portal/tasks", queryObject],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(queryObject)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const paramString = searchParams.toString();
      const url = `/api/client-portal/tasks${paramString ? '?' + paramString : ''}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          return { tasks: [], total: 0 };
        }
        throw new Error(`Failed to fetch tasks: ${res.status}`);
      }
      return await res.json();
    },
  });
  
  const tasks = tasksResponse?.tasks || [];
  const totalTaskCount = tasksResponse?.total || 0;
  const totalPages = Math.ceil(totalTaskCount / pageSize);

  const handleLogout = async () => {
    try {
      await fetch("/api/client-portal/logout", {
        method: "POST",
        credentials: "include",
      });
      sessionStorage.removeItem("clientPortalUser");
      window.location.href = "/client-portal/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      sessionStorage.removeItem("clientPortalUser");
      window.location.href = "/client-portal/login";
    }
  };

  // Calculate task statistics
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const upcomingTasks = tasks.filter(task => task.status === 'todo' || task.status === 'not_started');
  const overdueTasks = tasks.filter(task => 
    task.dueDate && 
    new Date(task.dueDate) < new Date() && 
    task.status !== 'completed'
  );

  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const displayUser = currentUser || user;

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: branding.primaryColor || undefined }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.companyName || "Logo"} className="h-10 w-auto object-contain bg-white rounded px-2 py-1" />
              ) : (
                <div className="inline-flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg">
                  <div className="w-5 h-5 bg-white rounded"></div>
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold" style={{ color: branding.primaryColor ? '#ffffff' : undefined }} data-testid="text-app-title">
                  {branding.companyName || "Client Portal"}
                </h1>
                <p className="text-sm" style={{ color: branding.primaryColor ? 'rgba(255,255,255,0.8)' : undefined }} data-testid="text-client-name">
                  {displayUser?.clientName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right" data-testid="text-user-info">
                <p className="text-sm font-medium" style={{ color: branding.primaryColor ? '#ffffff' : undefined }}>{displayUser?.name}</p>
                <p className="text-xs" style={{ color: branding.primaryColor ? 'rgba(255,255,255,0.7)' : undefined }}>{displayUser?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
                style={branding.primaryColor ? { borderColor: 'rgba(255,255,255,0.5)', color: '#ffffff', backgroundColor: 'transparent' } : undefined}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Message */}
        {branding.welcomeMessage && (
          <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: `${branding.primaryColor || 'hsl(179, 100%, 39%)'}08`, borderColor: `${branding.primaryColor || 'hsl(179, 100%, 39%)'}30` }}>
            <p className="text-sm text-muted-foreground">{branding.welcomeMessage}</p>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-stats-total">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{totalTasks}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-progress">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-completed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-completion">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{completionRate}%</div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Filter Tasks</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </CardHeader>
          
          {showFilters && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <div className="space-y-2">
                    {statusOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${option.value}`}
                          checked={filters.status.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilters({
                                ...filters,
                                status: [...filters.status, option.value]
                              });
                            } else {
                              updateFilters({
                                ...filters,
                                status: filters.status.filter(s => s !== option.value)
                              });
                            }
                          }}
                          data-testid={`checkbox-status-${option.value}`}
                        />
                        <label
                          htmlFor={`status-${option.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <div className="space-y-2">
                    {priorityOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`priority-${option.value}`}
                          checked={filters.priority.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilters({
                                ...filters,
                                priority: [...filters.priority, option.value]
                              });
                            } else {
                              updateFilters({
                                ...filters,
                                priority: filters.priority.filter(p => p !== option.value)
                              });
                            }
                          }}
                          data-testid={`checkbox-priority-${option.value}`}
                        />
                        <label
                          htmlFor={`priority-${option.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Created Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Created Date</label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value: any) => updateFilters({ ...filters, dateRange: value })}
                  >
                    <SelectTrigger data-testid="select-date-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateRangeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {filters.dateRange === 'custom' && (
                    <div className="space-y-2 mt-2">
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 justify-start text-left font-normal"
                              data-testid="button-date-from"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.dateFrom ? format(filters.dateFrom, "MMM d, yyyy") : "From Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={filters.dateFrom}
                              onSelect={(date) => updateFilters({ ...filters, dateFrom: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 justify-start text-left font-normal"
                              data-testid="button-date-to"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.dateTo ? format(filters.dateTo, "MMM d, yyyy") : "To Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={filters.dateTo}
                              onSelect={(date) => updateFilters({ ...filters, dateTo: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>

                {/* Due Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Select
                    value={filters.dueDateRange}
                    onValueChange={(value: any) => updateFilters({ ...filters, dueDateRange: value })}
                  >
                    <SelectTrigger data-testid="select-due-date-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dueDateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {filters.dueDateRange === 'custom' && (
                    <div className="space-y-2 mt-2">
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 justify-start text-left font-normal"
                              data-testid="button-due-date-from"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.dueDateFrom ? format(filters.dueDateFrom, "MMM d, yyyy") : "From Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={filters.dueDateFrom}
                              onSelect={(date) => updateFilters({ ...filters, dueDateFrom: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 justify-start text-left font-normal"
                              data-testid="button-due-date-to"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.dueDateTo ? format(filters.dueDateTo, "MMM d, yyyy") : "To Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={filters.dueDateTo}
                              onSelect={(date) => updateFilters({ ...filters, dueDateTo: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Filter Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateFilters({
                      status: [],
                      priority: [],
                      dateRange: 'all',
                      dueDateRange: 'all'
                    });
                  }}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
                
                {/* Active filters indicator */}
                {(filters.status.length > 0 || filters.priority.length > 0 || filters.dateRange !== 'all' || filters.dueDateRange !== 'all') && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Filters active:</span>
                    {filters.status.length > 0 && <Badge variant="secondary">{filters.status.length} status</Badge>}
                    {filters.priority.length > 0 && <Badge variant="secondary">{filters.priority.length} priority</Badge>}
                    {filters.dateRange !== 'all' && <Badge variant="secondary">date range</Badge>}
                    {filters.dueDateRange !== 'all' && <Badge variant="secondary">due date</Badge>}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tasks Tabs - pill style */}
        <div className="space-y-6">
          <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto" style={{ width: 'fit-content' }}>
            {([
              { value: 'all', label: 'All Tasks', testId: 'tab-all' },
              { value: 'in_progress', label: 'In Progress', testId: 'tab-progress' },
              { value: 'completed', label: 'Completed', testId: 'tab-completed' },
              { value: 'upcoming', label: 'Upcoming', testId: 'tab-upcoming' },
            ] as const).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTaskTab(tab.value)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTaskTab === tab.value
                    ? "text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
                style={activeTaskTab === tab.value ? { backgroundColor: branding.primaryColor || "hsl(179, 100%, 39%)" } : {}}
                data-testid={tab.testId}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTaskTab === 'all' && (
            <div className="space-y-4" data-testid="content-all-tasks">
              {tasksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your tasks...</p>
                  </div>
                </div>
              ) : tasks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                    <p className="text-muted-foreground">
                      Your agency will add tasks to this portal as they work on your projects.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onOpenDetail={setSelectedTask} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTaskTab === 'in_progress' && (
            <div className="space-y-4" data-testid="content-progress-tasks">
              {inProgressTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tasks in progress</h3>
                    <p className="text-muted-foreground">
                      Tasks that your agency is actively working on will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {inProgressTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onOpenDetail={setSelectedTask} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTaskTab === 'completed' && (
            <div className="space-y-4" data-testid="content-completed-tasks">
              {completedTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No completed tasks</h3>
                    <p className="text-muted-foreground">
                      Completed tasks will appear here once your agency finishes working on them.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {completedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onOpenDetail={setSelectedTask} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTaskTab === 'upcoming' && (
            <div className="space-y-4" data-testid="content-upcoming-tasks">
              {upcomingTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No upcoming tasks</h3>
                    <p className="text-muted-foreground">
                      Future tasks scheduled by your agency will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onOpenDetail={setSelectedTask} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalTaskCount)}-{Math.min(currentPage * pageSize, totalTaskCount)} of {totalTaskCount} tasks
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (page > totalPages) return null;
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-9 h-9 p-0"
                      data-testid={`button-page-${page}`}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDetailDialog 
          task={selectedTask} 
          open={!!selectedTask} 
          onClose={() => setSelectedTask(null)} 
        />
      )}

      {/* Footer */}
      {(branding.footerText || branding.companyName) && (
        <footer className="border-t py-4 mt-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            {branding.footerText || `© ${new Date().getFullYear()} ${branding.companyName}. All rights reserved.`}
          </div>
        </footer>
      )}
    </div>
  );
}
