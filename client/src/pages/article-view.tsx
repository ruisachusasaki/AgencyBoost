import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
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
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function ArticleView() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const { data: article, isLoading } = useQuery({
    queryKey: [`/api/knowledge-base/articles/${id}`],
  });

  const { data: comments = [] } = useQuery({
    queryKey: [`/api/knowledge-base/articles/${id}/comments`],
  });

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
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
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

  const startEdit = () => {
    if (article) {
      setEditTitle(article.title || "");
      setEditContent(article.content || "");
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
  };

  const saveEdit = () => {
    if (editTitle.trim() && editContent.trim()) {
      updateArticleMutation.mutate({
        title: editTitle.trim(),
        content: editContent.trim(),
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
            <Link href="/resources">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Knowledge Base
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/resources">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-3xl font-bold mb-4 text-3xl border-none px-0 shadow-none focus-visible:ring-0"
                placeholder="Article title..."
              />
            ) : (
              <h1 className="text-3xl font-bold mb-4">{article?.title}</h1>
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
            {isEditing ? (
              <>
                <Button
                  onClick={saveEdit}
                  disabled={updateArticleMutation.isPending || !editTitle.trim() || !editContent.trim()}
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
                  Edit
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
              <ReactQuill
                value={editContent}
                onChange={setEditContent}
                theme="snow"
                placeholder="Write your article content..."
                style={{ 
                  minHeight: '400px',
                  border: 'none'
                }}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],
                    ['clean']
                  ],
                }}
              />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: article?.content || '' }} />
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