import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Edit, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Task } from "@shared/schema";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface TaskDescriptionCardProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => Promise<void>;
}

export default function TaskDescriptionCard({ task, onUpdate }: TaskDescriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.description || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  // Configure display limits
  const COLLAPSED_HEIGHT = 120; // pixels
  const COLLAPSED_LINES = 4; // maximum lines to show when collapsed

  // Quill toolbar configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'align', 'color', 'background', 'code-block'
  ];

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

  // Strip HTML tags for length calculation
  const stripHtml = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  // Check if content needs expansion capability
  const needsExpansion = task.description && (
    stripHtml(task.description).length > 300 || 
    stripHtml(task.description).split('\n').length > COLLAPSED_LINES
  );

  const displayDescription = () => {
    if (!task.description) return "";
    
    if (!needsExpansion || isExpanded) {
      return task.description;
    }
    
    // For HTML content, we need to truncate more carefully
    const plainText = stripHtml(task.description);
    if (plainText.length <= 300) {
      return task.description;
    }
    
    // Create a truncated version by limiting text content
    const words = plainText.split(' ');
    const truncatedWords = words.slice(0, 50); // Roughly ~300 characters
    const truncatedText = truncatedWords.join(' ') + '...';
    
    // Return as plain text for truncated view
    return truncatedText;
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
            <div 
              className="quill-editor-container"
              onKeyDown={handleKeyDown}
            >
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={editValue}
                onChange={setEditValue}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Add a description for this task..."
                style={{ minHeight: '150px' }}
                data-testid="quill-description"
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
                  className={`text-slate-600 cursor-text hover:bg-slate-50 p-2 rounded transition-colors prose prose-sm max-w-none ${
                    needsExpansion && !isExpanded ? 'overflow-hidden' : ''
                  }`}
                  style={
                    needsExpansion && !isExpanded
                      ? { maxHeight: `${COLLAPSED_HEIGHT}px` }
                      : {}
                  }
                  onClick={() => setIsEditing(true)}
                  data-testid="text-description"
                  dangerouslySetInnerHTML={{ 
                    __html: needsExpansion && !isExpanded 
                      ? displayDescription() 
                      : task.description 
                  }}
                />
                
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