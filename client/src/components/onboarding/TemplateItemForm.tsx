import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, X, FileText, BookOpen, GraduationCap, Search, Plus, Link as LinkIcon, Trash2 } from "lucide-react";

interface Resource {
  label: string;
  url: string;
}

interface TemplateItem {
  id: number;
  templateId: number;
  dayNumber: number;
  sortOrder: number;
  title: string;
  description: string | null;
  itemType: string;
  referenceId: string | null;
  resources: Resource[] | null;
  isRequired: boolean;
}

interface TemplateItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: number;
  totalDays: number;
  editItem?: TemplateItem | null;
  defaultDay?: number;
}

export default function TemplateItemForm({ open, onOpenChange, templateId, totalDays, editItem, defaultDay = 1 }: TemplateItemFormProps) {
  const { toast } = useToast();
  const [dayNumber, setDayNumber] = useState(defaultDay);
  const [itemType, setItemType] = useState<string>("text");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [referenceName, setReferenceName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResourceLabel, setNewResourceLabel] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");

  useEffect(() => {
    if (editItem) {
      setDayNumber(editItem.dayNumber);
      setItemType(editItem.itemType);
      setTitle(editItem.title);
      setDescription(editItem.description || "");
      setIsRequired(editItem.isRequired);
      setReferenceId(editItem.referenceId);
      setReferenceName("");
      setResources(Array.isArray(editItem.resources) ? editItem.resources : []);
    } else {
      setDayNumber(defaultDay);
      setItemType("text");
      setTitle("");
      setDescription("");
      setIsRequired(true);
      setReferenceId(null);
      setReferenceName("");
      setSearchQuery("");
      setResources([]);
    }
    setNewResourceLabel("");
    setNewResourceUrl("");
  }, [editItem, defaultDay, open]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchEndpoint = itemType === "kb_article" ? "/api/kb-articles/search" : "/api/training-courses/search";
  const { data: searchResults = [] } = useQuery<any[]>({
    queryKey: [searchEndpoint, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const res = await fetch(`${searchEndpoint}?q=${encodeURIComponent(debouncedQuery)}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!debouncedQuery.trim() && (itemType === "kb_article" || itemType === "training_course"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        dayNumber,
        sortOrder: editItem?.sortOrder ?? 0,
        title,
        description: description || null,
        itemType,
        referenceId: itemType === "text" ? null : referenceId,
        resources,
        isRequired,
      };
      if (editItem) {
        await apiRequest("PUT", `/api/onboarding-templates/${templateId}/items/${editItem.id}`, body);
      } else {
        await apiRequest("POST", `/api/onboarding-templates/${templateId}/items`, body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-templates", templateId] });
      onOpenChange(false);
      toast({ title: editItem ? "Item updated" : "Item added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const typeOptions = [
    { value: "text", label: "Text", icon: FileText },
    { value: "kb_article", label: "KB Article", icon: BookOpen },
    { value: "training_course", label: "Training Course", icon: GraduationCap },
  ];

  const handleTypeChange = (type: string) => {
    setItemType(type);
    if (type === "text") {
      setReferenceId(null);
      setReferenceName("");
    }
    setSearchQuery("");
    setShowResults(false);
  };

  const handleSelectResult = (result: any) => {
    setReferenceId(String(result.id));
    setReferenceName(result.title);
    setShowResults(false);
    setSearchQuery("");
  };

  const addResource = () => {
    const url = newResourceUrl.trim();
    const label = newResourceLabel.trim() || url;
    if (!url) return;
    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }
    setResources([...resources, { label, url: finalUrl }]);
    setNewResourceLabel("");
    setNewResourceUrl("");
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Day Number</Label>
            <Input
              type="number"
              min={1}
              max={totalDays}
              value={dayNumber}
              onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label>Item Type</Label>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {typeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTypeChange(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium flex-1 justify-center transition-colors ${
                    itemType === value
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item title"
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {(itemType === "kb_article" || itemType === "training_course") && (
            <div className="space-y-2">
              <Label>{itemType === "kb_article" ? "Link KB Article" : "Link Training Course"}</Label>
              {referenceId ? (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <span className="text-sm flex-1 truncate">{referenceName || `ID: ${referenceId}`}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => { setReferenceId(null); setReferenceName(""); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                      placeholder={`Search ${itemType === "kb_article" ? "KB articles" : "training courses"}...`}
                      className="pl-9"
                    />
                  </div>
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((result: any) => (
                        <button
                          key={result.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex flex-col"
                          onClick={() => handleSelectResult(result)}
                        >
                          <span className="font-medium">{result.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {result.category || (result.description ? result.description.substring(0, 80) : "")}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5" />
              Resources
            </Label>
            {resources.length > 0 && (
              <div className="space-y-1.5">
                {resources.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-muted rounded-md text-sm group">
                    <LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="text-[hsl(179,100%,39%)] hover:underline truncate flex-1">
                      {r.label}
                    </a>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeResource(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newResourceLabel}
                onChange={(e) => setNewResourceLabel(e.target.value)}
                placeholder="Label (optional)"
                className="flex-1"
              />
              <Input
                value={newResourceUrl}
                onChange={(e) => setNewResourceUrl(e.target.value)}
                placeholder="https://..."
                className="flex-[2]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addResource();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" className="flex-shrink-0"
                onClick={addResource} disabled={!newResourceUrl.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Attach external links, documents, or reference materials.</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isRequired">Required item</Label>
            <Switch id="isRequired" checked={isRequired} onCheckedChange={setIsRequired} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,33%)] text-white"
            disabled={!title.trim() || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editItem ? "Update" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
