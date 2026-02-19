import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trash2, Edit, MessageSquare, Paperclip, Download, Clock, User, Tag as TagIcon, AlertCircle, Shield } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

type TicketComment = {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  isInternal: boolean;
  createdAt: string;
};

type TicketAttachment = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
};

type Ticket = {
  id: string;
  ticketNumber: number;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  submittedBy: string;
  assignedTo: string | null;
  submitterName: string;
  assigneeName: string | null;
  tags: string[];
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
  attachments: TicketAttachment[];
};

type StaffMember = {
  id: string;
  firstName: string;
  lastName: string;
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "bug": return "bg-red-100 text-red-800";
    case "feature_request": return "bg-purple-100 text-purple-800";
    case "improvement": return "bg-blue-100 text-blue-800";
    case "question": return "bg-yellow-100 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical": return "bg-red-100 text-red-800";
    case "high": return "bg-orange-100 text-orange-800";
    case "medium": return "bg-yellow-100 text-yellow-800";
    case "low": return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "open": return "bg-blue-100 text-blue-800";
    case "in_progress": return "bg-amber-100 text-amber-800";
    case "on_hold": return "bg-gray-100 text-gray-800";
    case "resolved": return "bg-green-100 text-green-800";
    case "closed": return "bg-slate-100 text-slate-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const formatLabel = (value: string) => {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function TicketDetailPage() {
  const [, params] = useRoute("/tickets/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const ticketId = params?.id;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ["/api/tickets", ticketId],
    enabled: !!ticketId,
  });

  const { data: staff = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (data: Partial<Ticket>) => {
      await apiRequest("PUT", `/api/tickets/${ticketId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Ticket updated", variant: "success", description: "Ticket has been updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to update ticket.", variant: "destructive" });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Ticket deleted", variant: "success", description: "Ticket has been deleted successfully." });
      setLocation("/tickets");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to delete ticket.", variant: "destructive" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; isInternal: boolean }) => {
      await apiRequest("POST", `/api/tickets/${ticketId}/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      setCommentContent("");
      setIsInternal(false);
      toast({ title: "Comment added", variant: "success", description: "Comment has been added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to add comment.", variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiRequest("DELETE", `/api/tickets/${ticketId}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      toast({ title: "Comment deleted", variant: "success", description: "Comment has been deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to delete comment.", variant: "destructive" });
    },
  });

  const handleAddComment = () => {
    if (!commentContent.trim()) return;
    addCommentMutation.mutate({ content: commentContent.trim(), isInternal });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/tickets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">Ticket not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/tickets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              <span className="text-slate-500 mr-2">#{ticket.ticketNumber}</span>
              {ticket.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                {formatLabel(ticket.status)}
              </Badge>
              <Badge variant="secondary" className={getTypeColor(ticket.type)}>
                {formatLabel(ticket.type)}
              </Badge>
              <Badge variant="secondary" className={getPriorityColor(ticket.priority)}>
                {formatLabel(ticket.priority)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/tickets/${ticketId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Ticket
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteTicketMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.description ? (
                <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
              ) : (
                <p className="text-slate-400 italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({ticket.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.comments && ticket.comments.length > 0 ? (
                <div className="space-y-4">
                  {ticket.comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{comment.authorName}</span>
                          {comment.isInternal && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Internal
                            </Badge>
                          )}
                          <span className="text-sm text-slate-500">
                            {format(new Date(comment.createdAt), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-center py-4">No comments yet</p>
              )}

              {/* Add Comment Form */}
              <div className="border-t pt-4 space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isInternal"
                      checked={isInternal}
                      onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                    />
                    <Label htmlFor="isInternal" className="text-sm text-slate-600 cursor-pointer">
                      Internal note (not visible to submitter)
                    </Label>
                  </div>
                  <Button
                    onClick={handleAddComment}
                    disabled={!commentContent.trim() || addCommentMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <Label className="text-sm font-medium text-slate-500">Status</Label>
                <Select
                  value={ticket.status}
                  onValueChange={(value) => updateTicketMutation.mutate({ status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div>
                <Label className="text-sm font-medium text-slate-500">Type</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className={getTypeColor(ticket.type)}>
                    {formatLabel(ticket.type)}
                  </Badge>
                </div>
              </div>

              {/* Priority */}
              <div>
                <Label className="text-sm font-medium text-slate-500">Priority</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className={getPriorityColor(ticket.priority)}>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {formatLabel(ticket.priority)}
                  </Badge>
                </div>
              </div>

              {/* Submitted By */}
              <div>
                <Label className="text-sm font-medium text-slate-500">Submitted By</Label>
                <div className="mt-1 flex items-center gap-2 text-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  {ticket.submitterName}
                </div>
              </div>

              {/* Assigned To */}
              <div>
                <Label className="text-sm font-medium text-slate-500">Assigned To</Label>
                <Select
                  value={ticket.assignedTo || "unassigned"}
                  onValueChange={(value) =>
                    updateTicketMutation.mutate({ assignedTo: value === "unassigned" ? null : value } as any)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              {ticket.tags && ticket.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-500">Tags</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ticket.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Created */}
              <div>
                <Label className="text-sm font-medium text-slate-500">Created</Label>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")}
                </div>
              </div>

              {/* Updated */}
              <div>
                <Label className="text-sm font-medium text-slate-500">Updated</Label>
                <div className="mt-1 text-sm text-slate-700">
                  {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                </div>
              </div>

              {/* First Response */}
              {ticket.firstResponseAt && (
                <div>
                  <Label className="text-sm font-medium text-slate-500">First Response</Label>
                  <div className="mt-1 text-sm text-slate-700">
                    {format(new Date(ticket.firstResponseAt), "MMM d, yyyy h:mm a")}
                  </div>
                </div>
              )}

              {/* Resolved */}
              {ticket.resolvedAt && (
                <div>
                  <Label className="text-sm font-medium text-slate-500">Resolved</Label>
                  <div className="mt-1 text-sm text-slate-700">
                    {format(new Date(ticket.resolvedAt), "MMM d, yyyy h:mm a")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments ({ticket.attachments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.attachments && ticket.attachments.length > 0 ? (
                <div className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      </div>
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-center py-4">No attachments</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ticket #{ticket.ticketNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTicketMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
