import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, Edit, Trash2, Calendar, DollarSign, Percent, Settings, Users, Kanban, UserPlus, ChevronUp, ChevronDown, MoreHorizontal, Filter, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import CustomFieldsLeadForm from "@/components/forms/custom-fields-lead-form";
import PipelineStageManager from "@/components/pipeline-stage-manager";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Lead, LeadPipelineStage, User, Tag, Client } from "@shared/schema";

interface Column {
  key: string;
  label: string;
  sortable: boolean;
  defaultVisible: boolean;
}

const AVAILABLE_COLUMNS: Column[] = [
  { key: 'name', label: 'Name', sortable: true, defaultVisible: true },
  { key: 'email', label: 'Email', sortable: true, defaultVisible: true },
  { key: 'company', label: 'Company', sortable: true, defaultVisible: true },
  { key: 'phone', label: 'Phone', sortable: true, defaultVisible: true },
  { key: 'stage', label: 'Stage', sortable: true, defaultVisible: true },
  { key: 'value', label: 'Value', sortable: true, defaultVisible: true },

  { key: 'source', label: 'Source', sortable: true, defaultVisible: false },
  { key: 'assignedTo', label: 'Assigned To', sortable: true, defaultVisible: false },
  { key: 'lastContactDate', label: 'Last Contact', sortable: true, defaultVisible: false },
  { key: 'createdAt', label: 'Created Date', sortable: true, defaultVisible: true },
  { key: 'actions', label: 'Actions', sortable: false, defaultVisible: true },
];

