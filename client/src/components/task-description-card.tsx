import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Edit, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Task } from "@shared/schema";
import { RichTextEditor } from "@/components/rich-text-editor";

import { marked } from "marked";
import DOMPurify from "dompurify";
interface TaskDescriptionCardProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => Promise<void>;
}

export default function TaskDescriptionCard({ task, onUpdate }: TaskDescriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.description || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(task.description || "");
    }
  }, [task.description, isEditing]);
  const COLLAPSED_HEIGHT = 150;
  const COLLAPSED_LINES = 6;

  const toggleChecklistItem = useCallback(async (checkboxIndex: number) => {
    const description = task.description;
    if (!description) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(description, 'text/html');
    const taskItems = doc.querySelectorAll('li[data-type="taskItem"]');

    if (checkboxIndex >= 0 && checkboxIndex < taskItems.length) {
      const item = taskItems[checkboxIndex];
      const currentChecked = item.getAttribute('data-checked') === 'true';
      const newChecked = !currentChecked;

      item.setAttribute('data-checked', newChecked ? 'true' : 'false');

      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) {
        if (newChecked) {
          checkbox.setAttribute('checked', 'checked');
        } else {
          checkbox.removeAttribute('checked');
        }
      }

      const updatedHtml = doc.body.innerHTML;
      try {
        await onUpdate({ description: updatedHtml });
      } catch (error) {
        console.error("Error toggling checklist item:", error);
      }
    }
  }, [task.description, onUpdate]);

  useEffect(() => {
    const container = descriptionRef.current;
    if (!container || isEditing) return;

    const handleCheckboxClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
        const taskItemLi = target.closest('li[data-type="taskItem"]');
        if (!taskItemLi) return;

        e.preventDefault();
        e.stopPropagation();

        const allTaskItems = container.querySelectorAll('li[data-type="taskItem"]');
        const index = Array.from(allTaskItems).indexOf(taskItemLi);
        if (index >= 0) {
          toggleChecklistItem(index);
        }
      }
    };

    container.addEventListener('click', handleCheckboxClick, true);
    return () => {
      container.removeEventListener('click', handleCheckboxClick, true);
    };
  }, [isEditing, toggleChecklistItem]);

  const handleSave = async () => {
    if (editValue === task.description) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate({ description: editValue || null });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating description:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(task.description || "");
    setIsEditing(false);
  };

  const convertMarkdownToHtml = (content: string): string => {
    if (!content) return "";
    const hasHtmlTags = /<(div|p|h[1-6]|ul|ol|li|table|br|span|a|strong|em)[^>]*>/i.test(content);
    if (hasHtmlTags) {
      return DOMPurify.sanitize(content, {
        ADD_TAGS: ['input'],
        ADD_ATTR: ['checked', 'type', 'data-checked', 'data-type'],
      });
    }
    try {
      const html = marked.parse(content, { async: false }) as string;
      return DOMPurify.sanitize(html);
    } catch (e) {
      return DOMPurify.sanitize(content);
    }
  };

  const stripHtml = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const needsExpansion = task.description && stripHtml(task.description).length > 250;

  const handleDescriptionClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      return;
    }
    const taskItemLabel = target.closest('li[data-type="taskItem"] > label');
    if (taskItemLabel) {
      return;
    }
    setIsEditing(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Description
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 hover:bg-slate-100"
              data-testid="button-edit-description"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="group">
        {isEditing ? (
          <div className="space-y-3">
            <div data-testid="rich-text-description">
              <RichTextEditor
                content={editValue}
                onChange={setEditValue}
                placeholder="Add a description for this task..."
                className="min-h-[200px] border rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                data-testid="button-save-description"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                data-testid="button-cancel-description"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Escape to cancel • Ctrl/Cmd + Enter to save
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {task.description ? (
              <>
                <div
                  ref={descriptionRef}
                  className={`text-slate-600 dark:text-slate-300 cursor-text hover:bg-slate-50 dark:hover:bg-slate-800 p-3 rounded-lg transition-all duration-200 prose prose-sm max-w-none dark:prose-invert prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-800 dark:prose-strong:text-slate-100 prose-em:text-slate-600 dark:prose-em:text-slate-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-slate-300 dark:prose-blockquote:border-l-slate-600 prose-ul:text-slate-700 dark:prose-ul:text-slate-300 prose-ol:text-slate-700 dark:prose-ol:text-slate-300 ${
                    needsExpansion && !isExpanded 
                      ? 'overflow-hidden relative' 
                      : ''
                  }`}
                  style={
                    needsExpansion && !isExpanded
                      ? { 
                          maxHeight: `${COLLAPSED_HEIGHT}px`,
                          maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
                        }
                      : {}
                  }
                  onClick={handleDescriptionClick}
                  data-testid="text-description"
                  dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(task.description || "") }}
                />
                
                {needsExpansion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-[#00C9C6] hover:text-[#00C9C6]/90 hover:bg-[#00C9C6]/10 p-2 h-auto font-medium text-sm rounded-md transition-colors"
                    data-testid="button-toggle-description"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1.5" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1.5" />
                        Show more
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div
                className="text-slate-400 italic cursor-text hover:bg-slate-50 p-3 rounded-lg transition-colors border-2 border-dashed border-slate-200 hover:border-slate-300"
                onClick={() => setIsEditing(true)}
                data-testid="text-no-description"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Click to add a description...
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
