import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Plus, ChevronDown, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tag } from "@shared/schema";

interface TagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TagSelector({
  value = [],
  onChange,
  placeholder = "Add tags...",
  disabled = false,
  className,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const selectedTags = tags.filter((tag) => value.includes(tag.name));
  const availableTags = tags.filter((tag) => !value.includes(tag.name));

  const handleSelect = (tagName: string) => {
    if (!value.includes(tagName)) {
      onChange([...value, tagName]);
    }
    setSearch("");
    setOpen(false);
  };

  const handleRemove = (tagName: string) => {
    onChange(value.filter((t) => t !== tagName));
  };

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            data-testid={`tag-badge-${tag.id}`}
            style={{ 
              backgroundColor: tag.color || "#46a1a0",
              color: "white"
            }}
            className="flex items-center gap-1 pr-1"
          >
            <TagIcon className="h-3 w-3" />
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(tag.name)}
                className="ml-1 rounded-full hover:bg-white/20 p-0.5"
                data-testid={`tag-remove-${tag.id}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {value.filter(v => !tags.find(t => t.name === v)).map((customTag) => (
          <Badge
            key={customTag}
            data-testid={`tag-badge-custom-${customTag}`}
            variant="secondary"
            className="flex items-center gap-1 pr-1"
          >
            <TagIcon className="h-3 w-3" />
            {customTag}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(customTag)}
                className="ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/20 p-0.5"
                data-testid={`tag-remove-custom-${customTag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit gap-1 h-8"
              data-testid="tag-selector-trigger"
            >
              <Plus className="h-3.5 w-3.5" />
              {placeholder}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search tags..."
                value={search}
                onValueChange={setSearch}
                data-testid="tag-search-input"
              />
              <CommandList>
                <CommandEmpty>
                  {search ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No tags found
                    </div>
                  ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No more tags available
                    </div>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleSelect(tag.name)}
                      className="flex items-center gap-2 cursor-pointer"
                      data-testid={`tag-option-${tag.id}`}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color || "#46a1a0" }}
                      />
                      <span>{tag.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

interface TagBadgeProps {
  name: string;
  color?: string;
  className?: string;
}

export function TagBadge({ name, color = "#46a1a0", className }: TagBadgeProps) {
  return (
    <Badge
      style={{ 
        backgroundColor: color,
        color: "white"
      }}
      className={cn("flex items-center gap-1 text-xs", className)}
    >
      <TagIcon className="h-3 w-3" />
      {name}
    </Badge>
  );
}

interface TagDisplayProps {
  tags: string[];
  className?: string;
}

export function TagDisplay({ tags, className }: TagDisplayProps) {
  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  if (!tags || tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tagName) => {
        const tagData = allTags.find((t) => t.name === tagName);
        return (
          <TagBadge
            key={tagName}
            name={tagName}
            color={tagData?.color || "#46a1a0"}
          />
        );
      })}
    </div>
  );
}
