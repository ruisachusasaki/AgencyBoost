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
  
  console.log("🔍 Dropdown state:", { isDropdownOpen, mentionQuery, filteredStaff: filteredStaff.length, dropdownPosition });
  
  // Debug the actual coordinates
  if (isDropdownOpen && filteredStaff.length > 0) {
    console.log("🎯 SHOULD BE RENDERING DROPDOWN AT:", dropdownPosition);
  }

  // Check for @ symbol and show dropdown
  const checkForMention = useCallback((text: string, position: number) => {
    console.log("🔍 checkForMention called:", { text, position, staff: staff.length });
    const beforeCursor = text.slice(0, position);
    const lastAtSymbol = beforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const afterAt = beforeCursor.slice(lastAtSymbol + 1);
      console.log("🔍 afterAt:", afterAt);
      // Check if there's no space after @ (valid mention start)
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        console.log("✅ Valid mention detected! Setting dropdown open");
        setMentionQuery(afterAt);
        setIsDropdownOpen(true);
        setSelectedIndex(0);
        
        // Calculate dropdown position relative to viewport
        const textarea = textareaRef.current;
        if (textarea) {
          const rect = textarea.getBoundingClientRect();
          const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
          const lines = beforeCursor.split('\n').length - 1;
          
          setDropdownPosition({
            top: rect.top + window.scrollY + (lines * lineHeight) + 30,
            left: rect.left + window.scrollX + 10,
          });
        }
        return;
      }
    }
    
    console.log("❌ No valid mention found, closing dropdown");
    setIsDropdownOpen(false);
    setMentionQuery("");
  }, [staff]);

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newPosition = e.target.selectionStart || 0;
    
    console.log("🔍 MentionInput handleTextChange:", { newValue, newPosition });
    setCursorPosition(newPosition);
    checkForMention(newValue, newPosition);
    
    const mentions = parseMentions(newValue);
    onChange(newValue, mentions);
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

  // Render text with highlighted mentions
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
      
      // Add highlighted mention
      parts.push(
        <span 
          key={index} 
          className="bg-primary/20 text-primary px-1 rounded"
        >
          @{mention.userName}
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
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
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
        console.log("🚀 ATTEMPTING TO RENDER DROPDOWN VIA PORTAL!");
        console.log("🎯 Portal target exists?", !!document.body);
        console.log("📍 EXACT COORDINATES:", { top: dropdownPosition.top, left: dropdownPosition.left });
        return createPortal(
          <Card 
            ref={dropdownRef}
            className="fixed z-[9999] w-64 max-h-48 overflow-y-auto shadow-lg border"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              backgroundColor: 'red', // DEBUG: Make it obvious
              border: '5px solid blue', // DEBUG: Make it obvious
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