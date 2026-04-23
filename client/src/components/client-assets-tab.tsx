import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow, format as formatDate } from "date-fns";
import {
  Plus, Search, ExternalLink, Pencil, Trash2, Eye, EyeOff,
  MoreVertical, FileText, Loader2, ArrowUp, ArrowDown, ArrowUpDown, HelpCircle,
  MessageSquare, Send, AtSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRolePermissions } from "@/hooks/use-has-permission";

type AssetType = { id: string; name: string; active: boolean; sortOrder: number };
type AssetStatus = { id: string; name: string; color: string; active: boolean; sortOrder: number };
type StaffMember = { id: string; firstName: string; lastName: string; email: string; profileImagePath?: string | null };
type ClientAssetRow = {
  id: string;
  clientId: string;
  name: string;
  linkUrl: string | null;
  assetTypeId: string | null;
  assetStatusId: string | null;
  ownerStaffId: string | null;
  portalVisible: boolean;
  createdAt: string;
  updatedAt: string;
  type: AssetType | null;
  status: AssetStatus | null;
  owner: { id: string; name: string; email: string; avatar: string | null } | null;
};

const assetFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  linkUrl: z
    .string()
    .min(1, "Link URL is required")
    .url("Must be a valid URL (https://...)"),
  assetTypeId: z.string().min(1, "Type is required"),
  assetStatusId: z.string().min(1, "Status is required"),
  ownerStaffId: z.string().optional(),
  portalVisible: z.boolean().default(false),
});
type AssetFormValues = z.infer<typeof assetFormSchema>;

const UNASSIGNED = "__unassigned__";

