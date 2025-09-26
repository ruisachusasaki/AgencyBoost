import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface MentionMatch {
  start: number;
  end: number;
  text: string;
  userId?: string;
  userName?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: MentionMatch[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

export function MentionInput({
  value,
  onChange,
  placeholder = "Type @ to mention someone...",
  className,
  disabled,
  "data-testid": dataTestId,
}: MentionInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fetch staff data for mentions
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Parse mentions from the text
  const parseMentions = useCallback((text: string): MentionMatch[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: MentionMatch[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        userName: match[1],
        userId: match[2],
      });
    }

    return mentions;
  }, []);

  // Filter staff based on mention query
  const filteredStaff = staff.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return fullName.includes(mentionQuery.toLowerCase());
  }).slice(0, 5); // Limit to 5 suggestions
  

  // Check for @ symbol and show dropdown
  const checkForMention = useCallback((text: string, position: number) => {
    const beforeCursor = text.slice(0, position);
    const lastAtSymbol = beforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const afterAt = beforeCursor.slice(lastAtSymbol + 1);
      // Check if there's no space after @ and we're not inside an existing mention
      if (!afterAt.includes(' ') && !afterAt.includes('\n') && 
          !/^[\w.-]*\[/.test(afterAt) && // Don't trigger if we're inside @[Name](id)
          /^[\w.-]*$/.test(afterAt)) {    // Only alphanumeric, dots, dashes
        setMentionQuery(afterAt);
        setIsDropdownOpen(true);
        setSelectedIndex(0);
        
        // Calculate dropdown position relative to viewport - SIMPLIFIED
        const textarea = textareaRef.current;
        if (textarea) {
          const rect = textarea.getBoundingClientRect();
          
          setDropdownPosition({
            top: rect.bottom + 5, // Just below the textarea
            left: rect.left,
          });
        }
        return;
      }
    }
    
    setIsDropdownOpen(false);
    setMentionQuery("");
  }, [staff]);

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newPosition = e.target.selectionStart || 0;
    
    setCursorPosition(newPosition);
    checkForMention(newValue, newPosition);
    
    const mentions = parseMentions(newValue);
    onChange(newValue, mentions);
  };

  // Handle scroll synchronization
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Handle cursor position change
  const handleCursorChange = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const newPosition = textarea.selectionStart || 0;
      setCursorPosition(newPosition);
      checkForMention(value, newPosition);
    }
  };

  // Insert mention
  const insertMention = (staff: Staff) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    const lastAtSymbol = beforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const beforeMention = value.slice(0, lastAtSymbol);
      const mentionText = `@[${staff.firstName} ${staff.lastName}](${staff.id})`;
      const newValue = beforeMention + mentionText + afterCursor;
      const newCursorPosition = lastAtSymbol + mentionText.length;
      
      const mentions = parseMentions(newValue);
      onChange(newValue, mentions);
      
      // Set cursor position after mention
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
    
    setIsDropdownOpen(false);
    setMentionQuery("");
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredStaff.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filteredStaff[selectedIndex]) {
          insertMention(filteredStaff[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        setMentionQuery("");
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setMentionQuery("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync scroll position on value change
  useEffect(() => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [value]);

  // Render text with highlighted mentions while preserving exact width
  const renderTextWithMentions = () => {
    const mentions = parseMentions(value);
    if (mentions.length === 0) return value;

    let lastIndex = 0;
    const parts = [];

    mentions.forEach((mention, index) => {
      // Add text before mention
      if (mention.start > lastIndex) {
        parts.push(value.slice(lastIndex, mention.start));
      }
      
      // Render mention with exact character-by-character width preservation
      // Source: @[Name](id) -> visible: @ + Name, hidden: [ + ](id)
      parts.push(
        <span key={index}>
          <span className="bg-primary/20 text-primary rounded">@</span>
          <span className="opacity-0 select-none">[</span>
          <span className="bg-primary/20 text-primary rounded">{mention.userName}</span>
          <span className="opacity-0 select-none">]({mention.userId})</span>
        </span>
      );
      
      lastIndex = mention.end;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(value.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div className="relative">
      {/* Visual overlay showing styled text with @Name only */}
      <div 
        ref={overlayRef}
        className={cn(
          "absolute inset-0 pointer-events-none z-10 px-3 py-2 min-h-[80px] border border-transparent rounded-md text-sm whitespace-pre-wrap break-words overflow-auto text-foreground",
          disabled && "opacity-50"
        )}
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
        }}
      >
        {value === "" ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          renderTextWithMentions()
        )}
      </div>
      
      {/* Actual textarea - transparent text for functionality */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onSelect={handleCursorChange}
        onClick={handleCursorChange}
        onScroll={handleScroll}
        placeholder="" // Hide native placeholder
        className={cn("min-h-[80px] relative z-20 text-transparent caret-neutral-900 dark:caret-neutral-100 selection:bg-blue-200", className)}
        disabled={disabled}
        data-testid={dataTestId}
        style={{
          background: 'transparent',
        }}
      />
      
      {/* Mention suggestions dropdown - rendered via portal */}
      {isDropdownOpen && filteredStaff.length > 0 && (() => {
        return createPortal(
          <Card 
            ref={dropdownRef}
            className="fixed z-[9999] w-64 max-h-48 overflow-y-auto shadow-lg border"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            <div className="p-2">
              <div className="text-xs text-muted-foreground mb-2 px-2">
                Select a team member:
              </div>
              {filteredStaff.map((member, index) => (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                    index === selectedIndex 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => insertMention(member)}
                  data-testid={`mention-option-${member.id}`}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {member.firstName[0]}{member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-xs opacity-70 truncate">
                      {member.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>,
          document.body
        );
      })()}
    </div>
  );
}