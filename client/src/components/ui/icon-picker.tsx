import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Get all available Lucide icons - comprehensive list including check variations
const iconList = [
  "Activity", "Airplay", "AlertCircle", "AlertOctagon", "AlertTriangle", "Align", "AlignCenter", "AlignJustify", "AlignLeft", "AlignRight",
  "Anchor", "Aperture", "Archive", "ArrowDown", "ArrowDownCircle", "ArrowDownLeft", "ArrowDownRight", "ArrowLeft", "ArrowLeftCircle",
  "ArrowRight", "ArrowRightCircle", "ArrowUp", "ArrowUpCircle", "ArrowUpLeft", "ArrowUpRight", "AtSign", "Award", "BarChart", "BarChart2",
  "BarChart3", "Battery", "BatteryCharging", "Bell", "BellOff", "Bluetooth", "Bold", "Book", "BookOpen", "Bookmark", "Box", "Briefcase",
  "Calendar", "Camera", "CameraOff", "Cast", "Check", "CheckCircle", "CheckCircle2", "CheckSquare", "ChevronDown", "ChevronLeft",
  "ChevronRight", "ChevronUp", "ChevronsDown", "ChevronsLeft", "ChevronsRight", "ChevronsUp", "Chrome", "Circle", "Clipboard", "Clock",
  "Cloud", "CloudDrizzle", "CloudLightning", "CloudRain", "CloudSnow", "Code", "Code2", "Codepen", "Codesandbox", "Coffee", "Columns",
  "Command", "Compass", "Copy", "CornerDownLeft", "CornerDownRight", "CornerLeftDown", "CornerLeftUp", "CornerRightDown", "CornerRightUp",
  "CornerUpLeft", "CornerUpRight", "Cpu", "CreditCard", "Crop", "Crosshair", "Database", "Delete", "Disc", "DollarSign", "Download",
  "DownloadCloud", "Droplets", "Edit", "Edit2", "Edit3", "ExternalLink", "Eye", "EyeOff", "Facebook", "FastForward", "Feather", "File",
  "FileText", "Film", "Filter", "Flag", "Folder", "FolderOpen", "FolderPlus", "Gift", "GitBranch", "GitCommit", "GitMerge", "GitPullRequest",
  "Github", "Gitlab", "Globe", "Grid", "HardDrive", "Hash", "Headphones", "Heart", "HelpCircle", "Home", "Image", "Inbox", "Info",
  "Instagram", "Italic", "Key", "Layers", "Layout", "LifeBuoy", "Link", "Link2", "Linkedin", "List", "Loader", "Lock", "LogIn", "LogOut",
  "Mail", "Map", "MapPin", "Maximize", "Maximize2", "Menu", "MessageCircle", "MessageSquare", "Mic", "MicOff", "Minimize", "Minimize2",
  "Minus", "MinusCircle", "MinusSquare", "Monitor", "Moon", "MoreHorizontal", "MoreVertical", "MousePointer", "Move", "Music", "Navigation",
  "Navigation2", "Octagon", "Package", "Paperclip", "Pause", "PauseCircle", "PenTool", "Percent", "Phone", "PhoneCall", "PhoneIncoming",
  "PhoneOff", "PhoneOutgoing", "PieChart", "Play", "PlayCircle", "Plus", "PlusCircle", "PlusSquare", "Pocket", "Power", "Printer",
  "Radio", "RefreshCcw", "RefreshCw", "Repeat", "Repeat1", "Rewind", "RotateCcw", "RotateCw", "Rss", "Save", "Scissors", "Search",
  "Send", "Server", "Settings", "Share", "Share2", "Shield", "ShieldOff", "ShoppingBag", "ShoppingCart", "Shuffle", "Sidebar", "SkipBack",
  "SkipForward", "Slack", "Slash", "Sliders", "Smartphone", "Smile", "Speaker", "Square", "Star", "StopCircle", "Sun", "Sunrise",
  "Sunset", "Tablet", "Tag", "Target", "Terminal", "Thermometer", "ThumbsDown", "ThumbsUp", "ToggleLeft", "ToggleRight", "Tool", "Trash",
  "Trash2", "TrendingDown", "TrendingUp", "Triangle", "Truck", "Tv", "Twitter", "Type", "Umbrella", "Underline", "Unlock", "Upload",
  "UploadCloud", "User", "UserCheck", "UserMinus", "UserPlus", "UserX", "Users", "Video", "VideoOff", "Volume", "Volume1", "Volume2",
  "VolumeX", "Watch", "Wifi", "WifiOff", "Wind", "X", "XCircle", "XSquare", "Youtube", "Zap", "ZapOff", "ZoomIn", "ZoomOut",
  "Sparkles", "Building", "Building2", "Banknote", "CreditCard", "Wallet", "ShoppingCart", "Package2", "Truck", "MapPin", "Navigation",
  "Compass", "Globe2", "Wifi", "Signal", "Battery", "Zap", "Sun", "Moon", "Cloud", "Umbrella", "Snowflake"
].sort();

