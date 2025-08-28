import { useState, useEffect } from "react";
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
  MessageCircle, Send, Edit, Trash2, Save, X, CheckSquare,
  ChevronDown, ChevronRight, Code, AlertCircle, Info, AlertTriangle,
  Columns, Palette, HighlighterIcon
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import { SlashCommand, getSlashCommands } from '@/components/slash-command';
import { TextStyle } from '@tiptap/extension-text-style';
import { CalloutExtension, ToggleExtension, ToggleSummary, ToggleContent, ColumnsExtension, ColumnExtension } from '@/components/tiptap-extensions';

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

  // Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Placeholder.configure({
        placeholder: 'Write your article content...',
      }),
      TiptapLink.configure({
        openOnClick: false,
      }),
      TiptapImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
        itemTypeName: 'taskItem',
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'task-item',
        },
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CalloutExtension,
      ToggleExtension,
      ToggleSummary,
      ToggleContent,
      ColumnsExtension,
      ColumnExtension,

      Extension.create({
        name: 'slashCommand',
        addProseMirrorPlugins() {
          return [
            Suggestion({
              editor: this.editor,
              char: '/',
              startOfLine: true,
              command: ({ editor, range, props }) => {
                props.command();
                editor.chain().focus().deleteRange(range).run();
              },
              items: ({ query }) => {
                return getSlashCommands(this.editor)
                  .filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()))
                  .slice(0, 10);
              },
              render: () => {
                let component: ReactRenderer;
                let popup: any;

                return {
                  onStart: (props) => {
                    component = new ReactRenderer(SlashCommand, {
                      props,
                      editor: props.editor,
                    });

                    // Create a temporary element to get positioning
                    const rect = props.clientRect?.();
                    popup = document.createElement('div');
                    popup.style.position = 'absolute';
                    if (rect) {
                      popup.style.top = `${rect.bottom + 10}px`;
                      popup.style.left = `${rect.left}px`;
                    } else {
                      popup.style.top = '0px';
                      popup.style.left = '0px';
                    }
                    popup.style.zIndex = '1000';
                    popup.appendChild(component.element);
                    document.body.appendChild(popup);
                  },

                  onUpdate(props) {
                    component.updateProps(props);
                    
                    // Update position
                    const rect = props.clientRect?.();
                    if (popup && rect) {
                      popup.style.top = `${rect.bottom + 10}px`;
                      popup.style.left = `${rect.left}px`;
                    }
                  },

                  onKeyDown(props) {
                    if (props.event.key === 'Escape') {
                      if (popup && popup.parentNode) {
                        popup.parentNode.removeChild(popup);
                      }
                      return true;
                    }

                    return component.ref?.onKeyDown(props);
                  },

                  onExit() {
                    if (popup && popup.parentNode) {
                      popup.parentNode.removeChild(popup);
                    }
                    component.destroy();
                  },
                };
              },
            }),
          ];
        },
      }),
    ],
    content: editContent,
    onUpdate: ({ editor }) => {
      setEditContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  const { data: article, isLoading } = useQuery({
    queryKey: [`/api/knowledge-base/articles/${id}`],
  });

  // Comments query  
  const { data: comments = [] } = useQuery({
    queryKey: [`/api/knowledge-base/articles/${id}/comments`],
    enabled: !!id,
  });

  // Initialize editor content when article loads
  useEffect(() => {
    if (article && editor && !isEditing) {
      editor.commands.setContent(article.content);
    }
  }, [article, editor, isEditing]);

  // Set initial edit content when starting to edit
  useEffect(() => {
    if (isEditing && article) {
      setEditTitle(article.title);
      setEditContent(article.content);
      if (editor) {
        editor.commands.setContent(article.content);
      }
    }
  }, [isEditing, article, editor]);

  // Fix toggle visibility and add delete functionality
  useEffect(() => {
    if (!isEditing || !editor) return;

    const interval = setInterval(() => {
      const editorElement = editor.view.dom;
      if (!editorElement) return;

      // Force show all toggle content
      const toggleContents = editorElement.querySelectorAll('.toggle-content, [data-toggle-content]');
      toggleContents.forEach((content: Element) => {
        const htmlContent = content as HTMLElement;
        htmlContent.style.display = 'block';
        htmlContent.style.visibility = 'visible';
        htmlContent.style.opacity = '1';
        htmlContent.style.maxHeight = 'none';
        htmlContent.style.overflow = 'visible';
        htmlContent.style.position = 'static';
        htmlContent.style.height = 'auto';
      });

      // Add delete buttons to old toggles AND click handlers to new toggles
      const toggleBlocks = editorElement.querySelectorAll('.toggle-block, details[data-toggle]');
      toggleBlocks.forEach((block: Element) => {
        const htmlBlock = block as HTMLElement;
        if (!htmlBlock.querySelector('.delete-toggle-btn')) {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-toggle-btn';
          deleteBtn.innerHTML = '×';
          deleteBtn.style.cssText = `
            position: absolute !important;
            top: 4px !important;
            right: 4px !important;
            background: #ef4444 !important;
            color: white !important;
            border: none !important;
            border-radius: 50% !important;
            width: 20px !important;
            height: 20px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 12px !important;
            cursor: pointer !important;
            z-index: 1000 !important;
            font-family: monospace !important;
          `;
          
          deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            htmlBlock.remove();
            setEditContent(editor.getHTML());
          });

          deleteBtn.addEventListener('mouseenter', () => {
            deleteBtn.style.background = '#dc2626';
          });

          deleteBtn.addEventListener('mouseleave', () => {
            deleteBtn.style.background = '#ef4444';
          });

          htmlBlock.style.position = 'relative';
          htmlBlock.appendChild(deleteBtn);
        }
      });

      // Add click handlers to new simple toggles in editor (for view mode)
      const simpleToggles = editorElement.querySelectorAll('.simple-toggle');
      simpleToggles.forEach((toggle: Element) => {
        const htmlToggle = toggle as HTMLElement;
        const header = htmlToggle.querySelector('.simple-toggle-header');
        if (header && !header.hasAttribute('data-click-added')) {
          header.setAttribute('data-click-added', 'true');
          if (!isEditing) {
            header.addEventListener('click', (e) => {
              e.preventDefault();
              htmlToggle.classList.toggle('open');
            });
          }
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isEditing, editor]);

  // Add click handlers for toggles in view mode
  useEffect(() => {
    if (isEditing) return;

    const addClickHandlers = () => {
      const toggles = document.querySelectorAll('.article-content .simple-toggle');
      toggles.forEach((toggle) => {
        const header = toggle.querySelector('.simple-toggle-header');
        if (header && !header.hasAttribute('data-view-click-added')) {
          header.setAttribute('data-view-click-added', 'true');
          header.addEventListener('click', () => {
            toggle.classList.toggle('open');
          });
        }
      });
    };

    addClickHandlers();
    
    // Re-run when content changes
    const observer = new MutationObserver(addClickHandlers);
    const articleContent = document.querySelector('.article-content');
    if (articleContent) {
      observer.observe(articleContent, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [isEditing, article?.content]);

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
      editor?.commands.setContent(article.content || "");
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
    editor?.commands.setContent("");
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
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {/* Simple Working Toolbar */}
                <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-600 mr-4">
                    Type <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 rounded">/</kbd> for commands
                  </div>
                  
                  {/* Basic Formatting */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`h-8 px-2 ${editor?.isActive('bold') ? 'bg-blue-100 text-blue-700' : ''}`}
                  >
                    <strong>B</strong>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`h-8 px-2 ${editor?.isActive('italic') ? 'bg-blue-100 text-blue-700' : ''}`}
                  >
                    <em>I</em>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleHighlight().run()}
                    className={`h-8 px-2 ${editor?.isActive('highlight') ? 'bg-yellow-100 text-yellow-700' : ''}`}
                    title="Highlight text"
                  >
                    <HighlighterIcon className="h-4 w-4" />
                  </Button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                  
                  {/* Quick Access */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleTaskList().run()}
                    className={`h-8 px-2 ${editor?.isActive('taskList') ? 'bg-green-100 text-green-700' : ''}`}
                    title="To-do list"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                    className={`h-8 px-2 ${editor?.isActive('codeBlock') ? 'bg-gray-100 text-gray-700' : ''}`}
                    title="Code block"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Tiptap Editor Content */}
                <EditorContent editor={editor} className="min-h-[400px]" />
              </div>
            ) : (
              <div className="article-content" dangerouslySetInnerHTML={{ __html: article?.content || '' }} />
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