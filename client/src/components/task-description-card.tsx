import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FolderOpen, Edit, Check, X, ChevronDown, ChevronUp, Bold, List, ListChecks, Minus, Palette, Type } from "lucide-react";
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
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Formatting functions
  const insertAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editValue.substring(start, end);
    const newText = editValue.substring(0, start) + before + selectedText + after + editValue.substring(end);
    
    setEditValue(newText);
    
    // Reset cursor position after state update
    setTimeout(() => {
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = editValue.split('\n');
    const currentLineIndex = editValue.substring(0, start).split('\n').length - 1;
    
    lines[currentLineIndex] = prefix + lines[currentLineIndex];
    const newText = lines.join('\n');
    setEditValue(newText);
    
    setTimeout(() => {
      const newCursorPos = start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  // Slash command menu options
  const slashCommands = [
    { label: 'Bold Text', command: 'bold', action: () => insertAtCursor('**', '**'), icon: Bold },
    { label: 'Header 1', command: 'h1', action: () => insertAtLineStart('# '), icon: Type },
    { label: 'Header 2', command: 'h2', action: () => insertAtLineStart('## '), icon: Type },
    { label: 'Header 3', command: 'h3', action: () => insertAtLineStart('### '), icon: Type },
    { label: 'Bullet List', command: 'bullet', action: () => insertAtLineStart('- '), icon: List },
    { label: 'Checklist', command: 'check', action: () => insertAtLineStart('- [ ] '), icon: ListChecks },
    { label: 'Divider', command: 'divider', action: () => insertAtCursor('\n---\n'), icon: Minus },
  ];

  const filteredCommands = slashCommands.filter(cmd => 
    cmd.command.toLowerCase().includes(slashFilter.toLowerCase()) ||
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase())
  );

  const handleSlashCommand = (command: typeof slashCommands[0]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Remove the slash and filter text
    const start = textarea.selectionStart;
    const beforeSlash = editValue.substring(0, start - slashFilter.length - 1);
    const afterCursor = editValue.substring(start);
    
    // Update the text without the slash command
    const newText = beforeSlash + afterCursor;
    setEditValue(newText);
    
    // Hide menu first
    setShowSlashMenu(false);
    setSlashFilter('');
    
    // Apply the formatting after a brief delay
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(beforeSlash.length, beforeSlash.length);
        textareaRef.current.focus();
        
        // Apply the specific command formatting
        if (command.command === 'bold') {
          const currentValue = textareaRef.current.value;
          const cursorPos = textareaRef.current.selectionStart;
          const newValue = currentValue.substring(0, cursorPos) + '****' + currentValue.substring(cursorPos);
          setEditValue(newValue);
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(cursorPos + 2, cursorPos + 2);
            }
          }, 0);
        } else {
          command.action();
        }
      }
    }, 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);

    // Check for slash commands
    const textarea = e.target;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
    const currentLine = textBeforeCursor.substring(lastLineStart);
    
    const slashMatch = currentLine.match(/\/(\w*)$/);
    
    if (slashMatch) {
      const filter = slashMatch[1];
      setSlashFilter(filter);
      setShowSlashMenu(true);
      
      // Calculate menu position
      const lines = textBeforeCursor.split('\n');
      const currentLineIndex = lines.length - 1;
      const approxLineHeight = 20;
      const approxCharWidth = 8;
      
      setSlashMenuPosition({
        top: (currentLineIndex + 1) * approxLineHeight + 20,
        left: (currentLine.length - slashMatch[0].length) * approxCharWidth
      });
    } else {
      setShowSlashMenu(false);
      setSlashFilter('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle slash menu navigation
    if (showSlashMenu) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
        setSlashFilter('');
        return;
      }
      
      if (e.key === 'Enter' && filteredCommands.length > 0) {
        e.preventDefault();
        handleSlashCommand(filteredCommands[0]);
        return;
      }
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Could implement arrow navigation here
        return;
      }
    }

    if (e.key === 'Escape') {
      handleCancel();
      return;
    }
    
    // Save with Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
      return;
    }

    // Formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertAtCursor('**', '**');
          break;
        case '1':
          e.preventDefault();
          insertAtLineStart('# ');
          break;
        case '2':
          e.preventDefault();
          insertAtLineStart('## ');
          break;
        case '3':
          e.preventDefault();
          insertAtLineStart('### ');
          break;
        case 'l':
          e.preventDefault();
          insertAtLineStart('- ');
          break;
        case 'shift+l':
          e.preventDefault();
          insertAtLineStart('- [ ] ');
          break;
      }
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

  // Render formatted text (basic markdown-like rendering)
  const renderFormattedText = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-slate-800">{line.substring(4)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold mt-4 mb-2 text-slate-800">{line.substring(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold mt-4 mb-3 text-slate-800">{line.substring(2)}</h1>;
        }
        
        // Checklist items - make them interactive
        if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
          const isChecked = line.startsWith('- [x] ');
          const taskText = line.substring(6);
          
          const toggleCheckbox = () => {
            const newLine = isChecked ? `- [ ] ${taskText}` : `- [x] ${taskText}`;
            const lines = (task.description || '').split('\n');
            lines[index] = newLine;
            const newDescription = lines.join('\n');
            
            onUpdate({ description: newDescription });
          };
          
          return (
            <div key={index} className="flex items-center gap-2 my-1">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 cursor-pointer" 
                checked={isChecked}
                onChange={toggleCheckbox}
              />
              <span className={isChecked ? "line-through text-slate-500" : ""}>
                {taskText}
              </span>
            </div>
          );
        }
        
        // Bullet points
        if (line.startsWith('- ')) {
          return <div key={index} className="flex items-start gap-2 my-1"><span className="text-slate-400 mt-1">•</span><span>{line.substring(2)}</span></div>;
        }
        
        // Dividers
        if (line.trim() === '---') {
          return <hr key={index} className="my-4 border-slate-200" />;
        }
        
        // Regular text with bold formatting
        const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
        
        return line.trim() ? (
          <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: boldFormatted }} />
        ) : (
          <br key={index} />
        );
      });
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
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-slate-50 rounded-md border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAtCursor('**', '**')}
                className="h-8 w-8 p-0"
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAtLineStart('# ')}
                className="h-8 w-8 p-0"
                title="Header 1 (Ctrl+1)"
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAtLineStart('- ')}
                className="h-8 w-8 p-0"
                title="Bullet List (Ctrl+L)"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAtLineStart('- [ ] ')}
                className="h-8 w-8 p-0"
                title="Checklist"
              >
                <ListChecks className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAtCursor('\n---\n')}
                className="h-8 w-8 p-0"
                title="Divider"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={editValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Add a description for this task...

🎯 SLASH COMMANDS - Type / to see menu:
• /bold → **bold text**
• /h1 → # Header 1
• /bullet → - bullet point  
• /check → - [ ] checklist
• /divider → --- line

⌨️ KEYBOARD SHORTCUTS:
• Ctrl+B for bold • Ctrl+1/2/3 for headers • Ctrl+L for bullets

Click description text to edit, then try typing /bold and pressing Enter!"
                className="min-h-[160px] resize-y font-mono text-sm"
                autoFocus
                data-testid="textarea-description"
              />
              
              {/* Slash Command Menu */}
              {showSlashMenu && (
                <div 
                  className="absolute bg-white border border-slate-200 rounded-md shadow-lg z-50 p-1 min-w-[200px] max-h-64 overflow-y-auto"
                  style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
                >
                  {filteredCommands.length > 0 ? (
                    <>
                      <div className="px-3 py-1 text-xs text-slate-400 border-b border-slate-100 mb-1">
                        Type /{slashFilter} or click to insert:
                      </div>
                      {filteredCommands.map((cmd, idx) => (
                        <button
                          key={cmd.command}
                          onClick={() => handleSlashCommand(cmd)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-100 rounded text-sm transition-colors"
                        >
                          <cmd.icon className="h-4 w-4 text-slate-500" />
                          <div>
                            <div className="font-medium">{cmd.label}</div>
                            <div className="text-xs text-slate-500">/{cmd.command}</div>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      No matching commands for "/{slashFilter}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
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
                Esc to cancel • Ctrl+Enter to save
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {task.description ? (
              <>
                <div
                  className={`text-slate-600 cursor-text hover:bg-slate-50 p-2 rounded transition-colors ${
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
                  {renderFormattedText(displayDescription())}
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