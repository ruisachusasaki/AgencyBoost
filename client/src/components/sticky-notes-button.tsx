import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { StickyNote as StickyNoteIcon, Plus, Pencil, Trash2, Eye, MoreVertical, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StickyNote } from "@shared/schema";

const COLORS: { value: string; label: string; bg: string; dot: string; border: string }[] = [
  { value: "yellow", label: "Yellow", bg: "bg-yellow-50 dark:bg-yellow-900/20", dot: "bg-yellow-400", border: "border-yellow-200 dark:border-yellow-800" },
  { value: "blue", label: "Blue", bg: "bg-blue-50 dark:bg-blue-900/20", dot: "bg-blue-500", border: "border-blue-200 dark:border-blue-800" },
  { value: "green", label: "Green", bg: "bg-green-50 dark:bg-green-900/20", dot: "bg-green-500", border: "border-green-200 dark:border-green-800" },
  { value: "pink", label: "Pink", bg: "bg-pink-50 dark:bg-pink-900/20", dot: "bg-pink-500", border: "border-pink-200 dark:border-pink-800" },
  { value: "purple", label: "Purple", bg: "bg-purple-50 dark:bg-purple-900/20", dot: "bg-purple-500", border: "border-purple-200 dark:border-purple-800" },
  { value: "orange", label: "Orange", bg: "bg-orange-50 dark:bg-orange-900/20", dot: "bg-orange-500", border: "border-orange-200 dark:border-orange-800" },
  { value: "red", label: "Red", bg: "bg-red-50 dark:bg-red-900/20", dot: "bg-red-500", border: "border-red-200 dark:border-red-800" },
  { value: "gray", label: "Gray", bg: "bg-slate-50 dark:bg-slate-800/40", dot: "bg-slate-400", border: "border-slate-200 dark:border-slate-700" },
];

const colorMeta = (c: string) => COLORS.find((x) => x.value === c) || COLORS[0];

type EditorMode = { mode: "closed" } | { mode: "create" } | { mode: "edit"; note: StickyNote } | { mode: "view"; note: StickyNote };

export function StickyNotesButton() {
  const [open, setOpen] = useState(false);
  const [editor, setEditor] = useState<EditorMode>({ mode: "closed" });
  const { toast } = useToast();

  const { data: notes = [], isLoading } = useQuery<StickyNote[]>({
    queryKey: ["/api/sticky-notes"],
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sticky-notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sticky-notes"] });
      toast({ title: "Note deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to delete note", variant: "destructive" });
    },
  });

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            title="Sticky Notes"
            data-testid="button-header-sticky-notes"
          >
            <StickyNoteIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-base">Sticky Notes</h3>
            <Button
              size="sm"
              onClick={() => setEditor({ mode: "create" })}
              data-testid="button-add-sticky-note"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Note
            </Button>
          </div>
          <ScrollArea className="max-h-[480px]">
            <div className="p-3 space-y-2">
              {isLoading ? (
                <div className="text-sm text-muted-foreground text-center py-8">Loading...</div>
              ) : notes.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No sticky notes yet. Click "Add Note" to create one.
                </div>
              ) : (
                notes.map((note) => {
                  const c = colorMeta(note.color);
                  return (
                    <div
                      key={note.id}
                      className={`relative rounded-md border ${c.border} ${c.bg} p-3 cursor-pointer hover:shadow-sm transition-shadow`}
                      onClick={() => setEditor({ mode: "view", note })}
                      data-testid={`sticky-note-${note.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {note.title || "(Untitled)"}
                          </div>
                          {note.content && (
                            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap">
                              {note.content}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => setEditor({ mode: "view", note })}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditor({ mode: "edit", note })}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (confirm("Delete this sticky note?")) {
                                  deleteMutation.mutate(note.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {note.updatedAt ? format(new Date(note.updatedAt), "dd-MM-yyyy") : ""}
                        </span>
                        <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <NoteEditorDialog editor={editor} setEditor={setEditor} />
    </>
  );
}

function NoteEditorDialog({
  editor,
  setEditor,
}: {
  editor: EditorMode;
  setEditor: (e: EditorMode) => void;
}) {
  const isOpen = editor.mode !== "closed";
  const isView = editor.mode === "view";
  const existing = editor.mode === "edit" || editor.mode === "view" ? editor.note : null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("yellow");

  const { toast } = useToast();

  // Sync local form state with the active editor's note whenever it changes
  const syncKey =
    editor.mode === "closed"
      ? "closed"
      : editor.mode === "create"
      ? "create"
      : `${editor.mode}:${editor.note.id}:${editor.note.updatedAt ?? ""}`;
  useEffect(() => {
    if (editor.mode === "create") {
      setTitle("");
      setContent("");
      setColor("yellow");
    } else if (editor.mode === "edit" || editor.mode === "view") {
      setTitle(editor.note.title || "");
      setContent(editor.note.content || "");
      setColor(editor.note.color || "yellow");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; color: string }) => {
      const res = await apiRequest("POST", "/api/sticky-notes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sticky-notes"] });
      toast({ title: "Note created" });
      setEditor({ mode: "closed" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to create note", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title: string; content: string; color: string } }) => {
      const res = await apiRequest("PATCH", `/api/sticky-notes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sticky-notes"] });
      toast({ title: "Note updated" });
      setEditor({ mode: "closed" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to update note", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const data = { title: title.trim(), content: content.trim(), color };
    if (!data.title && !data.content) {
      toast({ title: "Empty note", description: "Add a title or some content.", variant: "destructive" });
      return;
    }
    if (editor.mode === "edit" && existing) {
      updateMutation.mutate({ id: existing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const c = colorMeta(color);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) setEditor({ mode: "closed" }); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editor.mode === "create" && "Add Note"}
            {editor.mode === "edit" && "Edit Note"}
            {editor.mode === "view" && "View Note"}
          </DialogTitle>
          {editor.mode === "create" && (
            <DialogDescription>Note Details</DialogDescription>
          )}
        </DialogHeader>

        {isView && existing ? (
          <div className={`rounded-md border ${c.border} ${c.bg} p-4 space-y-2`}>
            <div className="font-medium text-base">{existing.title || "(Untitled)"}</div>
            <div className="text-sm whitespace-pre-wrap break-words">{existing.content}</div>
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Last updated {existing.updatedAt ? format(new Date(existing.updatedAt), "MMM d, yyyy h:mm a") : ""}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sn-color">Color Code</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="sn-color" data-testid="select-sticky-note-color">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${c.dot}`} />
                      <span>{c.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${opt.dot}`} />
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sn-title">Title</Label>
              <Input
                id="sn-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                data-testid="input-sticky-note-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sn-content">Note</Label>
              <Textarea
                id="sn-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Write your note here..."
                data-testid="textarea-sticky-note-content"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {isView && existing ? (
            <>
              <Button variant="outline" onClick={() => setEditor({ mode: "closed" })}>
                <X className="h-4 w-4 mr-2" /> Close
              </Button>
              <Button onClick={() => setEditor({ mode: "edit", note: existing })}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setEditor({ mode: "closed" })}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-sticky-note"
              >
                <Check className="h-4 w-4 mr-2" />
                {editor.mode === "edit" ? "Save Changes" : "Save"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