type SortField = 'name' | 'email' | 'company' | 'phone' | 'stage' | 'value' | 'source' | 'assignedTo' | 'lastContactDate' | 'createdAt';

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [showStageManager, setShowStageManager] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(AVAILABLE_COLUMNS.filter(col => col.defaultVisible).map(col => col.key))
  );
  
  // Filter states
  const [filterOwner, setFilterOwner] = useState<string>("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterVertical, setFilterVertical] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: pipelineStages = [] } = useQuery<LeadPipelineStage[]>({
    queryKey: ["/api/lead-pipeline-stages"],
  });

  const { data: staff = [] } = useQuery<User[]>({
    queryKey: ["/api/staff"],
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const { data: clientsData } = useQuery<{clients: Client[]}>({
    queryKey: ["/api/clients"],
  });
  const clients = clientsData?.clients || [];

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/leads/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead deleted",
        description: "The lead has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const moveLeadStageMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) => 
      apiRequest(`/api/leads/${leadId}/stage`, "PUT", { stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead moved",
        description: "Lead has been moved to the new stage.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to move lead",
        variant: "destructive",
      });
    },
  });

  // Get unique client verticals from custom field data
  const uniqueVerticals = Array.from(new Set(
    leads
      .filter(lead => lead.customFieldData && (lead.customFieldData as any)['Client Vertical'])
      .map(lead => (lead.customFieldData as any)['Client Vertical'])
      .filter(Boolean)
  ));

  const filteredAndSortedLeads = leads
    .filter(lead => {
      // Search term filter
      if (searchTerm && !(
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.source?.toLowerCase().includes(searchTerm.toLowerCase())
      )) {
        return false;
      }

      // Owner filter
      if (filterOwner && lead.assignedTo !== filterOwner) {
        return false;
      }

      // Tags filter  
      if (filterTags.length > 0) {
        const leadTags = lead.tags || [];
        const hasAllTags = filterTags.every(tag => leadTags.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }

      // Client vertical filter
      if (filterVertical) {
        const leadVertical = lead.customFieldData && (lead.customFieldData as any)['Client Vertical'];
        if (leadVertical !== filterVertical) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'company':
          aValue = (a.company || '').toLowerCase();
          bValue = (b.company || '').toLowerCase();
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'value':
          aValue = Number(a.value) || 0;
          bValue = Number(b.value) || 0;
          break;

        case 'source':
          aValue = (a.source || '').toLowerCase();
          bValue = (b.source || '').toLowerCase();
          break;
        case 'assignedTo':
          aValue = (a.assignedTo || '').toLowerCase();
          bValue = (b.assignedTo || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case 'lastContactDate':
          aValue = new Date(a.lastContactDate || 0).getTime();
          bValue = new Date(b.lastContactDate || 0).getTime();
          break;
        default:
          return 0;
      }

      if (sortField === 'createdAt' || sortField === 'lastContactDate') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (sortField === 'value') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
    });

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Never";
    if (typeof date === 'string') {
      return format(new Date(date), 'MMM dd, yyyy');
    }
    return format(date, 'MMM dd, yyyy');
  };

  const getLeadInitials = (lead: Lead) => {
    return lead.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDeleteLead = (id: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteLeadMutation.mutate(id);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(columnKey)) {
      newVisibleColumns.delete(columnKey);
    } else {
      newVisibleColumns.add(columnKey);
    }
    setVisibleColumns(newVisibleColumns);
  };

  const getStageName = (stageId: string | null) => {
    if (!stageId) return 'New';
    const stage = pipelineStages.find(s => s.id === stageId);
    return stage ? stage.name : 'Unknown';
  };

  const getStaffName = (staffId: string | null) => {
    if (!staffId) return 'Unassigned';
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown';
  };

  const renderCellContent = (lead: Lead, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {getLeadInitials(lead)}
            </div>
            <span className="font-medium">{lead.name}</span>
          </div>
        );
      case 'email':
        return lead.email;
      case 'company':
        return lead.company || '-';
      case 'phone':
        return lead.phone || '-';
      case 'stage':
        return (
          <Badge variant="secondary">
            {getStageName(lead.stageId)}
          </Badge>
        );
      case 'value':
        return lead.value ? `$${Number(lead.value).toLocaleString()}` : '-';

      case 'source':
        return lead.source || '-';
      case 'assignedTo':
        return (
          <div className="flex items-center gap-2">
            {lead.assignedTo ? (
              <>
                <div className="w-6 h-6 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                  {(() => {
                    const staffMember = staff.find(s => s.id === lead.assignedTo);
                    return staffMember ? `${staffMember.firstName.charAt(0)}${staffMember.lastName.charAt(0)}` : '?';
                  })()}
                </div>
                <span className="text-sm">{getStaffName(lead.assignedTo)}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </div>
        );
      case 'lastContactDate':
        return formatDate(lead.lastContactDate);
      case 'createdAt':
        return formatDate(lead.createdAt);
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setEditingLead(lead)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Lead
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteLead(lead.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      default:
        return '-';
    }
  };

  const SortableHeader = ({ column, children }: { column: SortField; children: React.ReactNode }) => {
    const isActive = sortField === column;
    return (
      <TableHead 
        className="cursor-pointer hover:bg-slate-50 select-none"
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1">
          {children}
          <div className="flex flex-col ml-1">
            <ChevronUp 
              className={`h-3 w-3 ${
                isActive && sortDirection === 'asc' 
                  ? 'text-blue-600' 
                  : 'text-gray-400'
              }`} 
            />
            <ChevronDown 
              className={`h-3 w-3 -mt-1 ${
                isActive && sortDirection === 'desc' 
                  ? 'text-blue-600' 
                  : 'text-gray-400'
              }`} 
            />
          </div>
        </div>
      </TableHead>
    );
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStageId = result.source.droppableId;
    const destinationStageId = result.destination.droppableId;
    const leadId = result.draggableId;

    if (sourceStageId !== destinationStageId) {
      moveLeadStageMutation.mutate({
        leadId,
        stageId: destinationStageId
      });
    }
  };

  // Group leads by stage for pipeline view
  // Use filtered leads for both pipeline and list views
  const leadsByStage = pipelineStages.reduce((acc, stage) => {
    acc[stage.id] = filteredAndSortedLeads.filter(lead => 
      lead.stageId === stage.id || (!lead.stageId && stage.isDefault)
    );
    return acc;
  }, {} as Record<string, Lead[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-yellow-100 text-yellow-800 border-l-yellow-500";
      case "qualified":
        return "bg-teal-100 text-teal-800 border-l-teal-500";
      case "proposal":
        return "bg-purple-100 text-purple-800 border-l-purple-500";
      case "negotiation":
        return "bg-green-100 text-green-800 border-l-green-500";
      case "won":
        return "bg-emerald-100 text-emerald-800 border-l-emerald-500";
      case "lost":
        return "bg-red-100 text-red-800 border-l-red-500";
      default:
        return "bg-gray-100 text-gray-800 border-l-gray-500";
    }
  };

  const totalPipelineValue = leads
    .filter(l => !["won", "lost"].includes(l.status))
    .reduce((sum, lead) => sum + Number(lead.value || 0), 0);

  if (showStageManager) {
    return <PipelineStageManager onClose={() => setShowStageManager(false)} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden -m-6 mb-0">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
            </div>
            <p className="text-slate-600">Total Pipeline Value: ${totalPipelineValue.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" onClick={() => setShowStageManager(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Pipeline
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <CustomFieldsLeadForm onSuccess={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "pipeline", name: "Pipeline View", icon: Kanban, count: leads.length },
              { id: "list", name: "List View", icon: Users, count: leads.length }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name} {tab.count > 0 && `(${tab.count})`}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters Section */}
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            {/* Owner Filter */}
            <div className="min-w-[160px]">
              <Select value={filterOwner || "all"} onValueChange={(value) => setFilterOwner(value === "all" ? "" : value)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Tags {filterTags.length > 0 && `(${filterTags.length})`}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Select Tags</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={tag.name}
                          checked={filterTags.includes(tag.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterTags([...filterTags, tag.name]);
                            } else {
                              setFilterTags(filterTags.filter(t => t !== tag.name));
                            }
                          }}
                        />
                        <label
                          htmlFor={tag.name}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color || "#46a1a0" }}
                          />
                          {tag.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {filterTags.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterTags([])}
                      className="w-full mt-2"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Vertical Filter */}
            <div className="min-w-[160px]">
              <Select value={filterVertical || "all"} onValueChange={(value) => setFilterVertical(value === "all" ? "" : value)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Client Vertical" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Client Verticals</SelectItem>
                  {uniqueVerticals.map((vertical) => (
                    <SelectItem key={vertical} value={vertical}>
                      {vertical}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {(filterOwner || filterTags.length > 0 || filterVertical) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterOwner("");
                  setFilterTags([]);
                  setFilterVertical("");
                }}
                className="h-8 text-sm"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            )}
            
            {/* Active filters count */}
            {(filterOwner || filterTags.length > 0 || filterVertical) && (
              <Badge variant="secondary" className="text-xs">
                {[filterOwner, filterTags.length > 0, filterVertical].filter(Boolean).length} active
              </Badge>
            )}
          </div>
        </div>

      </div>

      {/* Content Area - Maximize Height */}
      <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {activeTab === "pipeline" && (
          pipelineStages.length === 0 ? (
            <div className="flex items-center justify-center h-full p-6">
              <Card className="p-8">
                <div className="text-center">
                  <Kanban className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pipeline Stages</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first pipeline stage to start organizing your leads.
                  </p>
                  <Button onClick={() => setShowStageManager(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Pipeline Stage
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-full rounded-lg bg-gray-50 overflow-hidden">
                <div className="h-full p-4 overflow-x-auto">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-6 h-full">
                      {pipelineStages.map((stage) => {
                        const stageLeads = leadsByStage[stage.id] || [];
                        const totalValue = stageLeads.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);
                        
                        return (
                          <div key={stage.id} className="flex-shrink-0 w-96 h-full">
                            <Card className="bg-white h-full flex flex-col">
                              <CardHeader className="pb-3 flex-shrink-0">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: stage.color }}
                                  />
                                  {stage.name}
                                  <Badge variant="secondary" className="ml-auto">
                                    {stageLeads.length}
                                  </Badge>
                                </CardTitle>
                                {totalValue > 0 && (
                                  <div className="flex items-center gap-1 mt-2 text-green-600 font-semibold">
                                    <DollarSign className="w-4 h-4" />
                                    <span>${totalValue.toLocaleString()}</span>
                                  </div>
                                )}
                              </CardHeader>
                              <CardContent className="flex-1 min-h-0 overflow-hidden">
                                <Droppable droppableId={stage.id}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.droppableProps}
                                      className={`space-y-4 h-full min-h-[500px] overflow-y-auto ${
                                        snapshot.isDraggingOver ? "bg-blue-50 rounded-lg p-2" : ""
                                      }`}
                                    >
                                      {(leadsByStage[stage.id] || [])
                                        .filter(lead => 
                                          !searchTerm || 
                                          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((lead, index) => (
                                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                            {(provided, snapshot) => (
                                              <Card
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`cursor-pointer transition-shadow relative ${
                                                  snapshot.isDragging ? "shadow-lg rotate-1" : "hover:shadow-md"
                                                }`}
                                                onClick={() => setEditingLead(lead)}
                                              >
                                                <CardContent className="p-4">
                                                  <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                        {getLeadInitials(lead)}
                                                      </div>
                                                      <div>
                                                        <h3 className="font-medium text-sm">{lead.name}</h3>
                                                        {lead.company && (
                                                          <p className="text-xs text-gray-600">{lead.company}</p>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <TooltipProvider>
                                                        <Tooltip>
                                                          <TooltipTrigger asChild>
                                                            <div className="cursor-pointer">
                                                              {(() => {
                                                                if (lead.assignedTo) {
                                                                  const staffMember = staff.find(s => s.id === lead.assignedTo);
                                                                  
                                                                  if (staffMember?.profileImage) {
                                                                    // Convert object storage path to proper URL format  
                                                                    const imageUrl = `/objects${staffMember.profileImage}`;
                                                                    return (
                                                                      <img
                                                                        src={imageUrl}
                                                                        alt={`${staffMember.firstName} ${staffMember.lastName}`}
                                                                        className="w-6 h-6 rounded-full object-cover"
                                                                        onError={(e) => {
                                                                          // Fallback to initials if image fails to load
                                                                          e.currentTarget.style.display = 'none';
                                                                          e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                                                                        }}
                                                                      />
                                                                    );
                                                                  } else if (staffMember) {
                                                                    return (
                                                                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                                                        {`${staffMember.firstName.charAt(0)}${staffMember.lastName.charAt(0)}`}
                                                                      </div>
                                                                    );
                                                                  }
                                                                }
                                                                // Default unassigned user image
                                                                return (
                                                                  <div className="w-6 h-6 bg-gray-400 text-white text-xs rounded-full flex items-center justify-center">
                                                                    <Users className="w-3 h-3" />
                                                                  </div>
                                                                );
                                                              })()}
                                                            </div>
                                                          </TooltipTrigger>
                                                          <TooltipContent>
                                                            <p>{lead.assignedTo ? getStaffName(lead.assignedTo) : 'Unassigned'}</p>
                                                          </TooltipContent>
                                                        </Tooltip>
                                                      </TooltipProvider>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="space-y-3 text-xs">
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                      <Calendar className="w-3 h-3" />
                                                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    {lead.value && (
                                                      <div className="flex items-center gap-1 text-green-600">
                                                        <DollarSign className="w-3 h-3" />
                                                        ${Number(lead.value).toLocaleString()}
                                                      </div>
                                                    )}
                                                  </div>
                                                </CardContent>
                                              </Card>
                                            )}
                                          </Draggable>
                                        ))}
                                      {provided.placeholder}
                                      {(!leadsByStage[stage.id] || leadsByStage[stage.id].length === 0) && (
                                        <div className="text-center py-8 text-gray-400">
                                          <div className="text-sm">No leads in this stage</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Droppable>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </DragDropContext>
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === "list" && (
          <div className="h-full overflow-y-auto p-6">
            <Card>
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">All Leads</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-600">
                      {filteredAndSortedLeads.length} lead{filteredAndSortedLeads.length !== 1 ? 's' : ''}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Columns
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {AVAILABLE_COLUMNS.map((column) => (
                          <DropdownMenuCheckboxItem
                            key={column.key}
                            checked={visibleColumns.has(column.key)}
                            onCheckedChange={() => toggleColumnVisibility(column.key)}
                          >
                            {column.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredAndSortedLeads.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 mb-4">
                      {searchTerm ? "No leads found matching your search." : "No leads found."}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        Add Your First Lead
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          {AVAILABLE_COLUMNS.filter(col => visibleColumns.has(col.key)).map((column) => {
                            if (column.sortable) {
                              return (
                                <SortableHeader key={column.key} column={column.key as SortField}>
                                  <div className="whitespace-nowrap">{column.label}</div>
                                </SortableHeader>
                              );
                            } else {
                              return (
                                <TableHead key={column.key}>
                                  <div className="whitespace-nowrap">{column.label}</div>
                                </TableHead>
                              );
                            }
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedLeads.map((lead) => (
                          <TableRow key={lead.id} className="hover:bg-slate-50">
                            {AVAILABLE_COLUMNS.filter(col => visibleColumns.has(col.key)).map((column) => (
                              <TableCell key={column.key} className="py-3">
                                {renderCellContent(lead, column.key)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Lead Dialog */}
      {editingLead && (
        <Dialog open={!!editingLead} onOpenChange={() => setEditingLead(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
            </DialogHeader>
            <CustomFieldsLeadForm
              lead={editingLead}
              onSuccess={() => setEditingLead(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}