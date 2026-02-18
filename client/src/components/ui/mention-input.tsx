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

interface ConfirmedMention {
  userId: string;
  userName: string;
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
  const [displayValue, setDisplayValue] = useState(value);
  const [confirmedMentions, setConfirmedMentions] = useState<ConfirmedMention[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

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

  const convertToDisplay = useCallback((text: string): string => {
    return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
  }, []);

  const convertToStorage = useCallback((displayText: string, knownMentions: ConfirmedMention[]): string => {
    let result = displayText;
    const allKnown = [...knownMentions];

    staff.forEach(s => {
      const fullName = `${s.firstName} ${s.lastName}`.trim();
      if (!allKnown.find(m => m.userId === s.id)) {
        allKnown.push({ userId: s.id, userName: fullName });
      }
    });

    allKnown.sort((a, b) => b.userName.length - a.userName.length);

    for (const mention of allKnown) {
      const escapedName = mention.userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`@${escapedName}(?![\\w])`, 'gi');
      result = result.replace(pattern, `@[${mention.userName}](${mention.userId})`);
    }

    return result;
  }, [staff]);

  useEffect(() => {
    const display = convertToDisplay(value);
    setDisplayValue(display);

    const mentions = parseMentions(value);
    if (mentions.length > 0) {
      const existing = mentions.map(m => ({
        userId: m.userId!,
        userName: m.userName!,
      }));
      setConfirmedMentions(prev => {
        const merged = [...prev];
        for (const e of existing) {
          if (!merged.find(m => m.userId === e.userId)) {
            merged.push(e);
          }
        }
        return merged;
      });
    }
  }, [value, convertToDisplay, parseMentions]);

  useEffect(() => {
    if (!value || !displayValue) return;

    if (staff.length > 0 && displayValue) {
      const newStorageValue = convertToStorage(displayValue, confirmedMentions);
      const newMentions = parseMentions(newStorageValue);

      if (newStorageValue !== value) {
        onChange(newStorageValue, newMentions);
      }
    }
  }, [staff.length]);

  const filteredStaff = staff.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return fullName.includes(mentionQuery.toLowerCase());
  }).slice(0, 5);

  const checkForMention = useCallback((text: string, position: number) => {
    const beforeCursor = text.slice(0, position);
    const lastAtSymbol = beforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const afterAt = beforeCursor.slice(lastAtSymbol + 1);
      if (afterAt.length <= 30 && !afterAt.includes('\n') &&
          !/\[/.test(afterAt) &&
          /^[\w\s.-]*$/.test(afterAt) &&
          (afterAt.split(/\s+/).length <= 3)) {
        setMentionQuery(afterAt);
        setIsDropdownOpen(true);
        setSelectedIndex(0);

        const textarea = textareaRef.current;
        if (textarea) {
          const rect = textarea.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 5,
            left: rect.left,
          });
        }
        return;
      }
    }

    setIsDropdownOpen(false);
    setMentionQuery("");
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDisplayValue = e.target.value;
    const newPosition = e.target.selectionStart || 0;

    setDisplayValue(newDisplayValue);
    setCursorPosition(newPosition);
    checkForMention(newDisplayValue, newPosition);

    const storageValue = convertToStorage(newDisplayValue, confirmedMentions);
    const updatedMentions = parseMentions(storageValue);

    onChange(storageValue, updatedMentions);
  };

  const handleCursorChange = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const newPosition = textarea.selectionStart || 0;
      setCursorPosition(newPosition);
      checkForMention(displayValue, newPosition);
    }
  };

  const handleBlur = () => {
    const storageValue = convertToStorage(displayValue, confirmedMentions);
    const mentions = parseMentions(storageValue);
    onChange(storageValue, mentions);
    setDisplayValue(convertToDisplay(storageValue));
    setIsDropdownOpen(false);
  };

  const insertMention = (member: Staff) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeCursor = displayValue.slice(0, cursorPosition);
    const afterCursor = displayValue.slice(cursorPosition);
    const lastAtSymbol = beforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const beforeMention = displayValue.slice(0, lastAtSymbol);
      const fullName = `${member.firstName} ${member.lastName}`;
      const mentionDisplay = `@${fullName}`;
      const separator = afterCursor.length === 0 || afterCursor[0] === ' ' || afterCursor[0] === '\n' ? ' ' : ' ';
      const newDisplayValue = beforeMention + mentionDisplay + separator + afterCursor;
      const newCursorPosition = lastAtSymbol + mentionDisplay.length + separator.length;

      setDisplayValue(newDisplayValue);

      setConfirmedMentions(prev => {
        if (prev.find(m => m.userId === member.id)) return prev;
        return [...prev, { userId: member.id, userName: fullName }];
      });

      const mentionStorage = `@[${fullName}](${member.id})`;
      const newStorageValue = beforeMention + mentionStorage + separator + afterCursor;
      const mentions = parseMentions(newStorageValue);
      onChange(newStorageValue, mentions);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }

    setIsDropdownOpen(false);
    setMentionQuery("");
  };

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
