import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FolderOpen, Edit, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Task } from "@shared/schema";

interface TaskDescriptionCardProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => Promise<void>;
}

export default function TaskDescriptionCard({ task, onUpdate }: TaskDescriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.description || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Configure display limits
  const COLLAPSED_HEIGHT = 120; // pixels
  const COLLAPSED_LINES = 4; // maximum lines to show when collapsed

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    // Allow Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  // Check if content needs expansion capability
  const needsExpansion = task.description && (
    task.description.length > 300 || 
    task.description.split('\n').length > COLLAPSED_LINES
  );

  const displayDescription = () => {
    if (!task.description) return "";
    
    if (!needsExpansion || isExpanded) {
      return task.description;
    }
    
    // Truncate by lines first, then by character count
    const lines = task.description.split('\n');
    let truncated = lines.slice(0, COLLAPSED_LINES).join('\n');
    
    if (truncated.length > 300) {
      truncated = truncated.substring(0, 297) + "...";
    } else if (lines.length > COLLAPSED_LINES) {
      truncated += "...";
    }
    
    return truncated;
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
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a description for this task..."
              className="min-h-[120px] resize-y"
              autoFocus
              data-testid="textarea-description"
            />
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
                  className={`text-slate-600 whitespace-pre-wrap cursor-text hover:bg-slate-50 p-2 rounded transition-colors ${
                    needsExpansion && !isExpanded ? 'overflow-hidden' : ''
                  }`}
                  style={
                    needsExpansion && !isExpanded
                      ? { maxHeight: `${COLLAPSED_HEIGHT}px` }
                      : {}
                  }
                  onClick={() => setIsEditing(true)}
                  data-testid="text-description"
                >
                  {displayDescription()}
                </div>
                
                {needsExpansion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                    data-testid="button-toggle-description"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show more
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div
                className="text-slate-400 italic cursor-text hover:bg-slate-50 p-2 rounded transition-colors"
                onClick={() => setIsEditing(true)}
                data-testid="text-no-description"
              >
                Click to add a description...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}