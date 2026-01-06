import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Plus, ChevronDown, Tag as TagIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Tag } from "@shared/schema";

interface TagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function generateRandomColor(): string {
  const colors = [
    "#46a1a0", "#e74c3c", "#3498db", "#9b59b6", "#f39c12", 
    "#1abc9c", "#e91e63", "#00bcd4", "#ff5722", "#607d8b",
    "#8bc34a", "#673ab7", "#2196f3", "#ff9800", "#795548"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
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

  const createTagMutation = useMutation({
    mutationFn: async (tagName: string) => {
      const response = await apiRequest("POST", "/api/tags", {
        name: tagName,
        color: generateRandomColor(),
      });
      return response.json();
    },
    onSuccess: (newTag: Tag) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      if (!value.includes(newTag.name)) {
        onChange([...value, newTag.name]);
      }
      setSearch("");
      setOpen(false);
    },
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

  const exactMatchExists = tags.some(
    (tag) => tag.name.toLowerCase() === search.trim().toLowerCase()
  );
  const showCreateOption = search.trim() && !exactMatchExists && !value.includes(search.trim());

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
                  {search && search.trim() ? (
                    <div className="p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-sm"
                        onClick={() => createTagMutation.mutate(search.trim())}
                        disabled={createTagMutation.isPending}
                        data-testid="create-new-tag-button"
                      >
                        {createTagMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Create "{search.trim()}"
                      </Button>
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
                  {showCreateOption && filteredTags.length > 0 && (
                    <CommandItem
                      value={`create-${search.trim()}`}
                      onSelect={() => createTagMutation.mutate(search.trim())}
                      className="flex items-center gap-2 cursor-pointer border-t mt-1 pt-1"
                      data-testid="create-new-tag-option"
                    >
                      {createTagMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 text-primary" />
                      )}
                      <span>Create "{search.trim()}"</span>
                    </CommandItem>
                  )}
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
