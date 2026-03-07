import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ResourceSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: "kb_article" | "training_course";
  onSelect: (resource: { id: string | number; title: string }) => void;
}

export default function ResourceSearchModal({ open, onOpenChange, resourceType, onSelect }: ResourceSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  const endpoint = resourceType === "kb_article" ? "/api/kb-articles/search" : "/api/training-courses/search";
  const { data: results = [] } = useQuery<any[]>({
    queryKey: [endpoint, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(debouncedQuery)}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!debouncedQuery.trim() && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {resourceType === "kb_article" ? "Search KB Articles" : "Search Training Courses"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search..."
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {results.map((r: any) => (
              <button
                key={r.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-accent rounded-md text-sm"
                onClick={() => {
                  onSelect({ id: r.id, title: r.title });
                  onOpenChange(false);
                }}
              >
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-muted-foreground">
                  {r.category || (r.description ? r.description.substring(0, 80) : "")}
                </div>
              </button>
            ))}
            {debouncedQuery && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
