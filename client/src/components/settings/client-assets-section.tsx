import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "react-beautiful-dnd";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  GripVertical,
  Pencil,
  Archive,
  ArchiveRestore,
  Image as ImageIcon,
  Tag as TagIcon,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-has-permission";
import type { AssetType, AssetStatus } from "@shared/schema";

const PRESET_COLORS = [
  "#10B981",
  "#F59E0B",
  "#00C9C6",
  "#EF4444",
  "#6B7280",
  "#8B5CF6",
  "#3B82F6",
  "#EC4899",
];

// ---------------------------------------------------------------------------
// Asset Types sub-section
// ---------------------------------------------------------------------------
function AssetTypesPanel({ isAdmin }: { isAdmin: boolean }) {
  const { toast } = useToast();
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<AssetType | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [tooltip, setTooltip] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<AssetType | null>(null);

  const queryKey = ["/api/asset-types?includeInactive=true"] as const;
  const { data: types = [], isLoading } = useQuery<AssetType[]>({ queryKey });

  const createMut = useMutation({
    mutationFn: async (vars: { name: string; tooltip: string | null }) => {
      const res = await apiRequest("POST", "/api/asset-types", vars);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setCreating(false);
      setName("");
      setTooltip("");
      toast({ title: "Asset type created" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Create failed", description: e?.message }),
  });

  const updateMut = useMutation({
    mutationFn: async (vars: { id: string; patch: Partial<AssetType> }) => {
      const res = await apiRequest("PUT", `/api/asset-types/${vars.id}`, vars.patch);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditing(null);
      setName("");
      toast({ title: "Asset type updated" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Update failed", description: e?.message }),
  });

  const archiveMut = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/asset-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setArchiveTarget(null);
      toast({ title: "Asset type archived" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Archive failed", description: e?.message }),
  });

  const reorderMut = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await apiRequest("POST", "/api/asset-types/reorder", { orderedIds });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (e: any) => {
      queryClient.invalidateQueries({ queryKey });
      toast({ variant: "destructive", title: "Reorder failed", description: e?.message });
    },
  });

  const visible = showArchived ? types : types.filter((t) => t.active);
  const sorted = [...visible].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const items = Array.from(sorted);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    // Reorder: send only ACTIVE rows in their new order (server requires complete set among submitted ids).
    const orderedActiveIds = items.filter((t) => t.active).map((t) => t.id);
    queryClient.setQueryData<AssetType[]>(queryKey, (prev) =>
      prev?.map((t) => {
        const idx = orderedActiveIds.indexOf(t.id);
        return idx >= 0 ? { ...t, sortOrder: idx + 1 } : t;
      })
    );
    reorderMut.mutate(orderedActiveIds);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="h-5 w-5 text-primary" />
          Asset Types
        </CardTitle>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => {
              setName("");
              setTooltip("");
              setCreating(true);
            }}
            data-testid="button-add-asset-type"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Type
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Switch
            id="show-archived-types"
            checked={showArchived}
            onCheckedChange={setShowArchived}
            data-testid="toggle-show-archived-types"
          />
          <Label htmlFor="show-archived-types" className="text-sm">Show archived</Label>
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-500 py-4">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="text-sm text-gray-500 py-4">No asset types.</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="asset-types">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                  {sorted.map((t, index) => (
                    <Draggable
                      key={t.id}
                      draggableId={t.id}
                      index={index}
                      isDragDisabled={!isAdmin || !t.active}
                    >
                      {(p) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          className={`flex items-center gap-2 p-2 border rounded-md bg-white ${!t.active ? "opacity-60" : ""}`}
                          data-testid={`row-asset-type-${t.id}`}
                        >
                          <span
                            {...p.dragHandleProps}
                            className={`text-gray-400 ${(!isAdmin || !t.active) ? "invisible" : "cursor-grab"}`}
                          >
                            <GripVertical className="h-4 w-4" />
                          </span>
                          <span className="flex-1 text-sm">{t.name}</span>
                          {!t.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditing(t);
                                  setName(t.name);
                                  setTooltip(t.tooltip ?? "");
                                }}
                                data-testid={`button-edit-type-${t.id}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {t.active ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setArchiveTarget(t)}
                                  data-testid={`button-archive-type-${t.id}`}
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateMut.mutate({ id: t.id, patch: { active: true } })}
                                  data-testid={`button-unarchive-type-${t.id}`}
                                >
                                  <ArchiveRestore className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>

      {/* Add / Edit modal */}
      <Dialog
        open={creating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
            setName("");
            setTooltip("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Asset Type" : "Add Asset Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asset-type-name">Name</Label>
              <Input
                id="asset-type-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-asset-type-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-type-tooltip">Tooltip (optional)</Label>
              <Textarea
                id="asset-type-tooltip"
                value={tooltip}
                onChange={(e) => setTooltip(e.target.value)}
                placeholder="e.g. Use this type for all branded creative assets like logos, style guides, etc."
                rows={3}
                data-testid="input-asset-type-tooltip"
              />
              <p className="text-xs text-gray-500">
                Shown as a help tooltip next to the Asset Type field when adding a new client asset.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); setName(""); setTooltip(""); }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!name.trim()) return;
                const tooltipValue = tooltip.trim() ? tooltip.trim() : null;
                if (editing) updateMut.mutate({ id: editing.id, patch: { name: name.trim(), tooltip: tooltipValue } });
                else createMut.mutate({ name: name.trim(), tooltip: tooltipValue });
              }}
              disabled={createMut.isPending || updateMut.isPending}
              data-testid="button-save-asset-type"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this asset type?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving this type hides it from new assets but preserves it on existing assets. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveTarget && archiveMut.mutate(archiveTarget.id)}
              data-testid="button-confirm-archive-type"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Asset Statuses sub-section
// ---------------------------------------------------------------------------
function AssetStatusesPanel({ isAdmin }: { isAdmin: boolean }) {
  const { toast } = useToast();
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<AssetStatus | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(PRESET_COLORS[2]);
  const [archiveTarget, setArchiveTarget] = useState<AssetStatus | null>(null);

  const queryKey = ["/api/asset-statuses?includeInactive=true"] as const;
  const { data: statuses = [], isLoading } = useQuery<AssetStatus[]>({ queryKey });

  const createMut = useMutation({
    mutationFn: async (vars: { name: string; color: string }) => {
      const res = await apiRequest("POST", "/api/asset-statuses", vars);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setCreating(false);
      setName("");
      setColor(PRESET_COLORS[2]);
      toast({ title: "Asset status created" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Create failed", description: e?.message }),
  });

  const updateMut = useMutation({
    mutationFn: async (vars: { id: string; patch: Partial<AssetStatus> }) => {
      const res = await apiRequest("PUT", `/api/asset-statuses/${vars.id}`, vars.patch);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditing(null);
      setName("");
      toast({ title: "Asset status updated" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Update failed", description: e?.message }),
  });

  const archiveMut = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/asset-statuses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setArchiveTarget(null);
      toast({ title: "Asset status archived" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Archive failed", description: e?.message }),
  });

  const reorderMut = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await apiRequest("POST", "/api/asset-statuses/reorder", { orderedIds });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (e: any) => {
      queryClient.invalidateQueries({ queryKey });
      toast({ variant: "destructive", title: "Reorder failed", description: e?.message });
    },
  });

  const visible = showArchived ? statuses : statuses.filter((s) => s.active);
  const sorted = [...visible].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const items = Array.from(sorted);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    const orderedActiveIds = items.filter((s) => s.active).map((s) => s.id);
    queryClient.setQueryData<AssetStatus[]>(queryKey, (prev) =>
      prev?.map((s) => {
        const idx = orderedActiveIds.indexOf(s.id);
        return idx >= 0 ? { ...s, sortOrder: idx + 1 } : s;
      })
    );
    reorderMut.mutate(orderedActiveIds);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TagIcon className="h-5 w-5 text-primary" />
          Asset Statuses
        </CardTitle>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => {
              setName("");
              setColor(PRESET_COLORS[2]);
              setCreating(true);
            }}
            data-testid="button-add-asset-status"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Status
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Switch
            id="show-archived-statuses"
            checked={showArchived}
            onCheckedChange={setShowArchived}
            data-testid="toggle-show-archived-statuses"
          />
          <Label htmlFor="show-archived-statuses" className="text-sm">Show archived</Label>
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-500 py-4">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="text-sm text-gray-500 py-4">No asset statuses.</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="asset-statuses">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                  {sorted.map((s, index) => (
                    <Draggable
                      key={s.id}
                      draggableId={s.id}
                      index={index}
                      isDragDisabled={!isAdmin || !s.active}
                    >
                      {(p) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          className={`flex items-center gap-2 p-2 border rounded-md bg-white ${!s.active ? "opacity-60" : ""}`}
                          data-testid={`row-asset-status-${s.id}`}
                        >
                          <span
                            {...p.dragHandleProps}
                            className={`text-gray-400 ${(!isAdmin || !s.active) ? "invisible" : "cursor-grab"}`}
                          >
                            <GripVertical className="h-4 w-4" />
                          </span>
                          <span
                            className="inline-block h-4 w-4 rounded-full border"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="flex-1 text-sm">{s.name}</span>
                          {!s.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditing(s);
                                  setName(s.name);
                                  setColor(s.color || PRESET_COLORS[2]);
                                }}
                                data-testid={`button-edit-status-${s.id}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {s.active ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setArchiveTarget(s)}
                                  data-testid={`button-archive-status-${s.id}`}
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateMut.mutate({ id: s.id, patch: { active: true } })}
                                  data-testid={`button-unarchive-status-${s.id}`}
                                >
                                  <ArchiveRestore className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>

      <Dialog
        open={creating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
            setName("");
            setColor(PRESET_COLORS[2]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Asset Status" : "Add Asset Status"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="asset-status-name">Name</Label>
              <Input
                id="asset-status-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-asset-status-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-primary ring-2 ring-primary/30" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    data-testid={`color-swatch-${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); setName(""); }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!name.trim()) return;
                if (editing) updateMut.mutate({ id: editing.id, patch: { name: name.trim(), color } });
                else createMut.mutate({ name: name.trim(), color });
              }}
              disabled={createMut.isPending || updateMut.isPending}
              data-testid="button-save-asset-status"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this asset status?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving this status hides it from new assets but preserves it on existing assets. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveTarget && archiveMut.mutate(archiveTarget.id)}
              data-testid="button-confirm-archive-status"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Combined section (renders both panels side-by-side on desktop)
// ---------------------------------------------------------------------------
function ColumnVisibilityPanel({ isAdmin }: { isAdmin: boolean }) {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<{ showAddedToMb: boolean; showAddedToAiTools: boolean }>({
    queryKey: ["/api/settings/client-asset-columns"],
  });

  const saveMutation = useMutation({
    mutationFn: async (value: { showAddedToMb: boolean; showAddedToAiTools: boolean }) =>
      apiRequest("PUT", "/api/settings/client-asset-columns", value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/client-asset-columns"] });
      toast({ title: "Column settings saved" });
    },
    onError: (e: any) => {
      toast({ title: "Could not save column settings", description: e?.message ?? "Unknown error", variant: "destructive" });
    },
  });

  const showMb = settings?.showAddedToMb !== false;
  const showAiTools = settings?.showAddedToAiTools !== false;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">Column Visibility</CardTitle>
        <p className="text-xs text-gray-500">Choose which extra columns appear in the Client Assets table.</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="col-mb" className="text-sm">Added to MB</Label>
              <Switch
                id="col-mb"
                disabled={!isAdmin || saveMutation.isPending}
                checked={showMb}
                onCheckedChange={(v) => saveMutation.mutate({ showAddedToMb: v, showAddedToAiTools: showAiTools })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="col-ai" className="text-sm">Added to AI Tools</Label>
              <Switch
                id="col-ai"
                disabled={!isAdmin || saveMutation.isPending}
                checked={showAiTools}
                onCheckedChange={(v) => saveMutation.mutate({ showAddedToMb: showMb, showAddedToAiTools: v })}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClientAssetsSection() {
  const { isAdmin } = useCurrentUser();
  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Client Assets
        </h2>
        <p className="text-sm text-gray-600">
          Configure the types and statuses available when categorizing client assets.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AssetTypesPanel isAdmin={!!isAdmin} />
        <AssetStatusesPanel isAdmin={!!isAdmin} />
      </div>
      <ColumnVisibilityPanel isAdmin={!!isAdmin} />
    </div>
  );
}
