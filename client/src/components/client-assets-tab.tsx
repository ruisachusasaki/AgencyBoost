import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow, format as formatDate } from "date-fns";
import {
  Plus, Search, ExternalLink, Pencil, Trash2, Eye, EyeOff,
  MoreVertical, FileText, Loader2,
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
                  <TableHead>Name</TableHead>
                  <TableHead className="w-16">Link</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-48">Owner</TableHead>
                  <TableHead className="w-28">Portal Visible</TableHead>
                  <TableHead className="w-36">Last Updated</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((a) => (
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
    </Card>
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
      <DialogContent className="sm:max-w-md">
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type *</FormLabel>
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
              )}
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