// Common categories for better organization
const iconCategories = {
  "Most Used": ["Home", "User", "Settings", "Search", "Plus", "Edit", "Trash2", "Eye", "Heart", "Star", "Bell", "Mail"],
  "Navigation": ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "ChevronLeft", "ChevronRight", "Menu", "X"],
  "Actions": ["Plus", "Minus", "Edit", "Trash2", "Save", "Download", "Upload", "Copy", "Share", "Send"],
  "Communication": ["Mail", "Phone", "MessageCircle", "MessageSquare", "Video", "Mic", "MicOff", "Volume2"],
  "Files & Folders": ["File", "FileText", "Folder", "FolderOpen", "Image", "Video", "Music", "Download"],
  "Business": ["Briefcase", "Calendar", "Clock", "DollarSign", "TrendingUp", "BarChart3", "PieChart", "Target"],
  "Technology": ["Smartphone", "Laptop", "Monitor", "Wifi", "Database", "Server", "Code", "Terminal"],
  "Social": ["Users", "UserPlus", "UserMinus", "UserCheck", "Globe", "Share2", "ThumbsUp", "Heart"],
  "Interface": ["Layout", "Grid", "List", "Filter", "Sort", "Maximize", "Minimize", "MoreHorizontal"],
};

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  label?: string;
}

export function IconPicker({ value = "", onChange, label = "Icon" }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Most Used");

  // Debug: Log icon list length
  console.log("Available icons:", iconList.length);

  const filteredIcons = useMemo(() => {
    let icons = selectedCategory === "All" 
      ? iconList 
      : iconCategories[selectedCategory as keyof typeof iconCategories] || [];
    
    if (searchTerm.trim()) {
      // When searching, always search through ALL icons regardless of category
      const search = searchTerm.toLowerCase().trim();
      icons = iconList.filter(icon => 
        icon.toLowerCase().includes(search)
      );
      console.log(`Searching for "${searchTerm}", found ${icons.length} icons:`, icons.slice(0, 10));
    }
    
    return icons;
  }, [searchTerm, selectedCategory]);

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) {
      console.warn(`Icon ${iconName} not found in Lucide React`);
      return <div className="w-5 h-5 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs">?</div>;
    }
    return <IconComponent className="w-5 h-5" />;
  };

  const selectedIcon = value ? renderIcon(value) : <Search className="w-5 h-5" />;

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between"
            data-testid="button-icon-picker"
          >
            <div className="flex items-center gap-2">
              {selectedIcon}
              <span>{value || "Choose icon"}</span>
            </div>
            <Search className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <div className="flex flex-col h-96">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search icons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-icon-search"
                />
                {searchTerm && (
                  <Button
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

            {/* Categories */}
            {!searchTerm && (
              <div className="p-3 border-b">
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={selectedCategory === "All" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("All")}
                    className="text-xs"
                  >
                    All
                  </Button>
                  {Object.keys(iconCategories).map((category) => (
                    <Button
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

            {/* Icons Grid */}
            <ScrollArea className="flex-1">
              <div className="p-3">
                {filteredIcons.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No icons found</p>
                    {searchTerm && (
                      <p className="text-xs mt-2">
                        Try searching for: "check", "arrow", "user", "home", "settings", "heart", "star"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {filteredIcons.map((iconName) => (
                      <Button
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
                        <span className="text-[10px] mt-1 truncate w-full">
                          {iconName}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Selected Icon Info */}
            {value && (
              <div className="p-3 border-t bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedIcon}
                    <span className="font-medium">{value}</span>
                  </div>
                  <Button
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
        </PopoverContent>
      </Popover>
    </div>
  );
}