function staffName(s?: { firstName: string; lastName: string } | null) {
  if (!s) return "";
  return `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim();
}
function staffInitials(s?: { firstName: string; lastName: string } | null) {
  if (!s) return "?";
  return `${(s.firstName ?? "").charAt(0)}${(s.lastName ?? "").charAt(0)}`.toUpperCase() || "?";
}

interface MultiSelectProps {
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  width?: string;
}

function MultiSelectFilter({ label, allLabel, options, selected, onChange, width = "w-48" }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === 0;
  const buttonText = allSelected
    ? allLabel
    : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label ?? allLabel
      : `${selected.length} selected`;

  const toggle = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`${width} justify-between`} type="button">
          <span className="truncate">{buttonText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="text-xs text-gray-500 mb-2 px-1">{label}</div>
        <button
          type="button"
          className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-gray-100"
          onClick={() => onChange([])}
        >
          {allLabel}
        </button>
        <div className="border-t my-1" />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {options.map((o) => (
            <label
              key={o.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm"
            >
              <Checkbox
                checked={selected.includes(o.value)}
                onCheckedChange={() => toggle(o.value)}
              />
              <span className="truncate">{o.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ClientAssetsTabProps {
  clientId: string;
}

export default function ClientAssetsTab({ clientId }: ClientAssetsTabProps) {
  const { toast } = useToast();
  const { isAdminOrManager } = useRolePermissions();
  const canEdit = isAdminOrManager;

  const assetsKey = ["/api/clients", clientId, "assets"];

  const { data: assets = [], isLoading } = useQuery<ClientAssetRow[]>({
    queryKey: assetsKey,
    queryFn: async () => {
      const r = await fetch(`/api/clients/${clientId}/assets`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load assets");
      return r.json();
    },
    enabled: !!clientId,
  });

  const { data: types = [] } = useQuery<AssetType[]>({
    queryKey: ["/api/asset-types"],
  });
  const { data: statuses = [] } = useQuery<AssetStatus[]>({
    queryKey: ["/api/asset-statuses"],
  });
  const { data: staffList = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const commentCountsKey = ["/api/clients", clientId, "assets", "comment-counts"];
  const { data: commentCounts = {} } = useQuery<Record<string, number>>({
    queryKey: commentCountsKey,
    queryFn: async () => {
      const r = await fetch(`/api/clients/${clientId}/assets/comment-counts`, { credentials: "include" });
      if (!r.ok) return {};
      return r.json();
    },
    enabled: !!clientId,
  });

  const [commentsAsset, setCommentsAsset] = useState<ClientAssetRow | null>(null);

  const activeTypes = useMemo(() => types.filter((t) => t.active), [types]);
  const activeStatuses = useMemo(() => statuses.filter((s) => s.active), [statuses]);

  // Filter state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string>("__all__");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (debouncedSearch && !a.name.toLowerCase().includes(debouncedSearch)) return false;
      if (typeFilter.length > 0 && (!a.assetTypeId || !typeFilter.includes(a.assetTypeId))) return false;
      if (statusFilter.length > 0 && (!a.assetStatusId || !statusFilter.includes(a.assetStatusId))) return false;
      if (ownerFilter !== "__all__") {
        if (ownerFilter === UNASSIGNED) {
          if (a.ownerStaffId) return false;
        } else {
          if (a.ownerStaffId !== ownerFilter) return false;
        }
      }
      return true;
    });
  }, [assets, debouncedSearch, typeFilter, statusFilter, ownerFilter]);

  // Sorting
  type SortKey = "name" | "type" | "status" | "owner" | "portalVisible" | "updatedAt";
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "updatedAt" ? "desc" : "asc");
    }
  };
  const sortedAssets = useMemo(() => {
    const arr = [...filteredAssets];
    const dir = sortDir === "asc" ? 1 : -1;
    const cmp = (a: any, b: any) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "name": av = a.name?.toLowerCase() ?? ""; bv = b.name?.toLowerCase() ?? ""; break;
        case "type": av = a.type?.name?.toLowerCase() ?? ""; bv = b.type?.name?.toLowerCase() ?? ""; break;
        case "status": av = a.status?.name?.toLowerCase() ?? ""; bv = b.status?.name?.toLowerCase() ?? ""; break;
        case "owner": av = a.owner?.name?.toLowerCase() ?? ""; bv = b.owner?.name?.toLowerCase() ?? ""; break;
        case "portalVisible": av = a.portalVisible ? 1 : 0; bv = b.portalVisible ? 1 : 0; break;
        case "updatedAt": av = new Date(a.updatedAt).getTime(); bv = new Date(b.updatedAt).getTime(); break;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    };
    arr.sort(cmp);
    return arr;
  }, [filteredAssets, sortKey, sortDir]);

  function SortableHead({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) {
    const active = sortKey === k;
    return (
      <TableHead className={className}>
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className="inline-flex items-center gap-1 font-medium hover:text-primary"
          data-testid={`sort-${k}`}
        >
          {children}
          {active ? (
            sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUpDown className="h-3 w-3 text-gray-300" />
          )}
        </button>
      </TableHead>
    );
  }

  // Modals
  const [editing, setEditing] = useState<ClientAssetRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<ClientAssetRow | null>(null);

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (a: ClientAssetRow) => { setEditing(a); setShowForm(true); };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (values: AssetFormValues) => {
      const body = {
        ...values,
        ownerStaffId: values.ownerStaffId && values.ownerStaffId !== UNASSIGNED ? values.ownerStaffId : null,
      };
      return apiRequest("POST", `/api/clients/${clientId}/assets`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetsKey });
      toast({ title: "Asset added", variant: "default" });
      setShowForm(false);
    },
    onError: (e: any) => {
      toast({ title: "Could not add asset", description: e?.message ?? "Unknown error", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<AssetFormValues> & { portalVisible?: boolean } }) => {
      const body: any = { ...values };
      if (body.ownerStaffId === UNASSIGNED) body.ownerStaffId = null;
      return apiRequest("PUT", `/api/clients/${clientId}/assets/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetsKey });
      toast({ title: "Asset updated", variant: "default" });
      setShowForm(false);
    },
    onError: (e: any) => {
      toast({ title: "Could not update asset", description: e?.message ?? "Unknown error", variant: "destructive" });
    },
  });

  const togglePortalMutation = useMutation({
    mutationFn: async ({ id, portalVisible }: { id: string; portalVisible: boolean }) => {
      return apiRequest("PUT", `/api/clients/${clientId}/assets/${id}`, { portalVisible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetsKey });
    },
    onError: (e: any) => {
      toast({ title: "Could not update visibility", description: e?.message ?? "Unknown error", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/clients/${clientId}/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetsKey });
      toast({ title: "Asset deleted", variant: "default" });
      setDeleting(null);
    },
    onError: (e: any) => {
      toast({ title: "Could not delete asset", description: e?.message ?? "Unknown error", variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Client Assets</h2>
          {canEdit && (
            <Button onClick={openAdd} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assets…"
              className="pl-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <MultiSelectFilter
            label="Asset Type"
            allLabel="All Types"
            options={activeTypes.map((t) => ({ value: t.id, label: t.name }))}
            selected={typeFilter}
            onChange={setTypeFilter}
          />
          <MultiSelectFilter
            label="Status"
            allLabel="All Statuses"
            options={activeStatuses.map((s) => ({ value: s.id, label: s.name }))}
            selected={statusFilter}
            onChange={setStatusFilter}
          />
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Owners</SelectItem>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {staffList.map((s) => (
                <SelectItem key={s.id} value={s.id}>{staffName(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <FileText className="h-12 w-12 text-gray-300 mx-auto" />
            <div className="text-gray-900 font-medium">No assets yet</div>
            <div className="text-gray-500 text-sm max-w-md mx-auto">
              Add your first asset to track deliverables, strategy docs, and client-provided files.
            </div>
            {canEdit && (
              <Button onClick={openAdd} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            )}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            No assets match the current filters.
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead k="name" className="min-w-[180px] whitespace-nowrap">Name</SortableHead>
                  <TableHead className="w-12 whitespace-nowrap">Link</TableHead>
                  <SortableHead k="type" className="whitespace-nowrap">Type</SortableHead>
                  <SortableHead k="status" className="whitespace-nowrap">Status</SortableHead>
                  <SortableHead k="owner" className="whitespace-nowrap">Owner</SortableHead>
                  <SortableHead k="portalVisible" className="whitespace-nowrap">Portal Visible</SortableHead>
                  <SortableHead k="updatedAt" className="whitespace-nowrap">Last Updated</SortableHead>
                  <TableHead className="w-20 whitespace-nowrap text-center">Comments</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAssets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left text-primary hover:underline font-medium"
                        onClick={() => canEdit ? openEdit(a) : undefined}
                        disabled={!canEdit}
                      >
                        {a.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      {a.linkUrl ? (
                        <a
                          href={a.linkUrl}
                          target="_blank"
                          rel="noopener"
                          className="text-gray-500 hover:text-primary"
                          aria-label="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.type ? (
                        <Badge variant="secondary" className="font-normal">{a.type.name}</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.status ? (
                        <Badge
                          className="font-normal text-white"
                          style={{ backgroundColor: a.status.color, borderColor: a.status.color }}
                        >
                          {a.status.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.owner ? (
                        <div className="flex items-center gap-2">
                          {a.owner.avatar ? (
                            <img
                              src={a.owner.avatar}
                              alt={a.owner.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                              {a.owner.name.split(" ").map((p) => p.charAt(0)).join("").slice(0, 2).toUpperCase() || "?"}
                            </div>
                          )}
                          <span className="text-sm">{a.owner.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <button
                          type="button"
                          aria-label={a.portalVisible ? "Hide from portal" : "Show in portal"}
                          className="text-gray-600 hover:text-primary disabled:opacity-50"
                          disabled={togglePortalMutation.isPending}
                          onClick={() =>
                            togglePortalMutation.mutate({ id: a.id, portalVisible: !a.portalVisible })
                          }
                        >
                          {a.portalVisible
                            ? <Eye className="h-4 w-4 text-primary" />
                            : <EyeOff className="h-4 w-4" />}
                        </button>
                      ) : (
                        a.portalVisible
                          ? <Eye className="h-4 w-4 text-primary" />
                          : <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm text-gray-600">
                              {formatDistanceToNow(new Date(a.updatedAt), { addSuffix: true })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatDate(new Date(a.updatedAt), "PPpp")}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => setCommentsAsset(a)}
                        className="relative inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-primary"
                        aria-label="View comments"
                        data-testid={`button-comments-${a.id}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                        {(commentCounts[a.id] ?? 0) > 0 && (
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-medium leading-none">
                            {commentCounts[a.id]}
                          </span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(a)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeleting(a)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add / Edit modal */}
      {showForm && (
        <AssetFormModal
          open={showForm}
          onOpenChange={setShowForm}
          editing={editing}
          types={activeTypes}
          statuses={activeStatuses}
          staffList={staffList}
          onSubmit={(values) => {
            if (editing) updateMutation.mutate({ id: editing.id, values });
            else createMutation.mutate(values);
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-medium">{deleting?.name}</span>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {commentsAsset && (
        <AssetCommentsDialog
          asset={commentsAsset}
          clientId={clientId}
          staffList={staffList}
          onClose={() => setCommentsAsset(null)}
        />
      )}
    </Card>
  );
}

type AssetCommentRow = {
  id: string;
  assetId: string;
  content: string;
  mentions: string[];
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; email: string; profileImage: string | null };
};

function AssetCommentsDialog({
  asset, clientId, staffList, onClose,
}: {
  asset: ClientAssetRow;
  clientId: string;
  staffList: StaffMember[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const commentsKey = ["/api/clients", clientId, "assets", asset.id, "comments"];
  const countsKey = ["/api/clients", clientId, "assets", "comment-counts"];

  const { data: comments = [], isLoading } = useQuery<AssetCommentRow[]>({
    queryKey: commentsKey,
    queryFn: async () => {
      const r = await fetch(`/api/clients/${clientId}/assets/${asset.id}/comments`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load comments");
      return r.json();
    },
  });

  const [text, setText] = useState("");
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [trackedMentions, setTrackedMentions] = useState<Array<{ id: string; name: string }>>([]);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const filteredStaff = useMemo(() => {
    const q = mentionQuery.toLowerCase();
    return staffList.filter((s) => {
      const fn = `${s.firstName ?? ""} ${s.lastName ?? ""}`.toLowerCase();
      return !q || fn.includes(q);
    }).slice(0, 6);
  }, [staffList, mentionQuery]);

  const addMutation = useMutation({
    mutationFn: async () => {
      const ids: string[] = [];
      trackedMentions.forEach((m) => {
        const re = new RegExp(`@${m.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s.,!?;:\\)\\]\\n]|$)`);
        if (re.test(text) && !ids.includes(m.id)) ids.push(m.id);
      });
      const res = await apiRequest("POST", `/api/clients/${clientId}/assets/${asset.id}/comments`, {
        content: text.trim(),
        mentions: ids,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey });
      queryClient.invalidateQueries({ queryKey: countsKey });
      setText("");
      setTrackedMentions([]);
    },
    onError: (e: any) => {
      toast({ title: "Could not post comment", description: e?.message ?? "Unknown error", variant: "destructive" });
    },
  });

  const handleChange = (val: string) => {
    setText(val);
    const pos = taRef.current?.selectionStart ?? val.length;
    const before = val.slice(0, pos);
    const last = before.split(/\s/).pop() || "";
    if (last.startsWith("@") && last.length >= 1) {
      setShowMention(true);
      setMentionQuery(last.slice(1).toLowerCase());
      setSelectedIdx(0);
    } else {
      setShowMention(false);
      setMentionQuery("");
    }
  };

  const insertMention = (s: StaffMember) => {
    const name = `${s.firstName} ${s.lastName}`.trim();
    const ta = taRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const before = text.slice(0, pos);
    const after = text.slice(pos);
    const words = before.split(/\s/);
    words[words.length - 1] = `@${name}`;
    const newText = words.join(" ") + " " + after;
    setText(newText);
    setShowMention(false);
    setMentionQuery("");
    setTrackedMentions((prev) => prev.some((m) => m.id === s.id) ? prev : [...prev, { id: s.id, name }]);
    setTimeout(() => {
      ta.focus();
      const newPos = words.join(" ").length + 1;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMention && filteredStaff.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => (i + 1) % filteredStaff.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => (i - 1 + filteredStaff.length) % filteredStaff.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(filteredStaff[selectedIdx]); return; }
      if (e.key === "Escape") { setShowMention(false); return; }
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (text.trim()) addMutation.mutate();
    }
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(@[\p{L}\p{M}\p{N}'-]+(?:\s[\p{L}\p{M}\p{N}'-]+)?)/gu);
    return parts.map((p, i) => {
      if (p.startsWith("@")) {
        return <Badge key={i} variant="secondary" className="mx-0.5 bg-teal-100 text-teal-800 font-normal">{p}</Badge>;
      }
      return <span key={i}>{p}</span>;
    });
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments — {asset.name}</DialogTitle>
          <DialogDescription>
            Use @ to mention a teammate. They'll get a notification.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No comments yet. Start the conversation.
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 p-3 border rounded-md bg-white">
                {c.author.profileImage ? (
                  <img src={c.author.profileImage} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    {(c.author.firstName?.[0] ?? "?")}{(c.author.lastName?.[0] ?? "")}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">{c.author.firstName} {c.author.lastName}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {renderContent(c.content)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-3 space-y-2 relative">
          <div className="relative">
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Add a comment… use @ to mention"
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="textarea-asset-comment"
            />
            {showMention && filteredStaff.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border rounded-md shadow-lg z-50 max-h-56 overflow-y-auto">
                {filteredStaff.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => insertMention(s)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${idx === selectedIdx ? "bg-gray-50" : ""}`}
                  >
                    <AtSign className="h-3 w-3 text-gray-400" />
                    <span>{s.firstName} {s.lastName}</span>
                    <span className="text-xs text-gray-400 truncate">{s.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">⌘/Ctrl+Enter to post</span>
            <Button
              size="sm"
              onClick={() => addMutation.mutate()}
              disabled={!text.trim() || addMutation.isPending}
              data-testid="button-post-asset-comment"
            >
              {addMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AssetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ClientAssetRow | null;
  types: AssetType[];
  statuses: AssetStatus[];
  staffList: StaffMember[];
  onSubmit: (values: AssetFormValues) => void;
  submitting: boolean;
}

function AssetFormModal({
  open, onOpenChange, editing, types, statuses, staffList, onSubmit, submitting,
}: AssetFormModalProps) {
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: editing?.name ?? "",
      linkUrl: editing?.linkUrl ?? "",
      assetTypeId: editing?.assetTypeId ?? "",
      assetStatusId: editing?.assetStatusId ?? "",
      ownerStaffId: editing?.ownerStaffId ?? UNASSIGNED,
      portalVisible: editing?.portalVisible ?? false,
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Asset" : "Add Asset"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the asset details." : "Add a new asset to track for this client."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Brand Style Guide" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link URL *</FormLabel>
                  <FormControl><Input {...field} placeholder="https://…" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assetTypeId"
              render={({ field }) => {
                const selectedType = types.find((t) => t.id === field.value);
                const selectedTooltip = (selectedType as any)?.tooltip as string | null | undefined;
                return (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      Asset Type *
                      {selectedTooltip ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="text-gray-400 hover:text-primary" aria-label="Asset type help" data-testid="asset-type-tooltip">
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              {selectedTooltip}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : null}
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a type…" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {types.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="assetStatusId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a status…" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            {s.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ownerStaffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <Select value={field.value || UNASSIGNED} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                      {staffList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{staffName(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="portalVisible"
              render={({ field }) => (
                <FormItem className="flex items-start justify-between rounded-md border p-3">
                  <div className="space-y-0.5 pr-3">
                    <FormLabel>Portal Visible</FormLabel>
                    <FormDescription>
                      When on, this asset appears in the client's portal view.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
