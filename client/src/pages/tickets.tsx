import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Trash2, Eye, Pencil, ChevronLeft, ChevronRight, Ticket, AlertCircle, Clock, CheckCircle2, BarChart3, Upload, X, Video, Image as ImageIcon, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Check, ChevronsUpDown, List, Columns3, GripVertical, PauseCircle, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TicketData {
  id: number;
  ticketNumber: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  submittedBy?: string;
  submittedByName?: string;
  submitterName?: string;
  assignedTo?: string;
  assignedToName?: string;
  tags?: string[];
  loomVideoUrl?: string;
  screenshots?: string[];
  source?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketsResponse {
  tickets: TicketData[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  onHold: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
}

function getTypeBadge(type: string) {
  const colors: Record<string, string> = {
    bug: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    feature_request: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    improvement: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    question: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  const labels: Record<string, string> = {
    bug: "Bug",
    feature_request: "Feature Request",
    improvement: "Improvement",
  };
  return (
    <Badge variant="outline" className={colors[type] || "bg-gray-100 text-gray-800"}>
      {labels[type] || type}
    </Badge>
  );
}

function getPriorityBadge(priority: string) {
  const colors: Record<string, string> = {
    critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };
  const labels: Record<string, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return (
    <Badge variant="outline" className={colors[priority] || "bg-gray-100 text-gray-800"}>
      {labels[priority] || priority}
    </Badge>
  );
}

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    on_hold: "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };
  const labels: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    on_hold: "On Hold",
    resolved: "Resolved",
  };
  return (
    <Badge variant="outline" className={colors[status] || "bg-gray-100 text-gray-800"}>
      {labels[status] || status}
    </Badge>
  );
}

const KANBAN_COLUMNS = [
  { key: "open", label: "Open", icon: AlertCircle, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
  { key: "in_progress", label: "In Progress", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800" },
  { key: "on_hold", label: "On Hold", icon: PauseCircle, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800/40", border: "border-gray-200 dark:border-gray-700" },
  { key: "resolved", label: "Resolved", icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800" },
];

function KanbanView({
  tickets,
  isLoading,
  staff,
  draggedTicket,
  setDraggedTicket,
  dragOverColumn,
  setDragOverColumn,
  onStatusChange,
  onNavigate,
  getStaffName,
}: {
  tickets: TicketData[];
  isLoading: boolean;
  staff: StaffMember[];
  draggedTicket: TicketData | null;
  setDraggedTicket: (t: TicketData | null) => void;
  dragOverColumn: string | null;
  setDragOverColumn: (c: string | null) => void;
  onStatusChange: (id: number, status: string) => void;
  onNavigate: (id: number) => void;
  getStaffName: (id?: string) => string;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.key} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const ticketsByStatus = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.key] = tickets.filter((t) => t.status === col.key);
    return acc;
  }, {} as Record<string, TicketData[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[400px]">
      {KANBAN_COLUMNS.map((col) => {
        const ColIcon = col.icon;
        const columnTickets = ticketsByStatus[col.key] || [];
        const isOver = dragOverColumn === col.key;

        return (
          <div
            key={col.key}
            className={`rounded-lg border-2 transition-colors ${isOver ? "border-primary bg-primary/5" : `border-transparent`}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOverColumn(col.key);
            }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverColumn(null);
              if (draggedTicket && draggedTicket.status !== col.key) {
                onStatusChange(draggedTicket.id, col.key);
              }
              setDraggedTicket(null);
            }}
          >
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${col.bg}`}>
              <ColIcon className={`w-4 h-4 ${col.color}`} />
              <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
              <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">
                {columnTickets.length}
              </Badge>
            </div>
            <div className="p-2 space-y-2 min-h-[100px]">
              {columnTickets.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  No tickets
                </div>
              ) : (
                columnTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedTicket(ticket);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(ticket.id));
                    }}
                    onDragEnd={() => {
                      setDraggedTicket(null);
                      setDragOverColumn(null);
                    }}
                    onClick={() => onNavigate(ticket.id)}
                    className={`group cursor-grab active:cursor-grabbing bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-all ${
                      draggedTicket?.id === ticket.id ? "opacity-50 scale-95" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{ticket.ticketNumber}</span>
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                      {ticket.title}
                    </h4>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {getTypeBadge(ticket.type)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
                          {ticket.assignedToName || getStaffName(ticket.assignedTo)}
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px] px-1.5 py-0">
                        {ticket.source || "AgencyBoost"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const defaultFormData = {
  title: "",
  description: "",
  type: "bug",
  priority: "medium",
  tags: "",
  loomVideoUrl: "",
};

export default function TicketsPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"tickets" | "reports">("tickets");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [draggedTicket, setDraggedTicket] = useState<TicketData | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const allStatuses = ["open", "in_progress", "on_hold", "resolved"];
  const defaultStatuses = ["open", "in_progress", "on_hold"];
  const [statusFilter, setStatusFilter] = useState<string[]>(defaultStatuses);
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketData | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<TicketData | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (statusFilter.length > 0 && statusFilter.length < allStatuses.length) {
      params.set("status", statusFilter.join(","));
    }
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (assignedToFilter !== "all") params.set("assignedTo", assignedToFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (searchTerm) params.set("search", searchTerm);
    params.set("page", String(currentPage));
    params.set("limit", String(pageSize));
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDir) params.set("sortDir", sortDir);
    return params.toString();
  };

  const { data: ticketsData, isLoading } = useQuery<TicketsResponse>({
    queryKey: [`/api/tickets?${buildQueryString()}`],
  });

  const buildSummaryQueryString = () => {
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (assignedToFilter !== "all") params.set("assignedTo", assignedToFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (searchTerm) params.set("search", searchTerm);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const { data: summary } = useQuery<TicketSummary>({
    queryKey: [`/api/tickets/reports/summary${buildSummaryQueryString()}`],
  });

  const { data: staff = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const { data: ticketSources = [] } = useQuery<string[]>({
    queryKey: ["/api/tickets/sources"],
  });

  const tickets = ticketsData?.tickets || [];
  const totalPages = ticketsData?.pagination?.totalPages || 1;

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-[hsl(179,100%,39%)]" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-[hsl(179,100%,39%)]" />;
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/tickets') });
      toast({ title: "Ticket created", description: "The ticket has been created successfully.", variant: "default" as any });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to create ticket.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      return apiRequest("PUT", `/api/tickets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/tickets') });
      toast({ title: "Ticket updated", description: "The ticket has been updated successfully.", variant: "default" as any });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to update ticket.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/tickets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/tickets') });
      toast({ title: "Ticket deleted", description: "The ticket has been deleted.", variant: "default" as any });
      setDeletingTicket(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to delete ticket.", variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingTicket(null);
    setFormData(defaultFormData);
    setScreenshotUrls([]);
  };

  const openEditDialog = (ticket: TicketData) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description || "",
      type: ticket.type,
      priority: ticket.priority,
      tags: Array.isArray(ticket.tags) ? ticket.tags.join(", ") : "",
      loomVideoUrl: ticket.loomVideoUrl || "",
    });
    setScreenshotUrls(ticket.screenshots || []);
    setIsCreateDialogOpen(true);
  };

  const handleScreenshotUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingScreenshot(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast({ title: "Invalid file", description: "Only image files are allowed.", variant: "destructive" });
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: "File too large", description: "Screenshots must be under 10MB.", variant: "destructive" });
          continue;
        }
        const uploadRes = await fetch("/api/objects/upload", { method: "POST", credentials: "include" });
        if (!uploadRes.ok) throw new Error("Failed to get upload URL");
        const { uploadURL } = await uploadRes.json();
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.addEventListener("load", async () => {
            if (xhr.status === 200) {
              try {
                const aclRes = await fetch("/api/ticket-screenshots/acl", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ imageURL: uploadURL.split("?")[0] }),
                });
                if (aclRes.ok) {
                  const { objectPath } = await aclRes.json();
                  setScreenshotUrls((prev) => [...prev, `/objects${objectPath}`]);
                } else {
                  throw new Error("Failed to set permissions");
                }
              } catch (e) {
                reject(e);
              }
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          xhr.open("PUT", uploadURL);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });
      }
    } catch (error) {
      console.error("Screenshot upload error:", error);
      toast({ title: "Upload failed", description: "Failed to upload screenshot. Please try again.", variant: "destructive" });
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshotUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: "Validation Error", description: "Title is required.", variant: "destructive" });
      return;
    }

    const payload: Record<string, unknown> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      priority: formData.priority,
      tags: formData.tags ? formData.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      loomVideoUrl: formData.loomVideoUrl.trim() || null,
      screenshots: screenshotUrls.length > 0 ? screenshotUrls : null,
    };

    if (editingTicket) {
      updateMutation.mutate({ id: editingTicket.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getStaffName = (staffId?: string) => {
    if (!staffId) return "-";
    const member = staff.find((s) => s.id === staffId || String(s.id) === String(staffId));
    return member ? `${member.firstName} ${member.lastName}` : "-";
  };

  const [LazyTicketReports, setLazyTicketReports] = useState<any>(null);

  const loadReports = async () => {
    try {
      const mod = await import("./ticket-reports");
      setLazyTicketReports(() => mod.default);
    } catch {
      setLazyTicketReports(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tickets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage bug reports and feature requests</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => { setEditingTicket(null); setFormData(defaultFormData); setIsCreateDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "tickets" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
          onClick={() => setActiveTab("tickets")}
        >
          <Ticket className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          All Tickets
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "reports" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
          onClick={() => { setActiveTab("reports"); if (!LazyTicketReports) loadReports(); }}
        >
          <BarChart3 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          Reports
        </button>
      </div>

      {activeTab === "reports" ? (
        LazyTicketReports ? <LazyTicketReports /> : <div className="py-12 text-center text-gray-500">Reports module loading...</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between text-sm font-normal">
                  {statusFilter.length === allStatuses.length
                    ? "All Status"
                    : statusFilter.length === 0
                    ? "No Status"
                    : `${statusFilter.length} Status Selected`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="start">
                <div className="flex flex-col gap-1">
                  <button
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
                    onClick={() => { setStatusFilter(statusFilter.length === allStatuses.length ? [] : [...allStatuses]); setCurrentPage(1); }}
                  >
                    <Checkbox checked={statusFilter.length === allStatuses.length} className="h-4 w-4" />
                    <span className="font-medium">All Status</span>
                  </button>
                  <div className="border-t my-1" />
                  {[
                    { value: "open", label: "Open" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "on_hold", label: "On Hold" },
                    { value: "resolved", label: "Resolved" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
                      onClick={() => {
                        setStatusFilter((prev) =>
                          prev.includes(s.value)
                            ? prev.filter((v) => v !== s.value)
                            : [...prev, s.value]
                        );
                        setCurrentPage(1);
                      }}
                    >
                      <Checkbox checked={statusFilter.includes(s.value)} className="h-4 w-4" />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assignedToFilter} onValueChange={(v) => { setAssignedToFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staff
                  .slice()
                  .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                  .map((member) => (
                    <SelectItem key={member.id} value={String(member.id)}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {(ticketSources || []).map((s: string) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>

            <div className="flex items-center border rounded-lg overflow-hidden ml-auto">
              <button
                className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                className={`p-2 transition-colors ${viewMode === "kanban" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                onClick={() => setViewMode("kanban")}
                title="Kanban View"
              >
                <Columns3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Ticket className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold">{summary?.total ?? "-"}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Open</p>
                  <p className="text-2xl font-bold">{summary?.open ?? "-"}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold">{summary?.inProgress ?? "-"}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold">{summary?.resolved ?? "-"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {viewMode === "kanban" ? (
            <KanbanView
              tickets={tickets}
              isLoading={isLoading}
              staff={staff}
              draggedTicket={draggedTicket}
              setDraggedTicket={setDraggedTicket}
              dragOverColumn={dragOverColumn}
              setDragOverColumn={setDragOverColumn}
              onStatusChange={(id, status) => updateMutation.mutate({ id, data: { status } })}
              onNavigate={(id) => setLocation(`/tickets/${id}`)}
              getStaffName={getStaffName}
            />
          ) : (
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-12 text-center">
                  <Ticket className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No tickets found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters or create a new ticket.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px] cursor-pointer select-none hover:text-[hsl(179,100%,39%)]" onClick={() => handleSort("ticketNumber")}>
                          <div className="flex items-center">Ticket # <SortIcon column="ticketNumber" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none hover:text-[hsl(179,100%,39%)]" onClick={() => handleSort("title")}>
                          <div className="flex items-center">Title <SortIcon column="title" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none hover:text-[hsl(179,100%,39%)]" onClick={() => handleSort("type")}>
                          <div className="flex items-center">Type <SortIcon column="type" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none hover:text-[hsl(179,100%,39%)]" onClick={() => handleSort("priority")}>
                          <div className="flex items-center">Priority <SortIcon column="priority" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none hover:text-[hsl(179,100%,39%)]" onClick={() => handleSort("status")}>
                          <div className="flex items-center">Status <SortIcon column="status" /></div>
                        </TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="cursor-pointer select-none hover:text-[hsl(179,100%,39%)]" onClick={() => handleSort("createdAt")}>
                          <div className="flex items-center">Created <SortIcon column="createdAt" /></div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          onClick={() => setLocation(`/tickets/${ticket.id}`)}
                        >
                          <TableCell className="font-mono text-sm">{ticket.ticketNumber}</TableCell>
                          <TableCell className="font-medium max-w-[250px] truncate">{ticket.title}</TableCell>
                          <TableCell>{getTypeBadge(ticket.type)}</TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell className="text-sm">{ticket.submitterName || ticket.submittedByName || getStaffName(ticket.submittedBy) || "-"}</TableCell>
                          <TableCell className="text-sm">{ticket.assignedToName || getStaffName(ticket.assignedTo) || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs">
                              {ticket.source || "AgencyBoost"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {ticket.createdAt ? format(new Date(ticket.createdAt), "MMM d, yyyy") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation(`/tickets/${ticket.id}`)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(ticket)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => setDeletingTicket(ticket)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {viewMode === "list" && (ticketsData?.pagination?.total || 0) > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, ticketsData?.pagination?.total || 0)} of {ticketsData?.pagination?.total || 0} tickets
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Per page:</span>
                  <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(1)}>
                    First
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {(() => {
                    const pages: number[] = [];
                    let start = Math.max(1, currentPage - 2);
                    let end = Math.min(totalPages, currentPage + 2);
                    if (currentPage <= 3) end = Math.min(totalPages, 5);
                    if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);
                    for (let i = start; i <= end; i++) pages.push(i);
                    return pages.map((p) => (
                      <Button
                        key={p}
                        variant={p === currentPage ? "default" : "outline"}
                        size="icon"
                        className={`h-8 w-8 ${p === currentPage ? "bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,32%)] text-white" : ""}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    ));
                  })()}
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}>
                    Last
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTicket ? "Edit Ticket" : "Create New Ticket"}</DialogTitle>
            <DialogDescription>
              {editingTicket ? "Update the ticket details below." : "Fill in the details to create a new ticket."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ticket title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the issue or request..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loomVideoUrl" className="flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                Loom Video URL
              </Label>
              <Input
                id="loomVideoUrl"
                value={formData.loomVideoUrl}
                onChange={(e) => setFormData({ ...formData, loomVideoUrl: e.target.value })}
                placeholder="https://www.loom.com/share/..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Paste a Loom link to show the issue in video</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                Screenshots
              </Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                {screenshotUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {screenshotUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={url}
                          alt={`Screenshot ${idx + 1}`}
                          className="w-full h-20 object-cover rounded border border-gray-200 dark:border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex flex-col items-center cursor-pointer py-2">
                  {isUploadingScreenshot ? (
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {isUploadingScreenshot ? "Uploading..." : "Click to upload screenshots"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleScreenshotUpload(e.target.files)}
                    disabled={isUploadingScreenshot}
                  />
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="Comma-separated tags (e.g. ui, backend, urgent)" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingTicket ? "Update Ticket" : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTicket} onOpenChange={(open) => { if (!open) setDeletingTicket(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ticket "{deletingTicket?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { if (deletingTicket) deleteMutation.mutate(deletingTicket.id); }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}