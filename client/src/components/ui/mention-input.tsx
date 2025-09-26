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
  const [displayValue, setDisplayValue] = useState(value); // Clean display value
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Convert storage format (@[Name](id)) to display format (@Name)
  const convertToDisplay = useCallback((text: string): string => {
    return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
  }, []);

  // Convert display format (@Name) to storage format (@[Name](id)) using stored mentions
  const convertToStorage = useCallback((displayText: string, mentions: MentionMatch[]): string => {
    let result = displayText;
    
    // Find all @Name patterns in the text (including multi-word names)
    const displayMentions = displayText.match(/@[A-Za-z]+(?:\s+[A-Za-z]+)*/g) || [];
    
    displayMentions.forEach(displayMention => {
      const name = displayMention.slice(1); // Remove @
      
      // First try to find in stored mentions (from previous selections)
      const storedMention = mentions.find(m => m.userName === name);
      if (storedMention) {
        result = result.replace(displayMention, `@[${storedMention.userName}](${storedMention.userId})`);
        return;
      }
      
      // If not found in stored mentions, try to match against staff data
      // This handles manually typed mentions like "@Che Oliver"
      const matchedStaff = staff.find(s => {
        const fullName = `${s.firstName} ${s.lastName}`;
        return fullName.toLowerCase() === name.toLowerCase();
      });
      
      if (matchedStaff) {
        const fullName = `${matchedStaff.firstName} ${matchedStaff.lastName}`;
        result = result.replace(displayMention, `@[${fullName}](${matchedStaff.id})`);
      }
    });
    
    return result;
  }, [staff]);

  // Update displayValue when value prop changes
  useEffect(() => {
    setDisplayValue(convertToDisplay(value));
  }, [value, convertToDisplay]);

  // Re-run conversion when staff data loads to catch any unresolved mentions
  useEffect(() => {
    if (staff.length > 0 && displayValue) {
      const existingMentions = parseMentions(value);
      const newStorageValue = convertToStorage(displayValue, existingMentions);
      const newMentions = parseMentions(newStorageValue);
      
      // Only emit if the storage value actually changed
      if (newStorageValue !== value) {
        onChange(newStorageValue, newMentions);
      }
    }
  }, [staff.length, displayValue, value, convertToStorage, parseMentions, onChange]);

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
    const newDisplayValue = e.target.value;
    const newPosition = e.target.selectionStart || 0;
    
    setDisplayValue(newDisplayValue);
    setCursorPosition(newPosition);
    checkForMention(newDisplayValue, newPosition);
    
    // Convert to storage format and get mentions from the original value
    const existingMentions = parseMentions(value);
    const storageValue = convertToStorage(newDisplayValue, existingMentions);
    const updatedMentions = parseMentions(storageValue);
    
    onChange(storageValue, updatedMentions);
  };


  // Handle cursor position change
  const handleCursorChange = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const newPosition = textarea.selectionStart || 0;
      setCursorPosition(newPosition);
      checkForMention(displayValue, newPosition);
    }
  };

  // Handle blur - final chance to convert any unresolved mentions
  const handleBlur = () => {
    if (staff.length > 0 && displayValue) {
      const existingMentions = parseMentions(value);
      const newStorageValue = convertToStorage(displayValue, existingMentions);
      const newMentions = parseMentions(newStorageValue);
      
      // Emit the final converted value
      if (newStorageValue !== value) {
        onChange(newStorageValue, newMentions);
      }
    }
    setIsDropdownOpen(false);
  };

  // Insert mention
  const insertMention = (staff: Staff) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeCursor = displayValue.slice(0, cursorPosition);
    const afterCursor = displayValue.slice(cursorPosition);
    const lastAtSymbol = beforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const beforeMention = displayValue.slice(0, lastAtSymbol);
      const mentionDisplay = `@${staff.firstName} ${staff.lastName}`;
      const newDisplayValue = beforeMention + mentionDisplay + afterCursor;
      const newCursorPosition = lastAtSymbol + mentionDisplay.length;
      
      setDisplayValue(newDisplayValue);
      
      // Create storage format with the new mention
      const mentionStorage = `@[${staff.firstName} ${staff.lastName}](${staff.id})`;
      const newStorageValue = beforeMention + mentionStorage + afterCursor;
      const mentions = parseMentions(newStorageValue);
      onChange(newStorageValue, mentions);
      
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

  return (
    <div className="relative">
      {/* Simple textarea with clean @Name display */}
      <Textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onSelect={handleCursorChange}
        onClick={handleCursorChange}
        placeholder={placeholder}
        className={cn("min-h-[80px]", className)}
        disabled={disabled}
        data-testid={dataTestId}
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