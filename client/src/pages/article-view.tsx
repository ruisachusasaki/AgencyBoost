import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link as RouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Eye, Heart, Bookmark, Calendar, User, Tag, 
  MessageCircle, Send, Edit, Trash2, Save, X
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { KnowledgeBaseArticle } from "@shared/schema";
import { SlateEditor, createEmptyDocument } from '@/components/slate-editor';
import type { Descendant } from 'slate';

export default function ArticleView() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState<Descendant[]>(createEmptyDocument());
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [currentContent, setCurrentContent] = useState<Descendant[]>(createEmptyDocument());
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to convert content between formats
  const parseContent = (content: any): Descendant[] => {
    if (!content || content === undefined || content === null) {
      return createEmptyDocument();
    }
    
    // If it's already Slate format (array), return it
    if (Array.isArray(content)) {
      // Ensure array is not empty and has valid structure
      if (content.length === 0) {
        return createEmptyDocument();
      }
      // Only filter if content exists - don't filter out content with actual text
      return content;
    }
    
    // If it's a string (HTML), convert to basic Slate format
    if (typeof content === 'string') {
      if (content.trim() === '') {
        return createEmptyDocument();
      }
      return [
        {
          type: 'paragraph',
          children: [{ text: content.replace(/<[^>]*>/g, '') }], // Strip HTML tags
        },
      ];
    }
    
    return createEmptyDocument();
  };

  // Helper function to check if Slate content has meaningful text
  const hasContent = (slateValue: Descendant[]): boolean => {
    return slateValue.some(node => {
      if ('children' in node) {
        return node.children.some(child => {
          if ('text' in child) {
            return child.text.trim().length > 0;
          }
          return false;
        });
      }
      return false;
    });
  };

  const { data: article, isLoading } = useQuery<KnowledgeBaseArticle>({
    queryKey: [`/api/knowledge-base/articles/${id}`],
  });

  // Comments query  
  const { data: comments = [] } = useQuery({
    queryKey: [`/api/knowledge-base/articles/${id}/comments`],
    enabled: !!id,
  });

  // Set initial edit content when starting to edit - content should already be initialized
  useEffect(() => {
    if (isEditing && article) {
      setEditTitle((article.title as string) || '');
      // Use currentContent since it's already initialized and may have unsaved changes
      setEditContent(currentContent);
    }
  }, [isEditing, article, currentContent]);



  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/knowledge-base/articles/${id}/like`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      setIsLiked(data.liked);
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/articles/${id}`] });
    },
    onError: (error: any) => {
      console.error("Like error:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/knowledge-base/articles/${id}/bookmark`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      setIsBookmarked(data.bookmarked);
      toast({
        title: "Success",
        description: data.bookmarked ? "Article bookmarked" : "Bookmark removed",
      });
    },
    onError: (error: any) => {
      console.error("Bookmark error:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark status",
        variant: "destructive",
      });
    },
  });

  const updateArticleMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: Descendant[] }) => {
      const response = await apiRequest("PUT", `/api/knowledge-base/articles/${id}`, {
        title,
        content,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/articles/${id}`] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Article updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "Failed to update article",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/knowledge-base/articles/${id}/comments`, {
        content,
      });
      return await response.json();
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/articles/${id}/comments`] });
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: Descendant[] }) => {
      const response = await apiRequest("PUT", `/api/knowledge-base/articles/${id}`, {
        title,
        content,
      });
      return await response.json();
    },
    onMutate: () => {
      setIsAutoSaving(true);
    },
    onSuccess: (data) => {
      // Don't update the editor content on auto-save success to avoid disrupting the user
      // The content is already correct in the editor - just mark as saved
      setIsAutoSaving(false);
      // Invalidate queries in the background to keep other parts of the app in sync
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/articles/${id}`] });
    },
    onError: (error: any) => {
      console.error("Auto-save error:", error);
      setIsAutoSaving(false);
      toast({
        title: "Auto-save failed",
        description: "Your changes were not saved automatically.",
        variant: "destructive",
      });
    },
  });

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    (content: Descendant[], title?: string) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        const articleTitle = title || (article?.title as string) || "";
        console.log('Auto-save check:', { articleTitle, hasContentResult: hasContent(content), content });
        // Allow auto-save if there's meaningful content, even without a title
        if (hasContent(content)) {
          console.log('Triggering auto-save');
          autoSaveMutation.mutate({
            title: articleTitle || "Untitled Article",
            content,
          });
        } else {
          console.log('Auto-save skipped - no content');
        }
      }, 1000); // 1 second delay
    },
    [article?.title, autoSaveMutation]
  );

  // Handle content changes with auto-save
  const handleContentChange = useCallback(
    (newContent: Descendant[]) => {
      setCurrentContent(newContent);
      debouncedAutoSave(newContent);
    },
    [debouncedAutoSave]
  );

  // Handle title changes with auto-save
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setEditTitle(newTitle);
      debouncedAutoSave(currentContent, newTitle);
    },
    [currentContent, debouncedAutoSave]
  );

  // Initialize content when article loads
  useEffect(() => {
    if (article) {
      console.log('Loading article content:', article.content);
      const parsedContent = parseContent(article.content);
      console.log('Parsed content for display:', parsedContent);
      setCurrentContent(parsedContent);
      setEditContent(parsedContent);
      setEditTitle((article.title as string) || "");
    }
  }, [article]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const startEdit = () => {
    if (article) {
      setEditTitle(article.title || "");
      setEditContent(parseContent(article.content));
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditContent(createEmptyDocument());
  };

  const saveEdit = () => {
    if (editTitle.trim() && hasContent(editContent)) {
      updateArticleMutation.mutate({
        title: editTitle.trim(),
        content: editContent,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">Article not found</h3>
            <p className="text-muted-foreground mb-4">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <RouterLink href="/resources">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Knowledge Base
              </Button>
            </RouterLink>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <RouterLink href="/resources">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </RouterLink>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-3xl font-bold mb-4 text-3xl border-none px-0 shadow-none focus-visible:ring-0"
                placeholder="Article title..."
              />
            ) : (
              <Input
                value={editTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-3xl font-bold mb-4 text-3xl border-none px-0 shadow-none focus-visible:ring-0 bg-transparent hover:bg-muted/20 transition-colors"
                placeholder="Click to edit title..."
              />
            )}
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{article?.authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{article?.createdAt ? format(new Date(article.createdAt), 'MMMM d, yyyy') : ''}</span>
              </div>
              {(article?.viewCount || 0) > 0 && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{article.viewCount} views</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-save indicator */}
            {isAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Auto-saving...</span>
              </div>
            )}
            
            {isEditing ? (
              <>
                <Button
                  onClick={saveEdit}
                  disabled={updateArticleMutation.isPending || !editTitle.trim() || !hasContent(editContent)}
                  size="sm"
                  data-testid="button-save"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateArticleMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  size="sm"
                  data-testid="button-cancel"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <div className="text-xs text-muted-foreground mr-3 hidden sm:block">
                  💡 Click anywhere to edit - auto-saves as you type!
                </div>
                <Button
                  data-testid="button-like"
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {article?.likeCount || 0}
                </Button>

                <Button
                  data-testid="button-bookmark"
                  variant={isBookmarked ? "default" : "outline"}
                  size="sm"
                  onClick={() => bookmarkMutation.mutate()}
                  disabled={bookmarkMutation.isPending}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={startEdit}
                  data-testid="button-edit"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Mode
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {article?.tags && article.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {article.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator className="mb-6" />

      {/* Article Content */}
      <Card className="mb-8">
        <CardContent className="p-8">
          {article?.featuredImage && (
            <img 
              src={article.featuredImage}
              alt={article?.title || ''}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
          
          <div className="prose prose-lg max-w-none">
            {isEditing ? (
              <SlateEditor
                value={editContent}
                onChange={setEditContent}
                placeholder="Write your article content... Type '/' for commands"
              />
            ) : (
              <SlateEditor
                key={`article-${id}`}
                value={currentContent}
                onChange={handleContentChange}
                placeholder="Start typing to edit this article... Type '/' for commands, highlight text for formatting!"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              Comments ({comments?.length || 0})
            </h3>
          </div>

          {/* Add Comment */}
          <div className="mb-6">
            <Textarea
              data-testid="textarea-comment"
              placeholder="Share your thoughts..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-3"
            />
            <Button
              data-testid="button-submit-comment"
              onClick={() => commentMutation.mutate(comment)}
              disabled={!comment.trim() || commentMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              Post Comment
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Comments List */}
          <div className="space-y-4">
            {(comments || []).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              (comments || []).map((comment: any) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {comment.authorName?.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.authorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), 'MMM d, yyyy at h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}