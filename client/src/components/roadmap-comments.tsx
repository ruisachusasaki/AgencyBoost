import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Send, AtSign, Trash2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { linkifyString } from "@/components/ui/linkify-text";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RoadmapComment {
  id: string;
  clientId: string;
  content: string;
  authorId: string;
  author: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  createdAt: string;
  mentions: string[];
}

interface RoadmapCommentsProps {
  clientId: string;
  roadmapEntryId?: string;
}

export default function RoadmapComments({ clientId, roadmapEntryId }: RoadmapCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [trackedMentions, setTrackedMentions] = useState<Array<{ name: string; id: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Use entry-specific endpoint if roadmapEntryId is provided, otherwise use client-level endpoint
  const apiEndpoint = roadmapEntryId 
    ? `/api/roadmap-entries/${roadmapEntryId}/comments`
    : `/api/clients/${clientId}/roadmap-comments`;
  
  const queryKey = roadmapEntryId
    ? ['/api/roadmap-entries', roadmapEntryId, 'comments']
    : ['/api/clients', clientId, 'roadmap-comments'];

  const { data: comments = [], isLoading } = useQuery<RoadmapComment[]>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(apiEndpoint);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    }
  });

  const { data: staffData = [] } = useQuery<any[]>({
    queryKey: ["/api/staff"],
  });

  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      // Extract mention IDs from tracked mentions that are still in the content
      // Use word boundary matching to avoid partial matches
      const mentions: string[] = [];
      trackedMentions.forEach(mention => {
        // Create a regex that matches @Name with word boundary or punctuation after
        const mentionPattern = new RegExp(`@${mention.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s.,!?;:\\)\\]\\n]|$)`, 'g');
        const matches = content.match(mentionPattern);
        if (matches && matches.length > 0 && !mentions.includes(mention.id)) {
          mentions.push(mention.id);
        }
      });
      
      const response = await apiRequest('POST', apiEndpoint, { content, mentions });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewComment("");
      setTrackedMentions([]);
      toast({ title: "Comment added", description: "Your comment has been posted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add comment.", variant: "destructive" });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      // Use entry-specific delete endpoint if roadmapEntryId is provided
      const deleteEndpoint = roadmapEntryId
        ? `/api/roadmap-entries/${roadmapEntryId}/comments/${commentId}`
        : `/api/clients/${clientId}/roadmap-comments/${commentId}`;
      await apiRequest('DELETE', deleteEndpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Comment deleted", description: "Your comment has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete comment.", variant: "destructive" });
    }
  });

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setNewComment(value);
    setCursorPosition(cursorPos);
    
    const textBeforeCursor = value.substring(0, cursorPos);
    const atSymbolMatch = textBeforeCursor.match(/@([\w\s]*)$/);
    
    if (atSymbolMatch) {
      setMentionQuery(atSymbolMatch[1] || "");
      setShowMentionDropdown(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentionDropdown(false);
      setMentionQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionDropdown) {
      const filteredStaff = staffData.filter((s: any) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => Math.min(prev + 1, filteredStaff.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredStaff.length > 0) {
        e.preventDefault();
        selectMention(filteredStaff[selectedMentionIndex]);
      } else if (e.key === "Escape") {
        setShowMentionDropdown(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectMention = (staffMember: any) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);
    const mentionStart = textBeforeCursor.lastIndexOf("@");
    
    const fullName = `${staffMember.firstName} ${staffMember.lastName}`;
    const mentionText = `@${fullName} `;
    
    // Track the mention for later ID extraction
    setTrackedMentions(prev => {
      const exists = prev.some(m => m.id === staffMember.id);
      if (exists) return prev;
      return [...prev, { name: fullName, id: staffMember.id }];
    });
    
    const newText = textBeforeCursor.substring(0, mentionStart) + mentionText + textAfterCursor;
    setNewComment(newText);
    setShowMentionDropdown(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = mentionStart + mentionText.length;
        textareaRef.current.selectionStart = newPos;
        textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredStaff = staffData.filter((s: any) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const getTextareaRect = () => {
    if (!textareaRef.current) return null;
    return textareaRef.current.getBoundingClientRect();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const renderContent = (content: string) => {
    const mentionRegex = /@([\p{L}\p{M}\p{N}\s'-]+)/gu;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="text-primary font-medium">
            @{part}
          </span>
        );
      }
      return <span key={index}>{linkifyString(part)}</span>;
    });
  };

  return (
    <div className="space-y-4" data-testid="roadmap-comments">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Discussion</h3>
        <span className="text-muted-foreground text-sm">({comments.length})</span>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="Add a comment... Use @ to mention team members"
            value={newComment}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] pr-12"
            data-testid="roadmap-comment-input"
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2"
            onClick={handleSubmit}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            data-testid="roadmap-comment-submit"
          >
            <Send className="h-4 w-4" />
          </Button>
          
          {showMentionDropdown && filteredStaff.length > 0 && createPortal(
            <div
              className="fixed bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
              style={{
                top: (getTextareaRect()?.bottom || 0) + 4,
                left: getTextareaRect()?.left || 0,
                minWidth: 200,
              }}
            >
              {filteredStaff.slice(0, 5).map((staff: any, index: number) => (
                <button
                  key={staff.id}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-accent ${
                    index === selectedMentionIndex ? "bg-accent" : ""
                  }`}
                  onClick={() => selectMention(staff)}
                >
                  <Avatar className="h-6 w-6">
                    {staff.profileImage && <AvatarImage src={staff.profileImage} />}
                    <AvatarFallback className="text-xs">
                      {getInitials(staff.firstName, staff.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{staff.firstName} {staff.lastName}</span>
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No comments yet. Start the discussion!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card 
              key={comment.id} 
              className="border-l-4 border-l-primary/30"
              data-testid={`roadmap-comment-${comment.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    {comment.author.profileImage && (
                      <AvatarImage src={comment.author.profileImage} />
                    )}
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.author.firstName, comment.author.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.author.firstName} {comment.author.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(comment.createdAt)}
                        </span>
                      </div>
                      {currentUser?.id === comment.authorId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirmId(comment.id)}
                          data-testid={`delete-roadmap-comment-${comment.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                      {renderContent(comment.content)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  deleteCommentMutation.mutate(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
