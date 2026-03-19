import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, X, ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";

const EXCLUDED_EXPORTS = new Set([
  "createLucideIcon", "default", "icons", "createElement",
  "Icon", "LucideIcon", "default"
]);

const allIconNames = Object.keys(LucideIcons)
  .filter(key => {
    if (EXCLUDED_EXPORTS.has(key)) return false;
    if (typeof (LucideIcons as any)[key] !== 'object' && typeof (LucideIcons as any)[key] !== 'function') return false;
    if (key.startsWith('__')) return false;
    if (key[0] !== key[0].toUpperCase()) return false;
    const comp = (LucideIcons as any)[key];
    if (!comp || (!comp.$$typeof && !comp.render && typeof comp !== 'function')) return false;
    return true;
  })
  .sort();

const iconCategories: Record<string, string[]> = {
  "Most Used": ["Home", "User", "Settings", "Search", "Plus", "Edit", "Trash2", "Eye", "Heart", "Star", "Bell", "Mail", "Folder", "File", "Check", "X"],
  "Actions": ["Plus", "Minus", "Edit", "Trash2", "Save", "Download", "Upload", "Copy", "Share", "Send", "Undo", "Redo", "RefreshCw"],
  "Communication": ["Mail", "Phone", "MessageCircle", "MessageSquare", "Video", "Mic", "Volume2", "AtSign"],
  "Business": ["Briefcase", "Calendar", "Clock", "DollarSign", "TrendingUp", "BarChart3", "PieChart", "Target", "Award"],
  "Creative": ["Palette", "Paintbrush", "Pencil", "PenTool", "Brush", "Figma", "Image", "Camera", "Film", "Music"],
  "Technology": ["Smartphone", "Monitor", "Wifi", "Database", "Server", "Code", "Terminal", "Globe", "Cloud"],
  "People": ["Users", "UserPlus", "UserMinus", "UserCheck", "UserX", "User", "Contact"],
};

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  label?: string;
  placeholder?: string;
}

export function IconPicker({ value = "", onChange, label = "Icon", placeholder }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Most Used");
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filteredIcons = useMemo(() => {
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      return allIconNames.filter(icon =>
        icon.toLowerCase().includes(search)
      );
    }
    if (selectedCategory === "All") {
      return allIconNames;
    }
    const categoryIcons = iconCategories[selectedCategory];
    if (!categoryIcons) return allIconNames;
    return categoryIcons.filter(name => allIconNames.includes(name));
  }, [searchTerm, selectedCategory]);

  const renderIcon = useCallback((iconName: string) => {
    let IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent && iconName) {
      const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1);
      IconComponent = (LucideIcons as any)[pascalCase];
    }
    if (!IconComponent) {
      return <div className="w-5 h-5 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs">?</div>;
    }
    return <IconComponent className="w-5 h-5" />;
  }, []);

  const selectedIcon = value ? renderIcon(value) : <Search className="w-5 h-5" />;

  return (
    <div className="grid gap-2" ref={containerRef}>
      <Label>{label}</Label>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        data-testid="button-icon-picker"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {selectedIcon}
          <span>{value || placeholder || "Choose icon"}</span>
        </div>
        <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="border rounded-md bg-popover text-popover-foreground shadow-md">
          <div className="flex flex-col" style={{ maxHeight: '400px' }}>
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search icons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  className="pl-9"
                  data-testid="input-icon-search"
                  autoComplete="off"
                />
                {searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {!searchTerm && (
              <div className="p-3 border-b">
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant={selectedCategory === "All" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("All")}
                    className="text-xs"
                  >
                    All
                  </Button>
                  {Object.keys(iconCategories).map((category) => (
                    <Button
                      type="button"
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div
              ref={scrollRef}
              className="overflow-y-auto p-3"
              style={{ maxHeight: '240px', overscrollBehavior: 'contain' }}
              onWheel={(e) => e.stopPropagation()}
            >
              {filteredIcons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No icons found</p>
                  {searchTerm && (
                    <p className="text-xs mt-2">
                      Try a different search term
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {filteredIcons.slice(0, 120).map((iconName) => (
                    <Button
                      type="button"
                      key={iconName}
                      variant={value === iconName ? "default" : "ghost"}
                      size="sm"
                      className="h-12 flex flex-col items-center justify-center p-2"
                      onClick={() => {
                        onChange(iconName);
                        setOpen(false);
                      }}
                      data-testid={`button-select-icon-${iconName.toLowerCase()}`}
                    >
                      {renderIcon(iconName)}
                      <span className="text-[10px] mt-1 truncate w-full text-center">
                        {iconName}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
              {filteredIcons.length > 120 && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Showing 120 of {filteredIcons.length} icons. Use search to find more.
                </p>
              )}
            </div>

            {value && (
              <div className="p-3 border-t bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedIcon}
                    <span className="font-medium">{value}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
