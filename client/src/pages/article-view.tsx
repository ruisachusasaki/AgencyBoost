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
import { useToast } from "@/hooks/use-toast";
import { useRolePermissions } from "@/hooks/use-has-permission";
import { 
  ArrowLeft, ArrowRight, Eye, Heart, Bookmark, Calendar, User, Tag, 
  MessageCircle, Send, Edit, Trash2, Save, X, Settings,
  ChevronRight, FileText, List, History, Clock, Check, FileEdit, Plus, ChevronDown, MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import type { KnowledgeBaseArticle } from "@shared/schema";
import { SlateEditor, createEmptyDocument } from '@/components/slate-editor';
import type { Descendant } from 'slate';
import { MentionInput } from '@/components/ui/mention-input';
import { MentionText } from '@/components/ui/mention-text';
import { ArticlePermissionsModal } from '@/components/article-permissions-modal';
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { GripVertical } from "lucide-react";

export default function ArticleView() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [commentMentions, setCommentMentions] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState<Descendant[]>(createEmptyDocument());
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [currentContent, setCurrentContent] = useState<Descendant[]>(createEmptyDocument());
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Fetch current user data for role checking
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/current-user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/current-user');
      return response.json();
    }
  });
  
  // Use role-based permission hook for consistent permission checks
  const { canManageArticles } = useRolePermissions();

  // Fetch staff data for mention conversion
  const { data: staff = [] } = useQuery({
    queryKey: ['/api/staff']
  });

  // Fetch categories for breadcrumbs
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/knowledge-base/categories']
  });

  // Fetch all articles for related articles
  const { data: allArticles = [] } = useQuery({
    queryKey: ['/api/knowledge-base/articles']
  });

  // Fetch version history
  const { data: versions = [] } = useQuery({
    queryKey: ['/api/knowledge-base/articles', id, 'versions'],
    enabled: !!id
  });

  // Extract headings from Slate content for Table of Contents
  const extractHeadings = useCallback((content: Descendant[]): { level: number; text: string; id: string }[] => {
    const headings: { level: number; text: string; id: string }[] = [];
    
    const processNode = (node: any) => {
      if (node.type === 'heading' && node.level) {
        const text = node.children?.map((child: any) => child.text || '').join('') || '';
        if (text.trim()) {
          headings.push({
            level: node.level,
            text: text.trim(),
            id: text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
          });
        }
      }
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    content.forEach(processNode);
    return headings;
  }, []);

  // Get breadcrumb path from category
  const getBreadcrumbPath = useCallback((categoryId: string | null): any[] => {
    if (!categoryId || !categories.length) return [];
    
    const path: any[] = [];
    let currentId: string | null = categoryId;
    
    while (currentId) {
      const category = (categories as any[]).find((c: any) => c.id === currentId);
      if (category) {
        path.unshift(category);
        currentId = category.parentId;
      } else {
        break;
      }
    }
    
    return path;
  }, [categories]);

  // Get parent article breadcrumb path
  const getArticleParentPath = useCallback((parentId: string | null): any[] => {
    if (!parentId || !allArticles.length) return [];
    
    const path: any[] = [];
    let currentId: string | null = parentId;
    
    while (currentId) {
      const parentArticle = (allArticles as any[]).find((a: any) => a.id === currentId);
      if (parentArticle) {
        path.unshift(parentArticle);
        currentId = parentArticle.parentId;
      } else {
        break;
      }
    }
    
    return path;
  }, [allArticles]);

  // Get child articles of current article (sorted by order)
  const getChildArticles = useCallback((articleId: string): any[] => {
    if (!articleId || !allArticles.length) return [];
    return (allArticles as any[])
      .filter((a: any) => a.parentId === articleId)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }, [allArticles]);

  // Get related articles (same category or shared tags)
  const getRelatedArticles = useCallback((article: any): any[] => {
    if (!article || !allArticles.length) return [];
    
    return (allArticles as any[])
      .filter((a: any) => {
        if (a.id === article.id) return false;
        if (a.status !== 'published') return false;
        
        // Same category
        if (a.categoryId === article.categoryId) return true;
        
        // Shared tags
        const articleTags = article.tags || [];
        const aTags = a.tags || [];
        const sharedTags = articleTags.filter((t: string) => aTags.includes(t));
        return sharedTags.length > 0;
      })
      .slice(0, 5); // Max 5 related articles
  }, [allArticles]);

  // Helper function to check if a node is empty (no meaningful text content)
  const isEmptyNode = (node: any): boolean => {
    if (!node) return true;
    if ('text' in node) {
      return !node.text || node.text.trim() === '';
    }
    if ('children' in node && Array.isArray(node.children)) {
      return node.children.every((child: any) => isEmptyNode(child));
    }
    // For special elements like embeds, images, they're not empty
    if (node.type === 'embed' || node.type === 'image' || node.type === 'video') {
      return false;
    }
    return true;
  };

  // Helper function to strip leading empty paragraphs/headings before saving
  const stripLeadingEmptyElements = (content: Descendant[]): Descendant[] => {
    if (!content || content.length === 0) return content;
    
    let startIndex = 0;
    for (let i = 0; i < content.length; i++) {
      const node = content[i] as any;
      const nodeType = node.type;
      // Skip empty paragraphs and headings at the start
      if ((nodeType === 'paragraph' || nodeType === 'heading') && isEmptyNode(node)) {
        startIndex = i + 1;
      } else {
        break; // Stop at first non-empty element
      }
    }
    
    const result = startIndex > 0 ? content.slice(startIndex) : content;
    // Ensure we never return an empty array (Slate requires at least one element)
    if (result.length === 0) {
      return [{ type: 'paragraph', children: [{ text: '' }] }] as Descendant[];
    }
    return result;
  };

  // Helper function to convert content between formats
  const parseContent = (content: any): Descendant[] => {
    if (!content || content === undefined || content === null) {
      return createEmptyDocument();
    }
    
    // If it's already Slate format (array), clean it up
    if (Array.isArray(content)) {
      // Ensure array is not empty and has valid structure
      if (content.length === 0) {
        return createEmptyDocument();
      }
      
      // Clean up the content while preserving valid properties
      const cleanedContent = content.map(node => {
        if ('children' in node) {
          const nodeAny = node as any;
          
          // Clean up children
          const cleanedChildren = nodeAny.children.map((child: any) => {
            // For text nodes, keep only valid properties
            if ('text' in child) {
              const { text, bold, italic, code, underline, strikethrough } = child;
              return { 
                text, 
                ...(bold && { bold }), 
                ...(italic && { italic }), 
                ...(code && { code }),
                ...(underline && { underline }),
                ...(strikethrough && { strikethrough })
              };
            }
            return child;
          });
          
          // Preserve level for headings, it's a valid Slate property for heading elements
          if (nodeAny.type === 'heading' && nodeAny.level) {
            return { ...nodeAny, children: cleanedChildren };
          }
          
          return { ...nodeAny, children: cleanedChildren };
        }
        return node;
      });
      
      // Filter out empty paragraphs and headings from the beginning
      let startIndex = 0;
      for (let i = 0; i < cleanedContent.length; i++) {
        const node = cleanedContent[i];
        const nodeType = (node as any).type;
        // Skip empty paragraphs and headings at the start
        if ((nodeType === 'paragraph' || nodeType === 'heading') && isEmptyNode(node)) {
          startIndex = i + 1;
        } else {
          break; // Stop at first non-empty element
        }
      }
      
      const trimmedContent = startIndex > 0 ? cleanedContent.slice(startIndex) : cleanedContent;
      
      // Don't filter out structural elements - let Slate handle normalization
      return trimmedContent.length > 0 ? trimmedContent : createEmptyDocument();
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

  // Helper function to check if Slate content has meaningful text (recursive for nested elements like toggles)
  const hasContent = (slateValue: Descendant[]): boolean => {
    const checkNode = (node: any): boolean => {
      // If it's a text node, check for content
      if ('text' in node) {
        return node.text.trim().length > 0;
      }
      // If it has children (like paragraph, toggle, etc.), recursively check
      if ('children' in node && Array.isArray(node.children)) {
        return node.children.some((child: any) => checkNode(child));
      }
      // For elements with a type (like toggle, callout), check their title/summary attributes too
      if (node.type === 'toggle' && node.title && node.title.trim().length > 0) {
        return true;
      }
      return false;
    };
    
    return slateValue.some(node => checkNode(node));
  };

  // Helper function to normalize content (remove invalid properties but preserve structure)
  const normalizeContent = useCallback((content: Descendant[]): Descendant[] => {
    const hasActualContent = hasContent(content);
    if (!hasActualContent) {
      return createEmptyDocument();
    }
    
    // Recursively clean a node and its children
    const cleanNode = (node: any): any => {
      // Text nodes - keep valid properties
      if ('text' in node) {
        const { text, bold, italic, code, underline, strikethrough } = node;
        return { 
          text, 
          ...(bold && { bold }), 
          ...(italic && { italic }), 
          ...(code && { code }),
          ...(underline && { underline }),
          ...(strikethrough && { strikethrough })
        };
      }
      
      // Element nodes with children - recursively clean
      if ('children' in node && Array.isArray(node.children)) {
        // Preserve level for heading elements
        return {
          ...node,
          children: node.children.map((child: any) => cleanNode(child))
        };
      }
      
      return node;
    };
    
    const cleanedContent = content.map(cleanNode);
    return cleanedContent.length > 0 ? cleanedContent : createEmptyDocument();
  }, []);

  const { data: article, isLoading } = useQuery<KnowledgeBaseArticle>({
    queryKey: [`/api/knowledge-base/articles/${id}`],
  });

  // Comments query  
  const { data: comments = [] } = useQuery({
    queryKey: [`/api/knowledge-base/articles/${id}/comments`],
    enabled: !!id,
  });

  // Set bookmark and like states when article loads
  useEffect(() => {
    if (article) {
      setIsBookmarked((article as any).isBookmarked || false);
      setIsLiked((article as any).isLiked || false);
    }
  }, [article]);

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
        variant: "default",
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
      // Strip leading empty elements before saving
      const cleanedContent = stripLeadingEmptyElements(content);
      const response = await apiRequest("PUT", `/api/knowledge-base/articles/${id}`, {
        title,
        content: cleanedContent,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/articles/${id}`] });
      setIsEditing(false);
      toast({
        title: "Success",
        variant: "default",
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
    mutationFn: async ({ content, mentions }: { content: string; mentions: any[] }) => {
      const response = await apiRequest("POST", `/api/knowledge-base/articles/${id}/comments`, {
        content,
        mentions,
      });
      return await response.json();
    },
    onSuccess: () => {
      setComment("");
      setCommentMentions([]);
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/articles/${id}/comments`] });
      toast({
        title: "Success",
        variant: "default",
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
      // Strip leading empty elements before saving
      const cleanedContent = stripLeadingEmptyElements(content);
      const response = await apiRequest("PUT", `/api/knowledge-base/articles/${id}`, {
        title,
        content: cleanedContent,
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

  // Delete mutation
  const deleteArticleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/knowledge-base/articles/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        variant: "default",
        description: "Article deleted successfully",
      });
      // Navigate back to knowledge base
      window.location.href = "/resources";
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    },
  });

  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PUT", `/api/knowledge-base/articles/${id}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/articles/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });
      toast({
        title: "Success",
        variant: "default",
        description: "Article status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Parent change mutation (for reparenting articles)
  const parentMutation = useMutation({
    mutationFn: async (parentId: string | null) => {
      const response = await apiRequest("PUT", `/api/knowledge-base/articles/${id}`, { parentId });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/articles/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });
      toast({
        title: "Success",
        variant: "default",
        description: "Article moved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to move article",
        variant: "destructive",
      });
    },
  });

  // Category change mutation (for moving articles to different folders)
  const categoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiRequest("PUT", `/api/knowledge-base/articles/${id}`, { categoryId, parentId: null });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/articles/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });
      toast({
        title: "Success",
        variant: "default",
        description: "Article moved to new folder successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to move article",
        variant: "destructive",
      });
    },
  });

  // Build hierarchical category tree for Move To menu
  const buildCategoryTree = useCallback((parentId: string | null = null, level: number = 0): any[] => {
    const result: any[] = [];
    const children = (categories as any[])
      .filter((cat: any) => cat.parentId === parentId || (parentId === null && !cat.parentId))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    
    for (const cat of children) {
      result.push({ ...cat, level });
      result.push(...buildCategoryTree(cat.id, level + 1));
    }
    return result;
  }, [categories]);

  const categoryTree = buildCategoryTree();

  // Reorder sub-pages mutation with optimistic update
  const reorderSubpagesMutation = useMutation({
    mutationFn: async ({ articleOrders }: { articleOrders: { id: string; order: number }[]; optimisticData: any[] }) => {
      const response = await apiRequest("PUT", `/api/knowledge-base/articles/reorder`, { articleOrders });
      return await response.json();
    },
    onMutate: async ({ optimisticData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/knowledge-base/articles'] });
      
      // Snapshot the previous value
      const previousArticles = queryClient.getQueryData<any[]>(['/api/knowledge-base/articles']);
      
      // Optimistically update the cache
      if (previousArticles && optimisticData) {
        const updatedArticles = previousArticles.map(article => {
          const updated = optimisticData.find((a: any) => a.id === article.id);
          if (updated) {
            return { ...article, order: updated.order };
          }
          return article;
        });
        queryClient.setQueryData(['/api/knowledge-base/articles'], updatedArticles);
      }
      
      return { previousArticles };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-base/articles'] });
      toast({
        title: "Success",
        variant: "default",
        description: "Sub-page order updated",
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousArticles) {
        queryClient.setQueryData(['/api/knowledge-base/articles'], context.previousArticles);
      }
      toast({
        title: "Error",
        description: "Failed to reorder sub-pages",
        variant: "destructive",
      });
    },
  });

  // Handle drag end for sub-page reordering
  const handleSubpageDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    if (reorderSubpagesMutation.isPending) return; // Prevent concurrent reorders

    const childArticles = getChildArticles(id || '');
    const items = Array.from(childArticles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Create order updates with optimistic data
    const reorderedItems = items.map((article, index) => ({
      ...article,
      order: index
    }));
    
    const articleOrders = reorderedItems.map(article => ({
      id: article.id,
      order: article.order
    }));

    reorderSubpagesMutation.mutate({ articleOrders, optimisticData: reorderedItems });
  }, [id, getChildArticles, reorderSubpagesMutation]);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    (content: Descendant[], title?: string) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        const articleTitle = title || (article?.title as string) || "";
        const cleanedContent = normalizeContent(content);
        if (typeof articleTitle === 'string' && articleTitle.trim() && hasContent(cleanedContent)) {
          autoSaveMutation.mutate({
            title: articleTitle,
            content: cleanedContent,
          });
        }
      }, 1000); // 1 second delay
    },
    [article?.title, autoSaveMutation]
  );

  // Handle content changes with auto-save
  const handleContentChange = useCallback(
    (newContent: Descendant[]) => {
      const normalizedContent = normalizeContent(newContent);
      setCurrentContent(normalizedContent);
      debouncedAutoSave(normalizedContent);
    },
    [debouncedAutoSave, normalizeContent]
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
      const parsedContent = parseContent(article.content);
      // Strip leading empty elements
      const cleanedContent = stripLeadingEmptyElements(parsedContent);
      setCurrentContent(cleanedContent);
      setEditContent(cleanedContent);
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
      setEditTitle((article.title as string) || "");
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

  // Get computed values
  const breadcrumbs = getBreadcrumbPath((article as any)?.categoryId);
  const articleParentPath = getArticleParentPath((article as any)?.parentId);
  const childArticles = getChildArticles(id || '');
  const headings = extractHeadings(currentContent);
  const relatedArticles = getRelatedArticles(article);
  const articleStatus = (article as any)?.status || 'published';

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto 2xl:max-w-[1800px]">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
        <RouterLink href="/resources">
          <span className="hover:text-foreground cursor-pointer">Resources</span>
        </RouterLink>
        {breadcrumbs.map((cat: any) => (
          <span key={cat.id} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <RouterLink href={`/resources?category=${cat.id}`}>
              <span className="hover:text-foreground cursor-pointer">{cat.name}</span>
            </RouterLink>
          </span>
        ))}
        {/* Parent articles in breadcrumb */}
        {articleParentPath.map((parentArticle: any) => (
          <span key={parentArticle.id} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <RouterLink href={`/resources/articles/${parentArticle.id}`}>
              <span className="hover:text-foreground cursor-pointer">{parentArticle.title}</span>
            </RouterLink>
          </span>
        ))}
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{(article as any)?.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        {/* Title Row - Large title with action buttons */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <Input
              value={editTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="!text-5xl font-bold border-none px-0 shadow-none focus-visible:ring-0 bg-transparent hover:bg-muted/20 transition-colors h-auto py-2"
              style={{ fontSize: '2.25rem', lineHeight: '1.2' }}
              placeholder="Article title..."
            />
          </div>

          {/* Action Buttons - Clean, minimal */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Auto-save indicator */}
            {isAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-[#00C9C6] border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            )}

            {/* Like Button */}
            <Button
              data-testid="button-like"
              variant={isLiked ? "default" : "ghost"}
              size="sm"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              className={isLiked ? "" : "text-muted-foreground hover:text-foreground"}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              {((article as any)?.likeCount || 0) > 0 && (
                <span className="ml-1">{(article as any)?.likeCount}</span>
              )}
            </Button>

            {/* Bookmark Button */}
            <Button
              data-testid="button-bookmark"
              variant={isBookmarked ? "default" : "ghost"}
              size="sm"
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
              className={isBookmarked ? "" : "text-muted-foreground hover:text-foreground"}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>

            {/* Add Sub-page button - only for users with article management permission */}
            {canManageArticles && (
              <RouterLink href={`/resources?createArticle=true&parentId=${id}&categoryId=${(article as any)?.categoryId || ''}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-add-subpage"
                  className="text-[#00C9C6] hover:text-[#00b3b0] hover:bg-[#00C9C6]/10"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </RouterLink>
            )}

            {/* More Actions Dropdown - only for users with article management permission */}
            {canManageArticles && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="button-more-actions">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 max-h-[80vh] overflow-y-auto">
                  {/* Change Status Sub-menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <FileEdit className="w-4 h-4 mr-2" />
                        Change Status
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </DropdownMenuItem>
                    </DropdownMenuTrigger>
                  </DropdownMenu>
                  <DropdownMenuItem 
                    onClick={() => statusMutation.mutate('draft')}
                    disabled={articleStatus === 'draft'}
                    className="pl-8"
                  >
                    <FileEdit className="w-4 h-4 mr-2" />
                    Set as Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => statusMutation.mutate('published')}
                    disabled={articleStatus === 'published'}
                    className="pl-8"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Publish
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => statusMutation.mutate('archived')}
                    disabled={articleStatus === 'archived'}
                    className="pl-8"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Move To Sub-menu - Shows all categories/folders hierarchically */}
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="font-medium">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Move To Folder
                  </DropdownMenuItem>
                  <div className="max-h-[250px] overflow-y-auto">
                    {categoryTree.map((cat: any) => (
                      <DropdownMenuItem 
                        key={cat.id}
                        onClick={() => categoryMutation.mutate(cat.id)}
                        disabled={(article as any)?.categoryId === cat.id && !(article as any)?.parentId}
                        className="truncate"
                        style={{ paddingLeft: `${(cat.level * 16) + 32}px` }}
                      >
                        {cat.level > 0 && <span className="text-muted-foreground mr-1">└</span>}
                        {cat.icon && <span className="mr-1">{cat.icon}</span>}
                        {cat.name}
                      </DropdownMenuItem>
                    ))}
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Nest Under Article - Shows articles in the same category */}
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="font-medium">
                    <FileText className="w-4 h-4 mr-2" />
                    Nest Under Article
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => parentMutation.mutate(null)}
                    disabled={!(article as any)?.parentId}
                    className="pl-8"
                  >
                    Top Level (No Parent)
                  </DropdownMenuItem>
                  <div className="max-h-[200px] overflow-y-auto">
                    {(allArticles as any[])
                      .filter((a: any) => a.id !== id && a.categoryId === (article as any)?.categoryId)
                      .map((potentialParent: any) => (
                        <DropdownMenuItem 
                          key={potentialParent.id}
                          onClick={() => parentMutation.mutate(potentialParent.id)}
                          disabled={(article as any)?.parentId === potentialParent.id}
                          className="pl-8 truncate"
                        >
                          {potentialParent.title}
                        </DropdownMenuItem>
                      ))
                    }
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => setShowPermissionsModal(true)}
                    data-testid="menu-settings"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    data-testid="menu-delete"
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Metadata Row - Clean, subtle */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <Badge 
            variant={articleStatus === 'published' ? 'default' : articleStatus === 'draft' ? 'secondary' : 'outline'}
            className={
              articleStatus === 'published' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
              articleStatus === 'draft' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
              'bg-gray-100 text-gray-800 hover:bg-gray-100'
            }
          >
            {articleStatus === 'published' && <Check className="w-3 h-3 mr-1" />}
            {articleStatus === 'draft' && <FileEdit className="w-3 h-3 mr-1" />}
            {articleStatus === 'archived' && <History className="w-3 h-3 mr-1" />}
            {articleStatus.charAt(0).toUpperCase() + articleStatus.slice(1)}
          </Badge>
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {(article as any)?.authorName || 'Unknown'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {(article as any)?.createdAt ? format(new Date((article as any).createdAt), 'MMM d, yyyy') : ''}
          </span>
          {((article as any)?.viewCount || 0) > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {(article as any)?.viewCount} views
            </span>
          )}
        </div>

        {/* Tags */}
        {(article as any)?.tags && (article as any).tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {((article as any)?.tags || []).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator className="mb-6" />

      {/* Main content with TOC sidebar */}
      <div className="flex gap-6">
        {/* Article Content */}
        <div className="flex-1 min-w-0">
          {/* Child Articles (Sub-pages) - At top with drag-and-drop reordering */}
          {childArticles.length > 0 && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#00C9C6]" />
                  <h3 className="text-lg font-semibold">Sub-pages</h3>
                  <Badge variant="secondary" className="text-xs">
                    {childArticles.length}
                  </Badge>
                </div>
                <DragDropContext onDragEnd={handleSubpageDragEnd}>
                  <Droppable droppableId="subpages">
                    {(provided) => (
                      <div 
                        className="grid gap-3"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {childArticles.map((child: any, index: number) => (
                          <Draggable key={child.id} draggableId={child.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-start gap-3 p-3 rounded-lg transition-colors group border ${
                                  snapshot.isDragging 
                                    ? 'bg-muted shadow-lg border-[#00C9C6]' 
                                    : 'hover:bg-muted/50 border-border/50'
                                }`}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing mt-0.5"
                                >
                                  <GripVertical className="w-4 h-4 text-muted-foreground hover:text-[#00C9C6]" />
                                </div>
                                <RouterLink href={`/resources/articles/${child.id}`} className="flex-1 min-w-0 flex items-start gap-3 cursor-pointer">
                                  <FileText className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-[#00C9C6]" />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium group-hover:text-[#00C9C6] truncate">
                                      {child.title}
                                    </h4>
                                    {child.excerpt && (
                                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                        {child.excerpt}
                                      </p>
                                    )}
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#00C9C6]" />
                                </RouterLink>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>
          )}

          <Card className="mb-8">
            <CardContent className="p-8">
              {(article as any)?.featuredImage ? (
                <img 
                  src={(article as any)?.featuredImage}
                  alt={(article as any)?.title || ''}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              ) : null}
              
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <SlateEditor
                  key={`article-${id}`}
                  value={currentContent}
                  onChange={handleContentChange}
                  placeholder="Write your article content... Type '/' for commands"
                />
              </div>
            </CardContent>
          </Card>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#00C9C6]" />
                  <h3 className="text-lg font-semibold">Related Articles</h3>
                </div>
                <div className="grid gap-3">
                  {relatedArticles.map((related: any) => (
                    <RouterLink key={related.id} href={`/resources/${related.id}`}>
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                        <FileText className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-[#00C9C6]" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm group-hover:text-[#00C9C6] truncate">
                            {related.title}
                          </p>
                          {related.excerpt && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {related.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </RouterLink>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Table of Contents Sidebar */}
        {headings.length > 0 && (
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <List className="w-4 h-4 text-[#00C9C6]" />
                    <h4 className="font-semibold text-sm">On This Page</h4>
                  </div>
                  <ScrollArea className="max-h-[60vh]">
                    <nav className="space-y-1">
                      {headings.map((heading, index) => (
                        <a
                          key={index}
                          href={`#${heading.id}`}
                          className={`block text-sm hover:text-[#00C9C6] transition-colors ${
                            heading.level === 1 ? 'font-medium pl-0' :
                            heading.level === 2 ? 'pl-3 text-muted-foreground' :
                            'pl-6 text-muted-foreground text-xs'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            const element = document.getElementById(heading.id);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                        >
                          {heading.text}
                        </a>
                      ))}
                    </nav>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              Comments ({(comments as any[] || []).length || 0})
            </h3>
          </div>

          {/* Add Comment */}
          <div className="mb-6">
            <MentionInput
              data-testid="textarea-comment"
              placeholder="Share your thoughts... Type @ to mention someone"
              value={comment}
              onChange={(newValue, mentions) => {
                setComment(newValue);
                setCommentMentions(mentions);
              }}
              className="mb-3"
            />
            <Button
              data-testid="button-submit-comment"
              onClick={() => {
                // SIMPLE CONVERSION: Convert @Name to @[Name](id) format before sending
                let finalContent = comment;
                const finalMentions: string[] = [];
                
                // Find all @Name patterns and convert them
                const staffList = staff || [];
                const mentionMatches = comment.matchAll(/@([A-Za-z][A-Za-z\s'-]+?)(?=[\s.,!?;:)\]\n]|$)/g);
                
                for (const match of mentionMatches) {
                  const fullMatch = match[0]; // "@Dustin Mathews"
                  const name = match[1].trim(); // "Dustin Mathews"
                  
                  // Find matching staff member
                  const staffMatch = staffList.find(s => {
                    const fullName = `${s.firstName} ${s.lastName}`;
                    return fullName.toLowerCase() === name.toLowerCase();
                  });
                  
                  if (staffMatch) {
                    const storageFormat = `@[${staffMatch.firstName} ${staffMatch.lastName}](${staffMatch.id})`;
                    finalContent = finalContent.replace(fullMatch, storageFormat);
                    finalMentions.push(staffMatch.id);
                  }
                }
                
                commentMutation.mutate({ content: finalContent, mentions: finalMentions });
              }}
              disabled={!comment.trim() || commentMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              Post Comment
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Comments List */}
          <div className="space-y-4">
            {(comments as any[] || []).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              ((comments as any[]) || []).map((comment: any) => (
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
                    <div className="text-sm">
                      <MentionText text={comment.content} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{(article as any)?.title}"? 
              This action cannot be undone and will permanently remove this article and all its comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteArticleMutation.mutate();
                setShowDeleteDialog(false);
              }}
              disabled={deleteArticleMutation.isPending}
              className="bg-red-600 hover:bg-red-600/90"
            >
              {deleteArticleMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permissions Modal */}
      <ArticlePermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        articleId={id || ''}
        articleTitle={(article as any)?.title || ''}
      />
    </div>
  );
}
