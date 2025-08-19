import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Send, AtSign, User, Reply, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  author: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  mentions: string[];
  parentId?: string;
  replies?: TaskComment[];
}

interface CommentReaction {
  emoji: string;
  count: number;
  users: { id: string; name: string }[];
}

interface TaskCommentsProps {
  taskId: string;
}

export default function TaskComments({ taskId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [commentReactions, setCommentReactions] = useState<Record<string, CommentReaction[]>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [] } = useQuery<TaskComment[]>({
    queryKey: [`/api/tasks/${taskId}/comments`],
  });

  const { data: staffData = [] } = useQuery<any[]>({
    queryKey: ["/api/staff"],
  });

  // Fetch reactions for all comments
  const fetchReactions = async (commentId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}/reactions`);
      if (response.ok) {
        const reactions = await response.json();
        setCommentReactions(prev => ({
          ...prev,
          [commentId]: reactions
        }));
      }
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
    }
  };

  // Load reactions when comments change
  useEffect(() => {
    comments.forEach(comment => {
      fetchReactions(comment.id);
      comment.replies?.forEach(reply => fetchReactions(reply.id));
    });
  }, [comments, taskId]);

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      // Extract mentions from content
      const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
      const mentionedNames = [];
      let match;
      
      while ((match = mentionRegex.exec(content)) !== null) {
        mentionedNames.push(match[1]);
      }
      
      // Find staff IDs for mentioned names
      const mentions = mentionedNames.map(name => {
        const staff = staffData.find(s => 
          (s.name && s.name.toLowerCase() === name.toLowerCase()) ||
          (`${s.firstName} ${s.lastName}`.toLowerCase().trim() === name.toLowerCase())
        );
        return staff?.id;
      }).filter(Boolean);
      
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mentions, parentId }),
      });
      if (!response.ok) throw new Error('Failed to add comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/comments`] });
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTextChange = (value: string) => {
    setNewComment(value);
    
    // Check for @ mentions
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentionDropdown(true);
      setCursorPosition(cursorPos);
    } else {
      setShowMentionDropdown(false);
      setMentionQuery("");
    }
  };

  const insertMention = (staffName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = newComment.slice(0, cursorPos);
    const textAfterCursor = newComment.slice(cursorPos);
    const words = textBeforeCursor.split(/\s/);
    
    // Replace the last word (which starts with @) with the mention
    words[words.length - 1] = `@${staffName}`;
    const newText = words.join(' ') + ' ' + textAfterCursor;
    
    setNewComment(newText);
    setShowMentionDropdown(false);
    setMentionQuery("");
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = words.join(' ').length + 1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const filteredStaff = staffData.filter((staff: any) =>
    staff.name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    staff.firstName?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    staff.lastName?.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({ content: newComment.trim(), parentId: replyToId || undefined });
  };

  const handleReplySubmit = (commentId: string, content: string) => {
    if (!content.trim()) return;
    
    addCommentMutation.mutate({ content: content.trim(), parentId: commentId });
    setReplyInputs(prev => ({ ...prev, [commentId]: "" }));
  };

  const handleEmojiReaction = async (commentId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      
      if (response.ok) {
        // Refresh reactions for this comment
        fetchReactions(commentId);
        setShowEmojiPicker(null);
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  const commonEmojis = ['👍', '❤️', '😊', '🎉', '👏', '🚀', '👌', '💯'];

  const formatCommentContent = (content: string) => {
    // Replace @mentions with styled badges
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const parts = content.split(mentionRegex);
    
    return (
      <span>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            // This is a mentioned name
            return (
              <Badge key={index} variant="secondary" className="mx-1 bg-teal-100 text-teal-800">
                @{part}
              </Badge>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  const makeLinksClickable = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="h-8 w-8 mx-auto mb-2 flex items-center justify-center">
              💬
            </div>
            <p>No comments yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <Card className="border-l-4 border-l-teal-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">
                          {comment.author.firstName} {comment.author.lastName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm text-slate-700 whitespace-pre-wrap mb-2">
                        {formatCommentContent(comment.content)}
                      </div>
                      
                      {/* Comment Reactions */}
                      {commentReactions[comment.id]?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {commentReactions[comment.id].map((reaction) => (
                            <Button
                              key={reaction.emoji}
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs hover:bg-blue-50 border-blue-200 rounded-full mr-1"
                              onClick={() => handleEmojiReaction(comment.id, reaction.emoji)}
                              title={`${reaction.users.map(u => u.name).join(', ')}`}
                            >
                              <span className="mr-1.5">{reaction.emoji}</span>
                              <span className="text-xs font-medium">{reaction.count}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyInputs(prev => ({ 
                              ...prev, 
                              [comment.id]: prev[comment.id] || "" 
                            }));
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700 h-6 px-2"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                        
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id)}
                            className="text-xs text-slate-500 hover:text-slate-700 h-6 px-2"
                          >
                            <Smile className="h-3 w-3" />
                          </Button>
                          
                          {/* Emoji Picker */}
                          {showEmojiPicker === comment.id && (
                            <div className="absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-10">
                              <div className="grid grid-cols-4 gap-1">
                                {commonEmojis.map((emoji) => (
                                  <Button
                                    key={emoji}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEmojiReaction(comment.id, emoji)}
                                    className="h-8 w-8 p-0 hover:bg-slate-100"
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Reply Input */}
                      {replyInputs[comment.id] !== undefined && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Write a reply..."
                            value={replyInputs[comment.id]}
                            onChange={(e) => setReplyInputs(prev => ({ 
                              ...prev, 
                              [comment.id]: e.target.value 
                            }))}
                            className="min-h-[60px] text-sm"
                            rows={2}
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReplySubmit(comment.id, replyInputs[comment.id])}
                              disabled={!replyInputs[comment.id]?.trim() || addCommentMutation.isPending}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyInputs(prev => {
                                const newInputs = { ...prev };
                                delete newInputs[comment.id];
                                return newInputs;
                              })}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 space-y-2">
                  {comment.replies.map((reply) => (
                    <Card key={reply.id} className="border-l-4 border-l-blue-200 bg-slate-50">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-900">
                                {reply.author.firstName} {reply.author.lastName}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(reply.createdAt).toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="text-sm text-slate-700 whitespace-pre-wrap mb-2">
                              {formatCommentContent(reply.content)}
                            </div>
                            
                            {/* Reply Reactions */}
                            {commentReactions[reply.id]?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {commentReactions[reply.id].map((reaction) => (
                                  <Button
                                    key={reaction.emoji}
                                    variant="outline"
                                    size="sm"
                                    className="h-5 px-1.5 text-xs hover:bg-blue-50 border-blue-200 rounded-full"
                                    onClick={() => handleEmojiReaction(reply.id, reaction.emoji)}
                                    title={`${reaction.users.map(u => u.name).join(', ')}`}
                                  >
                                    <span className="mr-1 text-xs">{reaction.emoji}</span>
                                    <span className="text-xs font-medium">{reaction.count}</span>
                                  </Button>
                                ))}
                              </div>
                            )}
                            
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowEmojiPicker(showEmojiPicker === reply.id ? null : reply.id)}
                                className="text-xs text-slate-500 hover:text-slate-700 h-5 px-1"
                              >
                                <Smile className="h-3 w-3" />
                              </Button>
                              
                              {/* Emoji Picker for Reply */}
                              {showEmojiPicker === reply.id && (
                                <div className="absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-10">
                                  <div className="grid grid-cols-4 gap-1">
                                    {commonEmojis.map((emoji) => (
                                      <Button
                                        key={emoji}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEmojiReaction(reply.id, emoji)}
                                        className="h-8 w-8 p-0 hover:bg-slate-100"
                                      >
                                        {emoji}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="Add a comment... Use @name to mention someone"
            value={newComment}
            onChange={(e) => handleTextChange(e.target.value)}
            className="min-h-[80px] resize-none"
            rows={3}
          />
          
          {/* Mention Dropdown */}
          {showMentionDropdown && filteredStaff.length > 0 && (
            <div className="absolute z-10 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {filteredStaff.slice(0, 5).map((staff: any) => (
                <button
                  key={staff.id}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => insertMention(staff.name || `${staff.firstName} ${staff.lastName}`.trim())}
                >
                  <AtSign className="h-4 w-4 text-slate-400" />
                  <span>{staff.name || `${staff.firstName} ${staff.lastName}`.trim()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Type @ to mention team members
          </div>
          <Button 
            type="submit" 
            disabled={!newComment.trim() || addCommentMutation.isPending}
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            {addCommentMutation.isPending ? "Sending..." : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}