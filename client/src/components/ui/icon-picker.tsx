import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Common icons that are useful for task categories
const popularIcons = [
  'folder', 'file', 'bookmark', 'tag', 'star', 'flag', 'bell', 
  'calendar', 'clock', 'users', 'user', 'settings', 'cog',
  'briefcase', 'home', 'heart', 'mail', 'phone', 'camera',
  'image', 'video', 'music', 'book', 'pen', 'edit',
  'search', 'filter', 'sort', 'grid', 'list', 'map',
  'target', 'award', 'shield', 'key', 'lock', 'unlock',
  'check', 'x', 'plus', 'minus', 'arrow-right', 'arrow-left',
  'chevron-down', 'chevron-up', 'circle', 'square', 'triangle',
  'box', 'package', 'shopping-cart', 'credit-card', 'dollar-sign'
];

// Get all lucide icon names
const allIconNames = Object.keys(LucideIcons).filter(name => 
  name !== 'default' && 
  name !== 'createLucideIcon' &&
  typeof (LucideIcons as any)[name] === 'function'
);

export function IconPicker({ value, onChange, placeholder = "Type icon name...", className }: IconPickerProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredIcons, setFilteredIcons] = useState<string[]>(popularIcons);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (!newValue.trim()) {
      setFilteredIcons(popularIcons);
    } else {
      const filtered = allIconNames.filter(iconName =>
        iconName.toLowerCase().includes(newValue.toLowerCase()) ||
        iconName.replace(/([A-Z])/g, '-$1').toLowerCase().includes(newValue.toLowerCase())
      ).slice(0, 20); // Limit to 20 results
      setFilteredIcons(filtered);
    }
    
    setIsOpen(true);
  };

  const handleIconSelect = (iconName: string) => {
    setInputValue(iconName);
    onChange?.(iconName);
    setIsOpen(false);
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;
    
    return <IconComponent className="h-4 w-4" />;
  };

  const currentIcon = renderIcon(inputValue);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="pr-10"
          />
          {currentIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {currentIcon}
            </div>
          )}
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredIcons.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No icons found
            </div>
          ) : (
            <div className="py-1">
              {filteredIcons.map((iconName) => (
                <Button
                  key={iconName}
                  variant="ghost"
                  className="w-full justify-start px-3 py-2 h-auto text-left hover:bg-gray-50"
                  onClick={() => handleIconSelect(iconName)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {renderIcon(iconName)}
                    </div>
                    <span className="text-sm font-mono">{iconName}</span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}