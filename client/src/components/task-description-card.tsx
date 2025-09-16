import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Edit, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Task } from "@shared/schema";
import { RichTextEditor } from "@/components/rich-text-editor";

interface TaskDescriptionCardProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => Promise<void>;
}

export default function TaskDescriptionCard({ task, onUpdate }: TaskDescriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.description || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update edit value when task description changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(task.description || "");
    }
  }, [task.description, isEditing]);
  // Configure display limits
  const COLLAPSED_HEIGHT = 150; // pixels - increased for better text visibility
  const COLLAPSED_LINES = 6; // maximum lines to show when collapsed

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

  // Strip HTML tags for length calculation
  const stripHtml = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  // Check if content needs expansion capability based on rendered height
  const needsExpansion = task.description && stripHtml(task.description).length > 250;

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
            <p className="text-xs text-slate-500">
              Press Escape to cancel • Ctrl/Cmd + Enter to save
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {task.description ? (
              <>
                <div
                  className={`text-slate-600 cursor-text hover:bg-slate-50 p-3 rounded-lg transition-all duration-200 prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-800 prose-em:text-slate-600 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-slate-300 prose-ul:text-slate-700 prose-ol:text-slate-700 ${
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
                  onClick={() => setIsEditing(true)}
                  data-testid="text-description"
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
                
                {needsExpansion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 h-auto font-medium text-sm rounded-md transition-colors"
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